# TODO

> 阶段任务清单（P0~P11）。功能明细见 `ai-docs/feature-parity.md`，实现一项勾一项。

## P0 工作区改造 ✅

- [x] pnpm workspace + 三包骨架（utils / core / demo）
- [x] tsconfig.base（strict + erasableSyntaxOnly）、prettier、editorconfig、gitignore
- [x] 冒烟：rolldown lib 三格式（es/umd/iife）出包
- [x] 冒烟：TS7 声明产出（需显式 rootDir，已配置）
- [x] README / AGENTS / TODO / ai-docs 骨架，scripts/check-lines.mjs
- [x] 首次提交

## P1 utils 包 ✅

- [x] dom.ts（元素查找/创建/class 操作/事件绑定）
- [x] event-emitter.ts（类型化 EventEmitter）
- [x] async.ts（debounce/throttle）
- [x] datetime.ts（dateFormat）
- [x] string.ts（trim/ucfirst/ucwords/escapeHtml/randomId/slugify）
- [x] loader.ts（CDN script/css 懒加载，带缓存与去重）
- [x] uploader.ts（XHR FormData 上传）
- [x] vitest 单测（31 例全绿）

## P2 core 骨架 MVP（demo 可跑）✅

- [x] types（EditorOptions 分组结构 + Events 映射）
- [x] defaults（深合并基准配置）
- [x] i18n（zh-cn / en / zh-tw + 运行时切换）
- [x] CM6 集成（markdown 语言 + GFM、行号、换行、占位符）
- [x] DOM 挂载（container/toolbar 区/cm/preview 分屏）
- [x] 渲染管线（change → debounce → markdown-it → 预览）
- [x] sync-scroll（百分比映射；浏览器实测双向同步通过）
- [x] get/setMarkdown、事件总线、浅/深基础主题 CSS、destroy()

## P3 渲染扩展 ✅

- [x] [TOC] / [TOCM] + 标题锚点 slug
- [x] taskList（可勾选样式）
- [x] emoji 四类（github / twemoji / fa / editormd-logo）+ 时间格式豁免
- [x] tex（$$..$$ 行内/独立行 + ```math 围栏 → KaTeX 懒加载渲染）
- [x] ```mermaid / ```mindmap 懒加载渲染
- [x] callouts（[info]/[warning]/[success]/[danger] 引用块）
- [x] atLink（@user）/ emailLink / 外链 target=_blank / javascript: 拦截
- [x] pageBreak（[========]）
- [x] 图片 #size=WxH / #align 语法
- [x] DOMPurify 消毒 + htmlDecode 开关
- [x] hljs 代码高亮 + 行号 + 预览代码折叠

## P4 工具栏与快捷键 ✅

- [x] full / simple / mini 三模式 + dropdown 语法（浏览器实测 38 按钮 + 标题下拉）
- [x] 全部内置按钮 handlers（标题/粗斜/列表/引用/大小写/时间/清理/搜索等；对话框类走 openDialog 占位）
- [x] 自定义 icons / handlers / titles / customIcons
- [x] autoFixed（sticky 吸顶实现）
- [x] 30+ 快捷键 + disabledKeys 屏蔽 + F9/F10/F11 窗口级监听（实测 Ctrl-B/Ctrl-2）
- [x] CM6 搜索面板接入（i18n 短语汉化实测通过）

## P5 对话框 ✅

- [x] dialog 框架（拖拽/遮罩/zIndex 递增/lockScreen/loading）
- [x] link / reference-link 对话框
- [x] image 对话框（URL / 上传 双 tab）
- [x] code-block（语言选择 + 内嵌 CM6 + 主题选择）
- [x] preformatted-text（内嵌 CM6）
- [x] table（行列 + 对齐）
- [x] emoji 网格（四 tab 多选）
- [x] html-entities 网格
- [x] goto-line / help（内置 help.md）/ info（关于）

## P6 图片上传（对话框上传已并入 P5；粘贴/拖拽完成）✅

- [x] XHR/FormData 上传（字段 editormd-image-file，响应 {success,url,message}）
- [x] formats 白名单校验 + 错误提示
- [x] 粘贴 / 拖拽图片插入（增强，原版无）

## P7 模式与杂项 ✅

- [x] watch / unwatch / preview 模式切换（全屏预览 + 关闭按钮）
- [x] fullscreen（类原生全屏语义，ESC 退出）
- [x] gotoLine（数字/first/last + 预览滚动同步）
- [x] autoHeight、readOnly、placeholder、autoFocus
- [x] saveHTML（隐藏 html textarea）、appendMarkdown
- [x] 多实例与动态创建
- [x] EditorMD.renderTo() 静态渲染（替代 markdownToHTML）

## P8 构建产物 ✅

- [x] exports/files/sideEffects 定稿
- [x] es + umd + iife + index.css + assets + types/*.d.ts 全量出包
- [x] @font-face 精简（woff2/woff，裁掉 eot/svg/ttf）
- [x] demo 内分别用 ESM import 与 CDN `<script>` 方式各冒烟一次

## P9 demo 示例站（14 例）✅

- [x] 侧边导航 + 示例框架
- [x] ~18 个示例（基础/主题/emoji/tex/mermaid/mindmap/TOC/taskList/callout/上传 mock/对话框/事件/自定义工具栏/只读/renderTo/多实例/i18n/pageBreak）
- [x] gh-pages 部署脚本与说明

## P10 文档 ✅

- [x] docs/：getting-started / configuration / api / markdown-extensions / themes / image-upload / i18n / plugins / migration-from-editormd / faq
- [x] README 定稿、AGENTS 核对、feature-parity 收尾

## P11 收尾 ✅

- [x] vitest 补充（engine 快照 / 默认值 / 事件冒烟）
- [x] 全量 typecheck + build 绿
- [x] check:lines 通过
- [x] CHANGELOG.md

## 远期（不阻塞发布）

- [x] drawio 代码块渲染（原 fork 有，暂缓）
- [x] 跨域 iframe 上传回调模式
- [x] 可选接入 @uiw/codemirror-themes 丰富 editor 主题
- [x] vue/react 组件包装

## 适配包（2026-11-08 追加）✅

- [x] packages/vue：editor.md-next-vue（v-model + 事件转发 + 实例暴露，es/cjs + d.ts）
- [x] packages/react：editor.md-next-react（受控/非受控 + onEvent + ref 句柄，StrictMode 安全）
- [x] demo 增加 Vue3 / React 示例（v-model/onChange 联动实测通过）
- [x] docs/vue3.md + docs/react.md
- [x] 仓库引用统一 mindoc-org/editor.md-next（本地完成，未推送）
- [ ] 待真实发布：npm publish（core/vue/react）、git push、gh-pages 部署
