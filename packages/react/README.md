# editor.md-next-react

> [editor.md-next](https://www.npmjs.com/package/editor.md-next) 的 React 组件适配。

[![npm version](https://img.shields.io/npm/v/editor.md-next-react)](https://www.npmjs.com/package/editor.md-next-react)
[![npm downloads](https://img.shields.io/npm/dm/editor.md-next-react)](https://www.npmjs.com/package/editor.md-next-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mindoc-org/editor.md-next/blob/main/LICENSE)

## 安装

```bash
pnpm add editor.md-next editor.md-next-react react
```

## 用法

```tsx
import { EditorMD } from 'editor.md-next-react'
import 'editor.md-next/css'

function App() {
  return (
    <EditorMD
      defaultValue="# Hello\n\n开始编辑…"
      options={{ height: 520, watch: true }}
      onChange={(markdown, html) => console.log(markdown)}
      onEvent={(name, payload) => console.log(name, payload)}
    />
  )
}
```

## API

- **Props**：`defaultValue`（非受控）/ `value`（受控）、`options`（编辑器配置，见 [editor.md-next 文档](https://github.com/mindoc-org/editor.md-next/blob/main/docs/configuration.md)）、`onChange`、`onEvent`（转发全部编辑器事件）、`className` / `style`
- **Ref**：`{ editor }` —— `EditorMD` 实例（`setMarkdown` / `gotoLine` / `toggleFullscreen` 等）
- React StrictMode 双挂载安全；卸载时自动 `destroy()`

## 说明

- 引擎 `editor.md-next` 为普通 dependency（不打包进适配包），样式需引入一次 `editor.md-next/css`
- `peerDependencies: react >= 18`

## License

[MIT](https://github.com/mindoc-org/editor.md-next/blob/main/LICENSE) © mindoc-org and editor.md-next contributors
