/** core 撤销扩展点：分派与优先级（不创建真实 EditorView，jsdom 下只用 state）。 */
import { describe, expect, it, vi } from 'vitest'
import { EditorState } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { performRedo, performUndo, undoRedoFacet } from './undo'
import type { UndoRedoImpl } from './undo'

/** performUndo/performRedo 只读 view.state，用最小假视图即可。 */
const fakeView = (state: EditorState): EditorView =>
  ({ state }) as unknown as EditorView

describe('undoRedoFacet', () => {
  it('未注入时 facet 为 null（走 core 内置 history）', () => {
    const state = EditorState.create({ doc: 'abc' })
    expect(state.facet(undoRedoFacet)).toBeNull()
  })

  it('注入后 performUndo/performRedo 分派到注入实现并透传返回值', () => {
    const impl: UndoRedoImpl = { undo: vi.fn(() => true), redo: vi.fn(() => false) }
    const state = EditorState.create({ extensions: [undoRedoFacet.of(impl)] })
    const view = fakeView(state)

    expect(performUndo(view)).toBe(true)
    expect(performRedo(view)).toBe(false)
    expect(impl.undo).toHaveBeenCalledTimes(1)
    expect(impl.redo).toHaveBeenCalledTimes(1)
  })

  it('多个实现同时存在时后注入者优先', () => {
    const first: UndoRedoImpl = { undo: () => false, redo: () => false }
    const second: UndoRedoImpl = { undo: () => true, redo: () => true }
    const state = EditorState.create({
      extensions: [undoRedoFacet.of(first), undoRedoFacet.of(second)],
    })
    expect(state.facet(undoRedoFacet)).toBe(second)
  })
})
