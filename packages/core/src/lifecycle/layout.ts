/** 尺寸与分屏布局。 */
import { setStyles, toggleClass } from '@editormd-next/utils'
import { CLASS_PREFIX } from '../types/common'
import type { WidthOrHeight } from '../types/common'
import type { MountedDom } from './mount'

export function toCssSize(value: WidthOrHeight): string {
  return typeof value === 'number' ? `${value}px` : value
}

/** 应用容器宽高 */
export function applyContainerSize(dom: MountedDom, width: WidthOrHeight, height: WidthOrHeight): void {
  setStyles(dom.container, { width: toCssSize(width), height: toCssSize(height) })
}

/**
 * 按 watch 状态重排：分屏（编辑|预览）或仅编辑器。
 * watch 时各占一半；unwatch 时预览隐藏、编辑器占满。
 */
export function layout(dom: MountedDom, watching: boolean, previewEnabled: boolean): void {
  const showPreview = watching && previewEnabled
  toggleClass(dom.container, `${CLASS_PREFIX}-watching`, showPreview)

  const half = showPreview ? '50%' : '100%'
  setStyles(dom.editorHost, { width: half })
  if (dom.previewHost) {
    setStyles(dom.previewHost, { width: half, display: showPreview ? 'block' : 'none' })
  }
  dom.container.dispatchEvent(new Event('emd-relayout'))
}
