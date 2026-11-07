/** 工具栏模式定义：full / simple / mini（对齐原版 editormd.toolbarModes）。 */

export type ToolbarModeName = 'full' | 'simple' | 'mini'

export const TOOLBAR_MODES: Record<ToolbarModeName, string[]> = {
  full: [
    'undo', 'redo', '|',
    'bold', 'del', 'italic', 'quote', 'ucwords', 'uppercase', 'lowercase', '|',
    'dropdown:Heading:h1,h2,h3,h4,h5,h6', '|',
    'list-ul', 'list-ol', 'hr', '|',
    'link', 'reference-link', 'image', 'code', 'preformatted-text', 'code-block', 'table', 'datetime', 'emoji', 'html-entities', 'pagebreak', '|',
    'goto-line', 'watch', 'preview', 'fullscreen', 'clear', 'search', '|',
    'help', 'changetheme', 'info',
  ],
  simple: [
    'undo', 'redo', '|',
    'bold', 'del', 'italic', 'quote', 'uppercase', 'lowercase', '|',
    'dropdown:Heading:h1,h2,h3,h4,h5,h6', '|',
    'list-ul', 'list-ol', 'hr', '|',
    'watch', 'preview', 'fullscreen', '|',
    'help', 'changetheme', 'info',
  ],
  mini: [
    'undo', 'redo', '|',
    'watch', 'preview', '|',
    'help', 'changetheme', 'info',
  ],
}

export interface DropdownSpec {
  kind: 'dropdown'
  /** 下拉组标题（i18n key 或原样文本） */
  title: string
  children: string[]
}

export interface ParsedToolbarItem {
  kind: 'button' | 'divider' | 'spacer' | 'dropdown'
  name?: string
  title?: string
  children?: string[]
}

/** 解析工具栏项：'名称' | '|' | '||' | 'dropdown:Title:a,b,c' | 'dropdownIcon:Title:a,b,c' */
export function parseToolbarItem(item: string): ParsedToolbarItem {
  if (item === '|') return { kind: 'divider' }
  if (item === '||') return { kind: 'spacer' }

  if (item.startsWith('dropdown:') || item.startsWith('dropdownIcon:')) {
    const [, title = '', list = ''] = item.split(':')
    return {
      kind: 'dropdown',
      title,
      children: list.split(',').map((s) => s.trim()).filter(Boolean),
    }
  }
  return { kind: 'button', name: item }
}

/** 把模式名/自定义数组解析为完整项列表 */
export function resolveToolbarSpec(spec: string | string[]): ParsedToolbarItem[] {
  const items = typeof spec === 'string' ? (TOOLBAR_MODES[spec as ToolbarModeName] ?? TOOLBAR_MODES.full!) : spec
  return items.map(parseToolbarItem)
}
