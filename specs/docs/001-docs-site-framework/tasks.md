---
description: "Agent Foundry 文档站框架的实现任务"
---

# Tasks: Agent Foundry 文档站框架

**Input**: `specs/docs/001-docs-site-framework/` 中的 `spec.md`、`plan.md`、`mvu.md`、`research.md`、`data-model.md`、`contracts/site-navigation.md` 与 `quickstart.md`

**Organization**: 按 Spec 的六个用户故事分阶段。每个 checkbox 是唯一工程状态；详细实现方案由后续实现准备写入 `implementation/<Task ID>.md`。

## Phase 1: Setup（共享技术前置）

**Purpose**: 验证 Nuxt UI 与现有应用基础的集成，为模块页面和导航提供共享组件能力。

- [ ] T001 在 `apps/docs/package.json`、`apps/docs/nuxt.config.ts` 和根 `pnpm-lock.yaml` 接入 Nuxt UI；核对其 Nuxt 配置及与现有 UnoCSS `presetWind3`、属性化前缀 `un-` 的样式共存，运行 docs workspace lint、类型检查和构建。若发现冲突，记录可复现输入、影响与恢复方案，不静默替换 Nuxt UI。

## Phase 2: Foundational（共享路由、布局与技能样例数据）

**Purpose**: 建立足以独立验收全局导航的五模块最小页面骨架、四种布局和导航共用的样例数据。

- [ ] T002 在 `apps/docs/app/app.vue`、`apps/docs/app/layouts/home.vue`、`apps/docs/app/layouts/skill.vue`、`apps/docs/app/layouts/work-with-speckit.vue`、`apps/docs/app/layouts/empty.vue` 及 `apps/docs/app/pages/index.vue`、`apps/docs/app/pages/skills/index.vue`、`apps/docs/app/pages/skills/[collection]/index.vue`、`apps/docs/app/pages/mcp.vue`、`apps/docs/app/pages/workflow/index.vue`、`apps/docs/app/pages/development.vue` 建立五模块及样例集合最小可达页/四种布局骨架；确认五个既有有效路径可解析并刷新，未知模块/文档路径返回现有 404。
- [ ] T009 在 `apps/docs/app/data/skills.ts` 定义可替换的 frontend、workflow 两个样例集合且每集合至少一个技能，为集合标识、名称、说明占位、技能标识、技能名称及归属提供稳定字段；此共享数据供全局集合子菜单和后续 US3 目录共同消费，不导入紧急版技能内容。

## Phase 3: User Story 1 - 从全局菜单进入文档并返回首页（Priority: P1）

**Goal**: 所有模块共享品牌和四个一级入口；桌面、手机导航可用，历史有效地址可直达，未知地址明确 404。

**Independent Test**: 仅依赖共享路由骨架与样例数据，桌面和手机分别从五个模块最小页使用全局入口与品牌导航，并在技能模块打开集合子菜单选择样例集合；地址栏直达并刷新五个既有地址；访问未知文档确认 404 和提示。无需等待首页章节、技能详情正文或 Spec Kit 栏目实现。

### Implementation

- [ ] T003 [US1] 在 `apps/docs/app/components/GlobalNavigation.vue` 实现共享品牌、四个一级入口及仅在技能模块显示的集合子菜单；首页品牌指向 `/`，模块入口与集合子菜单分别使用契约确定的路径和 T009 单一样例数据。
- [ ] T004 [US1] 在 `apps/docs/app/components/MobileGlobalMenu.vue` 实现手机端可开关的全局菜单，包含四个一级入口及技能模块的集合子菜单；在开发服务逐项操作开关和导航，确认选择集合可到达其路由骨架，桌面导航仍可用。
- [ ] T005 [US1] 在现有 `apps/docs/app/pages/[...slug].vue` 保持未知文档 404 和「文档不存在」提示；直接访问并刷新 `/`、`/skills`、`/mcp`、`/workflow`、`/development`、`/getting-started/installation`，逐项核验入口可达。

## Phase 4: User Story 2 - 翻阅首页章节并在 3D 加载失败时继续浏览（Priority: P1）

**Goal**: 首页展示 Skills、MCP 两个全屏章节；两个模型相互独立，模型失败时章节文字、静态替代和全局导航仍可用。

