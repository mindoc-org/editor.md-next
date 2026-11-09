/**
 * createCollab 编排：Yjs 文档 + awareness + 同步泵 + y-codemirror.next 绑定，
 * 产出可经 editor.extensions 注入 editor.md-next 的 CM6 扩展组。
 *
 * 关键行为（设计细节见 ai-docs/collab-design.md §5）：
 * - 挂载对齐：编辑器创建时若房间已有内容（ytext 非空），以房间为准替换编辑器文档。
 *   该事务用 ySyncAnnotation.of(conf) 标注（与 y-codemirror.next 的远端事务同形），
 *   y-sync 视其为远端来源、跳过「编辑器→ytext」回写，避免错位映射写坏 ytext。
 * - 初始 value：空房间且编辑器有初始内容时，首次同步完成后把 value 写入 ytext
 *   （先清空编辑器再经 ytext 回填，保证 yjs 是唯一事实源），并广播给房间。
 * - 撤销：Y.UndoManager 交给 y-codemirror.next 插件自动 addTrackedOrigin(syncConf)，
 *   只追踪本地编辑；Prec.highest 键位压制 core 内置 historyKeymap（远程事务会进
 *   CM6 history 栈，若不压制，Mod-z 会撤销到别人的编辑——语义错误）。
 */
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { EditorView, ViewPlugin, keymap } from '@codemirror/view'
import type { ViewUpdate } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import { yCollab, ySyncAnnotation, ySyncFacet, yUndoManagerKeymap } from 'y-codemirror.next'
import { SyncPump } from './sync'
import { deriveColorLight, randomUser } from './cursors'
import type { CollabBinding, CollabOptions, CollabPeer, CollabUser } from './types'

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
  const statusHandlers = new Set<(status: 'connected' | 'disconnected') => void>()
  const syncedHandlers = new Set<() => void>()
  let view: EditorView | null = null
  let synced = false
  let pendingInitialValue = false

  const emitPeers = (): void => {
    const peers = listPeers()
    for (const handler of peersHandlers) handler(peers)
  }

  const emitStatus = (status: 'connected' | 'disconnected'): void => {
    for (const handler of statusHandlers) handler(status)
  }

  const emitSynced = (): void => {
    synced = true
    if (pendingInitialValue) {
      pendingInitialValue = false
      applyInitialValue()
    }
    for (const handler of syncedHandlers) handler()
  }

  /** 空房间兜底走完后的初始 value 写入：清空编辑器 → 写 ytext → 观察者回填（见文件头注释）。 */
  function applyInitialValue(): void {
    const v = view
    if (!v) return
    const conf = v.state.facet(ySyncFacet)
    if (!conf || ytext.length > 0) return
    const docText = v.state.doc.toString()
    if (!docText) return
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: '' },
      annotations: ySyncAnnotation.of(conf),
    })
    ydoc.transact(() => {
      ytext.insert(0, docText)
    }, INIT_ORIGIN)
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
      // 编辑器带初始 value 且房间为空：同步完成后写入；若同步早已完成则立即写
      if (synced) applyInitialValue()
      else pendingInitialValue = true
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

  const extensions: Extension[] = [
    attachPlugin,
    ...cursorPublisher,
    // 压制 core 内置 historyKeymap（create-view.ts 的 keymap 在前，用户扩展在后、优先级更高）
    ...(undoManager ? [Prec.highest(keymap.of(yUndoManagerKeymap))] : []),
    // cursors: false 时不传 awareness——y-codemirror.next 据此跳过远程选区/光标插件
    yCollab(ytext, options.cursors === false ? undefined : awareness, { undoManager }),
  ]

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
      statusHandlers.add(handler)
      return () => statusHandlers.delete(handler)
    },
    onSynced(handler) {
      if (synced) handler()
      syncedHandlers.add(handler)
      return () => syncedHandlers.delete(handler)
    },
    destroy() {
      // 先广播自己的下线，再停泵（顺序反过来成员列表就收不到退出事件）
      awareness.destroy()
      pump.destroy()
      ydoc.destroy()
      peersHandlers.clear()
      statusHandlers.clear()
      syncedHandlers.clear()
      view = null
    },
  }
}
