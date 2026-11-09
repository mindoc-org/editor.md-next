# React 适配（editor.md-next-react）

包名：`editor.md-next-react`，源码 `packages/react`。

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

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `options` | `EditorMDOptions` | 编辑器配置（`Omit<EditorUserOptions, 'value' \| 'on'>`） |
| `defaultValue` | string | 非受控初始内容 |
| `value` | string | 受控内容（传入后以外部值为准） |
| `onChange` | `(markdown, html) => void` | 内容变化 |
| `onEvent` | `<K>(name: K, payload: EditorEvents[K]) => void` | 其余事件转发（load/watch/scroll…） |
| `className` / `style` | — | 容器样式 |

## 获取实例

```tsx
const editorRef = useRef<EditorMDHandle>(null)
<EditorMD ref={editorRef} defaultValue="# Hello" />
// editorRef.current?.editor —— EditorMD 实例
```

## 协同编辑

配合 [`editor.md-next-collab`](collab.md) 使用：在组件外创建 binding，把 `collab.extensions` 传入 `options.editor.extensions` 即可，组件无需任何协同专用配置。

**协同模式下不要传受控 `value`**：受控回写会调 `setMarkdown` 全量替换文档，覆盖远程协作者的编辑。用 `defaultValue`（非受控）+ `onChange` 单向同步即可。

## 实现说明

- `forwardRef` + 命令式句柄；事件回调经 ref 读取，回调身份变化不会重建编辑器
- 卸载时自动 `destroy()`，React StrictMode 双挂载安全
- 引擎 `editor.md-next` 为普通 dependency（外部化不打包），`peerDependencies: react >= 18`
