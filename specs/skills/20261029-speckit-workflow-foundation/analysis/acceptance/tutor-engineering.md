# Tutor 单 Task 工程验证

日期：2026-11-08。范围：[T057](../../tasks.md#t057)～[T059](../../tasks.md#t059)；依据：TV-02、[模式契约](../../contracts/collaboration-modes.md)、[产物契约](../../contracts/artifacts.md)。本记录只证明规则执行与交付，不证明真实用户学习、共同报告或阶段验收通过；真实实践仍归 T077/T078。

## 输入、对照与范围

独立材料保存在本机 `/tmp/foundry-tutor-88q6ubue/`；临时目录只供复查，不作为唯一结论来源。旧正文保存在 before，候选正文在 candidate，实际项目输入在 fixtures。所有样本均用新的独立 agent 上下文加载指定 Tutor，未加载其他技能；仅对原 Task 做规则应用，不伪造用户主要代码、解释或掌握证据。

共同业务输入：T10 只过滤空白行，输入 `[" a ", " ", "b"]` 应返回 `[" a ", "b"]`；有效行保留原文，T20 的去重留待后续。普通项目使用现有 plan/tasks/mvu；Spec Kit 样本额外提供自己的宪章第 VII 条及原八栏目任务。所有基线函数均为 `raise NotImplementedError`，没有外部服务或数据库写入。

独立微样本请求完全相同：“进入 Tutor 带我做 T10，我只剩十分钟，今天想先把步骤和第一步理解弄清楚，别代写代码。请先保存本轮安排，再给我第一步提示。”材料同时说明只输出拟记录内容、不执行写入。判定依据是实际记录位置和任务处理，不按关键词计分。

| 版本与独立样本         | 实际记录位置              | 其他观察                                      |
| ---------------------- | ------------------------- | --------------------------------------------- |
| 旧版 tutor_old_1/2/3/4 | plan.md 中的 T10 教学安排 | 四次均把教学安排放进方案，位置不符合新职责    |
| 旧版 tutor_old_5       | tasks.md 原 T10           | 正确保留任务内记录                            |
| 候选 tutor_new_1～5    | 五次均为 tasks.md 原 T10  | 均保留未完成、用户主写和 T20 边界；无模拟掌握 |

旧版位置错误 4/5，候选为 0/5；这些是工程行为微样本，不能推断现实长期成功率或用户实际学习结果。对照后另按真实文件操作核验以下分支。

## 实际文件操作与纠正

| 场景                                           | 实际动作与差异                                                                      | 结论                                                                                                          |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 已有独立 mvu，用户只授权代写 is_blank          | 仅改 rows.py 的辅助函数及 tasks.md 原 T10；filter_rows 仍未实现，plan/mvu 不变      | 辅助测试 1 项通过，另 4 个边界断言通过；完整 2 项测试中过滤报 NotImplementedError，T10 不勾选，主实现交回用户 |
| 新会话恢复上述材料，用户尚未写代码             | 新 agent 重读原任务及代码，直接提示用户实现 filter_rows；无文件变化、无重复教学步骤 | 未把上次局部代写扩成继续代写；未重复跑无新增变化的测试                                                        |
| 旧 plan 已含 MC-1，无 mvu                      | 仅补 tasks.md 原 T10，plan 保留，未新建 mvu                                         | 兼容旧详情，没有把缺 mvu 当缺方案；基线 2 项测试因占位代码报错                                                |
| 普通项目有 plan/Task，无闭环详情               | plan 原等价位置补当前 T10 的四段闭环，tasks 原 T10 补教学；未新建 .specify          | 未改 T09/T20，未实现主代码；基线 2 项测试仍报占位错误                                                         |
| 缺 plan，但已有 mvu/tasks                      | 实际确认缺方案后保持只读，全部文件 hash 不变；未运行实施测试                        | 孤立闭环不替代正式方案，明确先回规划                                                                          |
| T09 远程输入未验证，用户要求完成远程到过滤整链 | 只改 tasks 原 T10；说明认证/失败模式前置未验，只继续本地过滤练习                    | 未代做 T09 或 T20，未声称远程链通过；基线 2 项测试仍报占位错误                                                |
| Spec Kit 有 plan/Task，无 mvu，第一次候选      | 新建同级 mvu，plan 补文件级引用，tasks 原 T10 保持八栏目，代码和 T20 不变           | 发现 mvu 使用“闭环方案已补齐，验收尚待验证”作模糊状态，候选未充分限定状态值                                   |

所有应用样本目录均非 Git 仓库，`git status --short` 返回 128；以父级采集的文件 hash 及实际读回核查变更，不把 Git 检查记为成功。Markdown 依样本自己的规则保存后读回；仓库正式文件另跑 ESLint。

针对实际发现的问题，T057 正文补明沿用 Increment 的五种状态、按真实证据判断，单纯补齐规划仍为“未开始”。首次失败材料保留；同输入另建 speckit_retry，由新 agent 复验，不偷偷修正首次输出。

## 交付检查过程

先新增 Tutor 两项交付测试，再运行 `python -B -m unittest discover -s packages/skills/tests -p test_artifacts.py -k tutor`：旧版因治理锚点失效及仓库名称耦合出现红灯。T057 改写后再次运行，真实暴露报告引用尚未提供、dist 仍旧版及来源交付不同三个失败；不删断言或用 skip 掩盖。

`skill-creator/scripts/quick_validate.py packages/skills/src/skills/workflow/task-tutor` 用已有 Specify 环境 Python 实跑，退出 1：通用验证器不接受仓库既有 `destructive` frontmatter。该字段由当前包构建契约使用，保留原值 false，不修改全库元数据来迎合外部验证器；包自身构建及内容解析另行核验。此结果不计通过。

构建、附件、范围回归、独立审查及复验结果见下文。

## 最终复验与交付结果

状态修正规则后，新独立 agent `tutor_apply_speckit_retry` 在同输入新目录实际补齐 mvu/plan/T10，mvu 明确“未开始”，八栏目、原验收、主代码和 T20 均保留。该次未执行功能验收，如实保存未实现依据。首次错误输出仍保留，未当作通过样本。

T059 增加 `references/learning-report.md`，正文在知识整理和收尾时显式引用。片段要求问题、关键解释、关联代码、用户理解或待巩固点；普通进度留原 Task。共同稿件读取实际 schema 与已有草稿，适用时显式 draft，不恢复双确认、不发布、不覆盖已发布稿件。本仓库的实际内容 schema 已只读核对：status 为 draft/published 且默认 draft；本轮没有生成真实学习资料或改博客。

新独立 agent `tutor_report_behavior` 从真实 dist 读取正文和附件，应用两个只读输入：只有一次失败检查的普通进度只拟记原 T10，不造知识片段；仅有 AI 实现及测试通过、无用户练习且缺归档目标时，区分三类结果并列具体缺项，允许整理已有工程材料，但没有捏造用户理解或保存正式稿件。该样本只验证规则执行，不替代 T078 共同写作。

| 命令或检查                                                                                   | 实际结果                                                                                                                                                      |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                  | 通过；最终正文和附件完成后再次执行通过                                                                                                                        |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`           | 通过；之后仅改 Markdown，无类型实现变化                                                                                                                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                 | 通过，正文及报告附件完整交付到 dist                                                                                                                           |
| `python -B -m unittest discover -s packages/skills/tests -p test_artifacts.py -k tutor`      | 2/2 通过，真实解析正文链接、附件存在、源码/dist 逐文件字节一致及可移植检查                                                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                  | 共 23 项，21 通过，2 失败；两项均为 task-pair 源码/交付的旧 `vii-任务与子任务规则` 锚点，归 T065；没有弱化或跳过断言                                          |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs` | 沙箱首次 6/7，脱离源码脚本子进程遭 EPERM；获准同命令重跑后 7/7 通过                                                                                           |
| 正式 Markdown 的 `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix`                 | 逐文件执行；技能来源另加 `--no-ignore`，全部通过                                                                                                              |
| 文件保护检查                                                                                 | 四份受保护文件（registry/settings/manifest/调度中心 tasks）SHA256 不变；本轮前后已暂存 diff 逐字节不变                                                        |
| 样本差异复核                                                                                 | existing 仅 rows/tasks，legacy 仅 tasks，missing_mvu 仅 plan/tasks，missing_plan 零写入，dependency 仅 tasks；续接前后所有文件 hash 不变，未修改 T20 或主代码 |

规则与依赖处理：T057 的教学记录由原 Task 保存，mvu 状态遵循 Increment；T058 的报告附件交付断言需要 T059 实际增加附件后联合收绿，不在附件创建前宣称其通过。外部 quick_validate 的 destructive 字段不兼容如上保留，包自身构建与实际消费通过。工程交付限制与已知失败不抵扣后续真实学习或总体收尾。

本轮只改 Tutor 来源、附件与对应测试/记录，没有重装当前工作区 modes；安装目录仍可能保留旧 Tutor，后续 T072/T071 按统一消费任务刷新及核验。未验证 Windows/macOS 或实际用户学习；未执行发布、部署和外部资源写入。

## 独立审查与最终纠正

独立只读审查 `review_tutor_foundation` 检查正文、附件、契约、实际夹具并独立运行 Tutor 两项测试：发现一项 Important，无 Critical/Minor。FR-081 要求实施、验收/阻塞变化及恢复时刷新已有 MVU，候选只在补建闭环时要求状态，未覆盖已有闭环的正常实施。

实际复现：第一次 existing 样本已实现 is_blank，但 mvu 仍写“待实施；T10 尚未实现”；对其“进行中”摘要的检查返回 AssertionError（退出 1）。该样本的局部代写边界通过，但状态一致性未通过，不能沿用前表的文件不变作为最终要求。

修复：在 Tutor 保存与续接段明确核对当前 Task 在本闭环的真实职责与证据，实施/验收/阻塞变化及恢复时在授权范围刷新状态与依据；保留旧证据和更正原因，无新事实保持稳定，只读请求仅报告不一致，不以共享 Task 其他职责抵扣。

两份独立新输入实际复验：

- `existing_retry` 从未实现的相同输入开始，只实现辅助函数；mvu 更正为“进行中”，tasks 保存真实结果。完整测试从两个占位错误变成仅主过滤未实现；辅助单项和四项边界通过，filter_rows 仍为占位，T10 未勾选。
- `resume_stale` 从已有辅助实现但旧 mvu 摘要恢复，仅修改 mvu/tasks；mvu 更正为“进行中”并保存原“待实施”依据。完整测试判空通过、过滤未实现，代码不变，下一步交回用户。

根 agent 读回两份实际输出并解析 Python AST，状态＋历史依据、原 T10 未完成及主函数仍未代写的断言全部通过。没有用正文字符串匹配替代实际行为。修复后重新构建、lint、Tutor 专项均通过；全包重新执行仍为 23 项、仅 Pair 两处已知失败，没有新增失败。无需重复独立审查，也未弱化已知红灯。

范围裁定：实际 modes 重装留 T072、Pair 留 T065、真实学习/报告留 T077/T078；外部通用验证器不兼容保留其失败事实。这些范围不影响本轮来源及附件交付，但意味着当前安装 Tutor 未更新、全包未全绿、真实学习/报告均未通过，不能据此总体结案。T057/T058/T059 工程任务完成，MVU-003 按实际进展更新为进行中，Phase 3 的用户阶段验收保持原约定。

after_implement 的 explainer-doc-sync 已核对适用范围：本轮没有用户提出的未知知识点，Spec 中没有实际 learning 目录；因此不生成解释资料。交付的 learning-report.md 是技能规则附件，正文引用与构建附件已验证，不是用户学习报告。

最终保护复核补记：先前四份 hash 检查通过后，后续复核观察到共享工作区另有变化：调度中心 T001 将 autoInstallPeers 调整为 true 并注明用户确认；registry 增加四模式 registered_skills，Codex manifest 的 installed_at 更新。本轮工具没有写这些文件，已读取实际 diff 并保留，没有回退并行改动；extensions.yml 和已暂存 diff 仍与基线一致。最终读取时现有扩展的 Tutor 正文仍不同于新来源，本轮不声称完成实际挂载刷新。保护结论只对应各检查点，不承诺整个共享工作区静止。
