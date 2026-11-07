import { describe, expect, it } from 'vitest'
import { escapeHtml, Slugger, slugify, trim, ucwords, ucfirst } from './string'

describe('trim', () => {
  it('去除首尾空白与全角空格', () => {
    expect(trim('  a b\u3000')).toBe('a b')
  })
})

describe('ucfirst / ucwords', () => {
  it('首字母大写', () => {
    expect(ucfirst('hello')).toBe('Hello')
    expect(ucfirst('')).toBe('')
  })
  it('每个单词首字母大写', () => {
    expect(ucwords('hello world  foo')).toBe('Hello World  Foo')
  })
})

describe('escapeHtml', () => {
  it('转义五种危险字符', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  })
})

describe('slugify', () => {
  it('ASCII 标题', () => {
    expect(slugify('Hello World!  2nd')).toBe('hello-world-2nd')
  })
  it('中文标题走编码路径', () => {
    const slug = slugify('目录 标题')
    expect(slug).not.toContain('%')
    expect(slug.length).toBeGreaterThan(0)
  })
  it('空串退化为 section（由 Slugger 保证）', () => {
    const slugger = new Slugger()
    expect(slugger.slug('***')).toBe('section')
  })
})

describe('Slugger 去重', () => {
  it('重复标题追加序号', () => {
    const slugger = new Slugger()
    expect(slugger.slug('Intro')).toBe('intro')
    expect(slugger.slug('Intro')).toBe('intro-1')
    expect(slugger.slug('Intro')).toBe('intro-2')
    expect(slugger.slug('Other')).toBe('other')
  })
})
