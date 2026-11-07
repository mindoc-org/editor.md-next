/**
 * editor.md-next 的 React 适配组件。
 *
 * 用法：
 * ```tsx
 * import { EditorMD } from 'editor.md-next-react'
 * import 'editor.md-next/css'
 *
 * <EditorMD
 *   defaultValue="# Hello"
 *   options={{ height: 520 }}
 *   onChange={(markdown, html) => console.log(markdown)}
 *   onEvent={(name, payload) => console.log(name, payload)}
 * />
 * ```
 *
 * 受控用法传 `value`（配合 onChange），非受控传 `defaultValue`；
 * 通过 ref 拿到 `{ editor }` 实例做高级操作。
 */
import { EditorMD as EditorMDCore } from 'editor.md-next'
import type { EditorEvents } from 'editor.md-next'
import type { EditorUserOptions } from 'editor.md-next'
import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'

export type EditorMDOptions = Omit<EditorUserOptions, 'value' | 'on'>

export interface EditorMDProps {
  /** 编辑器配置（不含 value/on，见 editor.md-next 文档） */
  options?: EditorMDOptions
  /** 非受控初始内容 */
  defaultValue?: string
  /** 受控内容（传入后以外部值为准） */
  value?: string
  /** 内容变化（防抖渲染完成后触发） */
  onChange?: (markdown: string, html: string) => void
  /** 其余编辑器事件转发：load/watch/scroll/fullscreenEnter…（载荷类型见 EditorEvents） */
  onEvent?: <K extends keyof EditorEvents>(name: K, payload: EditorEvents[K]) => void
  /** 容器 className */
  className?: string
  /** 容器 style */
  style?: React.CSSProperties
}

export interface EditorMDHandle {
  /** 编辑器实例（挂载后可用） */
  editor: EditorMDCore | null
}

const EVENT_NAMES = [
  'load',
  'change',
  'input',
  'resize',
  'watch',
  'unwatch',
  'previewEnter',
  'previewExit',
  'fullscreenEnter',
  'fullscreenExit',
  'scroll',
  'previewScroll',
] as const

export const EditorMD = forwardRef(function EditorMD(
  props: EditorMDProps,
  ref: Ref<EditorMDHandle>,
) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<EditorMDCore | null>(null)
  const programmaticRef = useRef(false)
  // 事件回调放 ref，避免 effect 依赖回调身份变化导致重建编辑器
  const propsRef = useRef(props)
  propsRef.current = props

  useEffect(() => {
    if (!hostRef.current) return

    const handlers: Record<string, (payload: never) => void> = {}
    for (const name of EVENT_NAMES) {
      handlers[name] = (payload) => {
        const { onChange, onEvent } = propsRef.current
        if (name === 'change' && payload) {
          const { markdown, html } = payload as EditorEvents['change']
          if (!programmaticRef.current) onChange?.(markdown, html)
        }
        onEvent?.(name as never, payload as never)
      }
    }
    const on = handlers as { [K in keyof EditorEvents]?: (payload: EditorEvents[K]) => void }

    const ed = new EditorMDCore(hostRef.current, {
      ...propsRef.current.options,
      value: propsRef.current.defaultValue ?? propsRef.current.value ?? '',
      on,
    })
    editorRef.current = ed

    return () => {
      ed.destroy()
      editorRef.current = null
    }
    // 仅挂载/卸载时创建一次（StrictMode 双调用也安全）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 受控 value 同步
  useEffect(() => {
    const ed = editorRef.current
    if (ed && props.value !== undefined && props.value !== ed.getMarkdown()) {
      programmaticRef.current = true
      ed.setMarkdown(props.value)
      programmaticRef.current = false
    }
  }, [props.value])

  useImperativeHandle(ref, () => ({ get editor() { return editorRef.current } }), [])

  return createElement('div', {
    ref: hostRef,
    className: props.className ? `emd-react-editor ${props.className}` : 'emd-react-editor',
    style: { width: '100%', ...props.style },
  })
})

export default EditorMD
