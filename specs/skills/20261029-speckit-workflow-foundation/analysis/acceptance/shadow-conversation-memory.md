# 完整原文记录验收

## 2026-11-18 当前路线说明

用户已[确认主 AI 按 Skill 直接保存](../../requirements/raw/2026-11-18-ai-records-dialogue.md)，不再依赖下方 capture/inspect 或宿主版本。新来源及行为验收见[本轮记录](shadow-ai-recording-2026-11-18.md)。下方旧脚本实验、失败及未验项保留发生时事实，不升级为新路线通过；T115仍保持未完成，T116～T118分别核验。

本页沿[T115方案](../../implementation/T115.md)保存当前真实交付及缺口；原[T114证据](fixtures/tv-14/README.md)按发生时保留，不把其技术勾选当用户手动通过。

## 2026-11-18：T115覆盖与恢复

已实现capture/inspect的接收事实、原文与读回收据分开保存；coverage.md持久关联实际时点、来源检查点和无正文缺口。原文成功而收据失败后保留原文，核实恢复时只补实际读回收据；同事件不重复、同文字不同身份分别保留。恢复校验来源设备/inode、元信息和前缀摘要，不接收关闭后补录，不让诊断入口跳过窗口。

范围仍为已观察的Linux/Codex 0.169.0消息结构及普通文本。异步题目保持Agent归属，A保持实际用户原字；未知内容、非文本标记及未知coverage/失效代际拒写并说明缺口。非文本仅引用的实际字段尚未取得，不能宣称附件适配完成。分析、发布、遗忘及正式启用继续按原Task分工。

### 实际验证

- `python3 -B -m unittest discover -s packages/skills/tests -p 'test_shadow_*.py'`：27项通过。新增覆盖测试先观察旧实现失败，再实现；包括原文成功/收据失败、恢复去重、部分源行及补齐、改写原文/来源、未知覆盖和遗忘代际拒写。
- 独立审查复现2项重要问题：once显式EOF可跳过消息、运行中前缀改写可覆盖旧检查点。新增复现用例先失败，修复后全部通过；独立定向复核4项通过，原问题关闭。
- `python3 -B -m unittest discover -s specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/tv-14 -p 'test_probe_*.py'`：首次6项中1项因旧fixture先等ready再观察锁而失败；T115在ready前读取检查点同样需要锁。现改为先取得真实内核等待、释放后核对ready和6条收据；保留固定inode及退出释放断言。不同新事件用两条真实独立合成线程竞争同根锁，避免让一个thread映射两个不同source。调整后6项通过，没有删断言或放宽产品来源校验。
- `pnpm --filter @foundry/skills test`：39项，36通过、3项既有失败，均因缺少`packages/skills/script/register-commands/register-commands.sh`；未改其他工作线或断言求绿。`pnpm --filter @foundry/skills check-types`通过；Python语法及范围差异空白检查通过。

从维护源经既有link-skills脚本精确复制完整Skill至`.cache/t115-20261118/skills/shadow-profile/`，3个文件逐字及SHA-256一致。测试代理先完整读旧安装版，确认旧版没有这些入口说明；再完整消费新副本正文和宿主附件并实际运行命令。新建子会话的实际宿主为0.169.1，本候选真实返回unsupported_source，inspect核对接收/原文/确认保存均为0、缺口已持久化、分析/入口为null。此为正确拒收与技能使用证据，不能算普通往返通过，未擅自增加版本白名单。

当前主会话仍为已核验的0.169.0结构，已完整消费新副本并启动前台记录器；旧T114进程在核对自身PID/命令后停止，旧资料保留。新隔离根为`.cache/t115-20261118/live-current/memory/`，原文位于其`conversations/raw/<真实thread>.jsonl`，收据在同级`receipts.jsonl`，定位在`launch-context.json`。这些不是正式默认目录，不搬迁或回填旧记录。实际检查已有可见说明自动保存，正文/角色/phase/顺序/身份逐项匹配、未确认范围和缺口均为0；不把本轮中途接入算完整一轮。

脱敏汇总见[t115-recording-2026-11-18.json](fixtures/tv-14/t115-recording-2026-11-18.json)。本轮普通final已启动独立前台观察，结果写入[t115-native-primary-2026-11-18.json](fixtures/tv-14/t115-native-primary-2026-11-18.json)；本页保存时尚未发出最终答复，状态仍为等待，后续按实际文件核对，不预报通过。该探针完成后只回收其自己的测试子进程，当前持续观察记录器另行保留。

### 未完成与下一步

T115工程checkbox保持未完成。最终副本下连续至少3轮正常往返、普通final保存和真实非文本引用字段尚待补齐；0.169.1子会话被拒绝的测试不抵扣3轮，先前T114窗口/恢复样本也不抵扣。正常后续交流可提供实时样本，无需用户反复发送测试口令；有真实图片/文件样本后再依据实际字段实现引用适配。

正式`.specify/memory/user-shadow/conversations/raw/`仍未建立，日常摘要保持原布局，目标项目的正式复制/启用及最终来源验收留在T118。T116/T117没有开始；未提交、推送、构建或发布。

## 2026-11-18：下一轮检查到记录器已停止

用户问“什么情况，对话中断了？”后实际核对：上一轮[native-final结果](fixtures/tv-14/t115-native-primary-2026-11-18.json)已通过，普通final确在下一输入前保存，探针清理完成。但持续记录器原PID已不存在，原exec会话也不可用；收据没有错误，原coverage未自动记录进程消失。当前问题当时尚未入原文。停止时间、退出码与原因未知，不能认定界面中断、主会话退出或根因已修复；这也说明进程存续仍未完成验收。

核对当前真实thread、来源、项目及既有前缀一致，旧检查点之后第一条可见消息就是当前用户问题；按原方案先持久缺口，再使用同副本capture --resume恢复。实际读回当前问题及已出现说明，确认5条、未确认0、未解决缺口0。恢复写入不计实时往返或连续三轮通过，T115保持未完成。原文件保留；当前启动定位改为`.cache/t115-20261118/live-current/active-launch.json`所指的`launch-context-recovery-1.json`，收据和原文继续使用原隔离根。

具体脱敏事实见[t115-interruption-recovery-2026-11-18.json](fixtures/tv-14/t115-interruption-recovery-2026-11-18.json)。本轮只恢复既有记录链并说明失败，未改产品代码或安装常驻服务；后续仍需查清停止原因及验证实际跨轮存续。
