# 修改后的标准流程（WORKFLOW）

> 每次代码/文档修改后，按本文档逐步执行。npm 登录与发布的细节见 [`RELEASING.md`](RELEASING.md)，本文件只讲"做什么、按什么顺序"。

## 0. 改动类型 → 需要做的环节速查

| 改动内容 | 本地验证 | npm 更新 | git push | Pages 更新 |
| --- | --- | --- | --- | --- |
| core 源码（编辑器功能/修复） | ✅ 四件套 + preview 走查 | ✅ 发版时 | ✅ | demo 受影响时 ✅ |
| collab 拓展包（协同/通道/relay） | ✅ 四件套 + `#collab` 示例走查 + `check:selection` | ✅ 发版时 | ✅ | 协同示例有变化时 ✅ |
| vue / react 适配包 | ✅ 四件套 + demo 对应示例 | ✅ 发版时 | ✅ | ✅（示例要能看到效果） |
| demo / 示例 | ✅ demo:build + preview | ❌ | ✅ | ✅ |
| docs / ai-docs / README | ❌（可选 build） | ❌ | ✅ | ❌ |
| 依赖变更（package.json） | ✅ 全套 | 发版时 | ✅ | 视情况 |
| CI / workflow | 本地无法完全验证，push 后看 Actions | ❌ | ✅ | ❌ |

## 1. 本地验证（每次必做）

```bash
pnpm typecheck      # 6 包类型检查
pnpm test           # vitest（60+ 例）
pnpm build          # 全量构建（utils → core → collab → vue/react → demo）
pnpm check:lines    # 单文件 ≤600 行 + 防游离 .d.ts
```

四项全绿才算通过。**构建版必须真实走查**——dev 模式（alias 直连源码）与构建产物行为有差异（历史教训：CSS 不注入、DOMPurify 剥属性都只在构建版暴露）：

```bash
pnpm demo:build && pnpm demo:preview   # 常驻服务，另开终端
pnpm check:selection                   # 改过选区/行背景时必跑：真实 Chrome 像素采样
# 浏览器打开 http://localhost:4173/，走查与本次改动相关的示例
```

### 走查要点（探针必须检测"真成功"）

- **图表示例（#diagram）**：确认 `.emd-mermaid` 里**不含 "Syntax error" 文本**（mermaid 错误炸弹也是 svg，"有 svg"≠成功）；mindmap 出 svg。
- **emoji 示例（#emoji）**：图片 `naturalWidth > 0`（alt 文字显示=加载失败）；`12:30:45` 原样保留；logo 字形可见。
- **公式示例（#tex）**：`.katex` 元素存在。
- **编辑器选区**：改过选区/行背景后必跑 `pnpm check:selection`（需先 `pnpm demo:preview`）。脚本用真实 Chrome 派发双击 / 水平拖动 / 跨行键盘选区，截图后统计选区矩形内蓝色背景像素占比（默认 > 0.5 才算 PASS），三场景全绿才算通过。**不可用 DOM 元素存在性判定**——选区层元素存在但可能被不透明背景盖住（假阳性教训见 `ai-docs/bugfix-cm6-selection-invisible.md` §4）。可选参数：`--url`（默认 `http://127.0.0.1:4173/#basics`）、`--threshold`、`--save-shots <dir>`；`CHROME_PATH` 指定浏览器；脚本自启自停独立 Chrome 实例（Node ≥22 内置 CDP 客户端，无额外依赖）。
- **协同示例（#collab）**：双开标签页或用页面内左右两个实例走查——左侧输入右侧实时出现；远程光标带名字标签；`Ctrl-Z` 与**工具栏撤销按钮**都只回退本端编辑（点按钮不要撤到对端内容）；成员列表随关闭标签页更新。改过选区/光标后需补跑 `pnpm check:selection -- --url http://127.0.0.1:4173/#collab`。
- 上传示例用 mock，不需真实服务端。

## 2. 提交

```bash
git add -A
git commit -m "<类型>: <做了什么>"
```

提交信息约定：功能/修复用 `fix:` / `feat:` / `docs:` / `ci:` 前缀；阶段性的用 `P<N>:`。中文描述。

## 3. 推送

```bash
git push
```

push 后到 GitHub **Actions 页确认 CI 全绿**（typecheck → test → build → check:lines）。CI 红了优先修，不要带病合并。

## 4. 更新 GitHub Pages（示例站）

只要 demo 或 core 的渲染/样式有变化就需要：

```bash
pnpm deploy:pages
```

部署后访问 https://mindoc-org.github.io/editor.md-next/ 验证；**浏览器缓存会导致看到旧资源，务必 Ctrl+F5 强刷**。首次配置或异常时检查仓库 Settings → Pages 是否指向 `gh-pages` 分支。

## 5. 更新 npm 包

### 5.1 何时需要

core / collab / vue / react 任一源码有**用户可感知**的改动（功能、修复、产物变化）时发版。纯文档/demo 改动不需要。

### 5.2 版本号

手动改对应包 `package.json` 的 `version`（遵循 semver：修复 +1 patch、新功能 +1 minor、破坏性 +1 major）。**已发布的版本号不可覆盖**。四包版本不必强求一致，但同一次功能性发版建议一起 bump 并在 CHANGELOG.md 记录（collab 依赖 `editor.md-next` 的 peer 版本区间，跨 minor 发版必须同步）。

### 5.3 发布

```bash
pnpm publish:all            # 一键：全量构建 + 按依赖序发布（core → collab → vue/react）
# 或单包：
pnpm -C packages/core publish
pnpm -C packages/collab publish
```

- 内置护栏：`prepublishOnly` 会自动重新构建，没 dist 发不出去
- 2FA 账号按提示输 OTP，或加 `--otp=123456`
- 登录/认证问题、deprecate 坏版本等细节见 [`RELEASING.md`](RELEASING.md)

### 5.4 发布后验证

```bash
npm view editor.md-next version dist.unpackedSize
```

CDN 几分钟内生效：`https://cdn.jsdelivr.net/npm/editor.md-next/dist/cdn/editormd-next.min.js`

## 6. 版本标签与 Release

npm 发版后：

```bash
git tag v0.1.1 && git push origin v0.1.1
```

在 GitHub Releases 基于 tag 创建 Release，说明取自 `CHANGELOG.md` 对应段落。

## 7. 已知坑（务必记住）

1. **新增依赖后必须重启 vite dev server**——老进程不认识新包，会报 Failed to resolve import。
2. **dev 与构建版行为可能不同**——dev 通过 alias 直连源码（CSS 会注入），构建版走 dist 产物（CSS 需显式引入）。验证一律以 `demo:preview` 的构建版为准。
3. **DOMPurify 会剥掉值中含 `-->` 的属性**（SAFE_FOR_XML）——往 data 属性里放用户源文本必须走 base64（`data-attr.ts`），详见 `ai-docs/architecture.md` ADR-005/006。
4. **mermaid.run 不可重入**——并发调用会间歇性报 Syntax error，渲染走 `cdn-lazy.ts` 里的串行队列，不要绕过。
5. 测试环境用 **jsdom**（happy-dom 与 DOMPurify 不兼容）；探针检测"真成功"见第 1 节走查要点。
