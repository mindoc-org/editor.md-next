/**
 * 同步泵：把 CollabTransport 的「纯二进制广播」升级为 yjs 同步 + awareness 协议。
 *
 * 线协议（与参考服务端 server/relay.mjs 配套，全部二进制、服务端零知识）：
 *   varuint 帧类型 + 载荷
 *   - 0 = sync：载荷直接是 y-protocols/sync 的消息（Step1/Step2/Update，由 readSyncMessage 分派）
 *   - 1 = awareness：载荷为 varuint8Array 包裹的 encodeAwarenessUpdate 结果
 * 与 y-websocket 的帧格式一致，但房间路由由服务端 URL path 决定、消息不落盘。
 *
 * 两个时序约束（见 ai-docs/collab-design.md §5.1）：
 * - 3s 兜底计时从**真正建连**开始，不从 createCollab 开始——否则慢网下会在握手前
 *   误判"同步完成"，把本地初始 value 写进仍在等待房间内容的文档，造成内容重复。
 * - 兜底触发时若同步窗口内见过任何远端帧，说明房间很可能有内容，此时**不授权**
 *   写入初始 value（宁可让用户手动粘贴，也不要产生两份内容）。
 */
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import type { CollabStatus, CollabTransport } from './types'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1

/** 远端写入 ydoc 的事务 origin（用于区分远端/本地，且不被撤销栈追踪）。 */
const REMOTE_ORIGIN = 'editormd-collab-remote'

/** 空房间兜底：建连后等不到对端 SyncStep2 也视为「同步窗口结束」（触发 onSynced）。 */
const SYNC_TIMEOUT_MS = 3000

/** awareness 心跳：空闲时周期性重发本地状态，避免对端按 30s 超时清掉自己。 */
const AWARENESS_HEARTBEAT_MS = 15000

/** 同步窗口结束信息。 */
export interface SyncInfo {
  /** handshake = 收到对端全量状态；timeout = 建连后 3s 内没有 Step2 */
  kind: 'handshake' | 'timeout'
  /** 同步窗口内是否收到过任何远端帧（用于判断房间是否可能有内容） */
  remoteSeen: boolean
}

export interface SyncPumpConfig {
  ydoc: Y.Doc
  awareness: Awareness
  transport: CollabTransport
  /** 连接状态变化（由 transport 转发） */
  onStatus: (status: CollabStatus) => void
  /** 同步窗口结束（仅一次） */
  onSynced: (info: SyncInfo) => void
  /** 每次收到远端 SyncStep2（重连/迟到也触发，供上层补做初始 value 写入） */
  onSyncStep2?: () => void
  /** awareness 变化（成员增删/信息更新） */
  onPeersChanged: () => void
}

