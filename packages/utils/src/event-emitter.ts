/**
 * 极简类型化事件总线。
 * 原版 editor.md 的"事件"只是 settings 上的 on* 回调（见 ai-docs/feature-parity.md），
 * editor.md-next 用真正的 emitter 取代之，同时保留 settings 回调作为糖衣。
 */

export type Listener<T> = (payload: T) => void

export class EventEmitter<Events extends object> {
  private listeners = new Map<keyof Events, Set<Listener<never>>>()

  /** 订阅事件，返回解绑函数 */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(listener as Listener<never>)
    return () => this.off(event, listener)
  }

  /** 订阅一次性事件 */
  once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const wrapped: Listener<Events[K]> = (payload) => {
      this.off(event, wrapped)
      listener(payload)
    }
    return this.on(event, wrapped)
  }

  /** 解绑；不传 listener 时解绑该事件全部监听者 */
  off<K extends keyof Events>(event: K, listener?: Listener<Events[K]>): void {
    const set = this.listeners.get(event)
    if (!set) return
    if (listener) {
      set.delete(listener as Listener<never>)
    } else {
      set.clear()
    }
    if (set.size === 0) this.listeners.delete(event)
  }

  /** 触发事件；监听者异常被捕获并统一上报，避免互相影响 */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const listener of [...set]) {
      try {
        ;(listener as unknown as Listener<Events[K]>)(payload)
      } catch (error) {
        console.error(`[editormd-next] listener for "${String(event)}" threw:`, error)
      }
    }
  }

  /** 清空所有监听（destroy 时使用） */
  removeAllListeners(): void {
    this.listeners.clear()
  }
}
