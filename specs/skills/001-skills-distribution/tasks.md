# 任务清单：构建、流水线与技能发布共同交付

## 当前迁后续接：T090开始（2026-11-13）

本地迁仓已完成，见[迁仓执行记录](implementation/repository-migration-execution.md)；下方11月12日“尚未建仓”的文字保留当时语境。用户在本会话明确“紧急版开始吧”，现按[T090方案](implementation/T090.md)核对新根配置提交、许可与真实消费环境，再重建并冻结迁后候选。当前配置改动仍在暂存区，T090尚未完成；T091～T093未执行。主线T076/T077保持用户手写，工作流T099的暂停不因本轮启动自动解除。

## 当前主线范围调整：撤出官方skills入口（2026-11-12）

依据[用户明确的主线范围纠正](requirements/raw/2026-11-12-main-curl-only.md)及spec顶部，主线只保留curl安装。T013～T015作为官方预检/文档/安装MVP专属待办撤出本期，保留未完成和历史证据，不作为结案或下游前置；T016直接依赖T012。T021继续curl内容完整性/恢复，T027及构建、矩阵、迁后消费任务去掉主线官方第二步和双入口对比。原已完成Task不重开，依赖保护、数据来源及平台范围其余保持，不把去掉一个入口算工程通过。

紧急版T078～T093的全部正文、依赖和checkbox不变，仍按官方skills加显式挂载两步；主线用户手写分工、T076/T077及其先后保持。所有源码、既有测试、归档和已冻结候选未在本轮修改；主线模型/其他契约/指南及产品测试的旧官方入口内容列后续适配，不得据旧材料恢复已移出的主线入口。

## 当前协作续接：主线用户操作，辅线子代理推进（2026-11-12）

依据[本轮原话与建仓安排](requirements/raw/2026-11-12-track-ownership-and-repository.md)，主线T076/T077由用户操作，AI只讨论和提供手写示例，不接管代码。紧急辅线三个子代理已交回本地准备：[公开内容副本及处置清单](analysis/acceptance/urgent-public-content.md)、[新根依赖与配置草案](analysis/acceptance/urgent-migration-runtime.md)、[ISC及第三方通知](analysis/acceptance/urgent-public-license.md)。协调者已读回报告并独立核对副本440条checksum和96个受保护原文件；未新增审查代理。原T078～T089完成事实保留，T090～T093未执行，不以准备副本或草案标为通过。

用户尚未建立新仓库，要求当前仓库工作完成后提醒建仓；不代建仓、不索取重复继续确认。公开副本仅对应本次捕获输入，主线及后续记录继续变化时迁移前刷新，不能将未提交快照摘要当新仓库Git身份；新根安装、严格工程检查、双构建和公开消费仍须真实执行。原私有资料、归档、紧急冻结候选与主线并发改动保持。

更新日期：2026-11-12。输入为[spec](spec.md)、[plan](plan.md)、实际读取的同级[mvu](mvu.md)、[data-model](data-model.md)、[research](research.md)、[紧急契约](contracts/urgent-release.md)、其余契约及[quickstart](quickstart.md)。按本轮合成TASKS_TEMPLATE_CONTENT增量衔接，不重建已有功能。

当前 **78项有效任务、30项累计完成、48项待办**。保留原65项主线身份（T013～T015撤出，62项有效）及T078～T093共16项紧急任务，不新增或复用编号；紧急本地T078～T089共12项已按各自整体验收完成，原T089暂停要求已撤销；T090～T093共4项仍需真实迁仓输入及适用操作授权。仅本地段完成，不计最终公开SC-019通过。已有仓库外副本、局部实现和范围证据可复用，但不证明新位置已接入或本地全部验证通过；原主线完成事实、暂停T053和撤回身份保持。

## 当前连续推进规则（2026-11-12）

紧急版已完成T078～T089；按[本轮豁免](requirements/raw/2026-11-12-urgent-continuous-exemption.md)取消中间阶段、逐Task方案重复确认和T089后的固定暂停。已授权范围内继续准备与实施，T090需真实迁仓输入；不再另索取阶段继续指令，迁仓及公开操作仍按适用明确授权执行。原主线packages/skills仍沿用户手写与T076/T077顺序，不因紧急版局部阻塞而冻结；下方恢复实施措辞描述本轮开始时授权。最终输入7e79b524及完整实证见[交接记录](analysis/acceptance/urgent-handoff.md)。

## 当前续接前置：强制发现两条工作线（2026-11-12）

执行spec顶部及FR-061/063的[强制发现要求](requirements/raw/2026-11-12-mandatory-track-discovery.md)：进度/下一步答复、规划或恢复实施（含新会话和中断）前，先核对spec、plan、本任务清单、同级mvu及必要现场，分别报告主线和紧急版的当前事实及依据、下一步、分工、适用阻塞或继续条件。目录缺失、单线指定或材料不足也要识别另一条线，未知标待核对，不静默遗漏或无依据暂停；行为按US5场景7～9与SC-019验收。

本轮用户已要求继续实施，先从紧急T078接入工作区、T079冻结接口与失败骨架，再按原依赖推进；不因下方历史Tasks生成阶段“不恢复实施”文字再次索取相同授权。主线packages/skills保留用户手写分工与T076/T077原顺序，紧急版子代理协作不接管主线、不等待主线重写。每项仍核对已有方案、真实前置及证据；工程checkbox只按实际整体验收更新。单线失败不冻结无关工作，T089通过后不暂停，真实迁仓输入具备后按既有授权推进T090。

## 紧急路径：工作区实施、连续推进与迁后交付（2026-11-12）

依据[本轮原话与Clarify B](requirements/raw/2026-11-12-workspace-local-handoff.md)更新16项原任务的位置、前置与验收，保留其他已确认要求。正式目标是同一工作区packages/skills-distribution-urgent，规划时不存在，现T078已完成接入；旧仓库外副本保留原未提交字节作为恢复依据。所有生产实现和包内dist只在新包，不覆盖packages/skills主线、归档或用户代码；本Spec保存原任务方案回链及证据。

本地执行范围为T078～T089：T089核对全部必要证据并**暂停**。T090～T093属于用户后续实际迁仓、明确启动后的阶段；T089成功只满足技术依赖，不自动取得继续执行、建仓、搬移、推送或发布授权。迁后四处来源为紧急包、packages/skills、specs/skills、apps/mcp，新仓库ISC；eval源码可保留，正式发布/列出/安装eval仍0。

本次只生成任务，不搬代码或开工。原implementation方案已有的先读取并按新位置/接口/依赖复核，适用内容复用、失效内容保留历史，不预建16份方案或把旧方案当新认可。实际进入每项仍消费共同准备及有效授权；用户此前直接多代理执行和免审查代理的范围按当前有效指令复用，但本次Tasks不恢复实施。

紧急包命令以pnpm --filter @foundry/skills-distribution-urgent的lint/check-types/build/test为准；后段固定约束中的@foundry/skills验证属于原主线，不混作紧急包命令。依赖走根catalog，预设走已声明exports与workspace:*，不复制旧Git/node_modules/锁/dist，不改变根锁策略。TS/JS改动先加载document-changed-symbols，中文多行JSDoc，Markdown保存立即ESLint并读回；不存在根级pnpm test。必需缺项/环境失败为failed/not-run，不以skip、旧输入成功或替身冒认通过。

## 紧急Phase 1：Setup，保留来源并接入当前工作区

目标：准备可追溯的新包及依赖，不破坏原副本或主线。此处目录隔离不要求另建Git。

### T078

- [x] T078 核验已有来源并准备工作区紧急包基础，落点`packages/skills-distribution-urgent/package.json`、`tsconfig.json`、`eslint.config.mjs`及本Spec的`analysis/acceptance/urgent-source.md`。

**依赖**：无。

**范围与约束**：核对两份archive及仓库外未提交副本、当前9项正式技能/附件/过滤集中配置的实际摘要与状态，人工复制允许的src/build/script/tests、配置、README/ISC并保留原件；排除.git/node_modules/旧锁/dist/缓存/环境文件，未知目标不覆盖。包名沿方案采用@foundry/skills-distribution-urgent，依赖版本用当前catalog，共享预设通过exports与workspace:*消费，保留严格检查，不修改主线实现或锁策略。

**整体验收**：来源与复制清单可追溯，9项身份/附件完整，目标在当前workspace且不嵌套Git；复制字节、排除项和旧副本保护有证据。运行实际可用的依赖/配置检查，未适配构建如实failed/not-run，不用成功占位或旧证据自动勾选。

**既有方案**：[原来源方案](implementation/T078.md)，实际进入前按新位置、共享接口及必要前置复核，保留原来源事实，不直接当作新位置已获准或已通过。

**本轮结果**：T078来源/工作区配置范围完成，见[实际来源与检查](analysis/acceptance/urgent-source.md)。已准备依赖，严格check-types通过；共享lint及旧独立根构建失败保留，完整产品验收仍由T079/T080等后续承担，不因此宣称可部署。

## 紧急Phase 2：Foundational，共享接口与风险验证

共享前置先运行保留骨架并增量覆盖新位置/身份风险，成功与真实缺能力失败分别记录；不写生产占位。

### T079

- [x] T079 冻结共享接口并适配工作区身份与消费失败骨架，落点`packages/skills-distribution-urgent/tests/urgent-contract.test.mjs`、`tests/helpers/urgent-sandbox.mjs`。

**依赖**：T078。

**范围与约束**：保留已有测试并对照模型冻结「schemaVersion=1」「agent=codex、scope=project」「分别记录success/failed/not-run和原因」、sourcePackagePath/inputFiles/inputDigest及同版临时配置接口。增量覆盖Git根与包根分离、正确包前缀、无关脏文件不误伤、相关输入脏/忽略文件/身份漂移拒绝、实际依赖/catalog变化、缺附件/额外文件/错版、raw-tree歧义、无收据、hook失败、旧入口用户修改、源码保留eval而正式来源排除、带父/非commit tag、并发/断连。协调者固定公共helper和接口，模块代理不并发改共享测试文件。

**整体验收**：本次实际命令/样本/预期与结果留证；未具备工作区能力有独立可观察失败，已有正确行为保留真实通过，不人为损坏源造红灯。每类风险有自有临时目录与断言、骨架保留，接口及失败信号就绪后才放行T080/T081/T085/T088；环境故障不能冒认产品红灯或业务通过。

**既有方案**：[原来源方案](implementation/T079.md)，实际进入前按新位置、共享接口及必要前置复核，保留原来源事实，不直接当作新位置已获准或已通过。

**本轮结果**：共享接口及风险骨架已验证，见[新位置红灯与后续复验](analysis/acceptance/urgent-contract-red.md)。首轮14项均被旧独立根要求拒绝；增量15项后已实际走到各自断言，尚存catalog实际版本匹配反例待T080修复。此项只验骨架及失败信号，不将产品红灯记通过；T080/T081/T085/T088按各自方案与原依赖进入。

## 紧急Phase 3：US1，完整官方内容安装（P1）

独立验收：真实官方发现及四种选择、完整附件和精确来源；此内容MVP不等待挂载或真实公开仓库。

### T080

- [x] T080 [P] [US1] 恢复工作区完整构建、正确来源身份和Release，落点`packages/skills-distribution-urgent/vite.config.ts`、`build/plugins/content.ts`、`build/distribution/export.ts`、`README.md`、`LICENSE`。

**依赖**：T079。

**范围与约束**：复用实际副本及归档适用模块，适配Git根/包前缀与相关源码输入闭包，逐字节核对真实输入提交并在构建前后复核；不只删除dirty检查或用环境变量伪造SHA。无关工作区差异不阻断，预设生成dist与根锁实际字节进入依赖证据，不伪造Git跟踪身份。唯一Vite原样交付完整9项、必要script及script/config/<集合>/collection.config.json、README/真实ISC；仅identity，保持files的相对path/bytes/sha256及payload精确等于files加release.json。先提供基础说明/许可，不等待T089首次供件。

**整体验收**：当前包lint/check-types/build及范围测试有新证据，嵌套包身份正确，相关输入脏/忽略混入/构建中漂移拒绝、无关差异不误伤；同源双构建文件全集与字节100%一致，9项正文附件完整，缺件/多件/链接/越界/大小写/重复身份在清理前拒绝。构建不执行脚本，eval/MCP/暂停退役不进payload；缺许可或完整内容不放行T082，本地候选不等于可公开发布。

**既有方案**：[原来源方案](implementation/T080.md)，实际进入前按新位置、共享接口及必要前置复核，保留原来源事实，不直接当作新位置已获准或已通过。

**本轮结果**：T080完整构建/来源27项、严格配置检查及实际工作区同源双构建通过。见[实际范围证据](analysis/acceptance/urgent-build.md)。

### T081

- [x] T081 [P] [US1] 修复当次在线Agent规则及固定来源官方预检，落点`packages/skills-distribution-urgent/script/install-skills/read-agents.mjs`、`script/install-skills/install-skills.sh`。

**依赖**：T079。

**范围与约束**：从同一完整官方npm latest包校验version/integrity与Codex项目路径规则，不固定历史1.7.4或1.8.1、不回退静态表。实际复用固定raw/tree转换，限定同仓库同完整发布SHA；明确名称、--agent codex、--copy及同次CLI版本，不把含eval的源码根建议成整包安装来源。保留既有--check --official和唯一Node接口，预检不运行npx、不写npm缓存/锁/收据/技能暂存或目标。

**整体验收**：本次真实latest规则和建议对应；布局/网络/SRI失败、错SHA/来源歧义/不支持根在目标写入前拒绝且无可执行建议。测试保留本次独立目录及零写入证据；实际公开来源尚无时不伪造仓库或把本地夹具当远端通过。

**实施方案**：[本项方案](implementation/T081.md)。

**本轮结果**：T081当次在线规则、固定来源建议与只读失败边界完成；真实公开来源仍待迁后。见[实际范围证据](analysis/acceptance/urgent-runtime.md)。

### T082

- [x] T082 [US1] 验证工作区候选的真实官方内容安装MVP，落点`packages/skills-distribution-urgent/tests/official-install.test.mjs`及本Spec的`analysis/acceptance/urgent-content.md`。

**依赖**：T080、T081。

**范围与约束**：使用当次已核验版本的真实官方CLI，在自有Linux/Codex项目从完整本地Git/目录材料验证整包/分类/单/多技能、增量、无效/缺依赖与同名冲突；复制模式、实际正文附件及公共脚本取得均核对。适配原测试强制复制包内独立锁的假设，不带作者node_modules；内部本地实验不新增对外参数或放宽生产固定GitHub来源，不反向等待T091。

**整体验收**：正式来源只发现9项，正文附件完整率100%、未选新增0、显式eval请求拒绝且零目标写入；可公开源码中保留eval不影响正式列表/安装排除，源码根不进入建议。未知内容与用户修改保留、不静默补装；此项只完成局部内容MVP，保留骨架供T092复验，不等于全部本地或最终SC-019通过。

**既有方案**：[原来源方案](implementation/T082.md)，实际进入前按新位置、共享接口及必要前置复核，保留原来源事实，不直接当作新位置已获准或已通过。

**最终本地结果**：最终7e79b524候选的真实官方内容11项完整通过，纳入133/133；旧列表参数失败及修正过程保留。见[实际验收](analysis/acceptance/urgent-content.md)，摘要统一关联[本地事实报告](analysis/acceptance/urgent-local.json)。

## 紧急Phase 4：US3，真实挂载、旧迁移与宿主加载（P1）

独立验收：已装同版内容通过正常唯一入口，hooks先于Increment且真实派发/完整读取，用户修改保留。T085先稳定共享guard，T084再复用；不并行写同一辅助器。

### T083

- [x] T083 [P] [US3] 接通无自有收据的官方已装目录核验及普通入口，落点`packages/skills-distribution-urgent/script/index.mjs`、`script/install-skills/install-skills.sh`、`script/mount-entry/mount-entry.sh`。

**依赖**：T081。

**范围与约束**：Node入口仍只平台分派，Bash复用完整性核验，对普通既有参数识别同版官方复制目录后内部进入mount-entry，不因无收据拒绝、不造归属、不重写技能或走自有下载路线。保留agent=codex、scope=project及原参数，无公开mount子命令；不支持系统/agent/global在写入前拒绝。模块阶段验证普通技能与安装事实，完整workflow汇合留T086。

**整体验收**：完整同版无收据目录核验success、原字节不变；缺正文/附件/错版/额外文件/用户修改及不支持组合明确失败且不进入依赖挂载。真实Node→Bash参数、cwd、输出/退出码和取消有范围证据，原旧副本通过须按新位置复验，不用--no-mount代替最终链。

**实施方案**：[本项方案](implementation/T083.md)。

**本轮结果**：T083普通无收据入口、字节保护、参数/输出/退出码及真实取消范围通过，完整workflow汇合留T086。见[实际范围证据](analysis/acceptance/urgent-runtime.md)。

### T085

- [x] T085 [P] [US3] 适配共享保护辅助器、仅Increment注册与旧入口迁移，落点`packages/skills-distribution-urgent/script/lib/managed-state.mjs`、`script/register-commands/register-commands.sh`、`tests/commands.test.mjs`。

**依赖**：T079。

**范围与约束**：复用原modes只提供speckit.modes.increment，不要求三暂停来源，不增加Implement包装。协调者独占共享guard，按T079接口先修复辅助器与Bash调用中间态并验证来源/目标边界；只在本次私有临时目录比较已知旧来源与受影响入口，不留永久指纹或registry副本。覆盖旧三/四/五集合、别名/退役映射和未知附件，保护用户修改、无关扩展；必要更新/移除只用官方支持能力，不整目录清退或手改registry。

**整体验收**：共享guard接口及其范围反例可独立验证，完整生成入口及源技能仅执行一次；正式入口只有Increment，暂停/退役不复活，同版连续两次无重复，缺三暂停源不失败。未知或修改内容在破坏性调用前拒绝且原字节保留；真实官方迁移读回有证据，替身只计故障边界。本项guard稳定后才放行复用它的T084，避免并发改同一辅助器。

**既有方案**：[原来源方案](implementation/T085.md)，实际进入前按新位置、共享接口及必要前置复核，保留原来源事实，不直接当作新位置已获准或已通过。

**最终本地结果**：共享guard/真实旧集合迁移保护已通过，正式宿主再确认入口→源只规划一次，无回调/嵌套，原任务和哨兵保持。见[实际验收](analysis/acceptance/urgent-host.md)，摘要统一关联[本地事实报告](analysis/acceptance/urgent-local.json)。

### T084

- [x] T084 [P] [US3] 将所选集中hooks适配为私有官方输入并核验实际注册，落点`packages/skills-distribution-urgent/script/register-hooks/register-hooks.sh`、`script/register-hooks/prepare-hooks.mjs`、`tests/hooks.test.mjs`。

**依赖**：T079、T085。

**范围与约束**：只读取同版script/config中的本次所选分析/准备/结案事件，补command=正式技能名、保留合法prompt/optional/priority/condition及扩展字段，过滤enabled=false；provides为空，不额外生成指令。复用T085已稳定的共享guard，不再写同一辅助器；全部来源先预检，再默认Specify1.2.6逐项extension add --dev --force。临时输入只在本次拥有目录准备/清理，条件交官方，不恢复旧七项或逐技能配置，不改主线T077规则。

**整体验收**：真实官方注册读回与对应事件派发有证据；缺配置/类型错/空command风险/CLI失败分别可定位，逐项成功/失败/后续not-run保留。after_tasks分析、before_implement准备、after_converge结案正确，无after_increment；重复执行及用户修改保护通过。CLI返回派发信息不抵扣T087完整宿主加载。

**既有方案**：[原来源方案](implementation/T084.md)，实际进入前按新位置、共享接口及必要前置复核，保留原来源事实，不直接当作新位置已获准或已通过。

**本轮结果**：T084所选三hooks真实注册、六旧清退、重试/故障/未知内容保护10项通过；派发信息不抵扣T087宿主。见[实际范围证据](analysis/acceptance/urgent-hooks.md)。

### T086

- [x] T086 [US3] 汇合最新完整材料和真实第二步挂载顺序，落点`packages/skills-distribution-urgent/script/mount-entry/mount-entry.sh`、`tests/mount-contract.test.mjs`。

**依赖**：T082、T083、T084、T085。

**范围与约束**：协调者在各模块就绪后重建当前script、过滤集中配置和Release并读盘核验，使用最新材料/摘要接通正常唯一入口，不复用T082旧脚本清单。只处理本次核验成功选择，适用hooks全部成功或明确不适用后再Increment，安装阶段不进入业务实现。保留installation/integrity、hooks逐项、commands、旧迁移和loading的真实阶段结果及原因；所需工具预先具备，不自动安装前置或注入治理。

**整体验收**：正常两步真实挂载成功；hook失败实际Increment调用0，下游not-run且安装/前面成功hook事实保留。普通技能不触发历史workflow，非Spec Kit仅不适用、不抵扣必需组合；缺环境/材料/不兼容明确失败，--check/--official/--no-mount及目录存在不能冒充通过。

**实施方案**：[本项方案](implementation/T086.md)。

**最终本地结果**：修改后真实候选的普通唯一第二步连续两次及同一候选模式7项完整通过，hooks/retired/commands阶段事实保留。见[实际验收](analysis/acceptance/urgent-mount.md)，摘要统一关联[本地事实报告](analysis/acceptance/urgent-local.json)。

### T087

- [x] T087 [US3] 验收新位置的Linux/Codex真实完整加载及失败恢复，落点`packages/skills-distribution-urgent/tests/remote-consumption.test.mjs`及本Spec的`analysis/acceptance/urgent-mount.md`。

**依赖**：T086。

**范围与约束**：自有已具备正式任务的独立Spec Kit项目真实执行本地两步、三个所选hooks、Increment、旧迁移及实际Codex正文/附件读取；以无业务实现副作用的任务观察事件，不模拟用户反馈。对源技能/正式入口单次执行留证，预先固化完整远端复用入口，T092仅切来源不改冻结代码。

**整体验收**：正常、同版两次重试、缺件/错版/缺依赖/用户修改/额外附件/hook失败/旧受管冲突均有真实结果，暂停/退役不复活。缺宿主会话、实际派发或完整读取证据须failed/not-run，不能记通过；全部必需本地消费证据就绪才放行T089。

