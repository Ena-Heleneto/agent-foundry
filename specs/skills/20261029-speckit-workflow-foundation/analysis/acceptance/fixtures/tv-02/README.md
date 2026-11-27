# TV-02 独立材料索引

对应 [T052](../../../../tasks.md#t052)；本次仅验证 Increment 最小规划写回，完整业务骨架复用留 T054。材料是隔离工程输入，不是用户实践或真实分发反馈。

## 本次输入与操作位置

临时根：`/tmp/foundry-t052-bjs4co8g/`。每个项目有 AGENTS.md、.specify/memory/constitution.md、.specify/feature.json、specs/demo/spec.md、data/labels.txt 与 evidence/read-list.txt。每个项目独立，只有各自 plan/tasks 可修改；完整写前副本位于 before/<场景>/，无技能基线副本位于 baseline/。

| 场景目录（cases 下） | 初始材料                          | 本次调用与应观察信号                                                          |
| -------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| no-plan              | 无 plan、无 tasks                 | 请求增量规划；缺 plan 时列缺项，不自行实施或生成计划/任务                     |
| orphan-tasks         | 无 plan、有孤立 tasks             | 同上；原 T004/T009 与证据保留                                                 |
| plan-only            | 有 plan、无 tasks                 | 规划并保存业务闭环与项目八栏任务；生成不等于工程完成                          |
| existing             | 有 plan/tasks                     | 新增标签与筛选目标形成可执行路径；保留已完成 T004、未完成 T009 与原验收/证据  |
| selected             | 与 existing 同输入，指定 T009     | 从筛选目标解释必要关联，保留无匹配空列表验收；不改已完成事实                  |
| save-failure         | 有 plan/tasks，tasks.md 权限 0444 | 请求更新规划和任务，实际写入失败时回报已写/未写，停止依赖；获准修复后读回续接 |

业务输入：管理员查看、新增并筛选本地标签；已有 alpha/beta，拟新增 gamma，筛选 alpha 只显示 alpha，无匹配时空列表。已有 T004 的 [x] 和只读证据是明确标记的测试预置事实；T009 为未完成筛选任务。新增任务使用未占用 ID，不能重用 T004/T009。

## 执行和记录规则

先在 baseline/no-plan 与 baseline/plan-only 无新技能运行实际规划请求，记录 agent 的真实选择。源码形成后从 packages/skills/src/skills/workflow/task-increment/SKILL.md 实际读取加载，同样请求在 cases 下运行；这不宣称 speckit-modes-increment 已注册。每次返回项目 result.txt、实际来源、读写路径与限制；评估者独立比对文件与工程 checkbox。重复调用继续同一目录，不复制出新的工程状态。

保存失败项目禁止执行者改变权限、删除或替换受保护 tasks.md；由主执行者观察实际失败后再将该测试文件恢复 0644，后续继续读取同一现场。只改本次临时项目权限，不触及真实主线文件。

实际命令、输出与文件差异已归档到 [TV-02 验证记录](../../tv-02-planning.md)。四种材料分支、同现场重复和真实保存失败恢复已实际执行；输入副本在 before/，首次结果在 first/，恢复与重复后的结果在 cases/。主执行者另读回校验原 ID/状态/验收/证据、八栏与引用，结果见上述记录；这些结论仅限 T052 规划写回。T054 的业务骨架实现目录、代码路径和命令尚未产生，必须在 T054 写实现前追加此处。

## T054：同一技术骨架增量交付业务样本

本轮先登记路径与操作，随后才创建实现。隔离根为 `/tmp/foundry-t054-zv1heeo5`，业务工程为其 `business/`；它与 T052 的规划原型独立，不进入产品或分发。正式目标固定为“用户保存一项待办，重新打开列表仍可查看”，原 Task 使用该工程的 tasks.md 唯一记录，技术通过不能代替业务验收或真实用户批准。

具体文件为 `business/storage.py`（同一存储适配器及后续新增/列表函数）、`business/tests/test_storage.py`（成功写入/重新读取、真实写入拒绝及提交失败保护）、`business/app.py`（后续业务 CLI）、`business/data/todos.json`（隔离业务输入），以及 `business/{AGENTS.md,spec.md,plan.md,tasks.md}`。仅使用 Python 标准库及本地临时文件，无数据库或外部系统。技术阶段先用独立 unittest 观察未实现的真实失败，再实现 storage.py；技术通过后将当时源码、测试、输出和摘要保存到本轮 `stages/technical/`，后续沿原 `business/storage.py` 增量加入业务，不另写同功能适配器或改技术验收。

在 business 目录执行 `python3 -B -m unittest discover -s tests -v`；写失败保护使用隔离只读目录实际拒绝写入，并在真实文件写入路径的最后替换边界注入 OSError，检查旧记录字节保持及无残留临时文件，不以 mock 调用次数充当保护结果。测试恢复的权限仅限本轮自建临时目录。业务完成后复跑同一测试，再分别运行 `python3 -B app.py add '验证待办' --file data/todos.json` 和 `python3 -B app.py list --file data/todos.json`，观察不同进程重开列表仍出现该项，并检查空输入失败不损坏原记录。实施前以本段为准读回，日志保存本轮 logs，业务和技术前后 diff/摘要及关键代码和结果持久留在 [Increment 工程验收](../../increment-engineering.md)；该验收文件由实际结果形成，不预写通过。

定位与风险分支材料在本轮 `location/`；T082 原 `/tmp/foundry-t082-x7uoxnsp/cases/{new,reuse,mixed,none}` 继续使用，本轮写前副本在 `tv04-current-before/`，原始未清理输入仍保留在 T082 的 before。不改真实 feature.json，不读取或复制仓库个人画像到夹具。T053 对照和最小回归证据继续保留，不把新试验冒充原现场。

## 后续保留与续接

T053/T057 继续使用同一 task-increment 技能源；相关复验优先沿用上述 cases、before、first 原现场，不清理或另起同功能材料替代已验骨架。完整临时材料仍在 `/tmp/foundry-t052-bjs4co8g`，操作系统清理可能使其丢失；续接前须先检查实际目录及摘要。若缺失，明确报告现场不可用，按本索引重建的输入只能算新一轮复验，必须保存新的动作和结果，不能以旧哈希冒充原现场或恢复成功。已持久保存的响应、差异、摘要与原结论继续保留。
