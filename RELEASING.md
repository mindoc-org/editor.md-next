# 发布指南（npm / GitHub）

> 本文档记录 editor.md-next 四包（`editor.md-next`、`editor.md-next-collab`、`editor.md-next-vue`、`editor.md-next-react`）的 npm 登录与发布流程。命令均在仓库根目录执行。

## 一、npm 登录（首次）

### 1. 账号

在 [npmjs.com](https://www.npmjs.com/signup) 注册账号，并开启 2FA（推荐，发布时需输一次性验证码）。

### 2. CLI 登录（关键：必须指定官方源）

本机若配置了国内镜像（如 `registry.npmmirror.com`），**登录必须显式指向官方源**，否则凭据存到镜像站上无效：

```bash
npm login --registry=https://registry.npmjs.org
# 浏览器完成授权后验证：
npm whoami --registry=https://registry.npmjs.org   # 输出用户名即成功
```

说明：
- 凭据写入 `~/.npmrc`（按 registry 主机区分），与镜像源配置互不干扰
- 发布无需手动改全局 registry——三个发布包的 `package.json` 已配置 `publishConfig.registry = https://registry.npmjs.org/`，`pnpm publish` 会自动走官方源

## 二、发布前检查

```bash
# 1. 工作区干净（pnpm publish 默认拒绝脏工作区）
git status

# 2. 登录态
npm whoami --registry=https://registry.npmjs.org

# 3. 包名占用（404 = 可用，仅首次发布前需要）
curl -s -o /dev/null -w "%{http_code}" https://registry.npmjs.org/<包名>

# 4. 打包内容预演（确认 dist / types / LICENSE 都在，体积正常）
pnpm -C packages/core pack --dry-run
```

> 防呆机制：四包已配置 `prepublishOnly: pnpm -w build`，publish 时会自动全量构建——**没有 dist 就发不出去**。但首次发布前仍建议手动 `pnpm build` 并检查。

## 三、版本号

- 手动修改各包 `package.json` 的 `version`（core → vue/react 依次）
- **npm 版本不可覆盖**：同名同版本一经发布无法重发；发错了只能升版本重发 + `npm deprecate` 标记旧版
- 适配包依赖写法是 `"editor.md-next": "workspace:^"`，`pnpm publish` 会自动替换成真实版本号（如 `^0.1.0`）——**因此必须用 pnpm 发布，不能用 npm publish**

## 四、发布

### 方式一：一键发布全部（推荐）

```bash
pnpm publish:all     # = pnpm -r build && pnpm -r publish（按依赖序 core → collab → vue/react）
```

### 方式二：单包发布

```bash
pnpm -C packages/core publish
pnpm -C packages/collab publish
pnpm -C packages/vue publish
pnpm -C packages/react publish
```

### 2FA 账号

发布命令会提示输入 OTP；非交互场景可显式传入：

```bash
pnpm -C packages/core publish --otp=123456
```

### 常见错误

| 报错 | 原因与处理 |
| --- | --- |
| `ENEEDAUTH` / `need auth` | CLI 未登录或登录到了镜像站 → 用第一步命令重新登录 |
| `ERR_PNPM_BAD_PM_VERSION`（CI） | workflow 与 `packageManager` 字段冲突 → workflow 不指定 version（已修复） |
| `cannot publish over previously published version` | 同版本已存在 → 升版本号 |
| 发布的包缺 dist | 正常情况下 prepublishOnly 护栏会拦截；历史问题见下文「补救」 |

## 五、发布后验证

```bash
npm view editor.md-next version dist.unpackedSize
npm view editor.md-next-vue dist.unpackedSize   # 应为 ~100KB 级别（含 dist）
```

CDN（发布几分钟后生效）：

```
https://cdn.jsdelivr.net/npm/editor.md-next/dist/cdn/editormd-next.min.js
https://cdn.jsdelivr.net/npm/editor.md-next/dist/index.css
```

## 六、Tag 与 GitHub Release

```bash
git tag v0.1.1 && git push origin v0.1.1
```

在 GitHub Releases 页面基于 tag 创建 Release（changelog 取自 `CHANGELOG.md` 对应版本段落）。

## 七、示例站部署

```bash
pnpm deploy:pages    # 构建 demo 并推送到 gh-pages 分支
```

仓库 Settings → Pages 选择 `gh-pages` 分支后即可通过 `https://mindoc-org.github.io/editor.md-next/` 访问。

## 八、坏版本补救

同版本不可覆盖。若已发布损坏版本：

```bash
# 升版本重发（见第三节），然后弃用坏版本：
npm deprecate <包名>@<坏版本> "broken: ..., use >=<修复版本>"
```

> `npm unpublish` 仅限发布后 72 小时内且无依赖者时可用；弃用标记更稳妥。
