# 快速上手

## 安装（npm，推荐）

```bash
pnpm add editor.md-next
```

```ts
import { EditorMD } from 'editor.md-next'
import 'editor.md-next/css'

const editor = new EditorMD('#editor', {
  value: '# Hello\n\n开始编辑…',
  width: '100%',
  height: 520,
  watch: true,
})
```

包产物自包含（CodeMirror 6 / markdown-it / highlight.js / DOMPurify 已打包），KaTeX、mermaid、markmap 等重依赖按需从 CDN 懒加载（可配置，见 [configuration.md](configuration.md#cnd)）。

## 安装（CDN）

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/editor.md-next/dist/index.css">
<div id="editor" style="height: 480px"></div>
<script src="https://cdn.jsdelivr.net/npm/editor.md-next/dist/cdn/editormd-next.min.js"></script>
<script>
  const editor = new editormd.EditorMD('#editor', {
    value: '# Hello\n\n开始编辑…',
  })
</script>
```

CDN 产物为全局命名空间 `editormd`，包含 `EditorMD`、`renderTo`、`defaults`、`VERSION`。

也可使用 UMD 格式（CommonJS require）：

```js
const { EditorMD } = require('editor.md-next')
```

## 静态渲染（不需要编辑器）

```ts
import { renderTo } from 'editor.md-next'
import 'editor.md-next/css'

renderTo('#doc', { value: '# 只读文档\n\n- 渲染为 HTML\n' })
// 或 EditorMD.renderTo('#doc', {...})，替代原版 editormd.markdownToHTML
```

## 常用配置速览

```ts
const editor = new EditorMD('#editor', {
  value: '',
  width: '100%',
  height: 520,
  watch: true,               // 实时预览分屏
  placeholder: '开始书写…',
  i18n: 'zh-cn',
  editor:  { theme: 'default', fontSize: '14px', lineNumbers: true },
  preview: { theme: 'default', syncScroll: true, delay: 300 },
  toolbar: { enable: true, spec: 'full', autoFixed: true },
  markdown:{ toc: true, emoji: true, tex: false, mermaid: true },
  upload:  { image: false, url: '', formats: ['jpg', 'png', 'webp'] },
})
```

完整配置见 [configuration.md](configuration.md)。

## 部署示例站（GitHub Pages）

```bash
pnpm demo:build     # 产出 packages/demo/dist（相对路径，可直接托管）
pnpm deploy:pages   # 推送到 gh-pages 分支（需安装 gh-pages 依赖并配置仓库）
```
