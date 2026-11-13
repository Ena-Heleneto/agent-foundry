# Python 脚本迁移验收

日期：2026-10-30。来源：用户明确要求「我们使用python脚本吧」；范围为本功能新增 helper、测试及当前运行契约。用户此前已验收 Node 版 Phase 2，本记录替代其运行时结论，原记录保留为历史。Python 版实施与自检结束，等待用户验收，未进入 Phase 3。

## 最终实现

- 状态入口改为 `packages/skills/src/speckit/workflow-task-context/references/state.py`，只用 Python 标准库；删除旧 state.mjs 及两份新增 Node 测试，不保留双入口。
- Python 公共接口为 read_task_state、commit_task_operation、recover_task_operation，同步返回协议结果字典。context 的 repoRoot/featureDirectory/taskId、JSON schema_version=1、CLI 子命令/参数、退出码 0/2/3/4、回执与指纹协议不变。
- 行为测试为 `packages/skills/tests/test_workflow_state.py`、`test_workflow_integration.py`；新增包内 test 脚本运行标准库 unittest，不安装 Python 依赖。JS/TS 构建仍用原 ESLint/tsc，Markdown 仍用项目 ESLint。
- 技能引用、plan、tasks、quickstart、技术图路径及 workflow/artifacts/review 契约均改为 Python。后续文章 helper 规划同步为 article.py，尚未实现；既有 scripts/dev 的 Node 四件套测试不迁移。
- 写文件仍用排他创建、flush/fsync、同目录 os.replace；保留锁、版本冲突、原请求绑定、不可变材料与完整临时状态比对。bool 不被当作 JSON 整数，stdout 用 ASCII JSON 转义适配不同管道编码，持久化及 hash 继续使用 UTF-8。

## 自动验证

| 实际命令或检查                                                                     | 结果                                                                                                 |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 首批 Python 测试，helper 尚未实现                                                  | 18 组因缺少真实 state.py 产生预期红灯                                                                |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`        | 25 组 unittest 全通过，退出 0；含多项输入/故障子场景                                                 |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`        | 退出 0；不宣称 ESLint 检查 Python                                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types` | 退出 0；检查既有 TS 构建部分                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`       | 退出 0；仍有既有 Vite 缺扩展名提示                                                                   |
| Python compile 与 AST 检查                                                         | 三个 Python 文件语法有效，函数/类均有中文 docstring，不生成源目录 pycache                            |
| 实际 MCP registry load_manifest/load_skills                                        | 18 个技能的正文及直接 references 与当前源逐项完全一致；schema version=1，含 state.py、不含 state.mjs |
| 修改 Markdown 的 `pnpm exec eslint --fix`                                          | 全部执行；技能源 Markdown 用 --no-ignore 进行真实检查                                                |

最终完整测试输出为本次会话 `/tmp/workflow-python-final-test.log`，显示 Ran 25 tests / OK。日志与临时副本可能被系统清理，工程测试和固定兼容样例保留在仓库。

测试覆盖原状态/交接不变量：缺失状态零写入、初始化归属、重复提交、并发冲突、提交点前后故障、残留锁、坏 JSON/结构、材料冲突/损坏、真实 ESLint 格式固定点、恢复 DTO/原请求绑定、临时状态篡改、保存期间定义变更、批准时间、模式交接、工程勾选与学习独立、挂载清单/CLI、保存失败冻结。

## 旧状态兼容与审查修正

`packages/skills/tests/fixtures/workflow-v1.json` 来自迁移前已验收 Node 实现的真实输出，测试不依赖旧运行时。Python 已实际读取该状态、重放原初始化回执，并继续提交模式切换；任务指纹和新操作 request_hash 与 Node 固定输出一致，包含中文、Unicode 蛇字符、材料字节和大写 UUID 规范化。不重建身份或重写旧状态格式。

独立审查发现并完成两项修正：

