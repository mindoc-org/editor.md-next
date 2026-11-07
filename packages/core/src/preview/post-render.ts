/** 渲染后处理编排：目录、代码折叠、KaTeX、mermaid、mindmap。renderTo 静态渲染同样复用。 */
import { foldCodeBlocks } from '../markdown/highlight'
import type { CdnConfig } from '../types/settings'
import { renderMermaidIn, renderMindmapIn, renderTexIn } from '../markdown/cdn-lazy'
import type { TocItem } from '../markdown/plugin-toc'
import { renderToc } from './toc'

export interface PostRenderOptions {
  toc: TocItem[]
  tocTitle: string
  tocTitleFallback: string
  tocStartLevel: number
  tocDropdown: boolean
  tocContainer?: string
  codeHighlight: boolean
  darkPreview: boolean
  /** 重依赖开关（markdown.tex / mermaid / mindmap） */
  renderTex: boolean
  renderMermaid: boolean
  renderMindmap: boolean
  cdn: CdnConfig
}

export function postRenderPreview(container: HTMLElement, options: PostRenderOptions): void {
  // 目录（[TOC] 占位符每次渲染都会重建，:not([data-emd-toc-rendered]) 选中新建的占位符）
  renderToc(options.toc, {
    title: options.tocTitle,
    startLevel: options.tocStartLevel,
    dropdown: options.tocDropdown,
    container: options.tocContainer,
    tocTitleFallback: options.tocTitleFallback,
  })

  if (options.codeHighlight) {
    foldCodeBlocks(container, { threshold: 12 })
  }

  // 重依赖异步渲染（失败仅打日志，不阻塞预览）
  if (options.renderTex) void renderTexIn(container, options.cdn)
  if (options.renderMermaid) void renderMermaidIn(container, options.cdn, options.darkPreview)
  if (options.renderMindmap) void renderMindmapIn(container, options.cdn)
}
