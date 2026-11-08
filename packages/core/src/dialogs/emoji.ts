/** Emoji 对话框：GitHub / Twemoji / Font Awesome / Logo 四个 tab 的网格多选。 */
import { addClass } from '@editormd-next/utils'
import type { EditorMD } from '../editor'
import { Dialog } from './dialog'
import { githubEmojiSrc } from '../markdown/plugin-emoji'
import {
  EMOJI_LOGOS,
  FONT_AWESOME_ICONS,
  GITHUB_EMOJI,
  TWEMOJI,
} from '../markdown/data/emoji-data'
import type { EmojiCategory } from '../markdown/data/emoji-data'

type EmojiKind = 'github' | 'twemoji' | 'fa' | 'logo'

const selected = new Set<string>()

export function openEmojiDialog(editor: EditorMD): Dialog {
  const lang = editor.lang.dialog.emoji
  selected.clear()

  const tabs = document.createElement('div')
  addClass(tabs, 'emd-tabs')
  const tabDefs: Array<{ kind: EmojiKind; label: string }> = [
    { kind: 'github', label: lang.github },
    { kind: 'twemoji', label: lang.twemoji },
    { kind: 'fa', label: lang.fontAwesome },
    { kind: 'logo', label: lang.logo },
  ]
  const tabButtons = new Map<EmojiKind, HTMLButtonElement>()
  const panes = new Map<EmojiKind, HTMLElement>()

  const container = document.createElement('div')
  const paneWrap = document.createElement('div')
  for (const { kind, label } of tabDefs) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = label
    addClass(btn, 'emd-tab')
    tabs.append(btn)
    tabButtons.set(kind, btn)

    const pane = document.createElement('div')
    addClass(pane, 'emd-tab-pane', 'emd-emoji-pane', 'emd-hidden')
    pane.append(buildGrid(editor, kind))
    paneWrap.append(pane)
    panes.set(kind, pane)
    btn.addEventListener('click', () => selectTab(kind))
  }

  const selectTab = (kind: EmojiKind): void => {
    for (const [k, btn] of tabButtons) {
      btn.classList.toggle('emd-tab-active', k === kind)
    }
    for (const [k, pane] of panes) {
      pane.classList.toggle('emd-hidden', k !== kind)
    }
  }
  selectTab('github')
  container.append(tabs, paneWrap)

  return new Dialog(editor, {
    name: 'emoji',
    title: lang.title,
    width: 560,
    content: container,
    buttons: [
      {
        key: 'enter',
        label: editor.lang.buttons.enter,
        primary: true,
        action: () => {
          if (selected.size > 0) {
            editor.insertValue([...selected].map((name) => `:${name}:`).join(' '))
          }
        },
      },
      { key: 'cancel', label: editor.lang.buttons.cancel },
    ],
  }).open() as Dialog
}

function buildGrid(editor: EditorMD, kind: EmojiKind): HTMLElement {
  const grid = document.createElement('div')
  addClass(grid, 'emd-grid')

  const addItem = (name: string, html: string): void => {
    const cell = document.createElement('button')
    cell.type = 'button'
    cell.title = `:${name}:`
    addClass(cell, 'emd-grid-cell')
    cell.innerHTML = html
    cell.addEventListener('click', () => {
      cell.classList.toggle('emd-grid-cell-active')
      if (selected.has(name)) selected.delete(name)
      else selected.add(name)
    })
    grid.append(cell)
  }

  const githubPath = editor.options.markdown.emojiGithubPath
  const twemojiPath = editor.options.markdown.emojiTwemojiPath

  if (kind === 'github') {
    for (const category of GITHUB_EMOJI as EmojiCategory[]) {
      const heading = document.createElement('div')
      addClass(heading, 'emd-grid-category')
      heading.textContent = category.category
      grid.append(heading)
      for (const name of category.list) {
        addItem(name, `<img class="emd-emoji" src="${githubEmojiSrc(githubPath, name)}" alt=":${name}:" loading="lazy" width="20" height="20">`)
      }
    }
  } else if (kind === 'twemoji') {
    for (const code of TWEMOJI) {
      addItem(`tw-${code}`, `<img class="emd-emoji" src="${twemojiPath}${code}.png" alt=":tw-${code}:" loading="lazy" width="20" height="20">`)
    }
  } else if (kind === 'fa') {
    for (const icon of FONT_AWESOME_ICONS) {
      addItem(`fa-${icon}`, `<i class="fa fa-${icon}"></i>`)
    }
  } else {
    for (const name of EMOJI_LOGOS) {
      addItem(name, `<i class="editormd-logo ${name}"></i>`)
    }
  }
  return grid
}

