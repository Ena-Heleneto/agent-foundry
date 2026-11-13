# MVU-B：最小模式交接验收

后续迁移说明：用户已指定新增脚本改用 Python。本文件保留 Node 版历史验收事实；当前入口与重新验证结论见 [Python 迁移验收](python-migration.md)。

日期：2026-10-30。来源：本功能 T005、FR-004/005/008/033；等级：agent-execution / verified。结论：最小交接通过，Phase 2 仍待用户验收；不表示完整 Tutor/Pair 或功能整体已完成。

## 基线与自动测试

独立 agent 在无 Tutor/Pair 入口时实际检查 `.agents/skills/` 与源目录，确认两技能不可调用，未创造替代状态。新增共享入口后，先真实 read/check 两任务；再分别新增、挂载并实际调用 Tutor、Pair。不是只检查提示词文本。

交接测试先因 switch-mode 尚未实现产生红灯；真实挂载测试在 Pair 尚不存在时因缺少入口失败。最终执行：

```bash
node --test --test-reporter=tap packages/skills/tests/workflow-state.test.mjs packages/skills/tests/workflow-integration.test.mjs
```

32/32 通过，退出 0；其中状态测试 28 项、集成测试 4 项。完整输出为本次会话 `/tmp/workflow-phase2-final-tests.log`，临时日志可能清理。覆盖真实挂载清单/字节、挂载 CLI、交接身份/验收保持、两父任务隔离、工程勾选独立、未保存时冻结推进与 after 缺失的工程观察恢复。

## 最终固定快照与实际调用

主副本：`/tmp/workflow-mvu-b-j_nl0h1i`。源修改汇合后，在此副本执行 `bash scripts/dev/actions/link-skills/link-skills.sh`，随后逐文件核对所有下列技能的完整清单和 hash，保存 final-skill-snapshot.json。最终整条链路前后与当前维护源逐文件相同；没有刷新真实工作区 `.agents/skills/`。

| 文件                                                 | SHA-256                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `workflow-task-context/SKILL.md`                     | `3e866938660b35ae00cec8505e644fc588266ce546d63331c74f04ce4f4ba276` |
| `workflow-task-context/references/handoff.md`        | `cb2999427abe19b73c0ab64b5d4066f0fad553c3ed2d452c009b84ef41e463eb` |
| `workflow-task-context/references/state-contract.md` | `46ab8a3ddb07d9b23ce4ed8370c37b750d4bfd6b61d5ca7937e7a61e6e80a483` |
| `workflow-task-context/references/state.mjs`         | `c9d32b9230f24ca0e6d5b12256f7467d6b9a5aaf1c3970738abfaf687c26dcc2` |
| `speckit-tutor/SKILL.md`                             | `17c2e1795d1cbd0f8195a010c14292d6405c179dbe49df52ccfaab1cb7d41a84` |
| `speckit-pair/SKILL.md`                              | `5b3e5091f30346b1622cd3c46b73510baca4d7e6217087c98b93a7567d6c5985` |
| `mvu-gate/SKILL.md`                                  | `47cb3dfa543612e4e95b5cc8aee2f33e7fe9d6f63366a44e0105406eb441e075` |
| `speckit-implement/SKILL.md`                         | `848a5c9eff7b99e348927cbde6c35378de9fea3fd317941f58fa0b0b79301eec` |

早期入口验证后 T001 已为 revision=3/mode=pair。最终快照下重新执行完整链路：

| 实际操作                                | operation_id                         | revision |
| --------------------------------------- | ------------------------------------ | -------- |
| Pair → Tutor                            | 935ddfd6-35a5-4940-bfb0-a62189a68967 | 3 → 4    |
| Tutor → Pair                            | d80adb12-2afa-4907-af21-2316578cf448 | 4 → 5    |
| 原生 before_implement：Pair → Implement | 80a07cab-cec7-4ef6-911f-0017c8797f1b | 5 → 6    |
| 缺失 after 后重新观察工程               | 32744385-2329-44f4-a2ef-aadc4c0d7cb7 | 6 → 7    |
| Implement → Tutor                       | a3d4c512-a9f7-4881-a2bc-e1910b93e3c9 | 7 → 8    |

每次实际 read 后保存原请求，再由 `.agents/skills/workflow-task-context/references/state.mjs commit --spec specs/skills/fixture --task T001 --request <当前父任务过程区请求>` 提交；均返回 ok=true，退出 0。operation_id 原请求保留在副本 collaboration/T001。最终由主 agent 再核对 revision=8、mode=tutor、全部回执材料 hash 与快照。

原生 Implement 读取原始挂载技能，按临时 YAML 先分发既有 mvu-gate，再执行共享 before；先实际验证 T000 checkpoint()===1 并勾选，保留骨架，再实现 `fixture-1.mjs` 的 result() 返回 1。实际 Node 动态导入断言退出 0，然后才勾选 T001。样例源码与 checkbox 修改均立即运行实际 ESLint，退出 0。T002 不在本次工程范围，未勾选。

按本任务明确要求模拟中断，工程勾选后停止在 after 之前，不伪造其回执。随后真实调用 Tutor，重读代码/checkbox 并再次运行：

```bash
node --input-type=module -e 'import assert from "node:assert/strict"; const { result } = await import("./fixture-1.mjs"); assert.equal(result(), 1); console.log("T001 recovery result() === 1 PASS")'
```

