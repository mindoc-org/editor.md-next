# 架构决策记录（ADR）

> 施工过程中新增决策追加到本文件末尾，格式：日期 + 决策 + 理由。

## ADR-001 技术栈（2026-11-08）

- **CodeMirror 6**（codemirror 元包 + @codemirror/lang-markdown + language-data）：原版 CM5 的 mode/addon 生态不可迁移，CM6 的 lezer 体系原生支持 GFM。
- **markdown-it 15**：自带类型；TOC/TOCM、emoji、tex、callout、pageBreak、图片 size/align 用自研插件/渲染规则实现；DOMPurify 替代 js-xss 做消毒。
- **重依赖懒加载**：KaTeX / mermaid 12 / markmap 一律 CDN 动态加载（默认 jsdelivr，URL 可配；页面已有全局对象则优先使用）。核心包只打包 CM6 + markdown-it + hljs + DOMPurify + FA css。
- **highlight.js** 内置（常用语言子集），替代原版 prettify + hljs 双轨。
- **font-awesome 4.7** 随包 vendor：工具栏图标类名与 `:fa-x:`/`:editormd-logo:` emoji 依赖它；editormd-logo 字体从原仓库 vendor（MIT/OFL，LICENSE 保留署名）。
- **无 external 的全打包**：core 产物自包含，避免 npm 用户的 peer 依赖地狱；CM6/markdown-it 体积可接受，tree-shaking 让位于"开箱即用"。

## ADR-002 构建与声明产物（2026-11-08）

- Vite 8（rolldown 内核）lib 模式三格式：`es`（npm import）、`umd`（require）、`iife`（CDN 全局 `editormd`）。已冒烟通过。
- `*.d.ts` 用 `tsc -p tsconfig.build.json`（emitDeclarationOnly + 显式 rootDir）产出，**不使用 vite-plugin-dts**。TS7 native 需要 rootDir 显式设置（否则 TS5011）。
- CSS：`cssCodeSplit: false`，`assetFileNames` 固定 `index.css`；rolldown lib 模式会把字体资源内联为 data URL（观察到的行为），P8 用自定义 @font-face（woff2/woff）精简。
- rolldown lib 模式当前**强制内联 css url() 资源**（`assetsInlineLimit: 0` 无效）——精简字体格式是现阶段唯一的减重手段。

## ADR-003 API 形态（2026-11-08）

- 全新 API（用户拍板）：`new EditorMD(el | selector, options)`；options 分组为 editor/preview/toolbar/markdown/upload/dialog/i18n。
- 事件总线类型化：`on/off/once/emit`；事件名 `load/change/resize/watch/unwatch/previewEnter/previewExit/fullscreenEnter/fullscreenExit/scroll/previewScroll`。
- 原 settings 键名不承诺兼容；响应协议 `{success,url,message}` 与上传字段名 `editormd-image-file` 是仅有的两个对外兼容点（服务端生态）。
- 静态渲染 API：`EditorMD.renderTo(el, options)` 替代 `editormd.markdownToHTML`。

## ADR-004 包结构（2026-11-08）

- 三包：`utils`（私有，源码直引，构建时打进 core）、`core`（发布）、`demo`（私有，GH Pages）。
- 后续演进（2026-11-09，0.2.0）：新增 `vue` / `react` / `collab` 三个发布包，ADR-004 的「三包」仅描述 0.1.x 时的结构；当前发布包为四个，依赖方向见 `AGENTS.md`。
- utils 以 TS 源码形式被 core 引用（package.json `types`/`main` 指向 `src/index.ts`），无独立构建步骤；未来需要独立发布时再加 build。
- core 的 d.ts 会连带产出 utils 的 `dist/types/src/index.d.ts`（tsc 对依赖源码文件的正常行为），属预期。

## ADR-005 mermaid 渲染串行化（2026-11-08）

- 现象：构建版示例站间歇性出现 mermaid "Syntax error in text"（dev 源码模式难复现）。
- 根因：输入期间连续渲染使两次 `mermaid.run` 并发执行；mermaid 11 内部状态不可重入（内部 id 用时间戳生成会撞车）。
- 修复：renderMermaidIn 引入 promise 串行队列；收集节点时立即标记 rendered（消除两次渲染收集窗口重叠导致的重复处理）；源文本继续走 data-emd-mermaid-src + textContent 注入。
- 压测：36 次快速 setMarkdown（3 轮 × 12 次，4 种图交替）+ 示例编辑器并发渲染，0 个 error svg。

## ADR-006 mermaid 真正根因与 emoji 三连修（2026-11-08）