1. 非 UTF-8 stdout 下，成功 commit 后输出中文会编码崩溃。以 PYTHONIOENCODING=ascii 的真实子进程复现红灯，改为 CLI ASCII JSON 转义后通过；hash/材料字节不改变。
2. 深依赖链：相同 1000 项合法链，旧 Node 实际退出 0，而初版 Python 因递归上限返回 4。按迁移兼容要求将该项作为回归修复，改为迭代拓扑检查；独立反例先失败后通过，并补环依赖拒绝断言。保持原 9999 项输入上限，不通过缩小范围掩盖问题。

修正后重跑完整 25 组测试及包检查，没有遗留审查问题被标作已解决而未验证。

## 真实模式交接

隔离副本：`/tmp/workflow-python-e2e-77tg_rgn`。每次源更新后仅在该副本运行真实 link-skills 并逐文件核对，未刷新真实工作区挂载。最终完整源/挂载快照保存在该副本 final-python-snapshot.json，主 agent 已独立核对最终状态和回执材料 hash。

最终 state.py SHA-256：`32e92cb12d5b9b79af38a34dbd37f1791134d06b4a2f0eddc937c0d250115dfc`。共享技能完整四文件以及 Tutor、Pair、MVU 源/挂载清单和每文件 hash 均一致。原生 Implement 保持 `848a5c9eff7b99e348927cbde6c35378de9fea3fd317941f58fa0b0b79301eec`。

先前 Python 快照下，独立 agent 实际完成 Tutor→Pair→原生 Implement→Tutor：先执行原 MVU 门禁及 4 组 Python 集成骨架，创建 fixture.py 的 result()，真实导入断言返回 1 后按原生规则仅勾选 T001；在 after 前按授权模拟中断，Tutor 恢复重读并再次实际验证，再经 reconcile 保存观察，保留原 after 未执行事实。该段 operation_id 为 b0f763e1-4dc4-4190-8779-59a9bcdde0b9，revision 6→7，随后返回 Tutor 至 revision=8。

最终修正版快照下再次实际完成同一链路，执行正常 after：

| 操作                | operation_id                         | revision |
| ------------------- | ------------------------------------ | -------- |
| Tutor→Pair          | 76441d27-95a8-44b3-9919-54c0effc3063 | 8→9      |
| Pair→Implement      | 80e36dbe-e191-4fef-b2db-35c3ce77a7c1 | 9→10     |
| 正常 after 工程观察 | d00c256c-f982-49f8-8f95-3a5e5fa87eb4 | 10→11    |
| Implement→Tutor     | 884dd8c6-3d3a-4738-a2b8-018e5a84d45a | 11→12    |

所有提交均为实际挂载 Python CLI；原生 prerequisites、现有 MVU 门禁与集成骨架再次执行成功。实际工程命令：

```bash
python3 -B -c 'from fixture import result; assert result() == 1; print("T001 final result() == 1 PASS")'
```

实际退出 0，stdout 为 `T001 final result() == 1 PASS`，stderr 空。观察经 helper 排他保存为 final-observation-d00c256c-f982-49f8-8f95-3a5e5fa87eb4.json，不直接手改 state.json。

最终 T001 revision=12、mode=tutor、焦点 T001-S0001 与原验收不变；code 共享子任务仍 active，learning 仍 pending、无用户实践，tutor/pair 实体仍 null。T002 未勾选，其状态 SHA-256 前后均为 ff17441829526fd101dc825047b2f23dca4b9a635ffa405052aeb5a47ca2376c。未重写正式任务定义，未自动把工程达标算作学习通过。

## 边界与未执行项

- 当前环境是 Linux。Windows 进程拥有者检查使用标准库 ctypes 的只读进程句柄，避免 Windows os.kill 的终止行为；未在 Windows 实机执行该分支或 PowerShell 平台回归，跨平台运行证据仍待后续 T029，不宣称已通过。
- 完整 Tutor/Pair/Review 功能和正式挂载激活仍在后续阶段，本次只迁移已实现的共享骨架。
- 此前四个 `.specify` 安装记录的来源未明变化继续保留，没有覆盖或恢复，详见历史 MVU-B 的同期变化记录。未安装依赖、提交、发布、部署或写数据库。
