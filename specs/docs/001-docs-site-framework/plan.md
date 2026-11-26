# Implementation Plan: Agent Foundry 文档站框架

**Branch**: `feature/init` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/docs/001-docs-site-framework/spec.md`

## Summary

在现有 `apps/docs` Nuxt Content 文档站上扩展五模块、四布局的可直达浏览框架，以一份显式样例数据驱动技能集合导航和页面。首页在保留 SSR 可读正文与全局入口的前提下，以客户端 Three.js 展示两个独立模型并提供静态降级。先交付不依赖外部权限的站点框架；技能真实文档接入等待 `packages/skills` 提供 `dist/docs`，Figma 转换以独立调研和实测轨道推进，缺少原型或目标文件权限时不阻塞站点。

## Technical Context

**Language/Version**: TypeScript / Vue 3，沿用仓库 Node.js `>=22.20.0`、pnpm 12 与 ESM。

**Primary Dependencies**: 复用 `apps/docs` 已有 Nuxt、Nuxt Content、UnoCSS；按规格要求规划引入 Nuxt UI 与 Three.js。二者当前未列入文档应用依赖，版本、与现有 UnoCSS 预设的集成及客户端渲染边界须在实现前核实。

**Storage**: 无业务数据库；页面与样例导航为仓库文件。技能说明未来由独立 `packages/skills` 构建产物 `dist/docs` 提供，不复制发布内容到文档应用。

**Testing**: 使用 `apps/docs` 的 `pnpm --filter @foundry/docs run lint`、`check-types`、`build`；仓库没有根测试脚本，文档应用当前也无专属测试脚本。补充桌面/手机浏览器验收，逐项验证导航、直接访问与刷新、404、目录切换及 3D 失败降级。测试自动化方式在任务拆分时依据仓库已有能力确定，不预设新增测试框架。

**Target Platform**: Nuxt 文档站支持的现代桌面与手机浏览器；Node 构建环境符合仓库引擎要求。

**Project Type**: 现有 monorepo 中的 Nuxt Web 应用，源码位于 `apps/docs/`。

**Performance Goals**: 沿用规格 SC-001 至 SC-007；首屏文本、品牌与导航不依赖 3D 成功加载，模型失败不阻断阅读和链接操作。

**Constraints**: SSR 路由和现有文档地址须保留；未知地址返回 404。Three.js/WebGL 仅在客户端运行，静态回退保留正文。技能 `dist/docs` 和真实 Figma 输入/编辑权限是延后轨道的外部前置。Figma 小批未通过前不得宣称或依赖全量转换成功。

**Scale/Scope**: 5 个模块、4 套布局、样例技能至少 2 个集合且每集合至少 1 项；Figma 清单须覆盖实际原型可达视图与适用导航展开态，实际总量待原型盘点。

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **职责与产物**：本 Plan 记录方案、顺序与依赖；详细闭环集中在同目录 [mvu.md](mvu.md)，实现任务由后续 `tasks.md` 唯一跟踪。通过。
- **闭环与技术前置**：Nuxt UI、Three.js 属于文档应用当前未使用的依赖；先核对兼容配置和客户端失败路径，再推进依赖这些选择的完整页面。真实技能产物与 Figma 权限作为独立外部前置，不误标为已具备。通过，前置工作须进入后续任务。
- **最小充分验证**：构建、lint、类型检查之外，规划浏览器流程验证桌面/手机操作、直达刷新、404 和强制模型失败；Figma 另按代表性批次、全量批次留证。通过。
- **范围控制与协作**：不改技能包未完成构建插件、不导入紧急版技能正文；不以 Figma 或 `dist/docs` 缺失冻结可独立交付的框架。通过。
- **结构复杂度**：沿用 `apps/docs` 单一 Nuxt 应用、Content 数据与现有工作区，不增服务、数据库或管理状态系统。通过，无例外。

## 推荐实施顺序与依赖

1. **复核现状及技术前置**：对照 `apps/docs` 当前内容路由、集合定义、共享布局及 Nuxt/UnoCSS 配置；核实 Nuxt UI 对现有样式模块的安装与兼容方式、Three.js 的客户端隔离和渲染失败处理。若依赖冲突或客户端模型不能安全降级，先调整方案，不直接堆叠实现。
2. **建立路由、布局与共享导航**：先提供五个模块及样例集合可到达的最小页面骨架和四套布局，再交付品牌、四个一级入口、技能集合入口，使 US1 能在不等待各模块正式内容时独立验收；保持 `/`、`/skills`、`/mcp`、`/workflow`、`/getting-started/installation`，项目开发文档地址定为 `/development`。集中核对旧地址、未知地址和刷新行为。
3. **以共享样例数据闭合技能浏览**：复用 Foundational 阶段建立的单一集合/技能数据源，供 US1 全局集合子菜单与本阶段左侧两级目录共同消费；完成选中状态、展开收起、集合说明占位、技能详情占位、移动目录。以页面直达和刷新验收集合与详情路由。样例阶段不读取或发布现存九项紧急版说明。
4. **交付其他模块的最小可浏览内容**：完成 Spec Kit 两个可替换栏目及各自选中/正文状态，MCP 与项目开发文档占位页。与路由框架一并验收各入口及 404。
5. **实现首页及 3D 降级**：先保证 Skills、MCP 两章的正文、包名、全局入口与静态替代可见，再分别加载各自 Three.js 模型。桌面/手机浏览并分别触发两个模型失败，确认降级互相隔离且导航仍可用。
6. **独立准备 Figma 代表性转换**：获得实际 Make 原型可访问入口或可运行源码，及可编辑 Figma Design 文件/工作区权限后，盘点五模块所有可达页面/视图、适用桌面/手机视口、默认态和会改变可见导航布局的展开态；比较批量 URL 导入、Figma MCP Code to canvas 与至少一种 AI 或脚本驱动的清单采集方式对真实页面/交互状态的覆盖。先对首页和至少一个内页各做桌面/手机代表性批次。检查文字和布局可编辑、正文/导航态一致，并逐项记录字体/图片替代、3D/动画差异。代表性验收通过后才启动全量批次，按 FR-014 留存输入、运行方式、画板链接、逐项差异及可复现方法。此轨道不阻塞前五步；缺前置时只记录阻塞原因和恢复条件。
7. **接入正式集合说明（延后）**：等技能包正式提供 `dist/docs` 后，按省略/`true`、文件名、`false` 和缺文件五类输入接入；用真实产物做联调，缺失仅告警并隔离该集合，其他集合继续显示。前置未就绪时仅完成样例说明区域和可替换的输入边界，不伪造已完成真实接入。
8. **整体验收及收尾**：按 [quickstart.md](quickstart.md) 执行目标 workspace 检查及浏览器用例，失败、未执行、缺前置分开记录；完成后核对文档站范围内临时产物与有效引用。Figma 全量结果和真实技能接入分别按各自前置与证据单独报告。

**依赖关系**：步骤 1 是站点实现的技术前置；步骤 2 含全局导航所需的样例数据和模块/集合最小路由，使 US1 可以先独立验收；步骤 3–5 在其上补齐技能、栏目及首页体验；步骤 6 可与站点开发并行，但代表性转换依赖真实原型与编辑权限，全量依赖代表性验收；步骤 7 依赖 `dist/docs` 真实产物，可在站点样例闭环后独立续接；步骤 8 对已具备前置的交付范围执行，不把受阻的可选轨道伪报为通过。

首页模型加载属于异步状态流：具体边界与低门槛说明见同目录 [diagrams.md](diagrams.md)。三维前置验证与实现任务须按实际代码位置同步该图。

## Project Structure

### Documentation (this feature)

```text
specs/docs/001-docs-site-framework/
├── spec.md
├── plan.md
├── mvu.md
├── research.md
├── data-model.md
├── diagrams.md
├── quickstart.md
├── contracts/
│   └── site-navigation.md
├── analysis/spec-analysis/README.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/docs/
├── app/
│   ├── components/       # 全局导航、技能目录、首页章节/模型
│   ├── layouts/          # home、skill、work-with-speckit、empty
│   └── pages/            # 模块入口、集合/详情与兼容路径
├── content/              # 文档正文及可替换占位内容
├── content.config.ts     # 内容集合定义及未来 docs 产物输入
├── nuxt.config.ts        # Nuxt UI 配置与应用模块
└── package.json          # 经核实后声明新增依赖
```

**Structure Decision**: 保持现有单一 `apps/docs` Nuxt 应用和 `app/`、`content/` 目录组织。是否需要拆分新的数据文件或组件子目录由任务按现有源码实际结构决定；不另建后端、数据库或 monorepo 包。

## Complexity Tracking

无宪章例外。
