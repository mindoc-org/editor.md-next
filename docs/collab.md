# 协同编辑（editor.md-next-collab）

> 0.2.0 新增。协同能力以**独立拓展包**提供——不装它，核心包行为与体积完全不变；装了它，同一个编辑器即可多人实时协同。

基于 [Yjs](https://github.com/yjs/yjs)（CRDT）与 [y-codemirror.next](https://github.com/yjs/y-codemirror.next) 实现：

- 多人**实时编辑**，断线期间的本地编辑在重连后自动合并（CRDT，无需服务器排序）
- **远程光标与选区**实时显示（用户名 + 颜色）
- 撤销栈只撤销**自己**的编辑（并发编辑下语义正确）
- 服务端只需要一个**纯广播 relay**（约 40 行代码），内网自托管友好

## 安装

```bash
pnpm add editor.md-next editor.md-next-collab yjs
```

依赖关系：`yjs` 与 `@codemirror/*` 是拓展包的 peer 依赖，包管理器（npm ≥ 7 / pnpm / yarn berry）会自动安装并与核心包**共享同一份实例**，无需手动处理。

> **仅支持 npm / bundler 场景**。CDN `<script>` 标签方式不支持协同：CodeMirror 6 要求全页共享同一份 `@codemirror/state` 实例，而 CDN 版核心包内联了自己的副本（详见 FAQ）。

## 快速开始

```ts
import { EditorMD } from 'editor.md-next'
import 'editor.md-next/css'
import { createCollab, websocketTransport } from 'editor.md-next-collab'

const collab = createCollab({
  transport: websocketTransport('ws://localhost:1234', 'room-1'),
  user: { name: '张三', color: '#30bced' }, // 缺省自动生成
})

const editor = new EditorMD('#editor', {
  // 协同模式初始内容以房间为准；value 仅在空房间时写入（见下文"初始同步"）
  editor: { extensions: collab.extensions },
})

collab.onSynced(() => console.log('已与房间同步'))
collab.onPeers((peers) => console.table(peers))   // 在线成员（含本地）
collab.onStatus((s) => console.log('连接状态:', s))
```

打开两个浏览器标签页（或把链接发给同事），即可看到：A 输入 → B 实时出现，双方光标带名字与颜色，预览区在两端同时刷新。

## 初始同步

- 连接后自动完成一次双向同步（拉取房间内现有内容），完成后触发 `onSynced`。
- 同步完成时若房间内容为**空**、且编辑器配置了非空 `value`，本地 value 会作为首份内容写入房间——即"第一个进入空房间的人带上草稿"。
- 房间已有内容时以房间为准，本地 `value` 不覆盖。**协同模式建议传 `value: ''`**，避免歧义。

## 撤销（undo）

默认启用（`undo: true`）：拓展包接管 `Mod-z` / `Shift-Mod-z` / `Mod-y`（macOS `Cmd-z`），走 Yjs 撤销栈——**只撤销你自己的编辑**，即使远程协作者的编辑穿插其间也不会误伤。

不想要撤销能力可传 `undo: false`。

## 通道与自建服务端

### 内置通道

| 通道 | 用法 | 场景 |
| --- | --- | --- |
| `websocketTransport(url, room)` | 连接自建 relay 服务端 | 生产 / 内网 |
| `broadcastChannelTransport(room)` | 同源多标签页 BroadcastChannel | 零服务端、本地联调、demo |

### 参考服务端（约 40 行）

拓展包仓库内附带 `server/relay.mjs`：按 URL path 分房间、**原样二进制广播**（不解析内容、不落盘）。协同的全部协议语义（y-protocols sync/awareness）都在客户端实现，服务端零知识：

```js
// 依赖：npm i ws   运行：node server/relay.mjs（默认端口 1234）
import { WebSocketServer } from 'ws'

const rooms = new Map()
new WebSocketServer({ port: 1234 }).on('connection', (ws, req) => {
  const room = req.url.slice(1) || 'default'
  const peers = rooms.get(room) ?? new Set()
  peers.add(ws)
  rooms.set(room, peers)
  ws.on('message', (data) => {
    for (const p of peers) if (p !== ws && p.readyState === 1) p.send(data)
  })
  ws.on('close', () => {
    peers.delete(ws)
    if (!peers.size) rooms.delete(room)
  })
})
```

### 接入既有协同生态（y-websocket / Hocuspocus / PartyKit…）

实现一个 `CollabTransport`（四个方法：`send` / `onMessage` / `onStatus?` / `destroy`）即可桥接任何"能把二进制消息广播到房间其他成员"的通道。内置 `websocketTransport` 不兼容 y-websocket 官方服务端协议（那是另一套消息封装）。

## API

### `createCollab(options): CollabBinding`

| `CollabOptions` | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `transport` | `CollabTransport` | 必填 | 通道适配器 |
| `user` | `{ name?, color? }` | 自动生成 | 本地用户（awareness 广播） |
| `undo` | `boolean` | `true` | Yjs 撤销栈（接管 undo/redo 键位） |
| `cursors` | `boolean` | `true` | 远程光标/选区显示 |

| `CollabBinding` 成员 | 说明 |
| --- | --- |
| `extensions` | 注入编辑器的 CM6 扩展（**必须**经 `editor.extensions` 传入） |
| `ydoc` / `ytext` | Yjs 文档句柄（高级用法） |
| `onPeers(handler)` | 在线成员变化（含本地），返回解绑函数 |
| `onStatus(handler)` | 连接状态变化（`'connected' \| 'disconnected'`），返回解绑函数 |
| `onSynced(handler)` | 首次双向同步完成，返回解绑函数 |
| `destroy()` | 断开通道并销毁协同绑定（不销毁编辑器；编辑器 `destroy()` 前先调它） |

`randomUser()` 可单独使用（固定调色板 + 随机名字后缀），适合"昵称未登录"场景。

## 在 Vue / React 中使用

拓展包在组件外创建，把 `collab.extensions` 传入组件的 `editor.extensions` 即可，vue/react 适配包**无需任何协同专用配置**：

```ts
// Vue 3
const collab = createCollab({ transport: broadcastChannelTransport('room-1') })
```

```html
<EditorMD :options="{ editor: { extensions: collab.extensions } }" />
```

**受控绑定必须降级为单向**（重要）：

- 协同模式下 `v-model` / 受控 `value` 的回写会调 `setMarkdown` **全量替换文档**，等于用本地全文覆盖远程协作者的编辑（数据破坏）。
- Vue：不用 `v-model`，改用 `@update:modelValue` 只收不发；React：不给 `value` 传受控值。
- 断线重连、离线合并均自动处理，无需业务层干预。

## 注意事项

- **事件**：远程协作者的编辑同样触发核心包的 `input` / `change` 事件（核心事件不区分输入来源）。
- **`setMarkdown()`**：协同模式下等价于"推送一次全文替换"，会覆盖他人内容，慎用；`getMarkdown()` / `appendMarkdown()` 不受影响。
- **CDN 场景**：不支持。CodeMirror 6 扩展依赖 `@codemirror/state` 的模块单例，CDN 版核心包内联了自己的副本，与拓展包必然形成双实例。
- **离线**：断线期间可继续编辑，内容缓存在本地 Yjs 文档中，重连后按 CRDT 规则自动合并（并发编辑同一段落时不会丢字，只会产生合并结果）。

## FAQ

**Q：为什么不直接内置在 `editor.md-next` 里？**
协同依赖 yjs（~30KB gz）并要求 `@codemirror/*` 以 peer 依赖共享。保持核心包纯净、按需安装是拓展包方案的设计初衷；`@codemirror/*` 外置化（0.2.0）正是为此铺路。

**Q：多个协同实例 / 多个房间？**
每个房间一个 `createCollab` + 一个 `EditorMD` 实例，与其他实例互不影响。

**Q：服务端会把内容存下来吗？**
参考 relay 是无状态的纯广播，页面全关内容即消失。需要持久化/历史版本时，在 relay 侧落盘房间二进制流或接入 Hocuspocus 等带持久化的后端（实现 transport 即可）。
