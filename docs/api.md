# API

## 构造

```ts
new EditorMD(el: string | HTMLElement, options?: EditorUserOptions)
```

## 内容读写

| 方法 | 说明 |
| --- | --- |
| `getMarkdown(): string` | 当前 markdown |
| `setMarkdown(md: string): this` | 整体替换（立即渲染） |
| `appendMarkdown(md: string): this` | 末尾追加 |
| `insertValue(value: string): this` | 在光标处插入 |
| `getHtml(): string` | 最近一次渲染的 HTML |
| `getPreviewedHtml(): string` | 预览区当前 DOM HTML |
| `clear(): this` | 清空 |
| `undo(): this` | 撤销一次（协同模式下只回退本端编辑，与工具栏/快捷键同一入口） |
| `redo(): this` | 重做一次 |

## 视图模式

| 方法 | 说明 |
| --- | --- |
| `watch()` / `unwatch()` / `toggleWatch()` | 分屏实时预览开关 |
| `togglePreviewMode()` | 全窗口 HTML 预览（ESC 退出） |
| `toggleFullscreen()` | 全屏（ESC 退出） |
| `focus()` | 聚焦编辑器 |

## 光标与定位

| 方法 | 说明 |
| --- | --- |
| `gotoLine(line: number \| 'first' \| 'last'): this` | 跳转行并同步预览 |

## 主题

| 方法 | 说明 |
| --- | --- |
| `setEditorTheme(theme: 'default' \| 'dark' \| CM6Theme): this` | 切换编辑区主题 |
| `setPreviewTheme(theme: 'default' \| 'dark'): this` | 切换预览区主题 |
| `toggleTheme(): this` | 一键浅/深切换 |

## 上传与对话框

| 方法 | 说明 |
| --- | --- |
| `openDialog(name: string): void` | 打开对话框：`link` `referenceLink` `image` `codeBlock` `preformattedText` `table` `emoji` `htmlEntities` `gotoLine` `help` `info` |
| `uploadImage(file: File, onProgress?): Promise<{success, url?, message?}>` | 按配置上传（可实例级覆写做 mock） |

## 配置与销毁

| 方法 | 说明 |
| --- | --- |
| `config(patch: EditorUserOptions): this` | 深合并配置并原位重建（保留内容） |
| `destroy(): void` | 销毁实例、解绑事件、还原容器 |

## 属性

| 属性 | 说明 |
| --- | --- |
| `cm: EditorView` | CM6 视图（高级用法直接操作） |
| `state: { watching, loaded, destroyed, previewing, fullscreen }` | 运行状态 |
| `lang: LangDict` | 当前语言字典 |
| `options: EditorOptions` | 解析后的完整配置 |
| `emitter` | 底层事件总线 |

## 事件

```ts
editor.on('change', (e) => console.log(e.markdown, e.html))
```

| 事件 | 载荷 | 触发时机 |
| --- | --- | --- |
| `load` | — | 初始化完成（一次） |
| `change` | `{ markdown, html }` | 渲染管线完成（防抖后） |
| `input` | — | CM 文档变化（实时） |
| `resize` | `{ width, height }` | 容器尺寸变化 |
| `watch` / `unwatch` | — | 分屏切换 |
| `previewEnter` / `previewExit` | — | 全窗口预览切换 |
| `fullscreenEnter` / `fullscreenExit` | — | 全屏切换 |
| `scroll` | `{ ratio }` | 编辑区滚动 |
| `previewScroll` | `{ ratio }` | 预览区滚动 |

`on` 返回解绑函数；`once` / `off` / `emit` 语义同常规事件总线。

## 静态成员

| 成员 | 说明 |
| --- | --- |
| `EditorMD.renderTo(el, options)` | 静态渲染 markdown 为只读 HTML |
| `defaults` | 默认配置（可改后作为全局基线） |
| `VERSION` | 版本号 |

## 模块级导出

| 导出 | 说明 |
| --- | --- |
| `renderTo(el, options)` | 同 `EditorMD.renderTo` |
| `registerLang(dict)` / `listLangs()` | 注册/列出语言包 |
| `registerDialog(name, factory)` | 注册/覆盖对话框（见 [plugins.md](plugins.md)） |

## 工具栏按钮

内置按钮名（`toolbar.spec` 与快捷键共用）：`undo` `redo` `bold` `del` `italic` `quote` `ucwords` `uppercase` `lowercase` `h1`~`h6` `list-ul` `list-ol` `hr` `link` `reference-link` `image` `code` `preformatted-text` `code-block` `table` `datetime` `emoji` `html-entities` `pagebreak` `goto-line` `watch` `preview` `fullscreen` `clear` `search` `help` `changetheme` `info`。

## 快捷键

与原版一致（Mod = Ctrl / ⌘）：`Mod-1..6` 标题、`Mod-b` 粗体、`Mod-i` 斜体、`Mod-k` 行内代码、`Mod-u` 无序列表、`Shift-Mod-o` 有序列表、`Mod-l` 链接、`Shift-Mod-i` 图片、`Mod-d` 日期、`Shift-Mod-k` 公式、`Mod-f` 搜索、`Shift-Mod-n` 清空、`Mod-Alt-g` 跳转行；`F9` 实时预览、`F10` 全窗口预览、`F11` 全屏。`disabledKeys` 可屏蔽（键名或动作名）。
