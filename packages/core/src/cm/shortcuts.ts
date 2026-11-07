/** 快捷键：编辑器内 keymap（30+）与窗口级 F9/F10/F11。对齐原版 editormd.keyMaps。 */
import { keymap } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import type { EditorMD } from '../editor'
import { builtinHandlers } from '../toolbar/handlers'

/** 快捷键 → 动作名（Mod = Ctrl/⌘；Shift/Alt 组合与原版一致） */
export const SHORTCUT_MAP: Record<string, string> = {
  'Mod-1': 'h1',
  'Mod-2': 'h2',
  'Mod-3': 'h3',
  'Mod-4': 'h4',
  'Mod-5': 'h5',
  'Mod-6': 'h6',
  'Mod-b': 'bold',
  'Mod-d': 'datetime',
  'Mod-Alt-g': 'goto-line',
  'Mod-h': 'hr',
  'Mod-i': 'italic',
  'Mod-k': 'code',
  'Mod-u': 'list-ul',
  'Shift-Mod-a': 'at-link',
  'Shift-Mod-c': 'code',
  'Shift-Mod-q': 'quote',
  'Shift-Mod-s': 'del',
  'Shift-Mod-k': 'shift-tex',
  'Shift-Alt-c': 'fenced-code',
  'Shift-Mod-Alt-c': 'code-block',
  'Shift-Mod-h': 'html-entities',
  'Shift-Alt-h': 'help',
  'Shift-Mod-e': 'emoji',
  'Shift-Mod-u': 'uppercase',
  'Shift-Alt-u': 'ucwords',
  'Shift-Mod-Alt-u': 'ucfirst',
  'Shift-Alt-l': 'lowercase',
  'Shift-Mod-i': 'image',
  'Shift-Mod-l': 'link',
  'Shift-Mod-o': 'list-ol',
  'Shift-Mod-p': 'preformatted-text',
  'Shift-Mod-t': 'table',
  'Shift-Alt-p': 'pagebreak',
  'Shift-Mod-n': 'clear',
  'Mod-f': 'search',
}

/** 窗口级功能键（编辑器失焦时也生效，对齐原版 window keydown 绑定） */
export const WINDOW_KEYS: Record<string, string> = {
  F9: 'watch',
  F10: 'preview',
  F11: 'fullscreen',
}

/** 构建编辑器内快捷键扩展（尊重 disabledKeys） */
export function buildShortcutKeymap(editor: EditorMD): Extension {
  const disabled = new Set(editor.options.editor.disabledKeys)
  const bindings: KeyBindingSpec[] = []

  for (const [key, action] of Object.entries(SHORTCUT_MAP)) {
    if (disabled.has(key) || disabled.has(action)) continue
    const handler = builtinHandlers[action]
    if (!handler) continue
    bindings.push({
      key,
      run: () => {
        handler(editor)
        return true
      },
    })
  }
  // 原生 undo/redo 已由 defaultKeymap 提供，此处不重复
  return keymap.of(bindings)
}

interface KeyBindingSpec {
  key: string
  run: (view: EditorView) => boolean
}

/** 绑定窗口级 F9/F10/F11；返回解绑函数列表 */
export function bindWindowKeys(editor: EditorMD): Array<() => void> {
  const disabled = new Set(editor.options.editor.disabledKeys)
  const unbinds: Array<() => void> = []

  for (const [key, action] of Object.entries(WINDOW_KEYS)) {
    if (disabled.has(key) || disabled.has(action)) continue
    const handler = builtinHandlers[action]
    if (!handler) continue
    const listener = (event: KeyboardEvent): void => {
      if (event.key !== key) return
      event.preventDefault()
      handler(editor)
    }
    window.addEventListener('keydown', listener)
    unbinds.push(() => window.removeEventListener('keydown', listener))
  }
  return unbinds
}
