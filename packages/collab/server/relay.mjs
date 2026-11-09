#!/usr/bin/env node
/**
 * editor.md-next-collab 参考服务端：纯二进制广播 relay。
 *
 * 协议（见 docs/collab.md「通道与自建服务端」）：ws://host:port/<room>，
 * 按 URL path 分房间，收到任意二进制消息原样转发给同房间其他连接——
 * 不解析内容、不落盘、不回发本人。协同的全部协议语义在客户端（y-protocols）。
 *
 * 安全边界：**无鉴权、无房间隔离校验、无配额**，仅适用于内网/可信网络或前置网关做鉴权。
 * 公网部署请在前面加反向代理（TLS + 认证 + 限流），或换用 Hocuspocus 等带鉴权的后端。
 *
 * 用法：node server/relay.mjs [端口]
 * 依赖：ws —— 运行前在脚本所在目录执行 `npm i ws`（本包不把服务端库列为运行时依赖，
 *       避免纯浏览器使用者被迫安装）。
 */
let WebSocketServer
try {
  const ws = await import('ws')
  WebSocketServer = ws.WebSocketServer
} catch {
  console.error(
    '[editor.md-next-collab relay] 缺少依赖 ws。请先执行：\n' +
      '  npm i ws\n' +
      '（relay 只依赖 ws；浏览器端使用者无需安装）',
  )
  process.exit(1)
}

const port = Number(process.argv[2] || process.env.PORT || 1234)
const rooms = new Map()

/** 房间名解码：畸形百分号编码不能影响其他连接（坏 URL 退回 default）。 */
function resolveRoom(url) {
  const raw = (url ?? '').replace(/^\/+/, '')
  if (!raw) return 'default'
  try {
    return decodeURIComponent(raw) || 'default'
  } catch {
    return 'default'
  }
}

const wss = new WebSocketServer({
  port,
  // 协同消息是文档增量，正常远小于此值；限制单帧体积避免内存被意外撑爆
  maxPayload: 8 * 1024 * 1024,
})

wss.on('error', (err) => {
  console.error('[relay] 服务异常:', err?.message ?? err)
})

/** 存活探测：30s 一次 ping，未回 pong 的连接直接 terminate（清理半开 TCP）。 */
const alive = new WeakSet()

wss.on('connection', (ws, req) => {
  const room = resolveRoom(req.url)
  let peers = rooms.get(room)
  if (!peers) {
    peers = new Set()
    rooms.set(room, peers)
  }
  peers.add(ws)
  alive.add(ws)

  ws.on('pong', () => alive.add(ws))

  // 单个连接异常（客户端断网、协议错误）只影响它自己，不能冒泡成进程级 uncaught
  ws.on('error', (err) => {
    console.warn('[relay] 连接异常:', err?.message ?? err)
  })

  ws.on('message', (data, isBinary) => {
    if (!isBinary) return
    for (const peer of peers) {
      if (peer === ws || peer.readyState !== 1) continue
      try {
        peer.send(data)
      } catch {
        // 单连接发送失败不中断本轮广播；该连接会由 close/heartbeat 清理
      }
    }
  })

  ws.on('close', () => {
    peers.delete(ws)
    if (peers.size === 0) rooms.delete(room)
  })
})

const heartbeat = setInterval(() => {
  for (const peers of rooms.values()) {
    for (const peer of peers) {
      if (!alive.has(peer)) {
        peer.terminate()
        continue
      }
      alive.delete(peer)
      try {
        peer.ping()
      } catch {
        // 已断开：等 close 事件清理
      }
    }
  }
}, 30000)
heartbeat.unref()

console.log(`[editor.md-next-collab relay] ws://localhost:${port}/<room> 已就绪（纯广播，不落盘）`)
