/** 回归守护：编辑区内行/匹配背景必须保持半透明，否则会盖住选区绘制层。
 * 背景：选区高亮"可用但不可见"bug 的第三层根因，见 ai-docs/bugfix-cm6-selection-invisible.md。 */
import { describe, expect, it } from 'vitest'
import { THEME_BG } from './themes'

/** 解析 CSS 颜色的 alpha：支持 rgba() 与 8 位 hex（#RRGGBBAA）。
 *  6 位 hex / rgb() 视为不透明（alpha=1）；其余格式直接报错，避免守护被绕过。 */
const alphaOf = (label: string, color: string): number => {
  const rgba = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/.exec(color)
  if (rgba) return Number(rgba[1])
  const hex8 = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})$/.exec(color)
  if (hex8) return parseInt(hex8[1], 16) / 255
  if (/^#[0-9a-fA-F]{6}$/.test(color) || /^rgb\(/.test(color)) return 1
  throw new Error(`${label} 颜色格式无法解析（需 rgba() / #RRGGBBAA / 不透明的 rgb() / #RRGGBB）：${color}`)
}

const assertTranslucent = (label: string, color: string): void => {
  const alpha = alphaOf(label, color)
  if (!(alpha > 0 && alpha < 1)) {
    throw new Error(`${label} alpha 应在 (0, 1) 开区间，实际：${alpha}（${color}）`)
  }
}

/** 新增行/匹配背景色必须同步加到这里，否则「结构完整」用例会失败。 */
const REQUIRED_KEYS = ['activeLine', 'searchMatch', 'selectionMatch'] as const

const assertAllTranslucent = (scheme: 'light' | 'dark'): void => {
  for (const key of REQUIRED_KEYS) assertTranslucent(`${scheme}.${key}`, THEME_BG[scheme][key])
}

describe('主题行背景半透明约束', () => {
  it('light 主题所有行/匹配背景半透明', () => {
    assertAllTranslucent('light')
  })

  it('dark 主题所有行/匹配背景半透明', () => {
    assertAllTranslucent('dark')
  })

  it('THEME_BG 结构完整（新增背景色必须纳入守护）', () => {
    expect(Object.keys(THEME_BG).sort()).toEqual(['dark', 'light'])
    for (const scheme of ['light', 'dark'] as const) {
      expect(Object.keys(THEME_BG[scheme]).sort()).toEqual([...REQUIRED_KEYS].sort())
    }
  })

  it('守护本身能识别 rgba 与 8 位 hex，并能抓出不透明色', () => {
    expect(alphaOf('rgba', 'rgba(9, 105, 218, 0.04)')).toBeCloseTo(0.04)
    expect(alphaOf('hex8', '#fae17d80')).toBeCloseTo(128 / 255)
    expect(alphaOf('opaque-hex', '#fff8c5')).toBe(1)
    expect(alphaOf('opaque-rgb', 'rgb(1, 2, 3)')).toBe(1)
    expect(() => assertTranslucent('opaque', '#fff8c5')).toThrow(/alpha 应在/)
    expect(() => alphaOf('bad', 'hsl(0 0% 50%)')).toThrow(/颜色格式无法解析/)
  })
})
