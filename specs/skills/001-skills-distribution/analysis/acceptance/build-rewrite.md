# T064：旧构建存档与清退验收

日期：2026-11-10。范围：用户确认先将旧打包构建架构及构建脚本移入存档，再重新实现，并明确授权“开始吧”。实施依据为 [T064 方案](../../implementation/T064.md)，当前工程状态只在 [tasks](../../tasks.md) 维护。

## 基线、移出与保留

实际功能分支为 `feature/speckit-workflow-extensions`，源码比较基线 `52eebe56dcd26a95888f863015ce7d91ab423b18`。本轮开始时存在其他功能、治理和本功能文档的未提交修改，未整理、回退、提交或覆盖。实际 Node v24.22.2、pnpm 12.16.1；不据此证明最低版本或其他平台。

原 [存档](../../archive/2026-11-10-build-pipeline-replan/README.md) 的压缩包摘要及包内 63 项逐文件摘要全部核验通过；当前 packages/skills 范围相对该快照没有新增字节差异。原压缩包和原摘要未重写。

本轮 21 个文件按原始字节和仓库相对路径移入该归档的 `retired-source/`，逐项清单见 `retired-source.sha256`：

| 原位置                                                                                                                | 数量 | 去向与后续职责                                                   |
| --------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------- |
| packages/skills/vite.config.ts                                                                                        | 1    | 原配置存档；有效位置改为明确拒绝构建的临时入口                   |
| packages/skills/build/plugins/{content,scripts,mcp-manifest,distribution}.ts                                          | 4    | 旧构建组件存档；后续按新阶段重新实现                             |
| packages/skills/build/distribution/{models,validate,verify,projection,references,export}.ts                           | 6    | 旧构建模型、清单、投影和校验存档                                 |
| tests/distribution 下 test-build-config、content-export、release-models、official-contract、official-preflight、mvu-a | 6    | 直接耦合旧实现的测试存档，保留其验收契约                         |
| tests/distribution/helpers/{catalog,projection,selection}.ts                                                          | 3    | 依赖旧构建的转导出和实验辅助存档                                 |
| packages/skills/tests/test_artifacts.py                                                                               | 1    | 依赖旧 dist 的构建及交付测试整文件存档，原规则继续供后续测试复用 |

现有 `build/types/preset-config.d.ts` 与构建业务无关，是 ESLint 配置所需的类型声明，原样迁至 `types/preset-config.d.ts`，tsconfig 只调整对应 include；未新增或改写框架兼容声明。build 下仅剩原有空 ci 目录，没有旧实现文件。

清退前记录的 120 个保留文件全部仍存在且摘要不变，覆盖技能源、安装/挂载脚本、保留测试及实际已有产物；原 11 个已完成 Task 区块逐字节保持。未修改 `.agents` 挂载副本、业务应用、锁文件策略或用户 Git 暂存区。

## 消费者与当前可运行边界

- 原 Vite 配置直接调用四个构建组件，分发组件消费六个 distribution 模块；这些旧路径均已移出，临时配置没有旧导入。对有效源码和测试的检索未发现悬空旧构建导入。
- MVU-A 经 catalog/projection/selection helpers 间接调用旧构建，所以一起存档。测试调度器本身保留；请求已移出的 A 或 US1 场景会报告未实现场景并非零退出。sandbox 自测中的 mvu-a 文件是它自行创建的隔离夹具，没有加载归档。
- 在线 Agent 读取器、唯一 Node 入口、Bash/PowerShell 安装与挂载脚本源码均保留。工作区 link-skills 从 src 复制，不依赖旧构建，Bash 消费验证通过。
- 包内 Python 构建/交付测试随旧实现存档，默认发现剩余 11 项通过不代表原 24 项或新构建全部通过；MCP、Release、正文/附件、投影、官方预检与完整交付契约由 T065～T070、T037 等后续任务恢复验证。存档测试的历史失败也保留，不改写为本轮已修复。
- MCP 应用及 dist 消费者的新产物回归目前无法完成，因为新构建尚未实现。现有 dist 原字节保留，不能当作本轮或新阶段构建成功证据。根 build/build:packages/bootstrap/install 的构建链会在本包明确失败，直至新构建恢复。