**实施方案**：[本项方案](implementation/T087.md)。

**最终本地结果**：四个真实Codex探针全部退出0，完整原文/附件、三事件实际消费、正确停止和Increment单次规划均有轨迹与产物证据。见[实际验收](analysis/acceptance/urgent-host.md)，摘要统一关联[本地事实报告](analysis/acceptance/urgent-local.json)。

## 紧急Phase 5：US5，本地工具验证与交接（P1）

独立验收：内部Git失败处理和全部本地结果/四处迁移说明齐备；T089成功后按既有授权和真实前置连续推进，本地完成不等于公开发布。

### T088

- [x] T088 [P] [US5] 复用并验证内部手动发布工具及Git故障处理，落点`packages/skills-distribution-urgent/build/publish.mjs`、`tests/publish.test.mjs`。

**依赖**：T079。

**范围与约束**：只在本次自有bare Git复验精确白名单、无父提交/单新tag、候选绑定授权、同版复用、并发及推送响应丢失回读。新建/复用均核对实际commit类型、父数0和文件全集，带父/非commit/异字节冲突停止，不force或删除旧完整版本；发布阶段不编译TS、不装依赖、不构建或执行payload。保留原骨架，不生成runId/artifactId/PlatformReceipt，不把报告改成full/ready，不新增审查代理。

**整体验收**：错授权/目标/版本/SHA/字节/README或ISC零新ref；只有相同字节且无父才复用，并发/断连和后续回读失败保留真实已写事实。范围测试与实际当前输入有证据，不碰真实远端；原pipeline/publish准入保持，此项仅本地实验，不算获授权发布。

**既有方案**：[原来源方案](implementation/T088.md)，实际进入前按新位置、共享接口及必要前置复核，保留原来源事实，不直接当作新位置已获准或已通过。

**本轮结果**：T088内部发布18项及旧契约18项共36项通过，全部仅自有bare Git。见[实际范围证据](analysis/acceptance/urgent-publish.md)。

### T089

- [x] T089 [US5] 完成本地最终复验、ISC及四处源码交接，落点`packages/skills-distribution-urgent/README.md`、`LICENSE`、`package.json`及本Spec的`analysis/acceptance/urgent-handoff.md`。

**依赖**：T080、T087、T088。

**范围与约束**：完善已验证用法/支持限制并复核真实ISC与适用第三方来源；说明改变后在当前工作区真实输入身份重新执行本包适用lint/check-types/build/test、双构建、完整两步与宿主/保护恢复验证，全部必需本地证据按input/dependency/catalog/candidate摘要关联。交接列packages/skills-distribution-urgent、packages/skills、specs/skills、apps/mcp；eval源码可公开、正式发布/列出/安装仍0。清点specs正文/附件/archive的画像与私有引用、未迁移preset/catalog/scripts/dev/.specify依赖和MCP旧manifest缺口，保留原始私有历史，只列迁后必要调整、不扩围修主线或MCP。缺远端不阻断本地，不编造仓库/版本/来源。

**整体验收**：全部必需本地检查和真实消费成功后才记录本地完成，缺失或失败仍failed/not-run；四处来源、许可、公开前处理和迁后未验完整可追溯，不把整个新仓库独立运行记作已通过。**本项完成后不设暂停点，也不重复索取逐Task方案或阶段继续确认；读取并保存适用方案与证据，真实迁仓输入具备即按既有授权推进T090，搬移、建仓、推送和发布仍需适用明确授权。** 后续真实publish/remoteVerify/consumption仍not-run，本地成功不是最终SC-019通过。

**实施方案**：[本项方案](implementation/T089.md)。

**最终本地结果**：同输入lint/types/build/双构建及133/133全通过，真实ISC、四处来源与公开前/迁后未验项已交接；此前已实际暂停，当前固定停点已撤销；T090尚未执行，仍需真实迁仓输入和适用授权。见[实际验收](analysis/acceptance/urgent-handoff.md)，摘要统一关联[本地事实报告](analysis/acceptance/urgent-local.json)。

## 紧急Phase 6：US5，迁移输入具备后连续推进的公开交付（P1）

以下阶段沿紧急版连续推进豁免执行，无需另发阶段继续指令；实际迁仓和必要输入是技术前置，外部操作授权仍单独核对，已有适用授权直接复用。独立验收：迁后真实候选、精确授权发布、匿名文件与真实两步使用。

### T090

- [ ] T090 [US5] 核验迁后实际来源及依赖并重新冻结严格候选，落点新仓库的`packages/skills-distribution-urgent/dist/release.json`、必要根依赖配置及本Spec的`analysis/acceptance/urgent-candidate.md`。

**依赖**：T089。

**本轮方案**：[T090迁后验证](implementation/T090.md)，沿用户本会话“紧急版开始吧”及现行连续推进授权执行，实际结果按本Task整体验收判断。

**范围与约束**：T089完成且四处源码实际迁入、必要输入具备后按已有授权执行，无需额外确认启动迁后阶段；创建/搬仓仍须适用明确授权。核对新根真实Git、sourcePackagePath、版本、catalog/等价预设/工具和真实ISC及适用第三方许可材料，处理紧急包必要配套配置；不暗中追加迁整个preset、不删测试求绿，原主线/MCP未完能力独立列交接。公开前核对specs及archive私有内容处理，eval源码允许保留但安装来源/payload排除。以新身份重跑范围内工程检查、双构建及真实本地两步/宿主，Foundry HEAD/旧候选/夹具SHA不得充作新sourceRevision。

**整体验收**：version来自新仓库实际包版本，sourceRevision/输入闭包/依赖与检查证据一致，catalogDigest/candidateDigest及全部文件100%对应；payload精确等于files加release.json，不回填未来公开SHA/地址。缺新根输入、许可、公开范围或必需验证只阻断本项和真实下游；报告仍未发布，不造平台收据或投入原isolated/full/ready接口。

### T091

- [ ] T091 [US5] 按迁后具体候选授权发布固定版本，落点本Spec的`analysis/acceptance/urgent-release.md`及新仓库`refs/tags/skills-v<version>`。

**依赖**：T090。

**范围与约束**：仅获得绑定真实repository、version、sourceRevision、candidateDigest的明确授权后，运行T088已范围验证的内部工具；原实施指令、任务存在、本地通过或T090成功都不是授权。只发布冻结原字节，不构建/改README/装依赖；回读实际ref、无父commit及文件全集，分记sourceRevision/publishedRevision与无秘密authorizationRef。

**整体验收**：真实远端写入或合法同字节无父复用有证据，同版冲突零覆盖；断连先回读，失败保留旧完整版本及已发生事实，不force或删tag。没有目标/权限/具体候选授权不执行、不勾选；公开写入与后续验证分开。

### T092

- [ ] T092 [US5] 匿名核对固定公开全集并复验实际两步消费，落点本Spec的`analysis/acceptance/urgent-remote.md`。

**依赖**：T091。

**范围与约束**：移除发布写凭据，匿名获取完整publishedRevision及全部公开文件，与候选双向对照；仅将T087已固化骨架切为真实tree/raw同版来源，在自有Linux/Codex项目做官方安装、正常唯一入口、旧入口保护、所选hooks/Increment真实注册/派发/完整加载。不在发布后修改冻结源码，不将公开源码根当安装根或以本地/替身结果抵扣。

**整体验收**：匿名全集与候选100%一致，必要正文附件完整率100%、正式发布/列表/安装eval均0；实际两步加载及用户内容/旧完整版本保护有证据。发布已发生而验证失败分别报告；公开字节变化须新版本，任何必需未验不满足最终SC-019，不自动完成主线T061/T062等。

## 紧急Phase 7：Polish，最终交付证据核对

总体唯一末尾仍是原T040，保留其全部原前置和目标，不为紧急路径另建清理身份。

### T093

- [ ] T093 汇总分阶段紧急交付证据并核对文档，落点本Spec的`analysis/acceptance/urgent-delivery.md`、`quickstart.md`、`mvu.md`。

**依赖**：T092。

**范围与约束**：按FR-003/061～067和SC-019关联工作区来源、全部本地通过、T089此前实际暂停及本轮取消固定停点的依据、四处迁移/ISC/公开范围、新身份检查、授权发布、匿名全集与真实消费；只更新本Spec真实结果，不回写已发布payload/README，不自动勾主线。紧急开发遗留位置、用途和处置依据交原T040，不另建重复收尾身份。

**整体验收**：本地、迁后、公开各阶段有准确证据或未验原因，原任务身份/历史验收/引用保留，eval源码与安装排除一致；本地交接不被最终报告反向改成当时已发布。三条闭环按实际更新，文档格式有效；原T040仍须其全部原前置及T093满足后唯一综合收尾，紧急最终交付不等待主线全矩阵。

### 紧急依赖、并行与最小交付

| 范围            | 可并行与串行边界                                                                                  | 独立验收                                                   |
| --------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 共享            | T078→T079先准备工作区与真实失败骨架；协调者维护package/catalog/预设、源清单、Vite接线及公共helper | 来源零丢失、目标不覆盖未知、嵌套包与相关输入验证可运行     |
| US1             | T079后T080构建与T081预检可并行，T082等待二者；构建代理不写运行模块                                | 真实官方安装9项完整，eval及未选新增0                       |
| US3             | T081后T083可与T085不同目录并行；T085稳定共享guard后才T084；T086汇合及重建串行，再T087真实宿主     | 适用hooks先行、Increment单次加载、迁移/重试与用户修改保护  |
| US5本地         | T079后T088只在自有bare Git，可与构建/运行模块并行；T089等T080/T087/T088，最终复验及回填串行       | 本地全部必需验证通过后连续交接，真实远端仍未验             |
| US5迁后及Polish | 真实迁仓输入具备后按已有授权T090→T091→T092→T093；发布另需具体候选授权                             | 新身份、固定版本、匿名全集和真实两步消费；T040唯一总体收尾 |

紧急起点仍为T078，不因旧副本已有材料直接跳到下游。T082是可独立反馈的内容MVP；本次本地交付目标还须T087实际完整使用、T088内部工具与T089最终复验/交接，然后沿已有授权及真实前置连续推进。最终SC-019须迁后T090～T093真实结果，不能在本地自动完成；主线完整Actions、其他平台、全局或自有下载均不作为紧急前置。

语义覆盖：工作区来源及身份→T078/T079/T080；动态官方规则/固定来源与eval安装排除→T081/T082；本次已装核验及真实挂载/旧迁移/宿主→T083/T085/T084/T086/T087；内部发布故障→T088；ISC、四处迁移与全部本地证据交接→T089；迁后依赖及新身份/具体授权/匿名消费→T090/T091/T092；最终证据→T093。原主线任务依赖及验收完整保留，只增加T085→T084这条共享文件实际依赖，不创建假门禁任务或第二套状态。

## 当前起点与执行方向

