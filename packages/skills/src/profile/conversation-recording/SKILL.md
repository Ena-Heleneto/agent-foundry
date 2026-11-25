---
name: conversation-recording
description: 核对 Codex CLI 项目级对话记录、资料位置和保存缺口，适用于首条消息、普通问答、业务请求、提交停写及会话恢复。
compatibility: 项目级自动入口适用于 Linux 上已启用分页会话的 Codex CLI 0.172.0，安装与回调需要 Python 3.10 或更高版本。
---

# 保存 Codex 会话记录

项目级安装交付本 Skill 和 Codex Hook。已从正式入口安装并在 Codex 完成信任时，首条用户原话、已完成的工具活动和实际最终回复由 Hook 保存。查阅记录或处理缺口时按[触发和保存时机](references/recording-timing.md)定位。把修复、实际 Git 提交和后续普通动作拆成独立调用，使每次提交及其结果可按发生顺序跳过记录。

项目安装位于 `.agents/skills/conversation-recording`，安装归属可从同目录的 `.foundry-recording-install.json` 核对。直接处理用户请求，由宿主 Hook 完成记录。用户要求查阅记录时，把查阅作为本轮业务。根据[资料契约](references/storage-contract.md)定位主记录和详情，根据[写入失败与重试](references/write-failures.md)说明仍缺失的范围。
