/** 杂项对话框：goto-line / help / info。 */
import { MarkdownEngine } from '../markdown/engine'
import { VERSION } from '../defaults'
import type { EditorMD } from '../editor'
import { Dialog } from './dialog'
import { formRow, showErrorHint } from './form'

export function openGotoLineDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.gotoLine
  const input = document.createElement('input')
  input.type = 'number'
  input.min = '1'
  input.max = String(editor.cm.state.doc.lines)
  input.value = String(editor.cm.state.doc.lineAt(editor.cm.state.selection.main.head).number)

  const content = document.createElement('div')
  content.append(formRow(lang.label, input))

  const dialog = new Dialog(editor, {
    name: 'gotoLine',
    title: lang.title,
    content,
    buttons: [
      {
        key: 'enter',
        label: editor.lang.buttons.enter,
        primary: true,
        action: () => {
          const line = Number(input.value)
          if (!Number.isInteger(line) || line < 1 || line > editor.cm.state.doc.lines) {
            showErrorHint(dialog, lang.invalid)
            return false
          }
          editor.gotoLine(line)
        },
      },
      { key: 'cancel', label: editor.lang.buttons.cancel },
    ],
  })
  dialog.open()
  input.focus()
  input.select()
  return dialog
}

const HELP_MARKDOWN = `# editor.md-next 使用帮助

## 常用快捷键

| 快捷键 | 功能 |
| --- | --- |
| Ctrl-B / Ctrl-I | 粗体 / 斜体 |
| Ctrl-1 ~ Ctrl-6 | 标题 1~6 |
| Ctrl-U / Shift-Ctrl-O | 无序 / 有序列表 |
| Ctrl-K / Shift-Ctrl-K | 行内代码 / 公式 |
| Ctrl-L / Shift-Ctrl-I | 链接 / 图片 |
| Ctrl-F | 搜索替换 |
| F9 / F10 / F11 | 实时预览 / 全窗口预览 / 全屏 |

## 扩展语法

- 目录：\`[TOC]\`，下拉目录：\`[TOCM]\`
- Emoji：\`:smile:\`、\`:fa-star:\`、\`:editormd-logo:\`
- 公式：\`$$E=mc^2$$\`、\`\`\`math 代码块
- 图表：\`\`\`mermaid、\`\`\`mindmap
- 分页：单独一行 \`[========]\`
- 引用提示：\`> [info]\` / \`> [warning]\` / \`> [success]\` / \`> [danger]\`
`

export function openHelpDialog(editor: EditorMD): Dialog {
  const engine = new MarkdownEngine(editor.options.markdown, { codeHighlight: false })
  const content = document.createElement('div')
  content.className = 'emd-help-content emd-preview'
  content.innerHTML = engine.render(HELP_MARKDOWN).html

  return new Dialog(editor, {
    name: 'help',
    title: editor.lang.dialog.help.title,
    width: 640,
    content,
    buttons: [{ key: 'close', label: editor.lang.buttons.close }],
  }).open()
}

export function openInfoDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.info
  const content = document.createElement('div')
  content.innerHTML = `
    <div class="emd-info-dialog">
      <h3>editor.md-next <small>v${VERSION}</small></h3>
      <p>${lang.description}</p>
      <p>${lang.homepage}: <a href="https://github.com/mindoc-org/editor.md-next" target="_blank" rel="noopener noreferrer">GitHub</a></p>
    </div>
  `

  return new Dialog(editor, {
    name: 'info',
    title: lang.title,
    content,
    buttons: [{ key: 'close', label: editor.lang.buttons.close }],
  }).open()
}
