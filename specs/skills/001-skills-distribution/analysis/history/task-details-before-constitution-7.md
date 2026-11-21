# 宪章 7.0.0 对齐前的未完成任务规划参考

2026-11-10 从本功能 tasks.md 的 40 项未完成任务提取旧详细做法，保留对齐前的设计依据、文件设想与风险信息。原任务的目标、依赖、约束、整体验收及已发生局部证据继续由 [tasks.md](../../tasks.md) 维护。

本文件是历史参考，旧八栏目中的执行指令及确认措辞不构成当前实施许可，也不证明已完成真实方案讨论、认可或保存。使用时须对照当前宪章、Spec、代码和证据重新核验，普通工程安排可按有效认可与现场调整。这里不维护工程 checkbox，不创建实施方案或子任务身份。

实际开工的适用方案按原 Task 一项一文件保存并读回，默认位置为所属 Spec 的 `implementation/<Task ID>.md`，由原任务链接；沿用已存在且仍适用的真实认可，不补造历史批准。

## T055

**原目标**：T055 [US7] 验证同源候选及身份替换拒绝，落点 `packages/skills/build/ci/candidate.mjs`。

**依赖**：T002、T051；复用现有构建与明确标注的合成夹具，不要求工程导出或完整技能源移交。

```text
1. **改动文件**：packages/skills/tests/distribution/pipeline-contract.test.mjs（追加候选范围）；packages/skills/build/ci/candidate.mjs（候选生成与独立核验）。
2. **改动内容**：验证 C3/C4 假设“同源码/依赖快照生成相同公开字节，替换候选不能取得发布资格”。用已交付构建能力从同一源码与依赖快照进行两次干净构建，payload 仅复制 release.json.files 加清单自身，候选索引和 CI 元数据放根外；对实际文件全集双向比较路径、长度、SHA-256。逐项替换公开文件、清单、version、源码 SHA、repository、run/attempt/artifact 身份、摘要、目标，覆盖 archive 缺失/过期、必需检查 failed/not-run/缺环境 skip，以及 development、缺 README/许可、额外 eval/MCP/源码 SKILL.md、链接/越界，均拒绝升级为 ready。引用 data-model 原文：“检查运行的实际仓库、完整源码 SHA、自有 SemVer；与清单严格一致”“精确定位可信默认分支成功检查，拒绝最新同名选择或其他 run/attempt 冒用”“release.json 原始字节 SHA-256”“所有公开文件（含 release.json）的排序路径、bytes、SHA-256；稳定计算候选摘要，完整集合与实际文件双向相等”“来源依赖快照与必需检查结果；必需 failed/not-run/缺环境 skip 阻止发布，允许的不适用项有理由”“仅 CI 证据元数据，计划 14 天且服从平台限制；不进入 Release 字节以免破坏构建可复现”“development/isolated/ready；不能通过改标记把缺项或开发样本变成可发布候选”。索引不得自含摘要。实验运行身份明确为 isolated，不能伪造真实 Actions 成功或正式 ready；保留校验器供 T058 增量接入。
3. **改动禁区**：不修改已固定候选以嵌入来源或修摘要；不执行发布、使用真实 token 或创建假平台记录；不把合成集合当正式获准来源。
4. **新建文件**：packages/skills/build/ci/candidate.mjs（稳定索引与独立候选核验）、packages/skills/tests/distribution/pipeline-contract.test.mjs（候选和 Git 演练单入口，由本 Task 新建）；本 Task 结果追加实际存在的 specs/skills/001-skills-distribution/analysis/acceptance/pipeline-local.md，不另建工程状态。
5. **写法约定**：document-changed-symbols；宪章 III/IV/V/VII；复用 build/distribution/verify.ts 及 validate.ts 的已验边界。执行包 lint/check-types/build、范围测试和受影响消费者检查；Markdown 保存后即时 ESLint 并读回。
6. **设计依据**：FR-038～040/043；SC-014/015；data-model ReleaseCandidate；contracts/pipeline 检查与候选准备。
7. **验收信号**：同一测试入口追加范围先记录缺能力失败，再实现；两次干净构建的公开路径及字节 100% 一致，所有字段/字节/检查/有效期反例非零且无公开写入；索引与 payload 分离，记录真实源码、快照及摘要。完整正式候选仍等待 T030/T031/T037 和实际支持范围检查。
8. **风险与回退**：构建漂移或替换漏检时停止 T056/T058 的依赖步骤，保留失败样本并回 plan 调整；既有构建、模型和无关交付继续保留，不恢复已撤回导出器。
```

## T056

**原目标**：T056 [US7] 验证隔离 Git 发布的授权、竞争和中断恢复，落点 `packages/skills/build/ci/publish.mjs`。

**依赖**：T055；目标仅为本次测试拥有的临时 bare Git，不依赖公开仓库或真实发布凭据。

```text
1. **改动文件**：packages/skills/tests/distribution/pipeline-contract.test.mjs（追加真实本地 Git 故障矩阵）。
2. **改动内容**：验证 C2/C3 假设“未授权不写入，同版并发/重试不覆盖不同内容，断连不抹去实际发布事实”。隔离 HOME、Git config/hooks/index/工作树覆盖，从已核验 payload 创建无源码父树的根提交，仅向自有 bare remote 无 force 创建 skills-v<version> 一个新 ref。实际演练未授权、只读目标、错候选/错目标、两次重试、两个同内容并发和两个异内容并发；逐文件核对现有 tag，一致复用原 SHA，任一不同拒绝。用真实 Git 写入后故障注入模拟响应丢失，再读回 ref 判定已写；注入远端错误文件和核验失败，保留此前完整版本、准确报告 publish 与 remote-verify。Publication 原文约束：“tag=`skills-v<version>`”“rawRoot 是 raw.githubusercontent.com 下同一完整发布 SHA 的文件根，officialSkillsRoot 是 github.com 下同仓库同 SHA 的 tree/skills 目录 URL”“源码 SHA 与发布 SHA 分别保存；发布提交树严格等于 payload，无源码父树，不包含 CI 记录、项目源码或多版本目录”。首次真实发布无旧版本时只使用明确标注的隔离多版本输入验证旧版恢复，不编造真实历史。保留发布器与故障骨架供后续复用。
3. **改动禁区**：simulate 拒绝真实 HTTPS/SSH 目标；Foundry 布局 publish 必须失败；不 force、不删除或移动旧 tag、不推源码分支、不执行候选脚本、不向日志/请求/候选写秘密。
4. **新建文件**：packages/skills/build/ci/publish.mjs（隔离及迁后复用的候选核验、Git 单 ref 发布与结果读回）；实际证据追加 specs/skills/001-skills-distribution/analysis/acceptance/pipeline-local.md。
5. **写法约定**：document-changed-symbols；宪章 III/IV/V/VII；contracts/pipeline 授权、Git 与恢复规则。执行包 lint/check-types/build、范围测试和受影响消费者检查，Markdown 即时 ESLint 并读回；参数通过进程参数数组传递，不拼接不可信 shell 字符串。
6. **设计依据**：FR-039～044；SC-015～017；data-model PublishRequest/Publication；plan 授权/竞争/中断前置实验。
7. **验收信号**：同一测试入口真实运行本地 bare Git；未授权/只读/错目标零新 ref，同字节重试和并发共用一个发布身份，异字节不覆盖；响应丢失读回后保留已写事实；旧 tag/SHA/字节及旧版隔离安装均实际核对。记录取消与子进程结果、故障点和未测边界，不将隔离结果记为真实平台通过。
8. **风险与回退**：出现越界写入、异内容覆盖或实际事实误报，停止 T058/T059 发布集成并回方案；保留所有现有版本和失败现场，不以删 tag 重试。
```

## T058

**原目标**：T058 [US7] 接通两种布局的工程驱动与完整候选门禁，落点 `packages/skills/build/ci/run.mjs`。

**依赖**：T055、T056；完整候选固定仍须 T037，驱动不能绕过原检查或发布校验。

```text
1. **改动文件**：packages/skills/build/ci/candidate.mjs、packages/skills/build/ci/publish.mjs；packages/skills/tests/distribution/pipeline-contract.test.mjs；packages/skills/package.json（必要的内部工程接线）。
2. **改动内容**：实现 contracts/pipeline 的 check/candidate/simulate/publish 四模式与适用参数 schema，显式 --package-root，仅 Foundry 子目录和 standalone 根包两种布局；未知/冲突/缺项/源码 SHA 不符在写出或推送前失败。复用候选与发布两个已验模块，完整 candidate 强制 T030 校验、T031 材料、同源双构建及全部必需检查，缺平台不能转 ready。publish 只用可信工具验证既存候选，禁止安装依赖、构建或执行 artifact 代码；Foundry 即使显式传 standalone 标记也拒绝真实目标。PipelineRun 引用原文：“字段为 schemaVersion、executionMode、trigger、repository/sourceRevision、toolchain、candidate、authorization（无秘密）、publication、stages、coverageLimits、retry”“阶段为 check/candidate/publish/remote-verify，各自 success/failed/skipped/not-run 并附 reasonCode；总体 success/partial/failed 仅概括本次请求，不承载 Task checkbox”。请求 executionMode 仅 isolated/standalone；standalone 要求迁后根布局、可信默认分支 workflow_dispatch、同仓库目标和实际维护者 write 权限，不信候选自报授权。远端读取与固定身份的两 URL 核对复用 candidate/publish 模块；日志、stdout JSON、stderr 进度与退出码可单独解析，当前 Foundry 的真实阶段记录 not-run/等待迁移。
3. **改动禁区**：不把 build/ci 放入运行 script 或 release.files，不新增终端用户子命令、安装核心或跨仓库服务；不借布局参数授予发布权；不修改原 .specify 状态或用户安装目录。
4. **新建文件**：packages/skills/build/ci/run.mjs（内部工程入口，与终端用户唯一入口职责分开）；实际证据追加 pipeline-local.md。
5. **写法约定**：document-changed-symbols；宪章 II/III/IV/V/VII；contracts/pipeline 参数与阶段契约。执行包 lint/check-types/build、范围测试和受影响消费者检查，Markdown 保存后即时 ESLint 并读回；沿 T055/T056 同一校验和发布器增量完善。
6. **设计依据**：FR-037～044；SC-014～017；data-model PipelineRun/PublishRequest；plan 两种显式布局与候选不变性。
7. **验收信号**：pipeline-contract.test.mjs 从真实 run.mjs 调用四种模式，合法请求结果与实际文件/ref 一致；错参数、冒用布局/身份、缺检查及 Foundry publish 均非零；候选通过与否、发布已发生/未运行及核验失败准确区分。T037 前只证明驱动与门禁，不能把开发/isolated 运行标记为正式候选通过。
8. **风险与回退**：参数与模块边界不一致先修原骨架；授权拒绝或阶段记录漏检，阻断 T059/T060，不以额外转发层或放宽完整发布检查求通过。
```

