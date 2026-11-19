# Tasks: 从 Codex 对话生成协作 Skill

**输入**：[规格](spec.md)、[总体方案](plan.md)、[业务闭环](mvu.md)、[调研](research.md)、[数据模型](data-model.md)、[契约](contracts/collaboration-workflow.md)、[验收指南](quickstart.md)及规格关联的原始需求与确认。

**范围说明**：本清单沿[一致性修订授权](requirements/discussions/2026-11-19-open-questions.md#一致性分析后的修订2026-11-19)维护 32 项原任务及三项门禁。正式执行按各 Task 有效方案、前置与授权推进；用户已分别授权 T001 现状核查、T002 隔离样例准备和 T003 共用资料契约，方案及证据由原任务链接，不扩大为技能改造、旧入口退役或外部发布。

**组织与格式**：按 US1～US4 分阶段；`[P]` 只表示在前置满足后可处理不同文件、使用独立隔离环境的工作。文件路径均相对仓库根；本文新脚本和测试文件为规划位置，真实开工前沿原 Task 讨论并保存适用方案，普通文件拆分可依项目约定调整。工程 checkbox 只在本文维护。

**共同约束**：沿 pnpm 12、ESM、严格 TypeScript 和已有 Node 测试方式，不另建服务或状态系统。编辑 JS/TS 前加载 `document-changed-symbols` 并为新增或语义修改声明添加多行 JSDoc；创建或改造 Skill 时核对通用规范。Markdown 保存后执行 `pnpm exec eslint --fix <实际文件>` 并读回；被既有规则忽略时如实记录并另核对正文、引用和差异。自动资料默认写仓库外，测试使用隔离合成材料，禁止将其他仓库私人资料引入本仓库。

**最终入口门禁**：按[流程 Skill 最终来源消费](quickstart.md#流程-skill-最终来源消费)核对实际来源、安装快照、完整正文与附件、父/子代理真实读取及受影响业务复验。T014、T022、T026 分别承担对应来源变化后的验收，T030 和 T032 再核对最终来源是否变化；生成协作 Skill 的便携消费不能替代流程入口验证。

## Phase 1：准备与复用核查

**目标**：确认现状、可复用候选及隔离验证条件，不接管主线未完成构建插件。

- [x] T001 核对 `packages/skills/src/profile/` 三个同名或摘要候选、`collection.config.ts`、`scripts/dev/actions/link-skills/link-skills.sh` 和当前安装来源，在 `specs/skills/002-conversation-to-skill/analysis/preparation.md` 保存复用边界、版本及缺前置；验收能区分旧实现、新增提炼入口和待替换语义，保留用户未提交改动。见[方案](implementation/T001.md)与[核查证据](analysis/preparation.md)（2026-11-20）。
- [x] T002 在 `packages/skills/tests/conversation-workflow/helpers/sandbox.mjs` 建立隔离样例支持：仓库内两个项目、同名前缀仓库外目录、仓库外资料根、已知附件与长输出、受控写失败及 Git 基线；在 `specs/skills/002-conversation-to-skill/analysis/environment.md` 记录真实 CLI/Node/pnpm 版本、hook 信任、派发及兼容宿主可用性，缺项明确列为未运行。见[方案](implementation/T002.md)与[环境/验收证据](analysis/environment.md)（2026-11-20），样例回归 8/8。

## Phase 2：共用定位契约

**目标**：各阶段采用同一份可回查资料契约。完成后才进入故事实现；各故事特有技术假设仍须单独验证。

- [x] T003 在 `packages/skills/src/profile/conversation-recording/references/storage-contract.md` 固化仓库外日期目录及稳定来源定位，并引用 `specs/skills/002-conversation-to-skill/data-model.md`；交接须满足“派发关联父会话、轮次、阶段和实际子线程”“输入列出经核对的材料定位，分析还关联派发时的当前规则版本”“子代理返回候选产物的位置、依据和实际完成结果”“父代理读回后核对来源、保存状态及当前版本，再确认产物”，验收三个阶段可使用相同来源且不新增第二套工程状态。见[方案及静态核对](implementation/T003.md)与[契约正文](../../../packages/skills/src/profile/conversation-recording/references/storage-contract.md)（2026-11-20），真实宿主及消费验收仍由后续 Task 承接。

## Phase 3：US1 自动保存并续接对话（P1，MVP）

**目标**：交互会话从打开到正常关闭、并行恢复均有可核对记录，提交后继续保存且不引入业务 Git 差异。对应 MVU-001～005。

**独立验收**：按 [quickstart.md](quickstart.md) 的记录验收，在两个仓库内目录实际并发开启会话，覆盖完整工具及附件、首条先保存、正常末轮、停止、中断、跨日重复恢复、部分失败及真实提交；仓库外、非交互和两种跨边界恢复均零写入。覆盖 SC-001～004 及记录入口的 SC-009。

### 技术前置与测试

- [ ] T004 [P] [US1] 在 `packages/skills/tests/conversation-workflow/recording-host.test.mjs` 保留接入探针，并在 `specs/skills/002-conversation-to-skill/analysis/recording-host.md` 记录真实隔离 CLI 的根/子目录信任、无输入开启、跨午夜首条、首条保存顺序、Stop/Interrupt/SessionEnd 与正常末轮；证伪交互入口及恢复前目录可取得假设，核对非交互、exec resume、同名前缀目录和两种跨边界恢复均零写入且零范围外正文补读，失败阻止依赖接入的实现并回到方案调整。
- [ ] T005 [P] [US1] 在 `packages/skills/tests/conversation-workflow/content-source.test.mjs` 保留完整内容来源探针，并在 `specs/skills/002-conversation-to-skill/analysis/content-source.md` 比对已知工具选项、短/长/流式输出、本地工具、主会话可取得的子代理派发/交互/回传工具活动、会话及工具附件原件哈希；验证 hook、定向历史及必要的固定版本只读适配实际字段，注明截断和不可得范围，已纳入会话的仓库外工具仍归原会话，逐项核对子代理工具参数、输出、顺序与父轮/子线程定位，不可得项标缺口；未证实来源不得用于宣称完整采集，不扩展为子线程内部独立留存。
- [ ] T006 [US1] 在 `packages/skills/tests/conversation-workflow/recording.test.mjs` 编写记录契约回归，先确认对待实现能力失败；覆盖日期/成对文件、事件顺序、相同文本不同事件、两会话隔离、原日两次恢复、部分写失败、附件哈希和仓库外资料根，使用 T004/T005 已证实输入而非用模拟结果替代真实接入验收。

### 实现与交付

- [ ] T007 [US1] 在 `packages/skills/src/profile/conversation-recording/scripts/session.ts` 实现归属与身份解析；会话保存“宿主会话标识、交互入口证据、解析后的来源仓库根目录、首次有效工作目录和本地开启日期”，满足“标识与该份来源归属一起定位索引和详情”，恢复满足“两者均在目标仓库内才接续原日期和文件”；验收拒绝非交互及跨边界样例，不以工具 cwd 或历史 source 类型替代本次交互入口证据，依赖 T004。
- [ ] T008 [US1] 在 `packages/skills/src/profile/conversation-recording/scripts/writer.ts` 实现 `records/YYYY-MM-DD/index/<会话>.md`、`details/<会话>.md` 的对应块；对话轮次“按宿主轮次及真实记录定位归属”，索引保存“对话内容要点、结果、改动文件和详情锚点”，详情“按事件顺序保存用户和助手发言、工具名称、完整可取得参数和输出，以及原件引用”；满足“详情和附件先确认，再写入关联索引”，默认资料根在业务仓库外且读回可定位，依赖 T007。
- [ ] T009 [US1] 在 `packages/skills/src/profile/conversation-recording/scripts/host.ts` 复用 T004 探针实现经验证的启动、发言、停止和关闭接入，在 `packages/skills/src/profile/conversation-recording/references/codex-hooks.md` 给出隔离项目 `.codex/hooks.json` 候选与启用/信任方式；验收普通交互入口首条已保存后才工作、正常退出保留末轮，宿主版本与兼容限制有证据，不在本 Task 直接启用当前项目候选。
- [ ] T010 [US1] 在 `packages/skills/src/profile/conversation-recording/scripts/capture.ts` 接入 T005 已证实的工具原值、实际改动文件与附件采集；附件“关联所在会话和详情块”，包含“原件的本地相对位置与可核对的内容摘要值”，条目区分“实际保存、部分可取得、当前不可取得”，详情可回查工具工作目录，验收完整可得内容与原值及哈希一致，主会话子代理工具活动的参数、输出及顺序完整可回查，不可得项可定位。
- [ ] T011 [US1] 在 `packages/skills/src/profile/conversation-recording/scripts/recovery.ts` 实现按会话短时写入协调、断点核对和定向历史补读；缺口“记录缺失范围和失败原因”，满足“每个已确认事件只保留一次，相同文本的不同事件分别保留”；验收两个同文会话不混写，跨日恢复两次仍续原文件，只补可核实缺项，依赖 T007～T010。
- [ ] T012 [US1] 在 `packages/skills/src/profile/conversation-recording/scripts/failures.ts` 实现索引、详情、附件部分失败与资料区不可写的提示及后续补记；满足“部分写入时保留已确认的范围”“先在会话呈现缺口，资料可写后补记”，验收提示早于任务继续、任务可完成、已保存块仍可供下游使用且未保存部分不冒认成功，依赖 T008～T011。
- [ ] T013 [US1] 改造 `packages/skills/src/profile/conversation-recording/SKILL.md` 并核对其必要资源引用，替换旧项目内原文/摘要分支/下一轮补末轮的语义，说明记录输入、宿主接入、完整详情、缺口和确认资料线索；在 `packages/skills/src/profile/collection.config.ts` 声明记录候选并通过现有隔离交付路径验证，保留旧入口至 US4，验收记录可独立发现和读取，不承接构建插件开发。
- [ ] T014 [US1] 按 `specs/skills/002-conversation-to-skill/quickstart.md` 执行全部记录运行验收，在 `specs/skills/002-conversation-to-skill/analysis/recording-acceptance.md` 先按最终入口门禁刷新并验证 T013 的记录安装来源，保存版本/快照、真实读取、输入、事件顺序、文件定位、哈希、失败/恢复及隔离仓库真实提交证据；用 status、工作区 diff 和暂存区 diff 验证提交及后续回复已存且记录新增差异均为零，T006 回归通过后才认可记录交付，不对本仓库作验收提交。

## Phase 4：US2 用多个项目对话生成并使用协作 Skill（P2）

**目标**：父代理分别按证据派发提炼与分析，生成可带往其他项目使用的一份协作 Skill。对应 MVU-007～010。

**独立验收**：使用记录入口实际生成的两个仓库内项目样例，对照仓库外、旧影子画像和未确认落盘材料；普通任务下分别核对派发数 `0/0`、`1/0`、`0/1`。每条特点及规则可回查，另一兼容代理仅凭最终目录完成代表性任务。依赖 US1、US4 的记录切换；后续回归可复用已确认的范围内记录。覆盖 SC-005、006、009。

### 技术前置与提炼

- [ ] T015 [US2] 在 `packages/skills/tests/conversation-workflow/extraction-dispatch.test.mjs` 保留受控派发探针，在 `specs/skills/002-conversation-to-skill/analysis/extraction-dispatch.md` 记录普通任务中父代理获得已确认资料线索并真实派发、回传的证据；不足材料为 `0/0`，足以提炼但不足以形成规则为 `1/0`，注明探针所消费的候选安装来源，核对父轮、阶段、子线程及交接材料，并对照主会话详情中的实际工具名称、完整可取得参数/输出、顺序及缺口；T022 复验最终来源，失败时保留现有效果且不由主代理代写冒认成功。
- [ ] T016 [US2] 在 `packages/skills/src/profile/conversation-extraction/references/trait-format.md` 定义每项一文件及来源资格核验；特点包含“描述、适用情境、证据解释及一个或多个原始对话定位”，定位含“来源仓库、项目目录、会话、轮次和详情块”，区分“明确表达、重复行为或一次性决定”；在 `packages/skills/tests/conversation-workflow/traits.test.mjs` 核对仓库内多项目与单项目情境、“首次自动提炼只从新流程确认的记录块取证”、旧/外部/未确认样例不被采用、已有合格记录可再用。
- [ ] T017 [US2] 在 `packages/skills/src/profile/conversation-extraction/SKILL.md` 实现独立提炼入口、父代理惰性判断与子代理亲自读取/保存特点的流程，复用 T003/T015/T016；持续偏好或明确纠正可单次支持，普通观察待积累，父代理读回确认来源及完成范围，验收每项独立文档可追溯且无需逐条人工确认，不把旧 `conversation-summary` 视为新提炼入口。

### 独立分析与便携消费

- [ ] T018 [P] [US2] 在 `packages/skills/tests/conversation-workflow/analysis-dispatch.test.mjs` 验证本轮无待提炼证据、已有合格特点足以修订规则时实际派发数为 `0/1`，并在 `specs/skills/002-conversation-to-skill/analysis/analysis-dispatch.md` 注明候选安装来源，保存普通任务的独立分析子线程、输入版本、回传、读回及主会话工具详情原值/顺序/缺口证据；T022 复验最终来源，不足则等待，失败保留当前产物，不把提炼本轮完成设为必要条件。
- [ ] T019 [P] [US2] 在 `packages/skills/src/profile/conversation-analysis/scripts/rules.ts` 实现本地当前规则与溯源保存；规则包含“适用情境和可执行行为”，溯源保存“与特点的多对多关联”，先在 `packages/skills/tests/conversation-workflow/rules.test.mjs` 编写并发采纳回归并确认未实现时失败，验证每条规则可溯源、共享依据及版本可定位，并满足“版本核对与采纳在同一次写入协调内完成”；同一资料区及 Skill 的两个父会话基于同版回传时只允许一项按原版成功，过期候选不覆盖较新结果，部分失败不冒认采纳成功；原始对话、附件与溯源不进入便携目录。
- [ ] T020 [US2] 在 `packages/skills/src/profile/conversation-analysis/scripts/skill-output.ts` 生成资料区 `skills/<技能名>/SKILL.md` 及正文需要的相对资源；满足“有效 `name` 与目录名匹配，`description` 表达使用情境”“新的分析结果在发布前核对当前规则版本”，在 `packages/skills/tests/conversation-workflow/skill-output.test.mjs` 验证一份目录可独立复制、引用均在目录内且可读，目录通过 T019 的共享协调边界采纳，版本过期不能回退目录，依赖 T019。
- [ ] T021 [US2] 改造 `packages/skills/src/profile/conversation-analysis/SKILL.md`，由独立子代理消费已确认特点并形成带情境的规则及一份协作 Skill 的独立候选，由父代理按 T019/T020 核验并采纳，移除直接从原文写旧结论/画像的链路；在 `packages/skills/src/profile/collection.config.ts` 启用提炼和分析入口，验收三份流程 Skill 的触发、输入、产物及资源各自独立，派发失败或未确认回传仍可用当前产物，依赖 T017～T020。
- [ ] T022 [US2] 按 `specs/skills/002-conversation-to-skill/quickstart.md` 先按最终入口门禁刷新并证明父/子代理真实读取 T017/T021 的三份最终流程安装来源，再完成两个项目的生成、三组派发数及主会话子代理工具详情回归、两个父会话的共享规则并发采纳和便携消费，在 `specs/skills/002-conversation-to-skill/analysis/skill-portability.md` 保存真实证据；用 `skills-ref validate <生成目录>` 或等价检查核验格式，再由使用者将同一目录带往另一隔离项目，让兼容代理仅凭该目录发现、读取并应用代表性规则；宿主缺失或无人完成实际消费时保留未验，不以格式通过替代 SC-006。

## Phase 5：US3 删除规则并允许以后重新形成（P3）

**目标**：删除对当前产物生效，独占依据可清理，共享和原始资料保留，后续有效处理可重新形成规则。对应 MVU-011。

**独立验收**：准备两条规则、一项独占和一项共享特点，删除一条、接收旧分析回传，再发起有足够证据的新提炼与分析；逐项比对目录、关系和原始对话/附件。依赖 US2 的有效规则与版本契约；维护回归可从已确认特点及规则开始。覆盖 SC-007。

- [ ] T023 [US3] 在 `packages/skills/tests/conversation-workflow/rule-maintenance.test.mjs` 先建立删除回归：当前规则消失、仅独占特点及关联清理、共享特点仍支撑剩余规则、原始记录/附件不变、旧回传不能恢复删除项、后续新处理允许已有或新增合格对话重新形成规则；增加两个父会话分析与删除交错、边界外版本检查竞争的反例，较新规则、关联及目录不得回退。
- [ ] T024 [US3] 在 `packages/skills/src/profile/conversation-analysis/scripts/rule-maintenance.ts` 实现按当前多对多引用删除规则与独占特点、刷新便携产物及清除失效关联；删除使用 T019 同一共享协调边界并推进版本，只依据当前关系清理；满足“共享特点与原始对话仍可供其他规则使用”，在 `packages/skills/src/profile/conversation-analysis/SKILL.md` 说明用户维护入口与失败恢复，验收 T023 的删除与共享保护断言通过，依赖 T019/T020/T023。
- [ ] T025 [US3] 在 `packages/skills/src/profile/conversation-analysis/scripts/rules.ts` 的同一共享写入协调边界内核对版本与当前删除决定后再采纳规则、关联及目录；满足“旧结果与删除发生冲突时保留当前删除决定，后续有效处理中可重新形成规则”，验收 T023 的迟到结果用例通过，过期结果保留候选及来源，重新核对最新材料，不以永久屏蔽名单阻止新处理，依赖 T024。
- [ ] T026 [US3] 在 `specs/skills/002-conversation-to-skill/analysis/rule-maintenance.md` 先按最终入口门禁刷新 T024/T025 修改后的最终流程安装副本，保存版本/快照、完整正文/附件、父/子代理真实读取与复验，再记录两个父会话分析与删除交错、迟到旧回传及随后新提炼/分析证据，核对独占清理、共享/原始附件完整性和规则再次形成；实际父子代理链与 T023 回归均通过才认可维护闭环，依赖 T025。

## Phase 6：US4 归档并退役旧影子画像（P3）

**目标**：记录验收后切换旧入口，历史源码、规格和已有资料仍可追溯。对应 MVU-006。章节按故事优先级排列，实际执行位于 US1 后、US2 前。

**独立验收**：核对旧源与归档完整相对文件清单及字节，运行主线扫描、当前项目正常同步与旧 profile 定向同步，再开真实 CLI 会话；旧入口发现数量为零，新记录正常。覆盖 SC-008。

- [ ] T027 [US4] 仅在 T014 记录验收通过后，将 `packages/skills/src/profile/shadow-profile/` 原样移至 `specs/skills/002-conversation-to-skill/archive/shadow-profile/`，在 `specs/skills/002-conversation-to-skill/analysis/shadow-retirement.md` 保存移动前后完整文件清单及哈希；验收字节一致，历史规格及 `.specify/memory/user-shadow/` 原记录仍可追溯，不格式化归档原件。
- [ ] T028 [US4] 在 `packages/skills/src/profile/collection.config.ts` 撤下旧启用/交付项，在 `scripts/dev/actions/link-skills/link-skills.sh` 核对并按实际需要阻止旧源重新同步，通过既有生命周期移除 `.agents/skills/shadow-profile/` 安装副本；核对当前 `package.json` 的同步来源、`AGENTS.md` 及活动引用，只调整实际旧接线并使新记录有效，保护其他来源技能，不修改紧急版无关能力或生成物，依赖 T027。
- [ ] T029 [US4] 按 `specs/skills/002-conversation-to-skill/quickstart.md` 执行主线技能扫描、当前正常同步和旧 profile 定向同步，再新开真实 CLI 验证旧入口发现为零、新记录仍工作，将命令、有效交付清单、安装来源及宿主发现结果补入 `specs/skills/002-conversation-to-skill/analysis/shadow-retirement.md`；仅源码移除或同步成功不算完成，依赖 T028。

## Phase 7：整体验证与收尾

**目标**：确认各故事实际结果和局限，最后清理开发过程产物，保护正式交付及证据。

- [ ] T030 在 `specs/skills/002-conversation-to-skill/analysis/verification.md` 汇总三份流程 Skill 及最终协作 Skill 的格式/资源检查、全部故事证据与 FR/SC 覆盖，核对最终来源与 T014/T022/T026 消费快照一致；有变化先刷新并复验受影响原任务，未取得证据不报整体通过；运行 `node --test packages/skills/tests/distribution/conversation-sandbox.test.mjs packages/skills/tests/conversation-workflow/*.test.mjs`、`pnpm --filter @foundry/skills lint`、`pnpm --filter @foundry/skills check-types` 及相关既有测试，涉及交付配置则构建并核对真实清单，失败、缺前置和未运行分开记录，不以改规则或删断言求绿。
- [ ] T031 在 `specs/skills/002-conversation-to-skill/quickstart.md` 和 `specs/skills/002-conversation-to-skill/analysis/spec-analysis/README.md` 核对交付方式、实测宿主版本、恢复及维护操作、原始资料边界和仍缺验收；引用真实原 Task 与证据，不在分析或 MVU 建立工程状态副本，不以 agent 演练冒充真实用户消费或结案批准，依赖 T030。
- [ ] T032 在实现及必要验证完成后、整体结案前，核查 `packages/skills/src/profile/`、`packages/skills/tests/conversation-workflow/`、隔离候选接入及 `specs/skills/002-conversation-to-skill/` 的临时文件、失效代码/注释、文档段落、迁移/进度说明及试验产物，在 `specs/skills/002-conversation-to-skill/analysis/cleanup.md` 保存原 Task 清理证据；结合调用、导出/配置、历史和适用测试说明处置依据，保护正式交付、有效治理、历史事实、验收证据、复用探针骨架和引用，用途不明项保留并记路径/符号或标题、原因及后续条件，无须清理也记录核查结果；其余应清理项处理完且必要检查/引用有效后才可完成；未处理应清理项、保存或必要验证失败、引用受损时不得勾选，清理完成不自动满足其他结案条件或用户批准，清理改变最终流程来源时按最终入口门禁刷新、读取并复验受影响流程后才能完成，依赖 T030/T031。

## 依赖与实际执行顺序

```text
T001 → T002 → T003
                 ├→ T004 ─┐
                 └→ T005 ─┴→ T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014
                                                                                       ↓
                                                              US4：T027 → T028 → T029
                                                                                       ↓
                       US2：T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022
                                                                                       ↓
                                                     US3：T023 → T024 → T025 → T026
                                                                                       ↓
                                                              T030 → T031 → T032
```

图示为推荐串行顺序，Task 正文中的依赖是最低前置。US1 不依赖其他故事；US4 必须等待新记录隔离验收，US2 按规划在切换后推进；US3 依赖带溯源和版本的分析产物。旧影子画像数据只作为历史保留，不作为首次提炼材料。

测试或探针写在对应实现前，验证真实失败或待证假设，再实施并复验；探针通过只证明对应技术前置，业务验收仍独立完成。技术前置失败只阻止受影响下游，保留已证实骨架；接口或覆盖范围需实质调整时回到方案讨论。

## 各故事的并行示例

| 故事 | 可并行工作及条件 |
| --- | --- |
| US1 | T003 后，T004 接入探针与 T005 内容探针使用不同测试文件、证据文件及独立资料根，可并行；随后按已验证契约串行集成。 |
| US2 | T017 后，T018 分析真实派发探针与 T019 本地规则/关系实现可并行，前者使用隔离特点样例，后者不依赖派发运行成功；T020/T021 仍等待相应前置。 |
| US3 | T024 后，核对其便携目录删除结果可与 T025 的旧回传版本校验并行只读复核；写入及 T026 的真实删除/再形成验收串行，避免同一规则资料竞争。无可独立并行的工程写入任务。 |
| US4 | T027 完成后，归档哈希只读复核可与 T028 入口切换实施并行；T029 的扫描、同步和宿主发现按顺序验证。归档移动、安装副本删除不得并发。 |

并行示例是执行机会说明，不授权本次派发子代理或实施；同一文件、资料根或会话写入仍按原职责协调。

## 实施策略

先完成 T001～T014，独立验收 US1，作为 MVP；不把尚无事件/原值证据的方案称为记录能力。随后执行 T027～T029，在记录可用后完成旧入口切换，构成记录里程碑。

再完成 T015～T022，分别验证提炼与分析的真实派发，交付可溯源特点及可携带 Skill；T022 的兼容宿主与使用者实际操作是独立交付条件。随后完成 T023～T026，使删除、旧回传保护和再次形成构成维护闭环。

最后完成整体验证、说明核对及 T032 清理。每个正式 Task 开工前复用适用的已讨论认可方案和有效授权，缺失时先做该 Task 的共同准备；任务生成不自动授权实施或跨阶段推进。
