# T069：有效来源与复制调用清退验收

日期：2026-11-12。依据[原Task](../../tasks.md#t069)、[已展示方案及用户修正](../../implementation/T069.md)、[删除暂停源码原文](../../requirements/raw/2026-11-12-delete-paused-sources.md)。本次只验源码/集合/复制调用职责，不代表实际安装或完整闭环已迁移。

已清退六个旧技能、Review/Guide、Pair/Tutor/Direct共11个实际来源目录，删除12份正文及附件；Explore源码原已不存在。删除前逐文件核对当前Git版本，均无用户未提交改动，可恢复依据与摘要见[清单](fixtures/t069/source-manifest.json)。workflow当前只选结案、分析、bug-report、共同准备和Increment五项；其他集合和剩余来源保持。

Bash link-skills对上述十二个逻辑名称及六个旧speckit-modes别名精确跳过，不创建新副本，不删除现有同名目录、普通文件或链接；近似名称task-pair-helper及当前四类工作流能力正常复制。两次刷新及源/目标重合均有反例。既有普通复制、更新、冲突和链接处理回归保留。本次未执行真实初始化、安装/卸载或副本清理，真实.agents和.specify登记仍待T072迁移，不用源码不存在证明已卸载。

## 实际验证与失败恢复

- 初次新增反例实际失败2项：旧复制流程覆盖同名用户目录/链接，当前集合仍包含退役项；见[红灯](fixtures/t069/red.log)。最少Bash筛除及来源/集合清退后，复制测试3通过、1个缺pwsh的历史skip。
- 首轮注册消费回归下载官方yq时超时，见[实际错误](fixtures/t069/initial-network-timeout.log)。只读定位fr_tool及下载进程后，使用T067留存的jq 1.8.1/yq 4.54.3，通过SHA-256与生产固定摘要一致性核对，再经已有FOUNDRY_JQ/FOUNDRY_YQ输入重跑；不修改生产超时或使用替身工具。
- 开启真实官方迁移回归后，旧夹具读取当前集合中的已删hook失败，见[失败证据](fixtures/t069/historical-fixture-failure.log)。将删除前七组旧hook定义留为tests/distribution/fixtures/legacy-registration-hooks.json，仅用于构造旧登记，逐项与写前集合相同；当前阶段仍消费实际五项集合，不恢复生产退役项。原有回归从失败到通过，保留同一官方安装骨架。
- 使用缓存官方Specify 1.2.6及核对过的固定工具，`node --test --test-isolation=none packages/skills/tests/test-register-commands.mjs packages/skills/tests/test-register-hooks.mjs`退出0，52通过、0失败、1个缺pwsh的skip，见[注册回归](fixtures/t069/registration.log)。
- 同环境执行`node --test --test-isolation=none scripts/dev/actions/link-skills/test-link-skills.mjs scripts/dev/actions/register-hooks/test-register-hooks.mjs`退出0，14通过、0失败、1个缺pwsh的skip，见[工作区消费](fixtures/t069/workspace-consumer.log)。两份Node结果包含重复的hooks测试，不将其相加为独立场景数量。
- `pnpm --filter @foundry/skills run check-types`退出0；`pnpm --filter @foundry/skills run test`的12项Python测试通过；改动JS/JSON针对性ESLint及Bash语法检查退出0。原始[types](fixtures/t069/types.log)、[Python](fixtures/t069/python.log)及[针对性lint](fixtures/t069/targeted-lint.log)留存，汇总见[结果](fixtures/t069/results.json)。
- `pnpm --filter @foundry/skills run lint`退出1，仍仅为build/plugins/collections.ts第11行已有unused-imports/no-unused-vars与sonarjs/no-dead-store，见[原输出](fixtures/t069/package-lint.log)。未改构建插件。build/dist及构建消费按用户原指令继续暂跳过，不能记通过；PowerShell接入已废弃，历史skip不代表Windows通过。

只读审查提出1项Important（契约仍要求保留三暂停来源）、1项Minor（包README仍写五模式/七旧hooks为当前行为），均已修正并格式检查读回；本地复核确认旧要求不再是当前契约。审查未发现复制过滤或源删除实现缺陷。写前记录的293份受保护文件摘要保持，包括实际安装副本、官方登记及分发Spec并行材料；原任务身份、废弃/暂停及完整历史区保持，仅按本Task实际验收回填状态。

本Task来源及复制调用职责已满足。T070公开编排、T097来源/发现分流、T072真实挂载及用户效果仍待各自原验收；MVU-004/006继续进行中。不提交、推送、发布或部署。
