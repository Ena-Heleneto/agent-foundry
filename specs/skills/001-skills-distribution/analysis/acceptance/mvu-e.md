# T007：Git 精确排除边界验证

## 结论与适用范围

2026-11-09，用户在下一步建议后明确“开始”，本轮推进前置 T004 已满足、可独立实施的 T007。Linux 上正式调度器 MVU-E 最终 **11 pass、0 fail、0 skip**；技能包 lint、check-types、build 均退出 0。调度与 link-skills 消费者回归为 **8 pass、1 PowerShell skip、0 fail**。

这是 C3/C4 的最小风险验证，不表示产品 `--hidden` 已接通。新增 `packages/skills/tests/distribution/mvu-e.mjs`：测试内原型只操作自有临时仓库，调用真实 Git，保留为 T033/T034 的后续场景骨架；产品职责仍由 Bash/PowerShell 平台模块承担。既有 `test-distribution.mjs` 已按文件名自动发现 E，本轮无需修改调度器或增加入口。T033 仍依赖 T028/T007，T008 的其他前置不变。

实际环境：Linux、非 root 用户 uid 1000、Node 24.22.2、pnpm 12.16.1、Git 2.56.0、Bash 5.3.9。沿用当前计划指定的 feature 分支和未提交工作区，保护用户暂存区及其他 Spec 改动。所有 Git 初始化、空提交、worktree、权限和链接故障只发生在 `createSandbox()` 创建并清理的临时目录；测试隔离 HOME、Git 配置和仓库发现上界。

## 已核验假设与可观察结果

| 输入与故障                                               | 实际信号                                                                                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 普通仓库、成功且独占的技能目录及附件                     | `git check-ignore -v` 来源为本地 `.git/info/exclude`；`git ls-files -z` 无跟踪项；`git status --porcelain --untracked-files=all` 不再列出所选文件，正文及附件仍可读取 |
| 未成功技能、共享配置、已有反向规则、连续两次运行         | 未选技能和共享配置仍可见，原规则字节前缀保留，重复执行 exclude 字节不变，项目 `.gitignore` 不变                                                                       |
| hidden 关闭                                              | exclude 原始字节不变，文件仍可见                                                                                                                                      |
| 父仓库内无自身 `.git` 的子项目、无仓库目录               | 明确跳过，不创建 `.git`，父仓库 exclude 不变                                                                                                                          |
| 真实 worktree 的 `.git` 文件                             | 按首版不支持约定跳过，不修改公共仓库规则；不扩展 worktree/submodule 隐匿支持                                                                                          |
| global 未指定项目、项目外全局技能、项目内独占入口        | 无显式项目时跳过；项目外路径逐项报告跳过，项目内入口按真实 Git 信号验证隐藏，全局正文保持                                                                             |
| 空格、尾随空格、星号、问号、方括号、反斜线、前导 `#`/`!` | 所选路径按字面量排除，手写的相近未选路径仍可见，不扩大匹配                                                                                                            |
| 目录内有已跟踪文件                                       | 写规则前失败，exclude 不变、索引仍保留跟踪、安装正文不丢失                                                                                                            |
| exclude 真实只读权限                                     | 非 root 下实际写入失败，独立报告 `exclude-write-failed`，原规则和已安装文件保持                                                                                       |
| exclude/候选父目录链接、悬空 exclude 链接                | 写前拒绝；既有外部哨兵字节不变，原本不存在的外部目标仍不存在                                                                                                          |
| 换行路径、项目根路径                                     | 拒绝构造规则，不注入其他规则，不产生整仓库忽略                                                                                                                        |

## 红绿过程与独立审查

1. 实施前正式入口退出 1，报告 E 为 `not-run`、缺少 `mvu-e.mjs`。新增 10 项行为断言后，无实现骨架得到 0 pass、10 fail，失败定位于尚无精确隐藏行为。
2. 首次原型 7 pass、3 fail。最小 Git 复现确认：`git --literal-pathspecs check-ignore` 退出 128，提示不支持 literal magic。跟踪/状态等查询保留字面量 pathspec；`check-ignore` 使用原生路径参数，10 项全部通过。该事实由真实进程发现，没有按猜测放宽断言。
3. 独立只读审查发现 `existsSync` 漏掉悬空符号链接：追加规则可能在项目外创建文件。审查方提取当前函数，在自有临时目录复现外部创建；其完整 Git 尝试遭沙箱 EPERM，未算通过。主执行者新增真实 Git 反例，观察原型错误返回 success 后，改用不跟随链接的 `lstatSync(..., { throwIfNoEntry: false })`。最终整套 11 项通过，外部目标未创建；没有重复派发审查。
4. ESLint 首次报告认知复杂度和一处不必要正则转义；将精确规则追加拆为职责单一的测试辅助函数并修正转义，未关闭规则。所有本轮新增声明附中文多行 JSDoc。

## 实际命令与结果

以下均为本轮执行；pnpm 前缀 `--config.verifyDepsBeforeRun=false` 仅避免自动依赖准备。

| 命令                                                                                                                                    | 结果                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --mvu E`                                     | 最终退出 0，调度报告 passed，11/11，无跳过                                |
| `node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs scripts/dev/actions/link-skills/test-link-skills.mjs` | 9 项：8 pass、1 PowerShell skip、0 fail；缺 pwsh 明确保留                 |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                             | 修复后整包退出 0                                                          |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                      | 退出 0                                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                            | 最终退出 0，Vite 8.3.6 正常输出                                           |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                             | 24 项，2 项既有 Pair 治理锚点失败，退出 1；见下方限制，不宣称整包测试全绿 |

Node/Git 子进程测试、消费者回归和构建在普通沙箱分别遇 EPERM，按工具批准以相同命令在沙箱外重跑。环境失败不改写为功能红灯或通过；正式证据取完整最终输出。

## 保留的失败与未验证范围

Python 的 `test_delivered_modes_link_project_governance` 和 `test_mode_sources_link_project_governance` 均在 `task-pair` 分支失败：正文仍引用 `vii-任务与子任务规则`，当前宪章为“VII. 任务与内联步骤”。此前验收已记录同一问题，本轮未编辑 Pair、宪章或其测试，不越界修复，不藏成 skip。

未运行 macOS/Windows、最低 Node/Bash、PowerShell 隐匿或完整安装挂载矩阵；本轮没有产品平台隐匿实现，不将测试原型当作 US4 通过。submodule 未另建真实样本，首版 `.git` 文件统一跳过；真实 worktree 已验证这一文件类型边界。无发布、远端修改、真实用户安装、用户仓库排除规则写入或取消跟踪操作。

原始日志为 `/tmp/foundry-t007-*.log`，可能随环境清理；本文保存最终命令、结果、修正依据及限制。T007 工程 checkbox 只在 [tasks.md](../../tasks.md#t007) 维护。
