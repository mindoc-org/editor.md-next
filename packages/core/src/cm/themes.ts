/**
 * CM6 编辑区主题：内置 default / dark，支持注入自定义主题扩展。
 *
 * 层叠约束（勿改回不透明色）：drawSelection() 的 .cm-selectionLayer 为
 * z-index:-2，绘制在 .cm-content 的块级行背景之下；同时 drawSelection 会把
 * 原生 ::selection 强制设为 transparent。因此编辑区内任何不透明行背景
 * （尤其 .cm-activeLine）都会把选区高亮完全盖住——选区逻辑正常但视觉不可见。
 * CM6 官方默认同样使用半透明活动行背景（light: #cceeff44 / dark: #99eeff33）。
 * 自定义主题注入时也必须保证行背景半透明。
 */
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import type { ThemeName } from '../types/common'

/**
 * 行/匹配背景色必须保持半透明（alpha < 1）：drawSelection 的选区层是
 * z-index:-2 后代，任何不透明行背景都会把它完全盖住（选区可用但不可见）。
 * 见 ai-docs/bugfix-cm6-selection-invisible.md；单测 themes.test.ts 守护此约束。
 */
export const THEME_BG = {
  light: {
    activeLine: 'rgba(9, 105, 218, 0.04)',
    searchMatch: 'rgba(212, 167, 44, 0.22)',
  },
  dark: {
    activeLine: 'rgba(255, 255, 255, 0.055)',
    searchMatch: 'rgba(212, 167, 44, 0.25)',
  },
} as const

const lightTheme = EditorView.theme({
  // position+zIndex 让根元素形成层叠上下文：选区绘制层（z-index:-2）必须画在
  // 根背景之上，否则白色背景会把选区高亮完全盖住（选区功能正常但不可见）
  '&': { color: '#24292f', backgroundColor: '#ffffff', position: 'relative', zIndex: 0 },
  '.cm-content': { caretColor: '#0969da' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#0969da' },
  // 聚焦态选择器特异度必须 ≥ CM 默认主题的同位规则（否则我们的颜色被 #d7d4f0 压掉）
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: '#b4d5fe',
  },
  '.cm-selectionBackground': { backgroundColor: '#b4d5fe' },
  '.cm-content ::selection': { backgroundColor: '#b4d5fe' },
  // 白底上视觉等价于 #f6f8fa，但半透明可让下层选区蓝 #b4d5fe 透出
  '.cm-activeLine': { backgroundColor: THEME_BG.light.activeLine },
  '.cm-gutters': { backgroundColor: '#ffffff', color: '#8c959f', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: '#f6f8fa', color: '#24292f' },
  '.cm-selectionMatch': { backgroundColor: '#fae17d80' },
  // 半透明（勿改回不透明色）：与 .cm-activeLine 同理，避免遮挡选区层
  '.cm-searchMatch': { backgroundColor: THEME_BG.light.searchMatch, outline: '1px solid #d4a72c66' },
})

const darkTheme = EditorView.theme(
  {
    '&': { color: '#c9d1d9', backgroundColor: '#1e2127', position: 'relative', zIndex: 0 },
    '.cm-content': { caretColor: '#58a6ff' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#58a6ff' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: '#314262',
    },
    '.cm-selectionBackground': { backgroundColor: '#314262' },
    '.cm-content ::selection': { backgroundColor: '#314262' },
    // 深色底上视觉等价于 #2a2e37，同样保持半透明以免遮挡选区
    '.cm-activeLine': { backgroundColor: THEME_BG.dark.activeLine },
    '.cm-gutters': { backgroundColor: '#1e2127', color: '#6e7681', border: 'none' },
    '.cm-activeLineGutter': { backgroundColor: '#2a2e37', color: '#c9d1d9' },
    '.cm-selectionMatch': { backgroundColor: '#63533480' },
    '.cm-searchMatch': { backgroundColor: THEME_BG.dark.searchMatch, outline: '1px solid #d4a72c66' },
  },
  { dark: true },
)

const lightHighlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: '1.3em', fontWeight: 'bold' },
  { tag: t.heading2, fontSize: '1.2em', fontWeight: 'bold' },
  { tag: t.heading3, fontSize: '1.1em', fontWeight: 'bold' },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: 'bold' },
  { tag: [t.heading, t.strong], fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#0969da', textDecoration: 'underline' },
  { tag: [t.url, t.monospace], color: '#0a3069' },
  { tag: [t.quote], color: '#57606a', fontStyle: 'italic' },
  { tag: t.list, color: '#953800' },
  { tag: t.meta, color: '#57606a' },
  { tag: t.invalid, color: '#cf222e' },
])

const darkHighlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: '1.3em', fontWeight: 'bold', color: '#79c0ff' },
  { tag: t.heading2, fontSize: '1.2em', fontWeight: 'bold', color: '#79c0ff' },
  { tag: t.heading3, fontSize: '1.1em', fontWeight: 'bold', color: '#79c0ff' },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: 'bold', color: '#79c0ff' },
  { tag: [t.heading, t.strong], fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#58a6ff', textDecoration: 'underline' },
  { tag: [t.url, t.monospace], color: '#a5d6ff' },
  { tag: [t.quote], color: '#8b949e', fontStyle: 'italic' },
  { tag: t.list, color: '#ffa657' },
  { tag: t.meta, color: '#8b949e' },
  { tag: t.invalid, color: '#f85149' },
])

/** 解析主题配置：字符串 → 内置主题；Extension → 用户自定义原样返回。 */
export function themeExtension(theme: ThemeName | Extension): Extension {
  if (typeof theme !== 'string') return theme
  return theme === 'dark'
    ? [darkTheme, syntaxHighlighting(darkHighlight)]
    : [lightTheme, syntaxHighlighting(lightHighlight)]
}
