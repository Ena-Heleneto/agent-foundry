# 验证指南：构建、流水线与技能发布共同交付

## 2026-11-16 当前验证入口：技能安装与可选隐匿

先读[当前curl契约](contracts/curl-delivery.md)、[模型](data-model.md)和[本轮研究](research.md)。本节替代下文冲突的旧三目录、官方主线入口、Git下载根及旧源码路径用法；紧急版既有验收指南继续按自身范围。所有安装操作只在自有临时消费项目执行，不在当前用户项目试装；真实R2需要另有地址和授权。Plan与Tasks已保存；下列新业务验证步骤仍须按实际证据执行，不能从文档存在推断已运行。

### 前提与工程检查

当前源码已有技能复制、隐匿Bash生成、原字节入口及两个独立归档；仍缺正式发布白名单/清单、安全解包、完整选择、辅助包下载调用和阶段报告。先复用hidden-install.template.ts及现有插件，不恢复旧.sh源或重复实现归档。局部构建不代表现在就能完成真实安装；原Task准备及完整接口验收保持。构建准备遵守根AGENTS，使用pnpm 12和适用Node；初始化用pnpm install，本轮文档同步未执行初始化。归档验证基线为GNU tar/gzip，其他构建平台另证。

在仓库根运行以下真实已有入口，记录失败、缺前置和未执行，不能删旧测试断言求绿：

```bash
pnpm --filter @foundry/skills run lint
pnpm --filter @foundry/skills run check-types
pnpm --filter @foundry/skills run build
pnpm --filter @foundry/skills run test
pnpm --filter @foundry/skills run test:distribution
```

本轮文档检查单独运行`pnpm exec eslint --fix --no-ignore <本次Markdown路径>`。没有根pnpm test；当前旧分发测试可能引用已移动或归档模块，按实际结果定位有效性，不把测试入口存在算作已通过。`build:candidate`属于紧急严格候选，不能替代主线新设计的验证。

### 构建材料与本次归档核验

执行包build后，检查 `dist/skill/skill.tar.gz` 与 `dist/curl/scripts.tar.gz`，包内根分别为 `skill/`、`script/`。在临时目录解开，逐文件比对路径与字节和本次被归档目录100%一致；技能目录比对排除归档自身，辅助包不得混入install.sh。入口与install.source.sh按原字节比较。每次按本次真实归档计算摘要，不要求两次构建的压缩包哈希相同；再次构建仍须排除旧技能包，构建结束dist根不残留中间skill.tar.gz。

局部输出可先用以下命令检查；正式manifest、版本及公开白名单仍须按原任务补齐，不把目录列表代替全集/字节核验：

```bash
tar -tzf packages/skills/dist/skill/skill.tar.gz
tar -tzf packages/skills/dist/curl/scripts.tar.gz
cmp packages/skills/build/plugins/vite-plugin-curl/install.source.sh packages/skills/dist/curl/install.sh
```

完整验收仍须用缺模板、错误占位符、重名安装目录、符号链接和危险输出根作反例；危险输入清理前失败，write=false零目录/归档新增。当前技能包按启用清单归档，正式公开归档还须按获准清单过滤eval及内部材料，不能直接发布现有全量包。验证所有当前产物版本等于package.json.version，scripts.version等于对应技能version；仅改脚本也须新整体版本，拒绝旧版helper混入新版技能。清理dist不得丢失持久发布记录，单纯build不增加发布成功记录；发布重试复用选定冻结包，不通过重建覆盖同版远端对象。

### 安装与隐匿场景

准备具有两版技能、各自同版helper和一个较新入口的本地发布夹具；夹具保留HTTPS及摘要/成员核验链路，网络替身只替换传输，不跳过验证。每个场景使用独立HOME及项目，明确列出替身覆盖边界；真实R2另行验证，不把本地夹具记为远端通过。

实现契约参数后，已核验的本地入口按以下形式在自有消费目录执行；版本和技能必须来自本次真实夹具，示例变量须先赋值，不是公开可运行命令：

```bash
bash "$VERIFIED_INSTALL" "$SKILL_VERSION" --agent codex --skill "$SKILL_NAME" --no-mount --hidden
```

| 场景输入                                     | 必须观察的结果                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| 两版技能，各有同版helper，均调用最新入口     | 各取所选技能及固定helper，不热切换；入口/技能/helper版本和摘要可追溯   |
| 无版本、显式旧版本、空表、未知或重复版本     | latest只取首条，显式唯一；非法输入零技能提交，不回退其他版本           |
| 整包、分类、单技能、多技能及重复选择         | 选择恰当、去重、附件完整；eval拒绝，缺依赖要求显式补选                 |
| 默认关闭hidden，helper不可用                 | 技能独立安装；hidden脚本执行0，Git排除零写入                           |
| 开启hidden，仅helper下载失败或摘要不符       | 技能仍完整安装，hidden失败、overall部分失败、非零退出，未核验脚本执行0 |
| helper错版本、未知接口、缺脚本或非法成员     | 不执行、不给另一个包、不回退入口；结果区分安装与辅助失败               |
| 技能归档摘要错、附件缺失、非法成员           | 技能不进入提交，不因hidden容错放宽技能完整性                           |
| 已存在用户同名、另一版本、修改或已跟踪内容   | 保留原内容，报告冲突；部分成功仅将完整成功项交给hidden                 |
| 普通Git仓库，模板含多技能而只安装部分        | 排除仅对应本次成功集合；未选/失败/历史内容不误隐藏                     |
| 无.git、父仓库子目录、.git文件、项目外global | 明确跳过或覆盖限制；不改父仓库、全局配置或共享文件                     |
| 规则权限失败、反向规则、特殊路径、重复安装   | 保留原规则和成功技能，核对实际效果，重复无新增规则，失败不误报成功     |

每次保留逐技能文件对照、入口/包身份、stdout/stderr、退出码及阶段结果；Git效果用目标项目的`git check-ignore -v`、`git ls-files`及`git status --short`联合核验。新场景纳入原安装/隐匿测试骨架，具体测试文件与新增命令由Tasks/原Task详细方案确定，本指南不伪造尚不存在的测试入口。

### 后置验收与恢复

修复失败材料后使用同一技能版本和固定关联重试，重新核对真实文件；内容相同复用与冲突保护按原要求，不能强制覆盖用户修改。原Node入口、PowerShell、其他agent/global、真实挂载及旧入口迁移保留交付目标，未实际覆盖的组合逐项列未验证。本轮不恢复其实施，也不删除旧验收。

