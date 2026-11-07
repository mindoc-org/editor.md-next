# CodeMirror 5 → 6 迁移差异笔记

> 原版大量使用 CM5 的 mode/addon 体系，本文件记录逐项替代方案，供实现时对照。

## 概念映射

| CM5 | CM6 |
|---|---|
| `CodeMirror(host, options)` | `new EditorView({ state, parent })` |
| mode（gfm/markdown） | `markdown({ base: markdownLanguage, codeLanguages: languages })`（GFM 内置表格/删除线/任务列表/autolink） |
| addon display/placeholder | `placeholder()`（@codemirror/view） |
| addon edit/closebrackets | `closeBrackets()`（@codemirror/autocomplete） |
| addon edit/closetag | markdown 场景意义不大，暂不提供 |
| addon selection/active-line | `highlightActiveLine()`（@codemirror/view） |
| addon edit/matchbrackets | `bracketMatching()`（@codemirror/language） |
| addon edit/trailingspace | 暂不做（低价值；如需可写 StateField 装饰） |
| addon fold/* + foldGutter | `foldGutter()` + markdown 折叠（@codemirror/language 内建 foldable） |
| addon search/* | `search()`（@codemirror/search）面板 + `phrases` 汉化 |
| keymap / extraKeys | `keymap.of([...])`（Prec 高低控制）；`disabledKeys` 过滤 |
| `cm.setOption("theme", ...)` | 主题即扩展：EditorView.theme；切换 = 动态 Compartment |
| `cm.on("change")` | `EditorView.updateListener.of(u => u.docChanged && ...)` |
| `cm.setValue/getValue` | `EditorState.create / view.dispatch / view.state.doc.toString()` |
| `lineWrapping` | `EditorView.lineWrapping` |
| `indentUnit/indentWithTabs` | `indentUnit.of(...)`（@codemirror/language） |
| `readOnly` | `EditorState.readOnly` + `EditorView.editable` |
| `styleSelectedText` | 主题层面的 `.cm-selectionBackground` 样式即可 |

## 快捷键差异

- 原版 Ctrl-1..6/B/I/K/L/U 等通过 CM5 extraKeys 实现 → CM6 keymap 中 `Mod-` 前缀；冲突键（如 Mod-k 浏览器语义）沿用原版行为并允许 disabledKeys 屏蔽。
- F9/F10/F11（watch/preview/fullscreen）原版绑在 window keydown 上以绕过 CM 焦点限制 → 保持 window 级监听（CM6 keymap 只在编辑器聚焦时生效）。

## 主题

- CM5 的 31 个 editorTheme 不迁移；提供 default/dark 两个内置 CM6 主题 + Compartment 热切换 + 自定义主题注入 API（用户传 `EditorView.theme()` 产物）。
