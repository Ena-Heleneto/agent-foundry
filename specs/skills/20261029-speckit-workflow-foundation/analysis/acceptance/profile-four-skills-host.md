# T119：最小宿主交接的实际证据

> **结案状态：异常终止（2026-11-19）**。依据用户本轮决定，本 Spec 及全部未完成 Task 终止推进。已完成事实、验收证据与历史记录保留；正文中的旧待办、下一步和恢复安排不再作为执行授权。详见[异常终止结案记录](revision-summary.md)。

当前进展（2026-11-19）：第一步限定记录验证、第二步记录与摘要交接、第三步三源在途分析及[第四步摘要真实保存失败后的独立分析与恢复](#2026-11-19-第四步摘要实际保存失败时的独立分析)已有实证。各步保留发生时范围与失败；T119 整体仍未完成。

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

## 2026-11-19 第二步：记录与摘要真实交接

### 授权、候选与对照

本轮用户在获知新增摘要候选、精确复制及真实三轮交接安排后回复“开始吧”，适用范围见[原方案追加认可](../../implementation/T119.md#2026-11-19-第二步的实际认可)。本次仅执行该方案第二步，未进入第三至第五步、其他 Task 或真实工作区安装。

先把第一步最终记录来源精确复制到新的普通 Git 项目，以“请把这个项目接下来的聊天原文和每轮摘要保存下来，方便之后回查。闭包是什么，用一句话解释。”作为合成输入。主 AI 全文读取记录 Skill，随后自己写入原文及 `conversations/summaries/2026-11-19.md`，没有摘要子代理，违背当前职责划分；保留[失败对照收据](fixtures/t119/step2/baseline-summary.receipt.json)、[实际事件](fixtures/t119/step2/baseline-summary.jsonl)及[原摘要](fixtures/t119/step2/snapshots/baseline/docs/user-shadow/conversations/summaries/2026-11-19.md)。没有摘要候选的原对照不具备正式交接能力，退出 0 不计通过。

据此新增自包含 `conversation-summary/SKILL.md`，并在记录 Skill 明确条件交接：只有已启用摘要且新增原文读回成功时，加载摘要 Skill 并实际派发子代理，由其亲自保存，主 AI 核验文件；摘要入口缺失时记录继续，摘要保留未完成。完整来源快照见 [记录来源](fixtures/t119/step2/sources/conversation-recording/SKILL.md)与[摘要来源](fixtures/t119/step2/sources/conversation-summary/SKILL.md)。两份 Skill 均通过 skill-creator 的 quick_validate，正文/目录及必要文件集合已核对；沿现有 link-skills.sh 复制，[复制收据](fixtures/t119/step2/pair-copy.receipt.json)记录完整两项目录与字节一致。

### 同一真实宿主的启用及三轮

使用 Linux 本机 `codex-cli 0.170.0`、正常配置和默认模型，候选主会话与摘要子代理实际为 `gpt-6.1-sol`；未修改模型或机器配置。每次 CLI 使用 `codex exec --json -c sandbox_mode="workspace-write" -c approval_policy="never"`；首次附 `-C <隔离项目> -`，后续附 `resume <本次确切会话 ID> -`，合成输入经 stdin 传入。项目只复制记录与摘要两个 Skill，没有 `.specify`、AGENTS/CLAUDE 路由、分析或画像产物。

主会话身份为 `01a1f197-28f9-7481-b949-c39383b9079f`。首次真实派发摘要子代理 `01a1f197-de94-7b22-99f4-b69ef3afe851`，之后三轮通过真实 followup_task 续接同一执行者，每次均重新完整读取摘要 Skill 和确认原文，再更新摘要并读回；各轮完成后主 AI 只读核验，不竞争写摘要。目标文件始终单写入者。

| 轮次与合成输入 | 实际结果 | 收据及项目快照 |
| --- | --- | --- |
| 启用：与失败对照相同的自然请求 | 主 AI 加载两份 Skill，保存并读回 M01–M02；首次派发子代理，后者保存并读回 R01，主 AI 核验 | [收据](fixtures/t119/step2/pair-enable.receipt.json)、[摘要](fixtures/t119/step2/snapshots/pair-enable/docs/user-shadow/conversations/2026-11-19.md) |
| 普通第 1 轮：“闭包是什么，用一句话解释。” | 加载并补存上一轮真实 final 为 M03，本轮 M04–M05；子代理补齐 R01 并保存 R02，主 AI 核验 | [收据](fixtures/t119/step2/pair-round1.receipt.json)、[摘要](fixtures/t119/step2/snapshots/pair-round1/docs/user-shadow/conversations/2026-11-19.md) |
| 普通第 2 轮：“这个演练项目的说明请先给结论，再讲原因。” | 补存上一轮 final 为 M06，本轮 M07–M08；子代理补齐 R02 并保存 R03，明确偏好仅属于演练项目，主 AI 核验 | [收据](fixtures/t119/step2/pair-round2.receipt.json)、[摘要](fixtures/t119/step2/snapshots/pair-round2/docs/user-shadow/conversations/2026-11-19.md) |
| 普通第 3 轮：“好。” | 补存上一轮 final 为 M09，本轮 M10–M11；子代理补齐 R03 并保存 R04，主 AI 核验，正常最终回复为“好的。” | [收据](fixtures/t119/step2/pair-round3.receipt.json)、[最终原文](fixtures/t119/step2/snapshots/pair-round3/docs/user-shadow/conversations/raw/2026-11-19.md)、[最终摘要](fixtures/t119/step2/snapshots/pair-round3/docs/user-shadow/conversations/2026-11-19.md) |

四次均实际退出 0，没有超时或 stderr 错误。实际用时分别为 85.999、70.607、79.882、75.894 秒，仅记录本次样本，不建立时效承诺。三轮普通追问均未点名 Skill，原文和摘要的身份、覆盖及来源分别留在项目文件；宿主 ID 对执行者不可得时保留原来的本地身份标注，观察者取得真实宿主身份不用于回填或伪造其当时可见信息。

### 派发与内容核验

CLI JSONL 保留了各轮主 AI 的工具及发言；该输出对本机 V2 摘要派发只显示 wait，不能单凭它证明子代理写入。因此观察者按本次已知父会话的确切 ID 定位其宿主轨迹，通过实际 SubAgentActivity 取得上述子会话 ID，仅提取这两个确切会话的完成消息、命令、文件变更和协作事件；不扫描其他会话内容。归档为[父会话工具轨迹](fixtures/t119/step2/host-01a1f197-28f9-7481-b949-c39383b9079f.jsonl)及[摘要子代理工具轨迹](fixtures/t119/step2/host-01a1f197-de94-7b22-99f4-b69ef3afe851.jsonl)，过滤思维、系统/开发者提示、机器配置及加密内部字段。轨迹读取仅用于验收取证，不成为 Skill 运行依赖。

[逐轮核验结果](fixtures/t119/step2/step2-proof.json)记录真实 turn/child 身份和关键 item：每轮父代理先完整读取两份目标副本、原文写后读回，再派发/续接；摘要子代理完整读取目标副本及确认原文，亲自 FileChange 写摘要并读回，随后父代理读取相同摘要核验。父代理的摘要 FileChange 为 0，子代理发言和工具正文没有进入主会话原文。

观察者逐条比较最终 11 条原文与当时可见的用户/主助手正文、角色及顺序，保留已存原文前缀；R01～R04 引用的 11 个 M 锚点逐一存在。比较只排除宿主文本事件末尾单个结构换行及围栏分隔换行，内部正文不归一化；不将有限样本泛化为任意字节/复杂空白矩阵通过。三个上一轮真实 final 分别补存并沿原摘要补缺，没有复制成新轮次；最后一轮 final“好的。”未预写，原文与 R04 保留末轮缺口。

另将最终记录来源单独复制到新的普通项目，再运行相同自然请求。[复制收据](fixtures/t119/step2/recording-only-copy.receipt.json)、[运行收据](fixtures/t119/step2/recording-only-final.receipt.json)及[缺口说明](fixtures/t119/step2/snapshots/recording-only-final/docs/user-shadow/coverage.md)证明缺少摘要入口时，仍保存读回用户及已发助手说明，正常回答闭包问题，并明确摘要暂未完成；没有摘要子代理或摘要产物。该次退出 0、用时 53.237 秒。本对照验证新增交接没有将摘要能力设为记录前置，不抵扣完整故障恢复矩阵。

### 工程检查、审查及边界

独立只读审查核对两份候选、现行交接契约、第二步方案和首轮快照，未发现有依据的 Critical/Important/Minor 问题；审查明确单靠快照不能证明真实派发或三轮持续行为，随后由上述宿主轨迹和逐轮核验补足。审查不读取本人资料或修改文件。

首次仅记录回归的临时核验清单断言遗漏 Skill 允许的 `coverage.md`，实际退出 1；读回发现其只保存缺口和恢复条件，随后核对控制、原文和覆盖说明三文件内容通过，原文/摘要职责断言保持，未修改产品、规则或删除断言。此为验收命令的清单假设修正，不是宿主保存失败。候选元数据检查使用 uv 隔离 PyYAML，无项目依赖变更。所有新增/修改 Markdown 按要求执行 ESLint；仓库现有规则忽略的文件不计内容 lint 通过，另做 GFM 结构、引用、证据格式及复制核对。

最终工程核对：对 28 个明确 Markdown 路径执行 `pnpm exec eslint --fix --format json <文件列表>`，退出 0、错误 0，但 28 项均被既有规则忽略；未修改忽略规则。既有 GFM 解析器核对 28 份 Markdown 及 78 处相对引用，9 份 JSON 与 177 条 JSONL 均可解析，结构/引用错误 0。122 个原 Task ID/checkbox 与 HEAD 相同，三份受保护来源/副本散列及本次两源、隔离副本、归档来源字节相符，`git diff --check` 通过。历史用例保留原文，未将格式命令退出 0 冒认实际内容 lint 通过。

旧 shadow-profile、集合配置及已知工作区安装副本的保护散列保持；当前工作区本人会话文件的既有未提交改动未由本步覆盖，演练资料全部合成且只保留于本 Spec 的用例目录。未运行构建、正式安装或旧 Python 记录器测试，不自动提交、推送或公开。当前仅完成 T119 第二步的限定分支；摘要完整恢复、独立分析、画像、共享提交/遗忘、最终四源复制及本人应用分别留原 Task 验收，所有原工程 checkbox 保持。下一步沿原方案第 3 步验证摘要在途时的独立分析，不用本次成功替代后续方案范围。

## 2026-11-19 第三步：摘要在途时的独立分析

### 范围与真实宿主

用户承接第二步结果及下一步说明回复“继续”，本次沿[原方案第三步认可](../../implementation/T119.md#2026-11-19-第三步的实际认可与执行安排)，只验证摘要真实在途时的独立分析和正常问答。先采用记录、摘要、分析三份维护来源，旧混合 shadow-profile 保持；四源整体与画像自动交接留后续，不以缺少独立画像入口为当前原文到结论验证的前置，也不将三源结果当四源交付。

本机 `codex-cli 0.170.0` 的 `codex app-server --stdio` 原生握手实际成功，见[预检结果](fixtures/t119/step3/host-preflight.json)。临时驱动只使用随该版本生成的本地协议：initialize → initialized → thread/start → turn/start，持续保留同一宿主进程跨轮运行。thread/start 使用隔离 Git 项目的 cwd、approvalPolicy=never、sandbox=workspace-write；正常配置及默认模型实际为 gpt-6.1-sol，未覆盖模型、复制认证或修改机器配置。驱动与协议文件仅在本次临时目录，不进入 Skill、正式分发或项目运行流程。

原文及实际读回、子代理启动/续接、等待、文件变更、读回与正常答复，分别由原生通知和本次确切会话的工具轨迹取证。归档只提取完成消息、命令/文件变更、协作活动、调用名称及 list_agents 的实际状态，排除思维、系统/开发者消息、配置和内部消息密文；不扫描其他会话内容。原生输入和通知见[无分析入口对照](fixtures/t119/step3/baseline-rpc.jsonl)及[候选运行](fixtures/t119/step3/candidate-rpc.jsonl)。

### 无分析入口的对照

新的普通项目仅精确复制上轮记录、摘要来源。首轮合成输入启用项目内原文、摘要和条件分析，并附一次性调度控制：摘要子代理全文加载、读取确认原文后发送就绪消息，再用宿主 wait_agent 等待后续明确“放行摘要”；主 AI 不提前放行，正常回答。该控制只延后摘要，不给偏好类别或预期结论。

主 AI 实际报告未找到条件分析入口，原文继续保存；真实摘要子代理发送就绪消息并进入等待，首轮主 AI 完成后宿主保持运行、摘要仍未写。第二轮自然输入“这个演练项目的说明请先给结论，再讲原因。顺便用一句话解释 JavaScript 的闭包。”后正常回答，摘要继续在途，分析文件及执行者均无，见[在途快照](fixtures/t119/step3/snapshots/baseline-before-release/docs/user-shadow/conversations/raw/2026-11-19.md)及[对照结果](fixtures/t119/step3/baseline-result.json)。随后明确放行，原执行者保存并读回摘要，主 AI 核验。本对照只证明缺项与可保持的真实等待，不算独立分析通过。

两组首轮对未注明语言的“闭包”都误答成工作流程说明，保留为未通过的问答样本，未据首轮正常结束认定概念解释正确。本次正常问答及协作核验使用后续明确的 JavaScript 问题与实际回答，不修改原始输入或输出求通过。

### 候选、首次缺陷及修正

新增自包含 conversation-analysis，并在记录来源中按语义触发独立派发。分析子代理必须直接读取确认原文，自己写结论并读回；摘要和结论分文件、分执行者，覆盖由主 AI 维护。最小候选不自动重试，不宣称完整有限重试、画像或共享提交已交付。v1 原文保留于[来源快照](fixtures/t119/step3/sources-v1/conversation-analysis/SKILL.md)，最终 v2 为[分析来源](fixtures/t119/step3/sources-v2/conversation-analysis/SKILL.md)及[记录来源](fixtures/t119/step3/sources-v2/conversation-recording/SKILL.md)，[复制收据](fixtures/t119/step3/candidate-v2-copy.json)核对目录与字节；摘要来源保持上轮字节。

候选父会话为 `01a1f1aa-f18f-79e3-a385-a16924cbf21e`，摘要执行者 `01a1f1ab-f626-73a0-b06b-befb71da603c`，分析执行者 `01a1f1ac-1f77-7a80-80b6-535b8ad30d03`。首轮主 AI 自行将项目启用范围及一次性控制识别为有限项目认识，实际派发分析并保存 E01/E02；没有手工指定分类，结论明确演练情境及非永久偏好。观察者确认摘要真实读取、发送消息、调用等待且未完成，摘要文件未写。

后续自然偏好触发实际分析，子代理保存 E03，摘要依然在途；但 v1 主 AI 调用了一次 wait_agent，等分析完成后才回答普通 JavaScript 问题。该段独立分析成功，但正常答复仍被分析结果阻塞，保留[首次结果](fixtures/t119/step3/candidate-v1-result.json)及[当时结论](fixtures/t119/step3/snapshots/candidate-v1-before-release/docs/user-shadow/conclusions/2026-11-19.md)。根因是“派发后继续”没有明确当前问答不依赖分析结果时的先后；只补充该条件：先完成正常答复，不用等待工具、循环检查或延迟 final 等分析，结果后续可见时再核验。未删失败、模拟就绪或重建候选骨架。

### 修正版真实复验与放行

沿既有脚本重新复制两份变化来源，保持同一真实宿主、资料根及仍在等待的摘要。下一条自然输入为“这个演练项目的说明改成先给例子，再下定义。顺便用一句话解释 JavaScript 的闭包。”；其正文没有预期分析标签或结论。

| 观测点 | 实际结果 |
| --- | --- |
| 读回与独立交接 | 主 AI 补存先前 final、保存并读回本轮 M08 更正及 M09 说明，再续接原独立分析执行者；向摘要执行者只交付新范围，不放行或增建竞争写入者 |
| 普通问答继续 | 主 AI 等待调用 0；以计数器例子解释 JavaScript 闭包并当下应用新顺序，final 完成于 1795056325091 毫秒；分析最终返回为 1795056337099 毫秒，实际相差 12008 毫秒 |
| 分析保存 | 子代理重新全文加载 v2 Skill、直接读取已确认原文，亲自追加并读回 E04，引用 M08、更正 E03 的适用性，原依据保留；主 AI 未代写结论 |
| 摘要仍在途 | 上述分析保存与普通答复完成时，摘要执行者仍在同一任务中等待，所有摘要写入均尚未发生；[放行前快照](fixtures/t119/step3/snapshots/candidate-v2-before-release/docs/user-shadow/conclusions/2026-11-19.md)与[时序结果](fixtures/t119/step3/candidate-v2-before-release.json)可核验 |
| 明确放行 | 随后新的真实输入明确“放行摘要”，主 AI 交给原执行者，后者补齐保存并读回 R01～R04、覆盖 M01～M12，主 AI 再读文件及全部引用核验；所有摘要 FileChange 均晚于该放行输入 |

[最终原文](fixtures/t119/step3/snapshots/candidate-released/docs/user-shadow/conversations/raw/2026-11-19.md)、[最终摘要](fixtures/t119/step3/snapshots/candidate-released/docs/user-shadow/conversations/2026-11-19.md)、[分析结论](fixtures/t119/step3/snapshots/candidate-released/docs/user-shadow/conclusions/2026-11-19.md)及[覆盖说明](fixtures/t119/step3/snapshots/candidate-released/docs/user-shadow/coverage.md)分别保留实际范围：原文、摘要 M01～M12，分析 E01～E04 仅覆盖 M01～M09，M10～M12 未分析，最后 final 未预存。没有画像文件，不将演练结论写入真实本人画像。

[逐项核验](fixtures/t119/step3/step3-proof.json)对照四段快照与本次父会话真实消息：原文正文、角色、顺序及旧前缀一致，当前 final 不预写；仅排除宿主事件末尾单个结构换行，不归一化内部正文。分析三次真实写结论均早于摘要首次提交，最终来源由分析者重新全文读取；主 AI 不写摘要或结论，两个执行者仅写各自文件，覆盖由主 AI 维护。真实身份、开始/完成、等待及文件操作见[父会话](fixtures/t119/step3/host-01a1f1aa-f18f-79e3-a385-a16924cbf21e.jsonl)、[摘要执行者](fixtures/t119/step3/host-01a1f1ab-f626-73a0-b06b-befb71da603c.jsonl)、[分析执行者](fixtures/t119/step3/host-01a1f1ac-1f77-7a80-80b6-535b8ad30d03.jsonl)。两组任务均实际完成后，验收驱动以 SIGTERM 停止各自宿主进程，未让等待任务留在后台继续运行；不将该进程退出冒认业务轮次退出 0。

### 检查与未验范围

两份变化来源通过 skill-creator quick_validate；独立只读审查及针对不等待条件的追加审查未发现文字职责冲突，均明确真实行为仍须工具轨迹证明。旧影子画像、集合、工作区安装副本及摘要来源四个保护散列保持；已有本人会话未提交文件未由本步覆盖。所有新资料限合成演练，旧失败、上轮来源和快照保持。Markdown 按要求执行 ESLint，既有忽略规则不作为内容 lint 通过，结构/引用及证据格式另核对，不更改规则求绿。

最终工程核对：对 44 个明确 Markdown 路径执行 `pnpm exec eslint --fix --format json <文件列表>`，退出 0、错误 0，但全部被现有规则忽略。既有 GFM 解析器核对 44 份 Markdown、169 处相对引用，12 份 JSON 及 667 条 JSONL 可解析，错误 0。三份最终来源与隔离副本、归档字节一致；四项保护散列、122 个原 Task ID/checkbox 及 `git diff --check` 核对通过。末次 git status 另出现 workflow/collection.config.ts 和 utils/define-collection-handle.ts 的工作区改动，本轮没有写入这两处，保留其现状，不接管相应构建工作或把其检查算作本轮通过。

当前仅完成第三步的三源在途分析分支，包含等待缺陷的真实修正复验。第四步摘要实际失败、第五步画像交接及反例、四个独立来源整体复制、完整重试/共享提交/根替换/遗忘和本人应用均未验，原 Task ID/checkbox 保持，T119 整体未完成。未运行构建、正式安装、旧事件记录器测试或发布；下一步沿原方案第四步验证摘要真实写失败时分析仍能独立启动。

## 2026-11-19 第四步：摘要实际保存失败时的独立分析

### 来源、授权与故障现场

第三步答复说明下一步验证摘要真实保存失败时的独立分析，用户回复“开始把”，按上下文承接该请求；范围保存于[原方案](../../implementation/T119.md#2026-11-19-第四步的实际认可与执行安排)。本轮只执行第四步，未进入画像或其他 Task。三份维护来源与第三步最终版本一致，本次未修改 Skill、集合、构建或真实工作区副本，沿既有 link-skills.sh 精确复制到新的独占普通 Git 项目，见[来源及复制收据](fixtures/t119/step4/setup.json)。

宿主仍为本机 codex-cli 0.170.0，通过原生 `codex app-server --stdio` 保持同一会话跨轮运行，正常配置及默认 gpt-6.1-sol，approvalPolicy=never、sandbox=workspace-write。父会话 `01a1f1c0-26b8-74b1-ac37-83ac9705284a`，摘要执行者 `01a1f1c1-aa95-75c1-bbbd-90d225a00e6f`，分析执行者 `01a1f1c1-c9c7-71a3-b36b-4ceba8d3418c`。隔离项目只含记录、摘要和分析三项，不含 Spec Kit 或 AGENTS/CLAUDE 路由，不以旧混合画像充当第四个独立入口。

观察者在约定摘要 `docs/user-shadow/conversations/2026-11-19.md` 的同名位置创建自有空目录，记录文件系统身份，不改变原文和分析路径。首轮合成输入启用三项、要求说明先给结论再讲原因，并询问 JavaScript 闭包；另要求摘要子代理实际保存一次、分别留下预检和真实返回，保留已有路径类型及内容，不删除、移动、更名或换路径规避故障。该一次性约束只控制用例中的写入尝试，不给分析类别或预期结论，也不作为产品的默认重试政策。

### 真实失败及未恢复时的分析

摘要子代理完整加载目标副本、读取已确认原文，在普通文件工具中实际执行 `returned = target.write_text(summary_text, encoding='utf-8')`。异常由真实调用捕获，返回 IsADirectoryError、errno 21，累计保存尝试 1 次；不是以目录检查或自述替代保存。子代理分别保存并读回[写前检查](fixtures/t119/step4/snapshots/failed/docs/user-shadow/evidence/summary-2026-11-19-precheck.json)及[真实失败返回](fixtures/t119/step4/snapshots/failed/docs/user-shadow/evidence/summary-2026-11-19-save-result.json)，执行命令因捕获异常退出 0，不能据此将摘要保存判为成功。目标仍是原空目录，没有摘要文件或可读回摘要。

主 AI 在首轮可见答复中明确原文、分析已保存，摘要未保存，说明目录冲突及证据入口，正常解释 JavaScript 闭包。首轮分析者独立保存 E01（项目说明顺序）和 E02（项目启用及资料边界），没有依赖摘要。待真实失败返回及两执行者完成，再输入“更正一下：这个演练项目的说明改为先给例子，再下定义。顺便用一句话解释 JavaScript 的闭包。”。

第二轮主 AI 实际保存并读回 M05 更正、M06 说明，再续接原分析执行者。后者重读自己的 Skill、直接读取已确认原文，在目录障碍仍未移除时保存并读回 E03，更正 E01 的适用性并保留旧依据。普通更正轮主 AI 的 wait_agent 调用为 0，实际以计数器例子再给出定义，当前更正立即用于答复；同时说明摘要仍未保存。摘要执行者重新核对新增范围与旧失败，本轮仅有读取失败、保存尝试 0，累计真实保存仍为首轮的 1 次，没有把读取失败混算成第二次保存。

| 真实观测点 | 宿主或观察时点（Unix 毫秒） |
| --- | --- |
| 首轮实际保存失败返回 | 1795057409245 |
| 自然更正后实际续接独立分析 | 1795057534330 |
| 更正结论 E03 实际写入完成 | 1795057556209 |
| 核对身份及空目录后由观察者移除本次障碍 | 1795057637921 |

[失败观察](fixtures/t119/step4/failed-observation.json)、[恢复前原文](fixtures/t119/step4/snapshots/before-recovery/docs/user-shadow/conversations/raw/2026-11-19.md)和[更正结论](fixtures/t119/step4/snapshots/before-recovery/docs/user-shadow/conclusions/2026-11-19.md)证明更正的触发、分析派发及保存均先于障碍恢复。用例没有手工传入更正类别或预先写结论，也没有以“摘要任务已启动”冒认实际失败。

### 原来源恢复与结果核对

待两执行者完成后，观察者实际核对目录设备号、inode 与创建时相同且仍为空，只对本次空目录执行 rmdir，见[移除收据](fixtures/t119/step4/recovery-obstacle.json)。空目录的类型、身份和内容以收据保存，不通过向目录加入占位文件改变故障现场。随后同一宿主的第三轮输入明确说明障碍已移除、一次性故障尝试约束结束，要求原摘要执行者补齐，并保留旧故障证据和核对分析。

原摘要子代理重新完整加载来源并读取原文、旧证据和当前目标状态，以排他创建方式实际保存 1714 个字符，再在同一真实命令内读回并断言内容一致，核对 9 个原文锚点及 2 个证据链接；不是主 AI 转存回复。主 AI 随后实际读文件核验：[R01](fixtures/t119/step4/snapshots/recovered/docs/user-shadow/conversations/2026-11-19.md#r01) 覆盖 M01～M04，[R02](fixtures/t119/step4/snapshots/recovered/docs/user-shadow/conversations/2026-11-19.md#r02) 覆盖 M05～M07，[R03](fixtures/t119/step4/snapshots/recovered/docs/user-shadow/conversations/2026-11-19.md#r03) 覆盖 M08～M09。旧失败被按发生时保留，摘要区分计划、已经发生的工具结果和未覆盖的 final。

分析执行者在恢复轮实际复核读取 M01～M09 及 E01～E03，判断恢复授权及助手回复没有新的偏好认识，未新增或改写结论。三条[既有结论](fixtures/t119/step4/snapshots/recovered/docs/user-shadow/conclusions/2026-11-19.md)与恢复前字节相同；直接用户依据为 M01 和 M05，当前有效顺序为先例子再定义。两份原故障 JSON 的字节也保持。主 AI 的[覆盖说明](fixtures/t119/step4/snapshots/recovered/docs/user-shadow/coverage.md)区分结论直接依据与本次复核实际读取范围，最终原文和摘要覆盖 9 条已确认发言；末轮 final 未预存，未生成画像。

[逐项核验结果](fixtures/t119/step4/step4-proof.json)逐条比较三段快照与真实父会话：正文、角色、顺序和旧前缀保持，末轮不预写；仅排除宿主文本事件末尾单个结构换行，不归一化内部内容。核对真实写入失败的调用代码和返回、原文读回先于分析派发、子代理实际读源/原文/保存/读回、分析先于恢复、原摘要执行者恢复保存、主 AI 核验，以及结论和故障证据保留。原始输入与通知见[宿主交互](fixtures/t119/step4/failure-rpc.jsonl)，工具轨迹见[父会话](fixtures/t119/step4/host-01a1f1c0-26b8-74b1-ac37-83ac9705284a.jsonl)、[摘要执行者](fixtures/t119/step4/host-01a1f1c1-aa95-75c1-bbbd-90d225a00e6f.jsonl)、[分析执行者](fixtures/t119/step4/host-01a1f1c1-c9c7-71a3-b36b-4ceba8d3418c.jsonl)。仅归档这些确切会话的可见工具/消息、协作及生命周期事实，过滤思维、系统/开发者提示、机器配置和内部消息密文，不将工具原文混入项目聊天原文。实际任务全部完成后由驱动以 SIGTERM 停止宿主，没有遗留运行任务。

### 检查及剩余范围

三份维护来源与第三步最终版本、隔离副本及本次归档相同；本轮只增加验收资料和更新原导航，没有新增或修改 Skill、运行脚本、工程依赖或项目治理。已知旧画像、集合及工作区安装副本保持，其他工作线与本人未提交文件未由本步覆盖。只核验当前合成用例，不以它完成完整摘要/分析恢复矩阵、自动重试、共享提交、根替换或遗忘。

最终工程核对：对 22 个明确 Markdown 文件执行 `pnpm exec eslint --fix --format json <文件列表>`，退出 0、错误 0，但 22 项全部被既有规则忽略，未修改规则、不计内容 lint 通过。既有 GFM 解析器核对 22 份 Markdown 和 142 处相对引用，11 份 JSON 与 287 条 JSONL 均可解析，错误 0；故障空目录未作为 Markdown 文件交给检查。三源及副本/归档字节、三项保护散列、122 个原 Task ID/checkbox 和 `git diff --check` 核对通过。源码同版的既有元数据结果沿第三步复用，未运行旧事件记录器或无关构建/类型检查冒认新路线通过。

本次第四步的三源故障分支通过，T119 第五步画像自动交接及反例、四源整体消费和其他原 Task 仍未完成；原 Task ID/checkbox 保持。未运行构建、正式安装、旧事件记录器测试或发布。下一步沿原方案第五步收敛独立画像入口，验证有效结论自动交接及不应更新的对照。
