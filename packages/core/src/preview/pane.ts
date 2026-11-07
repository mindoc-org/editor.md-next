/** 预览面板：接收渲染管线产出的 HTML。 */
import { addClass } from '@editormd-next/utils'

export class PreviewPane {
  readonly el: HTMLElement

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div')
    addClass(this.el, 'emd-preview')
    this.el.dataset.emdRole = 'preview'
    parent.append(this.el)
  }

  render(html: string): void {
    this.el.innerHTML = html
    this.el.classList.toggle('emd-preview-empty', this.el.textContent?.trim() === '' && html.length < 32)
  }

  /** 按比例滚动（0~1），供同步滚动使用 */
  scrollToRatio(ratio: number): void {
    const max = this.el.scrollHeight - this.el.clientHeight
    this.el.scrollTop = Math.max(0, Math.min(max, max * ratio))
  }

  currentRatio(): number {
    const max = this.el.scrollHeight - this.el.clientHeight
    return max > 0 ? this.el.scrollTop / max : 0
  }
}
