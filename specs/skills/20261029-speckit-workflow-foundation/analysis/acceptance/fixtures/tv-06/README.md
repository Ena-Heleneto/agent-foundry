# TV-06 可选规划描述：独立材料

日期：2026-11-09。任务：T087→T088→T089。用户授权实施描述增量；输入契约见 [描述契约](../../../../contracts/increment-description.md)。

## 输入与复用

本轮隔离根为 `/tmp/increment-tv06`：baseline.md 保存修改前完整来源，candidate.md 是初次在原文件上追加描述处理段的候选；入口回归发现03范围问题后，最终来源另补“先允许Task集合再选分支”的流程，最终复验应读取当前生产来源或同版官方生成入口，before 保存本轮起点。临时材料属于工程情景，不是用户反馈或真实业务验收。

候选组 `candidate-cases/` 覆盖 no-description、whitespace、location-only、explicit、incomplete、conflict、partial、recovery 八种输入，另有缺 plan 有/无描述、普通非 Spec Kit 和 Increment/Tutor 范围对照。`matrix-results.json` 记录原始输入、输出路径、前后摘要、原 Task 保护、任务顺序及分析未完成的结果。基线组 `control/` 独立读取 baseline，不读取候选。

配对微评估为 `micro1.md`、`micro2.md`、`micro3.txt`、`micro4.txt`、`micro5.txt`，每份由独立上下文读两版；这是五次非盲配对推理，不是五次文件执行或可靠性统计。逐份审阅未观察到候选机械补五层、丢失用户方向、擅自确定共享权限或越界实施。基线也能给出合理结果，不能声称新增规则必然改善成功率。

## 复验方法

先读取 candidate-cases 中各组 input/result/before 与 project 文件；按同版 Increment 从原输入规划，核对原意/事实/补全/假设、业务结果及先 MVU 后 Task、步骤适用与已有层复用、关键未知受影响范围、ID/验收/完成事实保护。比较实际 Task 区块和文件摘要，不能只查关键词。

重复/恢复及失败组保留首次输出和中断现场；修正测试者的范围错误须另记，不能把修正后的输出冒充首次通过。缺 plan 两组必须保持项目摘要不变。普通项目不得新建 .specify。源/构建/官方入口使用同一材料和原命令骨架，生成正文由官方 CLI 维护，不手工改写。

## 证据位置

最小候选及 T088 来源回归记于 [TV-06 证据](../../tv-06-description.md)；T089 的构建和官方入口单独记于 [工程交付](../../increment-description-engineering.md)。当前索引仅说明实际已建立的材料和复验方法，最终结果以各阶段证据为准。
