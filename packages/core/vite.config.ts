import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Library build. All dependencies are bundled (no external) so that:
//  - the ESM output works standalone from npm,
//  - the UMD output works with require(),
//  - the IIFE output works from a plain <script> tag on a CDN (global `editormd`).
// `--mode cdn` 只产出 IIFE（pnpm build:cdn），产物为 dist/cdn/editormd-next.min.js。
//
// ADR-007（0.2.0）：es/umd 产物外置 @codemirror/* + @lezer/*（peerDependencies）——
// CM6 扩展要求全页共享同一份 @codemirror/state 实例，全打包会让 editor.extensions
// 与外部拓展包（editor.md-next-collab 等）注入时报 "two copies of @codemirror/state"。
// IIFE/CDN 产物保持全打包自包含（<script> 用法不变）。markdown-it/hljs/DOMPurify 继续内联。
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
        // es/umd 外置 CM6 系依赖；cdn 模式（iife）无 external、全打包
        external: isCdn ? undefined : [/^@codemirror\//, /^@lezer\//],
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
      // npm 发布不需要 sourcemap（省 ~20MB）；调试走源码
      sourcemap: false,
      // cdn 产物独立输出为自包含目录（js + css），与常规构建互不干扰
      outDir: isCdn ? 'dist/cdn' : 'dist',
      emptyOutDir: true,
    },
  }
})
