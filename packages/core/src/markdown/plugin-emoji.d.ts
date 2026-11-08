/**
 * Emoji 插件：`:name:`（github 图片）、`:tw-code:`（twemoji）、
 * `:fa-name:`（FontAwesome 图标）、`:editormd-logo(-Nx)?:`（logo 字体）。
 * 时间格式 hh:mm:ss 豁免（与原版一致）。
 */
import type { MarkdownIt } from 'markdown-it';
export interface EmojiPluginOptions {
    githubPath: string;
    twemojiPath: string;
}
export declare function emojiPlugin(md: MarkdownIt, options: EmojiPluginOptions): void;
//# sourceMappingURL=plugin-emoji.d.ts.map