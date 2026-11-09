# 协同编辑设计（editor.md-next-collab，0.2.0）

> 2026-11-09 立项。用户拍板：**拓展包形态**（core 包体积已经不小，不再往里加）+ **版本 0.2.0 四包对齐**。
> 本文件 = 调研结论 + 设计定稿，是实现依据。决策条目见 `architecture.md` ADR-007/ADR-008，用户文档见 `docs/collab.md`。

## 1. 调研结论摘要

### 1.1 CodeMirror 6 协同生态两条路线（2026-11 实测核实）

| | **@codemirror/collab 6.1.1（OT）** | **yjs 13 + y-codemirror.next 0.3.6（CRDT）** |
| --- | --- | --- |
| 模型 | OT，必须有**中心权威服务器**做版本排序（`pullUpdates` / `pushUpdates` / `getDocument` 契约，版本号 = 权威更新数组长度） | CRDT，服务端可以是**纯广播 relay**（不解析内容），支持离线编辑后合并 |
| 依赖 | 仅 `@codemirror/state`，体积极小 | peer 依赖 `yjs ^13.5.6`（~30KB gz 量级）+ `lib0`；本周下载 ~35.6 万，2026-08 仍在发版 |
| 与 CM6 内置 history | **天然兼容**：源码核实 `receiveUpdates` 对远程事务打 `Transaction.addToHistory.of(false)`，远程变更不进本地 undo 栈 | 远程事务经 `ySyncAnnotation` 应用、**未标记 addToHistory** → 会进 CM6 内置 history 栈；Mod-z 会撤销到别人的编辑，必须压制（见 §5.2） |
| 远程光标/选区 | **不含**，需自研 decorations（官方示例明说"这是你自己的事"） | **内置**：`yCollab(ytext, awareness)` 传 awareness 即含 `yRemoteSelections` 插件（源码核实），用户名/颜色开箱即用 |
| 服务端 | 按官方示例自写 ~100-150 行版本化 authority（含 `rebaseUpdates` rebase 逻辑） | 现成方案多（y-websocket / Hocuspocus / PartyKit），且**纯广播 relay ~40 行**即可 |
| 离线/内网 | 弱（依赖在线权威） | 强（契合 0.1.x 已落地的离线/内网方向） |

**决策：yjs 路线**。远程光标/在线人数/离线容忍/自建 relay 开箱即用，服务端与光标是用户采用协同的真正门槛。注意 **Yjs v14（`@y/codemirror`）仍是 unstable 开发分支**（官方 README 明确"多数用户应继续用 y-codemirror.next + Yjs 13"），锁定稳定线 `yjs ^13.5.6 + y-codemirror.next ^0.3.6`。

### 1.2 被拒绝的备选

- **@codemirror/collab OT 路线**：体积小、与 core 内置 history 兼容好，但服务端（版本化权威）和远程光标都要自研，用户采用成本高。留作远期可选的轻量模式（拓展包预留 transport 抽象，不冲突）。
- **collab 内置进 core**：体积 + 耦合双输，违背拓展包决策。
- **core re-export CM6 符号方案**（拓展包从 `editor.md-next` import CM6 符号以共享实例）：看似零构建改动，但 `y-codemirror.next` 等第三方包直 import `@codemirror/state`，仍需 fork 绑定源码改 import 路径；且 `editor.extensions` 生态对普通用户依旧不可用。放弃。

## 2. 硬约束：CM6 单实例铁律（本项目此前未意识到的坑）

- CM6 的 `resolveExtensions` 用 `instanceof` 识别 Facet / StateField / ExtensionMarker。**全页只允许存在一份 `@codemirror/state`**，跨副本的扩展对象直接抛
  `Unrecognized extension value in configure method ... This can happen if you are using two copies of @codemirror/state`。