## T059

**原目标**：T059 [US7] 交付只读检查和迁后手动发布的 Actions 配置，落点 `.github/workflows/skills-check.yml`、`.github/workflows/skills-release.yml`。

**依赖**：T058；配置编写和隔离执行不依赖真实公开仓库，真实平台行为由 T061 核验。

```text
1. **改动文件**：packages/skills/build/ci/run.mjs（仅补 workflow 输入/输出）；packages/skills/tests/distribution/pipeline-contract.test.mjs；packages/skills/README.md（实际配置和迁移操作说明）。
2. **改动内容**：根 workflow 同时适用 Foundry 和迁后根包。check 使用 pull_request、默认分支 push 与 workflow_dispatch，路径覆盖技能、脚本、测试、构建、有效共享配置及依赖声明；调用既有工程驱动，PR 只有只读检查且不得生成可发布授权。可信默认分支成功检查才准备候选，artifact 保存精确 run/attempt/artifact 身份，计划 retention-days 14 并校验平台上限。release 仅默认分支有权维护者 workflow_dispatch；无写权限 guard 先检查真实布局、事件/ref、SKILLS_PROJECT_MODE 和同仓库 SKILLS_PUBLISH_REPOSITORY；Foundry 跳过真实 publish，驱动再次拒绝。发布 job 仅 contents:write，写 token 仅传可信推送步骤，checkout 不持久凭据，发布不安装/构建/执行候选；下载后重算摘要，不接受最新同名产物。concurrency 不取消运行中发布且仅辅助，最终依靠无 force 新 tag；远端安装验证 job 只读。实施时核验官方 action 的固定提交及输入语义并记来源；不得凭空填写 action SHA。隔离检查用实际 YAML 解析和真实驱动反例覆盖权限/事件/缺过期或替换候选，平台专有行为保留 T061。完整 workflow 随源码由用户直接迁移，在新仓库维护；不进入安装 payload。
3. **改动禁区**：不触发真实 Actions 发布、不建仓/配置真实 secrets、不使用跨仓库 PAT、不用外部贡献代码取得发布权限，不修改无关 create-iteration-artifacts workflow；不将隔离解析当平台权限已验证。
4. **新建文件**：.github/workflows/skills-check.yml（自动检查和可信候选准备）；.github/workflows/skills-release.yml（只读 guard、迁后授权发布与只读核验）。实际结果追加 pipeline-local.md。
5. **写法约定**：宪章 III/IV/V/VI/VII；contracts/pipeline 权限与触发；修改 JS 先加载 document-changed-symbols，Markdown 即时 ESLint。复用现有 YAML/Node 测试，执行包 lint/check-types/build、范围测试及受影响消费者检查。
6. **设计依据**：US7 场景 1/3/4/9/10；FR-037/039～043；SC-015/016；plan Actions 设计与 research 第 12/13 节。
7. **验收信号**：YAML 可解析、Foundry 与迁后根包两种布局的配置路径及调用真实驱动正确；PR/外部分支无发布 token，Foundry guard 与驱动双重拒绝真实 publish；必需失败/未验阻止候选升级，artifact 精确绑定及改字节反例非零。三平台/动态 Agent 矩阵所需检查有明确 job/证据入口，不以 Linux 代表全矩阵。尚未执行的真实平台权限、artifact 生命周期逐项列 T061 待验。
8. **风险与回退**：配置不满足契约时修对应 YAML/模块并重验；不能安全表达的权限边界返回方案，停止 T060/T061，不请求真实凭据绕过隔离缺口。
```

## T060

**原目标**：T060 [US7] 验收可迁移流水线与当前版本本地交付，落点 `specs/skills/001-skills-distribution/analysis/acceptance/pipeline-local.md`。

**依赖**：T037、T059；T037 固定包含完整技能与安装/挂载能力的本地候选，不等待 T052 真实规划反馈，T053/三暂停专项不在本期前置。

```text
1. **改动文件**：specs/skills/001-skills-distribution/analysis/acceptance/pipeline-local.md（原 T054 实验明确标历史；本项只追加当前实际交付结果）。
2. **改动内容**：以 T037 的实际源码/依赖/候选和 T059 workflow 复验本地检查与同源字节一致性；沿同一入口复验 T055/T056 的身份、权限、并发、重试、响应丢失和旧版保留。安装候选只有白名单，源码、CI、测试和依赖锁不混入安装根。迁移说明列清用户直接迁移的 skill、MCP 等源码、脚本、配置、测试和 workflow，以及在新仓库处理依赖/路径的调整项，不生成工程包或索引。Foundry 的真实 publish/remote-verify 继续等待迁移，真实公开目标零写入；独立工程运行由 T061 在迁后实际验证。本项不勾选 T061/T062/T032/T038、SC-016 整体或总体结案。
3. **改动禁区**：不自动迁移公开仓库、不写真实用户目录或触发发布，不用重新标签把 isolated 变 ready，不把历史失败无复验地宣称已修复。
4. **新建文件**：无固定新源码；pipeline-local.md 应在前置实际运行时已创建，缺失先核对记录保存情况；测试输出和候选只在自有隔离目录。
5. **写法约定**：宪章 II/III/IV/V/VI/VII；mvu-gate；contracts/pipeline 与 quickstart 本地隔离步骤；Markdown 保存后即时 ESLint 并读回。
6. **设计依据**：US7 场景 2/3/5/6/8/10；FR-037～044；SC-014～017 的本地部分；MVU-005 本地交付与总体结案分离。
7. **验收信号**：同一 pipeline-contract.test.mjs 和 run.mjs 的真实输出、本地必需检查、公开字节一致性及故障矩阵均可追溯；直接迁移范围和调整项明确，迁移前真实公开写入 0。必需未验不算通过；仅报告此任务范围通过，远端和独立用户条件清晰保留。
8. **风险与回退**：保存/校验失败保留已写与未写结果，返回实际模块修正；候选字节或源码变动回 T037 重建重验，不复用失效摘要。失败仅阻断依赖本地交付的迁后步骤。
```

## T061

**原目标**：T061 [US7] 核验迁后工程与真实平台候选前置，落点 `specs/skills/001-skills-distribution/analysis/acceptance/pipeline-remote.md`。

**依赖**：T060；另需用户已明确授权并完成项目迁移、实际独立公开仓库/默认分支及可读运行记录。当前调用不提供迁移、配置或发布授权，条件未满足时保持待办。

```text
1. **改动文件**：无预设工程修改；发现迁后差异先定位并按原 Task/方案调整，不临时编辑已核验候选。
2. **改动内容**：核验独立仓库根源码、配置、完整依赖和 workflow，读取真实默认分支/仓库/维护者权限及 SKILLS_PROJECT_MODE=standalone、SKILLS_PUBLISH_REPOSITORY=当前仓库配置。以迁后实际源码 SHA 重新运行只读 PR/默认分支 check，在无 Foundry 工作区的真实 Actions 环境准备新候选，不沿用 Foundry 候选身份或授权。核对实际 job 权限、PR 无发布凭据、可信成功 run/attempt/artifact 与过期/缺失处理；在无写权限的真实平台校验步骤提交错误摘要/身份或过期归档输入，确认拒绝且未进入发布 job。真实过期无法当场产生则保留未验和继续条件，不用合成时间充当平台过期证据。记录 C2/C4 平台假设的事实、真实输入/日志和成功/拒绝信号，新源码/候选与两次干净构建摘要完整关联，后续 T062 才允许实际发布。
3. **改动禁区**：不擅自创建远端、迁移、改平台变量/凭据或触发写权限发布；不执行候选代码取得写权限，不用本地 YAML 或 bare Git 结果抵扣真实平台，不把缺输入记录为通过。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/pipeline-remote.md（仅实际迁后操作后创建，保存真实平台检查、候选与限制）。
5. **写法约定**：宪章 III/IV/V/VI/VII；mvu-gate；contracts/pipeline 迁后权限与候选身份；Markdown 即时 ESLint、读回；实际 Actions 工具和调用按迁后仓库能力核验，不编造运行 ID。
6. **设计依据**：FR-037～040/043；SC-014～016；plan 第四组 C2/C4 前置；data-model ReleaseCandidate/PublishRequest。
7. **验收信号**：真实默认分支 Actions 成功检查与对应新候选文件/摘要可读；迁后独立构建无 Foundry 依赖；真实权限、来源身份和拒绝场景均有日志，未授权/错候选零发布。必需平台前置未验不得推进 T062；本项不声明已真实发布或 SC-016 整体通过。
8. **风险与回退**：缺仓库、配置、权限、平台范围或 artifact 证据保留未完成，仅阻断 T062 及远端依赖；任何源码/身份变化重新准备新候选，旧版本与已验本地事实保留。
```

## T062

**原目标**：T062 [US7] 在获授权的独立仓库首次发布并核对固定来源，落点 `specs/skills/001-skills-distribution/analysis/acceptance/pipeline-remote.md`。

**依赖**：T061；另需维护者对指定 version/sourceRevision/runId/runAttempt/artifactId/catalogDigest/candidateDigest 和同仓库目标的实际手动发布授权及所需短期凭据。生成本任务不构成授权。

