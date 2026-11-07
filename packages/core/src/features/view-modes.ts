/** 全窗口预览与全屏模式（对齐原版 previewing/fullscreen 的类切换实现）。 */
import { addClass, removeClass } from '@editormd-next/utils'
import { CLASS_PREFIX } from '../types/common'
import type { EditorMD } from '../editor'

/** 进入全窗口 HTML 预览（编辑区隐藏、预览占满、右上角关闭按钮、ESC 退出） */
export function enterPreviewMode(editor: EditorMD): void {
  if (editor.state.previewing) return
  editor.state.previewing = true
  addClass(editor.dom.container, `${CLASS_PREFIX}-previewing`)
  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = `${CLASS_PREFIX}-preview-close`
  closeBtn.innerHTML = '<i class="fa fa-times"></i>'
  closeBtn.addEventListener('click', () => exitPreviewMode(editor))
  editor.dom.container.append(closeBtn)
  editor.emitter.emit('previewEnter', undefined)
}

export function exitPreviewMode(editor: EditorMD): void {
  if (!editor.state.previewing) return
  editor.state.previewing = false
  removeClass(editor.dom.container, `${CLASS_PREFIX}-previewing`)
  editor.dom.container.querySelector(`.${CLASS_PREFIX}-preview-close`)?.remove()
  editor.emitter.emit('previewExit', undefined)
}

/** 进入/退出全屏（CSS fixed 覆盖视口；ESC 退出） */
export function enterFullscreen(editor: EditorMD): void {
  if (editor.state.fullscreen) return
  editor.state.fullscreen = true
  addClass(editor.dom.container, `${CLASS_PREFIX}-fullscreen`)
  editor.emitter.emit('fullscreenEnter', undefined)
}

export function exitFullscreen(editor: EditorMD): void {
  if (!editor.state.fullscreen) return
  editor.state.fullscreen = false
  removeClass(editor.dom.container, `${CLASS_PREFIX}-fullscreen`)
  editor.emitter.emit('fullscreenExit', undefined)
}
