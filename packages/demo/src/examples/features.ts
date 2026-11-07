import { EditorMD } from 'editor.md-next'
import { exampleShell } from './types'
import type { Example } from './types'

export const tasksCallouts: Example = {
  id: 'tasks-callouts',
  title: '任务列表 / Callouts / 分页',
  description: '- [x] 任务列表；> [info]/[warning]/[success]/[danger] 提示块；[========] 分页符；@user 与图片 #size/#align 语法。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, {
      value: [
        '## 任务列表',
        '',
        '- [x] 已完成：渲染管线',
        '- [ ] 待办：发布 npm',
        '- [ ] 待办：部署示例站',
        '',
        '## 提示块',
        '',
        '> [info] 提示',
        '> 这是一段 info 类型的 callout。',
        '',
        '> [warning] 警告',
        '> 注意检查上传地址配置。',
        '',
        '> [success] 成功',
        '> 构建通过！',
        '',
        '> [danger] 危险',
        '> 不要在生产环境开启 htmlDecode。',
        '',
        '## 其他语法',
        '',
        '由 @pandao 编写，联系 test@example.com。',
        '',
        '![固定尺寸图片](https://via.placeholder.com/240x120#size=240x120#align=center)',
        '',
        '[========]',
        '',
        '分页符之后的内容。',
      ].join('\n'),
      width: '100%',
      height: 560,
    })
    return () => editor.destroy()
  },
}

export const events: Example = {
  id: 'events',
  title: '事件总线',
  description: 'on/off/once/emit：load、change、watch、unwatch、scroll、previewScroll、fullscreenEnter 等。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, {
      value: '# 事件示例\n\n在左侧输入，观察下方日志。\n',
      width: '100%',
      height: 380,
    })

    const log = document.createElement('div')
    log.className = 'event-log'
    container.append(log)
    const push = (text: string): void => {
      const line = document.createElement('div')
      line.textContent = `${new Date().toLocaleTimeString()}  ${text}`
      log.prepend(line)
      while (log.children.length > 8) log.lastChild?.remove()
    }

    const offs = [
      editor.on('load', () => push('load')),
      editor.on('change', (e) => push(`change (${e.markdown.length} 字符)`)),
      editor.on('watch', () => push('watch')),
      editor.on('unwatch', () => push('unwatch')),
      editor.on('scroll', (e) => push(`scroll ratio=${e.ratio.toFixed(2)}`)),
      editor.on('fullscreenEnter', () => push('fullscreenEnter')),
      editor.on('fullscreenExit', () => push('fullscreenExit')),
    ]
    return () => {
      for (const off of offs) off()
      editor.destroy()
    }
  },
}

export const customToolbar: Example = {
  id: 'custom-toolbar',
  title: '自定义工具栏',
  description: 'spec 数组自定义按钮集（含 dropdown 语法）、handlers 自定义动作、titles 覆盖提示。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    let count = 0
    const editor = new EditorMD(host, {
      value: '# 自定义工具栏\n\n试试「点赞」按钮。\n',
      width: '100%',
      height: 380,
      toolbar: {
        spec: ['undo', 'redo', '|', 'bold', 'italic', '|', 'dropdown:Heading:h1,h2', '|', 'like', '||', 'watch', 'info'],
        handlers: {
          like: (ed) => {
            count += 1
            ed.insertValue(`: plus1 x${count} `.replace(/ /g, ''))
          },
        },
        titles: { like: '点赞' },
        icons: { like: 'fa-thumbs-o-up' },
      },
    })
    return () => editor.destroy()
  },
}

export const readonly: Example = {
  id: 'readonly',
  title: '只读模式',
  description: 'readOnly: true 时不渲染工具栏、编辑器不可输入（预览正常）。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, {
      value: '# 只读示例\n\n这段内容不可编辑。\n\n- 常用于展示场景\n',
      width: '100%',
      height: 300,
      editor: { readOnly: true },
      toolbar: false,
    })
    return () => editor.destroy()
  },
}

export const multi: Example = {
  id: 'multi',
  title: '多实例',
  description: '同一页面可创建任意多个编辑器实例，互不干扰。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editors: EditorMD[] = []
    for (const label of ['实例 A', '实例 B']) {
      const caption = document.createElement('p')
      caption.className = 'example-caption'
      caption.textContent = label
      host.append(caption)
      const mount = document.createElement('div')
      host.append(mount)
      editors.push(new EditorMD(mount, { value: `# ${label}\n\n独立内容。\n`, width: '100%', height: 260 }))
    }
    return () => {
      for (const ed of editors) ed.destroy()
    }
  },
}

export const i18n: Example = {
  id: 'i18n',
  title: '多语言',
  description: '内置 zh-cn / en / zh-tw，运行时切换（重建编辑器）；也可 registerLang 注册自定义语言包。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    let editor: EditorMD | null = null
    const mount = document.createElement('div')
    host.append(mount)
    const create = (lang: 'zh-cn' | 'en' | 'zh-tw'): void => {
      editor?.destroy()
      editor = new EditorMD(mount, { value: '# i18n\n\n悬停工具栏按钮查看提示语言。\n', width: '100%', height: 320, i18n: lang })
    }
    create('zh-cn')

    const buttons = document.createElement('p')
    for (const lang of ['zh-cn', 'en', 'zh-tw'] as const) {
      const b = document.createElement('button')
      b.textContent = lang
      b.onclick = () => create(lang)
      buttons.append(b)
    }
    container.append(buttons)
    return () => editor?.destroy()
  },
}

export const upload: Example = {
  id: 'upload',
  title: '图片上传（Mock）',
  description: '对话框上传 tab 走 {success,url,message} 协议（字段 editormd-image-file）。本例用 mock 演示协议，生产环境配置 upload.url 即可；也可直接粘贴/拖拽图片。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const editor = new EditorMD(host, {
      value: '# 上传示例\n\n工具栏 → 图片 → 本地上传，选择任意图片。\n',
      width: '100%',
      height: 420,
      upload: { image: true, url: 'https://your.example/upload' },
    })
    // Mock：拦截实例上传，模拟服务端返回 base64 地址（演示协议用）
    editor.uploadImage = async (file, onProgress) => {
      for (let p = 0; p <= 100; p += 25) {
        onProgress?.(p)
        await new Promise((r) => setTimeout(r, 80))
      }
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.readAsDataURL(file)
      })
      return { success: 1, url: dataUrl }
    }
    return () => editor.destroy()
  },
}

export const renderToExample: Example = {
  id: 'render-to',
  title: '静态渲染 renderTo',
  description: 'EditorMD.renderTo(元素, 选项) 把 markdown 渲染为只读 HTML——替代原版 editormd.markdownToHTML。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const target = document.createElement('div')
    host.append(target)
    EditorMD.renderTo(target, {
      value: '# 静态渲染\n\n不需要编辑器，只要渲染结果。\n\n- **加粗**\n- :smile:\n- $$E=mc^2$$\n\n```js\nconsole.log("hi")\n```\n',
      markdown: { tex: true },
      preview: { theme: 'default' },
    })
    return () => {}
  },
}