**当前分工（2026-11-11）**：用户要求同步spec后自行手写修改。本轮只同步文档，AI等待用户实际修改或进一步请求，不自动进入T076/T077、不覆盖或格式化用户代码。T074/T075完成事实和原验证记录保留；未来修改的实际范围及适用证据在续接时重新核对，当前不改任何checkbox。见[分工来源](requirements/discussions/2026-11-11-independent-plugins.md#文档同步与用户手写接续)。

**当前写法约定**：用户已移除组合式函数写法，不再强制插件工厂、所有声明内置或顶层仅import与工厂。各插件仍独立维护职责和来源扫描；T073～T075包含的工厂封装与AST检查只保留当时完成事实，不作为后续手写修改的结构要求。四Task顺序及checkbox保持，见[调整依据](requirements/discussions/2026-11-11-independent-plugins.md#取消组合式函数写法)。

当前已完成用户提出的集合构建起点：src一级集合自动发现，构建到dist同名目录加空mcp；以skill清单选择技能、逐事件hook保存参数，frontmatter/附件保留，见[T073验收](analysis/acceptance/plugin-skill-config.md)。接下来按[四Task讨论](requirements/discussions/2026-11-11-independent-plugins.md)依次推进T074文件骨架、T075目录插件、T076技能复制插件、T077脚本生成插件。各插件独立扫描来源，逐项实现后才接入Vite；脚本规则到T077再讨论。T075已重新实现独立目录插件并接入Vite，原插件继续负责技能资产；下一项是T076，脚本规则继续后置；原T068～T070另按真实范围对齐，不恢复旧六模块。

占位请求明确失败且无原生写入，--no-mount 只保留纯安装事实；流水线实现阶段可做 isolated 实验，full/ready 仍拒绝缺真实挂载及其他必需证据。T060 完整本地交付与 T061/T062 迁后平台/首次发布均在真实挂载、完整回归之后，开发发布 workflow 不授权发布占位包。

上轮 Increment 只规划，新增两个局部 MVU并复用59项既有Task，保留当时12项完成事实；T065完成后为13项。本轮T067交付只读来源与基础计划后，共14项完成，不新增Task。正文将构建和 Actions 分成前后两组，完整本地与迁后验收移到实际前置之后；原功能、验收及暂停/撤回历史保留。各项实际开工仍须适用讨论认可方案，具体依赖以正文为准。

## 固定约束与验证

- 工程checkbox仅在本文件维护，闭环状态是职责与证据摘要；旧完成任务不重开，新范围使用新身份，T040仍是唯一末尾综合收尾。
- 每个实际开工Task先读取自身目标、plan/mvu、相关代码/约定及证据，核对适用的真实讨论认可；缺方案先讨论，认可后保存并读回implementation/<Task ID>.md，由原任务引用。不预建整批方案，当前任务生成不替代任何Task实施认可。
- 新任务保持轻量目标、必要范围/约束/依赖和整体验收；旧八栏目只留完成块与历史参考，不恢复为强制格式。测试来自既有规格、风险和验证契约，先记录真实缺能力失败再实现，不编造红灯或通过。
- BUILD/COMPAT/CANDIDATE/BIND/PUBLISH/MOUNT/REMOTE分别有下方前置任务及阻塞边。失败只阻断真实下游；通过保留相同验证骨架，不另建状态服务、第二构建模式或工程导出器。
- 所有代码实施遵循document-changed-symbols；Vue相关仅在实际涉及时加载样式/响应式技能。目标包必须运行pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills的lint/check-types/build/test、适用范围测试及受影响消费者；不存在根级pnpm test。Markdown写后立即ESLint并读回。
- [P]只表示前置满足后、文件及输出不竞争时的机会，不是派代理或并行写共享记录的授权。构建、共享pipeline测试、最终归档与报告汇总串行；缺工具/网络/平台不得作必需通过。
- 原任务生成阶段只写资料；后续 T064 已按用户明确授权存档并清退旧构建，实际结果见其证据。T072/T073已交付当前集合构建，旧完整安装/发布接口仍需对齐，保留消费者在临时项目验证；没有真实用户目录安装、建仓、迁移、平台配置或发布，不可占位成功。

## Phase 1：Setup，保护既有进度与重做边界

共同准备与清退已完成，保留历史和当前T064证据。

### T001

- [x] T001 记录现有消费者、环境与文件基线，落点 `specs/skills/001-skills-distribution/analysis/acceptance/baseline.md`。

**依赖**：无。

1. **改动文件**：无。
2. **改动内容**：读取包配置、manifest插件、link-skills测试和旧 modes 安装现场（历史调查，不作为新源声明要求）；记录工具实际版本、git status及受保护文件摘要。标记固定skills1.7.4、Specify1.2.5与本机版本差异；测试仅使用临时项目及隔离用户，列出Linux/macOS/Windows可用性和缺项。
3. **改动禁区**：不运行真实用户目录的全局安装，不修改原功能T038或现有受管配置。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/baseline.md（环境、原始消费结果与后续差异依据）。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-025；plan宪章检查与quickstart环境基线。
7. **验收信号**：执行 pnpm --filter @foundry/skills run test、node --test scripts/dev/actions/link-skills/test-link-skills.mjs；记录每个命令真实结果及skip，不能把现有失败归为本功能已修复。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。

**执行证据**：2026-11-02，已保存、ESLint 修复并读回 [baseline.md](analysis/acceptance/baseline.md)。包测试首次因旧 manifest 出现 5 failures；只运行现有 build 后 6 tests 全过。link-skills 补用无测试隔离模式明确得到 Bash pass 1、PowerShell skip 1；固定工具、三平台缺项及受保护摘要均已记录。

### T002

- [x] T002 接入MVU测试入口与构建工具声明，落点 `packages/skills/package.json`。

**依赖**：T001。

1. **改动文件**：packages/skills/package.json；packages/skills/tsconfig.json；pnpm-workspace.yaml；packages/skills/vite.config.ts（用户后续要求统一配置）。
2. **改动内容**：在shared catalog声明yaml2.8.3，包devDependencies直接引用供 MCP 构建和开发使用；保留原build/test，增加test:distribution分发器，支持--mvu A至F、--story US1至US5、--matrix full、--source local或remote、--source-dir <绝对目录>、--release-source <固定提交HTTPS根URL>并拒绝未知参数。扩展tsconfig覆盖新TS；在唯一 vite.config.ts 中生成 MCP 清单、复制内容及 script，统一输出 dist；不保留 distribution 模式或预留运行入口，不填充发布/安装业务。尚未实现的验证必须失败或明确not-run，不返回假成功。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/test-distribution.mjs（参数分发）；packages/skills/tests/distribution/sandbox.mjs（临时项目与工具探测）；packages/skills/tests/distribution/test-build-config.mjs（用户后续要求的单配置真实构建验收）；不再新建第二份 Vite 配置。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：plan项目结构；quickstart A～F；不依赖传递安装的yaml。
7. **验收信号**：分别执行 pnpm --filter @foundry/skills run lint 与 pnpm --filter @foundry/skills run check-types；分发器未知参数退出非零，缺运行时明确报告。后续每个MVU注册自己入口后，其指定命令才可通过。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。

**当前用户修改同步（2026-11-02）**：规格已补充用户要求的单配置、同一 dist 和内部/公开文件边界；plan、research、构建契约及 quickstart 已明确 yaml 位于 devDependencies 并经 shared catalog 固定 2.8.3。当前工作区 trustPolicy 为 no-downgrade，保留现有修改；下方早期记录中的 off/54 条诊断是当时状态，不回写历史、也不冒充当前复验结果。已同步文档顶部与图表的 T001～T002 完成状态，保留原始需求快照、澄清快照和 baseline。本次仅同步文档，不变更代码或任务 checkbox，不推进 T003。

**用户后续调整（2026-11-02，已验证）**：用户要求仅一份 Vite 配置，统一 dist。上方 T002 做法已同步：先以临时项目的真实构建测试复现完整模式缺失，再合并配置并移除本轮新增的第二份配置；验证默认 MCP、完整构建的四工具共存、普通模式不删已有工具及完整模式缺任一入口失败。同步 plan/research/distribution 契约、数据模型、quickstart 与位置图；保留原执行命令作历史证据。迁移按 release.json 的公开文件集合加清单自身，内部 eval 仍仅供 MCP。此调整沿用用户明确指令，不再请求同一方案确认，不进入 T003。

**单配置追加验收**：先运行真实 Vite 临时项目测试，旧配置得到 1 pass、2 fail：完整模式缺工具输出且缺输入未拒绝。合并后发现库模式默认将虚拟入口解析为路径，依据本机 Vite 实现将同一 inputs 同时传给 lib.entry 与打包器 input；以真实构建转绿。再加入 Node 内置模块夹具，得到 2 pass、1 fail（浏览器替身 basename 不可调用），切换完整模式到 Node/SSR 构建并打包第三方依赖；工具连同 yaml 依赖搬至不含 node_modules 的临时目录后可直接导入运行。中间 `.ts` 后缀 import 被类型检查拒绝，已使用可解析到源码的 `.js` ESM 引用，最终检查通过。

| 追加验证                                                                                                                                                                                                                                                 | 预期与实际结果                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs`                                                                                                                                                             | 3 tests 全过；普通 MCP 含 eval、完整模式同 dist 四工具可独立执行、普通重建保留工具、四个入口逐一缺失均拒绝。测试只使用夹具，不表示真实安装/挂载工具已经交付                      |
| `node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs packages/skills/tests/distribution/test-build-config.mjs scripts/dev/actions/link-skills/test-link-skills.mjs`（沙箱外）                                               | 12 tests，11 pass、1 PowerShell skip、0 fail；本轮未扩展 Windows 支持声明                                                                                                        |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`、同前缀 `run check-types`、`run build`、`run test`                                                                                                                           | 全部退出 0；包测试 6 tests 通过，当前默认 build 仍只生成 MCP。现行配置已消除先前无后缀 import 的构建告警                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills exec vite build --mode distribution`                                                                                                                                                   | 当前真实源码尚缺四入口，退出 1 并逐项报告；不创建假成功工具、不宣称公开分发已完成。旧表中的 --config vite.distribution.config.ts 为调整前历史命令，现行唯一配置为 vite.config.ts |
| `uv run --cache-dir /tmp/skills-distribution-uv-cache --offline --isolated --no-project --with pytest python -m pytest -o pythonpath=/home/by152/workspace/ena/foundry/feature/speckit-workflow-extensions/apps/mcp/src apps/mcp/tests/test_registry.py` | MCP registry 7 passed                                                                                                                                                            |
| 单配置追加只读审查、Markdown ESLint 与 `git diff --check`                                                                                                                                                                                                | 追加只读审查未发现关键问题；后续 Node 内置模块问题由失败测试复现并修复，未重复派发审查；Markdown 格式与 diff 检查通过。用户已手工将 yaml 放在 devDependencies，本轮保留该调整    |

本轮只落实用户选定的单配置/同 dist 做法，T003～T040 仍未执行。后续 T008 将完整模式接入默认 build，T012/T030 才实际生成并校验 release.json 及公开文件集合；当前调整不是这些任务的完成证据。

**T002 执行证据（2026-11-02）**：保留原 build/test，新增 test:distribution；yaml 2.8.3 已经 shared catalog 直接安装并解析；tsconfig 覆盖后续运行核心。四个固定入口仅配置骨架，未创建安装或挂载占位实现，未接入原 build；待 T004～T008 完成再演化。调度自测保存在 sandbox.mjs 的直接执行分支，被 MVU 导入时仅导出 createSandbox/probeRuntime；缺入口测试使用独立夹具，不依赖真实 MVU 是否已落地。

| 命令或操作                                                                                                                                                                                                                                               | 输入与预期                                                                   | 实际结果                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs`（实现前）                                                                                                                                                             | 参数错误拒绝、场景调度及辅助函数尚不存在，应检出缺失                         | 6 tests 全失败；确认缺入口/缺 helper，沙箱子进程 EPERM 另列环境限制，不以此作为实现正确证据                               |
| 同命令，加入继承路径隔离断言后在沙箱外运行                                                                                                                                                                                                               | 子场景不应取得用户的 CLAUDE_CONFIG_DIR/GIT_DIR                               | 5 pass、1 fail；真实夹具读到 `/outside-user`，断言检出隔离遗漏；随后清除相应继承路径                                      |
| `pnpm install --filter @foundry/skills --ignore-scripts --offline`                                                                                                                                                                                       | 本地缓存满足依赖安装                                                         | 失败：ERR_PNPM_NO_OFFLINE_TARBALL（wrappy）；未用传递 yaml 2.9.1 替代                                                     |
| `pnpm install --filter @foundry/skills --ignore-scripts`、随后补入 `--filter @foundry/preset-config`                                                                                                                                                     | 已获安装授权，补齐包及共享检查配置依赖                                       | 退出 0；首次过滤未包含 preset-config 的检查依赖，补齐后恢复；均跳过安装脚本                                               |
| `pnpm install --filter @foundry/skills --filter @foundry/preset-config --ignore-scripts --offline --config.verifyDepsBeforeRun=false`                                                                                                                    | 从已填充缓存恢复依赖链接                                                     | 退出 0；后续 pnpm 检查统一加 verifyDepsBeforeRun=false，防止执行前自动依赖检查再次触发安装；未改锁文件跟踪策略            |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills exec node -p "require('yaml/package.json').version"`                                                                                                                                   | 直接依赖版本准确                                                             | 输出 2.8.3，退出 0                                                                                                        |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                                                                              | 新旧包代码满足原规则                                                         | 退出 0，未降低检查强度                                                                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                                                                                                       | 配置及已存在 TS 可检查                                                       | 退出 0                                                                                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                                                                                             | 原 manifest 构建保持可用                                                     | 退出 0；仍有既存无后缀 import 的 Vite 未来 native loader 告警                                                             |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                                                                                              | 真实 MCP 清单与当前源码对应                                                  | 6 tests 全过，退出 0                                                                                                      |
| `node --test --test-isolation=none packages/skills/tests/distribution/sandbox.mjs scripts/dev/actions/link-skills/test-link-skills.mjs`（沙箱外）                                                                                                        | 真实 CLI 参数、所有选择、来源透传、已注册入口成功/失败、隔离清理及旧复制消费 | 审查修复后最终为 9 tests，8 pass、1 skip、0 fail；skip 为缺 pwsh 的 PowerShell 测试，不算 Windows 通过                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --unknown`                                                                                                                                                    | 未知参数拒绝，零场景执行                                                     | CLI 退出 2 并给出参数诊断；pnpm 外层退出 1                                                                                |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --mvu A`                                                                                                                                                      | A 尚未实现，不得通过                                                         | 退出 1，JSON 明确 A=not-run、缺 mvu-a.mjs，并保留 pwsh/Specify 缺失和沙箱 EPERM 原因                                      |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills exec vite build --config vite.distribution.config.ts`                                                                                                                                  | 四个源码输入尚未创建，应拒绝构建                                             | 退出 1，逐项报告 install-cli、mount-entry、mount-hooks、register-commands 无法解析；未省略或生成空成功工具                |
| `apps/mcp/.venv/bin/python -m pytest apps/mcp/tests/test_registry.py`、`python -m pytest --version`                                                                                                                                                      | 尝试复用现有测试环境                                                         | 分别失败：无该虚拟环境、全局未安装 pytest                                                                                 |
| `UV_CACHE_DIR=/tmp/skills-distribution-uv-cache uv run --isolated --no-project --with pytest python -m pytest -o pythonpath=apps/mcp/src apps/mcp/tests/test_registry.py`                                                                                | 在临时环境检查受影响消费者                                                   | 沙箱内 PyPI DNS 失败；随后获授权在沙箱外取得 pytest，但相对 pythonpath 按 app rootdir 解析导致收集失败，未算通过          |
| `uv run --cache-dir /tmp/skills-distribution-uv-cache --offline --isolated --no-project --with pytest python -m pytest -o pythonpath=/home/by152/workspace/ena/foundry/feature/speckit-workflow-extensions/apps/mcp/src apps/mcp/tests/test_registry.py` | 使用已缓存 pytest 与正确绝对导入路径                                         | 7 passed，退出 0；不新建应用虚拟环境，不安装完整应用依赖                                                                  |
| `pnpm --config.verifyDepsBeforeRun=false exec eslint --format json pnpm-workspace.yaml`，另用 HEAD 原文经 `--stdin --stdin-filename pnpm-workspace.yaml` 对照                                                                                            | 新 catalog 声明不增加原有诊断                                                | 两者均退出 1、54 errors；ruleId/message 集合相同，新增 0。未清理未使用 catalog，也未保留自动修复对 trustPolicy 的无关改动 |
| 受保护文件逐项 SHA-256 对照 baseline.md                                                                                                                                                                                                                  | 原消费入口、扩展配置、宪章和原功能任务不变                                   | 8 项全部一致；manifest 因原构建时间字段变化只验正文与附件，Python 消费测试通过                                            |

验收分级：本轮选择小型工具接线验证，另外复核一次真实消费链；不以此替代后续六 MVU、三平台全矩阵或原生派发。所有新增符号使用中文多行 JSDoc。全局安装只允许未来测试在临时用户目录执行，本轮未执行真实用户安装、原生注册或远端发布。独立审查与 Markdown 格式检查结果见下方；下次从 T003 接续。

**独立审查与修复**：按 requesting-code-review 完成一次只读独立审查，无 Critical。发现 Important：继承的 GIT_INDEX_FILE/GIT_OBJECT_DIRECTORY 等可绕过项目沙箱。新增真实 Git 哨兵测试先得到 6 pass、1 fail，沙箱外临时索引从 112 字节变为 192 字节；随后清除全部继承 GIT_*，仅保留本函数显式设置的隔离配置三项。最终范围测试 8 pass、1 skip，哨兵索引字节及对象清单均未变化；包 lint/check-types/build 再次通过。该测试只证明工具接线隔离，不抵扣 MVU-E 的产品隐匿验证。

**审查遗留 Minor**：Windows 常见 npm.cmd 不能由直接 spawnSync('npm') 可靠探测，当前可能误报 npm 不可用。现阶段工具探测只提供诊断，未据此阻断已注册场景；未声称 Windows 通过。留待 T004 的 Windows/最低 shell 验证中校准并补实机证据，不在本轮虚构通过结果。独立审查完成后没有再次派发审查；Important 由失败复现及修复后完整范围测试验证。

**实施收尾钩子**：已按 explainer-doc-sync 核查；本轮用户未提出不熟悉知识点，也没有生成或复用随行说明，不创建空的「随行文档」节。未完成整个功能，不触发项目结案描述。

### T064

- [x] T064 核验存档并移出旧构建实现及相关构建脚本，记录保留消费者、重做边界与恢复依据于 `specs/skills/001-skills-distribution/analysis/acceptance/build-rewrite.md`

**依赖**：T002。

**范围**：复用Plan阶段已完成的63项存档摘要读回结果，核对后续变化；将旧 vite.config、四构建组件、build/distribution 及直接依赖它们的测试/helpers 移入既有 archive/2026-11-10-build-pipeline-replan 下的 retired-source，保持原始字节与相对路径。有效源码清理旧构建引用，保留明确拒绝构建的临时入口；记录实际消费者和恢复定位。不重建原快照，不因存档存在直接勾选。

**约束**：用户已明确要求先移出旧构建再重新实现；清退只限核对后的构建文件与直接耦合测试，不整包 reset/revert，不修改安装/挂载/hidden/模式源码或用户未提交修改，不重开已完成身份。保留构建契约的历史测试和验收要求，存档后不能将缩小的运行测试集合称为新构建通过；不手改生成物。

**整体验收**：原63项存档可核验、任务/来源/证据可定位；旧构建实际移出，存档字节与清退前一致，有效源码没有悬空旧构建导入，保留文件集合及字节不变。当前差异、实际消费者、未恢复覆盖与恢复入口有记录；新构建未实现时 build 明确非零且不修改旧 dist。只验收存档清退，不声称构建已重做。

**依据**：spec 当前安排；plan 重做边界；存档 README；宪章VII。

**实施方案**：[T064](implementation/T064.md)，依据用户纠正先移出旧实现的顺序及随后“开始吧”的授权，已保存并读回。

**执行证据**：[旧构建存档与清退验收](analysis/acceptance/build-rewrite.md)。原63项快照、21项移入文件、120项保留文件、原11个完成块及类型声明均已核验；有效代码无悬空旧构建导入。包 lint/check-types 通过，Python11项通过；保留消费者分组共22通过、4跳过，未执行平台和缺官方CLI如实记录。build按预期明确非零且旧dist未变；新构建与已存档契约的恢复验证仍由T065～T070等任务承担。独立只读审查无实质发现，本项通过仅覆盖清退。

## Phase 2：Foundational，保留的已验共享骨架

以下完成块保留实际平台、范围与原文，不自动验收新构建。

### T003

- [x] T003 验证MVU-A：官方发现、投影与路径，落点 `packages/skills/tests/distribution/mvu-a.mjs`。

**依赖**：T002。

1. **改动文件**：packages/skills/build/plugins/scripts.ts（仅复制）；packages/skills/tsconfig.json（覆盖测试辅助 TS）；packages/skills/tests/distribution/test-build-config.mjs（原样复制与不执行验证）。同步迁移 script/register-commands 中的测试入口到 packages/skills/tests/test-register-commands.mjs 并修正被测脚本默认路径。既有 test-distribution.mjs 自动发现 mvu-a.mjs，不修改调度器。
2. **改动内容**：用最小真实技能及完整附件建立官方发现夹具，覆盖根/分类/单目录和四选择；从固定版本核对79个agent与77全局解析、Eve YAML2.8.3输出、混合未知名及既有目标行为。搭建只读选择检查与投影最小骨架；假设为“固定发布选择和实际安装字节可一一对应，预检能在写入前拒绝冲突”。技能选择遵循官方 skills，不另设目录安装协议或自动补装模式；单选 task-explore 的安装集合应仅含该技能。骨架保留，后续任务在其上演化。实验辅助模块全部放在 tests/distribution/helpers，只由测试直接加载；不进入 script 或构建产物。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/mvu-a.mjs；packages/skills/tests/distribution/helpers/catalog.ts；packages/skills/tests/distribution/helpers/projection.ts；packages/skills/tests/distribution/helpers/selection.ts；specs/skills/001-skills-distribution/analysis/acceptance/mvu-a.md。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：MVU-A（C2/C3/C4）；FR-001/004～011；quickstart A。
7. **验收信号**：按 quickstart 设置固定官方工具路径后，pnpm --filter @foundry/skills run test:distribution -- --mvu A；npx skills@1.7.4 add/list实测零未选新增、附件逐字节零差异，未知名预检零目标写入；两个不支持global项拒绝。2026-11-04 用户确认本次仅验 Linux；逐 agent/scope 与路径分支保留证据，Windows/macOS 标未验证，不作为本项勾选前置，不推定后续任务平台要求已调整。
8. **风险与回退**：发现目录发现规则、投影或路径无法对齐时返回plan修正，不用忽略差异替代一致性。

**2026-11-04 复制边界复验**：已移除 YAML 打包，运行模块全部移入 script；原样复制与独立运行测试先红后绿。Node 22.20.0 的 MVU-A 再次 9/9 通过，174 条观测已更新；范围回归 15 通过、1 PowerShell skip，包 lint/check-types/build、13 项 Python 与 7 项 MCP 回归通过，hooks Bash 35 项断言通过。curl 自动依赖准备与完整公共入口仍未实施。

**2026-11-04 执行证据**：[MVU-A 实测记录](analysis/acceptance/mvu-a.md)。用户确认只验 Linux 后，最低 Node 22.20.0 下9组实验通过；真实79项目级+77全局安装、2项不支持global拒绝、四种选择和12环境/旧路径分支，174条观测已保存。标准 npx 列出与单技能安装另验通过。包 lint/check-types/build、13项Python测试与7项MCP回归通过；范围回归14通过、PowerShell缺运行时1跳过。独立审查发现的链接预检与分支证据遗漏已修复，链接用例先红后绿；未执行T004或外部模式行为验收。

### T004

- [x] T004 验证MVU-B：下载与逐项提交（本轮仅 Linux），落点 `packages/skills/tests/distribution/mvu-b.mjs`。

**依赖**：T003。

**2026-11-04 本轮验收范围（用户确认）**：当前只有 Linux 环境，用户已授权开始。T004 本轮仅以 Linux 实测结果判断验收；Windows/macOS、PowerShell 与未实际具备的最低运行时分别记录未验证，不作为本轮勾选前置，不声明跨平台通过。agent 准备仓库外独立副本、临时消费目录及受控 HTTPS 故障源，用户无需预先建仓或发布。

1. **改动文件**：specs/skills/001-skills-distribution/{tasks.md,plan.md,quickstart.md}；现有 test-distribution.mjs 自动发现 mvu-b.mjs，无需改写调度器。
2. **改动内容**：先写并运行失败实验，再实现 Linux 最小引导及单技能暂存、校验、提交，并从仓库外副本运行。直接运行 Bash 平台入口，不设 Node 转发层；旧 fetch-release.ts/install.ts/install-cli.ts 清单与用户最新确认的直接平台执行约定冲突，取消创建，下载与提交全部位于 Bash。Bash 使用 curl、sha256sum、Git 和 jq；jq 1.8.1 在工具独立临时目录准备并校验官方固定摘要，不安装进目标项目，不恢复嵌套 package.json。MVU 只支持 Codex 项目级显式技能选择；其他范围明确失败，由后续任务增量完善。验证截断、404、超时、摘要篡改、非 HTTPS 重定向、未知目标、用户编辑、Git 跟踪、只读目录、锁争用、提交前目标变化和中断；只有完整同版内容可提交，失败保留原文件。保留最小安装骨架供后续任务增量填充，不把实验清单当作正式发布构建。
3. **改动禁区**：不改业务应用、现有技能、真实 .agents/.specify 或用户已有目录；不手改 dist，不发布或修改系统 CA，不使用跳过 TLS 验证的选项。
4. **新建文件**：packages/skills/tests/distribution/mvu-b.mjs；packages/skills/tests/distribution/helpers/https-source.mjs（仅测试使用的本地证书与故障源）；packages/skills/script/install-skills/install-skills.{sh,ps1}、README.md；specs/skills/001-skills-distribution/analysis/acceptance/mvu-b.md。PowerShell 入口在未实现时明确失败，不报告通过。
5. **写法约定**：宪章 I/III/IV/V/VII；document-changed-symbols、test-driven-development、executing-plans；直接运行平台脚本，Bash 执行安装；测试辅助留在 tests，不随 script 交付。Markdown 保存立即 ESLint 并读回。
6. **设计依据**：MVU-B（C2/C3/C4）、FR-009～011/022/023、quickstart B；用户已确认仅 Linux、仓库外隔离验证及直接使用平台脚本边界。jq 是 Bash 读取结构化 JSON 的固定运行工具，避免自行解析 JSON 或恢复 Node/Python 安装核心；本 MVU 同时验证其准备与失败边界。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --mvu B；独立副本成功安装文件逐字节一致，错误摘要零提交，未知文件哈希不变，合法安装重复执行复用且不改技能与收据；前项成功后后项失败明确 partial。工具准备失败时目标零写入。包 lint/check-types/build/test 及构建、link-skills、已有挂载脚本消费回归通过；记录实际 Linux/Node/Bash 版本及未验证平台。
8. **风险与回退**：故障只在受控 HTTPS 源注入；测试 CA 仅传入本次 curl 子进程，不修改系统信任。下载或摘要失败不执行工具/提交技能；失效锁和无收据残留不自动删除。发现假设失败停留本项，不启动 T005 或以后任务。公开源与完整跨平台验收仍留后续任务。

**2026-11-04 执行证据**：[MVU-B Linux 验收](analysis/acceptance/mvu-b.md) 已保存、ESLint 修复并读回。正式调度入口与 dist/script 独立副本分别 52 项通过，涵盖真实 HTTPS 故障、摘要/版本/路径、jq 自动准备、冲突/权限、逐项 partial、锁竞争、中断后重试及 Git 默认索引与跟踪祖先保护。包 lint/check-types/build、13 项 Python 测试通过；构建与消费者回归 11 pass、4 skip（两项 PowerShell 缺运行时、两项本轮未提供官方 CLI），具体命令和限制见验收记录。独立审查两项 Important 已分别用失败用例复现后修正，全套转绿；未重复派发审查。无真实项目安装、公开发布或下游实施；T005 未开始。

### T005

- [x] T005 验证MVU-C：独立第二步与实际文件核验，落点 `packages/skills/tests/distribution/mvu-c.mjs`。

**依赖**：T003、T004。

1. **改动文件**：packages/skills/tests/distribution/test-build-config.mjs（新增公共脚本目录及逐字节交付断言）；既有 test-distribution.mjs 自动发现 mvu-c.mjs，无需改写调度器。
2. **改动内容**：在脱离monorepo的目录用官方安装一个workflow技能，再取得同版公共材料并显式核验。注入缺附件、错版本、错路径、历史workflow及伪造退出0；假设为“无需历史扫描即可确定本次成功集合，global缺项目不抹掉安装成功”。骨架保留，后续任务在其上演化；直接创建公共双 shell 最小入口，由用户手动执行并复用 T004 的运行依赖准备，先完成本MVU的实际核验与前置失败报告；另验单选 task-explore 安装成功但五项挂载选择不足，明确缺项且不补装、不调用指令脚本；原生挂载分支在T006接入，未接入前不得报告挂载成功。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/mvu-c.mjs；specs/skills/001-skills-distribution/analysis/acceptance/mvu-c.md；packages/skills/script/mount-entry/mount-entry.sh；packages/skills/script/mount-entry/mount-entry.ps1；同目录 README.md（独立运行方式与阶段边界，沿用 plan 的目录交付约定）。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：MVU-C（C2/C3/C4）；FR-016～019/023；quickstart C。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --mvu C；仅完整本次选择进入映射；global未给项目安装成功而mount失败，关闭mount不要求项目，纯frontend不被历史workflow触发。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。

**2026-11-04 执行证据**：[MVU-C 独立第二步核验](analysis/acceptance/mvu-c.md) 已保存、ESLint 修复并读回。官方 skills 1.7.4 在 /tmp 实际安装真实技能和完整附件，公共双平台入口从独立副本核验同版清单、脚本摘要、实际安装路径和文件全集。Bash 源码与最终构建副本各 22 pass；Linux PowerShell 7.4.6 最终构建副本 21 pass、1 项 Bash 专属场景 skip；自动 jq 下载/校验单项通过。单选 Explore 保留安装成功并列出四项缺选，global 缺项目保留安装事实，no-mount/纯 frontend/非 Spec Kit 明确跳过；五项齐备时原生阶段仍为 unsupported/not-run，未冒认挂载成功。独立审查发现的不可读子目录误通过已先红后绿修复，未重复派发审查。包 lint/check-types/build、13 项 Python、7 项 MCP 回归通过；调度/构建/已有脚本消费回归 17 pass、4 skip，具体原因和未验证平台见证据。T006 未开始，六项 MVU 尚未全部通过，不进入 T009 及以后业务任务。

**本轮修正做法（用户确认后继续）**：T005 重新打开，保留上述历史证据。修改 mount-entry.ps1 的逐技能文件枚举和摘要读取，在单项范围捕获异常并记录 failed，继续核验后续显式选择；有失败时 installation=failed，完整项仍保留，挂载不执行。测试新增“完整项→不可读项→完整项”的实际进程用例，先复现 bad-skill 缺失且 installation=not-run，再验证三项均有结果及后两项分类正确。文件、八栏目约束与原任务保持一致；新增失败不通过另造状态系统绕过。

**本轮修正结果**：PowerShell 混合选择用例已先红后绿；Bash 正式调度器 23 pass，Linux PowerShell 最终构建副本 22 pass、1 项 Bash 专属 skip。坏项明确 failed，后续完整项仍核验，installation=failed 且挂载 not-run。证据见 [Node 入口与报告修正](analysis/acceptance/node-entry.md)，据实际结果恢复 T005 完成状态。

### T041

- [x] T041 实现并验证唯一 Node 入口，落点 `packages/skills/script/index.mjs`。

**依赖**：T004、T005 本轮修正；用户已确认入口形式与参数，不重复申请同一设计授权。

1. **改动文件**：packages/skills/tests/distribution/test-build-config.mjs；packages/skills/README.md；AGENTS.md 与两项功能的现行入口说明、分发安装契约和运行指南；不改历史实测结论。
2. **改动内容**：先写入口缺失失败测试，再实现纯 ESM、无第三方运行依赖的 Node 平台调度。唯一对外调用为 node script/index.mjs 加参数，不接受子命令。按 process.platform 选择 bash 或 pwsh -NoProfile -NonInteractive -File，调用内部 install-skills 平台脚本并保留其现有流程；后续由安装流程接入 mount-entry→hooks→commands。相对入口解析子脚本路径，保留调用 cwd 和参数数组，stdio 继承、shell=false；透传退出码与取消信号，缺脚本/工具和未知平台明确失败。以真实独立最小安装证伪 Node→平台进程契约；骨架保留，后续任务在其上演化。只实现当前已验证参数能力，后续约定参数由内部脚本明确拒绝，不假成功。
3. **改动禁区**：不新增多个公开操作、测试专用产品参数、自有 TS/JS/Python 安装核心、嵌套 package.json、包根扩展声明、命令模板或新依赖；不修改真实 .agents/.specify、其他任务的业务变更或生成物。
4. **新建文件**：packages/skills/script/index.mjs（唯一 Node 入口）；packages/skills/tests/distribution/test-entry.mjs（平台调度与实际独立安装）；specs/skills/001-skills-distribution/analysis/acceptance/node-entry.md（证据）。
5. **写法约定**：宪章 I/III/IV/V/VII、document-changed-symbols、test-driven-development、executing-plans；每个新增或语义修改 JS 声明上方有中文多行 JSDoc；Markdown 完成立即 ESLint 自动修复并读回。运行文件原样复制，不打包或依赖 monorepo。
6. **设计依据**：用户在本对话确认的唯一入口、环境识别与参数；plan.md 最新节；C3/C4 的 Node→平台调度边界。此前无 Node 的限制已由用户明确替代，平台实现与官方 CLI 的既有职责保持。
7. **验收信号**：node --test --test-isolation=none packages/skills/tests/distribution/test-entry.mjs；实际验证 Linux/Codex 独立安装字节、不同 cwd/含空格路径、参数原样透传、子进程退出/工具缺失/取消；平台映射断言和实际平台结果分别记录。包 lint/check-types/build/test、T005 回归、构建原样交付及受影响消费者通过；未知平台非零退出，原生挂载未接通不能报告成功。
8. **风险与回退**：未通过调度/取消/独立安装实验时停留本项，不进入 T006；保留已有平台骨架和失败证据。Windows/macOS 未实测明确留待矩阵，不将 Linux PowerShell 或平台映射冒充真实兼容；Node 运行前提及未实现参数在帮助和文档说明。

**2026-11-04 执行证据**：[唯一 Node 入口验收](analysis/acceptance/node-entry.md) 已保存、ESLint 修复并读回。唯一调用为 node script/index.mjs 加参数，无子命令；Node 自动选择内部平台模块，源脚本与最终构建副本各 9 pass。真实独立安装正文/二进制附件逐字节一致，保留 cwd 和原始参数、子模块退出码；INT/TERM 取消及前台后代停止都有实际证据。独立审查发现的“只停止外层 shell 后代仍写入”已补失败用例，再以 POSIX 独立进程组整组取消修正并全套转绿，未重复派发审查。包 lint/check-types/build、13 项 Python、7 项 MCP 回归通过；已有消费者 17 pass、4 skip，具体原因和 Windows/macOS/最低版本限制见证据。Node 只接现有安装骨架，原生挂载未接通，不把后续参数能力当作已实现。

### T051

- [x] T051 验证可独立消费的内容导出骨架，落点 `packages/skills/tests/distribution/content-export.mjs`。

**依赖**：T003、T004、T041；已有证据按实际 Linux 与工具版本范围复用。

1. **改动文件**：packages/skills/tests/distribution/helpers/catalog.ts（将已验目录/附件骨架提取到本任务新增构建模块，原 helper 转导出）；本轮通过同一 Vite 配置显式接入实验，不改默认 vite.config.ts，完整默认构建接线由 T012 承接。
2. **改动内容**：将原 T008 中不依赖挂载/隐匿的内容验证提前，命中 C3/C4，假设为“完整技能、投影、最小清单和现有脚本可随单次构建独立消费，且不依赖尚未交付的原生挂载”。先用真实 coding/frontend 技能及必要附件建立缺导出、缺附件、来源越界和不稳定摘要的失败用例；从 T003 已验数据建立最小 export/verify/plugin/agent 数据，连续构建并将公开选择副本移到仓库外，断开源码依赖，用固定官方 CLI 实际安装和比较文件，复验 MCP/link-skills 受影响范围。缺运行材料明确失败，不生成新模式占位。保留相同实现、沙箱和证据供 T010～T012 及 T008 增量填充；不重复重写工具，也不将此局部实验认作全量发布或原 T008 完成。
3. **改动禁区**：不改新模式规则、主线注册器、业务应用、真实用户安装目录或 dist；不新增公开入口、包根扩展声明、运行核心、嵌套 package.json 或运行依赖；不执行发布。
4. **新建文件**：packages/skills/tests/distribution/content-export.mjs（最小内容消费实验）；packages/skills/build/distribution/export.ts、verify.ts、packages/skills/build/plugins/distribution.ts、packages/skills/distribution/agents.json（原 T008 计划文件，提前建立同一最小骨架，存在则增量复用）；specs/skills/001-skills-distribution/analysis/acceptance/content-export.md（输入、实际红绿与限制）。
5. **写法约定**：宪章 III/IV/V/VII、mvu-gate、document-changed-symbols；沿用 T003 辅助模块及现有构建插件，代码按本文件固定检查基线；Markdown 保存立即 ESLint 并读回。
6. **设计依据**：FR-001～006/025、US1 的独立文件交付；MVU-001 与原 MVU-F 的内容部分。本任务只提前消除纯内容链风险，原 T008 全部验收保留。
7. **验收信号**：node --test packages/skills/tests/distribution/content-export.mjs；两次有效文件摘要相同，独立副本正文/附件与声明逐字节相符，原生安装确实可读；缺附件/越界/缺声明源非零失败，MCP/link-skills 受影响消费无退化。目标包 lint/check-types/build、范围测试与消费检查有实际记录；完整新模式、其他平台及公开源未验证时明确列出，不将样本当承诺矩阵通过。
8. **风险与回退**：失败只阻断依赖此导出的 T009～T015，回方案调整并保留失败及原骨架；无关 Git 实验仍可推进。来源不足时先验稳定技能，完整目标集合必须在 T012/T015 继续验证。

**T051 执行证据（2026-11-09）**：见[内容导出与独立消费](analysis/acceptance/content-export.md)。复用原 MVU-A 目录/附件骨架，建立构建前源快照、复制后核验、显式开发导出插件和 Codex 项目级 identity 数据。测试先因缺插件失败，再验证两次同源构建字节一致、按白名单搬离且删除源夹具后官方 skills 1.7.4 安装三技能的正文/附件完整、独立 Node 入口帮助可用；缺附件/入口、源链接、引用越界、大小写冲突均明确失败。最终内容测试 7 pass；包 lint/check-types/build 通过，构建/Bash 消费 9 pass、1 PowerShell skip，单独调度 7 pass，MCP registry 7 pass。全包 Python 23 tests 中 Pair 旧宪章锚点的 2 项既有失败仍保留，HEAD 已含同一引用且本轮未改源/宪章，不宣称全包全绿。独立只读审查无功能阻断，中文多行 JSDoc 遗漏已修正。开发清单标记 development，默认三目录不变；完整集合、其他平台/Eve/global/远端不计通过。后续复用相同文件，本轮未进入 T009。

### T007

- [x] T007 验证MVU-E：Git精确排除边界，落点 `packages/skills/tests/distribution/mvu-e.mjs`。

**依赖**：T004。

1. **改动文件**：无；packages/skills/tests/distribution/test-distribution.mjs 已按文件名自动发现 E，无需重复接线。
2. **改动内容**：在新增 mvu-e.mjs 内建立测试专用最小原型，在临时Git目录检验普通仓库、父仓库子目录、无.git、.git文件、global有无项目、特殊路径和已有反向规则。假设为“仅明确项目内本次独占路径被本地规则隐藏且不丢原规则”。骨架保留，后续任务在其上演化；不将测试原型接入公共参数或作为产品运行核心。
3. **改动禁区**：不改.gitignore或全局Git配置，不取消跟踪，不扩展worktree/submodule首版范围。
4. **新建文件**：packages/skills/tests/distribution/mvu-e.mjs；specs/skills/001-skills-distribution/analysis/acceptance/mvu-e.md。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：MVU-E（C3/C4）；FR-012～015；quickstart E。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --mvu E；git check-ignore -v、git ls-files及status联合证明来源和效果；父仓库/共享配置未被改写，重复无新增，权限失败保留安装结果。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。

**2026-11-09 执行证据**：[Git 精确排除边界](analysis/acceptance/mvu-e.md)。正式调度器 E 最终 11/11；真实 Git 联合核验来源、跟踪与可见性，原规则/重复/父仓库/全局范围/特殊字符/跟踪/真实权限及链接边界通过。独立审查发现悬空 exclude 链接可越界创建，新增反例先失败，lstat 修正后全套通过。包 lint、check-types、build 退出 0；调度/link-skills 8 pass、1 PowerShell skip。Python 24 项仍有两项既有 Pair 旧宪章锚点失败，未越界修复。仅完成 Linux 风险验证，T033～T036 和其他平台不因此通过；T012/T013 来源前置不变。

## Phase 3：先实现构建配置与临时挂载占位（P1）

对应MVU-008；当前先按T074～T077拆分独立插件。已交付的集合构建继续可用，各项完成后再接替原职责；原T068挂载占位及完整构建范围保留待重新核对，不直接执行旧方案。

### T074

- [x] T074 [US7] 新建三个独立插件文件及空工厂函数，落点 `packages/skills/build/plugins/{create-directories,copy-skills,generate-scripts}.ts`。

**依赖**：T073。

**范围与约束**：只创建文件、导出空工厂及必要中文多行JSDoc，不实现钩子/扫描/复制/脚本逻辑，不在vite.config.ts引用空函数。各插件内部承载自身声明，不创建共享context、插件通信层或嵌套全部实现的总函数；保留现有collections插件及构建行为。

**验收**：三个文件和导出存在，函数无业务实现，配置尚未注册空插件；目标包lint/check-types/build/test按仓库约定检查，现有集合输出保持。不以文件存在作为后三项功能通过。

**实施方案**：[T074](implementation/T074.md)，已按用户“四Task第一项建空函数”及本轮“开始”的认可保存并读回；仅实施本项，不提前展开其他Task方案。

**执行证据**：三个默认导出空函数及中文多行JSDoc已建立，未接入Vite。包lint/check-types/build通过、Python12项及现有Vite19项通过；AST空体核验和35项原文件摘要/33项产物字节核对通过。详见[本项结果](implementation/T074.md#实际结果2026-11-11)，不提前执行T075～T077。

### T075

- [x] T075 [US7] 实现扫描集合和创建输出目录的插件，并在Vite配置引用，落点 `packages/skills/build/plugins/create-directories.ts`、`packages/skills/vite.config.ts`。

**依赖**：T074，按用户指定的工程顺序推进。

**范围与约束**：独立扫描src一级集合，负责dist同名集合和预留空mcp目录；不输出技能文件或生成脚本。保留输出归属、链接/大小写与write=false保护，避免提前创建内容被构建清理；接替原collections.ts的目录职责，其他职责继续由原插件承担。

**验收**：真实构建可见同名集合及空mcp，新增/空集合无需固定名单；危险来源和输出拒绝，write=false不落盘，现有技能产物不回退。目标包检查及受影响构建验证通过；只验本插件，不提前实现T076/T077。

**实施方案**：[T075](implementation/T075.md)，复用四Task讨论及用户本轮“继续，目录插件要重新实现”的认可，已保存读回；只重写并接线本目录职责，不引入共享上下文或扫描api依赖。

**执行证据**：[实际实现与验证](implementation/T075.md#实际实现与验证2026-11-11)。目录插件独立扫描并在真实写出后补目录，原插件移除目录职责，配置已接线；独立目录13项与集合19项共32通过，包lint/check-types/build、Python12项通过。一次只读审查无问题；Bash消费1通过、PowerShell缺pwsh1跳过，35项来源/其他工厂未变，真实33项产物字节保持。仅完成T075，T076/T077仍未实施。

### T076

- [ ] T076 [US7] 实现按集合配置复制技能的插件，并在Vite配置引用，落点 `packages/skills/build/plugins/copy-skills.ts`、`packages/skills/vite.config.ts`。

**依赖**：T075，作为实施顺序前置，不表示读取目录插件的内存结果。

**范围与约束**：自行扫描集合、读取collection.config.json，按skill清单交付正文、frontmatter、完整附件及配置原字节；沿用空清单、未知属性及逐事件hook规则。保留清理前校验、稳定重建、write=false及路径保护；由Vite资产API写出。接替collections.ts的剩余有效职责和接线，核对唯一虚拟入口等构建所需行为后再清退旧实现，不误删仍有用途的逻辑，不实现脚本生成或MCP内容。

**验收**：新目录/复制插件共同构建，与当前约定的文件和字节一致；清单筛选、多事件配置、附件、重建和失败保护等现有真实Vite回归通过。目标包lint/check-types/build/test及受影响消费者有实际结果；原单插件功能完整迁移，不留下重复写同一路径的接线。

**实施方案**：开工前保存读回implementation/T076.md；旧逻辑归属与清退依据在本Task核查，不扩展到旧完整安装/挂载或发布任务。

### T077

- [ ] T077 [US7] 实现按集合配置生成脚本的插件，并在Vite配置引用，落点 `packages/skills/build/plugins/generate-scripts.ts`、`packages/skills/vite.config.ts`。

**依赖**：T076；开工时须另有真实讨论确定的脚本生成规则。

**范围与约束**：自行扫描src集合和读取集合配置；脚本内容、位置、模板及具体挂载语义按用户要求留到本Task讨论。确认并保存本项方案后才实现和接线，不提前填充占位业务、不借本Task恢复旧脚本逻辑或运行实际挂载。

**验收**：按届时认可规则验证生成内容、位置、选中范围、失败及重建行为，完成目标包和范围检查；现有目录/技能交付不回退。规则尚未确定时保持待办，不能用空函数或空产物标记完成。

**实施方案**：尚未确定脚本细节；到本Task时讨论并保存读回implementation/T077.md，不提前生成方案文件。

### T073

- [x] T073 [US7] 将插件所有声明收拢到工厂函数内部，改用skill清单和逐事件hook对象配置，落点`packages/skills/build/plugins/collections.ts`及`packages/skills/src/<集合>/collection.config.json`。

**依赖**：T072。保留其完成事实，继续使用已交付的集合插件，不重开旧任务。

**范围**：静态import及工厂自身以外无模块级声明；skill映射决定复制范围。hook按事件名组织，每事件独立prompt/optional/priority，额外属性原样保留。迁移全部现有技能清单及13份事件条目，移除重复command/description；动态脚本生成和MCP内容继续后置。

**验收**：工厂边界AST核验通过；真实Vite测试证明清单选择、未选技能不交付、不同事件与扩展属性完整、错误配置/路径在清理前拒绝。现有构建保护及包lint/check-types/build/test通过；原事件除派生字段外等值，不修改技能正文或专用脚本。

**实施方案**：[T073](implementation/T073.md)。复用用户本轮原始要求及hook属性位置、清单范围的后续澄清。

**执行证据**：[本轮验收](analysis/acceptance/plugin-skill-config.md)。真实Vite19项、Python12项、包lint/check-types/build通过；四集合23技能及13事件迁移核对通过。一次只读审查无问题，PowerShell缺运行时跳过；动态脚本生成及MCP内容后置。

### T072

- [x] T072 [US7] 迁移为src一级技能集合，合并hooks配置，并用单个Vite插件自动发现和复制集合，落点`packages/skills/src/`、`packages/skills/build/plugins/collections.ts`及`packages/skills/vite.config.ts`。

**依赖**：T064。复用归档后清退边界；T067只保留历史，不恢复其六模块。T065原固定目录/阶段接口不作为新插件必须恢复的实现约束。

**范围与约束**：采用用户最新集合方案，mcp-build-smoke并入eval；新增目录自动成为集合，无配置使用默认值，不维护固定名单。每集合collection.config.json集中hooks，SKILL.md frontmatter/附件保持原字节。发布包名仅预留未定元数据；dist同名集合加空mcp目录，MCP内容/流水线/挂载专用脚本后续处理，不派生逐技能hooks配置。

**验收**：真实Vite构建验证任意集合/无配置/二进制/附件/配置完整、删除重建与稳定字节；非法来源/配置/输出在清理前拒绝，write=false零写入，零占位JS。目标包lint/check-types/build/test及通用本地路径消费者有实际证据；不以此验收MCP、完整安装/挂载或发布。

**实施方案**：[T072](implementation/T072.md)。用户提出并明确集合及新增目录发现逻辑，后续澄清hooks范围、发布待定和“特定的脚本我们额外处理”；原始讨论见[集合方案](requirements/discussions/2026-11-11-collection-build.md)。

**执行证据（2026-11-11）**：[集合构建](analysis/acceptance/collections.md)。四集合及MCP样例迁移、8份hooks集中完成；单插件14项真实Vite测试通过，包lint/check-types/build及Python12项通过，当前33源文件与产物逐字一致。Bash路径消费者通过，PowerShell缺运行时跳过。一次审查的默认配置大小写冲突已先红后绿修正。estimate-context既有114项lint与旧MCP清单CLI失败保留，专用挂载/发布未验。

### T065

- [x] T065 [US7] 先建立构建阶段和保留消费者的失败契约测试，落点 `packages/skills/tests/distribution/build-pipeline.test.mjs`

**依赖**：T064。

**范围**：按来源读取、内存计划、三目录/MCP、Release/格式文件、磁盘复核的阶段边界建立真实Vite沙箱；包含中文/空格路径、二进制附件、源变动及失败传播，复用既有sandbox与构建消费者，并覆盖原生挂载临时占位的明确失败、零写入及 --no-mount 保留纯安装事实。

**约束**：测试必须先记录新阶段缺能力的真实失败；不把旧构建绿灯改成新通过，不删MCP/安装/工作区断言求绿，不引入真实安装目录。

**整体验收**：同一入口先得到可定位到缺失阶段/返回契约的失败；缺目录、链接、路径/身份/大小写冲突、无效MCP、缺附件和错误清单都有独立断言；记录红灯及预期后保留相同骨架供后续实现填充。

**依据**：BUILD/COMPAT；contracts/build-pipeline 的阶段表；quickstart 新构建场景。

**实施方案**：[T065](implementation/T065.md)，依据用户对三类验证范围随后明确“开始”的认可，已保存并读回；本项只交付真实失败契约及证据，不填充后续构建实现。

**执行证据**：[T065真实红灯基线](analysis/acceptance/build-pipeline-red.md)。新增25项真实Vite/阶段/消费者契约，最终0通过、25失败、0跳过：7项被构建占位阻断、16项缺StageError、2项缺真实阶段模块；不把统一报错计为负例通过。包lint/check-types及Python11项通过，保留消费者10通过1PowerShell跳过，build仍明确非零。独立审查的3项测试缺口已修正，原152项源码/旧产物/存档字节不变；本项只完成失败测试目标，T067～T070仍须沿骨架实现和转绿。

### T067

- [x] T067 [US7] 重写来源快照与内存构建计划，落点 `packages/skills/build/distribution/{models,validate,export}.ts`（原实现已归档，完成记录仅保留历史）

**依赖**：T065。

**范围**：返回SourceSnapshot和BaseBuildPlan，固定实际源码/配置/技能/MCP/script与完整依赖、工具证据；BaseBuildPlan仅含原始三目录及MCP的内存计划，公开Release/投影部分由T069沿同一计划补齐后才成为完整BuildPlan。保持既有Release线格式的兼容边界。

**约束**：沿用模型约束“正式候选要求干净提交严格对应输入，开发或合成材料明确隔离”；sourceRevision/version为“完整源码 SHA、自有 SemVer；与实际来源及 Release 一致”。BaseBuildPlan只在内存形成，不写文件；不用HEAD冒认未提交字节，不把缺Release/投影的中间对象作为完整BuildPlan返回。

**整体验收**：T065相关来源/计划反例转绿：读取不执行脚本、不查询Agent；缺件/链接/重名/非法路径拒绝且输出零写入；来源摘要与实际原始字节一致，StageError可定位；返回结果与data-model字段对应。保留骨架供T068/T069增量填充。

**依据**：BUILD；data-model阶段数据及SourceSnapshot；contracts/build-pipeline。

**原实施方案（已停用）**：[T067](implementation/T067.md)。原讨论与认可保留历史；用户最新要求全部归档后重新写构建脚本，不能再把该文件当作当前有效实施方案。

**执行证据（2026-11-11）**：[来源与基础计划](analysis/acceptance/source-plan.md)。实际交付 readSourceSnapshot/createBaseBuildPlan 与结构化 StageError，33项阶段测试通过；真实包可形成基础计划且零产物写入。包lint/check-types与Python11项通过。一次独立只读审查的3项Important均经失败测试修正：嵌套包Git基准、MCP普通二进制及文件/目录路径冲突。Vite入口未接线，build仍失败、T065完整链25项仍红；保留消费者9通过、1在线Agent布局变化失败、1PowerShell缺运行时跳过。完整安装未通过，不能沿用旧记录抵扣T070。下一项T068仍需自身方案。 **后续纠正**：该6模块及阶段测试现已按用户要求移至[归档](archive/2026-11-11-build-script-restart/README.md)；上述33项通过只属归档前结果。当前有效源码不再提供这些入口，不直接推进原T068。

### T068

- [ ] T068 [US7] 重做单配置三目录与MCP自动清单生成，落点 `packages/skills/vite.config.ts`、`packages/skills/build/plugins/{content,scripts,mcp-manifest}.ts` 与临时 `packages/skills/script/mount-entry/mount-entry.{sh,ps1}` 边界

**当前适用边界**：下方三目录/MCP/旧阶段对象仅保留旧规划目标和验收来源，不能作为当前开工方案。当前主线以FR-048～060的集合输出、空mcp及独立插件为准，T067实现已归档；本项需先按届时有效范围重新对齐，不能据历史checkbox通过直接推进，也不阻塞T076/T077或独立紧急路径。

**依赖**：T067。

**范围**：同时为 Spec Kit 原生未实现段保留临时脚本占位，优先复用已有 mount-entry 明确失败分支，保留已完成文件核验，不调用 register-hooks/register-commands；具体最小文件调整在实施前讨论。由一处有序编排生成mcp/skills/script，重写MCP扫描与脚本复制；先在自有隔离目录返回BaseBuildOutput，仅含三目录文件表、MCP清单位置和来源身份。补齐生成失败与输出归属保护，测试继续使用T065和既有test-build-config；此中间结果不能供候选链或T070完整复核使用。

**约束**：单一Vite配置、同一dist根；脚本原样复制且不执行，排除测试/缓存/依赖；MCP仅读src/mcp，源内手写manifest、重复身份、非法metadata或空正文失败；空源输出version=1及空skills数组，不恢复旧根清单/虚拟JS入口。占位仅表示原生能力未实现，不能返回挂载成功、伪造官方输出或改变原始复制规则；既有注册器源码保留但不在本阶段调用。

**整体验收**：真实Vite构建输出三目录，MCP正文/references逐字相符；新增修改删除及空源重建反映实际；脚本执行哨兵从未触发，已有源码/用户目录无变化，失败结果与已写事实正确。占位请求非零、hooks/commands 未执行、原生目标零写入；--no-mount 只报告适用阶段 skipped 并保留已验证安装事实。此项不以旧Release输出掩盖尚待T069的新分发实现，也不验收真实挂载。

**依据**：MCP-BUILD-001～006、FR-024/025；BUILD；contracts/distribution。

**实施方案**：尚未关联当前有效方案；开工前按本文件固定约束完成该 Task 的讨论、认可、保存和读回。

### T069

- [ ] T069 [US7] 重做Release、附件依赖及两种格式文件生成，落点 `packages/skills/build/distribution/{models,validate,projection,references,export}.ts` 与 `packages/skills/build/plugins/distribution.ts`

**当前适用边界**：下方旧BaseBuildPlan/BuildPlan及双格式接线保留为后续对齐参考；当前主线不恢复已归档模型，不据本段提前决定MCP或T077脚本规则。真正进入本项前须依据现行集合来源确定有效方案，原身份、原验收与未完成事实保留；紧急副本采用自己的已确认契约。

**依赖**：T068。

**范围**：将BaseBuildPlan补齐为完整BuildPlan，包含公开文件清单、附件/依赖、identity与Eve字节及Release；全部校验通过后，再由同一有序编排写出并返回含MCP/Release清单位置的完整BuildOutput。全部六个旧分发模块纳入重做，verify模块由T070完成。更新相关helpers转导出与模型/内容测试接线，保留安装脚本。

**约束**：Release继续schemaVersion=1，tools/skills/files/projections/adapters及读取器引用不变；“源码提交使用完整 40 位 Git SHA”；files为path/bytes/sha256，投影来源匹配同一文件表；身份来自frontmatter，普通附件原样，Eve仅按既定规则转换正文。完整正式来源不以占位/合成workflow补齐。

**整体验收**：T065与release-models/content消费者证明完整附件、依赖、目录规范化和两种投影正确；返回对象满足data-model完整BuildPlan/BuildOutput全部必需字段，非法Release/投影在写出前失败且零产物写入。无静态Agent表或第二配置，dist可保留未公开内容但Release不扩大公开选择；旧安装schema实际可读，非法引用和遗漏反例非零。

**依据**：FR-001～011/024/025/045～047；BUILD/COMPAT；data-model Release与T010线格式约束。

**实施方案**：尚未关联当前有效方案；开工前按本文件固定约束完成该 Task 的讨论、认可、保存和读回。

### T070

- [ ] T070 [US7] 重做磁盘复核及构建消费者兼容验证，落点 `packages/skills/build/distribution/verify.ts` 与 `packages/skills/tests/distribution/{build-pipeline.test.mjs,content-export.mjs,test-build-config.mjs}`

**当前适用边界**：下方旧阶段对象、MCP及旧curl入口骨架只有在T068/T069按现行范围重新对齐后才可核查适用性；不把它们当当前集合构建已具备能力或紧急交付前置。原验证目标及证据保留，不以本次文档修复标记实现通过。

**依赖**：T069。

**范围**：重新枚举实际产物并返回BuildVerification；用同一源码/依赖完成两次干净构建，验证MCP、Release/投影、主线curl安装/写入前检查及工作区消费者；复用这组双构建结果供T055准备候选，不再建立第二套构建；本阶段验证纯安装和原生占位的未实现行为，真实挂载/宿主加载仍留到 T006/T028 和完整 T008/T037，不以占位或局部稳定来源充抵。

**约束**：独立读盘，不能仅复用内存摘要或靠覆盖掩盖错误；区分允许未选内容的完整dist与后续严格payload；缺真实工具、平台或正式来源不计通过，局部稳定来源不得冒认完整workflow。

**整体验收**：T065全阶段反例和原受影响构建/模型测试通过；两次同源实际文件及字节一致，源/输出中途变化能被拒绝；独立消费正文附件、Node入口和link-skills/MCP回归有实际证据。记录目标包lint/check-types/build/test、范围测试和未测边界，不自动勾选T012完整来源验收。挂载请求必须明确未实现且零官方调用，关闭挂载才验纯安装；通过后才能推进 T066 的 Actions 开发，full/ready 仍须拒绝缺真实挂载证据。

**依据**：BUILD/COMPAT；SC-002/009/014；quickstart新构建及工程检查。

**实施方案**：尚未关联当前有效方案；开工前按本文件固定约束完成该 Task 的讨论、认可、保存和读回。

## Phase 4：再实现 GitHub Actions 发布流水线（P1）

对应MVU-009；T070通过后再进入本组。当前只做实现与隔离验证，不提前触发正式发布。

### T066

- [ ] T066 [US7] 在构建验证后接入只读 GitHub Actions 检查，落点 `.github/workflows/skills-check.yml` 与 `packages/skills/tests/distribution/pipeline-workflow.test.mjs`

**依赖**：T070；先验收单一 Vite 构建、纯安装与临时挂载占位，再开发只读 Actions。

**范围**：先用配置反例验证路径过滤、事件、只读权限和失败传播，再接既有包检查及新构建测试；消费 T070 已验构建结果，不再与 T067 同步开工。只读骨架在此建立，完整候选上传及发布配置由T059补齐。

**约束**：普通PR/外部贡献无发布凭据和写权限；直接调用同一构建/测试能力，不另造构建规则，不把旧构建或预期红灯报告为新链通过。此任务不修改package.json或共享构建输出。

**整体验收**：配置与测试证明构建/测试非零会使check失败、权限只读、相关源码/脚本/配置/依赖变更均能触发；无候选发布或部署动作；明确真实Actions尚未运行的范围，迁后平台实证由T061承接。

**依据**：FR-037/039/043；plan 构建验证后接入Actions；SC-014/015。

**实施方案**：尚未关联当前有效方案；开工前按本文件固定约束完成该 Task 的讨论、认可、保存和读回。

### T055

- [ ] T055 [US7] 验证同源候选及身份替换拒绝，落点 `packages/skills/build/ci/candidate.mjs`。

**依赖**：T002、T051、T070；复用新构建的同源双输出，只以明确标注的稳定/合成材料做isolated；完整候选仍须原发布及来源门禁。

**范围**：核验同源双构建、上传前内容身份及严格公开字节；完整平台身份和有效期由T071续接验证，isolated与正式ready资格分开。原完整候选拒绝条件由两项共同覆盖，保留相同校验骨架，不形成互相等待。

**约束**：不修改已固定候选以嵌入来源或修摘要；不执行发布、使用真实 token 或创建假平台记录；不把合成集合当正式获准来源。

**整体验收**：同一测试入口先记录内容候选缺能力失败再实现；复用T070的两次干净构建，公开路径和字节100%一致，上传前内容字段/字节/检查反例非零且无公开写入，索引与payload分离并记录真实来源。平台字段与有效期反例由T071继续验收，正式资格在T059/T061汇合，T055自身不等待T071；原完整正式候选仍须T030/T031/T037及实际支持范围检查。

**依据**：FR-038～040/043；SC-014/015；data-model ReleaseCandidate；contracts/pipeline 检查与候选准备。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t055)。

**本次重规划衔接**：本项固定上传前CandidateContentIndex与严格payload，平台绑定由T071承接，不预写未知artifactId。schemaVersion遵循“内部索引版本1；不改变公开 Release 的 schemaVersion”；validationScope为“development/isolated/full”。payload恰等于release.json.files加release.json，多件也失败；candidateDigest遵循“路径按 UTF-8 字节顺序排序，以固定键顺序 path、bytes、sha256 的无额外空白 JSON 数组 UTF-8 字节求 SHA-256”。sourceRevision/version为“完整源码 SHA、自有 SemVer；与实际来源及 Release 一致”；dependencySnapshotDigest/checksDigest遵循“payload 外真实完整依赖快照与检查证据的摘要；证据本身随工程归档留存，不暴露秘密”。索引不写自己的摘要，改文件/清单/身份/检查均拒绝；时效由T071真实收据验证。

**范围准入补充**：沿contracts/pipeline显式传入`--validation-scope isolated|full`；缺值、非法值或development用途不能成功准备候选。T055先用isolated稳定子集/测试自有合成技能通过真实README/许可证、集合内附件依赖、同源双构建与严格payload门禁；完整安装/挂载/矩阵尚未执行的项如实记not-run和coverageLimits，已执行检查失败仍非零。测试缺参数、范围不符、非法Release、缺附件/许可证、完整门禁缺项及只改标签升级的拒绝分支；full正向验收等原正式来源及T030/T031/T037等完整检查就绪后再做，不阻断T071本地隔离测试。full内容成功尚非ready，Foundry始终仅隔离用途，最终资格由T059/T061结合T071真实平台事实判断。

### T071

- [ ] T071 [US7] 实现上传后平台收据及精确身份核验，落点 `packages/skills/build/ci/candidate.mjs` 与 `packages/skills/tests/distribution/pipeline-contract.test.mjs`

**依赖**：T055。

**范围**：先在同一候选测试入口记录缺收据/错身份失败，再接上传成功输出、独立收据及只读API核验；生成CandidateResult与StageError。完整配置由T059接入，真实平台有效性由T061实证。

**约束**：“上传成功输出的精确归档 ID 与平台摘要；与候选内容摘要是不同事实”；“真实当前仓库及精确受信默认分支检查运行；发布时再核对平台 API 的该 attempt 已成功”；“保存真实平台时间与到期事实；计划保留14天，不超过平台限制”。收据自身ID由请求定位，不回写已上传内容；purpose为development/isolated/ready，不能只改标记升级。

**整体验收**：精确payloadArtifactId/receiptArtifactId、run/attempt、headSHA、contentIndexDigest/candidateDigest及到期事实逐项核对；错run/attempt、过期、缺收据、索引或证据替换均非零，payload保持原字节。合成材料只返回isolated；只有可信实际平台与完整门禁齐备才ready，真实平台未验明确留到T061。

**依据**：BIND；FR-038～040/043；data-model PlatformReceipt/CandidateResult；contracts/pipeline。

**实施方案**：尚未关联当前有效方案；开工前按本文件固定约束完成该 Task 的讨论、认可、保存和读回。

### T056

- [ ] T056 [US7] 验证隔离 Git 发布的授权、竞争和中断恢复，落点 `packages/skills/build/ci/publish.mjs`。

**依赖**：T055、T071；目标仅为本次测试拥有的临时bare Git，使用明确isolated材料，不依赖真实公开仓库或发布凭据。

**范围**：仅在自有临时 bare Git 验证授权、同版重试与并发、中断后读回及旧版本恢复；保留发布器与故障骨架。

**约束**：simulate 拒绝真实 HTTPS/SSH 目标；Foundry 布局 publish 必须失败；不 force、不删除或移动旧 tag、不推源码分支、不执行候选脚本、不向日志/请求/候选写秘密。

**整体验收**：同一测试入口真实运行本地 bare Git；未授权/只读/错目标零新 ref，同字节重试和并发共用一个发布身份，异字节不覆盖；响应丢失读回后保留已写事实；旧 tag/SHA/字节及旧版隔离安装均实际核对。记录取消与子进程结果、故障点和未测边界，不将隔离结果记为真实平台通过。

**依据**：FR-039～044；SC-015～017；data-model PublishRequest/Publication；plan 授权/竞争/中断前置实验。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t056)。

**本次重规划衔接**：复用新内容索引与收据验证骨架；本地合成平台记录不赋予真实ready/publish资格。原授权、竞争、断连读回、旧版本保护及整体验收完整保持。

### T058

- [ ] T058 [US7] 接通两种布局的工程驱动与完整候选门禁，落点 `packages/skills/build/ci/run.mjs`。

**依赖**：T056、T066、T070、T071；在构建后只读Actions和同一阶段实现上接驱动，完整正式候选仍等待原完整来源及发布门禁。

**范围**：在 Foundry 子目录与迁后根包两种明确布局复用已验模块，接通 check/candidate/simulate/publish、候选门禁及分阶段报告；真实发布仅适用迁后同仓库授权。

**约束**：不把 build/ci 放入运行 script 或 release.files，不新增终端用户子命令、安装核心或跨仓库服务；不借布局参数授予发布权；不修改原 .specify 状态或用户安装目录。

**整体验收**：pipeline-contract.test.mjs 从真实 run.mjs 调用四种模式，合法请求结果与实际文件/ref 一致；错参数、冒用布局/身份、缺检查及 Foundry publish 均非零；候选通过与否、发布已发生/未运行及核验失败准确区分。T037 前只证明驱动与门禁，不能把开发/isolated 运行标记为正式候选通过。

**依据**：FR-037～044；SC-014～017；data-model PipelineRun/PublishRequest；plan 两种显式布局与候选不变性。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t058)。

**本次重规划衔接**：check/candidate/simulate/publish调用同一来源、生成、磁盘复核及索引/收据实现；未知布局、参数、输出根与身份先失败。StageError保留stage/reasonCode/已写事实，依赖阶段not-run。Foundry拒绝真实publish，禁止为绕过边界另写构建核心。

### T059

- [ ] T059 [US7] 交付只读检查和迁后手动发布的 Actions 配置，落点 `.github/workflows/skills-check.yml`、`.github/workflows/skills-release.yml`。

**依赖**：T058、T066、T071；沿T066同一skills-check.yml增量补候选上传与收据，并新增skills-release.yml，不重建第二套检查。

**范围**：交付两种布局共用的只读检查及迁后手动发布 workflow，精确绑定可信 run/artifact 与候选；发布步骤不安装依赖、构建或执行候选，平台专有行为留 T061；本项先完成配置/驱动实现与隔离验证，随后才推进 T006 的真实挂载，T060 完整交付验收继续后置。

**约束**：不触发真实 Actions 发布、不建仓/配置真实 secrets、不使用跨仓库 PAT、不用外部贡献代码取得发布权限，不修改无关 create-iteration-artifacts workflow；不将隔离解析当平台权限已验证。

**整体验收**：YAML 可解析、Foundry 与迁后根包两种布局的配置路径及调用真实驱动正确；PR/外部分支无发布 token，Foundry guard 与驱动双重拒绝真实 publish；必需失败/未验阻止候选升级，artifact 精确绑定及改字节反例非零。三平台/动态 Agent 矩阵所需检查有明确 job/证据入口，不以 Linux 代表全矩阵。占位存在或缺真实挂载证据时 full/ready 必须拒绝；可明确 isolated 验配置与失败路径，但不能正式发布。尚未执行的真实平台权限、artifact 生命周期逐项列 T061 待验。

**依据**：US7 场景 1/3/4/9/10；FR-037/039～043；SC-015/016；plan Actions 设计与 research 第 12/13 节。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t059)。

