/**
 * [TOC] / [TOCM] 目录插件 + 标题锚点。
 * - core 规则在块解析后收集标题（生成 slug 并设置 id），渲染 [TOC]/[TOCM] 占位符；
 * - 真正的目录 DOM 在 post-render 阶段填充（见 preview/toc.ts）。
 */
import { Slugger } from '@editormd-next/utils'
import type { MarkdownIt, StateCore, Token } from 'markdown-it'

export interface TocItem {
  text: string
  level: number
  slug: string
}

export interface TocEnv {
  slugger: Slugger
  tocItems: TocItem[]
}

function getTocEnv(env: Record<string, unknown>): TocEnv {
  if (!env['emdToc']) {
    env['emdToc'] = { slugger: new Slugger(), tocItems: [] } satisfies TocEnv
  }
  return env['emdToc'] as TocEnv
}

/** 提取 inline token 中的纯文本（跳过格式标记） */
function plainText(token: Token): string {
  if (!token.children) return token.content
  let out = ''
  for (const child of token.children) {
    if (child.type === 'text' || child.type === 'code_inline') out += child.content
  }
  return out
}

export function tocPlugin(md: MarkdownIt): void {
  // 收集标题：heading_open + 相邻 inline → slug + id + toc 项
  md.core.ruler.push('emd_toc_collect', (state: StateCore) => {
    const tocEnv = getTocEnv(state.env)
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!
      if (token.type !== 'heading_open') continue
      const level = Number.parseInt(token.tag.slice(1), 10)
      const inline = tokens[i + 1]
      if (!inline) continue
      const text = plainText(inline).trim()
      const slug = tocEnv.slugger.slug(text || 'heading')
      token.attrSet('id', slug)
      tocEnv.tocItems.push({ text, level, slug })
    }
  })

  // [TOC] / [TOCM] 占位符
  md.core.ruler.push('emd_toc_placeholder', (state: StateCore) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!
      if (token.type !== 'inline') continue
      const content = token.content.trim()
      const isToc = content === '[TOC]'
      const isTocm = content === '[TOCM]'
      if (!isToc && !isTocm) continue
      // 要求其位于独立段落中：前一个 token 是 paragraph_open
      const parent = tokens[i - 1]
      if (parent?.type !== 'paragraph_open') continue
      const placeholder = new state.Token('emd_toc', 'div', 0)
      placeholder.meta = { dropdown: isTocm }
      // 替换 [ paragraph_open, inline, paragraph_close ] 三元组
      tokens.splice(i - 1, 3, placeholder)
      i--
    }
  })

  md.renderer.rules['emd_toc'] = (tokens, idx) => {
    const dropdown = (tokens[idx]!.meta as { dropdown?: boolean } | undefined)?.dropdown === true
    return dropdown
      ? '<div class="emd-toc emd-toc-menu" data-emd-toc="dropdown"></div>'
      : '<div class="emd-toc emd-markdown-toc" data-emd-toc="list"></div>'
  }
}
