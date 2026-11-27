# 每出现新对话自动保存：当前会话事件探针

日期：2026-11-16。来源：用户明确要求“验证一下 每出现新对话就自动保存”，随后通过问答控件提交“自动记录测试”。分析触发条件仍待定。本轮是经授权的短时验证，不是正式记录器实施、安装、Spec重写或工程Task完成。

## 结果与适用范围

**当前会话自动事件链路局部通过**：临时脚本已自动保存5条宿主可见消息事件，其中1条为用户测试答复、4条为Agent消息；A/B两条新标记逐字核对一致，用户答复中的answer字段精确为“自动记录测试”。这些保存由Linux文件追加事件触发，没有逐条调用read_thread或让模型组织保存，也没有分析子代理。

本次依赖当前宿主日志的实际结构；只证明180秒探针窗口内的5条样本，不证明所有宿主、所有发言类型、长期运行、轮转/重启/异常退出、所有最终回复或完整自动接入均已通过。临时进程已按预设时限退出，未保留后台记录服务。

## 核对与试验顺序

先检查Git并完整读取项目shadow-profile及openai-docs。项目`.codex/config.toml`仅有mcp_servers，不存在项目hooks配置；本地CLI为0.169.0，features显示hooks可用，这不等同当前会话已挂载记录器。现行Skill仅要求Agent每轮执行摘要流程，本身没有消息事件写入器。未修改本项目或用户全局配置、没有写入hook信任记录。

1. **不调用保存的对照**：给上一主代理主动保存样本文件做哈希/mtime/行数快照，再发出`AUTO_RECORD_CONTROL_6F2A`可见消息，期间不调用对话保存。复核文件仍为4行、哈希和mtime不变、新标记不存在。这只证明上一主动保存探针没有自动追加到其目标文件，不证明宿主没有自己的原生日志。记录见[对照数据](fixtures/shadow-auto-record/current-session-control.json)。
2. **当前原生代理连接**：用`codex app-server proxy`只发送initialize，限定6秒内未收到握手返回，随后停止进程；没有列会话、发送新任务、resume或修改当前会话。该路径本轮未能验证，不声称接口不存在或宿主不支持。见[连接观察](fixtures/shadow-auto-record/proxy-availability.json)。
3. **隔离原生CLI事件实验**：本地临时模型响应夹具只产生合成commentary/final文本，CLI使用ephemeral、忽略用户配置和规则、禁用apps/plugins/hooks，没有访问真实模型或改用户配置。原生CLI确实发出item.completed，外部事件回调自动保存两条合成输出；未直接验证当前聊天，用户输入也不在这一stdout样本内。turn.completed可见，但清理等待3秒后进程被终止，退出-15，不把它算正常退出通过。见[实际数据](fixtures/shadow-auto-record/isolated-native-events.json)。
4. **当前确切会话文件事件实验**：仅在当前日期目录按已提供的确切threadId匹配一个会话日志，并读取其session_meta核对id和cwd均为本项目。没有搜索其他会话内容或复制机器配置；未把日志内工具、系统提示或推理内容保存成对话。之后仅监听这个已核实文件的追加。

