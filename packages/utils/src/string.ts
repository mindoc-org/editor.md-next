/** 字符串工具。 */

/** 去除首尾空白（兼容全角空格） */
export function trim(text: string): string {
  return text.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')
}

/** 首字母大写 */
export function ucfirst(text: string): string {
  if (text === '') return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** 每个单词首字母大写 */
export function ucwords(text: string): string {
  return text.replace(/(\s|^)([\p{L}\p{N}])/gu, (_, space: string, letter: string) => space + letter.toUpperCase())
}

/** HTML 转义 */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

let uid = 0

/** 生成短随机 id（编辑器内部元素命名用） */
export function randomId(prefix = 'editormd'): string {
  uid += 1
  return `${prefix}-${Date.now().toString(36)}-${uid}`
}

/**
 * 标题锚点 slug。策略：
 * - 纯 ASCII（字母数字与连字符）：空白折叠为 '-'；
 * - 含 Unicode 字母（中文等）：移除非字母数字符号后走 encodeURI 风格并去掉 %，保留可读性；
 * - 纯符号/空串：返回空串（调用方负责兜底命名）。
 */
export function slugify(text: string): string {
  const cleaned = trim(text).toLowerCase()
  if (cleaned === '') return ''

  const dashed = cleaned.replace(/\s+/g, '-')
  if (/^[\w-]+$/.test(dashed)) {
    return dashed.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
  }
  if (/\p{L}/u.test(cleaned)) {
    const partial = dashed.replace(/[^\p{L}\p{N}-]/gu, '').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
    return encodeURIComponent(partial).replaceAll('%', '')
  }
  return ''
}

/** TOC 锚点去重器：同一文档内相同标题自动追加 -1/-2 后缀。 */
export class Slugger {
  private seen = new Map<string, number>()

  slug(text: string): string {
    const base = slugify(text) || 'section'
    const count = this.seen.get(base) ?? 0
    this.seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}
