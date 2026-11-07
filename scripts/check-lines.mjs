#!/usr/bin/env node
// Hard limit: source files must stay under 600 lines to keep the codebase navigable.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const LIMIT = 600
const ROOT = new URL('../packages', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const EXTS = new Set(['.ts', '.tsx', '.css', '.mjs'])

const offenders = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name === 'dist-types') continue
      walk(full)
    } else if (EXTS.has(name.slice(name.lastIndexOf('.')))) {
      const lines = readFileSync(full, 'utf8').split('\n').length
      if (lines > LIMIT) offenders.push({ file: relative(ROOT, full), lines })
    }
  }
}

for (const pkg of readdirSync(ROOT)) {
  const src = join(ROOT, pkg, 'src')
  try {
    statSync(src)
    walk(src)
  } catch {
    /* package without src */
  }
}

if (offenders.length > 0) {
  console.error(`Files exceeding the ${LIMIT}-line limit:`)
  for (const { file, lines } of offenders.sort((a, b) => b.lines - a.lines)) {
    console.error(`  ${file} — ${lines} lines`)
  }
  process.exit(1)
}
console.log(`OK: all source files are within the ${LIMIT}-line limit.`)
