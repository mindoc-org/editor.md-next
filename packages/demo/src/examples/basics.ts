import { EditorMD } from 'editor.md-next'
import { BASIC_SAMPLE, DIAGRAM_SAMPLE, TEX_SAMPLE } from './samples'
import { exampleShell } from './types'
import type { Example } from './types'

export const basics: Example = {
  id: 'basics',
  title: '基础用法',
  description: 'new EditorMD(目标元素, 配置)——分屏实时预览、同步滚动、工具栏与快捷键。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, { value: BASIC_SAMPLE, width: '100%', height: 520 })
    return () => editor.destroy()
  },
}

export const themes: Example = {
  id: 'themes',
  title: '主题切换',
  description: '编辑区与预览区支持 default/dark 主题；工具栏「切换主题」按钮一键切换；F11 全屏。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, {
      value: '# 主题示例\n\n点击工具栏最右侧的「切换主题」按钮试试。\n\n- 浅色 / 深色\n- 编辑区与预览区独立配置\n',
      width: '100%',
      height: 460,
    })
    const buttons = document.createElement('p')
    const b1 = document.createElement('button')
    b1.textContent = '编辑区深色'
    b1.onclick = () => editor.setEditorTheme('dark')
    const b2 = document.createElement('button')
    b2.textContent = '编辑区浅色'
    b2.onclick = () => editor.setEditorTheme('default')
    const b3 = document.createElement('button')
    b3.textContent = '预览深色'
    b3.onclick = () => editor.setPreviewTheme('dark')
    const b4 = document.createElement('button')
    b4.textContent = '预览浅色'
    b4.onclick = () => editor.setPreviewTheme('default')
    for (const b of [b1, b2, b3, b4]) buttons.append(b)
    container.append(buttons)
    return () => editor.destroy()
  },
}

export const toc: Example = {
  id: 'toc',
  title: '目录（TOC / TOCM）',
  description: '[TOC] 生成内嵌目录，[TOCM] 生成下拉菜单；标题自动生成锚点（支持中文）。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, {
      value:
        '[TOC]\n\n# 第一章\n\n## 1.1 小节\n\n### 1.1.1 细节\n\n# 第二章\n\n## 2.1 小节\n\n[TOCM]\n\n正文内容……\n',
      width: '100%',
      height: 520,
    })
    return () => editor.destroy()
  },
}

export const emoji: Example = {
  id: 'emoji',
  title: 'Emoji 表情',
  description:
    '四类语法：:name:（GitHub 图片）、:tw-编码:（Twemoji）、:fa-图标:、:editormd-logo:；工具栏 emoji 对话框可多选插入。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, {
      value:
        '## Emoji 语法\n\nGitHub：:smile: :+1: :rocket: :heart_eyes:\n\nTwemoji：:tw-1f600: :tw-1f680:\n\nFontAwesome：:fa-star: :fa-github: :fa-heart:\n\nLogo：:editormd-logo: :editormd-logo-3x:\n\n时间格式不受影响：12:30:45\n',
      width: '100%',
      height: 480,
    })
    return () => editor.destroy()
  },
}

export const tex: Example = {
  id: 'tex',
  title: '数学公式（KaTeX）',
  description: '$$..$$ 行内与独立公式、```math 围栏；KaTeX 按需从 CDN 懒加载。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, {
      value: TEX_SAMPLE,
      width: '100%',
      height: 480,
      markdown: { tex: true },
    })
    return () => editor.destroy()
  },
}

export const diagram: Example = {
  id: 'diagram',
  title: '图表（mermaid / mindmap）',
  description: '```mermaid 流程图/时序图，```mindmap 脑图（可指定高度）；均从 CDN 懒加载。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, {
      value: DIAGRAM_SAMPLE,
      width: '100%',
      height: 560,
    })
    return () => editor.destroy()
  },
}
