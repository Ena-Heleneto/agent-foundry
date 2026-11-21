# 已撤回的影子记录器候选

按[2026-11-18 用户纠正及确认](../../requirements/raw/2026-11-18-ai-records-dialogue.md)，当前由主 AI 按 Skill 每轮直接保存可见原文，不再依赖 Python 监听器或宿主版本。

本目录保留本轮调整前的 SKILL.before.md、scripts/shadow_runtime.py 和 references/host-contract.md 原字节，manifest.json 记录原来源及 SHA-256。脚本和宿主约束已从维护源移出，不随当前 Skill 复制。它们保留实验/回归价值，不代表当前产品仍需运行附件。

model.before.md、plan.before.md、contract.before.md、tv14.before.md、diagrams.before.md、mvu.before.md、analysis.before.md、flows.before.md 为被替换设计区段的原文摘录；spec-lines.before.md 和 task-lines.before.md 记录被改条款或任务说明。未制作整份 Plan 快照，原 T114/115 方案及 TV-14 历史实验继续保留发生时事实。

packages/skills/tests/test_shadow_runtime.py 的 SCRIPT 指向这里的历史脚本，test_shadow_coverage.py 复用该路径；原27项断言保持。测试通过只证明历史候选未因迁移受损，不能证明新 Skill 自然调用、原文完整性或真实应用已经通过。当前行为验证沿[本轮记录](../../analysis/acceptance/shadow-ai-recording-2026-11-18.md)。

不将任何真实私人对话、画像或机器来源绝对路径新增到此目录；此前私人档案归档不在本次处置范围。
