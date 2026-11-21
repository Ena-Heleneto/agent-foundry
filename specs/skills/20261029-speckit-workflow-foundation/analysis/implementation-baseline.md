# T001 实施基线

采集日期：2026-10-30。对应 [T001](../tasks.md)、FR-001/030/032；设计依据为 [research.md](../research.md) R1/R6/R7 和 [quickstart.md](../quickstart.md)。本次仅完成调查和隔离样例准备，不表示任何 MVU 或新模式已通过。

## 当前版本与工作区

- `.specify/feature.json` 指向 `specs/skills/20261029-speckit-workflow-foundation`，前置检查脚本成功返回该目录及 tasks.md。
- `.specify/init-options.json`、`.specify/integration.json`、`.specify/integrations/codex.manifest.json` 均记录 Spec Kit 1.2.5、Codex skills。此处是安装记录，不声称执行过 CLI 版本命令。
- 原生 `.agents/skills/speckit-implement/SKILL.md` 的 SHA-256 与 Codex 安装 manifest 一致：`848a5c9eff7b99e348927cbde6c35378de9fea3fd317941f58fa0b0b79301eec`。
- 当前分支为 `feature/speckit-workflow-extensions`。开始本步时仅 spec.md 有未提交改动，系用户要求的 FR-036 逐步参与约定；保留该改动。
- requirements.md 为 16/16 已检查。本步开始时正式 tasks.md 的 30 项均未完成；只有原生工程验收可修改其勾选，样例与共享子任务不得反向推导工程完成。
- skills 包只有 build 脚本，lint/check-types 缺失与计划一致，由 T002 补齐。未提前执行不存在的入口。

## 必须保留的内容

[baseline-hashes.json](baseline-hashes.json) 保存 43 个文件的仓库相对路径与完整 SHA-256，并分别保存源/副本清单、MVU 钩子语义对象及两平台注册器中的原始 MVU 行。采集时清单无缺失项。

| 类别             | 路径与核对办法                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 原生 Implement   | `.agents/skills/speckit-implement/`；与安装 manifest、采集 hash 比较                                                                       |
| MVU 源与副本     | `packages/skills/src/speckit/mvu-gate/`、`.agents/skills/mvu-gate/`；分别保存完整清单及 hash，当前一致                                     |
| MVU 当前配置     | `.specify/extensions.yml` 中 before_plan、after_plan、before_tasks、after_tasks、before_implement 共 5 个 MVU 条目；字段与相对顺序均须保留 |
| MVU 注册源       | `scripts/dev/actions/register-hooks/register-hooks.sh` 与 `.ps1`；每平台各 5 行 MVU 注册，保存原始行作对照                                 |
| 历史规格与引用   | `specs/speckit/001-atomic-skills/` 全部文件，以及 `specs/stacks/001-chimera-cloud-deploy/fastmcp.md`；历史正文和既有引用保留               |
| 初始化与博客配置 | hash 清单包含挂载器、注册器、nuxt-prepare 入口、博客集合、Nuxt 配置、公开运行时配置、列表和详情实现                                        |

注意：注册器、配置与历史契约在后续任务中允许有计划内修改，整文件 hash 用来审查差异，不要求这些文件永远不变；MVU 具体字段、原始注册行、技能字节及需保留历史正文须单独比较。完整文件清单用于发现新增或遗漏，不能只核对已有文件的 hash。

## 待移除的旧机制

- 源技能：`packages/skills/src/speckit/explainer-doc-sync/`。
- 当前有效副本：`.agents/skills/explainer-doc-sync/`。两者当前均仅含 SKILL.md，完整相对清单及逐文件 hash 一致，见 JSON 中 retired_skill_inventory。后续执行删除前必须重新核对，不能凭同名目录判断归属。
- 当前 YAML 中 `(before_implement, explainer-doc-sync)` 为 optional:true，`(after_implement, explainer-doc-sync)` 为 optional:false；两处均未禁用、无条件表达式。
- Bash 与 PowerShell 注册源各自含上述两处条目，必须一并定向退役，否则初始化会再次注册。
- 两平台挂载器均复制技能，保留源未声明的目标；只删除源目录不能清理已安装副本。本步未运行真实挂载或注册写入。
- 历史 FR-006/FR-007、tasks.md 随行文档节与旧机制名称属于历史证据，不计入有效调用清零。本步未改写历史文件。

历史链接核查：`specs/stacks/001-chimera-cloud-deploy/fastmcp.md` 存在，历史 tasks.md 末尾已引用该路径；旧 `docs/tools/fastmcp.md` 不存在，历史 T054 仍提到旧位置。后续仅提出定位说明或追加替代说明，保留原文，不批量迁移或重写历史链接。

## 博客与工程事实

