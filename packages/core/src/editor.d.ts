/**
 * EditorMD —— 编辑器编排核心。
 * 组装 CM6 视图、渲染管线、预览面板与同步滚动；对外暴露新 API。
 * config() 支持原位重建：teardown 内部结构后用新配置重新 setup。
 */
import { EventEmitter } from '@editormd-next/utils';
import type { UploadResult } from '@editormd-next/utils';
import type { EditorView } from '@codemirror/view';
import type { MountedDom } from './lifecycle/mount';
import type { EditorEvents } from './types/events';
import type { LangDict } from './types/lang';
import type { EditorOptions, EditorUserOptions } from './types/settings';
import type { ThemeName } from './types/common';
import type { Extension } from '@codemirror/state';
export interface EditorState {
    watching: boolean;
    loaded: boolean;
    destroyed: boolean;
    /** 全窗口预览中 */
    previewing: boolean;
    /** 全屏中 */
    fullscreen: boolean;
}
export declare class EditorMD {
    /** 静态渲染：把 markdown 渲染为只读 HTML（替代原版 editormd.markdownToHTML） */
    static renderTo(target: string | HTMLElement, options?: EditorUserOptions): HTMLElement;
    options: EditorOptions;
    /** 当前语言字典（i18n 运行时切换用） */
    lang: LangDict;
    /** CM6 编辑视图（高级用法可直接操作） */
    cm: EditorView;
    dom: MountedDom;
    state: EditorState;
    /** 事件总线：on/off/once/emit */
    readonly emitter: EventEmitter<EditorEvents>;
    private engine;
    private previewPane;
    private syncHandle;
    private toolbar;
    private themeCompartment;
    private debouncedRender;
    private lastHtml;
    private unbinds;
    /** 用户挂在容器上的原始 class，重建时恢复 */
    private initialClassName;
    constructor(target: string | HTMLElement, userOptions?: EditorUserOptions);
    /** 当前 markdown 文本 */
    getMarkdown(): string;
    /** 整体替换 markdown（程序性替换，立即渲染） */
    setMarkdown(markdown: string): this;
    /** 在文档末尾追加 markdown */
    appendMarkdown(markdown: string): this;
    /** 在光标处插入文本 */
    insertValue(value: string): this;
    /** 最近一次渲染产出的 HTML */
    getHtml(): string;
    /** 预览区当前 DOM 内的 HTML */
    getPreviewedHtml(): string;
    /** 清空内容 */
    clear(): this;
    /** 开启实况预览（分屏） */
    watch(): this;
    /** 关闭实况预览（仅编辑器） */
    unwatch(): this;
    toggleWatch(): this;
    /** 切换编辑区主题（内置名称或 CM6 主题扩展） */
    setEditorTheme(theme: ThemeName | Extension): this;
    /** 切换预览区主题 */
    setPreviewTheme(theme: ThemeName): this;
    /** 一键切换浅/深（changetheme 按钮） */
    toggleTheme(): this;
    /** 按名称打开对话框（link/referenceLink/image/codeBlock/table/emoji/…） */
    openDialog(name: string): void;
    /** 跳转到指定行（1 基；支持 'first'/'last'），并同步预览滚动 */
    gotoLine(line: number | 'first' | 'last'): this;
    /** 上传图片文件（响应协议 {success,url,message}，兼容原版服务端） */
    uploadImage(file: File, onProgress?: (percent: number) => void): Promise<UploadResult>;
    /** 全窗口 HTML 预览切换（ESC 退出） */
    togglePreviewMode(): this;
    /** 全屏切换（ESC 退出） */
    toggleFullscreen(): this;
    focus(): this;
    /** 订阅事件，返回解绑函数 */
    on<K extends keyof EditorEvents>(event: K, listener: (payload: EditorEvents[K]) => void): () => void;
    /** 订阅一次性事件 */
    once<K extends keyof EditorEvents>(event: K, listener: (payload: EditorEvents[K]) => void): () => void;
    /** 解绑事件 */
    off<K extends keyof EditorEvents>(event: K, listener?: (payload: EditorEvents[K]) => void): void;
    /** 触发事件（自定义扩展事件用） */
    emit<K extends keyof EditorEvents>(event: K, payload: EditorEvents[K]): void;
    /**
     * 深合并部分配置并原位重建（保留当前 markdown 内容）。
     * 注意：结构型配置（宽高/工具栏/预览开关）都走重建，成本可接受。
     */
    config(patch: EditorUserOptions): this;
    /** 销毁编辑器：移除视图、解绑事件、还原容器 */
    destroy(): void;
    private setup;
    private teardown;
    private resolveTarget;
    /** 渲染管线：markdown → 引擎 → 预览/textarea → 后处理 → change 事件 */
    renderNow(): void;
    private bindWindowEvents;
}
//# sourceMappingURL=editor.d.ts.map