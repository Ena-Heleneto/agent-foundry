# T051：内容导出骨架与独立消费验证

## 范围与结果

用户在了解 T051 后明确“开始”，本轮只实施 [T051](../../tasks.md#t051)。在现有内容、脚本和 MCP 构建上建立可复用的内容快照、导出插件及只读校验；测试显式接入同一 Vite 配置，连续构建、按清单迁移、移除源夹具，再用官方 skills 1.7.4 实际安装。三项稳定技能的正文和完整附件逐字节一致，五类源缺件或越界故障均明确失败。

本项按已验证的 Linux、Codex 项目级与 identity 原始字节范围通过；不是完整分发或公开发布通过。全包 Python 测试存在下述两项既有失败，不能声称全包测试全绿。

## 实际实现与骨架复用

- `packages/skills/build/distribution/export.ts`：从原 MVU-A helper 提取目录发现与元数据读取，增加显式分类选择、本地附件引用检查、源快照和开发清单。清单保存逐文件长度、SHA-256、版本与源码提交，不含生成时间或自身摘要。
- `packages/skills/build/distribution/verify.ts`：复用完整字节读取，拒绝源链接、特殊文件、不可移植路径、大小写冲突和官方会过滤的必要内容；复制后核对声明文件及技能完整集合。
- `packages/skills/build/plugins/distribution.ts`：构建前固定来源，原有复制插件完成后串行核对实际产物，再生成 `agents.json` 和 `release.json`。只处理构建数据，不执行或打包运行脚本。
- `packages/skills/distribution/agents.json`：仅含本项实测的 Codex 项目级路径与 identity 说明，明确标记 development。
- `packages/skills/tests/distribution/content-export.mjs`：真实构建、迁移、官方安装、唯一 Node 入口帮助与故障拒绝实验。
- `packages/skills/tests/distribution/helpers/catalog.ts`：转导出同一生产骨架，保持原 MVU-A 入口，不重复维护目录和附件算法。

默认 `vite.config.ts` 未改变，仍一次输出 `dist/mcp`、`dist/skills`、`dist/script`；本插件先由实验显式接入。完整正式清单与默认接线留给 T012，在相同文件上增量完善。实验副本仅迁移 `release.json.files` 和清单自身，不能把包含内部 eval/workflow 的完整 dist 当成公开选择。开发清单 `development: true`，不宣称 README、许可证、新工作流集合及全部支持矩阵已经交付。

## 技术假设与实际信号

C3/C4 假设为：完整技能及必要附件、identity 字节、最小清单与现有脚本能够随一次构建搬离源码，不依赖未实现的原生挂载。T003/T004/T041 的历史工具及安全边界按其原范围复用，本轮不重开或追改旧验收。

成功输入为真实 coding/frontend 三技能：document-changed-symbols、nuxt-ui-styling、vue-reactivity，以及现有四类平台脚本和唯一 Node 入口。连续两次构建的整个输出字节集合一致；迁移白名单副本后删除源夹具，副本没有 node_modules，官方 CLI 仍可安装三技能，未选新增为零。独立副本的 Node 入口 `--help` 成功，正文与附件完整集合一致。移除或篡改附件，产物校验明确报缺件或摘要错误。

失败输入分别为删除正文引用附件、删除 `script/index.mjs`、在技能内建立指向外部文件的链接、加入越界 Markdown 引用、加入大小写折叠冲突文件。每个独立夹具构建均拒绝，且不生成成功清单，不修改真实技能源。

## 环境、命令与结果

实际环境：Linux x86_64，Node 24.22.2，pnpm 12.16.1，Bash 5.3.9。官方 skills 1.7.4 安装在 `/tmp/foundry-t051-official/node_modules/skills`；测试专用 pytest 通过 uv 隔离环境准备，没有修改工作区依赖。源码基点为 `676dcff0dc30c99ed984013d2c649db86f093163`，本次未提交的实现与真实文件摘要属于开发验证，不是公开不可变版本声明。

| 命令或操作                                                                                                                                                                                       | 实际结果                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `node --test --test-isolation=none packages/skills/tests/distribution/content-export.mjs`（实现前）                                                                                              | 1 fail，明确缺少内容导出插件；不是安装成功的占位结果                                     |
| `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t051-official/node_modules/skills node --test --test-isolation=none packages/skills/tests/distribution/content-export.mjs`                                  | 最终 7 pass、0 fail、0 skip；真实独立安装、脚本帮助、稳定摘要和五类失败分支通过          |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                      | 退出 0；未放宽 ESLint                                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                                               | 退出 0                                                                                   |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                                     | 退出 0；默认三目录及原样复制保持                                                         |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/distribution/sandbox.mjs scripts/dev/actions/link-skills/test-link-skills.mjs` | 9 pass、0 fail、1 PowerShell skip；其中 sandbox 被导入，完整断言另行单独执行             |
| `node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs`                                                                                                               | 单独执行 7 pass、0 fail、0 skip，包含真实调度、参数错误及用户/Git 隔离                   |
| `uv run --cache-dir /tmp/foundry-t051-uv-cache --isolated --no-project --with pytest python -B -m pytest -q -o pythonpath=<source-workspace>/apps/mcp/src apps/mcp/tests/test_registry.py`       | 7 passed；原 Python 无 pytest，离线缓存缺失后经批准准备隔离测试依赖                      |
| `PYTHONPATH=apps/mcp/src python -B -` 中显式以 `Path('packages/skills/dist/mcp/manifest.json')` 调用 `load_skills`                                                                               | 实际返回 `mcp-build-smoke`；默认旧清单路径迁移不在本项                                   |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                                      | 实际 23 tests，2 failures，均为 task-pair 的旧宪章锚点；其余项无新增失败，不记为全包通过 |
| 独立只读审查、中文多行 JSDoc 声明扫描                                                                                                                                                            | 未发现当前范围的功能阻断；遗漏的转导出与循环绑定注释已补齐，包 lint 再次退出 0           |

Node 真实安装、已有构建消费及单独调度测试在普通沙箱分别遇到子进程 EPERM，经批准按相同命令在沙箱外通过。官方包下载的首次 DNS EAI_AGAIN 和 pytest 离线缓存缺失均保留为环境准备失败，不将失败次数改写为已通过。未修改系统信任、真实用户安装目录或其他 Spec。

## 既有失败、限制与续接

全包测试的两个失败为 `test_delivered_modes_link_project_governance` 和 `test_mode_sources_link_project_governance` 的 task-pair 分支：源引用 `.specify/memory/constitution.md#vii-任务与子任务规则`，当前宪章为“VII. 任务与内联步骤”。`git show HEAD:packages/skills/src/skills/workflow/task-pair/SKILL.md` 已含同一旧引用，本轮该文件和宪章均无 diff，属于主线原有 Pair 治理适配范围。本项不修改它，不把该失败藏成 skip 或降低断言。

PowerShell 复制测试因当前 PATH 缺少 pwsh 跳过；Windows、macOS、最低 Node 22.20.0、Eve、全局位置、79 agent/35 原生集成、完整四模式及两 hooks、真实远端均未由本项验证。完整主线来源和消费契约仍在 T012/T006 等依赖点核对，不用三技能样本抵扣全部承诺。

原始过程日志为 `/tmp/foundry-t051-*.log`，可能随环境清理；本文保留具体输入、命令、实际结果和限制。下一组从 T009 开始，T010～T012 与 T008 复用本次同一骨架；本轮不实施后续任务、不挂载或发布。工程状态仅由 tasks.md 中的 T051 checkbox 保存。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
