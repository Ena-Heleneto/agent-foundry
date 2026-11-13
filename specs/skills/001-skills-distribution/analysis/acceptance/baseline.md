# T001：实施前环境与消费基线

记录时间：2026-11-02（Asia/Shanghai）。源码提交：`e82a1c47c01806a93105680440a74af01958008c`。本记录属于技能分发功能，不修改原工作流功能 T038。

## 范围与执行约定

本轮用户已授权 T001～T002 及功能定位、旧需求检查清单对齐。开始时 `git status --short` 输出为空；当前是普通仓库的 `feature/speckit-workflow-extensions` 分支，沿用用户指定工作区。按宪章 VII 在 tasks.md 与本验收记录保存进度，不另设技能内部 ledger 或状态系统。前置 MVU A～F 均未执行，业务实现仍被阻塞。

实施前已读取 package.json、tsconfig.json、vite.config.ts、build/plugins/manifest.ts、extension.yml、link-skills 双 shell 及测试、现行规格/计划/任务/验证指南。原 build 只生成 MCP manifest，原 test 是 Python unittest；test:distribution 尚不存在。现有 manifest 聚合包含内部 eval，link-skills 复制完整技能目录；modes 原生扩展提供 tutor、pair、review 三个指令，file 直接引用对应 SKILL.md。

`.specify/feature.json` 原指向 `specs/skills/20261029-speckit-workflow-foundation`，本轮按用户指定切换到 `specs/skills/001-skills-distribution`；不修改原功能任务。requirements.md 仅同步已澄清范围与过期说明，保留首次审阅历史。

## 实际环境

| 工具或平台      | 实际结果                                | 与固定验收环境的差异                            |
| --------------- | --------------------------------------- | ----------------------------------------------- |
| Linux           | 当前可运行                              | 尚未覆盖其他发行版及最低运行时                  |
| Node            | v26.8.1                                 | 非最低边界 22.20.0                              |
| pnpm / npm      | 12.8.1 / 11.19.0                        | 沿用现有开发工具                                |
| Python / uv     | 3.14.7 / 0.12.10                        | Python 满足 ≥3.11，但 Specify 未安装            |
| Git             | 2.53.0                                  | 本地真实 Git 可用                               |
| Bash            | 5.3.9                                   | 未验最低边界 3.2                                |
| Vite            | 8.3.5                                   | 现有 package 依赖可用                           |
| skills          | `command -v skills` 无结果              | 未执行 skills@1.7.4，不能声称固定版本兼容       |
| Specify         | `specify --version`：command not found  | 未安装固定版本 1.2.5；不能用历史 dev0 证据替代  |
| PowerShell      | `command -v pwsh` 无结果                | 缺少 ≥7.4，测试明确 skip                        |
| macOS / Windows | 当前无执行环境                          | 未验证，不能由 Linux 结果抵扣                   |
| yaml            | 包内无法直接解析；Vite 传递安装为 2.9.1 | T002 须直接声明固定 2.8.3，不能复用传递版本替代 |

## 命令、输入与真实结果

测试输入为当前源码与本地构建清单；link-skills 自建临时仓库、技能源及目标目录，不向真实用户技能目录安装。此阶段没有进行 skills/Specify 全局安装、原生扩展注册、远端发布或迁移。