```text
1. **改动文件**：specs/skills/001-skills-distribution/analysis/acceptance/pipeline-remote.md；specs/skills/001-skills-distribution/analysis/acceptance/release-source.md（与 T032 共享的发布根外来源证据）。
2. **改动内容**：迁后维护者从可信默认分支明确触发 release，运行前核对 T061 新候选全部必需检查与真实身份。可信发布 job 不重建/不执行候选，只创建候选独立树的 skills-v<version> 新 tag；只读核对完整发布 SHA 的 release.json 及全部文件，root 不含源码/CI/测试/多个版本目录。rawRoot 与 officialSkillsRoot 同仓库同发布 SHA，记录实际 URL、源码/发布 SHA、version、catalogDigest/candidateDigest、README 摘要与展开命令；在无写凭据的隔离目标从真实来源验证两入口同版本四选择及适用挂载，支持范围的完整矩阵仍由 T038 承接。核对同版本两次实际重试复用；两个请求的底层并发反例复用 T056，真实 Actions concurrency 的排队/取消事实单独记，不声称所有 pending 都完成。已有真实旧完整版本时按固定 SHA 隔离复验并保留用户修改；首次无旧版本引用 T056 的隔离恢复证据并明确真实历史未验，不为制造旧版另行发布。本 Task 不抵扣 T032 的真实独立使用者或 T052 的真实规划反馈；T053/三暂停专项排除。 首次尚无真实旧公开版本时，完成 T056 的隔离多版本恢复及本次真实发布/远端核验，可以按本 Task 的首次发布范围验收；这不满足 SC-017 的真实旧版本复验。该未验部分明确由 T038 承接，T038/T040 保持相应未完成条件，不为补样本擅自另发版本。
3. **改动禁区**：未获本次实际授权不触发；不在 Foundry 真实发布、不跨仓库、不扩大凭据权限、不 force/移动/删除旧 tag，不修改候选或伪造远端核验、真实旧版及用户反馈。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/release-source.md（若已存在则增量记录真实发布身份，不覆写旧证据）；pipeline-remote.md 复用 T061，不另建状态系统。
5. **写法约定**：宪章 III/IV/V/VI/VII；mvu-gate；contracts/pipeline 授权、Git 与恢复、quickstart 迁后步骤；Markdown 即时 ESLint 并读回。外部写入严格限已授权候选和目标。
6. **设计依据**：FR-039～044；SC-015～017；US7 场景 4～10；data-model Publication/PipelineRun。
7. **验收信号**：真实 Actions run/attempt、授权请求、唯一新 ref、完整发布 SHA 及全部远端文件摘要一致；两入口同身份实际安装/适用挂载结果可追溯，发布/远端验证/独立用户验收分别报告。真实故障若未发生不伪造，故障保护引用 T056 的适用证据；SC-016/017 的整体核对仍保留 T032/T038/T040 的原条件。无完整远端核验，或缺少首次发布必需的 T056 隔离恢复证据时，本 Task 保持未完成；若已有真实旧公开版本，还须记录其固定来源恢复结果。首次无真实旧版本只允许判断本 Task 的首次发布范围，SC-017 的真实历史条件在 T038 继续待验，不提前完成 T038/T040。
8. **风险与回退**：tag 已写而核验失败，准确报告已发布与核验失败/partial，保留实际 ref/SHA、错误和重试条件；不回写成零发布或删除 tag。候选需变更时新版本重新检查授权发布；只暂停相关远端验收，既有完整版本不变。
```

## T012

**原目标**：T012 [US1] 将完整目录、投影和清单接入正式构建，落点 `packages/skills/build/distribution/export.ts`。

**依赖**：T010、T011；完整集合作为整体验收还需工作流基座 T073/T074 的同版来源及消费契约移交，通用骨架的既有局部证据保留。

```text
1. **改动文件**：packages/skills/build/distribution/export.ts；packages/skills/build/plugins/distribution.ts；packages/skills/vite.config.ts；packages/skills/package.json。
2. **改动内容**：增量完善 export 的构建期目录读取与投影逻辑，以 MVU-A 的独立预期样本校准；构建不导入或调用 script 模块，递归输出同版获准技能的全部必要文件；生成稳定release.json和Eve blob，tools.skills 声明 latest、投影标识 eve-frontmatter-v1；原样交付 script/install-skills/read-agents.mjs 并纳入 files/adapters，不读取或重建 agents.json 和独立声明目录，拒绝重名、失效本地附件、越界、未公开依赖及官方会过滤的必需附件。sourceRevision由构建来源给出，项目prerequisite独立记录；公开根/分类根不得出现重复 SKILL.md；不导出固定扩展 payload。沿用单次 build，输出 mcp/skills/script、release.json 与 projections，MCP 清单独立生成，不读取线下 eval；内容导出沿用 T051 已验证的同一实现；安装平台模块沿用 T004/T041，完整工具消费仍由 T008 核验；此时只认定US1内容构建，下载/挂载的最终业务验收分别由后续故事完成；缺少README或许可证等交付材料时开发构建记录缺项，完整发布校验必须拒绝。 最终整包交付前核对主线同版获准来源：仅 Increment、所选准备/分析/结案 hooks，删除六旧技能及旧 Review/Guide/Explore 有效分发；禁止将旧数量或占位正文当成新集合。通用导出实现可先用已存在的稳定技能验证，完整来源缺失时该验收项保持未完成，复用主线 T073 的实际交付记录。 本轮替代旧集合：只保留Increment模式，按主线正式范围消费implementation-preparation、artifact-spec-analysis、artifact-project-description及实际附件；缺三暂停来源不作依赖，暂停源码/dist复制与公开清单分别核对。引用Release约束“首版 1；不支持的格式拒绝执行”“每项相对路径、字节数、SHA-256”“skills=latest、specify=1.2.6、唯一入口 Node ≥22.20.0 与平台 shell 下限”“identity 与 eve-frontmatter-v1 的实际安装文件摘要”；Release结构与跨引用仍经已交付validate校验。
3. **改动禁区**：不手改源SKILL以绕过失败；确需修正文中失效附件路径时先列出精确文件及证据，按宪章VII补做法并确认；不改技能协作规则。
4. **新建文件**：无新增产品文件；packages/skills/build/distribution/references.ts 已存在，复用其引用/依赖扫描。新测试fixture只在已声明 tests/distribution 范围按实际反例增加，不生成占位skill。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-001～006/008/025；contracts/distribution。
7. **验收信号**：pnpm --filter @foundry/skills run build；后续发布选择精确覆盖公开同版获准技能，当前 dist/skills 保留全部线下技能，MCP 清单只来自 src/mcp；缺附件夹具构建失败；US1完整附件断言通过。 对准备正文/附件/hook声明与Increment有效映射做完整清单/投影断言；不得因旧四项缺失使当前集合失败，正式准备/分析来源缺失仍保持整体验收未完成。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T013

**原目标**：T013 [US1] 实现官方安装前只读选择和冲突检查，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T012。

```text
1. **改动文件**：packages/skills/script/install-skills/install-skills.sh；packages/skills/script/install-skills/install-skills.ps1；packages/skills/script/install-skills/read-agents.mjs；packages/skills/vite.config.ts。
2. **改动内容**：实现--check --official：version必填，source与source-dir必须且只能提供一个、all/category/names三选一、skill重复合并、依赖不补装、参数全量验证和目标冲突检查。按原文“selector 为 all/category/names 三选一；name 数组去重后仍保留稳定顺序。”“一次调用只接受一个目标 agent；官方 CLI 自身的多 agent 能力不受此限制。” 通过既有只读读取器在线解析官方 npm latest，校验同包规则和完整性；不依赖 agents.json 或独立声明目录。输出本次解析版本和显式已核验名称的原生命令或已满足建议，不启动npx、不创建锁/收据/暂存；混合未知名不得安装有效子集。 按 contracts/pipeline 的来源映射补齐远端预检：仅从已验证 raw.githubusercontent.com/<owner>/<repo>/<完整发布SHA> 派生同仓库同 SHA 的 github.com tree/skills 目录建议，分类/单技能按清单追加路径；不支持的来源转换明确拒绝，不把 raw 目录直接当官方来源。 本轮所选名称取当前正式获准集合；不为旧四项齐备扩大选择，三暂停入口不作为推荐可用模式；只读预检不因为同名旧安装而跳过本次来源核验。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：无；在既有平台脚本中增量完善上述职责，复用已交付的只读数据适配器，不新增安装核心或转发层。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-005～011/017；contracts/install；data-model InstallRequest。
7. **验收信号**：US1输入测试通过；目标树前后摘要一致，--list来源正确，已有内容冲突不输出可执行安装建议；静态错误退出2；分别覆盖缺version、两种来源均缺失、两种来源同时提供及版本不匹配，均退出2且目标零写入；version加单一合法来源才进入选择核验；在线获取/完整性/规则布局失败目标零写入且无可执行建议，报告 upstream.version/integrity 与建议 CLI 同版；只验证所选 agent/scope，不冻结数量。 增补 raw→tree 的正反例、错仓库/错 SHA/滚动 ref 拒绝和目标零写入；真实克隆/安装由 T062/T032/T038 留证，本地转换通过不等于远端通过。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T014

**原目标**：T014 [US1] 交付官方四粒度说明和两步入口边界，落点 `packages/skills/README.md`。

**依赖**：T013。

```text
1. **改动文件**：packages/skills/README.md；packages/skills/build/distribution/export.ts（复制已有 README 源）。
2. **改动内容**：编写发布README源的官方安装章节：只读预检→原生安装是第一步，显式mount是第二步；使用目录 URL 和本次已核验的显式技能名称，skills CLI 版本来自同次在线解析，区分--global/agent，推荐--copy；说明上游覆盖行为、并发窗口、额外推荐需拒绝和实际路径核验。公开URL未给时明确占位，不写成已可运行。 明确 RELEASE_SOURCE 是 raw 文件根，官方目录来源是同仓库同完整发布 SHA 的 tree/skills URL；二者由已验身份绑定，不能混用。 更新仅Increment与准备/分析/结案hooks的选择、适用挂载和明确第二步示例，移除三暂停模式补齐/注册/重装命令；保留四种技能选择语义、唯一Node入口和具体失败/未验说明。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：无；扩充现有 packages/skills/README.md，不重建 distribution 目录。
5. **写法约定**：遵循宪章V/VII与contracts/install；文档简体中文；若修改export.ts先加载document-changed-symbols。
6. **设计依据**：FR-006/009/017/024；US1可独立使用文档。
7. **验收信号**：逐例核对四粒度命令，未把官方--all当技能全选，未给官方添加本包参数；Markdown ESLint通过。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T015

**原目标**：T015 [US1] 验收官方完整目录交付MVP，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us1.md`。

**依赖**：T014。

```text
1. **改动文件**：无。
2. **改动内容**：在独立副本运行四粒度及只读列出，核对同版获准技能集合、附件、增量保护、未知与依赖错误；将实际版本、命令、文件差异和受限平台写证据。只验官方文件交付，不要求调用挂载或启用hidden。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/us1.md。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：US1；SC-001～003；MVP检查点。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --story US1；完整率100%、未选新增0、已有其他技能不变；目标包最低检查通过。全矩阵最终由T038统一核验，本地MVP不冒充公开发布。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T016

**原目标**：T016 [US2] 补齐下载入口、冲突与恢复测试，落点 `packages/skills/tests/distribution/install-contract.test.mjs`。

**依赖**：T015。

```text
1. **改动文件**：packages/skills/tests/distribution/test-distribution.mjs。
2. **改动内容**：复用MVU-B编排四选择、增量、断网/写入中断、未知同名/用户修改/已跟踪、重复、global不支持及JSON退出码断言。先记录缺失正式实现的失败；测试不写真实用户目录。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/install-contract.test.mjs。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：US2；FR-007/009～011/022/023。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --story US2；记录各未实现断言红灯，保证原用户fixture可比对。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T017

**原目标**：T017 [US2] 完善同版本材料下载和完整性校验，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T016。

