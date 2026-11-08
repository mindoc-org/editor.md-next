/** markdown-it 渲染引擎：装配扩展插件 + DOMPurify 消毒。 */
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import type { MarkdownIt as MarkdownItInstance } from 'markdown-it'
import { emojiPlugin } from './plugin-emoji'
import { fencePlugin } from './plugin-fence'
import { miscPlugin } from './plugin-misc'
import { taskListPlugin } from './plugin-tasks'
import { texPlugin } from './plugin-tex'
import { tocPlugin } from './plugin-toc'
import type { TocItem } from './plugin-toc'
import { highlightCode } from './highlight'
import type { MarkdownConfig } from '../types/settings'

export interface RenderResult {
  html: string
  toc: TocItem[]
}

export interface EngineOptions {
  codeHighlight: boolean
}

export class MarkdownEngine {
  readonly md: MarkdownItInstance
  private readonly sanitize: boolean

  constructor(config: MarkdownConfig, options: EngineOptions) {
    this.sanitize = config.sanitize
    this.md = new MarkdownIt({
      // htmlDecode=false 时原生 HTML 会被转义显示，而不是执行
      html: config.htmlDecode,
      breaks: true,
      linkify: true,
      typographer: true,
      highlight: options.codeHighlight
        ? (code, lang) => highlightCode(code, lang)
        : undefined,
    })

    tocPlugin(this.md)
    if (config.taskList) taskListPlugin(this.md)
    if (config.emoji) {
      emojiPlugin(this.md, {
        githubPath: config.emojiGithubPath,
        twemojiPath: config.emojiTwemojiPath,
        emojiMode: config.emojiMode,
      })
    }
    if (config.tex) texPlugin(this.md)
    if (config.mermaid || config.mindmap || config.tex) fencePlugin(this.md)
    miscPlugin(this.md, {
      callouts: config.callouts,
      atLink: config.atLink,
      emailLink: config.emailLink,
      pageBreak: config.pageBreak,
    })

    for (const plugin of config.use) {
      this.md.use(plugin)
    }
  }

  /** 渲染 markdown → { html, toc }（html 已消毒） */
  render(markdown: string): RenderResult {
    const env: Record<string, unknown> = {}
    let html = this.md.render(markdown, env)
    const toc = ((env['emdToc'] as { tocItems?: TocItem[] } | undefined)?.tocItems ?? []) as TocItem[]
    if (this.sanitize) {
      // 图表/公式的源文本走 base64 data 属性（SAFE_FOR_XML 不会剥），data-* 默认放行
      html = DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'align', 'width', 'height', 'disabled'],
      })
    }
    return { html, toc }
  }
}
