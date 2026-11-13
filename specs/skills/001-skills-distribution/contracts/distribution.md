# 发布目录与构建契约

## 当前集合内容契约（2026-11-11）

以spec的FR-053～060及[独立插件讨论](../requirements/discussions/2026-11-11-independent-plugins.md)为准：自动发现集合，只复制skill清单列出的技能至dist同名集合，配置原字节交付。缺配置默认packageName=null、mcp=false、skill={}，不交付技能。逐事件hook独立保存参数和扩展属性，command/description留未来生成器读取来源；frontmatter及附件保持，MCP目录为空。

唯一Vite配置注册职责独立的插件，各自发现所需来源，不维护四目录名单。当前目录插件及现有技能资产插件已接入；技能复制新插件和脚本生成插件仍只有空函数，不传递自建共享上下文。写法不再限定组合式/工厂函数或声明必须位于函数内部。额外dist/mcp只为空目录，不生成清单；本轮不交付script、Release、安装投影或子包package.json，特定脚本和发布按用户要求另行处理。下面旧三目录及MCP清单的具体算法保留历史，不作为本轮立即实现或验收要求。

**本次重规划（2026-11-10）**：三目录、MCP 自动清单和发布打包全部纳入重做，与 CI 及技能发布部署共同优先。新构建按[节点契约](build-pipeline.md)显式传递输入和返回值；旧实现已存入[进度存档](../archive/2026-11-10-build-pipeline-replan/README.md)，以下当前源码描述只作为对照，旧通过不能自动验收新实现。安装脚本、原始技能及工作区消费源码保持，不在本轮回退。

**现行执行入口（截至 2026-11-09）**：唯一对外调用为 node script/index.mjs 加参数，无 install/mount/hooks/commands 子命令。Node 调度平台模块；安装及官方预检经 script/install-skills/read-agents.mjs 在线解析官方 npm skills latest，不固定版本或数量。同次规则、建议 CLI 与运行报告使用同一实际版本，失败不回退旧表。包根 distribution 与 agents.json 已移除，不增设替代声明。Increment 与实施准备及分析/结案 hooks 消费主线同版交付，不将脚本存在视为完整验收。

**流水线增量规划**：本版本在 Foundry 交付可迁移工程及隔离验证，迁入独立公开仓库后首次正式发布。项目迁移包含必要源码、配置、测试与流水线；供使用者安装的发布树只包含公开白名单，两者不能混用。触发、候选、权限与 Git 版本规则见 [pipeline.md](pipeline.md)，历史段落不覆盖最新澄清。

## 职责与运行时临时输入

2026-11-03 用户修正包职责：本包只提供 skill 和脚本，不作为 Spec Kit 扩展源。取消包根 extension.yml、构建期 extensions/ 声明及独立 mounts.json；挂载规则随脚本维护，官方 CLI 所需 manifest/payload 仅由脚本在调用时准备临时输入，不进入源码声明目录、发布清单或安装技能目录。脚本仍调用官方 Spec Kit 命令，绝不手写 registry、入口或共享配置。 发布验证必须拒绝包根 extension.yml、固定 extensions/ 树或 mounts.json 回流。临时输入只属于挂载操作现场，模式临时输入成功或失败均按既有脚本清理；诊断与钩子临时输入按 mount 契约执行。

## 历史构建产物（旧三目录）

`packages/skills/vite.config.ts` 使用直接对象导出，一次 build 完整生成全部已有内容，不区分 mode，不生成旧 dist 根 manifest.json/index.js。目录由内容与消费者区分，不能用 install 这一动作命名技能内容。

```text
src/mcp/     → dist/mcp/
src/skills/  → dist/skills/
script/      → dist/script/
构建派生     → dist/release.json、dist/projections/
```

src/skills 保留完整线下分类与附件，src/mcp 独立生成 dist/mcp/manifest.json。旧实现的默认 dist 根为 mcp、skills、script、release.json、projections 五项；release.json 已接入正式开发模型，默认公开选择为 coding/frontend 当前来源并标 development。重做保持这些产物职责及模型线格式，不能因旧实现已存在而跳过三目录或 MCP。完整 workflow 同版来源仍待移交；开发构建通过不等于完整发布通过。release.json.files 加清单自身才是公开安装文件集合，不能把全量 dist 当公开选择。旧根 manifest.json/index.js 不恢复。

## 公开选择与完整发布目标

**上下文边界（2026-11-11）**：下方沿用dist/skills、逐技能speckit-hooks.json及旧三目录算法的表述属于旧重规划参考。当前主线采用集合集中配置、独立插件和空MCP目录，后续发布/脚本任务执行前须按FR-048～060对齐；不要求恢复已删除的逐技能配置。紧急副本的所选集中定义随同版公共挂载材料交付，布局及运行时转换以[紧急契约](urgent-release.md)为准，不将旧目录算法作为其前置。

