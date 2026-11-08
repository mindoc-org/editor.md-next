import type { CdnConfig } from '../types/settings';
/** KaTeX 最小结构类型（避免引入 @types/katex） */
interface KatexLike {
    renderToString(tex: string, options?: {
        displayMode?: boolean;
        throwOnError?: boolean;
    }): string;
}
interface MermaidLike {
    initialize(config: Record<string, unknown>): void;
    run(options: {
        nodes?: Iterable<HTMLElement>;
        suppressErrors?: boolean;
    }): Promise<void>;
}
declare global {
    interface Window {
        katex?: KatexLike;
        mermaid?: MermaidLike;
    }
}
/** 渲染容器内所有 .emd-tex / .emd-tex-display */
export declare function renderTexIn(container: HTMLElement, cdn: CdnConfig): Promise<void>;
/** 渲染容器内所有 .emd-mermaid（源文本在 data-emd-mermaid-src 中） */
export declare function renderMermaidIn(container: HTMLElement, cdn: CdnConfig, dark?: boolean): Promise<void>;
/** 渲染容器内所有 .emd-mindmap：重建 <script type="text/template"> 后加载 markmap-autoloader */
export declare function renderMindmapIn(container: HTMLElement, cdn: CdnConfig): Promise<void>;
export {};
//# sourceMappingURL=cdn-lazy.d.ts.map