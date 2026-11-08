import { describe, expect, it } from 'vitest'
import { MarkdownEngine } from './engine'
import { decodeDataAttr } from './data-attr'
import { defaults } from '../defaults'
import type { MarkdownConfig } from '../types/settings'

function createEngine(patch: Partial<MarkdownConfig> = {}): MarkdownEngine {
  return new MarkdownEngine({ ...defaults.markdown, ...patch }, { codeHighlight: true })
}

describe('MarkdownEngine', () => {
  it('基础 GFM：标题/列表/表格', () => {
    const { html } = createEngine().render('# 标题\n\n- a\n- b\n\n| a | b |\n| - | - |\n| 1 | 2 |')
    expect(html).toContain('<h1')
    expect(html).toContain('<ul>')
    expect(html).toContain('<table>')
  })

  it('标题锚点与 TOC 收集（Slugger 去重）', () => {
    const { html, toc } = createEngine().render('## 第一章\n\n## 第一章\n\n内容')
    expect(html).toContain('id=')
    expect(toc).toHaveLength(2)
    expect(toc[0]!.slug).not.toBe(toc[1]!.slug)
  })

  it('[TOC] 占位符', () => {
    const { html } = createEngine().render('[TOC]\n\n# A\n\n## B')
    expect(html).toContain('data-emd-toc')
  })

  it('任务列表复选框', () => {
    const { html } = createEngine().render('- [ ] 待办\n- [x] 完成')
    expect(html).toContain('emd-task-checkbox')
    expect(html).toContain('checked')
  })

  it('callouts', () => {
    const { html } = createEngine().render('> [info] 提示\n> 内容')
    expect(html).toContain('emd-callout-info')
    expect(html).not.toContain('[info]')
  })

  it('pageBreak', () => {
    const { html } = createEngine().render('上\n\n[========]\n\n下')
    expect(html).toContain('emd-page-break')
  })

  it('atLink 与 emailLink', () => {
    const { html } = createEngine().render('hi @user and mail@example.com')
    expect(html).toContain('href="https://github.com/user"')
    expect(html).toContain('mailto:mail@example.com')
  })

  it('emoji：github 图片与 fa 图标', () => {
    const { html } = createEngine().render(':smile: :fa-star:')
    expect(html).toContain('<img class="emd-emoji"')
    expect(html).toContain('fa-star')
  })

  it('tex 钩子（data-tex base64 占位，含 --> 也不丢）', () => {
    const { html } = createEngine({ tex: true }).render('行内 $$E=mc^2 \\to A --> B$$ 公式')
    expect(html).toContain('emd-tex')
    const m = /data-tex="([^"]+)"/.exec(html)!
    expect(decodeDataAttr(m[1]!)).toContain('A --> B')
  })

  it('mermaid / mindmap 占位（base64 data 属性，含 --> 也不丢）', () => {
    const { html } = createEngine().render('```mermaid\ngraph LR\n  A --> B\n```\n\n```mindmap\n# root\n```')
    const mermaidSrc = decodeDataAttr(/data-emd-mermaid-src="([^"]+)"/.exec(html)![1]!)
    expect(mermaidSrc).toContain('A --> B')
    const mindmapSrc = decodeDataAttr(/data-emd-mindmap-src="([^"]+)"/.exec(html)![1]!)
    expect(mindmapSrc).toContain('# root')
  })

  it('链接安全：javascript: 不成链（markdown-it 解析层拒绝）+ 外链 _blank', () => {
    const { html } = createEngine().render('[a](javascript:alert(1)) [b](https://x.com)')
    expect(html).not.toContain('href="javascript:')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('图片 #size/#align', () => {
    const { html } = createEngine().render('![](https://x/a.png#size=100x50#align=center)')
    expect(html).toContain('width="100"')
    expect(html).toContain('emd-img-center')
  })

  it('sanitize：脚本被清除', () => {
    const { html } = createEngine({ htmlDecode: true }).render('hello <script>alert(1)</script>')
    expect(html).not.toContain('<script>')
  })

  it('htmlDecode=false 时 HTML 转义显示', () => {
    const { html } = createEngine().render('hello <b>bold</b>')
    expect(html).toContain('&lt;b&gt;')
  })

  it('highlight 回调产出 hljs span', () => {
    const { html } = createEngine().render('```js\nconst a = 1\n```')
    expect(html).toContain('hljs')
  })
})
