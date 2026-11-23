---
name: conversation-recording
description: 在项目入口要求记录时，核验 Codex CLI 交互会话的身份和归属，并按实际轮次保存对话索引、详情及可取得的附件。
compatibility: 已验证 Linux 上的 Codex CLI 0.171.0 前台分页交互会话。
---

# 保存 Codex 会话记录

将可取得的发言、工具活动和附件原件保存到资料区，使当轮索引能定位到详情。

1. 项目入口要求记录时，先读取[触发和保存时机](references/recording-timing.md)，按[会话归属与身份](references/session-scope.md)实际核对当前轮次和来源。归属不符或无法核实时，跳过自动记录，继续用户任务。
2. 核实归属后，按[共用资料契约](references/storage-contract.md)定位仓库外资料根和当前会话的记录。
3. 按[内容采集与提交边界](references/event-capture.md)取得本轮实际业务活动、改动和附件，判断提交步骤及结果回复的保存边界。
4. 按[会话写入协调和断点核对](references/resume-records.md)取得本次写入范围，用宿主已有文件工具按[成对保存规则](references/paired-save.md)写入并读回。首条用户消息和普通末轮按时机规则保存。
5. 遇到路径冲突、写入失败或无法完成读回确认时，按[写入失败与重试](references/write-failures.md)先提示具体缺口、保留已确认内容，再继续本轮工作。
