import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Library build. All dependencies are bundled (no external) so that:
//  - the ESM output works standalone from npm,
//  - the UMD output works with require(),
//  - the IIFE output works from a plain <script> tag on a CDN (global `editormd`).
// `--mode cdn` 只产出 IIFE（pnpm build:cdn），产物为 dist/cdn/editormd-next.min.js。
export default defineConfig(({ mode }) => {
  const isCdn = mode === 'cdn'
  return {
    build: {
      lib: {
        entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        name: 'editormd',
        formats: isCdn ? ['iife'] : ['es', 'umd', 'iife'],
        fileName: (format) => {
          if (isCdn) return 'editormd-next.min.js'
          if (format === 'es') return 'es/index.js'
          if (format === 'umd') return 'umd/index.umd.cjs'
          return 'iife/index.iife.js'
        },
      },
      cssCodeSplit: false,
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          // language-data 的按语言动态 chunk 只出现在 es 输出中（umd/iife 内联动态导入），
          // 收进 es/chunks/ 保持 dist 根部整洁
          chunkFileNames: 'es/chunks/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? ''
            if (name.endsWith('.css')) return 'index.css'
            return 'assets/[name][extname]'
          },
        },
      },
      sourcemap: true,
      // cdn 产物独立输出为自包含目录（js + css），与常规构建互不干扰
      outDir: isCdn ? 'dist/cdn' : 'dist',
      emptyOutDir: true,
    },
  }
})
