# 方案调研：Agent Foundry 文档站框架

**日期**：2026-11-26  
**范围**：为 Plan 核对当前站点、需求所指定技术与外部转换前置；不是实现或运行验收记录。

## 当前仓库事实

- `apps/docs` 已使用 Nuxt、Nuxt Content、UnoCSS，配置为读取 `content/` 文档集合，并以 `app/pages/[...slug].vue` 按路径查询；不存在文档时抛出 404。
- 当前仅有 `default` 布局、一个动态内容页和现有文档侧栏/目录组件。根脚本提供 docs workspace 的 `lint`、`check-types`、`build`，没有根 `test` 脚本，docs package 也未定义测试脚本。
- 当前应用依赖未声明 Nuxt UI 或 Three.js；不能将其安装、集成或模型降级路径写成已在仓库验证。
- `packages/skills` 的正式文档说明产物尚未成为本轮已具备输入；规格将其约定为 `dist/docs`。实际发布和跨包接入须等待源产物。

## 决策记录

### R-001：扩展现有 Nuxt 文档应用，不新建站点或服务

**Decision**：在 `apps/docs` 现有 Nuxt Content 路由、工作区检查及内容目录上演进。

**Rationale**：规格明确针对现有站点及兼容地址；已有动态文档查询和 404 路径可复用。单应用足以交付布局、内容与浏览器交互。

**Alternatives considered**：新建独立站点或引入后端。没有需求收益，反而扩大部署与路由迁移范围，故不选。

### R-002：Nuxt UI 是规格要求，但兼容性须先实测

**Decision**：按需求采用 Nuxt UI，但把正式依赖加入、版本选定、模块配置，以及与现有 UnoCSS 属性化样式的共存作为开发前置核验，不预设集成无冲突。

**Rationale**：源码表明目前是 UnoCSS `presetWind3` 与 `presetAttributify({ prefix: 'un-' })`；Nuxt UI 不在 `apps/docs/package.json` 中。Nuxt UI 官方文档显示 NavigationMenu 支持水平/垂直列表及子项，Sidebar 在桌面可内联折叠、手机可切换为菜单，并提供响应式 open 状态；可作为四套布局所需交互的候选组件。文档存在不等同于当前项目安装或样式兼容证明。

**Alternatives considered**：只用现有原生/UnoCSS 组件。该方案可作为兼容失败后的回退讨论，但不满足已确认的 Nuxt UI 指定；不能未经确认静默替换。

**证据与限制**：已查阅 Nuxt UI 官方 NavigationMenu 与 Sidebar 组件文档的用法和 API。实现前仍需核实当前 Nuxt UI Nuxt 安装配置、所选组件 props/slots、主题配置和 UnoCSS 共存。Context7 查询在本轮因月度配额用尽未返回结果，因此不以其为依据。

### R-003：Three.js 限定在可降级的客户端模型岛

**Decision**：保留首页章节文字、静态替代和全局入口为独立可读内容；把每章 Three.js 模型限制在客户端运行的子组件/区域，模型加载或 WebGL 初始化失败仅影响本章模型。

**Rationale**：Nuxt 的 SSR/水合会在服务端及客户端执行通用渲染代码，官方文档建议用 ClientOnly 或 client component 隔离浏览器专属代码。此边界避免服务端访问浏览器 API，并匹配 FR-004 的局部降级要求。

**Alternatives considered**：整页仅客户端渲染。会让正文和导航依赖客户端脚本，违背失败时仍可阅读的要求，不选。

**证据与限制**：已查阅 Nuxt 官方 Hydration、Rendering、`.client.vue` 文档。Three.js 包版本、渲染器/模型输入及资源清理细节须在依赖加入前按其官方文档和实际模型素材核对；当前无项目内 Three.js 先例，故需要显式技术前置验证。

### R-004：技能导航由单一显式样例数据驱动

