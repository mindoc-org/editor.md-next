import type { EditorMD } from '../editor';
export interface DialogButton {
    key: string;
    label: string;
    /** 点击回调；返回 false 或不返回视为关闭对话框 */
    action?: (dialog: Dialog) => void | false;
    primary?: boolean;
}
export interface DialogOptions {
    name: string;
    title: string;
    width?: number;
    /** 内容元素（可延迟构建） */
    content: HTMLElement | (() => HTMLElement);
    buttons?: DialogButton[];
    /** 关闭回调 */
    onClose?: () => void;
}
export declare class Dialog {
    readonly el: HTMLElement;
    readonly body: HTMLElement;
    readonly editor: EditorMD;
    private options;
    private mask;
    private unbinds;
    private closed;
    constructor(editor: EditorMD, options: DialogOptions);
    /** 打开：挂载 + 遮罩 + 居中 */
    open(): this;
    close(): void;
    /** 显示加载态（上传时使用） */
    loading(show: boolean): void;
    private center;
    private bindEvents;
    private bindDrag;
}
//# sourceMappingURL=dialog.d.ts.map