**本次重规划衔接**：上传后才写真实payloadArtifactId与独立收据，receiptArtifactId经第二次上传输出/请求定位；guard核对精确run/attempt已成功、仓库/ref/有效期和完整门禁。actions权限按job明确，发布不安装/构建/运行候选脚本；Actions只读检查与完整发布配置分别留证。

## Phase 5：US1，正式同版内容与纯安装前置（P1）

复用原任务目标和验收；完整来源仍有外部移交条件，不作为前两组隔离开发前置。

### T009

- [x] T009 [US1] 补齐官方交付的契约与错误输入测试，落点 `packages/skills/tests/distribution/official-contract.test.mjs`。

**依赖**：T003、T051；只依赖已验证的内容导出，不再等待完整挂载与隐匿。原 T008 完整验收保留并阻塞 T037。

1. **改动文件**：packages/skills/eslint.config.ts（仅分发契约文件保留 Node 测试运行器）；packages/skills/build/types/preset-config.d.ts（按共享工厂实际能力补齐多配置及异步声明）。原 test-distribution.mjs 已按约定自动发现 US1，无须重复修改。
2. **改动内容**：先把四粒度、name不等于目录名、重复选择、eval/空分类、依赖缺项、必需附件被过滤、大小写冲突及官方列出无写入编成验收断言；复用MVU-A沙箱，确认缺失正式能力的断言先失败。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/tests/distribution/official-contract.test.mjs；specs/skills/001-skills-distribution/analysis/acceptance/official-contract.md（覆盖、真实红灯及后续职责）。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：US1；SC-001～003；contracts/install与distribution。
7. **验收信号**：pnpm --filter @foundry/skills run test:distribution -- --story US1；记录预期红灯及原因，不能用skip或删除断言代替实现。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。

