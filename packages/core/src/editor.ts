/**
 * EditorMD —— 编辑器编排核心。
 * 组装 CM6 视图、渲染管线、预览面板与同步滚动；对外暴露新 API。
 * config() 支持原位重建：teardown 内部结构后用新配置重新 setup。
 */
import { EventEmitter, debounce, setStyles, uploadFile } from '@editormd-next/utils'
import type { Debounced } from '@editormd-next/utils'
import type { UploadResult } from '@editormd-next/utils'
import { EditorSelection } from '@codemirror/state'
import { EditorState as CmEditorState } from '@codemirror/state'
import type { Compartment } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { createEditorView, markProgrammatic } from './cm/create-view'
import { themeExtension } from './cm/themes'
import { buildShortcutKeymap, bindWindowKeys } from './cm/shortcuts'
import { applyContainerSize, layout, toCssSize } from './lifecycle/layout'
import { mountDom } from './lifecycle/mount'
import type { MountedDom } from './lifecycle/mount'
import { MarkdownEngine } from './markdown/engine'
import { PreviewPane } from './preview/pane'
import { bindScrollSync } from './preview/sync-scroll'
import type { ScrollSyncHandle } from './preview/sync-scroll'
import { postRenderPreview } from './preview/post-render'
import { renderTo } from './render-to'
import { Toolbar } from './toolbar/toolbar'
import type { Toolbar as ToolbarInstance } from './toolbar/toolbar'
import { openRegisteredDialog } from './dialogs/registry'
import { pasteDropExtension } from './features/paste-drop'
import { enterFullscreen, enterPreviewMode, exitFullscreen, exitPreviewMode } from './features/view-modes'
import { resolveLang } from './i18n'
import { normalizeOptions } from './normalize'
import type { EditorEvents } from './types/events'
import type { LangDict } from './types/lang'
import type { EditorOptions, EditorUserOptions } from './types/settings'
import type { ThemeName } from './types/common'
import type { Extension } from '@codemirror/state'
import { CLASS_PREFIX } from './types/common'

export interface EditorState {
  watching: boolean
  loaded: boolean
  destroyed: boolean
  /** 全窗口预览中 */
  previewing: boolean
  /** 全屏中 */
  fullscreen: boolean
}

/** 窗口级按键监听辅助 */
function onWindowKey(key: string, handler: () => void): () => void {
  const listener = (event: KeyboardEvent): void => {
    if (event.key === key) handler()
  }
  window.addEventListener('keydown', listener)
  return () => window.removeEventListener('keydown', listener)
}

export class EditorMD {
  /** 静态渲染：把 markdown 渲染为只读 HTML（替代原版 editormd.markdownToHTML） */
  static renderTo(target: string | HTMLElement, options: EditorUserOptions = {}): HTMLElement {
    return renderTo(target, options)
  }
  options!: EditorOptions
  /** 当前语言字典（i18n 运行时切换用） */
  lang!: LangDict
  /** CM6 编辑视图（高级用法可直接操作） */
  cm!: EditorView
  dom!: MountedDom

  state: EditorState = { watching: false, loaded: false, destroyed: false, previewing: false, fullscreen: false }

  /** 事件总线：on/off/once/emit */
  readonly emitter = new EventEmitter<EditorEvents>()