- core 现状（ADR-001"无 external 全打包"）把 `@codemirror/*` 内联进了产物 → **任何外部 CM6 扩展都无法注入**：
  - 现有 `editor.extensions` 配置项（`settings.ts:29` → `create-view.ts:76`）对 npm 产物用户实际不可用；
  - `docs/plugins.md` 旧注记"宿主安装相同主版本 @codemirror/* 即可避免双实例"只在宿主从源码构建时成立，npm 产物用户必踩坑；
  - collab 拓展包若不解决实例共享，无论如何设计都过不去。
- **结论：拓展包方案的前置条件是 core 构建外置化（ADR-007）**。es/umd 产物 external `@codemirror/*` + `@lezer/*` 并转 peerDependencies；IIFE/CDN 产物继续全打包自包含（`<script>` 用法不变）。拓展包也全部 external peer——用户 bundler 解析出**唯一一份** CM6 与 yjs 实例，天然共享。
- 附带收益：core npm 产物显著减重（CM6/lezer 系占主 chunk 相当比例）；`editor.extensions` 修成真正可用的扩展生态入口。

## 3. 包结构

```
packages/collab   editor.md-next-collab    发布包（0.2.0）
  src/
    index.ts                 导出 createCollab / transports / 类型
    binding.ts               createCollab 编排（extensions 组装 + 生命周期 + undoRedoFacet 注入）
    types.ts                 公共类型（CollabTransport / CollabOptions / CollabBinding…）
    transport/
      websocket.ts           websocketTransport（简易 relay 协议客户端，指数退避 + 抖动重连）
      broadcast.ts           broadcastChannelTransport（同源多标签页）
    sync.ts                  y-protocols sync/awareness 编解码 + 消息泵 + 同步窗口时序
    cursors.ts               远程光标配色（colorLight 半透明派生）+ randomUser 调色板
  server/relay.mjs           参考 relay（纯广播；心跳/异常隔离/体积上限，无鉴权）
  peerDependencies:
    editor.md-next     ^0.2.0   （undoRedoFacet 必须与宿主同一实例）
    @codemirror/state  ^6.0.0
    @codemirror/view   ^6.0.0
    yjs                ^13.5.6
  dependencies:
    y-codemirror.next ^0.3.6
    y-protocols       ^1.0.6
    lib0              ^0.2.x
  构建：vite lib 模式 es/cjs + d.ts；**全部 peer external**（yjs / @codemirror/* / editor.md-next）
  不提供 IIFE/CDN 产物：CDN 场景 core IIFE 内联自己的 CM6 副本，与拓展包必然双实例（见 §2），只支持 npm/bundler。
```

依赖方向不变：`demo → collab → core → utils`（collab 与 vue/react 平级，demo 可直接引 collab）。

## 4. API 设计（定稿草案）

