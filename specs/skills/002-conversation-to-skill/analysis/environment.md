# T002 · 隔离样例与环境证据

日期：2026-11-20。依据为 [T002 方案](../implementation/T002.md)、[原 Task](../tasks.md)、[T001 现状](preparation.md)及[验收指南](../quickstart.md)。本次交付可重复创建和清理的样例支持，不表示新记录入口或宿主链路已经通过。

## 实际环境与缺口

| 项目 | 实际检查结果 | 后续范围 |
| --- | --- | --- |
| Codex CLI | `codex --version`：`codex-cli 0.170.0`，返回 0 | T004/T005 继续核对该版本实际事件和数据来源 |
| Node | `node --version`：`v26.8.1`，返回 0 | helper 与 Node 测试使用当前运行时 |
| pnpm | `pnpm --version`：`12.8.1`，返回 0 | 沿现有 workspace，没有新增依赖 |
| Git | `git --version`：`git version 2.53.0`，返回 0 | 样例实际 init、commit、diff 和 status 已运行 |
| 仓库级候选 hooks | 当前 `.codex/hooks.json` 不存在 | 本轮未创建或启用，未运行 `/hooks`，信任及未信任对照留 T004 |
| 目标 CLI 的真实派发 | 未运行 | 本会话代码审查子代理不作为目标 CLI 的提炼/分析派发证据，留 T015/T018/T022 |
| 通用格式校验工具 | PATH 未发现 `skills-ref` | 后续准备官方工具或等价检查，本轮没有格式消费验收 |
| 第二兼容代理 | PATH 未发现 `claude`、`goose`、`opencode` | 仅报告当前 PATH，未安装或证明其他兼容入口可用；SC-006 仍缺实际宿主与消费 |
| jq | 当前 PATH 未发现 | 本 helper 不依赖 jq，样例回归没有因此跳过测试 |
| Spec 定位 | `.specify/feature.json` 不存在 | 沿用户明确的本 Spec 定位，不以文件缺失扩大到其他项目 |

仅读取本地版本、仓库文件和命令可用性，不读取或复制用户级认证、机器配置及其他仓库个人资料。环境缺项没有被改写为验证通过，也未触发安装或外部资源变更。

## 已交付的样例支持

入口为 [sandbox.mjs](../../../../packages/skills/tests/conversation-workflow/helpers/sandbox.mjs) 的 `createConversationSandbox()`。每次用系统临时目录创建独占根，路径经 realpath 核对；样例不会在本仓库新建业务仓库或资料目录。

| 返回项 | 用途及实际验证 |
| --- | --- |
| `root`、`repository`、`projects` | 独占临时根、真实 Git 仓库及两个子项目，分别从项目内用 Git 得到相同目标根 |
| `outside` | 与 repository 同名前缀的仓库外兄弟目录，用于后续路径边界对照 |
| `records`、`writable` | 都在目标仓库外；需要故障时将 writable 作为样例资料写入根 |
| `attachment` | 原件字节为 `[0, 255, 13, 10, 128, 1]`，文件含中文及空格名，并提供 SHA-256 |
| `longOutput` | 提供 command、args、expected；实际执行输出首尾标记与 16384 个中文片段，共 163854 个 UTF-8 字节 |
| `initialRevision`、`git()`、`snapshot()` | 合成基线提交和真实 Git 操作；快照分别返回 head、status、worktree、index，保留行首状态列、内容尾随空格及 CR，只去除 Git 输出末尾一个 LF |
| `blockWrites()`、`restoreWrites()` | 将已有资料目录暂存，以普通文件占位产生真实 ENOTDIR；重复阻断和恢复保留原记录，恢复中途失败后仍可重试 |
| `cleanup()` | 仅删除本次临时根，可重复调用，不影响另一份并行样例；测试结束后清理已创建样例 |

Git 子进程删除继承的全部 `GIT_*` 覆盖项，显式指定空全局配置、禁用系统配置，并在调用参数中禁用 hook 和签名。真实哨兵仓库验证覆盖项不能改变其索引、对象、HEAD 或工作区。测试使用合成身份，未修改本项目 Git 索引、提交、分支、用户全局配置或 HOME/CODEX_HOME。

调用方创建样例后应在 finally 或测试结束回调中调用 cleanup。需要实际 CLI 会话的后续 Task 可保持样例存活直至流程结束，再清理；本次没有留下一份被冒认为永久环境的临时路径。

## 红绿验证与审查

行为测试位于 [conversation-sandbox.test.mjs](../../../../packages/skills/tests/distribution/conversation-sandbox.test.mjs)，复用现有 Node 测试文件范围，没有修改 lint 规则。先运行六项用例，均因缺少真实 helper 导出产生明确断言失败；实现后六项通过。

随后以真实 Git 增加尾随空格及 CR 保真回归，并以真实目录移动重现恢复的第二步 rename 失败。原实现分别丢失 diff 原值、无法重试；定向失败后修正为只删除末尾 LF、恢复删除占位时允许占位已不存在，再运行全部八项通过。两个样例用例在首次创建成功后立即注册清理，第二次初始化失败也不会遗漏第一份清理。

只读代码审查提出的恢复重试及 CR 保真问题已用真实失败复现后修正，清理注册顺序也依审查调整；审查者重新读取最终代码并独立运行八项回归，结果 8/8，通过且无未解决的 Critical、Important 或 Minor 项。审查范围不包含正式记录/派发功能和其他工作线，未修改文件或 Git 状态。

| 验证 | 实际结果 |
| --- | --- |
| `node --test packages/skills/tests/distribution/conversation-sandbox.test.mjs` | 8/8 通过，退出码 0，无跳过 |
| `pnpm --filter @foundry/skills lint` | 返回 0；首次定向 lint 的数组换行错误按现有规则修正 |
| `pnpm --filter @foundry/skills check-types` | 返回 0 |

这些检查验证样例支持和目标包工程规则；没有运行无关完整分发测试、Python 套件或产品构建，不宣称这些检查通过。T004/T005 的真实 CLI、故障后用户任务继续、恢复、提交及主会话子代理活动留存仍须相应原 Task 验收。