**T009 执行证据（2026-11-09）**：见[官方契约与缺口](analysis/acceptance/official-contract.md)。通过正式调度器调用真实 Vite/T051 插件、隔离项目与官方 skills 1.7.4，整包/分类/单个/多个及重复选择、二进制附件、已有其他技能、分类只读列出、eval 排除、过滤附件/大小写/重名保护已有通过结果。最终 20 tests：9 pass、11 预期 fail、0 skip，失败包含父测试；真实缺口为 T012 的目录别名规范化与 T013 的 `--check --official`，不把统一拒绝未知参数当作正确处理选择/依赖。独立审查指出的过滤用例假阳性已修正，列出比较项目及用户完整树。包 lint/check-types/build 均通过；仅对分发 Node 契约关闭框架导入转换规则，不引入 Vitest，不改全局检查强度。测试编写阶段完成，US1 保持失败，原断言全部保留；未实施 T010/T011。

### T010

- [x] T010 [P] [US1] 定义发布与技能模型和构建期校验，落点 `packages/skills/build/distribution/models.ts`。

**依赖**：T009。

1. **改动文件**：packages/skills/tests/distribution/official-contract.test.mjs（接入正式模型断言）；specs/skills/001-skills-distribution/data-model.md（明确实际字段及投影来源格式）。
2. **改动内容**：在 build/distribution 定义 Release/Skill 及构建期类型与校验器，不作为安装运行核心交付；平台运行时在各自脚本验证不可信输入；逐项保留数据模型原文约束：schemaVersion“首版 1；不支持的格式拒绝执行”；version“明确 SemVer；首个构建沿用包版本 0.1.0；同版本内容不得重发替换”；sourceRevision“生成该内容的源码提交；不包含用户身份或凭据”；tools“skills=1.7.4、specify=1.2.6、平台 shell 下限；官方 skills 另记 Node/npm 基线”；files“每项相对路径、字节数、SHA-256；覆盖脚本、agent适配信息及技能；不含固定扩展声明”；skills“发布 Skill 数组；按同版获准来源确定，不固定历史数量”；projections“identity 与 eve-v1.7.4 的实际安装文件摘要”；adapters“agent 路径规则文件及挂载脚本的路径和摘要”。Skill字段照data-model全量定义，name是frontmatter唯一身份，category限coding/frontend/workflow；“附件路径必须在本技能内；禁止源符号链接、大小写折叠冲突和遍历路径。” release.json不含自身摘要，catalogDigest单独记录。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/build/distribution/models.ts（构建期共享类型）；packages/skills/build/distribution/validate.ts（构建期 JSON 校验）；packages/skills/tests/distribution/release-models.test.mjs；specs/skills/001-skills-distribution/analysis/acceptance/models-and-agent-paths.md（与 T011 共同证据）。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：data-model Release/Skill原文；FR-001/003/008/010。
7. **验收信号**：对每个必需字段缺失、错类型、未知schema及路径逃逸做正反例；包lint/check-types通过，US1对应模型断言由红转绿。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。

**T010 执行证据（2026-11-09）**：见[模型与路径交付](analysis/acceptance/models-and-agent-paths.md)。Release/Skill/File/ProjectedFile/Tools 类型与 parseRelease/parseReleaseJson/assertReleaseUnchanged 已实现，正式模型与 T051 最小开发清单分开，后续 T012 再切换。先因缺实现失败，字段、格式、路径及投影边界逐项红转绿；独立审查的文件/目录冲突、普通 Eve 附件字节替换和非 ASCII SemVer 均补回归修复，嵌套 SKILL.md 合法投影保留。最终模型 36 pass；接入 US1 后模型断言通过，整体 56 tests 为 45 pass、11 原有预期 fail、0 skip。包 lint/check-types/build 通过；版本不可覆盖、公开依赖与所有文件引用保持校验，不新增安装运行核心。

### T011

- [x] T011 [P] [US1] 固化79个agent路径和scope适配，落点 `packages/skills/distribution/agents.json`。

**依赖**：T009。

1. **改动文件**：packages/skills/distribution/agents.json；specs/skills/001-skills-distribution/contracts/compatibility.md（已测与未测范围）。
2. **改动内容**：依据固定上游生成显式数据与解析器，保留XDG、专属环境变量、OpenClaw优先级及universal最终路径分支；先拒绝eve/promptscript global。项目始终cwd，一个调用一个agent；不得将检测变量误当安装路径。
3. **改动禁区**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。
4. **新建文件**：packages/skills/build/distribution/agent-paths.ts；packages/skills/tests/distribution/agent-paths.test.mjs。
5. **写法约定**：遵循宪章 I/III/IV/V/VII、document-changed-symbols；TS/JS 用严格 ESM 和多行 JSDoc；Markdown 保存立即运行 pnpm exec eslint --fix 并读回。
6. **设计依据**：FR-009/023；contracts/compatibility固定清单。
7. **验收信号**：79个项目及77个全局映射逐项与MVU-A证据比对；分支输入明确预期绝对路径，两个不支持global项零写入。
8. **风险与回退**：失败保留现场与具体输入，停止依赖本任务的后续任务；若做法与现场不符，按宪章 VII 先更新做法并经用户确认，不强行覆盖。

