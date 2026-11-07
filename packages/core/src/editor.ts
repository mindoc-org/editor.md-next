/**
 * EditorMD —— 编辑器编排核心。
 * 组装 CM6 视图、渲染管线、预览面板与同步滚动；对外暴露新 API。
 * config() 支持原位重建：teardown 内部结构后用新配置重新 setup。
 */
import { EventEmitter, debounce } from '@editormd-next/utils'
import type { Debounced } from '@editormd-next/utils'
import type { EditorView } from '@codemirror/view'
import { createEditorView, markProgrammatic } from './cm/create-view'
import { applyContainerSize, layout } from './lifecycle/layout'
import { mountDom } from './lifecycle/mount'
import type { MountedDom } from './lifecycle/mount'
import { MarkdownEngine } from './markdown/engine'
import { PreviewPane } from './preview/pane'
import { bindScrollSync } from './preview/sync-scroll'
import type { ScrollSyncHandle } from './preview/sync-scroll'
import { resolveLang } from './i18n'
import { normalizeOptions } from './normalize'
import type { EditorEvents } from './types/events'
import type { LangDict } from './types/lang'
import type { EditorOptions, EditorUserOptions } from './types/settings'

export interface EditorState {
  watching: boolean
  loaded: boolean
  destroyed: boolean
}

export class EditorMD {
  options!: EditorOptions
  /** 当前语言字典（i18n 运行时切换用） */
  lang!: LangDict
  /** CM6 编辑视图（高级用法可直接操作） */
  cm!: EditorView
  dom!: MountedDom

  state: EditorState = { watching: false, loaded: false, destroyed: false }

  /** 事件总线：on/off/once/emit */
  readonly emitter = new EventEmitter<EditorEvents>()

  private engine!: MarkdownEngine
  private previewPane: PreviewPane | null = null
  private syncHandle: ScrollSyncHandle | null = null
  private debouncedRender: Debounced<() => void> | null = null
  private lastHtml = ''
  private unbinds: Array<() => void> = []
  /** 用户挂在容器上的原始 class，重建时恢复 */
  private initialClassName = ''

  constructor(target: string | HTMLElement, userOptions: EditorUserOptions = {}) {
    this.setup(target, userOptions)
  }

  // --------------------------------------------------------------- 内容读写

  /** 当前 markdown 文本 */
  getMarkdown(): string {
    return this.cm.state.doc.toString()
  }

  /** 整体替换 markdown（程序性替换，立即渲染） */
  setMarkdown(markdown: string): this {
    const doc = this.cm.state.doc
    this.cm.dispatch({
      changes: { from: 0, to: doc.length, insert: markdown },
      ...markProgrammatic(),
    })
    this.renderNow()
    return this
  }

  /** 在文档末尾追加 markdown */
  appendMarkdown(markdown: string): this {
    const doc = this.cm.state.doc
    this.cm.dispatch({
      changes: { from: doc.length, insert: markdown },
      ...markProgrammatic(),
    })
    this.debouncedRender?.()
    return this
  }

  /** 在光标处插入文本 */
  insertValue(value: string): this {
    this.cm.dispatch(this.cm.state.replaceSelection(value))
    this.cm.focus()
    this.debouncedRender?.()
    return this
  }

  /** 最近一次渲染产出的 HTML */
  getHtml(): string {
    return this.lastHtml
  }

  /** 预览区当前 DOM 内的 HTML */
  getPreviewedHtml(): string {
    return this.previewPane?.el.innerHTML ?? ''
  }

  /** 清空内容 */
  clear(): this {
    return this.setMarkdown('')
  }

  // --------------------------------------------------------------- 视图模式

  /** 开启实况预览（分屏） */
  watch(): this {
    if (this.state.watching || !this.options.preview.enable) return this
    this.state.watching = true
    layout(this.dom, true, this.options.preview.enable)
    this.cm.focus()
    this.emitter.emit('watch', undefined)
    return this
  }

  /** 关闭实况预览（仅编辑器） */
  unwatch(): this {
    if (!this.state.watching) return this
    this.state.watching = false
    layout(this.dom, false, this.options.preview.enable)
    this.cm.focus()
    this.emitter.emit('unwatch', undefined)
    return this
  }

  toggleWatch(): this {
    return this.state.watching ? this.unwatch() : this.watch()
  }

  focus(): this {
    this.cm.focus()
    return this
  }

