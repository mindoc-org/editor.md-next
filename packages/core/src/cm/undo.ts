/**
 * 撤销 / 重做扩展点。
 *
 * 默认（无注入）走 CodeMirror 内置 history —— 与 0.1.x 行为一致。
 * 协同编辑等场景通过 `undoRedoFacet.of(impl)` 注入自己的实现（如 Y.UndoManager），
 * 使**工具栏按钮与快捷键共用同一份语义**：不注入时按钮/键位都撤本地历史，
 * 注入后两者都走注入实现，不会出现"Ctrl-Z 正确、点按钮却撤到别人编辑"的割裂。
 *
 * 实现签名与 CM6 命令一致：返回 true 表示已处理，false 表示无可撤销内容。
 */
import { redo as cmRedo, undo as cmUndo } from '@codemirror/commands'
import { Facet } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

export interface UndoRedoImpl {
  undo: (view: EditorView) => boolean
  redo: (view: EditorView) => boolean
}

/** 多个实现同时存在时取最后一个（后注入者优先，符合 CM6 Compartment 习惯）。 */
export const undoRedoFacet = Facet.define<UndoRedoImpl, UndoRedoImpl | null>({
  combine: (values) => (values.length > 0 ? values[values.length - 1] : null),
})

/** 执行一次撤销：有注入实现优先，否则回退内置 history。 */
export function performUndo(view: EditorView): boolean {
  const impl = view.state.facet(undoRedoFacet)
  return impl ? impl.undo(view) : cmUndo(view)
}

/** 执行一次重做：有注入实现优先，否则回退内置 history。 */
export function performRedo(view: EditorView): boolean {
  const impl = view.state.facet(undoRedoFacet)
  return impl ? impl.redo(view) : cmRedo(view)
}
