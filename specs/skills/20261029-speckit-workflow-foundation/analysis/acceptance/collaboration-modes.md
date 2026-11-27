# T032：治理提示词退役与协作模式修订

日期：2026-10-30。依据用户最新指令：移除 artifact-constitution-prompt 和挂载点，Pair 只写协作模式规则；延续上一条已确认要求：Tutor 拆分/生成 Subtask，Task 是归属主体，模式是执行方式，入口只需任务编号，目录自动定位为所属 Spec 的 sub-task/，不建立学习任务隔离副本。

## 实际结果

- 通用治理提示词源目录已删除；两平台注册表不再提供该条目；真实 extensions.yml 定向移除 (after_constitution, artifact-constitution-prompt)，其他 12 条注册保留。初始化会过滤存量旧条目，第二次运行 unchanged，不复活。
- 实际 .agents/skills/artifact-constitution-prompt 只有 SKILL.md，内容与 HEAD 原技能源一致，SHA-256 为 cecab9acc781aabafc1d64d676e7c12b2e8b4d5da57ec77f9573d1a53b65f5df。首次删除因目录只读失败，按真实权限流程获得许可后删除，目录已不存在；没有绕过权限或删除未知附件。
- 已有 .specify/memory/speckit-constitution-prompt.md 产物保留，仅说明自动机制已移除，不再自动刷新；原生 constitution/Implement 文件未改。构建清单和真实 MCP 现在加载 16 项技能，无已退役技能。
- task-tutor 的描述和正文明确导师模式，承担了解基础、按 Task 原目标拆分/续用子任务、教学与验证；task-pair 明确结对模式，围绕当前/指定 Task 和已有 Subtask 讨论、实现、Review、调试与保存。Pair 正文没有增加“禁止生成子任务”的条款；无子任务时按 Task 原目标协作并使用 Task 现有记录。
- Subtask 的定义、身份、验收和进度归属 Task，Tutor/Pair/原生工程实施是并列执行方式，不因模式切换创建模式专属任务。教学、讨论、笔记、练习和该项证据都随子任务目录保存；工程代码按原 Task 工程路径实现并引用。
- AGENTS 与 .specify/adapters/spec-tutor.md/spec-pair.md 接入本仓库请求分发。/spec-tutor {Task ID} 自动核对当前 Spec，必要时检索所属 Spec；唯一定位后目标为 <所属 Spec>/sub-task/<Task ID>-S<四位序号>/。用户不传目录，直接原工作区。该请求分发约定不等同于外部客户端命令菜单/自动补全已注册，未修改原生工具命令。
- 本轮未创建 Spec/Task 隔离副本，也未为了测试实际运行导师拆分、生成真实子任务或伪造用户实践。现有注册器单元测试仅使用临时 YAML 输入，不复制项目或任务工作区。

## 红灯、审查与修正

新增退役交付断言先因源码仍含治理提示词技能而失败；真实配置只读检查也确认旧挂载存在。删除源、过滤存量 hook、重建后，五项 Python unittest 全通过。单元测试补覆盖带文件头的旧挂载退役、同 hook 用户扩展保留、重跑不复活和幂等。

只读规则审查指出 tasks 顶部旧目录名、无子任务时 Pair 写入位置的契约不一致，已修正为 sub-task/ 与“Task 现有记录/已有 Subtask 目录”条件式处理。PowerShell 既有输出头未补换行，退役重写也会触发；已补换行，并加带文件头的退役断言。Bash 实际回归通过，PowerShell 因缺运行时尚未实机验证，不将代码审查当平台运行证明。

规则情景审查确认：Task 没有 Subtask 时，Pair 按 Task 目标讨论、实施、审查并保存到现有 Task 记录；只有 Task ID 时，Tutor 由工具层定位所属 Spec 并按既定规则生成目录，而不是向用户索取子任务目录。本轮没有把静态审查宣称成真实教学完成。

## 实际检查

| 命令或检查                                                                                           | 结果                                                                                                                      |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint                            | 退出 0                                                                                                                    |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types                     | 退出 0                                                                                                                    |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build                           | 退出 0；既有 Vite 导入缺扩展名提示保留                                                                                    |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test                            | 5 项实际源/清单/MCP/工具解耦/退役检查通过                                                                                 |
| node --import /tmp/phase3-yaml-loader.mjs scripts/dev/actions/register-hooks/test-register-hooks.mjs | Bash 35 passed / 0 failed；PowerShell skip                                                                                |
| bash scripts/dev/actions/register-hooks/register-hooks.sh                                            | 首次移除 1 条，随后移除/新增/替换均 0，12 条 unchanged                                                                    |
| 两平台注册数据静态比对                                                                               | 12 项 extension/description/prompt/optional 一致，无默认退役命令                                                          |
| 实际源/挂载/活动 YAML 存在性与 MCP 加载                                                              | 源目录和本地副本不存在，YAML 无有效旧 command，MCP16项无该技能                                                            |
| 当前真实 Spec 的只读 Task 定位                                                                       | T032 在当前 tasks.md 唯一，需求/方案存在；目标根为 specs/skills/20261029-speckit-workflow-foundation/sub-task；未创建目录 |
| 原生 Implement SHA-256                                                                               | 保持 848a5c9eff7b99e348927cbde6c35378de9fea3fd317941f58fa0b0b79301eec                                                     |
| 每份修改 Markdown 的 pnpm exec eslint --fix、JS ESLint、git diff HEAD --check                        | 实际执行通过；技能源使用 --no-ignore                                                                                      |

临时日志 /tmp/mode-correction-red.log、mode-correction-hook-red.log、mode-correction-hooks-final.log 保存本次原始输出；临时文件可能清理，本记录保留关键结果与实际限制。

## 限制与未执行项

- 普通 node scripts/dev/actions/register-hooks/test-register-hooks.mjs 仍受既存 yaml 根导入缺入口影响；验证使用已安装真实 yaml 2.9.1 的临时解析映射，未新增依赖或模拟 YAML。
- pwsh -NoProfile -File scripts/dev/actions/register-hooks/register-hooks.ps1 <目标配置> 未执行，缺 pwsh；PowerShell 的实际退役、文件头/幂等行为仍待该平台运行验证。
- 官方 quick_validate.py 的 PyYAML 缺失为已记录环境限制，本轮没有安装依赖或声称该验证器通过；构建和真实 MCP 消费已有证据。
- 导师的真实讲解/练习与用户掌握尚未执行；本轮只修订技能、入口及规则，不生成虚假子任务。客户端菜单/命令自动补全未注册或验证，只建立本仓库 Agent 的请求分发约定。
- 历史验收中的旧目录和隔离操作保留为当时事实；当前 task 总决议、spec、契约和调用约定已按本轮规则修正。其他旧别名/模式副本的后续迁移不借本次治理提示词退役自动全局清理。

T032 实施和自检结束，等待用户验收 Phase 3 修订；未自动提交、推送、发布、部署或进入 Phase 4，用户原暂存变更保留。
