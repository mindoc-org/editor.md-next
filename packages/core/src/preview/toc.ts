/** 目录渲染：把 TocItem[] 填入 [TOC] 占位符 / 外部容器 / 下拉菜单。 */
import type { TocItem } from '../markdown/plugin-toc'

export interface TocRenderOptions {
  /** 空串则使用 i18n 的 tocTitle */
  title: string
  startLevel: number
  /** 下拉菜单形态（[TOCM]） */
  dropdown: boolean
  /** 渲染到预览区之外的 selector */
  container?: string
  tocTitleFallback: string
}

interface TocNode {
  item: TocItem
  children: TocNode[]
}

/** 平铺 toc → 嵌套树（按 level 归栈） */
function buildTree(items: TocItem[]): TocNode[] {
  const root: TocNode[] = []
  const stack: TocNode[] = []
  for (const item of items) {
    const node: TocNode = { item, children: [] }
    while (stack.length > 0 && stack[stack.length - 1]!.item.level >= item.level) stack.pop()
    if (stack.length === 0) root.push(node)
    else stack[stack.length - 1]!.children.push(node)
    stack.push(node)
  }
  return root
}

function renderNodes(nodes: TocNode[]): string {
  if (nodes.length === 0) return ''
  let html = '<ul class="emd-toc-list">'
  for (const node of nodes) {
    const { item } = node
    html += `<li class="emd-toc-item emd-toc-level-${item.level}"><a href="#${item.slug}">${escapeTocText(item.text)}</a>`
    if (node.children.length > 0) html += renderNodes(node.children)
    html += '</li>'
  }
  return `${html}</ul>`
}

function escapeTocText(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

/** 渲染目录；返回实际挂载的元素（或 null） */
export function renderToc(items: TocItem[], options: TocRenderOptions): HTMLElement | null {
  const filtered = items.filter((item) => item.level >= options.startLevel)
  if (filtered.length === 0) return null

  const host = resolveHost(options)
  if (!host) return null

  host.innerHTML = renderNodes(buildTree(filtered))
  host.dataset['emdTocRendered'] = '1'

  if (options.dropdown) {
    host.classList.add('emd-toc-menu')
    const title = options.title || options.tocTitleFallback
    host.setAttribute('data-title', title)
  }
  return host
}

function resolveHost(options: TocRenderOptions): HTMLElement | null {
  if (options.container) {
    return document.querySelector<HTMLElement>(options.container)
  }
  return document.querySelector<HTMLElement>('[data-emd-toc]:not([data-emd-toc-rendered])')
}
