# 追加需求提示词：分发适配与 Tutor、Increment 验收

日期：2026-11-05。
目标 Spec：`specs/skills/001-skills-distribution`。
原始需求：[用户原始输入](../raw/2026-11-05-workflow-adjustments.md)。
主线依据：[工作流基座追加提示词](../../../20261029-speckit-workflow-foundation/requirements/prompts/2026-11-05-workflow-revision.md)。
决策过程：[主线讨论记录](../../../20261029-speckit-workflow-foundation/requirements/discussions/2026-11-05-collaboration-modes.md)。

本文件用于更新已有分发 Spec，承接主线的技能变化、实际分发适配与真实模式验收，不重复实现主线能力，不把本轮需求同步视为安装、挂载或行为已通过。以下内容作为现有规格、方案、契约、任务及验收清单的追加输入。

## 可直接使用的追加提示词

请在现有目标 Spec 内更新以下范围，不另建同目标功能。以当前实际 tasks、源码与证据核对进度，不照抄历史摘要中已经过时的下一任务，不回退已完成工作，不将新入口安装完成等同于真实行为验收完成。

### 一、主线与分工

`specs/skills/20261029-speckit-workflow-foundation` 是本轮工作流主线。业务闭环 MVU、Increment、Direct、Tutor 重构、独立子任务体系删除、仓库画像、综合分析技能及其治理和注册器改造由主线承接；分发 Spec 复用这些成果，处理所选技能交付、选择核验、目标环境挂载、迁移报告与实际消费验证。

主线完成本轮约定的交付后，使用本分发 Spec 的真实正式任务验收 Tutor 和 Increment；这是用户最新指定的样本，不再沿用此前必须在另建外部项目中才能开展两模式行为验收的旧限制。独立消费环境的安装挂载验证仍作为分发本身的交付要求保留，和本 Spec 内的模式行为分别记录。

Direct 的真实行为由用户后续新增的基础业务 Spec 验收；不得把分发任务自动当成 Direct 样本，也不把尚未创建的业务 Spec 写成已通过。其他工作流调整按主线范围验收。

为避免“主线必须先完成模式验收才能交付、分发又必须等待主线”的循环，主线工程交付与移交条件、随后本 Spec 的用户行为验收、主线对应条件的最终回填分别列明。安装挂载适配可以按已有任务在交付中准备，真实专项验收按上述顺序开展；本轮输入不自动启动未授权的发布或部署。

### 二、指令与技能集合更新

| 类型       | 目标                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| 新增       | task-increment，对应 `$speckit-modes-increment`，增量规划                     |
| 改名与重写 | task-explore 迁移为 task-direct，对应 `$speckit-modes-direct`，用户主导式协作 |
| 重构       | task-tutor，对应 `$speckit-modes-tutor`                                       |
| 删除       | task-guide、task-review 及对应有效入口和注册                                  |
| 保留       | task-pair 保留，按统一治理更新失效引用，不新增 Pair 专项行为验收              |

用户已接受保留 Pair 的默认方案，与主线稿一致。目标 modes 共四项 Tutor、Pair、Direct、Increment。不要继续维护旧固定五项或只挂三项的另一套定义。

沿用官方 skills 的选择与复制语义，支持已约定的整包、分类和显式技能选择，单选不自动补齐其他模式。命令挂载继续沿用共同挂载前置条件，只是从旧五项变更为目标四项：所需四份同版内容须显式选择并核验；部分选择保留技能安装成功事实，清楚报告命令挂载缺项。

四项完整时复用主线 register-commands，通过官方 CLI 一次重装 modes 全部四项，内容相同也重装；不新增逐模式登记、别名、指纹、所有权比较或第二套模式状态系统。技能复制和命令挂载分别报告，安装成功不能覆盖挂载失败。

### 三、hooks 与受管迁移

删除以下六项 skill 的有效分发与挂载映射：artifact-issue-description、artifact-pr-description、mvu-gate、artifact-business-flow、artifact-logic-flow、explainer-doc-sync。保留 artifact-project-description，并接入主线新增的综合 Spec 分析技能 artifact-spec-analysis，以主线同版内容交付。

新分析在 after_tasks 触发，Increment 更新规划后复用同一能力刷新，不在分发层发明 after_increment 事件。hooks 配置继续位于对应 SKILL.md 同目录的 speckit-hooks.json，随技能原样交付；由主线注册器读取安装目录，形成临时 hooks-only 声明，再调用官方 CLI 强制重装，不新增集中定义副本。

核对旧项目残留时按主线明确的受管清单和官方能力处理，报告实际旧入口、旧扩展及副本的去留。核验新入口可调用、旧 Review/Guide/Explore 入口失效且无关扩展保留，不以静态清单代替实际状态。保护未知或用户自行维护的文件，不全目录 prune，不直接手改 registry 或自造 YAML 合并。

