# T084：工作区真实hooks注册、六旧清退与保护

日期：2026-11-12。依据[T084方案](../../implementation/T084.md)、当前紧急契约及T079/T085前置放行。生产根packages/skills-distribution-urgent，与主线源码和真实用户项目分离。本记录只验本项的真实官方注册、迁移和事件派发信息，实际Codex执行仍由T087验收。

## 本次改动

register-hooks.sh由过期check/record调用改为复用T085已冻结的prepare/compare/verify及verify-removed。每个所选新输入和六个明确旧ID先在自己的私有目录核对；需要旧输出对照时用同一真实官方CLI在probe/project重建，再compare。全部预检通过后才对目标逐项官方remove旧六登记、verify-removed，并add/verify本次所选hook。

六旧ID为artifact-issue-description、artifact-pr-description、mvu-gate、artifact-business-flow、artifact-logic-flow、explainer-doc-sync；无登记且无来源时只报告not-installed，无登记同名未知目录则冲突停止。来源和探针分离，不复制探针进扩展。未删除技能历史材料、未知附件或无关扩展，没有手写registry/YAML合并、永久指纹或新运行依赖。

报告独立保留所选results和六旧retired数组：已成功项保持success，失败项failed，后续not-run及原因；官方写入成功而读回失败另保留officialWrite/officialRemoval事实，不伪造回滚。prepare-hooks只补混合运算括号，保持command=正式技能名、合法prompt/optional/priority/condition及扩展字段、过滤enabled=false和provides为空。

## 真实工具与检查

固定工具为已准备的<source-home>/.cache/uv/archive-v0/om6AD6JxRTroJuBL/bin/specify，实际版本1.2.6；未使用全局1.3.3。历史YAML只由guard调用现有同环境官方ExtensionManifest解析，测试不提供自有YAML实现。所有正向登记由真实extension add --dev --force建立，清退由真实extension remove --force完成；测试没有写正向registry。

| 实际命令/输入                                                                                                                                                 | 预期与实际                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec node --test tests/hooks.test.mjs，接线前                            | 退出1，2通过/1失败；真实错误为缺少受管核验参数，Bash仍传check且缺probe，未到故障官方进程。         |
| 接口适配后的原3项                                                                                                                                             | 退出0，3/3通过。合法选择能到真实进程边界，非法optional及disabled保持正确分支。                     |
| URGENT_SPECIFY_CLI=<上述已备工具> pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec node --test tests/hooks.test.mjs  | 最终退出0，10/10通过，0失败/skip/todo。实际完整日志/tmp/foundry-urgent-hooks-real.log。            |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec eslint tests/hooks.test.mjs script/register-hooks/prepare-hooks.mjs | 退出0，没有通过关闭规则求绿。                                                                      |
| bash -n packages/skills-distribution-urgent/script/register-hooks/register-hooks.sh                                                                           | 退出0。接线编辑中曾出现一处shell引号未闭合，语法检查明确失败后已修复，最终10项是在修复后重新运行。 |

## 通过范围

真实三个当前hook按after_tasks、before_implement、after_converge分别登记分析、准备、结案，after_increment为空。连续两次真实重装后官方list --json和源manifest对应，已安装完整正文原字节保持，provides无新增指令。真实HookExecutor读取CLI生成的extensions.yml后返回对应command、prompt和optional信息；这只能证明派发信息，不算宿主执行。

第二项外部进程故障17的场景中，第一项确由真实CLI成功落盘，第二项failed、第三项not-run，失败退出码17保持。第三个新hook旧源出现未知用户附件时，整批在真实目标写入前拒绝，前两项not-run，完整项目树一致；临时输入保留合法条件和扩展字段并覆盖空command为正式技能名。

六个历史hooks-only扩展使用普通YAML由真实官方CLI注册，再由新脚本逐项官方清退；原无关扩展源保持原字节，最终官方list只剩当前三项与无关项。再运行一次不复活旧映射，六项均not-run/not-installed。第六个旧扩展增加未知附件时，前五个旧项也没有被实际清退，完整项目树保持；无登记同名旧目录同样拒绝且保留。

## 未验与下游

本项未启动Codex模型会话，没有修改主线、发布、推送或迁仓。loading仍未验，T086须保留新增retired与逐项结果，并用最新完整候选验证普通唯一第二步；T087才能判断真实完整加载。源码及说明变化后仍须由协调者重新冻结身份、build及真实官方两步复验，当前范围成功不等于T089全部本地完成或最终公开SC-019通过。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
