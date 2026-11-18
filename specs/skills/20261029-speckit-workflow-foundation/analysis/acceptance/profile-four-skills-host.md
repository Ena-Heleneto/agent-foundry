# T119：最小宿主交接的实际证据

整理日期：2026-11-19。依据 [T119 方案](../../implementation/T119.md)及用户“先开始第一步”的实际认可。本次仅完成第一步的有限独立落盘验证，T119 整体保持未完成；三轮摘要、分析及画像交接尚未运行。隔离样本由宿主按当时可知日期保存为 2026-11-18，保留原文，不用整理日期改写样本。

## 实际结果与来源

新建唯一候选 `packages/skills/src/profile/conversation-recording/SKILL.md`，沿现有复制脚本精确复制到自有临时普通 Git 项目。源码仍只有这一项新增 Skill；旧 shadow-profile 正文及本工作区安装副本未改，collection.config.ts 未接入候选。主线构建插件和其他会话源码不在本次修改范围。

真实宿主为 Linux 本机 `codex-cli 0.170.0`，使用正常配置和默认模型、workspace-write 及 approval_policy=never。既有 `codex exec --json` 首次进入，普通追问按本次确切会话 ID resume；没有代理模型替身、日志监听器、Spec Kit 或 AGENTS/CLAUDE 画像路由。项目仅有一个 conversation-recording 副本，完整目录比较退出 0。

候选 v1 SHA-256 为 `4c0db0171e633ab3951c6b8f7027fbbcaf7f93f7f0824b8b0fb55d8542b07c37`；修复后的 v2 为 `329123de86fd98850f2f451b204fdbc92fa738f92d689c70afd7a2d7069b01ab`。旧 shadow-profile 的保护副本与现有源逐字一致，SHA-256 为 `d9fe13c9d53f23230ac1063f513d38cab67e7109cd7e042d5e1b44cfb40c3cc4`。来源、复制输出及最终检查见[结构化核对](fixtures/t119/step1-proof.json)、[初次复制](fixtures/t119/copy.receipt.json)和[修复后复制](fixtures/t119/copy-v2.receipt.json)。

## 对照、入口和普通追问

| 运行 | 实际输入与结果 | 证据及范围 |
| --- | --- | --- |
| 无候选普通问答 | “闭包是什么，用一句话解释。”；正常回答，项目中无文件保存 | [收据](fixtures/t119/baseline-ordinary.receipt.json)、[事件](fixtures/t119/baseline-ordinary.jsonl)。只证明该普通输入的默认对照，不证明所有请求都不会主动保存 |
| v1 自然入口 | “请把这个项目接下来的聊天保存下来，方便之后回查。”；自然识别并全文读取复制后的 Skill，主 AI 创建控制说明及原文 M01～M02，写后读回 | [收据](fixtures/t119/recording-natural.receipt.json)、[事件](fixtures/t119/recording-natural.jsonl)、[首次原文](fixtures/t119/snapshots/recording-natural/docs/user-shadow/conversations/raw/2026-11-18.md) |
| v1 显式入口 | 显式点名 conversation-recording；加载和落盘实际发生，但宿主附加的 Skill 正文被误记作用户发言，判为失败 | [收据](fixtures/t119/recording-explicit.receipt.json)、[失败事件](fixtures/t119/recording-explicit.jsonl)、[失败原文](fixtures/t119/snapshots/recording-explicit/docs/user-shadow/conversations/raw/2026-11-18.md)，不改写为通过 |
| v2 普通追问 | 重复制最新候选后，原自然入口会话仅输入与对照相同的闭包问题，不点名 Skill；实际重新读取 v2 和控制说明，补存上一轮真实 final 为 M03，新问题和过程说明为 M04～M05 | [收据](fixtures/t119/recording-followup.receipt.json)、[事件](fixtures/t119/recording-followup.jsonl)、[追问后原文](fixtures/t119/snapshots/recording-followup/docs/user-shadow/conversations/raw/2026-11-18.md) |
| v2 全新显式入口 | 新建另一个隔离项目，发送与失败用例相同的显式短请求；全文读取 v2，仅保存用户请求及已发出助手过程说明 M01～M02，不再夹带自动附加 Skill 正文 | [收据](fixtures/t119/recording-explicit-fixed.receipt.json)、[事件](fixtures/t119/recording-explicit-fixed.jsonl)、[修复后原文](fixtures/t119/snapshots/recording-explicit-fixed/docs/user-shadow/conversations/raw/2026-11-18.md) |