- **mermaid 真正根因**：DOMPurify 3.2+ 默认 `SAFE_FOR_XML` 会**剥掉值中含 `-->` 的属性**（mermaid 源文本必然含箭头）；时序图 `->>` 不匹配该模式所以一直正常，造成"看似随机"的假象。此前所有"渲染成功"探针都是假阳性——mermaid 错误炸弹 svg 没有 `.error` class。教训：探针必须检测炸弹文本本身（`Syntax error`），而非 svg 存在性。
- 修复：mermaid/mindmap/tex 源文本统一 **base64 进 data 属性**（`markdown/data-attr.ts` 的 encode/decodeDataAttr），属性值中不再出现 `-->`，不削弱 SAFE_FOR_XML 安全默认。文本节点中的 `-->` 不受 SAFE_FOR_XML 影响，普通正文无损（已实测）。
- **emoji 图源**：webpagefx CDN 已死 → 默认改 githubassets 官方源 + gemoji 别名→unicode 映射（`emoji-unicode.ts`，877 名中 858 个走 unicode 路径，其余 GitHub 专属 emoji 走名字路径）。
- **时间豁免**：hh:mm:ss 先遮蔽-扫描-还原（原实现只测 name，导致 `12:30:45` 中 `:30:` 被转成图片）。
- **logo 字形**：移植原版 `editormd.logo.css` 字形/尺寸类（此前 fonts.css 只声明了字体，没有字形映射）。
- 诊断基建：mermaid 预解析失败会打 console 并写入 localStorage（`emd-mermaid-failure`），含确切源文本。
- **第三层根因（`.cm-activeLine` 不透明背景遮挡选区层）与像素级验证方法见 `bugfix-cm6-selection-invisible.md`，该文为准。**
- **选区高亮不可见（本文 ①② 只是前两层）**：① 主题把白色背景设在 `.cm-editor` 根上，而 drawSelection 的选区层是 z-index:-2 的后代——负 z-index 后代被画在根背景**之下**，高亮被完全盖住（选区功能正常、Ctrl+X 可剪切，仅视觉消失）。修复：主题根元素加 position:relative + zIndex:0 使其形成层叠上下文，选区层画在背景之上。② 修完仍不显眼：CM 默认主题的聚焦选区规则 `&light.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground`（#d7d4f0，特异度 0,4,1）压过我们普通规则（0,2,0）——需用同位高特异度选择器申明品牌色。教训：给 .cm-editor 设不透明背景的主题必须让它形成层叠上下文；自定义选区色必须对齐 CM 默认的选择器特异度。
- **mindmap 重渲染**：markmap-autoloader 0.18 无 MutationObserver（只在脚本加载时处理一次静态节点），编辑后新节点永远不会被转换 → 改为直接加载 d3/markmap-lib/markmap-view 三件套（CDN 地址由 `cdn.markmapBase` 推导），每次渲染用 Transformer.transform + Markmap.create 全新构建。
- **对话框拖拽**：改用 Pointer Events + setPointerCapture（旧实现往 body 加 user-select:none，鼠标在窗口外释放时类残留 → 全页无法选中文本）。

## ADR-007 core npm 产物外置化 @codemirror/*（2026-11-09，0.2.0）

- **决策**：es/umd 产物 external `@codemirror/*` + `@lezer/*` 并从 `dependencies` 移到 `peerDependencies`（devDependencies 保留供构建/测试）；IIFE/CDN 产物**继续全打包自包含**（`<script>` 用法不变）；markdown-it / hljs / DOMPurify 维持内联（markdown-it 插件是纯函数，跨实例安全，无需共享模块身份）。
- **根因**：CM6 的 `resolveExtensions` 用 `instanceof` 识别扩展，**全页只允许一份 `@codemirror/state`**，跨副本注入直接抛 `Unrecognized extension value ... two copies of @codemirror/state`。现状全打包导致：`editor.extensions` 对 npm 产物用户实际不可用（`docs/plugins.md` 旧注记只在源码构建场景成立）；任何外部 CM6 扩展包（协同拓展包等）无法注入。
- **修订对象**：ADR-001 的"无 external 的全打包"。CM6 ^6 生态版本冻结、peer 地狱风险可控（npm ≥7 自动安装 peer）。
- **附带收益**：core npm 产物显著减重（CM6/lezer 系占主 chunk 相当比例）；`editor.extensions` 修成真正可用的扩展生态入口。
- **验证点**：`@codemirror/language-data` 外置后的 UMD 动态 require、demo（workspace 源码引用）与 npm 产物两种路径的注入冒烟。

## ADR-008 协同编辑拓展包 editor.md-next-collab（2026-11-09，0.2.0）

- **决策**：协同能力以独立发布包 `editor.md-next-collab` 承载（与 vue/react 平级）。引擎选 **yjs 13 稳定线**（`yjs ^13.5.6` peer + `y-codemirror.next ^0.3.6` + `y-protocols`），不追 Yjs v14（`@y/codemirror` 为 unstable 开发分支）。版本 0.2.0 与四包（core / vue / react / collab）对齐。
- **要点**：`CollabTransport` 通道抽象（服务端纯广播 relay，内网友好）+ 内置 `websocketTransport` / `broadcastChannelTransport`；撤销经 core 新增的 `undoRedoFacet` 注入 `Y.UndoManager`——**快捷键、工具栏按钮、`editor.undo()` 三者同源**（最初只用 `Prec.highest` 压键位，实现期发现工具栏按钮仍走内置 history、会撤到他人编辑，故提升为 core 的通用扩展点；详见 `collab-design.md` §5.2）；远程光标/选区内置（awareness，遵守半透明铁律）；仅支持 npm/bundler 场景（CDN 双实例约束，见 ADR-007）。
- **依赖声明**：`editor.md-next` 与 `@codemirror/*` / `yjs` 一律走 `peerDependencies`（npm ≥ 7 会自动安装并去重），**不写 `dependencies`**。原因：facet 身份由模块实例决定，拓展包必须与宿主共享同一份 `@codemirror/state` 与 core 实例；自带副本会让 `undoRedoFacet` 注入静默失效（撤销退回会撤到他人编辑）。副作用是 npm 页面的 Dependents 只统计 `dependencies`、不统计 peer，故 collab **不会**出现在 `editor.md-next` 的 dependents 列表——这是预期行为，与 vue/react 采用 `dependencies` 的声明方式有意不同。
- **调研与设计全文**：`ai-docs/collab-design.md`。被拒绝的备选（OT 路线、core 内置、core re-export 方案）见该文 §1.2。
