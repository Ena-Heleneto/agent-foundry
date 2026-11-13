# Phase 3 / US1：目录记录与分级分类验收

日期：2026-10-30。范围 T006～T010；用户已确认子任务目录 Markdown 唯一记录、不要 state.json、删除 workflow-task-context，并授权记录冲突后继续。Phase 3 T006～T010 实施及自检完成，当前等待用户阶段验收，不将本记录视为用户验收通过。

## 实际改动

- tasks.md 顶部保存最终冲突决议；Phase 3 八栏目改为现行做法；旧 Phase 4～8 做法归档禁用，需在所属阶段开始前修订，不再指向废弃 helper 继续实施。
- 章程由 1.4.0 升至 2.0.0：VII 从 tasks 全文记录改为父任务索引/子任务目录唯一记录，属于不兼容治理重定义；IV 增加分级选择及证据要求。III 逐字保留。临时 Sync Impact Report 保留供审阅，尚未提交。
- artifact-constitution-prompt 已改 ESLint，按当前章程刷新原位置提示词，保留原治理内容。plan、data-model、workflow/artifacts/review、quickstart、技术图统一直接维护 Markdown；旧 research 和验收保留为试制历史。
- Tutor/Pair 最小入口直接读取子任务目录和证据、跨模式续接、失败冻结/核对/重试，不再调用共享状态技能；完整模式仍待 US3/US4。
- 删除已取消 helper 专属 test_workflow_state.py、test_workflow_integration.py 及 workflow-v1.json；保留 Python unittest 入口，新增 test_manifest.py 实际验证构建清单及 MCP 文本消费，非零用例运行，不用 skip 掩盖删除后的失败。
- 五个 artifact 技能采用 diagrams/、descriptions/ 新分类；保留 issue 原意/PR 一次生成/项目结案幂等、旧根兼容及双路径冲突停止规则。
- 两平台注册器及真实 extensions.yml 的六条 artifact prompt 已同步新路径与 ESLint；旧随行 hooks 留 Phase 4 定向退役。注册测试写临时目标，真实配置只读取，新增真实激活配置与注册器一致性断言。

## 验证命令与结果

| 实际命令/操作                                                                                                        | 实际结果                                                           |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint                                            | 退出 0                                                             |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types                                     | 退出 0                                                             |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build                                           | 退出 0；Vite 既有缺扩展名提示保留                                  |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test                                            | 3 组真实清单/MCP unittest 通过，退出 0                             |
| pnpm --config.verifyDepsBeforeRun=false exec eslint --fix scripts/dev/actions/register-hooks/test-register-hooks.mjs | 退出 0；相关改动声明已有中文多行 JSDoc                             |
| node --import /tmp/phase3-yaml-loader.mjs scripts/dev/actions/register-hooks/test-register-hooks.mjs                 | Bash 20 passed / 0 failed；PowerShell 缺运行时 skip                |
| bash scripts/dev/actions/register-hooks/register-hooks.sh                                                            | 真实配置替换 6 条、其余 7 条不变，退出 0                           |
| 构建真实 MCP load_skills、完整源/参考文件比对                                                                        | 17 个技能，无废弃技能或其有效调用，正文与参考完整对应              |
| 两平台注册数据静态对比                                                                                               | 13 个键的描述/prompt/optional 完全相同；不冒称 PowerShell 实机通过 |
| 原生 Implement、MVU 源/副本、旧历史规格及根 issue/PR/业务图/逻辑图 SHA-256 对比                                      | 与开始时采集一致；章程 III 逐字一致；两平台 MVU 注册原文未改       |
| 活动 YAML 对 HEAD 的真实 YAML 解析比较                                                                               | 五条 MVU 所有字段、数组位置和顺序完全相同，退出 0                  |
| Python 新测试 compile/AST docstring 检查                                                                             | 退出 0，不生成 pycache                                             |
| bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks                             | 定位本功能绝对路径，退出 0；requirements 16/16 只读，不改 markers  |
| 修改 Markdown 的 pnpm exec eslint --fix                                                                              | 每份修改后立即执行；技能源使用 --no-ignore 实际校验；退出 0        |

## 红灯、独立审查及修正

