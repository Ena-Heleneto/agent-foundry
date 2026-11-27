# TV-07 业务节点候选规则：实际证据

本记录覆盖 T090。六类候选技术门禁已通过并回填，T091 生产来源、四模式消费及同版分发均未执行。输入、候选全文和临时路径见 [夹具](fixtures/tv-07/README.md)。

## 已发生的基线

实际读取现行 task-direct、task-increment 来源和项目治理。已有模式包含复用、真实依赖及非 Spec Kit 兼容规则，但独立 `business-node-delivery` 来源不存在，未冒充已经可加载。

无候选规则的五个独立上下文分别给出规划决定，原始回答在临时根 `raw/control-1.txt`～`control-5.txt`。逐份人工读回：5/5 均要求权限修复并实际复验、复用数据层、页面等待必要接口、允许无关文案继续、保持原整体任务未完成。部分回答称“该子任务完成”，并未实际新建身份或状态，不能据这句话判为创建新系统。该组没有暴露预设的核心违规，不证明候选改善行为；不据此添加恐吓、反驳表或泛化禁令。用户已明确要求的独立可加载来源仍须做可用性验证，候选采取简短正向步骤，不以微样本捏造 RED。

A 已有数据层实际运行 `python3 -m unittest -v test_storage`：1 项通过。首次启动及请求在沙箱遇到 `PermissionError: Operation not permitted`，属于环境阻止；批准后启动回环服务，并重跑创建验证：4 条均实际 404，命令退出 1，符合接口尚缺的真实失败。完整结果保存在 `A/initial-create.log`（环境失败）和 `A/initial-create-retry.log`（真实 HTTP 失败），未覆盖首次输出。

## 候选微样本与实际应用

候选五个独立上下文也已全部人工读回，原文在 `raw/candidate-1.txt`～`candidate-5.txt`。5/5 保持当前范围、权限失败先修复复验、页面等待必要接口、无关工作可继续、整体未完成；具体叙述有先列查询或先复验创建的差异，未观察到核心决策冲突。对照同样为 5/5，不能把文字更完整等同于行为提升，不能作统计或因果结论。用户既定独立来源交付要求优先于通用技能中“无失败就不追加纠偏指导”的建议；本次未以不存在的失败添加惩罚性规则，也未声称完成行为纠偏 RED→GREEN。

### A：只推进创建接口，真实失败与恢复

独立上下文实际完整加载同一候选，读取 A 的治理、Spec/plan/MVU/原任务、代码、测试及既有失败，自行形成计划并直接编辑 `api.py`。没有预写正确业务产物生成脚本；`run_command.py` 仅驱动实际命令并记录输出。

| 动作与输入                                                    | 预期                                       | 实际及证据                                                                           |
| ------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| 复用已有存储层并跑 `python3 -m unittest -v test_storage.py`   | 数据隔离通过，无须重建                     | 1 项通过；`run-logs/003-storage.txt`，数据层摘要保持                                 |
| 创建接口首轮，owner 携伪造 `owner_id`、匿名、viewer、空 title | 201/401/403/400，身份来自会话              | 实际 201/401/**201**/400，viewer 越权且产生记录，退出 1；`006-create-before-fix.txt` |
| 只修复 `permissions.can_create` 并重启后重跑原断言            | 201/401/403/400                            | 全部符合，退出 0，伪造 owner_id 被忽略；`016-create-fixed.txt`                       |
| 标题长度 1/80/81、数字、缺字段、空体、数组、失效会话          | 前两项 201、五类无效输入 400、失效会话 401 | 8 个真实 HTTP 请求符合预期；`019-create-boundaries.txt`                              |
| 真实请求 `TV07_BASE=http://127.0.0.1:18999`                   | 无可用服务，不能判业务通过                 | 连接拒绝，退出 1，无业务响应，业务断言未执行；`020-unavailable-target.txt`           |
| 权限失败期间推进无依赖 T002 文案                              | 不冻结所有任务，不替代订单验收             | 实际修改并断言文案，退出 0；`009-unrelated-check.txt`，T002 完成、T001 未勾选        |

第一次越权、修复后请求、原始 404 和环境拒绝全部保留，`checks.jsonl`、`requests.jsonl` 持续追加。不可用端口是负向分支的实际环境失败，不是仍需连入的生产目标；它证明不能出具业务通过结论，不影响已在 18747 取得的独立结果。Python 编译检查仅作语法检查，未代替业务请求。

