# 构建、迁移与发布流水线契约

**当前版本表消费补充（2026-11-14）**：主线 curl 的首个版本参数默认 latest，当前 release.json 改为 version/url 数组版本链接表；发布端须维持最新已发布记录在前，明确版本唯一匹配，解析后内容及挂载固定为选中记录对应的实际版本。此表不能替代旧契约的单版文件及摘要清单；同名文件的名称、schema、发布位置和源码映射需在后续发布设计中明确，不可直接把数组当作旧 Release schemaVersion=1。当前只接入消费端查表，持久记录、表生成与 R2 发布尚未完成。运行依赖按 FR-071 以 npm 安装到消费端本次临时目录，不进入技能正式内容或全局目录；本轮未运行或修改 CI/发布器。

**主线发布承载更新（2026-11-14）**：用户选择 Cloudflare R2 作为主线发布文件下载源，依据[原始输入](../requirements/raw/2026-11-14-install-shell-flow.md)及[讨论整理](../requirements/discussions/2026-11-14-install-shell-flow.md)。源码仓库及完整 sourceRevision 的追溯继续保留，文件下载根与源码仓库地址分开；下文主线 GitHub raw/tree 下载映射须在后续方案中适配，不再作为唯一下载地址形式。R2 中的固定版本目录、源码提交映射、候选原样上传与远端完整性核验细节尚未确定，不新增压缩包要求。紧急版既有官方安装及显式挂载路线保持；本轮选择平台不授权创建桶、改域名、上传或发布，也不改写历史发布证据。

