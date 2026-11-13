# Phase 3 返工 T031：通用技能与工具挂载分离

日期：2026-10-30。用户明确要求自定义技能写标准规则、可以挂载到其他工具，Spec Kit 细节放在挂载侧。依据 spec FR-037 与 tasks T031；本记录替代前轮对“技能可移植性”的任何推断，前轮目录记录验收仍作为当时事实保留。

## 最终分工与改动

通用能力位于 packages/skills/src/workflow/。11 个原工作流技能源全部迁移并改写，名称为六个 artifact 技能、task-tutor、task-pair、bug-report、mvu-gate、explainer-doc-sync。通用正文/名称/分类/references 不含品牌、.specify、固定核心文件名、hook 或项目默认落点；调用方提供源、任务记录、目标、旧候选、治理、格式要求及协作节奏，缺输入先报告，不猜路径。没有把工具适配藏进 references，也没有新建状态/适配框架。

Spec Kit 解析和映射位于 [.specify/adapters/context.md](../../../../../.specify/adapters/context.md)：feature_directory 规范化、各阶段必需材料、输出/旧候选、子任务 ID/状态/README/evidence 布局、格式命令、五个 MVU 操作、手动学习/结对和缺陷报告上下文。仅按当前操作检查所需材料；治理提示词不解析功能目录，早期阶段不强制要求尚未生成的计划/任务。手动技能改用通用名称，不宣称增加未注册的原生命令。

两平台注册器的 13 条 prompt 及真实 extensions.yml 显式传入该上下文；AGENTS 与包 README 说明调用方职责；当前 spec/plan/contracts/data-model/quickstart/research 同步新边界，旧阶段任务/验收保留历史。完整 Tutor/Pair/Review 尚未由本次返工实现，旧随行 hooks 仍待 Phase 4 精确定向退役。

## 红绿灯与审查

- 新 test_skills_are_host_independent 先对原源码/构建交付得到实际失败，能检出品牌分类、名称、默认路径和隐式工具配置。修改并重建后，包内 4 项 unittest 全通过；同时检查当前源/构建对应、撤回机制无调用和真实 MCP load_skills。额外检查 category，避免只改正文仍交付品牌分类。
- 更新适配 prompt 的真实沙箱反例先得到 27 passed / 7 failed，其中 6 项为活动配置未刷新，1 项为旧 upsert 丢失 enabled/condition/未知字段。补两平台字段/续行保留逻辑、刷新真实 hooks 后 34 passed / 0 failed。
- 跨平台静态对比 13 个键的 extension/description/prompt/optional 全部一致。实际 YAML 对 HEAD 比较：五个 MVU 挂载的元数据及数组位置不变，只调整适配 prompt；C1～C4、三项豁免、未验阻塞、新风险确认、骨架保留、失败回规划和原生工程验收独立保持。
- 本轮用户要求允许通用 mvu-gate 源及适配表达调整，因此前轮“自定义源逐字不变”的检查不再适用；原生 Implement hash 及非工作流 6 技能 hash 仍相同。没有修改原生生成技能。
- 独立只读审查未发现新增 Critical/Important/Minor；审查实际运行 4 项 unittest 通过。没有将静态扫描或审查当作跨工具行为验收。

## 实际检查命令

| 命令/检查                                                                                                            | 实际结果                                                            |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint                                            | 退出 0                                                              |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types                                     | 退出 0                                                              |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build                                           | 退出 0；保留既有 Vite 配置缺扩展名提示                              |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test                                            | 4 项真实清单/MCP/解耦测试通过，退出 0                               |
| pnpm --config.verifyDepsBeforeRun=false exec eslint --fix scripts/dev/actions/register-hooks/test-register-hooks.mjs | 退出 0；新增/语义修改声明有中文多行 JSDoc                           |
| node --import /tmp/phase3-yaml-loader.mjs scripts/dev/actions/register-hooks/test-register-hooks.mjs                 | Bash 34 passed / 0 failed；PowerShell 运行时缺失 skip               |
| bash scripts/dev/actions/register-hooks/register-hooks.sh                                                            | 真实配置替换 13 条 prompt；再次运行应 unchanged，测试已验证沙箱幂等 |
| 真实 YAML 解析与完整挂载/主源文件清单及 SHA-256 比对                                                                 | 17 技能、21 文件，两个宿主均相同；原生文件及非工作流源不变          |
| 修改 Markdown 的 pnpm exec eslint --fix                                                                              | 每份完成后立即执行；技能源 --no-ignore 实际校验，不把 ignore 当通过 |
| git diff HEAD --check                                                                                                | 退出 0                                                              |