**T011 执行证据（2026-11-09）**：见[固定路径与真实安装](analysis/acceptance/models-and-agent-paths.md)。79 项显式规则包含 skills 1.7.4 的真实源码提交 a80e4c9d12d607631249d4d7d059f835d4b2f13a 和固定 bundle SHA-256，不保存构建机绝对路径。只读 resolveAgentPath 覆盖项目/global、universal、XDG/专属变量及 OpenClaw 优先级，检测变量不改安装目标。首次缺解析器红灯后实现，独立对照与主执行者整合实测均 6 pass；Linux 官方 CLI 实际完成 79 项目级+77 全局安装，Eve/PromptScript global 拒绝且无安装写入。Windows/macOS 仅纯路径对照，未冒报真实平台；T051 新映射消费 7 pass，包 lint/check-types/build 通过。完整两入口/四粒度/三平台矩阵仍由 T038 承担。

### T012

- [ ] T012 [US1] 将完整目录、投影和清单接入正式构建，落点 `packages/skills/build/distribution/export.ts`。

**依赖**：T010、T011、T070；新构建与兼容验证须先通过，完整集合作为整体验收另需主线正式同版来源及消费契约移交。

**范围**：核对旧导出骨架的适用范围后完善单次构建、目录投影、完整附件和 Release；公开集合仅消费主线同版获准 Increment 与准备/分析/结案来源，正式来源缺失保持未完成。当前集合来源及空mcp遵循FR-048～060，不在本项恢复旧MCP扫描或清单生成。

**约束**：不手改源SKILL以绕过失败；确需修正文中失效附件路径时先列出精确文件及证据，按宪章VII补做法并确认；不改技能协作规则。

**整体验收**：pnpm --filter @foundry/skills run build；后续发布选择精确覆盖公开同版获准技能，当前dist/<集合>按skill清单交付正文、附件及配置，dist/mcp保持空目录，不要求产出旧manifest；缺附件夹具构建失败；US1完整附件断言通过。对准备正文/附件/hook声明与Increment有效映射做完整清单/投影断言；不得因旧四项缺失使当前集合失败，正式准备/分析来源缺失仍保持整体验收未完成。

**验收适用修正（2026-11-12）**：旧dist/skills、src/mcp独立扫描及清单要求保留为历史来源，见[旧任务说明](analysis/history/task-details-before-constitution-7.md#t012)及下方原执行证据；FR-050已将MCP内容生成后置，不能据旧要求扩围实现，也不能把空目录记作MCP消费兼容通过。其余正式来源、投影、附件及版本验收保持。

**依据**：FR-001～006/008/025；contracts/distribution。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t012)。

**2026-11-09 局部执行证据**：[默认构建与预检](analysis/acceptance/build-and-preflight.md)。通用导出已接入默认 Vite，复用正式 Release 与 MVU-A 投影，声明名规范目录、完整附件/引用式依赖/项目前提及写前输出路径检查均已验证。初轮默认 build 通过，当时开发清单只选三项稳定技能；该数量为阶段事实，当前默认选择以 release.json 和后续在线来源记录为准，完整 dist 仍保留全部线下来源。主线 artifact-spec-analysis 仍缺、退役清理及 T073/T074 尚未移交，本项完整集合验收继续未完成；不将受控三分类样本或稳定技能抵扣。

**本次重规划衔接**：新基础构建及Release内部重写由T067～T070承担，本项继续负责完整正式分类、workflow/当前映射和真实附件的默认构建接线与整体验收，不重复建立第二构建器；旧通用局部证据保留，不自动通过。

### T013

- [ ] T013 **撤出本期（主线官方skills安装）** [US1] 实现官方安装前只读选择和冲突检查，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**当前范围**：本项是主线官方skills专属任务，按[本轮范围纠正](requirements/raw/2026-11-12-main-curl-only.md)撤出本期执行、依赖及结案条件；原ID、未完成状态及下方历史定义/局部证据保留，不记作通过。紧急版不受影响。

**以下为历史定义与已有证据，不作为当前开工要求。**

**依赖**：T012。

**范围**：完善官方安装前的全参数、来源、选择及冲突只读预检，使用同次在线解析的官方规则；raw 到 tree 的建议须绑定同仓库同完整发布 SHA，预检不安装、不写目标。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：US1输入测试通过；目标树前后摘要一致，--list来源正确，已有内容冲突不输出可执行安装建议；静态错误退出2；分别覆盖缺version、两种来源均缺失、两种来源同时提供及版本不匹配，均退出2且目标零写入；version加单一合法来源才进入选择核验；在线获取/完整性/规则布局失败目标零写入且无可执行建议，报告 upstream.version/integrity 与建议 CLI 同版；只验证所选 agent/scope，不冻结数量。 增补 raw→tree 的正反例、错仓库/错 SHA/滚动 ref 拒绝和目标零写入；真实克隆/安装由 T062/T032/T038 留证，本地转换通过不等于远端通过。

**依据**：FR-005～011/017；contracts/install；data-model InstallRequest。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t013)。

**2026-11-09 局部执行证据**：[默认构建与预检](analysis/acceptance/build-and-preflight.md)。两平台已增加只读官方预检；初轮 Linux/Bash 标准 US1 66/66，后续[在线来源及目录移除](analysis/acceptance/online-agent-source.md)合并结果为 72/72；通过原红灯及后续新增场景，79 项目/77 全局目标及两项拒绝、版本/来源错误、依赖、identity/Eve 和内容/链接/已跟踪冲突均覆盖。实际默认构建副本预检退出 0、目标无新增、安装阶段 not-run。完整新来源的 T012 前置仍保留，本项暂不提前勾选；PowerShell 与未测平台范围以证据最终记录为准，不冒认完整矩阵或真实远端通过。

**2026-11-09 PowerShell 续接**：[完整只读预检结果](analysis/acceptance/online-agent-source.md#powershell-完整只读预检续接)。Linux PowerShell 7.4.6 全套 13 项，12 pass、0 fail、1 jq 不适用 skip；包含本次官方 1.7.6 受控来源的历史校准表 79 项目/77 全局及两项拒绝、全部选择/错误/依赖/投影/冲突、代表环境路径和 Git 祖先保护。完整消费树零写入，未发现需修改产品代码的失败；本项及 T012 的完整同版来源前置仍未满足，checkbox 和 11/44 进度保持。此结果不代表 Windows 或未来 latest 全矩阵。

### T014

- [ ] T014 **撤出本期（主线官方skills安装）** [US1] 交付官方四粒度说明和两步入口边界，落点 `packages/skills/README.md`。

**当前范围**：本项是主线官方skills专属任务，按[本轮范围纠正](requirements/raw/2026-11-12-main-curl-only.md)撤出本期执行、依赖及结案条件；原ID、未完成状态及下方历史定义/局部证据保留，不记作通过。紧急版不受影响。

**以下为历史定义与已有证据，不作为当前开工要求。**

**依赖**：T013。

**范围**：说明官方四粒度选择、只读预检与原生安装、显式第二步及同版唯一 Node 入口；仅展示当前 Increment 与适用 hooks，未知公开地址明确待赋值。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：逐例核对四粒度命令，未把官方--all当技能全选，未给官方添加本包参数；Markdown ESLint通过。

**依据**：FR-006/009/017/024；US1可独立使用文档。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t014)。

### T015

- [ ] T015 **撤出本期（主线官方skills安装）** [US1] 验收官方完整目录交付MVP，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us1.md`。

**当前范围**：本项是主线官方skills专属任务，按[本轮范围纠正](requirements/raw/2026-11-12-main-curl-only.md)撤出本期执行、依赖及结案条件；原ID、未完成状态及下方历史定义/局部证据保留，不记作通过。紧急版不受影响。

**以下为历史定义与已有证据，不作为当前开工要求。**

**依赖**：T014。

**范围**：在独立消费目标验收官方完整目录交付 MVP、附件与未选内容保护；本地结果不抵扣真实公开来源或最终矩阵。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --story US1；完整率100%、未选新增0、已有其他技能不变；目标包最低检查通过。全矩阵最终由T038统一核验，本地MVP不冒充公开发布。

**依据**：US1；SC-001～003；MVP检查点。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t015)。

## Phase 6：US2，下载安装与恢复前置（P1）

保持原安装链；为真实挂载提供本次完整成功集合和报告。

### T016

- [ ] T016 [US2] 补齐下载入口、冲突与恢复测试，落点 `packages/skills/tests/distribution/install-contract.test.mjs`。

**依赖**：T012。

**范围**：建立下载、冲突、完整性和中断恢复的输入及故障断言，保护可比对的用户夹具；先记录尚未实现行为的实际失败。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --story US2；记录各未实现断言红灯，保证原用户fixture可比对。

**依据**：US2；FR-007/009～011/022/023。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t016)。

### T017

- [ ] T017 [US2] 完善同版本材料下载和完整性校验，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T016。

**范围**：完善显式同版本材料下载、来源互斥、HTTPS 与摘要/路径核验，网络故障不留下残缺提交；本地目录证据与远端下载分开。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：US2网络故障夹具无残缺提交；source与source-dir互斥；版本不符、越界和非HTTPS均拒绝；不能从本地source-dir结果声称远端通过。

**依据**：FR-010/011/018；contracts/install内容获取。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t017)。

### T018

- [ ] T018 [US2] 实现归属收据与安全逐技能提交，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T017。

**范围**：完善根外归属收据、同版重验、逐技能安全提交及部分失败结果，保护未知、编辑、跟踪和不同版内容；下游仅消费完整成功集合。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：US2重复两次不重复写入，未知/不同版/用户编辑/跟踪目标保持哈希；部分提交后故障仍列出完整成功、失败及未执行，只有完整集合向下传。

**依据**：FR-011/022；data-model InstallReceipt与状态机。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t018)。

### T019

- [ ] T019 [US2] 交付Bash与PowerShell安装四件套，落点 `packages/skills/script/install-skills/install-skills.sh`。

**依赖**：T018。

**范围**：交付 Bash/PowerShell 安装四件套，并按实际平台和工具记录独立调用结果；缺少运行时保留未验边界。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：node --test packages/skills/tests/distribution/test-install-skills.mjs；三平台分别记录实际 shell 与所需工具版本，本包已确定的 Node 基线单独记录；缺pwsh记skip而非Windows通过。

**依据**：FR-009/021/023；scripts/dev/actions/link-skills四件套惯例。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t019)。

### T020

- [ ] T020 [US2] 实现阶段报告、退出码与续接提示，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T019。

**范围**：完善安装、隐匿、hooks、commands 的分阶段结果、退出码与续接信息，准确保留已发生事实，不把部分成功改写为整体通过。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：US2报告逐项匹配实际树，stdout可单独JSON解析；主线双平台安装及其写入前检查均断言 upstream 的四个字段与本次实际包一致，后续调用重新解析而不复用旧版本；模拟后置失败overall为partial；无请求后续步骤标skipped，未轮到标not-run，不用同一成功布尔值概括。

**依据**：FR-022；data-model RunReport；contracts/install返回。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t020)。

### T021

- [ ] T021 [US2] 验收curl内容完整性与安装恢复，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us2.md`。

**依赖**：T020。

**范围**：以同发布源和scope核对curl安装结果与清单/候选的完整文件、四种选择、冲突与重试恢复，纯安装独立验收并记录三平台及本地/远端适用范围，不替代后续挂载及完整矩阵。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --story US2；相同agent投影差异0，失败场景部分成功误报0，所有既有用户文件保留；最低工程检查通过。

**依据**：US2；SC-002/003/006/007。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t021)。

## Phase 7：最后实现真实 Spec Kit 挂载（P1）

对应MVU-003；Actions配置实现后接替临时占位，复验仅Increment、所选hooks、迁移保护及实际加载。

### T006

- [ ] T006 [US3] 验证 MVU-D：仅 Increment、实施准备加载及旧入口受管迁移，落点 `packages/skills/tests/distribution/mvu-d.mjs`。

**依赖**：T005、T041、T070、T059；先完成 Actions 配置及隔离验证，再以真实调用替换原生临时占位；外部须有主线正式同版Increment、实施准备、分析/结案配置、注册器及实际消费契约；不要求三暂停来源。

**范围**：验证 D-MOUNT/D-PREP：隔离核验旧三/四/五入口迁为单 Increment、未知用户内容调用前保护、同版准备正文/附件/声明完整加载及 hooks 失败后的停止；通过后复用同一骨架。

**约束**：不修改当前真实项目或用户目录、不伪造宿主加载、不手写 registry/生成入口、不新增模式别名/Implement 包装或自有 YAML 合并；不自动移动/删除未知附件，不引入永久指纹/所有权服务，不以旧四项/七 hooks 或模拟 CLI 正常输出来抵扣实际官方操作。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --mvu D；旧三暂停/退役活动入口残留和两次重试复活均为0，Increment 可用，核心入口、无关扩展及用户哨兵完整率100%。未知内容/缺件/错版反例在官方调用前失败且目标零写入；hooks 失败后命令调用0。准备正文、附件和 hook 与同次 Release/投影对应，官方注册及实际完整加载分别有证据。来源未交付、无宿主或平台缺失保持未验，不能因命令文件存在通过。

**依据**：plan D-MOUNT/D-PREP；MVU-003 与原技术 MVU-D；FR-019～022/028～030/045～047、SC-005～007/010/018；quickstart D、contracts/mount 及主线正式注册契约。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t006)。

### T022

- [ ] T022 [US3] 补齐挂载范围、前置条件及原生冲突测试，落点 `packages/skills/tests/distribution/mount-contract.test.mjs`。

**依赖**：T021、T006；D-MOUNT/D-PREP 的正式同版来源与必要风险验证通过后再扩产品契约。

**范围**：补齐仅 Increment、所选准备/分析/结案 hooks、旧入口迁移及未知内容保护的正式挂载断言；三暂停模式不入本期必需集合。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --story US3；全部负例命中明确缺项/未接通点，未知内容保持，未选/暂停来源不被补装；实际官方与宿主结果不由模拟 exit0 代替。

**依据**：US3；FR-016～023/027～030/045～047；SC-005～007/010/018；contracts/mount 与 quickstart D。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t022)。

### T023

- [ ] T023 [US3] 实现本次集合与统一挂载环境核验，落点 `packages/skills/script/mount-entry/mount-entry.{sh,ps1}`。

**依赖**：T022。

**范围**：按实际安装根与完整成功集合核验所选挂载来源、版本、附件及冲突，明确全局目标项目与非 Spec Kit 分支；首个官方调用前发现问题须停止受影响挂载。按真实同版来源接替临时原生占位，保留既有安装事实/文件核验，不把旧 unsupported 分支视为产品完成。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：US3 核验用例通过：错版/缺件/default不符、未知附件/登记不明均在受影响原生写调用前失败，目标树与用户内容不变；global缺project保留安装事实，projectPrerequisites缺失给具体条件。缺三暂停来源不属于 missingSelection/missingFiles，loadEvidence缺失不报告加载通过。

**依据**：FR-018/019/023/030/045/047；data-model VerifiedSkill/MountTarget/PreparationDelivery/ManagedMigration；contracts/mount 保护边界。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t023)。

### T024

- [ ] T024 [US3] 对齐所选准备/分析/结案映射与 Increment 输入，落点 `packages/skills/script/mount-entry/mount-entry.sh`。

**依赖**：T022、T023；与 T023 共改 mount-entry，必须串行。主线已正式移交三个所选来源的同版正文、配置及实际附件，未交付不本地代造。

**范围**：对齐本次所选准备/分析/结案事件映射和单 Increment modes 输入，按同版正文、附件与实际配置准备临时来源；移除旧四项补齐和退役有效映射，不包装 Implement 或增加 after_increment。

**约束**：不擅自修改三个主线 skill/hook 的讨论与执行规则，不引入三暂停来源依赖、额外命令、公开子命令、包根 extension.yml、固定 extensions、mounts.json 或替代状态；不手改 dist。

**整体验收**：packages/skills/tests/distribution/mount-mapping.test.mjs 通过；事件/extensionId取实际同版技能配置，正文及必需附件完整进入发布/安装投影；hooks-only provides:{}且不生附加命令；仅所选 Increment 完整即构造输入，无三暂停来源不阻塞，无 Increment 则 commands=skipped，自身缺项则 failed，未选技能不补入。

**依据**：FR-020/021/028/029/045/047；data-model MountMapping/PreparationDelivery；contracts/mount 当前表与主线同版注册契约。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t024)。

### T025

- [ ] T025 [US3] 完善独立 hook 平台安装及官方重装，落点 `packages/skills/script/register-hooks/register-hooks.sh`。

**依赖**：T023、T024。

**范围**：复用同一 hooks-only 平台实现，完整预检所选正文/附件/配置后逐技能官方强制重装并读回，保护未知内容及已发生事实；hooks 失败停止后续命令，不恢复 YAML 合并或跳过逻辑。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：node --test packages/skills/tests/test-register-hooks.mjs；适用 Python 回归按包现有入口执行并记录。所选配置变化反映下次官方输入，缺件/错版/未知内容零破坏性调用；仅选准备可完成适用注册且不要求其他未选来源，所选无关扩展语义不变，重复无多余条目，构建不含 definitions；宿主实际完整加载仍在 T028 单独留证。

**依据**：FR-019～022/029/030/045/047；D-PREP；contracts/mount hooks-only 与官方重装规则。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t025)。

### T026

- [ ] T026 [US3] 消费仅 Increment 的双平台注册器并验证旧入口迁移，落点 `packages/skills/script/register-commands/register-commands.sh`。

**依赖**：T025。

**范围**：消费主线正式移交的双平台 modes/Increment 注册器，按所选版本强制重装仅 Increment 并清理临时材料；旧入口迁移及重试复用已验骨架，来源仍为四项时先报告移交缺口，不另造注册器。

**约束**：不重写主线技能业务、不新增别名/实施引擎/第五入口，不让三个暂停来源成为前置，不手写 registry/生成文件，不使用指纹、旧modes等价跳过或整目录prune，不为恢复未知内容擅自移动用户文件。

**整体验收**：node --test packages/skills/tests/test-register-commands.mjs；适用包 Python 测试记录真实版本。单选 Increment 且缺三个暂停来源可正常官方重装，连续两次重试无重复/复活，源更新/缺入口刷新；旧暂停及退役活动入口残留0，未知用户附件触发受影响调用前停止，核心及无关内容不变；独立脚本与源同版，成功失败均清理本次临时输入。

**依据**：FR-020～022/025/028/030/046/047；D-MOUNT；contracts/mount 当前入口与未知内容保护。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t026)。

### T027

- [ ] T027 [US3] 接通公共入口、curl安装及自动挂载，落点 `packages/skills/script/mount-entry/mount-entry.sh`。

**依赖**：T026；复用 T006/T023 的保护骨架、T024/T025 的正式所选配置及 T019/T020 已验安装/报告，不跳过 D-MOUNT/D-PREP。

**范围**：完成 D-CHAIN 的公共入口、curl安装后的自动挂载，核验本次完整成功集合后先 hooks 再 Increment；替换构建阶段的临时原生占位并复验纯安装/失败传播，随后同步内部 link-skills 的同源顺序与失败阻断，不复活暂停模式或把 Node 扩为安装核心。

**约束**：不执行当前工作区真实postinstall或用户目录迁移，不恢复主线官方skills安装入口，不写项目级工作流路由，不修改其他workspace或主线讨论规则，不在安装/加载检查中实际发起业务实现，不扩大--no-mount或未选来源的写入范围。

**整体验收**：node --test packages/skills/tests/distribution/test-mount-entry.mjs；node --test scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs。独立产物经唯一Node入口在不同shell平台按同集合/同版本得到相同适用结果；仅Increment/缺三暂停来源成功、关闭和历史workflow不触发、global无project保留installation成功但挂载失败、hooks失败commands未执行。工作区自有夹具副本验证前置失败不注册命令，重试不复活；未实现平台/宿主结果单列，不能用模拟原生成功替代T028实际验收。

**依据**：D-CHAIN；FR-016～023/028/030/045～047；data-model MountResult/RunReport；contracts/install、mount；实际 nuxt-prepare 调用链。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t027)。

### T028

