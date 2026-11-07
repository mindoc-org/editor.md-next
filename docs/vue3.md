# Vue 3 适配（editor.md-next-vue）

包名：`editor.md-next-vue`，源码 `packages/vue`。

## 安装

```bash
pnpm add editor.md-next editor.md-next-vue vue
```

## 用法

```vue
<script setup lang="ts">
import { EditorMD } from 'editor.md-next-vue'
import 'editor.md-next/css'
import { ref } from 'vue'

const md = ref('# Hello\n\n开始编辑…')
</script>

<template>
  <EditorMD v-model="md" :options="{ height: 520, watch: true }" @watch="onWatch" />
</template>
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `v-model` | string | markdown 内容（双向绑定） |
| `options` | `EditorMDOptions` | 编辑器配置（`Omit<EditorUserOptions, 'value' \| 'on'>`，同 core 文档） |

## Emits

`update:modelValue` + 全部编辑器事件：`load` `change` `input` `resize` `watch` `unwatch` `previewEnter` `previewExit` `fullscreenEnter` `fullscreenExit` `scroll` `previewScroll`（载荷类型同 core 的 `EditorEvents`）。

## 获取实例

```vue
<script setup lang="ts">
import { ref } from 'vue'
const editorRef = ref()
// editorRef.value?.editor —— EditorMD 实例（setMarkdown/gotoLine/cm 等全部方法）
</script>
<template>
  <EditorMD ref="editorRef" v-model="md" />
</template>
```

## 实现说明

- 组件用渲染函数实现（无 SFC 编译依赖），`peerDependencies: vue >= 3.2`
- 引擎 `editor.md-next` 为普通 dependency（外部化不打包）
- 外部 `modelValue` 变化通过程序性替换同步（不触发回环）；组件卸载时自动 `destroy()`
