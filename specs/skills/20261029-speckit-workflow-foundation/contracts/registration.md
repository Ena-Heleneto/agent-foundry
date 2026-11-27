# 契约：Increment、共同准备与官方受管迁移

2026-11-12执行分工：[用户已指定发布与挂载由其他会话处理](../requirements/raw/2026-11-12-publishing-mounting-other-session.md)。本契约继续定义所需结果，本会话跳过T070/T097/T072的安装入口、挂载编排与实际迁移实现；不修改相关脚本，不擅自触发发布或真实挂载。其余工作流验收引用实际交付版本/产物/命令与结果，交付未核实不作为依赖已满足。

更新：2026-11-12。来源：[计划](../plan.md)、[研究 R53](../research.md#r53保留-modes-身份官方缩减至-increment)。[T067 Bash职责](../analysis/acceptance/bash-registration.md)已交付，PowerShell接入已按[用户要求](../requirements/raw/2026-11-12-remove-powershell.md)移出本期，T068/T098废弃；Bash完整编排及真实迁移仍由原后续任务承接；原T072及七旧hooks事实按[历史证据](../analysis/acceptance/managed-migration.md)保留，不抵扣新范围。

## 公开入口和共同前置

唯一公开分发入口为 node script/index.mjs [参数]，无install/mount/hooks/commands子命令。Node ≥22.20.0仅选择平台并转发参数、cwd、stdio、退出及取消；本期内部Bash核对已选择来源并调用官方CLI；T070须取消遗留PowerShell调度，对不支持的平台明确报错，不把保留的.ps1视为当前支持。版本由FOUNDRY_SPECIFY_VERSION或默认1.2.6选择，不能无标注地用PATH中1.3.3代替默认验收。

Implement保留原生；共同准备由可发现的implementation-preparation及before_implement接入，不生成第五模式或统一路由。modes只声明Increment，取消三暂停模式和四项齐备前置；只要本次选择的Increment来源齐全即可，不补装三模式。

## 目标集合与阶段顺序

| 类型          | 本期来源及事件                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| modes         | task-increment → speckit.modes.increment，沿同一modes扩展身份强制重装                                  |
| hooks-only    | implementation-preparation → before_implement，无非空condition、optional:false                         |
| hooks-only    | artifact-spec-analysis → after_tasks，Increment显式复用，无after_increment                             |
| hooks-only    | artifact-project-description → 现有结案事件，真实结案条件保持                                          |
| 删除来源/暂停 | task-pair、task-tutor、task-direct按2026-11-12指令删除源码与附件，不生成/注册/重装，不参与本期能力测试 |

完整初始化刷新本次所选来源→核验并安装所选适用hooks→Increment命令；前置全部成功或明确不适用才进入命令阶段。缺本次必需正文/附件/配置在首次官方调用前失败；部分选择不从旧环境凑数，也不因缺未选或暂停技能阻塞。未初始化不自动创建Spec Kit，来源安装/--no-mount不等于工作流可用。

hooks从已安装技能同目录speckit-hooks.json读取并原样形成临时hooks-only扩展，逐项官方强制重装；无集中definitions、自有YAML合并、手写registry、持久所有权/指纹或安装状态。真实失败退出、已完成和未运行阶段分别报告，不承诺多阶段原子回滚。

2026-11-11的分析来源接入沿现有集合约定：正式artifact-spec-analysis正文位于src/workflow，after_tasks唯一声明在workflow/collection.config.json，不恢复逐技能配置。上段保留旧注册脚本的实际输入边界；读取集合声明的正式脚本适配与完整挂载仍由原注册任务承接。T063只从真实集合声明准备临时官方hooks-only输入做隔离复验，不新增生产转换器，也不以此宣称当前旧脚本已兼容。

2026-11-12，T067按已展示方案及用户「同意」在Bash侧接入当前集合输入：hooks使用明确的`--collection-config <集合JSON>`，可重复`--skill <当前hook>`选择子集，无该选择参数时为当前三项默认集合；不从旧目录推断选择，不补缺未选来源。命令模块的skills-dir指向Increment非发现根。Bash两模块共用同版只读预检，使用既有jq 1.8.1及获准新增的yq 4.54.3，校验官方二进制摘要后只读取YAML/JSON；目标配置修改仍只由Specify完成。完整编排接口仍由T070承接，不能据此宣称其已更新。用户随后移除PowerShell接入，T068/T098废弃；历史PowerShell源码与未测记录保留。

生产归属检查不消费T066测试基线：从当前登记和明确声明准备精确旧输入，通过同版官方在自有临时项目重现模式生成结果，与受影响目录比较完整字节及文件集合。未知文件、生成正文改写、孤立有效hook或目录不能自动认领或清理。自有临时重现与真实目标变更分别报告，缺输入不进入目标变更阶段；每次新建临时输入，成功/失败只清理本次自有目录。不新增持久所有权、指纹或安装状态。

## 来源、发现与附件

维护源与dist继续保留完整交付，script只复制不执行，不维护包根extension.yml、commands模板或嵌套package.json。准备skill需要自然语言发现，保留正常官方技能根；task-increment维护来源采用所选作用域官方根追加-speckit-sources的同级候选目录，正式speckit-modes-increment由官方生成。该候选仍须TV-08当前子集核验，项目和全局作用域不混用，挂载始终明确目标项目。

三暂停模式源码及附件按2026-11-12[用户指令](../requirements/raw/2026-11-12-delete-paused-sources.md)删除；旧安装副本只核对和保护，后续由原迁移任务处理，不能从旧副本恢复新来源。Increment来源/发现分离仍由T097接续，未知内容不删。

coding/business-node-delivery维持独立安装和正常发现；不向准备/Increment添加其链接、显式调用或依赖，不将coding/frontend一起隐藏。其普通项目通用性及授权边界保持。

源→dist→安装来源→官方扩展来源/附件核对完整集合及摘要；生成入口与同版官方渲染的name、description、正文及引用变换比较，不要求重建frontmatter后整文件等于源。附件必须真实可读；如需要顶层references桥接，用最小实际附件验证，不为暂停Tutor新建附件工作。发现匹配、完整读取、实际行为和用户验收分别留证。

## 已知受管迁移清单

| 对象                         | 官方操作与保护                                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 旧modes的三/四/五入口登记    | 精确清点后以仅Increment的临时声明对同ID force更新；官方按旧登记注销后重建，核对三暂停及Review/Guide/Explore的实际去留                                                      |
| 六退役扩展ID                 | artifact-issue-description、artifact-pr-description、mvu-gate、artifact-business-flow、artifact-logic-flow、explainer-doc-sync，正式登记存在才逐项官方remove，历史产物保留 |
| artifact-project-description | 保留原结案职责并按选择更新，不因旧关键字出现退役                                                                                                                           |
| 孤立原始副本/生成目录        | 只按已核实官方归属处理；不能借源码删除推定副本消失，不手改registry或YAML凑通过                                                                                             |
| 无关扩展、未知附件和用户修改 | 保留；官方调用前发现整目录删除风险时停止受影响对象并报告具体路径及恢复条件                                                                                                 |

官方force可能先remove旧扩展，注销可整目录删除生成技能；因此调用前必须只读核对旧manifest/registry、精确目录与可审阅文件集合。出现额外用户附件、未知来源或归属不清时不能直接调用破坏性迁移。正常对象不增加重复请批流程，失败仅限制受影响链。

若force无法完整清理，保留结果并核实官方remove/add恢复路线；无登记孤立残留不得假装已删除。重复初始化不恢复三暂停入口、六退役hooks或旧别名，无关内容和历史保持。此清单只服务一次迁移，不是日常全目录prune系统。

## 官方能力和最小验证

缓存1.2.6源码支持同IDforce先remove，再按旧registry注销；本轮只读，不是实际迁移结果。[TV-11](../quickstart.md#tv-11官方缩减挂载与保护)须在隔离项目验证缺源零调用、旧集合缩减、重复更新、未知内容保护和中途失败传播。TV-10另证明共同开工条件，挂载成功不抵扣实际阻断。

原T066～T075、T095～T100的未完成安装/来源/平台/真实消费职责由下一次Tasks收敛，原完成事实不重开；分发Spec消费同版材料并独立记证，不自动互相勾选。

## 提前交付 Direct 入口（2026-11-08）

**历史参考，暂停模式不作为当前前置。** 以下保留当时决定和证据，不要求本期继续其四模式实现或测试。

为满足用户先挂载再验收的要求，[T072](../tasks.md#t072) 先调用工作区既有内部命令注册模块，只更新 modes；仍核验并一次注册 Tutor/Pair/Direct/Increment 四份当前来源及附件，不增加 Direct 单选开关、临时别名或额外扩展 ID。当前来源可挂载不表示 Tutor/Pair 的待修行为已通过。

本次为有明确范围的 modes 更新，hooks 阶段不适用：既有 hooks 保持并列为尚未迁移，不安装缺失的新分析、不移除六旧 hooks，也不宣称完整初始化成功。后续完整刷新仍严格遵守来源→适用 hooks→四指令顺序及原缺项失败规则。

真实调用前先在隔离项目验证 TV-01 的 modes 子范围：五变四、四份正文及附件同版、未知附件调用前停止、无关扩展与 hooks 保留、重复重装、缺来源零调用和官方失败传播。保存原骨架供 T066 后续扩充六 hooks 和完整刷新验证；本子范围通过不勾选 T066 或 T072 全项。实际项目仍须清点受影响目录、保护用户未提交内容，官方生成项只能由 CLI 更新。
