# 紧急版公开来源、许可与固定版本发布前置核查

## 当前结论与边界

2026-11-12 按[当前规格](../../spec.md)顶部连续推进豁免、FR-061/065、[T090～T093](../../tasks.md)及[原交接](urgent-handoff.md)进行本地只读核查。主线由用户操作；没有改动四处原源、历史归档、已冻结候选、任务 checkbox，也没有建仓、迁移、推送或发布。用户已选择自有材料使用 ISC，新仓库尚未建立，完成当前仓库准备后由协调者提醒用户创建；不因缺少目标仓库而停止许可及来源准备。

已落成真实 ISC 根许可副本、第三方通知草案及逐归档成员适用映射。实际缺口是历史验收归档内包含 GitHub Spec Kit 的脚本、模板、指令和工作流，却未随归档保存其许可正文；紧急包自身 ISC 和任何测试样例或依赖元数据中的 MIT 字段均不能替代 GitHub 的 MIT 通知。本报告不把“未发现其他来源声明”解释为已证明全部材料为自有，也不把准备副本记为迁后或发布验收完成。

最终通知仍须与公开内容副本实际保留成员相交。当前清单只对应本轮读取的原始字节，不提前声明尚未形成的新仓库全部许可检查通过。开发工具元数据与源码副本许可分开记录。

## 四处来源覆盖表

扫描普通文件时排除 `node_modules`、`dist`、Git、Python 缓存/虚拟环境和构建缓存；包含未提交的当前工作区材料。读取快照为 428 个文件：紧急包 60、主线包 72、Specs 287、MCP 9；其中 14 个 tar.gz 全部只读遍历，共 12400 个普通成员；递归检查另发现 1 个嵌套 tar，含 57 个普通成员，无更深层压缩包。用户并发新增、修改、删除仍由主线保留，迁移前须按最终输入再核清单。

