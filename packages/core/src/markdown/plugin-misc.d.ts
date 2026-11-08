import type { MarkdownIt } from 'markdown-it';
export interface MiscPluginOptions {
    callouts: boolean;
    atLink: boolean;
    emailLink: boolean;
    pageBreak: boolean;
}
export declare function miscPlugin(md: MarkdownIt, options: MiscPluginOptions): void;
//# sourceMappingURL=plugin-misc.d.ts.map