import { describe, expect, it } from 'vitest'
import { isAllowedFormat, parseResponse } from './uploader'

describe('parseResponse', () => {
  it('成功 JSON', () => {
    expect(parseResponse(200, '{"success":1,"url":"https://x/a.png"}')).toEqual({
      success: 1,
      url: 'https://x/a.png',
    })
    expect(parseResponse(200, '{"success":true,"url":"/a.png"}')).toEqual({ success: 1, url: '/a.png' })
  })

  it('失败 JSON', () => {
    expect(parseResponse(200, '{"success":0,"message":"too large"}')).toEqual({
      success: 0,
      message: 'too large',
    })
    expect(parseResponse(200, '{"success":0}')).toEqual({ success: 0, message: 'upload failed' })
  })

  it('HTTP 错误码', () => {
    expect(parseResponse(500, 'oops')).toEqual({ success: 0, message: 'HTTP 500' })
  })

  it('非 JSON 文本按失败处理', () => {
    expect(parseResponse(200, 'plain text')).toEqual({ success: 0, message: 'plain text' })
  })
})

describe('isAllowedFormat', () => {
  it('白名单校验大小写不敏感', () => {
    const formats = ['jpg', 'png', 'webp']
    expect(isAllowedFormat('a.PNG', formats)).toBe(true)
    expect(isAllowedFormat('b.webp', formats)).toBe(true)
    expect(isAllowedFormat('c.gif', formats)).toBe(false)
    expect(isAllowedFormat('noext', formats)).toBe(false)
  })
})
