# TV-04 独立材料索引

对应 [T082](../../../../tasks.md#t082)，前置证据为 [T081](../../cleanup-governance.md) 与 [T052](../../tv-02-planning.md)。本索引先于夹具内容创建保存；行为结果另写入 [cleanup-validation.md](../../cleanup-validation.md)，不把材料准备当通过。

## 精确位置与来源

本轮隔离根为 `/tmp/foundry-t082-x7uoxnsp`。`cases/<场景>/` 是实际工程，`before/<场景>/` 为写前副本，`first/<场景>/` 为首轮现场，`logs/` 保存执行者输入、输出、命令及差异。`snapshots/` 保存真实仓库原文件摘要、tasks 原文和暂存区 diff，只用于保护核对。缺失临时现场时依据下述内容重建并记为新一轮复验，不冒用旧摘要。

治理来源是本仓库 `.specify/memory/constitution.md` 4.1.0 的副本，规范正文沿用 T081 的 SHA-256 `701946e9acbecd400fc019c4e23eb68d176c0f16944d694450d7a457443bd530`；不复制 profile/conclusions/conversations。Increment 来源是 `packages/skills/src/skills/workflow/task-increment/SKILL.md` 的 T052 同一骨架，实际执行前记录源摘要。原生任务生成来源为 `.agents/skills/speckit-tasks/SKILL.md`，通过显式隔离工程路径加载，不切换真实 feature.json，不声明尚未挂载的 Increment 命令已注册。

## 工程布局与可重建输入

各场景共有 `.specify/memory/constitution.md`、`.specify/feature.json`（仅指向各自 `specs/demo`）、`.specify/extensions.yml`（`hooks: {}`）、`.specify/templates/tasks-template.md`（真实模板只读复制）和 AGENTS.md。AGENTS 明确：只处理显式隔离项目；采用该治理；工程步骤按八栏目；Markdown 以仓库 ESLint 的绝对目标路径检查；业务为 Python 标准库本地标签列表，不访问外部系统；重复请求先读磁盘，失败不改权限、不替换受保护文件。代码检查使用下述本地命令，不把夹具检查充当真实包检查。

`specs/demo/spec.md` 的业务结果：管理员运行本地列表得到 alpha/beta；扩展目标为新增 gamma 后重新查看列表，新增失败不损坏已有记录。实际 spec 只有 US1：规划组包含列表和后续新增目标，清理组仅交付现有列表；本轮只按各场景授权规划或清理，不实现新增。mixed/none 及负向变体仅以现有列表为本次交付，新增 gamma 是后续范围；其 T009 改为已完成的列表交付验证夹具事实，使实际清理位于实现及必要验证之后。综合收尾另有“独立用户验收和批准尚未完成”的结案条件，agent 演练不能满足。

`specs/demo/plan.md` 保留现有列表骨架，后续按存储失败保护前置 → 新增 → 独立用户验收 → 收尾的顺序推进，引用现有 `evidence/list.txt`。不新增依赖或第二个同功能程序。

共用已有任务（new 除外）均按八栏目包含改动文件、改动内容、改动禁区、新建文件、写法约定、设计依据、验收信号、风险与回退：

- T004：预置已完成的本地标签列表，保留原完整区块和 `evidence/list.txt`；这是夹具事实，不是真实用户事实。
- T009：new-history/reuse 为未完成的新增标签规划，原目标、范围及“新增失败保持列表”的验收必须保留；mixed/none 及其负向变体为已完成列表交付核验，原目标为列表输出及失败不改数据，保留其完成事实。
- T020：未完成综合收尾（new/new-history 除外），依赖 T009，原验收包括独立用户验收和批准，均明确未具备。清理只在该原 Task 内补步骤，不因局部清理勾选综合收尾。

代码及测试的确切内容如下；注释和字符串均为人工构造的试验输入：

```python
# src/labels.py（mixed 及其负向变体包含两条废弃段）
def list_labels():
    """返回正式标签列表，保留为复用骨架。"""
    return ["alpha", "beta"]


# DEPRECATED-EXPERIMENT: 一次性预览，项目决策已明确撤销。
def legacy_preview():
    """只供已撤销的临时预览，决策记录允许移除。"""
    return ["obsolete"]


def compatibility_alias():
    """可能被仓库外旧工具调用，尚无证据确认用途。"""
    return list_labels()
```

```python
# cli.py
from src.labels import list_labels

if __name__ == "__main__":
    print(",".join(list_labels()))
```

```python
# tests/test_labels.py
import unittest
from src.labels import list_labels


class LabelsTest(unittest.TestCase):
    def test_current_labels(self):
        self.assertEqual(list_labels(), ["alpha", "beta"])
```

非 mixed 场景不含 `legacy_preview` 和 DEPRECATED-EXPERIMENT 注释；其余正式代码及用途不明接口保留。`src/__init__.py` 为空；`evidence/list.txt` 为 `预置列表证据：alpha,beta；夹具事实，保留。`。

mixed 的文档与额外对象：

| 相对位置与上下文             | 写前内容和用途依据                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| docs/guide.md / 当前使用     | 链接 `../src/labels.py`，命令 `python3 cli.py`，预期 `alpha,beta`；有效交付引用保护                                                                                                             |
| docs/guide.md / 失效进度     | `旧迁移尚未完成，需要重建标签骨架。`；后续决策明确已有骨架通过，不得重建，本段可移除                                                                                                            |
| docs/decisions.md / 撤销试验 | 明确 legacy_preview、DEPRECATED-EXPERIMENT 注释、scratch/preview.txt、docs/obsolete-migration.md 仅为已撤销预览/迁移产物；列表函数、CLI、测试、证据及当前说明继续使用；这是用途依据，保留此记录 |
| docs/obsolete-migration.md   | `临时复核：重建旧预览后删除本说明。`；被上述决策撤销，可移除整个文件                                                                                                                            |
| scratch/preview.txt          | `obsolete preview`；仅临时预览输出，可移除整个文件                                                                                                                                              |
| docs/vendor-note.md          | `外部旧工具兼容备注，调用方尚未核实。`；用途待核实，保留并记录位置、原因、后续核实条件                                                                                                          |

none 的 docs/guide.md 仅保留当前使用段，无试验决策、临时文件或失效段落；其他内容均为正式交付、证据或用途待核实对象，因此只核查、留证，不制造删除。

## 场景、操作与预期

| cases 下目录       | 输入与实际操作安排                                                                                            | 可证伪信号                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| new                | 有 spec/plan、无 tasks；先按原生 speckit-tasks 生成，再加载同一 Increment 来源更新 gamma 的实施路径，随后重复 | 只有一个等价末尾收尾、八栏齐全、无重复身份、任务不因规划而完成                                                        |
| new-history        | 有 T004/T009，无 T020；Increment 补齐路径并重复                                                               | 保留 T004 完整区块和证据，新增收尾使用未占用 ID，不重开历史                                                           |
| reuse              | 有 T004/T009/T020；Increment 更新后普通对话核对末尾清理，随后重复                                             | 只补原 T020，保留原验收/依赖，独立用户批准未完成时仍未完成                                                            |
| mixed              | 有 T004/T009/T020、上述所有局部及文件对象；按隔离 T020 明确授权实际清理，重复并从磁盘恢复                     | 正式代码、引用、证据、骨架保留；已确认废弃对象移除；未知对象三字段完整；清理部分完成不冒充总体结案                    |
| none               | 仅有效/受保护对象；核查并重复                                                                                 | 文件内容保持，记录无清理项的范围与理由，不因没有删除而制造新任务                                                      |
| mixed-pending      | mixed 的独立副本，请求只核验完成，不处理剩余应清理项                                                          | 实际仍有应清理项，必须拒绝完成；其他无关检查可进行                                                                    |
| mixed-reference    | 干净 mixed 的变体，guide 当前使用链接被预置为 `../src/missing.py`，请求核验，不授权修复                       | 引用损坏实际检出，不误报成功；测试可独立通过                                                                          |
| mixed-check        | 干净 mixed 的变体，测试预期预置为 gamma，行为检查真实失败，禁止改测试消红                                     | 非零退出后不标清理/整体完成，不阻断无关引用核对                                                                       |
| mixed-save-failure | mixed 的独立副本，目标证据 `evidence/cleanup.md` 预建并设 0444                                                | 实际保存失败后停止依赖完成更新，报告已写/未写；执行者不得改权限或替换文件，主执行者记录后解除临时保护，从同一目录续接 |

三个负向门禁与保存失败分别保存首次现场和解除障碍后的恢复现场，不用预设回复替代实际调用。负向输入由主执行者准备，执行者实际读取并检查；不提供正确输出模板。只有这几个隔离副本可作故障注入，真实源码/文档不参与清理。

原生模板解析的显式命令：`SPECIFY_INIT_DIR=<cases/场景绝对路径> SPECIFY_FEATURE_DIRECTORY=specs/demo SPECIFY_FEATURE_NO_PERSIST=1 bash <真实仓库>/.specify/scripts/bash/setup-tasks.sh --json`。原生生成及 Increment 调用由独立执行者实际读取各自 SKILL.md 后在该项目完成，不称此 shell 命令已执行 AI 任务生成。

代码验证：在每个工程根运行 `python3 -m unittest discover -s tests -v`、`python3 -m py_compile src/labels.py cli.py tests/test_labels.py` 和 `python3 cli.py`；观察实际退出码及列表输出。引用检查读取实际 Markdown 目标路径；比较 before/first/当前文件，确认保护内容逐字保留与局部差异。每次修改 Markdown 立即从真实仓库执行 `pnpm --config.verifyDepsBeforeRun=false exec eslint --no-ignore --fix <绝对目标路径>`；如仓库外文件被忽略则记录真实结果并采用隔离项目明确的 UTF-8/换行/链接和八栏检查，不把忽略警告当已检查。

## 留档与续接

执行者将操作输入、实际读取来源、命令/退出码、原始响应和文件差异写入 logs，不改真实主线 tasks/技能/治理。主执行者独立读回；源码未修改时不编造红灯、不补多余技能规则。成功输入、原始证据及当前骨架保留给 T053/T054/T080；本 README 与 cleanup-validation.md 保存可重建输入、实际差异和关键输出，临时目录不作为唯一证据。

## 本轮实际执行与保护

实际执行者为 tv04_planning（new/new-history/reuse）、tv04_cleanup（mixed/none）、tv04_negative（四个负向场景）。Increment 源摘要保持 `12caf1997f3c83f13eb94cb190601d5b7c926baaceb4010c9eae8b82d3f67375`，未编辑技能或复制挂载。new 原生实际生成 T001～T005，new-history 新增 T010，reuse 保留原 T020；原生、Increment、普通对话及重复都有实际读写记录。new-history 只有一般已完成 T004，没有旧已完成收尾，不把该场景扩说为已验证旧收尾不重开。

mixed 首次仅改变 src/labels.py、docs/guide.md，移除 docs/obsolete-migration.md 和 scratch/preview.txt，补原任务及清理证据；none 原文件只改原任务并新增证据。两组重复只追加证据，未再删或改业务内容。主执行者独立核对原 T004/T009、正式函数和文件、实际链接及行为命令。

负向首次现场全部保存在 first；save-failure 直接写原 0444 文件实际返回 PermissionError。主执行者读回原文和原权限后，只解除该隔离文件保护为 0644；同时在保留首次失败现场后撤除 reference/check 的有意故障注入。恢复继续同一目录和原对象，不以重建整个项目替代恢复。pending 在首次只核查拒绝完成后，才获得后续隔离清理授权。具体恢复结果与未测范围以 [TV-04 实测](../../cleanup-validation.md) 为准。

日志原文在 logs/planning-result.md、planning-data.json、cleanup-result.md、negative-result.md 和各组 evidence 中；持久索引和实测记录包含输入、真实响应、差异、关键输出和摘要，不以这些临时文件作为唯一证据。/tmp 目标的 ESLint 查找配置首次退出 2；显式指定真实配置后返回 outside-base-path 忽略警告，已如实记录，未把警告当通过。真实仓库索引/证据/tasks 各自执行实际 Markdown ESLint。