  private engine!: MarkdownEngine
  private previewPane: PreviewPane | null = null
  private syncHandle: ScrollSyncHandle | null = null
  private toolbar: ToolbarInstance | null = null
  private themeCompartment: Compartment | null = null
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
    this.toolbar?.syncWatchState()
    this.cm.focus()
    this.emitter.emit('watch', undefined)
    return this
  }

  /** 关闭实况预览（仅编辑器） */
  unwatch(): this {
    if (!this.state.watching) return this
    this.state.watching = false
    layout(this.dom, false, this.options.preview.enable)
    this.toolbar?.syncWatchState()
    this.cm.focus()
    this.emitter.emit('unwatch', undefined)
    return this
  }

  toggleWatch(): this {
    return this.state.watching ? this.unwatch() : this.watch()
  }

  // --------------------------------------------------------------- 主题

  /** 切换编辑区主题（内置名称或 CM6 主题扩展） */
  setEditorTheme(theme: ThemeName | Extension): this {
    this.options.editor.theme = theme
    if (this.themeCompartment) {
      this.cm.dispatch({
        effects: this.themeCompartment.reconfigure(themeExtension(theme)),
      })
    }
    const dark = theme === 'dark'
    this.dom.container.classList.toggle(`${CLASS_PREFIX}-editor-dark`, dark)
    this.dom.container.classList.toggle(`${CLASS_PREFIX}-editor-default`, !dark)
    return this
  }

  /** 切换预览区主题 */
  setPreviewTheme(theme: ThemeName): this {
    this.options.preview.theme = theme
    if (this.previewPane) this.previewPane.el.dataset['emdPreviewTheme'] = theme
    return this
  }

  /** 一键切换浅/深（changetheme 按钮） */
  toggleTheme(): this {
    const toDark = this.options.editor.theme !== 'dark'
    this.setEditorTheme(toDark ? 'dark' : 'default')
    this.setPreviewTheme(toDark ? 'dark' : 'default')
    return this
  }

  // --------------------------------------------------------------- 对话框与上传

  /** 按名称打开对话框（link/referenceLink/image/codeBlock/table/emoji/…） */
  openDialog(name: string): void {
    openRegisteredDialog(this, name)
  }

  /** 跳转到指定行（1 基；支持 'first'/'last'），并同步预览滚动 */
  gotoLine(line: number | 'first' | 'last'): this {
    const total = this.cm.state.doc.lines
    const n = line === 'first' ? 1 : line === 'last' ? total : Math.max(1, Math.min(total, Math.round(line)))
    const lineInfo = this.cm.state.doc.line(n)
    this.cm.dispatch({
      selection: EditorSelection.cursor(lineInfo.from),
      scrollIntoView: true,
      annotations: markProgrammatic().annotations,
    })
    // 预览按比例跟随
    const ratio = total > 1 ? (n - 1) / (total - 1) : 0
    this.previewPane?.scrollToRatio(ratio)
    this.cm.focus()
    return this
  }

  /** 上传图片文件（响应协议 {success,url,message}，兼容原版服务端） */
  async uploadImage(file: File, onProgress?: (percent: number) => void): Promise<UploadResult> {
    const cfg = this.options.upload
    if (!cfg.url) {
      return { success: 0, message: 'upload URL is not configured (upload.url)' }
    }
    return uploadFile({
      url: cfg.url,
      file,
      fieldName: cfg.fieldName,
      withCredentials: cfg.withCredentials,
      onProgress,
    })
  }

  /** 全窗口 HTML 预览切换（ESC 退出） */
  togglePreviewMode(): this {
    if (this.state.previewing) {
      exitPreviewMode(this)
    } else {
      enterPreviewMode(this)
    }
    return this
  }

  /** 全屏切换（ESC 退出） */
  toggleFullscreen(): this {
    if (this.state.fullscreen) {
      exitFullscreen(this)
    } else {
      enterFullscreen(this)
    }
    return this
  }

  focus(): this {
    this.cm.focus()
    return this
  }

  // --------------------------------------------------------------- 事件

  /** 订阅事件，返回解绑函数 */
  on<K extends keyof EditorEvents>(event: K, listener: (payload: EditorEvents[K]) => void): () => void {
    return this.emitter.on(event, listener)
  }

  /** 订阅一次性事件 */
  once<K extends keyof EditorEvents>(event: K, listener: (payload: EditorEvents[K]) => void): () => void {
    return this.emitter.once(event, listener)
  }

  /** 解绑事件 */
  off<K extends keyof EditorEvents>(event: K, listener?: (payload: EditorEvents[K]) => void): void {
    this.emitter.off(event, listener)
  }

  /** 触发事件（自定义扩展事件用） */
  emit<K extends keyof EditorEvents>(event: K, payload: EditorEvents[K]): void {
    this.emitter.emit(event, payload)
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
    this.state = { watching: false, loaded: false, destroyed: false, previewing: false, fullscreen: false }

    const container = typeof target === 'string' ? this.resolveTarget(target) : target
    this.initialClassName = container.className
    this.dom = mountDom(container, this.options)
    this.engine = new MarkdownEngine(this.options.markdown, {
      codeHighlight: this.options.preview.codeHighlight,
    })

    const { view, themeCompartment } = createEditorView(
      this.dom.editorHost,
      this.options,
      {
        onInput: () => this.emitter.emit('input', undefined),
        onDocChange: () => this.debouncedRender?.(),
      },
      [
        buildShortcutKeymap(this),
        // CM6 搜索面板等内置 UI 的本地化短语
        CmEditorState.phrases.of(this.lang.search ?? {}),
        ...(this.options.upload.image ? [pasteDropExtension(this)] : []),
      ],
    )
    this.cm = view
    this.themeCompartment = themeCompartment
    this.state.watching = this.options.watch && this.options.preview.enable

    if (this.dom.toolbarSlot) {
      this.toolbar = new Toolbar(this, this.dom.toolbarSlot)
    }

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
    this.unbinds.push(...bindWindowKeys(this))
    // autoHeight：高度交给内容撑开
    if (this.options.editor.autoHeight) {
      setStyles(this.dom.container, { width: toCssSize(this.options.width), height: 'auto' })
    } else {
      applyContainerSize(this.dom, this.options.width, this.options.height)
    }
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
    this.toolbar?.destroy()
    this.toolbar = null
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

  /** 渲染管线：markdown → 引擎 → 预览/textarea → 后处理 → change 事件 */
  renderNow(): void {
    const markdown = this.getMarkdown()
    const { html, toc } = this.engine.render(markdown)
    this.lastHtml = html
    if (this.previewPane && this.state.watching) {
      this.previewPane.render(html)
      const md = this.options.markdown
      postRenderPreview(this.previewPane.el, {
        toc: md.toc.enable ? toc : [],
        tocTitle: md.toc.title,
        tocTitleFallback: this.lang.tocTitle,
        tocStartLevel: md.toc.startLevel,
        tocDropdown: md.toc.dropdown,
        tocContainer: md.toc.container,
        codeHighlight: this.options.preview.codeHighlight,
        darkPreview: this.options.preview.theme === 'dark',
        renderTex: md.tex,
        renderMermaid: md.mermaid,
        renderMindmap: md.mindmap,
        cdn: this.options.cdn,
      })
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

    // ESC：先退全窗口预览，再退全屏（对齐原版行为）
    this.unbinds.push(
      onWindowKey('Escape', () => {
        if (this.state.previewing) exitPreviewMode(this)
        else if (this.state.fullscreen) exitFullscreen(this)
      }),
    )
  }
}
