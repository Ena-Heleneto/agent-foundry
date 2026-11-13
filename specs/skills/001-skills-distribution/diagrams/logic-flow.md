# 逻辑流程图：紧急版本按豁免连续推进，主线顺序保留

## 本轮主线图范围（2026-11-12）

依据[主线范围纠正](../requirements/raw/2026-11-12-main-curl-only.md)，本图后半主线执行图移除官方skills专属T013～T015节点及阻塞边，T016接T012；T021保留curl内容与恢复，T027保留curl自动挂载。已完成节点只保留历史，紧急版图及T078～T093不变；文本图核查不代表重新渲染或产品验证。

更新日期：2026-11-12。调用场景：speckit-tasks完成后实际执行artifact-logic-flow，同步当前[任务清单](../tasks.md)、[闭环详情](../mvu.md)及[紧急契约](../contracts/urgent-release.md)。适用任务：紧急T078～T093及保留的65项主线任务。原图由task-increment按用户明确顺序生成，来源见[原讨论](../requirements/discussions/2026-11-10-build-actions-mount-order.md)；下方原主线部分与顺序完整保留，暂停T053与撤回身份不进入执行图。

## 紧急路径依赖增量（2026-11-12）

复用T078～T093共16项身份，均待办；全功能81项有效任务、18项累计完成、63项待办。紧急部分23条边，新增T085→T084共享保护接口依赖，T093→T040仍为唯一总收尾汇合边；连同原主线113条显式依赖共136条。主线尚未完成插件、Actions及全矩阵不是紧急前置，原状态与验收不变。

箭头只表示任务正文的明确依赖，跨图节点为阅读定位重复，边按后项所属图仅绘一次。P须等全部前置实际完成且文件/临时项目互不竞争；package/catalog/预设、Vite、源清单、共享helper与最终身份由协调者收口。图示不代表已开工或工程通过。目标代码均在同工作区`packages/skills-distribution-urgent/`，不在旧独立副本继续实施。

### 工作区基础与US1内容安装

```mermaid
flowchart TD
    T078["T078 核验来源并准备工作区基础"]
    T079["T079 冻结共享接口与真实失败验证"]
    T080["T080 嵌套来源身份及完整构建 P"]
    T081["T081 当前官方规则及来源预检 P"]
    T082["T082 真实官方内容安装 MVP"]
    T078 --> T079
    T079 --> T080
    T079 --> T081
    T080 --> T082
    T081 --> T082
```

T079后，构建T080与在线预检T081可按不同文件并行；T082等待两者，在真实官方工具验证9项完整安装、eval及未选技能为0。代码位置：目标包package/config、build、script/install-skills及tests/official-install.test.mjs。来源身份覆盖实际相关输入及workspace依赖；无关脏文件不代替相关输入检查。

### US3真实挂载与完整宿主加载

```mermaid
flowchart TD
    T083["T083 正常第二步复用完整已装内容 P"]
    T085["T085 稳定共享保护接口及仅Increment P"]
    T084["T084 复用保护接口注册所选hooks P"]
    T086["T086 重建汇合并验证真实两步链"]
    T087["T087 Codex完整加载及旧入口保护"]
    T079["T079 共享接口 跨图前置"]
    T081["T081 来源预检 跨图前置"]
    T082["T082 真实内容安装 跨图前置"]
    T081 --> T083
    T079 --> T085
    T079 --> T084
    T085 --> T084
    T082 --> T086
    T083 --> T086
    T084 --> T086
    T085 --> T086
    T086 --> T087
```

T083等待T081，可与不同目录的T085并行。T085由协调者独占`script/lib/managed-state.mjs`，稳定接口后才开始T084；P不代表两者可同时改共享文件。T086等待四项汇合、重建当前脚本/集中配置/候选，再验证hooks先行、失败不装Increment；T087验证实际注册/派发/完整Codex读取、旧3/4/5入口迁移及用户修改保护。代码位置：目标包script/mount-entry、register-hooks、register-commands、lib/managed-state.mjs及对应tests。

### US5本地验证与连续交接

```mermaid
flowchart TD
    T088["T088 自有bare Git发布故障验证 P"]
    T089["T089 最终同输入复验及ISC交接 不设暂停"]
    T079["T079 共享接口 跨图前置"]
    T080["T080 完整构建 跨图前置"]
    T087["T087 真实宿主与保护 跨图前置"]
    T079 --> T088
    T080 --> T089
    T087 --> T089
    T088 --> T089
```