真实发布另在迁后公开仓库具备授权与真实R2前提后，只上传冻结对象、远端比对全部字节，同次技能/curl记录的版本与源码身份一致，所有固定对象核验成功后才登记完整发布并更新发现材料；模拟环境不抵扣独立使用者、完整矩阵或最终SC-019。紧急版仍按其已有候选及官方两步验证，不按此主线脚本重做或重发。

## 紧急版验证导航（2026-11-12）

依据[最新spec](spec.md)、[工作区输入及Clarify B](requirements/raw/2026-11-12-workspace-local-handoff.md)、[紧急契约](contracts/urgent-release.md)及[模型](data-model.md)。本地实施位置为当前工作区packages/skills-distribution-urgent；所有必需本地验证通过后按[连续推进豁免](requirements/raw/2026-11-12-urgent-continuous-exemption.md)继续，不逐阶段或逐Task重复确认；迁仓/建仓/推送/发布仍核对适用明确授权。源码可保留eval，正式技能发布、发现及安装仍排除eval。

### 当前已验结果与再次运行边界

当前7e79b524候选已完成当前包lint/check-types/build/同源双构建，完整133/133、0失败/跳过，真实官方9项安装和正常挂载两次、四项Codex宿主探针均有实证，见[本地交接](analysis/acceptance/urgent-handoff.md)与[一次运行事实](analysis/acceptance/urgent-local.json)。此前已实际暂停，当前固定停点已撤销。真实迁仓及新根输入具备后，沿已有授权按新根实际来源重验，无需另发阶段继续指令；不把旧上下文或候选换标签当新仓库通过。

源码中tests/helpers/prepare-host-context.py可用显式candidate/source-revision/candidate-digest/specify-cli参数建立本次拥有的正式项目，真实安装及普通第二步两次后才输出OWNED_HOST_CONTEXT；可选official-source限定真实固定公开来源，迁后复用同一代码而只切输入。它是测试辅助器，不是产品公开入口或Python安装核心，缺前置明确失败，不复制认证。完整复跑会真实启动4个Codex会话，只用于本次明确拥有的临时项目，不能将真实用户项目当故障样本。

### 当前事实与使用前提

规划时新工作区目录尚不存在；本轮T078已接入并保留旧副本，T079风险骨架、T080真实工作区构建和模块范围验证已有新证据，工程状态以tasks及实际验收记录为准。当前说明或汇合脚本变化后重新冻结并重建候选，完整两步、宿主及本地最终复验尚须汇合；下列命令是对应阶段的操作导航，不把旧输入成功或仅有命令模板当全部通过。

当前工作区阶段遵循根catalog、共享配置exports、锁文件策略及工具入口，迁后再由新根维护独立配置。建议包名@foundry/skills-distribution-urgent，实际包名若不同，过滤器应按真实声明调整；不得以不存在的脚本生成成功占位。初始化沿现有pnpm install流程，已准备工作区不重复全量初始化；需要时使用仓库既有--ignore-scripts故障兜底并只准备本包实际消费的预设，记录未完成的全量初始化结果，不顺手修用户主线。

消费环境准备Linux、实际依赖engines满足的Node至少22.20.0、Bash、Git、npm/npx、jq/curl/tar及uvx或已核验Specify1.2.6。运行脚本不自动下载前置工具、初始化项目或改治理。真实消费项目必须是本次拥有的独立Linux/Codex项目，已有Spec Kit及正式任务上下文，不能借真实用户目录制造故障。

### 当前包检查与源码身份反例

在当前仓库根、目标包与依赖接入后执行：

```bash
pnpm --filter @foundry/skills-distribution-urgent run lint
pnpm --filter @foundry/skills-distribution-urgent run check-types
pnpm --filter @foundry/skills-distribution-urgent run build
URGENT_SPECIFY_CLI="$PREPARED_SPECIFY_126" pnpm --filter @foundry/skills-distribution-urgent run test
```

PREPARED_SPECIFY_126须为已准备的真实Specify1.2.6可执行文件，实际全包测试不下载或替换全局CLI；缺少真实工具须failed/not-run，不以skip冒认本地全部成功。不存在根级pnpm test。检查必须来自同一真实输入集合，正文附件、README/ISC和必要脚本齐备；不降低严格类型检查或覆写无关框架类型求绿。原主线包未参与实际改动且无真实消费依赖时，不要求为验证紧急包先完成其用户手写插件。

| 输入与操作                                          | 必须观察的结果                                              |
| --------------------------------------------------- | ----------------------------------------------------------- |
| 包嵌套在packages下、Git根为当前仓库                 | 正确按包前缀核对Git blob及相关输入，不再要求包根等于Git根   |
| 无关工作区文件有未提交修改                          | 不修改该文件，不因其无关差异拒绝当前输入                    |
| 实际源码/配置输入脏、被忽略输入混入、构建中身份变化 | 明确非零，不能将实际字节标为HEAD或环境变量提供的SHA         |
| 根catalog、实际预设或依赖变动                       | 对应输入/依赖摘要改变，旧结果失效；不伪造未跟踪锁的提交身份 |
| 同一输入两次干净输出                                | 包内拥有的dist全文件集合及字节100%一致，构建不执行运行脚本  |
| 缺附件/额外技能/链接/越界/大小写冲突/错版           | 在清理未知输出或消费写入前拒绝，旧完整输出与用户内容保留    |

临时Git/构建夹具只证明算法和反例，不作为真实产品来源。实际消费的预设生成物另有构建/依赖证据，不能把被忽略的dist误当源码提交文件；未提交的产品输入不能宣称正式本地候选已就绪。

### 本地真实官方安装与正常挂载

复用tests/official-install.test.mjs及tests/remote-consumption.test.mjs的同一骨架：前者检查真实官方目录发现/复制安装，后者固化本地及迁后消费。实施时才补齐目标包脚本与测试，不因本指南提到文件就假定已实现。它们须适配工作区依赖，不再无条件复制包内独立锁。

本地官方实验从已校验的本地目录/Git材料调用当次真实skills CLI，记录metadata.version/integrity及同次命令，不固定历史1.8.1。整包/分类/单/多技能、增量与无效/缺依赖请求均观察实际文件；只发现9项获准技能、未选新增0、正文附件100%完整，显式eval请求拒绝。源码仓库可含eval并不改变正式安装来源；本地实验不增加对外本地安装参数，也不放宽生产公开来源建议。

模块汇合后重建最新脚本、script/config与release.json并读盘核验，再执行同版普通第二步。所有URGENT_*变量都是后续实际输入，不是已经存在的公开仓库或候选：

