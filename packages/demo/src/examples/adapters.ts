import { createApp, defineComponent, h, ref } from 'vue'
import type { App } from 'vue'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { EditorMD as VueEditor } from 'editor.md-next-vue'
import { EditorMD as ReactEditor } from 'editor.md-next-react'
import type { Root } from 'react-dom/client'
import { exampleShell } from './types'
import type { Example } from './types'

const SAMPLE = '# Vue 3 适配\n\nv-model 双向绑定，右侧预览实时更新。\n\n- 在左侧输入\n- 观察下方字符数\n'
const SAMPLE_REACT = '# React 适配\n\nvalue 受控 + onChange 回调。\n\n- 在左侧输入\n- 观察下方字符数\n'

export const vue3Example: Example = {
  id: 'vue3',
  title: 'Vue 3 组件（editor.md-next-vue）',
  description: 'v-model 绑定 markdown，事件经 emits 转发，模板 ref 拿 { editor } 实例。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const mount = document.createElement('div')
    host.append(mount)
    const counter = document.createElement('p')
    counter.className = 'example-caption'
    host.append(counter)

    const md = ref(SAMPLE)
    const DemoApp = defineComponent({
      setup() {
        return () =>
          h('div', [
            h(VueEditor, {
              modelValue: md.value,
              'onUpdate:modelValue': (v: string) => {
                md.value = v
                counter.textContent = `字符数：${v.length}`
              },
              options: { height: 420 },
            }),
          ])
      },
    })
    const app: App = createApp(DemoApp)
    app.mount(mount)
    counter.textContent = `字符数：${SAMPLE.length}`

    return () => app.unmount()
  },
}

export const reactExample: Example = {
  id: 'react',
  title: 'React 组件（editor.md-next-react）',
  description: 'value 受控 + onChange 回调，onEvent 转发全部编辑器事件，ref 拿 { editor } 实例。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)
    const mount = document.createElement('div')
    host.append(mount)
    const counter = document.createElement('p')
    counter.className = 'example-caption'
    counter.textContent = `字符数：${SAMPLE_REACT.length}`
    host.append(counter)

    const root: Root = createRoot(mount)
    root.render(
      createElement(ReactEditor, {
        defaultValue: SAMPLE_REACT,
        options: { height: 420 },
        onChange: (markdown: string) => {
          counter.textContent = `字符数：${markdown.length}`
        },
      }),
    )

    return () => root.unmount()
  },
}
