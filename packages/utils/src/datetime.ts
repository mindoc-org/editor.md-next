/**
 * PHP 风格日期格式化（对齐原版 editormd.dateFormat 的常用 token 子集）。
 *
 * 支持：Y(4位年) y(2位年) m(补零月) n(月) d(补零日) j(日)
 *       H(补零时) G(时) i(补零分) s(补零秒) u(毫秒)
 *       w(数字星期) N(ISO星期) L(闰年0/1)
 *       M(英文月缩写) F(英文月全名) D(英文星期缩写) l(英文星期全名)
 *       cnWD(中文星期) cnWDShort(中文星期缩写)
 * 任意其他字符原样输出，可用 \\ 转义。
 */

const CN_WEEK = ['日', '一', '二', '三', '四', '五', '六']
const EN_MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const EN_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const pad2 = (n: number): string => String(n).padStart(2, '0')

export function dateFormat(format: string, date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const weekDay = date.getDay()

  const tokens: Record<string, string> = {
    Y: String(year),
    y: String(year % 100).padStart(2, '0'),
    m: pad2(month + 1),
    n: String(month + 1),
    d: pad2(day),
    j: String(day),
    H: pad2(date.getHours()),
    G: String(date.getHours()),
    i: pad2(date.getMinutes()),
    s: pad2(date.getSeconds()),
    u: String(date.getMilliseconds()).padStart(3, '0'),
    w: String(weekDay),
    N: String(weekDay === 0 ? 7 : weekDay),
    L: String(isLeapYear(year) ? 1 : 0),
    M: EN_MONTH[month]!.slice(0, 3),
    F: EN_MONTH[month]!,
    D: EN_WEEK[weekDay]!.slice(0, 3),
    l: EN_WEEK[weekDay]!,
    cnWD: `星期${CN_WEEK[weekDay]}`,
    cnWDShort: CN_WEEK[weekDay]!,
  }

  let out = ''
  for (let i = 0; i < format.length; i++) {
    const ch = format[i]!
    if (ch === '\\') {
      out += format[++i] ?? ''
      continue
    }
    // 多字符 token（cnWD*）必须先于单字符匹配，否则会被 n/w/d 等截胡
    if (format.startsWith('cnWDShort', i)) {
      out += tokens['cnWDShort']!
      i += 'cnWDShort'.length - 1
      continue
    }
    if (format.startsWith('cnWD', i)) {
      out += tokens['cnWD']!
      i += 'cnWD'.length - 1
      continue
    }
    out += tokens[ch] ?? ch
  }
  return out
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}