原始红绿灯日志 /tmp/portability-red.log、portability-hooks-red.log、portability-hooks-green.log；这些临时文件可能被清理，本记录永久保存实际失败原因、结果和验证范围。

## 两个宿主的真实行为

隔离根目录：/tmp/skill-portability-j7m8kv23。两个宿主都先运行真实 link-skills，从当前通用源复制到各自 available-skills 并逐文件核对；同一 task-tutor/task-pair 字节完全相同。行为执行者只改临时目录，没有改主仓库或 index；主 agent 独立读回最终文件、所有挂载和输出 hash，重新运行两宿主断言。

其他工具宿主没有 .specify，也没有 spec.md/plan.md/tasks.md；调用方传 brief.md、approach.md、work-items.md、自定义 ID P41-part-a/P41-part-b、records/chunks/<ID>/definition.md 和 proof.md、active/blocked/done 枚举及 exports/process-note.md 目标。实际 Tutor 读取原验收和未完成学习，Pair 只读检查并运行已有函数，编码项按调用方约定推进为 done，学习保持 active、完成时间无，父任务 P41 与索引未被自动勾选或改写。未修改代码、ID、状态规则或目录布局。

Spec Kit 宿主先由适配层解析 feature.json、材料和项目规则，再将上下文交给相同通用技能，建立 T001-S0001(code)/T001-S0002(learning) 的 README/evidence 记录；编码 completed、学习 active，父任务 T001 未勾选。没有创建 state.json 或状态管理器，没有让通用技能反向发现工具配置。

两个宿主实际执行同一命令：

```bash
python3 -B -c 'import sandbox_math; value = sandbox_math.result(); assert value == 7, value; print("sandbox_math.result() == 7: PASS")'
```

均退出 0，stdout 为 sandbox_math.result() == 7: PASS，stderr 空。主 agent 再次运行 `python3 -B -c 'import sandbox_math; assert sandbox_math.result() == 7; print("independent portable PASS")'`，两次退出 0；两个代码文件 hash 与开始时相同。工程证据不能当真实用户学习通过。

其他工具还按 artifact-business-flow 实际生成 exports/process-note.md，包含来源/时间/任务、两张一图一事 Mermaid、大白话术语及代码/记录位置；没有沿用任何工具默认输出路径。随后实际读取 artifact-issue-description 处理缺少目标文件的请求，只报告缺项并停止，不猜默认路径或写盘；前后完整宿主文件映射相等，映射摘要均为 d4a6393cb6da6d810a8e80cf655bf49ab042e7e9b23ea1763a7f47396849d31a。

10 份记录/索引/产物每次写前按主仓库有效虚拟路径执行 ESLint stdin fix-dry-run，取 output 后才写，再读回同配置复核；20 次检查退出 0、无警告、无二次格式差异，报告同样检查。没有用 /tmp 路径被忽略的退出 0 冒充验证。完整行为报告与命令/输出/hash 位于该临时根 behavior-report.md、other-tool/behavior-evidence.json、report-lint-evidence.json；主 agent 已独立核对数据，临时目录清理不改变本记录中的实际结论。

