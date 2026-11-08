/** editor.md-next —— TypeScript + CodeMirror 6 重写的 Markdown 编辑器。 */
import './styles/index.css';
export { EditorMD } from './editor';
export type { EditorState } from './editor';
export { renderTo } from './render-to';
export { defaults, VERSION } from './defaults';
export { registerLang, listLangs, resolveLang } from './i18n';
export { registerDialog } from './dialogs/registry';
export type { Dialog, DialogOptions, DialogButton } from './dialogs/dialog';
export type { EditorEvents } from './types/events';
export type { LangDict } from './types/lang';
export type { EditorOptions, EditorUserOptions, MarkdownConfig, MarkdownItPlugin, PreviewSectionConfig, EditorSectionConfig, ToolbarConfig, ToolbarMode, ToolbarSpec, ToolbarHandler, TocOptions, UploadConfig, DialogConfig, CdnConfig, I18nOption, } from './types/settings';
export type { ThemeName, I18nCode, WidthOrHeight } from './types/common';
//# sourceMappingURL=index.d.ts.map