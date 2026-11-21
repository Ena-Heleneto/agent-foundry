# T080：独立完整技能构建验证

范围仅独立工程的 build/distribution、build/plugins、基础 README 和 tests/build.test.mjs。唯一 Vite 配置由协调者接线，运行脚本由 runtime 代理实现，共同沙箱 helper 由 contracts 代理维护；主线源码、归档及 dist 没有本次写入。

## 已落地内容

从 [T078 原字节快照](urgent-source.md)适配完整 9 项技能，不改变正文或附件。以单一 SkillsContentPlugin 在 configResolved 阶段完成来源检查，generateBundle 使用 emitFile 输出同一次原始字节；不执行脚本，不输出虚拟入口，write=false 不落盘。删除不再适用的旧脚本/分发插件与 Eve 转换模块，避免重复职责或未支持格式活动实现。

保留 Release schemaVersion=1 的 version/sourceRevision/tools/files/skills/projections/adapters 等字段，投影仅 identity，拒绝 development=true。parseRelease/parseReleaseJson 沿用严格结构与跨字段检查；verifyContent 复核已声明技能完整目录；verifyCandidate 对照整个磁盘文件集恰等于 files 加 release.json，计算清单原字节摘要和按 UTF-8 路径字节排序的固定 path/bytes/sha256 JSON 索引摘要。

来源严格限定 coding/frontend/workflow 的 9 项及必要附件，目录或集中配置中的未知项均拒绝；正式集中配置原字节进入 script/config/分类/collection.config.json。运行脚本从当时整个 script 树固定，不冻结初始 14 文件数，新增的同版真实模块亦进入摘要。缺必要运行模块、正文或附件、链接、大小写冲突、身份错误、越界引用均失败。Increment 声明依赖分析及实施准备，依赖只记录不自动安装。

版本从独立 package.json 读取，sourceRevision 从独立 Git 根的真实干净 HEAD 读取，不接受环境变量覆盖。逐份公开字节再与该 commit 的 git show 结果比较，拒绝被忽略的未跟踪来源、冒认父工程或并发读取漂移。构建缺件或来源非法时，在清理输出前失败。

## 实际检查

T079 首轮真实缺能力红灯由协调者确认后才修改产品实现。构建专项先执行，真实暴露旧插件硬编码 src/mcp；适配后共同 SSR helper 暴露 yaml 外置导致临时编译结果无法解析依赖，由其维护者补 ssr.noExternal 后继续，未通过修改产品候选或假安装依赖求绿。

本次使用已安装的 `<source-home>/.local/share/mise/installs/pnpm/latest/pnpm`，Node 24.22.2、pnpm 12.16.1。以下均是实际执行结果：

| 检查                                       | 结果                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| pnpm run lint                              | success，ESLint 退出 0                                                                 |
| pnpm run check-types                       | success，严格 tsc 退出 0，未降低检查配置                                               |
| pnpm exec node --test tests/build.test.mjs | success，10/10，无 skip/todo                                                           |
| 当前独立根 pnpm run build                  | failed，先因实际缺 LICENSE，用户许可补齐后复跑准确报告“来源工作树不干净，拒绝冒认提交” |
| 当前独立根 dist                            | 未创建；来源校验失败前不清理或生成产品材料                                             |
| 正式产品同源双构建、实际官方安装与宿主挂载 | not-run；尚未冻结独立干净源码，不能用合成沙箱替代                                      |

构建专项使用 9 项真实正文与最新完整脚本，但只在测试独占 Git 中提交，并使用明确标注为测试数据的合成 LICENSE；不是产品许可来源或公开候选。首项通过真实 Vite 构建生成两个独立输出，完整树和字节完全相同，9 项身份与所有附件保留，清单与严格磁盘验证一致，集中配置逐字节相同；在 script 写入会抛异常的 trap 模块，证明构建只复制不执行。