| 命令或操作                                                                                                                                                                                | 预期                           | 实际与结论                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `git status --short`                                                                                                                                                                      | 确认已有修改                   | 空输出，起始工作区干净                                                                                           |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`（首次）                                                                                                       | 现有消费者与源码一致           | 退出 1；6 tests，5 failures，发现旧 dist/manifest.json 过期                                                      |
| `pnpm --filter @foundry/skills run build`                                                                                                                                                 | 用现有构建重新生成 manifest    | 退出 0；未改源码、未手改 dist；Vite 提示旧配置的无后缀 import 将不兼容未来 native loader，此历史告警不在本轮扩改 |
| `pnpm --filter @foundry/skills run test`（构建后）                                                                                                                                        | 原消费者加载当前技能           | 退出 0；6 tests 全部通过                                                                                         |
| `node --test scripts/dev/actions/link-skills/test-link-skills.mjs`                                                                                                                        | 跨 shell 沙箱测试并展开 skip   | 退出 0；当前沙箱只显示文件级 pass，不能据此统计两个 shell 均通过                                                 |
| `node scripts/dev/actions/link-skills/test-link-skills.mjs`                                                                                                                               | 补充真实子项结果               | 退出 0；Bash pass 1，PowerShell skip 1                                                                           |
| `node --test --test-isolation=none scripts/dev/actions/link-skills/test-link-skills.mjs`                                                                                                  | 避开测试进程隔离造成的汇总缺失 | 退出 0；2 tests，pass 1、skip 1、fail 0，与直接运行一致                                                          |
| `pnpm --filter @foundry/skills exec node -e "console.log(require.resolve('vite')); console.log(require.resolve('yaml/package.json')); console.log(require('yaml/package.json').version)"` | 确认直接依赖可解析             | Vite 可解析；yaml/package.json 报 MODULE_NOT_FOUND，退出 1，为 T002 依赖接线依据                                 |

首次失败明细：test_constitution_prompt_skill_is_retired；test_manifest_matches_all_source_files；test_mcp_modes_expose_reachable_project_governance 的 task-tutor、task-pair、task-review 三个子场景。旧清单含已撤回 artifact-constitution-prompt、speckit-bugfix，缺少新 bug-report 和三模式。只运行原 build 后全部转绿，确认根因是生成物过期；这不是本功能代码修复。

沙箱内额外探测观察到 Node spawnSync 的 EPERM 与成功 stdout 并存；曾请求沙箱外复验，但服务重启中断，未取得外部执行结果。随后以 Node 支持的无测试隔离方式取得真实子项输出，不将中断请求算成执行成功。

## 受保护文件 SHA-256

以下摘要在修改功能定位及检查清单前记录；T002 完成后逐项复核。manifest 是原构建重新生成后的基线，后续重建应按内容比较，生成时间可变化。

| 文件                                                       | SHA-256                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| packages/skills/extension.yml                              | `5dc58f14e7133086de410d9b554c8bd348fb7be3126ff63d3021f7126921cc7f` |
| packages/skills/build/plugins/manifest.ts                  | `ea22917a53579078503f1c67a413434185ab0d3db13a1c38a97158d86a2a0163` |
| scripts/dev/actions/link-skills/link-skills.sh             | `f84c7904221da955b3b840c54b334d9f3d7633366cac6a44b2186d06cafa0740` |
| scripts/dev/actions/link-skills/link-skills.ps1            | `5a239bb3502bb5c4e5593aa2c627a9b8b5370a89e690d4cd2eb07a975dfe262d` |
| scripts/dev/actions/link-skills/test-link-skills.mjs       | `b91759866a4b507e5380ff6606bd0bae53a7db2a1ac46705662135d427b8fd29` |
| .specify/extensions.yml                                    | `3fe3069b9698cc9d4ee4dfcf87d6d37a329b0cfc0de8bfc3d0fc6e70ea628903` |
| .specify/memory/constitution.md                            | `b7b4c90cedeb59bdb79d145412a678e1a5293f89c3e550bc778558c95020553b` |
| specs/skills/20261029-speckit-workflow-foundation/tasks.md | `ecacaea8710b4891ff6b8111dd4d11245c413698699ff1c55bfedec6be1f76ce` |
| packages/skills/dist/manifest.json（重建后）               | `495db4945a4e856dda6917652c6e815d54b43942b95d1f1f64800df10fdffe0c` |

## 验收与续接

T001 的基线记录目标满足：首次失败、构建后结果、跳过项、环境缺项及受保护摘要均已保留。此结论不表示跨平台或原生挂载兼容通过；原 modes 真正隔离注册、MCP 全回归及六项 MVU 留给原定后续任务。下一步仅执行 T002 工具接线；缺少的运行时必须明确报告，不写占位成功入口。
