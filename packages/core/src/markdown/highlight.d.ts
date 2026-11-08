/** markdown-it highlight 回调：返回高亮 HTML；不认识的语言返回空串走默认转义。 */
export declare function highlightCode(code: string, lang: string): string;
export interface FoldOptions {
    /** 超过该行数的代码块出现折叠按钮 */
    threshold: number;
}
/** post-render：为高代码块包一层折叠容器（预览侧 codeFold，编辑器侧由 CM6 foldGutter 负责） */
export declare function foldCodeBlocks(container: HTMLElement, options: FoldOptions): void;
//# sourceMappingURL=highlight.d.ts.map