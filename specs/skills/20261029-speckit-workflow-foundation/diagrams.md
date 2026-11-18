# 技术图与导航：共同准备、轻量规划与当前交付

<a id="2026-11-18-主-ai-先保存原文再分析"></a>

## 2026-11-18 原文读回后的四个 Skill 调用

维护位置拟定为 `packages/skills/src/profile/{conversation-recording,conversation-summary,conversation-analysis,shadow-profile}/SKILL.md`。当前摘要与分析都使用同一批已读回原文，触发条件各自判断。原文确认后的协作、摘要和分析可以各自推进。

```mermaid
flowchart TD
    A["主 AI 加载对话落盘并保存可见发言"] --> B{"存在读回相符的新增原文？"}
    B -->|有| C["交付已确认原文及其来源范围"]
    B -->|无| G["说明实际缺口，继续协作"]
    C --> D["子代理运行对话摘要，保存来源与摘要覆盖"]
    C --> E{"命中独立分析条件？"}
    C -.-> G
    E -->|是| F["分析子代理读取原文并保存结论"]
    E -->|否| H["原文留作后续分析"]
    F --> I{"结论已读回且足以改变画像？"}
    I -->|是| J["主 AI 自动调用影子画像，更新并读回入口"]
    I -->|否| K["记录分析实际覆盖"]
```

大白话是原文可靠保存后，摘要和分析各做各的。普通问答也有记录和摘要，只有符合条件的分析才会启动。画像更新取决于已经确认的认识变化，主 AI 在更新期间可以沿用最近有效入口。下一轮仍可见的上一轮真实 final 可以补存。

## 2026-11-18 两个会话的资料提交