```bash
: "${URGENT_CONSUMER_ROOT:?填写本次独立Linux/Codex项目绝对路径}"
: "${URGENT_RELEASE_DIR:?填写本次已完整核验的同版发布材料目录}"
: "${URGENT_RELEASE_VERSION:?填写清单真实版本}"
cd "$URGENT_CONSUMER_ROOT"
node "$URGENT_RELEASE_DIR/script/index.mjs" \
  --source-dir "$URGENT_RELEASE_DIR" --version "$URGENT_RELEASE_VERSION" \
  --agent codex --project "$PWD" \
  --skill task-increment --skill artifact-spec-analysis \
  --skill implementation-preparation --skill artifact-project-description
```

预期复用官方已装文件，完整核验通过后真实处理本次适用hooks，再注册仅Increment；不造安装归属、不覆盖正文或附件。--check/--official/--no-mount不能替代正常链成功。

| 本地挂载/失败场景                    | 实际验收信号                                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 三个所选集中hooks                    | 私有临时输入command非空；实际1.2.6官方注册读回、after_tasks/before_implement/after_converge派发，有真实宿主完整读取；无after_increment |
| hooks中途失败                        | 已安装与前面成功hook事实保留，逐项结果含后续not-run，Increment实际调用次数0                                                            |
| 正式入口与源技能共存                 | Codex真实完整读正文/附件且规划只执行一次；不新增Implement包装或安装时业务实现                                                          |
| 旧三/四/五模式及别名、退役映射       | 官方更新实际去留、连续两次不重复或复活，用户修改/额外附件/无关扩展保留                                                                 |
| 缺件/错版/缺依赖/未知修改/不支持组合 | 对应写入前拒绝，不静默补装、降级目标或跨目录搜索历史                                                                                   |
| CLI替身或仅HookExecutor派发数据      | 只算故障边界/派发机制验证，不计实际注册、宿主执行或业务验收                                                                            |

缺Codex会话、正文/附件读取或实际派发证据须列not-run，不满足“全部本地验证”。没有适用环境不是成功；非Spec Kit分支不能抵扣必需挂载。

### 本地发布实验与连续交接

仅自有bare Git验证内部工具：错目标/版本/SHA/摘要/许可拒绝、同字节无父才复用、带父或非commit冲突、并发/断连后回读、后续校验失败保留已写事实；不连接真实远端、不force、不删旧完整版本、不构建或执行payload脚本。

全部本地工程、精确内容、真实官方两步/宿主及保护恢复和隔离发布验证有必需成功证据后，输出既有analysis/acceptance中的本地报告：包含源/依赖/候选摘要、真实命令与结果、未纳入范围和四处迁移说明。随后在已有授权与真实前置内**连续推进**，豁免中间阶段及逐Task方案重复确认，仍核对材料、保存方案和实际证据。缺必需证据只能报告具体已完成/failed/not-run，不能以等待仓库为由跳过本地验证，迁仓、建仓、推送或发布仍需适用明确授权。

交接清点如下，不在本轮实际执行搬迁或修复其他应用：

- packages/skills-distribution-urgent、packages/skills、specs/skills、apps/mcp四处来源及新根ISC/适用第三方许可。
- 新根catalog/工具配置、未迁移preset的等价替换、原测试读取scripts/dev/.specify的适配；保留原测试职责和未验项。
- eval源码可公开，但正式payload/官方列表/安装eval为0；公开前检查specs正文、附件和archive中的画像/私有引用，不能只排除.specify。
- MCP仍依赖旧manifest生产者的缺口，源码同行与运行兼容/线上部署分开报告；不以环境变量改路径冒认schema兼容。

### 用户迁移后才执行的公开阶段

用户后续实际迁移并维护新根依赖/配置后，重新核验真实干净源码、实际工具/依赖、完整ISC及公开范围，再执行全部适用检查、双构建和本地安装挂载/宿主骨架。此后冻结新候选，另获绑定目标、版本、源码及摘要的明确授权，才执行内部发布；不能拿Foundry旧候选换身份。

真实固定SHA已公开并匿名逐文件核验后，按已验证脚本预检公开来源：

```bash
: "${URGENT_RAW_ROOT:?填写与真实发布SHA对应的GitHub raw根}"
cd "$URGENT_CONSUMER_ROOT"
node "$URGENT_RELEASE_DIR/script/index.mjs" \
  --source "$URGENT_RAW_ROOT" --version "$URGENT_RELEASE_VERSION" \
  --agent codex --project "$PWD" \
  --skill task-increment --skill artifact-spec-analysis \
  --skill implementation-preparation --skill artifact-project-description \
  --check --official
```

预期返回实际upstream.version/integrity及同SHA的GitHub tree official.args。由使用者按返回的真实版本/显式名称/--agent codex/--copy运行官方命令，再正常调用同版第二步；不能把raw地址直接交给npx，不能把含eval的源码根当正式来源。移除写凭据后复用已固化消费骨架，不在发布后修改冻结源码。

匿名文件与候选100%一致、真实来源安装/适用挂载/宿主读取全部通过才满足SC-019最终交付。公开写入发生但验证失败分别记录，改变公开字节用新版本；主线Actions、两入口/其他平台及真实用户条件不被自动完成。以下原主线验证内容保持历史范围。

## 当前集合构建验证（2026-11-11）