五次 CLI 运行均实际退出 0、无超时；退出码不代替内容验收，首轮显式入口仍按原文污染判失败。读取/创建原文前的 rg 查找无匹配出现退出 1，是空项目查找结果，不是写入或读回成功证据。各收据保存实际输入、命令、确切会话、用时及错误观察，不以用时样本建立性能承诺。

## 首次失败与单项修复

v1 将“控件封装”排除，但没有明确区分宿主显式调用时自动注入的 Skill 正文与人实际输入。失败用例只有一条短请求，原文 M02 却包含完整候选正文。根因是按消息 user 角色认定用户发言，遗漏真实发言来源判断。

只补充这一边界：自动附加的技能正文和执行提示属于运行上下文，即使带 user 角色也不计作用户原话；用户确实手工粘贴正文讨论时仍保留。然后重新验证元数据、精确复制，并在全新项目重复原显式输入。v2 不再记录自动正文，原失败、v1/v2 内容及相应快照均保留。手工粘贴的正向边界及完整长文/复杂空白矩阵尚未在本步骤实际验证。

## 核验内容及限制

主代理独立读取所有落盘结果，逐条核对可见正文、角色、顺序与未复用锚点。自然会话原文为 M01～M05，修复后显式会话为 M01～M02；围栏分隔和 CLI 消息末尾结构换行不计为可见正文字符，内部段落及正文内容按实际字符串核对。该比较范围见 step1-proof.json，不扩大为任意字节、复杂空白或所有输入均通过。

各成功入口都有完整 Skill 工具输出；自然入口首次用 v1，更新后的普通追问和新显式入口实际全文读取 v2。源与两个最终副本目录/字节一致。读回发生在对应最终答复前；上一轮真实 final 已在普通追问补存，本轮 final 没有预写，末轮未存缺口可查。保存行为由主 AI 的实际文件工具完成，不要求宿主日志、特定版本或常驻记录程序。

项目内只生成控制说明和原文，没有摘要、conclusions、profile.md、.specify 或项目代理路由。这证明本机限定样本中，独立落盘无需其余三个 Skill。控制说明首次创建/读取有实际证据，但暂停、跨重启恢复、保存故障及多人并发仍未在本步骤验证，不据文件存在认定完整启停通过。

本次使用临时命令驱动调用真实 CLI 并保存可见消息/执行事件，排除 reasoning/analysis 事件；它不参与项目对话记录，也未放入技能或正式分发。归档内容仅为合成测试的候选、复制收据、过滤后事件及项目快照，不含机器配置、认证文件、其他会话或真实私人资料。

## 工程检查与续接

v1/v2 均通过 skill-creator 的 quick_validate；使用 uv 的隔离 PyYAML 工具依赖，不修改项目依赖。新增 Markdown 实际执行 pnpm exec eslint --fix，候选和 specs 被仓库现有规则忽略，不能计作内容 lint 通过；另核对结构、链接、JSON/JSONL、复制字节与运行产物。122 个原 Task ID/checkbox 保持；T119 后续步骤仍需当前范围以外的明确推进。

最终检查中，9 份候选/材料的 GFM 结构解析、30 处方案/新增证据相对引用、归档 JSON/JSONL、候选与最终副本散列及 git diff --check 均通过。第一次将被忽略的夹具目录直接传给 ESLint，命令退出 2；按提示改为 25 个明确文件后退出 0，但 25 项仍全部按既有规则忽略，不记作实际 lint 通过，未修改检查规则。原 shadow-profile、集合及已知工作区安装副本的保护散列保持；未安装新候选到当前工作区。

临时现场保留于各收据中的路径，归档入口为 fixtures/t119/，后续从现有候选和真实证据续接，不重跑已通过步骤充数。仅第一步通过，不勾选 T119，也不自动启动 T115 或方案第二步的三轮摘要。构建、正式安装、真实工作区启用、四源完整行为和本人应用分别由原任务继续验收。
