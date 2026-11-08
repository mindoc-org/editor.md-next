/**
 * Emoji 插件：`:name:`（github 图片）、`:tw-code:`（twemoji）、
 * `:fa-name:`（FontAwesome 图标）、`:editormd-logo(-Nx)?:`（logo 字体）。
 * 时间格式 hh:mm:ss 豁免（与原版一致）。
 */
import { EMOJI_UNICODE } from './data/emoji-unicode'
import type { MarkdownIt, StateCore, Token } from 'markdown-it'

export interface EmojiPluginOptions {
  githubPath: string
  twemojiPath: string
}

/** 与原版一致的特殊名映射 */
const NAME_ALIASES: Record<string, string> = {
  '+1': 'plus1',
  black_large_square: 'black_square',
  moon: 'waxing_gibbous_moon',
}

const DATETIME_RE = /\d{1,2}:\d{1,2}:\d{1,2}/g
const EMOJI_RE = /:(tw-[\w-]+|fa-[\w-]+|editormd-logo(?:-\dx)?|[\w+-]+):/g

type EmojiKind = 'github' | 'twemoji' | 'fa' | 'logo'

function classify(name: string): { kind: EmojiKind; name: string; raw: string } | null {
  if (name.startsWith('tw-')) return { kind: 'twemoji', name: name.slice(3), raw: name }
  if (name.startsWith('fa-')) return { kind: 'fa', name: name.slice(3), raw: name }
  if (name === 'editormd-logo' || /^editormd-logo-\dx$/.test(name)) return { kind: 'logo', name, raw: name }
  return { kind: 'github', name: NAME_ALIASES[name] ?? name, raw: name }
}

/** github 图片地址：有 unicode 码点的走 unicode 路径（别名齐全），GitHub 专属 emoji 走名字路径 */
export function githubEmojiSrc(path: string, name: string, raw: string = name): string {
  const codepoint = EMOJI_UNICODE[raw] ?? EMOJI_UNICODE[name]
  return `${path}${codepoint ? `unicode/${codepoint}` : name}.png`
}

export function emojiPlugin(md: MarkdownIt, options: EmojiPluginOptions): void {
  md.core.ruler.push('emd_emoji', (state: StateCore) => {
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue
      const newChildren: Token[] = []
      for (const child of token.children) {
        if (child.type !== 'text') {
          newChildren.push(child)
          continue
        }
        // 时间格式 hh:mm:ss 豁免：先遮蔽时间片段再扫描，输出时还原
        const times: string[] = []
        const masked = child.content.replace(DATETIME_RE, (m) => {
          times.push(m)
          return '\u0000'.repeat(m.length)
        })
        const restore = (text: string): string =>
          times.length === 0 ? text : text.replace(/\u0000+/g, () => times.shift() ?? '')

        let lastIndex = 0
        EMOJI_RE.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = EMOJI_RE.exec(masked)) !== null) {
          const parsed = classify(match[1]!)
          if (!parsed) continue
          if (match.index > lastIndex) {
            newChildren.push(textToken(state, restore(masked.slice(lastIndex, match.index))))
          }
          const emoji = new state.Token('emd_emoji', 'span', 0)
          emoji.meta = parsed
          newChildren.push(emoji)
          lastIndex = match.index + match[0].length
        }
        if (lastIndex < masked.length) {
          newChildren.push(textToken(state, restore(masked.slice(lastIndex))))
        }
      }
      token.children = newChildren
    }
  })

  md.renderer.rules['emd_emoji'] = (tokens, idx) => {
    const { kind, name, raw } = tokens[idx]!.meta as { kind: EmojiKind; name: string; raw: string }
    switch (kind) {
      case 'github':
        return `<img class="emd-emoji" src="${githubEmojiSrc(options.githubPath, name, raw)}" alt=":${raw}:" title=":${raw}:" height="20" width="20" align="absmiddle">`
      case 'twemoji':
        return `<img class="emd-emoji" src="${options.twemojiPath}${name}.png" alt=":${raw}:" title=":${raw}:" height="20" width="20" align="absmiddle">`
      case 'fa':
        return `<i class="fa fa-${name}" title=":${raw}:"></i>`
      case 'logo':
        return `<i class="editormd-logo ${name}" title=":${raw}:"></i>`
    }
  }
}

function textToken(state: StateCore, content: string): Token {
  const token = new state.Token('text', '', 0)
  token.content = content
  return token
}