## 实际检查与结果

以下包命令均在仓库根执行，使用 `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run <脚本>`，避免运行前隐式同步依赖。

| 命令或检查                                   | 实际结果                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| run lint                                     | 退出 0                                                                                                                         |
| run check-types                              | 退出 0，原类型声明迁移后仍可消费                                                                                               |
| run build                                    | 退出 1，明确提示“技能打包构建重做中：旧实现已存档，新构建尚未实现（T065～T070）；本次未生成产物。”；前后摘要证明旧 dist 未改变 |
| run test                                     | 退出 0，Python 11 项通过；不包含已存档构建测试                                                                                 |
| 原 snapshot.sha256 与 63 项包内摘要          | 全部通过                                                                                                                       |
| retired-source.sha256                        | 21 项全部通过，与清退前及原压缩包中同路径逐字节一致                                                                            |
| 保留集合、类型声明、旧完成块与活跃旧导入检查 | 120 项保留字节不变、类型声明原字节不变、11 完成块原文不变、无悬空旧构建导入                                                    |

消费者实际分组命令：

```bash
node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs packages/skills/tests/distribution/test-entry.mjs scripts/dev/actions/link-skills/test-link-skills.mjs
```

退出 0，18 项中 17 通过、1 PowerShell 缺运行时跳过；包含临时项目中的真实 Linux 安装与二进制附件核对，未写入真实用户安装目录。

```bash
FOUNDRY_SKILLS_PACKAGE=<source-home>/.cache/pnpm/dlx/b106bc54e1b10443886af6c6611d98ea/mw8lhnma-suu/node_modules/.pnpm/skills@1.7.6/node_modules/skills \
node --test --test-isolation=none packages/skills/tests/distribution/agent-paths.test.mjs
```

退出 0，3 项全部通过；使用本机已缓存官方包作为受控 HTTP 边界夹具，没有重新下载或固定产品的上游版本策略。该作者缓存路径只用于本仓库验收记录，复现时替换为本机实际官方包位置。

```bash
node --test --test-isolation=none packages/skills/tests/test-register-commands.mjs packages/skills/tests/test-register-hooks.mjs
```

退出 0，5 项中 2 通过、3 跳过：PowerShell 同一接口缺运行时；官方 hooks-only 实测及真实平台两次安装缺调用方提供的官方 CLI。保留旧脚本接口验证，不宣称新版 Increment/准备 hook 或其他平台已验。

## 中途失败及处理

清退脚本已完成移动后，尝试移除空 build 根目录时发现原有空 ci 子目录，因 Directory not empty 停止在摘要写入前。读回确认没有遗漏移动文件，保留该空目录并补写、核验 21 项摘要；没有重复移动或覆盖文件。

消费者首次在沙箱内因 spawnSync EPERM 失败，按权限规则在沙箱外重跑。重跑发现在线用例缺 FOUNDRY_SKILLS_PACKAGE；检索并使用本机现有官方包后，在线 3 项通过，但将该夹具全局传给混合测试会使复制到临时目录的 sandbox 自测预加载路径缺文件，两项自测失败。按既有测试的夹具边界分组执行后全部适用项通过，没有修改保留 helper 或隐藏失败。

只读独立审查未发现 Critical、Important 或 Minor 实质问题，并独立核验原快照、21 项移动字节、120 项保留字节、类型声明、旧路径移除与临时入口的无产物写入行为。完整过程日志暂存 `/tmp/foundry-distribution-t064/`，临时目录可能清理，本记录及归档摘要提供持久结论和恢复依据。

## 后续与恢复

本轮只验收旧构建存档及清退。下一项是 T065：基于既定新阶段契约建立真实失败测试，继而 T066～T070 实现 CI 和新构建；没有提前执行、预填方案或勾选这些任务。真实平台、支持矩阵、迁移、发布与部署未执行。

需要恢复时先在自有临时目录读取原快照或 retired-source，核验摘要、比较当前目标，再逐文件处理。原配置已有临时替代内容，类型声明已迁址，不能直接批量覆盖；不使用整包 reset/revert。T064 完成不意味着新构建完成。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
