# 本项目对话覆盖

- 日期与本地来源：2026-11-19（Asia/Shanghai），S01 / T01；宿主消息、会话及轮次 ID 不可得。
- 控制依据：[项目控制](../user-shadow.recording-control.md)。已启用原文、每轮摘要和条件分析；资料仅留本项目，未启用画像。
- 原文已保存并读回：[M01](conversations/raw/2026-11-19.md#M01)—[M03](conversations/raw/2026-11-19.md#M03)，包含本轮用户请求和两条已发送助手过程说明；工具交互、运行上下文及子代理内部发言不属原文。
- 摘要演练：唯一摘要子代理 `/root/conversation_summary` 已亲自读取 M01—M02，使用文件工具对当日约定目标 `conversations/2026-11-19.md` 调用 `Path.write_text` 恰好一次，真实返回 `IsADirectoryError: [Errno 21] Is a directory`。M03 的通知在尝试之后到达，未纳入该次读取。主 AI 已实际读取核验 [写前核对证据](evidence/summary-2026-11-19-precheck.json) 和 [真实保存返回证据](evidence/summary-2026-11-19-save-result.json)，并确认目标仍为空目录。未删除、移动、更名、修复、重试或转存摘要；证据不是摘要替代。摘要未保存、未读回，M01—M03 均没有已保存摘要覆盖；恢复需另行解决原路径类型冲突，本次按用户要求保留现场，不绕过失败。
- 条件分析独立派发给 `/root/conversation_analysis`；主 AI 已实际读取核验 [E01](conclusions/2026-11-19.md#E01)、[E02](conclusions/2026-11-19.md#E02)。分析实际读取 M01—M02，直接依据 M01，确认本项目先给结论再讲原因、仅在项目留存资料；M03 是助手过程和答复，没有新增用户分析触发。
- 末轮缺口：尚未发送的 final 不预写；若下一轮仍可见，补存本轮真实 final。无后续调用时保留末轮缺口。
- 未自动提交、推送、公开，也未设置后台任务或项目外资料。
