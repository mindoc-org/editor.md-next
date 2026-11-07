export interface Example {
  id: string
  title: string
  description: string
  /** 在给定容器内渲染示例；返回清理函数（销毁编辑器实例） */
  render: (container: HTMLElement) => () => void
}

/** 通用示例骨架：标题 + 说明 + 编辑器容器 */
export function exampleShell(
  container: HTMLElement,
  title: string,
  description: string,
): HTMLElement {
  const h = document.createElement('h2')
  h.textContent = title
  const p = document.createElement('p')
  p.className = 'example-desc'
  p.textContent = description
  const host = document.createElement('div')
  host.className = 'example-host'
  container.append(h, p, host)
  return host
}
