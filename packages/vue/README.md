# editor.md-next-vue

> [editor.md-next](https://www.npmjs.com/package/editor.md-next) 的 Vue 3 组件适配。

[![npm version](https://img.shields.io/npm/v/editor.md-next-vue)](https://www.npmjs.com/package/editor.md-next-vue)
[![npm downloads](https://img.shields.io/npm/dm/editor.md-next-vue)](https://www.npmjs.com/package/editor.md-next-vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mindoc-org/editor.md-next/blob/main/LICENSE)

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
  <EditorMD v-model="md" :options="{ height: 520, watch: true }" />
</template>
```

## API

- **Props**：`v-model`（markdown 内容）、`options`（编辑器配置，见 [editor.md-next 文档](https://github.com/mindoc-org/editor.md-next/blob/main/docs/configuration.md)）
- **Emits**：`update:modelValue` + 全部编辑器事件（`load` `change` `watch` `unwatch` `scroll` `fullscreenEnter` 等）
- **实例**：模板 ref 上暴露 `editor`（`EditorMD` 实例，可调用 `setMarkdown` / `gotoLine` / `toggleFullscreen` 等）

## 说明

- 组件卸载时自动 `destroy()`；外部 `modelValue` 变化经程序性替换同步，不会触发渲染回环
- 引擎 `editor.md-next` 为普通 dependency（不打包进适配包），样式需引入一次 `editor.md-next/css`

## License

[MIT](https://github.com/mindoc-org/editor.md-next/blob/main/LICENSE) © mindoc-org and editor.md-next contributors
