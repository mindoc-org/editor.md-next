import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// React 适配包：引擎 editor.md-next 与 react 均外部化，不打包
export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'EditorMDReact',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: [/^editor\.md-next/, /^react($|\/)/, /^react-dom($|\/)/],
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
})
