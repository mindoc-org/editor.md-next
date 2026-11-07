import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce, throttle } from './async'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('debounce', () => {
  it('尾随执行一次', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced()
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('参数取最后一次', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced(1)
    vi.advanceTimersByTime(10)
    debounced(2)
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledWith(2)
  })

  it('cancel 阻止执行', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()
  })

  it('flush 立即执行挂起调用', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)
    debounced('x')
    debounced.flush()
    expect(fn).toHaveBeenCalledWith('x')
    debounced.flush()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('throttle', () => {
  it('间隔内只执行一次且尾随补执行', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled()
    throttled()
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('flush 立即补执行', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 1000)
    throttled('a')
    throttled('b')
    throttled.flush()
    expect(fn).toHaveBeenLastCalledWith('b')
  })
})
