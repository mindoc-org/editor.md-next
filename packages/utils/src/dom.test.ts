import { describe, expect, it } from 'vitest'
import { addClass, h, hasClass, queryDom, removeClass, setStyles } from './dom'

describe('h', () => {
  it('创建元素并设置属性与子节点', () => {
    const el = h('div', { class: 'box', 'data-id': '3', hidden: false }, [
      h('span', {}, ['hi']),
      'text',
      null,
      false,
    ])
    expect(el.tagName).toBe('DIV')
    expect(el.className).toBe('box')
    expect(el.getAttribute('data-id')).toBe('3')
    expect(el.hasAttribute('hidden')).toBe(false)
    expect(el.children[0]!.tagName).toBe('SPAN')
    expect(el.textContent).toBe('hitext')
  })
})

describe('queryDom', () => {
  it('支持 selector 与元素', () => {
    const el = h('div', { id: 'target' })
    document.body.append(el)
    expect(queryDom('#target')).toBe(el)
    expect(queryDom(el)).toBe(el)
    expect(queryDom('#missing')).toBe(null)
    el.remove()
  })
})

describe('class 操作', () => {
  it('add/remove/has', () => {
    const el = h('div')
    addClass(el, 'a', 'b')
    addClass(el, undefined, null, false)
    expect(hasClass(el, 'a') && hasClass(el, 'b')).toBe(true)
    removeClass(el, 'a')
    expect(hasClass(el, 'a')).toBe(false)
  })
})

describe('setStyles', () => {
  it('设置与清除样式', () => {
    const el = h('div') as HTMLElement
    setStyles(el, { width: '10px', zIndex: 5 })
    expect(el.style.width).toBe('10px')
    expect(el.style.zIndex).toBe('5')
    setStyles(el, { width: null })
    expect(el.style.width).toBe('')
  })
})
