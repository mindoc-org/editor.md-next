import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from './event-emitter'

interface Events {
  change: string
  resize: { width: number }
}

describe('EventEmitter', () => {
  it('on/emit 基本收发', () => {
    const emitter = new EventEmitter<Events>()
    const spy = vi.fn()
    emitter.on('change', spy)
    emitter.emit('change', 'v1')
    expect(spy).toHaveBeenCalledWith('v1')
  })

  it('off 解绑', () => {
    const emitter = new EventEmitter<Events>()
    const spy = vi.fn()
    const unbind = emitter.on('change', spy)
    unbind()
    emitter.emit('change', 'v')
    expect(spy).not.toHaveBeenCalled()
  })

  it('off 不传 listener 清空该事件', () => {
    const emitter = new EventEmitter<Events>()
    const a = vi.fn()
    const b = vi.fn()
    emitter.on('change', a)
    emitter.on('change', b)
    emitter.off('change')
    emitter.emit('change', 'v')
    expect(a).not.toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
  })

  it('once 只触发一次', () => {
    const emitter = new EventEmitter<Events>()
    const spy = vi.fn()
    emitter.once('resize', spy)
    emitter.emit('resize', { width: 1 })
    emitter.emit('resize', { width: 2 })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('监听者抛错不影响其他监听者', () => {
    const emitter = new EventEmitter<Events>()
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const good = vi.fn()
    emitter.on('change', () => {
      throw new Error('boom')
    })
    emitter.on('change', good)
    emitter.emit('change', 'v')
    expect(good).toHaveBeenCalledWith('v')
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
