/** 代码块 / 预格式文本对话框（内嵌 CM6 编辑器）。 */
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { addClass } from '@editormd-next/utils'
import { languages } from '@codemirror/language-data'
import type { EditorMD } from '../editor'
import { Dialog } from './dialog'
import { formRow, showErrorHint } from './form'

/** 内嵌小编辑器（无语法高亮，轻量配置） */
function createEmbeddedEditor(parent: HTMLElement): EditorView {
  return new EditorView({
    state: EditorState.create({
      doc: '',
      extensions: [history(), keymap.of([...defaultKeymap, ...historyKeymap]), EditorView.lineWrapping],
    }),
    parent,
  })
}

/** 语言选择列表（来自 @codemirror/language-data，英文语言名） */
function buildLanguageSelect(): HTMLSelectElement {
  const select = document.createElement('select')
  addClass(select, 'emd-form-input')
  const defaultOption = document.createElement('option')
  defaultOption.value = ''
  defaultOption.textContent = '—'
  select.append(defaultOption)
  for (const lang of languages) {
    const option = document.createElement('option')
    option.value = lang.name.toLowerCase()
    option.textContent = lang.name
    select.append(option)
  }
  return select
}

export function openCodeBlockDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.codeBlock

  const select = buildLanguageSelect()
  const host = document.createElement('div')
  addClass(host, 'emd-embedded-cm')
  const view = createEmbeddedEditor(host)

  const content = document.createElement('div')
  content.append(formRow(lang.selectLabel, select), host)

  const dialog = new Dialog(editor, {
    name: 'codeBlock',
    title: lang.title,
    width: 520,
    content,
    buttons: [
      {
        key: 'enter',
        label: editor.lang.buttons.enter,
        primary: true,
        action: () => {
          const code = view.state.doc.toString()
          if (!code.trim()) {
            showErrorHint(dialog, lang.codeEmptyAlert)
            return false
          }
          const fence = select.value || ''
          editor.insertValue(`\n\`\`\`${fence}\n${code}\n\`\`\`\n`)
        },
      },
      { key: 'cancel', label: editor.lang.buttons.cancel },
    ],
  })
  dialog.open()
  view.focus()
  return dialog
}

export function openPreformattedTextDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.preformattedText

  const host = document.createElement('div')
  addClass(host, 'emd-embedded-cm')
  const view = createEmbeddedEditor(host)

  const content = document.createElement('div')
  content.append(host)

  const dialog = new Dialog(editor, {
    name: 'preformattedText',
    title: lang.title,
    width: 520,
    content,
    buttons: [
      {
        key: 'enter',
        label: editor.lang.buttons.enter,
        primary: true,
        action: () => {
          const code = view.state.doc.toString()
          if (!code.trim()) {
            showErrorHint(dialog, lang.emptyAlert)
            return false
          }
          const indented = code
            .split('\n')
            .map((line) => (line.trim() ? `    ${line}` : line))
            .join('\n')
          editor.insertValue(`\n${indented}\n`)
        },
      },
      { key: 'cancel', label: editor.lang.buttons.cancel },
    ],
  })
  dialog.open()
  view.focus()
  return dialog
}
