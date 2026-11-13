# Increment：独立 MVU 四段说明的实际交付

日期：2026-11-06。对应 [T085](../../tasks.md#t085)、FR-080/081 及相关 FR-061/064/079。本轮复用 [T084 原型](tv-05-mvu-documents.md) 的同一来源、完整项目覆盖与测试，不推倒重写。用户在回顾本次追加后明确要求实施；不把这次授权写成旧功能、真实行为或总体结案已验收。

## 实际改动

Increment 明确 spec/plan/同级 mvu/tasks 四材料、已有 mvu 复用、原 plan 详情兼容迁出、仅有 mvu 不能绕过缺 plan。有 plan 无 tasks 时先保存详情/plan 索引，再生成任务并补实际职责。每条用稳定标题加四个短段：闭环结果、节点与关键逻辑、关联 Task、验收信号；技术或范围依据链接已有材料，工程细节留在 Task。

保存顺序为详情及必要历史来源 → plan 索引/旧锚点/推荐顺序 → 获授权的 Task 与引用，逐份格式及读回；失败报告已写/未写、影响与恢复，不改权限或替换保护材料，不冒称原子回滚。已有正文顺序已适配就稳定，不因规划成功勾选工程任务。

同一 artifact-spec-analysis 的显式输入补上 mvu 的真实路径、四项详情与 Task 职责，分析只引用活动详情；技能不存在时分别报告规划已保存与分析未完成。没有新增事件、原生发现脚本修改或第二套状态。项目模板覆盖已在本仓库实施，独立项目须显式配置，不宣称由技能包自动分发模板。

## 实际应用与恢复

实际材料根 /tmp/foundry-mvu-implement-d0p98yzc。T084 原型 green/1 已验证迁移、同一请求重复摘要稳定和真实 IsADirectoryError 保存失败；原型会把单条说明写成多个长章节，因此在同一源文件将形态收敛为四个短段。

最终 final/1～5 为五个独立 Spec Kit 应用，真实读取同一候选技能源、原 plan/Task 与证据，执行同一标签筛选规划请求。五组都保存独立 mvu、plan 兼容索引及 Task 细化，原 T001～T004 的身份/checkbox、已完成事实、原验收与读取证据保持；各组均为四段，全文字符数分别 936、762、727、670、770。读取各段后确认包含选择、匹配/空结果、清除恢复、真实职责和可观察验收，不只检查标题。任务正文已符合依赖，因此无新增或无意义重排。

样本 4 首次输出的 4 个链接误用了大写 #MVU-001，原校验器错误地接受大小写不符；主进程按实际锚点精确检查发现后，原执行者按保存恢复规则仅修正该组四处引用并读回，9 条链接复验通过。其历史快照与证据字节保持。其余四组初次引用检查通过；没有把错误链接的首次输出算通过，也没有放宽匹配规则。此处为实际 agent 执行结果，不能保证所有未来输出均无误。

所有样本都实际发现当前 artifact-spec-analysis 缺失，报告分析未完成，不生成替代分析。它们没有实现业务、模拟用户反馈、安装依赖或修改主线。原生 Plan→Tasks→Analyze 对 mvu-only 条件的实际消费见 T084 证据，和本文技能应用分开判断；完整 Tutor/新分析双触发仍留 T086。

## 工程验证与限制

- 包 lint、check-types、build 分别退出 0；最终构建在同一源扩展后重新执行，dist 由构建生成，不手改。读取与正文格式单独运行 pnpm --config.verifyDepsBeforeRun=false exec eslint --fix --no-ignore packages/skills/src/skills/workflow/task-increment/SKILL.md，退出 0。
- 最终范围套件共 8 项通过：新五项原生模板/准备脚本集成，Increment 源/交付完整字节与治理可达，全部内容源/构建一致，单次构建消费目录。复用既有 test_artifacts.py 的交付断言，无需增加重复关键词测试；该原文件未修改。
- 聚合 pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test 已实际运行，19 项中有 6 个失败，均为既有 Tutor/Pair 旧 VII 锚点及 Direct 未迁移的源/交付问题，见 T084 记录和 package-test-prototype.log；本轮未绕过或删测试，不声称全包通过。它们仍由原 T055/T057/T065 等任务处理。
- 官方 quick_validate.py 实际调用失败：当前 Python 缺 yaml（PyYAML），未安装依赖。使用已有 Node yaml 解析确认原 frontmatter 的 name/description/destructive 保留且无未完成占位；这不等同官方校验器通过，官方全量检查仍待具备依赖时复验。
- 独立只读审查未发现 Critical/Important/Minor 可操作问题，并实际复跑新五项及两项构建消费检查。脚本测试、agent 应用、原生读取、真实用户行为与总体结案各自判断。

T083 只复核已生效治理，未重复升版；T084/T085 只完成各自本轮技术与 Increment 交付。T086 尚未完成，T055/T056 的原 Phase 2 Direct 也未实施；不替其他 Task、SC-030 全量消费、E1 或后续阶段自动勾选。

## 当前工作区的同名副本同步

在实现与审查后，确认原 .agents/skills/task-increment 只有受管 SKILL.md 且与写前技能源完全相同，先保存副本，再以临时单技能来源调用现有 link-skills.sh，仅刷新这一项。首次默认调用因 .agents 为只读挂载而失败，原文件未被替换；随后通过工具申请该次受保护目录写权限，重试成功，输出“新建0、更新1、跳过0、冲突0”。实际读回源、构建与本地挂载三份字节一致，SHA-256 为 d403c8fa7b154be4c2cbb1b1bb30cd70edc28ebdce8a5c851f9cd691b53fdc3d。

这只更新现有 task-increment 技能副本，没有进行四 modes 注册或旧扩展迁移，T072/T086 不因此完成。项目模板覆盖在本仓库生效，其他项目仍须按前述显式配置。after_implement 的 explainer-doc-sync 已实际检查：无新知识点或说明产物，Task 引用齐全，不创建空说明章节。
