/** 回归守护：编辑区内行/匹配背景必须保持半透明，否则会盖住选区绘制层。
 * 背景：选区高亮"可用但不可见"bug 的第三层根因，见 ai-docs/bugfix-cm6-selection-invisible.md。 */
import { describe, expect, it } from 'vitest'
import { THEME_BG } from './themes'

const assertTranslucent = (label: string, color: string): void => {
  const m = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/.exec(color)
  if (!m) throw new Error(`${label} 应为 rgba() 半透明色，实际：${color}`)
  const alpha = Number(m[1])
  if (!(alpha > 0 && alpha < 1)) throw new Error(`${label} alpha 应在 (0, 1) 开区间，实际：${alpha}`)
}

describe('主题行背景半透明约束', () => {
  it('light 主题 activeLine / searchMatch 半透明', () => {
    assertTranslucent('light.activeLine', THEME_BG.light.activeLine)
    assertTranslucent('light.searchMatch', THEME_BG.light.searchMatch)
  })

  it('dark 主题 activeLine / searchMatch 半透明', () => {
    assertTranslucent('dark.activeLine', THEME_BG.dark.activeLine)
    assertTranslucent('dark.searchMatch', THEME_BG.dark.searchMatch)
  })

  it('THEME_BG 结构完整', () => {
    expect(Object.keys(THEME_BG).sort()).toEqual(['dark', 'light'])
  })
})