| 来源                                  | 实际材料与出处                                                                                               | 已有许可/署名                                                                                        | 公开时的覆盖与所需处理                                                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/skills-distribution-urgent` | 独立紧急包源码、9 项正式技能及 3 份附件、脚本、测试；正式 `dist` 为既有本地冻结候选                          | 唯一实际发现的独立 LICENSE，743 字节，ISC，`Copyright (c) 2026 Ena-Heleneto`；package 元数据同为 ISC | 原字节复用 ISC 和署名。源码及 36 文件 payload 未发现随包复制的第三方依赖树或官方 CLI；此结论不覆盖 `specs/skills` 内归档。                                                                       |
| `packages/skills`                     | 主线技能、附件、安装/挂载脚本、构建和测试；当前用户已删的暂停技能不恢复。仍有 eval 与 smoke 样例来源         | package 元数据 `license=ISC`；包内未发现独立 LICENSE/COPYING/NOTICE                                  | 沿已选 ISC 为自有部分维护新仓库根许可范围；保留已知来源和第三方通知。eval 源码可迁入，但正式构建/list/install 排除规则继续生效，不能因许可可迁入就公开安装 eval。                                |
| `specs/skills`                        | 两个 Spec、需求/方案/验收材料、两轮旧构建归档及历史消费 fixture；保存的是当时工作区/官方安装后的实际字节     | 未发现独立 LICENSE/COPYING/NOTICE；14 个压缩归档内也均未发现此类许可成员                             | 自有正文与测试依已选 ISC；下面确认的上游副本保留 GitHub MIT 和出处，不把整份 Spec/归档重新标为 ISC。公开内容脱敏另见公开内容准备，不能用加许可代替隐私处理。                                     |
| `apps/mcp`                            | 自有 Python 服务/registry、测试、README、`pyproject.toml` 和 `uv.lock`；代码通过 API 导入 FastMCP、Starlette | `pyproject.toml` 未有 license 字段，目录内未发现许可正文或逐文件版权声明                             | 新根 ISC 可按已授权的自有范围落地；没有发现随这 9 个文件搬运 FastMCP/Starlette 源码或 site-packages。依赖声明与锁条目不等于本项目持有依赖的重新许可权。若未来分发依赖/镜像，另按真实边界核通知。 |

根工作区也未发现独立 LICENSE/COPYING/NOTICE。ISC 与 MIT 的原文均要求随适用副本保留版权及许可通知；[ISC 原文](https://spdx.org/licenses/ISC.html)和[MIT 原文](https://spdx.org/licenses/MIT.html)可核对这一保留要求。迁入后不能只有 package 的 `license` 字段而省略相应正文。

## 已确认的第三方材料

实际依据为固定 [Spec Kit v1.2.6 LICENSE](https://github.com/github/spec-kit/blob/v1.2.6/LICENSE)、其源包及本机已安装 Specify 1.2.6 的许可文件；后二者 LICENSE 完全同字节，1060 字节，SHA256 `2510b446bc1f0cf9702453075d20cd88631e20e5642658edb7325d9c1eb534f7`，真实署名为 `Copyright GitHub, Inc.`。本轮只读取公开固定来源，没有安装或运行上游代码。

| 实际复制/派生范围                                                                                                              | 识别依据                                                                                                                                 | 需保留的内容                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 历史项目 `.specify/scripts/bash/{create-new-feature,resolve-template,setup-plan}.sh`                                           | 与固定 v1.2.6 对应上游文件逐字节相同                                                                                                     | MIT 全文、GitHub 署名、固定上游版本及原路径。                                                                   |
| 同目录 `check-prerequisites.sh`、`common.sh`、`setup-tasks.sh`                                                                 | 对照全文差异仅为官方 Codex 指令形式渲染，例如通用命令格式改为 `$speckit-plan`；不是新的独立自有脚本                                      | 保留同一上游许可；说明为官方安装渲染版本。                                                                      |
| 历史项目 `.specify/templates/{constitution,spec}-template.md`                                                                  | 与上游模板逐字节相同                                                                                                                     | MIT、GitHub 署名与模板出处。                                                                                    |
| 同目录 `checklist-template.md`、`plan-template.md`、`tasks-template.md`                                                        | 官方命令占位符渲染后的模板，正文与固定上游逐段对照                                                                                       | 保留上游许可和渲染说明。                                                                                        |
| `.specify/templates/overrides/tasks-template.md` 的 11 个副本                                                                  | 两种字节版本（12074/10875 字节）均保留上游 Tasks 模板，附加自有中文治理段落并替换命令占位符；已核对全文差异                              | MIT 继续适用上游部分；自有增补另行说明，不能宣称 GitHub 创作这些增补，也不能仅因放入 overrides 就去掉上游通知。 |
| `.agents/skills/speckit-{analyze,checklist,clarify,constitution,converge,implement,plan,specify,tasks,taskstoissues}/SKILL.md` | 10 种官方生成正文，源 frontmatter 指向 `templates/commands/*.md`，并与对应固定模板正文比对；差异包括脚本/命令路径渲染                    | MIT、GitHub 署名、原 source 元数据及固定来源；自定义 modes 技能不单凭生成器写入的 author 字段就归给 GitHub。    |
| `.specify/workflows/speckit/workflow.yml`                                                                                      | 2118 字节，与固定上游 `workflows/speckit/workflow.yml` 同字节，SHA256 `177761c5e7df28126beea043b5cb45aeaf7958090c022dc11ac71399422fcfbc` | MIT、GitHub 署名及原作者/来源信息。                                                                             |

以上映射共 4255 个确认副本，位于 12 个归档，24 种不同字节；不是“全部 12400 成员均为 MIT”。相同原文在多份 before/after/snapshot 中重复，清单保留每个完整成员路径，避免只数文件名漏掉副本。空白文件与上游空白文件哈希碰撞没有被当作第三方实质复制证据；命令正文相似度仅作检查辅助，来源判定结合实际 source、原文及渲染差异。

逐项表中的“适用成员数”只统计上述确认范围。0 表示未在这套具体范围中命中，不等于其他成员已被证明无第三方权利。

| 归档（foundation fixture 除首行外均在其 fixtures 下） | 全部普通成员 | 确认适用成员 | 原归档 SHA256                                                      |
| ----------------------------------------------------- | ------------ | ------------ | ------------------------------------------------------------------ |
| `build-pipeline-replan/snapshot.tar.gz`               | 63           | 0            | `ee33cfd770ea4a38f73892d1809a9f413ccc3a7c1d1dc606169de1a5fb833a1f` |
| `t062/retained.tar.gz`                                | 254          | 42           | `6c634769d3793f0f9ed00642b40ebefed4feee3a6c71c324d87a50de49103514` |
| `t063/retained.tar.gz`                                | 193          | 28           | `44ad70c74749d3f392eddd0fd799c8ddd372f27f3f0d05ab9789dd6ddf506c24` |
| `t064/retained.tar.gz`                                | 445          | 79           | `4edf967145e788328e1ccf8f61ace433ba12f764fe9fedf3a37a8afb33944456` |
| `t066/retained.tar.gz`                                | 2948         | 1100         | `ee1a3710f3ca8c46f6f44866353887d2941c12ef882387c9124bd490df3acece` |
| `t067/retained.tar.gz`                                | 5642         | 2146         | `34a8811fcbfce3166b3e6bb9633f9e671fe3864c4c2657579dfdd10397bbc2e6` |
| `t095/retained.tar.gz`                                | 1006         | 352          | `5aadecfe661d7cea00b3f475963727b202c4e0553367ea78fa81f042a7ecb1e2` |
| `t096/retained.tar.gz`                                | 164          | 0            | `d724fd64ca89a847b9f7da127da2e1f3d22da57a316080c6b3434701cf4569a4` |
| `t104/retained.tar.gz`                                | 84           | 2            | `6487dc47f3a7b250059bc061ab4b5a2f717f2d2b47e9f641ccd97391f54922c1` |
| `t105/retained.tar.gz`                                | 170          | 46           | `b7e5d829916ef6f5a8a90c99858044556743b369d8e913295d7cfef4409323d3` |
| `t106/retained.tar.gz`                                | 239          | 42           | `0fba713e4e938886ad38bbf67dd25c8b8f89b4815c415cb19118872f80cbef95` |
| `tv-10/retained-round2.tar.gz`                        | 75           | 22           | `5def17a748a7ec566a7d8f5ee02012379e6be7f1d018ec7f1d63a3accfb3bbee` |
| `tv-10/retained-round3.tar.gz`                        | 383          | 110          | `c6235f37e2a7606938f1dbb34c2eb458446bf2105cd1bff3015ccf5f49077ec5` |
| `tv-10/retained.tar.gz`                               | 734          | 286          | `de45d2e106b67d9aa2e1564f6380867c46b551fe92a36dd1e9fcf46daadcfdb7` |

补充递归核查：`tv-10/retained-round3.tar.gz` 内的 `round3/substantive-complete-state.tar.gz` 为 89974 字节，SHA256 `32b9dbfa348d85b29f7f543ae992638ddfa99a2cb2f493850c5266dda5a6d3ec`，其 57 个普通成员中有 22 个与上述确认的上游复制/渲染字节完全相同（10 个指令、6 个脚本、5 个模板、1 个工作流），无 LICENSE/NOTICE。另 35 成员不因此被整体归为 MIT。嵌套 22 项单独存于 `nested-third-party-applicability.json`，不混入外层 4255 项；来源链包含外层摘要、子包摘要和内部成员摘要。如公开副本保留该子包，应对其实际保留成员附 MIT 与 GitHub 通知；公开内容 v2 已按实际成员保留该子包并附原 MIT，本轮 13 容器核对见后文；其公开准备状态仍不由本次许可核对代判。

另对非路径映射成员检查已知上游连续正文：同 12 个归档内的 201 个成员（37 种字节，主要为读取输出所在 events.jsonl/stdout，部分为 constitution.md）还保留能与固定上游比对的至少 1500 字符连续片段。`embedded-third-party-applicability.json` 只存这些窗口的来源路径、位置及 SHA256，不复制轨迹正文；区分原文本和转义换行/引号后的输出视图。这里只对实际保留的上游片段列 MIT 适用，不把外围自有记录或整份 constitution 归为 GitHub 创作。公开内容改写后还须检查片段是否仍保留。该范围没有新增上游、许可类型或归档，现有 12 包 GitHub MIT 正文已可复用。另对普通文件做同一已知来源窗口核对未命中；这不是未检出其他借用的权属证明。

两轮旧构建归档的出处另行核验：`2026-11-10-build-pipeline-replan` README 明确快照取自当时实际工作区、包含未提交内容，而非按 HEAD 重建；`files.sha256` 的 63 个 tar 成员全部匹配，`snapshot.sha256` 匹配，`retired-source.sha256` 的 21 个原路径文件全部匹配。`2026-11-11-build-script-restart` 的 7 个原路径文件与 `files.sha256` 全部匹配。它们保存自定义构建实现/测试的历史来源，哈希能证明字节连续性，不能单独证明作者权属或授予新的许可。归档原件保持不变；若单独提供某个历史 tar，须同时提供该 tar 实际成员所需的通知与出处，不能只依赖使用者另行寻找上游许可。

## 依赖与工具的实际分发边界

紧急包与主线包当前 package 声明的是开发依赖；当前紧急 payload 为许可、README、配置、9 技能/3 附件及自有脚本，35 个 release 条目加 `release.json` 共 36 文件，没有 `node_modules`、官方 CLI、Vite/ESLint/TypeScript 编译器或 Python site-packages。构建使用 `yaml`、`semver` 等包以及脚本调用官方工具，均不等于把其源码复制进本次 payload。本轮不把开发工具许可全文混入上游模板通知，也不改变各依赖自己的许可证。

迁仓配置准备器的当前实测清单为 410 个解析物理根、806 条依赖边、必需缺失 0、可选缺失 61；这是一份当前工作区观察，不是新仓库解析证明。主要已知元数据为 semver/yaml 的 ISC，Vite/ESLint/类型包及多项 ESLint 插件的 MIT，TypeScript 的 Apache-2.0；不能据此概括所有依赖均为 ISC/MIT。

特别发现 `eslint-plugin-sonarjs@4.2.2` 的实际冲突：package 元数据是 `LGPL-3.0-only`，同包 LICENSE 首行却是 `SONAR Source-Available License v1.0`，下一行日期为 November 13, 2024；实际正文 9676 字节，SHA256 `b93b383060f0b26e95538455d8a92b0c9bc5bf61c3a1fd42583fc3d535330a03`。本报告如实并列，不将 SPDX 标识覆盖实际文件，也不推导链接/传染等法律后果；若后续要分发该工具代码、完整依赖或镜像，须对实际版本的许可证冲突另行厘清。当前源码声明/技能 payload 边界与该潜在后续分发分开。

## 可审阅草案及最终汇合方式

临时审计目录为 `/tmp/urgent-public-license-_3c16f42`，未写进原源或候选：

| 文件                             | 实际用途/核对结果                                                                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LICENSE`                        | 从紧急包原字节复制的新根 ISC 草案，743 字节，SHA256 `a2f402e931906baada87fa68625cec647d73e538fdd2d115f74d436674fb6dcb`；没有编造署名或年份。                                                                                     |
| `SPEC-KIT-MIT.txt`               | 从已安装 Specify 1.2.6 原字节复制，且与固定上游一致的 GitHub MIT 全文。                                                                                                                                                          |
| `THIRD-PARTY-NOTICES.draft.txt`  | 明确自有 ISC 范围、按保留清单适用的 Spec Kit 范围，并逐字节附上述 MIT；2416 字节，SHA256 `fb76c79d73f1de9592a04d45e316699bdb7508b8f3a855a8d8d768bbc5919f57`。尚未当作最终公开通知。                                              |
| `third-party-applicability.json` | 每项含 archive 原路径/摘要、member 原路径/摘要/bytes、固定上游路径/版本、识别类型、许可/署名；4255 项，SHA256 `9127b063c383e8d0358a96ba71df5f4aea062f0df61420e11e619c0f3749a9bc`。仅私有核对索引，不把完整来源正文或凭据另打包。 |
| `archive-manifest-check.json`    | 上述 63/21/1/7 条已有 manifest 的实际字节校验，全部无 mismatch。                                                                                                                                                                 |
| `tool-license-observation.json`  | SonarJS 元数据与 LICENSE 正文冲突的最小观察索引。                                                                                                                                                                                |

公开内容准备副本位于 `/tmp/urgent-public-content-jwl57mb0`，由内容责任者维护。本通知映射已转交其按 `archive + member` 与实际保留集合相交；本轮独立读回首版交集及其实际 12 个派生 tar，4255 项全部保留且 publicBytes/publicSha 均匹配，每包均带有与原 GitHub MIT 同字节的 `_PUBLIC_LICENSES/SPEC-KIT-MIT.txt`（详见 `prepared-content-notice-check.json`）。这只是当前准备副本的定点核对，嵌套子包另见前述独立映射，不能代替迁仓验收。如保留成员被脱敏/改写，须保留原摘要到新摘要的来源关联及上游适用通知。若某成员最终不分发，不把它写入最终适用范围。两份旧归档及生产技能原件不会为了补通知而原地改写。

`nested-third-party-applicability.json` 记录嵌套 22 项（SHA256 `a2051a91a810460ccc5b03e3f5e60e1b846c8f487e3da893761e7329b60ea358`）；`nested-archives.json`/`nested-members.json` 记录嵌套来源链及全部 57 项；`prepared-content-notice-check.json` 记录对首版公开准备副本 4255 项及 12 份原 MIT 通知的实际字节核对。

`embedded-third-party-applicability.json` 记录上述 201 个成员中确认的上游连续片段及窗口来源（SHA256 `fb89bd6fe584454126d4b5e8ba06328b851edac47088d4de992352a22348e12b`）；它与外层 4255 项、嵌套 22 项保持独立，避免把轨迹全文归属第三方或把尚未决定保留的片段冒认为实际分发。NOTICE 草案同时指向三份索引，最终仍按公开内容实际保留交集定稿。

内容准备 v2 的定点只读复核已实际完成：`public-candidate-v2` 中，外层 4255 项加嵌套 22 项共 4277 个完整成员的实际 bytes/SHA 与保留交集全部一致；13 个容器均附原字节 MIT，根 ISC 也与原 743 字节文件一致。结果保存于 `prepared-content-v2-notice-check.json`。本次读取时其根 NOTICE 仍为较早的 2298 字节草案（SHA256 `d2b034e0465fb3e70beb294e43b65e4ac8fbbac796a5c4e8ecf3c42a6d395f2f`），已通知内容责任者在自有副本刷新为上述 2416 字节版；201 项片段的最终正文交集由其在当前公开副本计算，不能把该数量直接填成全部实际分发片段。现有 MIT 正文不变，不据此新增另一套许可或将日志全文改标 MIT。v2 仍为 review-only 准备树，不是已迁仓或已发布结果。

用户已选 ISC，不需要重新询问这个选择；需要在最终材料中落实的是自有材料范围、已知上游及其通知。当前无依据替其他作者增加版权授权。若作者知晓本轮静态来源核对未识别的其他借用正文、模板或源码，需要提供对应原出处/版本/许可及必要署名；不能将一次扫描未命中当作该借用不存在。开发依赖许可冲突需要按其实际后续分发边界处理，不能用新根 ISC 消除。

## T090/T091 的具体输入及现有事实

| 字段/前置               | 当前真实事实                                                                                                                     | 迁后/发布时必须绑定的输入                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| repository              | 用户说明新仓库尚未建立；本轮没有创建或联系外部仓库                                                                               | 用户建成后的实际公开目标及可用权限。当前不猜名称、URL 或仓库所有者。                                                                              |
| sourcePackagePath       | 旧 Foundry 根相对 `packages/skills-distribution-urgent`                                                                          | 按新仓库实际布局定位；仅当包本身就是 Git 根才为 `.`，不可套用旧路径。                                                                             |
| version                 | 旧候选 package/release 均为 `0.1.0`                                                                                              | 迁后真实 package 的有效 SemVer 及其冻结 release 版本一致；未提前构造新版本。                                                                      |
| sourceRevision          | 旧本地源码 `7e79b524b85fdfb5678acbe54ebfb41ec94bec1f`                                                                            | 新仓库真实已提交来源及其完整输入闭包；不得把旧 Foundry SHA 写作新仓库来源。                                                                       |
| candidateDigest         | 旧本地候选 `498f5e8984061c21344ed3c4566ceb5dea1ce0e1301f0fb01342e396b8bdc8e6`，36 文件                                           | 新仓库上经 T090 真实检查/双构建冻结的候选摘要和文件全集，发布阶段仅消费其原字节。                                                                 |
| catalog/依赖/工具/许可  | 旧 catalog 摘要 `5305dfcc5d799f52b920829d71498cb8c27329ba35cd1bfcbc5dab7ac4a8c70c`；本报告为许可准备，迁仓配置由其责任者另存草案 | 新根实际 catalog/preset/依赖解析、工具版本、公开内容与许可落地后的真实来源，不能从当前观察清单填成新根成功收据。                                  |
| authorizationRef        | 当前推进授权允许继续本地准备；没有绑定新候选的发布授权                                                                           | 明确绑定实际 repository、version、sourceRevision、candidateDigest 的无秘密授权记录。T090 通过、既有 Task 或当前继续实施指令均不代替这一具体授权。 |
| publishedRevision / ref | 尚无公开发布                                                                                                                     | 内部工具真实回读的无父发布 commit、`refs/tags/skills-v<version>` 及原字节全集；T091 不构建、不改 README、不安装依赖、不强推/删 tag。              |

旧本地 133/133 通过、双构建 36 文件一致及 4 次真实宿主消费均为既有 Foundry 身份下的证据，本轮没有重跑产品全套或模型；不能抵扣新仓库 T090。当前 T090 迁后验收、T091 固定发布、T092 匿名全集/真实消费与 T093 最终汇总均未因本报告完成。缺少新仓库只阻止依赖它的动作，不阻止其余本地准备；完成当前仓库准备后由协调者按用户安排提醒新建。

## 本轮实际验证

完成四处普通文件/14 外层归档及 1 嵌套归档的只读许可文件与来源扫描、固定上游字节比对、归档既有 manifest 校验、ISC/MIT 草案字节相等核对。未执行安装、产品测试、模型会话、迁移、Git 写入或外部发布。报告保存后立即执行定点 Markdown ESLint 自动格式检查并读回；原源和归档保持原字节，主线并发改动原样保留。
