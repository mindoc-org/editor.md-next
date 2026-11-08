import type { EditorMD } from '../editor';
import { Dialog } from './dialog';
export declare function formRow(labelText: string, input: HTMLElement): HTMLElement;
export declare function textInput(placeholder?: string): HTMLInputElement;
/** 打开对话框并可选地在确认时执行动作；回车键触发主按钮。 */
export declare function openWithEnter(editor: EditorMD, dialog: Dialog): void;
/**
 * 在对话框 body 内显示行内错误提示。
 * 不用 window.alert —— 原生弹窗会阻塞 JS 线程（用户明确要求）。
 */
export declare function showErrorHint(dialog: Dialog, message: string): void;
//# sourceMappingURL=form.d.ts.map