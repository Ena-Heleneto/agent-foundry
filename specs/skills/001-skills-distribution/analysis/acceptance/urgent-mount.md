# 紧急版挂载与宿主验收

本文件按实际阶段追加证据，技术汇合、真实候选和宿主执行分别判断。

## T086技术汇合：当前源码脚本与真实官方两步（2026-11-12）

依据[T086方案](../../implementation/T086.md)，协调者在T082官方安装/保护及实际九身份列表、T085共享迁移范围就绪后放行。进入前真实候选源码47397b714194c4f5312825af0e20ddd88dfad0e6及36文件双构建事实保留；本项修改mount后没有拿该旧dist验证新源码，也不将T082未完成的全文件复跑记成11项全通过。

### 实际改动与结果保留

本项只改packages/skills-distribution-urgent/script/mount-entry/mount-entry.sh，并新增tests/mount-contract.test.mjs。正常与失败两条路径均读取注册器的完整机器报告，保留hooks.results、hooks.retired和逐项success/failed/not-run；legacy依六旧hook的真实清退/不存在核对结果计算，并保留相同逐项事实，模式入口结果仍在commands独立报告。legacy的success表示明确六ID已核对，不单凭普通目录存在推定全部历史迁移或宿主通过。

hook退出0但缺少有效逐项成功报告时，hooks标failed/invalid-hook-report，commands保持not-run，不把进程退出0当挂载业务成功。hook实际故障保留安装/完整性与前面已成功项、清退事实和后项not-run，Increment真实目标调用0。loading继续not-run/requires-host-session，不在本脚本中冒认Codex已完整执行。

### 本轮实际验证材料

默认测试材料明确标记current-source-script-fixture：本次私有release骨架原字节复制当前源码脚本、四项真实工作流正文/附件和当前集中配置，使用测试专用README/许可标记和合成源码SHA，不是正式公开候选。第一步由本次在线核验得到的真实skills1.8.1执行--agent codex --copy及显式选择，第二步从同一私有材料的正常node script/index.mjs运行，不使用check、official或no-mount代替。

第二步的uvx进程边界只转发到已备真实Specify1.2.6绝对CLI，必要官方YAML读取转发同环境Python；不安装工具、不伪造成功或registry。边界记录cwd和实际参数，因此能区分私有重建与真实目标调用。各消费项目与npm工具缓存均在本次拥有的临时根，失败恢复不触真实用户项目或旧候选。

| 实际命令/输入                                                                                                                                                                                                                  | 预期与实际结果                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URGENT_SPECIFY_CLI=<source-home>/.cache/uv/archive-v0/om6AD6JxRTroJuBL/bin/specify pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec node --test tests/mount-contract.test.mjs，修复前 | 5个子场景中3通过、2失败；正常与hook失败两项均明确断言“丢失hooks.retired实际清退结果”，日志/tmp/foundry-urgent-mount-red.log。不是依赖环境错误或人为破坏来源造红。 |
| 同命令，修复后最终范围                                                                                                                                                                                                         | 退出0，6个子场景全部通过；Node统计7/7、0失败/skip/todo。实际日志/tmp/foundry-urgent-mount-green.log，scope=current-source-script-fixture。                        |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec eslint tests/mount-contract.test.mjs                                                                                                 | 退出0，新声明有中文多行JSDoc，未关闭检查规则。                                                                                                                    |
| bash -n packages/skills-distribution-urgent/script/mount-entry/mount-entry.sh                                                                                                                                                  | 退出0。                                                                                                                                                           |

正常三hooks加Increment连续两次实际注册，每次真实目标4次官方add，总8次；源技能正文/附件和无关用户字节保持，正式入口存在而loading仍未验。第二hook故障场景保留第一项success、当前failed、第三项not-run，commands未调用。另覆盖退出0无有效报告、普通技能在Spec Kit项目不触发任何历史workflow、缺已备jq及公共脚本字节漂移拒绝；相应目标完整树保持、官方调用为0。

### 后续真实候选与宿主边界