```text
1. **改动文件**：packages/skills/script/install-skills/install-skills.{sh,ps1}；packages/skills/build/distribution/validate.ts。
2. **改动内容**：完成HTTPS固定提交来源与source-dir解析、清单版本校验、逐文件下载、摘要/长度核对、超时及重定向协议约束。脚本与公共工具只用同一catalogDigest；路径规范化后检查边界，不解压归档、不回退latest、不暴露凭据。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：无；在既有平台脚本中增量完善上述职责，不新建 Node 转发层或运行核心。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-010/011/018；contracts/install内容获取。
7. **验收信号**：US2网络故障夹具无残缺提交；source与source-dir互斥；版本不符、越界和非HTTPS均拒绝；不能从本地source-dir结果声称远端通过。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T018

**原目标**：T018 [US2] 实现归属收据与安全逐技能提交，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T017。

```text
1. **改动文件**：packages/skills/script/install-skills/install-skills.{sh,ps1}；packages/skills/build/distribution/models.ts。
2. **改动内容**：完善同文件系统暂存、根锁、提交前目标复查、复制、收据与中断重验。落实原文“未知同名目录即使内容碰巧相同也不能由 curl 自动取得所有权”；“收据不可信任为唯一事实，重试必须重验文件”；“无归属证据的中断目录视为冲突，不能自行删除。” 收据置于技能根外侧.foundry-distribution/receipts/<name>.json，保存source/version/catalogDigest/agent/scope/路径和文件摘要。逐项状态为“pending → staged → verified → installed/reused，任一步可 failed；未轮到的项为 not-run”。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：无；在既有平台脚本中增量完善上述职责，不新建 Node 转发层或运行核心。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-011/022；data-model InstallReceipt与状态机。
7. **验收信号**：US2重复两次不重复写入，未知/不同版/用户编辑/跟踪目标保持哈希；部分提交后故障仍列出完整成功、失败及未执行，只有完整集合向下传。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T019

**原目标**：T019 [US2] 交付Bash与PowerShell安装四件套，落点 `packages/skills/script/install-skills/install-skills.sh`。

**依赖**：T018。

```text
1. **改动文件**：packages/skills/script/install-skills/install-skills.sh；packages/skills/script/install-skills/install-skills.ps1；packages/skills/script/install-skills/install-skills.{sh,ps1}；packages/skills/vite.config.ts；packages/skills/build/distribution/export.ts。
2. **改动内容**：直接完善双 shell 参数解析、平台前置检查、公共工具核验和安装正式分支；唯一公开入口要求 Node ≥22.20.0，按系统调用本双 shell 实现；官方 skills 的运行环境单独检查；命令入口copy安装，project默认cwd，global显式且不回退。补shell分发测试和README；引导失败不得继续执行不完整脚本。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/test-install-skills.mjs（双平台安装分发测试）；既有 packages/skills/script/install-skills/README.md 增量更新，不重复新建。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-009/021/023；scripts/dev/actions/link-skills四件套惯例。
7. **验收信号**：node --test packages/skills/tests/distribution/test-install-skills.mjs；三平台分别记录实际 shell 与所需工具版本，官方 skills 的 Node 基线单独记录；缺pwsh记skip而非Windows通过。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T020

**原目标**：T020 [US2] 实现阶段报告、退出码与续接提示，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T019。

```text
1. **改动文件**：packages/skills/build/distribution/models.ts；packages/skills/script/install-skills/install-skills.{sh,ps1}。
2. **改动内容**：定义完整RunReport并接入安装：schemaVersion/request/resolvedRelease/upstream/skills[]/stages/overall/retry[]/coverageLimits[]。upstream 保留本次在线解析的 package="skills"、channel="latest"、version、integrity；version 与本次实际规则和官方建议命令一致，不使用旧来源锁。按原文“阶段枚举 success/skipped/failed/not-run，附机器 reasonCode 和中文说明；overall 为 success/partial/failed。” “报告默认输出 JSON 至 stdout，进度写 stderr；不默认写项目报告文件。” 显式--report已有路径拒绝覆盖且不隐藏。请求步骤失败退出非零，参数2、运行或部分失败1，无失败0；缺项目的global安装保留成功。 对PreparationDelivery/ManagedMigration只沿RunReport保存消费与本次迁移事实，未知路径调用前停止、loadEvidence缺失和官方已写后读回失败分别有reasonCode与coverageLimits；不新增工程状态或持久指纹。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/report.test.mjs。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-022；data-model RunReport；contracts/install返回。
7. **验收信号**：US2报告逐项匹配实际树，stdout可单独JSON解析；双平台安装和官方只读预检均断言 upstream 的四个字段与本次实际包一致，后续调用重新解析而不复用旧版本；模拟后置失败overall为partial；无请求后续步骤标skipped，未轮到标not-run，不用同一成功布尔值概括。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T021

**原目标**：T021 [US2] 验收双入口内容等价与安装恢复，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us2.md`。

**依赖**：T020。

```text
1. **改动文件**：无。
2. **改动内容**：用同发布源和scope比较官方与curl的identity/Eve实际文件全集，四选择、冲突与连续两次重试；纯安装传--no-mount以独立验收。记录实际三平台证据与各阶段事实，保持其他技能。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/us2.md。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：US2；SC-002/003/006/007。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --story US2；相同agent投影差异0，失败场景部分成功误报0，所有既有用户文件保留；最低工程检查通过。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T006

**原目标**：T006 [US3] 验证 MVU-D：仅 Increment、实施准备加载及旧入口受管迁移，落点 `packages/skills/tests/distribution/mvu-d.mjs`。

**依赖**：T005、T041；外部须有主线正式同版 task-increment、implementation-preparation、分析/结案配置、注册器和当前消费契约的实际移交。原 T073/T074 只作历史定位，不要求三暂停模式，也不等待本 Spec 行为回填。

```text
1. **改动文件**：packages/skills/tests/distribution/test-distribution.mjs；packages/skills/script/mount-entry/mount-entry.sh、mount-entry.ps1；packages/skills/script/register-hooks/register-hooks.sh、register-hooks.ps1（仅实验必需的所选输入及保护骨架，后续原任务在同文件增量完善）。register-commands 双平台只消费主线同版移交，不另造第二份注册器。
2. **改动内容**：验证 plan D-MOUNT/D-PREP 的 C2/C3/C4 假设：指定并记录官方 Specify 1.2.6，在隔离用户/缓存与独立已初始化项目建立旧三/四/五入口集合；读取旧登记、受管路径、核心入口、无关扩展和普通用户哨兵摘要。由已交付脚本经官方同 ID modes --force 缩为 Increment，再连续重试两次；缺三个暂停来源不阻塞。另在受管目录加入未知附件/用户维护文件或注入登记缺失、损坏、归属不明，包装流程须在破坏性官方调用前停止、报告精确路径且目标零变化。官方原始删除风险只在可丢弃样本另记，不能算产品通过。用正式同版准备正文/必要附件/配置及所选分析/结案来源验证 hooks-only；缺正文、附件、声明或错版本在首个官方调用前失败；hooks 失败后 commands 未运行。原始与安装投影按全文件摘要，官方生成入口按身份、有效正文、附件引用可读性核验。在无业务执行目标的适用宿主实际完整读取准备内容，不发起实现；讨论确认/逐 Task 门禁由主线另验。按当次 skills 与 Specify 实际集成交集逐项留证，缺环境不计通过；通过后保留同一输入构造、保护与文件核验骨架。
3. **改动禁区**：不修改当前真实项目或用户目录、不伪造宿主加载、不手写 registry/生成入口、不新增模式别名/Implement 包装或自有 YAML 合并；不自动移动/删除未知附件，不引入永久指纹/所有权服务，不以旧四项/七 hooks 或模拟 CLI 正常输出来抵扣实际官方操作。
4. **新建文件**：packages/skills/tests/distribution/mvu-d.mjs（唯一 MVU-D 风险入口）；specs/skills/001-skills-distribution/analysis/acceptance/mvu-d.md（实际运行后保存命令、版本、输入、前后差异及未测项）。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：plan D-MOUNT/D-PREP；MVU-003 与原技术 MVU-D；FR-019～022/028～030/045～047、SC-005～007/010/018；quickstart D、contracts/mount 及主线正式注册契约。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --mvu D；旧三暂停/退役活动入口残留和两次重试复活均为0，Increment 可用，核心入口、无关扩展及用户哨兵完整率100%。未知内容/缺件/错版反例在官方调用前失败且目标零写入；hooks 失败后命令调用0。准备正文、附件和 hook 与同次 Release/投影对应，官方注册及实际完整加载分别有证据。来源未交付、无宿主或平台缺失保持未验，不能因命令文件存在通过。
8. **风险与回退**：任一保护、原生兼容或实际加载假设失败，停止 T022～T028 中依赖该假设的实施/验收，保留失败现场并回 plan 调整；无关候选/Git 隔离工作可继续。成功骨架保留供下游增量使用，不推倒重写。
```

## T022

**原目标**：T022 [US3] 补齐挂载范围、前置条件及原生冲突测试，落点 `packages/skills/tests/distribution/mount-contract.test.mjs`。

**依赖**：T021、T006；D-MOUNT/D-PREP 的正式同版来源与必要风险验证通过后再扩产品契约。

```text
1. **改动文件**：packages/skills/tests/distribution/test-distribution.mjs。
2. **改动内容**：在 MVU-C/D 原骨架扩充仅 Increment、自身缺件/错版、缺三个暂停来源仍可挂载、旧集合迁移与两次重试不复活、hooks 失败 commands=not-run、未知附件调用前停止、历史 workflow 不触发、关闭、非 Spec Kit、缺项目/工具/default/兼容条件和官方成功但缺产物。覆盖准备/分析/结案所选配置与完整附件、两入口等价；不要求三暂停模式行为或学习/报告。先记录缺正式实现的红灯，不删原保护断言。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/mount-contract.test.mjs。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：US3；FR-016～023/027～030/045～047；SC-005～007/010/018；contracts/mount 与 quickstart D。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --story US3；全部负例命中明确缺项/未接通点，未知内容保持，未选/暂停来源不被补装；实际官方与宿主结果不由模拟 exit0 代替。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T023

**原目标**：T023 [US3] 实现本次集合与统一挂载环境核验，落点 `packages/skills/script/mount-entry/mount-entry.{sh,ps1}`。

**依赖**：T022。

```text
1. **改动文件**：packages/skills/script/mount-entry/mount-entry.{sh,ps1}。
2. **改动内容**：沿同一核验骨架完善 VerifiedSkill、MountTarget 与迁移前只读清点。引用原约束“项目级默认 cwd；全局没有隐式挂载项目。非 Spec Kit 为 skipped，已有 Spec Kit 但工具/版本/集成不符为 failed。” 本次 Selection 不从历史目录推导；核对实际入口/解析路径、完整文件摘要、版本，官方第二步 installed-root 内部推导，不能只信收据或退出码。按原生 status/init-options/default 和当次实际集成交集核对；symlink 只读验证不跟随写入。对官方登记及明确受管受影响路径一次清点；未知附件、用户维护文件、归属不明或登记无法确认时，受影响官方调用前停止并保留现场，报告路径、已完成/未执行及恢复条件；不扩大为整目录扫描或永久所有权服务。PreparationDelivery 只记录“skillName、releaseVersion/catalogDigest、正文与实际必要附件的文件摘要、hook 事件/extensionId、生成入口及引用路径、loadEvidence 和 coverageLimits”，不是工程状态或另一持久格式。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/mount-context.test.mjs。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-018/019/023/030/045/047；data-model VerifiedSkill/MountTarget/PreparationDelivery/ManagedMigration；contracts/mount 保护边界。
7. **验收信号**：US3 核验用例通过：错版/缺件/default不符、未知附件/登记不明均在受影响原生写调用前失败，目标树与用户内容不变；global缺project保留安装事实，projectPrerequisites缺失给具体条件。缺三暂停来源不属于 missingSelection/missingFiles，loadEvidence缺失不报告加载通过。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T024

