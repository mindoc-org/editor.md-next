# 配置项

`new EditorMD(el, options)` 的完整配置。所有字段均可省略，缺省值见括号内。

## 顶层

| 项 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | string | `''` | 隐藏 textarea 的 name（表单提交场景），同时同步 markdown；配置 `preview.saveHtml` 后额外同步 HTML 到 `{name}-html-code` |
| `value` | string | `''` | 初始 markdown |
| `width` / `height` | string \| number | `'100%'` / `'100%'` | 容器尺寸 |
| `watch` | boolean | `true` | 实时预览分屏 |
| `placeholder` | string | `'Enjoy Markdown!...'` | 编辑区占位符 |
| `i18n` | `'zh-cn' \| 'en' \| 'zh-tw' \| LangDict` | `'zh-cn'` | 语言（见 [i18n.md](i18n.md)） |

## `editor`（编辑区）

| 项 | 默认 | 说明 |
| --- | --- | --- |
| `theme` | `'default'` | `'default' \| 'dark'`，或直接注入 CM6 theme 扩展（`EditorView.theme()` 产物） |
| `fontSize` / `fontFamily` | `'14px'` / 等宽栈 | |
| `lineNumbers` | `true` | |
| `lineWrapping` | `true` | 自动换行 |
| `tabSize` / `indentWithTabs` | `4` / `true` | |
| `readOnly` | `false` | |
| `autoFocus` | `true` | 加载后聚焦 |
| `autoHeight` | `false` | 高度随内容增长 |
| `activeLine` | `true` | 当前行高亮 |
| `closeBrackets` | `true` | 自动闭合括号 |
| `disabledKeys` | `[]` | 禁用的快捷键（如 `['F9', 'Mod-b']`，支持键名或动作名） |
| `extensions` | `[]` | 追加任意 CM6 扩展 |

## `preview`（预览区）

| 项 | 默认 | 说明 |
| --- | --- | --- |
| `enable` | `true` | |
| `theme` | `'default'` | `'default' \| 'dark'` |
| `syncScroll` | `true` | 同步滚动；`'single'` 仅编辑器→预览 |
| `delay` | `300` | 渲染防抖毫秒 |
| `saveHtml` | `false` | 同步 HTML 到隐藏 textarea（需 `name`） |
| `codeHighlight` | `true` | hljs 高亮与预览代码折叠（>12 行出现折叠按钮） |

## `toolbar`

| 项 | 默认 | 说明 |
| --- | --- | --- |
| `enable` | `true` | `toolbar: false`（顶层简写）= 不渲染 |
| `spec` | `'full'` | `'full' \| 'simple' \| 'mini'` 或自定义数组；数组项：按钮名、`'\|'` 分隔线、`'\|\|'`（其后右对齐）、`'dropdown:标题:h1,h2,h3'` 下拉组 |
| `autoFixed` | `true` | 页面滚动时工具栏吸顶 |
| `icons` | `{}` | 覆盖图标类名 `{ name: 'fa-xxx' }` |
| `titles` | `{}` | 覆盖提示文字 |
| `handlers` | `{}` | 自定义/覆盖动作 `{ name: (editor) => void }` |
| `customIcons` | `{}` | 用 HTML 片段替换默认图标 |

按钮名全集见 [api.md](api.md#工具栏按钮)。

## `markdown`（渲染扩展）

| 项 | 默认 | 说明 |
| --- | --- | --- |
| `toc` | `true`（简写） | 对象形式：`{ enable, title, startLevel: 1, dropdown: false, container }`；`container` 为外部 selector |
| `taskList` | `true` | `- [ ]` / `- [x]` |
| `emoji` | `true` | 四类 emoji 语法 |
| `emojiMode` | `'image'` | `'image'`（图片渲染）/ `'unicode'`（Unicode 字符渲染，完全离线可用；GitHub 专属 emoji 无字符时退回图片） |
| `emojiGithubPath` | githubassets 官方源 | `:name:` 图片目录（路径 + name + `.png`），支持相对路径 |
| `emojiTwemojiPath` | jsDelivr twemoji | `:tw-编码:` 图片目录，支持相对路径 |
| `tex` | `false` | KaTeX 公式（CDN 懒加载） |
| `mermaid` | `true` | ```mermaid 代码块 |
| `mindmap` | `true` | ```mindmap 代码块（markmap） |
| `callouts` | `true` | `> [info]` 等提示块 |
| `pageBreak` | `true` | `[========]` 分页符 |
| `atLink` | `true` | `@user` → GitHub 链接 |
| `emailLink` | `true` | 邮箱自动 mailto |
| `htmlDecode` | `false` | 允许预览保留原生 HTML（开启后仍受 `sanitize` 保护） |
| `sanitize` | `true` | DOMPurify 消毒 |
| `use` | `[]` | 追加 markdown-it 插件数组 |

## `upload`

| 项 | 默认 | 说明 |
| --- | --- | --- |
| `image` | `false` | 开启图片上传对话框 tab 与粘贴/拖拽上传 |
| `url` | `''` | 服务端地址（协议见 [image-upload.md](image-upload.md)） |
| `formats` | `['jpg','jpeg','gif','png','bmp','webp']` | 扩展名白名单 |
| `fieldName` | `'editormd-image-file'` | 表单字段名（兼容原版服务端） |
| `withCredentials` | `false` | 跨域携带 cookie |

## `dialog`

| 项 | 默认 | 说明 |
| --- | --- | --- |
| `lockScreen` | `true` | 弹窗时锁定页面滚动 |
| `draggable` | `true` | 对话框可拖拽 |
| `showMask` / `maskOpacity` | `true` / `0.1` | 遮罩 |

## `cdn`（懒加载地址）

| 项 | 说明 |
| --- | --- |
| `katexCss` / `katexJs` | KaTeX 资源；置空串禁用 |
| `mermaidJs` | mermaid UMD；置空串禁用 |
| `d3Js` / `markmapLibJs` / `markmapViewJs` | markmap 三件套，按序加载；任一置空禁用 |

所有地址支持**绝对 URL 与相对路径**（相对页面基准解析），可指向宿主应用 `public/` 目录的自托管副本——离线/内网部署详见 [offline.md](offline.md)。页面已存在 `window.katex` / `window.mermaid` 时优先使用，不重复加载。

## 事件回调糖衣

`on` 字段支持 settings 风格回调，与事件总线等价：

```ts
new EditorMD('#editor', {
  on: {
    load: () => console.log('ready'),
    change: (e) => console.log(e.markdown),
  },
})
```