**Independent Test**: 桌面和手机纵向翻阅两章；分别令每章的模型输入失败或 WebGL 不可用，确认只影响对应模型区域，文字与导航可用。

### Implementation

- [ ] T006 [US2] 在 `apps/docs/package.json`、`pnpm-lock.yaml` 和 `apps/docs/app/components/ModelScene.client.vue` 加入 Three.js 并验证客户端渲染隔离；使用最小场景核实浏览器不可用或资源失败时可捕获失败并释放渲染资源，将真实状态/失败转移更新到 `specs/docs/001-docs-site-framework/diagrams.md`，再运行 docs 类型检查和构建。
- [ ] T007 [US2] 在 `apps/docs/app/pages/index.vue` 和 `apps/docs/app/components/HomeSection.vue` 建立按顺序纵向翻阅的 Skills、MCP 全屏章节；每章均配置包名、可替换占位正文及不依赖模型加载的静态替代，并在桌面/手机检查内容可读。
- [ ] T008 [US2] 在 `apps/docs/app/components/ModelScene.client.vue` 为两章分别接入独立 Three.js 模型与失败回退；分别注入每章模型加载失败，确认本章替代可见、另一章不受影响且共享菜单入口可操作，并按实际实现复核 `specs/docs/001-docs-site-framework/diagrams.md`。

## Phase 5: User Story 3 - 按集合查找技能并直达技能详情（Priority: P1）

**Goal**: `/skills` 仅呈现样例目录；顶部集合菜单和左侧两级目录来自同一数据源，集合和技能可展开、选中、直达及刷新。

**Independent Test**: 使用 frontend、workflow 两个样例集合且各至少一项技能；比较两处集合入口目标，操作展开/收起，直达并刷新集合和技能页，核对标题、归属与占位正文，未知目标为 404。

### Implementation

- [ ] T010 [US3] 在 `apps/docs/app/components/SkillDirectory.vue` 实现由 `apps/docs/app/data/skills.ts` 唯一数据源生成的左侧两级目录；支持集合展开/收起、当前集合/技能标记及手机目录开关，并核对其集合目标与 `GlobalNavigation.vue` 一致。
- [ ] T011 [US3] 在 `apps/docs/app/pages/skills/[collection]/index.vue` 与 `apps/docs/app/pages/skills/[collection]/[skill].vue` 实现集合页和技能详情路由并使用 `skill` 布局；集合页显示可替换说明区域，详情标题等于技能名称、正文显示「文档待补充」且可辨识所属集合。
- [ ] T012 [US3] 在 `apps/docs/app/pages/skills/[collection]/index.vue` 与 `apps/docs/app/pages/skills/[collection]/[skill].vue` 为无效集合/技能返回 404 和文档不存在提示；确保 `/skills` 仅渲染 T009 样例而非紧急版九项说明，并逐项直达、刷新有效集合与技能地址。

## Phase 6: User Story 4 - 切换 Spec Kit 栏目并打开两类占位文档（Priority: P1）

**Goal**: Spec Kit 模块可在两个示例栏目间切换；MCP 与项目开发文档有各自可直达的占位入口。

**Independent Test**: 桌面和手机切换两个栏目并核对选中态、标题和正文；打开并刷新 `/mcp` 与项目开发文档地址，确认标题和说明各自正确。

### Implementation

- [ ] T013 [US4] 在 `apps/docs/app/data/workflow.ts` 定义至少两个可替换的 Spec Kit 栏目名称、标题与正文；在 `apps/docs/app/pages/workflow/[section].vue` 和 `apps/docs/app/components/WorkflowNavigation.vue` 实现一级侧栏，选择栏目时 URL、选中态及正文同步，桌面/手机均可切换。
- [ ] T014 [US4] 在 `apps/docs/app/pages/mcp.vue` 与 `apps/docs/app/pages/development.vue` 实现各自独立的占位标题和说明并使用 `empty` 布局；直接打开并刷新 `/mcp` 与 `/development`，确认全局导航可达且两页内容不混淆。

## Phase 7: User Story 5 - 在技能包产物就绪后接入集合说明（Priority: P2）

**Goal**: 从技能包实际 `dist/docs` 读取集合说明，遵守省略、`true`、文件名、`false` 和缺失文件规则；缺失隔离于单个集合。