官方[App Server文档](https://learn.chatgpt.com/docs/app-server)公开消息完成通知；[Hooks文档](https://learn.chatgpt.com/docs/hooks)同时说明transcript格式不是稳定接口。本轮实际成功使用的是下述当前日志事件结构，没有把公开接口当当前连接成功证据。

## 当前会话自动保存方法

主会话身份由宿主实际提供为`01a1e23a-8d38-7353-a5eb-db20fc4046ea`；事件turnId为`01a1e36a-57c8-7b52-9eb5-a81fbc0cc766`。只读取这个身份对应文件，session_meta的id及cwd均匹配。源文件绝对机器路径仅在临时exact-current-source.json中，用于本次限域定位，没有复制进通用技能或发行配置。

临时探针[watch_current.py](fixtures/shadow-auto-record/watch_current.py)使用Linux inotify的IN_MODIFY/IN_CLOSE_WRITE；从启动时文件末尾开始，不回扫旧对话。select等待文件事件，没有周期调用read_thread抓取消息。启动后才发A/B新消息并请求一条真实用户测试输入。输出目录为临时`/tmp/shadow-auto-record-probe-20261116/`，不是正式画像资料根。

探针只接受本会话的event_msg/item_completed，且item.type仅允许UserMessage/AgentMessage；其余事件跳过。保留原生thread/turn/item身份、角色、phase、已完成可见文本和completed_at_ms。按这三个身份去重，每次写入后flush/fsync并读回；工具调用/返回、其他项目发言、系统提示及Reasoning不写入对话样本。

用户通过问答控件输入的源消息带send_user_message_question_reply封装，本次按宿主UserMessage原文保存并核对answer字段；这证明该类新用户事件能自动触发，不等同普通自由输入覆盖已验，也不把封装中的问题、控件元数据都认定为用户亲口说过。正式采集需区分可见回答和宿主来源封装。

## 样本与实测

| 样本                             | 实际观察                                                                               | 从源消息完成事件到写入并读回 |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------- |
| 标记A：AUTO_EVENT_MESSAGE_A_8E71 | 主代理真实commentary，完整匹配                                                         | 1.291毫秒                    |
| 问答控件测试请求                 | 宿主AgentMessage、phase=final_answer、id为call开头，属于控件展示，不当普通最终答复验收 | 6.056毫秒                    |
| 用户测试答复                     | 用户自行提交answer=自动记录测试，宿主封装完整保存并实际解析核对                        | 1.805毫秒                    |
| 收到输入后的过程说明             | 主代理真实commentary，自动追加                                                         | 1.663毫秒                    |
| 标记B：AUTO_EVENT_MESSAGE_B_3C94 | 主代理真实commentary，完整匹配                                                         | 0.890毫秒                    |

源completed_at_ms到保存读回时刻使用本机实际时间字段；测的是**完整消息完成事件之后**的记录延迟，不是首个字出现之后，也不是UI渲染延迟。0.890～6.056毫秒仅为5条本机样本，不作为性能保证。具体时间/身份见[原始收据](fixtures/shadow-auto-record/current-event-receipts.jsonl)，父代理已重新读取实际记录文件，检查A/B全文、用户answer、角色、顺序和身份唯一性。

探针从ready到180秒时限退出，结果reason=timeout、savedCount=5，统一执行会话exit_code=0。父代理随后写停止标记时探针已按时限退出，不把它描述成受控停止标记触发，也不把退出实验等同主会话关闭。实际结果见[探针结果](fixtures/shadow-auto-record/watcher-result.json)及[核对汇总](fixtures/shadow-auto-record/current-automatic-verification.json)。代码副本与实际执行版本SHA-256一致：ae1f240ecc323cd0c5b7ca45fda7e5161506f7cfe344c5f083fda4e34f41d26b。

## 正式接入仍需处理

- 本次是主代理启动的临时记录进程，不是只写一段Skill约定就能让所有输出自动保存；没有安装每次会话自动启动接入。
- 源日志结构不是稳定契约，当前CLI版本也不单独证明当前桌面/服务端版本；需要声明宿主适用范围、校验实际结构并处理版本变化。
- 普通自由输入、普通最终回复、长文本、非文本、日志轮转/截断、多会话并发、异常关闭和重新启动尚未按新路径验收。当前控件消息的final_answer不能冒充普通最终回复的已测证据。
- 临时进程已退出；本报告发出时不会据此前探针继续承诺保存后续发言，也不预写尚未发出的最终答复。
- 分析触发未选择，没有生成个人结论或改画像；Spec/Plan/MVU/Tasks仍保留上一分工，最新讨论及本证据给出差异，后续定稿再同步。不改工程checkbox，不提交或公开。
