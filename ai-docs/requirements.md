# 需求与范围（已拍板）

> 本文件记录项目立项时确认的需求边界与用户决策，作为后续实现的依据。

## 背景

- 原版 editor.md（实际基线：IBM Skills Network fork v1.7.17，源自 pandao 1.5.0，MIT）
  位于 `D:\tmp\editor.md`（参考用，不进版本库）。
- 痛点：jQuery 依赖、CodeMirror 5 过时、单文件 5162 行、多年缺乏维护。

## 用户决策（2026-11-08）

| 决策点 | 结论 |
|---|---|
| Markdown 引擎 | **markdown-it**（CommonMark 合规 + 插件体系），扩展用自研插件 |
| 图表 | **mermaid + markmap**（CDN 懒加载），不复刻 flowchart.js/js-sequence 旧三件套 |
| npm 包名 | **editor.md-next**；CDN 全局名保持 `editormd`；utils 私有不发布 |
| API 风格 | **全新 API 设计**：现代 TS 风格，不背原版 settings/方法名包袱；功能对齐原版 |
| 工具链 | pnpm workspace + Vite（8, rolldown 内核）+ TypeScript（7 native）；CodeMirror 6 |
| 仓库文档 | 根目录 README.md / AGENTS.md / TODO.md；开发文档 ai-docs/；用户文档 docs/ |
| 代码约束 | ES modules 合理拆分，单文件 ≤ 600 行 |

## 范围

**做**：尽可能实现原版全部功能（工具栏三模式、11 个对话框、快捷键、emoji/tex/图表/TOC/任务列表/callout/分页/图片尺寸对齐、图片上传、主题、i18n、sync scroll、watch/preview/fullscreen、静态渲染 API、d.ts + npm + CDN 三产物、demo 示例站、用户文档）。

**不做**（记录于 TODO.md 远期）：Skills Network 品牌 titlebar、author_ide_version、drawio、RequireJS/SeaJS/Zepto 兼容层、IE 兼容。

## 交付物

1. npm 包 `editor.md-next`（esm/umd + `*.d.ts` + css）
2. CDN 产物（IIFE 全局 `editormd` + css + fonts）
3. demo 示例站（GitHub Pages）
4. docs/ 用户文档（使用介绍、指南、API 等）
