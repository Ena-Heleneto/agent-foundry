# Agent Foundry 迁移文件处理清单

> 实施状态更新：本次迁移及原仓库对应删除已执行；下文保留设计和准备时的语境，最终结果见 [执行记录](repository-migration-execution.md)。

## 阅读范围

这是待审阅的文件处理清单，不是已执行的搬移记录。原仓库为 Foundry，新仓库为用户已创建的 Agent Foundry。当前目标仓库仍只有已有 README 与 Git 历史；本轮没有写入目标仓库、移动源码或修改产品配置。

上一轮准备快照共440个文件：143个代码及包内文件、297个规格及相关材料。数字包含上一轮新增的设计文档，不包含本清单。下文“草稿处置”来自临时公开预备副本；正式迁移前仍须核对当时源码、全部引用、目标依赖及归档内容，不能视为已经完成公开审查。

设计见 [repository-migration.md](repository-migration.md)。此清单补充实际依赖，不表示用户已批准新增实施范围。

## 一、整体迁移的现有文件

保持目录相对关系，代码、技能正文、附件和既有测试优先原样迁移。需要维护的只是与迁仓直接相关的依赖、路径、说明和独立验证前置，不能借此接管主线功能。

| 来源目录                                             | 快照文件数 | 处理                                                                              |
| ---------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `packages/skills/`                                   | 74         | 迁移主线源码、临时技能目录、配置、脚本和测试；保留用户手写中间态，不实施T076/T077 |
| `packages/skills-distribution-urgent/`               | 60         | 迁移紧急版源码、正式技能、脚本、测试与包内ISC许可；迁后重新验证                   |
| `apps/mcp/`                                          | 9          | 迁移Python源码、测试、README、pyproject和uv.lock；不在本轮重写服务契约            |
| `specs/skills/001-skills-distribution/`              | 129        | 迁移规格、任务、方案、契约与证据；必要公开派生保留来源对应，不自动勾选任务        |
| `specs/skills/20261029-speckit-workflow-foundation/` | 168        | 同上；其中两份含私人协作信息的材料仅迁公开摘要，原件留源                          |

### 相关技能具体是什么

正式技能来源及其 `references/` 一同迁移。主线和紧急版的同名文件是两条现有工作线各自的来源，不能在迁仓时擅自去重、合并或覆盖。

| 类别     | 技能名称                                                                                                     | 当前源码位置                                          |
| -------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 编码     | business-node-delivery、document-changed-symbols                                                             | 主线 `src/coding/` 与紧急版 `src/coding/`             |
| 前端     | nuxt-ui-styling、vue-reactivity                                                                              | 主线 `temp/frontend/` 与紧急版 `src/frontend/`        |
| 工作流   | artifact-project-description、artifact-spec-analysis、bug-report、implementation-preparation、task-increment | 主线 `temp/workflow/` 与紧急版 `src/workflow/`        |
| 评估样本 | eval-short-rule、eval-with-reference、eval-workflow-guide、mcp-build-smoke                                   | 主线 `src/eval/`；保留源码，正式分发范围见下方差异    |
| 历史候选 | artifact-spec-analysis、implementation-preparation的验收候选                                                 | 两个Spec中的fixture；保留历史身份，不作为额外正式技能 |

`.agents/skills/` 是已安装副本，不能整目录当源码搬走。新仓库应从已确认来源生成所需副本，原仓库其他来源技能继续保留；不存在单独复制全部Codex技能或恢复已退役模式的计划。

## 二、五个目录外还关联的现有文件

以下文件没有计入上述440个快照文件。新增发现的伴随材料按职责列出，具体进入迁移还是测试夹具应按独立运行需要落实，不直接复制整个Foundry开发环境。

| 文件                                                             | 需要处理的原因               | 建议处理                                                     |
| ---------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| `scripts/dev/actions/link-skills/link-skills.sh`                 | 默认读取待迁移的技能源码     | 随技能保留到新仓库；核对来源布局；原仓库不再调用失效本地路径 |
| `scripts/dev/actions/link-skills/link-skills.ps1`                | 同一行为的现存PowerShell版本 | 随原有材料保留，不据此扩大本期平台支持承诺                   |
| `scripts/dev/actions/link-skills/test-link-skills.mjs`           | 挂载行为回归且引用主线来源   | 随脚本迁移并核对现有来源路径，不能删除失败断言求绿           |
| `scripts/dev/actions/link-skills/README.md`                      | 描述来源和挂载用法           | 更新新根使用方式                                             |
| `scripts/dev/actions/register-hooks/register-hooks.sh`           | 包装调用主线包内脚本         | 随相关脚本保留或作为兼容测试fixture；原仓库需解除失效调用    |
| `scripts/dev/actions/register-hooks/register-hooks.ps1`          | 同上                         | 保留现存来源，不据此恢复已移出本期的PowerShell交付           |
| `scripts/dev/actions/register-hooks/test-register-hooks.mjs`     | import待迁移包的测试入口     | 随关联脚本保留，避免原仓库留下断开的import                   |
| `scripts/dev/actions/register-hooks/README.md`                   | 描述旧hooks安装流程          | 随实际来源和当前范围校正，不恢复旧七项hooks/五模式           |
| `scripts/dev/actions/estimate-context/estimate-context.mjs`      | 默认读取技能源码和旧manifest | 建议随MCP相关工具迁移，标明旧manifest依赖                    |
| `scripts/dev/actions/estimate-context/test-estimate-context.mjs` | 上述工具的对应测试           | 一并保留并在新根运行                                         |
| `stacks/mcp-inspector/docker-compose.yml`                        | 运行apps/mcp并挂载技能产物   | 建议随MCP部署配置迁移，核对新根相对挂载，不启动容器          |
| `stacks/mcp-inspector/docker-compose.dev.yml`                    | 对应Inspector冒烟配置        | 同上，迁移配置不等于已做服务验证                             |
| `stacks/mcp-inspector/README.md`                                 | 描述服务路径、清单与命令     | 与真实入口一致，不保留已失效的启动说明                       |

### 共享预设不能直接移走