**原目标**：T024 [US3] 对齐所选准备/分析/结案映射与 Increment 输入，落点 `packages/skills/script/mount-entry/mount-entry.sh`。

**依赖**：T022、T023；与 T023 共改 mount-entry，必须串行。主线已正式移交三个所选来源的同版正文、配置及实际附件，未交付不本地代造。

```text
1. **改动文件**：packages/skills/script/mount-entry/mount-entry.sh、mount-entry.ps1；packages/skills/build/distribution/export.ts、models.ts（仅现有映射消费确需调整的声明）。只读主线 packages/skills/src/skills/workflow/implementation-preparation/speckit-hooks.json、artifact-spec-analysis/speckit-hooks.json、artifact-project-description/speckit-hooks.json，不在分发任务重写工作流业务。
2. **改动内容**：仅从本次所选实际已安装技能同目录 speckit-hooks.json 读取事件→条目数组：implementation-preparation 的 before_implement、artifact-spec-analysis 的 after_tasks、artifact-project-description 的正式结案事件；Increment 仍显式复用同一分析，无 after_increment。extensionId 沿技能标识；引用“命令组仍为 modes，成员仅 task-increment；选择、正文、附件和版本满足后注册，不要求三个暂停模式。” 需要规范化安装投影时仅为已选/已核验 Increment 准备完整临时根，维护来源候选位置依主线正式契约，不从发布包补未装技能；bug-report无命令映射。更新旧五项识别、四项补齐和重试提示，准备能力不包装 Implement，不把主线未提供附件名硬编码。Release/mountMappingIds 与实际有效集合一致；不发布包根扩展或集中 definitions。
3. **改动禁区**：不擅自修改三个主线 skill/hook 的讨论与执行规则，不引入三暂停来源依赖、额外命令、公开子命令、包根 extension.yml、固定 extensions、mounts.json 或替代状态；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/mount-mapping.test.mjs。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-020/021/028/029/045/047；data-model MountMapping/PreparationDelivery；contracts/mount 当前表与主线同版注册契约。
7. **验收信号**：packages/skills/tests/distribution/mount-mapping.test.mjs 通过；事件/extensionId取实际同版技能配置，正文及必需附件完整进入发布/安装投影；hooks-only provides:{}且不生附加命令；仅所选 Increment 完整即构造输入，无三暂停来源不阻塞，无 Increment 则 commands=skipped，自身缺项则 failed，未选技能不补入。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T025

**原目标**：T025 [US3] 完善独立 hook 平台安装及官方重装，落点 `packages/skills/script/register-hooks/register-hooks.sh`。

**依赖**：T023、T024。

```text
1. **改动文件**：packages/skills/script/register-hooks/register-hooks.sh、register-hooks.ps1、README.md；packages/skills/tests/test-register-hooks.mjs、test_full_remount.py；packages/skills/build/distribution/export.ts（仅交付核验接线）。
2. **改动内容**：复用同一 hooks-only 平台实现，收缩旧固定七项前置并支持本次所选有效来源。引用“缺必需配置在本批首次官方调用前失败”；所有正文/附件/配置预检后按技能标识逐项官方 add --dev --force，受管字段按来源覆盖，无自定义合并或等价跳过；未知内容保护复用 T006/T023 已验骨架。官方后读回事件、extensionId、有效正文和引用附件，保留实际已写事实、失败和未执行；hooks失败停止后续指令。具体主线 hook 声明原样消费，不硬编码 Foundry 治理/个人路径，不把登记等同宿主完整加载。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：无；增量完善已有包内测试和说明。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-019～022/029/030/045/047；D-PREP；contracts/mount hooks-only 与官方重装规则。
7. **验收信号**：node --test packages/skills/tests/test-register-hooks.mjs；适用 Python 回归按包现有入口执行并记录。所选配置变化反映下次官方输入，缺件/错版/未知内容零破坏性调用；仅选准备可完成适用注册且不要求其他未选来源，所选无关扩展语义不变，重复无多余条目，构建不含 definitions；宿主实际完整加载仍在 T028 单独留证。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T026

**原目标**：T026 [US3] 消费仅 Increment 的双平台注册器并验证旧入口迁移，落点 `packages/skills/script/register-commands/register-commands.sh`。

**依赖**：T025。

```text
1. **改动文件**：packages/skills/script/register-commands/register-commands.sh、register-commands.ps1、README.md；packages/skills/script/mount-entry/mount-entry.sh、mount-entry.ps1；packages/skills/tests/test-register-commands.mjs、test_register_commands.py；packages/skills/build/distribution/export.ts。
2. **改动内容**：先核对主线正式移交后的实际脚本，复用其同一 modes/Increment 实现；若仍为四项先报告移交缺口，不复制另一套注册器。按已确认范围完成实际独立交付所需的输入/调用修正及说明，保持 --project/--skills-dir/可选--cli，无 --mode 或包装 Implement。本次 FOUNDRY_SPECIFY_VERSION 或默认1.2.6，必要时核实--cli实际版本；先hooks后commands由公共入口控制。每次官方--force重装仅speckit.modes.increment，临时输入、来源正文及附件随平台生命周期清理；旧三/四/五集合实际迁移复用T006验证，重试不复活。
3. **改动禁区**：不重写主线技能业务、不新增别名/实施引擎/第五入口，不让三个暂停来源成为前置，不手写 registry/生成文件，不使用指纹、旧modes等价跳过或整目录prune，不为恢复未知内容擅自移动用户文件。
4. **新建文件**：无；已有双平台注册脚本、README 与 Node/Python 测试均增量复用，缺正式移交就报告具体缺项。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-020～022/025/028/030/046/047；D-MOUNT；contracts/mount 当前入口与未知内容保护。
7. **验收信号**：node --test packages/skills/tests/test-register-commands.mjs；适用包 Python 测试记录真实版本。单选 Increment 且缺三个暂停来源可正常官方重装，连续两次重试无重复/复活，源更新/缺入口刷新；旧暂停及退役活动入口残留0，未知用户附件触发受影响调用前停止，核心及无关内容不变；独立脚本与源同版，成功失败均清理本次临时输入。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T027

**原目标**：T027 [US3] 接通公共入口、官方第二步与curl自动挂载，落点 `packages/skills/script/mount-entry/mount-entry.sh`。

**依赖**：T026；复用 T006/T023 的保护骨架、T024/T025 的正式所选配置及 T019/T020 已验安装/报告，不跳过 D-MOUNT/D-PREP。

```text
1. **改动文件**：packages/skills/script/install-skills/install-skills.sh、install-skills.ps1、README.md；packages/skills/script/mount-entry/mount-entry.sh、mount-entry.ps1、README.md；packages/skills/script/index.mjs（仅真实参数/调度适配需要时修改）；packages/skills/build/distribution/models.ts、export.ts；packages/skills/README.md；scripts/dev/nuxt-prepare/nuxt-prepare.sh、nuxt-prepare.ps1、README.md；scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs。scripts/dev/actions/register-hooks 的双平台包装及README仅在实际调用契约变化时调整，先查调用点。
2. **改动内容**：完成 D-CHAIN：核验→所选适用hooks全部成功或不适用→Increment，curl只传本次完整成功集合且公共入口重验；官方安装后显式第二步取得同版公共材料并走同链。修正实际旧五项识别、四项前置及默认workflow unsupported，沿安装双平台接入，不把Node扩成安装核心。条件为本次来源workflow且未no-mount，不看历史目录。MountResult按原文“hooks 失败则 commands=not-run；无 Increment 选择为 skipped，所选来源不完整为 failed，缺三个暂停模式不算失败。” 记录同版文件、官方注册、生成语义/附件与实际加载证据及限制，不以退出0或原文件字节代替原生结果。工作区两平台保持来源/复制→所选hooks→Increment顺序及前置失败阻断，说明和重试不再复活暂停入口；link-skills源复制不等于旧入口已清理。
3. **改动禁区**：不执行当前工作区真实postinstall或用户目录迁移，不给官方CLI传本包参数，不写项目级工作流路由，不修改其他workspace或主线讨论规则，不在安装/加载检查中实际发起业务实现，不扩大--no-mount或未选来源的写入范围。
4. **新建文件**：packages/skills/tests/distribution/test-mount-entry.mjs（两入口/阶段报告及调用链测试）；其余脚本和README已存在，增量修改。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：D-CHAIN；FR-016～023/028/030/045～047；data-model MountResult/RunReport；contracts/install、mount；实际 nuxt-prepare 调用链。
7. **验收信号**：node --test packages/skills/tests/distribution/test-mount-entry.mjs；node --test scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs。独立产物经唯一Node入口两路径同集合/同版本得到相同适用结果；仅Increment/缺三暂停来源成功、关闭和历史workflow不触发、global无project保留installation成功但挂载失败、hooks失败commands未执行。工作区自有夹具副本验证前置失败不注册命令，重试不复活；未实现平台/宿主结果单列，不能用模拟原生成功替代T028实际验收。
8. **风险与回退**：D-CHAIN任一阶段串联、报告或保护失败，停止T028及依赖公共交付的T029/T063等步骤，保留安装成功与实际已写/未执行事实；回对应已验模块增量修正，不重写Node核心或抹去旧证据。
```

## T028

**原目标**：T028 [US3] 验收三平台 Increment、准备加载及迁移消费，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us3.md`。

**依赖**：T027。

