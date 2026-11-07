/**
 * CDN 脚本/样式懒加载器（带去重与缓存）。
 *
 * KaTeX / mermaid / markmap 等重依赖按需从 CDN 加载，核心包不打包它们；
 * 同一 URL 多处调用只注入一次，后续调用复用同一个 Promise。
 */

const pending = new Map<string, Promise<void>>()

export interface LoadScriptOptions {
  /** 附加属性，例如 { type: 'module' } */
  attrs?: Record<string, string>
  /** 注入到的容器，默认 document.head */
  parent?: HTMLElement
}

/** 加载脚本；已加载过或加载中则复用。失败后允许重试（缓存被清除）。 */
export function loadScript(src: string, options: LoadScriptOptions = {}): Promise<void> {
  const cached = pending.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    for (const [key, value] of Object.entries(options.attrs ?? {})) {
      script.setAttribute(key, value)
    }
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      pending.delete(src)
      reject(new Error(`[editormd-next] failed to load script: ${src}`))
    }
    ;(options.parent ?? document.head).append(script)
  })

  pending.set(src, promise)
  return promise
}

/** 加载外部样式表；去重规则同 loadScript。 */
export function loadStyle(href: string, parent: HTMLElement = document.head): Promise<void> {
  const cached = pending.get(href)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => resolve()
    link.onerror = () => {
      link.remove()
      pending.delete(href)
      reject(new Error(`[editormd-next] failed to load stylesheet: ${href}`))
    }
    parent.append(link)
  })

  pending.set(href, promise)
  return promise
}

/** 注入一段内联样式（返回<style>节点以便移除）。 */
export function loadStyleText(css: string, parent: HTMLElement = document.head): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = css
  parent.append(style)
  return style
}

/** 供测试或 destroy 使用：清空加载缓存。 */
export function clearLoaderCache(): void {
  pending.clear()
}
