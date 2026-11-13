# T089：本地验收与四处交接（原暂停结果保留）

## 当前公开准备已交回（2026-11-12）

辅线三个子代理已完成本地独立准备，报告分别为[公开内容及逐项处置](urgent-public-content.md)、[新根依赖与配置草案](urgent-migration-runtime.md)、[ISC与第三方来源通知](urgent-public-license.md)。主线仍由用户手写，AI只提供讨论及临时示例，未代写原collections.ts。

公开审阅副本位于/tmp/urgent-public-content-jwl57mb0/public-candidate-v2，对应432项捕获输入、441个副本文件；14顶层及1嵌套归档共12,457原成员逐项处理，正式src及附件37文件原字节保持。许可处理区分4,277个完整上游成员与201个含片段的成员，随适用容器保留MIT及真实出处，不将整个归档重新归为ISC。协调者已实际重跑440条副本checksum退出0，并复核96个受保护紧急源码/原归档SHA均不变；472个章节锚点及派生Markdown结果按已保存检查引用，不冒认重跑产品测试。

新根草案位于/tmp/urgent-public-runtime-wygmrwec/draft-root；既有离线比较覆盖57个配置块及572项规则配置、严格TS和消费方append接口，但没有安装新根依赖，不能记作新仓库检查通过。开发工具元数据与实际许可正文冲突按原报告保留，不擅自换依赖或关规则。旧7e79b524候选及133项验证仍为原身份下的历史事实。

用户尚未建仓，当前只交付可审阅准备；T090～T093仍未执行，未搬原目录、推送、发布或部署。当前主线代码与文档继续变化时，迁移前复用处置规则刷新公开副本，不假设后台同步。本轮后续汇总记录也属于新的源变化，不能静默并入已冻结的准备摘要。按用户安排，当前仓库工作完成后再提醒新建仓库，不在本轮代建或要求重复继续确认。

## 当前修订：取消中间暂停（2026-11-12）

依据[用户本轮豁免](../../requirements/raw/2026-11-12-urgent-continuous-exemption.md)，紧急版取消中间阶段、逐Task方案重复确认及T089完成后的固定暂停，已有授权和真实前置满足时连续推进，无需迁后另发“明确继续”。必要材料读取、方案保存、实际验证、用户文件保护及公开前检查保持；迁仓、建仓、推送、发布和部署仍核对适用明确授权，有效授权不重复询问。

下方“暂停”“等待明确继续”及urgent-local.json的success-then-paused/pausedAt仅保留此前真实发生的结果与当时要求，不再构成现行门禁。本次只修订文档，T090～T093尚未执行，133项历史测试及候选身份保持，不据本次修订宣称已迁仓或发布。

