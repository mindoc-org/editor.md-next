# Changelog

## 0.1.0 (2026-11-08)

首个功能完整版本。editor.md（jQuery + CodeMirror 5 + 单文件 5162 行）的全 TypeScript 重写。

### 核心

- CodeMirror 6 编辑器（GFM：表格/删除线/任务列表/代码块语言高亮/折叠）
- markdown-it 15 渲染 + DOMPurify 消毒（htmlDecode 开关）
- highlight.js 常用语言子集的预览高亮 + 代码折叠
- KaTeX（$$..$$ / ```math）、mermaid（```mermaid）、markmap（```mindmap>高度）——CDN 懒加载，页面已有全局对象时复用
- [TOC] / [TOCM]（下拉）+ 中文兼容锚点 slug
- 四类 emoji（github/twemoji/fa/editormd-logo）、callouts（[info]/[warning]/[success]/[danger]）、pageBreak、atLink/emailLink、图片 #size/#align
- 外链 `_blank` + `javascript:` 拦截

### 编辑器

- 工具栏 full/simple/mini 三模式、dropdown 组、38 个内置按钮、自定义 icons/handlers/titles/customIcons、吸顶
- 30+ 快捷键 + disabledKeys + F9/F10/F11 窗口级监听
- CM6 搜索面板（i18n 短语）
- 分屏实时预览 + 同步滚动（双向/single）
- 全窗口预览、全屏、gotoLine、autoHeight、readOnly、saveHTML、多实例、destroy()

### 对话框

link、reference-link、image（URL/上传）、code-block（CM6 内嵌 + 语言选择）、preformatted-text、table、emoji（四 tab 网格多选）、html-entities、goto-line、help、info；支持拖拽/遮罩/lockScreen；错误提示为行内 DOM（不使用阻塞式 alert）。

### 上传

- 对话框上传 + 粘贴/拖拽（增强），字段 `editormd-image-file`，响应 `{success,url,message}`（兼容原版服务端）
- 实例级 `uploadImage` 覆写支持自定义/mock

### 交付

- npm 包 `editor.md-next`：ESM + UMD + `*.d.ts` + CSS（字体精简，277KB）
- CDN IIFE（全局 `editormd` 命名空间，dist/cdn/ 自包含目录）
- 三种加载方式（ESM/UMD/CDN script）均通过冒烟验证
- demo 示例站 14 例（hash 路由，可部署 GitHub Pages）
- 用户文档 docs/ 11 篇；开发文档 ai-docs/

### 已知差异（相对原版）

- CM5 editorTheme 主题名不迁移（内置 default/dark + 自定义主题注入）
- ```flow / ```seq 旧图表语法不迁移（统一 mermaid）
- 跨域 iframe 上传回调、drawio 代码块暂未实现（TODO 远期）
