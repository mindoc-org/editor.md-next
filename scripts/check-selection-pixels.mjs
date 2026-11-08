#!/usr/bin/env node
/**
 * 选区高亮像素探针（真实浏览器 / CDP，无额外 npm 依赖）。
 *
 * 背景：CM6 drawSelection() 的选区层是 z-index:-2 后代，任何不透明行背景都会
 * 把它盖住，且此时 DOM 里 .cm-selectionBackground 依旧存在——只检查元素存在是
 * 假阳性。本脚本用真实 Chrome 派发原生输入事件、截图，再对选区矩形做网格
 * 采样，以「蓝色背景像素占比」判定真成功。见 ai-docs/bugfix-cm6-selection-invisible.md。
 *
 * 用法（先起构建版服务）：
 *   pnpm demo:build && pnpm demo:preview        # 另一个终端
 *   pnpm check:selection
 *   pnpm check:selection -- --url http://127.0.0.1:5173/#basics
 *   pnpm check:selection -- --threshold 0.6 --save-shots ./build/selection-shots
 *   CHROME_PATH=/path/to/chrome pnpm check:selection
 *
 * 依赖：Node >= 22（内置 fetch / WebSocket）+ 本机 Chrome 或 Edge。
 * 退出码：三场景全部 PASS 为 0，否则为 1。
 */
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const TARGET_URL = opt('url', 'http://127.0.0.1:4173/#basics')
const THRESHOLD = Number(opt('threshold', '0.5'))
const SHOT_DIR = opt('save-shots', '')
const HEADFUL = argv.includes('--headful')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ---------- 浏览器定位与启动 ---------- */
function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const candidates =
    process.platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
          'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge']
  for (const p of candidates) if (existsSync(p)) return p
  const lookup = process.platform === 'win32' ? 'where' : 'which'
  for (const name of ['google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    try {
      const found = execFileSync(lookup, [name], { encoding: 'utf8' }).split(/\r?\n/)[0].trim()
      if (found && existsSync(found)) return found
    } catch {
      /* 不在 PATH 中，继续 */
    }
  }
  return null
}

/** 取一个空闲端口，避免与用户已开的调试实例冲突。 */
function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.on('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port
      s.close(() => resolve(port))
    })
  })
}

/* ---------- CDP 客户端 ---------- */
let ws
let seq = 0
const pending = new Map()

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails))
  return r.result.value
}

async function connectPage(port) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      if (!res.ok) throw new Error('bad status')
      const list = await res.json()
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {
      /* CDP 尚未就绪 */
    }
    await sleep(150)
  }
  throw new Error('Chrome CDP 未就绪')
}

/* ---------- 页面内探针 ---------- */
const GEOM = `(() => {
  const line = document.querySelector('.cm-line');
  if (!line) return null;
  const w = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (n.textContent.length >= 4) {
      const r = document.createRange();
      r.setStart(n, 0); r.setEnd(n, 4);
      const b = r.getBoundingClientRect(), lb = line.getBoundingClientRect();
      if (b.width > 8 && b.height > 4) {
        return { x: b.left + b.width / 2, y: b.top + b.height / 2,
          left: b.left, right: b.right, lineY: lb.top + lb.height / 2 };
      }
    }
  }
  return null;
})()`

const STATE = `(() => {
  const m = document.querySelector('.cm-selectionBackground');
  const r = m && m.getBoundingClientRect();
  return { selText: getSelection().toString(),
    markRect: r ? [r.x, r.y, r.width, r.height] : null,
    activeLineBg: getComputedStyle(document.querySelector('.cm-activeLine') || document.body).backgroundColor };
})()`

/** 把截图送回页面 canvas 做网格采样，统计蓝色背景像素占比与主色。 */
async function sampleRect(pngBase64, rect) {
  return evaluate(`(async () => {
    const img = new Image();
    img.src = 'data:image/png;base64,${pngBase64}';
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const [x, y, w, h] = ${JSON.stringify(rect)};
    const counts = {};
    let blue = 0, total = 0;
    const nx = Math.max(1, Math.min(40, Math.floor(w / 2))), ny = 5;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const px = Math.round(x + (i + 0.5) * w / nx);
      const py = Math.round(y + (j + 0.5) * h / ny);
      const d = ctx.getImageData(px, py, 1, 1).data;
      const k = d[0] + ',' + d[1] + ',' + d[2];
      counts[k] = (counts[k] || 0) + 1;
      if (d[2] - d[0] > 40 && d[2] > 220) blue++;
      total++;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { blueRatio: Math.round(blue * 1000 / total) / 1000, dominant: top[0] };
  })()`)
}

async function mouse(type, x, y, extra = {}) {
  return send('Input.dispatchMouseEvent', {
    type, x, y, button: 'left', buttons: extra.buttons ?? 0,
    clickCount: extra.clickCount ?? 1, ...extra,
  })
}

async function keyWithShift(key, code, vk) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, modifiers: 8 })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers: 8 })
}

async function reset(g) {
  await mouse('mouseMoved', g.left + 2, g.lineY)
  await mouse('mousePressed', g.left + 2, g.lineY, { buttons: 1, clickCount: 1 })
  await mouse('mouseReleased', g.left + 2, g.lineY, { buttons: 0, clickCount: 1 })
  await sleep(150)
}

