/**
 * createCollab 编排：Yjs 文档 + awareness + 同步泵 + y-codemirror.next 绑定，
 * 产出可经 editor.extensions 注入 editor.md-next 的 CM6 扩展组。
 *
 * 关键行为（设计细节见 ai-docs/collab-design.md §5）：
 * - 挂载对齐：编辑器创建时若房间已有内容（ytext 非空），以房间为准替换编辑器文档。
 *   该事务用 ySyncAnnotation.of(conf) 标注（与 y-codemirror.next 的远端事务同形），
 *   y-sync 视其为远端来源、跳过「编辑器→ytext」回写，避免错位映射写坏 ytext。
 * - 初始 value：确认房间为空时才写入 ytext（先清空编辑器再经 ytext 回填，保证 yjs 是唯一
 *   事实源）；"确认"= 收到对端 Step2（此时 ytext 仍空），或兜底超时且未见过任何远端帧。
 * - 撤销：通过 core 的 undoRedoFacet 注入 Y.UndoManager，使**工具栏按钮 / 快捷键 /
 *   editor.undo() 共用同一实现**；只追踪本地编辑，不会撤到别人的内容。
 */
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { EditorView, ViewPlugin } from '@codemirror/view'
import type { ViewUpdate } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { yCollab, ySyncAnnotation, ySyncFacet } from 'y-codemirror.next'
import { undoRedoFacet } from 'editor.md-next'
import { SyncPump } from './sync'
import type { SyncInfo } from './sync'
import { deriveColorLight, randomUser } from './cursors'
import type { CollabBinding, CollabOptions, CollabPeer, CollabStatus, CollabUser } from './types'

/** 初始 value 写入 ytext 的事务 origin（与本地编辑/远端更新都不同源，不入撤销栈）。 */
const INIT_ORIGIN = 'editormd-collab-init'

/** 协同文本在 Yjs 文档中的字段名。 */
const YTEXT_NAME = 'content'

