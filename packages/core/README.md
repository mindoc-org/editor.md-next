# editor.md-next

> [Editor.md](https://github.com/pandao/editor.md) 的 TypeScript 重写版 —— 基于 CodeMirror 6 与 markdown-it 的现代 Markdown 编辑器。

[![npm version](https://img.shields.io/npm/v/editor.md-next)](https://www.npmjs.com/package/editor.md-next)
[![npm downloads](https://img.shields.io/npm/dm/editor.md-next)](https://www.npmjs.com/package/editor.md-next)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mindoc-org/editor.md-next/blob/main/LICENSE)

全 TypeScript、无 jQuery；CodeMirror 6（GFM）+ markdown-it 渲染 + DOMPurify 消毒；工具栏三模式、11 个对话框、快捷键、TOC/emoji/KaTeX/mermaid/markmap/任务列表/分页、图片上传、深浅主题、i18n。

## 安装

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
})
```

CDN 方式（全局 `editormd` 命名空间）：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/editor.md-next/dist/index.css">
<div id="editor" style="height: 480px"></div>
<script src="https://cdn.jsdelivr.net/npm/editor.md-next/dist/cdn/editormd-next.min.js"></script>
<script>
  new editormd.EditorMD('#editor', { value: '# Hello' })
</script>
```

## 特性

- **产物自包含**：ESM + UMD + CDN IIFE + `*.d.ts` + CSS；KaTeX / mermaid / markmap 按需 CDN 懒加载
- **编辑器**：CodeMirror 6（GFM）、工具栏三模式 + 下拉组、11 个对话框、30+ 快捷键、搜索面板
- **渲染扩展**：[TOC]/[TOCM]、四类 emoji、KaTeX 公式、mermaid 图表、markmap 脑图、callouts、分页符、图片尺寸对齐
- **其他**：同步滚动、全窗口预览、全屏、图片上传（兼容原版服务端协议）+ 粘贴/拖拽、深浅主题、i18n（zh-cn/en/zh-tw）

## 文档

完整文档见 GitHub 仓库 [`docs/`](https://github.com/mindoc-org/editor.md-next/tree/main/docs) 目录：[快速上手](https://github.com/mindoc-org/editor.md-next/blob/main/docs/getting-started.md) · [配置项](https://github.com/mindoc-org/editor.md-next/blob/main/docs/configuration.md) · [API](https://github.com/mindoc-org/editor.md-next/blob/main/docs/api.md) · [扩展语法](https://github.com/mindoc-org/editor.md-next/blob/main/docs/markdown-extensions.md)。

配套适配包：[`editor.md-next-vue`](https://www.npmjs.com/package/editor.md-next-vue) · [`editor.md-next-react`](https://www.npmjs.com/package/editor.md-next-react)

## License

[MIT](https://github.com/mindoc-org/editor.md-next/blob/main/LICENSE) © mindoc-org and editor.md-next contributors。基于 [editor.md](https://github.com/pandao/editor.md)（MIT © pandao）的功能重写。
