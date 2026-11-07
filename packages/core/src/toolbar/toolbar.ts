/** 工具栏渲染与交互。 */
import { addClass, on } from '@editormd-next/utils'
import type { EditorMD } from '../editor'
import { CLASS_PREFIX } from '../types/common'
import { builtinHandlers } from './handlers'
import { ICON_CLASSES, ICON_TEXTS } from './icons'
import { resolveToolbarSpec } from './modes'
import type { ParsedToolbarItem } from './modes'

/** 这些动作触发后不强制回焦（原版行为） */
const NO_FOCUS_ACTIONS = new Set([
  'link', 'reference-link', 'image', 'preformatted-text', 'code-block',
  'table', 'emoji', 'html-entities', 'goto-line', 'help', 'info',
  'watch', 'preview', 'fullscreen', 'search',
])

export class Toolbar {
  readonly el: HTMLElement
  private editor: EditorMD
  private unbinds: Array<() => void> = []

  constructor(editor: EditorMD, slot: HTMLElement) {
    this.editor = editor
    this.el = document.createElement('div')
    addClass(this.el, `${CLASS_PREFIX}-toolbar`)
    if (editor.options.toolbar.autoFixed) addClass(this.el, `${CLASS_PREFIX}-toolbar-fixed`)
    slot.append(this.el)
    this.render()
  }

  /** 按当前 spec 渲染菜单 */
  render(): void {
    const spec = this.editor.options.toolbar.spec
    const items = resolveToolbarSpec(spec)
    const menu = document.createElement('ul')
    addClass(menu, 'emd-menu')

    for (const item of items) {
      menu.append(this.renderItem(item))
    }

    this.el.textContent = ''
    this.el.append(menu)
    this.bindClicks()
    this.syncWatchState()
  }

  /** watch 状态切换后同步图标/标题 */
  syncWatchState(): void {
    const watching = this.editor.state.watching
    const icon = this.el.querySelector<HTMLElement>('[data-emd-btn="watch"] i')
    if (icon) {
      icon.className = `fa ${watching ? 'fa-eye-slash' : 'fa-eye'}`
    }
    const link = this.el.querySelector<HTMLElement>('[data-emd-btn="watch"]')
    if (link) {
      link.setAttribute('title', this.titleFor(watching ? 'watch' : 'unwatch'))
    }
  }

  destroy(): void {
    for (const unbind of this.unbinds) unbind()
    this.unbinds = []
    this.el.remove()
  }

  // --------------------------------------------------------------- 内部

  private titleFor(name: string): string {
    const custom = this.editor.options.toolbar.titles[name]
    return custom ?? this.editor.lang.toolbar[name] ?? name
  }

  private renderItem(item: ParsedToolbarItem): HTMLElement {
    const li = document.createElement('li')

    if (item.kind === 'divider') {
      addClass(li, 'divider')
      return li
    }
    if (item.kind === 'spacer') {
      addClass(li, 'emd-spacer')
      return li
    }
    if (item.kind === 'dropdown') {
      addClass(li, 'emd-dropdown')
      const trigger = document.createElement('a')
      const title = item.title ?? ''
      trigger.setAttribute('title', this.titleFor(title) || title)
      trigger.innerHTML = `<i class="fa ${ICON_CLASSES['heading'] ?? 'fa-header'}"></i>`
      const content = document.createElement('div')
      addClass(content, 'emd-dropdown-content')
      for (const child of item.children ?? []) {
        const childLink = document.createElement('a')
        childLink.textContent = ICON_TEXTS[child] ?? this.titleFor(child)
        childLink.dataset['emdBtn'] = child
        content.append(childLink)
      }
      li.append(trigger, content)
      return li
    }

    // button
    const name = item.name ?? ''
    const link = document.createElement('a')
    link.setAttribute('title', this.titleFor(name))
    link.dataset['emdBtn'] = name

    const customIcon = this.editor.options.toolbar.customIcons[name]
    const iconClass = this.editor.options.toolbar.icons[name] ?? ICON_CLASSES[name]
    if (customIcon) {
      link.innerHTML = customIcon
    } else if (iconClass) {
      link.innerHTML = `<i class="fa ${iconClass}"></i>`
    } else {
      link.innerHTML = `<i class="emd-icon-text">${ICON_TEXTS[name] ?? name}</i>`
    }
    li.append(link)
    return li
  }

  private bindClicks(): void {
    for (const unbind of this.unbinds) unbind()
    this.unbinds = []
    this.unbinds.push(
      on(this.el, 'click', (event) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>('[data-emd-btn]')
        if (!target) return
        const name = target.dataset['emdBtn'] ?? ''
        const custom = this.editor.options.toolbar.handlers[name]
        const handler = custom ?? builtinHandlers[name]
        if (!handler) return
        handler(this.editor)
        // 与原版一致：打开对话框/切换视图类动作不抢焦点，其余回到编辑器
        const keepEditorFocus = !NO_FOCUS_ACTIONS.has(name) && !custom
        if (keepEditorFocus) this.editor.focus()
      }),
    )
  }
}
