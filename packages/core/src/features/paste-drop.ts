/** 图片粘贴 / 拖拽上传（增强：原版 fork 无此功能）。 */
import { EditorView } from '@codemirror/view'
import { isAllowedFormat } from '@editormd-next/utils'
import type { Extension } from '@codemirror/state'
import type { EditorMD } from '../editor'

export function pasteDropExtension(editor: EditorMD): Extension {
  return EditorView.domEventHandlers({
    paste(event: ClipboardEvent, view: EditorView): boolean {
      const files = imageFiles(event.clipboardData?.files)
      if (files.length === 0) return false
      event.preventDefault()
      void handleFiles(editor, files, view)
      return true
    },
    drop(event: DragEvent, view: EditorView): boolean {
      const files = imageFiles(event.dataTransfer?.files)
      if (files.length === 0) return false
      event.preventDefault()
      void handleFiles(editor, files, view)
      return true
    },
  })
}

function imageFiles(list: FileList | undefined | null): File[] {
  if (!list) return []
  return [...list].filter((f) => f.type.startsWith('image/'))
}

async function handleFiles(editor: EditorMD, files: File[], view: EditorView): Promise<void> {
  const { formats, url } = editor.options.upload
  for (const file of files) {
    if (!isAllowedFormat(file.name, formats)) continue
    if (!url) {
      // 未配置上传：插入 base64（本地可用，正式场景建议配置 upload.url）
      const dataUrl = await readAsDataUrl(file)
      insertAtCursor(view, `![${file.name}](${dataUrl})`)
      continue
    }
    const result = await editor.uploadImage(file)
    if (result.success === 1 && result.url) {
      insertAtCursor(view, `![${file.name}](${result.url})`)
    } else {
      console.warn('[editormd-next] paste/drop upload failed:', result.message)
    }
  }
}

function insertAtCursor(view: EditorView, text: string): void {
  view.dispatch(view.state.replaceSelection(text))
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
