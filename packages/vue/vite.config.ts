import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Vue 适配包：引擎 editor.md-next 与 vue 均外部化，不打包
export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'EditorMDVue',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: [/^editor\.md-next/, /^vue($|\/)/],
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
})
