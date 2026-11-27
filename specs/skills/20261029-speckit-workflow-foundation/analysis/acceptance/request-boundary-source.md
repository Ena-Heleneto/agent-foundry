# T104 / T096：请求与变更影响边界的来源补充

日期：2026-11-12。来源：[已认可方案](../../plan.md#自然语言请求与变更影响判断)、[用户确认](../../requirements/raw/2026-11-12-spec-revision-planning-boundary.md)，随后用户提出“我们接下来是不是应该实施了”。本次沿该范围补技能来源，不新增工程Task、不将两项原完整验收改为通过。

## 实际交付

T104所属implementation-preparation新增独立Spec修订/仅规划的负向适用边界；明确实施原Task仍读取原材料、核对认可方案及逐Task条件。T096所属task-increment在Plan前置检查前判断是否真的需要实施规划：仅修订原Spec则交回调用方，不因缺Plan/MVU/Task阻止独立文档修订；确需规划才继续应用原前置。混合变化先处理确认的需求再规划受影响部分；含糊描述先澄清，无关材料保持，不自动写业务代码。

只改两份当前SKILL.md的description及少量前置正文，原规划/恢复/分析和实际实施认可主体保留。不新增技能、统一路由、命令、hook或项目级规范；未执行安装、发布或挂载。原Task对应方案已分别保存这次共同决定下的自身职责与继续边界。

## 基线、候选与独立核查

按writing-skills和skill-creator规则，分别让独立新上下文agent只读取指定技能与宪章，对同样场景作只读判断；不提供最新方案、期望答案、另一个技能或基线结论。每份技能三项场景，前后共十二份判断；[输入摘要](fixtures/request-boundary-source/scenario-inputs.json)与[输出关键判定摘要](fixtures/request-boundary-source/scenario-results.json)留存，均不是完整工具轨迹。

旧Increment在“只有Spec、只改术语”情境下停在缺Plan的技能分支，未给出继续文档修订的出口；这是一项已观察缺口，不能概括成所有真实宿主都会拒绝修改Spec。其混合变更和含糊请求判定正常。实施准备的三项基线本来就正确，因此仅显式补清边界，不把它包装成修复了三项已失败行为。

修改后，两份候选各三项判定均符合目标：Spec-only交回局部修订且不强制补材料，纯规划不要求单Task认可方案，混合请求先需求后受影响规划，含糊请求先澄清，真正实施继续核对并复用有效认可。baseline/candidate原始正文以同目录txt留存，摘要见[结果](fixtures/request-boundary-source/results.json)。这些证据只证明给定规则下的理解，不证明实际文件已正确改写、自然语言自动选择了技能或用户使用效果；T099/T107未据此完成。

只读审查review_request_boundary未发现Critical/Important/Minor。审查核对Spec-only不会放行代码、原Plan前置及旧Task定位兼容仍在、描述中的Task引用未误禁、实施认可与逐Task条件保留；没有运行发布/安装/挂载。

## 工程验证与限制

- 两份源码分别执行`pnpm exec eslint --fix --no-ignore <实际SKILL.md>`并完整读回，退出0。首次读回发现编辑标记残留，已按原基线重建新增段落、再次格式检查并核对无残留，独立候选测试仅使用修正后的正文。使用包现有yaml库另核对frontmatter、name/description类型及长度，均通过。
- `pnpm --filter @foundry/skills run test`退出0，12项Python测试通过，见[日志](fixtures/request-boundary-source/python.log)。固定jq/yq仅沿现有FOUNDRY_JQ/FOUNDRY_YQ输入复用T067工具，没有新下载或依赖安装。
- `pnpm --filter @foundry/skills run lint`首次退出0；观察到本轮未编辑的构建插件继续变化后复验，末次退出1，`build/plugins/collections.ts:38`存在尾随空格，见[末次输出](fixtures/request-boundary-source/lint-latest.log)。没有对并行文件执行修复。
- `pnpm --filter @foundry/skills run check-types`两次退出1，均为`build/plugins/collections.ts:36`的TS2322：configResolved返回数组，与void/Promise<void>契约不符，见[末次输出](fixtures/request-boundary-source/types-latest.log)。这是本轮未修改的构建插件范围，不能因此声称整包类型通过，也不擅自扩围改它。
- `/usr/bin/python3 <source-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py <skill-dir>`对两份基线和候选均因缺`yaml`模块在导入阶段失败；[实际结果](fixtures/request-boundary-source/validator-results.json)及逐份日志保留。没有把替代元数据核对写成通用校验通过；尚缺该通用检查，正式交付仍需沿项目实际治理核对。
- build/dist/构建来源消费继续按用户原指令暂跳过；正式安装/挂载由其他会话承接，未重装新正文。T104/T096旧的官方安装与实读只证明当时来源，不抵扣本次新内容的正式消费回归；这部分未验及T099真实自然发现/文件行为、T107用户效果保留，不能用本次源文件读取替代。

源规则补充已落地，原Task整体checkbox保持未完成，MVU仍按原状态继续。没有提交、推送、发布、部署或改真实安装副本。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