T088只操作自有bare Git，可与构建/运行模块并行。T089在README等最终修改后，按同一实际输入复验适用工程检查、双构建、真实两步/宿主及保护，交接四处源码、ISC、公开前私有材料处理、根依赖与MCP旧manifest缺口。**全部必需本地验证结束后按已有授权连续推进，豁免中间阶段及逐Task方案重复确认；T090需真实迁仓输入，搬仓、建仓、推送和发布仍核对适用明确授权。** 缺远端不阻断本地；真实发布与公开消费仍未验。位置：目标包build/publish.mjs、README/LICENSE及本Spec的analysis/acceptance/urgent-handoff.md。

### 用户迁移后独立启动公开交付

```mermaid
flowchart TD
    T089["T089 本地完成 跨图前置"]
    T090["T090 新仓库依赖与来源重验及候选"]
    T091["T091 获具体候选授权后发布"]
    T092["T092 匿名固定来源真实两步消费"]
    T093["T093 汇总分阶段真实证据"]
    T040["T040 唯一总体收尾 保留全部原前置"]
    T089 -->|真实迁仓输入及已有适用授权| T090
    T090 --> T091
    T091 --> T092
    T092 --> T093
    T093 --> T040
```

紧急版不再另索取阶段继续确认；依赖满足仍不新增发布授权。用户实际将紧急包、packages/skills、specs/skills、apps/mcp移至新开源仓库且必要输入具备后，T090核对新Git根/实际依赖/ISC及公开材料，以新身份重验；不能直接沿用Foundry SHA或旧候选。T091另需绑定repository/version/sourceRevision/candidateDigest的明确授权，T092匿名验证全集及实际消费。T093不回写已发布字节、不自动完成主线；T040仍等待原T039/T052/T060/T062及T093，紧急公开交付不等待T040。位置：新仓库目标包dist/release.json、内部发布驱动及本Spec的analysis/acceptance/urgent-*.md。

推荐从T078→T079准备，再分配互不竞争的构建、运行模块和bare Git验证；T082为内容MVP，本次本地目标为T087/T088汇合至T089后连续推进具备前置的已授权工作。最终SC-019仍须迁后T090～T093真实结果。必需前置失败只阻断对应下游，CLI退出0、文件存在、旧存档或占位均不能抵扣实际验证。本轮核对Mermaid文本与任务图边，未运行图形渲染。

## 如何阅读

箭头只表示显式前置：构建与占位先验，Actions实现及隔离验证其次，真实挂载最后接通；完整本地交付和迁后真实发布仍等待全部原门禁。跨阶段节点标记来源，依赖边按目标阶段仅绘制一次。P仅表示满足前置且文件独立的机会，不授权派代理或并发写共享输出。外部来源、宿主和发布授权仍按任务文字，不造伪任务节点。

## Phase 1：Setup，保护既有进度与重做边界

```mermaid
flowchart TD
    T001["T001 记录现有消费者、环境与文件基线 已完成"]
    T002["T002 接入MVU测试入口与构建工具声明 已完成"]
    T064["T064 核验存档并移出旧构建实现及相关构建脚本，记录保留消费者、重做边界与恢复依据于 `specs/skills/001-skills-distribution/analysis/acceptance/build-rewrite.md` 已完成"]
    T001 --> T002
    T002 --> T064
```

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`specs/skills/001-skills-distribution/analysis/acceptance/baseline.md`；`packages/skills/package.json`；`specs/skills/001-skills-distribution/analysis/acceptance/build-rewrite.md`。已完成身份只保留原范围，不自动验收新能力。

## Phase 2：Foundational，保留的已验共享骨架

```mermaid
flowchart TD
    T003["T003 验证MVU-A：官方发现、投影与路径 已完成"]
    T004["T004 验证MVU-B：下载与逐项提交（本轮仅 Linux） 已完成"]
    T005["T005 验证MVU-C：独立第二步与实际文件核验 已完成"]
    T041["T041 实现并验证唯一 Node 入口 已完成"]
    T051["T051 验证可独立消费的内容导出骨架 已完成"]
    T007["T007 验证MVU-E：Git精确排除边界 已完成"]
    T002["T002 接入MVU测试入口与构建工具声明 已完成 跨阶段"]
    T002 --> T003
    T003 --> T004
    T003 --> T005
    T004 --> T005
    T004 --> T041
    T005 --> T041
    T003 --> T051
    T004 --> T051
    T041 --> T051
    T004 --> T007
```