1. 上一轮删除 helper 后原 25 项测试全部因缺失 helper 失败；本轮不恢复被取消实现，移除专属旧测试，改为验证真实构建消费。新测试先检出旧清单与当前源不一致以及 Tutor/Pair 的废弃调用，build/入口更新后 3 项通过。
2. 分类注册器断言先得到 8 passed / 6 failed，失败是五个旧根路径及宪章 prettier 指令，更新注册器后通过。直接 node 命令的 yaml 模块导入失败另记环境问题，不计作这组红灯。
3. 独立只读审查指出真实 extensions.yml 尚未刷新。实际运行注册器修正，并新增只读激活配置比对断言。在临时副本放回 HEAD 旧 YAML：14 passed / 6 failed，六条激活 prompt 均被检出；当前真实配置 20 passed / 0 failed。测试不写真实 YAML。
4. 独立审查最初将最小入口未写 ID 格式/完整字段列为 Minor；第一轮实际行为演练出现 T001-S01 及单条混合 code/learning，已按用户实际影响升级为需修复。补齐四位序号、归属/类型/状态/时间/验收/证据/历史要求，code 与 learning 分开记录；同一执行者在全新副本复验通过，最终结果和主 agent 独立复核见下节。没有把第一轮输出直接算 T010 通过。

红灯及原始运行日志位于本次会话 /tmp/phase3-manifest-red.log、phase3-register-red.log、phase3-hooks-activation-red.log、phase3-register-green.log；临时文件可能清理，以上实际结果及修正依据在仓库永久记录。

## 分类及分级实际演练

临时副本 /tmp/phase3-directory-e2e-btclcsk8 的 artifact-fresh/legacy 样例由主 agent 按更新后的五个生产者实际生成、读取、跳过与报告。五种产物位于 diagrams/、descriptions/；旧 PR/issue 已存在时未生成第二份，旧业务图只读取并保留原字节；两组新旧内容不同报告冲突且零写入；同次纯文档样例结案重复生成 project-description 字节相同。每份文档经主仓库真实配置 stdin --stdin-filename 虚拟路径 fix-dry-run 后写入并复核；未用 /tmp 路径被忽略的退出 0 冒充 lint。最终文件 hash 已独立读回比对，报告 artifact-report.json。该样例结案只属临时纯文档，不表示本功能结案。

小型选 PR 一次生成反例：旧快照存在、新路径缺失，触发后旧 hash 不变且新文件不存在。中型选完整 Tutor 暂停/恢复为后续 US3 验收方法，本阶段最小入口不伪装已实现。大型选两个父任务、跨模式及保存失败恢复为本阶段 T010；后续还须完整模式及博客集成。分级选择不减免包最低检查，不要求小改动做全套级别。

## 目录跨模式最终复验

新副本：/tmp/phase3-directory-e2e-k4raizqz。

最终第二轮复验通过，主 agent 已独立重读原记录、源/挂载完整文件 hash、失败/恢复日志、父任务快照，并再次实际运行 `python3 -B -c 'from t001 import result; assert result() == 1; print("T001 final independent PASS")'`，退出 0，输出 T001 final independent PASS。

- 同父任务跨 Tutor→Pair→原生 Implement→Tutor 沿用原目录/验收；原生门禁及前置脚本实际执行，无新风险的样例按原三项豁免说明，不更改 MVU。父任务任务定义只增加索引，原验收不变。
- T001-S0001 是 code/completed，带真实完成时间；T001-S0002 是 learning/active，完成时间无，原用户练习验收未变化，没有伪造用户掌握。T002 的 code/learning 两条目录记录均保持初始 hash，未创建 t002.py。
- code 子任务 completed 后父任务 T001 仍未勾选（completed-code-before-native.txt）；随后原生 Implement 依据实际断言独立勾选 T001，T002 保持未勾选。额外 all-complete-fixture 中唯一 code 子任务 completed、实际 sum 断言通过后，八栏目父任务的 checkbox 和全部字节仍不变，覆盖“子任务全部完成不自动完成父任务”。
- 在 learning 原 README chmod 0444 后真实写入得到 PermissionError；已报告已写无/未写续接，冻结新步骤和完成更新。故障前后实际文件 SHA-256 均为 c98c40587736d82520f57acc3856bf2092d79e05a35c58bc266451069adac826；核对后恢复 0644，重试并读回成功，重复请求没有追加，恢复事实仅一条。
- 三组独立拒绝样例实际读取更新技能及输入后，分别因父 Task 不存在、原验收缺失、依赖指向另一父任务而报告停止；每组文件集合和 hash 前后相同，无替代子任务或完成状态更新；主演练全部记录及 t001.py 也保持不变。
- 本副本真实 link-skills 已刷新 17 个技能，主 agent 对每个当前主源/隔离源/挂载的完整相对文件清单及每文件 SHA-256 逐项确认一致。没有 state.json、共享 CLI 或任务锁/回执。原生 Implement 原样复制，真实工作区挂载未在本阶段刷新，正式切换留 Phase 4。

