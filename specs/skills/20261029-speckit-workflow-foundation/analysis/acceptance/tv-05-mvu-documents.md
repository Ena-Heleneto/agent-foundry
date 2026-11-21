# TV-05：独立 MVU 文档的最小实际验证

日期：2026-11-06。对应 [T084](../../tasks.md#t084)、FR-080/081、SC-030 的最小技术部分。输入、四组构造及命令见 [隔离材料](fixtures/tv-05/README.md)，实际根为 /tmp/foundry-mvu-implement-d0p98yzc。通过的技能/项目覆盖/测试骨架原位保留，T085 在同一文件增量扩展；本文不把最小验证当完整消费或用户行为。

## 可证伪假设与先失败

假设为现有项目治理、完整项目模板覆盖与 plan 索引足以让 Increment 及原生流程读写同级 mvu，并保护原任务与旧引用。C3 对应迁移、完成事实和部分保存，C4 对应原生/技能跨材料读取；旧 TV-02 仅部分复用，不豁免新入口。

先写 test_mvu_documents.py，再运行 python -B -m unittest discover -s packages/skills/tests -p test_mvu_documents.py：5 项中 1 项失败，实际原生 resolve 输出的 plan-template 无 mvu.md，其余原生保护测试通过。修复是从完整解析结果建立 plan/tasks 项目覆盖，保留原核心全部章节，实际解析和准备脚本消费同一覆盖；再运行五项全部通过，8.757 秒。

旧技能源快照位于 before/packages/skills/src/skills/workflow/task-increment/SKILL.md。五个旧技能独立样本均继续把详情保存在 plan，未生成 mvu；其中三个另有错误套用主仓库 ESLint 的格式失败，后两个按隔离项目 Python 约定保存/检查通过，仍无 mvu。旧样本为通用项目材料，最终 Spec Kit 样本另补工作流文件，不能把环境差异当严格同条件统计实验。原始输出均保留，未删失败或把预期写作实际结果。

## 原生流程实际消费

native/specs/notes/001-filter 为有 plan 无 tasks 材料，复制真实脚本、核心/覆盖、宪章和空 hooks。独立 agent 实际读取并运行原生 Plan→Tasks→Analyze，另按原 Plan 规则派发只读研究。setup-plan 返回旧 plan 已存在而未覆盖，实际 resolve-template 后读取完整覆盖；旧 MVU-001 与顺序锚点保留，详情迁至 mvu。

Plan 完成后只向 mvu 添加“切换到离线状态时筛选不得发出任何网络请求”。setup-tasks 的 AVAILABLE_DOCS 没有 mvu，但 Task 生成实际通过索引打开它，T002 的操作与验收包含该条件，T003/T004 也核对；mvu 回补真实 T001～T004 链接/职责。Analyze 实际执行一次 check-prerequisites --json --require-spec --require-tasks --include-tasks，随后 nl -ba 打开 mvu 及原材料，报告该条件有覆盖。spec/plan 不含离线条件，故不是从这些文档猜出。Analyze 只读，没有另写分析或维护工程状态。

本次原生分析同时如实发现隔离项目无业务源码/栈/检查命令的 HIGH 待查项和 plan 文档树旧将来时 LOW；未以此冒充业务可开始或原生全量质量通过。环境不是 Git 仓库，git status 不可执行，明确记录；未安装依赖、未创建 feature.json、未触发真实仓库 hooks。初始化所需覆盖为显式复制，不是技能包自动安装模板。

## 兼容、重复与失败

候选原型在 green/1 实际将旧详情迁出、保留原 Task/证据及 plan 锚点。已有 mvu 后同一请求重复，7 份文件前后 SHA-256 全部相同。独立 failure 副本的 mvu.md 为含 KEEP.txt 的保护目录，真实写入触发 IsADirectoryError，未写新详情、索引或任务细化；原保护目录、任务和证据保持，不改权限、不替换保护文件，恢复先处理具体路径冲突。

五项脚本集成测试另覆盖旧 plan/已有 mvu 的重复准备、无覆盖对照、孤立 mvu/tasks 不满足 plan 前置、真实 plan 目录占位保存失败；显式目标根与 NO_PERSIST 防止写真实指针。自动断言只证明脚本/模板的真实职责，不替代上述 agent 应用。

## 保留骨架与未完成边界

包 lint、check-types 与 build 已执行退出 0；聚合 test 执行了 19 项但有 6 个失败，全部是原 Tutor/Pair 的旧 VII 锚点（源/交付各两项）和尚未迁移的 Direct 缺失（源/交付各一项），对应既有 T057/T065/T055 后续工作。本任务没有删除断言、跳过或声称全包绿。完整日志 package-test-prototype.log 保留在实际材料根。新五项及独立 Increment 的交付检查须在最终源码构建后复验。

最小信号已实际取得，原型输出仍偏长，由 T085 在同一骨架把形态收敛为四个短段，再复验。Tutor、同一新分析 after_tasks/Increment 双触发、真实挂载及最终组合仍须 T086 前置具备后验证；当前 artifact-spec-analysis 尚未交付，不以旧图工具替代，不宣称整项 SC-030 或 E1/用户行为通过。
