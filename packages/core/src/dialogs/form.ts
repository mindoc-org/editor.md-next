/** 对话框内表单/网格的共享小工具。 */
import { addClass } from '@editormd-next/utils'
import type { EditorMD } from '../editor'
import { Dialog } from './dialog'

export function formRow(labelText: string, input: HTMLElement): HTMLElement {
  const row = document.createElement('div')
  addClass(row, 'emd-form-row')
  const label = document.createElement('label')
  addClass(label, 'emd-form-label')
  label.textContent = labelText
  row.append(label, input)
  return row
}

export function textInput(placeholder = ''): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'text'
  addClass(input, 'emd-form-input')
  input.placeholder = placeholder
  return input
}

/** 打开对话框并可选地在确认时执行动作；回车键触发主按钮。 */
export function openWithEnter(editor: EditorMD, dialog: Dialog): void {
  dialog.open()
  dialog.body.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return
    const primary = dialog.el.querySelector<HTMLElement>('.emd-dialog-btn-primary')
    primary?.click()
  })
  editor.focus()
}

/**
 * 在对话框 body 内显示行内错误提示。
 * 不用 window.alert —— 原生弹窗会阻塞 JS 线程（用户明确要求）。
 */
export function showErrorHint(dialog: Dialog, message: string): void {
  let el = dialog.body.querySelector<HTMLElement>('.emd-form-error')
  if (!el) {
    el = document.createElement('div')
    addClass(el, 'emd-form-error')
    dialog.body.append(el)
  }
  el.textContent = message
  el.scrollIntoView({ block: 'nearest' })
}