公开分类仍为 coding、frontend、workflow，排除 eval；按主线同版正式来源确定，不固定历史数量。当前模式仅 task-increment；implementation-preparation 按主线所选名称交付正文和实际必要附件，hooks定义取同版集合集中配置及所选公共挂载材料，保留 artifact-project-description、新增 artifact-spec-analysis、移除六旧技能有效分发及映射。三暂停模式源码保留，公开候选不能继续将其作为本期可用来源或入口宣传；具体来源选择服从主线正式范围，不因本轮映射缩减改变其他安装语义。准备/分析正式来源缺失时保持 T012/T013 完整验收未完成，不用旧来源、主线计划或占位正文补齐。

清单模型不新增另一套模式状态：原 mountMappingIds 须在 export.ts 中按当前有效映射对齐 Increment 与所选 hooks，正文/附件/配置一起进入逐文件清单和适用投影；原始 dist/skills 完整复制不代表每项进入 release.json.files。官方生成入口允许其 frontmatter 转换，安装源与投影仍按全文件摘要校验。

递归收录必要附件。禁止自动复制未公开依赖；检测到必须同时安装的其他技能时填 requiresSkills，安装时要求显式补选。projectPrerequisites 指向消费者已有材料，不能复制工作区治理代替。检查源中失效的历史路径并做最小修正，修改技能时加载相应技能编写规范，不改技能核心协作规则。

发布清单须逐文件排序、稳定序列化和可复现摘要，记录自有技能版本、工具来源策略及源码提交；tools.skills 为 latest，实际 skills 版本与 integrity 只进入每次运行报告；相同输入构建两次的有效交付文件应一致，不注入当前时间导致漂移。排除 eval 仅属于后续公开发布选择；当前 dist/skills 与 link-skills 保留全部线下内容，MCP 清单只读取 src/mcp，不根据线下公开分类推导线上范围。

## 构建接入

只保留 vite.config.ts，从来源快照、内存建模到写出与独立复核采用一处有序编排，一次生成 dist/mcp、dist/skills、dist/script、dist/release.json 与 dist/projections。四个旧插件及 build/distribution 实现都在重做范围，具体收敛按调用与消费者核对，不要求保留旧钩子结构。生成前检查输出根归属和路径安全，不能借清理生成目录覆盖源码或用户文件。

MCP 源和完整线下技能按既定目录交付，适用技能的 speckit-hooks.json 随正文附件进入 dist/skills；运行脚本与 README 等仅原样复制，排除测试、Python 缓存和本机 node_modules。不得导入、执行、编译或打包 script 下的代码，不在构建期在线查询 Agent。files/adapters 引用实际读取器和平台模块，不包含静态 Agent 表或集中 definitions。两个内容源须存在，src/mcp 可为空，.gitkeep 不交付；内部虚拟入口不形成公开文件，无双模式或未实现工具占位入口。

新构建须从实际磁盘独立核对路径与字节、MCP 内容、Release 引用及完整投影，再供 CI 复用。正式候选必须在两个干净构建同源同依赖的基础上准备；整个 payload 与公开白名单双向相等，不能把允许完整 dist 保留未选文件的旧 verifyContent 直接作为严格候选验证器。内容索引与上传后平台收据分开，结构及真实 ID 时序见 pipeline 契约。

现有 apps/mcp 与上下文估算工具仍有旧 manifest 依赖，其迁移不在本轮范围。安装器、Release 模型及预检已有阶段证据；完整工具、迁移材料和公开来源仍按原任务验收。

## 后续迁移清单与发布门禁（待实施）

安装候选严格按 release.json.files 加 release.json 自身复制，包含许可证及必要来源说明，不恢复 Agent 声明文件；不直接复制整个 dist，不夹带源码、CI 工具或测试。旧根 manifest.json/index.js 已取消，dist/mcp 的线上发布规则另行定义，monorepo secrets、.agents、真实 .specify、画像及 eval 不进入公开交付。维护者说明保留生成命令、源提交和可复现方式。T037 的完整本地候选固定 version/sourceRevision/catalogDigest/文件摘要，只证明其实际来源；迁移改变源码 SHA 后须重建核验，不把旧候选身份直接套到新仓库。

用户直接迁移 skill、MCP 等源码及必要的 build、script、测试、配置和根 `.github/workflows`，在新仓库维护依赖与配置，不生成 ProjectBundle、配置投影或工程导出器。迁移说明列清所需文件与调整项；迁后实际独立构建由 T061 核验，不得复制 Foundry node_modules 掩盖依赖缺口。源码迁移范围与技能安装候选仍严格分开。

迁移后由新仓库从默认分支检查并准备新身份候选，经维护者明确触发，创建仅含候选树的独立提交和新的 `skills-v<version>` tag；固定提交 HTTPS 根作为两入口共同来源。不更新源码默认分支、不将 tag 指向混有源码/测试的树，也不把多个历史版本目录一起放入安装根。无 force 竞争保护、同字节复用和远端核验按 pipeline 契约执行。

T032/T038在真实发布后只读核验固定来源与新候选，两入口、独立用户和支持矩阵要求保持。发布字节变化须新版本重建重验，本地通过不抵扣真实来源。本次Tasks已衔接全部构建重做、早期CI及平台收据前置，原身份/证据和撤回T054/T057保持；任务生成不表示工程通过。

