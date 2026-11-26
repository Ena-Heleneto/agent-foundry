# Implementation Plan: 主线技能按环境构建与发布

**Branch** feature/init · **Spec Kit 功能标识** 003-skills-release-pipeline · **Updated** 2026-11-26
**Input** [功能规格与四项澄清](spec.md) · [调研与决策](research.md)

## Summary

在主线技能构建中由扫描器接收 Vite 当次 `mode` 并统一选择集合与技能，把同一份经核验的候选交给版本表准备、发布与回读。release 先通过三组测试门禁和实际测试桶对象回读，再接入面向选定提交的手动生产发布。公开下载根补齐后独立验收测试桶安装。安装新版本时先核对归档 SHA-256、字节长度与包内 VERSION 时间戳，再写入项目。 [构建与发布契约](contracts/build-and-publish.md) · [安装契约](contracts/install.md)

集合环境使用 Vite 当次 `mode`，支持 `development`、`release`、`production`。插件从构建环境取得 mode 交给扫描函数，不由 `vite.config.ts` 传参，也不另设环境变量。技能包保留单一 `build`，不传 `--mode` 时使用默认 `production`；需要显式选择时传 `--mode`。当前配置在三种模式均启用 `profile`，不代表正式生产候选纳入该集合。工作流按发布阶段接入；临时脚本 `scripts/dev/mount-speckit.sh` 不纳入本期开发或验收。

按两份原始需求为每个功能点设置一个里程碑。先记录手写风格和插件评审基线，旧脚本调用可独立核查。环境选择、版本准备与安装器逐步接上隔离发布链，真实门禁通过后才进行测试桶部署与同次回读。同目标从读表到写回和回读串行，部署失败终止并记录现场。门禁和实际测试桶回读通过后接入生产，测试桶公网下载安装随真实地址具备单独验收。闭环详情见 [mvu.md](mvu.md)。

先完成环境产物验收，以及版本插件和安装入口生成的专项改动，再在接入发布工作流前集中评审构建代码，避免评审即将改动的实现。发布平台的前置核查仍可独立推进。评审以开始前的最新代码为输入，固定并记录实际快照，另行标明纳入的相关未提交改动，不把 `HEAD` 当作这些改动的来源。旧评审记录保留作对照，确认最新代码中的问题后才进入优化。

## Technical Context

| 项目       | 计划采用                                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 语言与版本 | 严格 TypeScript 6、ESM、Bash 与 Node.js。使用仓库 mise 工具链、pnpm 12 和锁定的 Vite 8.3.8。                                                  |
| 主要依赖   | 已有 Vite/Rolldown、Node 内建 crypto、Bash/curl/tar/jq/uv、GitHub Actions artifacts、AWS CLI v2 的 S3 API。干净工作区先构建技能包的预设依赖。 |
| 存储       | release 与 production 各一 R2 桶，沿用共用凭据配置。桶根是安装入口和有序版本表，归档是独立的固定键。CI 制品传递同次候选和读表快照。           |
| 测试       | 以真实 Vite 产物、实际安装器和隔离对象存储边界执行三组 Node 门禁。既有 Node、Python 回归与真实 S3、公网安装分别记录。                         |
| 目标平台   | CI 沿用 Ubuntu 24.04，主线验收在 Linux 的隔离 Codex 项目；技能包脚本用 Vite `--mode` 选择集合，本地 `build` 缺省为 production。                    |
| 项目类型   | 主线技能包构建、发布流水线和 Bash 安装入口。                                                                                                  |
| 性能与规模 | 每个 R2 目标同时只处理一个发布，平台队列及单次对象上传上限按调研取证。归档用流式摘要，历史有序保留。规格以正确性和可核验性为度量。            |
| 边界       | 临时版本逻辑放入独立目录，源码版本与发布时间戳各自保存。本期不含回退机制、紧急版及 MCP 清单改造。                                             |

## Constitution Check

| 宪章要求                     | Phase 0 前检查                                                     | Phase 1 后复核                                                                     |
| ---------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 职责、产物及范围（I、II、V） | 以现行规格和四项实际澄清为输入，目标为技能包 003 的规划产物。      | 方案、数据、契约、验收步骤与状态图按各自职责保存。                                 |
| 小闭环和技术前置（III）      | 列出 Vite 配置时序、跨 job 交接、R2 状态边界及下载校验等验证目标。 | 小闭环记录假设、输入、可观察信号、证据及依赖。尚需远端或实施的检查按实际状态登记。 |
| 最小充分验证（IV）           | 复用适用的现有测试，三组门禁针对同次候选和真实消费。               | 验收指南给出隔离构建与安装、失败注入、授权 S3 回读和公开验证步骤。                 |
| 生产顺序与授权（VI）         | release 实际环境证据先于生产接入，外部操作依目标授权。             | 公网安装证据有独立前置，现阶段保留待执行状态。                                     |
| 后续任务规划及清理（VII）    | 本阶段完成总体方案。                                               | 生成任务时复核分支、闭环及技术前置，使用唯一工程状态，并安排结案前的末尾清理。     |

## Project Structure

### Documentation (this feature)

研究和技术前置依据见 [research.md](research.md)。字段与状态见 [data-model.md](data-model.md)，主要流程见 [diagrams.md](diagrams.md)，可执行验收及前置见 [quickstart.md](quickstart.md)。

### Source Code (repository root)

```text
.github/workflows/
├── skills-test.yml
├── skills-deploy-release.yml
├── skills-deploy-common.yml
└── skills-deploy-prod.yml.example
packages/skills/
├── vite.config.ts
├── utils/
├── src/*/collection.config.ts
├── src/workflow/plugin/vite-plugin-speckit-mount/
├── build/                        # 构建插件与构建专用工具
├── script/                       # 含待核查旧脚本，计划新增 temporary-release/
├── tests/distribution/
├── deploy/Dockerfile
└── README.md
```

沿用现有入口及集合插件结构。扫描器接收同一 mode 并先解析集合启用状态，使用集合配置的有效 `enabled`，仅在扫描输入未提供该字段时兼容旧 `publish` 规则。工作流与直接调用 Vite 的脚本按发布阶段接入。生产入口在 release 门禁和测试桶实际回读通过后接入。

四类消费者的包内环境选择已通过隔离验证。T008 接下来确认自定义输出目录和两处挂载回归的修复方案，修复后复跑本地验收，再从包含被验改动的实际 Git 提交验收容器导出与归档。 [T008 续接复核](implementation/T008.md#续接复核与待确认的修复方案)

## Complexity Tracking

当前方案无须偏离宪章。首版并发队列、实际远端对象语义和测试公网根是实施与运行需分别取证的条件，使用现有工程流程记录结果。
