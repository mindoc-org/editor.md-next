import type { Extension } from '@codemirror/state';
import type { EditorMD } from '../editor';
/** 快捷键 → 动作名（Mod = Ctrl/⌘；Shift/Alt 组合与原版一致） */
export declare const SHORTCUT_MAP: Record<string, string>;
/** 窗口级功能键（编辑器失焦时也生效，对齐原版 window keydown 绑定） */
export declare const WINDOW_KEYS: Record<string, string>;
/** 构建编辑器内快捷键扩展（尊重 disabledKeys） */
export declare function buildShortcutKeymap(editor: EditorMD): Extension;
/** 绑定窗口级 F9/F10/F11；返回解绑函数列表 */
export declare function bindWindowKeys(editor: EditorMD): Array<() => void>;
//# sourceMappingURL=shortcuts.d.ts.map