源码已交回协调者，须从修改后真实输入重新冻结/构建，再使用同一测试的URGENT_CANDIDATE_ROOT内部模式指向新候选。该模式先要求候选mount原字节等于当前源码，并只在私有副本上注入故障；真正候选身份、完整内容与两个阶段的结果由该次实际运行追加，不能把当前样本结果换标签。

本轮未启动Codex会话、不宣称T087宿主通过，也不把技术汇合材料当最终本地完成或公开SC-019通过。用户主线手写、T089本地验证后暂停以及迁后另行授权发布的边界保持。

## 最终候选c8b4f305的准备器首次运行：失败，尚未安装（2026-11-12）

协调者提供sourceRevision=c8b4f3058a531ce511e8228086b726f83c27c89e、version=0.1.0、candidateDigest=5147ed1cb672cd89dbcf084ab70c39fcac85898a6d7a587d5db84121f09fd567后，实际运行已冻结tests/helpers/prepare-host-context.py，显式传入候选dist、来源SHA、摘要、已备Specify1.2.6及case-timeout-ms=300000。独立候选字节校验及已备工具版本检查已进入，准备器整体退出1，日志/tmp/foundry-urgent-host-context-prepare-final.log。

失败发生在解析真实在线upstream输出：Node -e调用把被导入read-agents.mjs路径放到process.argv[1]，触发产品模块的直接执行判断；它自动输出完整Agent JSON，准备器再次显式调用后又输出upstream JSON，导致json.loads报Extra data。该子进程实际退出0，但stdout有两份JSON，不能据此把上游准备阶段整体记成功。

本次拥有目录为/tmp/urgent-host-consumption-60ba2018/project，原始stdout/stderr及进程回执位于probe；没有.agents/skills、mount.json或probe-context.json。官方安装、正常两次挂载、列表及宿主全部未运行。没有修改冻结源码或候选，也没有复用旧context冒认通过；已向协调者报告仅修测试辅助器argv布局的最小恢复方式，待对应放行及身份重新核对。

### 准备器argv修复的定向复验

协调者明确放行后，仅替换tests/helpers/prepare-host-context.py的5行：两次Node -e调用增加稳定非文件argv占位，读取模块路径改从argv[2]、固定来源参数改从argv[3]。没有修改产品isMain逻辑或候选字节。针对当前真实候选模块实际执行本次线上upstream读取和固定来源转换，两次均退出0且各只产生一个可完整json.loads的JSON对象；线上对象仅有package/channel/version/integrity。Python AST、帮助入口及scoped diff --check通过。

该复验仅证明准备器调用边界已修复，不等于正式安装、挂载或宿主通过；仍等待协调者重新冻结后提供新来源身份和摘要，再创建新的真实消费context。首次失败现场与日志保留，不换标签或复用为成功结果。

## 最终候选7e79b524：正常真实两步上下文已就绪（2026-11-12）

协调者在仅修准备器后重新冻结并双构建，提供实际sourceRevision=7e79b524b85fdfb5678acbe54ebfb41ec94bec1f、version=0.1.0、candidateDigest=498f5e8984061c21344ed3c4566ceb5dea1ce0e1301f0fb01342e396b8bdc8e6、catalogDigest=5305dfcc5d799f52b920829d71498cb8c27329ba35cd1bfcbc5dab7ac4a8c70c。此前c8b4f305的失败保留；本次没有复用旧失败现场或将旧context改成成功。

实际运行已修复且再次冻结的prepare-host-context.py，使用当前真实dist、上述来源SHA/候选摘要、已备Specify1.2.6及case-timeout-ms=300000。命令退出0，独立核对公开36文件精确集合/字节和候选摘要通过，生成全新自有项目/tmp/urgent-host-consumption-rogydhlh/project及上下文/tmp/urgent-host-consumption-rogydhlh/probe-context.json。准备日志为/tmp/foundry-urgent-host-context-prepare-7e79b524.log；所有原始工具stdout/stderr和实际进程回执在项目probe目录。

