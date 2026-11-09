import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Library build（es + cjs）。
//
// 与 core 相反：拓展包**绝不能内联 peer 依赖**（ADR-007/008）——yjs 与 @codemirror/* 必须由
// 宿主 bundler 解析为与 editor.md-next（core 0.2.0 起 peer 化）相同的唯一实例，
// 否则 CM6 扩展跨 @codemirror/state 副本会抛 "two copies of @codemirror/state"。
// y-codemirror.next / y-protocols / lib0 是普通 dependencies，打进产物（无实例身份要求）。
// 不提供 IIFE/CDN 产物：CDN 场景 core 内联了自己的 CM6 副本，拓展包必然双实例（见 docs/collab.md FAQ）。
export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'editormdCollab',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    cssCodeSplit: false,
    rollupOptions: {
      // editor.md-next 同为 peer：undoRedoFacet 必须与宿主解析到同一模块实例（facet 身份相等）
      external: [/^yjs$/, /^@codemirror\//, /^editor\.md-next$/],
    },
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
})
