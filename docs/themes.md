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

## ⚠️ 自定义主题的层叠约束（重要）

CM6 的 `drawSelection()` 把选区高亮画在一个 `z-index: -2` 的图层里（位于行背景之下），并且会把原生 `::selection` 强制设为透明。因此：

**编辑区内任何不透明的行/元素背景都会把选区高亮完全盖住**——症状是"选区功能正常（Ctrl+X 可剪切）但视觉上看不到高亮"，极易误判为 CM6 配置问题。

规则：

1. 自定义主题中 `.cm-activeLine`、`.cm-line` 等行背景**必须使用半透明色**（内置主题用 `rgba(9,105,218,0.04)` / `rgba(255,255,255,0.055)`，视觉上与常见不透明色等价）。
2. 搜索匹配高亮（`.cm-searchMatch` 等）同理保持半透明。
3. 若给 `.cm-editor` 根元素设置不透明背景，根元素需形成层叠上下文（`position: relative; z-index: 0`），否则连选区层都会被根背景盖住。

完整根因分析见仓库 `ai-docs/bugfix-cm6-selection-invisible.md`（三层遮挡物模型 + 像素级验证方法）。

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
