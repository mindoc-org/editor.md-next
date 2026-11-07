/** 表格对话框：行列 + 对齐方式。 */
import { addClass } from '@editormd-next/utils'
import type { EditorMD } from '../editor'
import { Dialog } from './dialog'
import { formRow } from './form'

function numberInput(value: number, min: number, max: number): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'number'
  input.value = String(value)
  input.min = String(min)
  input.max = String(max)
  addClass(input, 'emd-form-input')
  return input
}

export function openTableDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.table

  const rows = numberInput(3, 1, 100)
  const cols = numberInput(3, 1, 100)

  const alignWrap = document.createElement('div')
  addClass(alignWrap, 'emd-align-group')
  const aligns: Array<{ value: string; label: string }> = [
    { value: '', label: lang.alignLeft },
    { value: 'center', label: lang.alignCenter },
    { value: 'right', label: lang.alignRight },
  ]
  for (const [i, align] of aligns.entries()) {
    const label = document.createElement('label')
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.name = 'emd-table-align'
    radio.value = align.value
    if (i === 0) radio.checked = true
    label.append(radio, document.createTextNode(` ${align.label}`))
    alignWrap.append(label)
  }

  const content = document.createElement('div')
  content.append(formRow(lang.rowsLabel, rows), formRow(lang.colsLabel, cols), formRow(lang.alignLabel, alignWrap))

  const dialog = new Dialog(editor, {
    name: 'table',
    title: lang.title,
    content,
    buttons: [
      {
        key: 'enter',
        label: editor.lang.buttons.enter,
        primary: true,
        action: () => {
          const rowCount = Math.max(1, Math.min(100, Number(rows.value) || 3))
          const colCount = Math.max(1, Math.min(100, Number(cols.value) || 3))
          const align = alignWrap.querySelector<HTMLInputElement>('input[name="emd-table-align"]:checked')?.value ?? ''
          const sepCell = align === 'center' ? ' :---: ' : align === 'right' ? ' ---: ' : ' --- '

          const row = (cells: string[]): string => `| ${cells.join(' | ')} |`
          const lines: string[] = [
            row(Array.from({ length: colCount }, (_, i) => `${i + 1}`)),
            `|${Array.from({ length: colCount }, () => sepCell).join('|')}|`,
            ...Array.from({ length: rowCount - 1 }, () => row(Array.from({ length: colCount }, () => ' '))),
          ]
          editor.insertValue(`\n${lines.join('\n')}\n`)
        },
      },
      { key: 'cancel', label: editor.lang.buttons.cancel },
    ],
  })
  dialog.open()
  return dialog
}
