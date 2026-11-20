# 旧影子画像退役证据

2026-11-20 按用户确认提前退役。旧入口撤下后，自动记录等新记录交付后恢复。已有对话、画像资料和历史规格保留。[用户确认](../requirements/raw/2026-11-20-early-shadow-retirement.md) · [原任务](../tasks.md)。

## 源码归档与旧候选

旧 `packages/skills/src/profile/shadow-profile/` 移至 [本 Spec 归档](../archive/shadow-profile/SKILL.md)。移动前后完整相对清单均为 `SKILL.md`，SHA-256 均为 `d9fe13c9d53f23230ac1063f513d38cab67e7109cd7e042d5e1b44cfb40c3cc4`。

旧规格已异常终止。下列维护目录内的旧 `SKILL.md` 与 T119 第四步已有来源快照逐字节相同，已清出维护目录，可从原快照复核。

| `packages/skills/src/profile/` 下原目录 | 原字节快照 | SHA-256 |
| --- | --- | --- |
| `conversation-recording` | [记录](../../20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t119/step4/sources/conversation-recording/SKILL.md) | `01e680eebc7d07079e4227253b545d3dc6a9dabc2e32bb1f83f600da7a3053f0` |
| `conversation-summary` | [摘要](../../20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t119/step4/sources/conversation-summary/SKILL.md) | `a76a2a38cab9e0d977d7419d5366863b64d36882fbd759775a0d82fbd56921e1` |
| `conversation-analysis` | [分析](../../20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t119/step4/sources/conversation-analysis/SKILL.md) | `03d166cae2ab20e2c47cd496202399640a4d1275e8492729705936b7455e12ea` |

T003 共用资料契约仍位于记录维护目录，SHA-256 为 `c0b0cde608b75cd51cf671f1b93e238fd45b13803a6c6d94e16a049398bfb2f4`。[共用契约](../../../../packages/skills/src/profile/conversation-recording/references/storage-contract.md)。

## 交付、同步与 Codex 发现

- 主线 `profile` 启用清单撤下旧项。`scanSkills()` 的总数从 11 降到 10，profile 从 `shadow-profile` 一项降到零。`pnpm --filter @foundry/skills build` 返回 0，生成目录中旧副本已清除。其余 10 项技能共 15 个文件逐字节匹配维护源。
- 在临时安装根模拟日常 `pnpm skills:link` 时，紧急版来源会新增五项并更新一项本地技能。为保护当前项目的其他副本，实际项目运行 `bash scripts/dev/actions/link-skills/link-skills.sh packages/skills/src/profile .agents/skills`，仅移除旧生成目录及正文。其他 28 个安装项的路径、文件字节及链接保持一致。
- 隔离项目连续两次执行实际 `pnpm skills:link`，首次移除旧副本，重复同步仍无旧入口。用当前 `profile` 及包含 `shadow-profile` 的归档父目录分别定向同步到空隔离目标，两者均未产生旧入口。其他来源的技能和同名目录内的用户文件通过回归保护。
- 使用 `codex-cli 0.170.0` 新启 `codex app-server --listen stdio://`，从真实 `skills/list` 接口传入 `forceReload: true`。项目根和 `packages/skills` 两处的旧入口均从退役前 1 项降到退役后 0 项，两次都发现 `speckit-plan`，作为发现链路的阳性对照。T029 尚待 T014 补验新记录可用且旧入口仍未发现。

## 检查结果

- Bash 同步回归先因旧源仍被复制、旧副本仍留在项目中两项失败。调整后 `bash -n` 和同步测试通过，4 项通过。PowerShell 1 项因没有 `pwsh` 跳过，沿项目既有历史范围。
- 记录沙箱、安装隐匿、挂载及主线构建相关 Node 回归 61/61，历史影子画像 Python 回归 27/27。目标包 lint、check-types 及同步测试 JS 的 ESLint 均返回 0。
- 扩展运行 `node --test packages/skills/tests/distribution/*.test.mjs` 有 69 项通过、51 项失败、4 项跳过。在同一 Node 24.22.2 与依赖下隔离复跑清理前的 `361a16b`，数量、失败项目名单和退出码一致。失败涉及旧在线 Agent 读取器、集合入口和试验构建夹具等既有路径，相关断言保持原样。
- Markdown 执行项目要求的 ESLint。`specs/**` 受仓库既有规则忽略，以文件读回、本地引用和 `git diff --check` 补核对。
