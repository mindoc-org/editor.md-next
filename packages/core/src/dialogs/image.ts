/** 图片对话框：URL / 本地上传 双 tab（协议与原版服务端兼容）。 */
import { addClass, isAllowedFormat } from '@editormd-next/utils'
import type { EditorMD } from '../editor'
import { Dialog } from './dialog'
import { formRow, showErrorHint, textInput } from './form'

export function openImageDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.image

  // tab 结构
  const tabs = document.createElement('div')
  addClass(tabs, 'emd-tabs')
  const tabUrl = document.createElement('button')
  const tabUpload = document.createElement('button')
  tabUrl.type = 'button'
  tabUpload.type = 'button'
  tabUrl.textContent = lang.url
  tabUpload.textContent = lang.uploadButton
  addClass(tabUrl, 'emd-tab')
  addClass(tabUpload, 'emd-tab')
  tabs.append(tabUrl, tabUpload)

  const panes = document.createElement('div')
  const paneUrl = document.createElement('div')
  const paneUpload = document.createElement('div')
  addClass(paneUrl, 'emd-tab-pane')
  addClass(paneUpload, 'emd-tab-pane', 'emd-hidden')

  const urlInput = textInput('https://')
  const altInput = textInput()
  paneUrl.append(formRow(lang.url, urlInput), formRow(lang.alt, altInput))

  // 上传面板
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = editor.options.upload.formats.map((f) => `.${f}`).join(',')
  const uploadHint = document.createElement('div')
  addClass(uploadHint, 'emd-upload-hint')
  paneUpload.append(formRow(lang.uploadButton, fileInput), uploadHint)

  panes.append(paneUrl, paneUpload)

  const selectTab = (which: 'url' | 'upload'): void => {
    const isUrl = which === 'url'
    tabUrl.classList.toggle('emd-tab-active', isUrl)
    tabUpload.classList.toggle('emd-tab-active', !isUrl)
    paneUrl.classList.toggle('emd-hidden', !isUrl)
    paneUpload.classList.toggle('emd-hidden', isUrl)
  }
  tabUrl.addEventListener('click', () => selectTab('url'))
  tabUpload.addEventListener('click', () => selectTab('upload'))
  selectTab('url')

  async function handleUpload(): Promise<void> {
    const file = fileInput.files?.[0]
    if (!file) {
      showErrorHint(dialog, lang.uploadFileEmpty)
      return
    }
    if (!isAllowedFormat(file.name, editor.options.upload.formats)) {
      showErrorHint(dialog, lang.formatNotAllowed)
      return
    }
    uploadHint.textContent = '0%...'
    try {
      const result = await editor.uploadImage(file, (percent) => {
        uploadHint.textContent = `${percent}%...`
      })
      if (result.success === 1 && result.url) {
        editor.insertValue(`![${file.name}](${result.url})`)
        dialog.close()
      } else {
        showErrorHint(dialog, result.message ?? 'upload failed')
      }
    } catch (error) {
      showErrorHint(dialog, String(error))
    }
  }
  fileInput.addEventListener('change', () => void handleUpload())

  const dialog = new Dialog(editor, {
    name: 'image',
    title: lang.title,
    width: 460,
    content: (() => {
      const wrap = document.createElement('div')
      wrap.append(tabs, panes)
      return wrap
    }) as never,
    buttons: [
      {
        key: 'enter',
        label: editor.lang.buttons.enter,
        primary: true,
        action: () => {
          if (!paneUrl.classList.contains('emd-hidden')) {
            const url = urlInput.value.trim()
            if (!url) {
              showErrorHint(dialog, lang.imageURLEmpty)
              return false
            }
            editor.insertValue(`![${altInput.value.trim() || url}](${url})`)
          } else {
            void handleUpload()
            return false // 上传是异步的，由其内部决定关闭
          }
        },
      },
      { key: 'cancel', label: editor.lang.buttons.cancel },
    ],
  })
  dialog.open()
  return dialog
}
