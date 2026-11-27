# TV-02：Increment 最小规划写回验证

对应 [T052](../../tasks.md#t052)，依据 [工作流契约](../../contracts/workflow.md)；材料和精确位置见 [独立材料索引](fixtures/tv-02/README.md)。日期：2026-11-05。本次验证规划行为，真实用户使用、业务实现、分析集成和原生命令挂载不在本结论内。

## 假设、输入与实际加载

命中 C3：未验证的假设是，独立执行者加载最小技能后，能根据已有材料选择正确路径，保存增量规划并保护原任务；重复或部分保存失败后不会重复建任务、丢失原事实或提前推进依赖。可证伪信号是缺 plan 仍写计划、重用已有 ID、改变完成事实/验收、重复追加、未保存仍报告完成，任一出现即不通过。

T051 已完成；before_implement 的 mvu-gate 已核对前置与本次试验范围。无新依赖、外部交互或新跨包契约。本次不借最小骨架实施业务，也不新建状态 helper。

根目录 `/tmp/foundry-t052-bjs4co8g` 下，before 保存六组原材料，baseline 保存无技能行为，cases 保存实际工作现场，first 保存首次执行后现场。项目需求均为查看 alpha/beta、新增 gamma 后查看与筛选、无匹配空列表、新增失败保留原数据；每组独立。已有 tasks 的 T004 [x] 为显式标注的夹具事实，T009 [ ] 为原筛选任务，不能当成真实用户验收。

无技能基线由独立执行者 t052_baseline 实际读取并写文件：no-plan 新建 plan/tasks，plan-only 保留方案后创建任务，均规划 T001～T003。其理由原话：“项目没有业务代码、依赖清单或既有运行入口。采用 Node.js 内置能力提供本地命令行入口，复用逐行标签文件。这是本次规划选择，需求没有要求网页界面。”这暴露缺 plan 时越过前置的行为；plan-only 本身没有被判为失败。

随后建立并实际读取 [task-increment 源技能](../../../../../packages/skills/src/skills/workflow/task-increment/SKILL.md)，加载内容 SHA-256 为 `12caf1997f3c83f13eb94cb190601d5b7c926baaceb4010c9eae8b82d3f67375`。t052_materials 执行前三组，t052_existing 执行 existing/selected，t052_failure 执行保存失败。每个执行者从独立上下文读取技能与项目治理后实际行动，未获得预期答案或其他项目结果；主执行者另读文件核验。不是通过辅助程序生成两段预设回复，也没有调用尚未挂载的 `$speckit-modes-increment`。

通用试验请求原文：“请增量规划这个标签项目的实施路径，必要时更新规划和任务，让管理员能够新增标签后筛选查看。只完成规划，不写业务实现。”selected 请求原文：“请针对 T009 增量规划实施路径，让管理员能够新增标签后筛选查看。只完成规划，不写业务实现。”这些是工程试验输入，不是用户发言或接受推荐的证据。

## 首次实际结果与文件差异

| 场景         | 写前 → 写后                                                                 | 原事实与验收                                                                              |
| ------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| no-plan      | 无 plan/tasks → 仍无；只写试验报告                                          | 报告方案缺失，建议先完成方案规划                                                          |
| orphan-tasks | 无 plan、已有 tasks → 原样保持                                              | T004 [x]、T009 [ ]、原八栏及证据逐字保留                                                  |
| plan-only    | 原 plan → 追加 BV001～BV003；无 tasks → 新建 T001～T004                     | 查看 → 写失败保护验证 → 新增 → 筛选，全部未完成，每项八栏；原数据不变                     |
| existing     | 原 plan → 追加 UV01～UV03；tasks → 内联细化 T009、新增 T010                 | T004 完整区块及原 T009 八栏保留，T010 未占用；新增与筛选均未完成                          |
| selected     | 原 plan → 写明 T009 重点及 T004/T010 必要关联；tasks 与 existing 的增量一致 | T004 提供原列表，T010 补新增前置，新增后联调等待 T010；未改变原筛选目标、范围及空列表验收 |
| save-failure | plan 写入 BV-001～BV-004；tasks 写入实际失败                                | 原 tasks 完全未变；计划中 T010/T011 尚无任务，明确报告不一致与待恢复项                    |

主执行者读取的实际增量片段（existing/selected 的 tasks）：

```diff
 ### T009
 - [ ] T009 按标签筛选列表
 （原目标、范围、依赖及八栏保留）
+实施步骤（T009 内联细化，原目标、范围、依赖与验收保留）：
+- 设计依据补充：[UV03](plan.md#uv03)。复用已完成 T004 的预置列表证据，不重新创建查看任务。
+- 新增后的联调另依赖 [T010](#t010)：其通过后新增 gamma，再选择 gamma 验证只看到 gamma；保留原有 alpha 与空列表验收，不替换原验收。
+### T010
+- [ ] T010 新增标签并保护失败前的列表
```

以上为省略未变段落的实际差异摘录，完整原文在 before/first/cases 对应项目。既有 plan 原文均保留为前缀；existing/selected 的 tasks 原内容逐行保留，新增行只补步骤与新任务。plan-only 首次任务行是 `T001 让管理员查看预置标签`、`T002 验证新增时的写失败保护`、`T003 让管理员新增标签`、`T004 让管理员按标签筛选`，全部 [ ]；这是独立无 tasks 项目，不与其他项目的 T004 混用。

首次响应原话摘录：

> no-plan：当前没有 plan.md，亦没有 tasks.md。按 task-increment 技能的“无 plan”规则，本轮停止规划写入，没有创建 plan.md/tasks.md，也未实现业务。

> orphan-tasks：现有 T004 已完成、T009 未完成，但缺少 plan.md；孤立任务不能替代方案前置。本轮停止规划写入，未新建 plan.md，也未修改 tasks.md。

> plan-only：本轮增量规划已保存：specs/demo/plan.md 保留原方案，补充 BV001 查看现有标签、BV002 新增与失败保护、BV003 筛选查看；specs/demo/tasks.md 新建 T001～T004，全部保持未完成。

> existing：保留已完成 T004 和未完成 T009 的原目标与验收，内联细化 T009，新增未完成 T010 补齐新增及写失败保护路径。

> selected：保留其原目标、范围和验收并内联细化筛选步骤；关联已完成 T004，新增未完成 T010 补齐同一业务目标的新增前置，新增后联调等待 T010。

## 保存失败与同现场恢复

保存失败前只有临时项目 tasks.md 为 0444；执行者被禁止改权限、删除或替换它。实际先保存并读回 plan，再用 Python 写 tasks，工具退出 1：

```text
PermissionError: [Errno 13] Permission denied: 'specs/demo/tasks.md'
```

执行者真实响应：“规划部分保存，任务写入受阻。”它列出已写 plan、未写 T010/T011 与 T009 细化，停止受影响的后续写入和完成判定；未进行业务实现。失败后只读核对 tasks 仍为原 1320 字节及原状态。计划 3252 字节保留，没有假称跨文件回滚或全部完成。

主执行者保存 first/save-failure 后，断言实际错误已记入 result、tasks 字节等于 before、权限仍 0444，再仅将该临时文件恢复 0644。随后同一执行者重读相同技能、相同目录，恢复原请求，并重复调用；后续真实结果另记下方，不以解除权限替代恢复验证。

## 重复、恢复后的独立核验

五组正常现场再次处理原请求后，plan/tasks 与 first 快照逐字节一致：缺 plan 的两组仍不写；其余三组确认已有条目覆盖需求，只追加 result 报告。每项新任务仍未完成，没有双份 Task 或验证单元。

失败现场恢复响应原话：“原增量规划已恢复保存。plan.md 沿用已有四个验证单元，tasks.md 已补齐 T010、T011 并细化 T009；任务格式、读回及跨文件引用检查通过。T004 保持已完成，其余任务保持未完成。”随后同一项目重复请求，plan/tasks 摘要与恢复完成时一致。

恢复只写 tasks，从 1320 字节变为 4057 字节；plan 与首次失败时的 3252 字节逐字节一致。T004 完整原区块不变，T009 原目标、范围、alpha/空列表验收保留，在原八栏内增加 gamma 联动及 T011 依赖；新增 T010 技术验证、T011 新增业务，均未完成。失败期间未进入这些依赖实施，恢复后仍只完成规划。

主执行者另运行 `python -` 文件断言，直接比较 before/first/cases：六组非计划输入全部字节不变；没有业务文件或状态文件；原 T004 完整区块、原 T009 目标/范围/两条验收与证据保留；任务 ID 唯一、新增 ID 未占用、原状态保留、每项八栏齐全；最终计划/任务文件链接及标题锚点有效；正常重复字节一致、失败原 tasks 字节不变、恢复 plan 沿用原文。检查退出 0。

第一次主执行者检查曾把“整个原行必须逐字不变”用于失败恢复后的 T009，因此拒绝新增依赖的同一行；读回确认只是追加 T011 联动依赖与 gamma 条件，原目标/范围/两条验收未删除。改为按受保护字段、原验收与 T004 完整区块核验后通过，没有为过测试改写执行结果或放宽任务要求。

最终文件 SHA-256（临时目录不能作为长期唯一证据，故在此保存响应、差异与摘要）：

| 场景         | 文件     | 字节 | SHA-256                                                            |
| ------------ | -------- | ---- | ------------------------------------------------------------------ |
| existing     | plan.md  | 2451 | `9c396c95f0b31f361b382dba0ca1655e88aaf79c25c136f070ae096e489bfad5` |
| existing     | tasks.md | 4080 | `9f02f33a1765287ed8ef769789fa32d46b30bd07cc8312e18cd31ed00a4b55d9` |
| orphan-tasks | tasks.md | 1320 | `1c722a79a3796dae6b4db26fd3a30415039356f4a128848ce6170e84cfe0af67` |
| plan-only    | plan.md  | 2836 | `3def3ffc832a81d8a8e29abfcc91ae99d78391ca9a656d1aff25107a899a3665` |
| plan-only    | tasks.md | 5465 | `1f2745265d9cc20625591b676e4f5a483265e751442bf167357391daec3618dc` |
| save-failure | plan.md  | 3252 | `1c85cabcde9dc067aadd1a9285a82cd76aee9c775609905b2871e18d3b9487d3` |
| save-failure | tasks.md | 4057 | `1ebd9d899421d81120c45498cb8fbf549bf74ca0843d20e192d39000d7766121` |
| selected     | plan.md  | 2589 | `9f303f8c168fee858b68aa39f679d976cb0f9ed3c03fdf283d6a1be8ac552adb` |
| selected     | tasks.md | 4080 | `9f02f33a1765287ed8ef769789fa32d46b30bd07cc8312e18cd31ed00a4b55d9` |

原共用 plan 为 331 字节、SHA-256 `b0a596b9089ea5193df68637a948fc1494bb1158ce436cb3ce2bdadb1856636f`；原共用 tasks 为 1320 字节、SHA-256 `1c722a79a3796dae6b4db26fd3a30415039356f4a128848ce6170e84cfe0af67`。no-plan 的 plan/tasks、orphan-tasks 的 plan 始终不存在。

## 工程检查与限制

| 实际命令                                                                                                                            | 结果                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false exec eslint --no-ignore --fix packages/skills/src/skills/workflow/task-increment/SKILL.md` | 退出 0；首次未带 no-ignore 被忽略并出现警告，已补实际检查  |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                         | 退出 0                                                     |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                  | 退出 0                                                     |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                        | 退出 0；生成 dist 由构建完成，未手改                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                         | 退出 1；13 个方法，11 个通过，两个模式方法共 6 个失败子项  |
| 在 packages/skills 执行 `node --test --test-isolation=none tests/distribution/test-build-config.mjs`                                | 沙箱内 6/7，子进程 EPERM；获准沙箱外重跑同命令 7/7，退出 0 |

6 个失败子项是 Tutor/Pair 源与交付的旧治理锚点（4 项），Direct 源与交付缺失（2 项），归 T057/T065/T055。T051 时另有 Increment 两个缺失失败，本次源和交付已通过；完整套件仍未全绿，未通过跳过或改断言掩盖。

通用 `quick_validate.py` 首次通过 `python -B` 运行因缺 PyYAML 退出 1；改用本机既有 `<source-home>/.cache/uv/archive-v0/SqGODpu5AOSLHtlR/bin/python -B` 后能运行，但因仓库通用的 `destructive: false` 不在其允许字段中退出 1。没有安装依赖、改验证器或假称通过。另使用包既有 yaml 解析器实际校验 name/description/destructive 类型与值，并核对源与 dist 字节一致，通过；保留仓库元数据惯例，通用验证器兼容限制仍在。

各临时项目没有 Git 元数据，`git status --short` 返回非仓库；行为核查使用写前副本和实际读回。项目原生约定的格式检查为 UTF-8/换行/八栏/链接及锚点核查，不引入格式依赖。没有运行业务测试、安装、真实注册或用户阶段验收；Windows/macOS、PowerShell 未测。本次工程证据不充当 T054 的业务骨架增量验证、T064 分析双触发、T072 挂载或 T076 用户反馈。

## 门禁结论与交接

四类材料分支、未占用新 ID、原任务与事实保护、重复不追加、真实保存失败阻断及同现场恢复均满足 T052 原验收；TV-02 最小规划写回门禁通过。保留同一技能与材料，供 T053/T057 增量扩展；不把技术通过代替业务、分析、挂载或用户验收。

独立只读审阅 t052_review 另核验六组实际文件，未发现 Critical/Important；唯一 Minor 是完整临时现场的保留风险，已在材料索引注明保留和缺失时处理。证据/索引 Markdown ESLint 与 6 个文件/锚点链接检查通过；主线任务回填后的保护与格式结果记入原 T052。

仓库快照检查发现本轮期间 `.specify/integrations/codex.manifest.json` 独立变化，当前相对暂存内容只改变 installed_at 时间戳；本执行者没有调用真实安装或注册，不归因于具体操作者，不覆盖或回退。暂存区字节保持；其余原文件的本次差异仅为计划中的任务回填和对话摘要，新建三份文件符合 T052 范围。after_implement 按 explainer-doc-sync 核查无新知识说明，不建空章节。首个用户阶段验收仍在 T054 后。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
