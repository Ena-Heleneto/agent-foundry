# T081/T083：工作区在线预检与普通入口范围验证

日期：2026-11-12。实际产品根为packages/skills-distribution-urgent；依据[T081方案](../../implementation/T081.md)、[T083方案](../../implementation/T083.md)、当前紧急契约及协调者对T079前置的放行。本记录不代替真实公开来源、T082官方安装、T086工作流汇合或T087宿主验收。

## 来源复用与实际改动

新位置既有runtime8项测试首次全部通过。读取read-agents、install-skills、Node入口及mount-entry真实调用链后，确认已有在线latest/SRI与固定来源、无收据完整性复用及正常入口实现可用。本项没有重复重写这些产品文件，仅在独占tests/runtime.test.mjs补覆盖、修原有单行多语句检查错误，并保留全部既有断言。没有修改共享helper、guard、commands或主线用户代码。

新增范围包含真实在线规则的零写入、固定来源的四种显式选择建议、无收据普通技能连续两次、正文错版、global/其他agent/错误安装根拒绝、预检来源/选择/依赖错误及唯一Node入口的实际参数/cwd/输出/退出码和SIGTERM取消。每项使用自身临时根与原字节快照；HTTP边界材料只替换curl读取固定样本，真实官方npm规则仍在线解析，没有运行npx。

## 实际命令与结果

| 实际命令或操作                                                                                                                                                                                                                              | 结果与范围                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec node --test tests/runtime.test.mjs，初始基线                                                                                                      | 退出0，8/8通过，0 skip/todo。                                                                                         |
| 同命令，最终扩展范围                                                                                                                                                                                                                        | 退出0，29/29通过，0失败/skip/todo。包含正常普通入口不带no-mount连续两次，以及真实SIGTERM后Bash收到取消、Node返回143。 |
| Node入口取消/参数专项过滤运行                                                                                                                                                                                                               | 退出0，2/2通过；原字节复制当前Node入口，只在自有临时交付目录将Bash边界替换为明确调度探针，不冒充真实安装或注册。      |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills-distribution-urgent exec eslint tests/runtime.test.mjs tests/hooks.test.mjs script/install-skills/read-agents.mjs script/index.mjs script/register-hooks/prepare-hooks.mjs | 退出0；共享包完整lint由协调者汇合。                                                                                   |
| 从当前包实际调用readOnlineAgents，只输出upstream与Codex身份                                                                                                                                                                                 | 成功；本次latest=1.8.1，79项Agent，Codex项目目录.agents/skills且投影identity；不固定该版本供后续使用。                |

本次实际SRI为sha512-QK3wlZ5j8wcpLPUOXt7+1Gu1f9JKpv7lBpO0zmqKa5VBrt45/woVo8Max1x4wha3pCNafNHiiodYK6Xi/0alQQ==。每次产品读取都从当次latest元数据下载同一tarball并核对摘要，读取布局变化、网络失败或不匹配明确拒绝；既有反例保持。

四种预检的整包/分类/单/多项均绑定本次upstream.version、固定同仓库同完整SHA子目录、显式已核验名称、--agent codex与--copy；原始消费根、用户目录、npm缓存位置和临时根的完整前后快照一致，npx执行哨兵未触发。对错SHA、歧义、非GitHub根、eval/未知技能、global及缺显式依赖的失败结果，安装均not-run且无可执行建议，完整快照保持。

## 适用限制

普通技能测试的安装目录通过明确样本复制准备，只证明正常唯一第二步的字节复用和保护，不冒称当次已由官方CLI取得；真实官方安装由T082提供。预检HTTP边界源名owner/repository只用于隔离传输断言，没有创建或访问该公开仓库，不能计实际公开来源通过。

完整workflow的真实挂载、六旧迁移、HookExecutor派发及Codex正文/附件执行分别由T084～T087承接；普通技能无适用hooks的成功不能抵扣它们。来源尚未冻结时没有正式本地候选、双构建或公开使用通过，本项不自行勾选工程任务。