跨阶段前置：T002；缺失或未通过时不推进依赖项。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`packages/skills/tests/distribution/mvu-a.mjs`；`packages/skills/tests/distribution/mvu-b.mjs`；`packages/skills/tests/distribution/mvu-c.mjs`；`packages/skills/script/index.mjs`；`packages/skills/tests/distribution/content-export.mjs`；`packages/skills/tests/distribution/mvu-e.mjs`。已完成身份只保留原范围，不自动验收新能力。

## Phase 3：先实现构建配置与临时挂载占位（P1）

```mermaid
flowchart TD
    T074["T074 新建三个插件文件及空工厂 已完成"]
    T075["T075 实现目录插件并接入Vite 已完成"]
    T076["T076 实现技能复制插件并接入Vite"]
    T077["T077 脚本规则到本项再定，实现后接入Vite"]
    T073["T073 插件工厂与技能清单及逐事件配置 已完成"]
    T072["T072 集合来源迁移与单插件自动发现复制 已完成"]
    T065["T065 旧目录及阶段失败契约 已完成，待按新范围核对"]
    T067["T067 来源与计划原实现已归档 完成记录保留历史"]
    T068["T068 重做单配置三目录与MCP自动清单生成"]
    T069["T069 重做Release、附件依赖及两种格式文件生成"]
    T070["T070 重做磁盘复核及构建消费者兼容验证"]
    T064["T064 核验存档并移出旧构建实现及相关构建脚本，记录保留消费者、重做边界与恢复依据于 `specs/skills/001-skills-distribution/analysis/acceptance/build-rewrite.md` 已完成 跨阶段"]
    T073 --> T074
    T074 --> T075
    T075 --> T076
    T076 --> T077
    T072 --> T073
    T064 --> T072
    T064 --> T065
    T065 --> T067
    T067 --> T068
    T068 --> T069
    T069 --> T070
```

跨阶段前置：T064；缺失或未通过时不推进依赖项。T074～T077箭头为用户指定的工程实施顺序，各插件运行时独立读源；脚本生成规则在T077开工前另行讨论。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`packages/skills/tests/distribution/build-pipeline.test.mjs`；`packages/skills/build/distribution/{models,validate,export}.ts`；`packages/skills/vite.config.ts`；`packages/skills/build/plugins/{content,scripts,mcp-manifest}.ts`；`packages/skills/script/mount-entry/mount-entry.{sh,ps1}`；`packages/skills/build/distribution/{models,validate,projection,references,export}.ts`；`packages/skills/build/plugins/distribution.ts`；`packages/skills/build/distribution/verify.ts`；`packages/skills/tests/distribution/{build-pipeline.test.mjs,content-export.mjs,test-build-config.mjs}`。已完成身份只保留原范围，不自动验收新能力。

## Phase 4：再实现 GitHub Actions 发布流水线（P1）

```mermaid
flowchart TD
    T066["T066 在构建验证后接入只读 GitHub Actions 检查"]
    T055["T055 验证同源候选及身份替换拒绝"]
    T071["T071 实现上传后平台收据及精确身份核验"]
    T056["T056 验证隔离 Git 发布的授权、竞争和中断恢复"]
    T058["T058 接通两种布局的工程驱动与完整候选门禁"]
    T059["T059 交付只读检查和迁后手动发布的 Actions 配置"]
    T002["T002 接入MVU测试入口与构建工具声明 已完成 跨阶段"]
    T051["T051 验证可独立消费的内容导出骨架 已完成 跨阶段"]
    T070["T070 重做磁盘复核及构建消费者兼容验证 跨阶段"]
    T070 --> T066
    T002 --> T055
    T051 --> T055
    T070 --> T055
    T055 --> T071
    T055 --> T056
    T071 --> T056
    T056 --> T058
    T066 --> T058
    T070 --> T058
    T071 --> T058
    T058 --> T059
    T066 --> T059
    T071 --> T059
```