```text
1. **改动文件**：无。
2. **改动内容**：按当次skills与指定Specify实际集成交集，在Linux/macOS/Windows分别复验仅Increment、自身缺项/错版、缺三暂停来源、旧受管入口实际迁移、两次重试、用户内容保护、失败恢复、所选hooks前置与两入口相同消费。对正式implementation-preparation正文、必要附件、before_implement及所选其他配置分别留完整文件/版本、官方注册和宿主完整加载证据；在无待实施业务目标的宿主读取，不发起实现。官方生成frontmatter转换按身份/有效正文/实际可读引用核验，安装源与投影仍按全文件摘要。缺agent/平台环境为未验，不以文件存在代替实际加载；不开展三暂停模式角色、学习或业务专项。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/us3.md。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：US3；FR-020/022/027～030/045～047、SC-005～007/010/018；D-MOUNT/D-PREP/D-CHAIN 与 quickstart D。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --story US3；三平台逐项核验SC-005/010/018：所选完整率与同版一致率100%，旧暂停/退役活动入口残留0且重试不复活，未知内容/无关扩展保留100%，hook失败命令调用0。缺正文/附件/声明/错版均明确失败，官方注册和完整宿主加载有独立证据；加载不抵扣主线讨论/逐Task门禁，未测组合逐条留限制。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T029

**原目标**：T029 [US5] 补齐发布可复现与搬离源码的验收测试，落点 `packages/skills/tests/distribution/release-contract.test.mjs`。

**依赖**：T027；发布材料依赖已接通的安装和挂载脚本，不再等待 T028 的三平台挂载验收；T028 原验收保留。

```text
1. **改动文件**：packages/skills/tests/distribution/test-distribution.mjs。
2. **改动内容**：在 T051 已验证的内容导出骨架上增加完整同版获准技能、全部公共工具/许可及不含固定扩展定义的发布边界、连续构建、无node_modules依赖和迁移目录闭包测试；先让缺少正式发布材料的断言失败。 安装候选只含 release.files 加清单自身；用户直接迁移源码，迁后独立开发工程由 T061 检查，不以搬离 dist 证明独立运行通过。 发布拒绝回归包含三暂停入口不再生成/重装、只选Increment、准备正文/附件/配置缺项或错版与实际所选映射不符；正式来源未交付不能通过完整workflow候选。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/release-contract.test.mjs。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：US5；FR-001/002/024/025；contracts/distribution。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --story US5；错误引用/缺工具/内容漂移的反例必须失败。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T030

**原目标**：T030 [P] [US5] 完善发布前校验和完整迁移产物，落点 `packages/skills/build/distribution/verify.ts`。

**依赖**：T029。

```text
1. **改动文件**：packages/skills/build/distribution/verify.ts；packages/skills/build/distribution/export.ts；packages/skills/build/plugins/distribution.ts。
2. **改动内容**：完善稳定排序、清单全集、源提交追溯、版本不可覆盖及产物闭包校验；生成LICENSE、THIRD_PARTY_NOTICES，运行脚本及依赖声明独立交付，不引用 workspace；依赖在使用阶段准备，不恢复 bundle。两次构建的公开文件集合字节相同，不注入时间；后续发布清单明确所选目录，安装候选只复制 release.json.files 加清单自身；当前 dist/skills 包含 eval，发布选择不能反向改变完整构建；dist/mcp 清单与发布选择独立，旧根 manifest/index 不恢复；完整发布校验要求四个工具、全部脚本/映射/正文/附件/README/许可证齐全；T031文档尚未就绪时只报告具体缺项，不提前锁定最终候选，完整通过与候选固定由T037在US4完成后执行。 公开选择按同版源核对新模式与两目标 hooks；剔除六退役技能、旧模式及仓库 user-shadow 资料，必要正文不含硬编码 Foundry 路径。 源码、配置、测试和 CI 由用户直接迁移，范围不受安装候选白名单误限；校验器保留同版本不可覆盖、完整 README/许可与未公开文件拒绝，不把工程工具塞入运行安装包。候选身份和双干净工程核对接 T055/T058，T037 固定的只是本地来源身份。 完整发布集合按当前来源核对Increment及准备/分析/结案正文和实际必需附件，不将三暂停模式专项或源码永久删除作为发布前置；生成入口语义/加载证据与源/投影字节核验分开。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/LICENSE；packages/skills/THIRD_PARTY_NOTICES（复用包根材料，不重建 distribution 目录）。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-001～004/010/024/025；Release不可变约束。 FR-038/040、data-model ReleaseCandidate；contracts/pipeline。
7. **验收信号**：US5校验器及构建/搬离测试使用本任务独立沙箱中的固定输入快照，来源与许可证可追溯，不在并行期间读取T031正在编辑的README；副本在无monorepo环境运行，缺文件时完整发布校验失败而不产出“可发布”结论；删除任一工具、README、许可证或必要附件，完整发布校验必须失败。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T031

**原目标**：T031 [P] [US5] 完善维护者迁移与外部使用文档，落点 `packages/skills/README.md`。

**依赖**：T029。

```text
1. **改动文件**：packages/skills/README.md。
2. **改动内容**：将现有“不发布”说明更新为当前实现及待迁移状态，保留MCP/link/modes用法；发布README补前置工具、Bash/PowerShell、四选择、scope、隐匿、第二步、失败续接及完整迁移清单。公开地址未知明确占位；隐匿尚未实现时标记待T035完成，不提前称可用；说明原生共享hooks和YAML格式变化，区分安装/执行/挂载支持；发布README采用来源参数化说明：先将发布者另行提供的固定提交HTTPS根URL赋给RELEASE_SOURCE，再使用带引号的变量构造官方目录URL、curl和第二步命令；提供Bash/PowerShell各自赋值语法、未赋值即停止的检查及URL格式校验。README不嵌入承载自身的commit；独立使用者只需来源值和交付README。 模式行为说明只引用主线当前有效规则：本 Spec 承接 Increment 真实反馈与准备同版消费，三暂停模式不再作为本期使用示例或学习/报告验收；目标项目沿用自身治理与记录布局。 补齐两阶段说明：本版本交付流水线并隔离验证，源码由用户直接迁移，迁后在新仓库默认分支重新检查新源码身份并手动首次发布；列源码迁移与安装候选的边界、根 workflow/明确依赖/配置来源/测试职责、14 天归档及精确候选请求字段、缺项/失效重新准备和授权、旧固定来源恢复。按同仓库同发布 SHA 区分 RELEASE_SOURCE/rawRoot 与 officialSkillsRoot/tree URL，不能直接把 raw 根交给官方目录安装；可迁移 workflow 的最终操作细节由 T059 同步，未知实际地址保持待赋值，不要求仅人工迁移成品。 同版发布README与内部脚本说明去除“四项齐备”和三暂停模式使用示例；说明Increment单选、准备hook消费、旧受管入口迁移与未知文件先停止、加载不启动业务实现、原生讨论门禁由主线负责。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：无。
5. **写法约定**：遵循宪章V/VI/VII、contracts/distribution和install；只写已存在能力，Markdown即时ESLint并读回。
6. **设计依据**：FR-002/009/024/025；US5迁移交付边界。 FR-037～044、SC-014～017；contracts/pipeline。
7. **验收信号**：与contracts/quickstart逐项核对命令和最终路径；无未说明占位、无假兼容承诺；Markdown ESLint通过。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T032

**原目标**：T032 [US5] 在真实公开来源完成独立使用者验收，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us5-remote.md`。

**依赖**：T030、T031、T037、T062；迁后实际公开版本与对应新候选均已核验，并有真实独立使用者。

```text
1. **改动文件**：无。
2. **改动内容**：外部前置：T037 已固定本地候选，用户已迁移技能源码工程；T061 已按迁后真实源码 SHA 重建核验、T062 已获授权首次发布并提供对应新候选、固定发布 commit 与真实 URL，至少1名未参与开发的使用者可参与。只读核验远端release.json的catalogDigest及全部文件与候选一致。在analysis/acceptance/release-source.md记录来源commit、URL、version、catalogDigest，以及依发布README规则赋值RELEASE_SOURCE后的实际命令；该来源说明位于发布根外，不修改已迁移README或清单。独立使用者先取得来源说明，再仅按交付README完成所选安装及适用挂载，记录其对结果/下一步的实际说明。前置不满足时保持未完成，不阻塞无依赖的本地工作；不得用agent演示充当独立使用者。 复用 T062 在发布根外记录的实际来源身份和两种 URL；官方目录与 raw 下载绑定同一仓库/发布 SHA，独立使用者按同一 README 操作，其实际反馈与 T062 的 agent 安装验证分别留证。人工原样迁移安装候选路径仍保留，但不能替代本轮新增 T061/T062 的流水线验收或重复计算发布事实。
3. **改动禁区**：不创建远端仓库、不推送/发布/部署、不代写用户反馈，不自动补授权。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/us5-remote.md；specs/skills/001-skills-distribution/analysis/acceptance/release-source.md（发布根外的真实来源与可执行命令说明）。
5. **写法约定**：遵循宪章IV/VI/VII及quickstart公开仓库阶段；证据使用真实用户动作，不补造。
6. **设计依据**：US5；FR-002/024；SC-008/009。
7. **验收信号**：记录真实URL/commit、固定版本、用户操作、实际文件和理解反馈；满足SC-008。远端全矩阵归T038，本任务不是发布授权；未执行不勾选；独立使用者记录所读README摘要与候选相同；来源说明无未赋值参数，远端全部文件摘要相同；不产生发布物修改。
8. **风险与回退**：公开来源或独立使用者未就绪就保留待办；其他无依赖任务可继续，本功能不能据此宣布全部验收完成。
```

## T033

**原目标**：T033 [US4] 补齐精确隐匿与范围限制测试，落点 `packages/skills/tests/distribution/hidden-contract.test.mjs`。

**依赖**：T028、T007；隐匿边界验证通过后才填充依赖业务。

```text
1. **改动文件**：packages/skills/tests/distribution/test-distribution.mjs。
2. **改动内容**：复用MVU-E测试关闭/开启、无git/父仓库/.git文件、global有无项目及项目外路径、共享配置、特殊字符/反向规则、权限失败与连续重试；完整install后和mount后两次收集需验证不重复。先记录缺失正式行为的红灯。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/hidden-contract.test.mjs。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：US4；FR-012～015；contracts/mount本地隐匿。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --story US4；输入矩阵覆盖SC-004，未选路径保持可见的断言先建立。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T034

**原目标**：T034 [US4] 实现精确exclude写入与效果核验，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T033。

