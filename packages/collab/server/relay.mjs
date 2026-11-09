#!/usr/bin/env node
/**
 * editor.md-next-collab 参考服务端：纯二进制广播 relay。
 *
 * 协议（见 docs/collab.md「通道与自建服务端」）：ws://host:port/<room>，
 * 按 URL path 分房间，收到任意二进制消息原样转发给同房间其他连接——
 * 不解析内容、不落盘、不回发本人。协同的全部协议语义在客户端（y-protocols）。
 *
 * 用法：node server/relay.mjs [端口]   （依赖：npm i ws；默认端口 1234）
 */
import { WebSocketServer } from 'ws'

const port = Number(process.argv[2] || process.env.PORT || 1234)
const rooms = new Map()

const wss = new WebSocketServer({ port })

wss.on('connection', (ws, req) => {
  const room = decodeURIComponent((req.url ?? '').replace(/^\/+/, '')) || 'default'
  let peers = rooms.get(room)
  if (!peers) {
    peers = new Set()
    rooms.set(room, peers)
  }
  peers.add(ws)

  ws.on('message', (data, isBinary) => {
    if (!isBinary) return
    for (const peer of peers) {
      if (peer !== ws && peer.readyState === 1) peer.send(data)
    }
  })

  ws.on('close', () => {
    peers.delete(ws)
    if (peers.size === 0) rooms.delete(room)
  })
})

console.log(`[editor.md-next-collab relay] ws://localhost:${port}/<room> 已就绪（纯广播，不落盘）`)
