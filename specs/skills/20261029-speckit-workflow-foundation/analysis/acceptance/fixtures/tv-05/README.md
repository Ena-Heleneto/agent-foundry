# TV-05 隔离材料与重建方法

对应 [T084](../../../../tasks.md#t084)、[T085](../../../../tasks.md#t085)、[TV-05 指南](../../../../quickstart.md#tv-05独立-mvu-详情与读取契约)。实际材料根为 /tmp/foundry-mvu-implement-d0p98yzc，以下只含可重建的测试业务，不包含个人画像或生产资料。临时目录丢失时按下列输入重建，不将目录存在当通过证据。

## 最小输入

spec.md 的需求：用户打开本地笔记列表，选择标签只看匹配项；无匹配显示空结果，清除后恢复全部；先做筛选，搜索暂缓，无新依赖或外部服务。FR-001 对应匹配/空结果，FR-002 对应清除与历史保护，SC-001 为选择“学习”仅看匹配项、清除恢复数量。

原 plan.md：

```markdown
# 笔记列表方案

## 方案

已有本地数据读取。标签选择、筛选和清除放在同一局部结果中，不做服务端或搜索功能。

## MVU-001

用户可以筛选标签并清除选择。关联 T002/T003。

## 顺序

T001 的已完成读取复用；T002 筛选，T003 清除，T004 最后验证及清理。
```

原 tasks.md 按以下四项建立，保留每项原句并在需要时追加实施步骤：

| ID   | 状态   | 目标/范围                         | 依赖      | 原验收                                     |
| ---- | ------ | --------------------------------- | --------- | ------------------------------------------ |
| T001 | 已完成 | src/notes.ts 已完成本地读取       | 无        | 三条本地笔记可读；证据 evidence/read.md    |
| T002 | 未完成 | src/filter.ts 选择标签只看匹配项  | T001      | 选择学习只显示匹配项，无匹配显示空结果     |
| T003 | 未完成 | src/filter.ts 清除选择恢复全部    | T002      | 清除后数量恢复                             |
| T004 | 未完成 | docs/result.md 验证本次筛选并清理 | T002/T003 | 两条行为成立，必要引用保留，清理有用途依据 |

evidence/read.md 原文为“历史验证：本地三条笔记已可读。不得改写此证据。”。目标项目格式采用 Python 核对 UTF-8、末尾换行、引用与原任务事实并逐份读回，不安装依赖或强套主仓库 ESLint。Spec Kit 材料另提供其工作流治理；非 Spec Kit 材料使用 PROJECT.md 的等价约定，不夹带本仓库画像。

## 四组与失败组

| 分组      | 从最小输入构造与实际调用                                           | 观察点                                   |
| --------- | ------------------------------------------------------------------ | ---------------------------------------- |
| legacy    | 原 plan/旧锚点/已完成 T001，执行 Increment                         | 详情迁出、旧锚点跳转、任务和证据保护     |
| existing  | legacy 首次保存后再次读取所有磁盘材料，重复同一调用                | 摘要稳定，无新增条目或无意义重排         |
| plan-only | 独立项目有 spec/旧 plan、没有 tasks；原生 Plan→Tasks→Analyze       | mvu 创建，任务补真实职责，原生实际读取   |
| no-plan   | 新建独立项目只写 spec/mvu/tasks，不创建 plan；运行原生 setup-tasks | 缺 plan 拒绝，旧材料不改                 |
| failure   | 另建副本，mvu.md 是含 KEEP.txt 的保护目录；实际尝试文件保存        | IsADirectoryError，保护对象/任务原样保留 |

no-plan/兼容/重复/真实 plan 保存失败的脚本级检查由 packages/skills/tests/test_mvu_documents.py 自动重建临时项目；测试不会替代 agent 消费。failure 是独立 Increment 应用的真实失败，另有原生 setup-plan 对目录占位的真实保存失败。

## 项目覆盖与实际原生调用

复制官方 .specify/scripts 和核心 templates，再显式复制本项目 .specify/templates/overrides 的两份完整覆盖到目标同名相对位置，记录源/目标 SHA-256。native 组复制工作流宪章及 hooks: {}，避免调用真实仓库 hook；不复制画像或真实 feature 指针。命令工作目录为目标项目根，同时显式设 SPECIFY_INIT_DIR、SPECIFY_FEATURE_DIRECTORY、SPECIFY_FEATURE_NO_PERSIST=1、SPECIFY_FEATURE=001-filter。

分别执行目标项目的 bash .specify/scripts/bash/resolve-template.sh plan-template --json 与 tasks-template --json，读完整 TEMPLATE_CONTENT；原生 setup-plan/setup-tasks 的实际输入须来自同一覆盖。没有覆盖的控制组返回核心原文，其结果不能算模板自动交付。

原生 agent 实际读取 speckit-plan/tasks/analyze 原文并执行流程，不只运行准备脚本。Plan 后只向 mvu 的验收信号写“切换到离线状态时筛选不得发出任何网络请求”，spec/plan 不写该条件；观察 Tasks 是否读取并落实它、补真实职责，再由只读 Analyze 实际打开 mvu 检查覆盖。结果与限制见 [TV-05 最小验证](../../tv-05-mvu-documents.md)；新综合分析双触发与 Tutor 的最终组合仍归 T086。
