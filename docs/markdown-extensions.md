# 扩展语法

以下语法由 editor.md-next 的 markdown-it 插件提供（原版功能对齐），渲染结果经过 DOMPurify 消毒。

## 目录

```markdown
[TOC]
```
生成内嵌目录；```[TOCM]``` 生成下拉菜单形态。配置 `markdown.toc.title / startLevel / dropdown / container` 可调整行为；标题自动生成锚点 id（中文标题走编码 slug）。

## Emoji（四类）

| 语法 | 渲染 | 说明 |
| --- | --- | --- |
| `:smile:` | GitHub 风格图片 | 目录取自原版 emoji 数据集 |
| `:tw-1f600:` | Twemoji 图片 | 路径可配（`markdown.emojiTwemojiPath`） |
| `:fa-star:` | FontAwesome 图标 | |
| `:editormd-logo-3x:` | logo 字体图标 | `-1x`~`-8x` |

时间格式 `12:30:45` 不会被误判为 emoji（与原版一致）。

## 数学公式（KaTeX，需 `markdown.tex: true`）

- 行内：段落中的 `$$E=mc^2$$`
- 独立公式：整段只有 `$$…$$`
- 围栏：```math / ```latex / ```katex 代码块

> 与原版一致：不支持单 `$` 行内公式。KaTeX 从 CDN 懒加载，已存在 `window.katex` 时直接使用。

## 图表

- ```mermaid —— 流程图 / 时序图 / 甘特图 / 类图等（mermaid 语法）
- ```mindmap —— markmap 脑图；```mindmap>400px 指定高度

## 提示块（Callouts）

```markdown
> [info] 提示
> 内容……
```

支持 `[info]` `[warning]` `[success]` `[danger]` 四种，渲染为带色左边框提示块（fork 增强语法，予以保留）。

## 任务列表

```markdown
- [ ] 未完成
- [x] 已完成
```

## 分页符

单独一行 `[========]`（8 个以上 `=`）渲染为分页线（打印时 `page-break-after`）。

## @链接 与邮箱

- `@user` → `https://github.com/user`（`markdown.atLink`）
- `user@example.com` → `mailto:`（`markdown.emailLink`）

## 图片尺寸与对齐（fork 增强）

```markdown
![alt](https://x/a.png#size=240x120#align=center)
```

`#size=宽x高` 设置宽高；`#align=left|center|right` 设置对齐。

## 链接安全

- `javascript:` 链接被替换为 `#`
- 外部 http(s) 链接自动 `target="_blank" rel="noopener noreferrer"`

## 原生 HTML

默认 `htmlDecode: false`：HTML 标签按纯文本转义显示。设为 `true` 后保留渲染，且仍经过 DOMPurify 消毒（`markdown.sanitize: false` 可关闭消毒，不建议）。

## 追加 markdown-it 插件

```ts
import footnote from 'markdown-it-footnote'

new EditorMD('#editor', {
  markdown: { use: [footnote] },
})
```
