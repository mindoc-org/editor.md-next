/** 对话框注册表：名称 → 打开函数。 */
import type { EditorMD } from '../editor';
import type { Dialog } from './dialog';
export type DialogFactory = (editor: EditorMD) => Dialog;
/** 注册自定义对话框（覆盖同名内置） */
export declare function registerDialog(name: string, factory: DialogFactory): void;
export declare function openRegisteredDialog(editor: EditorMD, name: string): Dialog | null;
//# sourceMappingURL=registry.d.ts.map