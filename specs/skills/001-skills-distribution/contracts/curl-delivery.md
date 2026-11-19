# 当前主线 curl 交付契约

## 2026-11-19 安装后调用引擎入口

安装源在技能复制成功后调用同包 `engine/install.sh`，由该入口执行本次子插件 Shell 资产。`--no-mount` 继续跳过整个调用阶段，隐匿的可选性和独立结果保持；缺统一入口、入口或其父路径为软链接时报告安装后步骤失败，保留已经安装的技能。子脚本的运行顺序、预检查与失败传播见[引擎入口契约](build-pipeline.md#2026-11-19-引擎统一入口)。本节替代下方安装源直接查找 Speckit 新旧路径的历史约定；本地产物新增 `dist/engine/install.sh`。[用户原话](../requirements/raw/2026-11-19-engine-output-directory.md#后续统一调用入口)

## 2026-11-19 本地构建与 R2 下载表

当前本地产物为 `dist/VERSION`、`dist/skill/`、`dist/curl/install.sh`、`dist/script/hidden-install.sh` 和 `dist/engine/script/speckit-mount.sh`。安装时优先读取包内 `engine/script/speckit-mount.sh`，也支持原包内的 `script/speckit-mount.sh`。[引擎产物目录](build-pipeline.md#2026-11-19-引擎子插件输出)

版本表仅在 R2 维护，构建独立于该表。单包归档及下载表更新留流水线阶段。当前本地路径和版本表落点以本节为准。[版本表确认](../requirements/raw/2026-11-19-r2-version-table.md)

## 2026-11-18 最新目标：curl 接回隐匿脚本生成

[Spec](../spec.md) FR-078 确认将现有 `vite-plugin-script` 的启用技能扫描、hidden 模板和生成逻辑移回 `vite-plugin-curl`，由 curl 同时交付 `script/install.sh` 和 `script/hidden-install.sh`，迁移后移除旧 script 插件；入口保持安装源原字节，hidden 的候选路径、前缀占位及成功集合限制保持。后续 workflow 子插件另外生成 `script/speckit-mount.sh`，引擎的自动发现接口见[构建契约](build-pipeline.md)。

这是目标归属调整，当前源码仍由 script 插件派生 hidden；本轮仅规划并由主代理新增引擎，不执行回迁或运行消费。统一包、公开入口和脚本路径不因插件归属改变，版本、下载、摘要及独立失败报告继续沿本契约。下方原迁移结果保留历史，不视为已完成本次回迁。

## 2026-11-18 有效增量：脚本统一归属与路径

依据[最新 Spec](../spec.md)和[目录及后续迁移授权](../requirements/raw/2026-11-18-unified-script-directory.md)，本地及统一包内的运行脚本分别统一为 `dist/script/`、`script/`。按用户最终纠正，`vite-plugin-curl` 原字节交付安装入口，`vite-plugin-script` 只扫描技能并派生 hidden；两个脚本各有一个责任插件。前轮只新增骨架，后续已完成局部迁移及构建验证，见[T077结果](../implementation/T077.md)；统一包与运行调用仍是后续目标，不由本地构建推定已交付。

安装源及其读取/emit逻辑位于 curl 插件，hidden 模板已原字节移至 script 插件目录，由后者承担扫描和派生；输出分别为 `script/install.sh`、`script/hidden-install.sh`，避免双重交付及旧路径残留。输出目录统一不要求所有脚本由同一插件生成。非脚本 `curl/skills.tsv`、下载版本表及远端 `curl/<version>/install.sh`、`curl/install.sh` 的职责和地址保持，固定入口对象字节从 `script/install.sh` 取值。脚本源码落在哪里不决定公开路径，不复制另一套模板。

格式1沿当前尚未发布的统一布局设计调整；如后续识别到真实旧格式版本，先明确兼容/拒绝策略，不静默回退 `curl/script/` 或执行未核验代码。本次迁移只调整构建交付，不新增运行调用，不改变原失败保护及候选门禁。

## 2026-11-16 有效设计：统一包与根 VERSION

依据[最新Spec](../spec.md)、[流水线单包确认](../requirements/raw/2026-11-16-unified-pipeline-package.md)和[暂缓随包逐文件JSON](../requirements/raw/2026-11-16-defer-file-manifest.md)。本节是Plan Phase 1设计，替代下方双包、分区VERSION、scripts下载引用及强制manifest消费；不代表代码已经实现。旧契约保留追溯，紧急版schema1和官方安装加显式挂载不变。

### 本地构建与正式包布局

现有唯一Vite配置注册skill/curl/version三个插件，分别交付技能目录、原字节入口与生成的hidden脚本、根dist/VERSION。前两个插件的归档命令保持注释，构建不执行运行脚本。流水线等内容生成完成后独立核验并收集正式材料，不依赖插件写出偶然顺序，不给插件增加共享可变上下文。

本次规划选择归档名skills-<version>.tar.gz，包内直接为下列根路径，不套dist/或版本目录；正式归档在本次独占暂存目录之外创建，避免收录自身。根VERSION由package.json.version派生，内容为版本和结尾换行。此布局、映射编码及字段是设计选择，不倒写成用户原话。

| 包内对象                               | 来源及校验                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| VERSION                                | 当前dist/VERSION，须等于所选统一版本                                                         |
| skill/<分类>/<目录>/                   | 仅coding/frontend/workflow获准启用技能；完整正文和普通/二进制附件，不带eval/profile          |
| script/install.sh                      | install.source.sh原字节；保留同版入口供追溯，运行不因选择历史包而改用它                      |
| script/hidden-install.sh               | 真实TS模板派生Bash；正式候选路径只含获准技能，接口标记见下文                                 |
| curl/skills.tsv                        | 流水线生成的最小身份/依赖/路径映射，非执行数据，不是逐文件清单                               |
| README.md、LICENSE及实际必要第三方通知 | 包说明在冻结前改成当前可用行为，真实ISC可取仓库根LICENSE；第三方实际许可与来源不能被统一改标 |

不强制release-manifest.json、script/manifest.json或逐文件清单插件。流水线仍在包外保留来源、获准技能、附件引用、文件全集/字节与候选检查证据；缺件、越界、链接、重复身份/安装目标或非公开材料必须失败。开发dist中的eval/profile、虚拟JS、旧索引、源码TS、测试、归档和个人资料不得直接递归打入包。hidden模板内路径也是交付内容，删除内部技能目录不足以证明无内部身份泄露。

### 版本表与固定对象

唯一源版本为packages/skills/package.json.version；只改技能或脚本都递增整体版本。流水线为统一包计算实际bytes/SHA-256，暂留MD5供旧入口解析兼容，不要求不同构建归档哈希相同。一旦冻结候选，发布和重试只用原字节。

规划固定对象为skills/<version>/skills-<version>.tar.gz及curl/<version>/install.sh；最新发现对象为curl/release.json和curl/install.sh。实际HTTPS根待真实目标输入，示例域不能视为已部署地址。单独保留入口是为了启动和追溯，不形成第二个运行归档；技能和hidden均从一个所选包获取。

release.json继续是数组，最新已发布记录在首条，latest取首条，显式版本要求唯一匹配。全表拒绝重复版本、非法类型、未知格式、不合法URL或摘要，不只校验选中行。字段如下：

| 字段                                   | 格式及语义                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| version                                | 唯一SemVer，与包根VERSION一致                                                      |
| formatVersion                          | 正整数，当前统一布局及映射为1；未知格式明确拒绝                                    |
| url                                    | 对应版本固定包HTTPS URL，无空白/控制字符                                           |
| bytes                                  | 实际归档长度，正安全整数                                                           |
| sha256                                 | 64位十六进制，正式入口必需，不以MD5降级                                            |
| md5                                    | 32位十六进制，过渡记录保留；存在时也须合法，不能代替sha256                         |
| sourceRevision                         | 实际源码完整40位Git提交，来自流水线核验，不由入口推测当前HEAD                      |
| entry.url / entry.bytes / entry.sha256 | 同次版本固定入口及实际身份，入口版本为该行version；与包内script/install.sh字节一致 |

无manifest、scripts.url或第二包关联。缺SHA的旧记录不能被新正式入口自动当合格包；已有真实历史如需支持，先取得对应字节核验并适配合法格式，不能补造记录。本期无真实历史时，跨版本兼容由隔离样本验证，真实历史部分仍待验。

入口本次固定索引原字节摘要、选中记录及包身份，不中途重读latest，不因下载失败换版。最新入口能消费承诺的历史formatVersion；未知协议明确拒绝。实际运行入口身份由执行前取得的脚本原字节和可信固定引用核对；从旧版本位置参数不能推出入口版本，读取最新索引也不能证明已执行字节。无法核实实际入口身份时如实标明缺口，不把脚本自报当证据；正式验收采用取得脚本文件并比对后再执行的方式。

### 技能映射数据与选择

curl/skills.tsv首行固定为`# foundry-skills 1`；后续每行五列，以单个TAB分隔：name、category、sourceDirectory、installRelativeDirectory、requiresSkills。第五列为逗号分隔且去重的声明名，无依赖使用`-`。文件使用UTF-8及LF，不接受多列、空列、重复行、控制字符或未知版本。不把该文件source/eval，也不执行TS集合配置来取得依赖。

name及技能目录段限定为小写字母/数字与内部连字符组成的非空安全标识符，开头结尾为字母或数字；category只允许获准三分类。sourceDirectory必须是skill/<category>/<目录>；当前installRelativeDirectory恰为<目录>。构建读取正文声明name及计划扩展的集合字段skill[目录].requiresSkills（声明名字符串数组），缺省为空数组；现有类型仅有enabled，此字段扩展尚未实施；未知依赖、环或跨集合目标碰撞失败。映射与实际获准技能目录双向一致，不含逐文件路径、大小和摘要，因此没有恢复被暂缓的文件清单。

公开参数为`install.sh [version]`，版本省略为latest；选择必须且只可用--all、--category <分类>、--skill <名称...>之一，--skill可重复合并去重。无选择/空值/混用在可静态判断时提前拒绝，未知技能/空分类/缺必需依赖在已核验包选择时拒绝，不静默补装。声明名、分类和目录均核对，不能只按二级目录全量复制。原agent/scope及--no-mount目标保持后置适配；尚未支持的参数在目标写入前明确失败，不让任意参数被当成版本。

### 获取、核验与逐技能提交

1. 检查参数和必要工具，在本次私有临时目录登记退出清理，再准备固定版本node-jq及本次独占npm缓存。只消费所选agent/scope的当次在线元数据，校验同一发布包版本/完整性；不运行官方skills安装，不回退静态路径表。当前代码尚未完整实现这些约束。
2. 一次解析并固定版本记录，下载唯一包；核对实际长度与SHA-256，失败时零技能提交、零辅助执行。MD5错误不能触发降级或切换来源。
3. 解包前验证成员：拒绝绝对/逃逸/重复/大小写碰撞路径、软硬链接、设备/FIFO和其他特殊成员，严格处理PAX/GNU扩展中的有效路径。安全检查方法先经真实恶意样本证实；不以简单grep或“解完再看”充作保护。只解到本次私有空目录，失败清理本次材料，绝不删除未知目录。
4. 核对根VERSION、格式、映射及必要结构；比对所选正文、附件和依赖。统一包整体不可信或版本/映射错误不安装。所选技能结构完整而仅hidden模块缺件/不兼容时可继续技能安装，hidden独立失败；正式候选仍须因缺必需hidden材料而拒绝发布，运行容错不降低发布门禁。
5. 每项在目标同文件系统内暂存，对照已核验包内该技能的相对文件全集及原字节，再提交。未知同名、用户修改、不同版本、已跟踪目标或额外文件拒绝覆盖；相同来源版本且完整相同可reused。为使退出清理后的第二次独立调用能证明版本，首次安装在该技能暂存目录内原子写入保留文件.foundry-source，再随技能一同提交；文件为固定键值数据，保存formatVersion=1、version、sourceRevision、name、sourceDirectory，不保存文件哈希、任务状态或历史操作日志，不建立registry/永久指纹。该路径为安装器独占元数据，发布技能中不得预占。重试先校验标记的固定字段和当前受信记录/映射，再将除这个精确保留文件外的技能文件全集/原字节与包内来源比较；仅有标记或仅字节相同都不够。缺标记、标记不同版/损坏、额外用户文件或内容差异均报告冲突，不认领未知同名目录。键值按固定白名单逐行解析，不source/eval，拒绝重复键、控制字符、链接及不安全字段。该标记只作版本来源线索，不能替代每次完整重验。
6. 逐项保存installed/reused/failed/not-run及实际位置，只有完整installed/reused进入成功集合；复制中断不把残缺目录算成功。恢复先核对现场，保留成功项及用户内容，不用HOME暂存跨文件系统原子移动。后置hidden失败不回滚成功技能。

### 隐匿内部调用协议1

模板源为 `packages/skills/build/plugins/vite-plugin-curl/hidden-install.template.ts`，由构建生成 `script/hidden-install.sh`。构建把候选安装相对路径和 `@@AGENT_SKILLS_ROOT@@` 标记写入固定数据参数。生成脚本第二行标记为 `# foundry-hidden-interface: 1`，入口在执行前核对该标记。

内部调用使用 `bash <已核验绝对路径>/script/hidden-install.sh --project <绝对项目> --agent-root .agents/skills --successful-skills-file <绝对JSON文件> --result-file <绝对新结果文件>`。临时成功名单为 JSON 数组，每项包含 `name`、`installRelativeDirectory`、`installedPath` 和布尔值 `complete`。当前入口在 `cp -R` 成功后收集目标路径，仅当显式传入 `--hidden` 且已有成功项时写出名单并调用。

允许处理集合为正式模板候选、本次显式选择、完整成功集合的交集。只核对明确项目本地.git，缺失/父仓库子目录/.git文件按当前保守范围跳过，不向上找、不初始化。追加前核对未跟踪及项目内独占路径，保留原exclude、转义精确锚定路径、去重，再以check-ignore/ls-files/status核对效果。当前只验证.agents/skills前缀；项目外global、共享配置、已跟踪内容不声称隐藏成功，不取消跟踪或修改全局配置。

结果文件包含 `status`（`success`、`skipped` 或 `failed`）、`reasonCode`、`processed`、`skipped` 和 `failed`。已处理项是项目相对路径，跳过项和失败项记录路径及原因。成功或明确不适用时退出 0，运行失败时退出 1。入口核对结果和退出码，名单和结果随本次临时目录清理。

### 独立结果与发布后置

未请求hidden时执行次数0且零排除新增。统一包核验通过且installation整体成功后，hidden缺件、未知协议或Git失败报告“安装成功、隐匿失败”、overall=partial与非零退出。若技能仅部分安装成功，则保留逐项失败/未执行事实，报告“安装部分成功、隐匿失败”；hidden只处理完整成功项，不能把installation改成success。统一包获取/核验失败与hidden失败是不同前提，不能套用下方旧双包容错。静态参数/前提错误退出2；运行失败退出1；请求步骤均成功或明确不适用才退出0。挂载近期暂缓，不能伪报hooks/commands成功，原最终验收保留。

发布版本表 `curl/release.json` 的唯一持久来源为 R2。后续流水线以已核验的固定统一包和同版固定入口为依据维护表。仓库只提供源码及当前源版本，本地构建不依赖版本表。候选和当次核验凭证沿原流水线边界留存。

两个发现对象不是事务：先条件更新并核验兼容新旧记录的入口，再按预期旧ETag更新版本表；后步失败保留旧完整索引和已更新入口，分别报告。普通新版本高于当前最高已发布SemVer；旧版重试只核对/补齐自身事实，不回退latest或入口。消费端仍按首条，不自行排序。竞争时停止本次发现写入并读回，不丢其他行；合并后的新字节须在适用授权范围内再更新，禁止盲写或用旧授权放行不同摘要。

R2授权绑定预配置bucket、固定prefix、公开HTTPS origin、version/sourceRevision/candidateDigest、对象及发现新字节摘要，并覆盖适用的 R2 发现更新；旧Git repository-only授权不适用R2。具体记录字段见模型。候选文件表和平台收据在包外，发现材料另行绑定更新字节与授权。R2条件写、权限、断连/并发及公开缓存必须先验证，不能复制紧急Git算法作为通过；官方依据与技术前置见[研究](../research.md)。版本表更新机制在流水线阶段复核，当前先验本地构建。

<details>
<summary>历史双包契约与此前同步边界（不作为当前实施前置）</summary>

## 最新边界：包内逐文件 JSON 暂缓

依据[本轮同步确认](../requirements/raw/2026-11-16-defer-file-manifest.md)，本期不强制交付逐文件JSON清单；release-manifest.json及script/manifest.json的随包要求暂缓，不能用缺少这类文件阻止符合当前单包要求的构建或安装。下方原schema、manifest引用及文件表格式是此前设计，不是本轮新消费前置，紧急版原契约保持。

保留根VERSION、release.json下载版本表及整包摘要。安装器核验下载包再解压，核对根VERSION与所选版本一致；当前MD5与正式SHA-256字段的兼容仍待后续方案。统一包字段及远端布局待规划，不能继续按旧scripts/manifest双包引用直接发布。

流水线仍检查正式白名单、技能身份/依赖、正文/附件、运行材料、说明和许可证，核对候选全集及字节；记录留在流水线证据即可，不强制装入包内JSON。整包摘要不能替代发布前缺件检查；旧逐文件清单职责的实现和完整业务验收均不因本轮同步算作完成。代码与工程checkbox保持。

## 最新边界：统一版本与后续流水线单包交付

按[统一流水线归档确认](../requirements/raw/2026-11-16-unified-pipeline-package.md)，主线取消插件各自产出技能包/辅助包及分别下载的安排。当前两个插件只生成统一dist中的内容分区，归档代码已注释；后续流水线构建一个正式发布包。版本唯一源继续为package.json.version。

下方双包路径、两套下载引用和各插件归档阶段记录此前设计，已被本节替代，不能据此恢复压缩或直接生成发布索引。整体版本标记已由用户确定为dist/VERSION，现由独立vite-plugin-version调用readPackageVersion并在generateBundle输出，值取package.json.version且带结尾换行，替代原分区VERSION规划。统一包名、包内布局、清单及远端对象布局仍须后续规划适配；流水线统一打包尚未实现。原正式白名单、来源/摘要核验、用户保护、后置隐匿独立结果和授权要求保持，历史失败场景须先核对其新单包前提。

依据[统一版本确认](../requirements/raw/2026-11-16-unified-release-version.md)，本契约改用 package.json.version 统一发布；此前独立curl源版本选择已被替代。最新入口消费历史同版技能/辅助包的规则保持。

日期：2026-11-16。依据[规格及三项澄清](../spec.md#session-2026-11-16)、[独立归档及变量位置原话](../requirements/raw/2026-11-16-plugin-archives.md)、FR-053/057/058/068～075、SC-020。本文区分当前局部交付与正式设计目标；schema及接口仍是规划选择，不倒写为用户原话。适用 packages/skills 的安装与可选隐匿；不修改[紧急版契约](urgent-release.md)，不恢复近期暂缓的 Spec Kit/hook/Increment 实施。

## 本地输出与版本来源

| 对象           | 规划来源或落点                                             | 规则                                                                        |
| -------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| 技能源版本     | packages/skills/package.json 的 version                    | 沿用当前包版本，构建派生 skill/VERSION                                      |
| curl 源版本    | packages/skills/package.json 的 version                    | 与技能共用唯一源版本；构建派生 curl/VERSION，同次发布入口和辅助包同版       |
| 发布记录       | 计划新增 packages/skills/releases/skills.json 与 curl.json | dist 外持久 JSON，只登记已发布且远端核验成功的记录，不作为任务状态          |
| 技能正文与附件 | dist/skill/<集合>/<技能>/                                  | 构建可含内部集合；正式归档仅取 coding/frontend/workflow 获准清单，排除 eval |
| 技能清单及归档 | dist/skill/release-manifest.json、dist/skill/skill.tar.gz  | 清单描述正式选择；归档最终放入 skill 目录，打包时排除自身                   |
| 独立入口       | dist/curl/install.sh                                       | 独立源 install.source.sh 原字节复制，构建不执行入口                         |
| 辅助脚本       | dist/curl/script/hidden-install.sh                         | 由现有hidden-install.template.ts生成Bash正文，路径数据来自实际安装映射      |
| 辅助清单和归档 | dist/curl/script/manifest.json、dist/curl/scripts.tar.gz   | 清单属于 script 目录；归档只包含最终 script/，入口、版本表及归档自身不入包  |
| 版本发现表     | dist/curl/release.json                                     | 从持久已发布记录派生，JSON 数组；不因本次 build 自动新增成功发布行          |

源码模板只作为输入，生成物不手改。技能、入口及辅助包唯一源版本为 packages/skills/package.json.version，不新增 script/curl/VERSION。只改技能或脚本都递增整体版本并形成新的完整发布，不覆盖同版本不同字节。dist中的两个VERSION是构建派生标记，不是独立维护的源版本；后续版本维护命令不在本轮新增。

当前两个插件已交付启用技能、生成的隐匿脚本、原字节入口及各自归档；`VERSION`、正式发布白名单、两个清单与发布记录仍是待实现目标。当前技能包按 `scanSkills` 的启用清单归档，不能据此认定已符合正式公开范围。

## 发现与固定引用

R2 固定对象根为 `skills/<version>/`、`curl/<version>/`，同次发布使用相同 version。技能固定根交付 `skill.tar.gz` 与 `release-manifest.json`，curl 固定根交付入口、辅助归档及其可检查文件。稳定最新入口和版本发现表是可变发现材料，固定对象是不可变发布材料；实际域名由用户提供，本契约不使用示例地址冒认可运行来源。

技能索引条目字段如下，最新已发布记录放首条；`latest` 取首条，显式版本要求唯一匹配。空表、重复版本、未知版本、类型错误、非HTTPS地址或空白控制字符必须失败，不能退到另一记录。

| 字段                                         | 类型及语义                                                  |
| -------------------------------------------- | ----------------------------------------------------------- |
| version                                      | 技能 SemVer，与单版清单及 skill/VERSION 一致                |
| url / bytes / sha256                         | 固定技能归档 HTTPS 地址、非负整数长度、64位十六进制 SHA-256 |
| md5                                          | 32位十六进制，保留当前入口过渡兼容；正式核验仍使用 SHA-256  |
| manifest.url / manifest.sha256               | 单版清单固定地址及原字节摘要                                |
| scripts.version                              | 必须等于该索引条目的 version；可不同于最新入口运行版本      |
| scripts.url / scripts.bytes / scripts.sha256 | 固定辅助归档地址、长度、SHA-256                             |
| scripts.interfaceVersion                     | 正整数调用协议，首版设计为1                                 |

辅助包关联在对应技能版本首次成功登记时固定。同一技能版本不允许改地址、内容摘要或 scripts 关联；修复需形成新版本。入口启动后固定实际入口版本/摘要、索引摘要及选中记录，不在中途重查 latest。最新入口须适配所有仍承诺支持的历史辅助协议；缺兼容不能用改包、改技能或回退入口掩盖。

curl 发布记录保存 version、sourceRevision、入口及辅助文件摘要和已核验固定地址；与同次技能发布记录使用相同版本及源码身份。记录可分文件保存，但整版所有固定对象核验成功后才登记完整发布并更新发现表；仅上传某一个包不能冒认整版成功。实际最新入口可能来自更晚的发布，不得用它的提交覆盖历史技能或辅助包的来源身份。

## 两类文件清单

主线 `release-manifest.json` 使用 `schemaVersion=2`、`kind=skill-release`，包含 version、完整 sourceRevision、skills、files 及适用安装映射。files 每项为 path/bytes/sha256，路径相对技能归档根；技能文件以 `skill/<集合>/<技能>/` 开头，正文、普通和二进制附件均完整收录。清单映射声明 name/category/sourceDirectory/installRelativeDirectory/requiresSkills，名称唯一；当前安装映射展平为 `<技能目录名>`，不同集合的目标同名必须拒绝。

技能归档成员全集恰等于 files 加根部 `release-manifest.json`，files 包括 skill/VERSION、交付说明及真实许可证等必需材料，不包括清单自身。构建目录的单版清单在归档时放到根部，不能把实际路径不同误算为缺件。摘要按原字节求值，catalogDigest 指单版清单原字节摘要；内部候选索引可按旧稳定文件表算法复用，但须适配新清单名和路径。

辅助 `script/manifest.json` 使用 `schemaVersion=1`、`kind=curl-script-bundle`，包含 version、interfaceVersion、files 和 hiddenPaths。files 相对 script/ 根，不包含清单自身；hiddenPaths 包含 skillName、installRelativeDirectory 和 templatePath。外部技能记录决定辅助包关联，辅助清单不嵌入某一个技能版本号，以允许完全同字节材料被不同技能版本复用。实际文件全集须恰等于 files 加 manifest.json。

旧 Release schemaVersion=1 的 tools/projections/adapters 等含义留给旧消费者及紧急版。新文件名或新schema不得直接送入旧 parseReleaseJson；主线需显式适配，不以删除字段、断言或旧测试冒称兼容。原三平台、动态agent、四种选择和global交付目标继续有效，当前局部实现不代表全矩阵已交付。

## 构建归档与路径注入

当前唯一 Vite 配置注册技能与 curl 两个插件，各自调用公共无状态 `scanSkills` 获取启用技能，不新增共享可变 context，不依赖另一插件的写出顺序。两个插件的变量均在各自插件函数内声明，包括 `execFileAsync = promisify(execFile)`；公共扫描函数和独立模板仍在各自模块维护。正式交付还须校验获准集合、技能身份及安装映射，与技能产物不一致时最终复核失败，不静默取两者并集。所有来源及输出安全检查须在破坏性清理前完成，write=false 不创建目录或归档；这些完整检查不能据当前基础实现判为已通过。

隐匿源码复用 `packages/skills/build/plugins/vite-plugin-curl/hidden-install.template.ts` 的 `createHiddenInstallScript(enabledSkills)`，已通过 `generateBundle` 交付独立 Bash 产物 `dist/curl/script/hidden-install.sh`；旧 script/curl/hidden-install.sh 不再作为必须恢复的源码。构建期生成字符串与消费端执行脚本分开，不比较 TS 源码与 Bash 产物字节。当前模板已有 Git/排除基础逻辑，尚未接入完整成功集合和结果协议，也未做 ls-files 已跟踪检查；本契约中的保护条件不能全部当作已实现。隐匿模板使用标记 `@@AGENT_SKILLS_ROOT@@`，每条路径由标记加实际安装相对路径组成；严格按确定的声明位置生成数据，不对任意 shell 正文全局替换或执行来源。运行当前只映射到 `.agents/skills`；构建机绝对路径、集合层路径和未替换标记不得作为 Git 排除规则。

两个插件都在自身 `writeBundle` 中使用 Node 内置 `execFile` 的 Promise 包装调用普通 `tar -czf`，等待完成并传播命令失败。技能插件先等待复制完成，在 `dist/skill/` 外生成临时归档，排除既有 `skill/skill.tar.gz`，压缩完成后再移至 `dist/skill/skill.tar.gz`；避免在被扫描目录中创建归档触发目录变化错误。curl 插件在资产写出后归档 `dist/curl/script/` 为 `dist/curl/scripts.tar.gz`，入口与归档自身不在源目录内。

当前构建基线为 Linux GNU tar/gzip，不新增 USTAR 格式或固定元数据参数。逐次核对解压文件全集和原字节与本次目录一致，校验值按本次真实产物计算；不要求重复构建的归档哈希一致。选定发布候选后冻结该次原字节，重试复用已核验归档，不重新构建覆盖已发布版本。脚本仍由 Bash 显式调用；其他构建平台须另证，不由运行端支持范围推定。

## 获取、核验和执行

1. 入口检查静态参数和必要运行工具；既有选择仍要求 all/category/skill 三者择一，未实现选项须明确拒绝。依赖和下载只放本次私有临时目录；固定版本 node-jq 约束保持，不在目标项目或全局安装依赖。
2. 固定技能记录、单版清单及所选集合，验证正文附件、归档和版本/来源身份。先验证归档摘要与长度，解包前拒绝绝对/逃逸/重复/大小写碰撞路径、链接和特殊成员，解包后再核对实际文件全集和摘要；技能归档失败不进入安装写入。
3. 本次请求需要辅助功能时才取对应固定脚本包。验证大小、SHA-256、接口和成员，再解到本次私有空目录，逐文件复核；不依赖入口旁脚本或本机源码，不在验证前执行、source或eval下载内容。安全成员检查技术验证未通过前不得进入依赖实施，不新增独立 Node/Python 安装核心。
4. 技能通过与目标同文件系统的逐技能暂存、校验后提交；不能把HOME下载目录直接原子移动到任意项目。冲突保护、相同完整来源可复用、部分成功和中断续接沿原要求。
5. 仅隐匿包下载/校验/兼容失败时，继续安装独立核验的技能，hidden记录failed；安装自身失败仍如实报告。纯安装不因隐匿材料不可用而失败；默认关闭时不执行隐匿脚本。
6. 从实际 installed/reused 的完整成功项生成本次临时成功集合，再调用已核验的隐匿脚本，完成后读回其结果及实际排除效果。清理只删除本次拥有的材料，不自动删除未知残留或回滚已成功技能。

## 隐匿内部调用协议1

规划调用为 `bash <已核验绝对路径>/script/hidden-install.sh --project <绝对项目> --agent-root .agents/skills --successful-skills-file <绝对JSON文件> --result-file <绝对新结果文件>`。这是入口内部接口，不新增用户公开子命令；参数均独立透传，不拼接成可求值shell字符串。接口文件不得由技能正文或历史目录指定。

成功集合是对象数组，每项 name/installRelativeDirectory/installedPath 对应本次逐文件核验结果。允许隐匿的集合严格为模板候选、本次显式选择、实际成功集合的交集。脚本还须核对项目内归属、未跟踪、非共享及精确路径，不因内容名字碰巧相同取得所有权。

只检查目标本地 `.git`：无Git或父仓库子目录跳过，`.git`为文件按现有保守范围跳过，不向上找，不初始化Git。向本地排除文件保留原内容、去重追加锚定精确目录规则，路径特殊字符须正确转义。通过实际Git索引及check-ignore/status核对生效；已跟踪文件、共享配置和项目外global路径不能声称隐藏成功。

结果文件保存 status、reasonCode、实际处理/跳过/失败路径与覆盖限制；status=success/skipped/failed。脚本退出0表示成功或明确不适用，1表示失败；入口对失败与结果不一致不得判成功。报告路径位于本次临时目录，不作为永久技能收据、工程状态或隐匿目标。

## 阶段结果与发布后置边界

入口分别记录 installation、hidden、hooks、commands。技能安装成功且hidden失败为overall=partial、退出1，输出中文原因及重试条件；静态参数或前提错误退出2；无请求步骤失败才退出0。只报告实际运行结果，关闭/不适用为skipped，未执行为not-run。挂载近期暂缓；若用户请求尚未实现挂载须明确未实现，不能报告成功，也不能删掉原最终挂载验收。

候选冻结技能和curl各自字节及统一发布版本、同次来源；拟发布关联和预期旧发现索引摘要保存在候选之外。真实发布获授权后只上传冻结固定对象，远端核验成功后才登记持久记录并更新发现表/最新入口。可变发现材料单独绑定本次更新字节及授权，不能回写冻结候选。并发导致旧索引身份变化时停止更新并读回真实状态；R2条件更新机制须在后置发布技术验证中证明，不套用旧Git tag无force算法。

失败或发现材料更新中断不改写旧固定版本；已经上传与已经可发现分别报告。真实域名、凭据及具体发布授权仍为外部输入，本轮不写R2。当前先完成本地可验安装/隐匿，流水线、真实挂载、支持矩阵与公开来源、独立使用者验收沿原职责后续汇合，不降低full/ready门禁。

</details>
