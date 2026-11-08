/**
 * 重依赖 CDN 懒加载渲染器：KaTeX / mermaid / markmap。
 * 页面已存在全局对象（window.katex / window.mermaid）时直接使用，与原版行为一致。
 */
import { loadScript, loadStyle } from '@editormd-next/utils'
import type { CdnConfig } from '../types/settings'

/** KaTeX 最小结构类型（避免引入 @types/katex） */
interface KatexLike {
  renderToString(tex: string, options?: { displayMode?: boolean; throwOnError?: boolean }): string
}

interface MermaidLike {
  initialize(config: Record<string, unknown>): void
  run(options: { nodes?: Iterable<HTMLElement>; suppressErrors?: boolean }): Promise<void>
}

declare global {
  interface Window {
    katex?: KatexLike
    mermaid?: MermaidLike
  }
}

async function ensureKatex(cdn: CdnConfig): Promise<KatexLike | null> {
  if (window.katex) return window.katex
  if (!cdn.katexJs) return null
  if (cdn.katexCss) await loadStyle(cdn.katexCss).catch(() => {})
  await loadScript(cdn.katexJs)
  return window.katex ?? null
}

/** 渲染容器内所有 .emd-tex / .emd-tex-display */
export async function renderTexIn(container: HTMLElement, cdn: CdnConfig): Promise<void> {
  const nodes = container.querySelectorAll<HTMLElement>('.emd-tex, .emd-tex-display')
  if (nodes.length === 0) return
  const katex = await ensureKatex(cdn)
  if (!katex) return
  for (const node of nodes) {
    if (node.dataset['emdTexRendered'] === '1') continue
    const tex = node.dataset['tex'] ?? ''
    const display = node.classList.contains('emd-tex-display')
    try {
      node.innerHTML = katex.renderToString(tex, { displayMode: display, throwOnError: false })
    } catch (error) {
      node.textContent = tex
      console.error('[editormd-next] katex render failed:', error)
    }
    node.dataset['emdTexRendered'] = '1'
  }
}

let mermaidReady = false

async function ensureMermaid(cdn: CdnConfig, dark: boolean): Promise<MermaidLike | null> {
  if (!window.mermaid) {
    if (!cdn.mermaidJs) return null
    await loadScript(cdn.mermaidJs)
  }
  const mermaid = window.mermaid
  if (!mermaid) return null
  if (!mermaidReady) {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: dark ? 'dark' : 'default' })
    mermaidReady = true
  }
  return mermaid
}

/** mermaid 渲染串行队列：mermaid.run 不可重入，并发调用会间歇性产生解析错误 */
let mermaidQueue: Promise<void> = Promise.resolve()

/** 渲染容器内所有 .emd-mermaid（源文本在 data-emd-mermaid-src 中） */
export function renderMermaidIn(container: HTMLElement, cdn: CdnConfig, dark = false): Promise<void> {
  const nodes = container.querySelectorAll<HTMLElement>('.emd-mermaid')
  const pending = [...nodes].filter((n) => n.dataset['emdMermaidRendered'] !== '1')
  if (pending.length === 0) return Promise.resolve()

  // 标记先行：防止两次渲染的收集窗口重叠导致同一节点被处理两次
  for (const node of pending) node.dataset['emdMermaidRendered'] = '1'
  // 以原始文本写回，绕开转义/包裹层对 mermaid 解析的干扰
  for (const node of pending) node.textContent = node.dataset['emdMermaidSrc'] ?? ''

  const task = mermaidQueue.then(async () => {
    const mermaid = await ensureMermaid(cdn, dark)
    if (!mermaid) return
    await mermaid.run({ nodes: pending, suppressErrors: true })
  })
  mermaidQueue = task.then(() => undefined, () => undefined)
  return task
}

let markmapLoading = false

/** 渲染容器内所有 .emd-mindmap：重建 <script type="text/template"> 后加载 markmap-autoloader */
export async function renderMindmapIn(container: HTMLElement, cdn: CdnConfig): Promise<void> {
  const nodes = container.querySelectorAll<HTMLElement>('.emd-mindmap')
  if (nodes.length === 0) return

  for (const node of nodes) {
    if (node.querySelector('script[type="text/template"]')) continue
    const source = node.dataset['emdMindmapSrc'] ?? ''
    const template = document.createElement('script')
    template.type = 'text/template'
    template.textContent = source
    node.append(template)
  }

  if (!markmapLoading) {
    markmapLoading = true
    try {
      await loadScript(cdn.markmapJs)
    } catch (error) {
      console.error('[editormd-next] markmap load failed:', error)
    }
    markmapLoading = false
  }
}