另外 8 项分别拒绝缺附件、额外公开技能、未知集中配置、重复 frontmatter 身份、大小写冲突、链接、缺 LICENSE、引用越界，且均具体核对对应失败原因，并确认旧输出 keep.txt 原字节保留。最后一项验证冒认提交和脏源码拒绝，以及真实 Vite write=false 没有生成输出目录。

## 许可与未完成边界

T078 时未发现许可证是真实初始事实，本轮后来由协调者转交用户明确“可以，就是用 ISC 吧”的确认，在独立根补齐实际 ISC License，Copyright (c) 2026 Ena-Heleneto；已实际读回全文并由协调者设置 package license=ISC。基础 README 同步了许可已具备，未构造替代文本。

当前 T080 实现与局部工程验证具备，但尚不宣称整体验收完成：待协调者冻结独立源码提交后，从实际工程重跑完整构建、双构建字节比较和真实官方安装相关验证，再按实际证据判断。还未创建远端公开仓库；迁后源码身份、授权发布与匿名来源消费仍须后续对应任务完成。

## 2026-11-12：工作区T080适配及范围复验

本节对应packages/skills-distribution-urgent实际新位置，保留上文仓库外独立根的历史证据。本次只写build/distribution（新增source.ts）、build/plugins/content.ts、tests/build.test.mjs和当前方案/证据；唯一Vite配置检查通过但未改变行为。经协调者授权，公共helper只增加semver到SSR noExternal，其他fixture和15项T079来源断言未改。主线packages/skills及归档不在写入范围；根catalog及包依赖的semver/官方类型声明、安装由协调者统一处理。

### 实际行为与身份

- snapshot.source包含sourcePackagePath（根包为`.`）、真实sourceRevision、Git根相对UTF-8排序inputFiles/inputDigest、dependencies/dependencySnapshotDigest。该结构只留本地，公开release.json继续schemaVersion=1及原消费者字段，不含source或机器绝对路径。
- 包源码/配置/版本及实际catalog、preset来源按本次Git根和包前缀逐字节比较真实提交；用git ls-tree补核对被删除的已提交输入。忽略规则不能隐藏实际交付脚本，无关脏文件/主线eval不会扩大输入或公开9项。
- 实际工具元数据及依赖边、根锁原字节、preset生成dist另列依赖索引，未跟踪锁/生成物不冒认Git源码。catalog按实际解析包版本核对，包括已提交999.0.0而实际yaml旧版本的拒绝分支。SemVer复用现有semver及官方类型，不新增自有版本算法或类型放宽。
- 公开技能、集中配置、脚本、说明与许可原字节绑定同次来源索引；快照结束与Vite资产生成前重新核对revision、输入集合及两类摘要。构建仍不执行运行脚本，write=false不写产物，未知/缺件/链接/越界/大小写/重复身份等原有失败边界保留。

### 红灯到通过与实际命令

T079初始14项真实红灯由协调者确认后开工。首轮构建/来源合计25项实际24通过、1失败，剩余为契约代理新增的已提交catalog实际版本不匹配未抛异常；没有靠dirty或统一根目录错误遮蔽。自己的“已提交构建输入删除”新反例也先实际失败于Missing expected exception，再补来源全集核对后转绿；新增配置后漂移验证实际生命周期复核。没有删断言、skip或损坏产品求绿。