**Decision**：技能集合、技能路由与两处集合导航共用同一可替换数据源；样例目录作为正式技能说明接入前的独立验收数据。

**Rationale**：避免顶部子菜单和左侧目录各自维护造成目标分歧，满足 FR-005 与 SC-003。当前 Nuxt Content 集合已经能按路径查询页面，可用于正文路由；样例导航模型需额外明确路由层级及字段。

**Alternatives considered**：两套静态导航列表或直接扫描整个技能包源码。前者易产生不一致；后者违反仅从正式构建文档产物接入的边界，均不选。

### R-005：真实技能说明作为独立延后集成

**Decision**：样例阶段完成集合说明占位与将来 `dist/docs` 适配边界；真实导入、五类字段处理和缺文件行为等真实产物就绪后再验收。

**Rationale**：当前未发现已交付的正式 docs 产物；不能用模拟 fixtures 证明跨包发布契约已通过。站点样例浏览不依赖该输入，可以先完成。

**Alternatives considered**：复制紧急版技能说明作为真实内容。与规格禁止发布这些内容相冲突，不选。

### R-006：Figma 转换分为盘点、代表性批次、全量三个证据阶段

**Decision**：依次盘点原型可达视图与交互状态、比较批量 URL 导入、Figma MCP Code to canvas 及至少一种 AI 或脚本驱动的清单采集方式、执行代表性批次、通过后再执行全量批次。每个画板核对编辑性、正文与导航状态，记录经确认的字体/图片替代及动态效果处置。

**Rationale**：规格 SC-006/007 要求先验证代表性批次再运行全量，FR-011 明确要求比较批量导入和 AI/脚本清单采集，且 Figma 实测可以独立于站点实现。URL 批导不能据此推定可采集仅靠交互打开的状态；各候选覆盖能力须对照真实清单验证。

**Alternatives considered**：直接承诺脚本或 AI 自动生成整站 Figma 画板。缺少项目原型、目标文件权限和实测证据，不能判断可行或承诺结果。

**Evidence and blockers**：需求依据记录了公开 Figma Make「复制设计」、Figma MCP Code to canvas、html.to.design 批量 URL 导入的候选资料；源文档链接与限制见 [requirements/README.md](requirements/README.md#figma-转换调研依据)。AI/脚本驱动候选的实际覆盖将在取得原型并盘点清单后对比，不预先假定可行。本项目转换仍标记**缺前置**：需要实际原型入口或可运行源码，以及可编辑的目标 Design 文件/工作区。未在本轮启动转换。

## 官方文档核对索引

- Nuxt：Hydration、Rendering modes、Client Components。用于 SSR 与浏览器专属模型边界；未将客户端组件作为整个页面的渲染策略。
- Nuxt UI：官方 NavigationMenu、Sidebar 组件文档确认可用的导航数据、orientation/children 与桌面/移动侧栏模式；尚未在当前应用安装或验证 UnoCSS 共存。
- Nuxt Content：官方目录结构说明展示以 catch-all route、`queryCollection(...).path(...).first()` 和 `<ContentRenderer>` 渲染文档的模式；与当前仓库实现相符。
- Figma、批量导入候选资料：来源、限制及链接见本 Spec 的需求依据索引。

## 未决且不阻塞 Plan 的实施验证

- Nuxt UI 与 UnoCSS 同时启用的依赖版本和 CSS/组件冲突检查。
- Three.js 在目标浏览器中的模型素材、加载失败注入方式、WebGL 可用性和资源清理验证。
- 站点所选自动浏览器验收工具；现有 docs workspace 没有专属测试命令，实施任务可用仓库已有浏览器能力或明确记录手工验收，不为测试而预先引入框架。
- Figma 转换真实清单、批次执行和可复现方法，待输入与编辑权限到位后形成证据。
- `dist/docs` 消费端接入与五类契约用例，待技能包产物可用后形成真实联调证据。
