# 后台命名方案的规格同步

来源为 2026-11-27 的会话记录讨论。普通首轮的同文复验中，五轮都收到派发提示，四轮实际创建命名子代理，一轮直接回答。用户随后询问修复方式。

> 该怎么修复

讨论提出由记录 Hook 启动独立的后台命名任务，由 AI 根据已保存的发言判断是否返回标题。用户接着询问 Hook 支持情况。

> 有这样的hook吗

隔离验证确认 Codex 0.172.0 的 `UserPromptSubmit` 可以并列配置同步保存和异步命令处理器。讨论中约定命名处理器先确认本轮原话已落盘，再启动独立的 `codex exec`。用户随后要求同步规格。

> 同步spec

[普通首轮复验](../../analysis/recording-acceptance.md#普通首轮自动派发重复性复验) · [Codex 后台 Hook](https://learn.chatgpt.com/docs/hooks#run-hooks-in-the-background)