原 `tasks.txt` 与 `specs/orders/tasks.md` 按授权更新事实和证据，原目标/T001 身份及未完成判断保留；不能宣称这些可更新记录字节未变。创建后尚不实施乙或页面，待下一次夹具阶段授权续接。完整报告为 `raw/actual-a.txt`。

### B：不适用层、先只读原型及独立恢复

另一个独立上下文加载同一候选，按 B 原有 goal/work/evidence 布局，先保存固定文字布局，再写函数测试；首次因 `greet` 模块缺失退出 1，是测试加载失败，尚未进入行为断言，不包装为函数断言失败。直接实现后，`python3 -m unittest -v` 的 3 项测试、15 组输入通过：姓名去首尾空白并保留内部空格，空白及非字符串抛 ValueError。

此节点无存储或后端职责，未凑数据层、接口或 `.specify`；Python 函数不直接证明浏览器运行，原页面目标仍未实现。只读文字布局先行的依据来自预先构造的夹具约束，不是实际用户反馈、认可或学习实践。原型也未被当成正式页面通过。完整输入、结果和代码快照为 `raw/actual-b.txt`。

再用新的独立上下文完整加载同一候选、读取 B 原记录与实际文件，运行 `python3 -B -m unittest -v`：3 项通过。前后候选及 B 全部文件摘要一致，不重写函数、原型或原 evidence，不重复创建记录/节点状态；保留浏览器目标未完成。命令与摘要为 `raw/resume-b.txt`。

### 指定来源缺失

独立上下文实际检查夹具指定的不存在来源，输出 `MISSING`，同时核查获准的无关 readonly 文件存在，输出 `EXISTS`；未加载旁路候选、安装、创建技能或 `.specify`，未声称已应用规则。见 `raw/actual-missing.txt`。这是缺项处理分支，不是四模式正式消费。

## 页面汇合：独立续接实施与主持上下文协助运行

新的独立上下文再次完整读取同一候选和 A 原任务、实际代码及失败/复验证据。第二阶段范围来自预先保存的 `page-followup.txt`，只扩展临时夹具中乙接口和共同表单，不是实际用户反馈、生产授权或整体验收。

先实际运行原 `acceptance.py list`：owner/匿名/viewer 预期 200/401/200，实际均 404，退出 1，保留在 `A/run-logs/030-list-before.txt`。该上下文仅在原 `api.py` 增量添加按会话身份过滤的 GET 查询，重启后原 create 仍通过；list 实际 200/401/200，viewer 结果为空，见 `033-create-with-list.txt`、`034-list-after.txt`。取得各接口结果后才直接编辑 `page_server.py`，没有重建数据层或集中补无关业务后端。

页面是服务端 HTML 表单，实际向已验接口发 HTTP 请求。主体上下文读取源代码并协助运行 `python3 /tmp/foundry-tv07-20261109/final_verify.py`，获工具批准后实际退出 0，原始输出为 `final-results.json`。结果如下：

| 实际命令/动作                            | 结果                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `python3 acceptance.py create`           | 4 请求分别 201/401/403/400，伪造 owner_id 未被采用                                                                                               |
| `python3 acceptance.py list`             | 3 请求分别 200/401/200，owner 能查到自己的订单，viewer 不能查到                                                                                  |
| `python3 page_acceptance.py`             | 7 个真实 HTTP 表单请求均符预期，包含读取表单、提交独特标题、同页查询、viewer403且未产生订单、匿名401、空标题400；关联 label 及 HTML 转义断言通过 |
| `python3 -B -m unittest -v test_storage` | 1 项数据层测试通过                                                                                                                               |
| B 中 `python3 -B -m unittest -v`         | 3 项测试、15 组输入通过                                                                                                                          |

唯一的页面订单标题实际为 `页面录入-4f55c805<测试>`，通过 POST 创建后在页面查询文本出现，HTML 中以转义形式输出。服务端页面的真实输入与完整返回 HTML 保留在 `A/page-checks.jsonl`，API 转发响应在 `A/requests.jsonl`，服务日志为 `final-page_server.py.log` 与 `final-server.py.log`。这是实际 HTTP 表单业务流程，不是浏览器渲染、视觉、键盘或用户认可证据；原 T001/MVU 仍未整体完成。

