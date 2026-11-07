/**
 * 通用对话框框架：遮罩、拖拽、层级递增、lockScreen、按钮区。
 * 对齐原版 createDialog 的行为子集，结构改用现代 class。
 */
import { addClass, on, removeClass, setStyles } from '@editormd-next/utils'
import type { EditorMD } from '../editor'

export interface DialogButton {
  key: string
  label: string
  /** 点击回调；返回 false 或不返回视为关闭对话框 */
  action?: (dialog: Dialog) => void | false
  primary?: boolean
}

export interface DialogOptions {
  name: string
  title: string
  width?: number
  /** 内容元素（可延迟构建） */
  content: HTMLElement | (() => HTMLElement)
  buttons?: DialogButton[]
  /** 关闭回调 */
  onClose?: () => void
}

let dialogZindex = 10000

export class Dialog {
  readonly el: HTMLElement
  readonly body: HTMLElement
  readonly editor: EditorMD
  private options: DialogOptions
  private mask: HTMLElement | null = null
  private unbinds: Array<() => void> = []
  private closed = false

  constructor(editor: EditorMD, options: DialogOptions) {
    this.editor = editor
    this.options = options

    this.el = document.createElement('div')
    addClass(this.el, 'emd-dialog')
    this.el.style.width = `${options.width ?? 420}px`
    this.el.style.zIndex = String(dialogZindex + 2)
    dialogZindex += 2

    const header = document.createElement('div')
    addClass(header, 'emd-dialog-header')
    const title = document.createElement('span')
    addClass(title, 'emd-dialog-title')
    title.textContent = options.title
    const closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    addClass(closeBtn, 'emd-dialog-close')
    closeBtn.innerHTML = '<i class="fa fa-close"></i>'
    header.append(title, closeBtn)

    this.body = document.createElement('div')
    addClass(this.body, 'emd-dialog-body')
    this.body.append(typeof options.content === 'function' ? options.content() : options.content)

    this.el.append(header, this.body)

    if (options.buttons && options.buttons.length > 0) {
      const footer = document.createElement('div')
      addClass(footer, 'emd-dialog-footer')
      for (const btn of options.buttons) {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = btn.label
        addClass(b, 'emd-dialog-btn')
        if (btn.primary) addClass(b, 'emd-dialog-btn-primary')
        b.dataset['emdDialogBtn'] = btn.key
        footer.append(b)
      }
      this.el.append(footer)
    }

    this.bindEvents(header, closeBtn)
  }

  /** 打开：挂载 + 遮罩 + 居中 */
  open(): this {
    if (this.closed) return this
    const container = this.editor.dom.container
    const mask = document.createElement('div')
    addClass(mask, 'emd-dialog-mask')
    mask.style.zIndex = String(dialogZindex)
    if (this.editor.options.dialog.showMask) {
      mask.style.background = `rgba(255,255,255,${this.editor.options.dialog.maskOpacity})`
    }
    container.append(mask, this.el)
    this.mask = mask
    this.center()
    if (this.editor.options.dialog.lockScreen) {
      setStyles(document.body, { overflow: 'hidden' })
    }
    this.body.querySelector<HTMLElement>('input, textarea, select')?.focus()
    return this
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    for (const unbind of this.unbinds) unbind()
    this.unbinds = []
    this.mask?.remove()
    this.el.remove()
    if (this.editor.options.dialog.lockScreen) {
      setStyles(document.body, { overflow: '' })
    }
    this.options.onClose?.()
  }

  /** 显示加载态（上传时使用） */
  loading(show: boolean): void {
    this.el.classList.toggle('emd-dialog-loading', show)
  }

  private center(): void {
    const containerRect = this.editor.dom.container.getBoundingClientRect()
    const rect = this.el.getBoundingClientRect()
    const top = Math.max(12, containerRect.height / 2 - rect.height / 2)
    setStyles(this.el, { position: 'absolute', left: '50%', top: `${Math.round(top)}px`, transform: 'translateX(-50%)' })
  }

  private bindEvents(header: HTMLElement, closeBtn: HTMLElement): void {
    this.unbinds.push(
      on(closeBtn, 'click', () => this.close()),
      on(this.el, 'click', (event) => {
        const btn = (event.target as HTMLElement).closest<HTMLElement>('[data-emd-dialog-btn]')
        if (!btn) return
        const definition = this.options.buttons?.find((b) => b.key === btn.dataset['emdDialogBtn'])
        if (!definition) return
        const result = definition.action?.(this)
        if (result !== false) this.close()
      }),
    )

    if (this.editor.options.dialog.draggable) {
      this.bindDrag(header)
    }
  }

  private bindDrag(handle: HTMLElement): void {
    let startX = 0
    let startY = 0
    let baseLeft = 0
    let baseTop = 0
    let dragging = false

    const move = (event: MouseEvent): void => {
      if (!dragging) return
      const containerRect = this.editor.dom.container.getBoundingClientRect()
      const left = Math.min(Math.max(baseLeft + event.clientX - startX, 0), containerRect.width - 60)
      const top = Math.min(Math.max(baseTop + event.clientY - startY, 0), containerRect.height - 40)
      setStyles(this.el, { left: `${left}px`, top: `${top}px`, transform: 'none' })
    }
    const up = (): void => {
      dragging = false
      removeClass(document.body, 'emd-user-unselect')
    }

    this.unbinds.push(
      on(handle, 'mousedown', (event) => {
        if ((event.target as HTMLElement).closest('button')) return
        dragging = true
        const rect = this.el.getBoundingClientRect()
        const containerRect = this.editor.dom.container.getBoundingClientRect()
        startX = event.clientX
        startY = event.clientY
        baseLeft = rect.left - containerRect.left
        baseTop = rect.top - containerRect.top
        addClass(document.body, 'emd-user-unselect')
        event.preventDefault()
      }),
      on(document, 'mousemove', move),
      on(document, 'mouseup', up),
    )
  }
}
