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

## 当前工作区复核（2026-11-20）

本节对应本轮一致性分析 I1 及[修订授权](../requirements/raw/2026-11-20-analysis-remediation.md)，追加当前现场与修复结果，不覆盖上文历史验收。修复前工作区无已跟踪改动，`.agents/skills/shadow-profile/` 为普通目录，仅包含一份 `SKILL.md`，声明 `name: shadow-profile`，SHA-256 为 `3c35847b795e1cc90fe3d503168cbd31849d607fe0a90abf4d2ab963ebc1049e`。该文件与上文归档原件不同；本轮不能确定其重新出现的来源或时间。

主线 `profile/collection.config.ts` 已无旧启用项，现有 Bash 同步已经具备清理当前项目单份旧生成正文、跳过退役来源的能力。复用 T028/T029 的已有方案，在当前项目执行：

```bash
bash scripts/dev/actions/link-skills/link-skills.sh packages/skills/src/profile .agents/skills
```

实际退出 0，输出 `remove(已退役): shadow-profile`，新建、更新、跳过和冲突均为 0。同步后旧安装目录不存在，另外 13 个安装项的文件字节或链接目标与同步前一致。未手改安装副本，未修改同步脚本或集合配置，也未重跑历史归档和构建任务。

使用本机 `codex-cli 0.170.0` 新启动 `codex app-server --listen stdio://`，完成初始化后向 `skills/list` 传入仓库根与 `packages/skills` 两个绝对目录及 `forceReload: true`。两处 `shadow-profile` 结果均为空，两处均能发现 `speckit-plan`，宿主返回的错误列表均为空。当前对话已经载入的技能目录不是此次重新发现的证据；上述结果来自新进程的实际响应。

本轮只恢复旧入口退役状态及修订资料约定，不代表新记录流程已可用。T028 的历史完成事实保留，T029 继续等待 T014 的新记录最终入口验收及旧入口仍未发现的补验。记录自采集边界和同轮提交重试的真实业务样例也仍由原任务取证。

本轮另运行 `node --test scripts/dev/actions/link-skills/test-link-skills.mjs`：4 项通过、0 失败，PowerShell 项因无可用 `pwsh` 跳过；测试写入均在临时沙箱。对全部 14 份新增或修改的 Markdown 执行 `pnpm exec eslint --fix`，退出 0，但均被现有忽略规则跳过，不记为正文 lint 通过。另读回检查 151 条本地文件及锚点引用、围栏和工程 checkbox 边界，均无错误；32 项任务的身份、顺序和勾选与修订前一致，`git diff --check` 通过。未执行新记录、提交重试或派发的产品验收。

## 2026-11-24 新旧入口切换补验

主线 `scanSkills` 返回一项 `profile/conversation-recording`，`shadow-profile` 为零。隔离目录运行主线常规同步后，再对归档源执行定向同步，实际返回 `skip(已退役来源): shadow-profile`，目标中的旧入口数量仍为零。同步回归的 Bash 和交付配置共 4 项通过，PowerShell 用例因无 `pwsh` 跳过。[T014 最终来源验收](recording-acceptance.md#2026-11-24-最终安装来源补验)

T014 通过后，将同一主线构建产物同步到另一个临时仓库。新启动的 Codex CLI 0.171.0 通过 `skills/list` 强制发现，仓库根和 `projects/alpha` 各找到同一份项目级 `conversation-recording`，`shadow-profile` 的发现数均为零。以单次启动的 `developer_instructions` 启用记录，新开的前台会话实际读取安装入口。输入「读一下 README 的第一行。」后，索引链接打开详情，原请求和实际回复「对话记录合成基线」均可回查，隔离仓库 Git 快照一致。T029 补验通过。[宿主发现、实际读取及记录证据](acceptance/t029-recording-switch/observations.json)
