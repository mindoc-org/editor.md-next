/**
 * 静态渲染：把 markdown 渲染为只读 HTML（替代原版 editormd.markdownToHTML）。
 * 复用与编辑器完全一致的引擎与后处理管线（TOC/高亮/公式/图表）。
 */
import { addClass, requireDom } from '@editormd-next/utils'
import { MarkdownEngine } from './markdown/engine'
import { postRenderPreview } from './preview/post-render'
import { resolveLang } from './i18n'
import { normalizeOptions } from './normalize'
import type { EditorUserOptions } from './types/settings'

export function renderTo(target: string | HTMLElement, options: EditorUserOptions = {}): HTMLElement {
  const resolved = normalizeOptions(options)
  const host = requireDom(target)
  addClass(host, 'emd-preview')
  host.dataset['emdPreviewTheme'] = resolved.preview.theme

  const engine = new MarkdownEngine(resolved.markdown, { codeHighlight: resolved.preview.codeHighlight })
  const { html, toc } = engine.render(resolved.value)
  host.innerHTML = html

  const lang = resolveLang(resolved.i18n)
  postRenderPreview(host, {
    toc: resolved.markdown.toc.enable ? toc : [],
    tocTitle: resolved.markdown.toc.title,
    tocTitleFallback: lang.tocTitle,
    tocStartLevel: resolved.markdown.toc.startLevel,
    tocDropdown: resolved.markdown.toc.dropdown,
    tocContainer: resolved.markdown.toc.container,
    codeHighlight: resolved.preview.codeHighlight,
    darkPreview: resolved.preview.theme === 'dark',
    renderTex: resolved.markdown.tex,
    renderMermaid: resolved.markdown.mermaid,
    renderMindmap: resolved.markdown.mindmap,
    cdn: resolved.cdn,
  })
  return host
}
