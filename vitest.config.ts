import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // jsdom 与 DOMPurify 兼容（happy-dom 会剥壳 h1 等标签且不清除 script）
    environment: 'jsdom',
    include: ['packages/*/src/**/*.test.ts'],
  },
})