export class SyncPump {
  private readonly ydoc: Y.Doc
  private readonly awareness: Awareness
  private readonly transport: CollabTransport
  private readonly config: SyncPumpConfig
  private unbindMessage: (() => void) | null = null
  private unbindStatus: (() => void) | null = null
  private readonly docListener: (update: Uint8Array, origin: unknown) => void
  private readonly awarenessListener: (
    changes: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => void
  private syncTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private destroyed = false
  private synced = false
  private remoteSeen = false

  constructor(config: SyncPumpConfig) {
    this.config = config
    this.ydoc = config.ydoc
    this.awareness = config.awareness
    this.transport = config.transport
    this.docListener = (update, origin) => {
      // 远端应用的更新不再回广播（否则回环）；其余（本地编辑/初始写入）推给房间
      if (origin === REMOTE_ORIGIN) return
      this.sendSyncFrame((encoder) => syncProtocol.writeUpdate(encoder, update))
    }
    this.awarenessListener = ({ added, updated, removed }, origin) => {
      // 本地或远端的成员变化都通知 UI（成员列表要实时反映两端状态）
      this.config.onPeersChanged()
      // 远端应用的成员状态不回广播（防回声）；本地变化/超时下线才推给房间
      if (origin === REMOTE_ORIGIN) return
      const clients = [...added, ...updated, ...removed]
      if (clients.length === 0) return
      this.sendAwarenessFrame(awarenessProtocol.encodeAwarenessUpdate(this.awareness, clients))
    }
  }

  /**
   * 接线并开始同步。
   *
   * 只登记监听，不在构造期抢跑：有状态通道（WebSocket）要等 open 后才发 SyncStep1，
   * 否则握手消息会在 socket 未就绪时被静默丢弃，而兜底计时却已经起跑。
   * 无 `onStatus` 的通道（内存/自定义）视为建连即在线，直接启动。
   */
  start(): void {
    this.unbindMessage = this.transport.onMessage((data) => this.handleMessage(data))
    this.unbindStatus =
      this.transport.onStatus?.((status) => {
        if (status === 'connected') this.onConnected()
        else this.onDisconnected()
        this.config.onStatus(status)
      }) ?? null
    this.ydoc.on('update', this.docListener)
    this.awareness.on('update', this.awarenessListener)
    if (!this.transport.onStatus) this.onConnected()
  }

  destroy(): void {
    this.destroyed = true
    if (this.syncTimer !== null) clearTimeout(this.syncTimer)
    if (this.heartbeatTimer !== null) clearInterval(this.heartbeatTimer)
    this.syncTimer = null
    this.heartbeatTimer = null
    this.ydoc.off('update', this.docListener)
    this.awareness.off('update', this.awarenessListener)
    this.unbindMessage?.()
    this.unbindStatus?.()
    this.unbindMessage = null
    this.unbindStatus = null
  }

  private onConnected(): void {
    if (this.destroyed) return
    this.sendSyncFrame((encoder) => syncProtocol.writeSyncStep1(encoder, this.ydoc))
    this.sendAwarenessFrame(
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, [this.ydoc.clientID]),
    )
    if (this.syncTimer === null && !this.synced) {
      this.syncTimer = setTimeout(() => this.finishSync('timeout'), SYNC_TIMEOUT_MS)
    }
  }

  /** 断线：清掉远端成员（否则成员列表会残留幽灵，直到 30s awareness 超时）。 */
  private onDisconnected(): void {
    const remotes: number[] = []
    this.awareness.getStates().forEach((_state, clientID) => {
      if (clientID !== this.ydoc.clientID) remotes.push(clientID)
    })
    if (remotes.length > 0) {
      awarenessProtocol.removeAwarenessStates(this.awareness, remotes, REMOTE_ORIGIN)
    }
  }

  private finishSync(kind: SyncInfo['kind']): void {
    if (this.synced || this.destroyed) return
    this.synced = true
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
    this.heartbeatTimer = setInterval(() => {
      this.sendAwarenessFrame(
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, [this.ydoc.clientID]),
      )
    }, AWARENESS_HEARTBEAT_MS)
    this.config.onSynced({ kind, remoteSeen: this.remoteSeen })
  }

  private handleMessage(data: Uint8Array): void {
    if (this.destroyed) return
    this.remoteSeen = true
    // 畸形帧（截断的 varuint / 非法的 awareness payload）只丢弃这一帧：
    // relay 是纯广播、无鉴权，任何成员都能灌入任意字节，不能让异常冒到 WebSocket 回调里。
    try {
      const decoder = decoding.createDecoder(data)
      const type = decoding.readVarUint(decoder)
      if (type === MESSAGE_SYNC) {
        // 与 y-websocket 相同的应答方式：帧类型已预写，readSyncMessage 把应答内容追加进同一缓冲
        const reply = encoding.createEncoder()
        encoding.writeVarUint(reply, MESSAGE_SYNC)
        const handled = syncProtocol.readSyncMessage(decoder, reply, this.ydoc, REMOTE_ORIGIN)
        if (encoding.length(reply) > 1) this.transport.send(encoding.toUint8Array(reply))
        if (handled === syncProtocol.messageYjsSyncStep2) {
          this.finishSync('handshake')
          this.config.onSyncStep2?.()
        }
        return
      }
      if (type === MESSAGE_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(
          this.awareness,
          decoding.readVarUint8Array(decoder),
          REMOTE_ORIGIN,
        )
      }
    } catch {
      // 单帧失败不影响后续消息（未知帧类型同理，忽略以保持向前兼容）
    }
  }

  private sendSyncFrame(writePayload: (encoder: encoding.Encoder) => void): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    writePayload(encoder)
    this.transport.send(encoding.toUint8Array(encoder))
  }

  private sendAwarenessFrame(update: Uint8Array): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
    encoding.writeVarUint8Array(encoder, update)
    this.transport.send(encoding.toUint8Array(encoder))
  }
}