export function createCollab(options: CollabOptions): CollabBinding {
  const ydoc = new Y.Doc()
  const ytext = ydoc.getText(YTEXT_NAME)
  const awareness = new Awareness(ydoc)

  const user: CollabUser = { ...randomUser(), ...options.user }
  if (!user.color) user.color = randomUser().color
  if (!user.name) user.name = randomUser().name
  awareness.setLocalStateField('user', {
    name: user.name,
    color: user.color,
    colorLight: deriveColorLight(user.color),
  })

  const undoManager = options.undo === false ? false : new Y.UndoManager(ytext)

  const peersHandlers = new Set<(peers: CollabPeer[]) => void>()
  const statusHandlers = new Set<(status: CollabStatus) => void>()
  const syncedHandlers = new Set<() => void>()
  let view: EditorView | null = null
  let synced = false
  let destroyed = false
  let currentStatus: CollabStatus | null = null
  /** 编辑器带着初始 value 进入空房间，等待"确认房间为空"后写入。 */
  let pendingInitialValue = false

  const emitPeers = (): void => {
    const peers = listPeers()
    for (const handler of peersHandlers) handler(peers)
  }

  const emitStatus = (status: CollabStatus): void => {
    currentStatus = status
    for (const handler of statusHandlers) handler(status)
  }

  const emitSynced = (info: SyncInfo): void => {
    synced = true
    // 握手成功：ytext 为空即代表房间确实没有内容，可安全写入本地草稿。
    // 超时兜底：只有同步窗口内没见过任何远端帧才视为空房间；见过远端则保留 pending，
    // 等迟到的 Step2（onSyncStep2）再判断，避免与房间内容合并出两份。
    if (info.kind === 'handshake' || !info.remoteSeen) trySeed()
    for (const handler of syncedHandlers) handler()
  }

  /**
   * 尝试把编辑器初始内容写入 ytext。返回 true 表示"已处理"（写过，或本来就不该写），
   * 返回 false 表示编辑器尚未就绪、需要后续重试。
   */
  function applyInitialValue(): boolean {
    const v = view
    if (!v) return false
    const conf = v.state.facet(ySyncFacet)
    if (!conf) return false
    if (ytext.length > 0) return true
    const docText = v.state.doc.toString()
    if (!docText) return true
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: '' },
      annotations: ySyncAnnotation.of(conf),
    })
    ydoc.transact(() => {
      ytext.insert(0, docText)
    }, INIT_ORIGIN)
    return true
  }

  function trySeed(): void {
    if (!pendingInitialValue || destroyed) return
    if (applyInitialValue()) pendingInitialValue = false
  }

  /** 编辑器挂载后的对齐：房间有内容则以房间为准替换编辑器文档。 */
  function reconcile(): void {
    const v = view
    if (!v) return
    const conf = v.state.facet(ySyncFacet)
    if (!conf) return
    const docText = v.state.doc.toString()
    if (ytext.length > 0) {
      if (ytext.toString() !== docText) {
        v.dispatch({
          changes: { from: 0, to: v.state.doc.length, insert: ytext.toString() },
          annotations: ySyncAnnotation.of(conf),
        })
      }
      return
    }
    if (docText.length > 0) {
      pendingInitialValue = true
      if (synced) trySeed()
    }
  }

  function listPeers(): CollabPeer[] {
    const peers: CollabPeer[] = []
    awareness.getStates().forEach((state, clientID) => {
      const info = (state.user ?? {}) as CollabUser
      peers.push({
        clientID,
        name: info.name ?? 'anonymous',
        color: info.color ?? '#8899aa',
        local: clientID === ydoc.clientID,
      })
    })
    return peers
  }

  const pump = new SyncPump({
    ydoc,
    awareness,
    transport: options.transport,
    onStatus: emitStatus,
    onSynced: emitSynced,
    // 迟到的 Step2（重连、超时后对端才回包）到达时补做初始 value 判断
    onSyncStep2: trySeed,
    onPeersChanged: emitPeers,
  })
  pump.start()

  // 捕获 EditorView 并做挂载对齐。dispatch 不能在插件构造器里同步进行，放到微任务；
  // 编辑器销毁时 CM6 会调插件 destroy，置空引用避免悬挂访问。
  const attachPlugin = ViewPlugin.fromClass(
    class AttachPlugin {
      constructor(target: EditorView) {
        view = target
        queueMicrotask(reconcile)
      }

      destroy(): void {
        view = null
      }
    },
  )

  /**
   * 光标发布：y-codemirror.next 的内置发布以 `document.hasFocus()` 为门槛
   * （后台标签页/自动化环境永远不发布，且失焦时不清除残留光标）。
   * 这里改用编辑器自身焦点：聚焦时发布选区（相对位置），失焦时清除。
   * 与内置发布共存：document 有焦点时两者写同值；无焦点时以本插件为准。
   */
  const cursorPublisher =
    options.cursors === false
      ? []
      : [
          ViewPlugin.fromClass(
            class CursorPublisher {
              update(update: ViewUpdate): void {
                const local = awareness.getLocalState()
                if (!local) return
                if (!update.view.hasFocus) {
                  if (local.cursor != null) awareness.setLocalStateField('cursor', null)
                  return
                }
                const sel = update.state.selection.main
                const anchor = Y.createRelativePositionFromTypeIndex(ytext, sel.anchor)
                const head = Y.createRelativePositionFromTypeIndex(ytext, sel.head)
                const cur = local.cursor as { anchor: unknown; head: unknown } | null | undefined
                const unchanged =
                  cur != null &&
                  Y.compareRelativePositions(
                    Y.createRelativePositionFromJSON(cur.anchor),
                    anchor,
                  ) &&
                  Y.compareRelativePositions(
                    Y.createRelativePositionFromJSON(cur.head),
                    head,
                  )
                if (!unchanged) {
                  awareness.setLocalStateField('cursor', { anchor, head })
                }
              }
            },
          ),
        ]

  const extensions: Extension[] = [attachPlugin, ...cursorPublisher]
  if (undoManager) {
    const manager = undoManager
    // 交给 core 的撤销扩展点：工具栏按钮与键位都走这里（core 默认回退内置 history）
    extensions.push(
      undoRedoFacet.of({
        undo: () => manager.undo() !== null,
        redo: () => manager.redo() !== null,
      }),
    )
  }
  // cursors: false 时不传 awareness——y-codemirror.next 据此跳过远程选区/光标插件
  extensions.push(yCollab(ytext, options.cursors === false ? undefined : awareness, { undoManager }))

  return {
    extensions,
    ydoc,
    ytext,
    onPeers(handler) {
      handler(listPeers())
      peersHandlers.add(handler)
      return () => peersHandlers.delete(handler)
    },
    onStatus(handler) {
      // 回放当前状态：调用方不必猜"现在到底连上了没有"（未知阶段不回调）
      if (currentStatus !== null) handler(currentStatus)
      statusHandlers.add(handler)
      return () => statusHandlers.delete(handler)
    },
    onSynced(handler) {
      if (synced) handler()
      syncedHandlers.add(handler)
      return () => syncedHandlers.delete(handler)
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      // 先广播自己的下线，再停泵（顺序反过来成员列表就收不到退出事件）
      awareness.destroy()
      pump.destroy()
      if (undoManager) undoManager.destroy()
      // 通知末态后再释放通道与订阅者
      emitStatus('disconnected')
      options.transport.destroy()
      ydoc.destroy()
      peersHandlers.clear()
      statusHandlers.clear()
      syncedHandlers.clear()
      view = null
    },
  }
}