日期：2026-11-12。**本地全部必需验证已完成，按T089暂停；未迁仓、推送或公开发布。** 依据[原Task](../../tasks.md#t089)、[准备方案](../../implementation/T089.md)、[紧急契约第6节](../../contracts/urgent-release.md)和[指南](../../quickstart.md)。准备阶段仅只读四处来源并保存清点；协调者随后完善README、冻结实际输入并完成最终复验，当前结论以下方实证为准。清点本身未搬仓、改主线或公开写入。

主线packages/skills继续由用户手写，紧急版独立推进。最初准备记录仅具47397b7的双构建及T082局部结果，当时“本地全部验收未完成”的结论保留其历史语境；最终已在下列7e79b524真实输入完整复验，不把旧输入成功换标签。之后任何候选、说明、源码身份或依赖变化都须重新绑定验证。

## 最终本地结果与暂停点

本轮最终源码为7e79b524b85fdfb5678acbe54ebfb41ec94bec1f，版本0.1.0，包位置packages/skills-distribution-urgent。inputDigest为19a0feb4e629325bf03826cd956f40b6dc3dbd87978aff722648e608c0219edd，dependencySnapshotDigest为0fc4b941a94f9d80f37b7d3650780cf56ca988d1a0cc737bbcf59ed2d8a1d2cc；严格候选catalogDigest为5305dfcc5d799f52b920829d71498cb8c27329ba35cd1bfcbc5dab7ac4a8c70c，candidateDigest为498f5e8984061c21344ed3c4566ceb5dea1ce0e1301f0fb01342e396b8bdc8e6。一次运行的机器可读实证见[urgent-local.json](urgent-local.json)。

| 必需本地验证                | 最终实际结果                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 当前包lint、严格check-types | 均退出0，无类型shim、框架覆写或关闭共享规则。                                                                                               |
| 真实工作区构建、同源双构建  | 均退出0；36文件全集/bytes/SHA-256完全一致，tests后候选原字节仍一致。                                                                        |
| 完整同输入测试              | 133/133通过，0失败/取消/跳过/todo，426396.791543毫秒；命令为带已备CLI、当前候选及自有host context的本包pnpm run test，不存在根级pnpm test。 |
| 官方内容与正常两步          | skills本次1.8.1及SRI实测；正式发现9项/eval0，9项/12正文附件54,315字节精确一致；正常唯一第二步连续两次真实成功。                             |
| hooks、Increment及保护恢复  | 三hooks真实注册/派发、旧三/四/五模式及六旧hooks迁移、重复、未知/修改内容保护和hook故障零下游均有实证。                                      |
| 真实Codex宿主               | 四探针实际退出0；12文件完整读取与真实分析，缺认可/未结案正确停止，Increment经正式入口消费源技能只规划一次，原Task状态和业务哨兵保持。       |
| 内部发布工具                | 仅自有bare Git验证精确无父树、白名单、授权、复用/冲突/并发/断连；未连接真实发布目标。                                                       |

实际证据分别见[来源](urgent-source.md)、[构建](urgent-build.md)、[官方内容](urgent-content.md)、[运行时](urgent-runtime.md)、[hooks](urgent-hooks.md)、[Increment注册](urgent-commands.md)、[正常两步与宿主](urgent-mount.md)、[发布工具](urgent-publish.md)。完整日志/tmp/foundry-urgent-final-all-tests.log，当前源/依赖/候选读盘证明/tmp/foundry-urgent-revised-source-proof.json，真实宿主上下文及原始轨迹位于/tmp/urgent-host-consumption-rogydhlh。工具/日志路径仅为本仓库私有验收依据，公开迁移时仍须按下方规则核对，不复制认证或画像。

本包实际ISC正文及Ena-Heleneto署名已核对。当前36文件payload没有打入官方CLI、Node/Python第三方依赖包或作者node_modules；构建及消费工具由各自来源提供，适用许可继续保留。下方对主线/MCP及其他第三方来源的公开前复核项仍有效，不能将紧急包的ISC文本自动扩展为所有迁移材料已获重新许可。

强制发现条款本轮已落实为先读取主线与紧急版材料、保留各自分工和局部暂停边界；这不表示133项工具链测试穷举了所有未来会话、单线指定或缺材料变体，更不宣称存在程序级锁。后续真实续接仍必须执行该条款，未发生的行为不补造通过，整体SC-019继续按原条件判断。

**现在暂停。** T090～T093的迁后候选、具体授权发布、匿名远端文件和公开来源消费全部not-run，原因是用户尚未实际迁仓并明确启动后续阶段；本地全部成功不满足最终公开SC-019。不会自动迁移四目录、建仓、推送、发布、部署MCP或推进主线手写Task。

下方为准备阶段的四处来源与公开前清点快照，列出的70普通文件/190压缩成员是待复核候选，不是已判私密或已清理；本期后续新增的验收记录和轨迹引用也须在实际公开前复核。清点资料保留原私有历史，不以改引用为由搬出画像，迁后新根能独立运行仍未验。

## 四处来源与未随迁的依赖

下表文件统计是本次扫描快照，不是交付白名单。已排除`node_modules`、`dist`、`.git`、`.venv`、`__pycache__`、`.pytest_cache`等依赖/生成目录；真实迁移仍应按获准源码清单进行，不直接整目录复制这些生成物。清点报告自身随后写入，其他协作文件也可能继续更新，公开前须复核最终字节。

| 来源                                  | 扫描普通文件数 | 当前职责与迁后边界                                                                                 |
| ------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `packages/skills-distribution-urgent` | 56             | Linux/Codex项目级紧急版源码、真实ISC和测试；dist只表示本次获验候选，不自动成为迁后新身份。         |
| `packages/skills`                     | 83             | 主线技能源、构建和测试，含eval；保持用户手写成果，不据紧急版成功标主线全部通过。                   |
| `specs/skills`                        | 266            | 需求/方案/任务/原话/验收及历史存档；含公开前必须处理的私有引用候选，不能未经筛选原样公开。         |
| `apps/mcp`                            | 9              | Python/FastMCP源码、测试、pyproject及uv.lock；旧manifest生产者缺口与线上部署均未在本轮修复或验收。 |

两包package均声明@foundry/preset-config=workspace:*，工具版本经catalog管理。实际消费路径为packages/skills/{eslint.config.ts,tsconfig.json}与packages/skills-distribution-urgent/{eslint.config.mjs,tsconfig.json}，经@foundry/preset-config/eslint-config及tsconfig-json/tsconfig.json公开exports解析。该预设位于四处清单之外的packages/preset-config，不能假设随迁。

| 四处范围之外的实际输入                                          | 已确认使用处                                                                                            | 迁后处理条件                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 根pnpm-workspace.yaml的packages/catalogs及根package.json        | 两包catalog/workspace依赖、根脚本和包管理器约束；紧急构建source输入闭包也实际核对它们                   | 新根须维护真实workspace/工具版本及等价严格检查；必要时用等价本地配置替换预设消费，不暗中追加搬运整个preset。 |
| packages/preset-config的源码、构建配置、公开exports与已生成dist | 两包ESLint/TS，紧急source将源码与生成依赖分开留证                                                       | 未迁移时现有exports会缺失；先维护新根等价预设/依赖，重新执行lint/typecheck/build，不以改检查配置或shim求绿。 |
| 根锁实际字节及实际工具解析图、mise.toml                         | 紧急构建记录根锁/真实依赖；mise在当前仓库选择Node/pnpm/Python/uv                                        | 不复制旧锁或作者node_modules冒认新仓库安装；目标根确定工具与真实依赖后冻结其新证据。                         |
| scripts/dev/postinstall、actions、nuxt-prepare                  | 根package.json安装/准备脚本；packages/skills/tests/test_full_remount.py读取register-hooks及nuxt-prepare | 不在新根保留指向未迁移路径的初始化命令；保留测试职责，为目标项目提供真实等价脚本或明确尚未适配。             |
| .specify/scripts、templates及有效治理/定位                      | packages/skills/tests/test_mvu_documents.py读取原生准备脚本、模板及overrides；相关文档/测试沿其定位     | 目标项目独立准备适用Spec Kit工具与等价测试材料；不复制整个原.specify，尤其不为补链接带出用户画像。           |
| 原.kimi-code/mcp.json、stacks/mcp-inspector等文档约定           | apps/mcp/README.md引用当前仓库挂载/部署布局                                                             | 它们不在四处范围内；迁后需核对实际存在位置并更新说明，源码同行不授权执行其部署命令。                         |

packages/skills/tests/distribution及其helpers还含固定官方工具输入、当前仓库相对定位和场景夹具。迁后应按实际调用关系保留等价验证，不删断言或用缺工具skip冒认全部通过。本轮没有运行主线全套、MCP测试或迁后工程检查，也没有改这些实现。

## MCP旧manifest缺口

实际读取apps/mcp/src/foundry_skills_mcp/registry.py和README：默认从packages/skills/dist/manifest.json加载，当前该文件不存在。读取的每项至少需要name、description、skill正文，以及references中的name/content；缺文件或结构不符会抛ManifestError。紧急dist/release.json虽然真实存在，skills项是name/category/directory/sourceFiles等分发字段，不提供该旧内嵌正文契约。

因此，保持四处相对布局只能保留寻找旧路径的可能性，不能补齐生产者或schema。FOUNDRY_SKILLS_MANIFEST只改变读取路径，不证明新Release兼容；不能将它改指紧急release后宣布MCP已可用。本轮不修主线manifest、不改MCP、不安装或部署服务。迁后该缺口仍须独立任务/明确范围及实际验证。

## ISC与第三方来源核对

- packages/skills-distribution-urgent/LICENSE具备完整ISC正文，署名为Copyright (c) 2026 Ena-Heleneto，与该包license=ISC一致；本轮只读原文，没有改署名或构造许可。
- packages/skills/package.json也声明ISC，但该包目录未见独立LICENSE/COPYING/NOTICE；apps/mcp/pyproject.toml本次未见license字段或包内独立许可正文。新开源仓库根尚未创建，根ISC及覆盖范围需要迁移时维护，不能将紧急包一份许可当全部历史内容/第三方材料均获授权的证明。
- 可见安装工具元数据中semver 7.8.6、yaml 2.8.3为ISC，Vite 8.3.6、ESLint 10.14.0及@types/node/@types/semver为MIT，TypeScript 6.0.3为Apache-2.0。此为已安装包自身元数据事实，不是本项目对第三方代码重新授权；当前技能payload没有node_modules，不将它们复制成新源码。
- 官方skills/Specify在实际消费时取得并由其官方机制运行。公开前还须逐项核对源码/附件/模板/归档是否包含第三方实质内容及需保留通知；本轮未建立完整作者/许可覆盖表，未知项列待核对。历史测试frontmatter中的MIT样例是测试数据，不能充当实际许可依据。

## 公开前候选清点方法与数量

本次对四处普通文件的Markdown、TS/JS、JSON、Python、TOML、YAML、shell、文本/锁等常见文本后缀做路径类别检索，不打印或复制命中正文。压缩存档逐成员只读检查相同文本类别，不解包到迁移目录；另核对成员路径无user-shadow目录、无链接成员。本次未发现.env命名文件，但这不等于所有形式凭据都已排除；未做秘密值内容导出，也不承诺这是完整泄露审计。

| 类别                                     | 普通文件命中数 | 压缩成员命中数 | 解释与处理条件                                                                                                          |
| ---------------------------------------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| user-shadow私有记录路径引用              | 32             | 46             | 逐项核对引用及实际内容；公开副本不得通过复制画像修复链接，原私有历史保留。                                              |
| 用户目录绝对路径                         | 42             | 158            | 核对是实际私有位置、运行日志还是例子；公开副本按事实改成可公开相对位置/参数说明或排除对应私有证据，不伪造原日志。       |
| 两类直接候选并集                         | 70             | 190            | 普通两类重叠4文件，压缩两类重叠14成员，不能相加当互不重叠数量；完整路径及类别列在下方。                                 |
| 画像相关文字，需要区分一般规则与私人资料 | 88             | 508            | 包括一般治理、禁止夹带或目标项目画像规则，命中不等于秘密。本轮未逐项判定全部正文可公开，按对应文件/压缩包清点继续核对。 |

直接候选全部位于specs/skills。额外“画像文字”命中包含两包task-increment/SKILL.md；已只读核对它们是沿目标项目现有治理参考资料、不规定跨仓库个人路径且不搬来源用户资料的一般规则，不能因该关键词擅自删除正式技能正文。普通画像文字单独命中且不在上述70直接候选的还有54文件，仍作为公开副本人工复核范围，未抄个人内容。

不能只排除顶层.specify：两份构建存档中的展开源码/测试和snapshot.tar.gz已有私有引用；specs内验收夹具还有13个压缩包，合计14包、12400个普通文件成员。以下压缩包均在源码迁移范围内，原件本轮未修改；快照解引用或重打包只能在后续获准的公开副本处理，保留原始私有证据与来源说明。

### 普通直接候选：70文件

以下路径以仓库根为基准，只列路径和类别，不摘录命中内容。

| 文件路径                                                                                                                               | 引用类别                       |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `specs/skills/001-skills-distribution/analysis/acceptance/build-rewrite.md`                                                            | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/content-export.md`                                                           | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/mvu-a.md`                                                                    | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/mvu-b.md`                                                                    | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/mvu-c.md`                                                                    | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/node-entry.md`                                                               | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/urgent-build.md`                                                             | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/urgent-commands.md`                                                          | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/urgent-contract-red.md`                                                      | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/urgent-hooks.md`                                                             | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/analysis/acceptance/urgent-source.md`                                                            | 私有记录引用、用户目录绝对路径 |
| `specs/skills/001-skills-distribution/analysis/history/task-details-before-constitution-7.md`                                          | 私有记录引用                   |
| `specs/skills/001-skills-distribution/archive/2026-11-10-build-pipeline-replan/retired-source/packages/skills/tests/test_artifacts.py` | 私有记录引用                   |
| `specs/skills/001-skills-distribution/implementation/T064.md`                                                                          | 私有记录引用                   |
| `specs/skills/001-skills-distribution/implementation/T087.md`                                                                          | 用户目录绝对路径               |
| `specs/skills/001-skills-distribution/implementation/T089.md`                                                                          | 私有记录引用                   |
| `specs/skills/001-skills-distribution/requirements/prompts/2026-11-10-implement-only-mount-revision.md`                                | 私有记录引用                   |
| `specs/skills/001-skills-distribution/requirements/raw/2026-11-11-urgent-release.md`                                                   | 私有记录引用                   |
| `specs/skills/001-skills-distribution/spec.md`                                                                                         | 私有记录引用                   |
| `specs/skills/001-skills-distribution/tasks.md`                                                                                        | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/collaboration-modes-delivery.md`                                | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/direct-engineering.md`                                          | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/implementation-preparation-baseline.json`              | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t062/results.json`                                     | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t063/results.json`                                     | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t064/results.json`                                     | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t066/results.json`                                     | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t095/results.json`                                     | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t096/results.json`                                     | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t104/results.json`                                     | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t106/results.json`                                     | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/trigger-discovery.json`                                | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/implementation-preparation-baseline.md`                         | 私有记录引用、用户目录绝对路径 |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/increment-description-engineering.md`                           | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/increment-task-order.md`                                        | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/managed-migration.md`                                           | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/mvu-b.md`                                                       | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/registration-validation.md`                                     | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/revision-baseline.md`                                           | 私有记录引用、用户目录绝对路径 |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/script-mount-mvu.md`                                            | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/skill-portability.md`                                           | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/task-decomposition.md`                                          | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/trigger-discovery.md`                                           | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/tv-02-planning.md`                                              | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/tv-06-description.md`                                           | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/us1-shared-foundation.md`                                       | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/user-shadow.md`                                                 | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/baseline-hashes.json`                                                      | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/issues/2026-11-11-collaboration-conversation.md`                           | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/spec-analysis/README.md`                                                   | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/checklists/requirements.md`                                                         | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/contracts/artifacts.md`                                                             | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/contracts/mvu.md`                                                                   | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/diagrams.md`                                                                        | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/implementation/T060.md`                                                             | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/implementation/T061.md`                                                             | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/mvu.md`                                                                             | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/plan.history.md`                                                                    | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/requirements/README.md`                                                             | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/requirements/discussions/2026-11-05-collaboration-modes.md`                         | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/requirements/discussions/2026-11-10-a-md-coverage.md`                               | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/requirements/discussions/2026-11-10-artifact-organization.md`                       | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/requirements/discussions/2026-11-10-logic-navigation.md`                            | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/requirements/discussions/2026-11-10-user-shadow-scope.md`                           | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/requirements/prompts/2026-11-05-workflow-revision.md`                               | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/requirements/prompts/2026-11-08-increment-planning-description.md`                  | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/requirements/prompts/2026-11-10-implement-first-revision.md`                        | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/research.md`                                                                        | 用户目录绝对路径               |
| `specs/skills/20261029-speckit-workflow-foundation/spec.md`                                                                            | 私有记录引用                   |
| `specs/skills/20261029-speckit-workflow-foundation/tasks.md`                                                                           | 私有记录引用、用户目录绝对路径 |

### 14个压缩包汇总

“画像文字”计数为需区分的一般文字候选，未当作已判私密；下节只逐项列两类直接候选成员。

| 压缩包路径                                                                                                    | 普通成员 | 私有记录引用 | 用户目录绝对路径 | 画像文字 |
| ------------------------------------------------------------------------------------------------------------- | -------- | ------------ | ---------------- | -------- |
| `specs/skills/001-skills-distribution/archive/2026-11-10-build-pipeline-replan/snapshot.tar.gz`               | 63       | 2            | 2                | 11       |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t062/retained.tar.gz`         | 254      | 5            | 14               | 21       |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t063/retained.tar.gz`         | 193      | 6            | 11               | 17       |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t064/retained.tar.gz`         | 445      | 11           | 22               | 49       |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t066/retained.tar.gz`         | 2948     | 0            | 0                | 80       |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t067/retained.tar.gz`         | 5642     | 0            | 1                | 138      |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t095/retained.tar.gz`         | 1006     | 10           | 19               | 119      |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t096/retained.tar.gz`         | 164      | 4            | 16               | 27       |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t104/retained.tar.gz`         | 84       | 0            | 6                | 2        |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t105/retained.tar.gz`         | 170      | 2            | 6                | 5        |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t106/retained.tar.gz`         | 239      | 6            | 16               | 23       |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/tv-10/retained-round2.tar.gz` | 75       | 0            | 4                | 1        |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/tv-10/retained-round3.tar.gz` | 383      | 0            | 17               | 5        |
| `specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/tv-10/retained.tar.gz`        | 734      | 0            | 24               | 10       |

### 压缩包内直接候选：190成员

成员路径相对各自压缩包根；压缩包与成员组合才是唯一位置，不混淆不同夹具中的同名文件。

#### specs/skills/001-skills-distribution/archive/2026-11-10-build-pipeline-replan/snapshot.tar.gz（4成员）

| 成员路径                                                                     | 引用类别         |
| ---------------------------------------------------------------------------- | ---------------- |
| `packages/skills/tests/test_artifacts.py`                                    | 私有记录引用     |
| `specs/skills/001-skills-distribution/analysis/acceptance/content-export.md` | 用户目录绝对路径 |
| `specs/skills/001-skills-distribution/spec.md`                               | 私有记录引用     |
| `specs/skills/001-skills-distribution/tasks.md`                              | 用户目录绝对路径 |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t062/retained.tar.gz（17成员）

| 成员路径                                                                                   | 引用类别                       |
| ------------------------------------------------------------------------------------------ | ------------------------------ |
| `retained/before/projects/baseline/skills-lock.json`                                       | 用户目录绝对路径               |
| `retained/before/projects/flow/skills-lock.json`                                           | 用户目录绝对路径               |
| `retained/before/specs/skills/20261029-speckit-workflow-foundation/mvu.md`                 | 私有记录引用                   |
| `retained/before/specs/skills/20261029-speckit-workflow-foundation/requirements/README.md` | 私有记录引用                   |
| `retained/before/specs/skills/20261029-speckit-workflow-foundation/spec.md`                | 私有记录引用                   |
| `retained/before/specs/skills/20261029-speckit-workflow-foundation/tasks.md`               | 私有记录引用、用户目录绝对路径 |
| `retained/cases/baseline/skills-lock.json`                                                 | 用户目录绝对路径               |
| `retained/cases/flow/skills-lock.json`                                                     | 用户目录绝对路径               |
| `retained/install_flow.py`                                                                 | 用户目录绝对路径               |
| `retained/installations/baseline/increment-proof.json`                                     | 用户目录绝对路径               |
| `retained/installations/flow/candidate-proof.json`                                         | 用户目录绝对路径               |
| `retained/installations/flow/increment-proof.json`                                         | 用户目录绝对路径               |
| `retained/meta.json`                                                                       | 用户目录绝对路径               |
| `retained/package-checks.json`                                                             | 用户目录绝对路径               |
| `retained/retain.py`                                                                       | 私有记录引用、用户目录绝对路径 |
| `retained/snapshots/created/skills-lock.json`                                              | 用户目录绝对路径               |
| `retained/snapshots/refreshed/skills-lock.json`                                            | 用户目录绝对路径               |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t063/retained.tar.gz（15成员）

| 成员路径                                                                                   | 引用类别                       |
| ------------------------------------------------------------------------------------------ | ------------------------------ |
| `retained/before-project/skills-lock.json`                                                 | 用户目录绝对路径               |
| `retained/before/specs/skills/20261029-speckit-workflow-foundation/contracts/artifacts.md` | 私有记录引用                   |
| `retained/before/specs/skills/20261029-speckit-workflow-foundation/mvu.md`                 | 私有记录引用                   |
| `retained/before/specs/skills/20261029-speckit-workflow-foundation/requirements/README.md` | 私有记录引用                   |
| `retained/before/specs/skills/20261029-speckit-workflow-foundation/spec.md`                | 私有记录引用                   |
| `retained/before/specs/skills/20261029-speckit-workflow-foundation/tasks.md`               | 私有记录引用、用户目录绝对路径 |
| `retained/cases/flow/skills-lock.json`                                                     | 用户目录绝对路径               |
| `retained/final-checks.json`                                                               | 用户目录绝对路径               |
| `retained/host-audit.json`                                                                 | 用户目录绝对路径               |
| `retained/installations/formal-proof.json`                                                 | 用户目录绝对路径               |
| `retained/meta.json`                                                                       | 用户目录绝对路径               |
| `retained/prepare.py`                                                                      | 用户目录绝对路径               |
| `retained/retain.py`                                                                       | 私有记录引用、用户目录绝对路径 |
| `retained/snapshots/after-tasks/skills-lock.json`                                          | 用户目录绝对路径               |
| `retained/snapshots/increment-first/skills-lock.json`                                      | 用户目录绝对路径               |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t064/retained.tar.gz（30成员）

| 成员路径                                                                                          | 引用类别                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------ |
| `retained/audit.json`                                                                             | 用户目录绝对路径               |
| `retained/audit.py`                                                                               | 用户目录绝对路径               |
| `retained/before-project/skills-lock.json`                                                        | 用户目录绝对路径               |
| `retained/cases/failure/skills-lock.json`                                                         | 用户目录绝对路径               |
| `retained/cases/flow/skills-lock.json`                                                            | 用户目录绝对路径               |
| `retained/check-parent.py`                                                                        | 用户目录绝对路径               |
| `retained/delta-proof.json`                                                                       | 用户目录绝对路径               |
| `retained/delta.py`                                                                               | 用户目录绝对路径               |
| `retained/installations/formal-proof.json`                                                        | 用户目录绝对路径               |
| `retained/installations/template-recovery.json`                                                   | 用户目录绝对路径               |
| `retained/parent-before/specs/skills/20261029-speckit-workflow-foundation/mvu.md`                 | 私有记录引用                   |
| `retained/parent-before/specs/skills/20261029-speckit-workflow-foundation/requirements/README.md` | 私有记录引用                   |
| `retained/parent-before/specs/skills/20261029-speckit-workflow-foundation/spec.md`                | 私有记录引用                   |
| `retained/parent-before/specs/skills/20261029-speckit-workflow-foundation/tasks.md`               | 私有记录引用、用户目录绝对路径 |
| `retained/parent-delivery/analysis/spec-analysis/README.md`                                       | 私有记录引用                   |
| `retained/parent-delivery/diagrams.md`                                                            | 私有记录引用                   |
| `retained/parent-delivery/mvu.md`                                                                 | 私有记录引用                   |
| `retained/parent-delivery/requirements/README.md`                                                 | 私有记录引用                   |
| `retained/parent-delivery/spec.md`                                                                | 私有记录引用                   |
| `retained/parent-delivery/tasks.md`                                                               | 私有记录引用、用户目录绝对路径 |
| `retained/prepare.py`                                                                             | 用户目录绝对路径               |
| `retained/retain.py`                                                                              | 私有记录引用、用户目录绝对路径 |
| `retained/run.py`                                                                                 | 用户目录绝对路径               |
| `retained/snapshots/before-failure-delta/skills-lock.json`                                        | 用户目录绝对路径               |
| `retained/snapshots/before-flow-delta/skills-lock.json`                                           | 用户目录绝对路径               |
| `retained/snapshots/changed/skills-lock.json`                                                     | 用户目录绝对路径               |
| `retained/snapshots/created/skills-lock.json`                                                     | 用户目录绝对路径               |
| `retained/snapshots/failed/skills-lock.json`                                                      | 用户目录绝对路径               |
| `retained/snapshots/final/skills-lock.json`                                                       | 用户目录绝对路径               |
| `retained/snapshots/recovered/skills-lock.json`                                                   | 用户目录绝对路径               |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t067/retained.tar.gz（1成员）

| 成员路径          | 引用类别         |
| ----------------- | ---------------- |
| `yq-release.json` | 用户目录绝对路径 |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t095/retained.tar.gz（26成员）

| 成员路径                                                                                          | 引用类别                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------ |
| `retained/audit.py`                                                                               | 用户目录绝对路径               |
| `retained/check-parent.py`                                                                        | 用户目录绝对路径               |
| `retained/official-cases-before-link-fix/global/calls.json`                                       | 用户目录绝对路径               |
| `retained/official-cases-before-link-fix/linked-root/calls.json`                                  | 用户目录绝对路径               |
| `retained/official-cases-before-link-fix/project/calls.json`                                      | 用户目录绝对路径               |
| `retained/official-cases-before-link-fix/references-bridged/calls.json`                           | 用户目录绝对路径               |
| `retained/official-cases-before-link-fix/references-control/calls.json`                           | 用户目录绝对路径               |
| `retained/official-cases-final-code/global/calls.json`                                            | 用户目录绝对路径               |
| `retained/official-cases-final-code/project/calls.json`                                           | 用户目录绝对路径               |
| `retained/official-cases-final-code/references-bridged/calls.json`                                | 用户目录绝对路径               |
| `retained/official-cases-final-code/references-control/calls.json`                                | 用户目录绝对路径               |
| `retained/official-cases/global/calls.json`                                                       | 用户目录绝对路径               |
| `retained/official-cases/project/calls.json`                                                      | 用户目录绝对路径               |
| `retained/official-cases/references-bridged/calls.json`                                           | 用户目录绝对路径               |
| `retained/official-cases/references-control/calls.json`                                           | 用户目录绝对路径               |
| `retained/parent-before/specs/skills/20261029-speckit-workflow-foundation/mvu.md`                 | 私有记录引用                   |
| `retained/parent-before/specs/skills/20261029-speckit-workflow-foundation/requirements/README.md` | 私有记录引用                   |
| `retained/parent-before/specs/skills/20261029-speckit-workflow-foundation/spec.md`                | 私有记录引用                   |
| `retained/parent-before/specs/skills/20261029-speckit-workflow-foundation/tasks.md`               | 私有记录引用、用户目录绝对路径 |
| `retained/parent-delivery/analysis/spec-analysis/README.md`                                       | 私有记录引用                   |
| `retained/parent-delivery/mvu.md`                                                                 | 私有记录引用                   |
| `retained/parent-delivery/requirements/README.md`                                                 | 私有记录引用                   |
| `retained/parent-delivery/spec.md`                                                                | 私有记录引用                   |
| `retained/parent-delivery/tasks.md`                                                               | 私有记录引用、用户目录绝对路径 |
| `retained/retain.py`                                                                              | 私有记录引用、用户目录绝对路径 |
| `retained/versions.json`                                                                          | 用户目录绝对路径               |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t096/retained.tar.gz（19成员）

| 成员路径                                                                               | 引用类别                       |
| -------------------------------------------------------------------------------------- | ------------------------------ |
| `t096/after/projects/existing/skills-lock.json`                                        | 用户目录绝对路径               |
| `t096/after/projects/no-plan/skills-lock.json`                                         | 用户目录绝对路径               |
| `t096/after/projects/plan-only/skills-lock.json`                                       | 用户目录绝对路径               |
| `t096/after/projects/save-failure/skills-lock.json`                                    | 用户目录绝对路径               |
| `t096/before/projects/existing/skills-lock.json`                                       | 用户目录绝对路径               |
| `t096/before/projects/no-plan/skills-lock.json`                                        | 用户目录绝对路径               |
| `t096/before/projects/plan-only/skills-lock.json`                                      | 用户目录绝对路径               |
| `t096/before/projects/save-failure/skills-lock.json`                                   | 用户目录绝对路径               |
| `t096/before/specs/skills/20261029-speckit-workflow-foundation/mvu.md`                 | 私有记录引用                   |
| `t096/before/specs/skills/20261029-speckit-workflow-foundation/requirements/README.md` | 私有记录引用                   |
| `t096/before/specs/skills/20261029-speckit-workflow-foundation/spec.md`                | 私有记录引用                   |
| `t096/before/specs/skills/20261029-speckit-workflow-foundation/tasks.md`               | 私有记录引用、用户目录绝对路径 |
| `t096/host-audit.json`                                                                 | 用户目录绝对路径               |
| `t096/installations/existing/proof.json`                                               | 用户目录绝对路径               |
| `t096/installations/no-plan/proof.json`                                                | 用户目录绝对路径               |
| `t096/installations/plan-only/proof.json`                                              | 用户目录绝对路径               |
| `t096/installations/save-failure/proof.json`                                           | 用户目录绝对路径               |
| `t096/prepare_cases.py`                                                                | 用户目录绝对路径               |
| `t096/retain_evidence.py`                                                              | 用户目录绝对路径               |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t104/retained.tar.gz（6成员）

| 成员路径                                                                  | 引用类别         |
| ------------------------------------------------------------------------- | ---------------- |
| `t104/install_final_source.py`                                            | 用户目录绝对路径 |
| `t104/projects/explicit-no-plan/skills-lock.json`                         | 用户目录绝对路径 |
| `t104/projects/positive-a/skills-lock.json`                               | 用户目录绝对路径 |
| `t104/raw/installations/explicit-no-plan-final-source-install/proof.json` | 用户目录绝对路径 |
| `t104/raw/installations/positive-a-final-source-install/proof.json`       | 用户目录绝对路径 |
| `t104/source-green.json`                                                  | 用户目录绝对路径 |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t105/retained.tar.gz（7成员）

| 成员路径                                                                 | 引用类别                       |
| ------------------------------------------------------------------------ | ------------------------------ |
| `t105/audit_host.py`                                                     | 用户目录绝对路径               |
| `t105/before/specs/skills/20261029-speckit-workflow-foundation/mvu.md`   | 私有记录引用                   |
| `t105/before/specs/skills/20261029-speckit-workflow-foundation/tasks.md` | 私有记录引用、用户目录绝对路径 |
| `t105/project-after/skills-lock.json`                                    | 用户目录绝对路径               |
| `t105/project-before/skills-lock.json`                                   | 用户目录绝对路径               |
| `t105/retain_evidence.py`                                                | 用户目录绝对路径               |
| `t105/state.json`                                                        | 用户目录绝对路径               |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/t106/retained.tar.gz（20成员）

| 成员路径                                             | 引用类别                       |
| ---------------------------------------------------- | ------------------------------ |
| `t106/after-projects/increment/skills-lock.json`     | 用户目录绝对路径               |
| `t106/after-projects/prep-failure/skills-lock.json`  | 用户目录绝对路径               |
| `t106/after-projects/prep/skills-lock.json`          | 用户目录绝对路径               |
| `t106/before-feature/mvu.md`                         | 私有记录引用                   |
| `t106/before-feature/requirements/README.md`         | 私有记录引用                   |
| `t106/before-feature/spec.md`                        | 私有记录引用                   |
| `t106/before-feature/tasks.md`                       | 私有记录引用、用户目录绝对路径 |
| `t106/before-projects/increment/skills-lock.json`    | 用户目录绝对路径               |
| `t106/before-projects/prep-failure/skills-lock.json` | 用户目录绝对路径               |
| `t106/before-projects/prep/skills-lock.json`         | 用户目录绝对路径               |
| `t106/check_package.py`                              | 用户目录绝对路径               |
| `t106/check_root.py`                                 | 私有记录引用                   |
| `t106/installations/increment/proof.json`            | 用户目录绝对路径               |
| `t106/installations/prep-failure/proof.json`         | 用户目录绝对路径               |
| `t106/installations/prep/proof.json`                 | 用户目录绝对路径               |
| `t106/package-checks.json`                           | 用户目录绝对路径               |
| `t106/prepare.py`                                    | 用户目录绝对路径               |
| `t106/prepare_increment.py`                          | 用户目录绝对路径               |
| `t106/real-input.json`                               | 用户目录绝对路径               |
| `t106/retain.py`                                     | 私有记录引用、用户目录绝对路径 |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/tv-10/retained-round2.tar.gz（4成员）

| 成员路径                                              | 引用类别         |
| ----------------------------------------------------- | ---------------- |
| `cases/bounded-hook-failure/AGENTS.md`                | 用户目录绝对路径 |
| `cases/bounded-hook-failure/skills-lock.json`         | 用户目录绝对路径 |
| `raw/bounded-hook-failure-setup/installed-proof.json` | 用户目录绝对路径 |
| `round2/bounded_check.py`                             | 用户目录绝对路径 |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/tv-10/retained-round3.tar.gz（17成员）

| 成员路径                                             | 引用类别         |
| ---------------------------------------------------- | ---------------- |
| `raw/r3-shared-contract-setup/installed-proof.json`  | 用户目录绝对路径 |
| `raw/r3-skill-missing-setup/installed-proof.json`    | 用户目录绝对路径 |
| `raw/r3-skill-outdated-setup/installed-proof.json`   | 用户目录绝对路径 |
| `raw/r3-skill-unreadable-setup/installed-proof.json` | 用户目录绝对路径 |
| `raw/r3-yaml-broken-setup/installed-proof.json`      | 用户目录绝对路径 |
| `round3/audit.py`                                    | 用户目录绝对路径 |
| `round3/cases/shared-contract/AGENTS.md`             | 用户目录绝对路径 |
| `round3/cases/shared-contract/skills-lock.json`      | 用户目录绝对路径 |
| `round3/cases/skill-missing/AGENTS.md`               | 用户目录绝对路径 |
| `round3/cases/skill-missing/skills-lock.json`        | 用户目录绝对路径 |
| `round3/cases/skill-outdated/AGENTS.md`              | 用户目录绝对路径 |
| `round3/cases/skill-unreadable/AGENTS.md`            | 用户目录绝对路径 |
| `round3/cases/skill-unreadable/skills-lock.json`     | 用户目录绝对路径 |
| `round3/cases/yaml-broken/AGENTS.md`                 | 用户目录绝对路径 |
| `round3/cases/yaml-broken/skills-lock.json`          | 用户目录绝对路径 |
| `round3/collect_native.py`                           | 用户目录绝对路径 |
| `round3/harness.py`                                  | 用户目录绝对路径 |

#### specs/skills/20261029-speckit-workflow-foundation/analysis/acceptance/fixtures/tv-10/retained.tar.gz（24成员）

| 成员路径                                                 | 引用类别         |
| -------------------------------------------------------- | ---------------- |
| `cases/condition-false/skills-lock.json`                 | 用户目录绝对路径 |
| `cases/condition-illegal/skills-lock.json`               | 用户目录绝对路径 |
| `cases/condition-true/skills-lock.json`                  | 用户目录绝对路径 |
| `cases/configuration-broken/skills-lock.json`            | 用户目录绝对路径 |
| `cases/configuration-missing/skills-lock.json`           | 用户目录绝对路径 |
| `cases/discussion-only/skills-lock.json`                 | 用户目录绝对路径 |
| `cases/explicit-no-plan/skills-lock.json`                | 用户目录绝对路径 |
| `cases/hook-disabled/skills-lock.json`                   | 用户目录绝对路径 |
| `cases/natural-no-plan/skills-lock.json`                 | 用户目录绝对路径 |
| `cases/no-constitution-no-hook/skills-lock.json`         | 用户目录绝对路径 |
| `cases/positive-a/skills-lock.json`                      | 用户目录绝对路径 |
| `install_case.py`                                        | 用户目录绝对路径 |
| `prepare_case.py`                                        | 用户目录绝对路径 |
| `raw/condition-false-setup/installed-proof.json`         | 用户目录绝对路径 |
| `raw/condition-illegal-setup/installed-proof.json`       | 用户目录绝对路径 |
| `raw/condition-true-setup/installed-proof.json`          | 用户目录绝对路径 |
| `raw/configuration-broken-setup/installed-proof.json`    | 用户目录绝对路径 |
| `raw/configuration-missing-setup/installed-proof.json`   | 用户目录绝对路径 |
| `raw/discussion-only-setup/installed-proof.json`         | 用户目录绝对路径 |
| `raw/explicit-no-plan-setup/installed-proof.json`        | 用户目录绝对路径 |
| `raw/hook-disabled-setup/installed-proof.json`           | 用户目录绝对路径 |
| `raw/natural-no-plan-setup/installed-proof.json`         | 用户目录绝对路径 |
| `raw/no-constitution-no-hook-setup/installed-proof.json` | 用户目录绝对路径 |
| `raw/positive-a-setup/installed-proof.json`              | 用户目录绝对路径 |

## eval与实际迁移准入

主线src/eval/collection.config.json含eval-short-rule、eval-with-reference、eval-workflow-guide和mcp-build-smoke及附件；按已确认B可随源码迁移，用于评估与复现。它们不是正式技能发布范围。当前紧急候选只含coding/frontend/workflow的9项，T082实际官方发现及显式eval拒绝已有范围证据，最终候选改变后仍须复验正式payload/list/install的eval为0。不把含eval的源码根建议成整包安装来源。

公开前处置应针对目标公开副本逐项确定：一般可公开规则可保留；私有画像/对话或不可公开引用从公开范围剔除或用真实可公开说明替换；绝对路径按原证据事实处理，不把改写后的公开说明冒充原始日志。压缩包若需公开，须对实际成员做同样审阅并生成可公开副本，不删除或覆盖本仓库原始档案。未知授权或用途的内容保留原件，列待核对，不以清理为由擅删或扩大迁移。

本轮仅完成上述只读准备清点，未逐项处理70普通文件/190成员，未完成第三方许可覆盖核验，未创建新仓库，未验证四处源码在新根可独立运行。T089仍须在完整前置及最终说明同一真实输入上汇总全部必需检查、双构建、真实两步/宿主及保护恢复结果；缺证据时不能记本地全部完成。全部本地成功后按原要求暂停，后续T090/迁仓/公开写入仍需用户实际迁移及明确继续。