  // --------------------------------------------------------------- 配置与销毁

  /**
   * 深合并部分配置并原位重建（保留当前 markdown 内容）。
   * 注意：结构型配置（宽高/工具栏/预览开关）都走重建，成本可接受。
   */
  config(patch: EditorUserOptions): this {
    const markdown = this.getMarkdown()
    const container = this.dom.container
    this.teardown()
    this.setup(container, { ...patch, value: markdown })
    return this
  }

  /** 销毁编辑器：移除视图、解绑事件、还原容器 */
  destroy(): void {
    if (this.state.destroyed) return
    this.teardown()
    this.state.destroyed = true
  }

  // --------------------------------------------------------------- 内部

  private setup(target: string | HTMLElement, userOptions: EditorUserOptions): void {
    this.options = normalizeOptions(userOptions)
    this.lang = resolveLang(this.options.i18n)
    this.state = { watching: false, loaded: false, destroyed: false }

    const container = typeof target === 'string' ? this.resolveTarget(target) : target
    this.initialClassName = container.className
    this.dom = mountDom(container, this.options)
    this.engine = new MarkdownEngine(this.options.markdown)

    const { view } = createEditorView(this.dom.editorHost, this.options, {
      onInput: () => this.emitter.emit('input', undefined),
      onDocChange: () => this.debouncedRender?.(),
    })
    this.cm = view
    this.state.watching = this.options.watch && this.options.preview.enable

    if (this.options.preview.enable) {
      this.previewPane = new PreviewPane(this.dom.previewHost)
      this.previewPane.el.dataset.emdPreviewTheme = this.options.preview.theme
      if (this.options.preview.syncScroll) {
        this.syncHandle = bindScrollSync(view, this.previewPane, {
          mode: this.options.preview.syncScroll,
          onScroll: (ratio) => this.emitter.emit('scroll', { ratio }),
          onPreviewScroll: (ratio) => this.emitter.emit('previewScroll', { ratio }),
        })
      }
    }

    this.debouncedRender = debounce(() => this.renderNow(), this.options.preview.delay)

    // settings 风格回调 → 事件总线
    for (const [event, handler] of Object.entries(this.options.on)) {
      if (handler) this.emitter.on(event as keyof EditorEvents, handler as never)
    }

    this.bindWindowEvents()
    applyContainerSize(this.dom, this.options.width, this.options.height)
    layout(this.dom, this.state.watching, this.options.preview.enable)

    // 初始渲染 + load 事件
    this.renderNow()
    setTimeout(() => {
      this.state.loaded = true
      this.emitter.emit('load', undefined)
      if (this.options.editor.autoFocus && !this.options.editor.readOnly) this.cm.focus()
    }, 0)
  }

  private teardown(): void {
    this.syncHandle?.destroy()
    for (const unbind of this.unbinds) unbind()
    this.unbinds = []
    this.debouncedRender?.cancel()
    this.cm?.destroy()
    this.emitter.removeAllListeners()
    this.previewPane = null
    this.syncHandle = null
    this.dom.container.className = this.initialClassName
    this.dom.container.textContent = ''
  }

  private resolveTarget(selector: string): HTMLElement {
    const el = document.querySelector<HTMLElement>(selector)
    if (!el) throw new Error(`[editormd-next] element not found: ${selector}`)
    return el
  }

  /** 渲染管线：markdown → 引擎 → 预览/textarea → change 事件 */
  renderNow(): void {
    const markdown = this.getMarkdown()
    const html = this.engine.render(markdown)
    this.lastHtml = html
    if (this.previewPane && this.state.watching) {
      this.previewPane.render(html)
    }
    if (this.dom.textarea) this.dom.textarea.value = markdown
    if (this.dom.htmlTextarea) this.dom.htmlTextarea.value = html
    this.emitter.emit('change', { markdown, html })
  }

  private bindWindowEvents(): void {
    // 容器尺寸变化 → 重算分屏并广播
    const observer = new ResizeObserver(() => {
      if (this.state.destroyed || !this.state.loaded) return
      const rect = this.dom.container.getBoundingClientRect()
      layout(this.dom, this.state.watching, this.options.preview.enable)
      this.emitter.emit('resize', { width: Math.round(rect.width), height: Math.round(rect.height) })
    })
    observer.observe(this.dom.container)
    this.unbinds.push(() => observer.disconnect())
  }
}
