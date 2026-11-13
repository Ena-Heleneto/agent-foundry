# T101：Implement 优先范围与保护基线

采集日期：2026-11-10。对应[原任务](../../tasks.md#t101)和[核查做法](../../implementation/T101.md)。本记录描述采集时的实际工作区，不代替后续技术验证、业务验收或当前工程状态；唯一工程 checkbox 仍在原任务。

## 范围与授权

用户在了解 T101 核查范围及历史清单门禁后回复“开始吧”。本轮据此开展指定工作区的独立资料调查，沿用其对历史未勾项的继续授权，保留 requirements.md 的17/18标记。执行来源、登记、版本与保护核查，未运行安装、挂载、注销、依赖初始化、构建、数据库或发布操作。

当前有效范围为原生 Implement、共同准备和 Increment 规划；Pair/Tutor/Direct 的研发、生成/注册和能力测试暂停。维护源、原 ID、已完成事实和历史证据保留。新工作流规则归宪章与准备能力，AGENTS 不承担路由。

## 实际上下文与版本

工作区为 `<source-workspace>`，分支 `feature/speckit-workflow-extensions`，采集时 HEAD 为 `52eebe56dcd26a95888f863015ce7d91ab423b18`。Git dir 与 common dir 均为 `.git`；本 Task 调查指定工作区的已有改动，沿既有基线方法在原目录只读调查，未创建或切换工作树。

用户显式指定本 Spec；共享 `.specify/feature.json` 实际指向 `specs/skills/001-skills-distribution`。前置检查使用绝对 SPECIFY_FEATURE_DIRECTORY 及 SPECIFY_FEATURE_NO_PERSIST=1，返回本功能和 research/data-model/contracts/quickstart/tasks，退出0；本轮保留共享指针。

| 对象               | 实际结果及适用边界                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PATH 的 specify    | `<source-home>/.local/bin/specify`；实际运行 `specify version` 返回1.3.3                                                                                                |
| 所选版本           | FOUNDRY_SPECIFY_VERSION 未设置，双平台注册脚本均默认1.2.6；后续本轮验证固定选择1.2.6                                                                                    |
| 固定版本可执行文件 | 实际运行 `<source-home>/.cache/uv/archive-v0/FFsdlmKBeESY_-Br/bin/specify version`，返回1.2.6、Python 3.15.2、Linux x86_64、退出0；同环境 METADATA 为 specify_cli-1.2.6 |
| 项目初始化声明     | `.specify/init-options.json`：codex、ai_skills=true、script=sh、speckit_version=1.2.6                                                                                   |
| Node / pnpm        | 实际 `node --version` 为v24.22.2，`pnpm --version` 为12.16.1                                                                                                            |
| 平台               | Bash 可用；`command -v pwsh` 无路径。未执行 PowerShell、Windows/macOS 或最低 Node 版本验证                                                                              |

缓存绝对路径只作为本机调查定位；分发仍通过环境变量或默认版本选择官方 CLI，不引入该缓存路径依赖。版本查询证明所选程序可运行，不证明 extension 迁移或真实宿主行为通过。

## 维护源、实际入口与差距

| 对象                | 实际读取结果                                                                                                             | 后续职责                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 公开分发入口        | `packages/skills/script/index.mjs` 存在，仅作平台调度                                                                    | 沿现有入口完善，不新增子命令                               |
| 命令注册源码        | register-commands 的 Bash/PowerShell 仍要求 tutor/pair/direct/increment 四来源；Bash modes 数组为四项                    | TV-11 后缩减到 Increment，当前不执行                       |
| hook 注册源码与配置 | 注册器仍列七旧项；extensions.yml 的 installed 为七项加 modes，before_implement 实际为 mvu-gate 和可选 explainer-doc-sync | 准备/分析/结案新集合及六旧 hooks 退役待原任务              |
| 官方 modes 登记     | `.specify/extensions/.registry` 登记 codex 四命令，registered_skills 为空；modes/extension.yml 要求 CLI==1.2.6           | 登记内容与真实生成目录分别清点，不推定注销能力             |
| 新准备与分析来源    | `workflow/implementation-preparation/SKILL.md`、`workflow/artifact-spec-analysis/SKILL.md` 当前不存在                    | T103/T104 与 T062/T063 尚需实施；不声称已发现、加载或拦截  |
| 生成入口实际目录    | `.agents/skills/speckit-modes-{tutor,pair,direct,increment,review,guide,explore}/SKILL.md` 七份均存在                    | 后三项不在当前四命令登记清单内，归属和去留需迁移前核实     |
| 原始工作区副本      | `.agents/skills/task-{tutor,pair,direct,increment,review,guide,explore}/SKILL.md` 七份均存在                             | 发现根尚未按当前来源分离设计归位；不删除来源冒充暂停       |
| 治理与模板          | 宪章已为7.0.0，保留6.1.0→7.0.0影响报告；轻量Task与独立方案已生效                                                         | T102复核治理输入与规则，不重复升版；准备skill/hook仍未交付 |

四模式维护源与 dist、工作区原始副本、官方扩展内来源逐目录比较完整相对文件集合及 SHA-256，结果保存在[采集快照](fixtures/implementation-preparation-baseline.json)。Increment、Direct 各1文件及 Tutor 的2文件在三层均与维护源一致；Pair 的 dist 与维护源一致，但工作区及官方扩展来源的 SKILL.md 均落后。实际差异包含旧子任务措辞、未读取同级 MVU 和旧宪章锚点，不能把这些副本当 T065 最新交付；本轮保留文件，三模式不进入本期能力补测。

上述比较针对维护源和来源副本。官方生成入口重建 frontmatter，本轮只核对存在、路径与登记，不以整文件字节不等推断异常，也未声称已经验证生成正文或附件引用实际可读。

## Task 身份与可复用证据

扫描整个 tasks.md 的正式 checkbox 行，实际共107条、ID各出现一次；全部占用编号为T001～T107，无缺号，最高T107。采集时43条已勾、64条未勾，其中：当前有效50项＝17完成＋33待办；三模式暂停9项＝6原完成＋3原待办；历史T001～T048另48项＝20原完成＋28原待办。此处是开始T101前的静态快照，后续进度只读取 tasks.md。

当前17个可复用完成身份是 T049～T054、T081～T085、T087～T092。暂停的6个原完成身份是 T055～T059、T065。当前完成区及暂停区23个原完成块均采集原字节摘要；不重新编号、重开任务或用暂停记通过。

已检查23个原完成块直接引用的20个不同 analysis 文件，均存在；这项存在性检查不等于全部内容、旧锚点和当前需求均已验收。可复用范围如下：

| 依据                                                                                   | 本轮可复用范围                           | 本轮不能抵扣的结果                     |
| -------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------- |
| [T049基线](revision-baseline.md)                                                       | 原调查方法、原完成保护和发生时事实       | 当前版本、实际新范围或新迁移验收       |
| [MVU治理](mvu-governance.md)、[Increment交付](mvu-increment.md)                        | T083～T085已发生的独立MVU治理/读取与骨架 | 7.0.0复核、当前共同准备及最终来源行为  |
| [内联任务核验](task-inline.md)、[清理骨架](cleanup-validation.md)                      | 原身份保护、恢复与必要收尾的已有证据     | 新轻量清单/独立方案的 T105 验收        |
| [描述能力](tv-06-description.md)、[正式入口消费](increment-description-engineering.md) | T087～T089的原可选描述逻辑和隔离消费     | 当前无Task参数、缩减模式与最终来源复验 |
| [独立coding规则](tv-07-business-delivery.md)、[触发核验](trigger-discovery.md)         | T090～T092的原来源和自身触发核验         | T093/T094、真实宿主自动加载及共同准备  |
| Pair/Direct/Tutor 原证据                                                               | 保存原工程事实和纠正过程                 | 当前三模式专项、跨模式或真实使用测试   |

原技术验证和原认可仅在各自范围复用。TV-10/11/12尚无本轮实际通过证据；T104/T105等下游不得跳过其真实前置。T080继续是唯一末尾综合收尾任务。

## 已有改动与保护方法

采集时工作区已有暂存的 `.codex/config.toml`、Nuxt MCP 对话摘要，以及未暂存的宪章/独立提示词/profile、两份 skills Spec、调度中心规范/代码和新增材料；`a.md` 为暂存新增而工作区删除，旧根业务/逻辑图也已删除。本轮保留这些状态，不恢复删除、不整理暂存区，不将这些既有内容归为本轮成果。

写入前采集337个文件的SHA-256，包括已有变更文件、相关维护源/脚本、工作区副本、官方扩展、原生入口/模板、治理与指针；完整摘要见[静态采集快照](fixtures/implementation-preparation-baseline.json)。原tasks全文、status原始输出与暂存区核对材料暂存于 `/tmp/foundry-foundation-t101-20261110/`，只服务本轮核对，不能依赖其长期存在。

采集时 `git ls-files --stage -z` 的SHA-256为 `8ac0c3ca33cccc718e1fba4c2fc770e289d803b12df88c0b0de8c66fa00c036f`。完成前须核对暂存区不变、任务外受保护字节、原完成块与历史原文，并核对本轮方案/证据及原任务链接。快照只作一次静态证据，不参与安装状态或生成新的工程进度来源。

首次保护断言实际失败，定位到 `.specify/memory/user-shadow/conversations/2026-11-10-distribution-t055-discussion.md` 在采集期间被其他操作追加讨论。已读回该文件并核对本轮写入范围：本轮未写该路径，暂存区未变，其他336个受保护文件一致；不覆盖、回退或重算原摘要掩盖差异。后续又观察到该路径继续追加，按某一次新摘要要求其保持静止的断言再次失败。采集快照的 concurrent_observations 保留原摘要和两次观察；该持续并行写入路径单独清点，本轮不写入或回退，不断言其后续字节冻结或已完整审计。其余受保护路径仍严格比较。本结论仅说明本轮工具写入范围，不能识别其他操作者身份。

## 验收与边界

实际版本查询返回上述结果。方案、基线及采集JSON分别执行 `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix <实际文件>`，任务回填后对tasks.md执行同一命令，均退出0；参数仅关闭运行前依赖检查，避免核查触发安装，不改项目配置。15个新增资料引用存在，107个原ID保持；逐字比较确认只有T101块及顶部相应计数改变，其他Task、23个原完成块与历史原文保持。任务外336个受保护文件中335个摘要保持，1个持续并行写入文件如上单列；暂存区摘要、历史未勾清单和已有删除状态均保持。两次并行文件断言失败及定位已如实保留，不改写成首次通过。

任务勾选后，当前有效身份为18完成、32待办。完整采集仍保留开始前事实，不将静态证据改成实时状态。本轮执行after_implement的explainer-doc-sync引用校验：没有明确知识点或本轮新建/复用说明，原任务知识引用集合未变，无须新增空节。

没有业务源码改动，因此不执行包代码测试、类型检查或构建；这些命令不能验证本任务的版本与保护观察。后续真实代码改动仍按项目要求验证。PowerShell、Windows/macOS、最低Node、官方缩减迁移与真实宿主行为未测，不能据本基线认定这些链路可用；分别由后续原Task取得证据。

本任务的结果是可审阅基线，不是共同准备交付或阶段批准。下一项是T102复核已生效宪章；T103隔离候选的实现与真实宿主验证仍需自己的有效讨论方案。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
