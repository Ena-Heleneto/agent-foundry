# Explore / Guide 工程交付与安装验收

日期：2026-11-03。所属任务：本 Spec 的 T042、T043。仅证明命令声明、工程交付、官方安装及当前任务定位，不代表 T044/T045/T046 的真实协作行为已通过。

**当前判定（2026-11-03 包职责修正）**：下文保留旧方案的执行事实，不再表示当前交付通过。T042/T043 已重开，前置新增 T048；包级 extension.yml 与直接安装整个包的方式已撤销为实施依据。待新脚本实际验证后追加证据，不能用本记录抵扣。

## 范围与改动

用户验收 Guide 正文修正后要求“按照目前的 task继续”，执行追加 Phase 5。T042 在 `packages/skills/extension.yml` 追加 `speckit.modes.explore`、`speckit.modes.guide`，直接引用各自源 SKILL.md；保留旧三条命令及版本。README 补齐场景、实现者、正式任务前提、Codex 调用与通用技能兼容边界。

T042→T043 的接口核对：两个声明分别指向已完成的 task-explore/task-guide，目录与 frontmatter name 一致，五条命令名唯一。沿用现有构建、registry 和官方扩展安装，无新增包装、hook、状态 helper 或分发实现。按 mvu-gate 复核，无新依赖、外部业务交互或跨包契约；既有同类安装与机械检查可覆盖本次接入，不新增 MVU。

## 实际命令与结果

所有 pnpm 命令实际带 `--config.verifyDepsBeforeRun=false`，只关闭执行前依赖自动检查，保留实际校验。