最终子任务 Markdown 字节记录如下；这些是行为证据的 hash，不是子任务状态副本。源码与副本完整清单在临时 source-mount-hashes.json，独立运行原始日志在该副本 behavior-report.md、implement-verification.log、save-failure.log、recovery-verification.log、return-tutor.log、refusal-results.log；临时副本可能清理，本节永久保留实际结论、关键命令、失败事实及最终 hash。

| 演练文件（相对样例 Spec）       | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| subtasks/T001-S0001/README.md   | `8f67368703bafa46ebc12654c9742dda2314dc60f773b0c4009f511092d036cf` |
| subtasks/T001-S0001/evidence.md | `fae152af075c9b34877039ad3acff488e98c125e33cc5392e64e9750f7fcb7f5` |
| subtasks/T001-S0002/README.md   | `768662b46e2a0cf3c268c3c5bbaa52af0c3981599a9038a789c354fe8a9206b6` |
| subtasks/T001-S0002/evidence.md | `0be89d963833067f2cdb2b0b08cecf679a0b05edcfc62a1c980d6ffbb13ed924` |
| subtasks/T002-S0001/README.md   | `896e46ca4afa8182049ce30347192e7424e6797472780fe6395d1934af8567b0` |
| subtasks/T002-S0001/evidence.md | `07c46467237e51e1d00c9b034201f1363919dfbb0356e0eeb1671d4a628b3eb4` |
| subtasks/T002-S0002/README.md   | `5a9a656f114b5e3217add6876d4ac31b0f998f03f62b3f1ce3e50071cf894848` |
| subtasks/T002-S0002/evidence.md | `29d8abfc65677bd99eff83e9404487ea790f96be8294f887072803cc443c9ece` |

## 限制及未执行项

- 普通 `node scripts/dev/actions/register-hooks/test-register-hooks.mjs` 因根目录未声明可解析的 yaml 包入口失败（ERR_MODULE_NOT_FOUND）；工作区 pnpm 存储已有真实 yaml 2.9.1。临时 Node resolve hook 只将该 import 指向现有解析器，不模拟行为、不新增依赖。标准无映射命令仍受此既存环境限制。
- `python -B <source-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/skills/src/speckit/speckit-tutor` 因缺 PyYAML 退出 1。未安装依赖；改用真实 yaml 2.9.1 校验八个技能 frontmatter name/description/destructive，配合 ESLint/build/行为演练，不把官方验证器称已通过。
- Node 内部 spawnSync git 的只读基线对比首次被沙箱 EPERM 拦截；按权限机制获准后重试，真实 hooks 更新和五条 MVU 全字段/位置比较均退出 0；未绕过权限。
- `pwsh -NoProfile -File scripts/dev/actions/register-hooks/register-hooks.ps1 <隔离目标>` 未执行，因为 pwsh 不可用；未验证 Windows 上的注册运行行为，只证明静态注册数据一致。Phase 4 MVU-C 的双平台完整退役仍需各自证据。
- 完整 Tutor/Pair/Review、真实用户学习、Review A/B、博客开发/非开发隔离不在本阶段已通过范围；没有数据库写入、发布、部署或 Git 提交/推送。
- `pnpm exec mmdc -i specs/skills/20261029-speckit-workflow-foundation/diagrams/state-transitions.md -o /tmp/phase3-state-transitions.md` 未执行，既有 Chromium 缺 libnspr4.so 限制沿用；仅校验 Markdown/Mermaid 源码，图形渲染及视觉结果仍未验证。
- .specify/integrations/codex.manifest.json 的既存暂存修改及本轮出现的 installed_at 变化均保留，未主动安装或修改该文件，也未回退来源未明变化。
- 最终阶段验收仍由用户进行；不得因本记录或任务 checkbox 推断用户已验收，未进入 Phase 4。

后置 explainer-doc-sync 已加载检查：本阶段仅修改设计、技能与验收资料，未生成或复用独立随行说明文档，因此无须追加随行文档引用；旧 hook 的定向退役留 Phase 4。

## 最终阶段结论

T006～T010 达到本阶段已修订验收条件：目录唯一记录、分级、分类与最小续接可复核；完整模式和后续 MVU 验收未借用本次结果。Phase 3 已结束，等待用户验收；未进入 Phase 4，未提交/推送。独立审查的真实 hooks 问题及行为复现的 ID/字段问题均已修正并取得红绿灯与最终复验证据，无遗留被标作已解决却未验证的审查项。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