```ts
import type { Extension } from '@codemirror/state'

/** 本地用户信息（awareness 广播，远程光标显示用）。 */
export interface CollabUser {
  name?: string
  color?: string
}

/**
 * 通道适配：任何能"可靠二进制广播到房间其他成员"的通道都可以接。
 * 协议语义（y-protocols sync/awareness）全部在 collab 包内实现，服务端只做纯广播。
 */
export interface CollabTransport {
  /** 发送一条二进制消息（服务端广播给房间内其他成员，不回发自己） */
  send(data: Uint8Array): void
  /** 订阅其他成员的消息，返回解绑函数 */
  onMessage(handler: (data: Uint8Array) => void): () => void
  /** 订阅连接状态（可选），返回解绑函数 */
  onStatus?(handler: (status: 'connected' | 'disconnected') => void): () => void
  destroy(): void
}

export interface CollabOptions {
  /** 通道适配器（必填） */
  transport: CollabTransport
  /** 本地用户；缺省用 randomUser() 自动生成名字与颜色 */
  user?: CollabUser
  /** 撤销栈：true（默认）= Y.UndoManager（只撤销自己的编辑，重连/并发下正确）；false = 无撤销 */
  undo?: boolean
  /** 远程光标/选区显示（默认 true） */
  cursors?: boolean
}

export interface CollabPeer {
  clientID: number
  name: string
  color: string
  local: boolean
}

export interface CollabBinding {
  /** 注入 new EditorMD(el, { editor: { extensions: binding.extensions } }) */
  extensions: Extension[]
  /** Yjs 文档句柄（高级用法） */
  ydoc: Y.Doc
  ytext: Y.Text
  /** 在线成员（含本地），awareness 变化时触发；返回解绑函数 */
  onPeers(handler: (peers: CollabPeer[]) => void): () => void
  /** 通道状态；返回解绑函数 */
  onStatus(handler: (status: 'connected' | 'disconnected') => void): () => void
  /** 首次与房间完成双向同步（此后本地 value 已按规则处理）；返回解绑函数 */
  onSynced(handler: () => void): () => void
  /** 断开通道并销毁 awareness/undo 绑定（不销毁编辑器实例本身） */
  destroy(): void
}

export function createCollab(options: CollabOptions): CollabBinding

/** 内置通道：WebSocket 直连简易 relay（见 §6）。room 为 URL path。 */
export function websocketTransport(url: string, room: string): CollabTransport

/** 内置通道：同源多标签页 BroadcastChannel（零服务端，demo/本地联调用）。 */
export function broadcastChannelTransport(room: string): CollabTransport

/** 随机生成 { name, color }（固定调色板，名字带随机后缀）。 */
export function randomUser(): CollabUser
```

## 5. 关键行为设计

### 5.1 初始同步与初始 value

- 连接后走 y-protocols sync：本地发 SyncStep1（state vector）→ 对端回 SyncStep2（全量 diff）→ 此后增量 update 双向流。
- `onSynced` 触发（首次同步窗口结束）时：若 `ytext.length === 0` 且编辑器初始 `value` 非空 → **把 value 写入 ytext**（本地是空房间的第一个客户端）；否则以服务端内容为准（**协同模式建议 `value: ''`**）。
- `onSynced` 之前的短暂窗口内允许本地输入（CRDT 会自动合并），但文档明示"初始内容以服务端为准"。

**实现期修订（两处时序缺陷）**：

1. 3s 兜底计时原本从 `start()`（即 `createCollab` 调用）起算，不是从建连起算。慢网/远 relay 下
   会在握手前误判"同步完成"，把本地 `value` 写进仍在等待房间内容的 ytext，随后与房间内容合并
   出**两份**。现改为：`start()` 只登记监听，由 transport 的 `connected` 事件启动计时；
   无 `onStatus` 的通道（内存/自定义）才在 `start()` 时直接启动。
2. 兜底触发时新增 `remoteSeen` 判定：同步窗口内**收到过任何远端帧**说明房间很可能有内容，
   此时不授权写入初始 `value`（保留 pending，等迟到 Step2）。只有"握手成功且 ytext 空"
   或"兜底且从未见远端"才写入。

### 5.2 撤销栈（core 增加通用扩展点，不做协同耦合）

**最终方案（实现期修订）**：core 提供 `undoRedoFacet` + `performUndo/performRedo`，
collab 通过 `undoRedoFacet.of({ undo, redo })` 注入 `Y.UndoManager`。

- core 侧：`handlers.ts` 的工具栏 `undo/redo` 与 `shortcuts.ts` 的 `Mod-z`/`Shift-Mod-z`/`Mod-y`
  都改走 `performUndo/performRedo`；`editor.undo()/redo()` 也走同一入口。
- collab 侧：注入实现后，**快捷键、工具栏按钮、公共方法三者语义一致**，只撤销自己的编辑。
- `undo: false` 时不注入，回退 CM6 内置 history（文档明确"可能撤到他人编辑"）。

