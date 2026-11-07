/** 预览代码高亮（highlight.js 常用语言子集）与代码块折叠。 */
import hljs from 'highlight.js/lib/common'

/** markdown-it highlight 回调：返回高亮 HTML；不认识的语言返回空串走默认转义。 */
export function highlightCode(code: string, lang: string): string {
  const normalized = lang.trim().toLowerCase()
  if (normalized && hljs.getLanguage(normalized)) {
    try {
      return hljs.highlight(code, { language: normalized, ignoreIllegals: true }).value
    } catch {
      /* fallthrough */
    }
  }
  return ''
}

export interface FoldOptions {
  /** 超过该行数的代码块出现折叠按钮 */
  threshold: number
}

/** post-render：为高代码块包一层折叠容器（预览侧 codeFold，编辑器侧由 CM6 foldGutter 负责） */
export function foldCodeBlocks(container: HTMLElement, options: FoldOptions): void {
  for (const pre of container.querySelectorAll<HTMLPreElement>('pre')) {
    if (pre.closest('.emd-code-block')) continue
    const lines = pre.textContent?.split('\n').length ?? 0
    if (lines <= options.threshold) continue

    const wrapper = document.createElement('div')
    wrapper.className = 'emd-code-block emd-code-foldable'
    pre.replaceWith(wrapper)
    wrapper.append(pre)

    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'emd-code-fold-toggle'
    toggle.textContent = '⇕'
    toggle.title = 'fold / unfold code block'
    toggle.addEventListener('click', () => {
      wrapper.classList.toggle('emd-code-folded')
    })
    wrapper.append(toggle)
  }
}
