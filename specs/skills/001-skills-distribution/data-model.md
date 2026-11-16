# 数据模型：可追溯分发与阶段结果

当前版本模型按[统一版本确认](requirements/raw/2026-11-16-unified-release-version.md)统一：package.json.version 是唯一源版本，scripts.version 等于所选技能 version；保留按对象分文件的发布记录，但整版全部固定对象核验成功后才登记和更新发现。

## 2026-11-16 主线有效模型：三种版本事实与独立阶段结果

依据[本次澄清](spec.md#session-2026-11-16)，字段格式集中在[当前curl契约](contracts/curl-delivery.md)。本节用于主线；下文旧Release/安装请求/收据/逐技能hooks等仅在仍适用的历史消费者范围内有效，紧急版schema1和两步消费不变。不建立任务数据库、永久指纹或第二套工程checkbox。

### 版本与发布引用

| 实体                   | 字段与关系                                                                          | 不变量及生命周期                                                           |
| ---------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| SourceVersions         | releaseVersion来自package.json.version；同次skillVersion=curlVersion=releaseVersion | 一个受维护SemVer；仅改脚本也递增；源码、当前构建、已发布分别判断           |
| SkillRelease           | schemaVersion=2、kind=skill-release、version/sourceRevision、skills/files           | 文件清单是单版对象，不能用release.json数组替代；源身份精确到实际完整提交   |
| CurlScriptBundle       | version/interfaceVersion、files、hiddenPaths、归档bytes/sha256                      | version等于所选技能发布版本，可旧于最新入口；脚本或技能变化须新整体版本    |
| SkillPublicationRecord | version、技能url/bytes/sha256/md5、manifest引用、固定scripts引用、实际核验事实      | 只在发布及远端核验成功后登记；同技能版本的内容、地址和辅助关联不可变       |
| CurlPublicationRecord  | curlVersion、sourceRevision、入口及辅助目录/归档文件表、固定R2地址                  | 与同次技能记录version/sourceRevision一致；固定对象不覆盖，不套最新入口HEAD |
| DiscoverySnapshot      | 索引原字节摘要、选中记录、实际entryVersion/entryDigest                              | 每次启动只解析一次；最新入口与历史辅助包版本可不同，不因中途latest变化换包 |

源发布记录位于dist外，重建只投影已核验历史。`dist/curl/release.json`按最新已发布技能在前；单版清单为`release-manifest.json`。技能候选文件全集是files加单版清单自身，辅助目录全集是辅助files加manifest.json；两个清单均不包含自身摘要。可变发现材料与固定对象、候选索引分开保存，避免成功登记回写冻结候选。

当前本地归档路径为 `dist/skill/skill.tar.gz` 与 `dist/curl/scripts.tar.gz`，包内根分别为 `skill/`、`script/`，均不包含归档自身。每次构建的长度和摘要对应本次实际归档，不要求跨构建相同；一旦选定发布候选，记录及重试仍绑定同一份冻结字节。现有局部归档不等于已生成上述版本/文件清单或登记发布成功。

### 路径与成功集合

隐匿生成源当前是curl插件中的hidden-install.template.ts；独立.sh已交付并随scripts.tar.gz归档，旧手写源路径不作为必须恢复项。当前模板已有路径和Git/排除基础逻辑，但安装调用、SuccessfulSelection与阶段协议尚未接入，模型字段不能据模板或归档存在标为已实现。

`InstallMapping`保存name/category/sourceDirectory/installRelativeDirectory/requiresSkills：sourceDirectory是`skill/<集合>/<目录>`，当前installRelativeDirectory展平为`<目录>`。在正式获准集合内核对名称、目录映射和跨集合目标唯一；不把eval或未选配置自动纳入正式候选。

`HiddenPathTemplate`保存skillName、installRelativeDirectory、`@@AGENT_SKILLS_ROOT@@/<目录>`。构建枚举只是候选；`SuccessfulSelection`由本次安装或同版完整重验生成，保存name、实际installedPath、安装映射及事实依据。可处理集合为模板候选、本次显式选择、实际成功集合的交集；再核对项目内、独占和未跟踪，不能从历史安装根反推本次事实。

运行替换当前只验证`.agents/skills`。占位符未替换、构建绝对路径、集合误拼入安装层、共享路径或已跟踪目标不能进入排除；特殊字符按Git规则转义。`.git`缺失或为文件沿保守支持范围跳过，不向父仓库扩张。

### 一次运行结果

`RunReport`记录request、entryVersion/entryDigest、selectedSkillVersion/catalogDigest、scripts.version/interfaceVersion/digest、逐技能结果、installation/hidden/hooks/commands与overall/retry/coverageLimits。实际阶段为success/skipped/failed/not-run，overall为success/partial/failed；这些只描述本次运行，不是Task状态。

技能逐项沿pending→staged→verified→installed/reused，任何已核验完整成功项可进入后置步骤。仅hidden包获取或校验失败可发生在技能写入前：继续独立核验通过的技能安装，hidden=failed；installation实际成功后overall=partial、退出1。参数/静态前提失败退出2，无请求步骤失败才退出0；技能自身失败不得预先标安装成功。

无hidden请求时不执行hidden脚本；脚本包、路径或协议失败都不得执行未核验代码。结果文件是本次私有临时材料，读取后由入口按实际Git效果核查，清理不抹去报告中的成功事实。暂缓挂载及未实现选项要明确说明，不能填success；最终平台、挂载与公开消费验收保持原要求。

## 紧急版数据增量（2026-11-12）

对应FR-003/061～067、SC-019和Clarify B，接口见[紧急契约](contracts/urgent-release.md)。以下只定义输入和一次运行证据，不增设任务状态、永久指纹、registry副本或服务；原主线模型从“当前集合配置”起保留。

### 恢复与工作区输入

| 数据           | 字段与校验                                                                                      | 关系与公开边界                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 恢复来源       | 两份archive及实际摘要、原工作区/仓库外副本的真实状态、文件路径与SHA-256、允许复制/明确排除项    | 私有验收证据，原副本未提交不能冒认HEAD；新目标为packages/skills-distribution-urgent，原件保留        |
| 源码输入身份   | 实际Git根、packageRoot、sourcePackagePath、sourceRevision、inputFiles/inputDigest               | Git根与包根分离；输入路径带包前缀，实际所用文件须与对应真实提交字节相同；绝对机器路径只留私有报告    |
| 工作区依赖证据 | 实际使用的catalog、共享预设及工具配置、解析后的依赖图和摘要、根锁实际字节/跟踪情况              | 版本与配置进入输入闭包；不要求相关外整个工作区干净，不伪造未跟踪锁的Git身份，不复制旧node_modules/锁 |
| 获准技能清单   | coding/frontend/workflow内9项正式目录、frontmatter名称、完整附件及过滤事件配置                  | 核对唯一身份、引用与路径；urgent/src只维护获准副本，不能因主线源码保留eval扩大候选                   |
| 本次安装选择   | version、显式技能名集合、agent=codex、scope=project、projectRoot；公开阶段另有publishedRevision | 去重、缺依赖报错、不静默补装；本地目录来源不编造公开SHA，真实发布后才填写公开引用                    |

仅相关输入闭包必须干净且稳定：新增/忽略的实际输入同样列入验证，无关工作区差异不能误伤。构建前后比对revision与inputDigest；来源不符、相关输入脏或身份漂移明确失败，不能靠参数覆盖来源。实际消费的共享预设dist按生成依赖证据核对来源源码与构建摘要，不把生成物当作应在Git中存在的源码；源码闭包与生成依赖分别记录。迁后sourcePackagePath和根依赖可能改变，重新形成整份身份及检查证据。

### 开源源码与正式Release

开源迁移来源是packages/skills-distribution-urgent、packages/skills、specs/skills、apps/mcp。eval源码和样本可随主线技能包保留；正式发布物、官方列出/安装仍必须eval=0。源码根不能作为正式整包建议来源；画像、秘密及非公开材料不得进入公开副本，第三方许可与真实来源说明保留。

Release继续schemaVersion=1，保留version/sourceRevision/tools/skills/files/projections/adapters等消费者字段，只声明Codex identity。version取当前目标包版本，sourceRevision取本次真实输入提交；files含相对path、bytes、sha256，覆盖9项正文附件、必要script、script/config/<集合>/collection.config.json、README与实际ISC LICENSE，不含release.json自身。payload精确等于files加release.json，不交付源码、测试、归档、MCP或eval。catalogDigest来自最终清单原字节；candidateDigest按既有稳定文件索引算法包含清单自身，额外文件同样拒绝。

公开引用保留repository、skills-v<version>、publishedRevision、officialSkillsRoot、rawRoot；只有真实迁后发布并回读才形成。publishedRevision指精确payload的无父commit，与源码提交分开；新建和复用都检查父数0、commit类型与精确文件全集。两种URL同仓库同完整SHA，不将raw直接作为官方安装建议；不为填来源回写冻结README或清单。

### 临时输入与挂载事实

临时hook输入来自同版集中配置及本次已装选择，provides为空、按事件补command=正式技能名，保留合法prompt/optional/priority/condition及扩展字段，enabled=false过滤。私有临时目录由本次调用拥有并清理，不进入payload、不写回源或用户配置副本，条件交官方执行器。

逐项保存installation、integrity、hooks.results、Increment、旧入口迁移、loading的success/failed/not-run与原因。未选/不适用单独说明，不能混为成功。无自有安装收据的官方同版完整目录可复用，不造归属、不改源技能；所选hook全部成功或明确不适用才注册Increment，失败时后续not-run。官方注册、派发信息与实际Codex正文/附件读取是不同证据，HookExecutor返回命令不能代替宿主运行。

旧三/四/五集合及别名按官方更新/移除处理。仅对明确旧登记、来源及影响目录做本次只读清点和临时比较，额外附件/未知修改停止破坏性调用；不建立永久字节记录或持续所有权服务。正式入口与源技能发现关系实际验证，不能重复执行同一规划。

### 一次运行证据与连续推进

| 字段组                                                              | 约束                                                                                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| phase / coverage / coverageLimits                                   | local-workspace、post-migration、published-consumption分别记录，明确Linux/Codex项目级和未纳入范围；不作为第二套Task状态                    |
| sourceRepository / sourcePackagePath / sourceRevision / inputDigest | 绑定本次真实工作区或迁后身份，不把仓库外副本身份、夹具提交或Foundry旧HEAD冒认为新来源                                                      |
| version / catalogDigest / candidateDigest / payloadFiles            | 固定清单与全部文件，字节变化使旧证据失效                                                                                                   |
| dependencySnapshotDigest / checks                                   | 包含实际依赖、适用工程检查、双构建、真实官方内容/挂载/宿主与保护恢复证据；缺项为failed/not-run                                             |
| localConclusion / migrationSources / migrationNotes                 | 全部必需本地证据通过后才计本地完成，列四处来源、ISC/第三方许可、非公开资料处理及依赖缺口，下一步按既有授权及真实前置连续推进，不设固定暂停 |
| authorizationRef / authorizedTarget                                 | 只在后续真实候选授权阶段形成，绑定仓库、版本、源码和候选，无凭据正文                                                                       |
| prepare / publish / remoteVerify / consumption                      | 本地完成时真实后三项仍not-run，具体原因是尚未迁仓/授权；自有bare Git测试不算真实发布                                                       |

源码迁移清点还须记录主线preset/catalog及根测试资源依赖、MCP旧manifest缺口、specs正文/附件/archive中的私有依据。未处理项如实列交接，不把本地紧急结果扩展为四目录全部可独立运行。

报告位于发布根外的既有验收目录，不生成runId/artifactId/PlatformReceipt，也不改原isolated/full/ready准入。本地通过后按连续推进豁免继续，搬移、建仓、推送或发布仍需适用明确授权；历史urgent-local.json的success-then-paused及pausedAt仅记录当次运行，不是活动流程门禁。后续迁移改变身份后重验；真实发布发生而回读失败须保留已发生事实，公开字节变化须新版本。阶段图见[diagrams](diagrams.md)。

## 当前集合配置

唯一来源为src/<集合>/collection.config.json，原字节复制到dist同名集合；规则见[最新讨论](requirements/discussions/2026-11-11-plugin-skill-config.md)。缺文件时只在输出生成packageName=null、mcp=false、skill={}，不回写源码。

| 字段                                 | 当前语义                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| packageName                          | null或非空字符串；发布语义后续确定                       |
| mcp                                  | 布尔值，默认false；本轮不生成MCP内容                     |
| skill                                | 技能目录名到配置对象；只交付列出的技能，空对象也表示选入 |
| skill.<名称>.hook                    | 可选事件映射，每事件一个对象                             |
| hook.<事件>.prompt/optional/priority | 可选字符串/布尔/有限数字，各事件独立配置                 |

未知根、技能及事件扩展字段原样保留，不设置固定事件名单。command/description不重复写入集合配置，未来脚本生成再读取来源；本轮不实现生成器。SKILL.md frontmatter和附件保持原字节；不派生逐技能配置、子包package.json或Release。下方旧阶段模型仅供参考。

## 本次构建链的阶段数据（既有方案参考，实现已归档）

依据 spec 的 B 及共同交付要求，构建内部类型全部可重写，公开 Release 线格式保持兼容。下列对象是阶段返回数据，不保存第二套 Task 状态；它们不进入技能目录。旧构建源码、类型及证据见[存档](archive/2026-11-10-build-pipeline-replan/README.md)，不能把本节类型存在当作实现完成。

2026-11-11：T067曾交付来源与基础计划，随后用户明确要求全部移至[归档](archive/2026-11-11-build-script-restart/README.md)并重新写构建脚本。当前有效源码不再提供这些模型/入口，下表作为旧设计参考保留，是否沿用须在重写时重新讨论；[原验收](analysis/acceptance/source-plan.md)仅保留历史。

| 数据                  | 必需内容与关系                                                                                          | 校验及生命周期                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| SourceSnapshot        | 实际包根、sourceRevision、inputFiles/inputDigest、dependencySnapshot、toolchain、clean、validationScope | 固定本次实际源码/配置/技能/MCP/脚本与依赖；正式候选要求干净提交严格对应输入，开发或合成材料明确隔离 |
| BaseBuildPlan         | SourceSnapshot 身份、目标根、原始三目录的目标路径/内容、MCP 清单                                        | T067 的内部中间结果，尚无 Release 与安装投影；不能当作完整 BuildPlan 交给候选链                     |
| BaseBuildOutput       | outputRoot、原始三目录实际文件表、MCP 清单位置及来源身份                                                | T068 隔离阶段验证的中间结果；不含 Release 清单位置，不能当作完整 BuildOutput                        |
| BuildPlan             | SourceSnapshot 身份、目标根、目标文件路径/内容、MCP 清单、Release 与安装格式                            | 只在内存形成，不写文件；路径、身份、依赖与附件完整性先通过                                          |
| BuildOutput           | outputRoot、实际文件表、MCP/Release 清单位置及来源身份                                                  | 只写本次拥有的构建输出，脚本不执行；完成后仍需独立从磁盘复核                                        |
| BuildVerification     | 已验来源、outputRoot、逐文件 path/bytes/sha256、检查结果                                                | 从磁盘重新计算，不能只复用 BuildPlan 的摘要；失败不产生成功结果                                     |
| CandidateContentIndex | 下节定义的内容索引                                                                                      | 绑定已验公开文件、依赖与检查证据；上传前固定，不含未知 artifactId                                   |
| PlatformReceipt       | 下节定义的平台收据                                                                                      | 只在真实上传成功后生成，绑定内容索引和真实平台归档                                                  |
| CandidateResult       | 内容索引位置、payloadDir、可用平台收据、purpose、检查结论                                               | purpose 为 development/isolated/ready；ready 要求完整内容门禁及真实可信平台绑定，不能只改标记升级   |
| StageError            | stage、reasonCode、message、已写对象与继续条件                                                          | 内部抛错，外层将本阶段记 failed、依赖阶段记 not-run；不虚构回滚成功                                 |

inputDigest 与构建/候选摘要分别计算；实际绝对路径只用于本地执行与诊断，不写进公开 Release。SourceSnapshot 可留在进度证据中，但不是自动工程导出包；迁后独立工程仍须按真实依赖重新检查。

BaseBuildPlan/BaseBuildOutput 只表达分步研发时已完成的字段，不放宽完整对象的必填约束。T069 在同一内存计划中补齐 Release、附件依赖及安装投影，验证完整 BuildPlan 后才允许正式构建写盘，并返回含 MCP/Release 清单位置的完整 BuildOutput。T068 的先行写出仅用于本次自有隔离目录的阶段测试；最终运行链不采用“先写原始目录，再校验 Release”的顺序。T070 只接受完整对象做磁盘复核。

## 本轮 MCP 派生清单

`dist/mcp/manifest.json` 是构建输出，不是源配置；唯一输入为 src/mcp 技能与 references 文本。顶层字段为 version（固定 1）和 skills（稳定按名称排序）。条目字段、分类路径与附件名以 [MCP 清单契约](contracts/distribution.md) 为准。不含 generatedAt；空源输出空数组。下面 release.json 已接入开发构建，完整发布仍待原验收，不能替代或反向维护本轮 MCP 清单；旧根 manifest 已取消。

不引入数据库或任务状态系统。发布目录保存技能和脚本的版本清单；运行时报告安装事实；本包拥有的安装收据仅用于文件归属和幂等，不承载 Spec Kit 工程任务状态。

## 发布版本 Release

| 字段           | 约束及用途                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| schemaVersion  | 首版 1；不支持的格式拒绝执行                                                                               |
| version        | 明确 SemVer；首个构建沿用包版本 0.1.0；同版本内容不得重发替换                                              |
| sourceRevision | 生成该内容的源码提交；不包含用户身份或凭据                                                                 |
| tools          | skills=latest、specify=1.2.6、唯一入口 Node ≥22.20.0 与平台 shell 下限；官方 skills 另记 npm 基线          |
| files          | 每项相对路径、字节数、SHA-256；覆盖实际适配脚本及技能，不包含静态 Agent 表或独立来源声明；不含固定扩展声明 |
| skills         | 发布 Skill 数组；按同版获准来源确定，不固定历史数量                                                        |
| projections    | identity 与 eve-frontmatter-v1 的实际安装文件摘要                                                          |
| adapters       | 在线数据读取器及挂载脚本的路径和摘要                                                                       |

`release.json.files` 声明公开安装选择，不等于当前 dist 的全部文件；安装候选集合为 files 加 release.json 自身，项目源码由用户直接迁移，不生成独立工程包或索引。当前 MCP 清单位于 dist/mcp/manifest.json 且无 generatedAt，旧根 manifest/index 不再生成；MCP 线上内容及其流水线选择另行定义。`release.json` 不把自身摘要写进自身；报告保存其原始字节摘要 catalogDigest。公开来源由调用方给不可变提交根 URL，避免目录提交号与清单互相引用。来源 commit 与 sourceRevision 可以不同，分别记录。HTTPS 与同源摘要提供传输/内容一致性，不宣称独立签名认证。开发期间的未发布构建仅用于阶段验证，不作为固定发布版本交付；T037在所有本地能力与完整发布校验通过后固定 Foundry 候选，项目迁入新仓库改变 sourceRevision 后必须重建重验。候选之后的内容变化使旧摘要及相关验收失效，已公开同版本不可替换。承载来源的公开commit不回填进清单或发布README；README参数化接收RELEASE_SOURCE，实际来源与展开命令存于发布根外的验收资料。

## 源码直接迁移边界

skill、MCP、构建、脚本、必要测试和 CI 源码由用户直接移入公开仓库；工程依赖与配置在新仓库维护，不提供 ProjectBundle 数据模型、自动导出器或工程摘要。迁移说明记录所需材料与调整项即可，不能把 node_modules、凭据、Foundry 业务应用或个人画像一并公开。

源码仓库与安装候选仍有不同边界：公开仓库可维护多种源码，供技能安装的候选只含 release.json.files 加清单自身。迁后用新源码 SHA、实际配置与依赖快照重新检查，不能将旧 Foundry 候选视为新身份通过。

## 安装候选 ReleaseCandidate（计划）

ReleaseCandidate 是内容、平台绑定和资格结论的组合，不是一份含有自身未知上传 ID 的 JSON。payload 仅含 Release 白名单和 release.json；内容索引、依赖/检查证据及平台收据都位于 payload 外。

### 上传前的 CandidateContentIndex

| 字段                                  | 约束                                                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| schemaVersion                         | 内部索引版本1；不改变公开 Release 的 schemaVersion                                                                                                        |
| sourceRevision/version                | 完整源码 SHA、自有 SemVer；与实际来源及 Release 一致                                                                                                      |
| catalogDigest                         | release.json 原始字节 SHA-256，不重新格式化后计算                                                                                                         |
| payloadFiles/candidateDigest          | 全部公开文件含 release.json 的 path/bytes/sha256；路径按 UTF-8 字节顺序排序，以固定键顺序 path、bytes、sha256 的无额外空白 JSON 数组 UTF-8 字节求 SHA-256 |
| dependencySnapshotDigest/checksDigest | payload 外真实完整依赖快照与检查证据的摘要；证据本身随工程归档留存，不暴露秘密                                                                            |
| validationScope                       | development/isolated/full；描述实际验证输入，full 仍需完整门禁和上传后平台核对                                                                            |

payload 必须与文件表双向相等，额外文件、链接、错字节均失败。内容索引可另算 contentIndexDigest 供收据绑定，但不把自己的摘要写进自己。上传前可以知道 runId 等上下文，却不能编造尚未产生的 artifactId。

candidate 入口必须显式选择 validationScope=isolated 或 full，不能省略后自动推断。development 仅保留为开发材料的用途记录，不能作为候选入口的成功输出。isolated 允许明确列明的稳定子集/合成技能及未执行的完整发布检查；实际执行的检查失败仍须非零，未执行项如实记 not-run。它仍须通过所选集合的 Release 结构、全部必需附件/依赖、真实 README/许可证、同源双构建、严格 payload 及摘要核验。full 要求正式同版来源及全部上传前内容门禁，拒绝 development 标记和任何必需 failed/not-run/缺环境 skip。具体入口与两种范围的判定见 [pipeline 契约](contracts/pipeline.md)。

validationScope 描述实际已验范围，purpose 描述可用资格；二者不能仅改字段互相升级。上传前即使 full 内容门禁已通过，也没有 ready 结论。isolated 的来源事实、索引与检查证据不可通过改标签复用为 full；须对正式来源重新构建、检查和生成索引。Foundry 即使完成全部本地内容检查，仍只有隔离用途；ready 另须迁后 standalone、真实可信平台绑定及全部正式门禁。

### 上传后的 PlatformReceipt

| 字段                                                      | 约束                                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| repository/runId/runAttempt                               | 真实当前仓库及精确受信默认分支检查运行；发布时再核对平台 API 的该 attempt 已成功 |
| payloadArtifactId/payloadArtifactDigest                   | 上传成功输出的精确归档 ID 与平台摘要；与候选内容摘要是不同事实                   |
| sourceRevision/version/contentIndexDigest/candidateDigest | 将已上传内容索引和 payload 绑定到真实平台归档；禁止按同名最新结果替换            |
| createdAt/expiresAt                                       | 保存真实平台时间与到期事实；计划保留14天，不超过平台限制                         |

平台收据可作为独立 artifact 保存；它自身的上传 ID 在成功后进入发布请求/运行摘要，不再回写收据。下载时校验收据与 payload 的精确 ID、所属仓库、run/attempt、head SHA、有效期及各自摘要。归档缺失、过期、检查未完成或不成功均无 ready 资格，须重新准备并重新授权。

检查事实以可信平台/工具结果为依据，不能只信任 artifact 自报字段；必需 failed/not-run/缺环境 skip 阻止 ready，明确不适用项须有理由。isolated 只允许标明的合成平台材料；任何公开字节、身份或证据被替换，都必须拒绝原资格。

## 发布请求与结果 PublishRequest / Publication（计划）

请求包含 executionMode、当前仓库/事件/ref/actor、version、sourceRevision、runId/runAttempt、payloadArtifactId、receiptArtifactId、catalogDigest、contentIndexDigest、candidateDigest 和预配目标。两个 artifact ID 分别来自实际上传结果，不由名称推断。模式为 isolated/standalone；isolated 只接测试拥有的本地 bare Git，standalone 还要求迁后根工程、默认分支 workflow_dispatch 和当前仓库目标。凭据由执行平台注入，不作为请求文件、日志或候选字段。

Publication 保存 tag=`skills-v<version>`、repository、publishedRevision、rawRoot、officialSkillsRoot、候选身份及是否复用。rawRoot 是 raw.githubusercontent.com 下同一完整发布 SHA 的文件根，officialSkillsRoot 是 github.com 下同仓库同 SHA 的 tree/skills 目录 URL；分类和单技能继续追加目录。两 URL 按 repository/publishedRevision 强制绑定，不把 raw 目录当成官方安装来源。源码 SHA 与发布 SHA 分别保存；发布提交树严格等于 payload，无源码父树，不包含 CI 记录、项目源码或多版本目录。已有 tag 全部字节相同则复用原 SHA，不同拒绝覆盖；同版并发依靠新 tag 无 force 创建裁决，concurrency 只作辅助。发布 ref 已创建而远端核验失败时，不能把 Publication 改写为未发生。

## 流水线运行记录 PipelineRun（计划）

字段为 schemaVersion、executionMode、trigger、repository/sourceRevision、toolchain、candidate、authorization（无秘密）、publication、stages、coverageLimits、retry。阶段为 check/candidate/publish/remote-verify，各自 success/failed/skipped/not-run 并附 reasonCode；总体 success/partial/failed 仅概括本次请求，不承载 Task checkbox。

流转为检查 → 候选准备 → 授权核对 → 发布 → 远端核验。当前 Foundry 请求终止于隔离演练，真实 publish/remote-verify 标记等待迁移的 not-run，不把本地演练结果当真实阶段 success。迁后检查不通过则发布未运行；发布已写而远端核验失败为 partial，保留固定 ref、旧完整版本和续接条件。日志/运行 URL 由 CI 平台保存，不新建跨仓库状态服务；字段定义的完整调用规则见 [pipeline 契约](contracts/pipeline.md)。

### T010 正式字段格式与校验边界

类型和校验分别位于 `packages/skills/build/distribution/models.ts` 与 `validate.ts`。`ReleaseFile` 为 `{ path, bytes, sha256 }`；`files` 保存交付根相对路径，拒绝路径逃逸、重复、大小写冲突、文件/目录相互占用以及固定扩展声明和清单自身摘要。`tools.skills` 声明 latest，实际版本由每次调用在线解析并记录在报告 upstream；其余工具仍采用 Specify 1.2.6 及已确认 Node/shell 下限，npm 单独记录实际验证基线。版本使用 ASCII SemVer；源码提交使用完整 40 位 Git SHA。

`projections` 的两个键固定为 `identity` 和 `eve-frontmatter-v1`，每个键下按技能声明名保存 `ProjectedFile[]`。每项的 `path` 是技能内安装相对路径，`sourcePath` 是交付文件表中的来源，`bytes` 与 `sha256` 必须匹配同一来源字节。技能的 `installedFilesByProjection` 只列对应安装相对路径，摘要集中在顶层投影表；两种投影都必须覆盖本技能完整来源文件集合。Eve 只允许各层 `SKILL.md` 按官方规则转换，普通附件保持原始字节。`adapters` 使用同样的文件摘要结构，引用同一 `files`，必须包含 script/install-skills/read-agents.mjs 及平台脚本，不自行维护另一套字节事实。

`parseRelease`、`parseReleaseJson` 校验完整结构及跨字段引用，不修改输入、不写目录、不自动补依赖；缺少公开依赖直接报错。`assertReleaseUnchanged` 对同版本不同清单拒绝覆盖。可选 `development` 仅说明候选用途，结构校验通过不代表 README/许可证、完整同版技能集合、全部平台或公开发布验收通过，这些仍由后续原任务判断。T012 通用默认构建已经接入正式模型；T051 最小开发清单只保留历史证据，完整同版来源验收仍未完成。

## 技能 Skill

字段：`name`（frontmatter 唯一身份）、`category`（coding/frontend/workflow）、`directory`、`sourceFiles`、`installedFilesByProjection`、`requiresSkills`、`projectPrerequisites`、`mountMappingIds`。

递归覆盖正文、references、scripts、assets 等实际必需文件；声明 hooks 的技能还包含与 SKILL.md 同目录的 speckit-hooks.json，纳入 sourceFiles、投影后的完整文件集及摘要核验。附件路径必须在本技能内；禁止源符号链接、大小写折叠冲突和遍历路径。技能间依赖须已公开且被用户显式选择；Increment 不依赖三个暂停模式，适用准备 hook 的附件属于同一技能，不作为额外安装选择；项目材料依赖与技能依赖区分。Eve 投影的正文语义和必要元数据须与官方安装等价；不能仅忽略差异。

## 安装请求与结果

`InstallRequest` 包含 entry（official-check/curl/mount）、version、source、selector、agent、scope、cwd、mountProject、hidden、noMount。selector 为 all/category/names 三选一；name 数组去重后仍保留稳定顺序。一次调用只接受一个目标 agent；官方 CLI 自身的多 agent 能力不受此限制。

`Selection` 由版本清单解析，记录请求名、来源分类、依赖检查及投影，不从历史目录推导。`VerifiedSkill` 关联选择项，保存实际入口与解析后路径、完整文件集、摘要、版本证据、安装或复用原因。未知同名目录即使内容碰巧相同也不能由 curl 自动取得所有权；官方第二步可显式只读核验其与所选发布内容等价，报告“本次核验通过”，不声称证明了安装时间或原始安装者。

`InstallReceipt` 位于对应技能根外侧的 `.foundry-distribution/receipts/<name>.json`，包含 source、version、catalogDigest、agent、scope、路径和文件摘要。收据不可信任为唯一事实，重试必须重验文件；不将收据塞入技能目录改变两入口文件等价性。无归属证据的中断目录视为冲突，不能自行删除。

每项技能状态为 pending → staged → verified → installed/reused，任一步可 failed；未轮到的项为 not-run。只有完整 installed/reused 或官方本次核验成功集合进入后续步骤；部分成功不能升级为全成功。

## 挂载调用计划与事实

`MountMapping` 的事件及 hook 条目只从本次所选已安装技能的 speckit-hooks.json 读取，顶层为事件名，值为条目数组；extensionId 沿用技能标识，projectPrerequisites 仍按项目前提核验。当前规划来源为 implementation-preparation、artifact-spec-analysis、artifact-project-description，正式使用时以主线实际同版文件为准。平台脚本组装临时 hooks-only 声明，不维护配置副本。命令组仍为 modes，成员仅 task-increment；选择、正文、附件和版本满足后注册，不要求三个暂停模式。缺必需配置属于 missingFiles，须在本批首次官方调用前失败；无 Increment 选择为不适用，不从历史目录补选，不存 registry、指纹或第二套状态。

`PreparationDelivery` 只是同一 Skill 的消费事实：skillName、releaseVersion/catalogDigest、正文与实际必要附件的文件摘要、hook 事件/extensionId、生成入口及引用路径、loadEvidence 和 coverageLimits。不是单独持久格式或工程状态。source/installed/projection 文件按清单字节核验；官方生成入口允许原生 frontmatter 转换，核对身份、有效正文及附件可读。loadEvidence 缺失不能宣称完整加载，不能代替主线讨论、逐 Task 方案或停止/放行证据。

`ManagedMigration` 保存本次旧登记/受管产物清点、来源依据、未知内容冲突、拟调用官方操作及实际前后差异，作为 RunReport 的阶段证据，不新增对象状态系统。仅清点官方登记及明确受管路径；未知附件或归属不明时受影响官方调用未执行，现场保留。成功须证明旧三入口去留、连续重试不复活、无关内容保持，退出0或新清单缩减本身不充分。

`MountTarget`：显式项目绝对路径、Spec Kit 版本、default integration、配置快照摘要与只读解析结果。项目级默认 cwd；全局没有隐式挂载项目。非 Spec Kit 为 skipped，已有 Spec Kit 但工具/版本/集成不符为 failed。

`MountResult`：hooks、commands 独立阶段。hooks 记录所选配置逐项官方重装结果，commands 记录 Increment 每次官方重装与原生产物核验；没有安装内容复用导致 skip-add 的分支。hooks 失败则 commands=not-run；无 Increment 选择为 skipped，所选来源不完整为 failed，缺三个暂停模式不算失败。暂停入口迁移报告实际差异，不自动改变工程 checkbox。官方写入后读回失败保留已写事实和恢复条件，不伪称原子回滚。

## 隐匿与总报告

`ExcludeItem`：项目、相对精确路径、归属、原跟踪状态、排除规则、实际命中来源、生效结果。仅本次成功内容且在目标项目内的独占路径可入列；共享配置和项目外全局文件列为 coverageLimit，不伪造成功。

`RunReport`：schemaVersion、request、resolvedRelease、upstream、skills[]、stages（installation/hidden/hooks/commands）、overall、retry[]、coverageLimits[]。阶段枚举 success/skipped/failed/not-run，附机器 reasonCode 和中文说明；overall 为 success/partial/failed。请求步骤任一失败则退出非零；允许的“不适用/关闭/无仓库”等 skipped 不是失败。安装已成功而挂载失败为 partial，保留成功事实。

`upstream` 记录本次在线解析的 `{ package: "skills", channel: "latest", version, integrity }`；version 与建议原生命令一致，integrity 对应同一实际发布包。不把解析结果存为下一次的来源锁；网络、完整性或规则布局失败须明确失败，不使用旧表。

报告默认输出 JSON 至 stdout，进度写 stderr；不默认写项目报告文件。显式 `--report <path>` 才创建报告，已有报告路径拒绝覆盖；报告不自动加入排除。跨文件不承诺事务回滚；原生写入中断留下的未知状态须供用户处理，不能按收据盲重试。

Agent 在线来源直接由 script/install-skills/read-agents.mjs 提供，包根 distribution 目录和 agents.json 已移除。构建只交付读取器及平台脚本，不维护另一份来源声明或映射。安装期读取实际 npm 元数据和同包规则，报告 upstream 保存本次实际 version 与 integrity。该运行记录不回写发布清单或形成下次调用的版本锁。eve-frontmatter-v1 是投影格式标识，与 CLI 发布版本分开。
