import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Library build. All dependencies are bundled (no external) so that:
//  - the ESM output works standalone from npm,
//  - the UMD output works with require(),
//  - the IIFE output works from a plain <script> tag on a CDN (global `editormd`).
export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'editormd',
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => {
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
    outDir: 'dist',
    emptyOutDir: true,
  },
})
