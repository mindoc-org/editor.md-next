/** 对话框注册表：名称 → 打开函数。 */
import type { EditorMD } from '../editor'
import type { Dialog } from './dialog'
import { openImageDialog } from './image'
import { openLinkDialog, openReferenceLinkDialog } from './link'
import { openCodeBlockDialog, openPreformattedTextDialog } from './code'
import { openTableDialog } from './table'
import { openEmojiDialog } from './emoji'
import { openHtmlEntitiesDialog } from './entities'
import { openGotoLineDialog, openHelpDialog, openInfoDialog } from './misc'

export type DialogFactory = (editor: EditorMD) => Dialog

const registry: Record<string, DialogFactory> = {
  link: openLinkDialog,
  referenceLink: openReferenceLinkDialog,
  image: openImageDialog,
  codeBlock: openCodeBlockDialog,
  preformattedText: openPreformattedTextDialog,
  table: openTableDialog,
  emoji: openEmojiDialog,
  htmlEntities: openHtmlEntitiesDialog,
  gotoLine: openGotoLineDialog,
  help: openHelpDialog,
  info: openInfoDialog,
}

/** 注册自定义对话框（覆盖同名内置） */
export function registerDialog(name: string, factory: DialogFactory): void {
  registry[name] = factory
}

export function openRegisteredDialog(editor: EditorMD, name: string): Dialog | null {
  const factory = registry[name]
  if (!factory) {
    console.warn(`[editormd-next] unknown dialog: ${name}`)
    return null
  }
  return factory(editor)
}