计划位置为四个 Skill 的保存与恢复段落，以[契约](contracts/shadow-profile.md#保存查询与恢复)和[资料模型](data-model.md#共享提交与失效)为准。下图描述项目内共享文件的写入判断。

```mermaid
flowchart LR
    A["在互斥区间外准备增量"] --> B["进入同根短时提交区间"]
    B --> C{"来源与资料代次仍有效？"}
    C -->|否| D["拒收失效部分，记录实际缺口"]
    C -->|是| E{"目标基线和更正仍相符？"}
    E -->|否| F["释放后重新读最新资料并合并"]
    F --> A
    E -->|是| G["写入并读回，释放短时互斥"]
```

大白话是写之前再看一次有效来源和当前文件。别人先保存时，从最新内容合并。遗忘先让旧来源失效，晚到的摘要或分析也检查同一条件。实际互斥及两会话交错由 TV-14 取证。

以下 11 月 14 日及更早的图保留当时的接入方案和证据范围。[旧事件图](history/retired-shadow-runtime-2026-11-18/diagrams.before.md)

## 2026-11-14 影子画像：源码复制与项目接入

计划来源：`packages/skills/src/profile/shadow-profile/SKILL.md`；复用位置：`scripts/dev/actions/link-skills/link-skills.sh`；项目副本：`.agents/skills/shadow-profile/`。本图是计划，不代表来源已创建或宿主行为通过，正式安装留待主线完成。契约见 [shadow-profile](contracts/shadow-profile.md)，操作见 [TV-13](quickstart.md#tv-13影子画像源码复制与每轮行为)。

```mermaid
flowchart TD
    A["获准编写同一技能来源"] --> B["既有脚本精确复制单一集合"]
    B --> C["核对全部正文与必要附件"]
    C --> D["项目规则短引用，指定资料根"]
    D --> E["新会话，每轮读正文并执行"]
    E --> F{"正常三轮均真实调用并保存？"}
    F -->|是| G["完善同一来源，重新复制后复验"]
    F -->|否| H["保留现场，必调用交付未成立"]
```

大白话：复制只是把来源放到技能目录；项目短引用负责明确每轮调用，真实轨迹才证明执行。主线构建和安装器不在这条近期链路中，不能用“文件放好了”替代每轮验证。

## 2026-11-14 影子画像：保存、缺档与恢复

计划规则位置同上，内容关系见[增量模型](data-model.md#2026-11-14-影子画像增量模型)。本图只说明记录保存与故障恢复，不表示工程 Task 或独立状态服务。

```mermaid
flowchart TD
    A["读当前资料，核对真实轮次来源"] --> B["先保存已发生摘要"]
    B --> C{"有有效新认识？"}
    C -->|否| F["检查读回，正常答复"]
    C -->|是| D["保存有来源和情境的结论"]
    D --> E["影响当前理解时更新画像"]
    E --> F
    B -->|保存失败| G["保留已写部分，答复提示具体缺档"]
    D -->|保存失败| G
    E -->|保存失败| G
    G --> H["正常协作继续，条件恢复后重读"]
    H --> I{"缺档来源仍可核实？"}
    I -->|是| J["只补缺项，不重复建档"]
    I -->|否| K["保留缺档，不编造历史"]
```

大白话：摘要是发生过什么，结论是有依据的认识，画像是当前有效理解。保存失败不阻断正常回答，多文件部分成功不会自动回滚；同一资料根串行写，旧会话先重读再合并，不保证任意并发事务。

更新：2026-11-10。来源：[计划](plan.md)、[准备契约](contracts/implementation-preparation.md)、[模型](data-model.md)、[注册契约](contracts/registration.md)。图示是设计，不表示实际宿主/挂载/业务验证已通过。每图一事，plan不塞流程图；小闭环内容以[mvu.md](mvu.md)为准。

当前逐功能阅读入口见[功能说明](analysis/spec-analysis/README.md)，其[业务判断与里程碑流转](analysis/spec-analysis/flows.md)只补阅读关系；技术职责、调用及保存恢复继续复用本页既有图示，不维护冲突副本。分析本身不代表工程或用户验收。

2026-11-14 后置分析衔接：任务图已[补入 P0 源码复制链](diagrams/logic-flow.md#2026-11-14-p0-增量us14-源码复制先行)，当前增加 T108～T112 并以 T112→T080 汇合，旧依赖保留；下段 50 项/86 条等统计保留其当时范围，不能作为本增量计数或实施证据。影子画像的技术职责/保存图仍复用本页开头两图，不新增重复流程。

当前[业务图](diagrams/business-flow.md)由after_plan按新范围刷新；[任务逻辑图](diagrams/logic-flow.md)已随本轮Tasks刷新，覆盖50项有效身份及86条显式依赖；17项完成事实只作前置引用、33项待办按真实依赖推进，9项暂停不进入当前阻塞边。[旧状态图](diagrams/state-transitions.md)只作历史来源。

## 共同准备的实际消费路径

```mermaid
flowchart TD
    A["原生Implement进入"] --> H{"hook配置可执行？"}
    H -->|是| P["完整加载共同准备"]
    H -->|解析失败或条件跳过| C["原生仍可能继续，读取有效宪章"]
    C --> P
    P --> T["准备进入某个原Task，核对该Task方案"]
    T --> V{"认可来源、保存、前置和授权有效？"}
    V -->|否| D["仅讨论或修复，停止受影响业务实施"]
    V -->|是| I["在有效范围沿原生流程实施"]
    I --> N{"进入下一或并行Task？"}
    N -->|是| T
    N -->|否| R["验收与续接仍回原Task"]
    M["缺宪章、skill或宿主未消费"] --> F["已知风险：不得宣称已拦截，真实行为必须验证"]
```

大白话：宪章是工作流共同条件，hook只是提前叫出准备。实线表示候选应遵守的流程，不代表有程序锁；原生模板缺宪章可跳过，真实宿主必须证明读取及每Task停止，否则TV-10失败并回到设计。

计划位置：.specify/memory/constitution.md的后续修订、packages/skills/src/skills/workflow/implementation-preparation/；原生消费事实在.agents/skills/speckit-implement/SKILL.md第93～100行及任务循环。验证见[TV-10](quickstart.md#tv-10共同准备逐-task-与异常停止)，不修改该生成副本。

## Task、方案与唯一工程状态

```mermaid
flowchart LR
    T["tasks：轻量原Task及唯一工程checkbox"] --> P["implementation：该Task的一份方案"]
    P --> U["真实讨论认可与工程依据"]
    P --> E["原证据和恢复条件"]
    M["mvu：局部业务结果及状态依据"] --> T
    A["分析：逐功能简洁说明及导航"] --> M
    A --> P
```

大白话：讨论文件解释如何按认可思路实现，工程完成仍只在原Task判断。MVU摘要和分析不是第二份工程进度，文件存在也不是用户已认可。

产物位置：所属Spec的tasks.md、implementation/<Task ID>.md、mvu.md及analysis/spec-analysis/；[准备契约](contracts/implementation-preparation.md)规定真实形成后才保存方案，不提前制造确认。

## 四正式入口与非发现来源

旧四入口定位保留用于历史引用；本期只交付Increment正式规划入口与可发现的共同准备，三模式研发/生成/测试暂停。当前关系如下。

```mermaid
flowchart LR
    S["同版维护源与必要附件"] --> B["既有构建复制完整内容"]
    B --> P["共同准备在正常发现根"]
    B --> I["Increment来源与正式入口分离"]
    P --> H["官方before_implement接入"]
    I --> C["官方只生成Increment模式"]
    H --> R["实际加载、定位与逐Task核对"]
    C --> R
    U["独立coding与无关技能"] --> V["维持自身发现及授权，不加模式依赖"]
```

大白话：维护源、安装和实际读取是不同步骤；图中“核对”须有真实宿主证据，登记hook不代表已经停止无方案实施。准备保持可发现，Increment来源布局仍须TV-08当前子集验证。

计划位置：packages/skills/src/skills/workflow/implementation-preparation、task-increment及script/register-hooks、register-commands、install-skills、mount-entry、工作区link-skills。来源/附件见[注册契约](contracts/registration.md)，均未因图示而通过。

## 通用规则：节点验证与页面依赖

```mermaid
flowchart TD
    A["读取当前业务目标与原任务，选定小节点"] --> B["核对已有数据及必要前置，适用成果直接复用"]
    B --> C["实现或复用接口甲"]
    C --> D{"甲的正常及适用异常/权限验证通过？"}
    D -->|否或未执行| E["记录证据，停止依赖甲的步骤"]
    E --> F["修复并实际复验"]
    F --> D
    D -->|是| G["保留甲的证据，继续页面所需接口乙"]
    G --> H{"乙及页面其他必要条件通过？"}
    H -->|否| I["只处理缺项，不宣称页面可交付"]
    I --> H
    H -->|是| J["汇合接入正式页面，验证其业务交互"]
    J --> K["按原业务条件判断所属 MVU，不由接口数汇总"]
    U["无关且前置具备的原任务步骤"] --> V["独立继续，不因甲失败冻结"]
```

大白话：接口甲只是这次能单独验证的小范围，MVU 是它服务的业务闭环；甲通过后仍要等待页面所需的乙及其他条件。验证方式按职责选择，已有数据可复用，无数据或页面职责的节点说明不适用，不凑齐所有层。图展示一种有依赖的推荐路径，不强制无依赖接口串行。

计划来源：packages/skills/src/skills/coding/business-node-delivery/SKILL.md；节点与实际证据归原 Task 内步骤，关系见 [通用契约](contracts/business-node-delivery.md) 和 [TV-07](quickstart.md#tv-07通用业务节点实施顺序)。本图说明设计关系；独立来源及隔离样例的实际结果见 [TV-07 证据](analysis/acceptance/tv-07-business-delivery.md)，不以图示认定整个业务或后续模式已通过。

## 通用规则：自身触发与上下文职责

```mermaid
flowchart LR
    S["独立coding技能自身description"] --> M{"当前业务请求匹配？"}
    M -->|否| X["沿原项目流程，不触发"]
    M -->|是| L["实际完整读取规则"]
    L --> P["普通项目沿自身材料"]
    L --> I["Increment只规划，或Implement按认可方案实施"]
    P --> R["原任务记录节点结果，不新建工程状态"]
    I --> R
```

大白话：description用于发现，实际读取和行为还须分别验。business-node-delivery维持独立通用性，准备和Increment不增加其链接、显式调用或安装依赖；三模式上下文测试暂停。

来源位置：packages/skills/src/skills/coding/business-node-delivery/SKILL.md；既有构建和动态发现复用，[TV-07](quickstart.md#tv-07通用业务节点实施顺序)只消费当前适用子集。

## 可选描述的规划顺序（2026-11-09，待实现）

```mermaid
flowchart TD
    A["定位Spec与可选描述，读取材料"] --> B{"已有正式方案？"}
    B -->|否| C["报告缺 plan，保持规划只读"]
    B -->|是| D{"有本轮规划描述？"}
    D -->|否| E["沿既有推荐，复用已保存事实"]
    D -->|是| F["提取业务顺序、验收衔接和步骤偏好"]
    F --> G["结合项目补全，标清事实和假设"]
    G --> H{"有影响范围或验收的关键冲突？"}
    H -->|是| I["说明影响，相关部分等待澄清"]
    H -->|否| J["形成可验收小业务闭环"]
    I -->|条件明确后| J
    E --> J
    J --> K["复用或生成轻量Task，详细方案开工前讨论"]
    K --> L["保存并读回，明确部分失败"]
    L --> M["调用同一分析；缺失时单列未完成"]
```

大白话：描述是用户的思路，未必是完整方案；AI 补足有依据的缺口，不能把猜测当用户确认。先明确每一小块业务怎样算做成，再安排工程步骤；已有代码可直接复用。

计划位置：packages/skills/src/skills/workflow/task-increment/SKILL.md；输入输出契约为 contracts/increment-description.md；验证路径为 T087→T088→T089。本轮未执行新行为，不由图示推导技术通过。

## Increment 的材料分支

```mermaid
flowchart TD
    A["收到Increment，可选规划描述，无Task参数"] --> B["明确 Spec 或唯一上下文"]
    B --> C{"是否存在 plan"}
    C -->|"否，包括孤立 tasks"| D["提示先规划，不进入实现"]
    C -->|"是"| E{"是否存在 tasks"}
    E -->|"否"| F["详情写入 mvu，文件链接回 plan，再生成 tasks"]
    E -->|"是"| G["核对实际实现和证据，保留原 ID"]
    G --> H["更新 mvu 详情、任务正文与 plan 文件级引用"]
    F --> I["检查链接、格式与保存读回"]
    H --> I
    I --> J{"保存是否成功"}
    J -->|"否"| K["报告已写未写，停止受影响步骤"]
    J -->|"是"| L["显式复用同一综合分析技能"]
```

大白话：plan 是总体方案及文件级引用，mvu.md 是四项小闭环说明，tasks 是工程工作与进度；业务闭环是一项能观察并判断完成的用户结果；ID 是原任务标识，重排不等于换身份。

代码位置：packages/skills/src/skills/workflow/task-increment/SKILL.md（T052 已建立最小骨架，完整实现和集成按后续任务验收）；产物位置：所属 Spec 的 plan.md、mvu.md、tasks.md、analysis/spec-analysis/README.md。

## 技术验证只约束依赖步骤

```mermaid
flowchart TD
    A["为一个业务结果核对技术假设"] --> B{"命中四类风险且无适用证据"}
    B -->|"否"| C["注明依据，继续相应工程步骤"]
    B -->|"是"| D["先做必要最小技术验证"]
    D --> E{"验证结果"}
    E -->|"失败"| F["记录失败并调整路线，阻止依赖下游"]
    E -->|"通过"| G["保留骨架，增量实现业务步骤"]
    C --> H["按业务验收判断结果"]
    G --> H
    I["不依赖失败假设的其他工作"] --> J["按自身条件继续"]
```

大白话：技术假设是“这个方案依赖某能力可用”的判断；验证骨架是已证明可用、后面继续扩充的小实现。技术验证通过不能代替业务结果完成。

规则位置：.specify/memory/constitution.md 第III条；独立 mvu 治理及部分工程已有证据，完整消费仍待 T086；计划消费代码位置：task-increment、共同准备及原生Implement；证据由原 Task 链接 analysis/acceptance/。

## Tutor 的单 Task 补齐边界

**暂停参考**：以下原图保留当时定义，本期不研发、不执行此测试或要求恢复。

```mermaid
flowchart TD
    A["指定并读取原 Task"] --> B{"plan 是否存在"}
    B -->|"否"| C["提示先完成 plan"]
    B -->|"是"| D{"mvu 或旧 plan 是否已有 MVU"}
    D -->|"是"| E["沿用详情，按契约维护 mvu，拓展原 Task"]
    D -->|"否"| F["复用 Increment 规则，只检查该 Task 范围"]
    F --> G{"范围内能形成业务结果"}
    G -->|"否"| H["说明限制和外部依赖，不扩围"]
    G -->|"是"| E
    E --> I["用户主要实现，AI 讲解与反馈"]
    I --> J["工程、学习、报告分别留证"]
```

大白话：补齐是在当前任务边界内说明业务结果，不把其他任务收进来；外部 Task 只作为先做什么的引用。AI 代写一个局部不改变后续默认分工。

代码位置：packages/skills/src/skills/workflow/task-tutor/SKILL.md（待重构）；资料位置：原 tasks.md 段、learning/<Task ID>/，正式共同报告位于 personal-hub 既有博客。

## 多文件保存与恢复

```mermaid
flowchart TD
    A["读取原文件、当前 Task 与实际证据"] --> B["执行当前范围动作"]
    B --> C["串行保存必要资料与引用"]
    C --> D["检查覆盖、格式与读回"]
    D --> E{"是否一致且依据充分"}
    E -->|"否"| F["报告已写未写及影响，不标完成"]
    F --> G["核对现场并修复保存条件"]
    G --> A
    E -->|"是"| H["更新有证据结果及下一动作"]
    I["中断或重复请求"] --> A
```

大白话：读回是确认文件实际写对；多文件没有自动事务，失败不假称全部撤销。工程状态只在原 Task，学习资料和分析只引用；受影响步骤先停，无关工作按自身条件处理。

代码/规则位置：共同准备、Increment及工作流宪章第VII条（新规则尚待正式修订）；产物位置：plan/mvu/tasks、learning、analysis/acceptance，不建立 state.json。

## 受管迁移与安装顺序

```mermaid
flowchart TD
    A["一次性精确清点已知旧项与官方登记"] --> B{"发现未知或用户内容"}
    B -->|"是"| C["调用前停止受影响迁移并报告路径"]
    B -->|"否"| D["来源和附件完整核验，技术前置已通过"]
    D --> E["官方移除已登记六旧扩展"]
    E --> F["安装所选适用 hooks"]
    F --> G{"全部成功或不适用"}
    G -->|"否"| H["报告已完成与未运行，不进 commands"]
    G -->|"是"| I{"所选Increment来源及附件同版齐备"}
    I -->|"否"| J["安装事实保留，命令挂载缺项"]
    I -->|"是"| K["官方同ID重装仅Increment，核对旧三模式实际去留"]
    K --> L["核对新入口、旧入口失效与无关内容"]
```

大白话：hooks 是阶段动作，commands 是主动调用入口；force 交给官方按来源重装。清点只为本次旧项迁移，不变成日常全目录扫描或持久所有权系统；官方卸载不天然保护目录内额外用户附件。

代码位置：packages/skills/script/register-hooks/、register-commands/ 及 scripts/dev/actions/link-skills/（待更新）；声明来源：准备、分析、结案三项来源同目录speckit-hooks.json；精确范围见 [注册契约](contracts/registration.md)。

## 影子摘要与结论更新

```mermaid
flowchart TD
    A["本轮实际表达和工具结果"] --> B["回复前保存必要摘要及理由"]
    B --> C{"是否形成新结论或纠正"}
    C -->|"否"| D["沿用当前描述"]
    C -->|"是"| E["提炼结论，关联来源和适用情境"]
    E --> F{"是否影响整体理解"}
    F -->|"是"| G["更新 profile 并引用结论"]
    F -->|"否"| D
    H["新会话、中断或画像变化"] --> I["读取当前描述，按需查依据"]
```

大白话：摘要保留发生经过，结论提炼有效理解，profile 是当前协作描述。只服务本仓库；没有后台监听，不提前编造未来回复，技术选择不自动成为永久偏好。

规则/位置：项目 AGENTS.md 的仓库协作记录约定；工作流宪章及独立提示词不复制仓库画像规则；实际资料：.specify/memory/user-shadow/conversations/、conclusions/、profile.md。

## 清理记录的保存与完成判断

```mermaid
flowchart TD
    A["读取原收尾 Task、对象及用途依据"] --> B{"用途是否明确"}
    B -->|"否"| C["保留内容，记录位置、原因、后续条件"]
    B -->|"是，仍有效或受保护"| D["保留并记录核查依据"]
    B -->|"是，确认可清理"| E["仅处置有依据的文件或局部内容"]
    C --> F["保存记录，执行必要验证、引用检查并读回"]
    D --> F
    E --> F
    F --> G{"应清理项已处理且检查通过"}
    G -->|"否"| H["报告已写未写，不标完成，修复后续接"]
    H --> A
    G -->|"是"| I["记录清理部分完成或无须清理"]
    I --> J["仍按原 Task 其他验收判断整体完成"]
```

大白话：对象既可是一份文件，也可是文件中的代码段、文档段落或注释；“保留待核实”说明资料还在，并不表示已删除。所有候选逐项核对后才汇总清理结果；无须清理也有核查依据，清理部分完成不等于整个需求结束。

计划规则位置：.specify/memory/constitution.md 第 VII 条（当前7.0.0继续保留原清理要求）；消费位置：task-increment/SKILL.md 及原生任务生成流程读取目标治理。记录位置：原 tasks.md 收尾任务、计划中的 analysis/acceptance/cleanup-validation.md 与 T080 的 revision-summary.md；字段见 [模型](data-model.md#清理对象与记录约束)。MVU-007/TV-04 已映射到 [T081 治理](tasks.md#t081) 与 [T082 隔离验证](tasks.md#t082)，tasks 的依赖图已包含它们以及 T053/T054/T080 的阻塞边；原治理/隔离结果按 T081/T082/T054 证据范围复用，T080 实际清理及新文档消费仍待实施。本图说明保存与完成判断，不替代有双路径冲突的历史业务图。