实际 stdout 为 `T001 recovery result() === 1 PASS`，退出 0。结果、命令、代码 hash、原 after 未执行与未验证项保存为 recovery-observation-32744385-2329-44f4-a2ef-aadc4c0d7cb7.json，经回执提交后才切回 Tutor。

全过程 current_subtask_id=T001-S0001，原 code 验收未改；code 共享子任务仍 active，不由工程勾选自动完成。learning 子任务仍 pending、无用户实践；tutor/pair 仍 null，不虚构会话或掌握。T002 始终 revision=1，状态 SHA-256 前后均为 bb61102bf2f36661eb385ffc53a477d4983c9e1866194064f31489b0e8650961。

## 原生门禁与旧功能

- MVU-X 未验收时，独立 agent 读取原生 Implement 与 mvu-gate，实际在共享交接前阻塞 T001；业务文件不存在，revision=3/mode=pair 不变。
- 独立失败副本 `/tmp/workflow-mvu-b-failed-_skfoaby` 中，真实动态导入 checkpoint() 并断言等于 1，退出 1，实际 0、预期 1。保留失败骨架，T000/T001 均未勾选，回其 plan.md 重新评估，不执行下游。
- 主副本通过 MVU 后保留骨架，并从首个未勾选工程任务继续。工程 checkbox 更新后恢复指纹不变；定义变更阻断及中断恢复由实际 Node 故障断言覆盖。
- 独立 legacy-fixture 只有有效 spec/plan/tasks，没有共享状态。真实执行 before/after 语义的 helper read，均 state=null、revision=0，按规则无操作。前后完整树/hash 相同；subtasks、learning、collaboration 均不存在，不声称执行了旧功能工程实现。

临时配置保留既有 MVU 条目与原相对顺序，额外加入共享 before/after。只在隔离副本接线；真实工作区 extensions.yml、注册器、原生 Implement、mvu-gate 源/副本均保持内容 hash。

## 独立审查及修正

独立只读审查发现三项 Important 与一项时间格式 Minor，已在同一修正组处理：

1. 临时状态被改写后可能沿用：新增真实中断后的改验收反例，改为用原请求和最后权威状态完整重建并比对临时状态，只沿用合法服务端时间。
2. 提交期间正式定义变化：锁内及 rename 前重新计算任务定义指纹，新增锁创建和临时写入两个边界反例，变更即停止提交。
3. 工程观察反例被 mode=null 短路：先合法切到 implement，每次只破坏一项约束并核对具体失败原因；路径/ID 使用统一合法基线。
4. 批准时间：按精确 Time DTO 必需项处理，拒绝非法时间并保留锁，未扩大恢复权限。

四个新增实现回归先实际失败 4/4、修正后通过 4/4，再跑完整 32 项。此前还补充了锁内 request_hash，证明尚未创建临时状态时也不能换同 ID 请求。没有将诊断当成功，没有延后已识别的审查问题。

## 工程检查与限制

- `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`、对应 check-types/build 均退出 0。Vite 仍有既有 import 缺扩展名提示；未改构建器。
- 真实 MCP registry 的 load_manifest/load_skills 加载 18 个技能，schema version=1；逐技能正文及 references 直接文件与当前源完全一致，包含 state.mjs。只证明文本消费，不宣称 MCP 可执行 helper。
- 以下三个命令各自因缺 PyYAML 退出 1，均未完成原验证器检查：`python <source-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/skills/src/speckit/workflow-task-context`；`python <source-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/skills/src/speckit/speckit-tutor`；`python <source-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/skills/src/speckit/speckit-pair`。其现有 schema 也不接纳本仓库要求的 destructive 字段。未安装依赖或绕过返回成功，改用现有 yaml 2.9.1 真实解析三个 frontmatter，验证具名字段/类型/命名/无占位，与真实构建验证共同作为本仓库格式检查。
- 完整 Node 测试经工具批准在沙箱外运行，以避开沙箱 spawnSync 的 EPERM；没有运行数据库初始化、发布、部署、Git 提交或真实工作区挂载。
- 本阶段只有最小交接，完整子任务转换、Tutor/Pair 会话、Review 及旧机制退役均属后续故事，未提前宣称实现。

### 安装记录的同期变化

最终基线复核发现 `.specify/init-options.json`、`.specify/integration.json`、`.specify/integrations/codex.manifest.json`、`.specify/integrations/speckit.manifest.json` 于 2026-10-30 01:50:46 UTC 发生变化：安装版本从 1.2.5 记为 1.2.4.dev0，Codex installed_at 更新。两个子 agent 均确认未运行安装或真实仓库写入；尚不能确认来源，保留变更，不覆盖或还原。

与 Git 索引逐项比较，四文件仅上述版本/时间元数据变化，文件映射与其他字段一致；原生 Implement 内容仍为本报告快照 hash，MVU 源/副本/配置与注册条目仍保持基线。43 个采集文件中 40 个全文件 hash 不变，另外三个是上述安装记录（speckit.manifest 未列在原 43 项内）。这不是本阶段计划修改，须由用户验收时一并核对来源；不以元数据变化推断实际核心内容已变，也不沿用“43/43 全部未变”的旧结论。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