**版本管理需求补充（2026-11-14）**：按 [FR-068～070](../spec.md#当前追加需求本地产物版本r2-版本表与简易版本管理2026-11-14)，本地 dist/skill 与 dist/curl 只交付当前构建和对应版本标记；R2 保存已发布技能版本的固定下载内容，curl 版本表维护版本到实际地址的映射。版本记录须有生成目录外的持久来源，构建交付副本；只有成功发布并核验的地址才登记，失败不冒认成功，不静默改写已有同版发布记录。源版本维护、构建标记和发布登记是不同动作，不能因一次构建而默认已发布。版本表、标记及单版 release.json 各司其职，候选范围仍按获准文件和清单限定，不能把源码发布记录或整个 dist 自动上传。本轮只追加需求，未设计或执行发布器、R2 资源及 CI 变更，旧节点细节后续再适配。

**当前开发顺序（2026-11-10）**：先完成单一 Vite 构建、纯安装验证和明确未实现的挂载占位，再开发 GitHub Actions 检查/候选/发布配置，最后接通真实 Spec Kit 挂载。此顺序替代此前构建起步同步 CI 的安排；完整本地与迁后发布验收继续后置，T064 清退事实保持。节点输入/返回见[build-pipeline.md](build-pipeline.md)，结构见[data-model](../data-model.md)。本次仅规划，未写或运行 workflow。

来源：[spec.md](../spec.md) US7、FR-037～044、SC-014～017 及两项 2026-11-09 澄清；设计依据见 [research.md](../research.md)。用户已明确直接迁移源码，自动工程导出 T054/T057 撤回；此前[实验记录](../analysis/acceptance/pipeline-local.md)仅留历史范围。以下候选、授权及流水线能力仍待实施，不是已有 workflow 或平台验收。

## 当前能力集合与发布前核对

2026-11-10 按 FR-045～047/SC-018 追加同版实施准备消费：完整 workflow 候选须有正式 Increment、implementation-preparation 及有效分析/结案来源、正文、实际必需附件和 hook 声明；名字以主线正式交付核对，不用计划或合成 fixture 冒充。三暂停模式不继续生成/重装，其专项验收不再是候选/发布或结案前置；通用安装、隐匿、全支持矩阵、独立使用者及发布授权保持。官方旧入口迁移、未知内容保护与实际完整加载仍为适用挂载质量条件，未测不得算 pass。流水线不得为检验加载发起业务实现。

## 直接迁移与安装候选边界

本版本在 Foundry 完成技能构建、流水线及隔离验证；用户随后直接把 skill、MCP 等源码和必要工程文件移到公开仓库，由新仓库维护依赖、配置、测试和 CI。无需自动工程导出、配置投影或 ProjectBundle 索引。迁移说明只记录文件范围与待调整项，不生成另一份工程包。

源码仓库可以维护 skill、MCP、build、script、测试和 workflow；安装候选严格为 release.json.files 加 release.json 自身。源码、CI、依赖锁、测试、个人画像、凭据和未公开内容不能因源码迁移进入候选。src/mcp 按实际工程需要保留，既有单次 Vite 构建约定保持。

迁移后源码 SHA、仓库或依赖变化，须在新仓库重新检查和准备候选。当前 Foundry 不向真实公开目标发布；真实独立工程检查及首次发布分别由 T061/T062 留证。

## 计划接口与路径

workflow 计划位于仓库根 `.github/workflows/skills-check.yml` 与 `skills-release.yml`。工程驱动计划位于 Foundry 的 `packages/skills/build/ci/{run,candidate,publish}.mjs`，迁出后位于 `build/ci/`；它们仅为构建/CI 工具，不进入 `dist/script` 或 release.files，不改变终端用户的 `node script/index.mjs [参数]` 唯一入口。

内部工程入口采用 `node <包根>/build/ci/run.mjs --mode <模式> --package-root <明确包根>`。模式为 check、candidate、simulate、publish；具体 schema 由 tasks 实现并测试，未知/冲突参数失败而非隐式选择。project.mjs 及专用测试已按用户修正移除；run.mjs、candidate.mjs、publish.mjs 尚未实现，不能直接执行为已有能力。

| 参数                    | 契约                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| --mode / --package-root | 必填；模式枚举如上，包根必须是显式已有绝对目录或相对当前仓库根路径，验证其根 manifest 身份和布局                |
| --source-revision       | candidate 必填完整源码 SHA，须与实际检出的来源一致；不把工作树未提交内容冒认该提交                              |
| --validation-scope      | candidate 必填 isolated 或 full；不得默认推断，不接受 development；实际来源、检查证据与输出索引必须符合所选范围 |
| --output                | candidate 必填本次拥有的空输出目录；与来源、用户目录分开，重复/非空/链接路径拒绝                                |
| --candidate-dir         | simulate/publish 必填，包含 payload 与发布根外索引，实际文件与请求摘要完整一致                                  |
| --remote                | 仅 simulate 接受本次自有本地 bare 路径；publish 从可信平台配置取得当前仓库目标，不允许用此参数覆盖              |
| --request               | publish 必填无秘密的请求 JSON 路径，字段按发布请求表；simulate 使用测试自有等价请求，不得据此绕过实际平台授权   |

每个模式仅接受适用参数，静态缺项或冲突在输出/推送前失败；底层 Git/摘要/安装检查不得通过 shell 拼接未验证值。工程模式参数与终端用户安装参数属于不同接口。

- `check`：适用 lint/check-types/build、包内测试及 Foundry 消费者检查分别记结果，不隐式挂载真实工作区。
- `candidate`：按显式 validation-scope 执行下表的内容门禁，输出 payload、发布根外内容索引及检查/依赖证据。两个范围均拒绝双构建不一致、所选集合缺件、development 清单、缺 README/真实许可证或混入未选内容；isolated 的合成材料只在测试自有根下作为显式输入。真实上传成功后才取得 artifact ID 并生成独立平台收据；内容准备成功不等于 ready。
- `simulate`：仅接受测试拥有的本地 bare Git 路径及隔离读取器，拒绝真实 HTTPS/SSH 发布目标；复用同一候选校验和 Git 提交/竞争处理，不用 CLI 替身伪造正常路径。
- `publish`：只允许迁后 standalone 布局且事件、身份、候选和目标均通过授权门禁；Foundry 布局即使手动调用也失败。不得在该模式安装依赖、重新构建或执行候选脚本。

### 候选范围与准入条件

| 判定项           | isolated                                                                                                     | full                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 来源集合         | 明确列出稳定子集或测试自有合成技能及其真实输入摘要；不冒认正式同版全集                                       | 正式同版完整来源及实际必需附件、依赖、hook；合成/暂停来源不能补位                         |
| 两范围共同必需项 | 同一源码/完整依赖快照的双干净构建、有效 Release、集合内依赖附件完整、真实 README/许可证、严格 payload 与摘要 | 与 isolated 相同，且不能缩小正式公开集合                                                  |
| 检查证据         | 已执行的适用检查必须成功；完整安装/挂载/矩阵等尚未执行项可记 not-run，并逐项写明 coverageLimits              | 全部上传前必需检查通过；failed/not-run/缺环境 skip 任一存在即拒绝                         |
| 输出与资格       | 索引 validationScope=isolated，结果 purpose=isolated；不要求真实平台收据，不允许真实 publish                 | 索引 validationScope=full；上传前仅表示内容门禁通过，尚无 ready；Foundry 结果仍仅隔离用途 |
| 后续升级         | 不能通过改标签复用为 full；须用正式来源重建重验并重新生成索引                                                | 迁后 standalone、可信成功平台运行及有效收据齐备后，才由 T071/T061 核定 ready              |

缺少或非法 validation-scope、来源与范围不符，均在创建候选输出前失败；候选过程中实际执行的检查失败必须非零，不能按 isolated 吞掉错误。validationScope 是实际验证范围，purpose 是使用资格，二者都不是授权开关。simulate 可消费 isolated，真实 publish 仅接受 full 且 purpose=ready；调用方或 artifact 单方面改字段不能升级资格。T055 用 isolated 验证同一严格内容骨架及 full 的拒绝分支，完整来源/检查就绪后再验 full 正向路径；T071 不反向阻塞上传前内容验证。

## Actions 实现先行与正式发布门禁

GitHub Actions 在构建闭环通过后实现：先接只读检查，再复用同一构建/候选/收据/发布器完成 skills-check 与 skills-release 配置及隔离验证。占位期间，check 可验证构建、纯安装及原生调用明确未实现的行为；这种局部 check 成功不等于所有发布必需检查已齐备。不能以工作流实现完成或配置可解析声称实际平台已运行。

占位或缺真实挂载/宿主加载证据时，只能按已声明范围进行 development/isolated 实验；full 的全部上传前门禁及 ready 的可信平台条件不变，实际 publish 必须拒绝。正式挂载在 T059 配置交付后由 T006/T022～T028 接通，随后 T037/T060 汇总完整本地门禁，T061/T062 才在迁后另获授权执行真实平台与发布。不得让 T060 的完整验收反向阻断 Actions 开发，也不得为了先交付 Actions 而取消真实挂载门禁。

## 检查与候选准备

1. PR 检查使用 pull_request、只读 token、无发布 secrets；变化过滤覆盖技能、脚本、构建/测试、有效预设及依赖声明等输入，不只看 SKILL.md。PR 不产生正式发布授权，报告不可发布用途。
2. 默认分支 push 或默认分支的手动 check 可准备候选；scope 检查必须覆盖包检查、适用测试、完整发布门禁和声明支持范围所需证据。缺平台、网络或工具保持 failed/not-run，不能把必需 skip 变成功。明确不适用项与缺能力跳过分开记录。
3. 从具体提交准备干净工程，记录 Node/pnpm/Python/构建工具和直接、间接依赖快照。两次干净构建使用同一快照；迁后独立安装仅使用新仓库声明，不复用 Foundry node_modules；不改变当前仓库锁文件跟踪策略。
4. 上传前内容索引固定 sourceRevision、version、catalogDigest、payloadFiles/candidateDigest 及依赖/检查证据摘要，不包含未知上传 ID。candidateDigest 按模型规定的排序与序列化计算，索引不把自己的摘要写进自身。上传成功后从真实输出取得 payloadArtifactId/payloadArtifactDigest，形成独立收据，绑定 repository、runId、runAttempt、contentIndexDigest 和实际有效期；收据自身的上传 ID 由请求或运行摘要定位，不写进自身。发布器分别重算内容/索引摘要并校验平台归档摘要。
5. artifact 名称含版本和源码 SHA 便于展示，授权定位仍使用精确 ID；保留 14 天且不超过平台限制。过期、缺失、所属 run/attempt 不符或摘要不符，返回候选无效，不自动选另一个同名结果。

6. 只读 guard 通过平台 API 核对两个归档的实际 ID、所属仓库/run、head SHA 和有效期，并核对指定 attempt 已成功。上传时运行尚未结束不等于可提前发布。下载 action 固定到实施时核验的 SHA，要求摘要不符失败，同时保留自己的全文件核验，不依赖某版本下载器的默认行为。

## 发布授权与权限边界

| 输入或前提           | 规则                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| executionMode/layout | 前置只读 guard 从受信任工作流/包元数据识别；Foundry 仅隔离演练，standalone 才能进入真实发布 job                                                                           |
| 事件与执行 ref       | 仅 workflow_dispatch；workflow 和执行 ref 均为当前仓库受信任默认分支。PR、外部贡献、任意其他分支拒绝                                                                      |
| 维护者               | 由平台校验触发者具有仓库 write 权限，工作流额外核对实际仓库/默认分支，不把 artifact 内容声明当授权                                                                        |
| 仓库配置             | `SKILLS_PROJECT_MODE=standalone` 且 `SKILLS_PUBLISH_REPOSITORY` 等于当前 `owner/repo`；缺失或 Foundry 布局均拒绝，不自动建仓或跨仓库推送                                  |
| 发布请求             | 显式 version、sourceRevision、runId/runAttempt、payloadArtifactId/receiptArtifactId、catalogDigest、contentIndexDigest、candidateDigest；与可信检查结果和实际下载内容一致 |
| 检查来源             | 同仓库默认分支 push/手动 check 的成功运行，来源提交属于受信任默认分支；外部 PR 运行产物不得升级为发布候选                                                                 |
| 写权限               | 只读 guard 先输出可发布身份，发布 job 的 if 再据 guard 与维护者触发判定；只有该 job 为 contents:write，其他 job 只读                                                      |
| token 使用           | 新仓库自身临时 GITHUB_TOKEN，只传可信推送步骤；不持久化到候选或 checkout，不执行 artifact 附带代码；不依赖跨仓库 PAT 或当前私有仓库付费环境审批                           |

手动触发的授权只覆盖请求中的具体候选及目标。参数变化、候选失效或重新准备后必须有新触发，不从旧 run 复用授权。action 引用固定到实施时核验的提交；发布器代码也固定可信 workflow 版本，不能从候选源码临时构建后带写凭据执行。

## Git 发布与并发

发布器重新读取并校验完整候选，从白名单创建独立根树提交（无源码父提交），以新的 `skills-v<version>` tag 指向该提交。一次仅推这一个新 ref，禁止 force、修改已有 tag、推默认源码分支或累积多版本安装目录。git 目录、HOME、hooks/config 和临时文件隔离，不能继承会把索引或工作树重定向的外部 Git 覆盖。

同目标/同版本 Actions concurrency 不取消运行中的发布；它仅是排队辅助，不承诺每个 pending 都执行。远端新 tag 的无 force 创建是最终竞争裁决；推送失败/连接中断后先只读获取目标 tag，逐文件核对候选，不能直接认定零写入。已有同版全部一致时复用现有发布 SHA，不同或不完整时拒绝并明确恢复条件。不得删除既有版本来重试。

来源身份为 `{ repository, publishedRevision }`，其中 publishedRevision 是上述发布提交完整 SHA。两个入口绑定同一身份，但分别生成目录来源和文件下载 URL：

| 用途                        | 格式（占位不是可运行地址）                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| 官方整包/多技能             | `https://github.com/<owner>/<repo>/tree/<发布SHA>/skills`，再显式传本次清单已核验的名称                   |
| 官方分类                    | 上述 tree URL 加 `/<category>`，显式选择该分类清单名称                                                    |
| 官方单技能                  | 上述 tree URL 加 `/<category>/<name>`，保留明确 --skill/agent/scope                                       |
| 下载脚本/清单文件根 rawRoot | `https://raw.githubusercontent.com/<owner>/<repo>/<同一发布SHA>`，逐项拼接 release.json 或 files 相对路径 |

预检的远端 --source 使用文件根读取清单，并从已验证的 GitHub repository/SHA 生成官方 tree URL 建议；本地 source-dir 继续用实际目录。不能把 raw 目录根当官方可发现目录；非本计划支持的来源转换明确拒绝，不猜测或换提交。该映射按实际解析的上游包复验，当前 1.7.6 源码核对只证明输入解析，不能抵扣真实克隆/安装。官方整包/分类仍显式列名，不使用星号或 --all 扩大选择。

发布结果给出实际两个地址及共同身份，SOURCE/RELEASE_SOURCE 文档须说明对应入口的地址类型。提交根只含当前公开文件，源码 SHA 与发布 SHA 分开追溯，不回填 release/README，两个入口同源按发布身份和字节核对而非要求 URL 字符串相同。

## 结果、失败与恢复

各阶段 check/candidate/publish/remote-verify 使用 success、failed、skipped、not-run；记录实际已写 ref/SHA、完整核验结果、reasonCode 和重试条件。skipped 必须说明不适用或等待迁移，不能抵扣必需检查；不另建工程 Task 状态系统。

发布前失败不创建公开版本；单 ref 尚未对外创建时不能报告已发布。若 tag 已创建而远端核验失败，报告 publish 已发生、remote-verify 失败，保留旧完整版本，不撤销真实事实或自动改写 tag。新候选字节变化使用新版本；相同字节重试先核对真实 tag。恢复通过选择旧固定 SHA 在隔离环境复验，不强制覆盖用户已有安装。

首次发布无真实旧公开版本时，旧版本恢复先以 T056 隔离多版本材料验证，T062 只判断首次发布及本次真实远端核验；这不满足 SC-017 的真实旧版固定来源复验。该真实历史条件由 T038 明确承接，历史未形成时继续未验且 T038/T040 不完成，不伪造已存在的版本，也不为补样本擅自额外发布。当前版本交付只认可隔离验证，真实 Actions、公开来源全部文件、两入口/适用挂载及 SC-008 用户验收在迁后完成；SC-016/017 和总体结案仍按其完整条件判定。

## 前置实验与验收位置

原T055/T056、T058/T059等身份与目标保留：T065先建立新失败契约，T067～T070完成构建与纯安装/占位验证，T068同时负责原生临时占位；随后T066接只读Actions，再由T055/T071/T056/T058/T059接候选、绑定、Git故障、驱动和完整配置。T059之后接真实挂载，T060完整本地验收及T061/T062迁后平台/发布后置。平台实证不以隔离结果抵扣，原完成Task不重开，不恢复工程导出器。

本地实际结果追加 `analysis/acceptance/pipeline-local.md`；其中 T054 记录已经标为撤回能力的历史实验。用户直接迁移后，T061 核验真实工程、平台与新候选，T062 另获授权后首次发布。真实来源和展开命令存发布根外的 release-source.md，T032/T038 继续验独立用户与承诺矩阵。T054/T057 身份保留为撤回记录，不计当前完成或待办。
