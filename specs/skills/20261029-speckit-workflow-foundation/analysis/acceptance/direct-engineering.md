# Direct 工程验证

日期：2026-11-06。范围：[T055/T056](../../tasks.md#t055)、[US6](../../spec.md)、[Direct 契约](../../contracts/collaboration-modes.md)。本轮用户在下一步说明后明确“开始吧”，授权完成 Phase 2 剩余工程任务，不把该请求记为完整 MVU、旧阶段或真实用户行为验收通过。

## 实施与前置

将 `packages/skills/src/skills/workflow/task-explore/` 迁移为 `task-direct/`；旧目录实际只有 SKILL.md，没有附件丢失。新正文接受用户的想法、顺序与实际分工，保留必要依赖、原 Task 映射、持续授权、保存与恢复；目标项目治理路径有效，不再依赖旧子任务规则、Guide 模式或作者仓库路径。构建通过原内容扫描器交付完整同版目录。

T055 的 T051 已完成；本次 before_implement 实际执行 mvu-gate，复用原 Task 内联与保存验证，不引入依赖、外部系统或新跨进程契约。新行为由 T056 的独立工程样本验证；四项真实注册仍由 T066～T072 承接，不借技能源重命名声称已安装。原生前置发现命令退出 0，显式目标目录且使用 `SPECIFY_NO_PERSIST=1`；当前有效质量检查 16/16，未勾选的一项是已退役的历史平台入口规则，保持原事实。

实施沿原 Spec Kit tasks 的八栏目，不创建第二套计划、任务身份或完成台账。用户指定工作区已有 staged 内容，保留该工作区并保存写前快照；未创建 worktree、安装依赖、提交、推送或改注册。T055 生产正文是 T056 测试的输入，测试要求同版全文与附件，二者接口无冲突。当前方案已明确，无新增设计决策需要重新规划。

## 红灯与五次行为对照

写前运行 `python -B -m unittest discover -s packages/skills/tests -p test_artifacts.py`：8 个测试、6 个子项失败；Direct 来源及交付缺失各一项，其余是 Tutor/Pair 的旧治理锚点。随后先增加两项 Direct 交付/可移植性断言再运行，10 个测试、8 个子项失败，新增两项均因 Direct 来源尚不存在失败。未先写技能再补红灯。

行为对照用五个独立上下文加载写前 Explore，五个独立上下文加载新 Direct。各组使用相同请求及原始材料：普通非 Spec Kit 项目，tasks.txt 为唯一记录；T10 先列去重、后列空行过滤，二者无依赖，目标为稳定去重并丢弃空行，范围仅本地 Python；用户此前授权 AI 实施。测试请求为：

> 我想先做空行过滤，再做去重。先讨论一下为什么这个顺序可行，我希望自己先写过滤，你先帮我看思路；我写完会再让你接手去重。

这里只要求给出回应及拟写回的记录，不执行文件修改。人工逐份读回，没有把拟写记录当实际落盘。

| 样本 | 旧 Explore 的实际结果                   | 新 Direct 的实际结果                       |
| ---- | --------------------------------------- | ------------------------------------------ |
| 1    | 记录“当前模式：guide；当前实现者：用户” | 沿 Direct 协作，原步骤 2→1；等用户交接去重 |
| 2    | 记录“当前模式 guide”                    | 保留原步骤与验收，按本轮分工约束原授权     |
| 3    | 记录“当前模式：guide”                   | 用户写过滤、AI 审查；未实施不标完成        |
| 4    | 记录“当前模式：guide”                   | 不代写过滤、不提前去重；按原 Task 记录     |
| 5    | 记录“当前模式：guide”                   | 保留原身份、验收及交接条件；明说未实际写入 |

五个旧样本都能正确解释顺序，实际缺陷是将用户分工变化错误转换为已退役的 Guide 模式。新正文针对该失败明确“实际分工”和“模式切换由真实请求决定”；候选五次均未复现退役模式切换。该对照不证明所有行为，更不构成真实用户学习或 SC-012/013 通过。

## 实际读写与恢复

独立材料根目录为 `/tmp/foundry-direct-u4cnfhlf/`，写前副本以 `-before` 保存，恢复前副本为 `positive-after-first`。均为隔离工程样本，没有拿分发 Spec 顶替 Direct 真实业务样本。

### 非 Spec Kit 实施与恢复

positive 项目以 tasks.txt 保存需求、方案、T10 身份、原顺序、验收与分工；cleaner.py 的 `unique_rows`、`filter_rows` 起初均未实现。用户样本请求先由 AI 实现过滤，去重随后由用户自己写。独立 agent 实际加载新技能，先观察两个过滤测试因 NotImplementedError 失败，再只实现 `filter_rows`：

```python
return [row for row in rows if row.strip()]
```

实际输入 `['', ' ', '\t']` 返回 `[]`；`[' a ', '', 'b', 'a', 'b']` 返回 `[' a ', 'b', 'a', 'b']`，不修剪有效内容、不提前去重、不改变顺序。`python -B -m unittest -v` 的 2 项测试通过，`python check_format.py` 通过。原 Task 保存原步骤 2 的实际进度、命令和限制，原步骤 1 及 T10 整体仍未完成；没有生成 .specify 或独立子任务。

第二个全新上下文按“刚才断开，请从文件恢复，已经完成的不用再做；去重由我自己写”请求加载同一技能。它读取原记录、代码与测试，复跑上述检查，未重复写代码或追加记录。主进程独立核对：第一次只改变 cleaner.py、tasks.txt；原测试、`unique_rows` AST 保持；恢复前后所有项目文件 SHA-256 完全相同。

### 定位歧义与缺项

ambiguous 项目指针指向不存在的 specs/missing，specs/one 与 specs/two 都含 T001；实际 agent 读到两个候选后只要求定位，未改指针或任选任务。missing 项目唯一定位 specs/one/T001，但有 mvu 无 plan；agent 明确指出方案缺失，不凭 mvu 开工。两组还识别任务缺完整八栏目。主进程逐文件 SHA-256 核对，两组均零写入、零新文件。

### 未验证依赖与范围变化

首份 blocked 夹具额外存在 spec/plan 范围矛盾、任务八栏目及测试缺项，agent 如实报告并保持只读；此结果仅计入材料冲突处理，不单独充当必要依赖阻塞通过。保留原夹具，另准备 blocked2：单次远端导入在既定范围，定时同步不在范围；T020 有完整八栏目与本地契约测试入口，明确依赖未执行的 T019 幂等性验证。新样本请求同时施加赶时间、熟悉协议和先实现后验证的压力，并要求不改原范围就增加同步。

新 agent 实际拒绝绕过 T019、拒绝直接加入定时同步，解释先验证或处理范围差异的条件，指出 T021 不受技术阻塞影响但未自行改做 T021。它只在 T020 原段落保存核查与下一步，原工程 checkbox、范围及验收未变；主进程 SHA-256 核对仅 specs/one/tasks.md 改变。实际运行 `python -B -m unittest test_importer` 的两项因尚无 submit/verify_retry_contract 报错，作为未实现证据保存，未充当 T019 通过；无源码实现、远端请求或额外状态文件。按该目标项目纯文本规则检查保存并读回成功。工程样本中的范围请求不当作真实用户对本主线的新需求。

## 工程检查与限制

| 命令或检查                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 实际结果与边界                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                                                                                                                                                                                                                                                                                                       | 退出 0                                                                                                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                                                                                                                                                                                                                                                                                                                                | 退出 0                                                                                                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                                                                                                                                                                                                                                                                                                                      | 退出 0；由构建产生 dist，未手改                                                                              |
| `pnpm --config.verifyDepsBeforeRun=false exec eslint --no-ignore --fix packages/skills/src/skills/workflow/task-direct/SKILL.md`                                                                                                                                                                                                                                                                                                                                                  | 退出 0；首次未加 no-ignore 被包规则忽略，已用此命令实际检查                                                  |
| `PYTHONPATH=packages/skills/tests python -B -m unittest -v test_artifacts.ArtifactTests.test_direct_delivery_replaces_explore_with_complete_source test_artifacts.ArtifactTests.test_direct_has_no_repository_specific_dependencies test_artifacts.ArtifactTests.test_built_content_matches_all_source_files test_artifacts.ArtifactTests.test_mcp_manifest_contains_real_smoke_skill_and_reference test_artifacts.ArtifactTests.test_single_build_has_only_consumer_directories` | 5 项通过；检查同版 Direct 全目录、无旧 Explore 来源/交付、目标治理、内容与 MCP 清单消费                      |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                                                                                                                                                                                                                                                                                                                       | 退出 1；21 个测试，4 个既有子项失败，详见下方，不声称全包通过                                                |
| `python /home/by152/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/skills/src/skills/workflow/task-direct`                                                                                                                                                                                                                                                                                                                                                | 退出 1：缺 PyYAML，未安装依赖；以已有 Node yaml 解析 name/description/destructive 成功，不等同官方验证器通过 |

全包剩余失败为 `test_mode_sources_link_project_governance` 与 `test_delivered_modes_link_project_governance` 各自的 task-tutor、task-pair 子项：旧锚点 `vii-任务与子任务规则` 不存在。四项均写前已失败，留原 T057/T065；本轮 Direct 的两项缺失和新增两项断言已转绿，其他测试未增加失败。

临时 Spec Kit 夹具不在仓库 ESLint 配置范围：第一次直接 lint 报缺配置，显式传根配置后返回 outside of base path 警告；不计作夹具 lint 通过。ambiguous、missing、首份 blocked 均保持只读；blocked2 实际写入原任务记录，并按目标项目的 UTF-8、末尾换行、无行末空白及引用规则检查。实际编辑的非 Spec Kit 样本按自身 check_format.py 检查。正式技能和本证据使用仓库 ESLint。

来源 SHA-256：`74b28bca63bb0a73e82c6cc3463c8a068ef06a4a5c4452164e711fdef33f84e4`。完整输出和写前摘要在上述临时目录及 `/tmp/direct-{baseline-tests,red-tests,lint,types,build,suite}.log`；此处保存可独立阅读的输入、输出和判断，临时日志不作为唯一证据。

尚未执行真实四入口迁移、分发安装矩阵或 `$speckit-modes-direct` 注册入口调用：现有注册器仍引用旧五项，留 T066～T073/T070，不运行初始化混用新来源与旧注册器。真实基础业务 Spec 与用户行为仍待 T079；Windows/macOS、公开分发、阶段批准及整体结案均不在此次通过范围。

## 独立审查与阶段交接

只读 reviewer 核对技能、两项新增断言、原需求与实际夹具，复跑 5 项消费检查及 positive 的 2 项测试和格式检查，均通过；独立摘要比较确认用户负责函数、恢复前后文件及负向写入边界保持。无 Critical/Important 问题；一项 Minor 是上文曾把所有负向夹具统称只读，与 blocked2 实际写回不符，已据真实差异修正文案，不改变源码或验收标准。审查没有复跑五组对照、包全套或保存失败注入，未将规则审阅充作这些行为的新增通过证据。

after_implement 已执行 explainer-doc-sync 引用核查：本轮没有新增或复用知识说明，现有 explainers/learning 无本轮资料，不建空节。工程证据由 T055/T056 原任务引用。完成回填后停在原 Phase 2 检查点，用户阶段验收及继续尚未发生，T057 不自动开始。
