# MCP 构建清单验收

日期：2026-11-03。范围：MCP-BUILD-001～006；用户要求先同步 spec，再添加测试 skill 和自动生成清单。已先更新本 Spec、契约、计划与任务说明，随后实施。线上内容范围、MCP 应用迁移和流水线不在本轮范围。

## 实际交付

- 样例：packages/skills/src/mcp/mcp-build-smoke/SKILL.md，以及 references/verification.md。仅包含测试标识与读取说明，不执行业务动作。
- 生成器：packages/skills/build/plugins/mcp-manifest.ts，接入单一 vite.config.ts。递归扫描 src/mcp，解析标准 YAML，收录完整正文与 references 文本；同一技能目录内附件不作为另一技能重复扫描。
- 产物：packages/skills/dist/mcp/manifest.json，顶层 version: 1，当前 skills 只含 mcp-build-smoke，附件名 verification.md，category 为 null，destructive 缺省 false。旧 dist/manifest.json 不恢复，src/mcp/manifest.json 不存在。
- 同源稳定排序，不写生成时间；与原样复制的 MCP 源文件、线下技能及脚本同次构建交付。线下原有 23 文件的内容摘要保持不变。

## 验证

所有 pnpm 命令使用 --config.verifyDepsBeforeRun=false，不减少实际 lint 或类型检查。

| 实际命令或检查                                                                     | 结果                                                                                                   |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| pnpm --filter @foundry/skills run build                                            | 退出 0，自动生成 MCP 清单                                                                              |
| pnpm --filter @foundry/skills run test                                             | 退出 0，12 项通过；含真实样例正文、附件与来源隔离检查                                                  |
| pnpm --filter @foundry/skills run lint                                             | 退出 0                                                                                                 |
| pnpm --filter @foundry/skills run check-types                                      | 退出 0                                                                                                 |
| node packages/skills/tests/distribution/test-build-config.mjs                      | 6/6 通过；覆盖单次构建、脚本隔离执行、缺目录失败、递归元数据与附件、可复现与源增删改，以及七类非法输入 |
| skill-creator/scripts/quick_validate.py packages/skills/src/mcp/mcp-build-smoke    | 用本机既有 Specify 环境 Python 执行，退出 0，Skill is valid；未安装依赖                                |
| 现有 foundry_skills_mcp.registry.load_skills 显式传入 dist/mcp/manifest.json       | 只读调用通过，返回 mcp-build-smoke；默认路径未改，未启动 MCP 服务                                      |
| 源目录手写 manifest、重复 name、非法 name/description/destructive、坏 YAML、空正文 | 在临时项目逐项断言构建拒绝，未污染实际源目录                                                           |
| 文档和差异                                                                         | 变更 Markdown 逐文件 ESLint 自动修复；git diff --check 通过                                            |

红绿证据：新增测试先因清单/样例不存在和手写源清单未被拒绝失败；生成器与样例加入后全部通过。实现中修正了严格类型下的正则捕获校验与 Vite 输出写法；最终使用 writeBundle 写派生文件，类型检查通过。

## 边界

测试 skill 仅验证构建及正文/附件读取契约，未作为生产技能部署；不声称线上服务、用户行为或流水线通过。现有 MCP 默认路径及旧上下文估算工具仍引用旧根清单，后续适配；此次只读显式路径校验不能抵扣该迁移。未发布、未推送、未修改受管安装。
