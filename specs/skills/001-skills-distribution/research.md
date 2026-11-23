# 技术研究：统一发布包与安装消费

## 2026-11-23 推送测试与发布的技术取舍

本轮研究以每次推送测试、开放 `release` PR 的源分支推送发布测试环境、`main` PR 实际合并发布生产，以及测试 R2 按提交下载两份产物为输入。以下为规划选型。真实事件、依赖安装和存储行为按[验证指南](quickstart.md#2026-11-23-推送测试与发布验证)实证。[规格](spec.md#2026-11-23-主线技能构建与发布流水线) · [选项 A](spec.md#session-2026-11-23)

### GitHub 事件与源码提交

**决定**。保留 `skill-release.yml` 的无分支和路径筛选 `push` 测试，移除按分支取消较早测试运行的设置，保留 Python 与 Node 两套测试。测试发布采用目标分支为 `release` 的 `pull_request_target/synchronize`，由受信工作流核对开放状态、同仓库来源、推送者授权，以及事件 `before != after == pull_request.head.sha`。生产发布采用目标分支为 `main` 的 `pull_request_target/closed`，要求实际合并且有可核实的授权合并身份。从本仓受保护的 `main` 历史核对并检出事件的 `merge_commit_sha`，覆盖 merge、squash 和 rebase。[GitHub 事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) · [synchronize 事件 schema](https://github.com/github/rest-api-description/blob/main/descriptions/api.github.com/api.github.com.json) · [合并提交语义](https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request) · [并发控制](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

**理由与候选**。在 `push` job 中查询 PR，只能获得查询时刻的状态，期间 PR 可打开、关闭或改目标。普通 `pull_request` 使用 PR 合成合并上下文，遇到合并冲突或 fork 凭据限制会影响发布路径。所选事件保留变更快照并从受保护默认分支加载工作流。默认分支的工作流提交和待构建提交分别记录。生产只从本仓 `main` 获取已合入的内容，保留 checkout 对 fork 来源的保护。[默认分支与环境规则](https://github.blog/changelog/2025-11-07-actions-pull_request_target-and-environment-branch-protections-changes/) · [checkout 校验](https://github.com/actions/checkout/blob/main/src/unsafe-pr-checkout-helper.ts)

**平台前置**。GitHub 公告在 2026 年 12 月 2 日起默认阻止公开仓库中的 `pull_request_target`。启用前在实际仓库按两份发布工作流的路径核对生效的显式放行策略。保护 `main` 的直接写入路径，并以真实事件验证直接推送或其他 PR 合并造成的间接关闭是否能被识别。发布资格只接受可核实的直接合并事实。由平台跳过标记或 `GITHUB_TOKEN` 递归保护抑制的事件与项目规则均需在预检中区分，缺必需结果则对应发布无法放行。[公开仓库事件策略](https://github.blog/changelog/2026-11-02-pull_request_target-blocked-by-default-december-2/) · [策略设置](https://docs.github.com/en/actions/how-tos/administer/control-workflow-execution) · [间接合并](https://docs.github.com/en/pull-requests/reference/pull-request-merges#indirect-merges) · [令牌触发限制](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs) · [跳过规则](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs)

**生产合并判据**。选用本仓 `main` 的仓库活动与提交归属交叉核验。GitHub 仓库活动按 `pr_merge` 区别普通推送，提供分支、前后提交和操作者。提交关联接口用于确认引入提交的 PR 编号，与实际触发事件和该 PR 详情比对。已只读抽查 `pnpm/pnpm` 的 #18364 与 #18371，两条 `pr_merge.after` 对应各自唯一归属 PR 和其 `merge_commit_sha`。#18364 的活动操作者与 PR `merged_by` 相同。迁后仓库每种启用方式与间接关闭的具体响应仍须由 T061 实证。证据不足时生产放行失败。[仓库活动 API](https://docs.github.com/en/rest/repos/repos#list-repository-activities) · [提交关联 PR API](https://docs.github.com/en/rest/commits/commits#list-pull-requests-associated-with-a-commit) · [样本 PR](https://github.com/pnpm/pnpm/pull/18364)

### Runner 构建和依赖证据

**决定**。`publish` 的测试和生产发布复用现有 Ubuntu runner 和仓库 mise 配置。从触发提交的工作区声明和 catalog 无锁解析，使用 `pnpm install --no-lockfile --ignore-scripts`。构建命令维持 `pnpm_config_lockfile=false` 及 `pnpm_config_verify_deps_before_run=false`，依次运行两个包的现有 build。两份干净检出分别安装并记录实际构建依赖和工具，比较正式内容全集及字节。归档与独立安装脚本分别冻结长度和 SHA-256。[无锁要求原文](requirements/raw/2026-11-23-release-without-root-lock.md) · [pnpm 无锁安装](https://pnpm.io/cli/install#--no-lockfile) · [运行前依赖检查](https://pnpm.io/settings/build#verifydepsbeforerun)

**理由与实测**。原方案选用冻结安装是为了固定依赖解析。用户确认主线沿用无锁安装，根锁继续由仓库现有规则忽略。版本范围内的实际解析可能随仓库源变化，候选证据因此记录两次安装所得的依赖。根 postinstall 会调用文档站准备，发布构建跳过生命周期钩子并显式构建共享预设。隔离副本的 pnpm 12.16.1 无锁安装成功，`build:packages` 在 Turbo 调用子包构建期间会生成根锁。相同输入改由 pnpm 依次运行两个现有包脚本，读取依赖快照后仍无根锁。正式双构建和真实 runner 由原任务继续验证。[锁文件忽略规则](../../../.gitignore) · [根构建脚本](../../../package.json) · [历史容器验收](analysis/acceptance/docker-build.md)

**内容与复用**。原 tar 读取开发输出目录，正式暂存须先核对正文、依赖、许可及引擎内隐匿候选与白名单。保留此前用于追溯的包内安装入口副本，迁至 `curl/install.sh`，与独立发布件相同。历史 Python 36/39、Node 四文件 53/53 是不同范围的证据。两套现有测试的真实结果以实际候选为准。[本地历史验收](analysis/acceptance/local-build-loop.md) · [构建契约](contracts/build-pipeline.md#2026-11-23-runner-直接构建和正式归档)

### 可信交接与运行证据

**决定**。事件检查、构建与归档核验使用分离的只读 job。受信发布 job 在新 runner 上下载精确产物，校验后只上传冻结字节。发布凭据仅在相应环境的受信签发和 R2 交互步骤注入。构建保留 `persist-credentials: false`，发布流程禁用工作流缓存并避免共享 mise 缓存。用成功的必需 job、真实归档 ID、生产者 run/attempt 及对应的内容索引绑定本次交接。重跑发布 job 时记录新的发布 attempt 并核验原生产者 attempt 与有效期。

**理由与候选**。同一运行的整体结论在发布结束后才产生。上传结果和指定 attempt 的 job 结果能给出发布前证据。按最新归档名称、当前分支 tip 或整次运行结论选择候选会丢失对应性。公开仓库的发布器和 Action 引用以经核验的受信提交为准。[环境设置](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) · [缓存控制](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#cache-mode) · [尝试的 job 结果](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run-attempt) · [重跑](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs)

**授权与字节身份**。自动触发沿已批准的仓库合并规则和部署目标。冻结摘要和发现快照在运行中产生，受信发布 job 在校验候选和环境后形成授权引用。发现对象的预期摘要在同目标队列中绑定。这样合并授权和随本次运行形成的字节证据各有可核验来源。[生产发布授权契约](contracts/pipeline.md#生产发布授权与候选绑定)

### R2 对象、权限和恢复

**决定**。采用分别配置的测试桶与生产桶。测试键复用现有按提交和运行尝试分组的结构，默认前缀为 `skills-builds/`，计划测试对象保留 14 天。测试验收使用有权限维护者的只读 S3 下载，运行结果提供两条未签名的 `s3://` 地址和文件摘要。生产固定对象继续使用版本键。生产发布 job 按目标串行排队，用 AWS CLI v2 的 `s3api` 条件创建固定键，源站与公开下载均核验后，再条件写入并依次核验最新入口和 `curl/release.json`。发布步骤使用限定到对应桶及此次对象、只允许 `GetObject`/`PutObject` 的短期凭据，签发凭据仅可用于其受信步骤。[R2 令牌](https://developers.cloudflare.com/r2/api/tokens/) · [短期凭据](https://developers.cloudflare.com/r2/api/s3/temporary-credentials/) · [对象生命周期](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) · [发布排队](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

**理由与候选**。测试对象按生产者尝试分组，允许同版本不同提交或同提交重新构建分别定位，并保留原冻结字节。通过签名 URL 下载会将临时访问权传给持有地址的人，本增量能够以授权 S3 下载满足选项 A。长期对象令牌按桶授权，单纯设置前缀不隔离权限。低层命令可明确传递条件并读取错误码，适用于固定对象和发现更新。R2 条件写以单键生效，生产两个发现键之间保留中断窗口。并发、断连、错误分类、真实权限、公开缓存和两阶段读回分别实测。[R2 条件操作](https://developers.cloudflare.com/r2/api/s3/conditional-operations/) · [AWS CLI PutObject](https://docs.aws.amazon.com/cli/latest/reference/s3api/put-object.html) · [结构化错误](https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-error-format.html) · [R2 一致性和缓存](https://developers.cloudflare.com/r2/reference/consistency/)

**验证边界**。平台预检选用支持条件头和 JSON 错误的 AWS CLI v2，记录实测版本。测试生命周期规则和真实访问策略由获授权维护者准备。真实两次测试下载归 T096，生产平台权限、条件写、缓存与消费归原生产验收任务。当前结果来自规则文档及工作区只读核查。

## 2026-11-18 当前增量：布尔开关与单数目录

本轮明确要求集合配置新增 `plugin?: boolean`，默认 `false`，仅 `true` 扫描集合 `plugin/`；替代下方此前“存在即加载、无集合开关”的选择。复用已存在的配置模块动态导入方式，保持固定入口、排序及 Vite 原生调度，不增加依赖。引擎及 Vite 配置接线限于扫描行为；业务子插件与脚本迁移不随之实施。

## 2026-11-18 最新研究：集合子插件发现与原生调度

输入为[Spec](spec.md) FR-076～078、本次子代理规划授权及现有 `scan-skills.ts`、Vite 配置和已安装 Vite 8.3.8 类型/实现；以下固定入口和加载接口是本次规划选择，不冒认为用户逐项指定。Context7 实际返回 `Monthly quota exceeded`，因此以包内真实源码核验能力，不将文档查询失败记成查询通过。

- **决定**：扫描固定模式 `src/*/plugins/vite-plugin-*/index.ts`，默认来源由引擎模块位置定位包内 src，可传入绝对目录；入口存在即自动加载，不读取集合开关。集合和插件目录按名称稳定排序，顺序导入并调用无参默认工厂；普通缺省目录跳过，已匹配入口的导入和工厂错误明确失败并保留路径。
- **理由与依据**：原 `scan-skills.ts` 已以文件 URL 动态导入 TS 集合配置，可复用 Node 内置文件及路径能力。将发现放在配置阶段，才能把子插件交还 Vite 解析；在 generateBundle 中才发现或手调子插件钩子会错过配置/解析等生命周期。固定一层插件目录和 index.ts 便于定位独立附件，排除链接沿现有来源边界处理。
- **返回类型**：默认工厂为 `() => PluginOption`，引擎为 `Promise<PluginOption[]>`。包内 `vite/dist/node/index.d.ts` 将 PluginOption 定义为 Thenable，包含插件、嵌套数组及 false/null/undefined；`dist/node/chunks/node.js` 的配置解析调用 asyncFlatten。由 Vite 展平和执行钩子即可，不增设自有 PluginOption 校验或生命周期代理。
- **替代方案**：逐个静态注册需反复改配置；集合开关与用户明确的存在即加载冲突；无限递归扫描可能将附件和测试误认成入口；只搬动手写 Shell 字符串不能提供集合专属生成职责。采用集合子插件维护挂载生成，curl 接回 hidden，是当前已确认分工。
- **技术前置与限制**：无新库、外部进程协议或真实挂载；引擎配置加载及首次真实 Vite 消费仍须做隔离反例、增删入口和 write=false 验证，不能只靠 lint/类型推定动态加载正确。现场 Node 24.22.2 不代表最低 22.20.0 已验；Node 模块缓存遵循同一进程正常语义，增删发现按新的配置加载核对，不承诺文件热替换或运行中增删插件。全局配置接线、Speckit 生成及 curl 回迁留后续，原工程和最终发布验收不因此完成。

## 2026-11-18 增量研究：脚本资产归属

输入为[最新 Spec](spec.md)、[本轮原话](requirements/raw/2026-11-18-unified-script-directory.md)及现场 curl 插件、模板、唯一 Vite 配置。本轮只读核查现有模式并形成设计，不新增依赖或外部服务，不将本地输出目标推导为远端对象迁移。

- **决定**：按用户最终纠正，curl 插件保留安装源读取与 `script/install.sh` 原字节交付；新增 script 插件只负责技能扫描和 `script/hidden-install.sh` 模板派生。每个脚本只有一个责任方，输出均位于 `dist/script/`。
- **理由**：原 curl 插件曾同时读取安装源、扫描技能并派生 hidden；本次只把扫描和 hidden 派生归入 script 插件，安装入口构建保留 curl。输出目录统一与构建职责划分分别定义，复用已有源和原字节移动的模板避免双维护。`curl/skills.tsv` 是非执行映射，远端 `curl/install.sh` 是发现地址，与本地脚本归属不同。
- **替代方案**：仅更改输出路径而不分离扫描及 hidden 生成不能满足本次迁移要求；通用递归复制器可能夹带 old、构建或测试脚本。此前把安装入口生成也移入 script 是 Agent 的过度归并，已由用户纠正，不能当作用户要求。
- **技术前置**：此增量沿用仓库已有的 Plugin 工厂和资产交付模式，无新库、跨进程协议或外部交互，骨架风险由包 lint/类型检查覆盖，可豁免单独技术探针。完整迁移仍须证明两个目标脚本唯一输出、入口原字节和模板派生、write=false无写入、旧 curl 路径脚本为0；不豁免原正式过滤、安全解包或真实消费验证。
- **剩余限制**：本次已从骨架续接局部迁移；curl安装入口和script隐匿脚本的最终职责及构建验证见[T077](implementation/T077.md)，不能据此宣告T077整项完成；后续非脚本数据职责沿原Task准备。版本表、轻量映射、包版本与发布授权保持；没有需要用户另选的平台或库，真实验证未在本轮执行。

## 2026-11-16 当前研究：单包、根 VERSION 与整包校验

输入为[最新Spec](spec.md)、[单包确认](requirements/raw/2026-11-16-unified-pipeline-package.md)、[暂缓逐文件JSON确认](requirements/raw/2026-11-16-defer-file-manifest.md)及现有源码。两名研究代理只读核查安装/隐匿和构建/发布边界，协调者交叉核对并查阅Cloudflare官方资料；没有修改主线代码、运行构建/产品测试或访问真实桶。以下是本次规划选择，旧研究在下方保留，不倒写成用户原话或已通过证据。

### 内容插件与统一归档

- **决定**：现有三个插件继续作为过渡源码；目标由curl插件交付script/install.sh、脚本插件派生script/hidden-install.sh，技能插件交付skill/，版本插件生成根VERSION；非脚本数据沿原方案处理。后续流水线在独占暂存根检查正式集合并归档为skills-<version>.tar.gz，包内直接保留VERSION、skill/、script/、curl/非脚本数据、README及许可，不加dist或版本外层目录。
- **理由与现场**：vite.config.ts已注册三个插件；两个归档调用已注释。scan-skills.ts只按TS配置enabled和正文存在性筛选，不能证明正式白名单完整；eval/profile启用状态不代表公开授权，缺启用正文当前可能被静默过滤。生成hidden模板也含扫描名称，正式候选必须检查其路径数据，不只删除非公开目录。包README仍描述旧入口，实际ISC来自根LICENSE，均须冻结前处理，不能直接复制过时说明冒称可用。
- **备选**：恢复双包违背已确认范围；直接压整个dist可能带入内部集合或构建虚拟JS；额外包根增加安装路径转换。普通tar/gzip即可，每次求真实归档摘要；双构建比较公开内容全集和字节，不要求压缩元数据或归档哈希一致。选定候选后仅重试原字节。

### 轻量技能映射与完整性证据

- **决定**：不生成随包release-manifest.json或script/manifest.json。流水线保留文件全集/摘要证据；消费端以核验通过的统一包为完整来源，安装前后按所选技能目录重新枚举、比较原字节。身份、分类、安装位置和必需依赖以非执行的curl/skills.tsv交付，不包含逐文件路径/大小/摘要。
- **理由**：没有包内逐文件JSON不妨碍整包安装，但整包SHA不能发现发布前漏件；正式范围/引用附件和许可仍必须在打包前验证。当前TS配置不能交给Bash动态执行，声明名称不保证等于目录，FR-008的依赖又不能靠猜测，因此需要最小映射。构建读取正文name及计划扩展字段skill[目录].requiresSkills（声明名数组，缺省为空，现有类型尚未扩展）；映射与实际获准目录双向校验。
- **备选**：只按目录名猜身份不能满足唯一名称及依赖；运行用户包中的TS配置引入执行和运行依赖；恢复完整JSON文件表超出本期选择。TSV只作为数据，固定格式与合法标识符见curl契约；格式校验先证实，不把数据文件当代码source。

### 版本、下载表与 MD5 过渡

- **决定**：唯一源仍为packages/skills/package.json.version，构建只派生dist/VERSION。按[2026-11-19 用户确认](requirements/raw/2026-11-19-r2-version-table.md)，已发布状态只在 R2 的 `curl/release.json` 持久维护。现有方案的 version/url、兼容 MD5、归档 bytes/SHA-256 和格式版本在流水线阶段复核。新正式入口必须使用SHA-256，不回退MD5。
- **理由与现场**：当前入口仅使用MD5、直接tar解包，未核对VERSION；node-jq尚未固定，下载根仍为示例。当前源码、当前构建、冻结候选、远端已核验与公开可发现分别判断。统一版本和单包不需要维护两份跨文件提交的技能/curl发布记录；入口固定身份仍须可追溯，不能把远端latest标记冒认为实际执行版本。
- **备选**：完全删md5会使现有入口无法解析过渡记录；保留MD5核验作为新入口降级则降低原正式摘要要求。不承诺已有MD5旧包可被新正式入口接受；无SHA记录须重新核验并形成合法记录，或明确拒绝。历史样本先用隔离夹具，不伪造真实发布史。

### 最新入口与历史统一包

- **决定**：固定对象采用skills/<version>/skills-<version>.tar.gz及curl/<version>/install.sh；可变发现为curl/release.json和curl/install.sh。这是工程路径选择，实际HTTPS域名仍由后续真实目标提供。一次调用固定索引原字节和选中记录，包根VERSION须等于所选版本；hidden从该包内取得，不单独下载helper。
- **理由**：最新入口可以安装较旧统一包，但技能与运行材料必须始终来自所选同版包。旧双包的“helper下载失败但技能继续”不再是有效前提：统一包下载/摘要/安全结构失败时零安装；包通过且技能完整时，仅hidden文件/协议/执行失败保留安装并独立报告。
- **备选**：入口随技能回退或取最新版helper都会破坏已确认关联；保留scripts.url等双下载字段会延续撤销的设计。入口身份在执行前由调用者或受信获取链记录实际字节及版本，不能让脚本自报版本等同于可信证明。

### 安全解包、逐技能提交与隐匿

- **决定**：先整包长度/SHA，后成员安全预检，再私有空目录解包，核对根VERSION/布局/映射/所选正文附件；未核验代码执行0。逐技能使用目标同文件系统暂存，完整比对后提交；暂存中写入最小.foundry-source版本来源标记以支持清理后的独立重试，不保存逐文件哈希或工程状态。重验要求标记同源同版且与可信包正文附件全集一致，未知同名/缺标记拒绝认领；installed或完整重验reused才进入临时成功集合。hidden独立Bash从已核验包调用，按模板候选、本次选择与成功集合交集处理。
- **理由与现场**：入口目前复制所有二级目录，遇冲突可能已留下部分安装，无逐项报告；hidden模板只有目录存在性、Git及排除基础，尚无实际成功集合、tracked预检和完整结果协议。复用原真实Git骨架，不重建只在测试中可用的原型。固定版本node-jq和本次私有npm缓存要求继续保持。
- **备选**：仅依赖tar解压后检查无法追回越界写入；只有摘要也不证明成员安全。不能按历史目录存在性推断本次成功，不忽略整个agent根，不取消跟踪。成员解析的具体工具方法必须先通过恶意样本实验，不凭tar文本列表可读就宣布安全。

### R2 条件写与发布记录持久化

- **决定**：后置发布器优先验证R2 S3条件写；固定对象使用仅创建语义，可变索引使用旧ETag条件更新。上传对象身份、匿名下载SHA和发现结果分别留证，ETag仅作并发令牌，不当作包SHA。不新建Worker、桶、域名或外部协调服务。
- **官方依据**：Cloudflare文档列出PutObject的If-None-Match/If-Match条件与失败响应，适合规划固定对象创建和索引比较更新；客户端与目标权限仍待实测。[Conditional operations](https://developers.cloudflare.com/r2/api/s3/conditional-operations/)
- **恢复限制**：响应丢失后的404不能单独证明原写失败；公开域名缓存也可能与源站状态不同。由此推导后续验证须包含同一冻结对象条件重试、身份读回及公开缓存观察，不能无条件覆写。[Consistency model](https://developers.cloudflare.com/r2/reference/consistency/)
- **版本表归属**。已发布状态只在 R2 持久化，依据真实固定对象核验结果更新。流水线的写入、断连与读取验证已列入后置任务。源码提交仍是构建追溯依据。
- **发现决定及备选**：入口与版本表各自条件写不构成事务，先更新并核验兼容入口，再更新索引；后步失败保留旧索引和已更新入口。普通新版本高于已发布最高SemVer，旧候选重试不推进latest；冲突读回保留其他版本行，新合并字节需受适用授权约束。拒绝盲写或按重试时间把旧版置顶；消费仍按首条，不自行排序。授权绑定具体bucket/prefix/origin和候选/发现字节，不能复用旧Git目标授权。

### 前置验证及结论

必须保留正式范围/附件/许可核验、安全成员反例、两版统一包与新版入口、安装冲突/中断、实际Git与成功集合、R2竞争/断连及发现恢复的证伪骨架。技术假设未通过不填依赖业务。本轮解决的是设计选择；真实R2、最低运行时、支持矩阵和最终宿主加载仍未验，官方文档也不替代项目实证。紧急T090当时已验事实保持，T091～T093仍待授权及公开输入，不复用其Git发布器充作主线R2。

<details>
<summary>历史研究与旧方案（用于追溯，不覆盖本页最新研究）</summary>

## 2026-11-12 工作区实施与连续推进研究

来源：[本轮输入及Clarify B](requirements/raw/2026-11-12-workspace-local-handoff.md)、最新spec、当前AGENTS/工作流宪章、已有方案/证据及仓库外实现。两名只读研究代理分别核对工作区/源码身份、四处源码迁移/公开边界；没有写产品文件、安装依赖、运行构建/测试/官方CLI或联网。本节取代11月11日紧急方案的仓库外位置和连续发布安排，下方主线历史研究原文保留。

### 同工作区接入与既有实现复用

**决定**：未来将适用实现复制到`packages/skills-distribution-urgent/`，保留原件与未完成内容；不复制`.git`、node_modules、旧锁、dist、缓存或环境文件。包加入已有packages/*，依赖版本走根catalog，共享配置经exports消费，保留严格TS，不改变根锁文件策略。原副本中的独立锁假设、配置和README/测试同步适配。

**事实依据**：新目标不存在；仓库外副本全部源码未提交，但已有9项技能/附件、ISC、构建、运行脚本和测试。根已有workspace模式；`packages/skills/package.json`、`eslint.config.ts`及`tsconfig.json`展示catalog/共享预设消费；`packages/preset-config/package.json`给出合法exports。副本`tests/official-install.test.mjs`强制复制包内锁文件，不能原样搬入后仍期待独立安装。

**替代与理由**：保留仓库外独立工程已被用户新要求替代；直接移动/清理可能丢掉未提交中间态；携带旧Git/依赖树会继续制造来源和版本歧义。人工复制明确输入可保护原件，接入后必须真实重验，不沿用旧成功。

### Git根与包根分开

**决定**：源码身份使用真实Git根、包相对前缀及实际输入闭包，逐字节校验相关提交；无关工作区差异不阻断，相关输入未冻结或构建期间漂移必须失败。记录实际依赖/catalog/预设及未跟踪根锁摘要，不把缺失提交锁当已验证来源。

**事实依据**：副本`build/distribution/export.ts`的sourceIdentity把Git根等于包根作为前提，并检查全树状态；Git show使用包内相对路径。嵌套进入packages后前提不成立，直接删dirty检查又会误认未提交字节。

**替代与理由**：在新包内嵌套Git或强求整个Foundry无差异均不符合本轮定位；环境变量替代SHA没有来源证明。测试可用本次拥有的临时Git夹具验证算法，正式本地材料仍绑定真正输入提交和摘要，不能以夹具提交替换产品来源。

### 正式安装来源与公开源码分开

**决定**：四处源码一起迁移时可保留eval评估源码和样本；正式技能发布清单、列出及安装集合均排除eval。正式建议只使用获准payload固定树，不使用包含开发源码的仓库根作为整包来源。README/ISC、9项完整正文附件、必要script与过滤集中配置必须纳入精确文件全集。

**事实依据**：Clarify B及FR-003/065/SC-019已明确。原紧急契约把“不公开eval”混写为源码与发布物共同限制，需要分开；源码公开不授权安装未获准技能。

**替代与理由**：删除eval源码违背最新选择；直接对源码仓库执行整包发现会扩大可安装集合。验收同时观察源码可保留与正式官方发现eval=0，而不是只测过滤函数。

### 连续推进、许可与迁后再验

**决定**：本地工程/完整内容/官方安装/真实挂载派发与宿主加载/保护恢复/隔离发布工具验证均通过后，汇总交接并按[本轮豁免](requirements/raw/2026-11-12-urgent-continuous-exemption.md)连续推进已授权工作，不逐阶段或逐Task重复确认，仍保存方案与证据。新公开仓库尚未创建不阻断本地验证。ISC文本在原副本已具备，但后续迁入及新根声明仍须核对；第三方许可保留，不从包字段推断所有材料权利已核验。

**事实依据**：当前实际来源、构建和契约记录属于仓库外各次输入；挂载guard与Bash处于未完成衔接，旧单元通过不证明真实注册、派发和宿主消费。用户没有授权本轮迁仓或发布。

**替代与理由**：把本地代码检查通过当部署完成会遗漏必需消费证据；为了完成本地而无授权先建公开仓库则越过外部操作授权边界。迁后新的Git、依赖或说明改变必须重建重验，旧候选不能换标签继续发布。

### 四处源码的真实迁移缺口

**决定**：保留`packages/skills-distribution-urgent`、`packages/skills`、`specs/skills`、`apps/mcp`相对结构，人工维护新根配置。未列入迁移的preset-config不得暗中追加；迁后改为目标仓库等价配置和显式工具依赖，保留测试职责及未验事实，不生成导出器、不删测试求绿。

**事实依据**：原技能包依赖catalog/workspace预设；其`tests/test_mvu_documents.py`读取根.specify脚本/模板，`test_full_remount.py`读取scripts/dev；`apps/mcp/src/foundry_skills_mcp/registry.py`默认读取旧dist/manifest.json，而主线当前未生成该清单。`specs/skills`有跨功能链接及画像摘要、私有依据引用，archives也需核对；仅不迁.specify不足以保证无画像内容。

**替代与理由**：直接搬四目录不能证明新仓库全部独立可运行。MCP源码同行不等于修好清单生产者或授权部署；这项既有缺口列交接，不阻断无依赖的紧急验证。公开前按正文、附件、archive和引用逐项清点，私有原文保留当前仓库；公开副本保留真实来源说明，不为修复断链夹带画像。

本轮研究已给出实施选择及具体反例，没有未解决的产品选项。目录迁入、依赖适配、真实消费和迁后检查仍须实际验证；这些不是本轮已通过结果。下方旧官方资料及实验仅按原适用范围引用。

## 2026-11-10 本次重规划：构建、流水线与技能发布共同交付

本节承接 spec 最新安排及 Clarify 的 B。已完成两项并行只读研究：构建源码/消费者/历史基线，以及官方 Actions/Git 发布约束。只读取源码与文档，没有执行构建、安装或发布；下文旧研究中的通过结果仍只属于原实现。

### 全部构建重做，以文件边界代替整包还原

**决定**：重做 vite.config.ts、build/plugins 下四个构建组件及 build/distribution 下六个模块。沿现有目录组织来源读取、内容建模、文件生成和只读核验，Vite 层只作有序编排。保留 script、src/skills、src/mcp 与工作区消费源码；构建测试及转导出 helpers 随新接口调整，不通过保留旧构建实现规避 B。

**依据**：当前包源码对应提交 `52eebe56dcd26a95888f863015ce7d91ab423b18`；其父 `676dcff0dc30c99ed984013d2c649db86f093163` 可对比分发插件加入前的构建。三目录初始实现提交 `63538db6bc97bc31d9faf2f9f5662df8a75a8ba9` 之后还有安装和 Node 调度修改，不能整包回到该提交。实际快照与摘要见[存档](archive/2026-11-10-build-pipeline-replan/README.md)。

**理由与替代**：整包 reset 会影响保留的安装器；只重做 T055 又漏掉三目录和 MCP。选择按构建文件逐项替换，保留 schemaVersion=1 的 Release 线格式，用消费者约束新实现。当前 hidden 只有测试原型、公共挂载仍待接通；保留源码不表示这些功能已完成。

### 一个构建入口，显式传递阶段结果

**决定**：维持单一 Vite 配置及同一个 dist 根；构建内部顺序为来源快照 → 内存构建计划 → 三目录及派生文件 → 从磁盘复核。使用已有 Node/Vite/yaml，不添加新运行依赖，不执行 script，不联网读取 Agent，不重新引入第二构建模式或工程导出器。

**官方依据**：经 Context7 核对 [Vite 构建实现](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/build.ts) 与 [插件顺序说明](https://github.com/vitejs/vite/blob/main/docs/guide/using-plugins.md)。产物复核放在实际写出路径并显式等待前序完成；closeBundle 可能在失败后运行，不能承担“产物必已生成”的成功假设。临时构建 outDir 由调用方明确拥有，不因设置 emptyOutDir 就允许清理未知目录。

**理由与替代**：继续依赖多个独立 writeBundle 的偶然执行顺序不利于解释和排错；另建自有编译器没有必要。选择纯数据阶段加一处有序输出编排，各节点的输入与返回契约见 [build-pipeline.md](contracts/build-pipeline.md)。

### 区分完整 dist 与严格公开候选

**决定**：dist 可保留完整线下分类及 MCP；公开 payload 必须精确等于 release.json.files 加 release.json。源码、eval、MCP、归档、CI 索引和平台收据不因同次构建进入技能公开集合。现有 verifyContent 允许 dist 含未选文件，新候选验证必须额外拒绝任何多余文件。

**理由与替代**：直接打包整个 dist 扩大公开内容；只比较清单声明的文件会漏掉夹带内容。新实现重新读盘核对文件集、长度和摘要；保持 Release 字段与两种安装投影线格式，避免借构建重做扩展到安装器重写。

### 上传前冻结内容，上传后记录平台绑定

**决定**：上传前固定 payload 与内容索引；上传成功后，使用真实 artifact-id、artifact-digest 生成独立平台收据。收据再上传时，其自身 ID 由发布请求或运行摘要定位，不嵌入收据自身。不得为补 artifactId 重写已经上传的内容。模型及状态见 [data-model.md](data-model.md)。

**官方依据**：[upload-artifact](https://github.com/actions/upload-artifact) 将 ID/digest 作为成功后的输出，覆盖会产生新身份；[Artifacts REST](https://docs.github.com/en/rest/actions/artifacts) 可核对所属仓库、run、head SHA、摘要与过期状态，[指定 attempt API](https://docs.github.com/en/rest/actions/workflow-runs#get-a-workflow-run-attempt) 用于核对精确重跑。名称只供展示，不取最新同名结果。

**理由与替代**：把真实 artifactId 预写进包含自身的归档形成时序循环。候选内容与平台绑定分开后可分别验证；本地 isolated 使用明确标注的模拟平台材料，绝不冒认正式 Actions。14 天是本方案留存选择，实际服从平台上限和 expired/expires_at。

### 同一实现接入 CI，发布只移动已核验字节

**决定**：从构建重做开始同步接入只读 check；默认分支成功检查才准备完整候选。workflow_dispatch 还必须核对执行 ref、仓库和维护者权限，Foundry 布局拒绝真实 publish。全局 token 只读，需要读取平台材料的 job 显式 actions:read，只有通过 guard 的发布 job 为 contents:write。

**依据**：[手动运行](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)、[job 权限](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idpermissions)、[Git push](https://git-scm.com/docs/git-push)。发布阶段不安装依赖、不构建、不执行候选脚本，属于本项目 FR-040 的约束。无 force 创建新版本 tag 为最终竞争裁决；[Actions concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) 只辅助同仓库排队，不承担完整请求队列或跨仓库锁职责。

**下载校验更正**：当前 [download-artifact](https://github.com/actions/download-artifact) 已提供 digest-mismatch 选项；旧教程的 warning 不能泛指当前 action。实施时固定核验过的 action SHA，要求下载摘要不符即失败，同时独立重算自己的逐文件及候选摘要，不能只依赖下载器默认行为。

**研究完成边界**：技术路线无未决选型。真实仓库、action 固定 SHA、运行时版本、完整依赖快照、正式技能源及平台证据由实施/迁移阶段取得；它们是可检查的执行输入，缺失时不得通过对应门禁，不是用占位值消除的未知项。旧 Task 顺序由下一次 Tasks 衔接，不在本次研究中重排。

**现行决定（2026-11-09）**：Agent 规则在安装与官方预检期间每次在线解析官方 npm skills latest；来源直接定义于 script/install-skills/read-agents.mjs，不维护包根 distribution、agents.json 或其他独立声明。同次规则、建议 CLI 和报告使用同一实际版本，下次重新查询。唯一公开入口仍为 node script/index.mjs，由平台模块负责安装与挂载。旧版本研究及验收事实保留历史范围，不能当作当前 latest 的通过结论。

初次研究：2026-11-02；现行来源策略修订：2026-11-09。依据 [spec.md](spec.md) 的五项澄清；本文件保留计划阶段研究依据；后续已完成 T001～T002 接线及单配置构建夹具验证，真实安装可行性仍由 [plan.md](plan.md) 的 MVU 验证。

## 16. 当前挂载集合与官方迁移机制（2026-11-10）

**决策**：modes 仅声明 task-increment；按主线当前计划消费 implementation-preparation 的 before_implement，以及分析/结案两项既有职责。主线 plan 已确定准备 skill 名称，实际准备/分析源码尚不存在，正式同版来源仍为后续前置。Pair/Tutor/Direct 只保留暂停来源和历史，不再挂载或要求恢复验收；来源的公开选择按主线正式交付规则核对，不用复制整个 dist 代替发布选择。

**实际调用链依据**：register-commands.sh:47、.ps1:50 仍四项；mount-entry.sh:185/247、.ps1:155/208 是旧五项且未接通挂载；index.mjs:30/96 仅调度 install-skills，Bash 安装器:459 拒绝默认 workflow 挂载、PowerShell 安装入口尚未实现；register-hooks.sh:47、.ps1:50 固定七来源。scripts/dev/nuxt-prepare/ 双平台先复制和 hooks，成功才调用 register-commands；工作区包装层不另造安装逻辑。build/plugins/distribution.ts:83 默认公开选择 coding/frontend，build/distribution/export.ts:218 目前只从 hook 附件生成映射；因此来源目录存在、dist 复制和公开清单覆盖要分别核验。行号仅定位本轮源码，不锁定后续实现。

**官方版本依据**：读取缓存分发包的 specify_cli-1.2.6.dist-info/METADATA（Version:1.2.6）与对应 Python 源码，不以 PATH 中其他版本代验。extensions/command_add.py:136 进入 install_from_directory；`specify_cli/extensions/__init__.py:2534` 起 force 分支在校验后 remove 旧 ID，remove:3477 起使用旧 registered_commands/registered_skills 清理，再复制并登记新集合。hooks-only 允许 provides:{} 加非空 hooks，register_hooks/unregister_hooks 按 extension ID 更新；YAML 会重序列化，不保证注释字节。此处只有只读源码研究，没有实际运行官方更新。官方来源包身份和实际执行版本在隔离实验中再次记录。

**保护边界**：`specify_cli/extensions/__init__.py:1816` 的归属标记核对及 :2232 的 shutil.rmtree 表明，受管 skill 目录中的额外用户附件可能被连带删除；agents.py:1419 的命令路径也由官方清理。因此在调用前按已知清单、旧登记和实际文件清点受影响对象，遇未知附件、用户维护文件或归属不明先停止，不把“交官方管理”解释成自动保留全部未知内容。不新增持久指纹或自行搬移用户文件的迁移工具。旧登记缺项/损坏无法证明残留时报告迁移未完成，不能手删生成副本凑结果。

**内容校验**：CodexIntegration 使用 .agents/skills，命令 speckit.modes.increment 转为 speckit-modes-increment。官方会重建生成入口 frontmatter（agents.py:448），所以原始/安装投影按 Release 全文件字节核验，生成入口按正确身份、有效正文、附件全集、实际引用可读和宿主完整加载核验，不能要求两种 SKILL.md 原字节相同。hooks 登记或文件存在不替代真正可加载，更不抵扣主线讨论门禁行为。

**备选与取舍**：保留四项齐备违背暂停范围；只改命令数组遗漏公共核验、自动编排、工作区和清单；手改 registry/生成文件与自有 YAML 合并违反既有边界。选择官方同 ID 更新，若隔离实验暴露版本不支持或无法保护内容，停止受影响迁移并返回方案，不擅自扩大到另一套引擎。

**后续实验**：plan 中 D-MOUNT/D-PREP/D-CHAIN 分别证伪旧入口清理与保护、同版准备加载和调用链一致性。复用 tests/distribution/mvu-c.mjs、mvu-d.mjs（待实现）以及 tests/test-register-commands.mjs、test_register_commands.py、test-register-hooks.mjs、test_full_remount.py、scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs、test-build-config.mjs；旧四/五项断言按有效集合修订，历史证据文件不改。没有新增技术选型待澄清；真实来源、未测平台和官方实际操作是明确的实施前置，不作为研究已通过。

## 10. 本版本交付可迁移流水线，迁移后首次正式发布

**决策**：按两项最新澄清，本版本在 Foundry 完成可迁移工程和隔离验证；迁移后由独立公开仓库维护源码、构建并首次正式发布。本期不用真实公开目标证明本地发布演练，不配置跨仓库长效发布凭据。选择 GitHub Actions 作为工程执行平台，自动检查与 workflow_dispatch 发布分离，现有迭代 Issue workflow 不作为技能流水线复用。

**理由**：与已有 GitHub 仓库形态一致，后续源码、权限和发布归同一项目；无需为迁移前一次性上线建设临时跨仓库通道。使用同一份 workflow 和包内驱动支持 `packages/skills`、迁出后根包两种明确布局；Foundry 模式的真实发布必须被拒绝。

**替代**：永久由 Foundry 构建并向外投放产物已不符合本次澄清；仅迁移 dist 不能支持后续独立开发。更换 CI 服务可复用包内驱动和候选格式，但当前不增加第二套运行平台。

## 11. 直接迁移源码与迁后工程检查

**已知约束**：当前 skills 包使用 Foundry 的 workspace/catalog 与共享 ESLint、TS 配置；部分 Python 测试读取本仓库 dev 脚本、模板和宪章。这些依赖在迁移时需要明确处置。

**用户修正（2026-11-10）**：后续会直接把 skill、MCP 等内容移到公开仓库，不需要 project.mjs。撤回自动导出、配置投影和项目索引方案；一次性迁移不成为长期工程功能。此前 T054 的实验结果保留历史范围，其实现和专用测试移除，T057 不再扩展该能力。

**现行做法**：当前 Foundry 继续遵循共享配置消费约定；新仓库直接维护自己的显式依赖、配置、源码、测试和 workflow。迁移说明列出必须调整的 workspace/catalog、共享预设和测试路径，不在本仓库生成可迁移副本或维护双配置投影逻辑。迁后按新项目的真实依赖与严格配置执行 lint、类型检查、构建和适用测试，独立运行由 T061 留证。

**依赖和测试边界**：同一候选的两次干净构建继续使用完整依赖快照和相同工具版本。Foundry 锁文件策略保持，新仓库自行确定其依赖管理。包内测试随源码迁移，依赖 Foundry dev/模板/宪章的消费者检查留原仓库；不能删断言或用缺环境 skip 冒充通过。MCP 源码迁移与技能安装候选的公开选择分别处理。

## 12. 候选身份、Actions 权限与留存

**决策**：候选来自受信任默认分支检查，通过 run ID、attempt、artifact ID、sourceRevision、version、catalogDigest 和候选索引摘要共同定位；不取“最新同名 artifact”。计划保留 14 天且不超过平台允许上限，超期/缺失/摘要不符失败并重新准备、重新授权。发布 job 只使用可信默认分支固定版本的校验和 Git 工具，不安装依赖、不构建、不执行候选脚本；远端安装验证在无发布写权限的独立 job 执行。

**理由及官方依据**：[手动运行 workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)要求 workflow 在默认分支且触发者有 write 权限；本方案进一步限定默认分支、仓库身份及实际候选。[Artifact 文档](https://docs.github.com/en/actions/tutorials/store-and-share-data)说明跨运行定位与留存；下载器摘要行为按本次上方研究的固定 action 版本核对，并由自己的 SHA-256 核验返回非零。[安全使用文档](https://docs.github.com/en/actions/reference/security/secure-use)支持最小 token 权限和可信代码边界；使用新仓库自己的短期 GITHUB_TOKEN，权限仅在发布 job 为 contents:write，其余只读。不能声称 Contents token 精确限制某一个 tag。

**替代**：[环境保护](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)受仓库可见性与套餐影响，迁后公开仓库可作为额外审批，当前私有 Foundry 的隔离验证不依赖付费审批能力。PR 与候选检查不接发布凭据，不采用执行外部贡献代码且持有秘密的触发路径。

## 13. 仅公开候选树的 Git 版本发布

**决策**：源码在独立公开仓库默认分支维护，发布用无源码父树的独立提交，根只包含 release.files 加 release.json，自有版本引用为 `skills-v<SemVer>`。用一次无 force 的新 tag 推送对外发布，安装来源为该提交的固定 SHA HTTPS 根。源码 SHA 和承载发布物 SHA 分开保存，不回写候选。发行附件可以补充保存，不能代替官方目录 URL 的文件树来源。

**理由**：若 tag 指向源码树或把多个历史版本目录累积到同一安装根，官方发现可能读到源码、夹具或其他版本的 SKILL.md。独立候选树与精确白名单共同限制发现范围，未公开源码不因发布方式被追加。无需维护可变发布分支或额外远端仓库。

**失败与并发依据**：[git push](https://git-scm.com/docs/git-push)对已有 tag 更新默认拒绝，本方案不使用 force；两个竞争请求以远端单 ref 创建为最终裁决，失败者重新读回文件全集，相同复用、不同拒绝。推送断连后不能仅凭退出码判断是否已发生，须先读远端再续接。[Actions concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)只在同仓库协调，默认等待项可能被后来请求替换；因此不用它承诺可靠队列，也不把它当跨仓库锁。选单 ref 发布避免额外依赖服务端多 ref atomic 能力。

## 14. 研究结论与待执行验证

技术选择已确定，真实 repo 地址、发布变量、凭据和实际工具下载属于实施/迁移输入，不用占位值假装已配置。两项只读研究已完成：一项核对官方 Actions/git 文档，一项检查本机实际依赖与测试边界；未派实现代理、未运行工程实验。

新增 C1～C4 风险的假设、信号及门禁见 [plan.md](plan.md) 和 [pipeline 契约](contracts/pipeline.md)。本期验证同源候选、权限拒绝及本地 Git 并发/故障；直接迁移后的依赖、配置与独立构建由 T061 验证，迁后另验真实 Actions、下载来源和用户安装。旧已通过骨架继续复用，新增内容没有以文档检索抵扣真实验收。

## 15. 官方目录安装与原始文件下载的来源映射

**决策**：两入口绑定同一 repository/publishedRevision，分别生成 GitHub tree 目录 URL 与 raw 文件根。官方整包/多技能从 `tree/<完整发布SHA>/skills` 发现，分类与单技能追加目录并显式传入已核验名称；本包下载从 `raw.githubusercontent.com/<owner>/<repo>/<同一SHA>` 获取 release.json 和声明文件。远端官方预检负责受控转换，不支持的来源明确失败，不提供猜测命令。

**依据与范围**：只读研究检查本机已取得的官方 skills 1.7.6 发布包 dist/cli.mjs：parseSource 在第 198 行将 raw URL 视为 download，第 235/246 行识别 GitHub tree/ref/subpath；第 919 行包含完整 SHA 获取分支，第 1381 行按 subpath 发现，第 3827 行的下载分支接受 SKILL.md 或压缩包。原始目录 URL 不能据此作为多技能目录安装入口；路径及行号仅用于该包的调查复核，不成为产品锁版。[官方命令说明](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)提供仓库/子目录来源用法。调查没有执行真实公开目录安装，迁后须以当时实际解析版本补远端实测。

**替代与影响**：用一个原始根 URL 同时喂两入口会混淆文件下载和目录发现，撤回该含混表达。两个 URL 不能指向不同 ref；T013/T014 后续实施及发布 README 应按同一身份派生，且仍执行显式名称限制，不采用星号扩大选择。

## 8. 历史包职责修订（2026-11-03～04）

2026-11-03 包职责修订保留：只提供技能与脚本，不维护包根 extension.yml、静态扩展目录或 mounts.json。2026-11-04 进一步确认：统一 modes 五指令，临时输入由既有脚本生成，每次官方 --force 全量重装。此前逐模式扩展、旧 modes 等价复用与禁止 force 的命令方案撤回；下文现行决定已同步，早期源码调查不冒认新方案已通过全部兼容验收。

## 1. 在线 Agent 来源与可追溯版本

**决策（2026-11-09 替代原固定基线）**：每次从 https://registry.npmjs.org/skills/latest 取得元数据，只读取同一官方 HTTPS 发布包；校验 SHA-512 integrity、包内版本和规则布局后取得 Agent 声明及安装路径。当前适配从实际发布包 dist/cli.mjs 读取所需声明、XDG 实现和路径函数，不执行 CLI 入口或安装/检测代码；未来布局变化须明确失败，不回退静态表。报告 upstream 保存本次 package/channel/version/integrity；建议命令绑定该次实际版本，下次重查。Specify 版本仍由 FOUNDRY_SPECIFY_VERSION 选择，默认 1.2.6；Node ≥22.20.0、tar 及平台工具须提前具备，官方命令另需 npm/npx、Git。

**历史依据**：原固定 skills 1.7.4 的调查见 [skills package.json](https://github.com/vercel-labs/skills/blob/v1.7.4/package.json)，tag 对应提交 a80e4c9d12d607631249d4d7d059f835d4b2f13a；Specify 基线见 [pyproject.toml](https://github.com/github/spec-kit/blob/v1.2.6/pyproject.toml)。这些固定引用保留用于重现旧实验，现行来源策略与实测限制见[在线来源记录](analysis/acceptance/online-agent-source.md)及[兼容契约](contracts/compatibility.md)。

**被替代的选择及风险**：最初因路径和命令语义漂移而排除 latest；用户随后明确要求在线且不固定版本，因此改为同次一致性与完整性校验，并将布局变化作为明确失败条件。历史本机 specify 1.2.4.dev0（提交 67e0f7294e6e728ab60bf7b4590deb470448bc2d）不作为默认 1.2.6 的证据；2026-11-04 的 43 个标识核对与 35 项旧映射仍只证明当时源码清单，不证明实际派发。

## 2. 公开目录与既有消费分离

**决策（沿用目录划分，2026-11-09 同步当前产物）**：仅用 vite.config.ts，一次 build 将 src/mcp、src/skills、script 分别交付到 dist/mcp、dist/skills、dist/script，并派生 release.json 与 projections；独立扫描 src/mcp 自动生成 dist/mcp/manifest.json，不维护源清单，不保留旧根清单或双模式。线下全部技能及附件原样保留，后续公开选择为 coding/frontend/workflow；MCP 线上收录及其流水线另行定义，线下技能/脚本流水线按本轮第 10～14 节执行。

**依据**：现有构建由 content.ts、scripts.ts 和 mcp-manifest.ts 负责目录复制、运行脚本交付与 MCP 清单生成；正文唯一来源分别为 src/skills 与 src/mcp，不发布 .agents 挂载副本。完整安装恢复后再验证官方递归发现及特殊 agent 投影，旧 manifest 插件已移除。

构建递归收录必要附件，校验技能内相对引用；仓库绝对路径、越界附件、符号链接、重名、未公开依赖均失败。技能对使用者项目材料的引用单独记录为 prerequisite，不把 Foundry 宪章或 `.specify` 注入对方项目。本版本先验证工程可迁移；项目迁入独立公开仓库后，在新仓库重新构建核验并首次正式发布，后续不依赖 Foundry 源码仓库。

**取舍**：用户明确接受移除旧根 manifest，apps/mcp 默认路径和上下文估算工具的消费迁移暂缓；显式传入新清单的读取检查只证明格式兼容。完整附件随目录复制，不仅交付 SKILL.md。

## 3. 官方安装行为与内容等价

**决策**：以官方实际安装后的文件集合为逐 agent 校验基线，发布清单同时记录原始文件与安装投影。普通 agent 用原始字节，Eve 使用 eve-frontmatter-v1 格式的已校准字节；格式标识不固定 CLI 版本，新版实际等价性仍须验证；curl 直接安装预生成投影。必需附件若会被官方排除，构建必须失败并先调整源附件组织。

**历史行为校准依据（非当前 latest 的通过结论）**：[installer.ts](https://github.com/vercel-labs/skills/blob/v1.7.4/src/installer.ts) 排除 metadata.json、.git、Python 缓存目录，Eve 重新序列化 frontmatter；它还会清理已有目标。路径要结合其解析逻辑和 [agents.ts](https://github.com/vercel-labs/skills/blob/v1.7.4/src/agents.ts)，不能仅照抄展示表。投影需锁定 YAML 序列化版本，并由官方真实安装校准。

**决策**：官方安装文档在第一步内包含本包只读预检，再执行原生命令；第二步才显式挂载。预检校验所有名字、依赖、目标及已有文件，输出使用本次在线解析版本与已核验显式名称的命令，不替用户调用 npx。发现已满足项时建议跳过重装；有冲突则不提供可执行安装建议。

**历史行为校准依据（非产品锁版来源）**：[add.ts](https://github.com/vercel-labs/skills/blob/v1.7.4/src/add.ts) 对混合有效/无效名字可能安装有效子集，退出成功不能证明全部请求成功。裸 npx 不具备本包要求的冲突保护；预检与执行之间仍存在并发修改窗口，文档要求无并发编辑并在第二步重验。不能宣称本包已改变上游行为。

**备选**：修改上游 CLI 或另造 npx 包超范围；盲信退出码和源文件哈希不足以证明实际交付。

## 4. 唯一 Node 入口与平台职责

**决策**：用户 2026-11-04 已将此前取消 Node 转发的方案改为唯一 node script/index.mjs 入口。Node 按系统调度 Bash/PowerShell，平台脚本负责下载、核验、安装、挂载与清理；现有 read-agents.mjs 只提供在线数据，不承担安装核心。复用 register-hooks/register-commands，不引入自有 TS/JS/Python 安装核心或嵌套 package.json。

技能文件仍逐文件下载、校验后逐技能提交；在线 Agent 查询仅用 tar 标准输入输出读取发布包必要文件，不落盘解包、不执行 CLI，也不借 npm 安装或缓存查询。所有文件路径规范化、禁止绝对路径和父目录逃逸，路径冲突按目标文件系统实际大小写规则判断。同文件系统暂存目录与每根独占锁防止本包并发写入，提交前再检查目标；不承诺跨进程绝对防竞态或整批事务。

**验证依据**：T004 的 Linux 实现已在独立构建副本直接运行 Bash，52 项实验通过，详见 [MVU-B 最新验收](analysis/acceptance/mvu-b.md)。jq 固定版本与摘要，由平台脚本在目标项目之外准备；PowerShell 可使用平台原生 JSON 能力，完整平台结果仍待实际验证。hooks 配置随技能交付，由官方 CLI 重装，不恢复 YAML 辅助合并。

**撤回方案**：此前“取消 Node 入口”的中间决定已被唯一入口替代；共享 Node 安装核心和嵌套 script/package.json 仍不采用。历史实验保留，不反写为新入口验收。

## 5. 历史：所选钩子与五指令（2026-11-04，当前集合已收敛到 Increment）

以下保留当时方案；现行 Increment、准备/分析/结案 hooks 及退役要求以 spec.md、plan.md 和主线同版移交为准。

**决策**：安装选择遵循官方 skills；部分模式可独立安装，不自动补齐。公共挂载要求五项被本次显式选择且文件全部核验；缺项报告命令阶段失败。先执行适用 hooks，再直接调用既有 register-commands，对 modes 一次 `specify extension add --dev <临时目录> --force`；每次都调用，不复用旧状态或按指纹跳过。命令仅为 speckit.modes.tutor/pair/review/explore/guide，不增加 bug-report 命令。

**依据**：用户已确认五入口及每次全部重装；当前 `packages/skills/script/register-commands/register-commands.sh` 与同目录 .ps1 直接实现该行为；旧 Python 实现已按用户要求删除，工作流 [工程证据](../20261029-speckit-workflow-foundation/analysis/acceptance/script-mount-mvu.md) 已记录本地官方 CLI 实测。分发须复用脚本并验证外部独立运行、文件投影、平台与35集成，不能照搬局部证据冒认全覆盖。命令临时目录成功/失败均清理；失败记录退出信息与实际现场，不承诺保留临时输入。

七项所选钩子分别使用 hooks-only 输入，每次由官方 CLI 按来源强制重装，不以等价复用或自有状态跳过；无关扩展的处理交给官方 CLI。modes 受管五项每次以来源刷新，其他扩展与无关配置需通过原生调用读回证明保留。配置的格式和注释不保证字节不变，语义损坏则 MVU 失败，不能手写 registry 补救。

**撤回方案**：旧逐技能 command-only 扩展、额外后缀及“已有 modes 保留不重装”与最新用户约定冲突，不再实施。五项共同挂载不是五个技能之间的安装依赖；选择范围不足时保留安装结果并提示，不扩大官方安装集合。

## 6. 隐匿与重试

**决策**：只在明确项目本身 `.git` 为目录时更新该仓库本地 exclude；无 .git 或 .git 为文件均明确跳过，不向上搜索。精确路径追加去重，再以 `git check-ignore -v` 和 `git ls-files` 核验。共享配置不整体隐藏，全局项目外路径不处理。

**依据**：[git-check-ignore](https://git-scm.com/docs/git-check-ignore) 和 [git-rev-parse](https://git-scm.com/docs/git-rev-parse) 提供排除来源及路径核验能力。已跟踪冲突在安装前拒绝，不能通过 ignore 或取消跟踪处理。

**备选**：修改 .gitignore 会影响协作者；寻找父仓库或直接拼接 worktree .git 会越过已确认范围。失败保留完整成功技能，逐项重验后续接；命令阶段仅对本次所选 Increment 官方重装；不以自动回滚删除用户内容。

## 7. 历史：2026-11-04 阶段结论与剩余验证

技术路线与接口按 2026-11-04 用户确认更新，T003 已按用户确认的 Linux 范围验收，下一项为 T004。公开仓库地址由用户建仓后补充，属于发布前置条件；本轮不发布。MVU-A 已实测，B～F 未执行。计划阶段的实验仅为本地开发版的临时 manifest 解析和命令名称校验；后续 T001～T002 的额外证据见 tasks.md，不抵扣这些 MVU。计划阶段未安装扩展、未调用注册函数，不能替代官方入口、跨平台或远端安装证据。

## 9. 历史：MVU-A 实测结论（2026-11-04）

用户确认本项只验 Linux。固定 skills 1.7.4 在 Node 22.20.0 下完成9组真实实验，包含79项目级、77全局位置、四种选择、完整附件、Eve字节投影与12环境/旧路径分支。官方对混合未知名可能只安装有效项、对不支持global可退出0、裸重装会覆盖已有修改，故保留只读预检并以实际产物判定。当时源码探针仅为验证依赖；现行产品已改为从完整性校验后的官方发布包读取所需规则，仍不执行 CLI 入口或安装代码。详见 [MVU-A证据](analysis/acceptance/mvu-a.md)，不抵扣其他平台、远端来源或模式行为验收。

## 历史：2026-11-04 平台执行修正（已由唯一 Node 入口替代）

本包运行入口直接使用环境对应的 .sh/.ps1；安装、hooks 和五指令不经 Node 转发。skills 方式仍由用户手动执行同版公共平台脚本，curl 方式自动串联安装与挂载；两者复用同环境的平台实现。CLI 版本使用 FOUNDRY_SPECIFY_VERSION 或默认 1.2.6。构建只原样复制，Node/TypeScript 仅用于构建、测试或官方工具所需环境；不交付自有 TS/JS/Python 安装核心、Node 分发器或嵌套 package.json。后续任务不得重新创建已取消的转发层。

</details>
