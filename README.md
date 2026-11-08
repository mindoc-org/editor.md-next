# editor.md-next

> [Editor.md](https://github.com/pandao/editor.md) 的 TypeScript 重写版 —— 基于 CodeMirror 6 与 markdown-it 的现代 Markdown 编辑器。

[![npm version](https://img.shields.io/npm/v/editor.md-next?label=editor.md-next)](https://www.npmjs.com/package/editor.md-next)
[![npm version](https://img.shields.io/npm/v/editor.md-next-vue?label=editor.md-next-vue)](https://www.npmjs.com/package/editor.md-next-vue)
[![npm version](https://img.shields.io/npm/v/editor.md-next-react?label=editor.md-next-react)](https://www.npmjs.com/package/editor.md-next-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/示例站-GitHub%20Pages-blue?logo=github)](https://mindoc-org.github.io/editor.md-next/)

原版 editor.md 是 jQuery + CodeMirror 5 时代的经典 Markdown 编辑器，但核心源码集中在 5000+ 行的单文件中且缺乏维护。editor.md-next 在保留其功能集的前提下全面重构：

- **全 TypeScript**，严格模式，ESM 模块化拆分（单文件 ≤ 600 行），无 jQuery
- **CodeMirror 6**（GFM：表格/删除线/任务列表/代码块语言高亮）
- **markdown-it** 渲染 + **DOMPurify** 消毒
- 完整功能集：工具栏三模式 + 下拉组、38 个按钮、11 个对话框、30+ 快捷键、TOC/TOCM、四类 Emoji、KaTeX 公式、mermaid 流程图/时序图、markmap 脑图、Callout 提示块、分页符、图片尺寸对齐、图片上传 + 粘贴/拖拽、全窗口预览、全屏、同步滚动、i18n
- KaTeX / mermaid / markmap **按需 CDN 懒加载**，核心包保持轻量
- 双产物：npm 包（ESM + UMD + `*.d.ts` + CSS）+ CDN IIFE（全局 `editormd`）

## 安装

### npm（ESM）

```bash
pnpm add editor.md-next
```

```ts
import { EditorMD } from 'editor.md-next'
import 'editor.md-next/css'

const editor = new EditorMD('#editor', {
  value: '# Hello\n\n开始编辑…',
  width: '100%',
  height: 520,
})
```

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/editor.md-next/dist/index.css">
<div id="editor" style="height: 480px"></div>
<script src="https://cdn.jsdelivr.net/npm/editor.md-next/dist/cdn/editormd-next.min.js"></script>
<script>
  new editormd.EditorMD('#editor', { value: '# Hello' })
</script>
```

### 静态渲染（博客/文档页）

```ts
import { renderTo } from 'editor.md-next'
renderTo('#doc', { value: markdownText })
```

完整文档见 [`docs/`](docs/)：[快速上手](docs/getting-started.md) · [配置项](docs/configuration.md) · [API](docs/api.md) · [扩展语法](docs/markdown-extensions.md) · [从 editor.md 迁移](docs/migration-from-editormd.md)。

## 开发

```bash
pnpm install
pnpm dev          # 启动示例站（14 个示例）
pnpm build        # 构建全部包（utils → core → demo）
pnpm build:lib    # 仅构建 core（esm/umd/iife + d.ts + css）
pnpm build:cdn    # 仅构建 core 的 CDN 产物（dist/cdn/）
pnpm test         # vitest 单测
pnpm typecheck    # 全 workspace 类型检查
pnpm check:lines  # 源码 ≤600 行检查
pnpm publish:all  # 构建并发布 core/vue/react 到 npm（见 RELEASING.md）
pnpm deploy:pages # 示例站部署到 GitHub Pages（gh-pages 分支）
```

> 每次修改后的标准流程（验证/提交/Pages/npm）见 [`WORKFLOW.md`](WORKFLOW.md)；npm 登录与发布细节见 [`RELEASING.md`](RELEASING.md)。

## 发布包

| 包 | 版本 | 说明 |
| --- | --- | --- |
| [editor.md-next](https://www.npmjs.com/package/editor.md-next) | [![npm](https://img.shields.io/npm/v/editor.md-next)](https://www.npmjs.com/package/editor.md-next) | 核心编辑器：ESM + UMD + CDN IIFE + `*.d.ts` + CSS |
| [editor.md-next-vue](https://www.npmjs.com/package/editor.md-next-vue) | [![npm](https://img.shields.io/npm/v/editor.md-next-vue)](https://www.npmjs.com/package/editor.md-next-vue) | Vue 3 组件适配（v-model + 事件转发 + 实例暴露） |
| [editor.md-next-react](https://www.npmjs.com/package/editor.md-next-react) | [![npm](https://img.shields.io/npm/v/editor.md-next-react)](https://www.npmjs.com/package/editor.md-next-react) | React 组件适配（受控/非受控 + ref 句柄） |

## 仓库结构

```
packages/
  utils/   @editormd-next/utils    私有内部包（构建时打进 core）
  core/    editor.md-next          发布包（npm + CDN 产物）→ packages/core/README.md
  vue/     editor.md-next-vue      Vue 3 组件适配          → packages/vue/README.md
  react/   editor.md-next-react    React 组件适配          → packages/react/README.md
  demo/    @editormd-next/demo     示例站（GitHub Pages）
docs/                             用户文档（安装/配置/API/适配包/扩展语法/迁移…）
ai-docs/                          开发文档（需求、架构决策、功能对照矩阵）
```

## License

[MIT](LICENSE) © editor.md-next contributors。基于 [editor.md](https://github.com/pandao/editor.md)（MIT © pandao）的功能重写，emoji 与 HTML 实体数据源自原项目。
