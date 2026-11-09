/** 快捷键绑定：撤销/重做必须进入 keymap（协同场景由 undoRedoFacet 接管实现）。 */
import { describe, expect, it } from 'vitest'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import type { EditorMD } from '../editor'
import { buildShortcutKeymap } from './shortcuts'

/** buildShortcutKeymap 只读取 options.editor.disabledKeys，可用最小 stub。 */
const stubEditor = (disabledKeys: string[] = []): EditorMD =>
  ({ options: { editor: { disabledKeys } } }) as unknown as EditorMD

const keysOf = (editor: EditorMD): string[] => {
  const state = EditorState.create({ extensions: [buildShortcutKeymap(editor)] })
  // keymap facet 的每个扩展各贡献一个数组，运行时需要摊平（类型标注未体现嵌套）
  const groups = state.facet(keymap) as unknown as Array<Array<{ key?: string }>>
  return groups.flat().map((binding) => binding.key ?? '')
}

describe('buildShortcutKeymap', () => {
  it('撤销/重做绑定存在（不走 defaultKeymap 的隐式绑定）', () => {
    const keys = keysOf(stubEditor())
    expect(keys).toContain('Mod-z')
    expect(keys).toContain('Shift-Mod-z')
    expect(keys).toContain('Mod-y')
  })

  it('disabledKeys 可屏蔽撤销绑定', () => {
    const keys = keysOf(stubEditor(['Mod-z', 'undo']))
    expect(keys).not.toContain('Mod-z')
    // 未列入的仍然保留
    expect(keys).toContain('Shift-Mod-z')
  })
})
