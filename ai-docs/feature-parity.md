# 功能对照矩阵（原版 → editor.md-next）

> 原版基线：IBM Skills Network fork v1.7.17（pandao 1.5.0 内核），`src/editormd.js` 5162 行 + `css/editormd.css` 4356 行。
> 状态图例：✅ 已实现｜🚧 施工中｜⬜ 计划（对应 TODO.md 阶段）｜❌ 明确不做
>
> **维护说明**：本表是 P0 立项时的**原版能力对照基线**（用于确认"原版有的我们都要有"），
> 各阶段实际完成度以 `TODO.md` 为准（P0~P11 已全部勾选）。原版没有的**新增能力**
> （协同编辑、Vue/React 适配、离线部署等）记录在文末「0.2.0 新增能力」表，不混入本表。

## 编辑器核心

| 原版能力 | 状态 | 说明 |
|---|---|---|
| CodeMirror 编辑区（gfm/markdown 模式） | ⬜ P2 | CM6 lang-markdown（GFM：表格/删除线/任务列表/autolink） |
| 行号 / 自动换行 / tabSize / indentWithTabs | ⬜ P2 | |
| placeholder / autoFocus / readOnly | ⬜ P2/P7 | CM6 原生 placeholder |
| activeLine 高亮 / 括号匹配 / 自动闭合括号标签 | ⬜ P2 | closeBrackets；autoCloseTags 评估后定 |
| autoHeight | ⬜ P7 | CM6 viewportMargin: Infinity |
| codeFold（编辑区折叠，Ctrl-Q） | ⬜ P4 | CM6 foldGutter + markdown fold |
| searchReplace | ⬜ P4 | CM6 search panel + i18n 短语 |
| disabledKeyMaps | ⬜ P4 | 改名 disabledKeys |
| 拖拽/粘贴上传图片 | ⬜ P6 | 增强：原版 fork 无此功能 |
| 多实例 / 动态创建 / destroy | ⬜ P7 | destroy 为新增 |

## 工具栏

| 原版能力 | 状态 | 说明 |
|---|---|---|
| full / simple / mini 三模式 | ⬜ P4 | |
| 按钮：undo redo bold del italic quote ucwords uppercase lowercase h1-h6 list-ul list-ol hr link reference-link image code preformatted-text code-block table datetime emoji html-entities pagebreak goto-line watch preview fullscreen clear search help changetheme info | ⬜ P4 | changetheme 保留为「切换浅/深」按钮 |
| fork 的 dropdown / dropdownIcon 语法 | ⬜ P4 | `dropdown:Name:a,b,c` |
| toolbarIcons / toolbarIconsClass / toolbarIconTexts / toolbarCustomIcons / toolbarHandlers / toolbarTitles | ⬜ P4 | 新 API 收敛进 `toolbar.*` 分组 |
| autoFixed（滚动固定） | ⬜ P4 | |
| FontAwesome 4 图标 | ⬜ P2 起 | font-awesome 4.7 随包 vendor |

## 对话框（原版 plugins/*.js → 新 dialogs/*.ts）

| 对话框 | 状态 | 说明 |
|---|---|---|
| 框架（拖拽/遮罩/zIndex/lockScreen/loading/按钮） | ⬜ P5 | |
| link | ⬜ P5 | |
| reference-link | ⬜ P5 | fork 缺失此插件，按 pandao 行为重写 |
| image（URL/上传双 tab） | ⬜ P5/P6 | fork 缺失此插件，按 pandao 重写 |
| code-block（36 语言选择 + 内嵌编辑器） | ⬜ P5 | 内嵌 CM6；语言映射来自 language-data |
| preformatted-text | ⬜ P5 | |
| table（行列 + 对齐） | ⬜ P5 | |
| emoji（github/twemoji/fa/logo 四 tab） | ⬜ P5 | 数据源 emoji 列表内置 |
| html-entities 网格 | ⬜ P5 | 实体表内置 |
| goto-line | ⬜ P5 | |
| help（内置 help.md） | ⬜ P5 | |
| info（关于） | ⬜ P5 | |

## Markdown 渲染（marked v4 → markdown-it 15）

