/**
 * 内置工具栏按钮动作。
 * 对话框类按钮统一走 editor.openDialog(name)（P5 实现），此处先注册占位。
 */
import { redo, undo } from '@codemirror/commands'
import { EditorSelection } from '@codemirror/state'
import { openSearchPanel } from '@codemirror/search'
import { dateFormat, ucwords, ucfirst } from '@editormd-next/utils'
import type { EditorView } from '@codemirror/view'
import type { ToolbarHandler } from '../types/settings'

/** 选区包裹（粗体/斜体/行内代码等） */
function wrapSelection(view: EditorView, before: string, after: string = before): void {
  const { state } = view
  view.dispatch(
    state.changeByRange((range) => {
      const text = state.sliceDoc(range.from, range.to)
      return {
        changes: { from: range.from, to: range.to, insert: `${before}${text}${after}` },
        range: EditorSelection.range(
          range.from + before.length,
          range.from + before.length + text.length,
        ),
      }
    }),
  )
  view.focus()
}

/** 给选中行加前缀（标题/引用/列表） */
function prefixLines(view: EditorView, prefix: string | ((index: number) => string)): void {
  const { state } = view
  const changes: Array<{ from: number; insert: string }> = []
  const lineSet = new Set<number>()

  for (const range of state.selection.ranges) {
    const fromLine = state.doc.lineAt(range.from).number
    const toLine = state.doc.lineAt(range.to).number
    for (let n = fromLine; n <= toLine; n++) lineSet.add(n)
  }

  let index = 0
  for (const n of [...lineSet].sort((a, b) => a - b)) {
    const line = state.doc.line(n)
    const p = typeof prefix === 'function' ? prefix(index++) : prefix
    if (!line.text.startsWith(p)) {
      changes.push({ from: line.from, insert: p })
    }
  }
  if (changes.length > 0) view.dispatch({ changes })
  view.focus()
}

/** 替换选区文本（大小写转换等） */
function transformSelection(view: EditorView, transform: (text: string) => string): void {
  const { state } = view
  view.dispatch(
    state.changeByRange((range) => {
      const text = state.sliceDoc(range.from, range.to)
      return {
        changes: { from: range.from, to: range.to, insert: transform(text) },
        range: EditorSelection.range(range.from + transform(text).length, range.from + transform(text).length),
      }
    }),
  )
  view.focus()
}

function insertText(view: EditorView, text: string): void {
  view.dispatch(view.state.replaceSelection(text))
  view.focus()
}

function dialogStub(name: string): ToolbarHandler {
  return (editor) => {
    editor.openDialog(name)
  }
}

/** 内置动作表（名称与原版按钮一一对应） */
export const builtinHandlers: Record<string, ToolbarHandler> = {
  undo: (ed) => undo(ed.cm),
  redo: (ed) => redo(ed.cm),
  bold: (ed) => wrapSelection(ed.cm, '**'),
  del: (ed) => wrapSelection(ed.cm, '~~'),
  italic: (ed) => wrapSelection(ed.cm, '*'),
  code: (ed) => wrapSelection(ed.cm, '`'),
  quote: (ed) => prefixLines(ed.cm, '> '),
  ucwords: (ed) => transformSelection(ed.cm, ucwords),
  ucfirst: (ed) => transformSelection(ed.cm, ucfirst),
  uppercase: (ed) => transformSelection(ed.cm, (t) => t.toUpperCase()),
  lowercase: (ed) => transformSelection(ed.cm, (t) => t.toLowerCase()),
  h1: (ed) => prefixLines(ed.cm, '# '),
  h2: (ed) => prefixLines(ed.cm, '## '),
  h3: (ed) => prefixLines(ed.cm, '### '),
  h4: (ed) => prefixLines(ed.cm, '#### '),
  h5: (ed) => prefixLines(ed.cm, '##### '),
  h6: (ed) => prefixLines(ed.cm, '###### '),
  'list-ul': (ed) => prefixLines(ed.cm, '- '),
  'list-ol': (ed) => prefixLines(ed.cm, (i) => `${i + 1}. `),
  hr: (ed) => insertText(ed.cm, '\n\n------\n\n'),
  datetime: (ed) => insertText(ed.cm, dateFormat('Y-m-d H:i:s')),
  pagebreak: (ed) => insertText(ed.cm, '\n\n[========]\n\n'),
  'shift-tex': (ed) => wrapSelection(ed.cm, '$$'),
  'fenced-code': (ed) => insertText(ed.cm, '\n```ts\n\n```\n'),
  'at-link': (ed) => insertText(ed.cm, '@'),
  watch: (ed) => ed.toggleWatch(),
  clear: (ed) => ed.clear(),
  search: (ed) => {
    openSearchPanel(ed.cm)
  },
  changetheme: (ed) => ed.toggleTheme(),
  fullscreen: (ed) => ed.toggleFullscreen(),
  preview: (ed) => ed.togglePreviewMode(),

  // 对话框类（P5 起实现 openDialog）
  link: dialogStub('link'),
  'reference-link': dialogStub('referenceLink'),
  image: dialogStub('image'),
  'preformatted-text': dialogStub('preformattedText'),
  'code-block': dialogStub('codeBlock'),
  table: dialogStub('table'),
  emoji: dialogStub('emoji'),
  'html-entities': dialogStub('htmlEntities'),
  'goto-line': dialogStub('gotoLine'),
  help: dialogStub('help'),
  info: dialogStub('info'),
}