| 命令                                                                                                                                                                        | 结果                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix --no-ignore packages/skills/README.md`                                                                           | 退出 0                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix packages/skills/extension.yml`                                                                                   | 退出 0                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix --no-ignore packages/skills/src/workflow/task-explore/SKILL.md packages/skills/src/workflow/task-guide/SKILL.md` | 退出 0                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                 | 退出 0                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                          | 退出 0                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                | 退出 0；Vite 8.3.5 默认构建                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                 | 构建后退出 0；6 tests 全通过，包含真实 MCP registry 的正文一致性及治理描述检查 |
| `node scripts/dev/actions/link-skills/test-link-skills.mjs`                                                                                                                 | 退出 0；Bash pass 1，PowerShell skip 1，fail 0                                 |
| `uvx --from specify-cli==1.2.5 specify --version`                                                                                                                           | 初次沙箱内退出 2：uv 缓存只读；按环境审批重试退出 0，版本 1.2.5                |
| `uvx --from specify-cli==1.2.5 specify extension add --help`                                                                                                                | 沙箱缓存锁失败后按审批重试退出 0，确认官方支持 `--force` 覆盖已有安装          |
| `uvx --from specify-cli==1.2.5 specify extension add --dev packages/skills --force`                                                                                         | 按审批执行，退出 0；官方显示安装成功，提供五条命令                             |

`specify extension list` 的核对调用曾因会话中断丢失返回，不将它记为通过；安装状态以成功安装输出、实际 registry 和生成入口现场核对。未运行根 pnpm test、test:distribution、distribution 构建或旧模式专项验收；未修改 MCP server，按最小验证范围不追加 server 测试。

## 安装、保护与消费者核对

安装前确认旧三份安装源与仓库源一致，安装目录与源的差异仅为本次修改的 extension.yml。CLI 1.2.5 使用既有 `--force` 更新方式，无手工安装产物。

安装前对 19 个文件采集 hash：10 个原生核心入口、3 个旧模式生成入口、hooks YAML、4 份已有用户 Spec Kit 配置及 `apps/dispatch-center/nuxt.config.ts`。安装后比较输出仅列出旧三模式生成入口变化，其余保护文件未变。最初断言把这些生成入口也视为字节不可变，因三项变化退出 1；检查旧入口显示官方重新渲染 metadata.source，并省去旧版附加标题，安装源正文未改。未手动回写生成入口，未调用旧模式进行行为验收。

原生核心数量实际为 10；中间说明误称 11，随后现场计数已更正。另一次核对因预设数量 11 而提前断言失败，不作为通过证据。中断后 `/tmp` 中的临时基线已不存在，历史前后比较依据本次会话中已返回的真实检查输出，不伪造持久基线或重建“安装前”快照。

实际 registry 的 `registered_commands.codex` 含五条命令；本版 `registered_skills` 为空，但 `.agents/skills/speckit-modes-explore/SKILL.md` 和 `speckit-modes-guide/SKILL.md` 均已生成，metadata.source 分别指向 `modes:src/workflow/task-explore/SKILL.md` 和对应 Guide 源。不能以空 registered_skills 推断入口缺失。

两份 `.specify/extensions/modes/src/workflow/task-*/SKILL.md` 与仓库源逐字一致；两个生成入口含完整源正文。中断前后均实际读取并核对：

| 源技能       | 源与安装正文 SHA-256                                               |
| ------------ | ------------------------------------------------------------------ |
| task-explore | `f1a56e4f7e32b38beaf774225c95a6c43f90eedb036854fd9804926c80a3f97c` |
| task-guide   | `71b4718cd03489e09690d43f92537d8758a39f54a6d34730e984ede519c59fcb` |

原生消费通路为官方声明→安装源→生成 Codex skill；通用消费通路为默认构建 manifest→真实 MCP registry 的 task-explore/task-guide。包测试已实际消费后者，不把它误写为已执行其他项目的 ENV-01 行为。

## 新入口定位实际操作

输入沿用用户明确指定的本 Spec 和“按照目前的 task继续”，当前唯一任务为 T043；范围限定为 T043 规定的入口定位核验。分别读取两个已安装生成入口的全文，按其定位规则重新读取本 Spec 的 spec.md、plan.md、tasks.md 原 T043 八栏目，并沿用已读取的项目宪章 VII。

Explore 实际定位结果：明确 Spec 优先，定位本目录原 T043；其当前工作是工程交付与安装核对，不是需要未知效果反馈的业务样本，不开展局部试做或虚构用户反馈。

Guide 实际定位结果：同样定位原 T043，目标与做法明确；本次只核对入口，不将本功能既有 AI 实施授权改成用户练习，不替用户编造两步实践。两次定位结果均已在会话中实际说明，未创建任务副本或修改指针。

当前 `.specify/feature.json` 不存在，用户已明确 Spec，故不需要猜测或修改指针。两模式无正式任务拒绝、材料缺项、失效指针、歧义及非 Spec Kit 行为仍由 T044/T045/T046 按真实样本独立验证；本次只完成定位分支，不声称这些场景通过。

## 限制与续接

PowerShell 不存在，未验证其运行分支。此前上游技能校验器环境和 destructive 字段的限制未在本任务处理；工程检查不能替代真实行为验收。本轮没有生成知识说明文档，explainer-doc-sync 的引用校验无新增对象，不建空记录节。

T042、T043 本阶段交付完成，待用户验收追加 Phase 5；明确通过并继续后进入 T044/T045。真实样本仍待用户选择，分发继续暂缓，尚未提交、推送、发布或部署。

## 2026-11-03 脚本路径重新实施

依最新用户决定先实施 T042/T043，再统一交 T048 验收。包根静态扩展源已移除，新增脚本只准备所选模式临时输入并调用官方 CLI。目标包 lint/check-types/build/test 通过，包测试为 11 项；Bash 沙箱通过，PowerShell 缺失。真实官方沙箱两模式安装、单选、重复和正文冲突已执行，当前工作区受管产物没有改动。

完整命令、失败修正、独立审查及限制见 [统一挂载验收](script-mount-mvu.md)。含自定义 hooks 的既有配置当前会在调用前被拒绝；新入口真实任务定位、官方失败恢复和 PowerShell 未验。T048 尚未整体通过，不能沿用本文件旧“已完成”历史结论。

## T065：Pair 对原 Task 内联步骤的治理兼容（2026-11-09）

本节是新四模式范围内的 Pair 公共治理兼容检查；以上 Explore/Guide 旧交付原文及当时结果保留，不作新四模式通过依据。用户在获知下一步为 T065 后明确“开始”，本轮仅实施该 Task，不增加 Pair 专项真实行为、学习、报告或旧子任务管理能力，不推进 T093/T094。

### 现状、修正及来源

实际读取 Pair 生产来源，确认它仍链接旧“VII 任务与子任务规则”，并把已有 Subtask 当作当前工作对象；不是只因任务未勾选而推定未修复。当前目标项目宪章已为6.1.0，VII 标题仍是“任务与内联步骤”，新加入已确认修复、最终代码及已撤回方案的续接约束；本轮读取并沿用，没有修改宪章或其他技能。

唯一生产修改为 packages/skills/src/skills/workflow/task-pair/SKILL.md：description 和工作对象改为原 Task 的内联步骤；读取目标项目根目录宪章 VII 正确锚点、相关材料及已有 mvu；已有历史子任务依治理保留身份/证据并衔接有效未完成部分，没有旧记录就不虚构迁移。不从技能源/安装目录解析目标治理，不在普通项目创建 .specify；去掉本仓库专属格式命令，遵循目标项目规范。保存与续接使用原记录，先核对已确认结论和实际代码，部分失败先修复受影响记录，不重复实施。

用户编写主要代码、AI讨论审查及已授权本地检查的分工，以及明确局部授权后才编辑、提交/推送/发布另依授权的整段正文原字节保留。未加入 business-node-delivery 名称、链接或显式调用，其他模式与通用技能未改。正式 Pair 来源 SHA256 为 `d08b08e801fdadbbbac844f4cebf0c6eef1a05df21b1af1cb6415e6c17c9207a`。

### 实际红灯、工程检查与限制

临时根 `/tmp/foundry-t065-20261109/` 保存 before 原文、protected.json、baseline-governance.txt、final-test.txt、fixtures/situations.txt 与 contract-check.txt。原测试断言和包代码没有修改。

| 实际命令或动作                                                                                                                      | 本轮结果                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `python -B -m unittest discover -s packages/skills/tests -p test_artifacts.py -k project_governance`                                | 修改前2项均失败：Pair源和构建副本引用不可达的旧VII锚点；退出1，保留原失败                                                                                 |
| `python -B -m unittest discover -s packages/skills/tests -p test_artifacts.py -k test_mode_sources_link_project_governance`         | 修改正文、尚未重建时，来源检查1项通过、退出0；未把旧构建副本算作通过                                                                                      |
| `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix --no-ignore packages/skills/src/skills/workflow/task-pair/SKILL.md`      | 退出0，并读回                                                                                                                                             |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                         | 退出0                                                                                                                                                     |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                  | 退出0                                                                                                                                                     |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                        | 按已知git子进程限制申请工具审批，实际构建退出0；没有手改dist                                                                                              |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                         | 重建后24项全部通过、退出0；此前Pair源/副本两项治理失败消除                                                                                                |
| 读取四模式完整文件集合及SHA                                                                                                         | Tutor/Pair/Direct/Increment 的来源与 dist 全目录一一同字节，不仅核对入口存在                                                                              |
| `python3 <source-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/skills/src/skills/workflow/task-pair` | 系统Python缺PyYAML，退出1，独立通用校验未完成；未安装依赖或修改原有元数据，不能报告该工具通过。包构建和既有测试已校验实际交付，但不冒充该独立校验器的结果 |

### 一次独立材料应用核查

独立上下文 t065_contract_check 实际读取修改后的完整 Pair 来源和 situations.txt，仅作已有公共任务契约的材料应用检查。四个场景在同一个上下文内，不计作四次独立调用；输入是测试事实，不是用户实际实践。没有要求执行工程、写任务或访问业务接口，也没有添加专项真实 Pair 验收。

| 材料场景                                                   | 独立输出的实际判断                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A：明确Spec/原Task，指针旧、权限未验、只讨论且无历史子任务 | 用户显式Spec优先，工作对象为T001当前内联步骤；不虚构迁移，不编辑代码，不把正常请求等同权限通过 |
| B：无.specify、work.md的W17、只审查                        | 沿用W17及work.md，不创建Spec Kit材料，不代写或虚报测试                                         |
| C：真实存在的历史S01/S02、部分实现和已撤回旧方案           | 保留历史已完成结果和证据，把有效未完成部分衔接T002，不恢复旧状态文件方案，不重复已完成代码     |
| D：指针失效，两个Spec均有T001且无唯一依据                  | 报定位歧义，只补必要定位，不任选目标或写候选任务状态                                           |

已读回完整输出；各项明确说明未读取样本项目真实文件、未执行接口/权限验证，不能写成工程或用户验收通过。这是来源材料可用性检查，不证明真实四模式自然发现、用户学习、旧入口迁移或正式挂载完成；相关工作仍归原 T093/T094/T066～T073。

### 回填与剩余范围

Pair 正文、工程基线、公共治理/交付检查及上述材料应用满足 T065 自身信号，回填该 Task。其他生产来源、宪章和AGENTS写前摘要保持。工作区实际安装副本及正式入口未刷新，未发布或提交；没有把当前来源交付记成真实用户行为、阶段批准或整个MVU通过。通用校验器缺PyYAML的限制单列保留。关联Markdown写后即时ESLint、读回，任务和历史保护结果随本轮最终核查保存。

### T065 后续修正：删除历史子任务兼容说明（2026-11-09）

用户明确要求删除 Pair 正文中“遇到历史子任务时如何衔接”的兼容说明，理由是判断本仓库应该尚未创建子任务。该表达授权删除这段规则，不据此宣称已全库证实不存在历史文件。本轮仅删除“选择工作对象”段中实际历史子任务的保留/衔接及没有旧记录不虚构迁移两句，保留原Task、内联步骤、项目上下文、保存续接及局部授权，其余Pair正文原样。

Pair最新正文不再包含“子任务”或Subtask；源码与重建dist同字节，新SHA256为 `5d462b4c5764d52e77fd517088efda8d76be17aa8ce3eade4706bacbd0fdcc97`。前文SHA及C场景属于删除前版本和当时材料检查，不作当前Pair必须保留旧兼容分支的依据，没有篡改此前实际输出或虚称重新运行C场景。

本轮实际源Markdown即时ESLint、包lint、check-types及build均退出0；包Python24项全部通过。build沿已知git子进程限制经工具审批执行，未手改生成物。T065原完成状态及其他任务勾选保持，未修改宪章、其他模式、业务代码或真实安装入口；不把这一段删除扩为全仓历史删除或T093/T094实施。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