**Independent Test**: 使用技能包真实构建并验收的 `dist/docs`，验证省略/`true` 读 README、字符串读取指定文件、`false` 不读取、缺文件告警并占位且其他集合继续显示。

### Implementation

- [ ] T015 [US5] 在实现 `apps/docs/` 接入前确认 `packages/skills` 已交付并通过其发布流程验收的真实 `dist/docs` 产物；将源产物路径、元数据字段及默认 README/指定文件布局记录在 `specs/docs/001-docs-site-framework/analysis/` 的实际验收材料中，前置缺失时记录缺项与恢复条件，不以临时模拟内容判定已接入。
- [ ] T016 [US5] 在 `apps/docs/content.config.ts`、`apps/docs/nuxt.config.ts` 及 `apps/docs/app/` 按真实产物接入各集合说明；省略或 `true` 读取默认 README、字符串读取集合目录指定文件、`false` 跳过说明；分别以真实五类输入验收，缺文件警告准确定位且仅影响该集合，其他有效说明仍展示。

## Phase 8: User Story 6 - 一次启动将原型页面和状态转换为可编辑画板（Priority: P2）

**Goal**: 基于实际原型清单先验收代表性批次，再运行一次全量转换并保存可复用方法和逐项证据。

**Independent Test**: 获得真实原型与可编辑目标 Design 文件后，先用首页和至少一个内页的桌面/手机版本一次生成至少四块可编辑画板；代表性验收通过后再一次全量运行并核对全部清单。

### Implementation

- [ ] T017 [P] [US6] 在 `specs/docs/001-docs-site-framework/analysis/figma-conversion.md` 建立真实原型盘点和输入记录；取得可访问的 Figma Make 原型或可运行源码、以及可编辑目标 Design 文件/工作区权限后，逐项记录五模块可达页面/视图、适用桌面/手机视口、默认画面、改变可见导航布局的展开态和不同正文的 Spec Kit 栏目。缺任何前置时记录阻塞原因与恢复条件。
- [ ] T018 [US6] 在 `specs/docs/001-docs-site-framework/analysis/figma-conversion.md` 对照真实清单比较批量 URL 导入、Figma MCP Code to canvas，以及至少一种 AI 或脚本驱动的清单采集方式对页面/交互状态的覆盖能力；记录各自限制、实际采用方式、运行输入及目标文件，不以公开文档能力替代本项目实测。
- [ ] T019 [US6] 在 `specs/docs/001-docs-site-framework/analysis/figma-conversion.md` 执行一次代表性转换：覆盖首页和至少一个内页各自适用的桌面、手机视图，一次启动在同一 Design 文件生成至少四块具名画板；逐项检查文字/布局可编辑性、正文/导航状态、字体/图片差异及 3D/动画处理，保存画板链接、结果和设计协作者对替代项的确认。
- [ ] T020 [US6] 仅在 T019 代表性批次验收通过后，于 `specs/docs/001-docs-site-framework/analysis/figma-conversion.md` 对真实全量清单执行一次转换；核对清单每项唯一对应同一 Design 文件内具名画板，满足 FR-012 条件的比例为 100%，保存全部链接、逐项结果、差异和失败/未执行恢复条件。
- [ ] T021 [US6] 仅在 T020 全量验收通过后，将实际可复用输入、权限、页面清单维护方式、批量运行步骤、画板组织/链接、动态内容处理和失败重跑方法写入 `specs/docs/001-docs-site-framework/spec.md` 的「转换方法复用」章节；未通过或前置缺失时如实记录结果，不填写推测的方法。

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 对已具备前置的交付范围完成工程和端到端核验，并清理开发过程产物。

- [ ] T022 在 `specs/docs/001-docs-site-framework/quickstart.md` 和 `specs/docs/001-docs-site-framework/analysis/` 记录实际执行的 docs lint、类型检查、build 及桌面/手机验收输入、预期和结果；失败、未执行、缺前置分别列明，不把构建成功代替用户流程验收。
- [ ] T023 在 `apps/docs/` 及 `specs/docs/001-docs-site-framework/` 按代码调用、配置、文档语义和引用核对开发期间产生的临时/失效产物；清理可确认无用项并在 `specs/docs/001-docs-site-framework/analysis/` 记录定位、依据、处置与引用检查，无需清理或用途未明的项也记录范围、保留理由和后续条件。

## 依赖与执行顺序

### 阶段依赖

