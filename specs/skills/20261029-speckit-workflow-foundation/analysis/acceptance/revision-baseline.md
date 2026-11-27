# T049 本轮真实基线

采集日期：2026-11-05。对应 [T049](../../tasks.md#t049)、FR-001/032/034，依据 [研究 R22](../../research.md#r22)、[R23](../../research.md#r23)、[R29](../../research.md#r29) 与[历史实施基线](../implementation-baseline.md)。

本记录只描述本轮实际读取与核验的事实。Phase 1 的基线材料已保存，用户阶段验收尚未发生；原 tasks.md 保持原样，工程状态以其为准。本次不进入 T050，不将旧五项或任何未测平台记为新四模式通过。

## 范围与执行边界

用户在了解“先做 T049、每阶段验收后继续”的安排后回复“开始”，本次据此执行 Phase 1。读取两份 Spec/tasks、现行治理、注册器、实际登记及文件清单，只新增本基线并维护本轮对话摘要。未修改 TS/JS/Vue、技能或脚本源码；未执行 pnpm install、真实 nuxt:prepare、安装/卸载、数据库写入、发布或部署。

采用 executing-plans 与 verification-before-completion 的按计划执行及证据核验要求；using-git-worktrees 的只读检测结果为普通 checkout，Git dir 与 common dir 均为 `.git`，当前分支不是 main/master。本 Task 明确要求核查指定工作区现状并保留现有改动，因此在原目录调查，不新建或切换 worktree，不执行依赖初始化。无生产代码修改，test-driven-development 的生产代码红绿步骤本次不适用；本证据记录只保存观察与检查结果，不新增工程 checkbox 或第二套任务状态。

## 仓库与用户改动

- 工作区：`<source-workspace>`。
- 分支：`feature/speckit-workflow-extensions`。
- HEAD：`2861da4fbef9c3e3d94738ab31b2ac5dc15b505a`。
- `.specify/feature.json` 的 feature_directory 为 `specs/skills/20261029-speckit-workflow-foundation`，路径与实际目录匹配。
- 采集时 `git ls-files --stage -z` 输出 SHA-256：`2960a9cbd4a516d88e7b87151fd76e2f3a6b462424cdac3fc2908ab78f254127`；用于核对本次未改暂存区，不能代替工作树字节检查。
- 以下为开始 T049 时实际 `git status --short`。暂存与未暂存的修改、删除均保留；本轮前一轮写入的 R35 对话摘要包含在当时 conversations 的未暂存差异内，不能全部归因于本次或称为干净基线。

```text
MM .specify/integrations/codex.manifest.json
M  .specify/memory/constitution.md
M  .specify/memory/speckit-constitution-prompt.md
A  .specify/memory/user-shadow/conclusions/2026-11-05.md
AM .specify/memory/user-shadow/conversations/2026-11-05.md
A  .specify/memory/user-shadow/profile.md
 M .vscode/extensions.json
M  AGENTS.md
D  skills-publish-spec-prompt.md
M  specs/skills/001-skills-distribution/checklists/requirements.md
A  specs/skills/001-skills-distribution/requirements/prompts/2026-11-05-distribution-revision.md
A  specs/skills/001-skills-distribution/requirements/raw/2026-11-05-workflow-adjustments.md
M  specs/skills/001-skills-distribution/spec.md
M  specs/skills/20261029-speckit-workflow-foundation/checklists/requirements.md
M  specs/skills/20261029-speckit-workflow-foundation/contracts/artifacts.md
M  specs/skills/20261029-speckit-workflow-foundation/contracts/collaboration-modes.md
A  specs/skills/20261029-speckit-workflow-foundation/contracts/registration.md
M  specs/skills/20261029-speckit-workflow-foundation/contracts/review.md
M  specs/skills/20261029-speckit-workflow-foundation/contracts/workflow.md
M  specs/skills/20261029-speckit-workflow-foundation/data-model.md
M  specs/skills/20261029-speckit-workflow-foundation/diagrams.md
M  specs/skills/20261029-speckit-workflow-foundation/plan.md
M  specs/skills/20261029-speckit-workflow-foundation/quickstart.md
A  specs/skills/20261029-speckit-workflow-foundation/requirements/discussions/2026-11-05-collaboration-modes.md
A  specs/skills/20261029-speckit-workflow-foundation/requirements/prompts/2026-11-05-workflow-revision.md
A  specs/skills/20261029-speckit-workflow-foundation/requirements/raw/2026-11-05-workflow-adjustments.md
M  specs/skills/20261029-speckit-workflow-foundation/research.md
M  specs/skills/20261029-speckit-workflow-foundation/spec.md
M  specs/skills/20261029-speckit-workflow-foundation/tasks.md
D  todo-idea-speckit-prompt.md
```

## 工具与平台

通过 Python 标准库 shutil.which 查询命令位置，再以 subprocess.run 执行实际版本参数，输出与退出码已读取：

| 工具/平台         | 本次输入或来源           | 实际结果与限制                                                                    |
| ----------------- | ------------------------ | --------------------------------------------------------------------------------- |
| Linux             | platform.platform()      | Linux 6.18.54.1-microsoft-standard-WSL2，x86_64，glibc 2.43；仅该环境参与本次核查 |
| Node              | node --version           | v24.22.2，退出 0                                                                  |
| pnpm              | pnpm --version           | 12.16.1，退出 0                                                                   |
| Bash              | bash --version           | 5.3.9(1)-release，退出 0                                                          |
| Python            | python3 --version        | 3.15.2，退出 0                                                                    |
| uv                | uv --version             | 0.13.6，退出 0                                                                    |
| PowerShell        | shutil.which('pwsh')     | 无结果；未运行 pwsh 版本命令或 PowerShell 脚本                                    |
| Specify PATH 入口 | shutil.which('specify')  | 无结果；未安装新入口，另用已存在缓存实测官方 CLI                                  |
| Specify 官方缓存  | 下方 version --json 命令 | cli_version=1.2.6，Python 3.15.2，退出 0；仅版本查询，不表示挂载行为通过          |
| Windows/macOS     | 当前无对应执行环境       | 未执行两平台命令或脚本，历史 Linux PowerShell 结果不代表本机当前可用              |
| 最低 Node 运行时  | 本次仅有 v24.22.2 实测   | 未做最低版本兼容检查                                                              |
| 公开来源          | 本次未访问远端           | 不计入公开安装、独立使用者或完整矩阵验收                                          |

官方缓存查询实际执行：

```bash
<source-home>/.cache/uv/archive-v0/SqGODpu5AOSLHtlR/bin/python -B <source-home>/.cache/uv/archive-v0/SqGODpu5AOSLHtlR/bin/specify version --json
```

该路径是研究 R22 已记录且本次重新核对存在的本机缓存。先读取 command_version.py 确认此命令收集本地版本；使用 -B 避免生成 Python 字节码，不通过 uvx 下载、安装或刷新缓存。METADATA 另行核对 Name=specify-cli、Version=1.2.6、Requires-Python>=3.11；元数据与实际 CLI 输出相符。缓存路径只作本机证据，不写入交付脚本或通用技能。

FOUNDRY_SPECIFY_VERSION 当前未设置。Bash/PowerShell 注册源码均以 1.2.6 为默认；`.specify/init-options.json` 的 speckit_version、`.specify/integration.json` 的 version 和 Codex 安装清单 version 均为 1.2.6。旧 agy/kimi 安装清单仍存在，其版本分别为 1.0.8.dev0、1.2.4.dev0；integration.json 当前仅声明 codex，不据旧清单声称其他集成正在使用或已验收。

## 治理与任务事实

现行[章程](../../../../../.specify/memory/constitution.md)为 4.0.0，已含业务 MVU 与技术前置、原 Task 内联步骤及仓库影子记录；开头 Sync Impact Report 记录 3.0.0 到 4.0.0 的独立修订。章程提示词和 AGENTS 的先行更新已在工作树，来源与范围由对话 R33（原仓库私有记录，未迁移）记录。本次只确认存在与当前版本，三份正文一致性复核及用户阶段验收仍归 T050。

对正式任务行 `^- \[([ xX])\] (T\d+)` 的只读解析结果如下；完整原行保存在附录中，不改原 ID、验收与勾选。

| 范围                | 任务数 | 已勾选 | 未勾选 | 本次处理                                                                |
| ------------------- | ------ | ------ | ------ | ----------------------------------------------------------------------- |
| 主线历史 T001～T048 | 48     | 20     | 28     | 保留完整历史；撤回/替代关系以主线当前替代表为准，不把 28 项直接排回待办 |
| 主线当前 T049～T080 | 32     | 0      | 32     | 本次仅准备 T049 基线及阶段验收材料，不自动推进 T050                     |
| 分发 T001～T041     | 41     | 6      | 35     | 保留既有完成事实；旧 T006 等做法由主线 T074 同步后承接                  |

主线历史已完成 ID：T039, T040, T041, T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T031, T032, T033, T034, T035, T036, T037。

分发已完成 ID：T001, T002, T003, T004, T005, T041。

本次用 pathlib.rglob 实际扫描两个 `specs/skills` 目录下的 sub-task、subtasks、sub-tasks、Tnnn-Snnn/Tnnn-Unnn 目录，以及 state.json，均未发现。此结论限本次扫描范围，不宣称已迁移历史子任务，不以旧基线的临时样例路径充当当前真实记录。未发现目标范围的嵌套 AGENTS.md。

## 源码、挂载副本与登记

实际公开入口文件为 `packages/skills/script/index.mjs`。两个平台模块位于同目录 install-skills、mount-entry、register-hooks、register-commands；本次只读，不调用业务入口。工作区 `scripts/dev/actions/register-hooks/` 为平台注册模块的路径包装，`scripts/dev/actions/link-skills/` 按名称复制分类技能；没有 `scripts/dev/actions/register-commands/`，真实指令注册模块在 packages/skills/script/register-commands。nuxt-prepare 两平台文件实际引用该路径，不能沿旧目录猜测调用点。

线下源 `packages/skills/src/skills/` 当前含 19 个技能，逐文件路径集合与 SHA-256 对比 `.agents/skills/<名称>/`，19 组全部一致，没有额外、缺失或不同字节文件。这里覆盖 coding、frontend、workflow 和内部 eval 的现有源；不把内部 eval 视为公开分发范围。

| 模式    | 来源目录（workflow 下） | link 副本                   | 官方扩展副本                                  | 生成入口                             |
| ------- | ----------------------- | --------------------------- | --------------------------------------------- | ------------------------------------ |
| Tutor   | task-tutor              | .agents/skills/task-tutor   | .specify/extensions/modes/skills/task-tutor   | .agents/skills/speckit-modes-tutor   |
| Pair    | task-pair               | .agents/skills/task-pair    | .specify/extensions/modes/skills/task-pair    | .agents/skills/speckit-modes-pair    |
| Review  | task-review             | .agents/skills/task-review  | .specify/extensions/modes/skills/task-review  | .agents/skills/speckit-modes-review  |
| Explore | task-explore            | .agents/skills/task-explore | .specify/extensions/modes/skills/task-explore | .agents/skills/speckit-modes-explore |
| Guide   | task-guide              | .agents/skills/task-guide   | .specify/extensions/modes/skills/task-guide   | .agents/skills/speckit-modes-guide   |

来源根为 `packages/skills/src/skills/workflow/`，表中每个目录实际仅含 SKILL.md。五份官方扩展副本均与来源字节一致，五份生成入口均含原技能正文（生成入口自身的元数据不按源文件全文相同判断），未发现这些目录内的额外附件。后续迁移前仍须重新清点；本次无额外附件不证明将来卸载可无条件删除。

task-direct、task-increment、artifact-spec-analysis 的源目录当前不存在；生成的 speckit-modes-direct、speckit-modes-increment 目录也不存在。两平台注册器的模式集合仍为 tutor/pair/review/explore/guide，四项改造尚未实施。

原生 `.agents/skills/speckit-implement/SKILL.md` 的实际 SHA-256 为 `848a5c9eff7b99e348927cbde6c35378de9fea3fd317941f58fa0b0b79301eec`，与当前 Codex 安装清单 files 对应值一致。本次未修改或执行该技能，安装字节匹配不能代替 T071 的跨模式实测。

## 七个 hooks 扩展与五项 modes 登记

使用 skills 包已安装的 yaml 解析器解析 `.specify/extensions.yml` 与 modes/extension.yml，使用 JSON.parse 读取 `.specify/extensions/.registry`；未新增依赖。extensions.yml 的 installed 与 registry.extensions 键集合一致：modes 加七个 hooks 扩展，共 8 个。modes 的 registered_commands.codex 和 registered_skills 均为旧五项，声明 requires.speckit_version 为 ==1.2.6。

七个 hooks 来源分别为 artifact-issue-description、artifact-pr-description、mvu-gate、artifact-business-flow、artifact-logic-flow、explainer-doc-sync、artifact-project-description。每项来源与 link 副本均有 SKILL.md、speckit-hooks.json；官方扩展副本同样存在。注册器仍固定列出这七项。新 artifact-spec-analysis 未登记，六项旧 hooks 尚未退役。

配置当前有 12 条 hooks，全部 enabled=true、condition=null，command 与同一行 extension 相同，auto_execute_hooks=true：

| 事件             | 扩展/command                 | optional | priority |
| ---------------- | ---------------------------- | -------- | -------- |
| after_specify    | artifact-issue-description   | 否       | 20       |
| after_clarify    | artifact-pr-description      | 否       | 20       |
| before_plan      | mvu-gate                     | 否       | 10       |
| after_plan       | mvu-gate                     | 否       | 10       |
| after_plan       | artifact-business-flow       | 否       | 20       |
| before_tasks     | mvu-gate                     | 否       | 10       |
| after_tasks      | mvu-gate                     | 否       | 10       |
| after_tasks      | artifact-logic-flow          | 否       | 20       |
| before_implement | mvu-gate                     | 否       | 10       |
| before_implement | explainer-doc-sync           | 是       | 20       |
| after_implement  | explainer-doc-sync           | 否       | 20       |
| after_converge   | artifact-project-description | 否       | 20       |

本表是现有登记快照，不执行其中任何 hook；本次未调用原生 implement 或 tasks 入口，不将旧门禁规则当作本轮治理来源。目标 after_tasks 综合分析及 Increment 显式复用行为均待实施。

## 保护快照与核查办法

附录保存 360 个文件的完整仓库相对路径及 SHA-256，包含源码、脚本、测试、挂载副本、官方登记/扩展副本、两个 Spec、历史 atomic-skills 材料、初始化脚本、相关治理和用户已有配置改动。排除 node_modules、dist、Python 缓存；不扫描 secrets 或读取 .env。文件清单本身按路径排序，以每行“摘要、两个空格、相对路径”加换行序列化，SHA-256 为 `0a199318a3fa739082d838d393aa453387777b68cf91b54497fbc79e3cf90ec8`。

原始采集辅助文件位于 `/tmp/foundry-t049-jrw5bf61/`，snapshot.json 保存初始状态与索引摘要，registration.json、copies.json、mode-copies.json 保存只读解析结果。临时目录可被清理，持久核对以本文件附录、原 tasks 及正式登记为准，不把 /tmp 当作任务状态或唯一证据。

核查步骤为：对附录每行路径重新计算 SHA-256；核对登记和源/副本清单；比较两份 tasks 原行、历史区及原始字节；比较 git ls-files --stage -z 摘要；对初始 status 中的删除项重新确认仍不存在。本基线文件自身不纳入其初始快照，后续对话摘要写入也不应冒充受保护源码变化。

## 验证记录与待验收边界

- 版本查询、YAML/JSON 解析、19 组源/副本比对、五个 modes 扩展/生成正文核对、原生 Implement 清单核对、任务数量和真实子任务目录扫描均已实际运行，结果见上文。
- 初次查询旧候选 `scripts/dev/actions/register-commands/` 和 `.codex/skills/` 返回不存在；后续已定位真实位置。本次将缺路径记为调查事实，不以搜索命令退出非零声称工程测试失败或功能通过。
- 本文件保存后立即运行 `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/revision-baseline.md`，结果须以本轮实际输出及最终读回为准。
- 最终重新核对附录哈希、两份 tasks 原始行、暂存区摘要、文件集合及本文件相对链接；结果记录在本节后续实际核验补记中，不预写通过。
- 未运行 `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`、同前缀 check-types、build、test/test:distribution；本次无代码变更，任务要求只做基线及 Markdown 验证。这些工程能力尚未复验，旧记录不能证明当前全包通过。
- 未运行 PowerShell 脚本（pwsh 不在 PATH）、Windows/macOS 脚本（无对应环境）、最低 Node 矩阵（未配置对应运行时）、真实公开源安装（本阶段不访问远端）。相应兼容性与安装行为均保留未测，不影响本次只读调查如实提交。
- 目前没有用户 Phase 1 验收通过或进入 Phase 2 的事实。[FR-036](../../spec.md)要求“只有用户明确确认验收通过并继续后，才可进入下一阶段”；提交基线后停在该检查点，后续是 T050 治理复核。

### 本轮实际核验补记

本文件首次 Markdown ESLint 修复退出 0。随后实际运行 Python 标准库只读断言，退出 0：360 个受保护文件的 SHA-256 全部保持，两个 Spec 共 121 条原任务行逐行一致，附录原行与实际 tasks 匹配；8 个相对链接及所带锚点有效，索引摘要未变，原已删除文件仍不存在。重新枚举采集目录的完整文件集合，仅新增本基线文件；七个 hooks 的官方扩展副本与来源逐文件一致。核验输出保存于本机临时 verification.json，关键结果在此持久保存。

T049 的“只读源码、任务”约束保持：本轮没有改两份 tasks 或 spec 的计数与正文，没有把材料自检当作用户阶段批准。工程状态维护仍在原 tasks，待本阶段真实验收后按既定规则处理；当前提交的是可审阅基线，不进入 T050。此补记与当轮对话摘要写完后，再执行 Markdown ESLint、读回及最终保护核查，最终结论以实际输出为准。

## 附录：采集时原任务行

只保留采集时的原行以核验未改写，不作为可维护工程清单；实际状态以对应 tasks.md 为准。

来源：specs/skills/20261029-speckit-workflow-foundation/tasks.md

```text
- [ ] T049 核对本轮真实基线并保存 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/revision-baseline.md
- [ ] T050 复核已落地的 4.0.0 治理并完成阶段验收于 .specify/memory/constitution.md、.specify/memory/speckit-constitution-prompt.md 与 AGENTS.md
- [ ] T051 [US1] 核验原 Task 内联细化与保存续接于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/task-inline.md
- [ ] T052 [US8] 完成 TV-02 最小 Increment 规划骨架与 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/tv-02-planning.md
- [ ] T053 [US8] 在 packages/skills/src/skills/workflow/task-increment/SKILL.md 增量完善业务闭环与关联范围
- [ ] T054 [US8] 核验 Increment 工程分支并追加 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/increment-engineering.md
- [ ] T055 [US6] 将 packages/skills/src/skills/workflow/task-explore/SKILL.md 迁移并重写为 task-direct
- [ ] T056 [US6] 核验 Direct 顺序、依赖与恢复于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/direct-engineering.md
- [ ] T057 [US3] 重构 packages/skills/src/skills/workflow/task-tutor/SKILL.md 的单 Task 导师流程
- [ ] T058 [US3] 验证 Tutor 单 Task 边界于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/tutor-engineering.md
- [ ] T059 [US3] 补齐知识片段与报告规则于 packages/skills/src/skills/workflow/task-tutor/references/learning-report.md
- [ ] T060 [US9] 维护真实摘要与有效结论于 .specify/memory/user-shadow/ 的既有记录
- [ ] T061 [US9] 核查画像更正与恢复读取于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/user-shadow.md
- [ ] T062 [US10] 完成 TV-03 分析技能双触发骨架于 packages/skills/src/skills/workflow/artifact-spec-analysis/SKILL.md
- [ ] T063 [US10] 增量完善六类综合分析于 packages/skills/src/skills/workflow/artifact-spec-analysis/SKILL.md
- [ ] T064 [US10] 验证创建与刷新并生成 specs/skills/20261029-speckit-workflow-foundation/analysis/spec-analysis/README.md
- [ ] T065 [US4] 修正 Pair 对新 Task 治理的引用于 packages/skills/src/skills/workflow/task-pair/SKILL.md
- [ ] T066 [US2] 完成 TV-01 四模式与六 hooks 退役最小骨架于 packages/skills/script/register-commands/ 和 register-hooks/
- [ ] T067 [P] [US2] 沿 TV-01 骨架完善 Bash 注册器于 packages/skills/script/register-commands/register-commands.sh 与 register-hooks/register-hooks.sh
- [ ] T068 [P] [US2] 沿 TV-01 骨架完善 PowerShell 注册器于 packages/skills/script/register-commands/register-commands.ps1 与 register-hooks/register-hooks.ps1
- [ ] T069 [US2] 删除八项退役技能源并核对消费引用于 packages/skills/src/skills/workflow/
- [ ] T070 [US2] 同步既有分发核验集合于 packages/skills/script/mount-entry/ 与对应测试
- [ ] T071 [US2] 验证完整刷新顺序与交付于 packages/skills/tests/ 及 scripts/dev/nuxt-prepare/
- [ ] T072 [US2] 执行一次性真实受管迁移并保存 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/managed-migration.md
- [ ] T073 [US2] 核验独立同版消费于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/independent-consumption.md
- [ ] T074 同步消费方规划与指南于 specs/skills/001-skills-distribution/plan.md、tasks.md 及相关契约
- [ ] T075 完成 E1 工程移交审阅于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/engineering-handoff.md
- [ ] T076 [US8] 在真实分发 Task 验收 Increment 并回链 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/increment-behavior.md
- [ ] T077 [US3] 在真实分发 Task 验收 Tutor 并回链 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/tutor-behavior.md
- [ ] T078 [US3] 共同整理学习报告并保存 personal-hub 既有草稿于 apps/personal-hub/content/blog/
- [ ] T079 [US6] 在后续基础业务 Spec 验收 Direct 并回链 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/direct-behavior.md
- [ ] T080 回填主线最终覆盖与结案条件于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/revision-summary.md
- [x] T039 将模式专项交付断言改为新两模式于 `packages/skills/tests/test_manifest.py`（依赖 实施前一致性分析与本阶段启动确认）
- [x] T040 [US6] 实现独立 Explore 技能于 `packages/skills/src/skills/workflow/task-explore/SKILL.md`（依赖 T039）
- [x] T041 [US7] 实现独立 Guide 技能于 `packages/skills/src/skills/workflow/task-guide/SKILL.md`（依赖 T039）
- [ ] T042 统一五指令的官方全量重装（依赖 T040、T041；本轮用户已明确实施方式）
- [ ] T043 验证简化安装脚本及构建交付（依赖 T042）
- [ ] T048 统一验收五指令官方重装与重复入口清理（依赖 T042、T043）
- [ ] T044 [US6] 独立验收 Explore 并保存 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/us6-explore.md`（依赖 T043、T048 统一验收）
- [ ] T045 [US7] 独立验收 Guide 并保存 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/us7-guide.md`（依赖 T043、T048 统一验收）
- [ ] T038 [US1] 核查新模式标准拆分及失败保护，追加 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/task-decomposition.md`（依赖 T037、T043、T048 统一验收）
- [ ] T046 [US1] 核查新两模式切换、任务隔离与门禁于 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/collaboration-modes-integration.md`（依赖 T043、T044、T045、T038）
- [ ] T047 汇总追加范围覆盖与分发续接条件于 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/collaboration-modes-summary.md`（依赖 T043、T044、T045、T038、T046）
- [x] T001 复核设计与活动调用基线，建立隔离验收样例于 `specs/skills/20261029-speckit-workflow-foundation/analysis/implementation-baseline.md`（无前置任务）
- [x] T002 补齐包内验证入口与新增 helper 的检查范围于 `packages/skills/package.json`、`packages/skills/eslint.config.ts`（依赖 T001）
- [x] T003 先编写共享状态失败与恢复契约测试于 `packages/skills/tests/test_workflow_state.py`（依赖 T002）
- [x] T004 完成 MVU-A 持久化骨架于 `packages/skills/src/speckit/workflow-task-context/references/state.py`（依赖 T003）
- [x] T005 完成 MVU-B 最小模式交接骨架于 `packages/skills/src/speckit/workflow-task-context/SKILL.md`、`packages/skills/tests/test_workflow_integration.py`（依赖 T004）
- [x] T006 同步章程及宪章提示词（依赖 T005（仅历史阶段完成），当前用户修订授权）
- [x] T007 同步目录记录契约并清理废弃试制依赖（依赖 T006）
- [x] T008 更新五个分类产物生产者（依赖 T006）
- [x] T009 同步分类 hooks 和隔离注册测试（依赖 T006、T008）
- [x] T010 独立验收 US1 并保存证据（依赖 T007、T009）
- [x] T031 [US1] 将通用技能规则与工具挂载分离（依赖 T006～T010；用户 FR-037 架构修订授权）
- [x] T032 [US1] 移除治理提示词技能并修正协作模式与任务归属（依赖 T031；用户本轮修订授权）
- [x] T033 [US1] 用原生 extension add 安装三种协作模式并移除自定义路由（依赖 T032；用户最新原生扩展接入授权）
- [x] T034 [US1] 兼容技能直接接入原生扩展，删除 commands 包装层（依赖 T033）
- [x] T035 [US1] 固定公共规则与真实交付回归检查于 `packages/skills/tests/test_manifest.py`（依赖 T034、本轮方案审阅）
- [x] T036 [US1] 让普通对话及三种模式读取宪章规则于 `AGENTS.md`、`packages/skills/src/skills/workflow/task-tutor/SKILL.md` 等现有入口（依赖 T035）
- [x] T037 [US1] 构建并通过官方 CLI 更新三个实际入口，核对 `packages/skills/extension.yml` 与受管安装产物（依赖 T036）
- [ ] T011 [US2] 先固定旧安装升级与受保护项回归断言于 `scripts/dev/actions/link-skills/test-link-skills.mjs`、`scripts/dev/actions/register-hooks/test-register-hooks.mjs`（依赖 T010）
- [ ] T012 [US2] 完成 MVU-C 两平台定向退役骨架于 `scripts/dev/actions/link-skills/link-skills.sh`、`scripts/dev/actions/register-hooks/register-hooks.sh` 及对应 `.ps1`（依赖 T011）
- [ ] T013 [P] [US2] 激活旧技能退役与 Implement 交接于 `packages/skills/src/speckit/explainer-doc-sync/SKILL.md`、`.specify/extensions.yml`（依赖 T012）
- [ ] T014 [P] [US2] 同步历史替代说明与现行入口文档于 `packages/skills/README.md`、`AGENTS.md`、`specs/skills/20261029-speckit-workflow-foundation/analysis/legacy-compatibility.md`（依赖 T012）
- [ ] T015 [US2] 独立回归原生 Implement/MVU 与历史保留于 `packages/skills/tests/test_workflow_integration.py`、`specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/us2-retirement.md`（依赖 T013、T014）
- [ ] T016 [US3] 先固定 Tutor 单会话、逐轮保存与归档约束于 `packages/skills/tests/test_workflow_state.py`、`packages/skills/tests/test_workflow_integration.py`（依赖 T015）
- [ ] T017 [P] [US3] 完善 Tutor 会话、单元及不可覆盖归档于 `packages/skills/src/speckit/workflow-task-context/references/state.py`（依赖 T016）
- [ ] T018 [P] [US3] 完善逐轮教学与用户实践流程于 `packages/skills/src/speckit/speckit-tutor/SKILL.md`、`packages/skills/src/speckit/speckit-tutor/references/teaching.md`（依赖 T016）
- [ ] T019 [US3] 完成 Tutor 真实生命周期与失败恢复演练于 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/us3-tutor.md`（依赖 T017、T018）
- [ ] T020 [US4] 先固定 Pair 局部授权、步骤审查与恢复测试于 `packages/skills/tests/test_workflow_state.py`、`packages/skills/tests/test_workflow_integration.py`（依赖 T019）
- [ ] T021 [P] [US4] 完善 Pair 进度与授权状态校验于 `packages/skills/src/speckit/workflow-task-context/references/state.py`（依赖 T020）
- [ ] T022 [P] [US4] 完善用户主写与逐步审查指令于 `packages/skills/src/speckit/speckit-pair/SKILL.md`、`packages/skills/src/speckit/speckit-pair/references/review-step.md`（依赖 T020）
- [ ] T023 [US4] 完成 Pair 两轮审查与权限演练于 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/us4-pair.md`（依赖 T021、T022）
- [ ] T024 [US5] 先固定文章逐篇审批、原地写入与失败恢复测试于 `packages/skills/tests/test_review_write.py`（依赖 T023）
- [ ] T025 [US5] 完成 MVU-D 文章安全写入与本地草稿骨架于 `packages/skills/src/speckit/workflow-task-context/references/article.py`（依赖 T024）
- [ ] T026 [US5] 完善主题去重、研究与双确认流程于 `packages/skills/src/speckit/speckit-review/SKILL.md`、`packages/skills/src/speckit/speckit-review/references/article-quality.md`（依赖 T025）
- [ ] T027 [US5] 完成复盘去重、部分批准与文章恢复演练于 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/us5-review.md`（依赖 T026）
- [ ] T028 [P] 完成全模式真实联调与状态故障回归于 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/cross-mode-e2e.md`（依赖 T027）
- [ ] T029 [P] 执行包构建、真实 manifest 消费与平台回归并记录于 `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/validation-commands.md`（依赖 T027）
- [ ] T030 收尾同步运行指南与验收结论于 `specs/skills/20261029-speckit-workflow-foundation/quickstart.md`、`specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance-summary.md`（依赖 T028、T029）
```

来源：specs/skills/001-skills-distribution/tasks.md

```text
- [x] T001 记录现有消费者、环境与文件基线，落点 `specs/skills/001-skills-distribution/analysis/acceptance/baseline.md`。
- [x] T002 接入MVU测试入口与构建工具声明，落点 `packages/skills/package.json`。
- [x] T003 验证MVU-A：官方发现、投影与路径，落点 `packages/skills/tests/distribution/mvu-a.mjs`。
- [x] T004 验证MVU-B：下载与逐项提交（本轮仅 Linux），落点 `packages/skills/tests/distribution/mvu-b.mjs`。
- [x] T005 验证MVU-C：独立第二步与实际文件核验，落点 `packages/skills/tests/distribution/mvu-c.mjs`。
- [x] T041 实现并验证唯一 Node 入口，落点 `packages/skills/script/index.mjs`。
- [ ] T006 验证MVU-D：五指令重装、所选钩子与实际派发，落点 `packages/skills/tests/distribution/mvu-d.mjs`。
- [ ] T007 验证MVU-E：Git精确排除边界，落点 `packages/skills/tests/distribution/mvu-e.mjs`。
- [ ] T008 验证MVU-F：单次构建独立交付与范围内消费，落点 `packages/skills/tests/distribution/mvu-f.mjs`。
- [ ] T009 [US1] 补齐官方交付的契约与错误输入测试，落点 `packages/skills/tests/distribution/official-contract.test.mjs`。
- [ ] T010 [P] [US1] 定义发布与技能模型和构建期校验，落点 `packages/skills/build/distribution/models.ts`。
- [ ] T011 [P] [US1] 固化79个agent路径和scope适配，落点 `packages/skills/distribution/agents.json`。
- [ ] T012 [US1] 将完整目录、投影和清单接入正式构建，落点 `packages/skills/build/distribution/export.ts`。
- [ ] T013 [US1] 实现官方安装前只读选择和冲突检查，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。
- [ ] T014 [US1] 交付官方四粒度说明和两步入口边界，落点 `packages/skills/distribution/README.md`。
- [ ] T015 [US1] 验收官方完整目录交付MVP，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us1.md`。
- [ ] T016 [US2] 补齐下载入口、冲突与恢复测试，落点 `packages/skills/tests/distribution/install-contract.test.mjs`。
- [ ] T017 [US2] 完善同版本材料下载和完整性校验，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。
- [ ] T018 [US2] 实现归属收据与安全逐技能提交，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。
- [ ] T019 [US2] 交付Bash与PowerShell安装四件套，落点 `packages/skills/script/install-skills/install-skills.sh`。
- [ ] T020 [US2] 实现阶段报告、退出码与续接提示，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。
- [ ] T021 [US2] 验收双入口内容等价与安装恢复，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us2.md`。
- [ ] T022 [US3] 补齐挂载范围、前置条件及原生冲突测试，落点 `packages/skills/tests/distribution/mount-contract.test.mjs`。
- [ ] T023 [P] [US3] 实现本次集合与统一挂载环境核验，落点 `packages/skills/script/mount-entry/mount-entry.{sh,ps1}`。
- [ ] T024 [P] [US3] 完善钩子映射与五指令输入衔接，落点 `packages/skills/src/skills/workflow/<技能>/speckit-hooks.json`。
- [ ] T025 [US3] 完善独立 hook 平台安装及官方重装，落点 `packages/skills/script/register-hooks/register-hooks.sh`。
- [ ] T026 [US3] 交付并复用既有五指令安装脚本，落点 `packages/skills/script/register-commands/register-commands.sh`。
- [ ] T027 [US3] 接通公共入口、官方第二步与curl自动挂载，落点 `packages/skills/script/mount-entry/mount-entry.sh`。
- [ ] T028 [US3] 验收三平台原生挂载与实际技能派发，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us3.md`。
- [ ] T029 [US5] 补齐发布可复现与搬离源码的验收测试，落点 `packages/skills/tests/distribution/release-contract.test.mjs`。
- [ ] T030 [P] [US5] 完善发布前校验和完整迁移产物，落点 `packages/skills/build/distribution/verify.ts`。
- [ ] T031 [P] [US5] 完善维护者迁移与外部使用文档，落点 `packages/skills/README.md`。
- [ ] T032 [US5] 在真实公开来源完成独立使用者验收，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us5-remote.md`。
- [ ] T033 [US4] 补齐精确隐匿与范围限制测试，落点 `packages/skills/tests/distribution/hidden-contract.test.mjs`。
- [ ] T034 [US4] 实现精确exclude写入与效果核验，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。
- [ ] T035 [US4] 接入安装前后隐匿结果与限制说明，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。
- [ ] T036 [US4] 验收Git隐匿的独立用户流程，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us4.md`。
- [ ] T037 运行完整工程检查和原消费者回归，落点 `specs/skills/001-skills-distribution/analysis/acceptance/regression.md`。
- [ ] T038 完成三平台全agent矩阵及真实远端复验，落点 `specs/skills/001-skills-distribution/analysis/acceptance/matrix.md`。
- [ ] T039 同步最终文档、接口示例与图表，落点 `packages/skills/distribution/README.md`。
- [ ] T040 汇总交付证据并核对原T038范围边界，落点 `specs/skills/001-skills-distribution/analysis/acceptance/distribution.md`。
```

## 附录：受保护文件 SHA-256

```text
11519bdc1a29937bf455692795c4650b5b54160829b4d7f1d046ab1e607c5d8b  .agents/skills/artifact-business-flow/SKILL.md
ac08f7a4009b3b94cc557baf03b1c91988e53bbf425033a9ca016e79aa485593  .agents/skills/artifact-business-flow/speckit-hooks.json
172fb59dfbff15f7830da37a5fe742b13eb45bb30a4493a836e33dfebfb656bb  .agents/skills/artifact-issue-description/SKILL.md
8c910d0b86dc49732e5e136c551eb9670d9c74bfd8d924cb740d9c75e304e018  .agents/skills/artifact-issue-description/speckit-hooks.json
3fb17a5f80136b18e8054053b5a171b7503e0653f368df7434ddc696f4406323  .agents/skills/artifact-logic-flow/SKILL.md
a263ba74db39bcdd8594e724d20496dee10906fb642603bb4f377b2980bfca03  .agents/skills/artifact-logic-flow/speckit-hooks.json
bfe7883a7c4c8faa27c12da84fbccae67a1e4c347f9bf00d2480cebd217c1b2c  .agents/skills/artifact-pr-description/SKILL.md
0574ba556a4db4f3db69d400ebe8af55944973390835e436cf92f5939bae5771  .agents/skills/artifact-pr-description/speckit-hooks.json
68aa274a0649da3a16eca2df56403564ac6f948f9bff5368c5c58825e02053ac  .agents/skills/artifact-project-description/SKILL.md
50c09745afcfc85c958b1bea377d8390fca9a954a25478f183607d07339ac715  .agents/skills/artifact-project-description/speckit-hooks.json
ad19b3aff08b3d448e43feb46fbcf56d009eec57105935436557434603adebc6  .agents/skills/bug-report/SKILL.md
049b5d4f7e8b68f759d14f5ca98d13e94984731efef276f5c21b6c6258e1dacc  .agents/skills/document-changed-symbols/SKILL.md
817c590ca9b7324eaf37c8aa4560b301f32d8395b052c5f844c62deff79e3038  .agents/skills/document-changed-symbols/references/test-prompts.md
fc4b394ad3cbdb20ed414c4174df47f5abf9bb007d50c82bb180fbbc8cea5772  .agents/skills/eval-short-rule/SKILL.md
efb66c7dc0a9316ef8463c47f74117c85f0b1fc27ca2e95c95b45f809b2f6ff3  .agents/skills/eval-with-reference/SKILL.md
7e11c215de84328cef54f777ea20d1375d0c9b6ab37e3efe136ba470d6560a32  .agents/skills/eval-with-reference/references/contracts.md
a7497c13c5be0fd68a088b71a7a7a6aca235a4e03cb71d5354771a75d6798fd5  .agents/skills/eval-workflow-guide/SKILL.md
d8709298aa0ef9ead88147bd880588093d8c8fd3cfb639beabfb766acffba780  .agents/skills/explainer-doc-sync/SKILL.md
fea9c91b435b64f4b96bea0e00577411b81ec1f394f9264c14a438546de6c79a  .agents/skills/explainer-doc-sync/speckit-hooks.json
ea3cff0ae2bd7acf9e7ae757354c52e3b371d293ba7f8d95d09f3656dff19fbc  .agents/skills/mvu-gate/SKILL.md
b520364d27ed2262a99c7c68a45a783177b1d44a58c930c89ae522901628f4ed  .agents/skills/mvu-gate/speckit-hooks.json
0fb02df099d6751f65e83f3d8a3945340114eefc8b6718e220af118ce3a99735  .agents/skills/nuxt-ui-styling/SKILL.md
417c746d59a4a9f7f68976a884ab6d196266304118c102c959e10b752c5fede2  .agents/skills/nuxt-ui-styling/references/attribute-conflicts.md
6f47315857912ea6a1c5989b022e0eb45535e2a860748df29eb9370ca2957dac  .agents/skills/nuxt-ui-styling/references/rule-verification.md
98f11149fc566b2826c15f1ce78b031bdd0476413b35b22bd0edb6df02ddb95e  .agents/skills/nuxt-ui/SKILL.md
9648870284476354c4073f559c8892c670f67ecfed8a43af2ae7e8c0cca75526  .agents/skills/nuxt-ui/references/components.md
b4a7bd45aad3376848eca5a2b872365c0224bf06623f9453ce4f6a4d253f811c  .agents/skills/nuxt-ui/references/guidelines/component-selection.md
3c9f73e7bf6625af90f457494282dc94db005d50a6e56086ca91da7cf31f2316  .agents/skills/nuxt-ui/references/guidelines/conventions.md
e6e42bd531f82fcc6ed4375edc704b4f7d19ae0d63fde52f0f418e5b6564ade6  .agents/skills/nuxt-ui/references/guidelines/design-system.md
2d98511a0c12729cb7ffbe75913fd71ad33c0dadc1936489a98891e1d5feefab  .agents/skills/nuxt-ui/references/guidelines/forms.md
fb089e1ca50b142b4242309847364d9b594aba6769d6883128aaef7b645bc9c9  .agents/skills/nuxt-ui/references/layouts/chat.md
fee6235a7cc3b08d2a2344d6980763c6613a8201ebf6c37998b4467443263e57  .agents/skills/nuxt-ui/references/layouts/dashboard.md
761190a26517a3084a7cabd673a84b040766ce15c6ae53378ab4519e3b419510  .agents/skills/nuxt-ui/references/layouts/docs.md
7bc96dd3b88e97adc70a8f124a46c256e36dccf17c0e1233bf88238f10d18d8d  .agents/skills/nuxt-ui/references/layouts/editor.md
c9732e93e82e9d9fb95d5d7e21e1104797ab19d8f66c244a1362862c307cefca  .agents/skills/nuxt-ui/references/layouts/landing.md
85721c3eac6d9d7ad5a882b9f7e124ba4ffc7368e5d8c3e06342017a1276fad0  .agents/skills/nuxt-ui/references/recipes/auth.md
bad64265045f212cdf18d73b6cef358779db1a9ad2e7903200a9a74dd05da525  .agents/skills/nuxt-ui/references/recipes/data-tables.md
5c6a7ee61a6938596c12800e2647dec7e72dbc2c1149c84ee3cd9c4aee15755b  .agents/skills/nuxt-ui/references/recipes/navigation.md
109556d0a67687312bc3e462ed1b921cd0356309bfc07eef527c3ca4fc780063  .agents/skills/nuxt-ui/references/recipes/overlays.md
0b3261b13cc33537f24b3e1f6d5320694c348302c385d0046dc6b958cf2db6cb  .agents/skills/speckit-analyze/SKILL.md
7ac5cba31a27151a1a7b73f691bd478d42750ce2dd734701a07eb0e235ffbd94  .agents/skills/speckit-checklist/SKILL.md
f6acfbc82c96c0d91b2429fd0b51ce7df7f94b003d1b73acc54470d48bcc455e  .agents/skills/speckit-clarify/SKILL.md
b2a6a979ef7511812b60cde4adb6f1c4a8b1b57314ea2f1861ebc3f4796bf377  .agents/skills/speckit-constitution/SKILL.md
5859c9780ddc012f600e7d35a5691e032fe05861296f226b5665a0ec03135ccd  .agents/skills/speckit-converge/SKILL.md
848a5c9eff7b99e348927cbde6c35378de9fea3fd317941f58fa0b0b79301eec  .agents/skills/speckit-implement/SKILL.md
9b2cf68ce24aa631947cd706d0c575b6a1df8a083afcd66db39e3a2f6191d41d  .agents/skills/speckit-modes-explore/SKILL.md
6d79abf14a67283c8257b6d96f5d1691104e79d623e1de139bdaabb0de427bc6  .agents/skills/speckit-modes-guide/SKILL.md
15aef61c811a66cd970870615fdd398f4b266b5ff6eb162d016b1934088fc7fa  .agents/skills/speckit-modes-pair/SKILL.md
5450b9c37e21605fea6832f0b3ad1782debabed3a25ed4de20f41d5414596396  .agents/skills/speckit-modes-review/SKILL.md
89f0d67544b27fe3acffaeaf52c812babf8ce316fc5ee92ea3904cf508554cc2  .agents/skills/speckit-modes-tutor/SKILL.md
db2406adfa50103fc04ca8109ac934cd715086fba64365fb404630a88c62bda5  .agents/skills/speckit-plan/SKILL.md
1d4396f488d7cbbe6f468a6dd032c17dde7e3f357e8dadef5b5e9f148b1893a9  .agents/skills/speckit-specify/SKILL.md
1086d7885df1188d00e7d5eb4715e678b4340b893e8f24ae748d823b13599a56  .agents/skills/speckit-tasks/SKILL.md
e149b5b337bfaf1d232af7304916bbe75f357c67c271f5e753f7a0179de240b1  .agents/skills/speckit-taskstoissues/SKILL.md
f1a56e4f7e32b38beaf774225c95a6c43f90eedb036854fd9804926c80a3f97c  .agents/skills/task-explore/SKILL.md
71b4718cd03489e09690d43f92537d8758a39f54a6d34730e984ede519c59fcb  .agents/skills/task-guide/SKILL.md
1d7694cf79cb1420a56efb1c6a353b20977a263c965555995bb28c93171aeb89  .agents/skills/task-pair/SKILL.md
fdbd6f58abc075a159bff0aefafa208bc3fb2bb8ce6a30019bfaf2bf0d225825  .agents/skills/task-review/SKILL.md
15b48c3b4558495cd60fa9c6a2dd722e88094d6da426865da459bb410c6c780a  .agents/skills/task-tutor/SKILL.md
2feec661bb8956fe1c867ef751709d88ea035b727bc8eaa40b5e1c32eb076d09  .agents/skills/ui-ux-pro-max/SKILL.md
331e7cf2c0b222d80c566c5f255c63cb339f65bfd02e471a720f28e4864a9f08  .agents/skills/ui-ux-pro-max/data/app-interface.csv
4ca9ee8697984ed678a69a3bfbb788fb7f826d564f22cae5d094df8879517217  .agents/skills/ui-ux-pro-max/data/catalog-summary.json
4115cf1120680f2cedef0676cb648f30c7ef4699e2a947535d4113e71ed3b12a  .agents/skills/ui-ux-pro-max/data/charts.csv
8162429222bce22df62b564085946a30d07cc9722c58d0a3a494bd0d1d00841c  .agents/skills/ui-ux-pro-max/data/colors.csv
e82fb33ed49375a300e93d9c11ccd1c1493c999e84ee7ee295e527634786e2e0  .agents/skills/ui-ux-pro-max/data/data-provenance.json
35688523f2955795caa1a47c53b83099e60c1708461476f9cc3a050cf3b0148a  .agents/skills/ui-ux-pro-max/data/google-font-licenses.json
1c8c3b2ea1faf6a1012da463756def8b3889db33f2226f0343bb4daa80307d03  .agents/skills/ui-ux-pro-max/data/google-fonts.csv
50816c6012030178195a16ee481ebf58b47bd985d70e8ec58886cc83f6eddafc  .agents/skills/ui-ux-pro-max/data/icons.csv
9a2edd3bb676c2a58f00ade7a062e285222d4297bfd847c8d5b056f0dbbf52d0  .agents/skills/ui-ux-pro-max/data/landing.csv
381affe8df8ea1f66fbbda2598827f9f54299107bbe6a1b4e9b68f6b62091ceb  .agents/skills/ui-ux-pro-max/data/motion.csv
2399325233b277b5c97a80e6a5e8941154f5d057beee4e7613db87c87d700236  .agents/skills/ui-ux-pro-max/data/phosphor-icons-upstream.json
5756125e2b0e0d2360926f175d0975c8cd846c7589e5e2ce02631ff645e66361  .agents/skills/ui-ux-pro-max/data/products.csv
3d925802539abac5afeb63ae8aa1960b7229ad271b3a47caed40ab2d97ad0734  .agents/skills/ui-ux-pro-max/data/react-performance.csv
704be83f2bad30c7e6de01afb113ffa01e0c458762f48b7102f31ba2367b5553  .agents/skills/ui-ux-pro-max/data/stacks/angular.csv
2c2f55fadaafc05e04cc321c8194a1a28b656e6757fe2ba316f41b16428299c6  .agents/skills/ui-ux-pro-max/data/stacks/astro.csv
442fca14675a020683473e7e49f08abb27b9df0765c80efe54aef61f1a4ac258  .agents/skills/ui-ux-pro-max/data/stacks/avalonia.csv
64dba0ac17349f28bce517a0f5f48c54d9ed2e487ec0c0258303463b382f41a0  .agents/skills/ui-ux-pro-max/data/stacks/flutter.csv
d05a581d20af57b8ca0104a6d31d90a07c437d500662a96c3029fc2f9a4678ee  .agents/skills/ui-ux-pro-max/data/stacks/html-tailwind.csv
2e819b8d5abdd23ad4dae0991650fdb57af497aabd68b37463aa9c442944c869  .agents/skills/ui-ux-pro-max/data/stacks/javafx.csv
699de218b286948eaec7d15767b6e1350ee299167e49bf476d82e3ff58724e0a  .agents/skills/ui-ux-pro-max/data/stacks/jetpack-compose.csv
854ea4daa5fc61292d22235ad33b49ba3fe22423c3de8d3cb03758ffed3b59f9  .agents/skills/ui-ux-pro-max/data/stacks/laravel.csv
ecd2c27b2ea0127d203ae726060efcdd7335b5e83f96b99e4f3befbbfeebd5a4  .agents/skills/ui-ux-pro-max/data/stacks/nextjs.csv
9c0179d559abe39ad63b958b54cb29c82be1dd20706430476096ea8967bfa328  .agents/skills/ui-ux-pro-max/data/stacks/nuxt-ui.csv
3d9b54ed2d151bd9c86e9e5609b8a6f88a00c4c52fa601a30af96c49b2c4d176  .agents/skills/ui-ux-pro-max/data/stacks/nuxtjs.csv
ba31dd9c0c04da6bc02a74448bf121f9c0728ae5ba3b4d47b487778b0a1135b5  .agents/skills/ui-ux-pro-max/data/stacks/react-native.csv
4dd176a9787e5c6306b5df94158d75955adcdc6edab41ce5286641a5842303c1  .agents/skills/ui-ux-pro-max/data/stacks/react.csv
e56cfde5b74907836ac3582a4779d5b7f3d206a702ab81b8669a1b668c3eeb51  .agents/skills/ui-ux-pro-max/data/stacks/shadcn.csv
f6e379ba802941ba26b01d4ffbe3cd39120f2587659a1d93851c707f66bc13db  .agents/skills/ui-ux-pro-max/data/stacks/svelte.csv
bdd9231ff3ad658f4e7c063e1eb49df2fd09ac8d90631a86df899b39833b9623  .agents/skills/ui-ux-pro-max/data/stacks/swiftui.csv
155d583b9c64da0df4b6c6cb060c02eab222505e0734d6353da02c9e2b5d982b  .agents/skills/ui-ux-pro-max/data/stacks/threejs.csv
a0474363e4225b5367214d5675fd3e075f137026f9500f0d04357882ef4f6d48  .agents/skills/ui-ux-pro-max/data/stacks/uno.csv
c409f08c1fbba1f1029f1acaa554e7b4471cc85517a5751c9f2e62465badcd5c  .agents/skills/ui-ux-pro-max/data/stacks/uwp.csv
b655f1ebb9dff2652d15981f31b1784c8a6d4759efd2815a14f3088257569f95  .agents/skills/ui-ux-pro-max/data/stacks/vue.csv
e676dc1c13ee6c205c40b0746f1335150a346c7a49a0616d2545bc3d2c930c85  .agents/skills/ui-ux-pro-max/data/stacks/winui.csv
9781a9950b20333637b30a02e498b7efca21b618a3eeb8665836f3ac6e974da7  .agents/skills/ui-ux-pro-max/data/stacks/wpf.csv
a6b37e5925d20b4c4b885a8a24aead64e1fcc779c3f0be91cfbe350de5628953  .agents/skills/ui-ux-pro-max/data/styles.csv
321fc446e89024488ebae96dda93efc4d2307bd8bddb240857ad51364f6782c8  .agents/skills/ui-ux-pro-max/data/typography.csv
f0774dd741cecdad5eec842034bd6d5e9ea50e9f220a1910069748daa0bb8e9a  .agents/skills/ui-ux-pro-max/data/ui-reasoning.csv
ff81ec613f70ba9fc3fcce52dbe4ae35d44b2079dbe6dc066d2d6e38c28facd5  .agents/skills/ui-ux-pro-max/data/ux-guidelines.csv
d28442d61c310b49c054a4ea736f89fb3008beebdbbc38c4b3a540b8f7fadf23  .agents/skills/ui-ux-pro-max/references/pro-rules.md
0609bc7c89dacb40472465d8fc14257b56b2c43439660fc8d6fa3b8c022e1876  .agents/skills/ui-ux-pro-max/references/quick-reference.md
caf92bdcf2579c9a7d6af4f53c54ee9d3c8f05472cfab77aaec38bef120ec63e  .agents/skills/ui-ux-pro-max/scripts/core.py
e7d1c94c4b2eada17c5551157668362659ccf9626d34dbd58e68142410f90103  .agents/skills/ui-ux-pro-max/scripts/design_system.py
b8bac1af82aa280d3e06f00aabaeac4337e632996b07fed874e2b6ee6e9c5913  .agents/skills/ui-ux-pro-max/scripts/reasoning_contract.py
9fd5acc991142fd43c3afe7be0f6720911b668f3988b34e74b5cbc41d58e7947  .agents/skills/ui-ux-pro-max/scripts/search.py
22d8dc81a7d6827b7e8b64b53e7d184210fb9759e8e294e0d5133c81cc460176  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-api.json
c608ad5c4084ebc50a4bbbfb69ea2456c01fd5519c457e18410fffd250ae948f  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-catalog.json
4e0761b839dc6b2187a370e82eddc0aed8a7ff10c09e28dd814bb3656dac595b  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-existing.csv
30bffc29ae348416a2de2f9c6c418e768e4578f136b0f4bac5d2f70124f2e9ba  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-metadata.json
6243a48a4619986768c4628e2d0c98ff195beba71ba9be5df8f0c52fc6d90c0b  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/google-overrides.json
68362c9a700c13b96f000784a0198c1c7e117a7088a01c85744e44233038fe9d  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/icons-curated.csv
ae4d0bb076240824e1b643c2270d1f8cc0952a69502ec1e622b7dedd85b930bb  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/phosphor-core.json
500588c757d6de03e3d7e69b27a8b8b1f88ccf6bb0333e4c1e9b0d6a4f112475  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/phosphor-package.json
d79f2ee0afdbc2f87776733e145df3538a16a25d7c2fba0056bb48295dad0ded  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/phosphor-react-exports.json
1c57a1d76bcc0cdd3632d4c18b9c0e79576b4591df39831c9607e5d0eb4f2cec  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/catalogs/phosphor-react-package.json
0df200fc54c1cb97a52d6775e7f501509163cea8f8b73fd7268429bc1f835afe  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/relevance-baseline.json
e77d36eebbf6ddc2860946a02cdb659351da6c09f2688f1ed30939a418099646  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/relevance-cases.json
0e9bdfe71424c3354847e84c2113ed80fb9450221c5cff599c87c07a59ae5d00  .agents/skills/ui-ux-pro-max/scripts/tests/fixtures/relevance-thresholds.json
3e2ca5d12702318f641ae62d0c14f22a3bcc84d84e79b863c0e947d475604adb  .agents/skills/ui-ux-pro-max/scripts/tests/test_catalog_refresh.py
fa6ff09f0ec2c99013588c77397f5082dddebe8f467e94c5f8378ec9595f4989  .agents/skills/ui-ux-pro-max/scripts/tests/test_catalog_summary_line_endings.py
3527fe2f4b852f69f07c17ddc0d615d9a6e025c924e45a33985579a94a8d2118  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py
3ffc6b4905c9ea26d7ac4527ab154d153584231aee71b2ae4bd017977fa09cc5  .agents/skills/ui-ux-pro-max/scripts/tests/test_core_data_quality.py
0360d6e10080c0bca214f2b0bbad582ba50702a542ce21013351aca54938df3a  .agents/skills/ui-ux-pro-max/scripts/tests/test_data_contracts.py
95ad2c154349f7021f55a558f8dcdd71df1a24fcf531a4364a8e49526a0865ef  .agents/skills/ui-ux-pro-max/scripts/tests/test_design_system_mode.py
83d09ffe8cfbf7b265f362129f061dfe8e5e167ce5db43adaead197cabc9ca38  .agents/skills/ui-ux-pro-max/scripts/tests/test_design_system_stack.py
3942845712b9a829323cd3568511483135f2a8c7cd79ccf61679da4b0f624dbb  .agents/skills/ui-ux-pro-max/scripts/tests/test_native_desktop_stack_freshness.py
2fe56a4d6fe5fff15ff592274b0eeaba925146cefea6c0fa29d8f1b77c9aca1f  .agents/skills/ui-ux-pro-max/scripts/tests/test_relevance_evaluator.py
73b7006bf88fd1373cf37465fd404d1d16d9c7e1d065e3d0761ba66e990e43d1  .agents/skills/ui-ux-pro-max/scripts/tests/test_rtl_support.py
7cec24b94be771bc60bc84f8993e614bb16d4047930e1dd3d3bed91628311d44  .agents/skills/ui-ux-pro-max/scripts/tests/test_skill_script_paths.py
cd14d0092e8a454d213aa104b53e4e70ba698491fa00fde9fdec5ca8a3d70011  .agents/skills/ui-ux-pro-max/scripts/tests/test_style_taxonomy.py
b51d32ee8a15505b87cb81957fb2d1b385e041e8beb4463c311d236bfd29ebd4  .agents/skills/ui-ux-pro-max/scripts/tests/test_text_layout_resilience.py
83a6d597410f442441cdb17d0913be151404a608ada6a2487dd2bfe2fbf31e5d  .agents/skills/ui-ux-pro-max/scripts/tests/test_web_stack_freshness.py
a599aa256049cf30954d1f164721b99e453eb7e4cb8241bcab2d5573e6cf58b8  .agents/skills/ui-ux-pro-max/scripts/validate_data.py
fb6aacad0eec0034e8e89fa40d483137b895633a46505258ac4363bb1bf0fc15  .agents/skills/vue-reactivity/SKILL.md
628b2b410ae02e10659edc5d786e33eef2697f72e288a2333e1576e4a320916d  .codex/config.toml
2fe862e95ee3106ce6b30d39971a87a4cc58e817e64d9cf224f000cf83c0656c  .specify/extensions.yml
b73ec6dba96f8c01b65807200add60a046a79ba0a61cd8ca5488ec979bbd35dc  .specify/extensions/.registry
d876f60cd4d246addd9538d08c21acb55d5250f0faf69dffa6918e145dbb2f98  .specify/extensions/artifact-business-flow/extension.yml
11519bdc1a29937bf455692795c4650b5b54160829b4d7f1d046ab1e607c5d8b  .specify/extensions/artifact-business-flow/skills/artifact-business-flow/SKILL.md
ac08f7a4009b3b94cc557baf03b1c91988e53bbf425033a9ca016e79aa485593  .specify/extensions/artifact-business-flow/skills/artifact-business-flow/speckit-hooks.json
1fd6aeec9cd63dc0b5436dbd51e52eb8a09d9750e1e1853007a9a4584364ead4  .specify/extensions/artifact-issue-description/extension.yml
172fb59dfbff15f7830da37a5fe742b13eb45bb30a4493a836e33dfebfb656bb  .specify/extensions/artifact-issue-description/skills/artifact-issue-description/SKILL.md
8c910d0b86dc49732e5e136c551eb9670d9c74bfd8d924cb740d9c75e304e018  .specify/extensions/artifact-issue-description/skills/artifact-issue-description/speckit-hooks.json
c682afafc0edc015eec68c7e3b3f22376c6f2d775101cbb8af6bba82c20afcce  .specify/extensions/artifact-logic-flow/extension.yml
3fb17a5f80136b18e8054053b5a171b7503e0653f368df7434ddc696f4406323  .specify/extensions/artifact-logic-flow/skills/artifact-logic-flow/SKILL.md
a263ba74db39bcdd8594e724d20496dee10906fb642603bb4f377b2980bfca03  .specify/extensions/artifact-logic-flow/skills/artifact-logic-flow/speckit-hooks.json
cce2cf3fd919ad733cb1b7740f173cc9028c814fd8baf8fed98eb86be1752e8d  .specify/extensions/artifact-pr-description/extension.yml
bfe7883a7c4c8faa27c12da84fbccae67a1e4c347f9bf00d2480cebd217c1b2c  .specify/extensions/artifact-pr-description/skills/artifact-pr-description/SKILL.md
0574ba556a4db4f3db69d400ebe8af55944973390835e436cf92f5939bae5771  .specify/extensions/artifact-pr-description/skills/artifact-pr-description/speckit-hooks.json
1a348a305a64c449a15928b739c39f84dbcfbfcd12c61e958e765e8d2794a412  .specify/extensions/artifact-project-description/extension.yml
68aa274a0649da3a16eca2df56403564ac6f948f9bff5368c5c58825e02053ac  .specify/extensions/artifact-project-description/skills/artifact-project-description/SKILL.md
50c09745afcfc85c958b1bea377d8390fca9a954a25478f183607d07339ac715  .specify/extensions/artifact-project-description/skills/artifact-project-description/speckit-hooks.json
73bb24cddc3835b85f1b70960d4fffb7a72a7e08a3d2643eb3934fe3a6298087  .specify/extensions/explainer-doc-sync/extension.yml
d8709298aa0ef9ead88147bd880588093d8c8fd3cfb639beabfb766acffba780  .specify/extensions/explainer-doc-sync/skills/explainer-doc-sync/SKILL.md
fea9c91b435b64f4b96bea0e00577411b81ec1f394f9264c14a438546de6c79a  .specify/extensions/explainer-doc-sync/skills/explainer-doc-sync/speckit-hooks.json
b72731c97d9665d608a6b276f3db482f9084d0d68c3445c6c59b280aad70a96a  .specify/extensions/modes/extension.yml
f1a56e4f7e32b38beaf774225c95a6c43f90eedb036854fd9804926c80a3f97c  .specify/extensions/modes/skills/task-explore/SKILL.md
71b4718cd03489e09690d43f92537d8758a39f54a6d34730e984ede519c59fcb  .specify/extensions/modes/skills/task-guide/SKILL.md
1d7694cf79cb1420a56efb1c6a353b20977a263c965555995bb28c93171aeb89  .specify/extensions/modes/skills/task-pair/SKILL.md
fdbd6f58abc075a159bff0aefafa208bc3fb2bb8ce6a30019bfaf2bf0d225825  .specify/extensions/modes/skills/task-review/SKILL.md
15b48c3b4558495cd60fa9c6a2dd722e88094d6da426865da459bb410c6c780a  .specify/extensions/modes/skills/task-tutor/SKILL.md
ddb76b452f0f6601f233911c5da977ee08fe119fa0e2fab50ed0f0a04c83398e  .specify/extensions/mvu-gate/extension.yml
ea3cff0ae2bd7acf9e7ae757354c52e3b371d293ba7f8d95d09f3656dff19fbc  .specify/extensions/mvu-gate/skills/mvu-gate/SKILL.md
b520364d27ed2262a99c7c68a45a783177b1d44a58c930c89ae522901628f4ed  .specify/extensions/mvu-gate/skills/mvu-gate/speckit-hooks.json
ece39246befd35e6ecc17e0e94c85d745f2fe159145034e6cb7017ea8025667d  .specify/feature.json
050f4273b9fe7300a20b8cb5dd8ad1579a739c6a242b704ae77095fee240c689  .specify/init-options.json
8465bfc663c8cf5f07b712195d9701db3b7804b94dae7fa5b191b81a588d90bf  .specify/integration.json
d828d5b0d1a5c36e873a88358c93454ea6798fbdd0ced1db03511021882c6422  .specify/integrations/agy.manifest.json
0aa1884fffd44b1a11eb90090f6fa005822ab9408546fffcd026b1bc6c334586  .specify/integrations/codex.manifest.json
3601362ef6ee9f27a88481f8df2e289ba11f93b49588c1f324503aafee5a38b2  .specify/integrations/kimi.manifest.json
e4231f60ebb5347ea31e1a0c804fef5e67d0af481be2ea1c3a7510eccc80da10  .specify/integrations/speckit.manifest.json
7676358e7abadde3f3dbc8dd04b7b9a8f3ff5981c5bd7de5bbb6e10e4a8b4353  .specify/memory/constitution.md
d4d677ee1af1b7f47b08dadec6568535bf87b5b03a2f0e0b410c241f89cea5e8  .specify/memory/speckit-constitution-prompt.md
a296c716b94daf81737082868591f927d5a052e2cdbf1105d068282463515838  .vscode/extensions.json
383ee474c1c359bd59ebee5bcf9867fafcc85d41f1bfb7ca8ba92e7dbf194c7e  AGENTS.md
9c556278cf2c498ae56fa35c0c9b5cd81e36f5fd0aed89a67619f48750f94da8  apps/personal-hub/content.config.ts
936c4cba2cd5eea1238cbfe0805506f152eab74ed10b5fefdcaff3cc9a0c2351  packages/skills/package.json
6eacc71bcdfd46aa8a044f1636d7ec4003f4f8e3a697d4b059cfc727dd26d81f  packages/skills/script/index.mjs
2c19be9b10eaf2af686598b96ea371d3640dd656275498721177e1a9564ded1d  packages/skills/script/install-skills/README.md
0e75db76dcee75e306333f819d04e01b770c0aadd3a11e705d60a37a1460ed40  packages/skills/script/install-skills/install-skills.ps1
57131d7ab7eb9dd3dc3640472caf63becb20baf0d299d5fa93d4189398a2b701  packages/skills/script/install-skills/install-skills.sh
5d7563dc3f5146d13048673eb9d3586692043ac5536108a46175b05103610e32  packages/skills/script/mount-entry/README.md
ae493d20109770f2282bfbc7ccd1f6010e0cc2fe37ff155d3c75591636fb7073  packages/skills/script/mount-entry/mount-entry.ps1
a1cdd723c4a34890be11459b32c3fafcf5f82980c071edb0dc570e3be5e1eb0c  packages/skills/script/mount-entry/mount-entry.sh
5caa7b4bec071fc18fe66ffe6aa3c2fca40d8695c955eb3ae9d71dc5d1e7e24f  packages/skills/script/register-commands/README.md
eba2fbbc830b643aeaaa36b709e0094818050c10446c066430bb9b08ce589544  packages/skills/script/register-commands/register-commands.ps1
f6fe5a1d4bd3ce82e0b179adf9a365f4839cd01fe3fae2e01e2085da88f4dab0  packages/skills/script/register-commands/register-commands.sh
c97697777439b8394e058e6327c7a353e14f80fa40ad93c99709a5a7dcde8a8e  packages/skills/script/register-hooks/README.md
4208e31e52e8b70a362674fd19e5314f0831387e3e8127e2949e40798003725b  packages/skills/script/register-hooks/register-hooks.ps1
2ce1bb4d37034d9c937d8f79e3bde6b34bf2e016d580241ee59187937c1f46c7  packages/skills/script/register-hooks/register-hooks.sh
0b067cb8f05223559fa0813d966aa9ecafd874eb471c6e2152239e0caa9f34df  packages/skills/src/mcp/mcp-build-smoke/SKILL.md
495c31a77b4ab6a6c347275d0ad586f74ba330d588a8b97326b20d5d0802739b  packages/skills/src/mcp/mcp-build-smoke/references/verification.md
049b5d4f7e8b68f759d14f5ca98d13e94984731efef276f5c21b6c6258e1dacc  packages/skills/src/skills/coding/document-changed-symbols/SKILL.md
817c590ca9b7324eaf37c8aa4560b301f32d8395b052c5f844c62deff79e3038  packages/skills/src/skills/coding/document-changed-symbols/references/test-prompts.md
fc4b394ad3cbdb20ed414c4174df47f5abf9bb007d50c82bb180fbbc8cea5772  packages/skills/src/skills/eval/eval-short-rule/SKILL.md
efb66c7dc0a9316ef8463c47f74117c85f0b1fc27ca2e95c95b45f809b2f6ff3  packages/skills/src/skills/eval/eval-with-reference/SKILL.md
7e11c215de84328cef54f777ea20d1375d0c9b6ab37e3efe136ba470d6560a32  packages/skills/src/skills/eval/eval-with-reference/references/contracts.md
a7497c13c5be0fd68a088b71a7a7a6aca235a4e03cb71d5354771a75d6798fd5  packages/skills/src/skills/eval/eval-workflow-guide/SKILL.md
0fb02df099d6751f65e83f3d8a3945340114eefc8b6718e220af118ce3a99735  packages/skills/src/skills/frontend/nuxt-ui-styling/SKILL.md
417c746d59a4a9f7f68976a884ab6d196266304118c102c959e10b752c5fede2  packages/skills/src/skills/frontend/nuxt-ui-styling/references/attribute-conflicts.md
6f47315857912ea6a1c5989b022e0eb45535e2a860748df29eb9370ca2957dac  packages/skills/src/skills/frontend/nuxt-ui-styling/references/rule-verification.md
fb6aacad0eec0034e8e89fa40d483137b895633a46505258ac4363bb1bf0fc15  packages/skills/src/skills/frontend/vue-reactivity/SKILL.md
11519bdc1a29937bf455692795c4650b5b54160829b4d7f1d046ab1e607c5d8b  packages/skills/src/skills/workflow/artifact-business-flow/SKILL.md
ac08f7a4009b3b94cc557baf03b1c91988e53bbf425033a9ca016e79aa485593  packages/skills/src/skills/workflow/artifact-business-flow/speckit-hooks.json
172fb59dfbff15f7830da37a5fe742b13eb45bb30a4493a836e33dfebfb656bb  packages/skills/src/skills/workflow/artifact-issue-description/SKILL.md
8c910d0b86dc49732e5e136c551eb9670d9c74bfd8d924cb740d9c75e304e018  packages/skills/src/skills/workflow/artifact-issue-description/speckit-hooks.json
3fb17a5f80136b18e8054053b5a171b7503e0653f368df7434ddc696f4406323  packages/skills/src/skills/workflow/artifact-logic-flow/SKILL.md
a263ba74db39bcdd8594e724d20496dee10906fb642603bb4f377b2980bfca03  packages/skills/src/skills/workflow/artifact-logic-flow/speckit-hooks.json
bfe7883a7c4c8faa27c12da84fbccae67a1e4c347f9bf00d2480cebd217c1b2c  packages/skills/src/skills/workflow/artifact-pr-description/SKILL.md
0574ba556a4db4f3db69d400ebe8af55944973390835e436cf92f5939bae5771  packages/skills/src/skills/workflow/artifact-pr-description/speckit-hooks.json
68aa274a0649da3a16eca2df56403564ac6f948f9bff5368c5c58825e02053ac  packages/skills/src/skills/workflow/artifact-project-description/SKILL.md
50c09745afcfc85c958b1bea377d8390fca9a954a25478f183607d07339ac715  packages/skills/src/skills/workflow/artifact-project-description/speckit-hooks.json
ad19b3aff08b3d448e43feb46fbcf56d009eec57105935436557434603adebc6  packages/skills/src/skills/workflow/bug-report/SKILL.md
d8709298aa0ef9ead88147bd880588093d8c8fd3cfb639beabfb766acffba780  packages/skills/src/skills/workflow/explainer-doc-sync/SKILL.md
fea9c91b435b64f4b96bea0e00577411b81ec1f394f9264c14a438546de6c79a  packages/skills/src/skills/workflow/explainer-doc-sync/speckit-hooks.json
ea3cff0ae2bd7acf9e7ae757354c52e3b371d293ba7f8d95d09f3656dff19fbc  packages/skills/src/skills/workflow/mvu-gate/SKILL.md
b520364d27ed2262a99c7c68a45a783177b1d44a58c930c89ae522901628f4ed  packages/skills/src/skills/workflow/mvu-gate/speckit-hooks.json
f1a56e4f7e32b38beaf774225c95a6c43f90eedb036854fd9804926c80a3f97c  packages/skills/src/skills/workflow/task-explore/SKILL.md
71b4718cd03489e09690d43f92537d8758a39f54a6d34730e984ede519c59fcb  packages/skills/src/skills/workflow/task-guide/SKILL.md
1d7694cf79cb1420a56efb1c6a353b20977a263c965555995bb28c93171aeb89  packages/skills/src/skills/workflow/task-pair/SKILL.md
fdbd6f58abc075a159bff0aefafa208bc3fb2bb8ce6a30019bfaf2bf0d225825  packages/skills/src/skills/workflow/task-review/SKILL.md
15b48c3b4558495cd60fa9c6a2dd722e88094d6da426865da459bb410c6c780a  packages/skills/src/skills/workflow/task-tutor/SKILL.md
4f0d25a7081959a5f7722cfc71fc9e1ca9c6cf48ee4de163efb112de634fe71f  packages/skills/tests/distribution/helpers/catalog.ts
e48a75535476db8d171db6a56adf1aafd97490f9f3d017adaa49a633f79b6122  packages/skills/tests/distribution/helpers/https-source.mjs
e2fc3d5752493b7e30e87ad1cbab564eec0cd8a139d4889c96903f463d0e1781  packages/skills/tests/distribution/helpers/projection.ts
147c8040835fb862ccbc9b310f9a9d2fd0c63b8f8d541ad7a9e85b375bb83ca2  packages/skills/tests/distribution/helpers/selection.ts
09290a3938a5a7aed4a635d8dd213c51ba0e2ef390e6869ac15481544595c54a  packages/skills/tests/distribution/mvu-a.mjs
b8b4893cd85ea42636b0809b2bd8037444462baf6c74aab776eab75343a9fb82  packages/skills/tests/distribution/mvu-b.mjs
69d5c57c9811046740fee0433eba1c8655bb6632f09700913f0e405a2bad7990  packages/skills/tests/distribution/mvu-c.mjs
11a0600ac2c34bc9fc3896ae2e28c730916fd1f4c83e019e1049478b45f60fbb  packages/skills/tests/distribution/sandbox.mjs
b6da127334a81e208f41f75c719609daaea41c61b9c5239d6c28f715b310fb1c  packages/skills/tests/distribution/test-build-config.mjs
006bdaf24ed87c35362dcb6dbd89c5b083411189735ccf5f746fa18d264c87e2  packages/skills/tests/distribution/test-distribution.mjs
8cadfb6ee543746cdc1d4685f2eb35c633ee820960b9f90d68e8bbf34a4d3472  packages/skills/tests/distribution/test-entry.mjs
320bf72106b861e836c66a61f79e184f18c7fd58322985db90381fb111a331d6  packages/skills/tests/test-register-commands.mjs
ffe02f67c1361cd5af6c667a5ee31e34d888387405a99daad14745fa8cf56502  packages/skills/tests/test-register-hooks.mjs
a865ac53aa200ff1206e400286fe58356fd8b2de9aa2ada834071c351e008ec7  packages/skills/tests/test_artifacts.py
158e05035c9e8f7dc625052f3bb092e38d1f6cc255b2f7ba72d2f855d3d44456  packages/skills/tests/test_full_remount.py
0e5dc86e2794afda28c5d60a8bab913a2c08c08c580ae63d988bcb7f27483e00  packages/skills/tests/test_register_commands.py
8d2ba30d0a95ef4340e710c1b8c7adc65f4d57c4406be6f6b8d3518b9481ffd6  packages/skills/vite.config.ts
d78bd46cfd61595f8af4f3c5792a2f8ff77ad88bdd1a021242989c97528ea61f  scripts/dev/README.md
d3872ee054c24f107079578dce62c25faaf9f202b48ae50057c567dfafca7495  scripts/dev/actions/estimate-context/estimate-context.mjs
bfbf30984717d2e0bfe64df81dc488d2a52e0b82a4c97e50c5c01577180ac4f7  scripts/dev/actions/estimate-context/test-estimate-context.mjs
421e039bcac3d35f067aa02319ca4595b41b6116c3611b0398b0a0fcb224af0a  scripts/dev/actions/install-opensource-skills/README.md
73be81f00fc36c9054c5ca2aae56f1e4a82252f7e5df56eb58c505e8ecdfd3dc  scripts/dev/actions/install-opensource-skills/install-opensource-skills.ps1
dcccdd61dea3f4aba1be97bc628174ee813368cf2f8bf437f821fd9baf9b0c30  scripts/dev/actions/install-opensource-skills/install-opensource-skills.sh
ab6760833222a7f0e4155df811030b9b19fa2979e48091e29cef98d47ed7e4cc  scripts/dev/actions/install-opensource-skills/test-install-opensource-skills.mjs
a5cee0de44fb9016e36d59fa754fccbb48e424455eb24028a4136d8544b77990  scripts/dev/actions/link-skills/README.md
5e31e359dc92506298e1e369dc980b083bb1120c898494b2b2082a5362f21a56  scripts/dev/actions/link-skills/link-skills.ps1
5af2fe1a3329f96ec62452796d2448aad8735e90fd3f51cff01efbfcf6f5b2cf  scripts/dev/actions/link-skills/link-skills.sh
0c2fc1b84835a678600b7832101f86a70eada8c7071c24a4535abdedc12adb95  scripts/dev/actions/link-skills/test-link-skills.mjs
57e1c2047d89eedf429f660cc5c256067006e8c47af4f33cb48c65a3b9ab071c  scripts/dev/actions/register-hooks/README.md
2848ccff29561d07fedc8cbb8a0ba9ae2428942ac16b7d68b6831a367359f8bd  scripts/dev/actions/register-hooks/register-hooks.ps1
5506449c156ebc1cf179d4f693484934054a2a10b440d97480793f8f7963182a  scripts/dev/actions/register-hooks/register-hooks.sh
eaf22de705c7943a42e75ddbc6ebe2f81b8788777812b443c447fc7bb08b154d  scripts/dev/actions/register-hooks/test-register-hooks.mjs
9a9f80e844f12acf4b535bd21df786010086f78f3b984cd2a80f98fe6d013f9b  scripts/dev/atomic/nuxt-ui/README.md
56cefd69a96d83a0ded8b71e23c5f92dd8c450f5c86d969855df636ad0b5ac79  scripts/dev/atomic/nuxt-ui/nuxt-ui.ps1
1cc4c81812d329f96a3934adae46c46d627f1f31510d2e4bf4c8a8f70fd203bc  scripts/dev/atomic/nuxt-ui/nuxt-ui.sh
b718a38c51999d32237719f2b1aba16c3271dcbc064120ce516b62f3f8034b46  scripts/dev/atomic/nuxt-ui/test-nuxt-ui.mjs
6a9f8f5271d7050dbc07935bb39cf299aed4b5ad6b32fe643c5cf0b84a81e5cc  scripts/dev/atomic/speckit/README.md
04d518e528effabb898f80e08eb68ca4e9709a44dd3220e595fa2fcb4f59bda7  scripts/dev/atomic/speckit/speckit.ps1
4ed2bce529b37ef81a8f17c30186ead133bcf2c87e35502e13384c129b3414ff  scripts/dev/atomic/speckit/speckit.sh
3a6745ad14fbd85015f758a6a7770398bd7e7f5597b40ca07303e762c8578928  scripts/dev/atomic/speckit/test-speckit.mjs
41611a05c96f95c617e132fca13289b259f42049a1f1ff0f9cf9a530c726f4cd  scripts/dev/atomic/ui-ux-pro-max/README.md
eee12e99f9cc08ab3172ade7e6b760646525416dbbdb7720563cc645ff94c53a  scripts/dev/atomic/ui-ux-pro-max/test-ui-ux-pro-max.mjs
146cee8b14ea0389757038969cc47b022346700aa8f4ec61222b6257cad58236  scripts/dev/atomic/ui-ux-pro-max/ui-ux-pro-max.ps1
ec6777d926a18b8ade3b5578fa67ec1f058a9c38b343f5f1c313450c3a6f4e1e  scripts/dev/atomic/ui-ux-pro-max/ui-ux-pro-max.sh
94461c90a69d5d2cf7656fa898e6c09e0129793b0d5e6703b4fefec57e3e24c6  scripts/dev/lib/common.ps1
2ea79dbeac25ce0adb6a3779e68dd8f73259a6bfcfb10d4dd2a9f6123ad67bb7  scripts/dev/lib/common.sh
c03248f69169cedbe664f7c9ce0d53782d88e5c35e49ed569a0e46ef93b3b736  scripts/dev/nuxt-prepare/README.md
b2f570478f7cd04c1afd1221431609032d5100159e513fb6dad6fe99300775cb  scripts/dev/nuxt-prepare/nuxt-prepare.ps1
cb740acff86c6f9cc7346bc9e955b953c834b6050a7f17f315a05698df43362f  scripts/dev/nuxt-prepare/nuxt-prepare.sh
3c63a0bc49ccecec5ac0ed924f5b229b139f522fa1e3d1bd0b6f9f9f1de670e2  scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs
2f1555b23ef6cef2d0eca778c735cb6c9964147912cd7d72d9e0c21bffc0ed75  scripts/dev/postinstall/README.md
af0b269e9f99c947c285edcad546772c00a21b7b4cc18d46085dbd620778e57b  scripts/dev/postinstall/postinstall.ps1
36238a30e0c1aeee48e0d8087ba3b154f381689b58ce7fae5f78676bc8e4e87e  scripts/dev/postinstall/postinstall.sh
cf4e88adc2c0971ec029302919688d49576be864964ebff420bbe6a2e91ff55d  scripts/dev/postinstall/test-postinstall.mjs
6472693674c90af5c2bc97bc33728e7a23919e5d267d54579190aeaaa93bc7af  specs/skills/001-skills-distribution/analysis/acceptance/baseline.md
1723c279ffca9090205b090d8b9ea5588bd083b9f4fd38cb75153a9c7ea533c8  specs/skills/001-skills-distribution/analysis/acceptance/mcp-manifest.md
e4156550b12887951977158a70f290b3ef6ef045919a1376f82f2e9c23868ef4  specs/skills/001-skills-distribution/analysis/acceptance/mvu-a.md
25cdf717ae85bbdc3795d8c70a619dae0741c23126a8f7a68945be5d05e0296a  specs/skills/001-skills-distribution/analysis/acceptance/mvu-b.md
0b84ebe4e1dbdb06670f3ef6244fb9ce45ddd1c1dd1ab9e20f7339f6b15dbe36  specs/skills/001-skills-distribution/analysis/acceptance/mvu-c.md
a627abc63153e351a068bba6e6ff16f7bb7f4930077464d0d5ff4fc16efa8737  specs/skills/001-skills-distribution/analysis/acceptance/node-entry.md
5491d2deb4ccfb3a4082bf11e8d417c7c4c03a2c1d101e2155c7606d7812feb1  specs/skills/001-skills-distribution/checklists/requirements.md
9e321c8bf067d284e5d2b445f5dd53e90ca778fa6cacea9d55342002e5472fa7  specs/skills/001-skills-distribution/contracts/compatibility.md
75ed2c6aa609d4d86e846d0e60b38df42896909cfb7580b996d936a0d09cbcfe  specs/skills/001-skills-distribution/contracts/distribution.md
267f101f51abe4dd59863be790e5b10f3b29eb1e0b33e32a6dc6bdddb081be7f  specs/skills/001-skills-distribution/contracts/install.md
7ef40f381976c94d6fdbf3bc30931218ecc9527b9d303f71e70ab46ccbe5c95c  specs/skills/001-skills-distribution/contracts/mount.md
0fc14d6ee9a8effd2fe5bcc6c55cba475cf53ec8c28d7f9be12b672edc6c8dad  specs/skills/001-skills-distribution/data-model.md
f9db35e104899537f31c43c63857ab4189f9834285f01278c174584b0068440d  specs/skills/001-skills-distribution/descriptions/issue-description.md
5715d461d5435696f66724e898e289241e78d0d1b49c74ad6cd7e57609413c28  specs/skills/001-skills-distribution/descriptions/pr-description.md
a003cb9e5a27b8f5ecc1de435b7d37b7681855d5f0d719a18341868ac25abde1  specs/skills/001-skills-distribution/diagrams.md
c234542153e59727623c6e5ff87fade2bcb36f8c4b8a9b31e711cd3a35472167  specs/skills/001-skills-distribution/diagrams/business-flow.md
3a2515661b9317b804ef6a305fb55c9f2952d47ffd2987b7f669cd2146643ffd  specs/skills/001-skills-distribution/diagrams/logic-flow.md
ac4101fa46b87e34425a5005316e9ceb3aa998b9865b7e50bd987ef43d64f30c  specs/skills/001-skills-distribution/plan.md
03698a0a1412ea90e55313c15fb1f0182bfa3ff449d669df8ce48ae4132adaa0  specs/skills/001-skills-distribution/quickstart.md
0c0f4d28b693249a28ab0a4ada8776b23876eb11332841729d280ebefb225e91  specs/skills/001-skills-distribution/requirements/prompts/2026-11-05-distribution-revision.md
d2ed50b2a8aea44c66bf52775a9ec4dfbf1e637a43c6cecd2184b8192f2dde3e  specs/skills/001-skills-distribution/requirements/raw/2026-11-05-workflow-adjustments.md
e68428efbc72b57985e3b87162fddedc98181b12632a88c7bc6732326ebacb5a  specs/skills/001-skills-distribution/research.md
9cba2df41f017abc5ce8304a548ca244447b1633e4d4a4d60be6407b0c315f3d  specs/skills/001-skills-distribution/spec.md
9a74eb19c1593624de9eff298c3eae9bdaa36e475ab325e6367eef96006c129a  specs/skills/001-skills-distribution/tasks.md
01dbb639dc0ff49ec2dd8ec97dfbc8964e49970e0546a0b5fccb00088b7cc660  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/collaboration-modes-delivery.md
c3120ed61ef8dd098f5841cb0bc8eac390361f831a3cbfac5058f3ce6f2d63b3  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/collaboration-modes.md
39cfc63df74a05228ec79ede0026969ff5795b835135f039b8bebc7cf4ca0b69  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/direct-skills.md
6d9d8f457f68e22d6b287aae9c01ef16036e8c914297936112da9e13e903dcf4  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/mvu-a.md
076d570432329ccc21402778da431538a51c628fad624f00157a38b57824334d  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/mvu-b.md
c74a0a7e24405931e3045a49f6083ad4cddcb347a2df525eef5338edde371d66  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/native-extension.md
2f03ae71f8e9fdb3ced83b09c9995197aa05afd95a33cb4e3567aefd9a2996b9  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/phase-1.md
11887d13f35f791f288af7aff7ac87dd295fefab278275c67b267f07558d15d9  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/python-migration.md
c799afe65d74d0c9642f5896db5b4cfbbe5169fe851ea8e51d86788431153749  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/script-mount-mvu.md
fb4ad05525e6b60e527ce3237d9cca1502e3f458abf32a9ea2d2966f62ceb20e  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/skill-portability.md
5923e5cd1301e2c6e26b457703f817eeb4545730ef712ea6d34aad031f6c9f8a  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/task-decomposition.md
4a389db52f31a13e5c6d189322bd78eece15edf14d49d9cceeb4da2055196c29  specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/us1-shared-foundation.md
9b1ec10d400ff261d048e839f36924c075ffe0e5c630a7fcfeba75908170db83  specs/skills/20261029-speckit-workflow-foundation/analysis/baseline-hashes.json
88151babcd8a271ec5842ddc3871e08a741c74e3febcab3c4ed31038602f846b  specs/skills/20261029-speckit-workflow-foundation/analysis/full-remount-design.md
a7e4ea1be66286cfc6096de4ac751b6dc696fedbd3b11297a0dacdb9c22e97a4  specs/skills/20261029-speckit-workflow-foundation/analysis/implementation-baseline.md
8856bd86b7b913d96acc2f98be94a04524f4620c27927021b53f8b346d2d9652  specs/skills/20261029-speckit-workflow-foundation/business-flow.md
bdedb75649192149b148ad19bdf1aeccdf2436c988edaefa26a504f5f3385edd  specs/skills/20261029-speckit-workflow-foundation/checklists/requirements.md
c7548c48f1c36a8e4123493a24a1f28a688d355265172351a57f610c3d8e8292  specs/skills/20261029-speckit-workflow-foundation/collaboration-modes-spec-prompt.md
8d9fa98596348a53f1e44230ef82e1f24dc150cff92b21f3d581d5e9afcf4268  specs/skills/20261029-speckit-workflow-foundation/contracts/artifacts.md
d1865038169fdb5b3c1d9602308c56c80d7ec31ae724c3602583c9118a160291  specs/skills/20261029-speckit-workflow-foundation/contracts/collaboration-modes.md
c1a8b21f0d430bf12736cfdeb3865ef5b07025ec2c27203af1c4e4898a45e8a7  specs/skills/20261029-speckit-workflow-foundation/contracts/registration.md
73308808184c1407f33fe71c327e484ad012970c6d26faf6b455acec20971eb2  specs/skills/20261029-speckit-workflow-foundation/contracts/review.md
6f66607d2415f85d606d75627c3b4946228463a8a93e77e01075653c3abe31df  specs/skills/20261029-speckit-workflow-foundation/contracts/workflow.md
23c590c03addee195b102d0a92c17aeb8ffb88b6668c1f6b4bfdeb0053f9206c  specs/skills/20261029-speckit-workflow-foundation/data-model.md
b4338392d64cada1f7c6ec88b98ac53902df69e616ee22392bd61743635be6df  specs/skills/20261029-speckit-workflow-foundation/diagrams.md
8fbbdb4a878ee3be2b704a58b8c718bf9588cf305fbf9d8166ad2bea1e46cea5  specs/skills/20261029-speckit-workflow-foundation/diagrams/business-flow.md
1cd51749e05c475839bf3978c42e327c71c3aaaa771697ae55ff6116ba29bfc2  specs/skills/20261029-speckit-workflow-foundation/diagrams/logic-flow.md
21426752a54fccbbe5e745eadfdd953fa95fb0109d1b671f5356c6af63d685ff  specs/skills/20261029-speckit-workflow-foundation/diagrams/state-transitions.md
b930283ca6a0b63d4f6fa676992bda1bfb94e21dd9241eda2fcd86458075bf73  specs/skills/20261029-speckit-workflow-foundation/issue-description.md
40e7cd9d59fb31123c6baa5e41e7fb5610167829cec81d1c87bc72101a98faf9  specs/skills/20261029-speckit-workflow-foundation/logic-flow.md
43483aff80c0881b999a764b8c36580384081f1ef7c545ce4bbbfe6fdcf8bb10  specs/skills/20261029-speckit-workflow-foundation/plan.md
8979f0e64d5d589a15ac14e8e3917810a8fc424e77f40669df6558e6710001f5  specs/skills/20261029-speckit-workflow-foundation/pr-description.md
1cbce0890f15cfa93b73659320e5d6459bffd77906ab1c9e7c939763cd4cdbd7  specs/skills/20261029-speckit-workflow-foundation/quickstart.md
c598fc0b54b06c73749e521b982bc3f5115820e54da34856fda8e11f0732e4e6  specs/skills/20261029-speckit-workflow-foundation/requirements/discussions/2026-11-05-collaboration-modes.md
d4b469bb17296e78ed847760c89839ea505f02ed4809f209abdff604b4bbf51d  specs/skills/20261029-speckit-workflow-foundation/requirements/prompts/2026-11-05-workflow-revision.md
d2ed50b2a8aea44c66bf52775a9ec4dfbf1e637a43c6cecd2184b8192f2dde3e  specs/skills/20261029-speckit-workflow-foundation/requirements/raw/2026-11-05-workflow-adjustments.md
7bd944d9a39aae359bbfb7856b735e4cf7f5ea30269ad4f82c65b155b31d83b6  specs/skills/20261029-speckit-workflow-foundation/research.md
9d39dd6becae60e43cb65b1351f9b3412a173fcb4a610ca41913fd9a66b76bd2  specs/skills/20261029-speckit-workflow-foundation/spec.md
5daad5a7a1c8b1de3848e2836d6d07b4b096d77cd5ab365898898c2c6750c3ee  specs/skills/20261029-speckit-workflow-foundation/tasks.md
14925d2dd9a7b3807c5c3428bc1f7b26c24bc22f03c38d87754c3d9869787891  specs/speckit/001-atomic-skills/business-flow.md
ca413ce8e7b7387919e1d72acf3f468863093f0bc0725229ee69d44fc2eab2a9  specs/speckit/001-atomic-skills/checklists/requirements.md
78a0bc49ba5f6b1fc583503a94d4d57450da392471b28f240b8ad162eba27b55  specs/speckit/001-atomic-skills/contracts/artifacts.md
961149ce2189079a1c0571de990f84bc72ac3889eaf5efafdbbc76b551761928  specs/speckit/001-atomic-skills/contracts/eval-report.md
e79f4fdcf75fc574393bf9c9952d30db0bcc144ef7ad425ddaea51d9726e19b0  specs/speckit/001-atomic-skills/contracts/hooks-extensions.md
e34d79451a34b937c5e5ba106d59c739fa40decfe574d22d5427b2f6a079faaf  specs/speckit/001-atomic-skills/contracts/mcp-server.md
6430786583f3ccd368ed657d4df451585b3696d32621af72b44fba3e04d074c2  specs/speckit/001-atomic-skills/contracts/pipeline-base.md
5b3f0b9b4836e15c8be65372c1484e44f0b8923b536c288be1e3de2d2ddf313c  specs/speckit/001-atomic-skills/contracts/skills-packaging.md
b490448a46a7d60301f64bde9ba6663de168ccc523ff8fa95fdc6fde409d7581  specs/speckit/001-atomic-skills/data-model.md
8a44ead15f8728fff71c552378c3dcadc16e93ca84851631a2666f318cfc4df9  specs/speckit/001-atomic-skills/diagrams.md
a4d2cdff79e10eec09d4ceebbde3133e57b683826c57da6b39f4f7f5f50d3b68  specs/speckit/001-atomic-skills/issue-description.md
fcd214bd55071b1cfdd7cfa649535a54209c74aad9a2cd290e704b294d5ffcb4  specs/speckit/001-atomic-skills/logic-flow.md
3f851e96110690960faffa2bfc82b27ca0838a6bcb9bdf8dd1581d8eafe50241  specs/speckit/001-atomic-skills/mcp-eval-report.md
b71284b68939f3a0ddccd46de46d7cde3c88c10c8547cc8734ccc32d678559e4  specs/speckit/001-atomic-skills/merge-request.md
520d58faa82cb09f5625caba1b6baefa431c7332882efb3a59983526fbf78b9d  specs/speckit/001-atomic-skills/plan.md
385f4d7b965015f2d97a88cf49c80a04680a45e18d8c59fae1dfddea059a2367  specs/speckit/001-atomic-skills/pr-description.md
73c8b71b79f4fddac15b978e736a1d2918a6409bec804ca733a793df0c16e55c  specs/speckit/001-atomic-skills/quickstart.md
3760913037376689cb8e64338c20db22f81bc8ca6da001cab71f3d5eb8d4925d  specs/speckit/001-atomic-skills/requirements.md
5cc7ba1743bc54e73445d2446071909632da2ca590c1c77e7d527773ccfab01e  specs/speckit/001-atomic-skills/research.md
a3ab0d2518cd60272e51a7435a237475c059e96d64ae01ac3a7338a9758598fe  specs/speckit/001-atomic-skills/spec.md
bbe17d2580391dd77fee1a3216a467f1a124be9a03eb4dd662e06b6e4c4b4216  specs/speckit/001-atomic-skills/tasks.md
```

## 2026-11-05 T049 续接复核

本节是用户再次指定“开始 T049”后发生的核查，前文与附录保留原采集事实。前文单独等待基线阶段验收的安排，已由对话 R40（原仓库私有记录，未迁移）及当前 [tasks Phase 1](../../tasks.md#phase-1us1--us8p1increment-工程能力与必要前置)替代：T049～T054 同属首个实施阶段，T049 是内部前置，首次用户阶段验收在 T054 之后。工程完成仍只由原 tasks.md 勾选记录。

### 复核输入、方法与实际结果

本次为小型只读基线验证，依据章程 IV：不改变技能、脚本和挂载行为；复用原快照，实际重新计算摘要、解析登记并查询本地版本，能够覆盖本任务的状态追溯要求。未引入依赖、外部交互或跨包契约，无新增 C1～C4 风险；既有只读方法、无新增交互和既有文档/断言检查满足三项豁免，后续 TV-01/02/03 不因此豁免。

| 输入与实际操作                                                     | 预期可观察结果               | 本次实际结果                                                                                                             |
| ------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| check-prerequisites.sh --json --require-tasks --include-tasks      | 定位用户指定目录             | 返回本 Spec 的绝对路径，退出 0；未新建或切换 Spec                                                                        |
| Python 标准库逐项计算附录 360 个路径 SHA-256                       | 区分历史文档同步与实现变化   | 351 项相同、9 项变化，差异路径和续接起点摘要见下方；源码、脚本、registry 和 hooks 配置未发生快照漂移                     |
| 解析两个 tasks 的正式任务行，并与附录比对                          | 身份、完成事实及历史证据保留 | 121 个 ID/checkbox 全部相同，120 条原行相同；T050 标题按 R40 从“完成阶段验收”变为“保存复核依据”，不修改旧附录            |
| 单列主线历史/当前和分发计数                                        | 不把旧完成事实当本轮完成     | 勾选 T049 前：历史 48 项为 20/28；本轮 32 项为 0/32；分发 41 项为 6/35（完成/未完成）                                    |
| pathlib 实际扫描两个 Spec 的独立子任务目录及 state.json            | 只记录真实存在的旧记录       | 均未发现；未声明迁移过历史子任务                                                                                         |
| 对 19 组来源与 .agents 同名副本逐文件比较相对路径和摘要            | 发现缺失、额外或不同字节     | 19/19 相同；五 modes 扩展副本 5/5 相同，五个生成入口均包含源正文；七 hooks 扩展副本 7/7 相同                             |
| packages/skills 已有 yaml 解析 extensions.yml，JSON 解析 .registry | 登记与来源集合可追溯         | installed 与 registry 均为 modes 加七 hooks；仍是 Tutor/Pair/Review/Explore/Guide 五入口及 12 条 hooks；无新四项迁移事实 |
| 原生 speckit-implement 文件 SHA-256 对照 Codex 安装清单            | 原生来源可核对               | 仍为 848a5c9eff7b99e348927cbde6c35378de9fea3fd317941f58fa0b0b79301eec，与清单匹配                                        |
| 实际检查新来源及入口路径                                           | 不把规划文本当实现           | task-direct、task-increment、artifact-spec-analysis 来源不存在；新 Direct/Increment 生成入口不存在                       |
| 现行章程版本及独立修订来源                                         | 区分治理生效与工程完成       | 4.0.0 与 Sync Impact Report 保留，T050 的三份文本一致性复核仍是下一任务                                                  |

旧附录原任务行全等断言第一次退出 1，原因是上述已获授权的 T050 标题修订。随后按“ID/checkbox 全量保留、唯一正文差异明确对应 R40”重新断言，退出 0；没有回改标题或快照以制造全等结果。

### 历史快照的已存在差异

7 份规格/规划文档差异与已记录的进度同步、阶段合并对应；codex.manifest.json 与 .vscode/extensions.json 的来源不作归因，作为续接前已存在的配置变化保留。本次没有写这些配置。以下为本次正式回填之前的摘要，不维护另一份持续更新清单：

```text
1998acc7ebc0e2c6f8ff8aa44658a7dc2da32704f2c0815bc3ecd7afe319f665  .specify/integrations/codex.manifest.json
cb5fb96e32e6191a0ce703131f89367b87be8126cc0bc55868c2e59b4b38c333  .vscode/extensions.json
5a9fe02ed9717891cdb0fbc46c92a71459100b2e81f45e553aeb020742580257  specs/skills/001-skills-distribution/spec.md
6468623189fdaea153389f7632c59855777391a9b96acd9fad5e22cd147f8723  specs/skills/20261029-speckit-workflow-foundation/checklists/requirements.md
bd73094f8d35207a66ca9454870d5ec8db2f041fd33de9402d986654082e2943  specs/skills/20261029-speckit-workflow-foundation/plan.md
f162652f4652552a4c244657810e7dbf0e66f74366cd8e012cacf62d3a540cac  specs/skills/20261029-speckit-workflow-foundation/quickstart.md
2c6f037f0de16fe26c4b2927a12b409315460e241f70584b850aa3c5392a96a8  specs/skills/20261029-speckit-workflow-foundation/research.md
383566f8641c4fa6912495dcd67a364e6eed036fa77ee27f91a82efd7b0719a0  specs/skills/20261029-speckit-workflow-foundation/spec.md
b883d1ddeb5ac609de6cee185d82ba814ff1ac251f9b7c7aa10c5b119463e309  specs/skills/20261029-speckit-workflow-foundation/tasks.md
```

本次写入前另外保存 997 个现存跟踪文件摘要与文档副本于 `/tmp/foundry-t049-resume-wlqprv02/`，用于限制本次改动范围，临时副本不是长期证据或工程状态。观察到本轮期间暂存区有独立变动：初始摘要为 d525412346d69e1e96c51290418e7179c26fb22428ffda300ddead6645a16bbe，后续为 0109ccee261b94523e67fc4a1ab92bf86f62f0f7a35881a49758013176d0cf48；涉及 Codex 清单、7 份规格/规划文档和对话摘要。此次工具调用未运行 git add/commit/reset，不能宣称暂存区全程不变，也不回退这些变动。同期跟踪文件内容比较只有本轮追加的对话摘要变化，其余 996 个与本次开始时相同。

### 工具、平台与验证边界

本次实际执行 node --version、pnpm --version、bash --version、python3 --version、uv --version，分别返回 v24.22.2、12.16.1、5.3.9、3.15.2、0.13.6，均退出 0。使用前文同一路径缓存解释器加 -B 执行 specify version --json，返回 cli_version=1.2.6，退出 0。仍是 Linux WSL2 x86_64；pwsh 与 specify 均不在 PATH；FOUNDRY_SPECIFY_VERSION 未设置。分支及 HEAD 与原采集相同。

当前 requirements 清单有效 16/16 通过；全文另有 1 项归档旧“直接调用 shell”要求未勾选，该要求已由现行 Node 唯一入口取代，不改其历史标记，也不重新要求启动许可。已按当前 before_implement 的 mvu-gate 核查本任务前置；可选 explainer-doc-sync 无用户指定知识点，不生成资料。收尾 after_implement 的同名技能只核查本轮说明与引用，本轮没有生成或复用知识说明，explainers 下无文档，不建立空章节。

未执行包 lint/check-types/build/test/test:distribution：本次只有基线、任务进度及协作摘要 Markdown 更新，不涉及代码，不能据此称包工程检查通过。未运行 pwsh --version 或 PowerShell 脚本（无 pwsh）、Windows/macOS 矩阵（无对应环境）、最低 Node 22.20.0 矩阵（无对应运行时）或公开来源安装（超出只读任务）；这些平台和安装兼容性仍未验证。未运行 pnpm install、真实 nuxt:prepare、安装/卸载、发布、部署或数据库操作。

本节写后执行 Markdown ESLint，读回并核查相对引用、原历史段落和本次改动范围；具体结果由完成前的实际命令确认，再回填原 T049，不能把本次基线复核当作 Increment 功能或整个 Phase 1 已通过。

## 2026-11-05 提交前治理修订报告归档

用户已授权将当前全部变更一次性提交。依据章程 Governance 的“审阅后、提交前移除”，将章程顶部临时报告原文归档于此，再从正式章程移除；规范正文、版本和日期保持。以下是报告产生时的历史描述，其中未完成范围以原任务最新记录为准；本次不执行尚待后续 Spec 流程的通用清理需求，也不提前完成 T080。

```text
Sync Impact Report
版本：3.0.0 → 4.0.0（不兼容地统一 MVU 业务结果语义并取消新增独立子任务体系）。
治理输入：2026-11-05 两份已确认修订提示词、主线 spec FR-003～008/057～060/065～068/072，及用户要求修复分析发现的问题。
修改原则：III 最小验证单元 → 业务闭环（MVU）与技术前置验证；VII 任务与子任务规则 → 任务与内联步骤。
新增：VIII 仓库内协作影子描述。
删除：VII 下“子任务记录与两种形式”的新编号、独立目录及独立状态要求；历史记录保护继续有效。
保持：I、II、IV、V、VI 与附加工程约束、最低验证和授权边界不变；技术风险触发、三项豁免、依赖阻塞与骨架复用保留。
同步范围：配套修复已同步章程提示词、AGENTS、两份 spec 的当前治理状态，以及主线 plan/tasks/契约/验证指南；不修改模板或技能实现。
未完成：模式源码、注册/卸载、真实入口与技术/用户行为验收仍按任务实施；本次修订不标记工程任务完成。
T050 复核（2026-11-05）：III/VII/VIII 与提示词一致，I/II/IV/V/VI 保持原文；本次不改规范正文、不升版。
复核依据：specs/skills/20261029-speckit-workflow-foundation/tasks.md 的 T050；来源为两份追加提示词及对话 R33。
待澄清占位：无。审阅后、提交前移除此报告。
```

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
