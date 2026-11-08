/**
 * [TOC] / [TOCM] 目录插件 + 标题锚点。
 * - core 规则在块解析后收集标题（生成 slug 并设置 id），渲染 [TOC]/[TOCM] 占位符；
 * - 真正的目录 DOM 在 post-render 阶段填充（见 preview/toc.ts）。
 */
import { Slugger } from '@editormd-next/utils';
import type { MarkdownIt } from 'markdown-it';
export interface TocItem {
    text: string;
    level: number;
    slug: string;
}
export interface TocEnv {
    slugger: Slugger;
    tocItems: TocItem[];
}
export declare function tocPlugin(md: MarkdownIt): void;
//# sourceMappingURL=plugin-toc.d.ts.map