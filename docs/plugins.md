# 扩展开发

## 自定义工具栏按钮

```ts
new EditorMD('#editor', {
  toolbar: {
    spec: ['undo', '|', 'like', '||', 'watch'],   // '||' 之后右对齐
    icons: { like: 'fa-thumbs-o-up' },
    titles: { like: '点赞' },
    handlers: {
      like: (editor) => editor.insertValue(':plus1:'),
    },
  },
})
```

- `spec` 支持 `'full' | 'simple' | 'mini'` 模式名或数组；数组项：按钮名 / `'|'` 分隔线 / `'||'` 右对齐 / `'dropdown:标题:h1,h2,h3'` 下拉组
- `handlers` 中的同名动作覆盖内置
- `customIcons: { name: '<svg>…</svg>' }` 可用任意 HTML 替换图标

## 自定义对话框

```ts
import { Dialog, registerDialog } from 'editor.md-next'
import type { EditorMD } from 'editor.md-next'

registerDialog('wordCount', (editor: EditorMD) => {
  const content = document.createElement('div')
  content.textContent = `当前字符数：${editor.getMarkdown().length}`
  return new Dialog(editor, {
    name: 'wordCount',
    title: '字数统计',
    content,
    buttons: [{ key: 'close', label: editor.lang.buttons.close }],
  }).open()
})

// 打开：editor.openDialog('wordCount')，或加进 toolbar.spec
```

内置对话框同名覆盖（`link` / `image` / `codeBlock` …）。

## 追加 markdown-it 插件

```ts
import footnote from 'markdown-it-footnote'

new EditorMD('#editor', {
  markdown: { use: [footnote] },
})
```

## 注入 CodeMirror 扩展

```ts
import { keymap } from '@codemirror/view'

new EditorMD('#editor', {
  editor: {
    extensions: [keymap.of([{ key: 'Mod-Enter', run: () => true }])],
  },
})
```

注意：从 0.2.0 起，core 的 `@codemirror/*` 与 `@lezer/*` 为 peer 依赖（安装时自动带上，全页共享同一份 CM6 实例），宿主注入的扩展可以与任意 CM6 生态包混用。0.1.x 版本的全打包产物下注入第三方 CM6 扩展会因双实例报错（`Unrecognized extension value`），请升级。

## 自定义撤销实现

0.2.0 起，撤销/重做收敛到单一扩展点 `undoRedoFacet`：工具栏撤销/重做按钮、`Mod-z` 系列快捷键、
`editor.undo()/redo()` 都经 `performUndo/performRedo` 分派。默认（无注入）走 CodeMirror 内置 history；
协同拓展包 `editor.md-next-collab` 正是通过它把撤销接到 `Y.UndoManager`（只撤自己的编辑）。

需要接入自己的操作日志（服务端版本回滚、草稿恢复等）时：

```ts
import { EditorMD, undoRedoFacet } from 'editor.md-next'
import type { UndoRedoImpl } from 'editor.md-next'

const myUndo: UndoRedoImpl = {
  // 返回 true 表示已处理；返回 false 表示"无可撤销"，调用方按未处理对待
  undo: (view) => rollbackLocally(view),
  redo: (view) => replayLocally(view),
}

new EditorMD('#editor', {
  editor: { extensions: [undoRedoFacet.of(myUndo)] },
})
```

多个实现同时存在时后注入者优先（与 CM6 Compartment 习惯一致）。

## 事件扩展

`editor.on(...)` 返回解绑函数；`emit` 可派发自定义载荷（受 `EditorEvents` 类型约束，扩展类型见 `types/events.ts`）。