| 实际命令                                                                                                                                                                                                                                                                                                                                                 | 结果与适用范围                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 定向修复复验，完整实际命令见下方代码块                                                                                                                                                                                                                                                                                                                   | success，3/3通过，0skip/todo；仅定向复验新修复。                                                                                       |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec node --test --test-isolation=none tests/workspace-source.test.mjs tests/build.test.mjs                                                                                                                                                                         | success，27/27、0fail/skip/todo，约67.9秒；15项workspace来源及12项完整构建范围。                                                       |
| pnpm --config.verifyDepsBeforeRun=false exec eslint packages/skills-distribution-urgent/build/distribution packages/skills-distribution-urgent/build/plugins/content.ts packages/skills-distribution-urgent/vite.config.ts packages/skills-distribution-urgent/tests/build.test.mjs packages/skills-distribution-urgent/tests/helpers/urgent-sandbox.mjs | success，退出0；无本项规则关闭或全包批量fix。                                                                                          |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent run check-types                                                                                                                                                                                                                                                     | success，严格tsc退出0，使用正规semver类型，未加shim或降低检查。                                                                        |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent run build                                                                                                                                                                                                                                                           | failed，准确报告“来源输入不在实际提交中或未跟踪：packages/skills-distribution-urgent/package.json”；此时实际输入尚未提交，不冒认HEAD。 |
| 当前正式dist、正式同源双构建、真实官方安装与宿主加载                                                                                                                                                                                                                                                                                                     | not-run，来源身份尚未冻结、其余消费前置由原任务继续；沙箱通过不算正式候选或整体验收。                                                  |

定向修复复验的实际命令：

```bash
pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec node --test --test-name-pattern='已提交catalog|来源拒绝已提交构建输入的删除|Vite配置快照' tests/workspace-source.test.mjs tests/build.test.mjs
```

27项中的完整9项测试实际从真实正文、最新脚本及明确标注的测试许可在自有Git提交后，执行两次独立真实Vite构建，文件全集和原始字节100%一致，并通过verifyCandidate精确文件集检查；没有将该合成LICENSE作为产品许可。新包真实ISC原文未改。其他反例保留正常嵌套基线，再分别破坏实际输入，三类读取中漂移及只读无输出均通过。

当前产品build失败时未创建dist。现将构建写入权交回协调者，待全部模块就绪后只冻结实际获准输入，再按新真实提交复验工程/正式双构建及真实消费；不得将当前27项范围通过写成T080整体验收、T089本地全部通过或SC-019最终公开交付。任务checkbox由协调者按原验收判断。

## 当前工作区真实输入冻结与双构建

协调者在所有模块代码稳定且新包lint、严格check-types退出0后，仅将packages/skills-distribution-urgent和本轮新增catalog类型行作本地提交47397b714194c4f5312825af0e20ddd88dfad0e6（feat(skills): 接入工作区紧急技能分发包）；未纳入用户主线、其他Spec或当前未提交文档，未推送。暂存差异检查发现旧Shell一处尾随空格，已只修该行并重验。

实际在当前工作区执行两次pnpm --filter @foundry/skills-distribution-urgent run build均退出0，首轮Vite报告696ms。独立逐文件索引核对36文件全集、bytes、SHA-256完全一致；release.sourceRevision准确为上述实际提交，9项技能、仅identity，payload精确为35项files加release.json。日志/tmp/foundry-urgent-workspace-build.log及/tmp/foundry-urgent-workspace-build-second.log，首轮完整索引/tmp/foundry-urgent-build-first-index.json。无关用户/其他Spec脏文件存在但未阻断此实际输入闭包，亦未修改它们。

这是本轮工作区真实候选，不再只是独立夹具算法通过；官方内容安装、正常挂载、实际宿主与最终说明变化后的复验仍须对应任务完成。后续任何本包相关输入或源码提交变化均重新构建记录身份，不拼接旧候选结果；不据此声称迁后公开交付或SC-019最终通过。

## 最终说明与汇合后的同输入复验

当前最终来源为7e79b524b85fdfb5678acbe54ebfb41ec94bec1f；README与正常挂载报告已先固定，准备器测试参数修正也已单独提交，未修改产品isMain。该真实来源两次当前工作区build均退出0，36文件全集/字节一致，独立verifyCandidate通过；最终133项完整测试后候选仍逐文件原字节一致。源输入59项、实际依赖证据413项，摘要与checks见[本地事实报告](urgent-local.json)。此前47397b7和c8b4f305分别保留各自当时范围，不能当最终身份。日志/tmp/foundry-urgent-revised-build-first.log、second.log及/tmp/foundry-urgent-final-all-tests.log；详细手交接见[暂停记录](urgent-handoff.md)。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
