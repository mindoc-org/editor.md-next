/** 任务列表插件：`- [ ]` / `- [x]` → 可勾选复选框。 */
import type { MarkdownIt, StateCore, Token } from 'markdown-it'

const TASK_RE = /^\[([ xX])\]\s/

export function taskListPlugin(md: MarkdownIt): void {
  md.core.ruler.push('emd_tasklist', (state: StateCore) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const inline = tokens[i]!
      if (inline.type !== 'inline') continue
      // 紧凑列表：list_item_open, inline
      // 宽松列表：list_item_open, paragraph_open, inline
      const prev = tokens[i - 1]
      let listItem: Token | undefined
      if (prev?.type === 'list_item_open') {
        listItem = prev
      } else if (prev?.type === 'paragraph_open' && tokens[i - 2]?.type === 'list_item_open') {
        listItem = tokens[i - 2]
      }
      if (!listItem) continue
      const first = inline.children?.[0]
      if (!first || first.type !== 'text') continue
      const match = TASK_RE.exec(first.content)
      if (!match) continue

      const checked = match[1] !== ' '
      first.content = first.content.slice(match[0].length)
      const checkbox = new state.Token('emd_task_checkbox', 'input', 0)
      checkbox.attrs = [
        ['type', 'checkbox'],
        ['class', 'emd-task-checkbox'],
      ]
      if (checked) checkbox.attrSet('checked', '')
      checkbox.attrSet('disabled', '')
      inline.children!.unshift(checkbox)
      listItem.attrJoin('class', 'emd-task-list-item')
    }
  })

  md.renderer.rules['emd_task_checkbox'] = (tokens, idx) => {
    const token = tokens[idx]!
    const attrs = (token.attrs ?? [])
      .map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${v}"`))
      .join('')
    return `<input${attrs}>`
  }
}
