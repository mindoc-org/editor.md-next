# 常见问题

## 预览里公式/图表没有渲染？

- 确认 `markdown.tex` 已开启（默认关闭）
- KaTeX / mermaid / markmap 从 jsDelivr 懒加载：检查网络与 `cdn.*` 配置；内网环境需自托管并改地址
- 页面已有 `window.katex` / `window.mermaid` 时会直接复用

## FontAwesome 图标不显示？

样式入口 `import 'editor.md-next/css'` 必须引入（字体已内联进 css，无需额外文件）。CDN 方式确保 `<link>` 指向 `dist/index.css`。

## 和原版 editor.md 的服务端能直接对接吗？

能。上传字段名 `editormd-image-file` 与响应协议 `{success, url, message}` 完全兼容（见 [image-upload.md](image-upload.md)）。

## 高度 100% 不生效？

容器父级需要有确定高度。或改用 `editor: { autoHeight: true }` 让高度随内容增长。

## TypeScript 报 `editor.md-next` 类型错误？

确认安装的是完整包（含 `dist/types/*.d.ts`），并使用 `moduleResolution: "bundler"`（或 `node16`）。

## 多实例有冲突吗？

没有。每个实例独立的 CM6 视图与事件；窗口级快捷键（F9/F10/F11）会作用于各自实例（当前行为：全部实例响应，后续版本可配置归一）。

## 如何参与开发？

见仓库 [AGENTS.md](https://github.com/gsw945/editor.md-next/blob/main/AGENTS.md)（目录职责、编码规范、命令清单）与 [TODO.md](https://github.com/gsw945/editor.md-next/blob/main/TODO.md)（阶段进度）。
