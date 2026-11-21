# T073：插件工厂与技能清单验收

本轮按[实施方案](../../implementation/T073.md)落实[用户调整](../../requirements/discussions/2026-11-11-plugin-skill-config.md)。T072完成记录保留，新范围仅在本Spec的T073登记；不涉及另一功能线的同编号Task。

## 已交付结果

collections.ts模块顶层仅4个import和导出工厂，全部状态、常量、辅助声明和逻辑位于工厂内部。skill清单决定复制范围，缺配置默认空清单，只输出集合配置；新增集合仍自动发现。各事件独立保存prompt/optional/priority，已知字段检查类型，未知属性保留原字节。

四集合明确列出全部23项技能。以迁移前四配置快照逐项核对，8项技能的13份事件只删除command/description，其余属性深度等值；原SKILL.md frontmatter未改写。29份当前技能正文/附件及4份配置与磁盘产物逐字一致，MCP为空目录。并发维护的技能内容按当前源码构建，没有恢复历史字节或认领其实现。

## 实际验证

| 检查                                                                                               | 结果                                                                                            |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 实现前真实Vite测试                                                                                 | 19项中13通过、6失败；空清单、缺技能及错误字段未拒绝、未选目录仍被读取，确认真实缺能力           |
| 实现后 `node --test --test-isolation=none packages/skills/tests/distribution/collections.test.mjs` | 19通过，0失败/跳过；包括清单筛选、多事件不同参数、未知属性、重建、字节、链接/大小写及清理前拒绝 |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                        | 退出0                                                                                           |
| 同前缀 `run check-types`                                                                           | 退出0                                                                                           |
| 同前缀 `run build`                                                                                 | 退出0，四集合同名目录及空mcp，无占位JS                                                          |
| 同前缀 `run test`                                                                                  | Python12项通过；保留另一功能线测试，不认领其改动                                                |
| `node --test --test-isolation=none scripts/dev/actions/link-skills/test-link-skills.mjs`           | Bash1通过，PowerShell1跳过：缺pwsh运行时；Windows/PowerShell行为未由本轮证明                    |
| TypeScript AST结构及JSDoc探针                                                                      | 工厂外非import声明0；60项声明/循环绑定有多行JSDoc                                               |
| 独立配置与磁盘核对                                                                                 | 4集合、23技能、13事件完整；29技能文件及4配置字节一致，mcp为空                                   |
| 一次独立只读审查                                                                                   | 无Critical/Important/Minor发现；独立复核工厂顶层、技能名单与逐事件迁移，无修改或追加代理        |
| `git diff --check`                                                                                 | 退出0                                                                                           |

临时基线及红灯日志分别在/tmp/foundry-collection-config-before-t073.json及/tmp/foundry-t073-red.log，仅作本轮核对，不构成发布依赖。

## 保留边界

脚本动态生成细节、MCP内容及多插件职责拆分继续待后续确定；没有创建script占位、逐技能speckit-hooks.json或生成器，也没有实际注册/挂载、Actions或发布。

原T065等固定旧目录接口未作为新规则回归通过；旧estimate-context完整检查因MCP清单消费失败及114项既存lint错误的限制沿用[T072记录](collections.md)，本轮未修改该工具，未重跑或声称已修复。link-skills是通用本地来源消费，尚不按新的分发清单筛选，不把其复制测试视作安装/挂载兼容。

T073工程范围完成，MVU-008仍待用户检查产物；本轮没有替代完整安装、平台矩阵、真实宿主加载或发布验收。
