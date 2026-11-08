import './style.css'
import 'editor.md-next/css'
import { EditorMD } from 'editor.md-next'
import { EXAMPLES } from './examples'

// 便于控制台调试
declare global {
  interface Window {
    EditorMD: typeof EditorMD
  }
}
window.EditorMD = EditorMD

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="demo-layout">
    <aside class="demo-sidebar">
      <h1 class="demo-logo">editor.md-next</h1>
      <p class="demo-sub">TypeScript + CodeMirror 6</p>
      <nav class="demo-nav"></nav>
      <a class="demo-home" href="https://github.com/mindoc-org/editor.md-next" target="_blank" rel="noopener noreferrer">GitHub →</a>
    </aside>
    <main class="demo-content"></main>
  </div>
`

const nav = app.querySelector<HTMLElement>('.demo-nav')!
const content = app.querySelector<HTMLElement>('.demo-content')!

for (const example of EXAMPLES) {
  const link = document.createElement('a')
  link.href = `#${example.id}`
  link.textContent = example.title
  link.dataset['id'] = example.id
  nav.append(link)
}

let cleanup: (() => void) | null = null

function route(): void {
  const id = location.hash.slice(1) || EXAMPLES[0]!.id
  const example = EXAMPLES.find((e) => e.id === id) ?? EXAMPLES[0]!

  cleanup?.()
  cleanup = null
  content.textContent = ''
  cleanup = example.render(content)

  for (const link of nav.querySelectorAll('a')) {
    link.classList.toggle('active', link.dataset['id'] === example.id)
  }
  window.scrollTo({ top: 0 })
}

window.addEventListener('hashchange', route)
route()
