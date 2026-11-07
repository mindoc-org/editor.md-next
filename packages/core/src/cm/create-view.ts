/** CM6 EditorView 组装。 */
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { bracketMatching, foldGutter, foldKeymap, indentUnit } from '@codemirror/language'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { Annotation, Compartment, EditorState } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
  rectangularSelection,
} from '@codemirror/view'
import type { EditorOptions } from '../types/settings'
import { themeExtension } from './themes'

export interface CmSetup {
  view: EditorView
  /** 主题 Compartment：运行时切换 editor.theme 用 */
  themeCompartment: Compartment
}

export function createEditorView(
  host: HTMLElement,
  options: EditorOptions,
  handlers: { onInput: () => void; onDocChange: () => void },
): CmSetup {
  const cfg = options.editor
  const themeCompartment = new Compartment()

  const extensions: Extension[] = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    EditorState.allowMultipleSelections.of(true),
    indentUnit.of(cfg.indentWithTabs ? '\t' : ' '.repeat(cfg.tabSize)),
    EditorState.tabSize.of(cfg.tabSize),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    bracketMatching(),
    foldGutter(),
    highlightSelectionMatches(),
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
    themeCompartment.of(themeExtension(cfg.theme)),
    EditorView.theme({
      '&': { fontSize: cfg.fontSize, fontFamily: cfg.fontFamily, height: '100%' },
      '.cm-scroller': { overflow: 'auto', lineHeight: '1.6' },
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        handlers.onInput()
        const programmatic = update.transactions.some((tr) => tr.annotation(programmaticAnnotation) === 1)
        if (!programmatic) handlers.onDocChange()
      }
    }),
  ]

  if (cfg.lineNumbers) extensions.push(lineNumbers(), highlightActiveLineGutter())
  if (cfg.lineWrapping) extensions.push(EditorView.lineWrapping)
  if (cfg.activeLine) extensions.push(highlightActiveLine())
  if (cfg.closeBrackets) extensions.push(closeBrackets())
  if (options.placeholder) extensions.push(placeholderExtension(options.placeholder))
  if (cfg.readOnly) {
    extensions.push(EditorState.readOnly.of(true), EditorView.editable.of(false))
  }
  extensions.push(...cfg.extensions)

  const state = EditorState.create({ doc: options.value, extensions })
  const view = new EditorView({ state, parent: host })

  return { view, themeCompartment }
}

/** 标记一次 dispatch 为程序触发（setMarkdown 等），避免重复进入渲染循环。 */
export const programmaticAnnotation = Annotation.define<number>()

export function markProgrammatic(): { annotations: ReturnType<typeof programmaticAnnotation.of> } {
  return { annotations: programmaticAnnotation.of(1) }
}
