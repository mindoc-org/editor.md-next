import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // 与 packages/collab/tsconfig.json 的 paths 对齐：测试直连 core 源码，
    // 避免依赖 core 的 dist 产物（否则改了 core API 后必须先全量 build 才能跑测试）。
    alias: {
      'editor.md-next': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    // jsdom 与 DOMPurify 兼容（happy-dom 会剥壳 h1 等标签且不清除 script）
    environment: 'jsdom',
    include: ['packages/*/src/**/*.test.ts'],
  },
})
