# T054：Increment 工程验收

对应 [T054](../../tasks.md#t054)，前置为 [T053](../../tasks.md#t053) 与 [T082](../../tasks.md#t082)。日期：2026-11-06。用户在获知下一任务及首次阶段验收安排后回复“可以，来吧”，本轮执行 T054，不进入 Phase 2。以下均为实际隔离工程结果；真实用户行为、学习掌握、阶段批准分别判断。

## 输入、治理与执行范围

技能源为 packages/skills/src/skills/workflow/task-increment/SKILL.md，实际加载 SHA-256 为 `839bc71edceaedda8f23e248cb156227f1c4ed70a16f8f40f781ab6f898be17b`，与 T053 相同，本轮没有修改或刷新真实挂载。现行工作流宪章为 5.0.0，工程及仓库记录按独立项目规范；旧 TV-04 继续读取其当时有效的治理副本，旧证据不追溯改写。

实施入口 check-prerequisites --json --require-tasks --include-tasks 实际返回当前功能目录及现有 research/data-model/contracts/quickstart/tasks。质量清单当前有效 16/16；全文件 17/18 中未勾项明确为已被替代的历史直接平台入口要求，保持原样，不把它重新作为当前门禁。before_implement 的 mvu-gate 已实际加载并核对 T053/T082、C3 与同一骨架验证安排，after_implement 的知识说明引用检查无本轮新知识文档，不建空节。

本轮根为 `/tmp/foundry-t054-zv1heeo5`：snapshots 保存 1016 个原文件摘要、原 tasks/test_artifacts/索引/真实指针及暂存区差异；location/location-before/location-first 保存六组分支输入、首次及重复现场；business 与 stages/technical 保存独立业务样本及技术通过骨架；tv04-current-before/tv04-replay-input/tv04-first 保存原 TV-04 本轮起点、原输入重放和首次结果。logs 保存命令、退出码、输出、diff 与审计。以下保存可重建的关键材料和结果，不依赖这些临时目录作为唯一证据。

验证选择：小型检查定位、缺项、交付及风险阻塞；中型检查规划保存/重复、四组收尾与技术骨架增量业务交付。没有新增依赖、外部系统或安装流程，不重跑无改动注册器的全平台矩阵。writing-skills 要求独立应用试验，因此由 t054_location、t054_cleanup 分别实际应用技能和项目治理，主执行者另读磁盘比对；t054_review 只读审阅，不冒称其执行了所有行为检查。

## 六组材料定位、风险与进度保护

共同原输入可按 [T052 材料索引](fixtures/tv-02/README.md)与 [TV-02 证据](tv-02-planning.md)重建：alpha/beta 本地标签、拟新增 gamma 后查看和筛选、alpha 仅得 alpha、无匹配为空、新增失败保留原列表。任务为 T004[x] 原列表夹具事实、T009[ ] 筛选、T020[ ] 综合收尾和独立用户验收，原八栏与读取证据保留。每组有自己的 AGENTS，格式约定为 UTF-8/LF、八栏及实际引用，不读取或复制本仓库个人画像。共同试验请求为“增量规划管理员新增 gamma 后筛选的路径，只规划，不实现业务，不执行清理；已有事实保留”。这是测试输入，不是用户接受推荐。

| 组           | 明确输入与首次实际结果                                                                                                            | 保护和重复结果                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| explicit     | 本组有 specs/demo 与 specs/other，明确指定 demo/T009；只修改 demo 的原 plan/tasks，新增未占用 T021/T022，保留 T009 本地只读路径。 | other 全部字节保持；原 T004 完成事实和验收、原数据/证据保持。                                      |
| stale-unique | 指针指向 specs/missing；现存唯一 demo/T009。说明匹配依据后更新 demo 原 plan/tasks，未改失效指针。                                 | .specify 及真实仓库指针字节保持；不代建项目。                                                      |
| ambiguous    | 失效指针、demo/other 同有 T009，没有明确 Spec。实际提出“本次 T009 属于 specs/demo 还是 specs/other？”。                           | 整树零写入，不假定用户已答，不创建新任务。                                                         |
| missing-plan | 明确 demo/T009，spec/tasks 存在而 plan 缺失。指出方案前置缺项，停止规划写入。                                                     | 整树保持，不凭孤立 tasks 建 plan 或实施业务。                                                      |
| equivalent   | 非 Spec Kit；原需求/方案/任务分别是 requirements.md/design.md/work.md。按既有等价路径规划，新增 T021/T022。                       | 只改 design/work；不建 .specify、标准名副本或第二套状态。                                          |
| layered-risk | 原技术层批量顺序，追加首次新存储包、外部服务、worker 契约；实际运行原失败检查。C1/C2/C3/C4 均命中，写保护 C3 真实失败。           | 保留失败实现/检查；T021 写保护、T023 新包/外部/进程契约是 T022 新增的前置，T009 本地只读仍可推进。 |

四个可定位且有方案的项目仅更新八个既有方案/任务文件，其余 43 个文件保持；六组重复后 51 个文件与 location-first 全字节一致。主执行者独立核对 87 个实际 Markdown 文件/锚点引用、八栏、唯一 ID、原完成标记、原验收、数据/治理/指针与写入范围。新增或细化任务保持未完成，原技术层顺序保留历史并注明替代、业务意义及早期反馈理由，不把推荐包装成唯一粒度。用户思路/画像未知时未编造接受或偏好。

风险组的可重建故障是 src/unsafe.py 先 `Path(path).write_text("")` 再抛 `OSError("提交失败")`；tests/check_unsafe.py 用独立临时文件写入 alpha/beta，调用后检查原字节不变。两次实际运行 `python3 -B tests/check_unsafe.py` 均退出 1，`AssertionError: 写失败破坏了旧列表`。原实现、检查及原数据保持。该红灯是预设故障的真实结果，技能正确报告未通过并阻断依赖，不能记为存储通过。C1/C2/C4 仅核查缺证据并安排具体验证输入和信号，未安装包、调用外部服务或启动 worker，不冒报这些技术能力通过。

共同结果明确：规划保存与分析分别报告。artifact-spec-analysis 当前未交付，四组规划已保存而分析阶段未完成；歧义及缺方案两组未保存新规划。不以替代分析、时间戳或新的事件系统掩盖缺项。

## 同一技术骨架增量交付业务

样本目标固定为“用户保存一项待办，重新打开列表仍可查看”。创建实现前已在 [TV-02 索引的 T054 段](fixtures/tv-02/README.md#t054同一技术骨架增量交付业务样本)登记真实目录、实现/输入文件、具体命令，执行 Markdown ESLint 并实际读回。它与 T052 规划原型独立，不把规划文档扩展当成业务骨架复用。

business/{AGENTS.md,spec.md,plan.md,tasks.md} 中唯一 T001 固定该业务结果和技术前置；不增加账号、同步、共享等需求。样本仅 Python 标准库与本地 JSON，无 DB 或外部系统。原技术函数、测试和业务流程的阶段结果如下：

| 阶段                 | 实际动作、结果                                                                                                        | 完成边界                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 技术红灯             | 先写三项技术测试；storage.py 只有空读/空写骨架。运行 unittest，3 项失败：读回为空、写拒绝异常未发生、提交异常未发生。 | 功能未实现；未填业务函数，app.py 不存在。                  |
| 技术通过             | 同一路径实现 load_records/save_records；三测通过，退出 0，保存 stages/technical 的源码、原测试、结果及摘要。          | 此时业务 CLI 仍不存在，不能判业务完成。                    |
| 业务红灯             | 新增两个独立进程业务测试，尚无 app.py；5 项中原技术 3 项仍通过、业务 2 项失败。                                       | 明确业务未实现，保留原技术信号。                           |
| 增量业务             | 对原 storage.py 使用追加写入加入 add_todo/list_todos；新增 app.py 调用该适配器，未重写技术函数或测试。                | 同一文件、同一 inode、技术源码完整前缀及测试摘要保持。     |
| 原技术复验与业务验收 | 相同 unittest 命令 5/5，退出 0；另分别运行 add/list 两个新进程，重开列表显示验证待办。空输入失败且旧记录字节不变。    | 仅通过隔离工程业务结果；真实用户验收/学习/阶段批准未发生。 |

技术测试的可核验输入与结果：

- 写入 `["alpha", "beta"]` 后，用同一路径重新读取，精确得到原列表。
- 在本轮独立临时目录预写原 JSON，目录权限设 0555 后实际保存失败，真实 PermissionError；原文件字节保持，目录只剩原文件，finally 恢复 0700。没有改变真实仓库权限。
- 真实同目录临时文件写入/fsync 后，只在最后 `os.replace` 边界注入 OSError；实际旧文件字节保持、无候选残留。不通过 mock 调用次数证明结果，不把注入等同真实外部服务失败。

技术通过时的适配器源码如下，业务阶段完整保留这段前缀：

```python
"""本地文件适配器，成功提交前保持旧记录。"""
import json
import os
from pathlib import Path
import tempfile

def load_records(path: Path) -> list[str]:
    """重新读取已提交列表，拒绝非字符串列表。"""
    if not path.exists():
        return []
    records = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(records, list) or not all(isinstance(item, str) for item in records):
        raise ValueError("记录格式错误")
    return records

def save_records(path: Path, records: list[str]) -> None:
    """同目录完成候选写入后替换，错误时保留旧文件并移除候选。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    candidate = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, prefix=f".{path.name}.", suffix=".tmp", delete=False) as stream:
            candidate = Path(stream.name)
            json.dump(records, stream, ensure_ascii=False)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(candidate, path)
    finally:
        if candidate is not None:
            candidate.unlink(missing_ok=True)
```

技术通过后实际同文件 diff：

```diff
--- /tmp/foundry-t054-zv1heeo5/stages/technical/storage.py
+++ /tmp/foundry-t054-zv1heeo5/business/storage.py
@@ -28,3 +28,17 @@
     finally:
         if candidate is not None:
             candidate.unlink(missing_ok=True)
+
+def add_todo(path: Path, text: str) -> str:
+    """沿用已验证的提交路径保存非空待办。"""
+    title = text.strip()
+    if not title:
+        raise ValueError("待办不能为空")
+    records = load_records(path)
+    records.append(title)
+    save_records(path, records)
+    return title
+
+def list_todos(path: Path) -> list[str]:
+    """从同一存储重新读取待办列表。"""
+    return load_records(path)
```

业务 CLI 实际代码：

```python
"""独立进程待办入口，存储职责复用同一适配器。"""
import argparse
from pathlib import Path
import sys
from storage import add_todo, list_todos

def main() -> int:
    """运行新增或列表操作，以非零退出报告实际失败。"""
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("add", "list"))
    parser.add_argument("text", nargs="?", default="")
    parser.add_argument("--file", type=Path, default=Path("data/todos.json"))
    args = parser.parse_args()
    try:
        if args.action == "add":
            title = add_todo(args.file, args.text)
            print(f"已保存：{title}")
        else:
            for title in list_todos(args.file):
                print(title)
    except (OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

技术测试原文（业务填充前后逐字节相同）：

```python
"""独立验证文件适配器的读回和失败保护契约。"""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import storage

ROOT = Path(__file__).resolve().parents[1]

class StorageTests(unittest.TestCase):
    """断言实际文件结果，不断言替身调用。"""

    def test_write_then_read_again(self):
        """成功提交后重新读取同一路径得到原输入。"""
        with tempfile.TemporaryDirectory(dir=ROOT) as d:
            path = Path(d) / "todos.json"
            storage.save_records(path, ["alpha", "beta"])
            self.assertEqual(storage.load_records(Path(str(path))), ["alpha", "beta"])

    def test_real_write_denial_keeps_original_bytes(self):
        """隔离目录真实拒绝写入时旧文件保持。"""
        with tempfile.TemporaryDirectory(dir=ROOT) as d:
            folder = Path(d)
            path = folder / "todos.json"
            original = b'["alpha", "beta"]\n'
            path.write_bytes(original)
            folder.chmod(0o555)
            try:
                with self.assertRaises(PermissionError):
                    storage.save_records(path, ["gamma"])
                self.assertEqual(path.read_bytes(), original)
            finally:
                folder.chmod(0o700)
            self.assertEqual(sorted(p.name for p in folder.iterdir()), ["todos.json"])

    def test_commit_failure_keeps_original_bytes_and_no_tempfile(self):
        """仅在最后系统替换边界注入错误，检查实际旧文件与临时文件。"""
        with tempfile.TemporaryDirectory(dir=ROOT) as d:
            folder = Path(d)
            path = folder / "todos.json"
            original = b'["alpha", "beta"]\n'
            path.write_bytes(original)
            with patch("storage.os.replace", side_effect=OSError("注入替换失败")):
                with self.assertRaises(OSError):
                    storage.save_records(path, ["gamma"])
            self.assertEqual(path.read_bytes(), original)
            self.assertEqual(sorted(p.name for p in folder.iterdir()), ["todos.json"])

if __name__ == "__main__":
    unittest.main()
```

业务测试分别以 subprocess.run 启动 `sys.executable -B app.py add 验证待办 --file <独立临时路径>` 和另一个 `list` 进程，断言退出 0 与输出行精确为 `["验证待办"]`；第二项预写 `["alpha"]`，传空白待办，断言非零、明确输入失败及原字节保持。固定期望来自业务验收，不从实现计算。

另在 business 目录执行的独立验收原始输出：

```text
$ python3 -B app.py add '验证待办' --file data/todos.json
已保存：验证待办
$ python3 -B app.py list --file data/todos.json
验证待办
data/todos.json = ["验证待办"]
```

技术通过 storage.py SHA-256 为 `4177725ae503e1f10640a2eacc6d871e87cc442661ade52dc0075c170a2f3880`，增量后为 `25338ea75a8991e6da6d29dc4271453e0d72457d2c23218227cf131bdf61f509`；原技术测试 SHA-256 前后均为 `49cb02740ddb528dbc4fe02d6f1b1c65429ca51ca6812cb35adba71b0e6915cf`。同一绝对路径 storage.py 的 inode 前后均为 44669，且技术源码完整前缀比较通过；摘要与代码 diff 共同证明增量，没有把同功能新文件冒称复用。所有业务文件只在已登记临时项目，不进入 apps 或分发包。

## TV-04 四组原输入重放与清理保护

沿用 T082 的原 `/tmp/foundry-t082-x7uoxnsp/cases/{new,reuse,mixed,none}`，关联 [原实测](cleanup-validation.md)与 [材料索引](fixtures/tv-04/README.md)。先完整快照本轮起点，不改 T082 before/first 或旧证据；new 备份并移开前次生成 tasks，仅重放原 before/new 的 plan，使本轮实际从无 tasks 输入规划。mixed 只把原 before/mixed 的四文件中五个逻辑对象重放到原路径，正式函数及未知用途内容与本轮起点相同。没有新建同功能实现骨架。

new/reuse 实际加载 Increment 只做规划；mixed/none 的清理按 T020、项目治理和本轮明确隔离授权执行，实际删除不属于 Increment 自动实现，也不触及真实 T080。

| 场景  | 实际差异与保护                                                                                                                                                                                | 首次/重复结果                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| new   | 从真正无 tasks 输入生成 T001 技术边界/保护、T002 新增后查看、T003 说明与验证、T004 唯一末尾综合收尾；全未完成。列表代码/输入/旧证据保持。                                                     | 重复转为有 plan/tasks 核对，零追加；与首次完整文件/权限相同。                     |
| reuse | 原 T004[x]、T009[ ]、T020[ ] 覆盖完整；全部原目标/验收/依赖和八栏保持，唯一末尾 T020。                                                                                                        | 首次、重复均全树零变化。                                                          |
| mixed | 结合 decisions、CLI/测试调用、语义与引用，移除 legacy_preview、专属试验注释、guide 失效进度、obsolete-migration 和 preview.txt。正式代码最终与本轮起点全字节相同；原任务/历史/治理/证据保持。 | 相对重放输入只有两处局部文件修改、两文件删除、原 cleanup 证据追加；重复不再删除。 |
| none  | 候选均有效或用途未知，零删除；仅在原 cleanup 证据追加核查范围及理由。                                                                                                                         | 业务文件零差异，重复与首次全字节相同。                                            |

未知用途对象为 src/labels.py::compatibility_alias 与 docs/vendor-note.md 外部备注：位置明确；保留原因是外部调用尚未核实，本地无引用不证明无用途；后续只有外部调用确认及兼容迁移证据后再评估。旧 cleanup.md 全文作为追加后文件前缀保持，原列表证据与 Task 身份/完成事实不变。mixed/none 的 T020 均保留独立用户验收和批准未发生条件，清理部分通过不勾综合 Task。

四组各两轮运行 `python3 -B -m unittest discover -s tests -v`（各 1 测试）、`python3 -B cli.py`（alpha,beta），以及 `python3 -B -X pycache_prefix=<本轮compile-cache/轮次/场景> -m py_compile src/labels.py cli.py tests/test_labels.py` 和 compatibility_alias 的实际列表断言，均退出 0。编译缓存定向本轮根，不改原项目。主执行者另独立比较全部输入/当前/首次文件字节和权限、原 tasks、有效代码、证据前缀、未知对象，并核对 29 个实际链接和八栏。

首次和重复整树 SHA-256：

| 场景  | 首次与重复共同摘要                                                 |
| ----- | ------------------------------------------------------------------ |
| new   | `79be5ea6f30d6ad679f20cd201620caf78e828c9d1e1d6f5582fd5eb6684bbee` |
| reuse | `45a42de721256378a5179f4d9e10d1a297635082bc10593734d3707615b62c96` |
| mixed | `8a78251e746d7e8b32a9e8cda4379a804c2dac61c8baa0e597d7f8e5f5590e2b` |
| none  | `5a78f2743d10f8c730faa993d42257a5133375e7d6e7ec121ad6383993631fcc` |

四组重复 diff 为 0 字节。重放是本轮新复验，不冒充原 T082 结果；未重跑 T082 的四个负向场景或原生 speckit-tasks 生成，本轮 new 从无 tasks 应用的是 Increment。分析仍未交付，明确分析未完成，不伪称原生命令挂载或整次 Increment 完整成功。

## 真实交付断言与工程检查

packages/skills/tests/test_artifacts.py 将原循环中的 Increment 源/交付存在与治理引用检查提取为独立方法 test_increment_delivery_matches_source_with_reachable_governance，并核对交付字节等于源。Tutor/Pair/Direct 原检查及完整目录比较保留。此为既有交付能力的断言归组，不制造缺失能力红灯；TDD 的真实红/绿来自上方业务样本，不以 grep 技能正文当行为验证。

| 实际命令或检查                                                                                                                                         | 结果                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 在 packages/skills/tests 执行 `python -B -m unittest test_artifacts.ArtifactTests.test_increment_delivery_matches_source_with_reachable_governance -v` | 1/1，退出 0，实际读取源/交付/治理。                                                                                                          |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                            | 退出 0。                                                                                                                                     |
| 同过滤器 `run check-types`                                                                                                                             | 退出 0。                                                                                                                                     |
| 同过滤器 `run build`                                                                                                                                   | 退出 0，真实构建生成 dist，不手改产物。                                                                                                      |
| 同过滤器 `run test`                                                                                                                                    | 退出 1；14 个方法中 12 个通过，两个模式方法各含 Tutor/Pair 旧治理锚点与 Direct 缺失，共 6 个既有失败子项。未改这些来源或断言，未 skip 消红。 |
| 共享包消费                                                                                                                                             | 上述独立 Increment 与完整目录交付检查核对实际源/dist；只读审阅另实际运行这两个方法，2/2。注册/安装脚本未改，本轮未重跑其不相关矩阵。         |

pnpm 有现存配置键非 camelCase 警告（auto-install-peers、strict-peer-dependencies）；不在本任务整理用户配置。六个既有失败来源/交付分别是 task-tutor、task-pair 的旧 VII 锚点及 task-direct 缺失，归后续 T057/T065/T055；不声称全包测试通过。当前未新增 Node/TS/Vue 实现或依赖。

真实仓库索引、验收文档、tasks 与协作摘要各写后立即实际运行 Markdown ESLint 并读回；外部夹具执行同一 ESLint 时返回 outside-base-path 忽略，不算内容 lint 通过，已按各自明确的 UTF-8/LF/八栏/真实链接规则检查。不能把外部忽略警告混记为真实仓库内容检查成功。

## 审阅、未测范围与阶段交接

独立只读审阅 t054_review 未发现 Critical/Important/Minor；实际复跑 Increment 独立交付与完整目录字节方法 2/2，另读技术/业务源码、真实红绿日志、摘要/同 inode/原技术前缀、定位和清理输入/输出/diff。审阅者未重新执行清理行为，未把执行者报告当自己亲测；验收文档在审阅时尚待生成，本轮最终由主执行者检查其内容和链接。

本任务没有承诺或执行断电持久性、并发事务、DB、真实外部系统异常、Windows/macOS/PowerShell、最低 Node 或公开来源验证；相关能力不能从本样本推导通过。T082 四负向旧证据保留，本轮不宣称它们在 T054 重跑。分析成功/失败与双触发留 T064，原生挂载留 T072，真实分发 Task 的用户反馈留 T076；真实工程清理仍为 T080。当前真实项目指针与暂存区受保护，不运行安装/注册、发布、部署或数据库写入。

T054 的技术与隔离业务工程信号已取得，Phase 1 的 T049～T054 及内部前置 T081/T082 结果供用户首次阶段验收。工程通过不等于用户已批准；本轮结束停在阶段检查点，等待明确验收及继续，未启动 T055 或后续 Phase。学习掌握和总体结案也不由此完成。
