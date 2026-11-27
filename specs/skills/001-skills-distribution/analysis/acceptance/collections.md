# T072：集合来源与单插件构建验收

日期：2026-11-11。用户提出集合方案并澄清eval归属、自动发现、hooks集中、发布待定以及“特定的脚本我们额外处理”；依据[原始需求](../../requirements/raw/2026-11-11-collection-build.md)、[讨论](../../requirements/discussions/2026-11-11-collection-build.md)及[实施方案](../../implementation/T072.md)。本次未恢复已归档的T067六模块。

## 实际交付

- src一级为coding、frontend、workflow、eval四个集合，原skills和mcp来源目录已移除；mcp-build-smoke迁入eval。
- 每集合新增collection.config.json。packageName=null、mcp=false为当前默认值；workflow.hooks按技能目录名保留8份原JSON完整对象，其他集合hooks={}。源及产物中逐技能speckit-hooks.json均为0，没有生成兼容附件。
- 一个build/plugins/collections.ts插件由唯一vite.config.ts接入。扫描实际集合目录，普通文件按原始资产交付；缺配置集合默认可构建，不维护固定集合名单。配置只校验公共字段和技能归属，不解释专用hooks业务。
- dist实际仅有coding、frontend、workflow、eval、mcp；前四项与src同名目录文件完整逐字对应，mcp为空。没有占位JS、MCP manifest、Release、安装投影、子包package.json或script交付。本轮只是内容构建，不是完整安装或发布树。
- link-skills双平台默认源改为src，并同步测试与说明；estimate-context仅调整源码回退根及对应注释，MCP清单消费没有改。

## 迁移保护与并发变更

迁移前记录37项实际来源文件，其中29项为正文/附件、8项为hooks。移动后立即逐项核验：29项原字节摘要全部一致，8份hooks对象与集合配置内对应值全部等值，确认后才移除逐技能重复配置。未重写SKILL.md/frontmatter或附件。

后续最终核验发现task-increment/SKILL.md发生本轮迁移动作之外的并发内容更新；已保留该更新，不按旧摘要覆盖。最终28项仍与迁移基线相同、该1项保留新内容、8份hooks仍等值；重新构建后，全部33项当前src文件均与dist逐字相同。不要将该并发更新归因于本轮插件逻辑，也不把“迁移时字节不变”说成文件之后从未更新。

源码迁移不修改其他功能线资料、实际安装目标或用户配置。新路径保留了迁移时存在的未提交实施准备技能；未使用reset/revert整理其他工作。

## 真实失败到通过

```bash
node --test --test-isolation=none packages/skills/tests/distribution/collections.test.mjs
```

初次运行有1项hooks反例被旧“技能打包重做中”统一错误误匹配；先收紧测试，明确拒绝将统一未实现错误当有效校验，再实际取得11项全部失败、0通过的真实基线。随后实现插件，原11项转绿。

自查新增附件父目录大小写冲突、emptyOutDir=false时输出内部链接两项，均先实际失败再修正；本地默认源路径测试也先因仍查找src/skills失败，再改为src通过。一次独立只读审查发现“Collection.Config.Json与派生默认collection.config.json冲突”这一项Important，补真实来源反例取得失败后，显式拒绝配置名大小写变体和同名目录。没有再次派审。

最终集合测试退出0：**14项通过、0失败、0跳过**。覆盖任意集合、缺配置/空集合、完整元数据和文本/二进制附件、源码不变、删除重建、同源稳定、不执行集合代码、write=false、非法JSON/字段/技能归属、链接、保留mcp名、根及附件大小写、配置派生冲突、危险输出和输出内链接。使用真实Vite及当前唯一配置，所有反例仅写自有临时目录。

## 工程及消费检查

包命令前缀为 `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills`。

| 命令                                                                                     | 实际结果                                                              |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| run lint                                                                                 | 最终退出0，没有放宽检查规则                                           |
| run check-types                                                                          | 最终退出0，没有新增兼容声明或修改检查配置                             |
| run build                                                                                | 最终退出0，真实生成四集合及空MCP；全部33项源文件与产物逐字一致        |
| run test                                                                                 | 最终退出0，当前Python12项通过；含另一功能线新增测试，不据此认领其实现 |
| Node集合测试命令                                                                         | 最终14通过，0失败，0跳过                                              |
| `node --test --test-isolation=none scripts/dev/actions/link-skills/test-link-skills.mjs` | 沙箱外Bash1通过，PowerShell缺运行时1跳过，退出0                       |

另实际导入estimate-context，断言默认源码根为packages/skills/src，并在不存在安装副本的情况下读取eval/mcp-build-smoke计算正字符数，退出0；这只验证本轮源码回退路径。

## 失败、未执行与保留边界

- `pnpm exec eslint scripts/dev/actions/link-skills/test-link-skills.mjs scripts/dev/actions/estimate-context/estimate-context.mjs`退出1：estimate-context有114项既有风格/复杂度等错误。对HEAD原文与当前文件分别运行JSON格式ESLint，前后均114项，逐行ruleId/message比较没有新增。未借路径修改扩围格式化或重构整个旧工具；link-skills测试文件自身未报错。
- `node scripts/dev/actions/estimate-context/test-estimate-context.mjs`退出1：5项基础断言先通过，随后“CLI执行单个真实skill成功退出”失败。工具仍依赖旧MCP清单，当前约定不生成清单，专用消费需后续明确规则；未伪造MCP内容使其通过。
- 原T065的25项完整链针对旧src/skills、src/mcp及旧阶段接口，本轮未重跑或修改断言求绿，不能将新14项等同其全部下游验收。保留的安装/挂载脚本及其旧来源测试也未宣称适配。
- 未执行真实hooks/commands注册、实际用户目录安装、MCP应用加载、watch模式、Windows/macOS/最低版本、Actions、发布、迁后独立安装或完整矩阵；PowerShell仅记缺运行时，不算通过。

## 续接

T072本轮集合迁移与内容构建可验收；源码与构建产物不再包含逐技能hooks文件。用户后续选择MCP内容规则、特定脚本或发布流程时，先核对相应原Task与新集合契约，再讨论适用实施范围。T068～T070、候选/full/ready及实际发布不因本轮局部通过自动放行。

临时日志位于/tmp/foundry-collections-*.log、迁移基线位于/tmp/foundry-collections-migration.json，可能被清理；本记录保存真实分类、命令和关键结果，不以临时文件作为长期唯一证据。未提交、推送或发布。