跨阶段前置：T002、T051、T070；缺失或未通过时不推进依赖项。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`.github/workflows/skills-check.yml`；`packages/skills/tests/distribution/pipeline-workflow.test.mjs`；`packages/skills/build/ci/candidate.mjs`；`packages/skills/tests/distribution/pipeline-contract.test.mjs`；`packages/skills/build/ci/publish.mjs`；`packages/skills/build/ci/run.mjs`；`.github/workflows/skills-release.yml`。已完成身份只保留原范围，不自动验收新能力。

## Phase 5：US1，正式同版内容与纯安装前置（P1）

```mermaid
flowchart TD
    T009["T009 补齐官方交付的契约与错误输入测试 已完成"]
    T010["T010 定义发布与技能模型和构建期校验 已完成"]
    T011["T011 固化79个agent路径和scope适配 已完成"]
    T012["T012 将完整目录、投影和清单接入正式构建"]
    T003["T003 验证MVU-A：官方发现、投影与路径 已完成 跨阶段"]
    T051["T051 验证可独立消费的内容导出骨架 已完成 跨阶段"]
    T070["T070 重做磁盘复核及构建消费者兼容验证 跨阶段"]
    T003 --> T009
    T051 --> T009
    T009 --> T010
    T009 --> T011
    T010 --> T012
    T011 --> T012
    T070 --> T012
```

跨阶段前置：T003、T051、T070；缺失或未通过时不推进依赖项。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`packages/skills/tests/distribution/official-contract.test.mjs`；`packages/skills/build/distribution/models.ts`；`packages/skills/distribution/agents.json`；`packages/skills/build/distribution/export.ts`；`packages/skills/script/install-skills/install-skills.{sh,ps1}`；`packages/skills/README.md`；`specs/skills/001-skills-distribution/analysis/acceptance/us1.md`。已完成身份只保留原范围，不自动验收新能力。

## Phase 6：US2，下载安装与恢复前置（P1）

```mermaid
flowchart TD
    T012["T012 完整目录与发布内容 跨阶段"]
    T016["T016 补齐下载入口、冲突与恢复测试"]
    T017["T017 完善同版本材料下载和完整性校验"]
    T018["T018 实现归属收据与安全逐技能提交"]
    T019["T019 交付Bash与PowerShell安装四件套"]
    T020["T020 实现阶段报告、退出码与续接提示"]
    T021["T021 验收curl内容完整性与安装恢复"]
    T012 --> T016
    T016 --> T017
    T017 --> T018
    T018 --> T019
    T019 --> T020
    T020 --> T021
```

跨阶段前置：T012；缺失或未通过时不推进依赖项。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`packages/skills/tests/distribution/install-contract.test.mjs`；`packages/skills/script/install-skills/install-skills.{sh,ps1}`；`packages/skills/script/install-skills/install-skills.sh`；`specs/skills/001-skills-distribution/analysis/acceptance/us2.md`。已完成身份只保留原范围，不自动验收新能力。

## Phase 7：最后实现真实 Spec Kit 挂载（P1）

```mermaid
flowchart TD
    T006["T006 验证 MVU-D：仅 Increment、实施准备加载及旧入口受管迁移"]
    T022["T022 补齐挂载范围、前置条件及原生冲突测试"]
    T023["T023 实现本次集合与统一挂载环境核验"]
    T024["T024 对齐所选准备/分析/结案映射与 Increment 输入"]
    T025["T025 完善独立 hook 平台安装及官方重装"]
    T026["T026 消费仅 Increment 的双平台注册器并验证旧入口迁移"]
    T027["T027 接通公共入口、curl安装及自动挂载"]
    T028["T028 验收三平台 Increment、准备加载及迁移消费"]
    T005["T005 验证MVU-C：独立第二步与实际文件核验 已完成 跨阶段"]
    T021["T021 验收curl内容完整性与安装恢复 跨阶段"]
    T041["T041 实现并验证唯一 Node 入口 已完成 跨阶段"]
    T059["T059 交付只读检查和迁后手动发布的 Actions 配置 跨阶段"]
    T070["T070 重做磁盘复核及构建消费者兼容验证 跨阶段"]
    T005 --> T006
    T041 --> T006
    T070 --> T006
    T059 --> T006
    T021 --> T022
    T006 --> T022
    T022 --> T023
    T022 --> T024
    T023 --> T024
    T023 --> T025
    T024 --> T025
    T025 --> T026
    T026 --> T027
    T027 --> T028
```