- [ ] T028 [US3] 验收三平台 Increment、准备加载及迁移消费，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us3.md`。

**依赖**：T027。

**范围**：三平台独立验收仅 Increment、适用 hooks、迁移保护和完整加载；真实行为、安装、登记与加载分别留证，不能用 Linux 或旧集合结果替代。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --story US3；三平台逐项核验SC-005/010/018：所选完整率与同版一致率100%，旧暂停/退役活动入口残留0且重试不复活，未知内容/无关扩展保留100%，hook失败命令调用0。缺正文/附件/声明/错版均明确失败，官方注册和完整宿主加载有独立证据；加载不抵扣主线讨论/逐Task门禁，未测组合逐条留限制。

**依据**：US3；FR-020/022/027～030/045～047、SC-005～007/010/018；D-MOUNT/D-PREP/D-CHAIN 与 quickstart D。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t028)。

## Phase 8：US5，完整发布材料（P1）

真实安装挂载具备后汇合完整材料，保留原发布契约和文档验收。

### T029

- [ ] T029 [US5] 补齐发布可复现与搬离源码的验收测试，落点 `packages/skills/tests/distribution/release-contract.test.mjs`。

**依赖**：T027、T055、T071；安装挂载链和新候选/收据骨架已具备，再补完整发布契约与材料，不等待T028全平台验收。

**范围**：建立发布校验与材料断言，覆盖白名单、完整工具、README/许可、附件和两种来源；开发缺项不得产生可发布结论。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --story US5；错误引用/缺工具/内容漂移的反例必须失败。

**依据**：US5；FR-001/002/024/025；contracts/distribution。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t029)。

### T030

- [ ] T030 [P] [US5] 完善发布前校验和完整迁移产物，落点 `packages/skills/build/distribution/verify.ts`。

**依赖**：T029。

**范围**：完成完整发布材料及严格发布校验，获准集合、运行工具、必要附件和许可齐备后才通过；开发构建与完整发布分别判断。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：US5校验器及构建/搬离测试使用本任务独立沙箱中的固定输入快照，来源与许可证可追溯，不在并行期间读取T031正在编辑的README；副本在无monorepo环境运行，缺文件时完整发布校验失败而不产出“可发布”结论；删除任一工具、README、许可证或必要附件，完整发布校验必须失败。

**依据**：FR-001～004/010/024/025；Release不可变约束。 FR-038/040、data-model ReleaseCandidate；contracts/pipeline。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t030)。

**本次重规划衔接**：完整发布校验须消费新BuildVerification、内容索引和平台收据接口；Foundry本地完整内容验证与迁后真实ready分开，不能把允许完整dist的核验当严格payload核验。

### T031

- [ ] T031 [P] [US5] 完善维护者迁移与外部使用文档，落点 `packages/skills/README.md`。

**依赖**：T029。

**范围**：完善维护者直接迁移源码及外部使用说明，列依赖/配置/CI 调整、两阶段发布、固定来源赋值与两 URL 边界；示例只采用当前有效模式与 hooks。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：与contracts/quickstart逐项核对命令和最终路径；无未说明占位、无假兼容承诺；Markdown ESLint通过。

**依据**：FR-002/009/024/025；US5迁移交付边界。 FR-037～044、SC-014～017；contracts/pipeline。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t031)。

**本次重规划衔接**：同步节点用途、输入/返回、失败阶段、两种固定来源和独立平台收据的说明；运行入口仍只有node script/index.mjs，不把工程CI模式写成终端用户子命令。

## Phase 9：US4，可选精确隐匿（P2）

原可选便利功能范围及最终验收保持，不把它插为构建/Actions开发前置。

### T033

- [ ] T033 [US4] 补齐精确隐匿与范围限制测试，落点 `packages/skills/tests/distribution/hidden-contract.test.mjs`。

**依赖**：T028、T007；隐匿边界验证通过后才填充依赖业务。

**范围**：建立精确隐匿及范围故障矩阵，覆盖开关、Git 边界、全局/项目、共享配置、特殊路径、权限和重试；先记录缺失正式行为。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --story US4；输入矩阵覆盖SC-004，未选路径保持可见的断言先建立。

**依据**：US4；FR-012～015；contracts/mount本地隐匿。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t033)。

### T034

- [ ] T034 [US4] 实现精确exclude写入与效果核验，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T033。

**范围**：只对本次成功内容在项目内的独占精确路径追加去重 exclude，并用原生 Git 核验；共享配置与项目外路径明确限制，跟踪冲突拒绝。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：US4真实Git用例通过；check-ignore来源/ls-files/status一致，父仓库排除文件和未选路径前后不变，共享配置不整文件隐藏。

**依据**：FR-012～015；data-model ExcludeItem。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t034)。

### T035

- [ ] T035 [US4] 接入安装前后隐匿结果与限制说明，落点 `packages/skills/script/install-skills/install-skills.{sh,ps1}`。

**依赖**：T031、T034。

**范围**：仅 curl 接通安装前后独占路径的独立 hidden 阶段，保留适用挂载及已安装事实；完善全局边界、失败续接与使用说明。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：US4集成测试证明hidden失败而hooks可成功，overall非全成功；hidden关闭无排除写入，重复两次不追加重复条目，未请求hidden时不写排除规则。

**依据**：FR-012～015/022；contracts/install阶段组合。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t035)。

### T036

- [ ] T036 [US4] 验收Git隐匿的独立用户流程，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us4.md`。

**依赖**：T035。

**范围**：三平台验收安装器完整隐匿流程及故障恢复，记录实际命中来源、可见差异、原规则保护和全局限制。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --story US4；误隐藏和原规则丢失数0，同版重试无重复，SC-004/006/007全部符合。

**依据**：US4；P2独立验收检查点。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t036)。

## Phase 10：US6，真实 Increment 规划与反馈（P1，交付后置）

保留用户真实反馈及分析能力移交条件，不制造本轮专项通过。

### T052

- [ ] T052 [US6] 验收真实 Increment 规划、反馈及分析刷新，落点 `specs/skills/001-skills-distribution/analysis/acceptance/increment-behavior.md`。

**依赖**：主线当前正式同版 Increment/分析能力和消费契约实际移交及用户可实际反馈的分发业务目标；原 T075/E1 仅历史定位。没有本 Spec 全矩阵或公开发布前置，不要求 Task 定位参数。

**范围**：按本 Spec 或真实业务描述验收 Increment 规划、真实反馈修订与同一分析技能刷新，缺材料与恢复分支独立验证；不模拟批准或把本轮整理计为行为通过。

**约束**：不伪造用户反馈、阶段批准或状态转换；不把本次规划当成工程完成；不自动改变主线 Task checkbox，不修改无关任务目标/验收，不代建分析生成器或 after_increment。

**整体验收**：至少一条按当前Spec/业务描述进入的真实规划流程含用户反馈后修订与同一分析刷新；原ID/目标/验收/完成事实/证据保留100%，重复无新增，正文/依赖/导航一致；两类缺材料分支、五状态/恢复有真实证据，误报通过及错误下游推进0。安装、规划行为、准备加载和批准分别记账，不用AI模拟反馈。

**依据**：当前FR-026/027/031/034～036、SC-011/013、US6、MVU-006；主线当前真实Increment反馈和分析刷新职责，三暂停模式不在范围。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t052)。

## Phase 11：完整消费、本地矩阵与可迁移交付验收

对应MVU-005本地部分；T060在真实挂载和完整回归之后，不阻塞前两阶段的开发。

### T063

- [ ] T063 实现完整矩阵测试入口与发布前本地覆盖，落点 `packages/skills/tests/distribution/matrix.mjs`。

**依赖**：T021、T028、T030、T036、T059；复用已验安装、挂载、发布校验、隐匿及 CI 接线，不依赖 T037/T038 或真实公开来源。不得为了接入矩阵而将 T038 反向设为 T037 前置。

**范围**：补齐默认 full 矩阵的真实入口及三平台同身份汇总，按动态 Agent 清单枚举全部组合；缺平台、重复组合、错身份或必需失败/skip 阻止完整候选，挂载仅覆盖当前有效集合。

**约束**：不运行真实用户目录安装，不修改产品每次在线解析 latest 的约定；不冻结旧 79/77/35/3744，不缩减三平台或以样本替代全部组合；不删除 full 场景、不用占位脚本或必需 skip 令默认回归变绿，不创建真实远端或执行发布。

**整体验收**：`pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --matrix full --source local` 通过既有分发器实际调起 matrix.mjs；三平台证据集合精确等于本次枚举矩阵，附件完整率 100%、未选新增 0、用户内容及无关配置保留 100%。上述身份/覆盖/缺环境反例均非零；缺任何必需平台或实际调用保持未验，不通过本 Task/T037 完整候选门禁。本 Task 的实现和本地覆盖不得抵扣 T038 的真实公开来源矩阵。

**依据**：FR-004/005/009/021～025/037～040；SC-001～007/009/014/015；plan 支持矩阵和候选门禁；contracts/compatibility 与 quickstart 完整验收。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t063)。

**本次重规划衔接**：分平台汇总继续核对新源码、文件摘要与工具身份，发布候选使用同一BuildVerification及索引规范；缺必需平台仍拒绝，不因共同优先而缩小矩阵。

### T008

- [ ] T008 验证MVU-F：单次构建独立交付与范围内消费，落点 `packages/skills/tests/distribution/mvu-f.mjs`。

**依赖**：T003、T004、T006、T007、T012、T027、T070；在新构建与保留消费者的相同骨架补原完整范围，不用旧T051或T070局部结果替代。

**范围**：沿同一单次构建骨架验证独立副本、双构建摘要、MCP 与线下分离、唯一 Node 入口及四类内部模块和原消费者保护；缺声明输入不得占位成功。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --mvu F；两次有效文件摘要相同、隔离副本可用；包lint/check-types/build/test、MCP registry、link-skills沙箱及已有模式保护均记录结果，未知差异不得通过；唯一 Node 入口及四类内部平台职责均能独立启动并执行各自已验证场景；删除任一声明输入后构建明确失败；未完成的文档/功能列为开发缺项，不返回可发布结论。

**依据**：MVU-F（C3/C4）；FR-002/024/025；quickstart F。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t008)。

### T037

- [ ] T037 运行完整工程检查和原消费者回归，落点 `specs/skills/001-skills-distribution/analysis/acceptance/regression.md`。

**依赖**：T008、T030、T031、T036、T059、T063；包含已实现完整矩阵入口、工程驱动与 workflow 的范围回归，T060/T038 不作为本任务前置，避免候选/远端验收循环。

**范围**：执行完整工程与原消费者回归，按同源码/依赖/文件身份消费全量本地矩阵并固定候选；任何发布字节变化使相关候选与验收失效，迁后须按新身份再验。

**约束**：不运行不存在的根pnpm test；不为使测试通过修改旧消费契约或跳过必要平台。

**整体验收**：pnpm --filter @foundry/skills run lint；pnpm --filter @foundry/skills run check-types；pnpm --filter @foundry/skills run build；pnpm --filter @foundry/skills run test；pnpm --filter @foundry/skills run test:distribution；其中默认 full 场景复用 T063 的同源码/文件身份本地全矩阵，另显式核对 `test:distribution -- --matrix full --source local` 的逐组合覆盖；node --test scripts/dev/actions/link-skills/test-link-skills.mjs；所有当前范围必需项真实通过才勾选。追加 pipeline-contract.test.mjs、两种布局驱动与配置导出范围；本地完整候选不得含 development 或必需 failed/not-run/缺环境 skip。

**MCP回归适用边界（2026-11-12）**：遵循FR-025/050及plan当前范围，当前只核对保留空mcp和实际受影响消费者，不将新生成manifest作为本项硬前置。保留[原MCP只读命令及恢复条件](quickstart.md#mcp只读回归t037)、既有测试和历史证据；若当前包检查或相关消费者失败，仍须报告并阻断其依赖结果，不删断言求绿。新构建清单与registry的正向消费待正式内容规则、生产者及适用契约明确后再验，当前单列后置/未验，不以空目录、旧夹具或环境变量换路径记作兼容通过，也不扩围修复apps/mcp。

**依据**：FR-025；SC-009；宪章IV。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t037)。

**本次重规划衔接**：对新构建、驱动与workflow做完整本地回归并固定内容身份；不伪造真实artifact/run或把Foundry isolated材料标为正式ready。正式平台绑定与新源码候选由T061重验。

### T060

- [ ] T060 [US7] 验收可迁移流水线与当前版本本地交付，落点 `specs/skills/001-skills-distribution/analysis/acceptance/pipeline-local.md`。

**依赖**：T037、T059；真实挂载及矩阵验收后，T037 固定包含完整技能与安装/挂载能力的本地候选，不等待 T052 真实规划反馈，T053/三暂停专项不在本期前置。

**范围**：按固定完整候选复验本地流水线及故障矩阵，列清用户直接迁移源码、依赖与配置的调整项；本地交付与迁后平台、发布及独立用户验收分别判断。

**约束**：不自动迁移公开仓库、不写真实用户目录或触发发布，不用重新标签把 isolated 变 ready，不把历史失败无复验地宣称已修复。

**整体验收**：同一 pipeline-contract.test.mjs 和 run.mjs 的真实输出、本地必需检查、公开字节一致性及故障矩阵均可追溯；直接迁移范围和调整项明确，迁移前真实公开写入 0。必需未验不算通过；仅报告此任务范围通过，远端和独立用户条件清晰保留。

**依据**：US7 场景 2/3/5/6/8/10；FR-037～044；SC-014～017 的本地部分；MVU-005 本地交付与总体结案分离。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t060)。

**本次重规划衔接**：汇总新构建、Actions检查、严格候选、平台收据逻辑与隔离Git的实际证据及未验边界；包含T064存档与文件级重做范围。真实上传/发布和远端总体条件不由本地交付抵扣。

## Phase 12：迁后平台、真实发布及唯一末尾收尾

须用户迁移、真实平台和逐次精确发布授权；原独立用户/旧版本/支持矩阵与总体条件保持。

### T061

- [ ] T061 [US7] 核验迁后工程与真实平台候选前置，落点 `specs/skills/001-skills-distribution/analysis/acceptance/pipeline-remote.md`。

**依赖**：T060、T071；另需用户明确授权并完成源码迁移、真实独立公开仓库/默认分支及可读平台记录；缺实际条件保持待办。

**范围**：在真实新仓库按迁后源码身份独立检查、双构建并准备新候选，核对默认分支、权限、实际归档生命周期及拒绝场景；不沿用 Foundry 候选身份。

**约束**：不擅自创建远端、迁移、改平台变量/凭据或触发写权限发布；不执行候选代码取得写权限，不用本地 YAML 或 bare Git 结果抵扣真实平台，不把缺输入记录为通过。

**整体验收**：真实默认分支 Actions 成功检查与对应新候选文件/摘要可读；迁后独立构建无 Foundry 依赖；真实权限、来源身份和拒绝场景均有日志，未授权/错候选零发布。必需平台前置未验不得推进 T062；本项不声明已真实发布或 SC-016 整体通过。

**依据**：FR-037～040/043；SC-014～016；plan 第四组 C2/C4 前置；data-model ReleaseCandidate/PublishRequest。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t061)。

**本次重规划衔接**：在迁后实际新源码/依赖快照上重做检查、两次构建、真实上传与两ID收据核验，并实际拒绝错attempt/过期/摘要与权限反例；不沿用Foundry合成记录，不以隔离BIND通过抵扣真实平台前置。

### T062

- [ ] T062 [US7] 在获授权的独立仓库首次发布并核对固定来源，落点 `specs/skills/001-skills-distribution/analysis/acceptance/pipeline-remote.md`。

**依赖**：T061；另需维护者对指定version/sourceRevision/runId/runAttempt/payloadArtifactId/receiptArtifactId/catalogDigest/contentIndexDigest/candidateDigest和同仓库目标的真实手动发布授权与短期凭据。

**范围**：按获授权的迁后精确候选首次发布，核对唯一新 ref、源码与发布 SHA、同仓库同 SHA 的 raw/tree 来源及curl入口实际消费；不抵扣独立用户或真实历史旧版条件。

**约束**：未获本次实际授权不触发；不在 Foundry 真实发布、不跨仓库、不扩大凭据权限、不 force/移动/删除旧 tag，不修改候选或伪造远端核验、真实旧版及用户反馈。

**整体验收**：真实 Actions run/attempt、授权请求、唯一新 ref、完整发布 SHA 及全部远端文件摘要一致；curl入口同身份实际安装/适用挂载结果可追溯，发布/远端验证/独立用户验收分别报告。真实故障若未发生不伪造，故障保护引用 T056 的适用证据；SC-016/017 的整体核对仍保留 T032/T038/T040 的原条件。无完整远端核验，或缺少首次发布必需的 T056 隔离恢复证据时，本 Task 保持未完成；若已有真实旧公开版本，还须记录其固定来源恢复结果。首次无真实旧版本只允许判断本 Task 的首次发布范围，SC-017 的真实历史条件在 T038 继续待验，不提前完成 T038/T040。

**依据**：FR-039～044；SC-015～017；US7 场景 4～10；data-model Publication/PipelineRun。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t062)。

**本次重规划衔接**：两个归档ID均由真实上传产生并与可信API交叉核对；仅发布既有完整payload，不编辑索引或公开字节补齐字段。固定来源全文件及原curl入口/适用挂载验收保持。

### T032

- [ ] T032 [US5] 在真实公开来源完成独立使用者验收，落点 `specs/skills/001-skills-distribution/analysis/acceptance/us5-remote.md`。

**依赖**：T030、T031、T037、T062；迁后实际公开版本与对应新候选均已核验，并有真实独立使用者。

**范围**：在迁后已核验的真实发布来源，由未参与开发的使用者仅按交付 README 完成操作并给出真实理解反馈；根外记录来源，不修改已固定发布字节。

**约束**：不创建远端仓库、不推送/发布/部署、不代写用户反馈，不自动补授权。

**整体验收**：记录真实URL/commit、固定版本、用户操作、实际文件和理解反馈；满足SC-008。远端全矩阵归T038，本任务不是发布授权；未执行不勾选；独立使用者记录所读README摘要与候选相同；来源说明无未赋值参数，远端全部文件摘要相同；不产生发布物修改。

**依据**：US5；FR-002/024；SC-008/009。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t032)。

### T038

- [ ] T038 完成三平台全agent矩阵及真实远端复验，落点 `specs/skills/001-skills-distribution/analysis/acceptance/matrix.md`。

**依赖**：T032、T037、T062；使用迁后实际发布对应的新候选，不把 Foundry 旧候选身份套到新仓库。

**范围**：复用完整入口执行三平台全 Agent 的本地与真实远端矩阵，并承接 SC-017 真实旧完整版本固定来源恢复；首次无真实旧版时该条件继续未验，本 Task 不勾选。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：pnpm --filter @foundry/skills run test:distribution -- --matrix full --source local；同命令改为--source remote并附--release-source <真实固定提交HTTPS根URL>在来源就绪后执行；逐条有实际路径/摘要/版本/结果，附件率100%、技能未选新增0、安装目录修改及挂载无关配置保留100%，skip不得计pass。

**依据**：SC-001～007/009；contracts/compatibility；quickstart完整验收。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t038)。

### T039

- [ ] T039 同步最终文档、接口示例与图表，落点 `packages/skills/README.md`。

**依赖**：T038。

**范围**：按实际实现和证据同步文档、契约与图表，核对当前有效来源及暂停边界；固定候选内文档若变字节，须重建、按新版本获授权发布并重做相关验收。

**约束**：不改未列出的业务应用、原生受管配置或用户已有技能；不手改 dist。

**整体验收**：对实际修改Markdown执行pnpm exec eslint --fix并读回，链接有效；Mermaid实际解析/渲染结果有记录；最终示例版本与路径和产物一致，无被标为可运行的占位。

**依据**：FR-024；SC-008/009；artifact-logic-flow；宪章流程图条款。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t039)。

### T040

- [ ] T040 汇总交付证据、清理开发遗留并核对结案边界，落点 `specs/skills/001-skills-distribution/analysis/acceptance/distribution.md`。

**依赖**：T039、T052、T060、T062、T093；三暂停模式专项和历史 T053 不在当前前置；其他工程/平台/真实独立用户、发布与原总体批准条件保持，本任务仍为有效执行序列唯一末尾。紧急发布和SC-019不等待本任务或主线完整矩阵。

**范围**：作为唯一末尾汇总全部有效需求、工程/平台/真实用户和结案证据，逐项核查开发遗留用途后处置或保留；来源、历史旧版、授权或必要验收未满足不得结案。

**约束**：不自动完成主线或旧任务、不伪造学习/讨论/用户批准，不把暂停当通过或永久删除。不得凭一次无命中搜索删除、不因局部失效整文件清理，不清扫无关workspace，不夹带画像/秘密，不未经授权发布或迁移用户目录。

**整体验收**：覆盖表无有效遗漏或未验冒充通过，所有当前活动任务原验收和必要用户批准满足；三暂停模式/T053不入阻塞或通过条件。清理记录可追溯，必要工程/格式/引用检查通过，剩余用途不明项有保留依据；有应清理未处理项、保存/检查失败或引用受损时不能完成清理。清理通过不自动完成其他结案条件，不改主线checkbox或历史事实。

**依据**：当前FR-026～031/034～047、SC-009～011/013～018（暂停项排除）、contracts/pipeline与mount；宪章IV/VI/VII的证据、授权和末尾清理规则。

