# AGENTS.md — 开发与协作规范

本文件面向在本仓库工作的开发者与 AI Agent，描述结构约定、编码规范与常用命令。

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 启动 demo 站（packages/demo，Vite dev server） |
| `pnpm build` | 按依赖顺序构建全部包（utils → core → demo） |
| `pnpm build:lib` / `pnpm build:cdn` | 仅构建 core 的 npm 产物 / CDN 产物 |
| `pnpm test` / `pnpm test:watch` | vitest 单测 |
| `pnpm typecheck` | 全 workspace `tsc --noEmit` |
| `pnpm check:lines` | 检查源码文件 ≤ 600 行（超限即 CI 失败） |
| `pnpm publish:all` | 构建并发布三个包到 npm（流程见 `RELEASING.md`） |

> **每次修改后的完整流程**（本地验证 → 提交 → push → Pages/npm 更新）见根目录 [`WORKFLOW.md`](WORKFLOW.md)，必须遵循。

## 目录与职责

```
packages/utils  @editormd-next/utils    私有；通用工具（dom/事件/异步/加载器等）
packages/core   editor.md-next          发布包；编辑器全部实现
packages/vue    editor.md-next-vue      Vue 3 组件适配（发布包）
packages/react  editor.md-next-react    React 组件适配（发布包）
packages/demo   @editormd-next/demo     私有；示例站（GitHub Pages 部署）
docs/                                   用户文档（安装、配置、API、扩展语法…）
ai-docs/                                开发文档（需求、架构决策、功能对照矩阵）
scripts/                               构建辅助脚本
```

**依赖方向铁律**：`demo → vue/react → core → utils`。`utils` 禁止 import 其他包；`core` 禁止 import 适配包/demo；适配包只允许 import `editor.md-next` 与各自框架（二者均外部化不打包）。utils 不单独发布（构建时打包进 core）。

## 编码规范

- TypeScript strict；`erasableSyntaxOnly` 开启 → **不用 enum/namespace/参数属性**，用 `const object + union type`。
- `verbatimModuleSyntax` 开启 → 类型导入必须 `import type`。
- **单文件 ≤ 600 行**（`pnpm check:lines` 强制）。超过就拆：按功能域拆模块，类采用“编排类 + 特性模块”组合而不是继承。
- 样式：CSS 原生 + CSS 自定义属性做主题；不引入 CSS 预处理器。入口 `packages/core/src/styles/index.css`。
- 注释与文档字符串用中文；标识符用英文。
- 面向用户的文档一律放 `docs/`；开发过程文档放 `ai-docs/`。不要混淆两者。
- 不引入 jQuery；DOM 操作用 `@editormd-next/utils` 的 dom 封装。
- **编辑区内任何行/元素背景必须保持半透明**（`.cm-activeLine`、`.cm-searchMatch` 等）——不透明行背景会盖住 z-index:-2 的选区绘制层，症状是"选区可用但不可见"。详见 `ai-docs/bugfix-cm6-selection-invisible.md`；改动选区/行背景必须做像素级验证。
- **禁止 `window.alert`/`confirm`/`prompt` 等阻塞式原生弹窗**（会阻塞 JS 线程，用户明确要求）：校验错误用对话框内 `.emd-form-error` 行内提示（`showErrorHint`）。
- 第三方重依赖（KaTeX/mermaid/markmap）一律 CDN 懒加载，禁止打进包体；hljs/markdown-it/codemirror 允许打包。

## 构建产物（core）

- `dist/es/`（npm ESM）、`dist/umd/`（CJS require）、`dist/index.iife.js`（CDN，全局名 `editormd`）
- `dist/types/`（tsc 产出的 `*.d.ts`，构建命令 `tsc -p tsconfig.build.json`）
- `dist/index.css` + `dist/assets/`（字体等资产）
- TS7（native）声明产出需要显式 `rootDir`，已在 `tsconfig.build.json` 配置——不要删除。

## 提交与里程碑

- 提交信息用中文，格式：`P<N>: <做了什么>`，例如 `P2: core 骨架——CM6 集成与渲染管线`。
- 每个阶段（P0~P11，见 `TODO.md`）结束时保证：`pnpm typecheck`、`pnpm test`、`pnpm build` 全绿，并勾选 TODO.md 对应项。
- 功能完成度以 `ai-docs/feature-parity.md` 为准，实现一项勾一项。
