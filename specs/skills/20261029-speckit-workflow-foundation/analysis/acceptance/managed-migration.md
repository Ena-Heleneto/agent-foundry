# T072 提前入口交付与受管迁移

日期：2026-11-08。用户在优先级调整后明确“实施”，本轮范围为 [T072](../../tasks.md#t072) 的 modes 技术验证和真实入口交付。T072 的剩余 hooks/旧副本迁移未完成；[T079](../../tasks.md#t079) 用户业务行为验收尚未开始。

## 交付结果

官方 Specify CLI 1.2.6 已在当前工作区将 modes 从五项替换为 Tutor、Pair、Direct、Increment 四项。真实 registry 的 codex 命令为 `speckit.modes.tutor`、`speckit.modes.pair`、`speckit.modes.direct`、`speckit.modes.increment`；生成入口分别位于 `.agents/skills/speckit-modes-*/SKILL.md`。旧三个 `speckit-modes-review`、`speckit-modes-guide`、`speckit-modes-explore` 目录已由官方移除。

Bash/PowerShell 注册器同步四项集合和输出说明，保留一次完整强制重装、完整目录附件复制、缺源零首次调用、失败退出与临时目录清理。没有新增 Direct 单选参数、别名、扩展 ID、安装状态系统或生成入口模板。

已实际读取生成的 `.agents/skills/speckit-modes-direct/SKILL.md`，加载其完整正文，按用户明确路径读取调度中心的 spec/plan/mvu/tasks，定位到 `specs/dispatch-center/002-cost-accounting-scheduling`；该 Spec 默认下一组为 T001–T002，但用户尚未选择本轮业务 Task/分工，因此只做入口加载与上下文定位，没有业务实施或用户行为通过结论。此结果不代表已核验客户端下拉菜单的即时刷新。

## 写前清点与保护

工作区已有暂存和未暂存内容，原地执行，不切分支、不提交。写前脚本/测试、`.specify/extensions/`、extensions.yml、集成 manifest、feature 指针及五份旧生成入口保存在 `/tmp/direct-mount-o2wzbnte/before/`；原暂存差异保存为同目录上级的 staged.patch。五份生成目录均只有 SKILL.md，正文与旧 modes 登记来源一致；受管扩展目录除 manifest 和五份已登记技能外没有未知文件。真实清点无用户额外附件或正文冲突。

迁移后逐项验证：七个非 modes registry 条目完整保持；`.specify/extensions.yml`、`.specify/integrations/codex.manifest.json` 和现有 feature 指针逐字保持；原暂存区 diff 逐字保持。只改变 modes 登记及官方受管目录。通用旧 `task-review/task-guide/task-explore` 副本和六旧 hooks 本轮不处理，完整退役仍留原后续任务。

本次直接消费构建的 `packages/skills/dist/skills/workflow/` 四份同版来源；写前核对源码/构建文件清单及 SHA-256 完全一致，官方扩展内四份目录与源码字节一致。生成入口的 frontmatter 由官方改写名称、compatibility 和 metadata，正文除末尾空白外一致，不能要求整份生成文件与来源 hash 相等。

## 技术验证与命令

先只将 Python/Node 测试输入和预期改为四项，运行 Python 套件：4 项中 3 项失败，旧注册器报缺少 task-review，确认新集合尚不支持。随后修改生产脚本，再运行同一套件 4/4 通过；测试覆盖真实 shell 的输入、附件、每次重装、源更新、缺项和 CLI 失败。

| 实际命令或动作                                                                               | 结果                                                                                                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `python -B -m unittest discover -s packages/skills/tests -p test_register_commands.py`       | 修改生产前 3 失败/4；修改后 4/4 通过                                                                    |
| `node --test --test-isolation=none packages/skills/tests/test-register-commands.mjs`         | Bash 1 项通过；PowerShell 因缺 pwsh 跳过                                                                |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                  | 退出 0                                                                                                  |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`           | 退出 0                                                                                                  |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                 | 退出 0，脚本与分类技能源进入 dist                                                                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                  | 21 个测试方法，4 个失败子项；全部为 Tutor/Pair 来源及交付的既有旧治理锚点，分别归 T057/T065；未弱化断言 |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs` | 初次子进程遭沙箱 EPERM；获准原命令重跑后 7/7 通过，包含构建后脚本脱离源码执行                           |
| `python /tmp/direct-mount-o2wzbnte/verify-migration.py`                                      | 官方 1.2.6 隔离迁移、重复、来源/正文、保留及失败路径检查通过                                            |
| `bash -n packages/skills/script/register-commands/register-commands.sh`                      | 独立审查复跑通过                                                                                        |

完整套件的失败名称为 `test_mode_sources_link_project_governance` 和 `test_delivered_modes_link_project_governance`，两者各含 task-tutor/task-pair 子项；不可达旧锚点为 `vii-任务与子任务规则`。它们与此前 Direct 工程证据记载一致，本轮未修改这两份技能，不把挂载完成说成全包测试通过。

隔离项目 `/tmp/direct-mount-o2wzbnte/sandbox` 复制写前实际登记与 hooks，以四份当前来源调用固定版本官方 CLI。首次五变四和再次完整重装均退出 0，四项来源及正文匹配，旧三入口消失，无关扩展/hooks/集成 manifest 保持。缺少 Direct 来源时脚本非零且整个目标项目 hash 不变；将要求版本设为 9999.0.0 时官方明确拒绝、脚本退出 1，目标 hash 不变。另在独立来源增加 Direct 附件，实际官方安装后扩展目录完整保留该附件。

未知附件保护验证属于一次性迁移前清点流程：在另一隔离副本加入 `.agents/skills/speckit-modes-direct/user-note.txt`，清点精确发现该额外路径，停止而未调用官方 CLI；除测试输入文件外项目保持。它不是注册器自动保护能力，不承诺官方 force 保留未知附件。可复用骨架为现有两份边界测试、生产临时输入生成与本次隔离项目；后续 T066 在其上补六 hooks/完整刷新，不另建生产注册器。

## 真实官方调用

uvx 首次因缓存锁位于只读目录失败，获准离线执行后确认 Specify 1.2.6。随后固定使用同版本已有可执行文件；没有下载依赖。真实 `.agents` 受沙箱只读保护，具体官方迁移命令获得环境审批后执行：

```bash
PYTHONDONTWRITEBYTECODE=1 bash packages/skills/script/register-commands/register-commands.sh --project /home/by152/workspace/ena/foundry/feature/speckit-workflow-extensions --skills-dir /home/by152/workspace/ena/foundry/feature/speckit-workflow-extensions/packages/skills/dist/skills/workflow --cli /home/by152/.cache/uv/archive-v0/s_51tx9Lm47I8qPa/bin/specify
```

退出 0，官方输出四个新命令。未直接手写 registry、生成 SKILL.md 或 YAML；不调用完整初始化，hooks 阶段此次不适用。对真实登记、源/构建/官方目录、正文、旧入口和保护项的独立读取检查通过。

Direct 来源及扩展内 SKILL.md SHA-256：`74b28bca63bb0a73e82c6cc3463c8a068ef06a4a5c4452164e711fdef33f84e4`。官方生成入口 SHA-256：`8121d5d1800c3c660f3000bc2ce431611d1000d3ebd6c32d1d5829c5177a7195`。

## 审查与限制

独立只读审查未发现 Critical/Important，另复跑 Bash 语法、Python 4 项和 Node Bash 1 项。README 的 T048 历史与当前 T072 验证归属容易混淆，证据回填时已明确区分，未改生产行为。修改符号的中文多行 JSDoc 保持。

PowerShell 实测命令 `pwsh -NoProfile -File packages/skills/script/register-commands/register-commands.ps1 ...` 因环境缺少 pwsh 未执行；两平台逻辑已同步，但不能声称 PowerShell、Windows 或 macOS 已通过。新会话命令菜单发现和真实用户使用流程尚待用户操作；本轮只能确认官方挂载、生成正文加载与明确 Spec 定位。Tutor/Pair 已挂载不代表其旧治理问题已修复。

after_implement 的 explainer-doc-sync 已实际加载核对，本轮没有生成/复用知识说明，不建空节。无发布、部署、数据库写入或业务代码修改。T072 仅提前入口步骤完成，整个任务保持未勾选；T079 尚待用户真实参与，阶段批准不预填。