执行归属如实区分：独立上下文负责计划和直接增量实现；最后这组运行由主体上下文协助执行，再由独立上下文读回结果和更新原记录，不冒称全部由子上下文执行。脚本只启动本地服务、运行已有断言和记录真实输出，不产生业务实现或“正确产物”。脚本按已记录 PID、工作目录和命令核对回收前序样例服务，并在 finally 停止自己启动的两服务。

另保留两个运行问题：035 缺失页基线命令等待后被中止，未取得运行结果，不计已执行；036 的并发服务启动最终因地址占用退出 1，先前把工具返回 PID 当启动成功的判断已纠正，未拿它作通过证据。最终成功请求由主体上下文实际建立的两服务处理，日志可核对；036 子进程未建立监听。没有为消除失败修改原断言。

## 六类门禁与调用范围

| T090 必验场景    | 已取得的实际信号                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| 当前单节点       | A 仅实现和验证创建；复用数据层，原整体任务未勾选                                                  |
| 页面汇合         | 新上下文先对乙保留404并修复验证，再接共同表单，真实提交后查到                                     |
| 按需验证         | A 用真实接口请求，B 用局部自动测试，汇合后用真实服务端表单请求；无强制所有节点贯穿各层            |
| 失败/未执行/恢复 | 保留越权201与修复403、不可用端口未执行；只挡依赖，T002继续；修复实际复验                          |
| 不适用层/调序    | B 无数据后端职责；按构造的明确依赖先只读文字布局，未冒称正式页面通过                              |
| 独立/恢复/缺项   | A/B 各自独立加载同版候选，B新上下文恢复不重写，A新上下文续接乙/页面，指定缺来源如实停止受影响动作 |

本轮行为样本共 15 个独立上下文：无候选微样本 5、候选微样本 5、A初次/B初次/缺来源/B恢复/A页面续接 5。其中实际加载候选的应用上下文为 9 个（5微样本+4实施或恢复），缺来源上下文没有加载候选。另有 1 个独立只读复核上下文，归质量审查，不混入行为样本。A收尾和页面执行有同上下文中断续接，复核有第二轮，均不虚增独立样本数；多条请求不计成多次独立 Skill 应用。真实用户实践/反馈为 0，四模式正式来源消费为 0。

候选与业务骨架继续保留供 T091 增量；最终保护、格式和独立复核均已完成，T090 已回填。完整 TV-07 的生产来源/四模式/同版构建与分发没有在本轮执行。

## 工具与记录纠正

A 初次 `pnpm` 格式命令触发临时目录工具解析/依赖锁失败，未成功安装；后续 `pnpm --dir … exec eslint …` 虽退出 0，却因 outside-base-path 忽略临时 Markdown，不计真实检查通过。root 已验证保持临时 cwd、直接调用仓库 eslint 二进制并显式 config 的方法可实际检查。原失败告警保留，最终命令另列。

一次广域进程参数采集过宽，已经改为脱敏说明和本样例 PID 摘录，不归档无关完整命令；业务失败日志未改。服务只关闭明确归属本样例的 PID，不干预其他工作。

候选结构校验最初用系统 Python 缺少 `yaml` 模块而失败；随后复用已有 uv 缓存的 PyYAML、未安装依赖，实际运行 skill-creator 的同一 `quick_validate.py` 输出 `Skill is valid!`。该静态校验只证明格式，不代替以上行为。

## 最后复核与结论

同一独立只读复核上下文完成第二轮，Critical 0、Important 0，判定六类本阶段信号齐备，见临时根 `raw/review.txt`。非阻断建议是 T091 可更直接表达缺来源时的准备职责；本候选未自动安装或扩大授权，保持同版，不以没有观测到的违规添加规则。

最终实际运行 `python3 /tmp/foundry-tv07-20261109/inspect_final.py` 退出 0，13 项断言全部为 true（`protection-final.json`）：四模式来源摘要一致；A 数据层/测试/服务基座与页面断言、B原目标保持；历史任务后缀及 T090 之外原任务块逐字保持；有效任务46项、20完成/26未完成，只有 T090 新增完成；T091～T094未勾选；A原T001仍未完成；B无.specify；缺来源未被伪造；生产源未创建；README内候选与实际加载字节一致。主线MVU009仅按声明更新为进行中及候选证据，不认定整体完成；夹具A原spec/plan的额外变更仅为Markdown格式空行。

