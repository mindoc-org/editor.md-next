/**
 * 特殊代码围栏渲染：
 * - ```math / ```latex / ```katex → p.emd-tex-display（KaTeX 显示模式，post-render 渲染）
 * - ```mermaid → div.emd-mermaid（mermaid CDN 懒加载渲染）
 * - ```mindmap / ```mindmap>高度 → div.emd-mindmap（markmap CDN 懒加载渲染）
 * 其余围栏走默认渲染（配合 markdown-it highlight 选项做语法高亮）。
 */
import { escapeHtml } from '@editormd-next/utils'
import type { MarkdownIt } from 'markdown-it'

const MATH_LANGS = new Set(['math', 'latex', 'katex'])

export function fencePlugin(md: MarkdownIt): void {
  const defaultFence = md.renderer.rules['fence']
  if (!defaultFence) return

  md.renderer.rules['fence'] = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    const info = token.info.trim()
    const lang = info.split(/\s+/)[0]?.toLowerCase() ?? ''

    if (MATH_LANGS.has(lang)) {
      return `<p class="emd-tex-display" data-tex="${escapeHtml(token.content)}"></p>`
    }

    if (lang === 'mermaid') {
      return `<div class="emd-mermaid" data-emd-mermaid><pre class="emd-mermaid-src">${escapeHtml(token.content)}</pre></div>`
    }

    if (lang === 'mindmap' || info.startsWith('mindmap>')) {
      // mindmap>400px 语法指定高度（对齐原版 mindmap>HEIGHT）
      const height = info.startsWith('mindmap>') ? info.slice('mindmap>'.length).trim() : ''
      const style = /^[\d.]+(px|em|rem|vh|%)$/.test(height) ? ` style="height:${height}"` : ''
      // 源文本放 data 属性，post-render 阶段重建 <script type="text/template">（避免被 DOMPurify 清除）
      return `<div class="emd-mindmap markmap"${style} data-emd-mindmap-src="${escapeHtml(token.content)}"></div>`
    }

    return defaultFence(tokens, idx, options, env, self)
  }
}
