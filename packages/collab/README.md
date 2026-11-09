# editor.md-next-collab

[![npm version](https://img.shields.io/npm/v/editor.md-next-collab)](https://www.npmjs.com/package/editor.md-next-collab)
[![npm downloads](https://img.shields.io/npm/dm/editor.md-next-collab)](https://www.npmjs.com/package/editor.md-next-collab)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mindoc-org/editor.md-next/blob/main/LICENSE)

[editor.md-next](https://www.npmjs.com/package/editor.md-next) 的协同编辑拓展包——基于 [Yjs](https://github.com/yjs/yjs)（CRDT）与 [y-codemirror.next](https://github.com/yjs/y-codemirror.next)：

- 多人实时编辑，断线期间本地编辑在重连后自动合并
- 远程光标/选区实时显示（用户名 + 颜色，背景半透明）
- 撤销栈只撤销自己的编辑（并发下语义正确）
- 服务端只需纯广播 relay（内置参考实现 `server/relay.mjs`）

## 安装

```bash
pnpm add editor.md-next editor.md-next-collab yjs
```

`yjs` / `@codemirror/*` / `editor.md-next` 为 peer 依赖（自动安装，与核心包共享同一 CM6 实例）。仅支持 npm/bundler 场景（CDN 双实例约束，见主仓库 FAQ）。

## 快速开始

```ts
import { EditorMD } from 'editor.md-next'
import 'editor.md-next/css'
import { createCollab, websocketTransport } from 'editor.md-next-collab'

const collab = createCollab({
  transport: websocketTransport('ws://localhost:1234', 'room-1'),
  user: { name: '张三', color: '#30bced' },
})

const editor = new EditorMD('#editor', {
  editor: { extensions: collab.extensions },
})

collab.onSynced(() => console.log('已与房间同步'))
collab.onPeers((peers) => console.table(peers))
```

本地零服务端体验：`broadcastChannelTransport('room-1')`（同源多标签页协同）。

撤销/重做默认启用，**快捷键、工具栏按钮、`editor.undo()/redo()` 三者语义一致**（经 core 的
`undoRedoFacet` 注入 `Y.UndoManager`，只撤销本端编辑）。

## 自建服务端

```bash
npm i ws
node node_modules/editor.md-next-collab/server/relay.mjs 1234
```

`ws` 不在运行时依赖中（浏览器使用者无需安装）。relay 是纯广播、不落盘、**无鉴权**，仅适合内网或可信网络；
公网部署请前置反向代理做 TLS + 认证 + 限流。

## 文档

完整用法（初始同步规则、自建服务端、Vue/React 中的受控绑定限制、FAQ）见主仓库 [docs/collab.md](https://github.com/mindoc-org/editor.md-next/blob/main/docs/collab.md)。

## License

[MIT](https://github.com/mindoc-org/editor.md-next/blob/main/LICENSE) © editor.md-next contributors
