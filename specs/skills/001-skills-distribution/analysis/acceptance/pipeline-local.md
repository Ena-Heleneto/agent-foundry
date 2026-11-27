# 历史实验：已撤回的 T054 工程导出

日期：2026-11-10。对应 [T054](../../tasks.md#t054)、[ProjectBundle](../../data-model.md) 与[流水线契约](../../contracts/pipeline.md)。以下为撤回前实际发生的实验，保留原结果，不作为现行产品能力或下游前置。

## 2026-11-10 用户修正

用户明确“这个文件没有意义，因为后面我们会把 skill 和 MCP 等内容移动到一个公开仓库”。此前把一次性源码迁移实现为长期工程导出能力，超出了实际需要。现已移除 `build/ci/project.mjs`、只供该导出器使用的 `pipeline-contract.test.mjs` 及新增的 eslint 直接依赖；既有安装、构建、模型和消费者测试保留。

T054/T057 自动导出任务撤回，身份保留、不复用；当前有效任务为 52 项、11 完成、41 待办，下面的旧实验通过不计当前交付。用户直接迁移源码，新仓库自行维护依赖与配置；迁后独立工程检查由 T061 负责，不生成 ProjectBundle 或配置投影。

移除后实际重新运行包 lint、check-types、build、Python 测试（24/24），以及既有构建/模型消费者（43/43），均通过。日志为 `/tmp/foundry-remove-project-{lint,types,build,python,consumers}.log`。未重新运行已移除的导出器测试，也未运行候选或真实远端验收。

## 结果与来源

实际导出 43 个工程文件，包含 coding/frontend 的四项稳定技能：business-node-delivery、document-changed-symbols、nuxt-ui-styling、vue-reactivity。技能身份来自同一提交正文的 frontmatter，不固定旧技能数量。保留原模型测试和 sandbox；完整 workflow、其他分发测试迁移由 T057 接续。

| 身份或材料                 | 实际值                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- |
| 源码 SHA                   | `52eebe56dcd26a95888f863015ce7d91ab423b18`                                   |
| 来源树                     | `git-tree:11486a528144704fca8cdf7ab1a6277da29dc7c8`                          |
| 映射                       | `packages/skills/` → standalone 根包；另实测 standalone → standalone         |
| 项目摘要                   | `3521108e673b73e7a8e9637c54a8c4afc701b0c53be9604625e32535ed823d3d`           |
| 实际导出器摘要             | `e6b41f320056ab3856555f8a2fa8b79e2383d4d3f8e9467c15bdaeab22af5e62`           |
| 完整依赖锁摘要             | `cadacc20f09e5e20b30a485a65fecd09a0fa92bad23131ac7e06875996db55be`           |
| 源 ESLint 公开 export 摘要 | `7052dac08f82864fa1ce30e0392439edd756167f455cf2f6ec2436912e30e07f`           |
| 本地 ESLint 投影摘要       | `3a9fef2be64c3012a90847867864c94ff123259a712d2404a5dcda31b8bec5f3`           |
| 源 TS 公开 export 摘要     | `ab06d9f863bad58384ae7e4dbe25a4b6e9443f966e7319e3dec7c8e907a83b7a`           |
| 展开 TS 配置摘要           | `5225e1328718a3d28d905fc0cdde26f1011851a75dedc7c6698fee68fe73c678`           |
| 真实克隆的源码 SHA         | `bf5cf05104e6bd8f8a2fe41010dda125a6ff696a`；构建 release.json 实际报告此 SHA |

源文件逐字节取自 Git 对象，未将工作树改动冒认上述源码 SHA。当前新增导出器及其生成的配置/入口使用实际生成器摘要单独追溯；文件索引区分 git、projected、shared-export、generated。索引保存在工程之外，不进入发布文件表。空 `src/mcp` 通过被索引的 `.gitkeep` 保留，原构建规则排除此占位文件。

## 独立依赖和配置

工具实际版本：Node v24.22.2、pnpm 12.16.1；原包 Python 测试使用 Python 3.15.2。临时完整 lock 为 138787 字节，保留 pnpm 12 的两个 YAML document，没有重写或改变 Foundry 的锁文件跟踪策略。

| 显式公开依赖          | 实际版本 |
| --------------------- | -------- |
| @antfu/eslint-config  | 9.5.1    |
| @types/node           | 25.9.9   |
| @unocss/eslint-plugin | 66.12.0  |
| eslint                | 10.14.0  |
| eslint-plugin-format  | 2.0.1    |
| eslint-plugin-slop    | 0.1.3    |
| eslint-plugin-sonarjs | 4.2.2    |
| jiti                  | 2.7.0    |
| prettier              | 3.9.10   |
| typescript            | 6.0.3    |
| vite                  | 8.3.6    |
| yaml                  | 2.8.3    |

两份干净工程使用同一完整解析 lock 分别冻结安装；只复用公开包的内容缓存，各自 node_modules 的真实解析路径均在自身工程内，没有链接或复制作者的依赖树。安装使用 `--ignore-scripts`，随后显式执行检查和构建，没有真实用户初始化或挂载。

ESLint 对模型 TS、Node 入口、package.json、pnpm-workspace.yaml 分别执行 `--print-config`，TS 执行 `--showConfig`。源预设通过正常共享 exports 读取，在副本中展开，不更改共享包。TS compilerOptions 与 include 逐字段相等，保留 strict、noImplicitOverride、noUncheckedIndexedAccess 等全部原选项；最小测试范围引起的文件清单差异另由 testScope 明示。

唯一布局适用性差异是 `pnpm/json-enforce-catalog`：原 antfu 预设按是否存在 catalogs 自动启用该规则（已核对实际安装源码）；独立工程无 catalogs，规则自动不适用。比较先断言全部依赖均为完整版本且实际完整 lock 存在，再排除此专用规则；其余有效配置完整比较。没有手动关闭或降低规则。生成的最小 pnpm 设置与格式直接由原有效规则派生。

## 实际验证

命令中的 `pnpm` 均使用 `--config.verifyDepsBeforeRun=false`，避免仓库的依赖自动核验改变当前环境；未运行根级 pnpm test。

| 命令或范围                                                                                                                                              | 结果                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `node --test --test-isolation=none packages/skills/tests/distribution/pipeline-contract.test.mjs`                                                       | 9/9，0 fail、0 skip；约 122 秒                                     |
| 两个干净工程分别冻结安装、lint、check-types、build、test                                                                                                | 全通过；模型测试各 36/36，两个 dist 的 27 个文件路径及完整字节相等 |
| standalone 根包再次导出                                                                                                                                 | 通过，使用自身提交与本地严格配置                                   |
| 真实 Git clone 后冻结安装和 build                                                                                                                       | 通过；MCP 目录保留，源码身份使用克隆自身 HEAD                      |
| 不同来源工程的预设 export、脏配置、缺依赖                                                                                                               | 指定工程的实际 export 摘要命中；脏配置在执行前拒绝；缺依赖零输出   |
| 错误 SHA、来源内输出、非空目录、祖先链接、未声明 catalog/workspace                                                                                      | 全部在写出前拒绝，原哨兵字节不变                                   |
| `pnpm --filter @foundry/skills run lint`                                                                                                                | 通过                                                               |
| `pnpm --filter @foundry/skills run check-types`                                                                                                         | 通过                                                               |
| `pnpm --filter @foundry/skills run build`                                                                                                               | 通过                                                               |
| `pnpm --filter @foundry/skills run test`                                                                                                                | Python 24/24，通过                                                 |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/distribution/release-models.test.mjs` | 留在 Foundry 的构建/模型消费者 43/43，通过                         |

原构建/消费者命令曾受普通沙箱 Node 子进程 Git 的 EPERM 影响，已通过工具审批在相同目录重跑成功，不以该失败作为能力缺失或 skip。索引中的 unresolved/comparison 初始为 not-run，仅在实际消费者及配置比较成功后补入 success、完整锁摘要和工具版本。

## 审查与保留证据

按 executing-plans/requesting-code-review 完成一次独立只读审查，0 Critical、2 Important、1 Minor。真实回归先复现：Git 丢弃空 MCP 目录、另一来源误用作者 ESLint export、脏配置抛出 DIRTY_CONFIG_EXECUTED。随后分别修复可跟踪占位、请求工程 ESM 解析及提交字节核对；同时补齐 T054 明确要求的逐文件来源。增加迁后自身 SHA 检查，防止保留旧导出身份。完整回归最终 9/9，没有遗留上述问题。

原始日志与工程在本机自有隔离目录 `/tmp/foundry-distribution-3ml1nc`，含 `project-index-0.json`、`project-index-1.json`、`dependency-snapshot.yaml`、source/project 的有效配置日志及各实际命令日志。两个项目索引完整相等。该目录属可重建临时证据，不是迁移目的地或真实公开来源。

汇总日志：`/tmp/foundry-t054-contract.log`、`/tmp/foundry-t054-review-red.log`、`/tmp/foundry-t054-review-unit.log`、`/tmp/foundry-t054-{lint,types,build,python,consumers}.log`。完整运行的复用参数为 `FOUNDRY_PIPELINE_KEEP_TEST_OUTPUT=1`、`FOUNDRY_PIPELINE_STORE=/tmp/foundry-distribution-lZjyF7/store`、`FOUNDRY_PIPELINE_LOCKFILE=/tmp/foundry-distribution-gvM1Vz/project/pnpm-lock.yaml`；不传后两项时测试自行解析公开依赖并生成同轮两目录共用的完整 lock。

## 当前继续条件

原实验结果只说明当时的导出实现可工作；它未解决用户需要的 skill/MCP 源码直接迁移，现已撤回。T055 可从原构建基线开始候选校验，实施前先讨论该 Task 的具体思路；T056/T058/T059 等候选、授权与流水线任务继续待办，迁后 T061/T062 另按实际条件执行。T012/T013 的完整来源前置不受此次删除影响。

本轮没有迁移用户项目、发布、执行 Windows/macOS 或真实 Actions；历史 development 构建不是 ready 候选，不能抵扣整体结案。