本轮修改的仓库 Markdown 均已即时运行 `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix <实际路径>` 并读回，临时候选/A文档用临时cwd和显式仓库配置真实检查。`git diff --check` 对本轮五个仓库文件退出 0。after_implement 的 explainer-doc-sync 已实际核对：没有本轮知识说明资料或引用需同步，未建空节；可选前hook未执行。

候选和同一业务骨架已保留，精确归档/摘要见README。T090技术前置解除，下一项为T091生产来源完善；本轮没有实施它。浏览器视觉、键盘、完整页面业务验收、真实用户反馈、生产包lint/check-types/build、正式四模式与同版分发均未执行：本轮仅修改验收文档和隔离Python夹具，不以本次结果代替后续来源/消费者的工程检查。5/5无候选对照原本就正确，本次只证明已测范围的可用性，尚未证明行为改善。

## T091 生产来源回归

本节记录 T091，以上 T090 正文及当时“生产来源未执行”的事实保留。T091 独立来源验收已回填；四模式接入、工作区挂载和完整分发均未执行，最近全包失败详本节末尾。

### 来源与同版构建

正式来源为 `packages/skills/src/skills/workflow/business-node-delivery/SKILL.md`，只有一个 Markdown 文件，无 hooks、脚本核心或额外规则副本。目录名/frontmatter 一致。正文直接沿用 T090 已测候选，不为未观察到的行为缺陷追加文字；源和 `dist/skills/workflow/business-node-delivery/SKILL.md` 的 SHA256 同为 `d6ff1fe1cd835a97dfaf72ea32e8ad5f7da84893211b1f8d6e2e5a0c5c70e6fa`。没有手工修改 dist 或 .agents。

本轮临时根为 `/tmp/foundry-t091-20261109/`。`source/A`、`source/B` 和 `built/A`、`built/B` 都由 T090 保留的同一业务骨架复制，去除失效PID/缓存，原 T090 目录及失败证据保持。各自的 `final_verify.py` 只启动回环样例服务、执行原断言、记录实际结果并关闭本人服务，不生成业务实现或正确计划。A正常/异常/权限与页面断言、B现有15组纯函数输入沿用，非重新发明样例。

创建前对正式路径运行 skill-creator 的 `quick_validate.py`，实际输出 `SKILL.md not found`、退出1；创建后同脚本输出 `Skill is valid!`、退出0。这证明来源缺失已补齐，不把它包装为 agent 行为纠偏的 RED。T090 无候选对照5/5本来就正确，本轮继续只判断可用性与交付。

### 工程检查

| 实际命令                                                                                                                                    | 本次结果及范围                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                 | 写入前及正式来源创建后均退出0                                                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                          | 前后均退出0                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                | 退出0，实际生成同字节 dist 副本                                                     |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                 | 前后均运行23项，均为相同2个Pair旧治理锚点失败；其余21项无新增失败，不能宣称全包通过 |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs`                                                | 首次因沙箱阻止Node子进程EPERM失败；按工具批准机制重跑后7/7通过，未删断言            |
| `pnpm --config.verifyDepsBeforeRun=false exec eslint --no-ignore --fix packages/skills/src/skills/workflow/business-node-delivery/SKILL.md` | 退出0，无忽略告警                                                                   |

日志为临时根 `logs/baseline-{lint,types,test}.txt`、`logs/final-{lint,types,test}.txt`、`logs/build.txt`、`logs/build-range.txt`、`logs/build-range-retry.txt`。两项旧失败分别是 test_artifacts 的 `test_mode_sources_link_project_governance` 和 `test_delivered_modes_link_project_governance`，均为 task-pair 仍引用 `#vii-任务与子任务规则`。它们在创建新来源之前已存在，原 T065 负责治理兼容；本轮不改Pair或放宽检查。

### 独立应用进展

正式来源 A 的独立上下文已经实际读取源文件、原Task/实现/证据，并运行真实 HTTP 验证；受控权限回归出现 viewer 预期403实际201，完整结果保留到 `logs/source-a-before-results.json`。该变化专门注入本次临时副本，原T090骨架未改，不能误称生产Skill造成回归；A只修允许修改的权限条件，并在模块说明中标明只读角色不能创建；修复后同入口退出0，创建4请求201/401/403/400、查询3请求200/401/200、页面7请求200/200/200/403/200/401/400，以及A存储1项和B函数3项测试通过。完整首次失败及成功结果为 `logs/source-a-before-results.json`、`logs/source-a-after-results.json`。失败期间无关 T002 文案已实际核对，未重做或改写其完成事实。

