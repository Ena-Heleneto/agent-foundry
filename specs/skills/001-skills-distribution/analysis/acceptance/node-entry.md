# 唯一 Node 入口与核验报告修正

## 用户决定与范围

2026-11-04，用户确认只有一个对外入口：`node script/index.mjs [参数]`，没有 install/mount/hooks/commands 子命令。Node 判断操作系统后调度内部平台模块。用户确认的参数为来源、版本、agent、技能/分类/全选，以及 global、project、no-mount、hidden；安装位置由内部流程推导。

该决定替代此前不交付 Node 转发层的约定，已同步 AGENTS.md、分发 spec FR-021、plan/tasks、两项功能的现行入口说明、安装契约及包说明。历史验收和原始快照保留。新增任务编号 T041，不复用既有编号；T005 针对新发现的报告问题重新打开并修复，当前正式状态仅由 tasks.md 维护。

本轮唯一入口先接入已验证安装骨架：Linux x86_64、Codex 项目级、显式 --skill。其余约定参数、官方 skills 安装事实复用和实际挂载仍由后续任务完善，未支持请求由子模块明确失败；帮助说明当前能力边界。此结果不构成完整技能分发或原生派发验收。

## 实现与前置验证

Node→平台子进程命中 C3/C4。可证伪假设：只提供一个 Node 调用形式，即可从独立交付目录选择正确平台模块，保留调用 cwd 和原始参数、输出、失败退出码及取消语义，不依赖 monorepo 或第三方 Node 运行依赖。

采用中型验证：先检查平台选择与进程边界，再从 /tmp 独立副本实际安装完整最小技能和二进制附件；取消用例观察子模块自身退出及后代进程的写入，避免仅检查 Node 已退出。纯映射断言不计 Windows/macOS 平台验收。

- script/index.mjs 使用 Node 原生模块；linux/darwin 选择 bash，win32 选择 pwsh -NoProfile -NonInteractive -File。内部路径相对入口解析，保留消费 cwd，spawn 使用参数数组、shell=false、stdio=inherit。Node 要求 ≥22.20.0。
- 当前只启动内部 install-skills 模块，由已完成的内部流程执行具体安装；按后续任务在该安装流程中接入 mount-entry→hooks→commands。没有对外模块选择参数，没有把下载或安装核心搬到 JavaScript，也不新增嵌套 package.json。
- 前置工具或内部脚本缺失返回结构化失败和退出 2；已启动子模块的输出与退出码原样保留。帮助仅展示唯一调用形式与参数，无参数拒绝安装。
- POSIX 平台模块使用独立进程组；SIGINT/SIGTERM 发送给整个组，等待子模块退出后返回信号退出码。Windows 使用 Node 原生子进程终止，完整进程树语义尚未在 Windows 验证，不作通过声明。
- PowerShell 的逐技能枚举和摘要读取加入局部异常处理。某项不可读时记录该项 failed，并继续核验其余显式选择；最终 installation=failed，完整项仍进入 verifiedSkills，禁止挂载。修复前已复现坏项和后续项缺失、阶段保留 not-run 的错误。
- 构建回归包含 index.mjs 和全部内部脚本的源/产物逐字节比较，构建只复制、不导入或执行运行脚本。

## 红绿与审查

1. 缺少 index.mjs 时，实际 Node 调用报 MODULE_NOT_FOUND，建立失败实验；实现后首批 7 项、补 SIGINT 后 8 项通过。
2. PowerShell 定向混合选择先失败：请求 vue-reactivity→不可读 task-explore→task-guide，结果仅保留第一项。局部异常处理后用例通过，完整回归见下表。
3. 一次只读独立审查发现 Important：只 child.kill 外层 Bash 时，前台后代仍可在取消后写入。新增用例由后代打印 ready，再给 Node 发 TERM；旧实现约 1 秒后退出且留下写入标记，实际失败。
4. POSIX 改为独立进程组和整组取消，新增用例转绿；完整 9 项源脚本与构建副本均通过。未重复派发审查，修复由精确红绿测试及全套转绿验证，没有把初次审查当作修复后复审。

## 环境、命令与实际结果

