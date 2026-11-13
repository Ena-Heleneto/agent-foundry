# T063：分析技能正式来源与集合声明复验

日期：2026-11-11。对应[原 T063](../../tasks.md#t063)、[实施方案](../../implementation/T063.md)、[T062 通过骨架](spec-analysis.md)、FR-069～071、SC-024/044及TV-03/12。用户在获知正式来源、集合声明、隔离安装复验三项安排及后续T064边界后回复「开始吧」，本轮只推进T063。

## 正式交付范围

正式正文位于 packages/skills/src/workflow/artifact-spec-analysis/SKILL.md，与T062候选逐字节一致，完整集合仍只有SKILL.md，SHA-256为 `3f8e9c2dcf8db1204518c4253df5318049eb43fb594a351a7b1a07ab35df6323`。原按功能解释、六类适用分析、同级mvu消费、保存恢复和无第二工程状态规则保持，不增加附件或重写通过骨架。

workflow/collection.config.json只新增同名技能及after_tasks声明；去掉该键后，其余已有效或待退役配置与写前完全相等。事件参数为enabled:true、optional:false、priority:20、condition:null及来源prompt，不重复command/description，不增加after_increment或逐技能speckit-hooks.json。Increment正文保持，继续显式复用同一分析能力。

原Task与直接资料契约、当前plan落点和包README同步当前集合归属。旧register-hooks脚本仍读逐技能配置，适配/旧六项退役及完整挂载留各原Task，不由本次新增声明冒称已接通；本轮不修改该脚本、分发构建或真实挂载。Spec历史段落和旧证据保留发生时范围。

## 正式来源隔离安装

复用T062最终实际项目另建独占副本，保留原文、确认、当前定义与已有说明。Task、T001证据和业务哨兵均为已标识的夹具，不当真实业务验收，不复制仓库画像。操作及证据位置见[本轮夹具](fixtures/t063/README.md)。

使用实际skills1.7.4从正式维护源官方本地add刷新分析及当前Increment，完整正文与集合hash核对通过。临时hooks-only输入读取真实collection.config.json中的事件参数，由正式SKILL元数据补command/description，交Specify1.2.6官方强制登记；这只是隔离验证输入，不是新增生产转换脚本或正式安装器接线。正式源、安装目录与扩展副本各仅一份同字节SKILL，声明及登记参数逐项一致，原生tasks与原1.2.6 seed字节保持。宿主为codex-cli0.167.0，默认模型、workspace-write，每回合240秒上限。

## 原生后置正式来源消费

从已保存任务的原生tasks后置阶段实际执行after_tasks，195.883秒正常结束、退出0。原始事件包含原生tasks、正式安装SKILL及扩展副本全文、宪章、原文/确认、spec/plan、同级mvu有效详情、tasks和必要证据；主agent另独立核对实际全文输出。

宿主只更新分析README与flows，纠正“候选”和上次Increment调用说明等当前来源事实，保持原规划、历史和Implement材料缺项。其余31文件不变，任务身份/原验收/完成标记、治理/需求/旧方案/证据/业务保持；45处分析/导航本地引用及锚点独立通过。逐功能和六类适用内容沿原完整说明保留，未把本次分析消费当作before_implement、正式modes或分发验收。本轮没有重跑完整tasks生成，Mermaid未渲染。

## Increment 正式来源刷新

同一隔离项目实际调用已安装当前Increment，将T006完整原区块推荐移到T007/T002之前，保留9个原Task区块、完成标记及验收。事件证实plan/mvu/tasks先逐份保存、检查并全文读回，随后显式完整读取同一正式分析及更新后的mvu，再更新README/flows；必要实线依赖保持，虚线推荐边按新顺序调整，独立资料工作未被新增门禁，T008目标缺项、三模式暂停和T009末尾收尾保持。

首轮240.054秒到限退出-15，已写五份文件但缺分析最终核查，不记首次完整通过。沿真实同一session续接，138.65秒正常退出0；只补正README中两处来源时序措辞，再完成格式/范围、65处文件引用及11处锚点检查与完整读回。主agent另独立核对同session、实际两处diff、45处分析/导航引用与原Task/输入/证据/业务保护；不把本次续接称零写入。

续接最初的临时检查误将plan中任何Task编号都禁止，因原有implementation/T002.md历史链接断言失败；宿主自行收窄后通过，未为断言改变原规划。主agent复用的T062审计也曾错误假定续接必须零变化；实际查明两处来源修正属于原授权必要保存后，按只允许原分析文件及其他保护约束重跑通过。两项临时核查误报与首轮超时保留，不改写为首次全成功，不据此修改已验证正式正文。T064完整任务创建/需求变更/保存故障矩阵仍单独留验。

## 工程检查与既有未通过项

- `pnpm --filter @foundry/skills run check-types`：写前及交付后均退出0。
- `pnpm --filter @foundry/skills run test`：写前及交付后均为12项通过、退出0，保留原始日志。
- `pnpm exec eslint --no-ignore packages/skills/src/workflow/artifact-spec-analysis/SKILL.md packages/skills/src/workflow/collection.config.json`：退出0；正式SKILL的通用frontmatter校验通过。修改Markdown逐文件ESLint和读回。
- `pnpm --filter @foundry/skills run lint`：写前及交付后均退出1，同样两个错误来自并行build/plugins/collections.ts第11行entries未使用，分别为unused-imports/no-unused-vars、sonarjs/no-dead-store。本Task不修改该插件，也不将整包lint记为通过；本次正式来源与配置的针对性lint没有报错，整包状态仍需后续聚合检查核对。
- `pnpm --filter @foundry/skills run build`：按用户已明确的构建暂跳过指令未运行，dist/构建来源消费未验，跳过不计通过。

正式脚本读取集合声明、全量迁移/真实挂载、完整tasks生成、故障恢复矩阵、图渲染、用户阅读效果及业务验收均未由本Task抵扣；按原Task各自承接。没有发布、部署、数据库写入或Git提交。

## 有限范围结论

独立只读review_t063未发现正文、声明或安装消费实现缺陷，确认源/候选/安装/扩展/临时输入集合一致、真实全文与保存顺序、原Task完整区块/输入保护及两版45处引用/图语义。其审查时唯一Important是首轮到限后缺最终核查；本轮随后取得真实同session正常结束及完整读回，由主agent核对消除，未再派审查或冒称原审查时已通过。

现有证据支持T063原正式来源、声明及隔离消费职责；整包lint仍未通过，后续聚合移交须处理并复核并行插件错误，本Task不据此声称全部检查全绿。正文与配置针对性lint、types和12项测试无错，插件字节保持，未将该既有债务当作本增量缺陷越权修复。构建跳过、正式接线、T064及用户效果均保留未验，MVU-006整体不计通过。

完整结果见[results.json](fixtures/t063/results.json)，正式源/集合快照、原始安装与登记日志、项目前后文件、宿主事件和审查见[retained.tar.gz](fixtures/t063/retained.tar.gz)。归档642932字节、193文件322项，SHA-256为 `44ad70c74749d3f392eddd0fd799c8ddd372f27f3f0d05ab9789dd6ddf506c24`。所选三类凭据模式未命中，profile未入包，不代表完备扫描。解包后before-project、snapshots/after-tasks、snapshots/increment-first和cases/flow分别保留实际对应阶段，可按原始摘要核对，不要求临时现场永久存在。
