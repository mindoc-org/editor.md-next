/**
 * 特殊代码围栏渲染：
 * - ```math / ```latex / ```katex → p.emd-tex-display（KaTeX 显示模式，post-render 渲染）
 * - ```mermaid → div.emd-mermaid（mermaid CDN 懒加载渲染）
 * - ```mindmap / ```mindmap>高度 → div.emd-mindmap（markmap CDN 懒加载渲染）
 * 其余围栏走默认渲染（配合 markdown-it highlight 选项做语法高亮）。
 *
 * 源文本统一 base64 进 data 属性：绕开 DOMPurify SAFE_FOR_XML 对含 `-->` 属性的清除，
 * 也避免 mermaid 对 innerHTML/实体读取细节的依赖。
 */
import { encodeDataAttr } from './data-attr'
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
      return `<p class="emd-tex-display" data-tex="${encodeDataAttr(token.content)}"></p>`
    }

    if (lang === 'mermaid') {
      return `<div class="emd-mermaid" data-emd-mermaid-src="${encodeDataAttr(token.content)}"></div>`
    }

    if (lang === 'mindmap' || info.startsWith('mindmap>')) {
      // mindmap>400px 语法指定高度（对齐原版 mindmap>HEIGHT）
      const height = info.startsWith('mindmap>') ? info.slice('mindmap>'.length).trim() : ''
      const style = /^[\d.]+(px|em|rem|vh|%)$/.test(height) ? ` style="height:${height}"` : ''
      return `<div class="emd-mindmap markmap"${style} data-emd-mindmap-src="${encodeDataAttr(token.content)}"></div>`
    }

    return defaultFence(tokens, idx, options, env, self)
  }
}
