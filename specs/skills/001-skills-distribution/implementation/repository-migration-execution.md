# Agent Foundry 迁仓执行与验证

用户于2026-11-13审阅设计与文件范围后明确：“emm，开始吧，移除的内容在这边就删掉吧”。本次据此完成本地迁仓、使用者文档站及原仓库对应删除；未创建Git提交、推送、版本标签或部署。

## 实际交付

已建立pnpm12、Turborepo、catalog和最小ESLint/TypeScript共享预设。一般build包含共享预设、主线和文档站；要求真实提交身份的紧急候选另用build:candidate。pnpm install只准备共享配置与Nuxt，不自动刷新外部技能或注册hooks。

五个主体目录及相关link-skills、register-hooks、estimate-context、MCP Compose已迁入。删除前逐项核对454个源/目标文件，两个私人技术记录的原字节留在原仓库私有记录区，新根仅有公开摘要。原始归档可沿原Git历史及摘要追溯，公开派生包含成员映射和MIT通知。删除前凭据见根migration-transfer.json，最终目标摘要见migration-manifest.json。

主线代码保留手写中间态。迁移适配仅限三项配套：两项Python测试改读独立fixture；ESLint排除原字节第三方fixture，正常源码及测试规则保留。原业务构建插件未改，未接管T076/T077。九项正式技能按新根显式命令生成已安装副本，eval样本不进入该复制入口。

apps/docs采用Nuxt4、Nuxt Content3和UnoCSS属性化样式，已提供首页、安装、技能目录、工作流和MCP使用五页；支持集合导航、当前页提示、标题目录、桌面/移动布局、移动菜单、客户端导航及真实404。规格和历史验收未作为本站内容集合自动渲染。

原仓库的九个迁出目录已删除；保留其他业务应用、共享preset、第三方技能安装及本仓库私人画像。初始化入口已解除原本地技能、hooks、模式注册调用，相应说明和回归同步更新。

## 实际检查

| 命令或观察                                                                                                          | 结果及边界                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 新根pnpm install                                                                                                    | 最终通过，五个workspace独立安装及初始化成功                                                                      |
| 新根pnpm build                                                                                                      | 最终通过，3项构建成功，源码不依赖原仓库运行路径                                                                  |
| pnpm --filter @foundry/docs lint / check-types                                                                      | 通过；最终页面键与显示属性修复后复验通过                                                                         |
| 两技能包check-types及preset check-types                                                                             | 通过，严格基线与消费方更严格覆盖保留                                                                             |
| 文档站、preset、紧急版lint                                                                                          | 通过                                                                                                             |
| pnpm --filter @foundry/skills lint                                                                                  | 失败，唯一错误仍为原build/plugins/old/collections.ts:9中handleConfigResolved未使用；迁移前已复现，不擅改用户主线 |
| FOUNDRY_JQ和FOUNDRY_YQ指定已核验官方工具后，主线python -B -m unittest discover -s tests -p test_*.py                | 12项通过，独立脚本、模板与初始化fixture可用                                                                      |
| 紧急包node --test --test-isolation=none tests/build.test.mjs tests/workspace-source.test.mjs tests/publish.test.mjs | 45项通过，覆盖真实来源、双构建及临时bare Git工具测试；不等于向真实远端发布                                       |
| uv run --project apps/mcp --frozen --group dev pytest apps/mcp/tests                                                | 10项通过；样本清单解析及注册，不代替生产manifest接通                                                             |
| node scripts/dev/actions/link-skills/test-link-skills.mjs                                                           | 3项通过，1项缺pwsh跳过                                                                                           |
| pnpm skills:link                                                                                                    | 生成九项正式技能，各正文及附件来自本仓库紧急版来源                                                               |
| 原仓库node scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs                                                           | 3项通过；迁出路径故意不存在时仍可正常初始化，错误边界保留                                                        |
| 原仓库node scripts/dev/postinstall/test-postinstall.mjs                                                             | 6项检查通过，PowerShell缺运行时跳过                                                                              |
| 原仓库personal-hub lint与check-types                                                                                | 通过，仅修改其指向旧技能路径的注释；既有NuxtHub警告不作新功能错误                                                |
| 本机HTTP请求                                                                                                        | 五页均200，不存在页404                                                                                           |
| 1440px与375px真实浏览器                                                                                             | 五页、客户端跳转、当前页、桌面/移动显示、菜单收起、无整页横向溢出及无pageerror通过                               |
| 生成CSS及计算样式                                                                                                   | un-text、正文排版、属性化响应式选择器实际生成；浏览器计算显示值符合断点                                          |
| pnpm build:candidate                                                                                                | 按预期拒绝未提交的packages/skills-distribution-urgent/package.json；未绕过来源保护、未冻结正式候选               |

## 失败过程及修复依据

- 初始准备脚本依赖本机未装的PyYAML，改用仓库已有YAML解析器；不新增运行依赖。原默认catalog与分组catalog差异按实际版本范围复用。
- esbuild安装脚本初始被pnpm拦下，只明确允许此构建依赖，保留其他策略。
- 小根环境无法复用旧根的隐式Vue检测，最小ESLint工厂显式启用Vue规则；没有关闭检查。JSON风格工作区配置与pnpm补写头冲突后，改为标准YAML并复验。
- pnpm实际拦下encodeurl2.0.2信任等级下降。核对npm官方元数据后，固定兼容范围内2.0.0，按官方建议清理可再生成依赖和锁再安装，保留trustPolicy，最终安装通过；未放宽策略。
- 主线第一次12项测试有3项因固定yq下载60秒超时失败；缓存同版官方jq/yq并核对生产脚本固定SHA后，通过既有离线参数复验12项通过。工具只在本地临时目录，不随仓库分发。
- 浏览器验证发现display属性没有生成期望的响应式选择器；经Uno引擎确认后改为有效属性化规则。Nuxt官方文档明确提示不要以全局$route作为NuxtPage页面键，改用组件提供的路由函数。最终构建与浏览器实际复验通过，未引入watcher。
- 原仓库pnpm包装器在workspace迁出后尝试自动同步依赖时遇到沙箱缓存只读；改用已有ESLint二进制完成同一源码检查，通过工具授权执行，没有触发完整上游初始化。

## 审查与保留范围

独立只读审查未发现Critical或Important，并重新核对454项删除前目标摘要一致。审查指出一个Minor：原初始化测试重写后仅覆盖Bash，没有继续保留检测到pwsh时执行PowerShell的分支。本轮暂保留该限制；当前环境无pwsh，未承诺Windows验收，未来PowerShell改动缺少同一入口的自动回归覆盖。

审查未重新执行构建/浏览器/MCP部署；本轮构建和浏览器由主代理实际执行，部署未做。当前manifest收口属于迁移记录，不抵扣T090真实新身份冻结；T090～T093及其他原Task状态保持。主线eval配置与正式分发排除要求、MCP旧manifest与现主线构建契约仍为已知原功能缺口，本轮未重写。

所有历史失败、旧候选摘要和原checksum保留发生时语境，不反向改成当时已经迁仓、发布或通过新来源验收。

最终截图复核另外发现代码块浅色高亮与深色背景对比不足，已改用Nuxt Content官方github-dark主题。再次lint、类型检查、一般构建及完整浏览器检查均通过；实际测得首个代码token与背景对比度约11.87:1。最终源码仍无新增watcher，454项目标摘要再次核对无变化。