| 实际更改文件（相对两个宿主）                                          | 最终 SHA-256                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| other-tool/exports/process-note.md                                    | `aaf510fc156742f71906bff4975c436eaaf40dae3acdfb4a8ddf6242eb09a009` |
| other-tool/records/chunks/P41-part-a/definition.md                    | `3d19d64e6fb32b371fad541e9299c34a0e6313e52cc6b2fb0e0566ab8a524778` |
| other-tool/records/chunks/P41-part-a/proof.md                         | `009c38d0ee1f56d0b2261f7f0cf26cb72888f3daefd27b6a17b1baa1ba3a16b4` |
| other-tool/records/chunks/P41-part-b/definition.md                    | `112aa283b35d1d50589bb1556ac806a5e6fe290a3b2244728628db14f8b73e5f` |
| other-tool/records/chunks/P41-part-b/proof.md                         | `2a713d3bf014f96b983dcf06e6b86edfc07f7e87c020de8995f13d0ecd150cd5` |
| spec-kit/specs/skills/adapter-fixture/subtasks/T001-S0001/README.md   | `a492038f496472d94fb799faaa4235b2d71f046f0c13eef3673d2f8882c68d10` |
| spec-kit/specs/skills/adapter-fixture/subtasks/T001-S0001/evidence.md | `12460a9610685b2eea57560f96eceb46e2cea9601e95a4a2528973eb717fdf39` |
| spec-kit/specs/skills/adapter-fixture/subtasks/T001-S0002/README.md   | `aa1b551d25784a7cf9fd93ee8bbfd2235727b74b10863a547b568a79c42e474d` |
| spec-kit/specs/skills/adapter-fixture/subtasks/T001-S0002/evidence.md | `a6b9c0451d7379e322e97029b67ca3791cbdb01c75e9d192554602428da21c52` |
| spec-kit/specs/skills/adapter-fixture/tasks.md                        | `39062c2f770ee0e6599bc7e5fb6ff70ecbd81ba324cc57de4c5aa1536c63ce91` |

## 未执行项与实际限制

- 普通 `node scripts/dev/actions/register-hooks/test-register-hooks.mjs` 仍因既存根 yaml 导入缺入口失败；已安装真实 yaml 2.9.1 通过临时 Node resolve hook 提供给验证，未模拟解析、未新加依赖。无映射命令的可运行性尚未解决。
- `pwsh -NoProfile -File scripts/dev/actions/register-hooks/register-hooks.ps1 <隔离目标>` 未执行，因 pwsh 不可用；静态数据/代码审查不代表 Windows 注册行为已通过，风险为该平台实际差异仍需回归。
- `python -B <source-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/skills/src/workflow/task-tutor` 实际因缺 PyYAML 失败；未安装依赖。改用真实 yaml 解析 17 项 frontmatter 的 name/description/destructive，配合构建/消费/行为验证，不冒称官方验证器通过。
- 本轮未运行 mmdc 渲染业务图；既有 Chromium 缺 libnspr4.so 限制仍在。Markdown/Mermaid 源已检查，视觉渲染未验证。
- 两个宿主只证明本次提供的不同材料布局及缺目标场景，没有证明任意工具/所有缺输入与并发失败；Tutor/Pair 仍最小入口，没有真实用户实践，不声称完整模式/学习掌握/Review A/B 或博客安全已实现。
- 实际工作区旧生成挂载和旧别名尚未受管迁移；本轮构建/MCP 和隔离挂载是新通用版本，不能把源码迁移当真实旧别名清零。该迁移及旧随行退役仍按 Phase 4 MVU-C 执行，不全局 prune 或手改生成目录。
- 保留用户原有暂存/index及来源未明安装记录变化；没有自动提交、推送、发布、部署或数据库写入。Phase 3 返工结果待用户验收，未进入 Phase 4。

## 结论

T031 已按最新用户架构要求实施并自检：通用规则与特定工具接线分离，四项包测试、34 项 Bash 断言、独立审查和两个宿主实际行为提供证据。保留上述限制，等待用户对 Phase 3 返工验收。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