旧 `packages/preset-config/` 还被Foundry其他应用使用，必须保留在原仓库。新仓库仅复用独立运行需要的公共配置，暂拟落在 `tooling/preset-config/`，继续通过包exports消费。

| 原文件                                                   | 新仓库拟定落点                                                                             | 处理                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `packages/preset-config/src/eslint-config/index.ts`      | `tooling/preset-config/src/eslint-config/index.js`                                         | 保留原工厂行为及append接口，去除对原仓库的运行依赖；实现时维护中文JSDoc与类型声明 |
| `packages/preset-config/src/tsconfig-json/tsconfig.json` | `tooling/preset-config/src/tsconfig-json/tsconfig.json`                                    | 复用现有严格基线，不降低消费方检查要求                                            |
| `packages/preset-config/package.json`                    | `tooling/preset-config/package.json`                                                       | 新建最小包声明与既有公开出口，不整包复制原Nuxt/Uno预设                            |
| 原包的构建能力                                           | `tooling/preset-config/build/copy-presets.mjs`                                             | 新建最小构建入口，产物仍由命令生成                                                |
| 原包的类型与检查配套                                     | `tooling/preset-config/src/eslint-config/index.d.ts`、`eslint.config.mjs`、`tsconfig.json` | 根据实际公共类型消费补齐，不以any或关闭检查替代                                   |

文件扩展名与最小构建实现属于当前草案安排，不是已经实施或已经验证的等价结果。

### 两项主线测试需要独立夹具

只迁移五个主目录会让下列测试继续依赖原仓库：

| 测试文件                                      | 当前读取的额外输入                                                                       | 拟处理                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/skills/tests/test_mvu_documents.py` | 原根 `.specify/scripts/`、plan/tasks核心模板及两个overrides模板                          | 将必要公开脚本和模板作为有许可的测试fixture；测试改读fixture，不搬整个私人.specify  |
| `packages/skills/tests/test_full_remount.py`  | 原根 `scripts/dev/actions/register-hooks/` 与 `scripts/dev/nuxt-prepare/nuxt-prepare.sh` | 保留原初始化行为的独立fixture或迁后等价入口；原断言和历史验收不能因根入口变化而删除 |

前者当前实际输入为：

```text
.specify/scripts/bash/check-prerequisites.sh
.specify/scripts/bash/common.sh
.specify/scripts/bash/create-new-feature.sh
.specify/scripts/bash/resolve-template.sh
.specify/scripts/bash/setup-plan.sh
.specify/scripts/bash/setup-tasks.sh
.specify/templates/plan-template.md
.specify/templates/tasks-template.md
.specify/templates/overrides/plan-template.md
.specify/templates/overrides/tasks-template.md
```

这些是用于独立复现测试的配套，不等于授权复制原仓库的所有治理配置、用户画像、会话或当前feature指针。

## 三、新仓库新增或改写的文件

### monorepo根与说明

| 目标文件                    | 职责                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `package.json`              | private ESM根、pnpm12及开发/构建/lint/types编排；Python应用独立依赖体系应有明确入口 |
| `pnpm-workspace.yaml`       | 声明apps/packages/tooling以及实际需要的catalog，不全量照搬旧catalog                 |
| `turbo.json`                | 管理构建依赖、输出缓存和开发任务                                                    |
| `eslint.config.mjs`         | 消费公共ESLint配置                                                                  |
| `.gitignore`                | 忽略依赖、生成物、缓存、本机环境和已安装技能；保持既有不跟踪pnpm锁的约定            |
| `mise.toml`                 | Node、pnpm、Python、uv开发工具声明                                                  |
| `README.md`                 | 在用户已创建的README上补充结构、开发及文档站入口                                    |
| `AGENTS.md`                 | 新仓库自己的工程约定，不复制Foundry业务规范或本仓库私人画像记录要求                 |
| `LICENSE`                   | 已选ISC的实际许可正文，沿用现有署名                                                 |
| `THIRD-PARTY-NOTICES.txt`   | 已知第三方来源、许可与适用范围                                                      |
| `licenses/SPEC-KIT-MIT.txt` | 固定Spec Kit MIT原文                                                                |
| `migration-manifest.json`   | 迁前/迁后相对路径、原摘要与派生摘要、原件保留说明；正式迁移前刷新                   |

不会复制新仓库的 `.git`、原根 `node_modules` 或旧构建产物。新根所需最小初始化脚本沿既有层次设计，最终应随所属目录的README与测试一起明确；不把原Foundry全套postinstall照搬为新仓库必需入口。

### apps/docs文档站

以下是拟定的最小职责和文件落点，允许在已认可功能内合并组件；尚未创建。样式相关配置按实际采用的Nuxt UI/UnoCSS接入确定，不预先声称已有主题配置。

```text
apps/docs/
  package.json
  nuxt.config.ts
  content.config.ts
  tsconfig.json
  eslint.config.mjs
  README.md
  app/
    app.vue
    layouts/default.vue
    pages/[...slug].vue
    components/DocsSidebar.vue
    components/DocsTableOfContents.vue
    assets/css/main.css
  content/
    index.md
    getting-started/installation.md
    skills/index.md
    workflow/index.md
    mcp/index.md
