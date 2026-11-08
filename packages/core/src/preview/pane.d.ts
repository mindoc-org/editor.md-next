export declare class PreviewPane {
    readonly el: HTMLElement;
    constructor(parent: HTMLElement);
    render(html: string): void;
    /** 按比例滚动（0~1），供同步滚动使用 */
    scrollToRatio(ratio: number): void;
    currentRatio(): number;
}
//# sourceMappingURL=pane.d.ts.map