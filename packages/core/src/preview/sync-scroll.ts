/**
 * 编辑器 ↔ 预览 同步滚动。
 * 算法沿用原版：按可滚动高度百分比映射；带循环保护（程序滚动后短时间内忽略回传）。
 */
import { on } from '@editormd-next/utils'
import type { EditorView } from '@codemirror/view'
import type { PreviewPane } from './pane'

export interface ScrollSyncOptions {
  /** true=双向；'single'=仅编辑器→预览 */
  mode: boolean | 'single'
  onScroll?: (ratio: number) => void
  onPreviewScroll?: (ratio: number) => void
}

export interface ScrollSyncHandle {
  destroy(): void
}

const LOOP_GUARD_MS = 120

export function bindScrollSync(view: EditorView, preview: PreviewPane, options: ScrollSyncOptions): ScrollSyncHandle {
  const scroller = view.scrollDOM
  let programmaticUntil = 0

  const editorToPreview = (): void => {
    const max = scroller.scrollHeight - scroller.clientHeight
    const ratio = max > 0 ? clamp(scroller.scrollTop / max) : 0
    options.onScroll?.(ratio)
    if (Date.now() < programmaticUntil) return
    programmaticUntil = Date.now() + LOOP_GUARD_MS
    preview.scrollToRatio(ratio)
  }

  const previewToEditor = (): void => {
    if (options.mode !== true) return // 'single' 时不回传
    const ratio = preview.currentRatio()
    options.onPreviewScroll?.(ratio)
    if (Date.now() < programmaticUntil) return
    programmaticUntil = Date.now() + LOOP_GUARD_MS
    const max = scroller.scrollHeight - scroller.clientHeight
    scroller.scrollTop = Math.max(0, Math.min(max, max * ratio))
  }

  const unbinds = [
    on(scroller, 'scroll', editorToPreview),
    on(preview.el, 'scroll', previewToEditor),
  ]

  return {
    destroy() {
      for (const unbind of unbinds) unbind()
    },
  }
}

function clamp(ratio: number): number {
  return Math.max(0, Math.min(1, ratio))
}