有效范围以FR-053～060及[独立插件讨论](requirements/discussions/2026-11-11-independent-plugins.md)为准。目录插件已独立实现并接入Vite，现有集合插件暂时交付清单所选技能与配置；T076/T077尚未实施。无配置为空清单，MCP为空目录，脚本生成细节后置。目录及集合最近一次真实构建32项通过、PowerShell缺pwsh跳过等结果见[T075记录](implementation/T075.md#实际实现与验证2026-11-11)；后续仅注释修改的验证另记[续接讨论](requirements/discussions/2026-11-11-independent-plugins.md#文档同步与用户手写接续)。本轮只同步文档，没有重新运行工程检查。

当前由用户手写修改代码，AI暂不自动执行下列命令或修复代码。用户修改后再按实际范围选择验证，不能将历史通过当作新修改已验。

```bash
pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build
node --test --test-isolation=none packages/skills/tests/distribution/create-directories.test.mjs packages/skills/tests/distribution/collections.test.mjs
node --test --test-isolation=none scripts/dev/actions/link-skills/test-link-skills.mjs
```

当前不生成MCP manifest、Release/安装投影或script交付。下方旧T065固定目录和阶段接口指南保留历史参考，不是当前插件测试入口；旧安装/挂载/估算清单等特定消费者须单独适配，不能按历史命令声称已兼容。发布含义与MCP内容仍待用户决定。

## 历史重规划与旧验收入口（2026-11-10）

更新日期：2026-11-10。依据B的全部打包构建重做与共同优先安排，当前已完成设计、[现状存档](archive/2026-11-10-build-pipeline-replan/README.md)和任务衔接；尚未执行新构建或部署。任务起点及真实依赖见[tasks](tasks.md)，旧完成事实不重开。

T064 后续已将旧构建和直接耦合测试原样移入上述存档的 retired-source，当前 `build` 明确非零并提示重做中，不生成或清理产物。保留入口及消费者的实际结果见[清退证据](analysis/acceptance/build-rewrite.md)。下方构建场景是 T065～T070 等后续任务的验收要求；旧 dist 和已移入存档的测试结果均不能作为新构建通过依据。

T065 的 `build-pipeline.test.mjs` 保留当前完整链红灯。T067六模块及直接阶段测试已按用户要求移至[归档](archive/2026-11-11-build-script-restart/README.md)，33项阶段通过仅保留[历史证据](analysis/acceptance/source-plan.md)；原 source-plan.test.mjs 已移出有效测试目录，不能再按原命令运行。当前先重新讨论构建脚本，后续核对既有测试与新脚本的适用关系。

## 先区分已有能力与计划入口

| 对象                                         | 当前事实                   | 本次验收方式                                 |
| -------------------------------------------- | -------------------------- | -------------------------------------------- |
| Vite/四构建组件、Release 模型/校验           | 旧实现已存档，新实现未完成 | 原绿灯只保留历史；按新阶段重新运行           |
| Node/平台安装、官方预检、工作区消费者        | 保留已有实现及其未完成范围 | 新产物必须实际兼容，不把保留说成全平台完成   |
| build/ci/run.mjs、candidate.mjs、publish.mjs | 尚未实现                   | 缺入口明确not-run，不能执行占位成功          |
| skills-check/skills-release workflow         | 尚未实现                   | 实施时先读回配置，再实际运行隔离/迁后场景    |
| 正式workflow同版来源、真实平台与公开目标     | 分别有前置条件             | 缺项阻断对应完整验收，不阻止无依赖的局部实验 |

## 存档核验与实施准备

可直接运行的只读快照校验，在本功能归档目录执行：

```bash
cd specs/skills/001-skills-distribution/archive/2026-11-10-build-pipeline-replan
sha256sum -c snapshot.sha256
```

预期压缩包校验通过。逐文件摘要位于 files.sha256，原任务与源码路径保留在压缩包内。需要对照时在新的临时目录读取，不解压覆盖当前工作区；这不能作为独立工程运行通过。

本次Tasks已衔接新职责和实际依赖。真正开工前仍须逐项完成适用的实施方案讨论认可、保存读回及门禁；T064已完成旧实现清退；T065已建立真实失败契约；T067原实现已归档，后续先讨论重写方案和实际任务衔接。此指南提供验证输入和信号，不是代码代写、安装或发布授权。

## 按构建及占位、Actions、真实挂载依次验证

先完成构建、纯安装及占位边界，再实现与隔离验证 GitHub Actions，最后接真实挂载；完整矩阵/本地交付/迁后发布依旧按实际前置验收。下列是实现后应逐步执行的场景；当前缺新范围或入口的项目保持未实现/未运行。完整字段见 [data-model](data-model.md)，输入/返回与副作用见 [节点契约](contracts/build-pipeline.md)。

| 场景              | 实际输入/操作                                                                  | 通过信号与失败断言                                                                         |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 来源与内存计划    | 同一实际源码/配置/依赖快照；含中文/空格附件名和二进制文件；先运行缺能力测试    | 不写输出即发现缺目录/链接/重复身份/越界；正式候选拒绝未提交字节冒认SHA                     |
| 三目录及MCP       | 真实Vite，干净临时输出；新增/修改/删除技能和references；空MCP及非法frontmatter | 同一dist根正确生成；无旧入口/残留；MCP正文附件完全对应源；脚本字节一致且无执行哨兵触发     |
| Release与安装格式 | 正式schema、完整附件及已公开依赖；保留安装器与独立消费项目                     | 两种格式全集、摘要和引用正确；缺件/大小写冲突/错误依赖失败；旧脚本可读新产物               |
| 两次构建与候选    | 同源同依赖，两个独立干净输出；严格按公开白名单复制                             | 全部公开字节一致；payload漏件/多件/改字节均拒绝；缺README/真实许可证/必需检查不得正式ready |
| Actions与平台绑定 | 使用同一构建实现；受信默认分支check；真实上传输出和精确attempt API             | 上传前无伪造artifactId；上传后收据正确绑定；错误run/attempt/摘要/过期/缺收据都拒绝         |
| 本地发布故障      | 本次拥有的临时bare Git；未授权/只读/错目标、两次重试/并发、推送后响应丢失      | 零越界写入；同字节复用、异字节拒绝，无force；中断读回ref后报告已写事实及旧版保留           |
| 迁后真实发布      | 独立根工程、新SHA/依赖、真实默认分支成功检查、维护者显式授权                   | 只发布原候选字节；固定来源全部文件与两入口/适用挂载有证据，真实用户与支持矩阵分别验收      |

身份反例包括版本、源码SHA、清单、内容索引、平台收据、artifact ID、run attempt、检查结果和有效期；每项单独篡改都必须返回非零，不只测happy path。隔离测试的合成平台记录必须标明用途，不得用于真实publish。

### 三段推进的验收边界

1. 构建与占位：唯一 vite.config 真实生成完整字节并读回复核；--no-mount 在隔离项目纯安装成功。需要原生挂载时明确非零、零官方调用和零目标写入，报告未实现；不能以空脚本退出0通过。构建只复制脚本，不能执行或动态伪造占位。
2. GitHub Actions：T070通过后再实施T066及候选/收据/发布workflow；隔离输入验证权限、身份与故障传播。占位存在或挂载必需证据缺失，full/ready必须失败；开发/isolated结果不能触发真实发布。
3. 真实挂载：T059配置交付后，满足正式来源与安装前置再由T006/T022～T028替换占位；实际验证单Increment、所选hooks、未知内容保护及宿主加载。随后T037/T060汇合完整本地检查，迁后T061/T062另获授权再验平台/首次发布。

### 工程检查命令

以下包命令可在代码实施后从仓库根执行；build-pipeline.test.mjs现已存在且25项红灯，其他尚未恢复/新增的入口缺文件时不可运行或宣称通过。前轮规划未运行这些命令；本轮T065实际检查结果见上述证据：

```bash
pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint
pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types
pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build
pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test
node --test packages/skills/tests/distribution/build-pipeline.test.mjs
node --test scripts/dev/actions/link-skills/test-link-skills.mjs
```

按实际改动补新构建契约、候选/收据与Git故障范围测试，并复验安装/预检、Node入口和实际受影响工作区消费者；MCP正向清单消费按下节适用边界单列后置。content-export等官方工具实验必须先提供真实已准备工具目录；缺缓存/平台/网络明确失败或未运行，不以skip满足发布必需门禁。

计划新增的 `tests/distribution/pipeline-contract.test.mjs` 与 `build/ci/run.mjs` 当前不存在。待其真实实现后，使用 pipeline 契约的check/candidate/simulate模式；publish仅迁后且另获授权执行。不存在根级pnpm test。

candidate 模式必须显式传入 `--validation-scope isolated|full`。T055 的先行实验使用 isolated：允许列明的稳定子集/合成技能和尚未执行的完整门禁，但有效 Release、集合内全部附件依赖、真实 README/许可证、双干净构建与严格 payload 都必须通过。实际执行检查失败必须非零，未执行项记录 not-run/coverageLimits。full 则要求正式完整来源与全部上传前门禁，不接受上述缺项；两者均不在上传前返回 ready。Foundry 保持隔离用途，真实发布还须迁后 standalone 和可信平台绑定，详见[pipeline准入表](contracts/pipeline.md#候选范围与准入条件)。

### MCP只读回归（T037）

**当前适用边界（2026-11-12）**：FR-025/050及当前集合构建只要求空dist/mcp，不生成manifest。下列命令保留原正向消费验收及恢复入口，当前不是T012/T037或紧急路径的清单生产前置，也不应直接执行后把缺清单归为本期要求缺失。当前检查保留空目录、实际调用关系及已纳入范围的消费者；既有测试和失败结果仍完整报告，不删断言或以skip求绿。旧manifest生产者与apps/mcp消费缺口单列后置/未验，不能用空目录、旧夹具成功或修改环境变量冒认新构建已兼容。

**恢复条件**：后续正式明确MCP内容规则、生产者和消费契约，并更新相应任务与认可方案后，才从仓库根执行下列正向回归。原前置保留：Python ≥3.12、uv、按apps/mcp/pyproject.toml已准备好的应用虚拟环境，以及该次正式构建生成的`packages/skills/dist/mcp/manifest.json`。命令禁用联网与依赖同步；恢复验收后缺环境、缺产物或校验失败必须记录failed/not-run，不能算通过。它显式传入新路径，不依赖MCP应用仍保留的旧默认路径。

```bash
uv run --offline --no-sync --project apps/mcp python - <<'PY'
import json
import sys
from pathlib import Path

from foundry_skills_mcp.registry import load_skills

assert sys.version_info >= (3, 12), "需要 Python >=3.12"
manifest_path = Path("packages/skills/dist/mcp/manifest.json").resolve(strict=True)
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
expected = manifest["skills"]
all_entries = load_skills(manifest_path, include_destructive=True)
default_entries = load_skills(manifest_path)
assert len(all_entries) == len(expected), "全量加载数量不符"
assert {entry.name for entry in all_entries} == {item["name"] for item in expected}
assert {entry.name for entry in default_entries} == {
    item["name"] for item in expected if not item.get("destructive", False)
}
for entry in all_entries:
    source = next(item for item in expected if item["name"] == entry.name)
    assert entry.skill == source["skill"], entry.name
    assert [(ref.name, ref.content) for ref in entry.references] == [
        (ref["name"], ref["content"]) for ref in source.get("references", [])
    ], entry.name
print(f"MCP registry 回归通过：全量 {len(all_entries)}，默认 {len(default_entries)}")
PY
```

该命令只核对清单加载、默认破坏性过滤及正文/附件字节对应，不启动 MCP 服务、不安装技能。依赖环境需在独立准备步骤完成；本轮文档修复未执行此命令，不据此宣称真实回归通过。

## 迁移与最终验收

Foundry只交付本地设计/实现、隔离验证与迁移说明，不向真实公开目标发布。用户直接迁移源码，新仓库维护依赖与配置；按新源码身份重新检查和准备候选，不将旧Foundry产物升级为新身份已验。

正式发布只使用可信固定版本工具和已经核验的候选；发布job不安装依赖、不构建、不执行候选脚本。远端安装在独立只读job/隔离目标执行，失败保留真实发布事实。SC-008独立使用者、SC-001支持矩阵和SC-017真实旧版本恢复按完整条件判断；首次没有真实旧版本时该历史部分继续未验，不为补样本擅自发布。

## 既有消费者与历史实验参考

下方A～F、旧工具版本与旧任务顺序仅保留原实现/消费者的复现方法及历史语境；新构建验收以本次上方场景为准。原任务身份不重开，新的构建重做与平台绑定前置已由本次Tasks衔接。旧Linux或局部结果不代替新实现、其他平台或真实远端验收。

## 包职责修正后的验证要求（2026-11-03）

包只提供技能与脚本，不维护包根扩展声明或 mounts.json。保留[旧五指令脚本工程证据](../20261029-speckit-workflow-foundation/analysis/acceptance/script-mount-mvu.md)，不等待前序全部验收。模式临时输入按现有脚本成功/失败均清理；新增外部独立交付、所选钩子与35集成验证，不重做逐模式命令扩展。

## 环境和基线

开发环境使用仓库既有 Node/pnpm/Vite 与 Python；yaml 2.8.3 由包 devDependencies 经 shared catalog 声明，保留工作区现行 trustPolicy: no-downgrade。外部最小环境见 [兼容契约](contracts/compatibility.md)。Linux、macOS、Windows 各用独立临时项目和隔离测试用户或容器；全局安装绝不写开发者真实用户的技能目录。路径 fixture 与真实 CLI 测试分别记账，禁止拿路径模拟代替真实入口安装。

产品每次在线解析 skills latest；Specify 默认 1.2.6，本机 dev0 不作其证据。记录实际 Node/npm/Git/Specify/shell 版本以及本次 upstream.version/integrity。Node ≥22.20.0、tar 和相应平台工具需提前具备；source-dir 也需要在线查询。网络、完整性或上游布局失败明确退出且目标零写入，不回退旧表。历史固定版本只用于下方标注的旧实验。

## 构建与最小工程检查

实施代码后在仓库根运行：

```bash
pnpm --filter @foundry/skills run lint
pnpm --filter @foundry/skills run check-types
pnpm --filter @foundry/skills run build
pnpm --filter @foundry/skills run test
pnpm --filter @foundry/skills run test:distribution
uv run --project apps/mcp pytest apps/mcp/tests/test_registry.py
node --test scripts/dev/actions/link-skills/test-link-skills.mjs
```

当前构建预期：dist 根为 mcp、skills、script、release.json、projections 五项；dist/mcp/manifest.json 只来自 src/mcp，dist/skills 保留完整线下内容。开发 release 只选择 coding/frontend 当前内容并标 development；完整同版 workflow 来源未就绪时不冒认完整发布。scripts 原样交付 read-agents.mjs，files/adapters 无 agents.json，构建不联网查询来源或执行运行脚本。旧根 manifest/index 不恢复。

### 单配置验证（2026-11-02 用户调整）

只执行 `pnpm --filter @foundry/skills run build`，不再使用 distribution 模式。运行 `node packages/skills/tests/distribution/test-build-config.mjs` 验证单次交付、源目录缺失、脚本独立执行、MCP 清单递归扫描与稳定重建、增删变更，以及手写清单/重复名称/非法元数据失败；运行包 test 验证真实样例和线下正文。不要手工编辑 dist 或源 manifest 来令测试通过。

## 当前官方只读预检

前置工具及同版本地构建产物准备好后，在独立消费项目运行以下模板，尖括号须换成实际值；此步骤不执行官方安装或挂载：

```text
node <dist绝对目录>/script/index.mjs --check --official --source-dir <dist绝对目录> --version <自有技能SemVer> --agent codex --all
```

成功报告应包含实际 upstream.version/integrity、选择与目标；安装阶段为 not-run，目标树无新增。建议使用同次解析的 skills@版本及显式已核验名称，不用星号扩大集合；若在线获取、完整性或规则布局失败，不输出可执行安装建议。对照[安装契约](contracts/install.md)处理冲突和后续步骤；公开来源尚未就绪，模板不证明远端通过。

## A：历史 MVU-A 重现（skills 1.7.4）

本节仅复验 2026-11-04 的旧基线，数量及版本不是现行产品约束。先准备当时官方工具（以下安装只写自选临时工具目录，不改 workspace）：

```bash
npm install --prefix /tmp/foundry-t003-tools --ignore-scripts --no-audit --no-fund --save-exact skills@1.7.4 yaml@2.8.3
```

另取得官方 skills 的 v1.7.4 源码并解压到独立目录。将 FOUNDRY_SKILLS_PACKAGE 指向该 npm 包目录、FOUNDRY_SKILLS_SOURCE 指向含 package.json 与 src/agents.ts 的源码根。测试检查版本与实际 YAML 依赖；不会隐式下载 latest。路径仅是测试工具来源，真正安装目标由沙箱创建。

可重复执行命令（路径按实际位置替换）：

```bash
FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t003-tools/node_modules/skills FOUNDRY_SKILLS_SOURCE=/tmp/foundry-skills-source/skills-1.7.4 pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --mvu A
```

2026-11-04 用户确认本次 T003 仅验 Linux；最低 Node 22.20.0 下9项通过，证据见 [MVU-A记录](analysis/acceptance/mvu-a.md)。其他平台及远端尚未验证。

在隔离环境从导出根、分类目录、单技能目录分别运行原生 `npx skills@1.7.4 add <source> --list`，列表精确等于清单子集，无 eval 或重复。随后使用 [安装契约](contracts/install.md) 四种选择安装；本地目录用于本地实验，URL语法必须等公开仓库后另测。

选取单技能 `document-changed-symbols`；分类 `frontend`；多技能 `vue-reactivity task-pair`（纯安装关闭挂载）；整包全部 16 项。正文与必要附件按目标 agent 投影逐字节比较，另断言未选技能新增数为零。用 Eve 校准固定 yaml 2.8.3 序列化，断言 frontmatter/正文与官方输出一致，不允许忽略字段后宽松比较。

原生 CLI 对混合未知名和既有目标的行为作为已知风险记录；本包只读预检必须在这些输入下零目标写入。检查所有 79 agent、77 global 路径解析以及环境变量和 OpenClaw 分支；eve/promptscript global 请求在写入前失败。

## B：下载与安全提交

**2026-11-04 用户确认的本轮范围**：仅验证 Linux。agent 在仓库外准备独立脚本副本、临时消费目录与受控 HTTPS 测试源，用户无需预先创建公开仓库或准备外部项目。下方 PowerShell 命令保留为其他平台的待验证步骤；Windows/macOS 及未具备的最低运行时不计通过，不阻塞本轮 T004 验收。

```bash
pnpm --filter @foundry/skills run test:distribution -- --mvu B
```

MVU-B 将 `script/install-skills/` 原样复制到仓库外沙箱，实际从独立消费目录执行 Bash 平台入口，不依赖源码、monorepo、pnpm 或 node_modules。清单与最小技能由实验生成，不能冒充正式发布物；不等待 T008/T012 正式构建。最小入口仅支持 Linux x86_64、Codex 项目级、显式名称选择；其他输入明确失败，后续任务在骨架上扩展。

```text
bash <独立副本>/script/install-skills/install-skills.sh --source <受控HTTPS根URL及完整提交> --version 0.1.0 --agent codex --skill <实验技能>
bash <独立副本>/script/install-skills/install-skills.sh --source-dir <本地实验发布根绝对目录> --version 0.1.0 --agent codex --skill <实验技能>
```

上方是内部平台模块的实验模板，不是公开可运行地址或第二个公开入口。Bash 实际负责下载、验证和提交；外部统一使用 Node 入口，Node 调度和真实独立安装已由 T041 另验。jq 1.8.1 在目标项目之外准备，并验证固定官方摘要；FOUNDRY_JQ 可指向预先准备的同版普通文件，仍先核验后执行。测试默认自动取得官方工具，也可使用此变量离线复验；工具准备失败不得进入目标写入。PowerShell 安装模块当前明确失败，不将未实现能力算作跨平台通过。

本轮 Linux 安装结果与输入文件集逐字节一致；跨平台等价性留待具备环境后验证。不含 workflow 时省略 no-mount 不调用挂载；本 MVU 的 workflow 请求必须显式 --no-mount，原生挂载由 T005/T006 接通。HTTP 故障使用本地受控 HTTPS 源：404、截断、超时、错误摘要及跨协议重定向均不产生假成功。证书在测试运行时生成，临时 CA 只通过 CURL_CA_BUNDLE 传给本次子进程；不修改系统 CA，不跳过 TLS。默认 curl 配置不能覆盖脚本的传输安全设置；测试源不代表真实公开交付。

预置未知同名文件、不同版本、用户编辑、额外文件、Git 跟踪但工作树已删的路径、父仓库跟踪、损坏索引、只读目录、目录链接、锁争用、提交前目标变化及中断残留。原用户字节保持，残缺目录不入成功集合；多技能前项成功后后项失败报告 partial。合法安装连跑两次验证复用且不改技能或收据，TERM 中断清理后实际重试成功；失效锁或无收据现场保留给用户处理。

可通过 FOUNDRY_MVU_B_SCRIPT_DIR 指向独立构建产物的 script 目录，用同一组实验验证交付副本。实际版本、命令、红绿记录和限制保存于 analysis/acceptance/mvu-b.md，不以此说明替代通过证据。

## C：历史最小公共材料核验重现

本节复验旧技能集合和固定官方包，不代替当前 Increment/准备 hook 移交。内部最小核验模块已实现，模块接口见 [内部核验说明](../../../packages/skills/script/old/mount-entry/README.md)，实际结果见 [MVU-C 验收记录](analysis/acceptance/mvu-c.md)。外部分发唯一入口为 node script/index.mjs 加参数，当前先接现有安装骨架，实际挂载仍待 T006。先准备固定版本 skills@1.7.4 npm 包，将 FOUNDRY_SKILLS_PACKAGE 指向该包目录；Bash 可将 FOUNDRY_JQ 指向已取得的 jq 1.8.1 官方二进制，否则内部模块会自行准备并核验。实验在自有 /tmp 目录执行，未提供真实公开来源。

```bash
pnpm --filter @foundry/skills run test:distribution -- --mvu C
```

本项先创建公共入口 mount-entry.sh/.ps1，原样复制到独立沙箱并在用户手动启动入口时准备运行依赖；原生调用由后续MVU-D接通。官方仅安装一个 workflow 技能，不提供源码仓库；从独立导出获取 mount 工具，传版本、选择、agent、scope、installed-root 和明确项目。校验文件和公共材料同 catalogDigest。分别注入缺附件、不同版本、错误位置、伪造退出0、有效与失败混合项，断言只有本次完整成功项进入映射。单选 task-explore 时技能安装成功，但五指令挂载报告其余四项选择缺失、不补装；补齐本次显式选择并逐项核验后才可调用命令脚本。

项目历史上有 workflow、本次仅 frontend 时不调用 mount；全局 workflow 未给项目时 installation=success、hooks=failed/缺项、commands=not-run，并给补传项目的重试命令。no-mount 时不要求项目；非 Spec Kit 明确 skipped。

本轮 Codex 原始目录投影最新 Bash 正式调度器 23 项通过，Linux PowerShell 构建副本 22 项通过、1 项 Bash 专属场景跳过，包含混合选择枚举异常后的逐项报告。模块不会修改已安装技能；无法完整枚举目录也必须失败。五项齐备仍明确报告原生挂载 unsupported/not-run，实际 hooks/commands 接入由 D 验证，不以文件核验替代。

## D：Increment、实施准备与旧入口迁移（本轮验证设计）

前置：主线正式同版 task-increment、implementation-preparation、artifact-spec-analysis 与 artifact-project-description 及其实际必需附件已移交；仅验证所选映射。测试使用独立临时项目、隔离用户与工具缓存，初始化仅由夹具执行；先记录实际指定的 Specify 1.2.6，不以 PATH 其他版本或旧 dev0 代验。现有 D 场景尚待实现，完成后运行：

```bash
pnpm --filter @foundry/skills run test:distribution -- --mvu D
```

缺 D 文件或正式来源要报告失败/未运行，不能把模拟输出记作通过。D-MOUNT/D-PREP/D-CHAIN 的具体责任与阻塞边见 [plan](plan.md)；以下不是本轮已运行结果。

1. 在隔离旧三/四/五集合项目中预置无关扩展、原生核心入口和普通用户哨兵，记录登记、树和字节。仅安装/选择 Increment，缺三个暂停来源不阻塞；使用官方同 ID modes --force 更新后，旧暂停及退役活动入口残留为0，Increment 与所选 hooks 产物正确，无关内容保持。连续再执行两次，旧入口不复活。仅脚本列表改变或官方退出0不能通过。
2. 在另一个受管目录加入未知附件或用户维护文件。调用前清点应使受影响官方更新停止且目标树零变化，报告精确冲突与恢复条件。登记缺失/损坏、归属不明也须报告无法确认，不手改 registry/生成文件或整目录删除。上游删除风险只可在可丢弃样本中另记，不能算产品保护成功。
3. 对正式准备正文、全部必要附件与同目录 speckit-hooks.json 比较源/Release/实际安装投影摘要。缺正文、缺附件、缺声明、版本不符分别在首个官方调用前失败；配置随技能交付，dist/script 无 definitions。
4. 通过既有 hooks-only 机制注册所选准备/分析/结案；核对 before_implement、after_tasks 和技能自带结案事件、extension ID、条目与实际来源一致，hooks-only 无额外命令。hooks 失败后 Increment 的 commands=not-run；无 Increment 选择只报告命令不适用。
5. 核对生成入口身份、有效正文和附件引用实际可读。官方可以重建 frontmatter，故生成入口不与源 SKILL.md 简单整文件比字节。在无待实施业务任务的实际宿主完整读取准备正文与必要附件并留证，不执行实现；安装/加载不替代主线讨论确认、自然语言发现和逐 Task 方案门禁。
6. 从同版独立产物分别经唯一 Node 入口验证 curl 自动编排、官方安装后显式第二步；关闭、非 workflow、缺项目、缺环境、平台失败、部分成功和重试分别报告。工作区 nuxt-prepare 在自有夹具副本验证来源→hooks→Increment 及失败阻断，不运行真实工作区 postinstall。
7. 按当次 skills 与所选 Specify 适用集成交集验证原生产物和实际加载，旧35项表只作历史；Bash、PowerShell 与 Linux/macOS/Windows 分别留证。缺运行环境逐项未验，不用 Bash 模拟或入口文件存在代替全部宿主结果。

源码与测试沿既有 register-commands/register-hooks/mount-entry/install-skills 增量完善，Node 保持调度职责。已有 test-register-commands.mjs、test_register_commands.py、test-register-hooks.mjs、test_full_remount.py、nuxt-prepare/test-nuxt-prepare.mjs 及 test-build-config.mjs 对当前集合/未知内容/顺序分别验证；其旧集合断言须在后续任务内修订，历史验收记录原文不改。

## E：Git隐匿

```bash
pnpm --filter @foundry/skills run test:distribution -- --mvu E
```

测试普通仓库根、无.git、父仓库下子目录、.git文件worktree/submodule、global有/无项目、项目外技能、共享配置、反向规则、空格/通配字符路径、已跟踪目标、exclude不可写。使用真实 Git check-ignore来源、ls-files和status联合核验。未选路径必须保持可见，原规则不丢失，同版连续两次不重复追加。hidden失败可与安装成功并存，挂载结果不被覆盖。

## F：独立迁移与既有消费者

```bash
pnpm --filter @foundry/skills run test:distribution -- --mvu F
```

在现有单次 Vite 构建上接入 MVU-B/C/D 已验证的安装与挂载能力，沿用 script → dist/script，不增加模式切换或空工具入口。相同输入构建两次并比较摘要；在外部沙箱验证已交付工具不依赖 monorepo。后续公开迁移按明确发布选择核验，不能把当前 dist 全量构建等同于公开集合。检查完整附件、脚本临时输入及缺少实际读取器或必要平台脚本时构建失败；记录包检查、link-skills与已有入口保护，registry读取新manifest的正向回归按[适用边界及恢复条件](#mcp只读回归t037)单列后置/未验。MCP应用默认路径和上下文估算工具迁移另行验收，不声称已兼容。

## 完整验收与公开仓库阶段

MVU最小实验通过后才填充下游业务，再运行完整矩阵：

```bash
pnpm --filter @foundry/skills run test:distribution -- --matrix full
```

上述单入口由 T063 实现，具体路径是 packages/skills/tests/distribution/matrix.mjs；T002 已交付的调度器只负责调起，并不代为实现矩阵。默认 test:distribution 无 selector 时也包含 full 场景，缺入口必须失败，不能跳过。三平台真实执行与同身份结果汇总均在发布前完成，本机单平台输出不能宣称三平台通过；T037 核验本地全集，T038 在迁后沿同一入口追加 remote 全集，不将 T038 反向设为 T037 前置。

纯安装矩阵对 curl 显式使用 --no-mount，挂载在 D 和完整挂载场景单独验证，避免把环境缺项混入安装结果。

矩阵按实际解析的 skills 版本枚举：3平台 ×(项目级数量+全局支持数量) ×2入口 ×4选择；旧 1.7.4 的 3744 组保留为历史基线。不得以代表agent替代全部组合；真实agent程序可不参与纯安装路径测试，但必须区分路径fixture、真实安装、实际技能调用三种证据。另加 SC-003～007 的失败/重试和挂载矩阵，记录完整文件率100%、技能未选新增0、安装目录用户修改及挂载无关配置保留100%。测试入口须拒绝把缺失运行时的 skip 统计为 pass。

每项证据保存平台/工具版本、实际 upstream.version/integrity 与支持清单、技能 source revision、输入、预期、实际、命令、退出码、产物路径及限制，汇总到本功能后续 `analysis/acceptance/distribution.md`；未执行项逐条说明。当前不预建假通过记录。

T030/T031 准备材料，US4 及 T059 完成后由 T063 实现完整矩阵入口并核验分平台汇总及全部本地组合；T037 消费同源码/文件身份的全矩阵，重建两次、执行完整发布校验并固定 Foundry 候选。新增项目迁移/流水线职责已由 T055/T056/T058～T062 承接：T055/T056 先验候选和 Git 边界，T058/T059 接通驱动/workflow，T060 验本地交付；T061 迁后真实检查与 T062 获授权发布另行执行。原任务身份及验收保持。用户迁移技能源码工程后，在独立公开仓库的新源码 SHA 上重新检查、准备并手动首次正式发布；T061 在迁后重建核验新候选、T062 获明确授权后发布并读回固定来源，T032 再只读比对该远端与对应新候选，不在验收时修改发布物。发布 README 继续参数化接收 RELEASE_SOURCE，来源 commit 不回写 README；真实 URL、源码/发布 SHA、version、catalogDigest、README 摘要和实测命令在发布根外 release-source.md 留证。使用固定来源在三平台补两入口/适用挂载和独立使用者验收，缺地址或真实用户保持未验，不以本地迁移演练抵扣 SC-008。

T032/T038 只读使用实际发布对应的候选，迁移改变身份时须在新仓库重建重验；不能为替换地址修改发布根。T039 若改变交付字节，旧候选及相关验收失效；已公开内容须新版本、重新授权发布并重做适用远端验收，不能复用旧版本通过记录。

当前真实 Increment 反馈验收由 T052 承接，前置为主线当前同版能力移交与可实际规划的分发业务目标，已有 Task 仅关联职责，不再要求 Task 定位参数。Tutor 的 T053 与 Pair/Direct 专项移出本期测试、移交和结案，保留身份与历史，不只是后置待补。当前tasks已修订原四/五项做法，T053原文/checkbox迁至暂停历史并移出收尾依赖；工程勾选未变，仍需按实际命令和证据验收。双方只回链真实证据，不互相自动勾选。

**历史说明（已由上述当前集合及验收分工替代，不作为续接入口）**：外部项目具有独立可追溯产物与真实正式任务后，可开展限定环境的 Explore/Guide 行为验收，不等待 T032/T038 全矩阵或公开发布完成。分发记录来源、安装与挂载，工作流 T044/T045 记录实际使用并互链。工作流 T038/T046 的公共规则覆盖仍按原验收，本功能不自动完成它们或伪造学习证据。

## 历史：计划阶段实际检查（2026-11-02）

- 10份新增计划文档逐文件执行 `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix <文件>`，并统一执行同参数的 `eslint <10份文件>`，均通过。该参数只关闭pnpm执行前自动依赖校验，不改变ESLint规则。
- 本地相对链接检查无失效；plan覆盖FR-001～027；兼容清单79项无重复；六项MVU表的命中事实、假设和信号检查通过；`git diff --check`通过。
- 开始规划时记录的12份已有文件逐一核对SHA-256均不变，包含用户已有配置修改、spec、前阶段快照与原T038记录。
- Mermaid自动检查未完成：`node --input-type=module`调用本地mermaid.parse时缺少浏览器DOM，报DOMPurify.sanitize不可用；随后同方式使用Puppeteer启动 `/snap/bin/chromium`，被沙箱拒绝创建 `/run/user/1000/snap.chromium`，退出46。图表已按文本复核，尚无自动语法/渲染通过证据；需要可运行浏览器的环境补验8张图。未为此安装浏览器或修改系统配置。
- 上述是计划产物检查，不是功能代码验证。MVU、完整矩阵、包代码检查和真实远端验收尚未执行，原因是本轮只获授权推进plan且实现尚不存在；按本指南留待后续阶段。

## 原样脚本与入口分工验证

构建验证须给运行脚本放入无法解析的第三方 import，确认 build 仍能原样交付；逐字节核对 mjs/ts/json 和运行目录，排除测试、缓存及本机 node_modules。复制到独立目录后准备 Node、tar 及平台工具，经唯一 Node 入口验证读取器和平台调用；不要求第三方 Node 运行库，不编译本包运行代码。T003 TS 实验辅助模块保留在 tests/distribution/helpers，使用开发依赖执行，不进入业务交付目录。T003 的官方配置探针编译仅为读取第三方源码的测试手段。

T004/T005 后续分别验证 curl 自动准备运行依赖和用户手动启动公共入口；T019/T027 验证自动安装挂载串联。缺依赖、下载失败、版本不符须报告失败；目标项目依赖文件保持不变。当前只完成构建边界修正，不能把这些待实现步骤记为通过。
