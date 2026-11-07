/** 语言注册与解析。 */
import type { I18nOption } from '../types/settings'
import type { LangDict } from '../types/lang'
import { zhCn } from './zh-cn'
import { en } from './en'
import { zhTw } from './zh-tw'

const builtinLangs: Record<string, LangDict> = {
  'zh-cn': zhCn,
  en,
  'zh-tw': zhTw,
}

/** 注册自定义语言包（同名覆盖内置）。 */
export function registerLang(dict: LangDict): void {
  builtinLangs[dict.name] = dict
}

export function listLangs(): string[] {
  return Object.keys(builtinLangs)
}

/** 解析 i18n 配置：语言代码 → 内置字典；对象 → 直接使用。 */
export function resolveLang(option: I18nOption): LangDict {
  if (typeof option === 'string') {
    return builtinLangs[option] ?? zhCn
  }
  return option
}
