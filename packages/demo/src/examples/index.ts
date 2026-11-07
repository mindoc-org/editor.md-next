import { basics, diagram, emoji, themes, tex, toc } from './basics'
import {
  customToolbar,
  events,
  i18n,
  multi,
  readonly,
  renderToExample,
  tasksCallouts,
  upload,
} from './features'
import type { Example } from './types'

export const EXAMPLES: Example[] = [
  basics,
  themes,
  toc,
  emoji,
  tex,
  diagram,
  tasksCallouts,
  events,
  customToolbar,
  upload,
  readonly,
  multi,
  i18n,
  renderToExample,
]
