# Phase 0 调研：主线技能按环境构建与发布

**证据日期** 2026-11-25 · **源码基线** 1bcc1bd · **输入** [功能规格](spec.md)

本次核对现有构建、脚本、安装器和工作流，并对照公开文档。下面的技术前置仍须按实施阶段的实际工具和运行结果取证。 [验收指南](quickstart.md)

## 构建模式与集合选择

**当前决定（2026-11-26 更新）** 使用 Vite 当次 `mode` 作为唯一环境选择，不增加自定义环境变量。仅保留 `build`，未传 `--mode` 时沿用默认 `production`。集合配置可声明静态或按 mode 求值的 `enabled`；当前配置工厂默认启用，扫描器只在输入没有 `enabled` 时兼容旧 `publish`。插件从构建环境取得当次 mode 并交给 Node 扫描函数，不在 Node 动态导入模块中直接读取 `import.meta.env.MODE`。工作流与直接调用 Vite 的脚本在本阶段不改动。 [用户确认](spec.md#session-2026-11-26) · [构建与发布契约](contracts/build-and-publish.md) · [环境验收记录](implementation/T008.md#实际结果)

**理由** Vite 已提供唯一、与真实构建一致的 `mode`，避免自定义进程变量和 Vite mode 不一致。引擎在 `applyToEnvironment` 中从 Vite 构建环境读取 mode 并加载子插件；其他插件从各自构建钩子的环境读取 mode，再传给共享扫描函数。`vite.config.ts` 不代传 mode。普通 `vite build` 的默认 mode 就是 `production`。Node 动态导入的集合配置本身不是 Vite 转换的应用模块，因此扫描函数需要接收 mode 参数，而不是直接读 `import.meta.env.MODE`。 [当前构建入口](../../../packages/skills/vite.config.ts) · [开发挂载](../../../scripts/dev/mount-speckit.sh) · [Vite 模式](https://vite.dev/guide/env-and-mode#-modes) · [Vite 配置](https://vite.dev/config/) · [Vite 插件上下文](https://vite.dev/guide/api-plugin#config)

**备选** 各插件独立按照 mode 重扫会引入上下文漂移。由每个插件保留 `publishOnly` 布尔值会丢失实际环境信息，并与集合配置的 enabled 规则分离；改为各扫描调用传入 Vite 当前 mode，由扫描器统一过滤。

**前置验证** 用相同进程顺序构建三种模式，再运行一次 write:false 挂载构建和一次隔离 outDir 构建。读取实际技能、派生数据和输出路径，核对同次选择及文件系统副作用。早期目录覆盖实测发现正文写到固定 `dist/skill`，T008 已修复并对相对和绝对输出路径复跑。测试缺配置、非普通配置、导入失败和安装名冲突的既有行为，再确定需要保留的分支。 [集合扫描](../../../packages/skills/build/utils/scan-skills.ts) · [现行构建测试](../../../packages/skills/tests/distribution/vite-plugin-skill.test.mjs) · [T008 分项验证](implementation/T008.md#分项修复与剩余验收)

## 评审范围与手写源码依据

**决定** 先形成插件逐项评审、脚本引用清单和编码风格记录，再落实已证实的问题及可清理文件。优先处理环境选择、输出目录和本次发布安装契约直接涉及的问题。工程记录须关联源码、调用方、影响、可复核验证和处置。以主线用户手写分工的原话和 Git 历史中的对应实现核实示例。初始迁移提交 1a72446 的配置工厂、coding 集合和 Vite 配置提供 const 泛型、类型导入、ESM 别名和短插件工厂的可定位示例。结合现有工程约定记录中文多行 JSDoc 与声明覆盖规则。 [手写分工原话](../001-skills-distribution/requirements/raw/2026-11-12-track-ownership-and-repository.md) · [迁移清单](../001-skills-distribution/implementation/repository-migration-files.md) · [工程约定](../../../AGENTS.md)

**理由** 主线当前打包路径没有显示直接使用 script/old，但本地注册包装脚本和旧读取测试仍指向已不存在的旧默认位置，test-entry、mvu-b 和 mvu-c 亦有可覆盖的脚本根。Python 全量挂载测试可在夹具中重建旧目录。默认路径不存在、夹具通过和单次搜索无匹配都无法证明旧文件已无实际消费者。核对历史迁移、动态输入和直接运行证据后决定保留或删除。 [本地包装脚本](../../../scripts/dev/actions/register-hooks/register-hooks.sh) · [入口测试](../../../packages/skills/tests/distribution/test-entry.mjs) · [动态来源场景](../../../packages/skills/tests/distribution/mvu-b.mjs) · [挂载夹具](../../../packages/skills/tests/test_full_remount.py)

**备选** 批量清空旧目录会丢失尚未厘清的动态入口和历史测试证据。恢复旧默认路径会引入另一套现行接口，需要独立的消费者证据。

## 候选身份、版本文件与安装校验

**决定** 版本插件每次构建开始时读取一次当前 UTC 毫秒时间，格式为 YYYYMMDDTHHmmssSSSZ。VERSION 使用一份 UTF-8 JSON 对象，保存 packageVersion 与 releaseTimestamp。候选读取归档中的 VERSION，固定对象键和索引沿用其中的 releaseTimestamp。索引条目用 version、url、bytes、sha256。安装器先核对下载字节长度和 SHA-256，再在独立目录读取唯一常规 VERSION 成员，核对时间戳才进入项目写入。 [数据模型](data-model.md) · [安装契约](contracts/install.md) · [时间戳来源确认](requirements/raw/2026-11-27-release-timestamp-source.md)

**理由** 公共部署工作流原先把整份 VERSION 拼进归档名，T009 接通 `packageVersion` 字段读取。README 中的 SemVer 是示例，当前安装源的公网地址是占位。仓库未发现仍消费旧公网入口或 SemVer 索引的证据。现有隐藏脚本旧包布局兼容有测试，需要保留。两次清洁构建使用相同源码、依赖与固定测试时钟，比较解包文件全集及原字节。实际交接校验同一原始归档的字节及 SHA-256。 [现行工作流](../../../.github/workflows/skills-deploy-common.yml) · [安装源](../../../packages/skills/build/plugins/vite-plugin-curl/install.source.sh) · [隐匿契约测试](../../../packages/skills/tests/distribution/hidden-contract.test.mjs) · [Node Hash API](https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options)

**备选** 继续将源码版本当发布键会使同源码版本的不同构建覆盖。单用 MD5 排除了用户确认的三项检查。分行文本也可解析，但结构化 VERSION 可通过现有 Node 或 jq 明确区分两个字段并做严格解析。凭据或短期签名混入候选元数据会改变其交接范围。

**前置验证** 用真实 tar、两份可区分标记与倒序版本标识，覆盖默认、显式及三项独立失败。保留引擎接口和项目冲突保护。先实测归档安全核查的成员判定和隔离解包顺序，失败后需能查证项目与后置脚本均无写入。发现真实旧公网消费者或旧根表时，先确认实际字节和迁移路径，避免用猜测重写历史。 [历史交付契约](../001-skills-distribution/contracts/curl-delivery.md)

## CI 交接与同目标顺序

**决定** 在公共可复用工作流设置目标级并发组，queue: max，cancel-in-progress: false。构建、准备版本表、独立发布分工。同一运行的 artifacts 交接归档、安装入口与候选元数据，再交接更新索引及基准 ETag 或已确认缺失状态。发布作业显式复核文件摘要、字节、源码 SHA、发布标识和目标。构建与测试可检出候选源码。持有 R2 凭据的作业只运行当前受信工作流版本中的版本管理脚本。 [CI 制品](https://docs.github.com/en/actions/tutorials/store-and-share-data) · [GitHub 并发控制](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) · [复用工作流](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)

**理由** GitHub 可将同组至多 100 个运行置于等待，满额后额外运行会被平台取消。完成顺序由实际队列和运行结果确定。只对上传作业加锁会给多个准备作业同读旧索引的窗口。跨 job 的制品传输摘要提示本身不足以阻止坏候选部署，需要硬失败的文件级核对。

**备选** 单 job 合并步骤绕过用户要求的独立作业。默认的单等待项可能替换未开始发布。额外持久队列在当前两环境规模下会引入新的状态和外部基础设施。

**前置验证** 在隔离运行证明本仓库接受队列语法，连续三次同目标触发时有正在运行、排队和后入队的独立记录，后一轮读表发生在前一轮结束后。检查平台满额、取消和超时可见性，以及跨 job 制品身份、校验失败、环境变量可见性、触发 SHA 与旧运行重跑拒绝。没有远端运行授权时保留待验证状态。 [GitHub Actions 限制](https://docs.github.com/en/actions/reference/limits) · [运行变量](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)

## R2 条件写与失败结果

**决定** 继续使用 AWS CLI v2 的 S3 API 命令。仅在目标桶明确返回 NoSuchKey 时按首发准备。固定归档以 `If-None-Match: *` 创建，下载回验 SHA-256 和字节长度。根入口写入并核验后，索引用 `If-None-Match: *` 创建或以读取时的 ETag 作为 `If-Match` 更新。写失败终止该次部署，AWS_MAX_ATTEMPTS=1，并禁止发布旧工作流运行的重跑尝试。使用新触发作为独立发布。 [R2 错误码](https://developers.cloudflare.com/r2/api/error-codes/) · [R2 条件写入](https://developers.cloudflare.com/r2/api/s3/conditional-operations/) · [AWS CLI PutObject](https://docs.aws.amazon.com/cli/latest/reference/s3api/put-object.html) · [AWS 调用尝试次数](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html)

**理由** 三对象跨键写入没有统一提交，版本表最后写入是登记边界。先写并核验归档和入口，能在索引写入失败时保留既有可用记录。网络中断后发出的请求仍可能提交，诊断可做一次独立只读核对，证据分别标注明确失败、已观察写入及结果未定。单次 PutObject 足供当前技能归档，检查目标服务的单对象上传上限。 [R2 一致性与在途写入](https://developers.cloudflare.com/r2/reference/consistency/) · [R2 限制](https://developers.cloudflare.com/r2/platform/limits/)

**备选** 绝对覆盖索引可能丢历史，无条件写归档可能覆盖已发布内容。循环重试、重建并二次上传、自动删除或回滚都会改变本次失败的既定处理。

**前置验证** 先以可控制返回结果的 S3 边界替身执行实际发布实现，再在获授权的 release 桶用实际 API 锁定 CLI 参数、明确对象缺失、条件冲突和 ETag 回传。403、NoSuchBucket、网络失败与异常索引均须停止。核对脚本与制品无越权写入，未授权阶段停在替身验证记录。

## 下载根与历史索引

**决定** 环境各有独立 HTTPS 下载根。配置真实公网下载根后，索引 URL 指向实际对应环境的固定对象。release 缺公网根时，服务端可用该桶真实 S3 endpoint 和对象键构成内部 HTTPS 定位，明确需要认证且只走 S3 回读验收。生产发布使用已确认的生产公开根。当前范围内发现既有、无法由新入口消费的旧根索引时，在写入口前终止该目标发布并保留对象，由维护者以实际记录确认后续兼容方案。 [R2 公共桶](https://developers.cloudflare.com/r2/buckets/public-buckets/) · [R2 预签名 URL](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) · [R2 缓存一致性](https://developers.cloudflare.com/r2/reference/consistency/#caching)

**理由** 测试桶地址后续补齐，三组门禁和实际 S3 回读即可满足生产接入证据。S3 endpoint 能定位真实对象但需要签名，既有内部版本在转为公开可用前需核对下载根和历史地址。默认入口和版本表是可变对象，公开验收分别核对缓存、实际入口字节及索引首条。按对象键的认证读不经过公网缓存。

**备选** 用占位域或供公开使用的过期签名链接会令持久索引失效。提前开公网桶需要外部授权。常规发布保持全部历史记录的值和顺序。若未来公开启用需要迁移同一测试桶的已有私有 URL，应备份索引并核对归档键、字节、摘要和顺序，由维护者单独授权切换，再做公网验证。当前规划将该风险留在公开启用这一步。

## 测试门禁与基线

**决定** 现行 skills-test 使用触发提交和只读 checkout 权限，调用三组测试。复用隔离的 Vite、引擎、Spec Kit 挂载和真实安装夹具。连续发布用实际准备及发布逻辑与可控的隔离对象存储边界，不在每次 CI 门禁连真实 R2。缺工具、断言失败或必需用例被跳过均不放行。以同次运行中的三个结果和被测 SHA 驱动后续部署。 [验收指南](quickstart.md) · [现行门禁](../../../.github/workflows/skills-test.yml) · [HTTPS 测试源](../../../packages/skills/tests/distribution/helpers/https-source.mjs)

**理由** 本地历史基线为四组 Node 64 项和 Python 39 项通过，Node 运行前隔离补齐 jq。旧 runner-archive 与 pipeline-workflow 因引用已删除工作流失败，实际断言需按当前入口复用。技能包 check-types 在已有预设 dist 的工作区通过，干净安装需先构建预设依赖。历史基线的类型检查遗漏动态挂载插件，纳入后复现捕获组引发的 `TS2345`。T008 已将插件纳入常规类型检查并修复解析输入，缺少 `description` 的回归通过。 [历史基线与当前验收](spec.md#当前分支依据) · [T008 分项验证](implementation/T008.md#分项修复与剩余验收) · [预设导出](../../../packages/preset-config/package.json)

**备选** 继续使用占位通过或只断言 YAML 文本无法证明本次产物和安装结果。复用全部旧测试入口会夹带已退役的工作流和缺失场景。首次外部失败验证与跨 job 契约分别留证，真实 release 桶部署和公网实际消费各按相应条件运行。
