/** 示例共用的 markdown 样例。 */

export const BASIC_SAMPLE = `# editor.md-next

TypeScript + CodeMirror 6 重写的 Markdown 编辑器。

## 文本样式

**粗体** *斜体* ~~删除线~~ \`行内代码\` [链接](https://github.com)

## 列表

- 无序项一
- 无序项二
  - 嵌套项

1. 有序项一
2. 有序项二

## 引用

> 这是一段引用文字。

## 表格

| 功能 | 状态 |
| ---- | ---- |
| 实时预览 | ✅ |
| 同步滚动 | ✅ |

## 代码

\`\`\`ts
const editor = new EditorMD('#editor', { watch: true })
\`\`\`
`

export const DIAGRAM_SAMPLE = `## mermaid 流程图

\`\`\`mermaid
graph LR
  A[编写 Markdown] --> B[CodeMirror 6]
  B --> C{markdown-it 渲染}
  C --> D[实时预览]
\`\`\`

## mermaid 时序图

\`\`\`mermaid
sequenceDiagram
  用户->>编辑器: 输入内容
  编辑器->>渲染引擎: 防抖 300ms
  渲染引擎->>预览区: 更新 HTML
\`\`\`

## mindmap 脑图

\`\`\`mindmap>360px
# editor.md-next
## 编辑器
- CodeMirror 6
- GFM 语法
## 渲染
- markdown-it
- KaTeX / mermaid
## 交付
- npm ESM
- CDN IIFE
\`\`\`
`

export const TEX_SAMPLE = `## 行内公式

质能方程 $$E = mc^2$$ 是物理学中最著名的公式之一。

## 独立公式

$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

## math 围栏

\`\`\`math
\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}
\`\`\`
`