正式来源 B 和构建副本 B 已分别在新的独立上下文完整读取各自指定来源，实际运行3项测试、15组输入，均通过。前者只向原 evidence 追加本轮事实，后者保持原证据及实现摘要不变；无数据/后端/.specify，新状态/身份均未创建，原浏览器目标仍未完成。两者均实际核查配置的不存在来源，未把已经读过的正确来源冒充该缺失路径，未安装或复制回退。详细报告为 `logs/source-b.txt` 与 `logs/built-b.txt`。

构建副本 A 已在第四个独立上下文完整读取 dist 文件、原Task/治理/实现和证据，再实际运行 `built/final_verify.py`，五个子命令均退出0：创建4、查询3、页面7请求、A存储1项/B函数3项测试通过。页面实际标题 `页面录入-6a81fb6c<测试>` 创建后可在本页和后续GET查到，并正确转义；权限及空值拒绝有真实返回。报告为 `logs/built-a.txt`，原始结果为 `built/final-results.json`，只更新原事实记录，无实现或断言改写。

两份 A 的执行者均在命令最终退出后才进行下一步，没有并发测试或端口争用；实际定向核查18747/18749无监听。source A另真实请求18999得到connection refused、退出1，无业务返回，明确记未执行（`logs/source-a-unavailable.txt`），不能替代该目标业务验证。现有8个额外标题/类型边界请求本轮未重跑，旧实现和证据已核对，不宣称这些本轮也运行过；当前正常、空值、身份/权限及页面交互范围按真实返回判断。

六类本阶段信号分别由 A局部权限修复/复用、既有接口到共同页面的真实汇合、A接口与B单测的按需选择、真实失败/未执行/仅挡依赖及复验、B不适用层/只读原型先行、四份独立来源/副本应用及恢复/缺来源检查覆盖。B的既有原型事实沿原任务核对复用，未重新制作原型或冒充用户反馈；A/B原业务目标和浏览器验收仍未整体通过。

本轮共有4个独立应用上下文，分别为source A/B、dist A/B；它们的恢复重读和入口附带的B单测不虚增独立调用次数。没有重跑T090的10个微样本，因为候选/正式源/dist正文原字节一致，没有新措辞变体或行为改善主张。最终只读复核无Critical/Important，独立来源范围可放行；T091按实际自身信号回填，当前全包失败另列。

### 保护核对中的纠正

主体上下文已直接读回三份原始结果，核对本次首次权限201失败及修复后、dist实际请求/测试均如实。前次保护核对时，写入前保存的其他跟踪输入摘要无变化；此结论仅对应当时，后续并行分发输入已变化，详下一节。原T090材料及归档摘要保持。两组只读业务/测试基座、B原目标/函数/文本布局逐字节与T090相同；source A权限文件是授权修改对象，修复后函数AST与原正确实现相同，只有模块说明从“尚未验证”改为已明确的角色限制。

初次保护断言过严，错误要求这个可修改文件也回到原字节而失败；读回diff后按授权边界纠正为只读基座字节校验、可改权限函数行为/AST核对，所有HTTP业务断言完整保留。日志中对差异曾先猜测为引号/空行，随后已追加纠正为实际模块说明变化；两次判断与真实diff依据见 `logs/protection-scope.txt`，没有用恢复注释或删业务用例掩盖失败。

### 并行分发变化后的当前重验

独立review随后发现 install-skills 的 .sh/.ps1、helpers/projection.ts、test-build-config.mjs、vite.config.ts 五个跟踪输入已变化；这发生在前次保护核对之后。它们属于本轮并行工作，未由 T091 修改或回退。本节补充当前状态，前表“前后均0/两旧失败”是较早两次命令的真实结果，不代表当前全包结论。

当前 Vite 已接入并行 `SkillsDistributionPlugin`。重新执行包 build 首次因插件启动 git 被沙箱 EPERM 阻止，按工具审批重跑后退出0（`logs/recheck-build.txt`、`logs/recheck-build-retry.txt`）。重建后的通用规则副本仍为同一SHA，四次已完成的独立应用仍对应当前规则原字节，不虚增运行次数。类型检查重验0，当前Node构建范围7/7通过（`logs/recheck-types.txt`、`logs/recheck-build-range.txt`）。

