# T092：独立技能触发优化与验证

## 授权、改动与保护

用户纠正下一步应优化 business-node-delivery 的触发方式，不在 Spec Kit 中创建该技能链接，随后明确“开始”。本轮修改独立 coding 技能的 description 和发现说明，同步原规格、方案、契约、MVU、T092～T094 及使用说明。没有向模式源码添加链接、显式调用或安装依赖，也没有修改模式本身、注册器、工作区安装副本或用户暂存区。

旧 T092/T093 的模式显式接入安排已由 research R45 的自身触发方案替代，原任务身份保持。T093 改为工作流上下文的自然发现及加载后职责，T094 继续核验同版交付。T090/T091 和其他完成任务的区块及历史证据保留。

## 识别方法、原始材料与结果

临时根为 `/tmp/foundry-business-trigger-20261109/`。baseline-description.txt、candidate-description.txt、cases.json 在正式源修改前分别保存旧描述、候选描述及同一组请求；独立上下文只读对应 description 与请求，不读取规则正文、其他样本或预期答案，也不执行业务请求。旧描述和候选各运行5个全新上下文，每个判断12项；不是120次独立调用，也不是宿主实际自动加载测试。

使用 writing-skills 的独立识别验证方法。上下文任务名为 trigger_baseline_1～5、trigger_candidate_1～5；原输出是各自的 baseline-N.json、candidate-N.json，包含逐项 load 与理由，已全部人工读回。完整请求、原始判断和应用输出归档于[样本记录](fixtures/trigger-discovery.json)。预期正例8项、反例4项，按已确认的业务规划/执行范围判断，没有用预写答案脚本生成实际输出。

| 编号 | 原始请求                                                                                       | 预期   | 旧描述符合预期 | 候选符合预期 |
| ---- | ---------------------------------------------------------------------------------------------- | ------ | -------------- | ------------ |
| P1   | 给已有订单功能实现一个创建接口，任务和数据模型都已经有了。                                     | 加载   | 5/5            | 5/5          |
| P2   | 我们给商城增加退货功能，先帮我规划开发步骤。现在还没有正式任务清单。                           | 加载   | 0/5            | 5/5          |
| P3   | 继续做结算，余额接口已经验证，扣费接口还缺，页面需要这两个接口。                               | 加载   | 5/5            | 5/5          |
| P4   | 我是 Tutor 模式，今天用户只练习当前 Task 的查询接口，请准备这一小步的工程指导。                | 加载   | 5/5            | 5/5          |
| P5   | 按 Increment 规划这个业务功能的实现步骤，目标和 MVU 已有，暂时不写代码。                       | 加载   | 4/5            | 5/5          |
| P6   | Direct 下按我的思路继续开发库存功能，先查依赖，今天只做库存查询。                              | 加载   | 5/5            | 5/5          |
| P7   | Pair 下只讨论订单接口和页面应该怎样衔接，先不代写代码。                                        | 加载   | 5/5            | 5/5          |
| P8   | Add a refund endpoint to the existing checkout feature; the data layer is already implemented. | 加载   | 5/5            | 5/5          |
| N1   | 只把按钮文字从保存改成确认，不改变行为。                                                       | 不加载 | 5/5            | 5/5          |
| N2   | 解释一下 HTTP 403 和 404 的区别，不改代码。                                                    | 不加载 | 5/5            | 5/5          |
| N3   | 只修正文档中的错别字并格式化 Markdown。                                                        | 不加载 | 5/5            | 5/5          |
| N4   | 调整卡片的背景颜色和间距，不改变功能或数据流。                                                 | 不加载 | 5/5            | 5/5          |

旧描述54/60符合预期：P2在5个上下文全部漏触发，理由都关联“尚无正式任务/不是已有任务中的小节点”；P5有1个上下文漏触发，认为规划整个功能不属于小节点。其余判断符合预期。候选60/60符合预期，本次样本无漏触发或误触发，5次选择结果一致；这是受控样本的描述识别结果，不保证所有模型、目录和真实宿主都会自动加载。没有运行无技能对照或进行统计因果推断。

正式源 description 与测试候选逐字相同。正文增加“无正式任务仍可匹配，但须按项目及角色材料/授权只做允许的规划或核查”，并保留原5条节点规则，防止把发现前提放宽误读成实施前提取消。

## 加载后应用检查

另有1个独立上下文 trigger_application 实际读取修改后的完整正式来源，处理“普通商城增加退货，尚无正式任务，今天先规划提交申请接口”的输入。应用输出保存在同一[样本记录](fixtures/trigger-discovery.json)及临时 application.txt。