**为什么放弃最初的 `Prec.highest(keymap)` 方案**：键位可以压过 core 的 `historyKeymap`，
但**工具栏按钮**调的是 `@codemirror/commands` 的 `undo()`，绕不过去——走查时只测了 Ctrl-Z，
漏掉了按钮。根治办法只能是让按钮和键位共用同一个入口，因此把"撤销实现"提升为 core 的扩展点。
这也顺带满足"undo/redo 是通用能力，非协同场景也需要可控"的诉求（可接自定义操作日志）。

- 为什么不用 CM6 内置 history 当协同撤销：ySync 应用远程事务**不带** `addToHistory: false`
  （源码核实：y-codemirror.next 全仓无此标记），远程变更会进 CM6 history 栈，撤销会撤到别人。
  改成统一入口后，内置 history 栈虽仍记录远程事务，但**不再有任何 UI 入口触达它**。
- y-codemirror.next 的 yUndoManager 插件自带 `beforeinput` 拦截（覆盖输入法/浏览器菜单的原生
  undo/redo 路径），与 facet 入口构成双保险。
- 曾考虑给 core 加 `editor.history?: boolean` 开关（彻底禁掉内置 history），暂不做：
  统一入口已闭环，少一个配置项就少一分误用面。

### 5.3 远程光标与选区主题（半透明铁律）

- `yCollab` 传 awareness 时内置 `yRemoteSelections` 插件：远程选区背景 + 光标 + 用户名标签，颜色取 awareness `user.color` / `user.colorLight`（collab 包负责把 `color` 推导出 `colorLight`）。
- **必须遵守 AGENTS.md 半透明规范**：`.cm-ySelection*` 等远程选区背景一律 alpha（y-codemirror.next 默认主题已是半透明，实现时用 `cursors.ts` 复核并按需覆写）；改过选区/行背景必跑 `pnpm check:selection` 像素验证。
- `cursors: false` 时不传 awareness 给 yCollab（纯文本同步，无光标装饰）。
- **光标发布（自研补丁，走查中发现）**：y-codemirror.next 的内置光标发布以 `document.hasFocus()` 为门槛——后台标签页/自动化环境永不发布，且失焦分支写反（`&& hasFocus`）导致残留光标不清除。binding.ts 的 `cursorPublisher` 插件改用**编辑器自身焦点**语义：聚焦发布选区相对位置、失焦清除；与内置发布共存（document 有焦点时两者写同值）。已实测：BroadcastChannel 双实例、远程光标+名字标签渲染正常。

### 5.4 与 core 管线的交互（无需改造，已核实）

- 远程更新是普通 `docChanged` 事务（不带 `programmaticAnnotation`）→ 正常走 `updateListener → onDocChange → debouncedRender`（`create-view.ts:59-65`）→ **预览实时刷新**，toc/katex/mermaid/markmap 后处理照常。
- 事件语义：远程协作者的编辑**同样触发 `input` / `change` 事件**（core 事件不区分来源）——文档明示；如需区分来源，可对比 `binding.ytext` observer 与事件时序（远期增强）。
- `getMarkdown()` / `setMarkdown()` 照常可用；`setMarkdown` = 全量替换 → 作为一次本地 diff 广播，**会覆盖远程协作者的内容**，协同模式慎用（见 §5.5）。
- 工具栏/对话框/搜索等一切 core 功能不受影响（它们只操作本地 CM6 状态，本地编辑会自然同步出去）。

### 5.5 受控同步限制（vue / react 必读）

- vue `v-model` / react 受控 `value` 会在外部值变化时调 `setMarkdown` **全量回写文档**——协同模式下等于"用本地全文覆盖远程协作者"，是**数据破坏行为**。
- 规则：协同模式下受控绑定必须降级为**单向**（editor → model）：
  - vue：不用 `v-model`，用 `@update:modelValue` 只收不发；
  - react：不给 `value` 传受控值（用 `defaultValue`，0.2.0 起 react 组件补此 prop）；
- 适配包不改代码也能工作（问题出在用户用法），但 vue/react 文档与 docs/collab.md 都要写明；demo 示例按单向绑定演示。

