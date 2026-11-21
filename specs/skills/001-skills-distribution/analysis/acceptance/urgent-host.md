# T087：最终候选的真实Codex宿主消费证据

实际日期：2026-11-12。依据[原任务](../../tasks.md#t087)、[本项方案](../../implementation/T087.md)、[正常两步技术证据](urgent-mount.md)及当前实际轨迹。本记录覆盖本地Linux/Codex项目级消费，不代表公开固定来源发布或真实业务任务已获认可/结案。只保存必要统计和[无正文覆盖索引](urgent-host-coverage.json)，完整原始JSONL保留在本次私有/tmp现场，不另打包源码、画像、配置或凭据。

## 实际输入及执行角色

最终版本0.1.0，sourceRevision=7e79b524b85fdfb5678acbe54ebfb41ec94bec1f，candidateDigest=498f5e8984061c21344ed3c4566ceb5dea1ce0e1301f0fb01342e396b8bdc8e6，catalogDigest=5305dfcc5d799f52b920829d71498cb8c27329ba35cd1bfcbc5dab7ac4a8c70c。此前c8b4f305准备器失败与修复留在urgent-mount，不作为本轮成功来源。当前上下文为/tmp/urgent-host-consumption-rogydhlh/probe-context.json，真实消费项目为同目录project，formalSpec为specs/docs/001-note-review。

runtime实际使用同次在线核验的skills1.8.1复制安装9项，12份正文/附件与候选逐文件字节一致，正常唯一第二步挂载三hook及Increment连续两次成功。三个事件由已备Specify1.2.6的真实HookExecutor读取项目登记后派发；原结果保存在project/probe/results/dispatch.json。execute_hook本身只返回command/invocation/prompt，下面另有真实Codex执行及产物证据，不以派发信息代替宿主运行。after_increment仍为空。

执行角色是实际Codex exec宿主，由root统一测试启动，用于行为执行和读取验证；不是审查代理。此前本地CLI预检实测0.167.2，正式调用沿同一codex入口，参数使用-a never、--json、--ephemeral、--ignore-user-config、workspace-write、-C自有项目、output-schema及output-last-message；每会话时限300000ms，prompt经stdin传入。沿现有认证和模型选择，不指定新model、不复制凭据。实际四份JSONL及stderr没有稳定模型名称/版本元数据，因此不凭CLI版本或回复风格推断后端模型型号。

## 实际统一运行结果

root只统一执行一次完整pnpm run test，提供URGENT_SPECIFY_CLI、URGENT_CANDIDATE_ROOT及URGENT_HOST_CONTEXT。原始全套输出为/tmp/foundry-urgent-final-all-tests.log；实际退出0，133/133通过，0失败、0跳过、0todo，426396.791543ms。T087真实正式宿主主项为248944.100476ms，四份process.json均status=0、signal=null、errorCode=null；没有error或turn.failed事件。以下统计来自实际JSONL和独立事后字节核对，不仅来自最终结构化回答。

| 真实探针         | 实际正文/附件读取                                                                                                                  | 实际行为与结果                                                                                                                                           | 原JSONL字节数 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| after_tasks      | 31条成功读取器命令，完整覆盖9项正式技能的12份正文/附件，共54,315字节                                                               | 实际执行artifact-spec-analysis，读取真实spec/plan/同级mvu/tasks后新增同一analysis/spec-analysis/README.md；最终outcome=completed，原任务及业务文件保持。 | 111171        |
| before_implement | 3条成功读取器命令完整覆盖implementation-preparation正文4,811字节                                                                   | 读取真实治理和Task材料，因T001/T002缺真实认可及implementation方案、T002另缺T001记录而正确stopped，无业务实现、方案伪造或文件写入。                       | 26802         |
| after_converge   | 1条成功读取器命令完整覆盖artifact-project-description正文1,675字节                                                                 | 读取真实未完成事实，因未验收/未结案而正确stopped，不生成冒充完成的项目描述或用户批准。                                                                   | 17151         |
| Increment        | 15条成功读取器命令完整覆盖官方生成入口652字节、task-increment正文23,172字节及同一artifact-spec-analysis正文3,484字节，共27,308字节 | 先入口后源、无源回调或嵌套Codex；实际完成一次私有规划和同一分析刷新，outcome=completed，原Task身份/状态/验收保护。                                       | 94780         |

每个探针使用本次冻结读取器的一个逻辑readId；分块属于同一次逻辑全文读取，不虚报为多次业务执行。模型实际成功命令数分别为41、10、10、27；另外before_implement与Increment各有1条AGENTS文件发现rg返回1，无匹配事实保留在原JSONL和failed-commands.json。它们不是必要正文读取失败，不能误报成保护分支失败；必须的全文、行为和文件保护断言实际均已执行通过。

## 全文、委派与文件保护的独立核对

事后只读逐个解析四份JSONL中实际command_execution.aggregated_output。每份读取片段的path、offset、length、total、SHA-256及UTF-8正文均与真实已安装文件一致，按偏移重组成完整原字节；再与最终Release identity清单逐文件比对。after_tasks实际覆盖全部9正文和3附件，不是目录列表、摘要、head/tail或模型自报已读。完整路径、字节数、SHA-256和块起点见覆盖索引，无技能正文内容。已安装内容在四会话后仍与候选一致。

Increment的生成入口所有读取先于源task-increment开始，源未再次回调入口；真实命令轨迹无嵌套codex。可观察结果为一次委派及单次局部规划，不声称测量模型内部思考次数，也不把重复读少量片段当然推断为再次规划。

独立读取最终私有产物并对照宿主启动前快照：mvu实际为MVU-001资料核对与MVU-002核对结果整理，均未开始且有依据；plan仅1处mvu.md文件级导航，无逐闭环锚点。tasks只增加业务分组与衔接说明，T001/T002原ID、未完成checkbox、目标、范围、验收及依赖行逐字保留。分析实际刷新为同一README，最终5,511字节，明确引用原Task和同级mvu，区分计划/尚未实施/无真实认可，不以分析完成代替业务通过。

业务哨兵business/sentinel.txt为85字节，前后SHA-256均为e54c12a39cd2f770e340d0b41b74f3142a8e04abfcb59a01f7ff408749efaae9，原字节保持。implementation目录、业务核对记录docs/review-record.md、业务总结docs/review-summary.md及descriptions/project-description.md均未生成。root主项同时通过会话前后完整树许可范围断言；原资料、治理、已装技能与业务哨兵受到保护。部分文档由真实shell写入而无单独file_change事件，因此文件变化依据独立磁盘前后事实，不能仅数file_change事件。

## 原始现场及继续边界

完整过程留在/tmp/urgent-host-consumption-rogydhlh/project/probe/results/下的after_tasks、before_implement、after_converge、increment四目录。每目录有实际prompt、output.schema、events.jsonl、stderr、process、final及failed-commands；原始正文和私有上下文不复制进本验收目录。覆盖索引另存各JSONL的SHA-256以便定位原始字节，索引本身是本次运行证据，不维护第二套工程状态。

本轮结果证明最终候选在声明的Linux/Codex项目级组合中，正常官方两步之后三个所选hook和Increment确有实际完整加载及相应行为。两个正确停止只证明缺认可/未结案保护有效，**不代表自有Task业务已验收、用户已认可或项目已结案**；T001/T002继续未完成。也不模拟真实独立使用者反馈，不能抵扣要求真实用户证据的主线成功标准。

只保留必要字段及原始路径，没有读取、导出或复制身份/配置全文/凭据。没有再次运行模型或测试，没有改源码、context、任务checkbox、公开远端或迁仓。T087的完成判断交协调者结合本地技术/故障证据；T089最终本地交接仍由root收口，完成后暂停，T090～T093和最终公开SC-019仍等待实际迁仓、明确继续及具体候选授权，不因这次133项通过自动放行。
