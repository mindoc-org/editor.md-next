/**
 * 协同绑定协议级测试：内存 transport 直连两个 binding，不经编辑器实例
 * （jsdom 无法可靠创建 CM6 视图；编辑器级行为由 demo 示例浏览器走查覆盖，见设计文档 §7）。
 */
import { describe, expect, it, vi } from 'vitest'
import { EditorState } from '@codemirror/state'
import { createCollab, deriveColorLight, randomUser } from './index'
import type { CollabPeer, CollabTransport } from './types'

/**
 * 内存双工通道对：两条 transport 互为房间成员。send 只入队（同步投递会让先创建方的
 * 初始握手在对方接线前丢失）；drain() 循环投递直到队列清空——应答消息也走队列，故需循环。
 */
function memoryPair() {
  const subscribers: Array<Set<(data: Uint8Array) => void>> = [new Set(), new Set()]
  const queue: Array<{ from: 0 | 1; data: Uint8Array }> = []
  const makeTransport = (idx: 0 | 1): CollabTransport => ({
    send(data) {
      queue.push({ from: idx, data })
    },
    onMessage(handler) {
      subscribers[idx].add(handler)
      return () => subscribers[idx].delete(handler)
    },
    onStatus(handler) {
      handler('connected')
      return () => {}
    },
    destroy() {
      subscribers[idx].clear()
    },
  })
  return {
    transports: [makeTransport(0), makeTransport(1)] as const,
    drain() {
      while (queue.length > 0) {
        const item = queue.shift() as { from: 0 | 1; data: Uint8Array }
        for (const handler of subscribers[1 - item.from]) handler(item.data)
      }
    },
  }
}

/** 单人无对端通道（空房间/离线场景）。 */
function loneTransport(): CollabTransport {
  return {
    send() {},
    onMessage() {
      return () => {}
    },
    onStatus(handler) {
      handler('connected')
      return () => {}
    },
    destroy() {},
  }
}

describe('createCollab 协议同步', () => {
  it('双端收敛与接力编辑', () => {
    const pair = memoryPair()
    const a = createCollab({ transport: pair.transports[0] })
    const b = createCollab({ transport: pair.transports[1] })
    pair.drain()

    a.ydoc.transact(() => a.ytext.insert(0, '你好'), 'test')
    pair.drain()
    expect(b.ytext.toString()).toBe('你好')

    b.ydoc.transact(() => b.ytext.insert(b.ytext.length, '，世界'), 'test')
    pair.drain()
    expect(a.ytext.toString()).toBe('你好，世界')

    a.destroy()
    b.destroy()
  })

  it('并发交叉编辑最终一致', () => {
    const pair = memoryPair()
    const a = createCollab({ transport: pair.transports[0] })
    const b = createCollab({ transport: pair.transports[1] })
    pair.drain()

    // 同一基线上双方同时在不同位置插入，不先 drain（模拟真实并发）
    a.ydoc.transact(() => a.ytext.insert(0, 'A'), 'test')
    b.ydoc.transact(() => b.ytext.insert(0, 'B'), 'test')
    pair.drain()

    const merged = a.ytext.toString()
    expect(merged).toBe(b.ytext.toString())
    expect(merged).toContain('A')
    expect(merged).toContain('B')

    a.destroy()
    b.destroy()
  })

  it('onSynced / onPeers / 用户信息广播', () => {
    const pair = memoryPair()
    const a = createCollab({
      transport: pair.transports[0],
      user: { name: '张三', color: '#ff0000' },
    })
    const b = createCollab({ transport: pair.transports[1] })
    pair.drain()

    expect(a.ytext).toBeDefined()
    expect(b.ytext).toBeDefined()

    for (const binding of [a, b]) {
      let peers: CollabPeer[] = []
      binding.onPeers((list) => {
        peers = list
      })
      expect(peers).toHaveLength(2)
      const local = peers.find((p) => p.local)
      const remote = peers.find((p) => !p.local)
      expect(local).toBeDefined()
      expect(remote).toBeDefined()
    }

    // B 看到的 A：名字与颜色经 awareness 传播
    let seen: { name: string; color: string } | null = null
    b.onPeers((list) => {
      const remote = list.find((p) => !p.local)
      if (remote) seen = { name: remote.name, color: remote.color }
    })
    expect(seen).toEqual({ name: '张三', color: '#ff0000' })

    a.destroy()
    b.destroy()
  })

  it('destroy 后停止收发并广播下线', () => {
    const pair = memoryPair()
    const a = createCollab({ transport: pair.transports[0] })
    const b = createCollab({ transport: pair.transports[1] })
    pair.drain()

    let bPeers = 2
    b.onPeers((list) => {
      bPeers = list.length
    })

    a.destroy()
    pair.drain()
    expect(bPeers).toBe(1)

    // 对端销毁后不再接收其后续写入（b 写入，a 的文档保持不变）
    const before = a.ytext.toString()
    b.ydoc.transact(() => b.ytext.insert(0, 'X'), 'test')
    pair.drain()
    expect(a.ytext.toString()).toBe(before)

    b.destroy()
  })

  it('空房间 3s 兜底触发 onSynced', () => {
    vi.useFakeTimers()
    try {
      const binding = createCollab({ transport: loneTransport() })
      const onSynced = vi.fn()
      binding.onSynced(onSynced)
      expect(onSynced).not.toHaveBeenCalled()
      vi.advanceTimersByTime(3000)
      expect(onSynced).toHaveBeenCalledTimes(1)
      binding.destroy()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('createCollab 扩展组合', () => {
  it('默认与降级组合都能构成合法 EditorState', () => {
    const pair = memoryPair()
    const a = createCollab({ transport: pair.transports[0] })
    const b = createCollab({
      transport: pair.transports[1],
      undo: false,
      cursors: false,
    })
    // resolveExtensions 在此校验扩展对象合法性（facets/plugins 结构错误会抛异常）
    expect(() => EditorState.create({ extensions: a.extensions })).not.toThrow()
    expect(() => EditorState.create({ extensions: b.extensions })).not.toThrow()
    a.destroy()
    b.destroy()
  })
})

describe('用户信息工具', () => {
  it('randomUser 生成调色板内的 6 位 hex 颜色', () => {
    for (let i = 0; i < 20; i++) {
      const user = randomUser()
      expect(user.name).toMatch(/^user-[0-9a-z]{4}$/)
      expect(user.color).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('deriveColorLight：6 位 hex 拼接 alpha，其余退回中性半透明', () => {
    expect(deriveColorLight('#30bced')).toBe('#30bced33')
    expect(deriveColorLight('red')).toBe('#8899aa33')
    expect(deriveColorLight('#30bce')).toBe('#8899aa33')
  })
})
