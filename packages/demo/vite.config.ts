import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  // 开发态直连 core 源码：HMR 即时生效，且源码内的 css import 会被正常注入。
  // 构建产物的加载验证（ESM/CDN 两种方式）在 P8 用专用冒烟页完成。
  resolve: {
    alias: {
      'editor.md-next': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
  // GitHub Pages 部署使用相对路径
  base: './',
})
