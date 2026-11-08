import type { EditorMD } from '../editor';
export declare class Toolbar {
    readonly el: HTMLElement;
    private editor;
    private unbinds;
    constructor(editor: EditorMD, slot: HTMLElement);
    /** 按当前 spec 渲染菜单 */
    render(): void;
    /** watch 状态切换后同步图标/标题 */
    syncWatchState(): void;
    destroy(): void;
    private titleFor;
    private renderItem;
    private bindClicks;
}
//# sourceMappingURL=toolbar.d.ts.map