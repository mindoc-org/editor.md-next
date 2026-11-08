/** 编辑器事件映射（emit/on 的类型来源）。 */
export interface EditorEvents {
    /** 编辑器初始化完成 */
    load: undefined;
    /** 内容变化（防抖后触发；即渲染管线完成时） */
    change: {
        markdown: string;
        html: string;
    };
    /** CM 原始变化（防抖前，实时触发） */
    input: undefined;
    /** 布局重算 */
    resize: {
        width: number;
        height: number;
    };
    /** 进入实况预览（分屏） */
    watch: undefined;
    /** 退出实况预览（仅编辑器） */
    unwatch: undefined;
    /** 进入全预览模式 */
    previewEnter: undefined;
    /** 退出全预览模式 */
    previewExit: undefined;
    /** 进入全屏 */
    fullscreenEnter: undefined;
    /** 退出全屏 */
    fullscreenExit: undefined;
    /** 编辑器滚动（ratio: 0~1） */
    scroll: {
        ratio: number;
    };
    /** 预览区滚动 */
    previewScroll: {
        ratio: number;
    };
}
//# sourceMappingURL=events.d.ts.map