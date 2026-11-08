/**
 * 数学公式插件（KaTeX 渲染钩子）。
 * - 行内：段落中的 `$$..$$` → span.emd-tex（行内模式）
 * - 独行：整段只有一个 `$$..$$` → p.emd-tex-display（显示模式）
 * - 围栏：```math / ```latex / ```katex → p.emd-tex-display（见 plugin-fence）
 * 实际渲染由 cdn-lazy 在 post-render 阶段执行（data-tex 存 base64 原文）。
 */
import { encodeDataAttr } from './data-attr'
import type { MarkdownIt, StateCore, Token } from 'markdown-it'

const TEX_SPAN_RE = /\$\$([\s\S]+?)\$\$/g

export function texPlugin(md: MarkdownIt): void {
  md.core.ruler.push('emd_tex', (state: StateCore) => {
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i]!
      if (token.type !== 'inline' || !token.children) continue
      if (!token.content.includes('$$')) continue
      const displayOnly = /^\s*\$\$[\s\S]+?\$\$\s*$/.test(token.content) && token.children.length <= 2

      const newChildren: Token[] = []
      for (const child of token.children) {
        if (child.type !== 'text' || !child.content.includes('$$')) {
          newChildren.push(child)
          continue
        }
        let lastIndex = 0
        TEX_SPAN_RE.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = TEX_SPAN_RE.exec(child.content)) !== null) {
          if (match.index > lastIndex) {
            newChildren.push(textToken(state, child.content.slice(lastIndex, match.index)))
          }
          const tex = new state.Token('emd_tex', 'span', 0)
          tex.meta = { tex: match[1]!, display: displayOnly }
          newChildren.push(tex)
          lastIndex = match.index + match[0].length
        }
        if (lastIndex < child.content.length) {
          newChildren.push(textToken(state, child.content.slice(lastIndex)))
        }
      }
      token.children = newChildren
    }
  })

  md.renderer.rules['emd_tex'] = (tokens, idx) => {
    const { tex, display } = tokens[idx]!.meta as { tex: string; display: boolean }
    const encoded = encodeDataAttr(tex)
    if (display) {
      return `<p class="emd-tex-display" data-tex="${encoded}"></p>`
    }
    return `<span class="emd-tex" data-tex="${encoded}"></span>`
  }
}

function textToken(state: StateCore, content: string): Token {
  const token = new state.Token('text', '', 0)
  token.content = content
  return token
}