跨阶段前置：T005、T021、T041、T059、T070；缺失或未通过时不推进依赖项。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`packages/skills/tests/distribution/mvu-d.mjs`；`packages/skills/tests/distribution/mount-contract.test.mjs`；`packages/skills/script/mount-entry/mount-entry.{sh,ps1}`；`packages/skills/script/mount-entry/mount-entry.sh`；`packages/skills/script/register-hooks/register-hooks.sh`；`packages/skills/script/register-commands/register-commands.sh`；`specs/skills/001-skills-distribution/analysis/acceptance/us3.md`。已完成身份只保留原范围，不自动验收新能力。

## Phase 8：US5，完整发布材料（P1）

```mermaid
flowchart TD
    T029["T029 补齐发布可复现与搬离源码的验收测试"]
    T030["T030 完善发布前校验和完整迁移产物"]
    T031["T031 完善维护者迁移与外部使用文档"]
    T027["T027 接通公共入口、curl安装及自动挂载 跨阶段"]
    T055["T055 验证同源候选及身份替换拒绝 跨阶段"]
    T071["T071 实现上传后平台收据及精确身份核验 跨阶段"]
    T027 --> T029
    T055 --> T029
    T071 --> T029
    T029 --> T030
    T029 --> T031
```

跨阶段前置：T027、T055、T071；缺失或未通过时不推进依赖项。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`packages/skills/tests/distribution/release-contract.test.mjs`；`packages/skills/build/distribution/verify.ts`；`packages/skills/README.md`。已完成身份只保留原范围，不自动验收新能力。

## Phase 9：US4，可选精确隐匿（P2）

```mermaid
flowchart TD
    T033["T033 补齐精确隐匿与范围限制测试"]
    T034["T034 实现精确exclude写入与效果核验"]
    T035["T035 接入安装前后隐匿结果与限制说明"]
    T036["T036 验收Git隐匿的独立用户流程"]
    T007["T007 验证MVU-E：Git精确排除边界 已完成 跨阶段"]
    T028["T028 验收三平台 Increment、准备加载及迁移消费 跨阶段"]
    T031["T031 完善维护者迁移与外部使用文档 跨阶段"]
    T028 --> T033
    T007 --> T033
    T033 --> T034
    T031 --> T035
    T034 --> T035
    T035 --> T036
```

跨阶段前置：T007、T028、T031；缺失或未通过时不推进依赖项。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`packages/skills/tests/distribution/hidden-contract.test.mjs`；`packages/skills/script/install-skills/install-skills.{sh,ps1}`；`specs/skills/001-skills-distribution/analysis/acceptance/us4.md`。已完成身份只保留原范围，不自动验收新能力。

## Phase 10：US6，真实 Increment 规划与反馈（P1，交付后置）

```mermaid
flowchart TD
    T052["T052 验收真实 Increment 规划、反馈及分析刷新"]
```

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`specs/skills/001-skills-distribution/analysis/acceptance/increment-behavior.md`。已完成身份只保留原范围，不自动验收新能力。

## Phase 11：完整消费、本地矩阵与可迁移交付验收

```mermaid
flowchart TD
    T063["T063 实现完整矩阵测试入口与发布前本地覆盖"]
    T008["T008 验证MVU-F：单次构建独立交付与范围内消费"]
    T037["T037 运行完整工程检查和原消费者回归"]
    T060["T060 验收可迁移流水线与当前版本本地交付"]
    T003["T003 验证MVU-A：官方发现、投影与路径 已完成 跨阶段"]
    T004["T004 验证MVU-B：下载与逐项提交（本轮仅 Linux） 已完成 跨阶段"]
    T006["T006 验证 MVU-D：仅 Increment、实施准备加载及旧入口受管迁移 跨阶段"]
    T007["T007 验证MVU-E：Git精确排除边界 已完成 跨阶段"]
    T012["T012 将完整目录、投影和清单接入正式构建 跨阶段"]
    T021["T021 验收curl内容完整性与安装恢复 跨阶段"]
    T027["T027 接通公共入口、curl安装及自动挂载 跨阶段"]
    T028["T028 验收三平台 Increment、准备加载及迁移消费 跨阶段"]
    T030["T030 完善发布前校验和完整迁移产物 跨阶段"]
    T031["T031 完善维护者迁移与外部使用文档 跨阶段"]
    T036["T036 验收Git隐匿的独立用户流程 跨阶段"]
    T059["T059 交付只读检查和迁后手动发布的 Actions 配置 跨阶段"]
    T070["T070 重做磁盘复核及构建消费者兼容验证 跨阶段"]
    T021 --> T063
    T028 --> T063
    T030 --> T063
    T036 --> T063
    T059 --> T063
    T003 --> T008
    T004 --> T008
    T006 --> T008
    T007 --> T008
    T012 --> T008
    T027 --> T008
    T070 --> T008
    T008 --> T037
    T030 --> T037
    T031 --> T037
    T036 --> T037
    T059 --> T037
    T063 --> T037
    T037 --> T060
    T059 --> T060
```

