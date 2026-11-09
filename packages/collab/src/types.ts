/** editor.md-next-collab 公共类型（API 契约见 docs/collab.md 与 ai-docs/collab-design.md）。 */
import type { Extension } from '@codemirror/state'
import type { Doc, Text } from 'yjs'

/** 本地用户信息（经 awareness 广播；远程光标显示 name/color，选区背景用 colorLight）。 */
export interface CollabUser {
  name?: string
  color?: string
}

export type CollabStatus = 'connected' | 'disconnected'

/**
 * 通道适配：任何能把二进制消息「广播到房间其他成员」的通道都可以接。
 *
 * 协议语义（y-protocols 的 sync/awareness 编解码）全部在拓展包内实现，
 * 服务端只做纯广播（不解析内容）——参考实现见 `server/relay.mjs`。
 * WebSocket 通道自带断线重连；重连后由同步握手自动补齐离线期间的差异（CRDT 合并）。
 */
export interface CollabTransport {
  /** 发送一条二进制消息（服务端广播给房间内其他成员，不回发自己） */
  send(data: Uint8Array): void
  /** 订阅其他成员的消息，返回解绑函数 */
  onMessage(handler: (data: Uint8Array) => void): () => void
  /** 订阅连接状态（可选），返回解绑函数 */
  onStatus?(handler: (status: CollabStatus) => void): () => void
  /** 关闭通道并释放资源 */
  destroy(): void
}

/** 在线成员（含本地）。 */
export interface CollabPeer {
  clientID: number
  name: string
  color: string
  /** 是否为本端 */
  local: boolean
}

export interface CollabOptions {
  /** 通道适配器（必填） */
  transport: CollabTransport
  /** 本地用户；缺省用 randomUser() 自动生成 */
  user?: CollabUser
  /**
   * 撤销栈：true（默认）= Y.UndoManager，只撤销自己的编辑（接管 Mod-z/Shift-Mod-z/Mod-y）；
   * false = 不提供协同撤销（core 内置 history 仍在，但协同语义下不建议用）
   */
  undo?: boolean
  /** 远程光标/选区显示（默认 true）；false 时仍可收到 onPeers 成员列表 */
  cursors?: boolean
}

export interface CollabBinding {
  /** 注入编辑器：new EditorMD(el, { editor: { extensions: binding.extensions } }) */
  extensions: Extension[]
  /** Yjs 文档句柄（高级用法） */
  ydoc: Doc
  /** 协同文本（Yjs 侧的唯一事实源；同步完成后编辑器内容与其一致） */
  ytext: Text
  /** 在线成员变化（含本地；注册时立即回调一次当前列表），返回解绑函数 */
  onPeers(handler: (peers: CollabPeer[]) => void): () => void
  /** 连接状态变化，返回解绑函数 */
  onStatus(handler: (status: CollabStatus) => void): () => void
  /**
   * 首次完成同步握手（收到对端全量状态；空房间 3s 内无对端响应时也视为完成）。
   * 触发时机与「初始 value 写入房间」相关，见 docs/collab.md 初始同步一节。返回解绑函数。
   */
  onSynced(handler: () => void): () => void
  /** 断开通道并销毁协同绑定（不销毁编辑器实例本身；编辑器 destroy 前先调它） */
  destroy(): void
}