```

安装、技能目录、工作流、MCP使用分别维护用户文档。规格、原始需求、完整验收日志和压缩归档继续留在 `specs/`，不自动渲染成文档站页面。动态路由需检查404和移动端导航；新文档不能编造已经发布的安装来源。

## 四、原仓库需要收尾的文件

原仓库业务应用和共享预设继续保留。以下是与源码迁出直接有关的入口、说明与测试，需在实际迁移时同步处理，避免旧初始化继续读取已不存在的路径。

| 文件                                                                          | 收尾范围                                                       |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `scripts/dev/nuxt-prepare/nuxt-prepare.sh`                                    | 保留各应用prepare；解除或改接迁出后的本地技能、hooks、指令调用 |
| `scripts/dev/nuxt-prepare/nuxt-prepare.ps1`                                   | 与该原仓库入口行为同步，不扩展新仓库平台验收                   |
| `scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs`                              | 按实际保留的原仓库初始化行为校正断言                           |
| `scripts/dev/nuxt-prepare/README.md`                                          | 更新初始化顺序和技能来源说明                                   |
| `scripts/dev/postinstall/postinstall.sh`                                      | 实际行为如可沿用则不改，只校正失效的离线说明注释               |
| `scripts/dev/postinstall/README.md`                                           | 更新迁出后的离线步骤                                           |
| `scripts/dev/README.md`                                                       | 更新行为脚本职责和来源位置                                     |
| `scripts/dev/actions/install-opensource-skills/README.md`                     | 去掉失效的本地自定义来源说明，保留原第三方安装职责             |
| `scripts/dev/actions/install-opensource-skills/install-opensource-skills.sh`  | 仅核对并校正指向link-skills的说明，不顺便重写安装逻辑          |
| `scripts/dev/actions/install-opensource-skills/install-opensource-skills.ps1` | 同上                                                           |
| `apps/personal-hub/nuxt.config.ts`                                            | 仅处理指向旧技能路径的注释引用，业务配置保留                   |
| `AGENTS.md`                                                                   | 更新已经迁出的工作区与本地技能路径说明；本仓库画像约定继续保留 |

原根 `package.json`、`pnpm-workspace.yaml` 与 `turbo.json` 需验证是否仍有直接引用；当前没有发现必须全量改写它们的理由。原根catalog不因这次迁移做无关依赖清理。`.codex/config.toml` 当前列出的MCP服务没有指向本项目的apps/mcp，不作为迁移对象。

五个迁出目录的原文件只能在目标副本核对且适用前置满足后移除。私人原件和历史原始归档按保留约定留源；旧 `specs/agent-config/` 等其他功能材料只核对引用，不重写其历史事实。

## 五、公开派生与必须保留的原件

以下两份原件留在原仓库，新仓库仅保留不含私人协作资料的技术摘要：

```text
specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/user-shadow.md
specs/skills/20261029-speckit-workflow-foundation/analysis/issues/2026-11-11-collaboration-conversation.md
```

历史归档共14个外层压缩包和1个嵌套容器。预备副本对原机器路径、私人来源链接做派生，保留适用第三方通知，并记录原摘要到派生摘要。原checksum仍属于原件，不能直接用来证明派生包；正式搬移前还需处理对应说明和全部实际引用。

明确不整体搬迁：`.specify/memory/user-shadow/`、凭据、本机环境文件、`.git`、`node_modules/`、`dist/`、`.nuxt/`、`.output/`、`.turbo/`、Python虚拟环境及无关已安装技能。

## 六、发现的差异不混入搬迁修改

1. 主线 `build/plugins/old/collections.ts:9` 的未使用函数是已实测的既有lint失败，不在迁仓时顺手修复。
2. 主线 `src/eval/collection.config.ts` 当前启用了 `eval-with-reference`、`eval-workflow-guide` 和 `mcp-build-smoke`，而原规格要求eval源码可迁移、正式安装/发布排除。迁移保留当前用户源码；正式分发前需沿原任务解决差异，不能声称现在已经排除。
3. MCP与estimate-context仍消费旧 `manifest.json`，当前主线产物结构已变。迁移服务源码不等于打通这一业务契约；当前先保留并在使用文档标明真实前置。
4. 旧测试fixture、hooks说明和模式名单含历史范围，保留历史事实与恢复已退役功能是两回事；迁移不能使旧任务自动完成。

## 七、440个现有文件逐项清单

下表为上一轮临时预备树的处置标签：原样表示该轮副本字节一致；派生表示副本已调整机器路径、私有引用或归档通知；摘要表示原件留源，仅准备技术摘要。正式迁移仍应以最终输入清单为准。

### packages/skills/（74个文件）

| 文件                                                              | 草稿处置 |
| ----------------------------------------------------------------- | -------- |
| `README.md`                                                       | 原样     |
| `build/plugins/old/collections.ts`                                | 原样     |
| `build/plugins/old/copy-skills.ts`                                | 原样     |
| `build/plugins/old/create-directories.ts`                         | 原样     |
| `build/plugins/old/generate-scripts.ts`                           | 原样     |
| `build/plugins/vite-plugin-skill.plugin.ts`                       | 原样     |
| `eslint.config.ts`                                                | 原样     |
| `package.json`                                                    | 原样     |
| `script/index.mjs`                                                | 原样     |
| `script/install-skills/README.md`                                 | 原样     |
| `script/install-skills/install-skills.ps1`                        | 原样     |
| `script/install-skills/install-skills.sh`                         | 原样     |
| `script/install-skills/read-agents.mjs`                           | 原样     |
| `script/mount-entry/README.md`                                    | 原样     |
| `script/mount-entry/mount-entry.ps1`                              | 原样     |
| `script/mount-entry/mount-entry.sh`                               | 原样     |
| `script/register-commands/README.md`                              | 原样     |
| `script/register-commands/register-commands.ps1`                  | 原样     |
| `script/register-commands/register-commands.sh`                   | 原样     |
| `script/register-hooks/README.md`                                 | 原样     |
| `script/register-hooks/register-hooks.ps1`                        | 原样     |
| `script/register-hooks/register-hooks.sh`                         | 原样     |
| `src/coding/business-node-delivery/SKILL.md`                      | 原样     |
| `src/coding/collection.config.ts`                                 | 原样     |
| `src/coding/document-changed-symbols/SKILL.md`                    | 原样     |
| `src/coding/document-changed-symbols/references/test-prompts.md`  | 原样     |
| `src/eval/collection.config.ts`                                   | 原样     |
| `src/eval/eval-short-rule/SKILL.md`                               | 原样     |
| `src/eval/eval-with-reference/SKILL.md`                           | 原样     |
| `src/eval/eval-with-reference/references/contracts.md`            | 原样     |
| `src/eval/eval-workflow-guide/SKILL.md`                           | 原样     |
| `src/eval/mcp-build-smoke/SKILL.md`                               | 原样     |
| `src/eval/mcp-build-smoke/references/verification.md`             | 原样     |
| `temp/frontend/collection.config.json`                            | 原样     |
| `temp/frontend/nuxt-ui-styling/SKILL.md`                          | 原样     |
| `temp/frontend/nuxt-ui-styling/references/attribute-conflicts.md` | 原样     |
| `temp/frontend/nuxt-ui-styling/references/rule-verification.md`   | 原样     |
| `temp/frontend/vue-reactivity/SKILL.md`                           | 原样     |
| `temp/workflow/artifact-project-description/SKILL.md`             | 原样     |
| `temp/workflow/artifact-spec-analysis/SKILL.md`                   | 原样     |
| `temp/workflow/bug-report/SKILL.md`                               | 原样     |
| `temp/workflow/collection.config.json`                            | 原样     |
| `temp/workflow/implementation-preparation/SKILL.md`               | 原样     |
| `temp/workflow/task-increment/SKILL.md`                           | 原样     |
| `tests/distribution/agent-paths.test.mjs`                         | 原样     |
| `tests/distribution/build-pipeline.test.mjs`                      | 原样     |
| `tests/distribution/collections.test.mjs`                         | 原样     |
| `tests/distribution/create-directories.test.mjs`                  | 原样     |
| `tests/distribution/entry-discovery.test.mjs`                     | 原样     |
| `tests/distribution/fixtures/agents-1.7.4.json`                   | 原样     |
| `tests/distribution/fixtures/legacy-registration-hooks.json`      | 原样     |
| `tests/distribution/helpers/build-fixture.mjs`                    | 原样     |
| `tests/distribution/helpers/entry-discovery.mjs`                  | 原样     |
| `tests/distribution/helpers/https-source.mjs`                     | 原样     |
| `tests/distribution/helpers/online-provider.mjs`                  | 原样     |
| `tests/distribution/helpers/registration-bash-fixture.mjs`        | 原样     |
| `tests/distribution/helpers/registration-fixture.mjs`             | 原样     |
| `tests/distribution/helpers/registration-migration.mjs`           | 原样     |
| `tests/distribution/mvu-b.mjs`                                    | 原样     |
| `tests/distribution/mvu-c.mjs`                                    | 原样     |
| `tests/distribution/mvu-e.mjs`                                    | 原样     |
| `tests/distribution/online-agents.test.mjs`                       | 原样     |
| `tests/distribution/sandbox.mjs`                                  | 原样     |
| `tests/distribution/test-distribution.mjs`                        | 原样     |
| `tests/distribution/test-entry.mjs`                               | 原样     |
| `tests/test-register-commands.mjs`                                | 原样     |
| `tests/test-register-hooks.mjs`                                   | 原样     |
| `tests/test_full_remount.py`                                      | 原样     |
| `tests/test_mvu_documents.py`                                     | 原样     |
| `tests/test_register_commands.py`                                 | 原样     |
| `tsconfig.json`                                                   | 原样     |
| `types/preset-config.d.ts`                                        | 原样     |
| `utils/define-collection-handle.ts`                               | 原样     |
| `vite.config.ts`                                                  | 原样     |

### packages/skills-distribution-urgent/（60个文件）

| 文件                                                             | 草稿处置 |
| ---------------------------------------------------------------- | -------- |
| `LICENSE`                                                        | 原样     |
| `README.md`                                                      | 原样     |
| `build/distribution/export.ts`                                   | 原样     |
| `build/distribution/models.ts`                                   | 原样     |
| `build/distribution/references.ts`                               | 原样     |
| `build/distribution/source.ts`                                   | 原样     |
| `build/distribution/validate.ts`                                 | 原样     |
| `build/distribution/verify.ts`                                   | 原样     |
| `build/plugins/content.ts`                                       | 原样     |
| `build/publish.mjs`                                              | 原样     |
| `eslint.config.mjs`                                              | 原样     |
| `package.json`                                                   | 原样     |
| `script/index.mjs`                                               | 原样     |
| `script/install-skills/README.md`                                | 原样     |
| `script/install-skills/install-skills.ps1`                       | 原样     |
| `script/install-skills/install-skills.sh`                        | 原样     |
| `script/install-skills/read-agents.mjs`                          | 原样     |
| `script/lib/managed-state.mjs`                                   | 原样     |
| `script/mount-entry/README.md`                                   | 原样     |
| `script/mount-entry/mount-entry.ps1`                             | 原样     |
| `script/mount-entry/mount-entry.sh`                              | 原样     |
| `script/register-commands/README.md`                             | 原样     |
| `script/register-commands/legacy-source-hashes.json`             | 原样     |
| `script/register-commands/prepare-command.mjs`                   | 原样     |
| `script/register-commands/register-commands.ps1`                 | 原样     |
| `script/register-commands/register-commands.sh`                  | 原样     |
| `script/register-hooks/README.md`                                | 原样     |
| `script/register-hooks/prepare-hooks.mjs`                        | 原样     |
| `script/register-hooks/register-hooks.ps1`                       | 原样     |
| `script/register-hooks/register-hooks.sh`                        | 原样     |
| `src/coding/business-node-delivery/SKILL.md`                     | 原样     |
| `src/coding/collection.config.json`                              | 原样     |
| `src/coding/document-changed-symbols/SKILL.md`                   | 原样     |
| `src/coding/document-changed-symbols/references/test-prompts.md` | 原样     |
| `src/frontend/collection.config.json`                            | 原样     |
| `src/frontend/nuxt-ui-styling/SKILL.md`                          | 原样     |
| `src/frontend/nuxt-ui-styling/references/attribute-conflicts.md` | 原样     |
| `src/frontend/nuxt-ui-styling/references/rule-verification.md`   | 原样     |
| `src/frontend/vue-reactivity/SKILL.md`                           | 原样     |
| `src/workflow/artifact-project-description/SKILL.md`             | 原样     |
| `src/workflow/artifact-spec-analysis/SKILL.md`                   | 原样     |
| `src/workflow/bug-report/SKILL.md`                               | 原样     |
| `src/workflow/collection.config.json`                            | 原样     |
| `src/workflow/implementation-preparation/SKILL.md`               | 原样     |
| `src/workflow/task-increment/SKILL.md`                           | 原样     |
| `tests/build.test.mjs`                                           | 原样     |
| `tests/commands.test.mjs`                                        | 原样     |
| `tests/helpers/host-probe.mjs`                                   | 原样     |
| `tests/helpers/prepare-host-context.py`                          | 原样     |
| `tests/helpers/urgent-sandbox.mjs`                               | 原样     |
| `tests/hooks.test.mjs`                                           | 原样     |
| `tests/mount-contract.test.mjs`                                  | 原样     |
| `tests/official-install.test.mjs`                                | 原样     |
| `tests/publish.test.mjs`                                         | 原样     |
| `tests/remote-consumption.test.mjs`                              | 原样     |
| `tests/runtime.test.mjs`                                         | 原样     |
| `tests/urgent-contract.test.mjs`                                 | 原样     |
| `tests/workspace-source.test.mjs`                                | 原样     |
| `tsconfig.json`                                                  | 原样     |
| `vite.config.ts`                                                 | 原样     |

### apps/mcp/（9个文件）

| 文件                                 | 草稿处置 |
| ------------------------------------ | -------- |
| `README.md`                          | 原样     |
| `pyproject.toml`                     | 原样     |
| `src/foundry_skills_mcp/__init__.py` | 原样     |
| `src/foundry_skills_mcp/registry.py` | 原样     |
| `src/foundry_skills_mcp/server.py`   | 原样     |
| `tests/__init__.py`                  | 原样     |
| `tests/test_registry.py`             | 原样     |
| `tests/test_server.py`               | 原样     |
| `uv.lock`                            | 原样     |

### specs/skills/001-skills-distribution/（129个文件）

| 文件                                                                                                                     | 草稿处置 |
| ------------------------------------------------------------------------------------------------------------------------ | -------- |
| `analysis/acceptance/baseline.md`                                                                                        | 原样     |
| `analysis/acceptance/build-and-preflight.md`                                                                             | 原样     |
| `analysis/acceptance/build-pipeline-red.md`                                                                              | 原样     |
| `analysis/acceptance/build-rewrite.md`                                                                                   | 派生     |
| `analysis/acceptance/collections.md`                                                                                     | 原样     |
| `analysis/acceptance/content-export.md`                                                                                  | 派生     |
| `analysis/acceptance/mcp-manifest.md`                                                                                    | 原样     |
| `analysis/acceptance/models-and-agent-paths.md`                                                                          | 原样     |
| `analysis/acceptance/mvu-a.md`                                                                                           | 派生     |
| `analysis/acceptance/mvu-b.md`                                                                                           | 派生     |
| `analysis/acceptance/mvu-c.md`                                                                                           | 派生     |
| `analysis/acceptance/mvu-e.md`                                                                                           | 原样     |
| `analysis/acceptance/node-entry.md`                                                                                      | 派生     |
| `analysis/acceptance/official-contract.md`                                                                               | 原样     |
| `analysis/acceptance/online-agent-source.md`                                                                             | 原样     |
| `analysis/acceptance/pipeline-local.md`                                                                                  | 原样     |
| `analysis/acceptance/plugin-skill-config.md`                                                                             | 原样     |
| `analysis/acceptance/source-plan.md`                                                                                     | 原样     |
| `analysis/acceptance/urgent-build.md`                                                                                    | 派生     |
| `analysis/acceptance/urgent-commands.md`                                                                                 | 派生     |
| `analysis/acceptance/urgent-content.md`                                                                                  | 原样     |
| `analysis/acceptance/urgent-contract-red.md`                                                                             | 派生     |
| `analysis/acceptance/urgent-handoff.md`                                                                                  | 原样     |
| `analysis/acceptance/urgent-hooks.md`                                                                                    | 派生     |
| `analysis/acceptance/urgent-host-coverage.json`                                                                          | 原样     |
| `analysis/acceptance/urgent-host.md`                                                                                     | 原样     |
| `analysis/acceptance/urgent-local.json`                                                                                  | 原样     |
| `analysis/acceptance/urgent-migration-runtime.md`                                                                        | 原样     |
| `analysis/acceptance/urgent-mount.md`                                                                                    | 派生     |
| `analysis/acceptance/urgent-public-content.md`                                                                           | 原样     |
| `analysis/acceptance/urgent-public-license.md`                                                                           | 原样     |
| `analysis/acceptance/urgent-publish.md`                                                                                  | 原样     |
| `analysis/acceptance/urgent-runtime.md`                                                                                  | 原样     |
| `analysis/acceptance/urgent-source.md`                                                                                   | 派生     |
| `analysis/history/task-details-before-constitution-7.md`                                                                 | 原样     |
| `archive/2026-11-10-build-pipeline-replan/README.md`                                                                     | 原样     |
| `archive/2026-11-10-build-pipeline-replan/files.sha256`                                                                  | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source.sha256`                                                         | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/distribution/export.ts`                   | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/distribution/models.ts`                   | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/distribution/projection.ts`               | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/distribution/references.ts`               | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/distribution/validate.ts`                 | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/distribution/verify.ts`                   | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/plugins/content.ts`                       | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/plugins/distribution.ts`                  | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/plugins/mcp-manifest.ts`                  | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/build/plugins/scripts.ts`                       | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/distribution/content-export.mjs`          | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/distribution/helpers/catalog.ts`          | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/distribution/helpers/projection.ts`       | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/distribution/helpers/selection.ts`        | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/distribution/mvu-a.mjs`                   | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/distribution/official-contract.test.mjs`  | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/distribution/official-preflight.test.mjs` | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/distribution/release-models.test.mjs`     | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/distribution/test-build-config.mjs`       | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/test_artifacts.py`                        | 原样     |
| `archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/vite.config.ts`                                 | 原样     |
| `archive/2026-11-10-build-pipeline-replan/snapshot.sha256`                                                               | 原样     |
| `archive/2026-11-10-build-pipeline-replan/snapshot.tar.gz`                                                               | 派生     |
| `archive/2026-11-11-build-script-restart/README.md`                                                                      | 原样     |
| `archive/2026-11-11-build-script-restart/files.json`                                                                     | 原样     |
| `archive/2026-11-11-build-script-restart/files.sha256`                                                                   | 原样     |
| `archive/2026-11-11-build-script-restart/retired-source/packages/skills/build/distribution/dependencies.ts`              | 原样     |
| `archive/2026-11-11-build-script-restart/retired-source/packages/skills/build/distribution/export.ts`                    | 原样     |
| `archive/2026-11-11-build-script-restart/retired-source/packages/skills/build/distribution/models.ts`                    | 原样     |
| `archive/2026-11-11-build-script-restart/retired-source/packages/skills/build/distribution/source-files.ts`              | 原样     |
| `archive/2026-11-11-build-script-restart/retired-source/packages/skills/build/distribution/source.ts`                    | 原样     |
| `archive/2026-11-11-build-script-restart/retired-source/packages/skills/build/distribution/validate.ts`                  | 原样     |
| `archive/2026-11-11-build-script-restart/retired-source/packages/skills/tests/distribution/source-plan.test.mjs`         | 原样     |
| `checklists/requirements.md`                                                                                             | 原样     |
| `contracts/build-pipeline.md`                                                                                            | 原样     |
| `contracts/compatibility.md`                                                                                             | 原样     |
| `contracts/distribution.md`                                                                                              | 原样     |
| `contracts/install.md`                                                                                                   | 原样     |
| `contracts/mount.md`                                                                                                     | 原样     |
| `contracts/pipeline.md`                                                                                                  | 原样     |
| `contracts/urgent-release.md`                                                                                            | 原样     |
| `data-model.md`                                                                                                          | 原样     |
| `descriptions/issue-description.md`                                                                                      | 原样     |
| `descriptions/pr-description.md`                                                                                         | 原样     |
| `diagrams.md`                                                                                                            | 原样     |
| `diagrams/business-flow.md`                                                                                              | 原样     |
| `diagrams/logic-flow.md`                                                                                                 | 原样     |
| `implementation/T064.md`                                                                                                 | 派生     |
| `implementation/T065.md`                                                                                                 | 原样     |
| `implementation/T067.md`                                                                                                 | 原样     |
| `implementation/T072.md`                                                                                                 | 原样     |
| `implementation/T073.md`                                                                                                 | 原样     |
| `implementation/T074.md`                                                                                                 | 原样     |
| `implementation/T075.md`                                                                                                 | 原样     |
| `implementation/T078.md`                                                                                                 | 原样     |
| `implementation/T079.md`                                                                                                 | 原样     |
| `implementation/T080.md`                                                                                                 | 原样     |
| `implementation/T081.md`                                                                                                 | 原样     |
| `implementation/T082.md`                                                                                                 | 原样     |
| `implementation/T083.md`                                                                                                 | 原样     |
| `implementation/T084.md`                                                                                                 | 原样     |
| `implementation/T085.md`                                                                                                 | 原样     |
| `implementation/T086.md`                                                                                                 | 原样     |
| `implementation/T087.md`                                                                                                 | 派生     |
| `implementation/T088.md`                                                                                                 | 原样     |
| `implementation/T089.md`                                                                                                 | 原样     |
| `implementation/repository-migration.md`                                                                                 | 派生     |
| `mvu.md`                                                                                                                 | 原样     |
| `plan.md`                                                                                                                | 原样     |
| `quickstart.md`                                                                                                          | 原样     |
| `requirements/discussions/2026-11-10-build-actions-mount-order.md`                                                       | 原样     |
| `requirements/discussions/2026-11-10-context-alignment.md`                                                               | 原样     |
| `requirements/discussions/2026-11-11-collection-build.md`                                                                | 原样     |
| `requirements/discussions/2026-11-11-independent-plugins.md`                                                             | 原样     |
| `requirements/discussions/2026-11-11-plugin-order.md`                                                                    | 原样     |
| `requirements/discussions/2026-11-11-plugin-skill-config.md`                                                             | 原样     |
| `requirements/prompts/2026-11-05-distribution-revision.md`                                                               | 原样     |
| `requirements/prompts/2026-11-10-implement-only-mount-revision.md`                                                       | 派生     |
| `requirements/raw/2026-11-05-workflow-adjustments.md`                                                                    | 原样     |
| `requirements/raw/2026-11-11-collection-build.md`                                                                        | 原样     |
| `requirements/raw/2026-11-11-independent-plugins.md`                                                                     | 原样     |
| `requirements/raw/2026-11-11-plugin-skill-config.md`                                                                     | 原样     |
| `requirements/raw/2026-11-11-urgent-release.md`                                                                          | 派生     |
| `requirements/raw/2026-11-12-main-curl-only.md`                                                                          | 原样     |
| `requirements/raw/2026-11-12-mandatory-track-discovery.md`                                                               | 原样     |
| `requirements/raw/2026-11-12-track-ownership-and-repository.md`                                                          | 原样     |
| `requirements/raw/2026-11-12-urgent-continuous-exemption.md`                                                             | 原样     |
| `requirements/raw/2026-11-12-workspace-local-handoff.md`                                                                 | 原样     |
| `research.md`                                                                                                            | 原样     |
| `spec.md`                                                                                                                | 派生     |
| `tasks.md`                                                                                                               | 原样     |

