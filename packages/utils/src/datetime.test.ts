import { describe, expect, it } from 'vitest'
import { dateFormat } from './datetime'

describe('dateFormat', () => {
  it('基础格式', () => {
    const date = new Date(2026, 10, 8, 9, 5, 3) // 2026-11-08 09:05:03，周日
    expect(dateFormat('Y-m-d H:i:s', date)).toBe('2026-11-08 09:05:03')
    expect(dateFormat('y/n/j G:i', date)).toBe('26/11/8 9:05')
  })

  it('星期与文本 token', () => {
    const date = new Date(2026, 10, 8) // 周日
    expect(dateFormat('l D w N cnWD', date)).toBe('Sunday Sun 0 7 星期日')
    expect(dateFormat('M F', new Date(2026, 0, 1))).toBe('Jan January')
  })

  it('转义与未知字符原样输出', () => {
    const date = new Date(2026, 0, 2)
    expect(dateFormat('\\YY-m', date)).toBe('Y2026-01')
    expect(dateFormat('x', date)).toBe('x')
  })
})
