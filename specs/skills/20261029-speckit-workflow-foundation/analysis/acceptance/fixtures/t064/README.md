# T064 完整分析生命周期夹具

日期：2026-11-11。对应[原 T064](../../../../tasks.md#t064)、[实施方案](../../../../implementation/T064.md)。独占现场为 `/tmp/foundry-t064-20261111-kz0wpfo4`；原始结果按实际执行继续补充，不把夹具 Task 或模拟业务哨兵当真实用户验收。

从 T063 最终隔离项目复制，初始不带 analysis/spec-analysis，以正式来源官方安装及真实登记验证创建。Specify 实际 1.2.6、skills 1.7.4、宿主 codex-cli 0.167.1，默认模型、workspace-write。after_tasks 的临时 hooks-only 输入由真实集合声明和正式 SKILL 元数据生成，仅用于验证，不是生产安装器已接线。源/安装/扩展完整集合与 hash 一致，原生 tasks 保持。

原生生成所需 tasks override 来自本仓库当前模板，实际 setup 返回全文与源一致；这是明确配置的项目覆盖，不把安装技能声称为自动交付模板。宿主调用环境使用既有 Specify 缓存 Python 的 YAML 解析能力，没有新增依赖。回合上限 360 秒；环境失败、行为停止、真实超时与同 session 续接分别留证。

## 实际操作

- `python /tmp/foundry-t064-20261111-kz0wpfo4/run.py create`：实际执行原生 tasks 全流程。外层首次只读初始化失败；获工具审批后进入宿主，但缺模板和 YAML 能力，行为停止、零写入，尽管宿主退出码为 0 也不记通过。
- `python /tmp/foundry-t064-20261111-kz0wpfo4/run.py create-ready`：验证方补齐已有模板及环境后，沿同 session 完成全流程和强制 after_tasks。原驱动复用提示误称“到限”，实际原因仍以前一回合环境停止记录为准。
- `python /tmp/foundry-t064-20261111-kz0wpfo4/delta.py`：保留创建后快照，复制互相独立的 flow 与 failure 项目，再逐字加入已经保存的真实历史输入，只同步夹具当前要求和摘要。不是新用户确认，不改父规格。
- `python /tmp/foundry-t064-20261111-kz0wpfo4/run.py change`：实际 Increment 消费历史要求，更新必要规划后显式调用同一正式分析。
- `python /tmp/foundry-t064-20261111-kz0wpfo4/run.py failure`：另一个副本的 flows.md 为验证方设置的只读 0444；正文仍完整可读，被测宿主不得解除保护或换路径。

- `python /tmp/foundry-t064-20261111-kz0wpfo4/run.py recover`：验证方确认真实写入探针返回 PermissionError/errno 13 后，只将自有 flows 文件解除只读，宿主沿 failure 原 session 补两份原分析，规划不重做。
- `python /tmp/foundry-t064-20261111-kz0wpfo4/run.py repeat`：对 flow 无新需求重复调用，完整 35 文件 hash 前后一致。
- `python /tmp/foundry-t064-20261111-kz0wpfo4/audit.py`：主 agent 独立核对实际全文、同级 mvu、来源、引用和保护，再检查每回合允许修改集合、同 session 恢复与重复零变化，结果见[验收记录](../../t064-analysis-lifecycle.md)及[结构化结果](results.json)。

创建/变化/恢复回合分别正常结束；failure 的退出 0 只表示宿主正常返回，实际回执仍为分析部分完成。宿主预检只读文件后未尝试写入；真实 PermissionError 来自验证方独立探针，两者不混称。恢复只修改两份原分析，重复调用零变化，不生成第二状态或新的认可方案。

[retained.tar.gz](retained.tar.gz)保留 formal-source、installations、extension-input、host、before-project、snapshots 与 cases；created、changed、failed、recovered、final 是实际对应项目，可独立核对引用。旧与当前所有输入及故障现场均按阶段保留，不把后来解除权限改写成之前可写。

## 覆盖与限制

核对逐功能说明及适用六类内容、实际原文/同级 mvu 消费、本地链接/锚点、图语义、原任务身份/完成事实/验收、业务哨兵/治理/旧方案/历史输入/证据保护。分析保存与业务验收分开；构建、dist 来源、正式脚本接线及真实挂载未由本夹具抵扣，图示未渲染，未模拟用户阅读反馈。归档不能含仓库画像或凭据。