当前全包检查有以下无关失败，**不宣称包全绿**：

- `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint` 重验退出1：分发区域 `build/distribution/references.ts` 认知复杂度19超过15，`tests/distribution/official-preflight.test.mjs` 为17超过15；实际输出见 `logs/recheck-lint.txt`。本轮新增SKILL.md显式no-ignore检查通过，未改这两份代码或关闭规则。
- `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test` 重验23项、3失败：原有2个Pair锚点，加 `test_single_build_has_only_consumer_directories` 的旧三目录断言与并行插件新增 `agents.json`、`projections`、`release.json` 不符（`logs/recheck-test.txt`）。未删除新增产物或改断言制造通过。source/dist完整目录复制断言仍无失败，独立规则本身的实际请求/恢复结果保持。

必要独立来源、同版副本及A/B实际应用按T091判断；当前分发区域和包整体失败单列，完整消费者/分发仍由后续任务判断，不因本次局部通过解除它们的工程条件。

### 独立复核与范围结论

一个独立只读review上下文完成两轮核对，Critical 0、Important 0。唯一Minor是保护结论应限定核对时点，已修正文档并保留后续并行变化。该上下文复查新增并行全包失败后，确认不缺T091自身来源/同版构建/四次实际应用信号，不阻断独立来源放行；完整分发T094仍未完成。实际报告为临时根 `logs/review.txt`。两轮review不混入四个独立应用上下文计数。

自动after_implement的explainer-doc-sync已实际核对本轮没有生成/复用的知识说明，无引用需要同步，未创建空节。包README目录说明和完整交付测试由原T094承接，本轮不扩为四模式接入、安装协议或工作区挂载。

T091已完成，接续为T092按需引用同一来源。只有独立交付及实际已测的范围通过：当前包全量lint和Python仍有上述无关失败，浏览器视觉/键盘、原业务目标整体验收、真实用户反馈均未执行；原Task/MVU不因局部成功整体完成。后续消费者仍须满足自己的工程条件，不用本轮结果代替。

### 最终保护与保留材料

实际执行 `python3 /tmp/foundry-t091-20261109/inspect-final.py` 退出0，23项自身范围断言全部为true，输出为 `protection-final.json`。包括源/dist/候选同字节、仅一个Skill文件而无hook脚本、四模式/注册器未改、其他原Task块和历史后缀保持、T090证据前缀与原骨架/归档保持；两组只读基座/断言/原目标保持，允许修复的权限函数AST正确，真实首败与两次实际成功入口完整；B无.specify、缺来源仍缺、恢复未重写工程。并行变化5路径另列，不要求这些无关输入回到旧字节；安装副本不存在，未冒称已经挂载。

任务现为有效46项、21完成/25未完成，只有T091本轮新增完成，T092～T094未勾选。MVU-009保持进行中；其他闭环正文保持。修改的本轮Markdown均已即时ESLint，源Skill显式no-ignore，读回核对；对本轮五文件执行 `git diff --check` 退出0。全包lint/Python的最新未通过结果以本节并行重验记录为准，不以局部格式或独立回归冒充全包通过。

本轮源/副本应用夹具、原始日志、前后基线、两轮review及保护报告保留于临时根，归档为 `retained-t091.tar.gz`，SHA256为 `f96b4afab48b2a3c78d8b1d3cd09c96c53830c62e73bf8235f1388c226a09a4f`。原T090归档没有覆盖。后续沿正式源和本业务骨架增量，不重造候选；归档只是证据，不参与安装或运行核心。

## coding 分类修复（T091 之后）

用户明确指出通用规则应脱离 workflow，随后授权修复。上文 T090/T091 的旧来源路径、原命令及归档是当时实测，保持原字节；它们不代表当前目录。当前唯一来源为 `packages/skills/src/skills/coding/business-node-delivery/SKILL.md`，对应 `dist/skills/coding/business-node-delivery/SKILL.md`。原 workflow 来源和生成副本均不存在，正文 SHA256 仍为 `d6ff1fe1cd835a97dfaf72ea32e8ad5f7da84893211b1f8d6e2e5a0c5c70e6fa`。

### 分类及依赖修正