必须记录本地/远端、平台、agent、scope 各维度证据。发布前检查所有必需附件、发现粒度、投影、脚本独立运行和 [quickstart](../quickstart.md) 的矩阵。未达到的组合明列未验证，不能用本地 Linux 结果代表 Windows/macOS，也不能将占位 URL 写成可运行命令。外部发布仍需用户明确授权。

发布 README 的源码复用 packages/skills/README.md，由后续构建任务复制到发布根，不新建 packages/skills/distribution/README.md。发布README采用参数化来源：使用者先将发布者提供的固定提交HTTPS根URL赋给RELEASE_SOURCE，按文档校验非空、HTTPS和固定提交后，再执行引用该变量的安装及挂载命令。Bash/PowerShell分别提供赋值和引用语法；带占位的示例必须标为待赋值，不能宣称可直接运行。真实URL、commit、version、catalogDigest、README摘要和展开后的命令保存于本功能analysis/acceptance/release-source.md，属于发布根外的验收资料，不进入release.json文件清单。独立使用者取得来源值后，仅按交付README完成操作；不需要开发者另补安装步骤。

发布根内README不嵌入承载自身的commit，也不在T032替换占位后重写。候选固定后的交付字节变化使既有摘要与依赖验收失效，须在对应源码仓库重新准备和核验；已公开同版本不可覆盖。迁移后由有权维护者触发新版本发布，再重做适用 T032/T038 验收；T039 同样受此约束，仅更新发布根外证据不改变候选。

## 历史：2026-11-03 脚本目录修订

已实现的 register-commands 源迁到 `packages/skills/script/register-commands/`，单次构建原样复制运行文件与 README 到 `dist/script/register-commands/`；测试和缓存不交付。安装器恢复实施后直接调用该产物，不重新复制源码路径，也不重复维护另一套挂载实现。其余任务按 2026-11-04 衔接安排从 T003 继续，本轮不执行实现。

## 历史 MCP 清单契约（内容生成已后置）

这里的 manifest.json 是由 MCP 技能源派生的构建产物，与挂载脚本运行时准备的 Spec Kit 临时输入是两种不同用途的材料；禁止手工维护源清单不妨碍构建生成清单。

构建递归扫描 src/mcp 中的 SKILL.md，解析 YAML frontmatter，并收录技能目录内 references 下的全部 UTF-8 文本附件。保留源目录复制产物，同时在 dist/mcp 根生成 manifest.json；禁止在 src/mcp 根维护同名文件。旧 dist/manifest.json 不恢复，线下 skills 目录不参与本清单。

JSON 结构为 `{ "version": 1, "skills": [...] }`。每项包含 name、description、destructive（缺省 false）、category（根目录技能为 null，分类技能为相对父分类路径）、skill（完整 SKILL.md 原文）、references（name 为 references 下相对路径、content 为完整文本）。字段沿用已有清单形状，但新路径与来源独立；不自动迁移 MCP 应用。

使用已声明的 yaml 构建依赖解析元数据；name 为小写字母、数字及连字符组成的技能标识，description 为非空字符串，destructive 若出现须是布尔值。技能名重复、元数据损坏、正文为空时构建失败。技能和附件采用明确名称排序，不含生成时间；同源重复构建保持字节一致，空目录生成空 skills 数组。删除源条目后重建清除旧条目。

## 历史：2026-11-04 五指令复用与外部验收

发布完整 register-commands 运行目录（含双平台脚本和 README），不重新生成独立模式扩展或新的注册状态系统。官方 skills 的分类/单技能选择保持不变，不能为凑齐五份挂载源隐式增加安装。独立本地产物可在外部项目验证获取、安装、挂载并承接工作流行为验收；无需等全量分发验收或远端发布完成。此阶段证据不抵扣 T032 的真实公开来源与独立使用者验收。

## 运行依赖交付

Increment 复用缩减后的 register-commands.sh、.ps1 与 README；外部 Node 入口调度平台脚本执行安装，不交付自有 Python 核心或嵌套 package.json。hooks 同样只交付原生双平台脚本与 README，不再交付 YAML 辅助脚本；运行时无需第三方 Node 库。构建可以解析 MCP 元数据，但不得导入、执行或打包 script。

## 历史：2026-11-04 平台执行修正（已由唯一 Node 入口替代）

本包运行入口直接使用环境对应的 .sh/.ps1；安装、hooks 和五指令不经 Node 转发。skills 方式仍由用户手动执行同版公共平台脚本，curl 方式自动串联安装与挂载；两者复用同环境的平台实现。CLI 版本使用 FOUNDRY_SPECIFY_VERSION 或默认 1.2.6。构建只原样复制，Node/TypeScript 仅用于构建、测试或官方工具所需环境；不交付自有 TS/JS/Python 安装核心、Node 分发器或嵌套 package.json。后续任务不得重新创建已取消的转发层。