跨阶段前置：T003、T004、T006、T007、T012、T021、T027、T028、T030、T031、T036、T059、T070；缺失或未通过时不推进依赖项。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`packages/skills/tests/distribution/matrix.mjs`；`packages/skills/tests/distribution/mvu-f.mjs`；`specs/skills/001-skills-distribution/analysis/acceptance/regression.md`；`specs/skills/001-skills-distribution/analysis/acceptance/pipeline-local.md`。已完成身份只保留原范围，不自动验收新能力。

## Phase 12：迁后平台、真实发布及唯一末尾收尾

```mermaid
flowchart TD
    T061["T061 核验迁后工程与真实平台候选前置"]
    T062["T062 在获授权的独立仓库首次发布并核对固定来源"]
    T032["T032 在真实公开来源完成独立使用者验收"]
    T038["T038 完成三平台全agent矩阵及真实远端复验"]
    T039["T039 同步最终文档、接口示例与图表"]
    T040["T040 汇总交付证据、清理开发遗留并核对结案边界"]
    T030["T030 完善发布前校验和完整迁移产物 跨阶段"]
    T031["T031 完善维护者迁移与外部使用文档 跨阶段"]
    T037["T037 运行完整工程检查和原消费者回归 跨阶段"]
    T052["T052 验收真实 Increment 规划、反馈及分析刷新 跨阶段"]
    T060["T060 验收可迁移流水线与当前版本本地交付 跨阶段"]
    T071["T071 实现上传后平台收据及精确身份核验 跨阶段"]
    T060 --> T061
    T071 --> T061
    T061 --> T062
    T030 --> T032
    T031 --> T032
    T037 --> T032
    T062 --> T032
    T032 --> T038
    T037 --> T038
    T062 --> T038
    T038 --> T039
    T039 --> T040
    T052 --> T040
    T060 --> T040
    T062 --> T040
```

跨阶段前置：T030、T031、T037、T052、T060、T071；缺失或未通过时不推进依赖项。

任务记录：[tasks.md](../tasks.md)。计划代码/证据位置：`specs/skills/001-skills-distribution/analysis/acceptance/pipeline-remote.md`；`specs/skills/001-skills-distribution/analysis/acceptance/us5-remote.md`；`specs/skills/001-skills-distribution/analysis/acceptance/matrix.md`；`packages/skills/README.md`；`specs/skills/001-skills-distribution/analysis/acceptance/distribution.md`。已完成身份只保留原范围，不自动验收新能力。

## 推荐执行顺序与检查点

当前由用户手写修改，AI完成本轮文档同步后等待，不自动沿图推进或修改代码。下列箭头保留工程依赖；既有状态和历史验证不代表未来手写版本已经验收。

T072/T073已完成集合来源、工厂封装及技能选择内容构建，T074文件骨架和T075目录插件已完成，接下来按T076技能复制插件→T077脚本生成插件推进；脚本细节到T077讨论，再对齐相应旧Task。T067原实现归档，T065及原T068～T070图中旧接口只保留显式依赖历史，不代表当前前置能力可用，不能据累计完成直接推进。Actions、真实挂载、完整矩阵及正式发布继续有独立验收。

T066/T067不再并行；有效待办P组仅T030/T031，在前置满足、文件独立且不竞争输出时推进。占位或缺真实挂载证据不得进入正式full/ready，局部isolated检查不等于发布成功。

原图由Increment刷新；本轮保留旧边并增加T073→T074→T075→T076→T077四条工程顺序边，共113条显式依赖；其余历史边保持，待用户方向确定后对齐。当前集合构建见[T073验收](../analysis/acceptance/plugin-skill-config.md)，挂载、MCP内容和Actions仍未完成。未执行Mermaid渲染，不冒充实际平台验证。