- **Setup（Phase 1）**：Nuxt UI 安装及与 UnoCSS 的兼容核验先于依赖该组件库的模块实现；失败只阻止受影响组件工作，不能未经确认替换既定技术。
- **Foundational（Phase 2）**：T002 提供五个最小路由页，T009 提供全局集合子菜单和技能目录共用的样例数据；完成后 US1 可独立操作全站模块入口及集合子菜单。
- **P1 故事（Phase 3–6）**：US1 的完整全局菜单完成后，US2、US3、US4 可按文件隔离并行；它们各自仍须独立完成并按故事标准验收。
- **US5（Phase 7）**：依赖技能包真实且已验收的 `dist/docs`；前置缺失不阻塞站点样例故事。
- **US6（Phase 8）**：T017 依赖原型输入与目标文件权限；T018 依赖 T017 清单；T019 依赖 T017/T018 及同一编辑权限；T020 严格依赖 T019 通过；T021 严格依赖 T020 通过。整个 Figma 轨道可与站点实现并行。
- **Polish（Phase 9）**：T022 在已实现且前置具备的范围上执行；T023 是执行序列最后的收尾 Task，不得提前完成。

### 用户故事依赖

- **US1（P1）**：依赖 Setup 和 Foundational（含 T009 样例集合数据）；T002 的最小模块/集合路由骨架使其可以不等待 US2–US4 的正式内容而独立验收。
- **US2（P1）**：依赖共享全局导航；单独受 Three.js 客户端技术验证约束。
- **US3（P1）**：依赖共享导航/布局及技能路由契约；样例验收不依赖正式技能包产物。
- **US4（P1）**：依赖共享导航/布局；独立于首页模型和正式技能说明输入。
- **US5（P2）**：依赖 US3 样例集合页和真实 `dist/docs`。
- **US6（P2）**：独立于站点实现；代表性批次通过是全量转换的必要门槛。

### 可并行机会

- T007 的首页文字/章节骨架可与 US3 的目录组件及 US4 的栏目数据/页面分文件开发，但需待共同路由/布局基础完成；样例技能数据 T009 属共享前置，先完成再并行。
- US2、US3、US4 可在 US1 共享入口就绪后并行；避免并行改动同一个组件或 Nuxt 配置文件。
- T017 的原型盘点可与站点故事并行；T018–T021 依赖关系严格串行。
- US5 真实产物接入可在样例站点完成后独立续接，不阻塞 MVP。

## 并行示例：路由基础后的独立 P1 故事

```text
任务 A：T007 首页章节文字与静态替代（apps/docs/app/pages/index.vue、首页组件）
任务 B：T010 技能左侧目录（apps/docs/app/components/SkillDirectory.vue）
任务 C：T013 Spec Kit 栏目数据与页面（apps/docs/app/data/workflow.ts、apps/docs/app/pages/workflow/[section].vue）
```

开始并行前需完成 T001、T002、T009 和 T003–T005 中提供的导航/路由基础；合并时各故事分别执行自己的浏览器验收。

## 实施策略

### MVP（优先验证 US1）

1. 完成 Nuxt UI 前置、五个最小路由页/布局及技能样例数据（T001–T002、T009）。
2. 完成 US1 全局菜单、手机交互、兼容地址和 404（T003–T005），按独立测试停止并验收。
3. 继续 US2、US3、US4，形成可浏览的五模块与样例闭环。
4. US5、US6 有各自明确外部前置，满足后单独恢复，不作为 MVP 发布的虚假通过条件。

### 完整增量交付

按 US1 → US2/US3/US4 → US5 与 US6 的依赖推进；每个故事单独运行相应场景。所有工程检查及可执行浏览器验收完成后执行 T022，最后执行 T023。

## Notes

- `[P]` 只标记文件隔离且无未完成依赖的任务；任务 checkbox 是唯一工程状态。
- Phase 顺序表达实际依赖；T009 从原 US3 阶段移为共享 Foundational 后保留原 Task ID，不按阶段位置重编号。
- 本清单未另列测试框架/TDD任务；规格未要求特定测试框架，故事测试通过浏览器操作作为任务验收内容。
- 每个任务进入实施前须按项目实现准备流程读取其原始方案、实际源码与前置；未满足任务内写明的外部条件时，仅记录缺项与恢复条件，不伪报通过。