```text
1. **改动文件**：packages/skills/script/install-skills/install-skills.{sh,ps1}；packages/skills/build/distribution/models.ts。
2. **改动内容**：完善ExcludeItem字段：项目、相对精确路径、归属、原跟踪状态、规则、命中来源、生效结果。落实“仅本次成功内容且在目标项目内的独占路径可入列；共享配置和项目外全局文件列为 coverageLimit，不伪造成功。” 仅明确项目.git目录受支持，按锚定路径转义追加去重并保留原文；用原生Git验证实际效果，跟踪冲突拒绝。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：无。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-012～015；data-model ExcludeItem。
7. **验收信号**：US4真实Git用例通过；check-ignore来源/ls-files/status一致，父仓库排除文件和未选路径前后不变，共享配置不整文件隐藏。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T035

**原目标**：T035 [US4] 接入安装前后隐匿结果与限制说明，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T031、T034。

```text
1. **改动文件**：packages/skills/script/install-skills/install-skills.{sh,ps1}；packages/skills/tests/distribution/test-install-skills.mjs；packages/skills/script/install-skills/README.md；packages/skills/README.md。
2. **改动内容**：仅curl启用hidden分支，先成功技能路径、挂载后新独占路径，合并成独立hidden阶段；失败不阻止适用mount，成功安装不因hidden失败变成未安装。global项目外技能skip、明确项目内独占挂载文件可处理；无项目不猜测。完善CLI README与安装四件套断言。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：无。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-012～015/022；contracts/install阶段组合。
7. **验收信号**：US4集成测试证明hidden失败而hooks可成功，overall非全成功；hidden关闭无排除写入，重复两次不追加重复条目，官方入口无hidden参数。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T036

**原目标**：T036 [US4] 验收Git隐匿的独立用户流程，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us4.md`。

**依赖**：T035。

```text
1. **改动文件**：无。
2. **改动内容**：三平台用安装器走完整hidden矩阵，记录原规则、实际命中来源和可见文件差异；共享配置变化保持可见，已跟踪文件冲突不被伪装成功。将失败续接与global限制写证据。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/us4.md。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：US4；P2独立验收检查点。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --story US4；误隐藏和原规则丢失数0，同版重试无重复，SC-004/006/007全部符合。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T052

**原目标**：T052 [US6] 验收真实 Increment 规划、反馈及分析刷新，落点 `specs/skills/001-skills-distribution/analysis/acceptance/increment-behavior.md`。

**依赖**：主线当前正式同版 Increment/分析能力和消费契约实际移交及用户可实际反馈的分发业务目标；原 T075/E1 仅历史定位。没有本 Spec 全矩阵或公开发布前置，不要求 Task 定位参数。

```text
1. **改动文件**：specs/skills/001-skills-distribution/plan.md、mvu.md、tasks.md（仅实际授权的规划范围）；analysis/spec-analysis/ 中同一技能维护的既有产物；所选 Task 及证据的必要引用。
2. **改动内容**：按当前Spec或用户业务描述规划小闭环，已有Task只作职责/依赖关联，不要求先指定Task参数。保存实际目标、范围、原验收/事实与同版来源，由真实用户反馈修订划分、顺序/暂缓和依赖并落实到tasks正文。核对plan唯一文件级mvu链接、四项详情及五状态依据、无自动整份方案快照；重复/恢复无重复条目。缺plan、有plan无tasks和五状态条件变化在独立材料验证，保护真实文件。实际由同一artifact-spec-analysis读取最新mvu刷新原索引；缺能力或保存失败明确未完成，不另造分析生成器。保留失败只阻依赖、原ID/目标/完成证据；不把本轮文档整理自动算作真实反馈流程通过。
3. **改动禁区**：不伪造用户反馈、阶段批准或状态转换；不把本次规划当成工程完成；不自动改变主线 Task checkbox，不修改无关任务目标/验收，不代建分析生成器或 after_increment。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/increment-behavior.md；analysis/acceptance/fixtures/increment/ 中独立分支材料（执行时列精确文件）；分析缺失时仅由已交付的同一技能按既有布局创建其产物。
5. **写法约定**：task-increment、主线同版 artifact-spec-analysis、宪章 III～VII；FR-079～081 的规则只引用主线；Markdown 逐份 ESLint/读回，保存真实对话及证据而不另建工程状态。
6. **设计依据**：当前FR-026/027/031/034～036、SC-011/013、US6、MVU-006；主线当前真实Increment反馈和分析刷新职责，三暂停模式不在范围。
7. **验收信号**：至少一条按当前Spec/业务描述进入的真实规划流程含用户反馈后修订与同一分析刷新；原ID/目标/验收/完成事实/证据保留100%，重复无新增，正文/依赖/导航一致；两类缺材料分支、五状态/恢复有真实证据，误报通过及错误下游推进0。安装、规划行为、准备加载和批准分别记账，不用AI模拟反馈。
8. **风险与回退**：主线移交、样本、真实反馈或分析能力缺失时只保留已发生部分，列继续条件；保存失败报告已写/未写，从实际文件续接。主线交付不得反向依赖本任务通过。
```

## T063

**原目标**：T063 实现完整矩阵测试入口与发布前本地覆盖，落点 `packages/skills/tests/distribution/matrix.mjs`。

**依赖**：T021、T028、T030、T036、T059；复用已验安装、挂载、发布校验、隐匿及 CI 接线，不依赖 T037/T038 或真实公开来源。不得为了接入矩阵而将 T038 反向设为 T037 前置。

```text
1. **改动文件**：packages/skills/tests/distribution/test-distribution.mjs（核对既有 full 场景调度与失败传播）；packages/skills/tests/distribution/sandbox.mjs（仅实际缺失的隔离辅助）；packages/skills/build/ci/run.mjs；.github/workflows/skills-check.yml（接通三平台执行及汇总，不授予发布权限）。
2. **改动内容**：补齐调度器已声明但尚无实现归属的 matrix.mjs，复用原测试骨架和真实官方/本包入口，按本次实际 skills 清单枚举 `3 × (项目级数量 + 全局支持数量) × 2 × 4` 组安装、全局拒绝及实际集成交集的挂载/故障场景。先验证 C3/C4 假设“分平台执行及汇总不会遗漏组合、混用候选或把缺环境算通过”：同一入口建立缺平台、重复组合、不同源码/版本/清单摘要/上游规则身份及必需失败/skip 的反例，全部拒绝完整通过；通过后保留同一骨架填充全部组合。各平台实际运行只能证明本平台结果，三平台完整结果由只读 CI 汇总；记录平台、工具版本、上游 version/integrity、源码及候选文件摘要和逐组合结果，禁止用跨平台路径 fixture 替代真实安装。只读检查和本地候选准备必须消费对应源码/文件身份的全量本地结果；候选固定前若构建字节变化，原矩阵证据失效，按相同文件重新验证。现有 `test:distribution` 无 selector 时包含 full 场景，必须保留这一门禁，缺入口不得跳过。T037 消费本地全矩阵，T038 在实际发布后复用同一入口追加远端全矩阵及真实历史版本恢复。 挂载矩阵只覆盖Increment与本次所选有效hooks，并含旧入口迁移、缺三暂停来源、未知内容保护、同版准备附件/声明缺项和实际可加载；三暂停模式专项/学习/报告不参与本期矩阵，其他原支持范围不缩减。
3. **改动禁区**：不运行真实用户目录安装，不修改产品每次在线解析 latest 的约定；不冻结旧 79/77/35/3744，不缩减三平台或以样本替代全部组合；不删除 full 场景、不用占位脚本或必需 skip 令默认回归变绿，不创建真实远端或执行发布。
4. **新建文件**：packages/skills/tests/distribution/matrix.mjs（完整矩阵单入口，含分平台执行与同身份结果汇总职责）；specs/skills/001-skills-distribution/analysis/acceptance/matrix-local.md（实际运行后保存本地全矩阵和故障反例证据，发布根外）。平台结果保存在本次测试拥有的隔离目录或 CI artifact，不另建 Task 状态系统。
5. **写法约定**：document-changed-symbols；宪章 III/IV/V/VII；mvu-gate；复用 tests/distribution/test-distribution.mjs、sandbox.mjs 及各故事已验入口。实现代码至少运行包 lint/check-types/build、对应测试及受影响消费者；Markdown 写后即时 ESLint 并读回。
6. **设计依据**：FR-004/005/009/021～025/037～040；SC-001～007/009/014/015；plan 支持矩阵和候选门禁；contracts/compatibility 与 quickstart 完整验收。
7. **验收信号**：`pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --matrix full --source local` 通过既有分发器实际调起 matrix.mjs；三平台证据集合精确等于本次枚举矩阵，附件完整率 100%、未选新增 0、用户内容及无关配置保留 100%。上述身份/覆盖/缺环境反例均非零；缺任何必需平台或实际调用保持未验，不通过本 Task/T037 完整候选门禁。本 Task 的实现和本地覆盖不得抵扣 T038 的真实公开来源矩阵。
8. **风险与回退**：矩阵或汇总失败保留同一入口、逐组合输入和真实输出，回实际实现或方案修正，仅阻断 T037 及其候选下游；无关工程和已经通过的骨架保留，不靠放宽检查或改成远端验收后再补本地覆盖求通过。
```

## T008

**原目标**：T008 验证MVU-F：单次构建独立交付与范围内消费，落点 `packages/skills/tests/distribution/mvu-f.mjs`。

**依赖**：T003、T004、T006、T007、T012、T027；复用 T051 的同一导出骨架，补齐完整原范围，不以 T051 局部通过替代本任务。