**实施方案**：尚未关联当前有效方案；准备要求见本文件固定约束。[旧规划参考](analysis/history/task-details-before-constitution-7.md#t040)。

**本次重规划衔接**：末尾同时核对本次构建替换留下的旧函数/插件/转导出/失效段落；结合调用点、测试和实际用途决定处置。保护archive字节、旧完成事实、原验收与保留消费者，禁止因“重做”整包清理。

**紧急增量收尾**：同时核对独立紧急工程测试/临时官方扩展、失效脚本/注释、重复材料和本Spec紧急记录中的开发遗留，按实际用途清理或保留并引用T093交付证据；不删除存档、正式公开版本、合法源码/许可或本仓库画像，不覆盖用户文件，不在发布后编辑既有payload。没有应清理项也记录核查依据；原总体结案前置未满足时保持待办，不以紧急交付通过自动结案。

## 依赖、门禁与实现策略

### 业务故事的汇合顺序

US7先完成构建与临时挂载占位，再实现GitHub Actions，US1在新构建兼容后补完整正式来源与内容MVP；US2再接完整安装，US3按正式同版移交验证挂载，US5在安装/挂载材料具备后补完整发布校验和说明。US4按其原依赖接入；完整本地矩阵与回归汇合后，US7验本地交付，再由用户迁移后验真实平台、授权发布、US5独立用户与远端矩阵。US6依真实主线移交和用户反馈后置，最终仅T040综合收尾。

故事分组不是虚构独立性：纯MCP/稳定内容及纯安装先行，构建通过后再接只读Actions；正式workflow完整候选依赖US1/US3、完整支持范围及发布门禁。T060/T061/T062等待这些真实前置时，继续其他已就绪任务，不重排成候选/远端互相依赖的环。

### 风险、信号与阻塞边

| 风险             | 前置验证及信号                                                                                              | 未通过阻断                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| BUILD，C3/C4     | T065先失败；T067/T068/T069补来源、生成与模型；T070真实双构建、缺件/链接/脏来源反例及磁盘复核                | 新候选、依赖新构建的完整安装和CI结果            |
| COMPAT，C3/C4    | T070用保留schema/curl入口/工作区/MCP消费者实际读新产物，未知平台单列                                        | T012/T006/T055/T008等真实消费者                 |
| CANDIDATE，C3/C4 | T055严格payload双向相等、身份和检查证据替换非零；复用T070双输出                                             | T071/T056及完整发布资格                         |
| BIND，C2/C4      | T071先验错run/attempt/ID/收据/有效期；T061用迁后真实API与上传输出实证                                       | 正式ready和真实发布；本地isolated仍不得冒认平台 |
| PUBLISH，C2/C3   | T056真实临时bare Git验证授权、竞争、断连与旧版保护，骨架保留                                                | T058/T059发布能力与后续真实发布                 |
| MOUNT，C2/C3/C4  | T006在构建与Actions配置交付后验正式同版正文/附件、未知用户内容保护、旧入口迁移与加载；T027/T028补链路和平台 | 对应完整workflow候选与最终矩阵                  |
| REMOTE，C2/C4    | T061迁后独立工程与真实平台，T062精确授权发布；T032/T038补用户/全矩阵和真实旧版                              | 真实发布和总体结案，不冻结无依赖本地工作        |

C1无新运行依赖；其余风险不满足同类已验、无新外部交互、既有检查兜底三项联合豁免。所有通过骨架保留增量填充；文档检索或模拟平台不抵扣真实工程/平台验收。

### 并行机会与共享文件

| 故事 | 前置满足后的机会或串行原因                                                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US7  | 当前T074→T075→T076→T077按用户要求串行；原T065/T067～T070构建及占位待对齐，再T066/T055/T071/T056/T058/T059接Actions；不再把T066/T067标为并行。共享构建/pipeline骨架按依赖串行 |
| US1  | T010/T011的旧[P]只留完成事实；主线T012完整内容及T016～T021的curl链按真实前置推进，T013～T015已撤出，不构成前置                                                               |
| US2  | 安装平台与收据/报告文件共享，T016～T021串行；独立Git实验仅在不竞争pipeline/配置/记录且前置就绪时可并行                                                                       |
| US3  | T023/T024共享mount-entry且显式串行；双平台不等于可以并发写同一输出或登记                                                                                                     |
| US5  | T029后T030[P]校验器与T031[P]README在固定输入和独立文件下并行；最终构建/汇总串行                                                                                              |
| US4  | 安装/排除共享文件且有依赖，T033～T036无同故事并行组                                                                                                                          |
| US6  | 真实用户反馈与证据串行，不能用代理模拟或三暂停模式补样本                                                                                                                     |

### MVP与增量交付

本次先验收MVU-008的构建与纯安装/占位结果（T065/T067～T070），再验MVU-009的Actions实现及隔离流程（T066/T055/T071/T056/T058/T059），最后在MVU-003取得真实挂载结果；前两段均不替代完整发布MVP。主线官方安装MVP的T015已撤出；当前完整内容由T012及curl的T016～T021按原职责验证，不能用局部构建或候选实验替代。

完整本地交付由T060汇总，迁后真实条件由T061/T062承担；SC-008独立使用者、原全矩阵、真实旧版恢复及T052实际规划反馈仍保留。每个实际开工Task先讨论自身方案；当前T072/T073已完成内容构建，先按T074～T077四项顺序拆分，脚本细节到T077讨论，MCP/发布范围仍需按用户方向核对，不按已停用方案直接推进T068或T055。

### 需求覆盖

| 需求/标准                                      | 任务覆盖                                                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| FR-001～011/023、SC-001～003/006/007           | T065/T067～T070重做基础，T012及T016～T021补完整来源与curl入口（T013～T015撤出），T063/T037本地矩阵，T062/T032/T038真实来源 |
| FR-012～015、SC-004/006/007                    | 原T007及T033～T036，保留实际未完成范围                                                                                     |
| FR-016～022/028～030、SC-005～007/010          | T006/T022～T028，同版移交、受管迁移及加载                                                                                  |
| FR-002/024/025、SC-008/009、MCP-BUILD-001～006 | T064～T070全部构建重做与保护；T008/T029～T032/T037～T040完整消费、材料和结案                                               |
| FR-026/027/031/034、SC-011/013                 | T052，主线按真实证据回填，不自动互勾                                                                                       |
| FR-032/033、SC-012（暂停）                     | T053原文及未完成事实保留，不在本期依赖                                                                                     |
| FR-035/036、治理与清理                         | T064/T030/T031/T039/T040及主线自身职责；不携带画像或重开旧身份                                                             |
| FR-037、SC-014                                 | T066构建后Actions、T067～T070构建、T058/T059完整接线、T060本地交付、T061独立工程                                           |
| FR-038/040、SC-014/015                         | T055内容索引与严格候选、T071平台绑定、T030/T037完整门禁，T061迁后新身份                                                    |
| FR-039/043、SC-015/016                         | T056隔离授权、T058/T059 guard、T061真实平台、T062精确候选手动授权                                                          |
| FR-041/044、SC-017                             | T056重试/并发/断连/隔离恢复，T062首次发布，T038真实旧版复验，T040不提前结案                                                |
| FR-042、SC-016/008                             | T062固定SHA全文件与curl入口/适用挂载，T032独立用户，T038全矩阵                                                             |
| FR-045～047、SC-018                            | T012/T006/T023～T028同版附件、hook与实际加载；T070/T063/T037/T038补新产物及平台范围                                        |

### 格式与状态核对

所有有效任务有唯一checkbox、稳定ID及明确路径；主线有效62项，其中18累计完成、44待办；T013～T015撤出但身份及未完成事实保留；另有16项紧急任务（本地12完成、迁后4待办），全功能有效78项、30完成、48待办（不计暂停T053及撤出T013～T015）。T067实现归档只保留历史，T072交付集合插件、T073补充工厂与清单配置，T074已建空工厂、T075已实现并接线目录职责，T076/T077按用户顺序继续待办；原T030/T031的[P]机会及暂停/撤回历史保持，不自动扩大到其他Task。

## 历史规划与已发生增量记录

**暂停范围（2026-11-10）**：T053 的 Tutor 实践与报告移出本期测试、移交和结案依赖；下方原任务全文及未完成 checkbox 保留历史，不作为当前待执行，也不标记通过。恢复须另有明确范围决定，不因其仍未勾选而自动补测。

### T053

- [ ] T053 [US6] 验收单 Task Tutor 实践、续接及共同草稿，落点 `specs/skills/001-skills-distribution/analysis/acceptance/tutor-behavior.md`。

**依赖**：主线 T075 的 E1 工程移交、用户指定的真实分发 Task 及该 Task 实施步骤的必要前置；不强制等待 T052 或本 Spec 最终分发完成。

1. **改动文件**：specs/skills/001-skills-distribution/tasks.md 中指定 Task 内联步骤及必要 mvu 引用；所选 Task 原授权代码范围；apps/personal-hub/content/blog/ 中共同稿件（按实际 schema/已有稿件确定精确路径后再写）。
2. **改动内容**：用户指定后读取同版 task-tutor、原工程 Task、plan/mvu 及实际证据；沿用闭环，缺闭环仅补指定 Task，其他 Task 只作依赖。用户写主要代码，AI 讲解提示检查，局部代写限实际请求并恢复分工；记录真实理解、失败和中断续接，不创建独立子任务。已有/缺闭环、缺 plan、范围不足及跨 Task 边界使用适用真实或独立材料核对。只将有价值的实际知识保存在 learning/<实际 Task ID>/ 并由 Task 引用；Task 结束后读取 personal-hub 实际文章格式，复用稿件并共同整理为 draft，不恢复 Review 双确认。
3. **改动禁区**：不默认代写主要代码、不模拟用户掌握、不扩大指定 Task、不自动发布、不将学习或文章完成当工程完成、不自动勾选主线；未指定样本前不创建虚构 learning 目录。
4. **新建文件**：specs/skills/001-skills-distribution/analysis/acceptance/tutor-behavior.md；learning/<实际 Task ID>/ 下有价值的知识片段及 blog 草稿（执行时据实际样本和 schema 记录精确路径，已有则复用）。
5. **写法约定**：同版 task-tutor、宪章 III/IV/VI/VII、目标代码相应项目技能及 blog schema；八栏目和原工程验收保留，Markdown 保存立即 ESLint 并读回。
6. **设计依据**：FR-026/027/032～036、SC-012/013、US6、MVU-007；主线 T077/T078 的实践与共同报告验收。
7. **验收信号**：至少一条真实 Tutor 流程有用户主要实现、实际反馈、局部代写后恢复分工及续接证据；单 Task 补齐边界、知识来源、用户理解或待巩固点可核查。文章按实际 schema 保存 status: draft，工程/学习/报告分别有结论，虚构掌握和跨 Task 越界为零，未发布；主线仅引用证据独立判断。
8. **风险与回退**：缺主线交付、指定样本、真实实践或共同写作时保留待验，不能以 AI 示例或测试补齐；保存失败按实际文件恢复，失败技术前置只阻断依赖步骤，不扩大授权。

### T054

**已撤回：自动导出独立工程骨架。** 原实验曾通过，见[历史证据](analysis/acceptance/pipeline-local.md)。2026-11-10 用户明确会直接迁移 skill、MCP 等源码，因此移除 project.mjs、专用 pipeline 测试及仅供导出器使用的 eslint 直接依赖；不计当前完成或待办，不复用此 ID，不再作为下游前置。

### T057

**已撤回：扩展完整工程导出。** 尚未实施。用户直接迁移源码，不再维护自动工程包、配置投影或 ProjectBundle 索引；迁移说明由 T031/T060 维护，迁后实际独立工程检查由 T061 承担。不计当前任务，不复用 ID。

下列记录保留原文及当时语境，其中旧下一项、五模式、七 hooks、外部行为对象或平台脚本直调不再作为现行执行安排；当前入口、来源和职责见上文及 spec。历史版本由 Git 和原证据追溯，不生成整份 plan 快照。

### 原任务清单：技能内容分发、选择安装与挂载

### 2026-11-04 当前追加授权：唯一 Node 入口

用户已确认 `node script/index.mjs [参数]` 是唯一对外入口，无 install/mount/hooks/commands 子命令；Node 判断操作系统并调度内部平台模块。此决定替代此前“取消 Node 转发层”的约定，设计与验证见 [计划最新节](plan.md)。本轮新增 T041，不重排 T001～T040；沿用 T005 修复新发现的 PowerShell 枚举异常报告，T006 等待两项完成。新入口先承接已验证安装能力，后续业务仍受六项 MVU 门禁约束，不把参数约定当作全功能已实现。

**2026-11-04 现行执行入口（用户最新确认）**：唯一对外调用为 node script/index.mjs 加参数，无 install/mount/hooks/commands 子命令。Node 识别系统并调度内部 .sh/.ps1 模块；安装流程按已完成任务接入核验、hooks 与五指令。此前“取消 Node 转发”约定由本次确认替代，历史实测结果保留。CLI 使用 FOUNDRY_SPECIFY_VERSION 或默认 1.2.6；script 原样复制，不交付自有 Python 核心或嵌套 package.json。

### 2026-11-04 当前进度

T005 已完成独立核验骨架及 PowerShell 混合选择异常报告修复，Bash 最新 23 项通过，Linux PowerShell 最新 22 项通过、1 项 Bash 专属场景跳过。T041 唯一 Node 入口及构建副本各 9 项通过，已接入当前安装骨架，详情见 [唯一 Node 入口验收](analysis/acceptance/node-entry.md)。下一项为 T006：五指令重装、所选 hooks 与实际派发，本轮未启动。T003/T004 仍按用户确认的 Linux 范围保留验收；Windows/macOS、未具备的最低运行时、公开来源和模式实际使用不计本次通过。

### 2026-11-04 测试代码归位（当前修正）

用户要求先移除业务目录里仅供测试使用的脚本，暂不推进后续功能。调用核对确认 catalog/projection/selection 仅供 MVU-A 实验使用，三者移入 packages/skills/tests/distribution/helpers；register-commands 的测试入口移到 packages/skills/tests/test-register-commands.mjs。更新测试引用、默认被测目录、tsconfig 和构建断言；生产 script 只保留有实际调用的脚本及 yaml 运行依赖声明。后续任务需要正式业务实现时再按实际调用提取复用，不把测试骨架当作已交付安装器。迁移后 lint/check-types/build、Python 13 项、MCP 7 项、MVU-A 9 项均通过；构建与脚本范围测试 9 pass、2 PowerShell skip。测试运行器参数误读已修复，详见 MVU-A 最新记录。

### 2026-11-04 构建与运行边界修正（此前记录）

用户授权“改一版”，并确认 skills 方式手动执行后续脚本，curl 方式自动处理。构建只把 script 原样复制到 dist/script，排除测试、缓存和本机 node_modules；不执行、导入或打包运行脚本。T003 的 catalog/projection 移入 script/distribution-runtime，与 selection 使用直接相对引用；script/package.json 声明 yaml 2.8.3 与 Node 最低版本，运行依赖不由构建准备。先补原样复制测试复现旧打包行为，再修复并复验独立副本的 MVU-A。历史打包证据保留，但不再代表当前交付方式。

后续 T004 的引导须在目标项目之外自动准备所需依赖，下载或安装失败时不进入技能提交；T005 验证用户手动启动同版公共脚本，T019/T027 接通 curl 自动安装、挂载，复用相同运行逻辑。`--check --official` 保持只读，缺运行依赖时报告前置条件，不在检查中自动安装。当前只修正 T003 和构建边界，不提前勾选上述任务。

### 2026-11-04 外部验收衔接（文档对齐时的记录）

用户已确认工作流最终仅有五个入口，并明确其余验收应通过本功能提供的交付能力，在独立消费项目进行。本功能已同步恢复前的规格与做法；下方 11 月 3 日“等待新模式全部验收后再恢复”的顺序不再作为阻塞。T001/T002 及已实现构建增量保留；本次未执行 T003 或修改任务 checkbox，不把本说明当作分发实现或验收通过。

spec/plan/contracts/tasks/quickstart 已按本次确认同步。安装选择沿用官方 skills；单模式可安装，五指令挂载需显式选择且核验全部五份，缺项提示、不补装。模式挂载直接复用 [五指令安装器与工程证据](../20261029-speckit-workflow-foundation/analysis/acceptance/script-mount-mvu.md)，每次官方全量重装；T006/T024/T026 不再创建逐模式扩展或第二套状态逻辑。下一项是 T003，本轮未执行。

对齐后从首个有效未完成任务继续（现编号 T003，MVU-A），以各 MVU 的实际结果决定下游；先具备独立交付所需能力，再在外部项目验证获取、安装和挂载。真实公开来源、发布及迁移仍按原授权边界处理，不以本次验收讨论代替发布授权。本功能保存分发验收，工作流功能保存模式行为验收，互相引用，互不自动完成。外部项目必须具备真实正式任务后才承接 T044/T045；不自动把本仓库的分发开发过程当作用户行为验收。

**2026-11-03 当前源码与构建边界**：线上源为 `src/mcp/`，线下技能源为 `src/skills/`，运行脚本源为 `script/`。一次 build 输出 `dist/mcp/`、`dist/skills/`、`dist/script/`；扫描 src/mcp 自动生成 `dist/mcp/manifest.json`，不手工维护源清单。取消构建模式切换与旧 dist 根 manifest.json/index.js；线下全部技能及附件独立交付，不进入 MCP 清单。MCP 内容范围、应用消费适配和流水线另行定义。本轮构建增量已实现，完整安装与发布尚未完成，按 2026-11-04 衔接安排推进；历史执行记录仅保留当时事实。

**分支**：`feature/speckit-workflow-extensions` · **生成日期**：2026-11-02 · **状态**：T001～T005、T041 已验收（各项实际范围见证据，未声明完整三平台），T006～T040 未执行。

**输入**：[spec.md](spec.md)、[plan.md](plan.md)、[research.md](research.md)、[data-model.md](data-model.md)、[接口契约](contracts/install.md)、[验证指南](quickstart.md)。沿用setup-tasks解析的当前功能目录及模板结构；plan中“本轮不创建tasks”是前一阶段历史范围，本次显式指令授权生成本文件。

### 包职责修正后的任务约束（2026-11-03）

包职责仍为只提供 skill 与脚本，不维护包根扩展声明、静态 extensions 或 mounts.json。T006/T024/T026 复用现有 register-commands；工作流 T042/T043/T048 的实际工程证据可作输入，不等待其整阶段或 T044/T045 行为验收完成。公开 16 技能，只有统一 modes 五项命令；分发的外部与跨平台验证仍须独立执行。

### 历史执行顺序（2026-11-03，已由 11 月 4 日衔接替代）

用户确认本功能暂缓，先完成[工作流功能追加的两个指令](../20261029-speckit-workflow-foundation/collaboration-modes-spec-prompt.md)，再开展探索式开发与引导式开发的关联验收。当前不从 T003 开始推进，保留现有代码、任务 checkbox 及已取得的证据；追加需求完成不自动完成分发任务或原工作流 T038。

恢复前核对追加需求的实际完成情况、两个新模式的验收安排及其对分发清单和挂载范围的影响，再更新受影响任务做法。下方 T040 与原 T038 衔接中的旧三模式验收已移除，不保留为后置待办；公共拆分与新模式验收的具体做法在恢复前核对，不以新模式名称替换旧验收证据。旧三模式是否弃用仍待用户决定。

### 格式与执行约定

任务行严格采用 `- [ ] Tnnn [P?] [USn?] 描述及路径`。所有工程任务未拆分，八栏目做法内联；无子任务目录、无额外状态系统。编号只属于本功能，例如本文件T038与旧功能T038是不同身份。

路径均为仓库根相对路径，代码只落packages/skills，原生受管配置由原工具修改。测试和验收任务依据spec明确要求的独立测试、SC-001～009及宪章III/IV生成；先补测试并记录目标失败，再实施，不能用删断言或skip求通过。生成时新增测试入口尚不存在；T002负责接线，后续每项自己的骨架/实现提供可执行内容，未实现时不得假通过。

每项完成均须记录具体命令、输入、预期、实际与证据，保存并读回后才勾选。代码任务至少执行目标包lint、check-types、build、范围测试及受影响消费检查；故事验收集中汇总，不能替代每次代码变更最低检查。所有TS/JS修改前加载document-changed-symbols；若后续确需修改技能正文，先加载skill-creator和适用技能编写规范，再按宪章VII补齐精确做法。生成与分析阶段未执行实现、发布、建仓或迁移；分析修订包括I1统一版本/来源参数、U1将最小入口前移到MVU并明确开发/完整发布检查、U2固定候选后只读远端验收。2026-11-02 用户随后授权先执行T001～T002及功能定位、旧需求检查清单对齐，未授权发布、建仓或迁移。

依赖写在各任务的“依赖”行，不以排列位置代替依赖。所有US任务共同受T008基础检查点阻塞。[P]只表示列出的前置均完成后可与指定不同文件任务并行；同一共享文件的后续修改必须串行。并行组的结果与checkbox由协调者结束后串行回填本文件，不并发覆盖任务记录。

### 当前授权增量：MCP 清单生成

本节按用户明确要求立即实施，不启动其他暂缓分发任务；交付依据为 spec 的 MCP-BUILD-001～006。

- **改动文件**：packages/skills/vite.config.ts、build/plugins/content.ts、tests/distribution/test-build-config.mjs、tests/test_artifacts.py（均在 packages/skills 内），本 Spec 与包 README。
- **改动内容**：先同步规格；测试先确认缺少生成清单的失败，再新增独立生成插件、样例与附件。扫描只限 src/mcp，校验元数据并稳定序列化，构建不依赖手写清单。
- **改动禁区**：不改 apps/mcp，不改 src/skills 的技能正文，不修改受管配置，不实现流水线或发布。
- **新建文件**：packages/skills/build/plugins/mcp-manifest.ts；packages/skills/src/mcp/mcp-build-smoke/SKILL.md；同目录 references/verification.md。
- **写法约定**：document-changed-symbols、skill-creator、writing-skills；中文注释；Markdown 保存后立即 ESLint；使用已有 yaml 依赖。
- **设计依据**：本轮用户明确指令、MCP-BUILD-001～006 与 MCP 清单契约。
- **验收信号**：真实清单包含样例正文和附件且不含线下技能，元数据非法与重复名失败；同源可复现、增删源自动同步；目标包检查通过。
- **风险与回退**：旧 MCP 应用仍读原路径，消费适配另行实施；生成失败修正源码或生成器，不手写 dist 清单补救。

**本轮 MCP 实施结果**：已按规格先同步文档，再增加样例与生成器。样例及 references 仅位于 src/mcp，构建自动生成 dist/mcp/manifest.json；源清单不存在。构建测试 6 项、包测试 12 项通过，目标包 lint/check-types/build 通过。显式将新路径传给现有 registry 的只读兼容检查通过；未修改 apps/mcp 默认路径或启动线上服务。完整证据见 [MCP 构建验收](analysis/acceptance/mcp-manifest.md)。

### 2026-11-04 文档对齐记录（T003 实施前）

本轮只修订现行规格、计划、契约、验收说明与任务做法，40 个任务身份、依赖与 checkbox 均保留；T001/T002 的历史工具版本和执行证据不回写。下一项 T003：在隔离目录用固定官方 skills 实测发现、选择、附件和路径。五指令安装器已有实现不等于外部分发已实现；工作流行为验收也不由本记录代验。

### 历史：2026-11-04 平台执行修正（已由唯一 Node 入口替代）

本包运行入口直接使用环境对应的 .sh/.ps1；安装、hooks 和五指令不经 Node 转发。skills 方式仍由用户手动执行同版公共平台脚本，curl 方式自动串联安装与挂载；两者复用同环境的平台实现。CLI 版本使用 FOUNDRY_SPECIFY_VERSION 或默认 1.2.6。构建只原样复制，Node/TypeScript 仅用于构建、测试或官方工具所需环境；不交付自有 TS/JS/Python 安装核心、Node 分发器或嵌套 package.json。后续任务不得重新创建已取消的转发层。

### 2026-11-04 hooks 实现与后续任务衔接

已完成 register-hooks 的全量七项原生平台安装，直接运行平台脚本，每次官方 --force；已移除 yaml-config.mjs 与保留式更新。T006/T024/T025 改为复用此实现，增量完成所选技能编排和外部集成验证，不重复创建钩子业务核心。具体 Linux 工程证据见 [工作流 hooks 验收记录](../20261029-speckit-workflow-foundation/analysis/acceptance/script-mount-mvu.md)。这些工程检查不代替 T006 的外部分发及真实阶段派发验收，当前不推进 T004 及其后续任务。

### 2026-11-04 hook 配置归属修正

每个声明 hooks 的技能在 SKILL.md 同目录维护 speckit-hooks.json，内容是以事件为键的 hooks 映射。该配置随技能及附件原样构建、安装；register-hooks 从 --skills-dir/<技能>/speckit-hooks.json 读取并直接组装临时 extension.yml。脚本目录不维护或构建 definitions 副本，缺少任一必需配置时在首次官方安装前失败。
