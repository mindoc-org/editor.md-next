/** 用户配置归一化：深合并默认值，处理 boolean 简写。 */
import { defaults } from './defaults'
import type { EditorOptions, EditorUserOptions, TocOptions } from './types/settings'

function mergeSection<T extends object>(base: T, patch: Partial<T> | undefined): T {
  if (!patch) return { ...base }
  const out = { ...base } as Record<string, unknown>
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    const baseValue = (base as Record<string, unknown>)[key]
    // 纯对象字段做一层深合并（配置均为两层数据，不需要递归更深）
    out[key] =
      isPlainObject(value) && isPlainObject(baseValue)
        ? { ...(baseValue as Record<string, unknown>), ...(value as Record<string, unknown>) }
        : value
  }
  return out as T
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeOptions(input: EditorUserOptions = {}): EditorOptions {
  // markdown.toc 支持 boolean 简写，先剥离再合并其余字段
  const { toc: tocInput, ...markdownRest } = input.markdown ?? {}

  const options: EditorOptions = {
    ...defaults,
    name: input.name ?? defaults.name,
    value: input.value ?? defaults.value,
    width: input.width ?? defaults.width,
    height: input.height ?? defaults.height,
    watch: input.watch ?? defaults.watch,
    placeholder: input.placeholder ?? defaults.placeholder,
    i18n: input.i18n ?? defaults.i18n,
    editor: mergeSection(defaults.editor, input.editor),
    preview: mergeSection(defaults.preview, input.preview),
    markdown: mergeSection(defaults.markdown, markdownRest as Partial<EditorOptions['markdown']>),
    upload: mergeSection(defaults.upload, input.upload),
    dialog: mergeSection(defaults.dialog, input.dialog),
    cdn: mergeSection(defaults.cdn, input.cdn),
    on: { ...input.on },
  }

  // toolbar=false → 不渲染；否则与默认合并
  options.toolbar =
    input.toolbar === false
      ? { ...defaults.toolbar, enable: false }
      : mergeSection(defaults.toolbar, input.toolbar)

  // markdown.toc 支持 boolean 简写：true=默认开启，false=关闭
  if (typeof tocInput === 'boolean') {
    options.markdown.toc = { ...defaults.markdown.toc, enable: tocInput } as TocOptions
  } else if (tocInput) {
    options.markdown.toc = mergeSection(defaults.markdown.toc, tocInput)
  }

  return options
}
