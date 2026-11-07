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
        if (format === 'es') return 'index.js'
        if (format === 'umd') return 'index.umd.cjs'
        return 'index.iife.js'
      },
    },
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
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
