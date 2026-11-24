# 构建、迁移与发布流水线契约

## 2026-11-23 按环境上传构建产物

| 文件 | 当前职责 |
| --- | --- |
| `skills-test.yml` | 通过 `workflow_call` 执行固定通过的测试占位。输出字符串 `passed=true`，在摘要记录真实测试未执行。 |
| `skills-deploy-release.yml` | 接收 `feature/init` 分支的 `push` 和 `workflow_call` 调用。分支删除事件跳过部署。先调用测试，再用 `passed == 'true'` 放行公共流程。传 `target: release` 并按名传递两项 R2 密钥。 |
| `skills-deploy-common.yml` | 通过 `workflow_call` 接收 `target` 和 R2 密钥。引用调用上下文的 `github.sha`，在同一 job 内构建、打包、记录归档 SHA-256 并上传。 |
| `skills-deploy-prod.yml.example` | 待接入的生产草稿。计划使用 `workflow_dispatch` 和 `target: prod`，按授权部署所选提交。 |

[公共流程](../../../../.github/workflows/skills-deploy-common.yml)按 `target` 绑定 GitHub Environment，通过同一目标的并发组和 `cancel-in-progress: true` 取消正在运行的旧流程。构建使用 `github.sha` 检出触发提交，依次准备工具、安装依赖、构建工作区依赖、构建技能包和打包。[当前构建与打包](build-pipeline.md#现行-skills-工作流直接构建与打包)

`release` Environment 的变量为 `SKILL_DEPLOY_RELEASE_R2_ACCOUNT_ID` 和 `SKILL_DEPLOY_RELEASE_R2_BUCKET_NAME`。`prod` 的变量为 `SKILL_DEPLOY_R2_ACCOUNT_ID` 和 `SKILL_DEPLOY_R2_BUCKET_NAME`。两个 Environment 使用同名的 `SKILL_DEPLOY_R2_ACCESS_KEY_ID` 和 `SKILL_DEPLOY_R2_SECRET_ACCESS_KEY`，填写同一对覆盖测试桶和生产桶的 R2 凭据。公共流程根据 `target` 选取对应环境的桶配置，在上传步骤中将共用密钥映射到 AWS CLI。

测试与生产各用自己的桶。构建上传目录为 `s3://<桶>/<源码 SHA>/<运行 ID>-<重跑次数>/`。

| 本次 job 的文件 | 目录下的对象 |
| --- | --- |
| `packages/skills/skills.tar.gz` | `skills-<version>.tar.gz`，版本取自 `packages/skills/dist/VERSION` |
| `packages/skills/dist/curl/install.sh` | `curl/install.sh` |

账号、桶或凭据缺失时上传步骤失败。两次上传成功后，运行摘要记录实际 R2 目录。上传失败或取消时可能已有部分对象，重跑使用新尝试路径。

首次 `skills-deploy-release` 验收需要关联该次运行与实际归档对象键，从运行摘要取得上传前的 SHA-256，并下载同一对象比对。真实推送和 R2 回读待验收。正式发布再确认公开安装入口、`curl/release.json` 和适用授权。[验证指南](../quickstart.md#2026-11-23-r2-流水线验证)

<details>
<summary>本次拉取的远端差异（待核对，不覆盖上方本地进度和冻结决定）</summary>

## 2026-11-23 统一发布与 R2 交接

本节定义主线现行触发、候选交接和发布目标。实施顺序先接生产部署，后续补测试、测试发布和环境分发。下文先接只读检查的顺序、手动触发、候选单次授权、旧 Git 发布与容器输入对应此前方案。生产完整资格及真实消费条件沿当前 Spec。[现行规格](../spec.md#2026-11-23-主线技能构建与发布流水线) · [总体方案](../plan.md#2026-11-23-主线推送测试与发布) · [数据模型](../data-model.md#2026-11-23-流水线身份与发布结果)

### 事件、提交与授权

| 工作流及运行路径 | 事件与适用范围 | 构建身份 |
| --- | --- | --- |
| `skill-release.yml` | `push` 无分支或路径筛选。GitHub 每次投递有可检出提交的推送时独立运行两套测试，连续推送各自留结果。 | 对事件提交核对实际 `HEAD`。无可检出提交的删除事件记录跳过，平台抑制以事件证据确认。 |
| `publish.yml` 测试发布 | `pull_request_target/synchronize`，目标为 `release`。受信检查核对事件时 PR 开放、源和目标均为当前仓库、触发者有测试发布权限。 | 验证 `before != after == pull_request.head.sha`，以事件 `after` 检出并核对实际 `HEAD`。 |
| `publish.yml` 生产发布 | `pull_request_target/closed`，目标为 `main`，`merged == true`，同仓库 API 证据确认这个 PR 实际合入 `main`。 | 从本仓受保护的 `main` 历史核对并检出事件 `merge_commit_sha`。已合并 fork PR 同样从本仓 `main` 获取。 |

`publish` 从受信任的默认分支配置运行，同时核对事件活动类型和 PR 目标。测试或生产分支核对工作流来源 SHA 和构建 SHA 后，共用构建、打包和核验步骤。公开仓库启用前确认两种触发的事件策略允许，以及 `main` 分支规则阻止直接推送绕过 PR。真实预检覆盖 merge、squash、rebase、间接合并和连续推送。若间接关闭与实际 PR 合并在当前设置下无法区分，生产发布停止在合并证据核验。fork 测试推送、未授权来源、仅打开 PR、关闭未合并和无相应 PR 的普通推送均不产生发布写入。[事件策略说明](../research.md#github-事件与源码提交) · [真实预检](../quickstart.md#平台事件与权限预检)

生产事件由无 R2 凭据的受信 job 以 `contents: read` 和 `pull-requests: read` 查询本仓库 GitHub API，完整读取适用分页结果。读取 PR 详情确认仓库、编号、目标、真实合并 SHA 和 `merged_by.id`。查 `GET /repos/{owner}/{repo}/activity`，过滤 `refs/heads/main` 和 `pr_merge`，匹配唯一的 `before != after` 活动，要求 `after` 等于该 SHA、活动操作者与合并身份吻合。再查 `GET /repos/{owner}/{repo}/commits/{sha}/pulls`，确认引入该提交的已合并 PR 唯一且等于触发 PR，目标为本仓 `main`。记录活动 ID、操作者 ID、前后 SHA 和归属 PR。规则适用于迁后实证通过的 merge、squash、rebase。任一证据缺失、不一致或有多个归属时停止放行，GitHub 可见性延迟时按原运行重试。T059 先核对 API 实例与隔离边界，T061 再核对目标仓库的实际启用设置和事件。[GitHub 仓库活动](https://docs.github.com/en/rest/repos/repos#list-repository-activities) · [按提交查询 PR](https://docs.github.com/en/rest/commits/commits#list-pull-requests-associated-with-a-commit)

### 构建、候选与发布权限

- 事件检查、源提交构建与归档核验在无 R2 凭据的 job 完成。PR 按事件字段读取并校验，构建用只读权限和 `persist-credentials: false`。发布工作流采用独立 runner，配置 `cache-mode: none` 并关闭共享 mise 缓存。所需 Python 和 Node 检查绑定同一源码和实际 job；独立推送测试仍按自己的事件运行。[构建契约](build-pipeline.md#2026-11-23-runner-直接构建和正式归档)
- 发布 job 使用受信工作流版本的验证和上传代码。以已通过的前置 job、精确归档 ID、生产者 run/attempt、内容摘要及有效期核对冻结归档和独立入口。当前运行可用前置 job 结论继续，整体结论在发布结束后留存。重跑发布 job 时可读回未过期的原生产者收据和冻结文件，记录新的发布 attempt。候选来源、字节、目标或授权变化须重新核对实际绑定。
- 测试发布校验实际测试事件、正式暂存内容、候选摘要及必需检查。生产发布还须匹配完整 `full/ready` 条件、正式同版来源、真实挂载、支持矩阵与可信平台收据。隔离夹具仅用于本地演练。上传步骤只用被冻结的内容，归档和脚本按数据读取。
- 计划环境为 `skills-test` 和 `skills-production`，各自配置 `R2_ACCOUNT_ID`、`R2_BUCKET_NAME`、`R2_PREFIX` 及对应环境的凭据，生产另配置 HTTPS `R2_PUBLIC_ORIGIN`。使用预先授权的不同桶。仅在受信发布 job 的签发步骤读取该环境的桶级令牌，颁发本次对象范围内、只允许 `GetObject`/`PutObject` 的短期凭据。使用环境级来源，避免共享仓库级凭据回落。配置或权限不符时终止对应写入。接收密钥的步骤及安装、构建候选的步骤保持隔离。[权限和短期凭据依据](../research.md#r2-对象权限和恢复)

### 生产发布授权与候选绑定

1. 维护者预先批准实际仓库的可信生产工作流、`main` 合并权限及 `skills-production` 对应的账号、桶、前缀和公开 HTTPS 根。符合该策略的直接合并自动启动流水线。部署环境的已配置保护通过后，受信 job 读出目标配置并核对工作流身份。构建所需公开地址在冻结前由受信工作流配置传入无凭据 job，发布时与实际环境一致核对。
2. 候选冻结、必需检查和平台收据通过后，受信发布 job 在本次运行证据生成 `authorizationRef`，引用已批准的仓库和环境策略，绑定本次合并证据、`workflowRevision`、版本、`sourceRevision`、`candidateDigest`、两个 artifact ID、目标和允许写入的对象键。记录只含可核对的身份和摘要。目标、收据或候选失配时停止放行。重跑重新核对原绑定及当前环境，按实际候选字节决定是否复用。
3. 同一生产目标的队列中，发布 job 用已授权的短期凭据读出发现快照，用固定入口字节和经核验的版本记录确定本次预期更新。首次写入前把可变对象各自的原 ETag 或明确缺失、新字节摘要与同一 `authorizationRef` 绑定。执行时验证实际待写字节与绑定摘要一致，并沿下节使用条件头。冲突或断连按实际状态对账后重新核对授权绑定。该记录由受信发布步骤生成，适用的环境保护按实际配置执行。[授权记录字段](../data-model.md#2026-11-23-流水线身份与发布结果)

### 测试 R2 的取件协议

测试产物的默认前缀为 `skills-builds/`。以下路径相对测试桶，其 `run-id` 和 `run-attempt` 指生产该候选的工作流及尝试。

| 对象 | 键 |
| --- | --- |
| 统一归档 | `<test-prefix>/<sourceRevision>/<run-id>-<run-attempt>/skills-<version>.tar.gz` |
| 独立安装脚本 | `<test-prefix>/<sourceRevision>/<run-id>-<run-attempt>/curl/install.sh` |

两个对象以固定键条件创建并各自完整读回，读回字节、长度、SHA-256 均须与冻结文件一致。已存在的键只在字节相同时复用。一次发布重试使用相同候选和键，重新构建产生独立的生产者尝试目录。运行摘要按源码提交记录两个 `s3://` 地址、实际摘要和预计到期时间。授权验收者用测试桶的只读凭据取得文件。计划的 14 天生命周期限于测试前缀，按相应桶实际设置验证。测试结果以远端字节证据为准，正式发现对象由生产维护。[下载示例](../quickstart.md#测试环境按提交下载)

### 生产 R2 的写入和读回

1. 同一生产目标的发布 job 使用 GitHub Actions 并发组和 `queue: max` 串行排队。记录平台队列拒绝或取消的结果。使用具有条件写入和结构化错误支持的 AWS CLI v2。先核对目标、候选和授权绑定，读取当前发现快照并绑定预期发现字节，再进行对象写入。已登记的同字节历史版本只复验固定对象，尚未登记的普通发布版本须高于已登记最高版本。
2. 固定对象相对生产前缀为 `skills/<version>/skills-<version>.tar.gz` 和 `curl/<version>/install.sh`。以 `If-None-Match: *` 创建。同键竞争、断连或响应不确定时读回原键，已存在且字节完全一致才复用。由 R2 源站和公开 HTTPS 下载核对两个固定对象、统一包解包全集和摘要。
3. 分别用同次 GET 的字节及原样 ETag 固定 `curl/install.sh` 和 `curl/release.json` 的上次状态。先以 `If-Match` 条件写入兼容旧索引和包的最新入口并读回，再按版本表的原 ETag 条件写版本表，保留历史条目。确定键不存在时才以 `If-None-Match: *` 初始化。两个可变对象设置 `Cache-Control: no-store`，并用常规公开 URL 验证实际发现结果。
4. 条件失败、断连与权限差异分别留证。预期字节已存在可记录精确复用，已读旧 ETag 被替换时停止并核对现场。确认入口已更新而版本表未提交时，保留已核验的固定文件、兼容入口和旧表，记录部分完成及续接身份。响应未决时先读回确认实际状态，发现状态对账后才继续。

生产环境只以符合条件的到达事件触发；上传成功、远端核验、发现更新与独立安装验收分别报告。测试与生产的远端资格分别实证。[正式入口与版本表](curl-delivery.md#2026-11-23-公开入口与测试取件) · [条件写研究](../research.md#r2-对象权限和恢复)

</details>

## 2026-11-19 当前推进边界

依据[用户确认](../requirements/raw/2026-11-19-r2-version-table.md)，先验本地构建。发布流水线、R2 版本表更新方式及真实环境验证后置。版本表只持久化于 R2，仓库内发布记录及其回存前置已撤出。以下流水线方案留后续核对。

## 2026-11-18 本地脚本与远端对象映射

统一包的脚本内容来自 `dist/script/`，其中 install.sh 由 curl 插件读取源后原字节交付，hidden-install.sh 由 script 插件扫描和模板派生，归档内为 `script/install.sh` 和 `script/hidden-install.sh`；独立固定/最新入口远端对象仍沿下方 curl 地址，上传入口字节取本地 `script/install.sh` 并与包内入口一致。映射与版本表等非脚本数据保持原位置，不因本地目录统一新增第二包或改变已发布对象。局部职责迁移及用户后续纠正见原 T077 方案，归档及真实发布仍须后续验收。

## 2026-11-16 主线 R2 与发现材料

主线固定对象采用skills/<version>/skills-<version>.tar.gz和curl/<version>/install.sh；可变发现为curl/release.json及curl/install.sh。同次版本取package.json.version，技能与hidden从统一包取得，无独立helper归档。发布对象及索引字段集中在[curl契约](curl-delivery.md)，下方旧Git tag/raw/tree和双包清单公式仅留历史，不约束新R2发布器；紧急Git候选不变。

候选绑定真实相关源码提交、公开全集、检查及冻结包SHA；文件核验表在包外。普通检查无发布凭据，未授权/必需检查缺失/候选身份或目标不符不能发布；开发或isolated不得升级full/ready。真实挂载、支持矩阵、独立用户及迁后门禁保持，不为本地单包演示削弱。

后置R2实现先用自有对象替身，再在获授权真实目标验证条件创建固定对象、同字节复用/异字节拒绝、预期旧ETag条件更新发现及断连后读回。ETag仅是并发令牌，远端实际包须重新计算SHA；无条件写入不能代替条件语义。官方资料与缓存/响应不明限制见[研究](../research.md)，客户端能力和权限仍未实测，不自动部署Worker或创建资源。

R2 的 `curl/release.json` 是发布状态的唯一持久来源。后续流水线仅在固定对象核验后按适用授权更新该表，保留候选身份、远端核验与发现结果。本地构建依据源码和当前版本产物。

发现不是多对象事务：先条件更新并核验兼容新旧包的入口，再CAS版本表；第二步失败保留旧索引和已更新入口。普通发版版本高于已发布最高SemVer；旧版重试不退回latest或入口。竞争时停止本次写入并读回，不覆盖其他版本；合并后新字节须受适用授权约束。授权绑定真实预配置bucket/prefix/origin、version/sourceRevision/candidateDigest、对象和发现新字节摘要，并覆盖适用的 R2 发现更新；旧Git repository-only授权不适用R2。

当前先复核本地内容构建。统一归档、Actions、R2 版本表维护、真实发布及相关验证在后续流水线范围处理，沿原任务和授权续接。

<details>
<summary>此前契约与历史接口（未被替代的保护和最终验收继续适用）</summary>

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

</details>
