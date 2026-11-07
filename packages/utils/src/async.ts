/** 异步与节流工具。 */

export interface Debounced<F extends (...args: never[]) => void> {
  (...args: Parameters<F>): void
  /** 取消尚未执行的调用 */
  cancel(): void
  /** 立即执行一次挂起的调用（如有） */
  flush(): void
}

/** 尾随防抖：最后一次调用后 wait 毫秒执行。 */
export function debounce<F extends (...args: never[]) => void>(fn: F, wait = 300): Debounced<F> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<F> | null = null

  const debounced = (...args: Parameters<F>): void => {
    lastArgs = args
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      const argsToRun = lastArgs
      lastArgs = null
      if (argsToRun) (fn as unknown as (...a: unknown[]) => void)(...argsToRun)
    }, wait)
  }

  debounced.cancel = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
    lastArgs = null
  }

  debounced.flush = () => {
    if (timer === null) return
    clearTimeout(timer)
    timer = null
    const argsToRun = lastArgs
    lastArgs = null
    if (argsToRun) (fn as unknown as (...a: unknown[]) => void)(...argsToRun)
  }

  return debounced
}

/** 节流：间隔 wait 毫秒最多执行一次（尾随保证最后一次触发也被处理）。 */
export function throttle<F extends (...args: never[]) => void>(fn: F, wait = 100): Debounced<F> {
  let lastTime = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<F> | null = null

  const run = (): void => {
    lastTime = Date.now()
    timer = null
    const argsToRun = lastArgs
    lastArgs = null
    if (argsToRun) (fn as unknown as (...a: unknown[]) => void)(...argsToRun)
  }

  const throttled = (...args: Parameters<F>): void => {
    lastArgs = args
    const now = Date.now()
    const remaining = wait - (now - lastTime)
    if (remaining <= 0) {
      run()
    } else if (timer === null) {
      timer = setTimeout(run, remaining)
    }
  }

  throttled.cancel = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
    lastArgs = null
  }

  throttled.flush = () => {
    if (timer === null) return
    clearTimeout(timer)
    run()
  }

  return throttled
}
