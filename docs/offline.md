# 离线 / 内网部署

editor.md-next 的重依赖（KaTeX / mermaid / markmap）默认从 jsdelivr CDN 懒加载，GitHub/Twemoji emoji 图片默认走公网图床。在**不连接公网**的环境中使用时，把这些资源自托管并指向本地地址即可——所有地址都支持**相对路径**（相对页面基准解析，适合放进宿主应用的 `public/` 目录）。

## 1. 需要自托管的资源清单

| 资源 | 默认地址 | 自托管内容 |
| --- | --- | --- |
| KaTeX | `https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.{css,js}` | katex 的 `dist` 目录（css/js/fonts 需保持相对结构，公式字体才能加载） |
| mermaid | `https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js` | 单文件 `mermaid.min.js` |
| markmap | `d3@7.9.0/dist/d3.min.js`、`markmap-lib@0.18.13/dist/browser/index.iife.js`、`markmap-view@0.18.10/dist/browser/index.js` | 三个 js 文件 |
| GitHub/Twemoji emoji 图片 | githubassets / jsdelivr twemoji | 图片目录（可选，也可改用 unicode 渲染模式，见下） |

FontAwesome 与 editormd-logo 字体、编辑器样式**已内联进包内 CSS**，无需自托管。

## 2. 配置

以 Vite 为例，把预下载的静态文件放进 `public/vendor/`：

```
public/
  vendor/
    katex/katex.min.css  katex.min.js  fonts/…
    mermaid/mermaid.min.js
    markmap/d3.min.js  markmap-lib.iife.js  markmap-view.js
    emoji/github/…  emoji/twemoji/…
```

```ts
new EditorMD('#editor', {
  cdn: {
    katexCss: '/vendor/katex/katex.min.css',
    katexJs: '/vendor/katex/katex.min.js',
    mermaidJs: '/vendor/mermaid/mermaid.min.js',
    d3Js: '/vendor/markmap/d3.min.js',
    markmapLibJs: '/vendor/markmap/markmap-lib.iife.js',
    markmapViewJs: '/vendor/markmap/markmap-view.js',
  },
  markdown: {
    emojiGithubPath: '/vendor/emoji/github/',
    emojiTwemojiPath: '/vendor/emoji/twemoji/',
  },
})
```

地址写法说明：

- **`/vendor/…`**（根相对）：推荐，与页面路由无关
- **`./vendor/…`**（文档相对）：相对当前页面 URL 解析，SPA 多级路由下会随路径变化，慎用
- **完整 URL**：指向内网任意主机

> 相对路径由浏览器按页面基准解析（`loadScript/loadStyle` 直接生成 `<script src>`/`<link href>`），与开发服务器、`vite preview`、GitHub Pages 均兼容。

## 3. emoji 的离线渲染模式

不托管 emoji 图片时，开启 **unicode 渲染模式**——GitHub/Twemoji 两类直接渲染为 Unicode 字符，完全离线可用（`fa-*` 与 `editormd-logo-*` 本就是包内字体图标）：

```ts
new EditorMD('#editor', {
  markdown: {
    emoji: true,
    emojiMode: 'unicode',
  },
})
```

视觉与原版图片略有差异（系统 emoji 字体渲染）。少数 GitHub 专属 emoji（如 `:bowtie:`）没有 Unicode 对应字符，会自动退回图片路径——离线时不显示，属预期。

## 4. 注意事项

- **markmap 源内代码块**：markmap-lib 默认会对 mindmap 源内的代码围栏尝试拉取语法高亮资源；离线时该部分高亮会静默失败（脑图结构不受影响）。需要完整离线可接受此行为。
- **KaTeX 字体**：自托管时必须保留 katex `dist` 内的 `fonts/` 目录结构，否则公式文字会缺字。
- 置空任一地址串（如 `mermaidJs: ''`）即禁用对应特性的懒加载。
