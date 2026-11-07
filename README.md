# editor.md-next

> [Editor.md](https://github.com/pandao/editor.md) 的 TypeScript 重写版 —— 基于 CodeMirror 6 与 markdown-it 的现代 Markdown 编辑器。**项目施工中（WIP）**。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

原版 editor.md 是 jQuery + CodeMirror 5 时代的经典 Markdown 编辑器，但核心源码集中在 5000+ 行的单文件中，且已多年缺乏维护。editor.md-next 在保留其功能集的前提下全面重构：

- **全 TypeScript**，ESM 模块化拆分（单文件 ≤ 600 行），无 jQuery
- **CodeMirror 6** 替代 CodeMirror 5
- **markdown-it** 渲染 + DOMPurify 消毒
- 按需懒加载 **KaTeX / mermaid / markmap**（CDN），核心包保持轻量
- 双产物：npm ESM 包（含 `*.d.ts`）+ CDN IIFE（全局 `editormd`）

## 开发

```bash
pnpm install
pnpm dev          # 启动 demo 站
pnpm build        # 构建全部包（utils → core → demo）
pnpm build:lib    # 仅构建 core（esm/umd/iife + d.ts + css）
pnpm build:cdn    # CDN 产物（IIFE + css + fonts）
pnpm test         # vitest 单测
pnpm typecheck    # 全 workspace 类型检查
```

## 仓库结构

```
packages/
  utils/   # 内部工具集（构建时打进 core，不单独发布）
  core/    # 发布包 editor.md-next（npm + CDN 产物）
  demo/    # 示例站（GitHub Pages）
docs/      # 面向用户的使用文档（安装、配置、API、扩展语法等）
ai-docs/   # 面向开发/协作者的文档（需求、架构决策、功能对照矩阵）
```

## 文档

- 使用文档：见 [`docs/`](docs/)
- 迁移自 editor.md：见 [`docs/migration-from-editormd.md`](docs/migration-from-editormd.md)
- 开发者/Agent 协作规范：见 [`AGENTS.md`](AGENTS.md)

## License

MIT © editor.md-next contributors。基于 [editor.md](https://github.com/pandao/editor.md)（MIT © pandao）的功能重写。