| 原版能力 | 状态 | 说明 |
|---|---|---|
| 基础 GFM 渲染 + tables/breaks/smartypants | ⬜ P2 | |
| [TOC] / [TOCM]（下拉变体）/ tocTitle / tocStartLevel / tocDropdown / tocContainer | ⬜ P3 | 自研插件 + 锚点 slug（中文编码兼容） |
| taskList（复选框） | ⬜ P3 | |
| emoji：`:name:` github 图 / `:tw-x:` twemoji / `:fa-x:` FA / `:editormd-logo:` 字体 | ⬜ P3 | 时间格式 hh:mm:ss 豁免 |
| tex：`$$..$$` 行内与独立行 + ```math/latex/katex 围栏 | ⬜ P3 | KaTeX CDN 懒加载；不支持 `$..$`（与原版一致） |
| ```mermaid 代码块 | ⬜ P3 | mermaid CDN 懒加载 |
| ```mindmap(>HEIGHT)（markmap） | ⬜ P3 | markmap CDN 懒加载 |
| callouts：[info]/[warning]/[success]/[danger] | ⬜ P3 | fork 增强，保留 |
| 图片 `#size=WxH` / `#align=` | ⬜ P3 | fork 增强，保留 |
| atLink（@user→github） / emailLink | ⬜ P3 | |
| pageBreak：8+ `=` 独行 | ⬜ P3 | |
| 链接安全（javascript: 拦截）+ 外链 _blank | ⬜ P3 | |
| htmlDecode / XSS 消毒 | ⬜ P3 | js-xss → DOMPurify |
| 预览代码高亮 + 行号 | ⬜ P3 | prettify+hljs 双轨 → 仅 hljs |
| 预览代码折叠 | ⬜ P3 | 原版 codeFold 仅编辑区；预览折叠为新增增强 |
| ~~```drawio~~ | ❌ | 记录于 TODO 远期 |
| sync scroll（百分比 + TOC 高度补偿，single 方向模式） | ⬜ P2 | |
| 目录下拉菜单（hover） | ⬜ P3 | |

## API（全新设计）

| 原版 | 新 API | 状态 |
|---|---|---|
| `editormd(id, options)` 工厂 | `new EditorMD(el, options)` | ⬜ P2 |
| settings 回调（onload/onchange/…） | 类型化事件总线 on/off/once/emit | ⬜ P2 |
| getMarkdown/setMarkdown/appendMarkdown/insertValue/getHTML/getPreviewedHTML | 同名保留（新 API 下为现代方法） | ⬜ P2/P7 |
| watch/unwatch/previewing/fullscreen/gotoLine/clear/resize/config | watch/unwatch/toggleWatch/previewMode/fullscreen/gotoLine/clear/resize/config | ⬜ P2/P7 |
| 无 destroy | `destroy()` 新增 | ⬜ P2 |
| `editormd.markdownToHTML(id, options)` | `EditorMD.renderTo(el, options)` | ⬜ P7 |
| `editormd.$marked` 等静态句柄 | 不保留；`ed.cm` 暴露 EditorView | — |
| languages/*.js 全局覆盖式 i18n | 内置 zh-cn/en/zh-tw + `i18n` 配置项 | ⬜ P2 |
| 主题 theme/previewTheme/editorTheme | `editor.theme` / `preview.theme`（default/dark + 自定义 CM6 主题注入） | ⬜ P2/P7 |
| 31 个 CM5 editorTheme | ❌ 不迁移（可后续接 @uiw/codemirror-themes） | — |

## 上传

| 原版能力 | 状态 |
|---|---|
| imageUpload / imageFormats / imageUploadURL + 响应 `{success,url,message}` | ⬜ P6 |
| 字段名 `editormd-image-file` | ⬜ P6（保留字段名兼容服务端） |
| crossDomainUpload（iframe 回调） | ⬜ 远期 |

## 构建/交付

| 目标 | 状态 |
|---|---|
| npm 包 editor.md-next：esm + umd + d.ts + css | ⬜ P8 |
| CDN IIFE 全局 `editormd` + css + fonts | ⬜ P8 |
| demo 站（ESM 与 `<script>` 双方式示例） | ⬜ P9 |
| docs/ 用户文档 | ⬜ P10 |

## 0.2.0 新增能力（非原版对照）

| 能力 | 状态 | 说明 |
|---|---|---|
| 协同编辑拓展包 `editor.md-next-collab` | ✅ | yjs CRDT；独立包，不装不影响核心体积与行为 |
| 多人实时编辑 / 断线重连合并 | ✅ | y-protocols sync；WebSocket 指数退避 + 抖动重连 |
| 远程光标与选区（用户名 + 颜色） | ✅ | awareness；背景色经 `colorLight` 派生保持半透明（遵守选区铁律） |
| 撤销/重做（协同语义） | ✅ | core `undoRedoFacet` 统一入口：快捷键 / 工具栏按钮 / `editor.undo()` 同源 |
| 通道抽象 + 内置 WebSocket / BroadcastChannel | ✅ | 可桥接 Hocuspocus、PartyKit 等（实现 `CollabTransport`） |
| 参考 relay 服务端 | ✅ | 纯广播、不落盘；含心跳/异常隔离/体积上限，无鉴权需内网使用 |
| `@codemirror/*` 外置为 peer（ADR-007） | ✅ | 使 `editor.extensions` 对 npm 用户真正可用，CDN IIFE 保持自包含 |
| Vue 3 / React 组件适配 | ✅ | 受控绑定在协同模式下须降级为单向（文档已警示） |