| 实际阶段               | 结果与证据                                                                                                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 本次在线官方工具身份   | skills1.8.1，SRI见probe/official-install.json，来源是同次产品readOnlineAgents实际核验结果，不固定为后续版本。                                                                                                                     |
| 官方真实项目级复制安装 | npx skills@1.8.1 add当前候选，显式全部9项、--agent codex --copy，实际exitCode0；正式9项的12份正文/附件逐文件bytes/SHA-256及精确集合相符，安装证据probe/official-install.json。                                                    |
| 正常唯一入口第一遍     | 从同版候选node script/index.mjs，显式分析、准备、结案、Increment；installation/integrity/hooks/commands/legacy均success，三个适用hooks及Increment由真实1.2.6注册，retired保留六项逐项清点，loading仍not-run；见probe/mount.json。 |
| 正常唯一入口第二遍     | 同版同选择正常重试，全部适用注册阶段仍success，retired仍六项，loading仍not-run；见probe/mount-retry.json。                                                                                                                        |
| 真实官方列表补验       | 在同一新项目、同一实际skills1.8.1与候选上另跑--list，实际exitCode0，Found9且名称精确等于候选9项；列表前后全部已安装正文/附件/生成入口摘要保持。见probe/official-list.json及/tmp/foundry-urgent-host-list-7e79b524.log。           |

这里的legacy.success仅表示六旧hook明确ID已核对；未存在者仍保留not-installed事实，不凭空声称执行了所有历史迁移。官方生成speckit-modes-increment入口、业务哨兵、owner标记及自有正式spec/plan/mvu/tasks/constitution均存在；T001/T002仍未完成、没有实施认可或结案证据。没有复制任何认证，也没有启动宿主模型；交接时probe/results尚不存在。

已将该真实context交协调者统一执行最终完整测试和四个宿主探针。此节只证明最终候选上的正常真实两步和列表/完整字节结果，不能抵扣尚未执行的宿主全文加载、故障矩阵最终复验或T089全部本地完成。新包源码和候选未修改，旧失败日志保留。

## T087宿主补证：最终候选实际全文加载及行为通过（2026-11-12）

本节补齐上方正常两步当时仍未执行的宿主证据，不覆盖任何技术结果、首次准备失败或原始阶段事实。实际来源仍为7e79b524b85fdfb5678acbe54ebfb41ec94bec1f，候选摘要498f5e8984061c21344ed3c4566ceb5dea1ce0e1301f0fb01342e396b8bdc8e6；使用同一真实9项安装及两次正常挂载后的/tmp/urgent-host-consumption-rogydhlh/project。

root随后只统一执行一次完整测试，实际133/133通过、0失败/skip/todo，总426396.791543ms；其中T087主项248944.100476ms。四个真实Codex exec过程均退出0，after_tasks/Increment为completed，before_implement/after_converge为符合实际缺条件的stopped。详见[真实宿主证据](urgent-host.md)及[无正文覆盖索引](urgent-host-coverage.json)，原完整日志/tmp/foundry-urgent-final-all-tests.log和project/probe/results四目录保留，不打包复制私有正文或凭据。

after_tasks的31条真实读取器命令覆盖9项正文和3附件全部54,315字节；另外两hook各完整读入自身正文。Increment的15条读取器命令完整覆盖官方生成入口652字节、源task-increment23,172字节及同版分析技能3,484字节，入口先于源、无回调或嵌套Codex，实际完成一次局部规划及同一分析刷新。逐块原文输出和最终字节/摘要由断言及事后只读核对共同确认，不以HookExecutor返回信息或模型最终自称替代。

私有mvu实际分为MVU-001核对与MVU-002整理，plan仅一处mvu文件级链接，T001/T002的ID、未完成状态及原目标/范围/验收/依赖保持；业务哨兵85字节原SHA-256不变。两个正确停止没有生成实施认可、业务输出或结案稿，不是相应业务验收通过。主项会话前后受保护文件范围断言通过，原安装内容仍与同一候选一致。

挂载脚本原始JSON中的loading=not-run/requires-host-session保持原字节，其职责仍只报告注册；实际宿主消费已由本节引用的独立会话补证，未通过改标签伪造脚本已执行AI。此前所有未验语句仍保留其发生阶段。T089最终本地交接由协调者另行收口，完成后暂停；本次不进入T090，不代表迁后公开固定来源或最终公开SC-019已通过。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