实际输出规划数据、接口、验证与后续页面衔接，说明订单查询仍须核查复用，并识别申请结果查询尚未明确；没有把规划写成实施或验证通过。它按给定项目规范保留正式任务及操作授权前置，只继续允许的规划/核查，不自动创建正式任务或写业务代码。该上下文是显式提供来源的应用检查，不计作自然发现、四模式真实行为、实际接口验证或用户验收。

## 工程检查与中断

以下结果为中断前本轮实际执行，恢复后仅核对文件及来源/构建一致，没有因并行工作而扩大这些结果的适用快照。

| 命令或检查                                                                                                                                                                   | 实际结果与限制                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false exec eslint --fix --no-ignore packages/skills/src/skills/coding/business-node-delivery/SKILL.md`                                    | 退出0；新增/修改的关联 Markdown 也逐份即时格式化并读回                                                                          |
| `python3 <source-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/skills/src/skills/coding/business-node-delivery`                               | 系统 Python 缺 PyYAML，未能校验；没有据此报告通过                                                                               |
| `uv run --offline --with pyyaml python <source-home>/.codex/skills/.system/skill-creator/scripts/quick_validate.py packages/skills/src/skills/coding/business-node-delivery` | 首次 uv 缓存只读失败；工具审批重跑后输出 Skill is valid!、退出0，未改工作区依赖                                                 |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                  | 首轮与 README 格式化交错，报告 README 表格格式1处错误；格式化完成后重跑退出0                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                           | 退出0                                                                                                                           |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                 | 沙箱首次 spawnSync git EPERM；工具审批重跑退出0                                                                                 |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                  | 24项、2失败，都是 task-pair 来源/交付的旧宪章锚点 vii-任务与子任务规则；归原 T065，未改断言或掩盖失败                           |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs`                                                                                 | 沙箱执行7项，2通过、5失败；失败涉及构建插件 git 子进程 EPERM。提权重跑调用被用户中断，未获得有效最终结果，保持该消费检查未验    |
| 来源/构建副本与模式保护                                                                                                                                                      | 恢复后直接读取，coding 来源与 dist 字节一致、description 与候选一致；原 task-* 六份来源摘要均保持，包含当前四模式及两个历史来源 |

## 剩余范围与续接

上次中断时，T092 的描述修改、正反识别、单次显式加载后应用及关联同步已完成；适用构建消费检查缺有效结果，因此当时保持 T092 未勾选。随后“继续我们对话”轮次只补记录，没有重发权限请求；最新复验见下节，不覆盖上表原失败与中断事实。

T093 的真实工作流自然发现/加载后职责、T094 的完整同版交付、真实宿主自动触发及用户验收均未完成。原 T065 Pair 迁移保持待办，不能用本次描述优化抵扣。没有运行实际业务接口、浏览器交互、Windows/macOS 矩阵、真实安装或发布，也没有修改宿主自动发现配置或治理路由。原 TV-07 的旧正文与实测继续保留，不能因为此次修改 description 就推定旧测试已经覆盖新来源的全部行为。

## T092 续接验证（2026-11-09）

用户获知下一步为补跑构建消费后明确“继续”。本轮先重读 git status、T092 与原证据，沿现有 feature/speckit-workflow-extensions 工作区继续，不创建新工作区或覆盖并行改动，不进入 T065/T093/T094。

实际再次运行 `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs`：沙箱内仍为7项、2通过、5项涉及 spawnSync git EPERM。按工具要求发起沙箱外重跑，经工具审批实际执行后退出0，7项全部通过、0失败、0跳过。没有修改测试断言或构建实现来绕过沙箱限制；上次被中断的调用不计通过，本次通过来自新取得的完整输出。

直接读取核对：正式来源与 dist 字节一致，description 与已测候选逐字一致，原六个 task-* 来源摘要保持（含当前四模式和两个历史来源）。正式来源 SHA256 为 `2e0b8d03e3a7e8c3cf33adf92232d44ecd1b1b461775efbe7bdbdd3492a27cd1`。本轮仅补检查和记录，没有再次改动技能；此前60/60识别与显式应用证据按同一来源继续适用，不虚增样本次数。复验摘要保存在 `/tmp/foundry-business-trigger-20261109/resume-consumer-result.json`。

T092 缺少的必要消费检查已补齐，按其自身信号回填完成。上表包 lint/check-types/build 与24项Python测试是此前对应快照的实测，本轮未重跑；Pair两项旧治理失败仍归 T065，不据本次7/7宣称全包通过。T093/T094、真实宿主自然加载、其他阶段批准与整体 MVU 仍保持未完成。原有46项任务身份及历史、其他勾选和已完成区块保持，本轮只回填 T092。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
