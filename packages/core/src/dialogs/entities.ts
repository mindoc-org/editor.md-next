/** HTML 实体字符对话框：网格多选插入。 */
import { addClass } from '@editormd-next/utils'
import type { EditorMD } from '../editor'
import { Dialog } from './dialog'
import { HTML_ENTITIES } from './data/html-entities-data'

export function openHtmlEntitiesDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.htmlEntities
  const picked: string[] = []

  const grid = document.createElement('div')
  addClass(grid, 'emd-grid', 'emd-entities-grid')
  for (const entity of HTML_ENTITIES) {
    const cell = document.createElement('button')
    cell.type = 'button'
    cell.title = entity.description
    addClass(cell, 'emd-grid-cell')
    cell.textContent = entity.name.replaceAll('&amp;', '&')
    cell.addEventListener('click', () => {
      cell.classList.toggle('emd-grid-cell-active')
      const value = cell.textContent ?? ''
      const index = picked.indexOf(value)
      if (index >= 0) picked.splice(index, 1)
      else picked.push(value)
    })
    grid.append(cell)
  }

  return new Dialog(editor, {
    name: 'htmlEntities',
    title: lang.title,
    width: 560,
    content: grid,
    buttons: [
      {
        key: 'enter',
        label: editor.lang.buttons.enter,
        primary: true,
        action: () => {
          if (picked.length > 0) editor.insertValue(picked.join(' '))
        },
      },
      { key: 'cancel', label: editor.lang.buttons.cancel },
    ],
  }).open()
}
