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
- utils 以 TS 源码形式被 core 引用（package.json `types`/`main` 指向 `src/index.ts`），无独立构建步骤；未来需要独立发布时再加 build。
- core 的 d.ts 会连带产出 utils 的 `dist/types/src/index.d.ts`（tsc 对依赖源码文件的正常行为），属预期。
