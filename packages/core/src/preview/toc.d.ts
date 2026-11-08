/** 目录渲染：把 TocItem[] 填入 [TOC] 占位符 / 外部容器 / 下拉菜单。 */
import type { TocItem } from '../markdown/plugin-toc';
export interface TocRenderOptions {
    /** 空串则使用 i18n 的 tocTitle */
    title: string;
    startLevel: number;
    /** 下拉菜单形态（[TOCM]） */
    dropdown: boolean;
    /** 渲染到预览区之外的 selector */
    container?: string;
    tocTitleFallback: string;
}
/** 渲染目录；返回实际挂载的元素（或 null） */
export declare function renderToc(items: TocItem[], options: TocRenderOptions): HTMLElement | null;
//# sourceMappingURL=toc.d.ts.map