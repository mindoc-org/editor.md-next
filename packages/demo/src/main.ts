import { EditorMD } from 'editor.md-next'

const SAMPLE = `# editor.md-next

TypeScript + CodeMirror 6 重写的 Markdown 编辑器。

## 基础语法

**粗体** *斜体* ~~删除线~~ \`行内代码\`

- 列表项一
- 列表项二
  - 嵌套项

> 引用块

\`\`\`ts
const hello: string = 'world'
\`\`\`

| 表头 A | 表头 B |
| ------ | ------ |
| 内容 1 | 内容 2 |

[链接](https://github.com) 与 https://example.com 自动识别。
`

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="page">
    <h1>editor.md-next <small>P2 MVP</small></h1>
    <div id="editor"></div>
    <p class="tip">左侧编辑，右侧实时预览。</p>
  </div>
`

const editor = new EditorMD('#editor', {
  value: SAMPLE,
  width: '100%',
  height: 560,
  watch: true,
})

console.log('[demo] editor ready', { version: 'P2', markdown: editor.getMarkdown().length })
// 便于调试与自动化测试
declare global {
  interface Window {
    __editor: EditorMD
  }
}
window.__editor = editor
