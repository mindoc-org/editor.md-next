/** DOM 骨架搭建。 */
import { addClass, requireDom } from '@editormd-next/utils'
import { CLASS_PREFIX } from '../types/common'
import type { EditorOptions } from '../types/settings'

export interface MountedDom {
  container: HTMLElement
  toolbarSlot: HTMLElement | null
  editorHost: HTMLElement
  /** 仅在 preview.enable 时非空 */
  previewHost: HTMLElement
  textarea: HTMLTextAreaElement | null
  htmlTextarea: HTMLTextAreaElement | null
}

export function mountDom(target: string | HTMLElement, options: EditorOptions): MountedDom {
  const container = requireDom(target)

  addClass(
    container,
    CLASS_PREFIX,
    options.editor.theme === 'dark' ? `${CLASS_PREFIX}-editor-dark` : `${CLASS_PREFIX}-editor-default`,
  )
  if (options.editor.autoHeight) addClass(container, `${CLASS_PREFIX}-auto-height`)

  // 工具栏占位（P4 由 toolbar 模块填充内容）
  let toolbarSlot: HTMLElement | null = null
  if (options.toolbar.enable) {
    toolbarSlot = document.createElement('div')
    addClass(toolbarSlot, `${CLASS_PREFIX}-toolbar-slot`)
    container.append(toolbarSlot)
  }

  const body = document.createElement('div')
  addClass(body, `${CLASS_PREFIX}-body`)
  container.append(body)

  const editorHost = document.createElement('div')
  addClass(editorHost, `${CLASS_PREFIX}-editor`)
  body.append(editorHost)

  let previewHost: HTMLElement | null = null
  if (options.preview.enable) {
    previewHost = document.createElement('div')
    addClass(previewHost, `${CLASS_PREFIX}-preview-host`)
    body.append(previewHost)
  }

  // 隐藏 textarea：表单提交场景同步 markdown / html
  let textarea: HTMLTextAreaElement | null = null
  let htmlTextarea: HTMLTextAreaElement | null = null
  if (options.name) {
    textarea = document.createElement('textarea')
    textarea.name = options.name
    textarea.hidden = true
    container.append(textarea)
    if (options.preview.saveHtml) {
      htmlTextarea = document.createElement('textarea')
      htmlTextarea.name = `${options.name}-html-code`
      htmlTextarea.hidden = true
      container.append(htmlTextarea)
    }
  }

  return { container, toolbarSlot, editorHost, previewHost: previewHost as HTMLElement, textarea, htmlTextarea }
}