安装编排仍先核验来源、安装所选适用 hooks，全部成功或不适用后才执行命令挂载。失败报告已完成部分，未运行阶段明确标注，重试沿用真实文件与证据；不承诺跨阶段原子回滚。

### 四、保持现行交付约定

唯一公开入口为 `node script/index.mjs [参数]`，不增加 install/mount/hooks/commands 子命令。Node 识别系统并调度内部 .sh/.ps1，参数、安装作用域和隐藏能力继续按本 Spec 的既有契约，未实现能力明确失败。

FOUNDRY_SPECIFY_VERSION 统一选择 CLI，默认 1.2.6。官方 skills 方式安装后手动运行后续脚本；curl 方式按既有计划准备依赖并串联安装挂载。构建继续输出 dist/mcp、dist/skills、dist/script；script 只原样复制，不在构建中执行。MCP 清单只扫描 src/mcp，不把本轮线下技能变化自动扩成线上收录范围。

不交付自有 Python 核心、YAML 配置合并器或嵌套 package.json，不恢复包根 extension.yml、commands 模板或固定扩展声明。保留正常技能选择、完整附件、版本核验和无关内容保护。

### 五、在本 Spec 中验收 Increment

选择目标、范围、验收和现有进度明确的真实分发任务作为样本，不伪造任务或复制进度来完成验收。至少覆盖与本轮实现相匹配的正常路径、范围和失败处理，按章程最小充分验证选择组合，不强制每个场景全部规模都执行。

- 业务闭环有明确结果与观察办法，AI 说明划分、顺序、依赖及暂缓内容，结合真实用户反馈修订，而非批量按技术层完成后才形成反馈。
- 有 plan 无 tasks 的行为及缺少 plan 的提示可以使用独立验证材料测试；不能为验证该分支删除本 Spec 的真实 tasks 或 plan。
- 更新现有 plan/tasks 时保留已完成事实、Task ID 和证据；指定 Task 作为切入点，独立调用的关联范围与 Tutor 的单 Task 补齐严格区分。
- 技术风险由 AI 主动检查；验证失败时受影响步骤不进入下游，无关任务不被无理由冻结。
- 规划调整后同一分析能力完成刷新，文档与最新闭环和任务一致；中断重试不重复创建任务或闭环。

### 六、在本 Spec 中验收 Tutor

指定本 Spec 的真实 Task，读取主线已交付的技能与最新治理规则。

- 已有 MVU 时沿用，在原 Task 内拓展工程和学习步骤，不生成独立子任务编号、目录或状态。
- 有 plan 和 Task 但缺少 MVU 时，补齐范围只限指定 Task。其他 Task 仅作为依赖引用；范围不足以形成业务闭环时说明限制，不扩围、不虚报完成。
- 用户亲自编写主要代码，AI 提供讲解、提示、检查和反馈。局部代写依据实际请求，不成为后续全部代写的授权。不得以 AI 示例、自动测试或模拟用户发言充当掌握证据。
- 记录实际问题、关键解释、关联代码和用户理解或待巩固点；普通进度不强行生成知识点。中断后续接原 Task，工程结果与学习结果分别判断。
- Task 结束后，与用户基于知识片段共同整理学习报告，保存到 personal-hub 既有 `apps/personal-hub/content/blog/` 草稿体系，读取实际 schema 与元信息，使用 `status: draft`；不恢复 Review 双确认工作流，不自动发布。

知识过程资料按用户接受的默认分类放本 Spec 的 learning/<Task ID>/，由 tasks 引用，不另存工程完成状态。归档项目已由用户明确为 personal-hub，具体文章文件名由共同写作时确定。

### 七、规格、治理与证据同步

同步 spec、plan、tasks、data-model、contracts、quickstart、checklists 及受影响图示，清楚标注本轮替代旧五模式、旧七 hooks、旧子任务和旧验收安排的范围。引用主线统一规则，不在分发 Spec 内复制另一套治理。

章程与章程提示词由主线同轮同步。当前仓库画像按已确认位置使用：conversations 保存摘要、conclusions 保存结论、profile 保存当前描述。分发到外部的技能不得带入本仓库个人画像或硬编码 Foundry 项目路径；目标项目沿用自己的治理与记录布局。

工程、安装挂载、用户行为和学习掌握分别保存证据。本 Spec 保存分发与实际任务验收证据，主线引用对应结果并按自己的验收条件判断，互不自动勾选任务。Windows/macOS、真实公开源、未具备的最低运行时等未测范围继续如实标明，不把 Linux 结果改写为全平台通过。

本轮追加输入先更新规划，实际代码改动执行目标包 lint、check-types、build、适用测试和受影响消费核验；Markdown 写后立即执行 pnpm exec eslint --fix 并读回。不运行或声称根级 pnpm test。发布、部署、数据库及外部资源变更仍遵守明确授权要求。
