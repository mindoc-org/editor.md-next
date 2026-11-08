/**
 * 重依赖 CDN 懒加载渲染器：KaTeX / mermaid / markmap。
 * 页面已存在全局对象（window.katex / window.mermaid）时直接使用，与原版行为一致。
 */
import { loadScript, loadStyle } from '@editormd-next/utils'
import { decodeDataAttr } from './data-attr'
import type { CdnConfig } from '../types/settings'

/** KaTeX 最小结构类型（避免引入 @types/katex） */
interface KatexLike {
  renderToString(tex: string, options?: { displayMode?: boolean; throwOnError?: boolean }): string
}

interface MermaidLike {
  initialize(config: Record<string, unknown>): void
  parse(text: string): Promise<boolean>
  run(options: { nodes?: Iterable<HTMLElement>; suppressErrors?: boolean }): Promise<void>
}

/** markmap-view 的最小结构类型 */
interface MarkmapViewLike {
  Markmap: {
    create(svg: SVGSVGElement, options?: Record<string, unknown>, data?: unknown): unknown
  }
}

interface MarkmapLibLike {
  Transformer: new (plugins?: unknown[]) => {
    transform(source: string): { root: unknown } | Promise<{ root: unknown }>
  }
}

declare global {
  interface Window {
    katex?: KatexLike
    mermaid?: MermaidLike
    /** markmap-lib + markmap-view 的浏览器全局（同名命名空间合并） */
    markmap?: MarkmapLibLike & MarkmapViewLike & Record<string, unknown>
  }
}

async function ensureKatex(cdn: CdnConfig): Promise<KatexLike | null> {
  if (window.katex) return window.katex
  if (!cdn.katexJs) return null
  if (cdn.katexCss) await loadStyle(cdn.katexCss).catch(() => {})
  await loadScript(cdn.katexJs)
  return window.katex ?? null
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

/** 渲染容器内所有 .emd-tex / .emd-tex-display */
export async function renderTexIn(container: HTMLElement, cdn: CdnConfig): Promise<void> {
  const nodes = container.querySelectorAll<HTMLElement>('.emd-tex, .emd-tex-display')
  if (nodes.length === 0) return
  const katex = await ensureKatex(cdn)
  if (!katex) return
  for (const node of nodes) {
    if (node.dataset['emdTexRendered'] === '1') continue
    const tex = decodeDataAttr(node.dataset['tex'] ?? '')
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

/** mermaid 渲染串行队列：mermaid.run 不可重入，并发调用会间歇性产生解析错误 */
let mermaidQueue: Promise<void> = Promise.resolve()

/** 渲染容器内所有 .emd-mermaid（源文本 base64 存于 data-emd-mermaid-src） */
export function renderMermaidIn(container: HTMLElement, cdn: CdnConfig, dark = false): Promise<void> {
  const nodes = container.querySelectorAll<HTMLElement>('.emd-mermaid')
  const pending = [...nodes].filter((n) => n.dataset['emdMermaidRendered'] !== '1')
  if (pending.length === 0) return Promise.resolve()

  // 标记先行：防止两次渲染的收集窗口重叠导致同一节点被处理两次
  for (const node of pending) node.dataset['emdMermaidRendered'] = '1'
  // 以原始文本写回，绕开转义/包裹层对 mermaid 解析的干扰
  for (const node of pending) node.textContent = decodeDataAttr(node.dataset['emdMermaidSrc'] ?? '')

  const task = mermaidQueue.then(async () => {
    const mermaid = await ensureMermaid(cdn, dark)
    if (!mermaid) return
    // 诊断：预解析校验，失败时打印确切源文本（suppressErrors 会吞掉细节）
    for (const node of pending) {
      const text = node.textContent ?? ''
      try {
        await mermaid.parse(text)
      } catch (error) {
        console.error('[editormd-next] mermaid parse failed, source:', JSON.stringify(text), error)
      }
    }
    await mermaid.run({ nodes: pending, suppressErrors: true })
  })
  mermaidQueue = task.then(() => undefined, () => undefined)
  return task
}

/** markmap 三件套（d3 / markmap-lib / markmap-view）加载状态 */
let markmapLoading: Promise<boolean> | null = null

async function ensureMarkmap(cdn: CdnConfig): Promise<boolean> {
  if (window.markmap?.Markmap && window.markmap?.Transformer) return true
  if (!cdn.markmapBase) return false
  if (!markmapLoading) {
    const base = cdn.markmapBase.replace(/\/$/, '')
    const scripts = [
      `${base}/d3@7.9.0/dist/d3.min.js`,
      `${base}/markmap-lib@0.18.13/dist/browser/index.iife.js`,
      `${base}/markmap-view@0.18.10/dist/browser/index.js`,
    ]
    markmapLoading = (async () => {
      for (const src of scripts) {
        try {
          await loadScript(src)
        } catch (error) {
          console.error('[editormd-next] markmap script load failed:', src, error)
          return false
        }
      }
      return Boolean(window.markmap?.Markmap && window.markmap?.Transformer)
    })()
  }
  const ok = await markmapLoading.finally(() => { markmapLoading = null })
  return ok
}

/** 渲染容器内所有 .emd-mindmap（源文本 base64 存于 data-emd-mindmap-src）。
 * 直接使用 markmap-lib + markmap-view：autoloader 只在脚本加载时处理一次静态节点，
 * 无法覆盖编辑过程中的重新渲染。 */
export async function renderMindmapIn(container: HTMLElement, cdn: CdnConfig): Promise<void> {
  const nodes = container.querySelectorAll<HTMLElement>('.emd-mindmap')
  const pending = [...nodes].filter((n) => n.dataset['emdMindmapRendered'] !== '1')
  if (pending.length === 0) return
  for (const node of pending) node.dataset['emdMindmapRendered'] = '1'

  if (!(await ensureMarkmap(cdn))) {
    console.error('[editormd-next] markmap load failed')
    return
  }
  const { Transformer, Markmap } = window.markmap!
  const transformer = new Transformer()

  for (const node of pending) {
    const source = decodeDataAttr(node.dataset['emdMindmapSrc'] ?? '')
    try {
      const { root } = await transformer.transform(source)
      // 每次渲染的节点都是全新的，直接创建 svg
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.style.cssText = 'width:100%;height:100%;display:block;'
      node.append(svg)
      Markmap.create(svg, { autoFit: true }, root)
    } catch (error) {
      console.error('[editormd-next] markmap render failed:', error)
    }
  }
}
