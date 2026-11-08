/** 语言注册与解析。 */
import type { I18nOption } from '../types/settings';
import type { LangDict } from '../types/lang';
/** 注册自定义语言包（同名覆盖内置）。 */
export declare function registerLang(dict: LangDict): void;
export declare function listLangs(): string[];
/** 解析 i18n 配置：语言代码 → 内置字典；对象 → 直接使用。 */
export declare function resolveLang(option: I18nOption): LangDict;
//# sourceMappingURL=index.d.ts.map