async function runScenario(name, g, action, needReset) {
  if (needReset) await reset(g)
  await action()
  // 等 CM6 图层完成绘制；只信像素，DOM 状态仅用于取采样矩形
  let state = await evaluate(STATE)
  for (let i = 0; i < 6 && !state.markRect; i++) {
    await sleep(200)
    state = await evaluate(STATE)
  }
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  if (SHOT_DIR) {
    mkdirSync(SHOT_DIR, { recursive: true })
    writeFileSync(join(SHOT_DIR, `${name}.png`), Buffer.from(shot.data, 'base64'))
  }
  const row = { name, selText: state.selText, activeLineBg: state.activeLineBg }
  if (state.markRect && state.markRect[2] > 4) {
    row.pixels = await sampleRect(shot.data, state.markRect)
    row.pass = row.pixels.blueRatio > THRESHOLD
  } else {
    row.pixels = null
    row.pass = false
    row.reason = '未生成选区绘制层'
  }
  return row
}

/* ---------- 主流程 ---------- */
async function main() {
  const chrome = findChrome()
  if (!chrome) throw new Error('未找到 Chrome/Edge，请设置 CHROME_PATH 指向浏览器可执行文件')

  const origin = new URL(TARGET_URL).origin
  try {
    const r = await fetch(origin, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
  } catch (e) {
    throw new Error(`无法访问 ${origin}（${e.message}）。请先运行 pnpm demo:build && pnpm demo:preview，或用 --url 指定已启动的服务。`)
  }

  const port = await freePort()
  const profile = mkdtempSync(join(tmpdir(), 'emd-sel-'))
  const child = spawn(chrome, [
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check',
    '--force-device-scale-factor=1', '--window-size=1440,900',
    ...(HEADFUL ? [] : ['--headless=new']),
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true })

  let failed = false
  try {
    const wsUrl = await connectPage(port)
    ws = new WebSocket(wsUrl)
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('CDP WebSocket 连接失败')) })
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id)
        pending.delete(m.id)
        m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
      }
    }
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url: TARGET_URL })
    for (let i = 0; i < 100; i++) {
      const ok = await evaluate(`(() => { const e = document.querySelector('.cm-content .cm-line'); return !!(e && e.textContent.length > 3); })()`)
      if (ok) break
      await sleep(150)
    }
    await evaluate(`document.fonts.ready.then(() => true)`)
    await sleep(700)
    // CDP 合成拖动会触发 Chromium 原生文本拖放并改写文档，需拦截（不影响选区）
    await evaluate(`(() => { document.addEventListener('dragstart', (e) => e.preventDefault(), true); return true; })()`)

    const g = await evaluate(GEOM)
    if (!g) throw new Error('页面未找到可编辑文本行，请确认 --url 指向编辑器示例')

    const rows = []
    rows.push(await runScenario('1-dblclick', g, async () => {
      await mouse('mouseMoved', g.x, g.y)
      await sleep(120)
      for (const c of [1, 2]) {
        await mouse('mousePressed', g.x, g.y, { buttons: 1, clickCount: c })
        await sleep(30)
        await mouse('mouseReleased', g.x, g.y, { buttons: 0, clickCount: c })
        await sleep(90)
      }
    }, false))

    rows.push(await runScenario('2-horizontal-drag', g, async () => {
      const x1 = g.left + 2, x2 = g.right + 90, y = g.lineY
      await mouse('mouseMoved', x1, y)
      await mouse('mousePressed', x1, y, { buttons: 1, clickCount: 1 })
      for (let i = 1; i <= 10; i++) {
        await mouse('mouseMoved', x1 + ((x2 - x1) * i) / 10, y, { button: 'left', buttons: 1 })
        await sleep(25)
      }
      await mouse('mouseReleased', x2, y, { buttons: 0, clickCount: 1 })
    }, true))

    rows.push(await runScenario('3-keyboard-crossline', g, async () => {
      for (let i = 0; i < 6; i++) await keyWithShift('ArrowRight', 'ArrowRight', 39)
      await keyWithShift('ArrowDown', 'ArrowDown', 40)
    }, true))

    console.log(`URL: ${TARGET_URL}`)
    console.log(`判定阈值: 蓝色背景像素占比 > ${THRESHOLD}\n`)
    for (const r of rows) {
      const ratio = r.pixels ? String(r.pixels.blueRatio).padEnd(6) : '-     '
      const extra = r.pixels ? `dominant=${r.pixels.dominant}` : r.reason
      console.log(`${r.pass ? '[PASS]' : '[FAIL]'} ${r.name.padEnd(24)} blueRatio=${ratio} sel=${JSON.stringify(r.selText).slice(0, 24).padEnd(26)} ${extra}`)
      if (!r.pass) failed = true
    }
    const passed = rows.filter((r) => r.pass).length
    console.log(`\n${passed}/${rows.length} passed`)
    if (passed !== rows.length) {
      console.error('选区高亮不可见或被遮挡。排查顺序见 ai-docs/bugfix-cm6-selection-invisible.md §5。')
      failed = true
    }
    if (SHOT_DIR) console.log(`截图目录: ${SHOT_DIR}`)
  } finally {
    try { ws && ws.close() } catch { /* 已关闭 */ }
    try { child.kill() } catch { /* 已退出 */ }
    // 部分环境有批量删除护栏；清理失败不影响判定结果
    try { rmSync(profile, { recursive: true, force: true }) } catch { /* 交由系统临时目录回收 */ }
  }
  if (failed) process.exitCode = 1
}

main().catch((e) => {
  console.error(`[check:selection] ${e.message}`)
  process.exitCode = 1
})
