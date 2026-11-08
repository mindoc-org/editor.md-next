import type { CdnConfig } from '../types/settings';
import type { TocItem } from '../markdown/plugin-toc';
export interface PostRenderOptions {
    toc: TocItem[];
    tocTitle: string;
    tocTitleFallback: string;
    tocStartLevel: number;
    tocDropdown: boolean;
    tocContainer?: string;
    codeHighlight: boolean;
    darkPreview: boolean;
    /** 重依赖开关（markdown.tex / mermaid / mindmap） */
    renderTex: boolean;
    renderMermaid: boolean;
    renderMindmap: boolean;
    cdn: CdnConfig;
}
export declare function postRenderPreview(container: HTMLElement, options: PostRenderOptions): void;
//# sourceMappingURL=post-render.d.ts.map