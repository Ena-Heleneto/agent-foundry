- [ ] T115 [US14] 沿T114骨架完善原文capture/inspect及恢复于 packages/skills/src/profile/shadow-profile/scripts/shadow_runtime.py、packages/skills/src/profile/shadow-profile/SKILL.md 和 packages/skills/src/profile/shadow-profile/references/host-contract.md，证据保存于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/shadow-conversation-memory.md

**验收与边界**：conversations/raw/<thread>.jsonl保留完整text、真实thread_id/turn_id/item_id、role/phase、线程内顺序及真实完成/接收时点，成功读回时点由coverage关联，不预填未来结果。“JSON解码后text逐字一致”；两轮同文本分别保留，同事件一份；部分行/解析失败/轮转/截断/监听溢出均说明缺口，恢复只在同会话仍运行且来源可核验时处理，关闭后不补录。旧日期摘要/Rnn原地保留，不冒认为完整副本；首次无认识建立理解不足入口，不强造结论；非文本只引用/必要说明，不复制原件。按TV-14连续至少3轮、CLI继续运行时普通final后无下一轮、保存失败和重启去重核对，范围内原文/角色/顺序/来源正确率100%，逐条模型保存0，控件元数据/工具明细/不可见内容混入0。inspect显示接收/保存实际覆盖与缺口；已检测故障在当前会话下一可见反馈说明，正常协作继续，私人内容不进通用附件。覆盖FR-065/066/111～114/117/121/122/125及SC-023/048/050/051。

- [ ] T116 [US14] 实现语义触发后的分析、snapshot/commit和精简消费于 packages/skills/src/profile/shadow-profile/SKILL.md 及 packages/skills/src/profile/shadow-profile/scripts/shadow_runtime.py，证据保存于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/shadow-conversation-memory.md

- [ ] T117 [US14] 完善共同发布、forget与reader失效校验于 packages/skills/src/profile/shadow-profile/scripts/shadow_runtime.py 和 packages/skills/src/profile/shadow-profile/SKILL.md，证据保存于 specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/shadow-conversation-memory.md

**验收与边界**：最终SKILL.md、scripts/shadow_runtime.py、references/host-contract.md完整集合及字节与复制副本一致，由实际宿主重新加载后复验TV-14的新消息自动记录/CLI运行时普通final/主动退出真实覆盖、正反语义触发/实际派发、1次重试上限、按需查询/故障提示、并发/遗忘和2000字入口。记录实际时点与覆盖，不采用固定分析时限；原文保存、分析正确、入口可用和真实应用分别留证。候选通过不抵扣最终来源实读，副本不手改；无真实应用机会继续未验，原[T112](#t112)本人应用职责保持，源码复制不冒认未来正式安装。主线构建/安装及紧急版分工保持，不新增同一效果任务。覆盖SC-048～055最终来源交付。

建议新增MVP到T115：先有已证实、可恢复、含普通最终回复且会话结束即停的原文链；该局部结果不等于分析/精简/并发遗忘交付。完整新增目标到T118，再按真实应用机会及原T080完整条件结案。各任务具体做法在开工时按已有材料形成/复用原Task方案，不在生成阶段实施。

| 原文/过滤/持久去重与缺口          | T115   | 连续3轮与无下一轮末轮正确率100%，关闭后补录0，失败不提前计已存           |

**依赖**：[T114](#t114)。只扩展已通过骨架和已确认支持范围，不靠Skill文字替代真实采集。

**依赖**：[T116](#t116)。按当前运行契约完善已有协调骨架，不以旧串行样本推定并发无损。

**验收与边界**：触发kind=preference/goal/correction/manual，普通过程先积累，触发不直接认定永久特征。主代理真实派发分析子代理，snapshot包含source_refs/字节校验、base_profile_digest、forget_generation及更正依据；分析锁外进行，先保存conclusions认识与coverage事实，再更新profile。至少1次增量分析、1次回查早期原文重新提炼，区分明确表达/Agent建议/观察/决定，来源可追溯100%；无新认识不强造结论，普通更正保留旧依据。入口“正文最多2000字”，按模型正文Unicode字符数含换行/Markdown、头部少量覆盖元信息不计；原文和详细分析不截断，移出结束进度/重复/失效内容，长期偏好不按固定天数失效。分析尽快异步、无固定时限，主代理继续原任务，至少1次入口尚未更新时立即应用当前纠正；至少1次按需查询能分辨已存/已分析/入口覆盖与实际时点/延迟。“retry_count最多1”：按[模型](data-model.md#分析轮次重试计数与中断恢复)绑定真实trigger_ref对应的一轮，派发前先持久预留并读回；重启、重复事件、子代理重建和快照调整不重置，结果不明不盲目补派发。按TV-14验证首次/重试派发前后中断、已预留但结果不明、新触发另轮，同一轮实际最多首次加1次自动重试；仍失败停止本轮，只有新正常触发或用户新的手动要求才基于已存有效覆盖续接；不可恢复失败不自动重复，分析成功而发布部分失败只补缺失发布、不重复结论。故障下一可见反馈提示，不引入1分钟/5分钟门槛。覆盖US9关联结果、FR-067/068/110/115/116/118～122/125及SC-049/050/052/053/055。

**验收与边界**：所有正式writer复用同根固定.shadow-write.lock及短临界区，模型不持锁，不删建锁文件，不承诺多文件事务。发布核对快照后新增用户表达/纠正，不能仅重读旧profile；至少2会话无冲突增量均保留、明确更正优先、不明冲突保留双方依据待核实且独立增量可继续，旧分析晚到不覆盖新纠正，范围内有效来源/纠正保留100%、静默丢失/覆盖0。遗忘先持久写并读回forget_generation与无正文source_refs拒收，再删除项目内相关原文/分析/入口及临时派生并修引用，完成核验后才报告成功；Git历史另议，非文本只引用不复制原件。验证遗忘后旧分析、排队发布、重试、恢复和原文重投迟到，相关回写0；删除中断后拒收持续，reader每次使用缓存或磁盘入口前核对代际/删除缺口，受影响旧入口不得消费，恢复只续清除、不用旧备份回填。无内容失效依据不能复述遗忘原话；若持久化失败说明未完成。用隔离合成资料验证，不删除真实本人资料；覆盖满额入口/过期信息处理，未运行不计通过。覆盖FR-117/122～125及SC-050/054/055。
