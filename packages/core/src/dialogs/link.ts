/** 链接 / 引用链接对话框。 */
import type { EditorMD } from '../editor'
import { Dialog } from './dialog'
import { formRow, openWithEnter, showErrorHint, textInput } from './form'

export function openLinkDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.link
  const urlInput = textInput('https://')
  const titleInput = textInput()

  const content = document.createElement('div')
  content.append(formRow(lang.url, urlInput), formRow(lang.urlTitle, titleInput))

  const dialog = new Dialog(editor, {
    name: 'link',
    title: lang.title,
    content,
    buttons: [
      {
        key: 'enter',
        label: editor.lang.buttons.enter,
        primary: true,
        action: () => {
          const url = urlInput.value.trim()
          if (!url) {
            showErrorHint(dialog, lang.urlEmpty)
            return false
          }
          const title = titleInput.value.trim()
          editor.insertValue(`[${title || url}](${url})`)
        },
      },
      { key: 'cancel', label: editor.lang.buttons.cancel },
    ],
  })
  openWithEnter(editor, dialog)
  return dialog
}

export function openReferenceLinkDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.referenceLink
  const labelInput = textInput('ref-1')
  const urlInput = textInput('https://')
  const titleInput = textInput()

  const content = document.createElement('div')
  content.append(formRow(lang.label ?? 'Label', labelInput), formRow(lang.url, urlInput), formRow(lang.urlTitle, titleInput))

  const dialog = new Dialog(editor, {
    name: 'referenceLink',
    title: lang.title,
    content,
    buttons: [
      {
        key: 'enter',
        label: editor.lang.buttons.enter,
        primary: true,
        action: () => {
          const label = labelInput.value.trim()
          const url = urlInput.value.trim()
          if (!label || !url) {
            showErrorHint(dialog, lang.urlEmpty)
            return false
          }
          const title = titleInput.value.trim()
          editor.insertValue(`[${label}][]`)
          // 定义放到文档末尾
          const doc = editor.cm.state.doc
          editor.cm.dispatch({
            changes: { from: doc.length, insert: `\n\n[${label}]: ${url}${title ? ` "${title}"` : ''}` },
          })
        },
      },
      { key: 'cancel', label: editor.lang.buttons.cancel },
    ],
  })
  openWithEnter(editor, dialog)
  return dialog
}