```text
1. **改动文件**：packages/skills/tests/distribution/test-distribution.mjs；packages/skills/vite.config.ts。
2. **改动内容**：在当前单次构建基础上接入 T004～T006 已实现的安装与挂载能力，运行材料统一放 script 并交付到 dist/script；不增加 mode 或未实现工具占位入口。生成最小独立交付副本，两次构建比较摘要，再在隔离目录运行。验证 dist/mcp/manifest.json 仅收录 src/mcp、线下技能和附件完整、link-skills 与已有模式受保护；显式指定新清单路径做 registry 读取，默认消费迁移留后续。复用 MVU 已验证的在线 Agent 读取器及平台脚本，不重新创建来源声明文件，声明输入缺失即失败；构建成功不等于完整发布通过。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/mvu-f.mjs；specs/skills/001-skills-distribution/analysis/acceptance/mvu-f.md。原计划的 export.ts、verify.ts 与 distribution.ts 已由 T051 提前建立，本项在同一实现增量完善；历史 agents.json 已按用户后续要求移除，不重新创建。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：MVU-F（C3/C4）；FR-002/024/025；quickstart F。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --mvu F；两次有效文件摘要相同、隔离副本可用；包lint/check-types/build/test、MCP registry、link-skills沙箱及已有模式保护均记录结果，未知差异不得通过；唯一 Node 入口及四类内部平台职责均能独立启动并执行各自已验证场景；删除任一声明输入后构建明确失败；未完成的文档/功能列为开发缺项，不返回可发布结论。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T037

**原目标**：T037 运行完整工程检查和原消费者回归，落点 `specs/skills/001-skills-distribution/analysis/acceptance/regression.md`。

**依赖**：T008、T030、T031、T036、T059、T063；包含已实现完整矩阵入口、工程驱动与 workflow 的范围回归，T060/T038 不作为本任务前置，避免候选/远端验收循环。

```text
1. **改动文件**：无。
2. **改动内容**：按quickstart执行目标包lint/check-types/build/test/test:distribution，MCP registry pytest、link-skills沙箱，以及已有 modes 兼容保护；核对eval内部范围与MCP消费不退化。已通过检查仅在新修改/新故障时重跑，无法执行逐项记录原因和风险；在T030/T031及US4均完成后重新构建两次并执行完整发布校验，固定最终本地候选version、sourceRevision、catalogDigest与全部文件摘要；当前版本候选由 T060 用于本地交付；迁后 T061 按新仓库/源码身份重新检查，T062 发布后 T032/T038 只读使用对应新候选，任何发布根内文件变化都使旧候选及依赖其摘要的验收失效，须重建并重验，不覆盖已公开同版内容。 使用 T055/T058 同一校验器从明确干净源码 SHA、同一完整依赖快照在两目录构建，记录 repository/version/sourceRevision/catalogDigest/candidateDigest、检查证据及隔离身份；不把 Foundry 检查当真实 Actions run/artifact。全量本地支持范围检查缺项仍阻止正式候选，迁后真实公开范围由原远端任务继续验证，不构成反向等待。 “已有modes保护”仅指当前Increment/所选hooks和旧入口迁移/无关内容保护；不重新要求三暂停模式专项或旧失效锚点通过。必要源码/平台缺项仍不得固定完整候选。
3. **改动禁区**：不运行不存在的根pnpm test；不为使测试通过修改旧消费契约或跳过必要平台。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/regression.md。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-025；SC-009；宪章IV。
7. **验收信号**：pnpm --filter @foundry/skills run lint；pnpm --filter @foundry/skills run check-types；pnpm --filter @foundry/skills run build；pnpm --filter @foundry/skills run test；pnpm --filter @foundry/skills run test:distribution；其中默认 full 场景复用 T063 的同源码/文件身份本地全矩阵，另显式核对 `test:distribution -- --matrix full --source local` 的逐组合覆盖；显式向 load_skills 传入 packages/skills/dist/mcp/manifest.json 的只读检查（恢复前核实运行环境并补齐命令）；node --test scripts/dev/actions/link-skills/test-link-skills.mjs；所有要求项真实通过才勾选。追加 pipeline-contract.test.mjs、两种布局驱动与配置导出范围；本地完整候选不得含 development 或必需 failed/not-run/缺环境 skip。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T038

**原目标**：T038 完成三平台全agent矩阵及真实远端复验，落点 `specs/skills/001-skills-distribution/analysis/acceptance/matrix.md`。

**依赖**：T032、T037、T062；使用迁后实际发布对应的新候选，不把 Foundry 旧候选身份套到新仓库。

```text
1. **改动文件**：无。
2. **改动内容**：按本次解析的 skills 版本执行 3平台×(项目级数量+全局支持数量)×2入口×4选择组干净安装，并保存版本、完整性与支持清单；旧 3744 仅为历史基线，本地与真实公开来源分别记账；纯安装curl用--no-mount，另外按本次 skills 与所选 Specify 实际集成交集汇总挂载/真实派发（旧 35 项仅历史基线）、环境变量分支、global拒绝、冲突与恢复证据。不可用平台或agent程序分开记未验证，不能用代表样本抵扣承诺。 核对 T061/T062 的真实平台、来源映射、发布及恢复限制，完整矩阵使用同一仓库/完整发布 SHA 对应 raw/tree 地址；没有真实历史旧版时明确隔离恢复与后续真实历史复验，不伪造 SC-017 完整通过。 SC-017 的真实旧完整版本固定来源复验明确在本任务承接；首次发布尚无真实旧版时，可保存已完成的远端矩阵结果，但该恢复条件继续未验且本 Task 不勾选。待用户后续实际发布形成真实历史并提供旧固定来源后再复验，T056 隔离证据不抵扣此项，不为补验自动发布第二个版本。 真实远端挂载与消费集合按当前Increment和正式准备/分析/结案来源验收；三暂停模式专项移出，不以暂停为通过，也不缩减其他agent/平台、用户和历史版本条件。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/matrix.md。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：SC-001～007/009；contracts/compatibility；quickstart完整验收。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --matrix full --source local；同命令改为--source remote并附--release-source <真实固定提交HTTPS根URL>在来源就绪后执行；逐条有实际路径/摘要/版本/结果，附件率100%、技能未选新增0、安装目录修改及挂载无关配置保留100%，skip不得计pass。
8. **风险与回退**：缺平台/网络/实际调用环境或远端来源则保留未完成，报告具体组合；不得以代表样本缩减实际解析清单的矩阵；挂载交集按 skills 实际清单及 Specify 版本核对，旧 35 项不冒认新增组合通过。
```

## T039

**原目标**：T039 同步最终文档、接口示例与图表，落点 `packages/skills/README.md`。

**依赖**：T038。

```text
1. **改动文件**：packages/skills/README.md；specs/skills/001-skills-distribution/quickstart.md；specs/skills/001-skills-distribution/contracts/compatibility.md；specs/skills/001-skills-distribution/contracts/distribution.md；specs/skills/001-skills-distribution/contracts/install.md；specs/skills/001-skills-distribution/contracts/mount.md；specs/skills/001-skills-distribution/diagrams.md；specs/skills/001-skills-distribution/diagrams/business-flow.md；specs/skills/001-skills-distribution/diagrams/logic-flow.md。 specs/skills/001-skills-distribution/contracts/pipeline.md；packages/skills/build/ci/ 及根 skills workflow 的文档引用。
2. **改动内容**：依据实际实现与证据核对五份contracts、quickstart、技术/业务/任务图及发布README；只修正真实漂移并保留早期记录的时间语境。复用本轮plan阶段15张图的实际渲染证据并核对适用字节，对本次任务逻辑图及后续变更图用可用Mermaid环境重新验证；记录工具与结果，未运行保留限制；T037后已固定的发布根保持只读；修正文档只可先更新本地源，若会改变发布README或其他交付字节，必须声明候选失效并回T037重建，更新内容使用新发布版本，经 T060 复验本地交付后，在新仓库按 T061 重建核验，并经 T062 新的明确授权发布后重做 T032/T038；未重验前不得进入T040。 同步当前有效FR-026～047/SC-010～018与mvu、Task正文和当前主线移交→真实消费/反馈→证据回填，三暂停专项明确排除；不复制模式或分析规则，复用主线 T074 的已更新材料。旧工作流 T038 及外部项目专属行为做法仅保留历史说明，不作为现行验收。 覆盖新增 FR-037～044/SC-014～017，核对直接源码迁移与 ReleaseCandidate、两阶段、两 URL 及 run/artifact/源码/发布身份说明；不把计划或本地模拟写成真实平台通过。 本轮特别核对FR-045～047/SC-018、三暂停标记、仅Increment和准备完整加载、源码/投影字节与生成入口语义的区别、未知内容调用前停止。当前计划阶段已渲染15张图的事实可在核对字节适用后复用，不仍把它写成全部未渲染；任务逻辑图按当前任务依赖另验。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/documentation.md。
5. **写法约定**：遵循宪章V/VII；文档简体中文、ESLint格式化；图按artifact-business-flow与artifact-logic-flow约定生成。
6. **设计依据**：FR-024；SC-008/009；artifact-logic-flow；宪章流程图条款。
7. **验收信号**：对实际修改Markdown执行pnpm exec eslint --fix并读回，链接有效；Mermaid实际解析/渲染结果有记录；最终示例版本与路径和产物一致，无被标为可运行的占位。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```

## T040

**原目标**：T040 汇总交付证据、清理开发遗留并核对结案边界，落点 `specs/skills/001-skills-distribution/analysis/acceptance/distribution.md`。

**依赖**：T039、T052、T060、T062；三暂停模式专项和历史 T053 不在当前前置；其他工程/平台/真实独立用户、发布与原总体批准条件保持，本任务仍为有效执行序列唯一末尾。

```text
1. **改动文件**：packages/skills/、specs/skills/001-skills-distribution/ 内经实际用途核实应处置的开发遗留；执行前列精确文件与符号/段落位置，仅改本功能相关对象，无清理项也列核查范围和依据。
2. **改动内容**：汇总当前US1～US7、原六技术MVU、D-MOUNT/D-PREP/D-CHAIN、候选/Git/平台/完整矩阵及真实用户证据，逐条对照FR-001～047、SC-001～018和MCP-BUILD-001～006；FR-032/033、SC-012与三模式专项暂停明确排除，不标记通过、不等待T053恢复。工程、独立安装挂载、Increment真实反馈、准备同版交付/注册/加载、主线讨论行为回填、阶段批准与总体结案分别判断，双方不自动互勾。核对pipeline-local/pipeline-remote/release-source实际源码/发布/候选身份、授权/竞争/旧版恢复；缺真实历史旧版本、平台、正式来源或独立用户仍未验，不因本地交付完成提前结案。最后按调用点、导出/配置、历史、测试与文档引用核查临时试验文件、局部代码/注释、失效迁移/进度/复核材料，记录精确位置、依据、实际处置或保留、引用检查和必要验证。保护正式交付、有效治理、任务身份/完成事实、历史证据、复用骨架、用户未知内容；用途不明保留并记原因和继续条件，不为此冻结其他可完成清理。复用本任务及distribution.md，不另建清理状态。
3. **改动禁区**：不自动完成主线或旧任务、不伪造学习/讨论/用户批准，不把暂停当通过或永久删除。不得凭一次无命中搜索删除、不因局部失效整文件清理，不清扫无关workspace，不夹带画像/秘密，不未经授权发布或迁移用户目录。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/distribution.md。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：当前FR-026～031/034～047、SC-009～011/013～018（暂停项排除）、contracts/pipeline与mount；宪章IV/VI/VII的证据、授权和末尾清理规则。
7. **验收信号**：覆盖表无有效遗漏或未验冒充通过，所有当前活动任务原验收和必要用户批准满足；三暂停模式/T053不入阻塞或通过条件。清理记录可追溯，必要工程/格式/引用检查通过，剩余用途不明项有保留依据；有应清理未处理项、保存/检查失败或引用受损时不能完成清理。清理通过不自动完成其他结案条件，不改主线checkbox或历史事实。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。
```
