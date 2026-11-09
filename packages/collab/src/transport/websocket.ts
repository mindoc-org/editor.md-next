/** WebSocket 通道：连接参考服务端 server/relay.mjs（ws://host:port/<room>，纯二进制广播）。 */
import type { CollabStatus, CollabTransport } from '../types'

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30000

/**
 * 创建 WebSocket 通道。连接立刻发起，断线自动重连（指数退避，封顶 30s）。
 * 重连成功后由同步握手自动补齐离线期间的差异（CRDT 合并），无需业务层干预。
 */
export function websocketTransport(url: string, room: string): CollabTransport {
  const base = url.replace(/\/+$/, '')
  const target = `${base}/${room.replace(/^\/+/, '')}`
  const messageHandlers = new Set<(data: Uint8Array) => void>()
  const statusHandlers = new Set<(status: CollabStatus) => void>()
  let socket: WebSocket | null = null
  let retries = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let closed = false

  function emitStatus(status: CollabStatus): void {
    for (const handler of statusHandlers) handler(status)
  }

  function connect(): void {
    if (closed) return
    socket = new WebSocket(target)
    socket.binaryType = 'arraybuffer'
    socket.onopen = () => {
      retries = 0
      emitStatus('connected')
    }
    socket.onmessage = (event) => {
      if (typeof event.data === 'string') return
      const data = new Uint8Array(event.data as ArrayBuffer)
      for (const handler of messageHandlers) handler(data)
    }
    socket.onclose = () => {
      socket = null
      if (closed) return
      emitStatus('disconnected')
      const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** retries++)
      reconnectTimer = setTimeout(connect, delay)
    }
    socket.onerror = () => socket?.close()
  }

  connect()

  return {
    send(data) {
      // 未连接时丢弃——断线期间的本地内容都在 yjs 文档里，重连握手会补齐。
      // 类型收紧：send 只接收本包产出的精确 ArrayBuffer 视图（lib0 toUint8Array 新分配）
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(data as Uint8Array<ArrayBuffer>)
      }
    },
    onMessage(handler) {
      messageHandlers.add(handler)
      return () => messageHandlers.delete(handler)
    },
    onStatus(handler) {
      statusHandlers.add(handler)
      return () => statusHandlers.delete(handler)
    },
    destroy() {
      closed = true
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      socket?.close()
      socket = null
      messageHandlers.clear()
      statusHandlers.clear()
    },
  }
}
