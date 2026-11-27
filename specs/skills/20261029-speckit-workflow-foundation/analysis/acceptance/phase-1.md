# Phase 1 执行结果与待验收记录

日期：2026-10-30。范围：T001、T002。依据：spec.md FR-036，AI 执行当前阶段，执行结束后暂停，由用户验收。本记录表示工程自检结果，不表示用户已验收通过。

## 改动与产物

- T001 已完成调查、43 个文件的基线 hash 与 16 个隔离样例文件；见 [实施基线](../implementation-baseline.md) 和 [hash 清单](../baseline-hashes.json)。
- T002 在 `packages/skills/package.json` 新增 `lint: eslint .`、`check-types: tsc --noEmit`，保留 build；没有新增依赖或改动 tsconfig。
- `packages/skills/eslint.config.ts` 的 src 忽略范围从全部文件收窄为 Markdown；dist 继续忽略。配置声明新增中文多行 JSDoc，未改动共享预设或全局检查强度。
- tasks.md 的实施协作说明同步 FR-036；T001/T002 勾选只表示相应工程任务已完成，Phase 1 用户验收仍待进行，T003 及后续任务未开始。

## 实际验证

| 命令或检查                                                              | 实际结果                                                                                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @foundry/skills run lint`                                | 退出 0                                                                                                                                             |
| `pnpm --filter @foundry/skills run check-types`                         | 退出 0；检查现有 TS 构建配置，不宣称覆盖未来 JS helper 的运行语义                                                                                  |
| `pnpm --filter @foundry/skills run build`                               | 退出 0，Vite 8.3.5 生成 dist/index.js 与 manifest.json                                                                                             |
| 在 skills 包目录通过 Node 调用 ESLint API                               | state.mjs、article.mjs、tests/workflow-state.test.mjs 三个计划路径均未被忽略，均可解析到规则，输入无效语法均检出 fatal error；没有为探针创建源文件 |
| 同一 ESLint API 检查忽略行为                                            | src 下 SKILL.md、references/state-contract.md、dist/manifest.json 均按约定忽略                                                                     |
| Python 调用真实 `foundry_skills_mcp.registry.load_manifest/load_skills` | 构建清单 version=1，加载 15 个技能；名称唯一，数量与源一致，逐技能正文及平铺 references 内容与源一致                                               |
| 重新计算 T001 受保护路径 hash                                           | 43 个文件全部保持采集时字节，未改动 Implement、MVU 源/副本/注册项及历史资料                                                                        |

ESLint 路径探针在 packages/skills 中运行，以 `isPathIgnored`、`calculateConfigForFile`、`lintText('const =', { filePath })` 进行实际断言；不仅检查配置文本是否包含模式。消费者核验通过 Python 将 apps/mcp/src 加入导入路径，加载本次真实构建清单，逐项与 packages/skills/src 下的 SKILL.md、references 直接文件比较。

## 限制与遗留问题

- Vite 构建提示 `vite.config.ts` 的 `./build/plugins/manifest` 导入缺少文件扩展名，未来 native configLoader 不支持该用法。当前构建成功；该文件未修改，不为本阶段顺手调整构建方式。
- `python -c 'import pytest; print(pytest.__version__)'` 退出 1，原因为当前 Python 未安装 pytest；apps/mcp/.venv 亦不存在。因此本阶段没有执行 MCP pytest 套件，改以真实 registry 加载与逐文件内容断言核验受影响消费者。MCP server 注册行为尚未在本阶段重验，完整平台与消费者回归仍在 T029；不将本次加载检查等同于该任务已完成。
- T001 记录的旧 explainer-doc-sync Markdown lint 问题继续保留；本阶段未改动该技能，也未将其从构建清单移除。
- 没有运行挂载器、注册器、数据库初始化、发布、部署或 Git 提交；没有执行尚未实现的 helper、MVU 或模式演练。

## 用户验收交接

请核对两个配置文件的改动范围及上述验证证据。当前状态：Phase 1 执行结束，等待用户验收；用户明确确认验收通过并继续后，才进入 Phase 2（T003～T005）。如有问题，先修正本阶段并重新提交验收。
