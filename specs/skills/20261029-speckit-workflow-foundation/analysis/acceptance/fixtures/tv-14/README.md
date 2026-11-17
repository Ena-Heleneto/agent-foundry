# TV-14：T114 宿主接入预检

## 2026-11-17 当前记录候选实测

本节沿[最新适用方案](../../../../implementation/T114.md#2026-11-17-本次开工最小消息保存链)实施新对话即记录；下方早期预检及生命周期实验保持发生时原文，不再作为独立退出hook前置。本次新增既有shadow-profile的capture/inspect附件，没有另建Skill或修改真实安装副本。

实际先写行为测试并看到附件缺失导致失败，再实现；随后增加畸形来源元数据回归，看到失败后修正。14项范围测试通过，包括原文/分段、工具思维过滤、身份和版本拒绝、持久去重、同身份冲突、部分行、真实文件失败、fsync失败回退及inotify自动捕获合成用户/最终回复。全包26项中23通过，3项既有register-commands用例因旧脚本缺失失败，与开工前12项/3失败基线一致；未改断言或接管安装线。

将完整Skill三文件精确复制至本项目忽略目录，读回副本正文/宿主约束后运行副本入口。当前原生会话源声明0.169.0且thread/cwd匹配，从本轮用户输入的真实行偏移开始，实际保存7条消息（用户1、commentary 6）；期间新发出的过程回复无需再调用保存命令即落盘。逐条核对源三元组、原文/分段、角色/phase和顺序一致，无重复；77条工具或思维完成事件被排除，7份成功收据对应实际读回，未出现错误。观察到保存处理最大耗时约5.02ms，仅表示本次接收至读回，不是宿主消息端到端性能保证。

脱离私人正文的结果及候选哈希见[recording-2026-11-17.json](recording-2026-11-17.json)。真实源路径、身份和正文仅留本项目忽略目录，未写入通用夹具。核验后停止并回收本次受管测试进程；这是清理，不重启退出hook或强杀门禁。未启用真实资料根，未复制到真实安装副本。

随后只读审查发现失败回退尚未核实尾部所有权：若外部不遵循共同锁的程序在fsync失败前追加，直接truncate可能删除它的原文。新增回归先看到失败，再补尾部长度及字节检查；不能核实属于本次追加时保留现场并报告缺口。审查复核该问题已解决。最终15项范围测试通过，全包27项/24通过/3既有失败；修正后的完整Skill重新精确复制并读回，以同一当前原生来源复验，10条（用户1、commentary 9）正文/分段/身份/角色/顺序全部相符，排除107条工具/思维事件，10份真实保存收据，无错误。进程已回收；前后候选哈希及分次结果均保留，不把首次结果冒认修正版本实测。

原生最终回复在监听期间到达的场景本轮仍未验证，合成final测试不能冒认该项；控件/非文本、实际语义分析派发、共同发布/遗忘协议及正式接入仍未验收。已有coverage时本版明确拒绝写入，不能删coverage绕过。T114保持未完成，T115～T118不据此推进。skill-creator的quick_validate实际因缺少PyYAML而失败，单独记录缺前置，不声称该验证通过。

日期：2026-11-16。关联 [T114](../../../../tasks.md#t114)及[本项方案](../../../../implementation/T114.md)。这是当前宿主接入条件的只读预检，未进入隔离持续采集或完整产品实验。

## 实际结果

当前候选未通过接入前置，结果为 `unsupported / lifecycle_unavailable`。这只是本次候选在现有可核验输入下不能启动，不代表所有 Codex 宿主都不支持，也不声称存在已交付的 runtime 返回了该错误。

| 核对项             | 实际观察                                                                        | 能够证明的范围                                                                    |
| ------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 当前会话身份及来源 | 宿主提供CODEX_THREAD_ID；按该确切身份匹配唯一日志；session_meta的id和cwd匹配    | 当前来源可定位，不是搜索其他对话猜测身份                                          |
| 当前源结构         | 观察到event_msg/item_completed、UserMessage与AgentMessage，样本身份字段齐全     | 只证明结构及元数据，不证明正文完整、白名单过滤或保存链正确                        |
| 本机CLI与源版本    | 本机codex-cli 0.167.0；当前源session_meta的cli_version为0.169.0                 | 版本分别记录，不将本机CLI版本冒认当前宿主服务端版本                               |
| 每轮完成与会话结束 | 源内task_complete后存在新的task_started；AgentMessage有commentary和final_answer | 轮次完成仍可继续会话，不能作为可靠会话关闭信号                                    |
| 生命周期通道       | 已检查会话相关环境变量和当前暴露工具，未取得经验证的会话结束句柄/订阅           | 前置仍未满足；变量或工具未暴露不能证明宿主全局不存在此能力                        |
| 当前App Server代理 | codex app-server proxy只发送initialize，6秒内未收到返回，探针清理退出-15        | 本次握手未验证成功，未列/读其他线程、未发送模型请求或修改配置；清理不是主会话关闭 |

原始无正文观察分别保存为[来源预检](current-session-readiness.json)和[代理握手](proxy-initialize.json)。两次来源结构观察发生在同一轮不同操作时点，字段计数是各次实际快照，不宣称它们是一份原子快照或完整覆盖。本次不保存真实thread/item值、机器路径、对话正文、工具原始返回或凭据。

## 操作与可复核依据

实际执行 `codex --version`、`codex exec --help` 和 `codex app-server proxy --help`，核对本地命令及其作用。用Python标准库读取宿主提供的当前thread值，仅按文件名匹配该thread的日志；先校验首行session_meta身份/cwd，再只统计白名单事件类型、消息种类、phase及身份完整性。没有把源日志复制到项目，没有启动watch_current.py或任何持续记录器。

生命周期环境检查仅记录下列变量是否存在：CODEX_THREAD_ID、CODEX_TURN_ID、CODEX_SESSION_ID、CODEX_THREAD_LOG_PATH、CODEX_TRANSCRIPT_PATH、CODEX_LIFECYCLE_FD、CODEX_SESSION_END_FD。其中thread/session身份存在，其余未提供；这些名字不是已证实的统一宿主标准。当前可调用的任务工具提供列表、读取、等待、归档等操作，未提供已验证的当前会话结束通知。本次不调用归档来人为关闭主任务，不用任意父PID或固定超时冒认生命周期。

代理握手由临时受管子进程运行，只发送JSON-RPC initialize（clientInfo为本次只读预检名称/版本），select等待6秒；无返回后terminate并回收进程。该6秒只限定连接探针，不是记录或分析时限。只持久保存有无响应和退出事实，不保存潜在认证数据或原始stderr，不启动新App Server或新模型会话替代当前连接。

## 未执行及恢复条件

持续capture、自由输入逐字对比、普通final后无下一轮的自动保存、真实关闭/异常退出、持久去重/保存失败恢复、四类语义触发/反例与实际子代理派发、锁争用及失效拒收骨架均未执行。当前来源中观察到final_answer不等于末轮自动保存通过；没有配置、没有报错或旧五条探针均不能抵扣这些验收。

按[R65](../../../../research.md#r65当前linuxcodex事件候选与生命周期门禁)和[运行契约](../../../../contracts/shadow-profile.md)，现阶段不建立依赖生命周期假设的产品逻辑，不创建或安装新的runtime/host-contract，不修改Skill、项目hooks、主线构建或真实画像。T114保持未完成，其依赖链T115～T118不推进；T113已完成事实及其他工作线不受此预检结论覆盖。

继续路线须先解决生命周期接入：优先在当前宿主取得可信thread/source及可验证结束通道，并在自有隔离项目验证普通final、持续会话与实际退出；若确实不能提供，再讨论受控客户端备选。备选必须明确新宿主边界、真实线程身份和受管关闭通道，并重新验证，不能把它声称为当前会话已接入，也不能通过放宽“关闭后不记录”要求求通过。这里只列待讨论路线，不替用户确认改用新运行入口。

## 保存与工程检查

本轮9份目标Markdown/JSON执行定向 `pnpm exec eslint --fix --no-ignore` 退出0；4份新增Markdown的29处文件/锚点引用检查通过，两个JSON已解析读回并核对原始观察一致。118个原Task身份/顺序保持，唯一checkbox变化为T113完成，T114保持未完成。目标 `git diff --check` 通过；未执行源码构建、产品测试或安装，文档及证据检查不抵扣TV-14运行验收。

## 2026-11-17 显式Implement后的续接预检

用户再次指定本Spec并调用 `$speckit-implement`。本轮复用T114原方案和停止条件，重新核对现行宪章、原Task、当前Spec/Plan/MVU、模型、专项契约、TV-14及存量Skill/探针；T113不重复实施。前置脚本在显式指定功能目录且禁止持久化定位的环境下成功返回该Spec及5类可用文档；规格清单18/18通过，未修改清单。extensions.yml由Prettier的YAML解析器成功解析，已执行唯一启用的mandatory before_implement实施准备技能；没有after_implement条目。Python环境没有PyYAML，首次解析尝试因此未执行成功，随后复用已有Prettier解析，不安装新依赖。

本轮独立观察保存在[11月17日无正文证据](readiness-2026-11-17.json)，旧JSON及11月16日实测原文保持。仅按当前确切thread定位唯一日志，session_meta身份/cwd匹配，源声明0.169.0；当时只观察到1条用户和3条Agent commentary的完成元数据，未验证普通final或完整原文保存。统计是单次快照，不能外推后续覆盖。

新增只读命令 `codex app-server daemon version` 成功返回：PATH CLI为0.167.0，受管可执行文件及运行App Server均为0.169.0。该命令还返回受管程序和socket定位，只在本轮进程内使用，不保存路径、配置或认证信息。先用PATH程序/默认连接，再用受管0.169.0程序/显式socket，各发送一次initialize；两次均在10秒观察窗口内无stdout/stderr返回，探针仍运行，随后terminate并回收，退出-15。第二次观察排除了“仅仅换成匹配版本和显式socket即可握手成功”的猜测，尚未定位不响应的根因。10秒只限制连接预检，不是记录、分析或会话结束阈值；未向服务发送thread列表/读取、resume或模型请求，未新建或重启服务。

本轮重新核对[官方Hooks说明](https://learn.chatgpt.com/docs/hooks#sessionend)：SessionEnd可在正常关闭、归档/删除仍打开的主会话，或无客户端打开且空闲30分钟后触发；切换会话或unsubscribe不等于立即结束。该页还要求非受管hook经信任审阅，transcript_path可空且格式不稳定。[官方App Server说明](https://learn.chatgpt.com/docs/app-server#unsubscribe-from-a-loaded-thread)的thread/closed也涉及最后订阅者离开后的卸载条件。因此文档列出事件只能提供接入候选，不能证明当前会话已经有可靠结束通道；异常退出保障仍需独立实测。本轮Context7查询返回exec-server初始化示例，不将不同服务的协议当App Server接入证据。

结论仍为本次候选 `unsupported / lifecycle_unavailable`。匹配版本及来源已核对，实际生命周期接入仍未通过；不宣称所有宿主不支持，也不以当前会话尚未结束时没有结束事件作反证。没有启动持续capture、编写runtime/host-contract、派发分析、修改hooks/配置或真实副本。普通final/末轮、正常及异常退出、语义触发、保存/去重/锁等原验收仍未执行，T114不勾选，T115～T118不推进。

恢复沿原方案进入接入讨论：可先讨论在自有隔离项目验证宿主SessionStart/SessionEnd通道，或另讨论受控客户端。前者能否提供异常退出保障及适用于当前宿主仍待验，后者会改变运行入口，均不是本轮已认可或已实施路线；不改变原“关闭后不记录/补录”要求。仓库已有Node/Python产物和环境忽略，根包为private，现阶段不发布；本轮没有新增构建产物，不为预检批量改忽略规则，build目录中仍有正式构建源码须保护。

续接保存核验：5份本轮Markdown/JSON定向ESLint检查退出0；18处本轮涉及的文件/锚点引用、JSON解析及当前Task断言通过，目标git diff --check通过。与写入前快照比较，118条原Task checkbox/任务行保持，其他既有未提交文件字节未变；本轮只追加T114方案/证据/tasks定位，并新增无正文观察及当日影子摘要。未执行源码构建或产品验收，这些资料检查不放行T114。报告前再次读取extensions.yml，仍无after_implement条目。

## 2026-11-17 用户确认后的隔离hook实验

用户在本会话澄清是否另建Skill后答“可以”。本轮沿T114原方案补充并读回[隔离实验范围](../../../../implementation/T114.md#2026-11-17-隔离生命周期实验)，只验证既有shadow-profile所需宿主信号；没有新增Skill或切换真实使用入口。可复现探针为[probe_lifecycle.py](probe_lifecycle.py)，8次运行、10个用例的逐次真实元数据保存在[lifecycle-2026-11-17.json](lifecycle-2026-11-17.json)，没有项目私人正文、终端原始输出、机器配置值或认证文件。

先后4次交互式CLI预检（空白2次、合成初始输入1次、合成输入加no-daemon 1次）均未见SessionStart，Ctrl-D未使进程退出；后3次新增诊断只观察到loading标记，原因未定位，均按独立清理回收，不能算正常退出验证。查[上游测试](https://github.com/openai/codex/blob/main/codex-rs/core/tests/suite/hooks.rs)及[维护者说明](https://github.com/openai/codex/issues/54353)后确认SessionStart在首轮用户输入时触发，不能以空白会话没有事件宣称不支持。上游main测试只作调查依据，不冒认为本机0.169.0实测。

转为非交互式exec后，最初只有项目hooks.json的试验没有hook收据，却出现turn.completed；因此原先“UserPromptSubmit会阻断”的设计未被执行证实，该次不能宣称零模型请求或阻断成功。随后给探针增加仅本机回环地址的模型请求拒绝器（不转发、不读存正文、不使用认证），明确临时config层及诊断标记。项目文件来源仍无hook收据，出现untrusted/trust诊断，本地拒绝器实际收到1次请求并返回503，用例退出1；不把该失败或信任选项存在记为hook已加载。

最后改用仅本次进程的inline hook定义，保持同一合成输入/处理器/本地拒绝器。首次正常关闭取得实际收据后，重新执行正常/SIGTERM/SIGKILL完整矩阵。它验证的是Codex CLI 0.169.0的exec进程及inline来源，不抵扣项目文件加载、原生日志或当前App宿主接入。

| 最终矩阵输入                                     | 实际事件顺序                                                      | CLI退出 | 本地请求数 | 可核验结论                                        |
| ------------------------------------------------ | ----------------------------------------------------------------- | ------- | ---------- | ------------------------------------------------- |
| UserPromptSubmit屏障放行后返回阻断，CLI正常结束  | SessionStart → UserPromptSubmit → SessionEnd，同一真实session身份 | 0       | 0          | 此隔离正常结束hook可用；不是持续会话普通final验证 |
| 同步UserPromptSubmit屏障期间对被测CLI发送SIGTERM | SessionStart → UserPromptSubmit，未见SessionEnd                   | -15     | 0          | 已启动会话的这条异常退出路径不能靠SessionEnd兜底  |
| 同一屏障期间对被测CLI发送SIGKILL                 | SessionStart → UserPromptSubmit，未见SessionEnd                   | -9      | 0          | 强杀路径没有hook收据，不能据正常用例推定可靠关闭  |

3例均先实际取得SessionStart及UserPromptSubmit收据再触发退出，cwd匹配，PreModelRequest观察为0，处理器和测试CLI真实身份可核对；独立清理只处理自己创建的进程组，CLI均已回收。每例退出后另观察0.5秒才读收据，此窗口只是实验界限，不推断永久不会迟到，也不以时间替代退出信号。正常例SessionEnd在实际CLI进程退出前已落盘；异常例没有结束收据，已证明单靠该hook不覆盖本矩阵。stderr有untrusted/trust/error/warning分类，CLI JSON仍含error类型item；未保存或完整诊断其私人原文，不宣称宿主整体无警告。

这些exec使用ephemeral，因此实际transcript_path均未提供，不证明可将本测试session身份连接到持久原文。ignore-user-config与仅本次进程的hook来源用于隔离测试，未保存机器信任、修改真实项目hooks或改写CODEX_HOME；最终3例模型provider固定为不转发的本地拒绝器，不能将其0请求结论扩为早期所有尝试。

复现最终矩阵时显式选择同版本程序：

```bash
python3 - <<'PY'
import json
import subprocess

host = json.loads(subprocess.check_output(['codex', 'app-server', 'daemon', 'version']))
subprocess.run([
    'python3',
    'specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/tv-14/probe_lifecycle.py',
    '--codex', host['managedCodexPath'],
    '--transport', 'exec', '--hook-source', 'inline', '--case', 'all',
], check=True)
PY
```

本轮小型生命周期实验已获得部分正反证据，T114的完整接入仍未通过：项目文件正式加载、可信持久source、当前主会话异常结束通道、普通final/末轮、实际分析派发及共同保存骨架仍缺验收。仅有SessionEnd不满足完整生命周期条件，当前记录候选仍不启动；原Task不勾选，T115～T118不推进。后续先核对项目级加载的真实信任流程，并取得能对应确切主会话的异常结束通道；如需改变正式宿主或运行入口，沿原方案讨论，不能直接采用本实验exec进程或任意父PID冒充当前主会话。
