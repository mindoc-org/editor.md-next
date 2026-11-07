import { EditorMD } from 'editor.md-next'

const SAMPLE = `# editor.md-next

[TOC]

TypeScript + CodeMirror 6 重写的 Markdown 编辑器。

## 基础语法

**粗体** *斜体* ~~删除线~~ \`行内代码\` :smile: :fa-star: :+1:

- 列表项一
- 列表项二
  - 嵌套项

- [ ] 未完成任务
- [x] 已完成任务

> [info] 提示信息
> 这是一个 callout 引用块。

> [warning] 警告信息
> 注意这里。

@pandao 和 hello@example.com 自动链接，[链接](https://github.com) 外链新窗口。

## 代码

\`\`\`ts
const hello: string = 'world'
\`\`\`

\`\`\`mermaid
graph LR
  A[编辑] --> B[渲染]
  B --> C[预览]
\`\`\`

## 数学公式

行内公式 $$E = mc^2$$ 与独立公式：

$$\\int_0^\\infty e^{-x} dx = 1$$

## 其他

| 表头 A | 表头 B |
| ------ | ------ |
| 内容 1 | 内容 2 |

[========]
`
const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="page">
    <h1>editor.md-next <small>P3 渲染扩展</small></h1>
    <div id="editor"></div>
    <p class="tip">TOC / emoji / callout / mermaid / KaTeX / task list 全部启用。</p>
  </div>
`

const editor = new EditorMD('#editor', {
  value: SAMPLE,
  width: '100%',
  height: 560,
  watch: true,
  markdown: {
    tex: true,
  },
})

console.log('[demo] editor ready', { version: 'P2', markdown: editor.getMarkdown().length })
// 便于调试与自动化测试
declare global {
  interface Window {
    __editor: EditorMD
  }
}
window.__editor = editor