实际环境 Linux x86_64、Node 24.22.2、Bash 5.3.9；核验回归使用官方 skills 1.7.4、jq 1.8.1 和 Linux PowerShell 7.4.6。PowerShell 工具来源、摘要及 DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1 的原因沿用 [MVU-C](mvu-c.md)，不修改系统 ICU 或信任配置。所有目标、故障文件和工具副本位于测试自有 /tmp 目录；并行任务的业务、依赖和真实 .specify 变更保留。

| 命令或操作                                                                                                                                                                                                                                                                                                                        | 实际结果                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `FOUNDRY_JQ=/tmp/foundry-t004-jq node --test --test-isolation=none packages/skills/tests/distribution/test-entry.mjs`                                                                                                                                                                                                             | 最终源脚本 9 pass、0 fail、0 skip；含参数、cwd、帮助、失败、工具缺失、平台映射、INT/TERM、后代取消和真实独立安装 |
| `FOUNDRY_ENTRY_SCRIPT_DIR=<source-workspace>/packages/skills/dist/script FOUNDRY_JQ=/tmp/foundry-t004-jq node --test --test-isolation=none packages/skills/tests/distribution/test-entry.mjs`                                                                                                                                     | 最终构建副本再复制到 /tmp 后 9 pass、0 fail、0 skip                                                              |
| `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t005-official/node_modules/skills FOUNDRY_JQ=/tmp/foundry-t004-jq pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --mvu C`                                                                                                                         | 正式调度器 passed；Bash 23 pass、0 fail、0 skip                                                                  |
| `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1 PATH=/tmp/foundry-t005-pwsh:$PATH FOUNDRY_MVU_C_SHELL=pwsh FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t005-official/node_modules/skills FOUNDRY_MVU_C_SCRIPT_DIR=<source-workspace>/packages/skills/dist/script node --test --test-isolation=none packages/skills/tests/distribution/mvu-c.mjs` | Linux PowerShell 22 pass、0 fail、1 skip；唯一 skip 为 Bash 专属 jq 故障，不适用于原生 PowerShell                |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                                                                                                                                                       | 最终退出 0；开发中顶层 await 与单行多语句不符合仓库规则，已改为 Promise 收尾和分行，没有放宽规则                 |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                                                                                                                                                                                | 最终退出 0                                                                                                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                                                                                                                                                                      | 最终退出 0；单次构建原样交付 Node 入口和内部平台文件                                                             |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                                                                                                                                                                       | 13 tests 通过                                                                                                    |
| `node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/test-register-commands.mjs packages/skills/tests/test-register-hooks.mjs scripts/dev/actions/link-skills/test-link-skills.mjs`                                   | 17 pass、0 fail、4 skip，原因见下文                                                                              |
| `uv run --offline --cache-dir /tmp/skills-distribution-uv-cache --isolated --no-project --with pytest python -m pytest -o pythonpath=<source-workspace>/apps/mcp/src apps/mcp/tests/test_registry.py`                                                                                                                             | 7 passed                                                                                                         |

真实独立安装对比正文和二进制附件的全部字节，确认目标项目没有新增 package.json 或 node_modules。取消回归的前台后代真实执行 sleep 和写文件，修复后写入标记不存在；退出码仍为 143/130，未把取消改写为成功。

## 限制与下一步

- Windows/macOS 与 Node 22.20.0 最低运行时未实际运行；平台选择断言和 Linux 上运行 .ps1 不能替代这些环境。Windows 进程树取消须与后续实际安装一并验证。
- 既有消费者回归四项跳过：普通回归 PATH 未配置 pwsh，register-commands 与 link-skills 的两项 PowerShell 场景未运行；未配置 FOUNDRY_SPECIFY_CLI，官方 hooks-only 受管字段覆盖、hooks+五指令真实重装两项未运行。新增公共 PowerShell 核验另用完整命令实测，不能用它改写上述 skip。
- 真实公开来源、完整 agent/global/分类/全选/hidden 和原生挂载未完成。新入口转交当前模块时未支持请求仍失败，T006 负责适用 hooks 和五指令挂载及实际派发，其余任务按原依赖推进。
- 原始日志 /tmp/foundry-node-entry-*.log 可能随环境清理；本文保存命令、输入、红绿事实与限制。代码与实验骨架保留，后续在其上演化；工程状态只在 tasks.md 回填。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
