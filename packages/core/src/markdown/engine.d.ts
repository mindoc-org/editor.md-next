import type { MarkdownIt as MarkdownItInstance } from 'markdown-it';
import type { TocItem } from './plugin-toc';
import type { MarkdownConfig } from '../types/settings';
export interface RenderResult {
    html: string;
    toc: TocItem[];
}
export interface EngineOptions {
    codeHighlight: boolean;
}
export declare class MarkdownEngine {
    readonly md: MarkdownItInstance;
    private readonly sanitize;
    constructor(config: MarkdownConfig, options: EngineOptions);
    /** 渲染 markdown → { html, toc }（html 已消毒） */
    render(markdown: string): RenderResult;
}
//# sourceMappingURL=engine.d.ts.map