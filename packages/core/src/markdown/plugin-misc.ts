/**
 * 杂项渲染扩展：callouts、atLink/emailLink、pageBreak、图片 size/align、链接安全。
 * 全部以 core 规则 / renderer 覆盖实现，可独立开关。
 */
import { escapeHtml } from '@editormd-next/utils'
import type { MarkdownIt, StateCore, Token } from 'markdown-it'

export interface MiscPluginOptions {
  callouts: boolean
  atLink: boolean
  emailLink: boolean
  pageBreak: boolean
}

const CALLOUT_RE = /^\[(info|warning|success|danger)\]\s*/i
const PAGE_BREAK_RE = /^\[={8,}\]$/
const EMAIL_RE = /[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+/g

/** 将 text token 按 match 切分为多个 token 的辅助（用于 atLink/emailLink） */
function splitTextIntoLinks(
  state: StateCore,
  token: Token,
  regex: RegExp,
  buildLink: (match: RegExpExecArray, content: string) => { href: string; text: string; className?: string } | null,
): void {
  if (!token.children) return
  const newChildren: Token[] = []
  for (const child of token.children) {
    if (child.type !== 'text') {
      newChildren.push(child)
      continue
    }
    let lastIndex = 0
    regex.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(child.content)) !== null) {
      // 防呆：零长匹配会导致死循环，直接中断
      if (match[0].length === 0) break
      const link = buildLink(match, child.content)
      if (!link) continue
      if (match.index > lastIndex) {
        newChildren.push(textToken(state, child.content.slice(lastIndex, match.index)))
      }
      const open = new state.Token('link_open', 'a', 1)
      open.attrs = [['href', link.href]]
      if (link.className) open.attrSet('class', link.className)
      newChildren.push(open)
      newChildren.push(textToken(state, link.text))
      newChildren.push(new state.Token('link_close', 'a', -1))
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < child.content.length) {
      newChildren.push(textToken(state, child.content.slice(lastIndex)))
    }
  }
  token.children = newChildren
}

function textToken(state: StateCore, content: string): Token {
  const token = new state.Token('text', '', 0)
  token.content = content
  return token
}

export function miscPlugin(md: MarkdownIt, options: MiscPluginOptions): void {
  if (options.callouts) {
    md.core.ruler.push('emd_callouts', (state: StateCore) => {
      const tokens = state.tokens
      for (let i = 0; i < tokens.length; i++) {
        const open = tokens[i]!
        if (open.type !== 'blockquote_open') continue
        // 结构：blockquote_open, paragraph_open, inline, ...
        const inline = tokens[i + 2]
        if (inline?.type !== 'inline') continue
        const match = CALLOUT_RE.exec(inline.content)
        if (!match) continue
        const kind = match[1]!.toLowerCase()
        open.attrJoin('class', `emd-callout emd-callout-${kind}`)
        const firstText = inline.children?.[0]
        if (firstText?.type === 'text') {
          firstText.content = firstText.content.replace(CALLOUT_RE, '')
        }
      }
    })
  }

  if (options.atLink || options.emailLink) {
    md.core.ruler.push('emd_atlink', (state: StateCore) => {
      for (const token of state.tokens) {
        if (token.type !== 'inline') continue
        if (options.atLink) {
          splitTextIntoLinks(state, token, /@(\w{1,39})/g, (m, content) => {
            // 前一个字符是单词字符/点/横线/@ 时视为邮箱局部，跳过
            const prev = m.index > 0 ? content[m.index - 1]! : ''
            if (/[\w.\-@]/.test(prev)) return null
            return { href: `https://github.com/${m[1]}`, text: m[0], className: 'emd-at-link' }
          })
        }
        if (options.emailLink) {
          splitTextIntoLinks(state, token, EMAIL_RE, (m) => ({
            href: `mailto:${m[0]}`,
            text: m[0],
          }))
        }
      }
    })
  }

  if (options.pageBreak) {
    md.core.ruler.push('emd_pagebreak', (state: StateCore) => {
      const tokens = state.tokens
      for (let i = 0; i < tokens.length; i++) {
        const inline = tokens[i]!
        if (inline.type !== 'inline' || !PAGE_BREAK_RE.test(inline.content.trim())) continue
        if (tokens[i - 1]?.type !== 'paragraph_open') continue
        const br = new state.Token('emd_pagebreak', 'hr', 0)
        tokens.splice(i - 1, 3, br)
        i--
      }
    })
    md.renderer.rules['emd_pagebreak'] = () => '<hr class="emd-page-break">'
  }

  // 图片 size/align：![alt](url#size=100x80#align=center)
  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx]!
    let src = String(token.attrGet('src') ?? '')
    let width: string | null = null
    let height: string | null = null
    let align: string | null = null

    src = src.replace(/#size=(\d+)x(\d+)/i, (_m: string, w: string, h: string) => {
      width = w
      height = h
      return ''
    })
    src = src.replace(/#align=(left|center|right)/i, (_m: string, a: string) => {
      align = a.toLowerCase()
      return ''
    })
    token.attrSet('src', src)
    if (width) token.attrSet('width', width)
    if (height) token.attrSet('height', height)
    if (align) token.attrSet('class', `emd-img-${align}`)

    const alt = escapeHtml(token.content)
    const attrs = (token.attrs ?? [])
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('')
    return `<img${attrs} alt="${alt}">`
  }

  // 链接安全：拦截 javascript:，外链新窗口打开
  const defaultLinkOpen = md.renderer.rules['link_open']
  md.renderer.rules['link_open'] = (tokens, idx, opts, env, self) => {
    const token = tokens[idx]!
    const href = String(token.attrGet('href') ?? '')
    if (/^\s*javascript:/i.test(href)) {
      token.attrSet('href', '#')
    } else if (/^https?:\/\//i.test(href)) {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
    }
    return defaultLinkOpen ? defaultLinkOpen(tokens, idx, opts, env, self) : self.renderToken(tokens, idx, opts)
  }
}