- `apps/personal-hub/content.config.ts` 定义 blog 来源 `blog/**/*.md`、前缀 `/posts`、status 为 draft/published 且默认 draft。
- 列表以 `Boolean(runtimeConfig.public.isDev)` 控制草稿可见性；详情用 `import.meta.dev`，非 dev 草稿返回 404。字符串环境覆盖风险仍属 MVU-D 待验证项，不能据静态阅读宣布发布隔离安全。
- Nuxt 配置为 cloudflare_module，并配置本地演练所需 D1 binding；本步不访问数据库、不读取环境变量值、不运行博客、不发布或部署。

## 隔离样例与重建约定

本次实体目录为 `/tmp/speckit-foundation-t001-z2xleuxz`，完整文件清单/hash 保存在 JSON 的 fixture 字段。临时目录可能被系统清理，运行后续演练前重新核对；丢失时按以下约定重建并记录新快照，不能将旧路径当成持久工程进度。

1. 建立独立 Spec `specs/skills/baseline-fixture/`；复制当前 spec.md、plan.md 作设计输入，但该副本只供演练。其 tasks.md 独立定义 T001/T002，每项带八栏目与明确验收；T001 要求实际调用返回 1，T002 要求返回 2 且 T001 状态不变。任务编号不属于真实功能。
2. fixture-definition.json 保存样例定义：T001-S001 与 T002-S001 各有唯一父任务和 code 验收；T001-U001 为 pending、无执行证据。两父任务引用相同 knowledge.md，但不共享身份或状态。此文件不是权威 state.json，不提前手写未来 helper 的运行状态。
3. 后续由真实 helper 初始化状态，实际完成编码并保留学习未通过，用于跨模式验收。本步没有代码实现、学习通过、状态提交或模式切换证据。
4. 在临时副本复制旧技能源/副本及 mvu-gate 源/副本；复制原扩展配置，保留原始快照 `.specify-extensions-snapshot.yml`，仅在临时配置增加 fixture-custom 可选钩子。未知技能 fixture-unknown/sentinel.txt 用于验证定向清理不伤未知内容。
5. 临时博客内分别创建 fixture-draft.md、fixture-published.md，具备 title、description、date、tags、status 及待保留正文。文章仅是测试数据，不复制真实文章或数据库。
6. 当前副本是最小输入样例，不是可启动的完整仓库。后续实际注册器、挂载器、模式或博客演练前，按各任务复制必需脚本/运行依赖，并刷新挂载、重新核对完整清单/hash；不能以本次样例准备替代真实行为验收。

## 验证与限制

- 前置检查脚本返回绝对功能目录及所需文档，退出 0。
- YAML 由本地已安装的 yaml 2.9.1 解析成功；Python 未安装 PyYAML，根级不能直接 import yaml 包，最终使用现有 pnpm 存储中的解析器，无新增依赖。
- 原生 Implement 对照安装 manifest，MVU/旧技能源与副本逐文件对照，当前均一致；两平台注册源均可定位。未运行平台脚本，因此不声称 PowerShell 行为已验证。
- 临时 Markdown 使用仓库内的虚拟文件名经 ESLint stdin 预计算格式后写回；直接对 `/tmp` 路径执行 ESLint --fix 会报告 outside of base path，不能将该退出 0 当成实际 lint。另以 stdin 重新检查格式固定点、错误和警告；正式基线文档按章程直接执行 `pnpm exec eslint --fix`。
- 首次扩大扫描到原样复制的旧 SKILL.md 时，explainer-doc-sync 的源/副本在第 41 行各有既存 slop/no-em-dash 错误。保留旧安装字节以供退役识别，不修改样例中的旧技能；最终格式验收仅针对本步新建或格式化的 6 个 Markdown，均零错误、零警告。此既存问题不代表 T001 新产物失败，也不计为旧技能已通过 lint。
- 最终只读断言使用 Node 内置 assert、crypto、现有 YAML 解析器与 ESLint API，退出 0：43 个基线文件及 16 个临时样例文件 hash 全部匹配；5 个 MVU 条目字段一致；Implement 匹配安装 manifest；两组技能源/副本一致；两个父任务身份独立、共用知识引用、学习仍 pending 且无执行证据；6 个新建或格式化的临时 Markdown 检查通过。断言为本次临时验收命令，不新增包内测试或运行时 helper。
- 忽略配置只读核对：node_modules、dist、coverage 被当前 ESLint 预设忽略；build 未被忽略，但 skills 包实际使用 Vite 的 dist 输出，本步无 build 输出，不为未使用路径扩展配置。包发布采用 files:[dist] 白名单，T001 不发布、不额外创建 npmignore。
- 本步仅准备文档、hash 与隔离数据，无 TS/JS/Vue 或脚本源码变更，不运行 package lint/check-types/build，也不运行尚未创建的测试。
- MVU-A/B/C/D 均未验收；T002 和全部下游尚未开始。后续受保护文件发生变化须重新调查，不用本次快照覆盖现状。
