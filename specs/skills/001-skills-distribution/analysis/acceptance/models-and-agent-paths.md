# T010/T011：正式模型与固定 agent 路径交付

## 本次结果和边界

用户在明确 T010→T011→T012→T013 的实施内容后说“开始把”。本轮完成可独立推进的 [T010](../../tasks.md#t010) 正式清单类型与校验器、[T011](../../tasks.md#t011) 固定 agent 数据与路径解析，复用已有前置和骨架。两项按互不修改同一文件的分工并行实施，由主执行者统一复验和保存任务状态。

正式模型检查 36/36 通过；路径检查 6/6 通过，包含 Linux 上真实官方 CLI 的 79 项目级、77 全局安装及两个不支持全局的拒绝场景；原 T051 独立交付 7/7 回归通过。目标包 lint、check-types、build 均通过。

模型检查接入 US1 后实际 56 项：45 pass、11 原有预期 fail、0 skip。原目录别名规范化和 `--check --official` 仍分别归 T012/T013，不能因模型和路径通过而将 US1 判为通过。本轮尚未把正式模型接入默认构建或实现预检。完整同版来源的 `artifact-spec-analysis` 仍不存在，旧退役来源尚在；T012 的完整集合条件及主线 T073/T074 移交依赖保留，不用旧集合或样本抵扣。

## T010 的实际实现

`models.ts` 定义 Release、ReleaseSkill、ReleaseFile、ProjectedFile、ReleaseTools 及固定分类和投影身份。`validate.ts` 提供 `parseRelease`、`parseReleaseJson` 和 `assertReleaseUnchanged`：验证字段、固定工具/版本、路径和摘要、完整文件集合、投影来源、公开依赖与适配输入，不修改调用方数据或写目录。

模型格式见 [data-model.md](../../data-model.md#t010-正式字段格式与校验边界)。投影摘要集中按投影与技能保存，技能只引用相同安装相对路径；sourcePath 指向交付白名单同一字节，identity 原样，Eve 的非 SKILL.md 附件也必须原样。清单不能包含自身摘要或静态扩展定义。结构通过只证明模型一致，不代替完整发布材料、平台或真实远端验收。

首轮测试因缺校验器真实失败；实现后分类数组可被字符串化及未知安装格式两个边界先暴露红灯，再按严格类型和格式修复。独立只读审查又复现文件/目录占用冲突、Eve 普通附件可被无关字节替换及 Unicode case-fold 使 Kelvin 符号冒充 ASCII SemVer。每类均补具体失败用例后修复；文件/目录冲突覆盖两种条目顺序，Eve 同时保留嵌套 SKILL.md 合法转换正例。最终 36 项通过，不靠扩大接受范围或删断言求绿。

同版本保护按实际清单内容拒绝替换，发布通道最终不可变性仍由 T030/T037 及用户另行授权的发布过程落实。正式模型没有生成自有安装运行核心，当前 T051 的开发清单保持原状，等待 T012 接线。

## T011 的实际实现与上游依据

`distribution/agents.json` 保存 79 项显式配置及上游元数据；路径规则使用 home、xdg-config、environment、openclaw 等结构，不写构建机展开后的 HOME。`agent-paths.ts` 导出 `agentPaths` 和只读 `resolveAgentPath(agentId, { project, userHome, global, env?, platform?, exists? })`。未知 agent、不支持的 scope 和非绝对 project/userHome 在目录探测前拒绝。

固定官方包为 skills 1.7.4。实际 npm 元数据中的源码提交是 `a80e4c9d12d607631249d4d7d059f835d4b2f13a`；`dist/cli.mjs` 的 SHA-256 为 `b7d92e2a619e8982d38390572750efb8c2ec81cdf23c33aed2fa426d080a1e4e`。来源 URL、包 URL、版本、提交和摘要都保存在数据中，可与固定 npm 包独立核对。

测试从固定 bundle 的 agent 配置和原生安装路径函数读取独立预期，另以手写具体路径验证环境分支。universal 项目/全局安装分别归项目和用户 HOME 的 `.agents/skills`，不误用展示用 globalSkillsDir；CLAUDE/VIBE/HERMES/AUTOHAND/GROK 专属变量按原生规则展开。CODEX_HOME、SARVAM_HOME、Zed APPDATA/Flatpak 等检测变量不被误当目标。OpenClaw 覆盖 `.openclaw`、`.clawdbot`、`.moltbot` 优先级及空场景回退。

项目和全局实际安装逐项使用独立沙箱与 copy 模式；Eve、PromptScript 的全局拒绝另执行官方命令并确认无 SKILL 写入。Windows/macOS 仅完成纯路径语义与固定配置对照，没有在这两种操作系统上真实安装，不计平台通过。上游当前的 XDG 原值规则经独立检查与 bundle 一致，未自行改为另一种环境变量标准。

## 实际命令与检查结果

| 命令或操作                                                                                                                                                                    | 实际结果                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `node --test --test-isolation=none packages/skills/tests/distribution/release-models.test.mjs`                                                                                | 首次缺模块失败；最终 36 pass、0 fail、0 skip，覆盖每个必需字段及跨字段约束        |
| `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t051-official/node_modules/skills node --test --test-isolation=none packages/skills/tests/distribution/agent-paths.test.mjs`             | 主执行者最终整合复验 6 pass；156 个支持组合真实安装，另两个 global 拒绝场景       |
| `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t051-official/node_modules/skills node --test --test-isolation=none packages/skills/tests/distribution/content-export.mjs`               | 新 agent 数据交付后 7 pass、0 fail、0 skip；独立三技能安装及原始字节保持          |
| `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-t051-official/node_modules/skills pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --story US1` | 最终退出 1；56 项为 45 pass、11 原有预期 fail、0 skip，reason 为 null，非环境错误 |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                   | 最终退出 0                                                                        |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                            | 最终退出 0                                                                        |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                  | 最终退出 0；默认三目录未切换为正式分发                                            |
| 独立只读审查、改动声明中文多行 JSDoc、Markdown 格式及引用检查                                                                                                                 | 审查发现的具体反例已补回归并修复；保存后读回及引用检查，不修改其他两条 Spec       |

Node 子进程在普通沙箱的 EPERM 按原规范经批准在沙箱外复验；模型纯校验可直接在普通沙箱运行。没有为此安装新的工作区依赖，固定工具继续复用 T051 的 npm 包。原始日志为 `/tmp/foundry-t010-*.log`、`/tmp/foundry-t011-final.log` 和 `/tmp/foundry-t010-011-*.log`；临时日志可能被清理，本文保存必要事实和限制。

未重跑无代码影响的 Python/MCP 全套，T051 已记录的 Pair 旧治理锚点问题未由本项修复，不声称全包测试全绿。未验最低 Node、Windows/macOS 真实安装、全部两入口/四粒度矩阵、完整四模式与两 hooks 或真实远端。工程、内容来源移交、用户行为和发布批准继续分别判断。

T010/T011 完成后下一项是 T012；完整工作流来源与消费契约须在依赖点读回。没有开启发布、真实用户目录安装或未知内容清理。