### specs/skills/20261029-speckit-workflow-foundation/（168个文件）

| 文件                                                                                            | 草稿处置 |
| ----------------------------------------------------------------------------------------------- | -------- |
| `analysis/acceptance/bash-registration.md`                                                      | 原样     |
| `analysis/acceptance/cleanup-governance.md`                                                     | 原样     |
| `analysis/acceptance/cleanup-validation.md`                                                     | 原样     |
| `analysis/acceptance/collaboration-modes-delivery.md`                                           | 派生     |
| `analysis/acceptance/collaboration-modes.md`                                                    | 原样     |
| `analysis/acceptance/direct-engineering.md`                                                     | 原样     |
| `analysis/acceptance/direct-skills.md`                                                          | 原样     |
| `analysis/acceptance/entry-discovery-mechanism.md`                                              | 原样     |
| `analysis/acceptance/fixtures/implementation-preparation-baseline.json`                         | 原样     |
| `analysis/acceptance/fixtures/request-boundary-source/baseline-implementation-preparation.txt`  | 原样     |
| `analysis/acceptance/fixtures/request-boundary-source/baseline-task-increment.txt`              | 原样     |
| `analysis/acceptance/fixtures/request-boundary-source/candidate-implementation-preparation.txt` | 原样     |
| `analysis/acceptance/fixtures/request-boundary-source/candidate-task-increment.txt`             | 原样     |
| `analysis/acceptance/fixtures/request-boundary-source/results.json`                             | 派生     |
| `analysis/acceptance/fixtures/request-boundary-source/scenario-inputs.json`                     | 原样     |
| `analysis/acceptance/fixtures/request-boundary-source/scenario-results.json`                    | 原样     |
| `analysis/acceptance/fixtures/request-boundary-source/validator-results.json`                   | 派生     |
| `analysis/acceptance/fixtures/t062/README.md`                                                   | 原样     |
| `analysis/acceptance/fixtures/t062/candidate/artifact-spec-analysis/SKILL.md`                   | 原样     |
| `analysis/acceptance/fixtures/t062/results.json`                                                | 派生     |
| `analysis/acceptance/fixtures/t062/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/t063/README.md`                                                   | 原样     |
| `analysis/acceptance/fixtures/t063/results.json`                                                | 派生     |
| `analysis/acceptance/fixtures/t063/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/t064/README.md`                                                   | 原样     |
| `analysis/acceptance/fixtures/t064/results.json`                                                | 派生     |
| `analysis/acceptance/fixtures/t064/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/t066/results.json`                                                | 派生     |
| `analysis/acceptance/fixtures/t066/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/t067/results.json`                                                | 原样     |
| `analysis/acceptance/fixtures/t067/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/t069/results.json`                                                | 原样     |
| `analysis/acceptance/fixtures/t069/source-manifest.json`                                        | 原样     |
| `analysis/acceptance/fixtures/t095/README.md`                                                   | 原样     |
| `analysis/acceptance/fixtures/t095/results.json`                                                | 派生     |
| `analysis/acceptance/fixtures/t095/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/t096/results.json`                                                | 派生     |
| `analysis/acceptance/fixtures/t096/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/t104/results.json`                                                | 派生     |
| `analysis/acceptance/fixtures/t104/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/t105/results.json`                                                | 原样     |
| `analysis/acceptance/fixtures/t105/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/t106/results.json`                                                | 派生     |
| `analysis/acceptance/fixtures/t106/retained.tar.gz`                                             | 派生     |
| `analysis/acceptance/fixtures/trigger-discovery.json`                                           | 派生     |
| `analysis/acceptance/fixtures/tv-02/README.md`                                                  | 原样     |
| `analysis/acceptance/fixtures/tv-04/README.md`                                                  | 原样     |
| `analysis/acceptance/fixtures/tv-05/README.md`                                                  | 原样     |
| `analysis/acceptance/fixtures/tv-06/README.md`                                                  | 原样     |
| `analysis/acceptance/fixtures/tv-07/README.md`                                                  | 原样     |
| `analysis/acceptance/fixtures/tv-10/README.md`                                                  | 原样     |
| `analysis/acceptance/fixtures/tv-10/candidate/implementation-preparation/SKILL.md`              | 原样     |
| `analysis/acceptance/fixtures/tv-10/candidate/implementation-preparation/speckit-hooks.json`    | 原样     |
| `analysis/acceptance/fixtures/tv-10/evidence-index.json`                                        | 原样     |
| `analysis/acceptance/fixtures/tv-10/proposals/T001-approval.json`                               | 原样     |
| `analysis/acceptance/fixtures/tv-10/proposals/T001.md`                                          | 原样     |
| `analysis/acceptance/fixtures/tv-10/proposals/shared-contract-approval.json`                    | 原样     |
| `analysis/acceptance/fixtures/tv-10/retained-round2.tar.gz`                                     | 派生     |
| `analysis/acceptance/fixtures/tv-10/retained-round3.tar.gz`                                     | 派生     |
| `analysis/acceptance/fixtures/tv-10/retained.tar.gz`                                            | 派生     |
| `analysis/acceptance/fixtures/tv-10/round2-results.json`                                        | 原样     |
| `analysis/acceptance/fixtures/tv-10/round3-results.json`                                        | 原样     |
| `analysis/acceptance/implementation-preparation-baseline.md`                                    | 派生     |
| `analysis/acceptance/increment-description-engineering.md`                                      | 原样     |
| `analysis/acceptance/increment-engineering.md`                                                  | 原样     |
| `analysis/acceptance/increment-task-order.md`                                                   | 派生     |
| `analysis/acceptance/managed-migration.md`                                                      | 原样     |
| `analysis/acceptance/mvu-a.md`                                                                  | 原样     |
| `analysis/acceptance/mvu-b.md`                                                                  | 派生     |
| `analysis/acceptance/mvu-governance.md`                                                         | 原样     |
| `analysis/acceptance/mvu-increment.md`                                                          | 原样     |
| `analysis/acceptance/native-extension.md`                                                       | 原样     |
| `analysis/acceptance/phase-1.md`                                                                | 原样     |
| `analysis/acceptance/python-migration.md`                                                       | 原样     |
| `analysis/acceptance/registration-validation.md`                                                | 派生     |
| `analysis/acceptance/request-boundary-source.md`                                                | 派生     |
| `analysis/acceptance/requirements-trace.md`                                                     | 原样     |
| `analysis/acceptance/retired-sources.md`                                                        | 原样     |
| `analysis/acceptance/revision-baseline.md`                                                      | 派生     |
| `analysis/acceptance/script-mount-mvu.md`                                                       | 派生     |
| `analysis/acceptance/skill-portability.md`                                                      | 派生     |
| `analysis/acceptance/spec-analysis.md`                                                          | 原样     |
| `analysis/acceptance/t063-analysis-delivery.md`                                                 | 原样     |
| `analysis/acceptance/t064-analysis-lifecycle.md`                                                | 原样     |
| `analysis/acceptance/t104-preparation-delivery.md`                                              | 原样     |
| `analysis/acceptance/task-decomposition.md`                                                     | 原样     |
| `analysis/acceptance/task-inline.md`                                                            | 原样     |
| `analysis/acceptance/trigger-discovery.md`                                                      | 派生     |
| `analysis/acceptance/tutor-engineering.md`                                                      | 原样     |
| `analysis/acceptance/tv-02-planning.md`                                                         | 派生     |
| `analysis/acceptance/tv-05-mvu-documents.md`                                                    | 原样     |
| `analysis/acceptance/tv-06-description.md`                                                      | 派生     |
| `analysis/acceptance/tv-07-business-delivery.md`                                                | 原样     |
| `analysis/acceptance/tv-10-preparation.md`                                                      | 原样     |
| `analysis/acceptance/us1-shared-foundation.md`                                                  | 派生     |
| `analysis/acceptance/user-shadow.md`                                                            | 摘要     |
| `analysis/baseline-hashes.json`                                                                 | 派生     |
| `analysis/full-remount-design.md`                                                               | 原样     |
| `analysis/implementation-baseline.md`                                                           | 原样     |
| `analysis/issues/2026-11-11-collaboration-conversation.md`                                      | 摘要     |
| `analysis/issues/2026-11-11-implementation-discussion-scope-drift.md`                           | 原样     |
| `analysis/issues/2026-11-12-collection-defaults-and-merge.md`                                   | 原样     |
| `analysis/issues/2026-11-12-spec-follow-up-issue-convention.md`                                 | 原样     |
| `analysis/natural-language-entry-design.md`                                                     | 原样     |
| `analysis/spec-analysis/README.md`                                                              | 原样     |
| `analysis/spec-analysis/flows.md`                                                               | 原样     |
| `checklists/requirements.md`                                                                    | 派生     |
| `collaboration-modes-spec-prompt.md`                                                            | 原样     |
| `contracts/artifacts.md`                                                                        | 原样     |
| `contracts/business-node-delivery.md`                                                           | 原样     |
| `contracts/collaboration-modes.md`                                                              | 原样     |
| `contracts/implementation-preparation.md`                                                       | 原样     |
| `contracts/increment-description.md`                                                            | 原样     |
| `contracts/mvu.md`                                                                              | 派生     |
| `contracts/registration.md`                                                                     | 原样     |
| `contracts/review.md`                                                                           | 原样     |
| `contracts/workflow.md`                                                                         | 原样     |
| `data-model.md`                                                                                 | 原样     |
| `diagrams.md`                                                                                   | 原样     |
| `diagrams/business-flow.md`                                                                     | 原样     |
| `diagrams/logic-flow.md`                                                                        | 原样     |
| `diagrams/state-transitions.md`                                                                 | 原样     |
| `implementation/T060.md`                                                                        | 原样     |
| `implementation/T061.md`                                                                        | 原样     |
| `implementation/T062.md`                                                                        | 原样     |
| `implementation/T063.md`                                                                        | 原样     |
| `implementation/T064.md`                                                                        | 原样     |
| `implementation/T066.md`                                                                        | 原样     |
| `implementation/T067.md`                                                                        | 原样     |
| `implementation/T069.md`                                                                        | 原样     |
| `implementation/T095.md`                                                                        | 原样     |
| `implementation/T096.md`                                                                        | 原样     |
| `implementation/T099.md`                                                                        | 原样     |
| `implementation/T101.md`                                                                        | 原样     |
| `implementation/T102.md`                                                                        | 原样     |
| `implementation/T103.md`                                                                        | 原样     |
| `implementation/T104.md`                                                                        | 原样     |
| `implementation/T105.md`                                                                        | 原样     |
| `implementation/T106.md`                                                                        | 原样     |
| `issue-description.md`                                                                          | 原样     |
| `mvu.md`                                                                                        | 派生     |
| `plan.history.md`                                                                               | 原样     |
| `plan.md`                                                                                       | 原样     |
| `pr-description.md`                                                                             | 原样     |
| `quickstart.md`                                                                                 | 原样     |
| `requirements/README.md`                                                                        | 原样     |
| `requirements/discussions/2026-11-05-collaboration-modes.md`                                    | 派生     |
| `requirements/discussions/2026-11-10-a-md-coverage.md`                                          | 派生     |
| `requirements/discussions/2026-11-10-artifact-organization.md`                                  | 原样     |
| `requirements/discussions/2026-11-10-existing-requirements-review.md`                           | 原样     |
| `requirements/discussions/2026-11-10-logic-navigation.md`                                       | 派生     |
| `requirements/discussions/2026-11-10-t103-validation-design.md`                                 | 原样     |
| `requirements/discussions/2026-11-10-user-shadow-scope.md`                                      | 派生     |
| `requirements/prompts/2026-11-05-workflow-revision.md`                                          | 派生     |
| `requirements/prompts/2026-11-08-increment-planning-description.md`                             | 派生     |
| `requirements/prompts/2026-11-10-implement-first-revision.md`                                   | 派生     |
| `requirements/raw/2026-11-05-workflow-adjustments.md`                                           | 原样     |
| `requirements/raw/2026-11-09-generic-business-delivery-rule.md`                                 | 原样     |
| `requirements/raw/2026-11-10-implement-first-scope.md`                                          | 原样     |
| `requirements/raw/2026-11-10-implementation-discussion-revision.md`                             | 原样     |
| `requirements/raw/2026-11-11-defer-build-validation.md`                                         | 原样     |
| `requirements/raw/2026-11-12-delete-paused-sources.md`                                          | 原样     |
| `requirements/raw/2026-11-12-publishing-mounting-other-session.md`                              | 原样     |
| `requirements/raw/2026-11-12-remove-powershell.md`                                              | 原样     |
| `requirements/raw/2026-11-12-spec-revision-planning-boundary.md`                                | 原样     |
| `research.md`                                                                                   | 派生     |
| `spec.md`                                                                                       | 派生     |
| `tasks.md`                                                                                      | 派生     |
