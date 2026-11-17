# 研究记录：Implement 共同准备与当前分发边界

## 2026-11-17 当前纠正：记录由新对话触发

[用户纠正](requirements/raw/2026-11-17-record-on-dialogue.md)明确CLI停止就结束记录，主动退出可能中断尚未完成写入；不要求退出前收尾或关闭后补录。R65原先的独立结束信号硬门禁不再适用，本次以[Spec](spec.md#2026-11-17-纠正新对话出现即记录退出不补齐)及[讨论](requirements/discussions/2026-11-17-record-on-dialogue.md)为准。记录候选先证明新消息事件、真实身份、保存/读回及去重；已有hook实验仅证明其发生时的局部行为，不因条件纠正改写通过/失败事实。下方11月16日研究原文保持历史语境，本次未运行新实验。

## 2026-11-16 五项澄清后的研究结论

**输入和状态**：最新[Spec及5项确认](spec.md#session-2026-11-16)、[真实讨论](requirements/discussions/2026-11-16-shadow-profile-planning.md)、现行宪章、源码及3份局部探针。本次按plan技能派发两个只读研究分工，分别核对宿主接入/语义触发、共享保存/遗忘；未运行产品实验、安装或采集其他会话。Phase 0已形成以下可实施候选和失败路线，无政策或选路占位；技术能力仍须TV-14及后续交错实验实证。下方R61～R64是先前研究语境，与最新确认冲突的候选不再生效。

### R65：当前Linux/Codex事件候选与生命周期门禁

**Decision**：沿现有inotify自动记录探针提取同源Python标准库附件候选，仅定位宿主提供的确切thread和项目，白名单过滤已完成可见消息，支持保存后读回、持久去重和缺口报告。正式会话启动/结束能力必须先证伪；缺可靠结束信号时不启用正式持续采集，不把180秒探针超时或每轮final当会话关闭。

**Rationale / evidence**：[自动探针](analysis/acceptance/shadow-auto-record-probe-2026-11-16.md)仅保存5条样本，不涵盖普通final、全部长文本或正常关闭。[官方Hooks](https://learn.chatgpt.com/docs/hooks)提供SessionStart/SessionEnd，但transcript_path可空、格式不稳定；SessionEnd也可能发生在客户端离开并空闲后，不能推断界面关闭立即触发。[App Server事件](https://learn.chatgpt.com/docs/app-server)的item/completed是完成item事实，公开订阅/历史接口不证明当前包装器可连接。

**Alternatives considered**：子代理轮询和主代理逐条模型保存已不符合新分工；新建App Server不自动获得当前会话；未经核对的全目录会话扫描不可取。受控客户端仅在候选失败后回到设计讨论，不静默迁移运行入口或放宽关闭边界。

### R66：主代理判断语义，宿主协作工具实际启动分析

**Decision**：主代理在原有协作中识别新明确偏好、持续目标、用户纠正或手动要求，确认对应原文已持久保存后，使用实际宿主的协作工具派发分析子代理。运行脚本只负责记录/快照/共同保存，不能自行调用当前聊天工具；普通过程、引用Agent建议不能单靠关键词误当本人偏好。触发不等于认定永久特征，分析仍区分情境和来源。

**Rationale / evidence**：官方[Hooks与后台处理](https://learn.chatgpt.com/docs/hooks#run-hooks-in-the-background)的异步完成不等于自动开启新turn；[配置参考](https://learn.chatgpt.com/docs/config-file/config-reference)与当前文档说明command/mcp_tool与prompt/agent handler支持范围不同，不能将配置存在冒认语义识别或子代理实际启动。主代理本来就阅读当前表达，无需每条消息额外启动分类模型。此为设计推断，正负输入、实际派发/消费/落盘及协作持续均未实测。

**Alternatives considered**：每条消息另起分类模型增加执行链，正则不能稳定区分否定/引用/他人表达；固定每轮/定时/消息数不符合已选A。Stop阻断续跑会改变正常协作时序，不作默认。当前宿主若不允许实际派发，则报告接入未通过；不以源码文本承诺跨宿主支持。

### R67：保存事实驱动去重，使用项目内三层布局

**Decision**：旧conversations日期摘要/Rnn保持；新增conversations/raw/<真实thread>.jsonl保存UTF-8完整可见文本及真实三元组。详细分析复用conclusions日期文件/Enn，conclusions/coverage.md只保存已存/已分析范围、触发和尝试事实、发布来源及无正文遗忘拒收依据；profile.md为2000字默认入口。不用文本哈希替代事件身份，不新增全局事件/工程注册表。

**Rationale / evidence**：既有[watch_current.py](analysis/acceptance/fixtures/shadow-auto-record/watch_current.py)使用JSONL，但seen只在内存且先加入seen再落盘，保存失败可能提前判重、重启也没有可靠已存集合。正式实现必须在append、flush/fsync及读回成功后才确认已存；恢复从项目内真实原文重建已存身份，不从摘要/画像倒推。启动、轮转和断线期间缺口显式留证，关闭后不补录。

**Alternatives considered**：不把原文塞进旧摘要、不为新模型批量重命名；Markdown直接包原话较难处理分隔符碰撞。coverage是三层记录的处理事实，不是工程checkbox、state.json或新状态服务，原文和分析尚未发生的阶段不得预先确认。

### R68：同根短临界区与基于增量的合并

**Decision**：FR-033禁止为工程任务管理新增锁、事务、回执或第二状态系统；本候选仅对画像运行期数据协调，不承担工程步骤批准或阻断。一个固定本地锁文件配合fcntl.flock协调所有正式writer；模型分析在锁外运行，临界区只做I/O、快照/版本核对和已批准增量的提交。子代理返回增量认识及来源，不提交整份旧profile。发布前核对最近入口、来源和快照后新增用户表达/纠正；有新相关输入就释放锁重算受影响认识，无冲突内容可合并，未知冲突留依据待核实。

**Rationale**：仅重读profile不足以阻止“纠正原文已存但分析未完成”的旧结论发布；最后写入者胜也会丢另一会话新增认识。Python标准库[fcntl](https://docs.python.org/3/library/fcntl.html)提供Unix文件锁，[os.replace](https://docs.python.org/3/library/os.html#os.replace)提供单文件替换，它们不构成跨文件事务。使用固定锁文件且所有writer遵守协议是前置，不能通过反复删除重建锁或外部直接写入宣称保护成立。

**Alternatives considered**：无锁重读不能消除检查后竞态；全量旧稿覆盖不合要求；持模型长锁会拖慢原文记录。锁/文件系统的真实行为须实验，当前仅定设计。发布竞态返回需重核，不偷偷绕过分析的有限重试规则无限重跑。

### R69：遗忘先失效，再删除，读写共同核验

**Decision**：在共同短临界区先持久保存不含遗忘正文的source-id拒收与递增forget_generation，再删除三层相关内容/派生片段和修复引用。coverage记录实际未完成范围；完成读回核对后才宣称遗忘完成。旧代际候选一律丢弃，从删除后的有效资料重新开始，原文重投也不能重新写回被拒收来源。reader使用profile前核对当前遗忘代际和未完成删除，拒用受影响旧入口，正常答复可不依赖画像继续。

**Rationale**：只取消子代理或只删profile无法挡住迟到分析、重试和重启重放；只在内存标记也不持久。拒收事实放在分析层覆盖材料，保留最小非内容身份，不能把被遗忘原话或其摘要写进删除凭据。删除中断后先续完删除，不能用旧备份回填。Git历史另议，当前不自动处理。

**Alternatives considered**：不新增数据库/队列/跨仓库服务或工程管理协议；不将源宿主私人日志拷入项目作为恢复快照。多个文件仍可能部分成功，已写/未写、有效入口和恢复条件必须真实报告。

### R70：有限重试、最小附件及验证门禁

**Decision**：必要运行文件固定为同Skill的scripts/shadow_runtime.py和references/host-contract.md，原正文负责主代理触发/实际派发/恢复。可恢复分析失败按真实触发绑定的一轮最多自动重试1次，先在coverage持久预留额度并读回再派发，重启、重复事件、子代理重建或快照调整不重置；派发结果不明保留缺口，不盲目追加。仍失败停止本轮，新正常触发或用户新的手动要求才基于已存有效覆盖续接。此为本次Analyze后补齐的设计语义，详细计数沿[模型](data-model.md#分析轮次重试计数与中断恢复)，未运行中断实验。分析已存而入口未更新时只恢复缺失发布，不重复认识。无固定分析时限，实际时点可查询，故障在当前会话下一可见反馈说明。

**Rationale**：这给出原文取得/过滤、可靠保存、分析消费、发布/并发、遗忘失效各责任的真实源码落点；本次只规划这些附件，不把现有SKILL.md文字或验收报告冒认为运行实现。保留通过的探针骨架，正式来源与副本仍须重新完整核对和实读。

**Alternatives considered**：不预建多层适配框架、全局守护进程或每轮全量扫描，不以本轮设计完成自动勾选原Task。正反语义触发、普通末轮、自动结束、持久去重、双会话及遗忘迟到等输入/预期/失败影响见[TV-14](quickstart.md#tv-14完整对话惰性分析与共同发布)。

## 2026-11-16 研究进展：完整对话与独立分析

**先前研究语境**：当时Phase 0仅完成资料与接口研究，业务政策及宿主适配有待定；政策后由5项澄清收敛，当前设计以R65～R70为准。本节保留当时证据和候选，不声明新能力通过。依据为[本次追加提示词](requirements/prompts/2026-11-16-shadow-profile-conversation-memory.md)、[当前规格](spec.md)及[本轮真实答复](requirements/discussions/2026-11-16-shadow-profile-planning.md)。R57～R60 保存原摘要流程的设计语境，不能覆盖 2026-11-16 完整原文要求。

### R61：必须将可见原文来源与模型上下文分开

**Decision**：完整记录须由可核验的宿主消息来源取得；独立保留用户/Agent 可见发言及来源关系，不能把压缩后的模型上下文、现有摘要或分析结果当原话。先验证实际 Linux/Codex 入口，再决定可交付适配，不扫描其他项目会话或私人机器配置。本次只读 CLI 版本为 `codex-cli 0.169.0`，它不证明当前桌面端或 MCP 服务端版本。

**Evidence**：当前 `mcp__codex_tui__read_thread` 只声明按 threadId 读取另一任务的近期消息/状态，并带 cursor、turnLimit、maxOutputCharsPerItem 等参数；可见契约未定义完整消息结构、无截断保证或当前任务身份。`list_threads` 只声明近期任务列表。研究没有实际调用这些工具，没有读取其他会话；不能将类型或长度选项当原文完整性证据。

**Alternatives considered**：只由主代理传当前上下文不能独立保证最终回复、压缩前历史及无下一轮末轮；显式导入真实导出可作补偿来源，但不能代替已要求的每轮自动记录。缺身份时不按文本内容合并两轮“好”，缺原文就报告缺口。

### R62：宿主事件与历史接口是候选，生命周期须实证

**Decision**：优先研究当前宿主已有的原生事件及历史读取能力，先做最小适配证伪；不预先创建新 App Server、常驻服务、数据库或队列，不以子代理存活保证答复后续跑。技术选路可以先研究，但任何入口均须证明完整发言、最终回复和恢复能力再进入依赖它的业务实现。

**Official evidence**：[Hooks 文档](https://learn.chatgpt.com/docs/hooks)提供 Stop 和异步处理；最终消息及 transcript 路径可空，transcript 格式不是稳定接口。异步处理会话结束时可被取消。因此不能以 Stop 存在或后台命令已启动宣称可靠末轮留档。

[App Server 文档](https://learn.chatgpt.com/docs/app-server)提供带身份的持久消息分页和完成事件，可作为另一候选来源；当前 MCP 包装器是否暴露这些能力未证实。公开接口存在不等于能连接当前任务；启动另一个服务也不会自动取得当前会话。

**Alternatives considered**：A 为已有宿主原生事件加可恢复记录，接入较小但须验证输入完整性、信任和关闭时机；B 为受控客户端事件加历史补偿，来源/顺序更明确但需要额外生命周期职责。优先证伪 A，若不满足则在同一 Spec 报告差距并讨论 B，不静默替换运行入口。真实导出仅作明确注明范围的补偿，不能将原要求降级为用户手工维护。

**Observed limits**：当前 `functions.exec` 明确脚本结束时未等待 Promise 被丢弃；协作工具没有持久消费承诺。本轮已按 speckit-plan 的研究步骤派发一个只读研究代理，报告只证明调研发生，没有进行后台分析能力验收或安装任何 hook。

### R63：可靠保存与分析发布分开取证

**Decision**：研究建议把接收到真实来源、原文保存并读回、分析覆盖完成、精简入口发布作为分别可核验的事实。原文保存失败不能产生对应分析已完成的回执；分析积压不等于原文未保存。主代理可使用最近有效入口，当前明确纠正立即应用。

**Rationale**：现有 [T110/T111 验收](analysis/acceptance/shadow-profile.md)只覆盖旧摘要技能、串行多会话保护和保存故障，明确不证明后台捕获或任意并发。T108～T111 已完成、T112 尚待真实机会的原事实保持；完整原文、末轮、异步及并发为新增验证范围，不重开旧已完成 Task 冒充新交付。

**Proposed policies, not yet confirmed**：记录最多等待 2 秒、在线分析 5 分钟；离线/中断允许恢复补齐。会话原文独立、真实消息身份去重、共享入口串行发布、过期分析不得覆盖新版本，冲突和缺档按可反馈时机提示。这些已向用户询问，未收到选择前保持待定，不把预计性能或串行保证记成事实。

### R64：已确认的删除与非文本边界；精简预算仍待答

**Decision / user evidence**：用户已确认遗忘时删除项目内相关原文、分析和精简信息，Git 历史另行处理；附件及图片只保存来源引用和必要说明，不复制原件。真实原话见[政策确认](requirements/discussions/2026-11-16-shadow-profile-planning.md)。本轮不执行删除，不能把普通更正或分析重提炼当遗忘请求。

**Proposal**：正文 2000 个汉字、优先稳定有效协作信息、超额移出已结束任务进度和重复说明、长期偏好不按固定天数失效。用户只问“建议是什么”，尚未采纳预算/筛选/过期建议，不能当已确认要求。

**Alternatives considered**：删除历史原文作为日常压缩会丢失依据，默认复制全部非文本违背确认，保留原文但继续再提炼已遗忘内容也不符合三层删除政策，均不采用；Git 历史重写并未获授权，不作为本次计划的自动动作。

### 下一阶段门禁与最小证伪

Phase 1 以前先解决尚未确认的业务政策，再将接口假设编入依赖链最前面的技术验证，不要求研究报告冒认所有运行能力已通过。以下仅为后续验证输入/信号，本轮未实施或执行。

| 假设                 | 后续最小输入与信号                                                                                     | 失败影响                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| 全部可见发言可取得   | 换行/中文/Markdown 长文本、过程说明及实际最终回复，逐条比原文/角色/顺序/身份，并核对截断和注入内容过滤 | 任一缺失或改写即不得称完整                    |
| 无下一轮末轮可保存   | 最终回复后不发用户输入，检查真实持久保存及独立读回，记录耗时                                           | 不能用预写回复或等下一轮抵扣                  |
| 排除工具与隐式内容   | 同轮工具调用和可见执行说明，分别核对范围；只收可见发言和已确认的非文本引用                             | 工具明细、系统/开发者信息及隐式思维混入即失败 |
| 重复与不同轮次可区分 | 两轮相同文本、同来源重复投递、消息晚到                                                                 | 按文本去重或重复副本均失败                    |
| 中断后可恢复         | 接收后/保存前/分析中分别中断，再按真实来源补缺，分别核对进展                                           | 不可从画像倒推原话，部分保存不算完整          |
| 并发发布不倒退       | 两会话交错写入，较旧分析后完成，核对入口覆盖、更正及未合入范围                                         | 原文丢失、过期覆盖不提示即失败                |

本轮没有安装/启用 hooks、创建真实采集器、获取当前会话完整原文或执行上述实验；没有读写其他项目私人资料。正式任务身份仍只在 tasks.md，业务/技术未决不能靠生成文件求通过。

## R57：影子画像先源码复制后安装（2026-11-14）

**Decision**：按[本轮用户纠正](requirements/raw/2026-11-14-shadow-profile-copy-first.md)先写独立技能并精确复制使用，主线完成后再接正式安装。规划来源为 `packages/skills/src/profile/shadow-profile/SKILL.md`，本期不创建集合配置或补主线插件，不把正式安装纳入近期必需链。

**Rationale / evidence**：实际 `packages/skills/vite.config.ts` 使用 `vite-plugin-skill.plugin.ts`；该插件逐一级目录 import `collection.config.ts`，只发现 `*/*/SKILL.md`。当前 workflow 仍有 JSON 配置，不能用旧 README 或新增集合掩盖主线中间态。既有 link-skills 脚本支持两层发现、按技能名铺平复制，不需要集合配置；根 `pnpm skills:link` 明确传紧急版来源，不会自动携带主线新技能。中文分类下保留英文技能名同时适合现有精确复制与未来重新评估安装，无需本期承诺构建可用。

**Alternatives considered**：立即添加集合配置并接主线构建会依赖未完成主线，用户已明确不采用；修改紧急版九项清单或泛复制主线会扩大分工并可能引入 eval；手改安装副本会失去来源追溯，均排除。主线完成后的正式安装按当时契约另验，不提前固化输出路径。

## R58：必调用采用项目短引用，真实宿主证伪（2026-11-14）

**Decision**：项目 AGENTS 以短引用要求每轮完整读取并执行已复制的 shadow-profile，定位本项目资料；画像行为只维护在技能内。description 用于发现提示，不作为必调用保证，不新增 Spec Kit 模式或阶段 hook。默认不加入原生宿主 hooks、脚本、信任配置或后台服务。

**Rationale / evidence**：核对[官方技能说明](https://learn.chatgpt.com/docs/build-skills)及[AGENTS 说明](https://learn.chatgpt.com/docs/agent-configuration/agents-md)：技能可显式或按描述隐式选用，AGENTS 在会话启动时构建指令链，受更具体规则和覆盖限制影响；据此推断，单靠自然匹配不足以满足本需求，项目明确调用约定也仍需实际行为验证。2026-11-14 本机只读 `codex --version` 为 0.169.0，仅是 CLI 观察，不外推当前桌面宿主。

**Alternatives considered**：只写“必触发”描述不可验证；只在 Spec Kit 阶段 hook 接入不覆盖普通聊天。[官方 hooks 说明](https://learn.chatgpt.com/docs/hooks)列出 UserPromptSubmit/Stop，但脚本、信任、宿主支持和递归处理会扩大当前范围，留待短引用方案被证伪后另议，不能未经认可自动改走该路线。Context7 查询遇配额超限，已改查上述官方原页，不依赖搜索摘要或非官方镜像。

**Verification boundary**：TV-13 正常三轮任一未实际读取/执行或未保存即证伪当前接入。首轮读过正文、安装可见、文件存在及 Agent 自述回执都不能证明后续每轮行为；尚未运行这些实验。

**2026-11-14 分析后修订**：验收观察者（负责验证的人工或独立 Agent）依据接入文件、真实加载/工具轨迹和保存结果判定未接入/漏调用，并记录未生效范围；未加载唯一入口的业务 Agent 没有自诊断提示不代表接入正常。已加载接入后的正文不可读或保存故障，才由执行 Agent 在正常答复中提示并由观察者核对。此区分明确验收职责，不增加运行期检测器、hook 或后台服务，也未新增行为通过证据。

## R59：三层 Markdown、项目隔离与暂行 Git（2026-11-14）

**Decision**：复用日期 Markdown 和 Rnn/Enn 锚点表达摘要→有效结论→当前画像，不增加 JSON、数据库、锁或状态服务。优先项目既有布局；当前项目 `.specify/memory/user-shadow/`，普通项目无约定时推荐 `docs/user-shadow/`。后者是本 Plan 默认选择，不冒称用户逐字指定，不为建档初始化 Spec Kit。仅当前研发使用者本人，三类资料暂纳入 Git，均保留后续可调整说明，不自动提交或公开。

**Rationale**：用户三项澄清已经决定故障继续答复、暂行 Git、研发阶段仅本人。旧 T060/T061 及 MVU-005只证明原仓库有限维护/恢复行为，原私人记录未迁移，不能复用为新增技能、首次建档或每轮调用交付。沿既有数据职责可减少实现并保持真实来源；首次没有有效认识时不强造结论文件。

**Alternatives considered**：全量复制旧私人画像、为每个 Spec 再建画像、跨仓库个人档案、多人身份服务、整轮逐字复制工具输出和为普通进度强造特征，均不符合当前范围。Git 暂行方案不改变凭据禁止留存及技能分发与个人资料隔离。

## R60：来源身份、纠正与故障恢复（2026-11-14）

**Decision**：优先可见的真实会话/轮次 ID；不可得时在摘要中使用明确标为本地的会话定位与稳定锚点，不假冒宿主 ID。两轮相同文本不合并，同轮重入只补新发生内容。先保存摘要，再按需要结论与画像；失败报告具体已写/未写，正常答复继续，恢复从磁盘和仍可核实来源补缺，不逆推不可见原话。

**Rationale**：这是普通 Markdown 关系，不是新的持久化状态机。写前重读并局部合并，发现矛盾保留来源和待核实说明；后写时间不能自动推翻明确表达。本人多会话仍是一份项目画像，不等于多人支持；本期同一资料根写入串行，不承诺无锁条件下任意并发原子性。使用中断、重复调用、部分成功、不可见缺档和外部改动案例验证，而非通过人为永久偏好证明理解。

**Alternatives considered / limits**：不新增记录核心、回执服务、全局编号分配器或并发锁；不用未来最终回复充当已发生内容。真正最终回复在后续仍可见时补记。真实宿主暴露何种身份、每轮调用和故障恢复效果留 TV-13；设计已收敛，不用未执行结果填造通过。

以上是本次增量的有效研究；以下旧记录保留发生时语境，影子画像接入及故障行为冲突处由 R57～R60 替代。研究未产生生产源码、副本、安装或行为证据。

更新：2026-11-10。本轮按 Plan 分派两项独立只读研究，核对原生模板、固定 1.2.6 缓存源码、现有注册/安装/构建路径及最新追加需求；未执行 Implement、安装、迁移或宿主行为演练。R51～R55 是原Plan时的设计依据，R56记录本轮上下文修复；其中治理未实施等表述按原发生时理解，当前治理状态以R56为准。后续旧记录的“当前/本轮”保留发生时语境，四模式发现与八栏目等冲突内容不再是本期设计。

## R51：共同条件由宪章承接，hook 提前进入准备

**Decision**：保持已选宪章＋implementation-preparation＋before_implement；宪章规定每 Task 开工前完整消费共同准备、有效认可方案及授权，hook 缺失/禁用/失败/条件跳过不豁免。配置错误后只允许继续读取和诊断，不解释为业务已放行。这个契约不是程序锁，须先经 TV-10 真实宿主验证。

**Rationale / evidence**：实际 `.agents/skills/speckit-implement/SKILL.md` 第24行配置解析失败后继续，第28行非空条件跳过，第93～100行在实施前读取存在的宪章，第146～172行遍历 Task 且无逐 Task hook。缓存1.2.6的 `specify_cli/extensions/__init__.py` 第6177～6200行 HookExecutor 返回调用信息，执行委托agent；第5984～6003行条件异常返回False。官方维护来源可核对 [Implement模板](https://github.com/github/spec-kit/blob/main/templates/commands/implement.md)和[扩展源码](https://github.com/github/spec-kit/blob/main/src/specify_cli/extensions/__init__.py)，但本轮版本事实以上述本地1.2.6为准，不将main视为固定版本。

**Alternatives considered**：只依赖mandatory hook不足以覆盖异常和下一Task。官方preset的command prepend/wrap可组合原生入口，缓存 `_resolver.py` 第794～825、886～904行及 `_manager_commands.py` 第95～175行支持这一能力；但当前不增加这条接入和分发模板，留作TV-10失败后的待审最小调整。手改生成入口、新实施引擎和AGENTS路由均排除。

**Limits**：缺宪章时原生IF EXISTS会跳过，普通聊天未发现准备也未必进入原生读取。因此缺材料及漏触发必须实际判失败，不能宣称天然已拦截。新治理未实施；所有异常/逐Task/自然加载结果未测。

## R52：方案是原 Task 的讨论产物

**Decision**：准备来源定名 implementation-preparation，方案默认 `implementation/<Task ID>.md`，由原Task链接。tasks保留轻量目标/边界/依赖/验收和唯一checkbox；方案按真实需要表达逻辑、依据、顺序、验收与认可来源，无固定八栏目。已有适用确认直接复用，实质变化才重议，普通工程调整记录后继续。

**Rationale**：最新[追加提示词](requirements/prompts/2026-11-10-implement-first-revision.md)已明确一Task一方案、尊重用户逻辑和降低审阅成本，真实实现位置须查存量代码与规范。本期不创建虚构已确认方案，不将调度中心T019的具体业务决定转成通用规则。

**Alternatives considered**：继续把所有步骤写入tasks、原样迁移八栏目、新独立子任务/状态及对每个普通文件变动重复审批，均不采用。名称与默认目录是本Plan工程选择，不冒称用户逐字指定。

## R53：保留 modes 身份，官方缩减至 Increment

**Decision**：register-commands仅声明speckit.modes.increment；准备、综合分析、结案按各同目录speckit-hooks.json交官方hooks-only。三暂停来源保留维护/历史而不生成注册，不要求四项齐备。旧受管迁移先清点精确目录及未知附件，再官方同ID force更新，最后核对实际去留。

**Rationale / evidence**：register-commands.sh第47行及.ps1第50行仍硬编码四项；register-hooks对应第47/50行仍七旧项；mount-entry.sh第185及246～258行、.ps1第155及207～216行仍五项占位；install-skills.sh第459行仍要求workflow --no-mount，PowerShell第301行只输出not-run。不能据此声称新挂载已实现。缓存1.2.6 extensions源码第2539～2552行force先remove旧扩展；第3490～3521行按旧registry注销命令/技能，第3544～3568行移除扩展/hook/登记；第2170～2233行可能整目录删除生成技能，未知附件须先保护。

**Alternatives considered**：不换新modes ID，不自删registry/YAML，不把删除生成列表当旧入口消失；若force未完整清理，先保存证据再核实官方remove/add恢复，不扩大到全目录清理。无正式登记的孤立残留不能从正常路径推定已清除。

**Limits**：TV-11仍须真实固定版验证。PATH中的本地CLI为1.3.3，默认注册版本1.2.6，测试须明确选择并记录实际版本。Linux上的pwsh不等于Windows消费已验。

## R54：同版来源与自然发现分别验证

**Decision**：复用整体构建复制；准备保持可发现，只有task-increment维护来源与正式规划入口分离。按所选官方根的同级-speckit-sources候选布局验证。coding/business-node-delivery继续独立发现，不向准备或Increment加链接、调用或依赖。源/dist/安装/扩展附件比完整集合，正式入口比官方渲染与实际引用读取。

**Rationale / evidence**：`packages/skills/build/plugins/content.ts`第89行复制完整来源目录，`scripts.ts`第43行原样交付script；`scripts/dev/actions/link-skills/link-skills.sh`第41行、.ps1第73行目前动态复制发现根，尚无上述分流。源码存在、描述匹配、正式安装、全文读取和实际行为是不同证据。

**Alternatives considered**：不把四模式旧布局直接当当前验收，不依赖宿主通用禁用字段、不隐藏全部workflow、不比较官方重建frontmatter后的整文件字节。附件顶层桥接只有实际引用测试证明需要时采用，不为已暂停Tutor附件新建本期工作。

## R55：记录、画像和功能分析按职责延续

**Decision**：保留原始输入与简洁摘要的独立责任；Spec分类按用途灵活扩展，实施方案与分析不复制工程状态。综合分析在原六类适用内容之外增加逐功能独立文字块，after_tasks与Increment共用同一能力。画像沿目标项目既有记录约定分清提炼/汇总/读取/应用，真实机会轻量抽查。

**Rationale**：需求原文及[覆盖核对](requirements/discussions/2026-11-10-existing-requirements-review.md)已有明确依据；当前只证实曾存在profile汇总滞后，不能把全部原因写成已诊断。TV-12从真实来源核对记录与后续行为，不以新增日志文件代替效果。

**Alternatives considered**：不为功能点强制固定栏目或总表，不要求逐轮应用报告/评分，不把九个候选理解维度当既定用户特征，不对外夹带本仓库画像。三模式研发和测试完全暂停，旧证据保留而不计当前通过。

## 本期研究就绪边界

技术设计选择已明确，无 NEEDS CLARIFICATION 占位；技术验证尚未执行，不是研究结论遗漏。宪章7.0.0已独立正式修订，先复核实际治理，再用最小候选和TV-10证伪；最终来源仍须隔离刷新、完整读取并复验。失败只挡受影响下游，T060沿既有记录独立推进。TV-11/12及适用骨架随后按依赖执行；本轮不改工程checkbox，不执行发布/部署或外部写入。

## R56：正式治理、独立记录与最终来源验收

**Decision**：用户要求修复Analyze所指出的上下文问题后，独立将宪章6.1.0正式修订为7.0.0，并分别维护独立治理提示词；T102改为复核已生效治理。解除T060对T104的依赖，按既有真实记录及有效授权推进。MVP明确T103候选→T104生产来源与构建经官方路线刷新隔离入口、核对CLI/正文/配置/附件并实读复验→T105在最终来源验方案/恢复。

**Rationale / evidence**：原宪章强制八栏目与轻量Task/独立方案直接冲突，未来修订任务不能作为治理门禁通过；MVU-005已有真实记录可独立使用，无需等待新准备；候选证据不证明最终生产来源被实际加载。当前任务图移除T104→T060一条无必要阻塞边，任务身份和状态保留。

**Alternatives considered / limits**：不在只读Analyze里改治理，不降低治理权威，不为修文档重开完成任务；不以源码读取或旧候选替代最终来源验收，也不把MVP绑到完整迁移。此处仅保存正式治理与文档修复事实，生产skill/hook和真实宿主验证仍未实施。

## R47：公开模式入口与非发现来源分开（2026-11-10）

**Decision**：只对 task-tutor、task-pair、task-direct、task-increment 四个精确名称分流。项目及全局来源根统一取所选作用域的官方技能根追加 `-speckit-sources`，例如 Codex 项目根 `<project>/.agents/skills-speckit-sources`、全局根 `<home>/.agents/skills-speckit-sources`。这是本轮方案选择，未实现；全局来源继续属于全局安装，只有挂载时才绑定明确的目标项目。其他技能及 hooks 来源保留原安装位置，正式模式入口由官方 CLI 写入目标项目的宿主目录。

**Rationale**：[OpenAI 技能文档](https://learn.chatgpt.com/docs/build-skills) 列明 Codex 的发现根与隐式调用控制；关闭隐式调用仍允许显式调用，不能将其当作彻底隐藏。配置禁用还会引入宿主专属配置维护。因此来源位于发现根外、正式入口位于发现根内更符合四入口约束。该目录选择对其他宿主仍须实测，不能由 Codex 文档推定全矩阵通过。

**Alternatives considered**：不选 `agents/openai.yaml` 的 `allow_implicit_invocation: false`，它不足以消除并行公开入口；不选择修改用户 `skills.config`，避免宿主专属配置及禁用但仍可被管理接口列出的歧义。研究候选曾考虑项目 `.specify/skills`，最终改为官方根的同级目录，避免仅安装来源或 `--no-mount` 时创建 `.specify` 并被误认为项目初始化；不新增统一路由、不改生产来源名称或删除来源。源码前缀元数据不能假定会被官方生成入口透传。

**Evidence / limits**：本机 codex-cli 0.167.0；系统技能文档 `skill-creator/references/openai_yaml.md` 的 policy 说明与官方页面相符。Context7 读取的官方 Vercel `skills/src/installer.ts` 由 Agent 注册表决定根目录，没有任意目标目录选项。正式脚本完成后的消费环境才作为 FR-095 验收对象；单独执行官方 `skills add` 仍会把原始模式放进发现根，需后续同版脚本归位，不把直接安装或 `--no-mount` 当挂载成功。未修改真实配置或验证实时发现。

## R48：使用官方渲染及可读取的附件路径（2026-11-10）

**Decision**：继续由 register-commands 准备临时 modes 扩展并调用所选版本官方 CLI；`--skills-dir` 接收非发现来源根。四入口各自 description 来自对应生产 SKILL.md。临时输入增加扩展顶层 `references/`，原样复制当前 Tutor 的附件，让官方将正文内相对引用改写为 `.specify/extensions/modes/references/...`；其他模式未来出现同路径附件时，先核对完整相对路径与字节，冲突拒绝，不静默覆盖。

**Rationale / evidence**：读取本机已缓存的 specify-cli 1.2.6：`specify_cli/agents.py` 的 123～162 行解析原 frontmatter，460～493 行以来源 description 重建正式 name/description/compatibility/metadata，264～307 行仅重写扩展顶层真实目录，912～927及1020～1043行只写生成 SKILL.md。`integrations/codex/__init__.py` 20～34行确定 `.agents/skills` 及 dev 模式不依赖来源软链接。缓存根 `<source-home>/.cache/uv/archive-v0/8udWHkEHTyPS1gFu/` 只作本次研究定位，不进入分发技能正文。

**Alternatives considered / limits**：不手工改生成入口、复制一套渲染器或假定裸 `references/` 自动可读。当前 Tutor 的附件位于 `skills/task-tutor/references`，没有临时扩展顶层桥接，源码阅读已识别此风险，尚未运行新布局。升级 FOUNDRY_SPECIFY_VERSION 后须复验；不能把缓存1.2.6源码结论泛化到全部版本。

## R49：交付归一化与同版验证分层（2026-11-10）

**Decision**：安装核心沿现有下载/校验/提交过程分流四模式来源，工作区 link-skills 同步分流；官方直接安装后的手动同版脚本先归位来源，再按来源→适用 hooks→四入口的顺序挂载。部分选择及 `--no-mount` 只保存来源安装事实，不公开原始模式，也不补齐或部分注册四入口。旧发现根中的精确四项仅在来源和归属可确认时处理，遇未知附件或用户内容先保留并报告，不全目录清理。

**Rationale / evidence**：本地 `register-commands.sh` 31～36、49～62行接受任意既存来源目录；`install-skills.sh` 447～450、528～566行按官方根下载、校验后提交文件，当前没有“临时官方安装再复制”的实现；`mount-entry` 仍有旧五项及 `.agents/skills` 绑定。PowerShell 当前仅有只读官方预检，不能声称实际分流已存在。register-hooks 独立读取其 `--skills-dir` 的技能配置，四模式分流不要求隐藏 hooks。

**Validation decision**：源→dist→非发现来源→官方扩展内来源/附件比完整文件集合及摘要；正式入口与同版官方渲染结果比较 name、description、正文及改写后引用，不能要求官方重建frontmatter后的SKILL.md与原文整文件同字节。附件集合与内容同版且引用实际可读；宿主新会话的自然选择、完整加载与模式职责分别留证。

## R50：新增行为风险与后续工作衔接（2026-11-10）

**Decision**：以 TV-08 验证发现根排他性、来源归位、官方生成及附件读取，以 TV-09 验证四模式自然语言/显式调用、上下文和角色边界。TV-08→TV-09→完整消费/移交；既有 TV-01 和 TV-07 只复用其覆盖的事实，T093/T094 不自动抵扣新范围。新增正式任务身份由后续 tasks 扫描全部编号后安排，本轮不修改tasks或checkbox。

**Rationale**：C2 涉及官方调用及失败后的来源/入口差异，C3 涉及真实宿主发现与过期入口，C4 涉及安装、工作区刷新和正式挂载的新目录契约；没有同类已验证实现，静态检查不能证明自然发现，不满足全部豁免条件。无新增业务数据/后端/页面职责，用户可观察结果是同一正式模式关联原 Spec/Task 并保留分工；沿原受管入口交付闭环增量，不新建第二套工程状态。

**Limits**：本轮只读研究与设计没有运行TV-08/09、安装、接口或宿主行为测试，不宣称技术门禁已通过。原真实用户学习、Direct专项跳过、阶段批准和总体结案要求均保留。业务图按用户纠正在原图基础上增量修改，将仍有效的推进、续接、审查、学习反馈及草稿整理并入diagrams/business-flow.md，并更新过期规则，不另留旧图副本；原历史哈希不改写。

## R46：Pair 不保留历史子任务兼容分支（2026-11-09）

用户在澄清“历史记录”后，明确要求删除Pair正文中遇到历史子任务时如何衔接的说明，理由是本仓库应该尚未创建子任务。采纳这一明确指令，只移除该兼容分支，原Task内联步骤、用户主写、局部授权和目标治理引用保持；不把推测包装成全库无历史文件的证明，不更改宪章或其他模式，也不执行历史数据删除。

此前T065初版及材料C场景曾包含这段兼容处理，原实测保留为历史；最新正文删除、源码/dist一致和24项测试通过已有[追加证据](analysis/acceptance/collaboration-modes-delivery.md#t065-后续修正删除历史子任务兼容说明2026-11-09)。当前方案及T093/T094不再要求恢复该分支或准备旧子任务迁移样本。T065完成事实保持，本轮仅文档同步，不重复实施或模拟用户验收。

## R45：技能自身触发替代模式显式接入（2026-11-09）

用户纠正应优化 business-node-delivery 的触发方式，不在 Spec Kit 中创建该技能链接，随后明确“开始”。采用自身 description 匹配业务规划、接口实现、页面衔接及恢复开发，并排除纯文案/格式/视觉和无业务路径的解释。发现不要求已有正式任务；实际加载后材料、模式分工与授权仍须核对。

此前 R43 的模式短引用和缺技能暂停安排被本决定替代：四模式源码保持不变，不新增链接、显式调用或安装依赖；未安装该规则不阻断模式独立使用。T092 改为触发优化与识别对照，T093 改为工作流自然发现及加载后职责验证，T094 核验同版交付。T065 仍保护 Pair 实际行为。旧方案及原实测保留历史语境，不作为当前接入要求。

验证先对旧描述作独立识别，再以同一请求测试候选；记录漏触发、误触发、重复样本与范围限制。描述选择测试不等于真实宿主自动加载，加载后的角色与业务验证另验；不新增触发脚本、治理路由或注册协议。

## R42：通用业务节点规则的独立交付（2026-11-09）

**Decision**：命名 business-node-delivery，来源为 packages/skills/src/skills/coding/business-node-delivery/SKILL.md，目录名与 frontmatter name 相同；不带 speckit-hooks.json、不增加模式入口、脚本、状态或安装依赖协议。独立调用使用当前项目的业务目标、原任务/节点、依赖和证据；非 Spec Kit 项目不创建专用目录或身份。

**Rationale**：用户确认独立通用 Skill，粒度可以是 MVU 内的小节点或单接口。已读取的 build/plugins/content.ts 整目录复制 src/skills，scripts/dev/actions/link-skills/link-skills.sh/.ps1 动态发现并按名称复制；无需新构建入口。register-commands 的四项目标保持。公共 install-skills 当前按 release.json 动态选择、requiresSkills 必须为空且 workflow 仍须 --no-mount，不能为新增规则宣称自动挂载已接通。

**分类纠正（2026-11-09）**：用户指出通用规则应脱离 workflow，并授权修复。此前方案和 T091 沿用 workflow 分类；现在归入现有 coding 分类，工作流只是可选消费者。目录分类会影响默认发行选择及安装分支，因此同步修正当前引用并验证独立安装；不增加分类、挂载协议或规则副本。T090/T091 的旧路径和实测保留在验收记录，文末追加本次迁移证据。

**Alternatives considered**：business-delivery 更短但容易泛化成整个业务交付方法；将规则嵌入四模式会重复维护且无法单独使用；第五 modes 或新 hooks 违反已确认边界。选择 business-node-delivery 只是本轮方案命名，节点仍是原任务内范围，不成为独立工程实体。

**交付影响**：packages/skills/README.md 增加来源、单独调用和消费缺项说明；tests/distribution/mvu-a.mjs 的人工 publicNames 需要纳入新技能。该名单仍含旧 Explore/Guide、缺 Direct/Increment，test-register-hooks.mjs 的真实 CLI 分支亦有旧五模式假设；这些是只读发现的既有漂移，未运行本次测试，不预判通过或失败。按各原任务保留历史结果，新技能增量与旧项修复分别记证。

## R43：与 MVU、原任务和四模式的衔接（2026-11-09）

**Decision**：MVU 保留业务结果与整体验收，一次推进可小到原 Task 内的节点或接口。通用规则只安排当前节点适用的数据、后端、验证、页面步骤；已有成果核对后复用，不适用或调序说明理由。多个接口各自验证后按页面依赖汇合；节点通过不推导 Task/MVU 通过。

**Rationale**：用户纠正了将一次推进固定为整个 MVU 的提议，并确认页面可以等其他必要接口就绪后统一接入。四模式消费同一通用规则：Increment 在形成 MVU 后细化工程步骤，Direct 在方向/依赖核对与实施前，Tutor 在原 Task 工程/实践步骤，Pair 在当前步骤讨论与验证时加载。调用使用目标项目的技能发现/加载能力，不写指向 Foundry 的绝对路径或假设官方模式目录的相对兄弟路径。

**Alternatives considered**：每接口强制制作正式页面会破坏实际页面依赖；按所有业务的技术层横向做完才反馈延迟发现问题；给节点新编号或状态会形成第二套工程系统。缺通用技能时复制正文作回退会分叉来源，因此只报告缺项并暂停依赖该规则的推进，原模式其他职责不受无关阻断。

**保护边界**：新引用不扩 Tutor 的单 Task/用户主写范围，不改变 Pair 的局部授权或 Direct 的用户方向；当前 Pair 仍有旧子任务文本，其通用治理迁移由原任务承担，不借本次接入重做整个模式。安装不自动补依赖，使用说明和隔离消费须明确同时具备所选模式及通用 Skill。

## R44：TV-07 验证节点推进及真实继续条件（2026-11-09）

**Decision**：新增 C3 技术前置 TV-07。复用 TV-06 的对照、独立读取和材料保护方法，使用两份基础材料及六类场景：单节点计划/实施、页面多接口汇合、按需验证、失败/未执行与恢复、跳层/有依据调序、独立调用与四模式复用。至少一份材料有可实际运行的本地接口；候选通过后保留规则和业务夹具，增量完善生产源及消费。

**Rationale**：原 TV-06 的 partial/API-only 样本只证明描述层复用，不证明本次实际执行门槛。纯文字、lint、类型或源/dist 字节比较不能证明接口失败会挡住页面，也不能证明节点通过未误标 MVU。tests/test_artifacts.py 的源/dist 全目录比对与固定画像检查可复用，但其中 assert_project_governance_is_reachable 强制工作流宪章的检查不得套给新通用 Skill，否则反而增加 FR-091 禁止的依赖。

**Alternatives considered**：编写预定答案生成脚本会把测试者的判断当作技能行为；模拟用户回复、只看关键词或构建成功均不足。每场景新建整套业务应用也过重，复用一个含两个接口、同一页面及无关任务的隔离材料，通过分支变更形成正常、失败和恢复场景；普通项目另用既有目标与任务布局。

**验证与证据**：实施时先保留基线对照和最小候选的实际输出，再做生产源回归、构建/复制、构建产物单独调用及四模式真实复用。计划材料为 analysis/acceptance/fixtures/tv-07/README.md、tv-07-business-delivery.md、business-delivery-engineering.md，创建和命令留到实施；本轮只读研究没有行为通过结果。命令和信号见 [TV-07](quickstart.md#tv-07通用业务节点实施顺序)。原工程未测或失败按当时证据保存，新实施时重跑并报告实际结果。

## R39：可选描述沿用自然语言入口（2026-11-09）

**Decision**：在现有 Increment 正文中解释可选规划描述，不增加解析服务、参数 DSL、命令或注册事件。Spec/Task 定位与描述分开理解；仅有定位/空白按无描述处理。来源：[用户确认](requirements/prompts/2026-11-08-increment-planning-description.md)、已读取的 packages/skills/src/skills/workflow/task-increment/SKILL.md 及当前生成入口。

**Rationale**：现有模式由官方生成完整 skill 正文，用户自然语言可作为本轮上下文；缺的是处理分支和来源判断规则。无新 SDK、协议或外部服务选择。本轮只读核对既有入口，未执行新的带描述能力实验。

**Alternatives**：固定表单/结构化参数会增加用户负担；单独新建规划命令重复现有职责，均不采用。用户输入的工程步骤不直接转换成 Task，先经业务结果与依赖核对。

## R40：小闭环与补全的可观察边界（2026-11-09）

**Decision**：按用户已接受的小闭环推进；依据已确认需求和实际代码补全，区分原意、事实、补充、假设。重要冲突先明确，低风险且有依据的细化继续。将步骤链视为当前规划偏好，复用已有实现、说明不适用项，不强制五层齐全。

**Rationale**：用户明确思路可能不完整；机械服从与完全忽略描述都不能满足目标。纯文本静态检查无法证明不越界，C3 命中。安排 TV-06 的独立材料与真实规则应用；已有 TV-02/05 只复用材料保护骨架，不能代验新的描述分支。

**Alternatives**：整服务全做完才反馈会延迟发现错误；跨全部业务按技术层批量推进不满足已确认顺序。每个细节都等确认会阻塞普通补全，只把影响范围/验收/关键依赖的缺口提交用户。

## R41：增量交付与证据分层（2026-11-09）

**Decision**：新增 T087→T088→T089 承担 TV-06、生产正文、构建及隔离官方入口核验；现有 T064/T066/T071/T072/T086/T074/T076 承接同一分析、完整迁移、消费和真实行为。来源与生成入口应同版；不直接修改 .agents 或 dist。整个 Task 保持未完成直到对应验收真实发生。

**Rationale**：新行为范围未由 T053/T054/T085 的历史证据覆盖，不能重开已完成身份或只改映射。沿用唯一末尾 T080 覆盖新增临时材料与最终回填。当前用户仅授权 spec 流程，不执行上述任何工程任务。

**Alternatives**：复用旧完成 checkbox 冒充新行为通过会丢失证据边界；给新增分支另建完整安装/分析系统重复既有职责。正式工作区刷新仍由 T072 的受管流程处理，隔离入口检查不抵扣真实用户反馈。

以下 R35～R38 保留 2026-11-06 研究时的决策；其中 plan 旧锚点跳转已由后续确认的一处文件级链接替代，当前有效设计以本轮 plan/contracts 为准。

## R35

**Decision（决策）**：以同级 mvu.md 为详情唯一活动来源，plan 保留总体方案、推荐顺序、简短索引及原 MVU-001～007 标题的一行跳转。mvu.md 延续原编号/标题，新 MVU-008 只定位新增文档组织结果，不是独立工程身份。迁移前原 plan 全文保存为 plan.history.md 并标记历史，现有 tasks 和历史证据不批量改链接。

**Rationale（依据）**：用户已确认小闭环的四项说明及独立文档；主线 tasks.md 的 T051、闭环映射等仍使用 plan.md#mvu-001～007。保留锚点能从旧链接进入新详情，缩短活动 plan，避免只复制出一个新文件后两处继续维护。

**Alternatives considered（备选）**：保留所有详情在 plan 不满足查找要求；每个闭环一个文件增加当前八条小闭环的导航成本；全量改旧 Task/证据链接扩大范围。采用单一文件及索引，并把原 plan 固定为历史来源。

## R36

**Decision**：后续实施先正式调整工作流宪章中的产物角色，再分别维护独立宪章提示词及原生模板的项目约定；更新 Increment/Tutor/分析的生产来源，不直接改生成 .agents 副本。原生 plan/tasks/analyze 通过项目规则、已验证模板能力和 plan 索引显式读取 mvu.md，无须新事件或安装核心。

**Rationale**：只读研究核对 task-increment/SKILL.md 第 49 行仍指定 plan 保存详情，task-tutor/SKILL.md 的输入未列 mvu.md；.specify/templates/plan-template.md 产物树、tasks-template.md 前置材料及原生入口未列该文件。setup-tasks/check-prerequisites 的 AVAILABLE_DOCS 也不会自动发现它，因此不能仅依赖发现清单。原生 .agents 入口由 Codex manifest 登记，直接改副本不构成可持续交付。优先使用现有项目规则和模板机制，是否足以覆盖实际调用由 TV-05 验证。

**Alternatives**：修改官方发现脚本或重做 native commands 增加升级风险；新增 before_analyze/after_increment 等未确认事件没有依据；继续沿旧 hooks 保持多份详情会漂移。当前旧 mvu-gate hooks 在实际注销前仍执行，完整方案已在 plan 的 MVU 判定保留风险摘要，其读取 plan 的约定不被静默绕过。

## R37

**Decision**：新增 TV-05 作为文档迁移与消费的局部前置验证。C1/C2 对本次本地 Markdown 增量不新增命中；C3 是锚点/完成事实/部分保存保护，C4 是新文件跨原生流程和包内技能的读取契约。既有 TV-02、重排和骨架证据可部分复用，不能豁免新文件消费；失败只阻断依赖新契约的读写及分析，不阻断无关注册器准备。

**Rationale**：[TV-02](analysis/acceptance/tv-02-planning.md)、[正文重排](analysis/acceptance/increment-task-order.md)、[工程核验](analysis/acceptance/increment-engineering.md) 已证明各自范围的缺 plan、身份保护、保存/恢复和重复稳定，却没有实际验证独立 mvu.md、旧锚点跳转及原生 tasks/analyze 对新文件的读取。需要独立材料真实消费后才能宣称技能已适配。

**输入与信号**：旧 plan 含详情和已完成 Task、已有 mvu.md、有 plan 无 tasks、缺 plan 但有 mvu/tasks 四组；迁移组含旧 plan 锚点引用及可控保存失败。核对四项说明、只有一份活动详情、旧引用可导航、原 Task 全部要求和完成事实保持、任务生成后职责补齐、原生 tasks/analyze 读取同一来源、重复无新增；失败如实区分已写/未写并停止受影响动作。具体操作见 [TV-05 指南](quickstart.md#tv-05独立-mvu-详情与读取契约)。本次仅设计这些场景，未执行技能行为或原生流程演练。

**Alternatives**：静态检查足以确认本次 Markdown 导航，但不足以证明后续 agent 实际读新文件；用真实主线删除 plan/tasks 制造缺项会破坏工程事实。采用隔离材料和原有验证方法，保留成功的原文件与骨架供后续扩展。

## R38

**Decision**：以当前工作流宪章 5.0.0 核对方案；项目工程/仓库协作与工作流职责独立，独立提示词单独维护，不恢复互引或逐字同步要求。原 plan 中 4.0.0/4.1.0 及 VIII 的表述归历史。本轮新分工按明确用户要求在规划材料落盘，后续治理、技能、模板和真实消费仍为实施前置；不把设计文件存在当规则已在运行入口生效。

**Rationale**：FR-077/078 及实际 5.0.0 文本已分离规范职责；T081 的旧版本同步、T082/TV-04 和 T053/T054 证据保持当时范围，不能重开任务补新需求。主线仍在 T054 后首次用户阶段验收，新增文档契约的正式任务在下次 tasks 用未占用 ID 分配；原有任务及阶段批准保持，T080 仍是综合收尾。

**Alternatives**：本 Plan 顺手修改治理、技能源或工程 checkbox 会越过研究/设计边界；把新职责塞回已完成任务会追溯改验收。采用新增必要工作与未完成相关任务的明确关联，E1 工程移交仍不反向等待后续真实用户行为。

## 历史研究与旧版本依据

以下为本轮开始前研究全文，保留原编号及来源；其曾用路径、版本、状态和被替代做法均只描述当时，当前有效设计以 R35～R38、spec 和 plan 为准。

来源：[规格](spec.md)、[已确认修订](requirements/prompts/2026-11-05-workflow-revision.md)及当前仓库源码。此前 Phase 0 采用官方注册迁移、记录与博客消费两个只读研究分工；本次清理增量读取已确认的 FR-075～076/SC-026，并安排只读研究核查治理接入、证据复用及任务衔接。未安装依赖、未执行挂载、未改源码。可行性和实际用户行为在 [计划](plan.md) 的 TV-01～04 与 [验证指南](quickstart.md) 验证，不把源码推断写成实测通过。

## R32：清理规则由项目治理维护

**决策**：在章程 VII 增补生成或更新任务清单时安排末尾清理任务的通用要求，V 保留最小变更与用途核对原则，IV 保留实际代码改动的最低验证。同步章程提示词，AGENTS 只保持操作说明与治理引用一致；模式读取目标项目治理，不新增清理 skill、命令、hook 或自动删除脚本。本次只规划，拟按新增规则作 MINOR 修订 4.0.0 → 4.1.0；实际修订时核对届时版本并遵循 Sync Impact Report 程序，不在 Plan 中宣布生效。

**依据**：现行章程 VII 已统一 Task 与历史保护规则，但尚无末尾清理要求；用户要求“在宪章中补充”，并确认范围包括代码段、文档、注释、失效代码等。task-increment/SKILL.md 的定位第 1 项已读取目标治理，增量写法已保护原身份与验收；可以消费治理规则，不需要复制全文或建立新状态系统。

**备选**：只扩充 T080 无法约束以后生成的清单；逐个模式复制规则会形成多份权威；自动扫描删除脚本会把用途判断误变成固定技术规则。这些方案均不采用。将未知用途全部阻断已被用户选择 A 排除，保留并记录后续处理条件即可，但其余必要验证仍须通过。

## R33：复用收尾任务并保留已完成事实

**决策**：当前功能的实际清理并入既有 T080，保持它的原结案条件；新增治理同步和清理保护验证作为前置工作，正式身份由下一次任务流程扫描未占用 ID 后分配，不重开 T050～T052。生成/更新清单时先检查等价未完成收尾任务并复用；若只有历史已完成清理任务，保留历史，针对新工作分配未占用身份，将当前收尾安排在有效执行序列末尾，不要求编号最大。

**依据**：tasks.md 中 T049～T052 已完成，T080 未完成且已含三份治理文件的临时复核清理。原任务第 7 栏还要求全部必需结案条件与用户批准，不能因为清理子步骤完成就勾选 T080。清理治理须先进入后续任务规划并实施，不能把 4.0.0 的旧复核记作新增规则已落地。

**备选**：把新增工作塞回已完成 T050 会追溯改验收；另建并行清理进度会违反唯一工程状态；在 T080 后机械追加另一个清理任务会造成重复。选择新增必要前置、复用当前末尾收尾，既保留事实又覆盖新增需求。

## R34：局部清理的验证与保留边界

**决策**：新增 TV-04，使用隔离材料实际验证任务生成/复用、代码段和文档局部清理、用途不明保留、无清理项、失败及重复恢复。清理记录仅为原 Task 的证据，包含文件路径和符号/标题/片段定位、依据、处置结果或保留原因、后续处理条件与引用检查；不分配清理对象 ID 或机器状态。实际清理前，代码用途由调用点、导出/配置、历史与适用测试核对，文档/注释核对当前语义和引用；单次文本搜索无命中不是可删除证据。

**依据**：T051 的 [原 Task 核验](analysis/acceptance/task-inline.md)已验证身份/八栏保留、无效引用拒绝和部分保存恢复；T052 的 [TV-02 证据](analysis/acceptance/tv-02-planning.md)覆盖生成/更新规划与重复保存。两者均未验证清理用途判断或局部代码删除，故 C3 命中，三项豁免中的同类已验证与现有检查完整兜底不成立。C1/C2/C4 对本次本地清理增量未命中；实际发现外部副作用或新契约时重新判定。

**备选**：仅做关键词检查不能证明清理行为；用真实用户代码凑误删/失败场景会扩大风险；恢复时重做整个目录会破坏历史。采用小型规则核对加中型隔离流程，保留成功材料供后续增量使用；只有受影响的清理和完成更新被失败阻断，其他工作继续按自身依赖推进。

## R22

**决策**：保留临时 modes 声明并调用固定版本官方 `extension add --dev <临时目录> --force`，四项整体安装，不做逐模式注册。六旧 hooks 扩展在一次性迁移中通过官方 remove 退役。

**依据**：本地 uv 缓存 `specify-cli` METADATA 为 1.2.6；官方 `specify_cli/extensions/__init__.py` 的 install_from_directory（2371 行起）在校验后于 2538～2555 调用 self.remove；remove（3477～3570）清理旧命令、技能、hooks 和 registry。command_add.py 将 --force 传入该方法。因此五变四选路可复用官方卸载旧登记再安装新登记，不另造合并器。unregister_hooks（5923～5959）按扩展 ID 清除调用并保留其他扩展条目。

源码调查根路径为 `<source-home>/.cache/uv/archive-v0/SqGODpu5AOSLHtlR/lib/python3.15/site-packages/specify_cli/`，只作本机研究依据，不写进交付脚本或通用技能。缓存行号与 1.2.6 绑定，不推及其他版本。

**局限与待验证**：unregister_skills（2170～2233）可能整目录删除生成技能，remove 只备份特定配置，不天然保护目录内用户附件。旧五项重装证据不证明新四项替换、孤立残留或未知文件保护。先一次性只读清点精确目录，发现额外/无法确认内容停止受影响迁移并报告；TV-01 在隔离真实 CLI 中验证完整替换、失败传播及无关内容保留。

**备选**：逐模式 alias、registry 手写、自有 YAML 合并、持久指纹/所有权状态和全目录 prune 都增加维护面且违反已确认边界，不采用。

## R23

**决策**：plan 保存业务闭环 `### MVU-001` 等稳定文档锚点；tasks 保留原 Task ID、工程 checkbox、八栏目与内联步骤。闭环不成为工程身份，无独立状态；新 Task 由下一步任务生成扫描未占用 ID 后分配。

**依据**：本轮已确认删除独立子任务体系；两份 Spec 当前均没有 sub-task/subtasks/sub-tasks 目录，真实 tasks 已内联详细做法。旧 data-model/contracts 的目录状态只是失效设计，不能报告为已迁移的数据。

**备选**：新建 Txxx-S 编号/README/state.json 会重建被删除体系；把工程状态同时写进 plan/learning 会形成重复权威来源，均不用。

## R24

**决策**：MVU 以有意义、可验收、范围适合、顺序有依据的业务结果划分；技术验证编入相应前置，失败只影响依赖工作，通过骨架保留。

**依据**：用户纠正“闭环成立基于业务”；现行章程 III 的 C1～C4 与三项豁免仍提供技术风险依据。已验证技术证据可复用，画像和用户熟悉程度只能影响推荐与讲解，不能证明技术可行。

**备选**：只按表/接口/前端分层批量完成才反馈，不满足用户结果顺序；把每个小结果都强制贯穿全栈会扩大范围；另造业务和技术两套独立状态体系也不采用。

## R25

**决策**：Tutor 沿用已有 MVU；缺少时复用 Increment 规则但严格限指定 Task。独立 Increment 才可以解释同一目标下必要既有 Task 关联。步骤与学习结果分开，片段位于 learning/<Task ID>/，共同稿件归 personal-hub 既有草稿。

**依据**：用户明确撤回 Tutor 跨任务补齐；`apps/personal-hub/content.config.ts` 的 blog 集合来源为 blog/**/*.md，title/description/date 可选、tags 默认空数组、status 为 draft/published 且默认 draft。当前两篇文章是 published，不能随意选现有文章修改；具体稿件和文件名在真实共同写作时确定。

**备选**：恢复 Review 双确认、独立发布系统或 AI 自动主写所有代码不符合最新分工；draft 字段存在不等于前端各环境都隐藏草稿，本轮不承诺未验证的站点发布隔离。

## R26

**决策**：画像沿用当前 conversations 日期文件 Rnn、conclusions 日期文件 Enn 及 profile.md。回复前留已发生摘要，必要时后补上一轮实际回复，新结论/纠正有来源与情境；只服务当前仓库。

**依据**：当前已有 2026-11-05 R01～R32/E01～E13 的记录与引用链，最新 profile 已区分明确表达和暂定观察。无需新增服务或自动监听器；当前不可见历史不得假称完整捕获。

**备选**：逐字存全工具输出增加噪声且可能夹带凭据；每轮重读所有历史或把一次工程选择永久化不符合已确认规则。按实际必要信息留摘要并遵守现行 secrets 约束。

## R27

**决策**：新增 artifact-spec-analysis 与同目录 speckit-hooks.json，原生 after_tasks 触发；Increment 更新后显式复用同一技能，不增 after_increment。输出入口 analysis/spec-analysis/README.md，六类内容可分文档，diagrams.md 保留技术导航。

**依据**：现有注册器已从安装技能目录读取 hooks 配置，临时 hooks-only 声明由官方 CLI 消费；新技能只沿用该已有机制。最新输入/确认、spec、plan、MVU、tasks 关联清楚才能刷新，缺项明确说明，不把分析等同验收。

**待验证**：首次同一技能在两条调用路径保持一致，列 TV-03；不在 Plan 阶段为未更新的真实 tasks 伪造完整新分析。

**备选**：两套生成器、集中配置副本或自建事件系统不采用。

## R28

**决策**：实施前正式修订章程 III/VII、章程提示词和 AGENTS，目标 MAJOR 4.0.0；保留 I/II/IV/V/VI、最低检查、授权、保存失败保护及真实学习证据。

**依据（研究时基线）**：研究时章程为 3.0.0，III 的技术 MVU 与 VII 的独立子任务是实际治理，不能只用新技能正文绕过。spec 提供明确治理性输入，Plan 当时只记录修订设计。

**后续实际修复（2026-11-05）**：按用户修复授权，已在 analyze 之外执行独立章程修订并同步提示词/AGENTS，现行 4.0.0 正式生效，新增仓库影子规则 VIII。T050 保留文本复核，不再次升版；按后续用户确认，该内部前置与 T049～T054 合并为同一实施阶段，用户阶段验收统一在 T054 之后；源码、挂载与真实行为尚未验收。

**备选**：只改提示词、在四个模式复制任务规则、设置永久例外都会让有效约定分裂，不采用。

## R29

**决策**：先主线工程移交，再由分发真实任务验 Tutor/Increment，Direct 另由后续基础业务 Spec 验；最后主线链接实际结果回填各自条件。

**依据**：用户最新指定了样本与顺序。独立消费安装挂载仍由分发验证，不能与本 Spec 内真实用户行为互相替代；工程移交不等待其后行为，整体结案也不能跳过待验条件。研究时主线 tasks 最大 T048（其后已追加 T049～T080）；分发已完成 T001～005/T041，后续旧 T006 做法需按新集合更新。

**备选**：主线先行为完成再移交、分发又必须先拿主线，会形成循环；把分发当 Direct 样本或把未创建样本记通过均不采用。

## R30

**决策**：Markdown 写后立即执行既有 ESLint 并读回；使用 `--config.verifyDepsBeforeRun=false` 避免 pnpm 自动安装/postinstall。技术图可复用现有 Mermaid CLI/Puppeteer 浏览器，解析或渲染结果须如实记录。

**依据**：前次直接执行 pnpm exec 曾自动启动依赖检查与 postinstall，已中止；不改项目配置。当前已有 mermaid-cli、Puppeteer 与缓存 Chrome，读取 `await puppeteer.executablePath()` 可得本机路径；不能沿用此前无 DOM 的 parse 失败来假记新图通过。

**备选**：为文档额外安装浏览器/依赖或跑全仓构建不必要；伪称纯文本图块已渲染不允许。

**本次实际结果**：Mermaid CLI 使用现有 Chrome 渲染 diagrams.md 时退出 1，浏览器因缺少系统库 libnspr4.so 无法启动。未安装系统依赖或修改浏览器配置；因此只完成图块和链接的文本核查，浏览器渲染未验证，保留展示兼容性风险。

## R31

**决策**：当前 after_plan 旧 mvu-gate 仍执行风险判定/计划核查。业务图 hook 的新旧路径内容不同，按现行冲突规则停止该目标写入并报告，不覆盖历史根快照或偷偷合并；当前技术图在 diagrams.md，完整新综合分析按新任务后续生成。

**依据**：`.specify/extensions.yml` 当前仍注册两项 after_plan；diagrams/business-flow.md 与根 business-flow.md 不是相同内容。旧计划曾记录某次指定目标的人工解决，不把它当本次 hook 的自动合并能力。

**备选**：为让 hook 表面通过而删快照、改配置、伪造同字节或写另一份冲突副本均不采用。

## 本轮研究结论

技术路线与责任边界已确定，无阻断性技术选型待澄清。源码确认不是实际迁移或清理通过；TV-01～04 的当前执行事实以原 Task 和证据为准，不重做已有通过部分，也不把旧证据扩展为新场景通过。现行治理为 4.0.0，清理增量的治理修订及 TV-04 尚待实施。R32～R34 是本次清理设计，后文 R22～R31 及历史调查保留各自来源；本轮不执行实际清理、安装、卸载、发布、数据库或真实博客写入。

## 历史研究记录（下文的“当前”“本轮”仅指记录当时）

R1～R21 及其曾经的候选路径保留来源；与本轮 R22～R31 冲突的五模式、七 hooks、独立子任务、状态 helper、Review 双确认和直调 shell 外部入口均已失效，不再作为实施依据。

## R21：直接运行环境对应的脚本（2026-11-04）

用户取消 Node 转发层。安装、hooks、五指令与后续公共入口直接执行 .sh/.ps1，不创建共用环境分发器或自有 TS/JS/Python 安装核心。构建和测试仍使用各自既有工具；官方工具自身的运行依赖单列。CLI 版本只由 FOUNDRY_SPECIFY_VERSION 或默认 1.2.6 决定，不自动读取项目版本。此决定替代旧运行入口方案，不追溯修改已取得的历史测试结果或任务状态。

现有 Linux 平台脚本和独立构建副本已验证，证据见 [安装验收最新修正](analysis/acceptance/script-mount-mvu.md)；其他平台和模式行为仍按原任务分别验收。

## R20：五指令统一官方重装（2026-11-04）

用户明确总共五个指令，每次安装全部重新挂载，不做其他状态逻辑。采用一个临时 modes 扩展包含 tutor/pair/review/explore/guide，官方 CLI 1.2.6 的 ExtensionManifest 要求 speckit.<扩展>.<指令>，对应 Codex 的 `$speckit-modes-<模式>`；.start 是旧脚本自行添加，已取消。原两独立扩展方案造成重复入口，退回统一五指令；单模式安装和额外保护状态逻辑不再作为验收要求。已有 hooks 更新不变。正文和附件准备后一次官方 add --dev --force，CLI 负责状态，失败上报。T042/T043/T048 复用原编号执行修正，工程记录见统一验收。

**2026-11-03 顺序修订**：用户明确要求先实施 T042、T043，再在 T048 一同验收。该决定替代原 T048 前置门禁，仅适用于本轮；C3/C4 风险、真实验证及配置保护不减免，统一通过前不进入行为验收。

## R20：现有完整入口每次刷新全部来源（2026-11-04 同步）

用户已确认所有技能和 hooks 都刷新；现有 nuxt:prepare 串联开源技能、自定义技能、hooks 和两模式入口，已有 registry 不再跳过。hooks 共用 YAML 更新核心，保留用户控制；两模式每次调用官方 CLI，仅明确归属的安装允许覆盖刷新，未知内容在调用前保护。版本默认 1.2.6，兼容已验证的 1.2.5。实际工作区 19 个自定义技能、12 个 hooks、两新入口核验通过，旧 modes 保留；PowerShell 和真实用户行为未验证。

本决定及 R19 替代下文历史调查中的包根扩展、只首次安装和未锁版本方案；历史版本与测试事实不追溯改写。具体设计见 [全量重新挂载设计](analysis/full-remount-design.md)。

## R19：包只提供技能与脚本，官方命令负责挂载（2026-11-03）

用户明确：`packages/skills` 只提供 skill 和脚本，不作为 Spec Kit 扩展源，不维护包根 `extension.yml`、固定扩展声明或命令模板。挂载脚本调用 Spec Kit 官方命令，受管配置和入口由官方 CLI 生成。官方命令若要求 manifest，脚本只在调用时准备临时输入，既不提交到技能包，也不作为预定义扩展随发布交付；此路线必须先实测验证，不能把旧包级扩展安装结果沿用为通过。

此前 R13/R15 的“包根声明并直接安装整个包”作为历史方案保留，接入方式已被本决定替代。本轮已实测 CLI 1.2.6 的两模式首次、重复、源码更新和缺失入口修复，以及 1.2.5 兼容刷新；当前工作区完整刷新已成功。临时输入、命名、配置保护及限制见 [全量刷新验收](analysis/acceptance/script-mount-mvu.md)，T048 仍待用户阶段验收。新脚本采用已有 register-commands 四件套位置，最小能力只覆盖当前两模式；分发恢复时在其上演化，不另建第二套注册器。

## 追加需求的当前决定 R15～R18（2026-11-03）

本节为 Explore / Guide 的有效设计依据；下文 R14 及更早调查保留历史。与本节冲突的旧实施顺序、旧模式验收、旧 MVU-D 门禁不再适用于追加需求。R14 的父级交付约定及宪章唯一来源继续有效。

### R15：两个独立正文，直接使用原生扩展

- **Decision**：新增 task-explore、task-guide 两个源技能，extension.yml 分别声明 speckit.modes.explore、speckit.modes.guide；当前 Codex 生成 $speckit-modes-explore、$speckit-modes-guide。
- **Rationale**：当前本机 specify-cli 1.2.4.dev0 的 _register_extension_skills 遍历全部命令，直接读取 file 指向的 SKILL.md；现有 extension.yml 和已生成模式正文证明此接入机制，没有三指令数量限制。当前 init-options.json 为 codex + ai_skills:true。
- **Alternatives considered**：给 Pair/Tutor 加参数不满足独立指令；新增 wrapper、router 或 helper 增加不必要维护面。
- **证据**：packages/skills/extension.yml、.specify/init-options.json、.agents/skills/speckit-modes-pair/SKILL.md；本机已安装 specify_cli/extensions/**init**.py 的_register_extension_skills 与命令名转换逻辑。缓存绝对位置不是运行契约。新入口目前未实现或安装。

### R16：正式 Task 是两个模式的共同门槛

- **Decision**：采用用户澄清选择 B。两模式均读取已有需求、方案、正式任务；Explore 允许最终效果未知，但探索问题、范围及观察/结束条件须明确。复用既有 Task 定位和记录，不自动创建临时任务。
- **Rationale**：一步实现或一步指导必须有范围与验收依据；未知效果不等于没有任务准备。现有 task-pair 的定位流程可复用思想，权限与行为不可原样照搬。
- **Alternatives considered**：从自由想法直接开工与选择 B 冲突；逐轮强制拆 Subtask 会把对话误当任务结构；新增状态模型违反已确认的简化方向。
- **兼容边界**：通用源技能使用其他项目已有材料；原生生成包装仍声明 Spec Kit 环境要求，不宣称该包装可脱离项目安装。非 Spec Kit 不创建 .specify。

### R17：已有交付机制足够，本轮无新增 MVU

- **Decision**：沿用默认 Vite manifest、link-skills 和真实 MCP registry；C1～C4 无新增命中，不建运行时或自动恢复服务。
- **Rationale**：build/plugins/manifest.ts 自动发现分类技能目录；registry.py 消费现有 manifest；挂载脚本已有正文/附件复制与失败处理。analysis/acceptance/native-extension.md、analysis/acceptance/task-decomposition.md 提供同类机制的历史证据；本次另行读取实际源码确认现状。
- **Alternatives considered**：为协作上下文开发 state.json、锁、回执或事务框架会重新引入已撤回机制；新分发能力属于暂停中的另一需求。
- **限制**：历史安装记录部分描述旧包装层，不能整体沿用；历史通过不等于新模式通过。协作行为须真实验收，若实现另引新技术假设则重新评估 MVU。

### R18：替换旧专项验收，保留通用工程检查

- **Decision**：test_manifest.py 中 test_mode_sources_link_project_governance、test_mcp_modes_expose_reachable_project_governance 的目标改为 task-explore/task-guide；其余清单一致性、退役约束及真实 registry 测试保留。旧三模式入口、行为、联调和专项回归全部移除。
- **Rationale**：通用打包检查动态枚举全部源文件，并非旧模式功能验收。默认 build 不依赖 distribution 模式；不运行 test:distribution。新增技能无需修改 MCP server 注册分支或 link-skills 运行逻辑。
- **Alternatives considered**：删除整个包测试会丢失公共交付保障；保留旧专项测试作为门槛违背用户决策；关键词检查不能代替真实用户反馈或保存失败演练。
- **实施验证**：按 quickstart 先正文 ESLint，再包 lint/check-types/build/test 和挂载沙箱测试；包测试直接调用真实 MCP registry，满足未改消费契约下的最小消费方核对。若扩展到 server 对外映射，再按实际改动运行其测试。
- **现有限制**：本机无 PowerShell；上游 quick_validate.py 的历史 destructive 字段不兼容不能宣称已解决。本次调查未运行安装、包构建或测试，行为结果均待实施验收。

## 历史决定 R14：整体交付约定与宪章唯一规则（2026-10-31）

- **Decision**：用户最终确认拆分后父任务保留整体交付约定，详细做法下沉。普通对话生成标准工程子任务；Tutor 生成含学习环节的形式。全部子任务公共规则写宪章 VII，现有模式只消费，不新增 Skill、命令、状态脚本或管理框架。
- **Rationale**：父级需要独立回答最终交付与整体完成标准；子任务要能从最小元素逐步完成复杂目标，不能只是标题列表。先保存、检查、读回和核对覆盖，再精简父级，避免丢失原要求。
- **Alternatives considered**：“父级只留链接”已被用户撤销；“父级保留全部八栏目”造成做法重复维护；“只有 Tutor 拆分”不支持用户直接口头请求；“另建子任务 Skill”违反用户明确约束。
- **实际现状**：当前已安装模式仍有子任务字段/目录规则副本；本轮仅先更新规格、治理和计划。T035～T038 负责修订消费规则、包交付与原生重装及实际验收，不借用 T034 旧结论。
- **验证边界**：现有读写/格式检查/原生安装有使用先例，不新增技术协议；内容覆盖和真实行为需按 quickstart 逐项核查。普通注册器测试的 yaml 缺入口为已发现限制，不把历史临时加载器当可持久运行入口。

## 决定 R13（历史接入方式由 R19 替代，子任务规则归属由 R14 修订）：单个技能兼容环境，扩展直接引用（2026-10-30）

用户明确撤销技能不得包含 Spec Kit 内容的要求。模式规则与 Spec Kit/其他任务环境的上下文选择在同一 SKILL.md 内维护，extension.yml 直接引用技能，不保留 commands 包装目录。Spec Kit 使用实际指针、标准材料及子任务目录；其他工具沿用现有记录，不制造 .specify。官方 ExtensionManifest 已校验直接文件引用有效，生成与重装仍使用原生 CLI，不手改受管文件。

R12 将工具内容完全移出技能的强制边界及禁止关键字的测试撤销，既有中立技能无需因此重写；Task/Subtask 唯一记录、真实证据和授权要求仍有效。R12 的过去验收保留为历史，不作为当前拆层要求。

## 决定 R11：目录 Markdown（2026-10-30，父级形态由 R14 修订）

用户已取消独立 JSON 子任务状态与 workflow-task-context；tasks.md 只保存父任务及子任务索引，每个 subtasks/<Subtask ID>/README.md 是定义、验收、状态和续接的唯一记录，evidence.md 保存证据。agent 直接维护 Markdown，模式专属材料只引用子任务；不新增管理 Skill、状态脚本、锁、action DTO 或回执系统。当前 plan/data-model/contracts 与 tasks 的 Phase 3 已按此修订。下方 R1～R10 及阶段验收保留为旧试制调查历史，其中与 R11 不一致的共享状态/CLI/article helper/交接 hooks 决定失效，不得继续执行。技术原因不是旧测试失败，而是用户明确简化治理与记录方式。

## 以下为试制调查历史（已由 R11 取代冲突内容）

当前运行时决定：用户在 Phase 2 验收后明确指定 Python；R3/R8/R9 中涉及新增 Node helper/测试的部分由下述 R10 替代，保留原调查作为历史依据。

日期：2026-10-29。输入为本目录 `spec.md`，仓库事实以本次读取为准；需求中 Assumptions 保留此前调查快照，不将其当作当前安装证明。本文完成 Phase 0，设计待验证的技术命题进入 `plan.md` 的 MVU 表，在实施阶段验证。

## R1：沿用当前 Codex skills 接入

- **Decision（决策）**：在 `packages/skills/src/speckit/` 新增 `speckit-tutor`、`speckit-pair`、`speckit-review` 与内部 `workflow-task-context`。继续由 `link-skills` 铺平复制，原生 Implement 与 workflow 不复制、不改写。
- **Rationale（依据）**：`.specify/init-options.json`、`.specify/integration.json` 和 Codex manifest 均记录 1.2.5；本机 uv 缓存的 `specify_cli-1.2.5.dist-info/METADATA` 与发行源码一致。当前 PATH 未发现独立 `specify`，不能声称已执行版本命令。原子安装入口 `scripts/dev/atomic/speckit/speckit.sh` 使用 `uvx --from specify-cli specify init`，没有锁定该版本。当前原生 Implement 文件 hash 与安装 manifest 一致。
- **Alternatives considered（备选）**：原生 extension 包或独立 workflow 会增加安装/更新面；另写 Auto 会复制工程实施职责。当前没有核实到原生 Subtask API，不依赖虚构接口。
- **证据位置**：`.specify/integrations/codex.manifest.json`；`.agents/skills/speckit-implement/SKILL.md`；本机缓存 `specify_cli/integrations/codex/__init__.py`。本机绝对缓存路径仅作调查证据，不进入运行契约。

## R2：保留 MVU，使用现有钩子完成交接

- **Decision**：保持全部 `mvu-gate` 源文、挂载及注册条目原样。新增 `workflow-task-context` 的 `before_implement` / `after_implement` 交接，前置交接排在既有 MVU 条目之后，无 `condition`，必执行；没有共享状态的旧功能直接无操作返回。
- **Rationale**：原生 Implement 已含这两个扩展点。缓存 1.2.5 的 `specify_cli/extensions/__init__.py` 中 `HookExecutor.execute_hook()` 返回执行说明，真正执行委托 agent；当前技能则直接读 YAML 并分发，不能称为程序级硬门禁。原生提示词没有承诺 `priority` 排序，故按配置条目顺序设计。裸技能名的渲染与 `speckit.*` 不同，沿用已验证的技能名与点换横线规则。
- **Alternatives considered**：修改原生 Implement 会在下次 init 被覆盖；仅在返回 Tutor 时补同步，无法完整记录进入 Implement 的交接。收尾 hook 可能因中断不执行，因此恢复入口仍必须重读任务、代码和证据，不根据缺失回执推断成功。
- **待验证**：MVU-B 检查真实跨模式执行、无状态旧功能、MVU 阻塞与中断恢复。

## R3：本地文件保存，最小共享状态 helper

- **Decision**：每个父 Task 一个权威 `subtasks/<Task ID>/state.json`，保存子任务、模式摘要、Tutor/Pair/Review 可变元数据与提交回执；逐轮材料及归档按用途独立存放。新增 Node ESM helper，仅使用 `node:fs`、`node:path`、`node:crypto` 等内置模块。执行入口放共享技能的直接 `references/*.mjs` 文件，测试放本包 `tests/`。
- **Rationale**：现有 manifest 插件仅收 `SKILL.md` 与 `references/` 的直接文件；复制挂载则包含整个技能目录。平铺参考文件可以保持 manifest schema 不变，并让本地 Codex 从挂载路径执行；MCP 获得的是文本资源，不因此获得执行能力。此功能只承诺本地文件工具可用的 Codex 工作流，不新增 MCP 服务或执行协议。
- **Alternatives considered**：仅用提示词手写多份状态无法可靠验证重试和部分失败；数据库、事件服务、全量通用状态机超出需求。单个大 Markdown 同时保存学习与操作记录会混淆状态归属。
- **待验证**：MVU-A；独占锁、revision 比对、同目录临时文件替换、不可覆盖归档和提交回执只提供定义范围内的恢复策略，不宣称跨文件天然事务或断电绝对持久化。Node 官方说明文件写入应串行等待，`wx` 用于排他创建；具体平台行为仍须测试：[Node 文件系统 API](https://nodejs.org/api/fs.html)。

## R4：保持原定验收，状态相互独立

- **Decision**：子任务创建时冻结 `goal_kind` 与 `acceptance`；模式切换复用身份。编码达标不会令学习通过；学习单元通过不会令 Tutor 会话结束；任何共享状态操作均不自动勾选父任务。原生 Implement 仍按工程验收更新 `tasks.md`。
- **Rationale**：落实三项已确认边界。Tutor 回复先形成完整可恢复材料并保存，提交成功后发送对应教学内容；失败回复仅报告保存问题，不开展新步骤。Pair 的局部授权绑定步骤、路径、范围及文件基线，单次使用，不跨模式继承。
- **Alternatives considered**：父子状态自动汇总、按模式重新拆解、把解释或 AI 示例当实践证据均违反规格。单纯“已结束”不能表达用户是否掌握。

## R5：按用途分类，兼容既有路径

- **Decision**：原生 `spec.md`、`plan.md`、`tasks.md`、`research.md`、`data-model.md`、`quickstart.md`、`contracts/`、`checklists/` 保留。新辅助产物分类为 `subtasks/`、`diagrams/`、`analysis/`、`learning/`、`collaboration/`、`reviews/`、`descriptions/`；按实际使用创建目录。
- **Rationale**：现有 artifact skills 及钩子 prompt 写死根目录落点，必须在实施时同步 source、注册器与契约，而非只画新目录树。旧资料保留原位置，读取时优先新路径、缺失时兼容旧路径；同时存在则以明确来源索引判断，冲突报告，禁止自动合并。
- **治理衔接**：本次 plan 仍执行当前有效的根目录 `business-flow.md` 钩子；章程要求根目录 `diagrams.md`，本次在其中保存共享状态提交图，其他模式状态图放 `diagrams/state-transitions.md`。实施后业务图写入 `diagrams/business-flow.md`，`diagrams.md` 保留章程要求的技术图与导航职责。不会提前修改当前技能或迁移旧图。
- **Alternatives considered**：统一迁移历史资料会破坏引用；移动原生规格文件会破坏 core 路径解析。

## R6：精确退役旧机制，防止初始化复活

- **Decision**：仅退役 `explainer-doc-sync` 源技能、已确认归属的复制挂载、Implement 两个旧条目及对应注册数据。Bash/PowerShell 注册器增加仅匹配这两个旧键与命令的过滤；挂载器对已确认的旧复制目录做定向清理，未知内容或被用户改动的副本报告冲突，不全局 prune。
- **Rationale**：`link-skills` 保留源中不存在的目标；`register-hooks` 只 upsert。只删源文件或当前 YAML 无法保证重跑初始化后旧调用为零。`nuxt-prepare` 先复制技能再注册钩子，两个实现与测试必须同步。
- **历史处理**：在仍作为活动入口引用的旧契约增加替代说明，保留历史 FR-006/FR-007 原文、既有文档与引用。历史 `tasks.md` 指向的 `specs/stacks/001-chimera-cloud-deploy/fastmcp.md` 真实存在；旧 `docs/tools/fastmcp.md` 不存在，仅记录定位建议，不批量改历史链接。
- **Alternatives considered**：全目录清理会误删上游/用户技能；全仓 grep 命中必须为零会误删历史。验收统计“有效调用”，历史文字另外记录。
- **待验证**：MVU-C，包含旧安装升级、两次初始化、未知条目保留及 MVU 字节不变。

## R7：博客使用现有 Markdown 草稿，不新建发布系统

- **Decision**：正式稿仍在 `apps/personal-hub/content/blog/**/*.md`。Review 的确认 A 绑定逐篇主题、目标、动作与大纲；确认 B 绑定最终格式化字节、目标原文 hash、引用及差异。新建或更新均保存为 `draft`，`published` 更新必须展示原地转草稿；任一相关内容变化使对应确认失效。
- **Rationale**：本地安装 Nuxt 4.6.3 / Content 3.16.2。`content.config.ts` 定义 blog/garden/datastore；blog 前缀 `/posts`，字段包含 title/description/date/tags/status，status 默认 draft。集合与 schema 的概念可对照 [Nuxt Content 官方文档](https://content.nuxt.com/docs/collections/define)，本项目实际字段仍以本地配置为准。
- **运行事实**：列表 `useBlogPosts.ts` 使用 `Boolean(runtimeConfig.public.isDev)`；详情 `posts/[...slug].vue` 使用 `import.meta.dev`，已存在非 dev 草稿 404 守卫。列表可受 `NUXT_PUBLIC_IS_DEV` 覆盖，字符串 `false` 不等于布尔假。`nuxt.config.ts` 实际固定 D1 与 `cloudflare_module`，SQLite 回退代码已注释，不能依据文件旧注释承诺 Node 生产预览可用。
- **Alternatives considered**：独立修订草稿库、自动发布或博客整体重构均不符合范围。列表与详情既有风险纳入 MVU-D；只有在实际默认环境违反草稿安全且用户确认具体修复范围后，才安排局部修复，不能静默扩大本计划。
- **待验证**：MVU-D 分别检查开发/非开发列表、详情及实际 Worker 本地运行；不能跑通就报告阻塞，不声称发布隔离已验证。

## R8：分级验收与现有检查衔接

- **Decision**：实施时按章程修订程序将分级原则纳入第 IV 条，预计 MINOR 1.3.1 → 1.4.0，保留第 III 条全文。小型覆盖单项不变量，中型覆盖单模式完整生命周期，大型覆盖跨模式、持久化和博客集成；本功能因涵盖三类风险采用相应代表验收，不推广为所有功能都跑全套。
- **Rationale**：`@foundry/skills` 现有只有 build，无 lint/check-types；计划在本包补 `lint: eslint .` 与 `check-types: tsc --noEmit`，保留原配置并让新增 helper/tests 纳入 ESLint。JS helper 由 Node 行为测试覆盖；不声称现有 tsc 已检查其全部运行语义。消费者 `apps/mcp` 使用 manifest，构建后运行相关消费测试。
- **Alternatives considered**：只验证技能能被发现不足以证明权限、双确认和恢复；运行全仓 lint/build 会扩大与本次无关的失败面。不存在根级 `pnpm test`。

## R9：分析项修订（2026-10-30）

- **Decision**：I1 在每个源修改组汇合后的实际演练入口刷新受管挂载，核对完整文件清单及每文件 hash；build 只更新 manifest。I2 让 B 绑定最终目标路径下的格式固定点与 format_context_hash，锁内写入前只读复算，变化先回审批且零目标写入。U1 在 workflow.md 固定全部 action/嵌套 DTO/恢复请求的键、类型、条件必填及初始化/生命周期规则。U2 以任务头定义和八栏目计算规范指纹，明确排除 checkbox 与运行材料。
- **Rationale**：复制副本不会随源或 build 自动更新；按 Spec 路径格式化不能证明博客目标路径相同；严格拒绝未知字段必须先有完整输入形状；合法工程勾选不应触发“任务定义已变”。相关条件补入原 30 项任务和 A/B/D 验收，不扩大需求或改动实际实现。
- **Alternatives considered**：只在 T013 复制一次会留下过期入口；写正式文件后再自动修复并补批准不符合双确认；任由调用方猜 payload 键或对整个 tasks.md 取 hash 会破坏恢复契约。以上路线均不采用。
- **验证边界**：这是设计修订，实际 helper/挂载/格式预计算与用户演练仍由后续任务验证；本阶段不声称行为已实现。

## 研究结论与验证边界

设计选择已确定，无待用户澄清的技术选型。尚未执行的可行性验证统一列为 MVU-A～D，不能当作 Phase 0 已实现或已验收。本阶段仅生成设计文档，章程修订、技能删除、注册变更、业务文件写入、helper 实现和行为演练均留到后续任务与实施。

## R10：按用户要求迁移为 Python 标准库（2026-10-30）

- **Decision**：用户明确要求「我们使用python脚本吧」。新增共享状态脚本改为平铺 references/state.py，未来文章 helper 同步规划为 article.py；新增行为测试改为 Python unittest。标准库承担文件排他写入、fsync、os.replace、SHA-256、JSON、子进程与锁拥有者检查，不新增 pip 依赖或 Python workspace。
- **兼容边界**：JSON schema_version=1、CLI read/check/commit/recover、退出码 0/2/3/4、任务指纹、操作 UUID、回执 hash 和不可变材料协议保持。Python 公共函数为 read_task_state/commit_task_operation/recover_task_operation，同步返回结果字典；context 的 repoRoot/featureDirectory/taskId 字段保持兼容。
- **验证**：保留旧 Node 实现的真实固定状态/回执样例，以独立字节 hash 验证 Python 可读、可重放并继续提交，包含 Unicode 与 UUID 规范化；原有故障/恢复与挂载场景全部改用 unittest。Python bool 必须排除在整数 revision/version 外。Markdown 仍调用项目既有 ESLint，关闭执行前自动安装；包的 TS 构建及 MCP manifest schema 不变。
- **范围**：只迁移本功能新增 helper 与测试，不重写 scripts/dev 既有 Node 四件套测试，不改原生 Implement/MVU、不激活真实工作区挂载；此前 Node 验收记录作为历史，Python 有单独迁移验收记录。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
