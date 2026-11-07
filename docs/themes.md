# 主题

## 编辑区主题（CodeMirror）

```ts
editor.setEditorTheme('dark')   // 内置：'default' | 'dark'
editor.setEditorTheme(myCm6Theme)  // 或注入 CM6 主题扩展
```

内置主题基于 `EditorView.theme` + `HighlightStyle` 实现（浅色 GitHub 风格 / 深色 GitHub Dark 风格）。自定义：

```ts
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

const myTheme = EditorView.theme({ '&': { backgroundColor: '#faf4ed' } }, { dark: false })
const myHighlight = HighlightStyle.define([{ tag: t.heading, color: '#eb6cac' }])

new EditorMD('#editor', {
  editor: { theme: [myTheme, syntaxHighlighting(myHighlight)] },
})
```

> 与原版差异：CM5 时代的 31 个 editorTheme（monokai 等）不随包迁移。可自行引入 [@uiw/codemirror-themes](https://www.npmjs.com/package/@uiw/codemirror-themes) 的主题扩展注入。

## 预览区主题

```ts
editor.setPreviewTheme('dark')   // 'default' | 'dark'
```

预览主题通过根元素 `data-emd-preview-theme` 属性驱动 CSS 变量。

## 一键切换

工具栏 `changetheme` 按钮（或 `editor.toggleTheme()`）同时切换编辑区与预览区浅/深。

## CSS 变量

容器上的主题变量可被宿主页面覆写：

```css
.editormd-next {
  --emd-border: #cbd5e1;
  --emd-toolbar-bg: #f1f5f9;
  --emd-accent: #2563eb;
  --emd-code-bg: #f8fafc;
}
```
