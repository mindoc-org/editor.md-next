# 从 editor.md 迁移

editor.md-next 是**全新 API**（用户决策），功能对齐原版但配置键名与方法名有变化。本章给出映射表。

## 引入方式

| 原版 | editor.md-next |
| --- | --- |
| `<script src="editormd.min.js">` + jQuery | `<script src="…/editormd-next.min.js">`（无依赖） |
| 全局 `editormd(id, options)` | 全局 `editormd.EditorMD`（命名空间 `{ EditorMD, renderTo, defaults, VERSION }`） |
| `import 'editormd'`（CommonJS） | `import { EditorMD } from 'editor.md-next'`（ESM，含 `*.d.ts`） |
| 手动管理 `path` 与依赖加载 | 无需 `path`：核心自包含，重依赖 CDN 懒加载 |

## 构造与常用方法

| 原版 | editor.md-next |
| --- | --- |
| `editormd(id, options)` | `new EditorMD(el, options)` |
| `editormd.markdownToHTML(id, options)` | `EditorMD.renderTo(el, options)` |
| `getMarkdown` / `setMarkdown` / `appendMarkdown` / `insertValue` / `getHTML` / `getPreviewedHTML` / `clear` | 同名保留（`getHTML` → `getHtml`） |
| `watch` / `unwatch` | 同名；新增 `toggleWatch` |
| `previewing` / `previewed` | `togglePreviewMode()` |
| `fullscreen` / `fullscreenExit` | `toggleFullscreen()` |
| `gotoLine('first'/n)` | `gotoLine(n \| 'first' \| 'last')` |
| `config(key, value)` / `set` / `extend` | `config(patchOptions)`（深合并重建） |
| 无 | `destroy()`（新增，切换页面时务必调用） |

## 配置映射（常用）

| 原版 settings | editor.md-next |
| --- | --- |
| `markdown` / `appendMarkdown` | `value`（初始内容） |
| `theme` | `editor.theme`（`'default' \| 'dark' \| CM6主题扩展`） |
| `previewTheme` | `preview.theme` |
| `editorTheme`（CM5 主题名） | `editor.theme`（内置两套；CM5 主题名不迁移，见下） |
| `toolbarIcons` / `toolbarIconsClass` / `toolbarCustomIcons` / `toolbarHandlers` / `toolbarTitles` | `toolbar.spec` / `toolbar.icons` / `toolbar.customIcons` / `toolbar.handlers` / `toolbar.titles` |
| `toc` / `tocm` / `tocTitle` / `tocStartLevel` / `tocDropdown` / `tocContainer` | `markdown.toc: { enable, title, startLevel, dropdown, container }` |
| `taskList` / `emoji` / `tex` / `flowChart` / `sequenceDiagram` | `markdown.taskList` / `markdown.emoji` / `markdown.tex` / `markdown.mermaid`（flowchart/sequence 语法归入 mermaid，旧 ```flow/```seq 语法不迁移） |
| `htmlDecode` | `markdown.htmlDecode`（消毒独立为 `markdown.sanitize`） |
| `imageUpload` / `imageUploadURL` / `imageFormats` | `upload.image` / `upload.url` / `upload.formats` |
| `disabledKeyMaps` | `editor.disabledKeys` |
| `onload` / `onchange` / `onfullscreen` … | `on: { load, change, fullscreenEnter… }` 或事件总线 `editor.on(...)` |
| `saveHTMLToTextarea` | `preview.saveHtml`（配合顶层 `name`） |
| `syncScrolling` | `preview.syncScroll`（`true \| false \| 'single'`） |
| `placeholder` / `autoFocus` / `autoHeight` / `readOnly` / `lineNumbers` / `tabSize` | 移入 `editor.*` 分组 |

## 明确不迁移

- **jQuery / Zepto / RequireJS / SeaJS 加载方式**
- CM5 的 31 个 `editorTheme` 主题与 `path` 动态依赖加载（CM6 主题体系不同；可注入自定义主题）
- `flowchart.js` + `js-sequence-diagrams` 旧语法（```flow / ```seq）——统一用 ```mermaid
- `drawio` 代码块（远期 TODO）
- Skills Network fork 的品牌化 titlebar 与 `author_ide_version`
- `onunload`（原版也无）
- `editormd.$marked` 等内部静态句柄（改为 `editor.cm` 暴露 CM6 视图）

## 新增能力

`destroy()` 生命周期、真正的事件总线（`once`/`off`/`emit`）、粘贴/拖拽图片上传、预览代码折叠、自定义语言包与对话框注册、完整 TypeScript 类型。

## emoji 图片

原版 `:name:` 默认走 webpagefx 图片 CDN，本版保持一致（可配 `markdown.emojiGithubPath` 换源或指向自托管目录）。