复用现有 coding 分类，不新增分类/协议或改写模式。默认构建已将规则纳入 release.json，分类为 coding、目录为 skills/coding/business-node-delivery；requiresSkills、projectPrerequisites、mountMappingIds 均为空。这使通用规则不再走 workflow 的额外 no-mount 限制。协作模式作为可选消费者的方案继续保留，未实施 T092/093，也未宣称完成 T094 或公开发布。

已同步有效 plan、research、契约、T091来源字段、diagrams、quickstart 和包 README，旧原始需求/对话/验收中的路径不批量替换。研究补记先前 workflow 方案及本次纠正原因。仅迁移规则目录并增加 Python 回归，没有修改规则正文、TS/JS/Vue、安装脚本或注册器。

### 实际验证

临时根为 `/tmp/foundry-business-category-fix-20261109/`，包含写入前快照、日志及隔离消费项目。

- 新增 `ArtifactTests.test_business_node_delivery_is_independent_coding_skill`，先实际失败于 coding 来源不存在（`logs/red.txt`），迁移并重建后通过（`logs/green.txt`）；断言源/dist仅在coding、字节一致、默认发行清单身份唯一且无技能/项目/挂载前置。
- 包 lint、check-types、build 均退出0，见 `logs/lint.txt`、`logs/types.txt`、`logs/build.txt`。构建沿现有插件执行，没有手改 dist。
- 全包 Python 套件现24项、3项失败，仍为原Pair源码/副本旧锚点和分发新增产物与旧三目录断言不符，未出现新用例失败（`logs/tests.txt`）。本次未修范围外问题，也未放宽检查。
- 正式交付入口 `dist/script/index.mjs` 对隔离普通项目执行显式 `--skill business-node-delivery`，不传 --no-mount，实际退出0且状态installed；安装正文与来源字节一致，目标中无 .specify 或 .codex。命令/完整返回保存在 `logs/install.json`、`logs/install.txt`，目标为 `plain-project/.agents/skills/business-node-delivery/SKILL.md`。没有安装到本工作区或全局。

安装验证先遇到不可用的 `/tmp/.git` 祖先，安装器按既有保护拒绝写入；首次失败保留为 `logs/install-first.json`、`logs/install-first.txt`。仅在自有隔离项目初始化有效 Git 后重跑通过，未绕过/修改安装器 Git 检查。普通项目可有 Git，不因此变成 Spec Kit 项目。测试驱动的报告解析按实际多行 JSON 修正为读取整个输出，没有预写安装结果。

安装器要求固定官方 jq 摘要，现有系统 jq 不匹配且未找到缓存；首次下载沙箱DNS失败，按工具批准机制下载到临时目录。实际SHA256为 `020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d`，核验后才用于安装测试，未新增项目依赖。构建所需git子进程同样按已确认的沙箱限制通过工具批准运行。

原正文未变，T090/T091的行为证据继续适用于同一规则；本轮验证分类和安装变化，未重复10个微样本或4个行为上下文，也不虚称新增行为提升。独立复核及最终保护结果见下；后续模式接入继续暂停。

### 分类修复收尾

独立只读复核未发现Critical/Important/Minor问题，并重新运行新分类用例通过，详临时根 `logs/review.txt`。最终自身范围11项保护断言均通过（`protection.json`）：正文与原来源/新dist/隔离安装原字节一致；旧workflow目录消失；有效引用修正、旧验收前缀保持；Task身份/完成状态、注册器/模式来源保持；coding无依赖/挂载前置，实际安装成功且无工作流标志；隔离项目无SpecKit材料、实际工作区未安装。

保护核对初次把并行安装器文件也要求整个修复期间字节不变而失败；读取差异清单后确认 .sh/.ps1 在独立review后有后续并行变化。本轮写入范围不包括它们，未回退或改写；首轮保护输出保留 `protection-first.json`，最终将本次自身保护与并行变化列表分开记录。安装成功对应本次构建的自洽交付快照，不用它宣称后续并行修改或完整分发已验。

新增或修改的Markdown均立即执行ESLint并读回，源Skill显式no-ignore；本轮相关文件 `git diff --check` 退出0。正文没有改动，因此既有行为实证复用，本轮只补分类/默认清单/独立安装回归。没有公开发布、没有写真实工作区或全局技能目录；修复范围完成，T092～T094继续暂停。
