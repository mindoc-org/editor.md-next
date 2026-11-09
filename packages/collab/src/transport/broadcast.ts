/** BroadcastChannel 通道：同源多标签页（乃至同页多实例）零服务端协同，demo/本地联调用。 */
import type { CollabStatus, CollabTransport } from '../types'

/**
 * 创建 BroadcastChannel 通道。注意：同源的另一个 BroadcastChannel 对象会收到消息
 * （包括同一文档内的），发送方自身不会收到回环——正好符合 transport 契约。
 */
export function broadcastChannelTransport(room: string): CollabTransport {
  if (typeof BroadcastChannel === 'undefined') {
    throw new Error('当前环境不支持 BroadcastChannel（Node/jsdom 请使用自定义 transport）')
  }
  const channel = new BroadcastChannel(`editormd-collab:${room}`)
  const messageHandlers = new Set<(data: Uint8Array) => void>()
  const statusHandlers = new Set<(status: CollabStatus) => void>()

  channel.onmessage = (event) => {
    const data = event.data as Uint8Array | undefined
    if (!(data instanceof Uint8Array)) return
    for (const handler of messageHandlers) handler(data)
  }

  return {
    send(data) {
      channel.postMessage(data)
    },
    onMessage(handler) {
      messageHandlers.add(handler)
      return () => messageHandlers.delete(handler)
    },
    onStatus(handler) {
      statusHandlers.add(handler)
      // 异步通知，避免调用方在构造期同步回调
      queueMicrotask(() => handler('connected'))
      return () => statusHandlers.delete(handler)
    },
    destroy() {
      channel.close()
      messageHandlers.clear()
      statusHandlers.clear()
    },
  }
}
