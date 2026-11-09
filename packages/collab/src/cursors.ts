/** 用户信息与远程光标配色（见 ai-docs/collab-design.md §5.3）。 */

/** 固定调色板（6 位 hex，保证 colorLight 拼接有效）。 */
const PALETTE = [
  '#30bced',
  '#6eeac1',
  '#ec9456',
  '#f4777f',
  '#9588ff',
  '#ffc53d',
  '#5ec96e',
  '#ff8fab',
] as const

/** 随机生成 { name, color }——中性用户名 + 固定调色板随机取色。 */
export function randomUser(): { name: string; color: string } {
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)] as string
  const name = `user-${Math.random().toString(36).slice(2, 6)}`
  return { name, color }
}

/**
 * 派生远程选区背景色 colorLight。
 *
 * y-codemirror.next 的远程选区透明度完全来自该值本身（无内置 rgba 处理），
 * 默认回退是 `color + '33'`（约 20% alpha 的 8 位 hex）——这正是本仓库
 * 「行背景必须半透明」铁律的合规路径。非 6 位 hex 的入参无法拼接，
 * 退回中性灰蓝 #8899aa33，保证永远半透明。
 */
export function deriveColorLight(color: string): string {
  const hex = color.replace(/^#/, '')
  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex}33` : '#8899aa33'
}
