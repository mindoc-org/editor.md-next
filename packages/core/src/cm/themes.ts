/** CM6 编辑区主题：内置 default / dark，支持注入自定义主题扩展。 */
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import type { ThemeName } from '../types/common'

const lightTheme = EditorView.theme({
  // position+zIndex 让根元素形成层叠上下文：选区绘制层（z-index:-2）必须画在
  // 根背景之上，否则白色背景会把选区高亮完全盖住（选区功能正常但不可见）
  '&': { color: '#24292f', backgroundColor: '#ffffff', position: 'relative', zIndex: 0 },
  '.cm-content': { caretColor: '#0969da' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#0969da' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#b4d5fe',
  },
  '.cm-activeLine': { backgroundColor: '#f6f8fa' },
  '.cm-gutters': { backgroundColor: '#ffffff', color: '#8c959f', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: '#f6f8fa', color: '#24292f' },
  '.cm-selectionMatch': { backgroundColor: '#fae17d80' },
  '.cm-searchMatch': { backgroundColor: '#fff8c5', outline: '1px solid #d4a72c66' },
})

const darkTheme = EditorView.theme(
  {
    '&': { color: '#c9d1d9', backgroundColor: '#1e2127', position: 'relative', zIndex: 0 },
    '.cm-content': { caretColor: '#58a6ff' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#58a6ff' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: '#314262',
    },
    '.cm-activeLine': { backgroundColor: '#2a2e37' },
    '.cm-gutters': { backgroundColor: '#1e2127', color: '#6e7681', border: 'none' },
    '.cm-activeLineGutter': { backgroundColor: '#2a2e37', color: '#c9d1d9' },
    '.cm-selectionMatch': { backgroundColor: '#63533480' },
    '.cm-searchMatch': { backgroundColor: '#5a4a1e', outline: '1px solid #d4a72c66' },
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
