# T066：官方缩减与六旧 hooks 退役验证

日期：2026-11-12。对应[原 T066](../../tasks.md#t066)、[已认可方案](../../implementation/T066.md)、[注册契约](../../contracts/registration.md)和 TV-11。用户在方案链接及具体迁移/保护/恢复安排展示后回复「可以」，本轮只执行该 Task 的隔离验证。

## 输入与官方操作

当前正式来源为 `packages/skills/src/workflow/` 下的 Increment、实施准备、分析及结案技能；事件选项取同集合 `collection.config.json`。来源完整复制到本轮隔离候选布局，准备等技能在正常根，Increment 在其追加 `-speckit-sources` 的同级根；复制不冒称本轮重新验证了 skills 安装器，沿用 T095 适用证据，不添加 coding 前置。

本机实际 Specify 为 1.2.6，绝对路径是 `<source-home>/.cache/uv/archive-v0/om6AD6JxRTroJuBL/bin/specify`。旧环境由该工具的离线 Codex skills 初始化及真实 extension add 建立。三项为明确的人工集合 Tutor/Pair/Increment；四项沿历史 Tutor/Pair/Direct/Increment；五项沿历史 Tutor/Pair/Review/Explore/Guide。这些文本仅构造登记，不执行三暂停模式的能力测试。旧六 hooks、结案与无关扩展均经官方安装，不手写正向 registry。

候选读取当前来源、配置、附件、旧 manifest/registry 与完整生成目录，在首次变更性官方调用前校验。通过后逐项官方 remove 已登记的六退役扩展，逐项 add --force 当前准备、分析、结案 hooks，最后同 ID modes add --force 为仅 Increment。集合未保存的官方必需 command 按选定技能身份补齐，其他选项来自集合；无自有 YAML 合并或手写登记。初次夹具因缺 command 被官方拒绝，保留该失败，未记正向通过。

归属依据是验证方从官方产生的目录保存的一次性内存快照，不是新的持久安装状态。它允许这组已知隔离样本核对用户修改与未知附件，不代表未知真实环境的生产预检已经实现。通过骨架保存在测试 helper，T067/T068 仍需独立实现平台注册器。

## 实际验证结果

当前新增 T066 场景共 25 项，全部实际执行通过；旧测试的失败与平台 skip 另列，不能将其称为完整测试文件全绿。最初 23 项通过后，独立审查指出两项缺口，已补实际红灯与修复后回归，不将首轮审查包装成无问题。

| 场景                             | 已观察结果                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 三/四/五旧入口迁移及各自重复刷新 | 实际 registry 均仅登记 speckit.modes.increment，生成目录也仅保留对应入口；旧三暂停及 Review/Guide/Explore 按样本实际退去，重复不复活                                                                                                                       |
| 六旧 hooks 与当前三项 hooks      | 六退役登记、扩展目录和有效配置实际消失；准备 before_implement、分析 after_tasks、结案 after_converge 与当前集合一致；无 after_increment 或 hooks 额外命令                                                                                                  |
| 来源和附件                       | 三项 hook 的扩展内完整正文/附件与候选来源逐字节同版；Increment 的完整语义正文保留，测试附件由官方改写到扩展顶层 references，目标真实可读                                                                                                                   |
| 来源减少附件后的重复刷新         | 每次使用全新自有临时输入，合法删除来源附件及引用后再次官方刷新，扩展内源、顶层桥接及生成引用均不残留旧附件；先复现不同版失败再修复                                                                                                                         |
| 第二次移除返回 23                | 首项真实移除保留；其后 hook 安装与模式更新均未运行。解除注入后从实际剩余登记续接，首项未重复伪报移除                                                                                                                                                       |
| 官方实际版本拒绝                 | 六项退役已完成，新 hook 输入临时改为要求 9999.0.0 后官方真实非零；旧 modes 未更新。修复该输入后从磁盘继续到当前集合                                                                                                                                        |
| 真实子进程启动失败               | 六项退役完成后，真实调用不存在的工具路径产生 ENOENT，失败调用和六项已完成范围均保留，旧 modes 不更新；修复工具后续接且不重复移除                                                                                                                           |
| 16 类调用前保护                  | 缺 Increment、缺准备、缺配置、错误 hook command、缺附件、附件冲突、来源目录链接、额外生成附件、用户改写正文、扩展内未知文件、孤立生成目录、孤立扩展目录、孤立有效 hook、未知原始副本、登记不一致、未初始化，均零候选变更调用且故障注入后的完整项目摘要不变 |
| 无关内容与历史                   | 正常迁移逐字节保护无关扩展目录及历史报告；负向场景保护完整项目。源维护目录、生产脚本、宪章及 AGENTS 的写前保护单列核对                                                                                                                                     |

错误 hook command 与孤立有效 hook 两个反例先观察到候选未拒绝的真实失败，再补配置身份及有效调用归属检查；红灯日志保留。无登记孤立内容属于停止并报告的结果，不能称本项自动清除了孤立残留。测试注入的返回 23、官方实际版本失败及夹具初始化失败分别留证，不混用。

## 命令与工程限制

实际执行时显式设置 `FOUNDRY_SPECIFY_CLI` 为上述固定路径，并以 `FOUNDRY_T066_RETAIN_DIR` 保留本轮自有场景。

- `node packages/skills/tests/test-register-commands.mjs`：23 项中 22 通过、0 失败、1 skip；其中 21 项为新增 T066 场景。skip 是本机无 pwsh 的原 PowerShell 测试，不称 Windows 通过。
- `node packages/skills/tests/test-register-hooks.mjs`：新增 T066 4 项通过；原三个历史测试失败，均在其 fixture 读取已不存在的 `src/skills/workflow/artifact-issue-description/speckit-hooks.json` 时 ENOENT。完整文件退出 1，原路径问题已在写前基线复现；本项不改其旧断言或生产脚本，也不将其 skip 隐去。
- 四份新增/修改 JS 文件针对性 ESLint：退出 0。候选函数按职责拆分以满足已有复杂度规则，未禁用 lint 规则；改动声明附中文多行 JSDoc。
- `pnpm --filter @foundry/skills run check-types`：已运行退出 0。
- `pnpm --filter @foundry/skills run test`：已运行 12 项 Python 测试通过，退出 0。
- `pnpm --filter @foundry/skills run lint`：已运行退出 1，仍为 `build/plugins/collections.ts` 第 11 行 entries 未使用的 unused-imports/no-unused-vars 和 sonarjs/no-dead-store 两项原有错误，不记整包全绿，不越权代修。
- `pnpm --filter @foundry/skills run build`：依用户既有指令暂跳过，dist 与构建产物消费未验，不使用旧产物抵扣。

本项覆盖 Linux 上固定工具的隔离迁移，不覆盖 Windows/macOS、真实工作区/全局挂载、生产脚本接线、自然语言宿主行为或真实用户效果。失败后恢复沿当前测试上下文及实际磁盘，不宣称进程崩溃恢复或多步骤原子回滚。真实 ENOENT 已验证，超时/信号虽走统一处理，本轮未独立实测，不能冒称全部进程故障均已验。后续原 Task 分别承接，不因本项通过自动推进。

## 证据与审查

独立 reviewer 首轮发现临时输入残留与进程异常报告两项 Important，无 Critical。两项均实际先红后绿，定向复审确认充分修正、无新增发现；主 agent 再以最终源码完整运行本项测试及必要包检查，不复跑无关迁移。夹具另外保留初始项目与真实临时输入，证据组织的最终核对由主 agent 完成，不冒称 reviewer 审查覆盖其后生成的归档。

[结构化结果](fixtures/t066/results.json)与[原始归档](fixtures/t066/retained.tar.gz)保存候选/夹具/测试代码、官方 bootstrap 和迁移原始输出、初始官方基线及项目、每次临时输入、最终项目、零调用与完整保护证明、实际检查日志及限制。归档摘要及逐文件核对数量以结构化结果为准；链接只留位置/目标记录，不跟随打包外部目标。未收集仓库画像或认证，选定凭据模式零命中不等于完备扫描。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
