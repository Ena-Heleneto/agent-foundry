# T062 最小分析候选与隔离验证

日期：2026-11-11。对应[本 Task 方案](../../../../implementation/T062.md)及[原任务](../../../../tasks.md#t062)。这里保存候选和实际证据，不是生产技能来源或业务验收。

独占现场：`/tmp/foundry-t062-20261111-kqkexy09`。baseline 与 flow 两个项目的 `specs/skills/001-workflow/` 复用 T106 最终实际回放材料，完整来源另见[T106 证据](../t106/results.json)。其中 requirements 的历史用户输入仍指向 2026-11-10 真实来源；Task、证据和业务哨兵均为明确标注的夹具，不冒充真实业务完成。治理、原输入、旧方案、原 Task 完成标记和业务哨兵受保护，不复制仓库画像。

## 候选与调用

候选为[candidate/artifact-spec-analysis/SKILL.md](candidate/artifact-spec-analysis/SKILL.md)。正式源码、集合配置、真实挂载以及构建交付仍由后续原任务承接，本轮不在此建立第二维护源。

隔离 Increment 从当前维护源使用官方 skills 1.7.4 本地安装；候选同样经该入口安装并核对完整文件集合/摘要。after_tasks 仅使用临时 hooks-only 扩展输入交给官方 Specify 1.2.6 登记，原生 speckit-tasks 沿既有 1.2.6 seed 原字节保留。配置不存在 after_increment，也不注册其他本期无关 hooks。

宿主使用 codex-cli 当前版本及默认模型、不覆盖模型，被测 sandbox 为 workspace-write，每回合上限 240 秒。原始命令、输入、JSONL 事件、stderr、实际前后摘要和最终回执分别保存；初始化环境失败、超时、部分写入与正常结束分开记录。

## 操作与预期

- `python /tmp/foundry-t062-20261111-kqkexy09/run.py baseline`：候选不存在时调用已安装 Increment，无新描述或范围变化；观察规划与分析各自结果，缺分析必须如实报告，不用其他分析代替。
- `python /tmp/foundry-t062-20261111-kqkexy09/run.py create`：原任务生成阶段已保存，仅从完整官方 tasks 入口的后置阶段继续。预期读取官方配置并实际完整加载已安装候选，创建 analysis/spec-analysis/README.md；不重新生成任务。此项不冒充本轮重新完成整段原生任务生成。
- `python /tmp/foundry-t062-20261111-kqkexy09/run.py refresh`：测试指令在原范围内把 T007/T002 排到 T006 前，其他必要依赖及暂停/末尾清理保持。预期先保存并检查局部规划，再显式完整加载同一候选更新分析；不实施业务或取得新的真实用户认可。
- `python /tmp/foundry-t062-20261111-kqkexy09/run.py repeat`：仅 Spec 定位，无新变化。预期沿已保存材料复用相同任务/闭环，不因时间戳或附录重复制造变化。

逐份实际读取原文/摘要、spec、plan、同级 mvu、tasks 和必要证据，核对功能独立短段、六类适用内容及图示、缺项/暂停/未验、相对链接、代码或计划位置。分析不能替代验收，也不建立另一份状态/活动闭环；diagrams.md 只维护必要技术图导航。完整故障恢复属于 T064，不由这些正常与重复回合抵扣。

另有五次无指导和五次候选独立短答，人工核对形状及事实边界；短答没有实文件输入，不作为真实文件读取、调用或保存证据。候选支持与否以实际宿主事件和文件为主。

验证结束后按实际结果保存结构化结果及可独立核查的归档；未执行或失败不能记通过。包 build、dist、构建来源消费继续按用户授权暂跳过；目标包 lint、check-types、既有适用测试和本文档格式检查仍须执行。

## 实际结果与样例位置

[验收结论](../../spec-analysis.md)、[结构化结果](results.json)及[原始归档](retained.tar.gz)已保存。创建与刷新两条链均在首次限时后沿真实同session完成核查/回执，原超时保留；无描述重复正常结束、全部文件不变。候选未再修改，独立只读审查确认满足T062原最小范围，完整交付仍由后续原Task承接。

解包归档后，创建样例位于 retained/snapshots/created/specs/skills/001-workflow/analysis/spec-analysis/，刷新样例位于 retained/cases/flow/specs/skills/001-workflow/analysis/spec-analysis/；同项目的plan/mvu/tasks、输入、安装副本和导航一并保留，可核对实际相对引用及先后变化。样例中的Task身份属于隔离夹具，不能当本Spec真实工程验收。保留归档原目录结构，不将样例覆盖到正式分析目录。
