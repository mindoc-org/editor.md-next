/**
 * DOM 操作封装 —— 取代原版 editor.md 对 jQuery 的依赖。
 * 只提供编辑器实际用到的能力，保持极简。
 */

export type DomSelector = string | HTMLElement

/** 按 selector / 元素二选一查找元素，找不到返回 null */
export function queryDom(selector: DomSelector, root: ParentNode = document): HTMLElement | null {
  if (typeof selector === 'string') {
    return root.querySelector<HTMLElement>(selector)
  }
  return selector ?? null
}

/** 同 queryDom，但找不到时抛出带上下文的错误 */
export function requireDom(selector: DomSelector, root: ParentNode = document): HTMLElement {
  const el = queryDom(selector, root)
  if (!el) {
    throw new Error(`[editormd-next] element not found: ${typeof selector === 'string' ? selector : '(HTMLElement)'}`)
  }
  return el
}

type AttrValue = string | number | boolean | undefined | null

/**
 * 创建元素。attrs 支持 class/for 等常规属性；data-* 直接透传；
 * children 中 false/undefined/null 会被跳过，字符串按文本节点处理。
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, AttrValue> = {},
  children: Array<Node | string | undefined | null | false> = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue
    if (name === 'dataset') {
      for (const [k, v] of Object.entries(value as unknown as Record<string, string>)) {
        el.dataset[k] = v
      }
    } else {
      el.setAttribute(name, String(value))
    }
  }
  for (const child of children) {
    if (child === undefined || child === null || child === false) continue
    el.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return el
}

/** 将 HTML 字符串解析为 DocumentFragment（不含脚本执行） */
export function fromHtml(html: string): DocumentFragment {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content
}

export function addClass(el: Element, ...names: Array<string | undefined | null | false>): void {
  const valid = names.filter((n): n is string => Boolean(n))
  if (valid.length > 0) el.classList.add(...valid)
}

export function removeClass(el: Element, ...names: string[]): void {
  if (names.length > 0) el.classList.remove(...names)
}

export function toggleClass(el: Element, name: string, force?: boolean): boolean {
  return el.classList.toggle(name, force)
}

export function hasClass(el: Element, name: string): boolean {
  return el.classList.contains(name)
}

export function setStyles(el: HTMLElement, styles: Partial<Record<string, string | number | undefined | null>>): void {
  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null) {
      el.style.removeProperty(cssKey(key))
    } else {
      el.style.setProperty(cssKey(key), String(value))
    }
  }
}

function cssKey(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

type EventListenerOf<T extends EventTarget> = T extends Window
  ? WindowEventMap
  : T extends Document
    ? DocumentEventMap
    : T extends HTMLElement
      ? HTMLElementEventMap
      : Record<string, Event>

/** addEventListener 的轻封装，返回解绑函数 */
export function on<T extends EventTarget, E extends keyof EventListenerOf<T> & string>(
  target: T,
  type: E,
  listener: (event: EventListenerOf<T>[E]) => void,
  options?: AddEventListenerOptions,
): () => void {
  target.addEventListener(type, listener as EventListener, options)
  return () => target.removeEventListener(type, listener as EventListener, options)
}

/** 触摸环境检测（一次性判定，与原版 mouseOrTouch 的意图一致） */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && 'ontouchstart' in window
}