### 5.6 destroy 语义

- `binding.destroy()`：停消息泵 → `awareness.destroy()` → undoManager 绑定清理 → transport.destroy()。**不销毁编辑器**（Editor 自己的 `destroy()` 管自己的 DOM）；文档建议编辑器 destroy 前先 `binding.destroy()`。

## 6. 服务端

### 6.1 参考 relay（随 collab 包发布 `server/relay.mjs`）

协议：**纯二进制广播**。`ws://host/<room>`，服务端按 URL path 分房间，收到任意二进制消息原样转发给同房间**其他**连接（不解析、不落盘、不回发本人）。所有 y-protocols 语义都在客户端——服务端零知识即可协同。

```js
// 参考实现骨架（最终版见 packages/collab/server/relay.mjs）
import { WebSocketServer } from 'ws'
const rooms = new Map()
new WebSocketServer({ port: 1234 }).on('connection', (ws, req) => {
  const room = req.url.slice(1) || 'default'
  const peers = rooms.get(room) ?? new Set()
  peers.add(ws); rooms.set(room, peers)
  ws.on('message', (data) => { for (const p of peers) if (p !== ws && p.readyState === 1) p.send(data) })
  ws.on('close', () => { peers.delete(ws); if (!peers.size) rooms.delete(room) })
})
```

### 6.2 与既有协同生态的关系

- **不兼容** y-websocket 官方服务端协议（其房间路由/awareness 消息有自己的封装）。接 y-websocket / Hocuspocus / PartyKit 等生态的方式：实现 `CollabTransport`（或远期版本提供官方适配器）——transport 抽象就是为此预留的。
- 内网部署：`node server/relay.mjs` 即起，配合 0.1.x 的离线/内网方向（自托管、无公网依赖）。

## 7. 测试策略

- **jsdom 环境无真实 ws/BroadcastChannel，也无法可靠创建 CM6 视图** → 测试用内存 transport 对
  （两条 `Uint8Array` 队列互倒）直连两个 binding（非 EditorMD 实例）。
- 撤销语义不需要视图：用 `EditorState.create({ extensions: binding.extensions })` 取出
  `undoRedoFacet` 的实现后直接调用，即可覆盖"A undo 只回退 A、B 的交叉编辑保留"。
- 当前覆盖（`packages/collab/src/collab.test.ts`，14 例 + core `undo.test.ts` 3 例）：
  - 双端收敛 / 并发交叉编辑最终一致 / 接力编辑；
  - undo 隔离（经 facet）、`undo:false` 不注入 facet；
  - `onSynced` / `onPeers` / `onStatus` 回放时序、慢连接下计时从建连起算；
  - 畸形帧丢弃且不影响后续同步；`destroy` 广播下线、关闭 transport、幂等。
- **已知缺口（仍靠人工走查）**：编辑器级行为（工具栏按钮点击、远程光标渲染、预览刷新）
  没有自动化用例——`#collab` 示例为手工/截图验证对象。
- **check:selection**：默认 URL 是 `#basics`；改过协同光标/选区后需显式
  `pnpm check:selection -- --url http://127.0.0.1:4173/#collab`（未纳入默认清单）。
- demo 用 `broadcastChannelTransport`（GH Pages 静态站无 ws 也能演示：双开标签页即实时协同）。

## 8. 里程碑拆分（对应 TODO.md P12）

1. core 外置化 + peer 化（ADR-007）——独立可发，先落
2. collab 包骨架（transport/sync/binding + 内存 transport 测试）
3. undo + 远程光标主题（半透明合规 + check:selection）
4. relay 参考服务端 + demo 协同示例（BroadcastChannel）
5. vue defineExpose({ editor })（react 已有句柄，无需改）+ 适配包文档
6. 发版：四包 0.2.0 对齐（CHANGELOG、tag、npm publish:all 扩展为四包）
