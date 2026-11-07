/** markdown-it 渲染引擎 + DOMPurify 消毒。P3 在此基础上装配扩展插件。 */
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import type { MarkdownIt as MarkdownItInstance } from 'markdown-it'
import type { MarkdownConfig } from '../types/settings'

export class MarkdownEngine {
  readonly md: MarkdownItInstance
  private readonly sanitize: boolean

  constructor(config: MarkdownConfig) {
    this.sanitize = config.sanitize
    this.md = new MarkdownIt({
      // htmlDecode=false 时原生 HTML 会被转义显示，而不是执行
      html: config.htmlDecode,
      breaks: true,
      linkify: true,
      typographer: true,
    })
    for (const plugin of config.use) {
      this.md.use(plugin)
    }
  }

  /** 渲染 markdown → HTML（含消毒） */
  render(markdown: string): string {
    let html = this.md.render(markdown)
    if (this.sanitize) {
      html = DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'align', 'width', 'height'],
      })
    }
    return html
  }
}
