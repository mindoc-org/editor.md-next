/**
 * editor.md-next 的 Vue 3 适配组件。
 *
 * 用法：
 * ```vue
 * <script setup lang="ts">
 * import { EditorMD } from 'editor.md-next-vue'
 * import { ref } from 'vue'
 * const md = ref('# Hello')
 * </script>
 * <template>
 *   <EditorMD v-model="md" :options="{ height: 520 }" @watch="..." />
 * </template>
 * ```
 *
 * 样式需自行引入一次：`import 'editor.md-next/css'`
 */
import { EditorMD as EditorMDCore } from 'editor.md-next'
import type { EditorEvents } from 'editor.md-next'
import type { EditorUserOptions } from 'editor.md-next'
import { defineComponent, h, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import type { PropType, SetupContext, ShallowRef } from 'vue'

export type EditorMDOptions = Omit<EditorUserOptions, 'value' | 'on'>

/** 与 core 的 EditorEvents 一一对应的事件名 */
export const EDITOR_EVENTS = [
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

export type EditorMDBeforeUnmount = () => void

export const EditorMD = defineComponent({
  name: 'EditorMD',

  props: {
    /** v-model：markdown 内容 */
    modelValue: {
      type: String,
      default: '',
    },
    /** 编辑器配置（不含 value/on，见 editor.md-next 文档） */
    options: {
      type: Object as PropType<EditorMDOptions>,
      default: () => ({}),
    },
  },

  emits: [...EDITOR_EVENTS, 'update:modelValue'] as unknown as string[],

  setup(props, ctx: SetupContext) {
    const host = shallowRef<HTMLDivElement | null>(null)
    const editor: ShallowRef<EditorMDCore | null> = shallowRef(null)
    let programmatic = false

    onMounted(() => {
      if (!host.value) return
      const handlers: Record<string, (payload: never) => void> = {}
      for (const name of EDITOR_EVENTS) {
        handlers[name] = (payload) => {
          ctx.emit(name as string, payload)
        }
      }
      // change 额外回写 v-model
      const userChange = handlers['change']
      handlers['change'] = (payload) => {
        const p = payload as EditorEvents['change']
        if (!programmatic && p) ctx.emit('update:modelValue', p.markdown)
        userChange?.(payload)
      }
      const on = handlers as { [K in keyof EditorEvents]?: (payload: EditorEvents[K]) => void }

      editor.value = new EditorMDCore(host.value, {
        ...props.options,
        value: props.modelValue,
        on,
      })
    })

    // 受控：外部 modelValue 变化 → setMarkdown（程序性，避免回环）
    watch(
      () => props.modelValue,
      (value) => {
        const ed = editor.value
        if (ed && value !== ed.getMarkdown()) {
          programmatic = true
          ed.setMarkdown(value)
          programmatic = false
        }
      },
    )

    onBeforeUnmount(() => {
      editor.value?.destroy()
      editor.value = null
    })

    return () =>
      h('div', {
        ref: host,
        class: 'emd-vue-editor',
        style: { width: '100%' },
      })
  },
})

export default EditorMD
