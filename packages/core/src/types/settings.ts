/** 编辑器配置类型：分组结构、解析前（User）与解析后（完整）两套。 */
import type { Extension } from '@codemirror/state'
import type { MarkdownIt } from 'markdown-it'
import type { I18nCode, ThemeName, WidthOrHeight } from './common'
import type { EditorEvents } from './events'
import type { LangDict } from './lang'

export type MarkdownItPlugin = (md: MarkdownIt) => void

/** 编辑区（CodeMirror）配置 */
export interface EditorSectionConfig {
  /** 内置 default/dark，或直接注入 CM6 theme 扩展 */
  theme: ThemeName | Extension
  fontSize: string
  fontFamily: string
  lineNumbers: boolean
  lineWrapping: boolean
  tabSize: number
  indentWithTabs: boolean
  readOnly: boolean
  autoFocus: boolean
  /** 高度自适应内容（预览侧同高） */
  autoHeight: boolean
  activeLine: boolean
  closeBrackets: boolean
  /** 禁用的快捷键（如 F9 / Mod-b） */
  disabledKeys: string[]
  /** 额外注入 CM6 扩展（高级用法） */
  extensions: Extension[]
}

/** 预览区配置 */
export interface PreviewSectionConfig {
  enable: boolean
  theme: ThemeName
  /** 编辑器↔预览同步滚动；'single' 表示仅编辑器→预览 */
  syncScroll: boolean | 'single'
  /** 内容变化到重渲染的防抖毫秒数 */
  delay: number
  /** 同步 HTML 到隐藏 textarea（需 name） */
  saveHtml: boolean
  /** 预览代码高亮（hljs） */
  codeHighlight: boolean
}

export type ToolbarMode = 'full' | 'simple' | 'mini'
/** '|' 分隔线；'||' 之后右对齐；'dropdown:Name:a,b,c' 下拉组 */
export type ToolbarItem = string
export type ToolbarSpec = ToolbarMode | ToolbarItem[]
export type ToolbarHandler = (editor: import('../editor').EditorMD) => void

export interface ToolbarConfig {
  enable: boolean
  spec: ToolbarSpec
  /** 页面滚动时工具栏吸顶 */
  autoFixed: boolean
  /** 覆盖/新增 FontAwesome 图标类名 */
  icons: Record<string, string>
  /** 覆盖按钮提示文字（在 i18n 之上） */
  titles: Record<string, string>
  /** 自定义按钮动作 */
  handlers: Record<string, ToolbarHandler>
  /** 用 HTML 片段替换默认图标 */
  customIcons: Record<string, string>
}

export interface TocOptions {
  enable: boolean
  /** 空串则使用 i18n.tocTitle */
  title: string
  /** 1~6，目录包含的最小标题级别 */
  startLevel: number
  /** 目录以下拉菜单形式渲染 */
  dropdown: boolean
  /** 目录渲染到指定 selector（预览区之外） */
  container?: string
}

export interface MarkdownConfig {
  toc: TocOptions
  taskList: boolean
  emoji: boolean
  /** `:name:` github 风格 emoji 图片目录（路径 + name + .png） */
  emojiGithubPath: string
  /** `:tw-code:` twemoji 图片目录（路径 + code + .png） */
  emojiTwemojiPath: string
  /** KaTeX 数学公式（CDN 懒加载） */
  tex: boolean
  /** ```mermaid 代码块（CDN 懒加载） */
  mermaid: boolean
  /** ```mindmap 代码块（markmap，CDN 懒加载） */
  mindmap: boolean
  /** [info]/[warning] 等 callout 引用块 */
  callouts: boolean
  /** [========] 分页符 */
  pageBreak: boolean
  /** @user → github 链接 */
  atLink: boolean
  /** 邮箱自动链接 */
  emailLink: boolean
  /** 允许预览中保留原生 HTML */
  htmlDecode: boolean
  /** DOMPurify 消毒（建议始终开启） */
  sanitize: boolean
  /** 追加用户 markdown-it 插件 */
  use: MarkdownItPlugin[]
}

export interface UploadConfig {
  image: boolean
  url: string
  /** 允许的扩展名 */
  formats: string[]
  /** 表单字段名（兼容原版服务端） */
  fieldName: string
  withCredentials: boolean
}

export interface DialogConfig {
  /** 弹窗时锁定页面滚动 */
  lockScreen: boolean
  /** 对话框可拖拽 */
  draggable: boolean
  /** 显示遮罩 */
  showMask: boolean
  maskOpacity: number
}

/** 重依赖 CDN 地址（懒加载脚本/样式）；置空串禁用对应特性加载 */
export interface CdnConfig {
  katexCss: string
  katexJs: string
  mermaidJs: string
  markmapJs: string
}

export type I18nOption = I18nCode | LangDict

/** 完整解析后的配置（内部使用，字段全部必有） */
export interface EditorOptions {
  /** 隐藏 textarea 的 name（表单提交场景）；空则不创建 */
  name: string
  value: string
  width: WidthOrHeight
  height: WidthOrHeight
  /** 实况预览（分屏） */
  watch: boolean
  placeholder: string
  i18n: I18nOption
  editor: EditorSectionConfig
  preview: PreviewSectionConfig
  toolbar: ToolbarConfig
  markdown: MarkdownConfig
  upload: UploadConfig
  dialog: DialogConfig
  cdn: CdnConfig
  /** settings 风格回调（事件总线的糖衣） */
  on: { [K in keyof EditorEvents]?: (payload: EditorEvents[K]) => void }
}

/** 用户输入配置（全部可选；toolbar=false 表示不渲染工具栏） */
export interface EditorUserOptions {
  name?: string
  value?: string
  width?: WidthOrHeight
  height?: WidthOrHeight
  watch?: boolean
  placeholder?: string
  i18n?: I18nOption
  editor?: Partial<EditorSectionConfig>
  preview?: Partial<PreviewSectionConfig>
  toolbar?: false | Partial<ToolbarConfig>
  markdown?: Partial<Omit<MarkdownConfig, 'toc'>> & { toc?: boolean | Partial<TocOptions> }
  upload?: Partial<UploadConfig>
  dialog?: Partial<DialogConfig>
  cdn?: Partial<CdnConfig>
  on?: EditorOptions['on']
}
