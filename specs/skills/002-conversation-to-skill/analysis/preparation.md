# T001 · 现有候选、交付与安装来源核查

核查日期：2026-11-20。依据为 [T001 方案](../implementation/T001.md)、[功能规格](../spec.md)、[总体方案](../plan.md)、[业务闭环](../mvu.md)及[原任务](../tasks.md)。本报告只证明现状核查，不作为新记录、真实派发或最终消费已通过的证据。

## 本次来源与版本

工作分支为 `feature/init`，基准提交为 `7287ea8ab923de8f257d447e62fcc282072f62fb`。工作区已有未提交改动，以下事实以本轮实际文件及其 SHA-256 为准，不能仅凭提交号复现全部现场。主线技能包版本为 `0.1.0`。

| 本地命令 | 实际输出 |
| --- | --- |
| `codex --version` | `codex-cli 0.170.0` |
| `node --version` | `v26.8.1` |
| `pnpm --version` | `12.8.1` |
| `bash -n scripts/dev/actions/link-skills/link-skills.sh` | 返回 0，无语法错误输出 |

以上是只读版本及语法核对，没有开启新的交互会话或验证 hook 信任。本次 PATH 中未发现 `skills-ref`、`claude`、`goose`、`opencode` 和 `jq`。这些结果只描述当前进程环境，兼容宿主与隔离样例由后续 Task 准备。

## 候选的复用与替换边界

当前四个旧目录各仅包含一份 `SKILL.md`，没有接入脚本、记录写入脚本、附件资源或并发恢复实现。`conversation-extraction` 在主线源码中尚不存在。

| 候选 | 可复用的原则或内容 | 新规格要求替换或补齐的部分 | 承接位置 |
| --- | --- | --- | --- |
| [conversation-recording](../../../../packages/skills/src/profile/conversation-recording/SKILL.md) | 保存真实可见原文、区分用户发言与宿主注入上下文、写前重读与写后核验、不伪造来源、只补可核实缺项、失败后继续用户工作 | 当前按项目内日期原文写入，排除工具原始参数/返回及附件原件，末轮依赖下一轮补存；还明确排除宿主日志接入。须改为仓库内交互入口自动接入、每会话成对文档、完整可得工具/附件、正常末轮及仓库外资料区，旧摘要/分析分支不直接保留 | T004～T014 |
| [conversation-summary](../../../../packages/skills/src/profile/conversation-summary/SKILL.md) | 实际子代理亲自读文件、保存与回传，父代理核验产物；交接保留来源和缺口 | 当前产物是按日摘要，既不逐特点独立成文，也不提供新特点资格判断；不把该目录改名便视为提炼完成，不增加强制摘要阶段 | 新建提炼入口的 T015～T017；旧摘要候选本次保持原样 |
| [conversation-analysis](../../../../packages/skills/src/profile/conversation-analysis/SKILL.md) | 区分明确表达、一次性决定与观察；证据追溯、更正和情境保留；派发与实际完成分开确认 | 当前直接从原文生成按日结论，并回接 shadow-profile。须改为消费已确认特点，生成规则及可携带目录的独立候选，再由父代理协调版本采纳；需要补规则关联、维护及迟到结果保护 | T018～T026 |
| [shadow-profile](../../../../packages/skills/src/profile/shadow-profile/SKILL.md) | 仅作为旧行为和历史依据；原样归档范围已明确 | 不作为新入口或首次提炼材料。新记录验收前不移走源码、不删除安装副本；后续核对完整字节再归档和退役 | T027～T029，前置为 T014 |

以上复用指有选择地沿用规则和交接经验，不表示旧候选已经覆盖新运行能力。原始对话与私人资料不复制进技能源；首次提炼沿新流程确认记录执行。

## 构建、同步与安装是三条不同证据

主线 [profile 配置](../../../../packages/skills/src/profile/collection.config.ts)当前只声明启用 `shadow-profile`。本次直接调用已有 [scanSkills](../../../../packages/skills/utils/scan-skills.ts)，没有调用 Vite 构建或改写 dist：

```bash
pnpm --filter @foundry/skills exec node --input-type=module -e 'import { scanSkills } from "./utils/scan-skills.ts"; const entries = await scanSkills(); console.log(JSON.stringify({ total: entries.length, profile: entries.filter(x => x.collection === "profile").map(({ name, source, target }) => ({ name, source, target })) }, null, 2))'
```

实际返回 0：全包选择 11 项，profile 仅一项 `shadow-profile`，维护源为 `packages/skills/src/profile/shadow-profile`，目标为 `dist/skill/profile/shadow-profile`。三个旧 conversation 候选虽有正文，但均未被主线交付清单选中；新提炼入口也尚不存在。技能复制插件消费这份筛选结果，不需要为本 Spec 接管其构建逻辑。

根 [package.json](../../../../package.json) 的 `skills:link` 明确传入 `packages/skills-distribution-urgent/src`，实际走紧急版。当前紧急版该来源没有 profile 目录下的上述五项。不能只启用主线集合配置，就推定根同步命令会安装主线新技能。

[link-skills.sh](../../../../scripts/dev/actions/link-skills/link-skills.sh) 默认来源虽是主线 `packages/skills/src`，但根命令显式来源优先。该脚本按含 `SKILL.md` 的目录发现并复制，不消费集合的 enabled 筛选；以主线或旧 profile 为源直接运行，会涉及有正文但未启用的旧候选。它保留来源未声明的目标，当前退役名称排除表也没有 `shadow-profile`。因此构建禁用、显式源同步和旧副本移除需要分别验证。

| 名称 | 主线维护源 | 当前主线 dist | `.agents/skills` 副本 | 根同步的紧急版 profile 来源 |
| --- | --- | --- | --- | --- |
| conversation-recording | 有，仅 SKILL.md | 无 | 无 | 无 |
| conversation-summary | 有，仅 SKILL.md | 无 | 无 | 无 |
| conversation-analysis | 有，仅 SKILL.md | 无 | 无 | 无 |
| conversation-extraction | 无 | 无 | 无 | 无 |
| shadow-profile | 有，仅 SKILL.md | 有，仅 SKILL.md | 有，仅 SKILL.md | 无 |

现有 `.agents/skills/shadow-profile/SKILL.md` 与主线维护源字节不同，不能当成同版安装结果。当前没有可核验的安装来源凭证，本次不还原它最初由哪个来源安装；脚本保留未声明目标是现有行为，不是该副本历史安装过程的证据。dist 的存在也只证明现场文件存在，本次未构建或验收其消费。

隔离候选后续可沿已有脚本显式指定主线来源及临时安装目标，保留真实来源证据。当前项目的长期安装接线由相应交付/切换 Task 处理，不在 T001 修改根命令、紧急版源码或项目安装副本。

## 文件快照

下表记录 SHA-256，均为本次实际读取的本仓库文件；未读取宿主认证文件或用户级机器配置。

| 文件 | SHA-256 |
| --- | --- |
| `packages/skills/src/profile/conversation-recording/SKILL.md` | `01e680eebc7d07079e4227253b545d3dc6a9dabc2e32bb1f83f600da7a3053f0` |
| `packages/skills/src/profile/conversation-summary/SKILL.md` | `a76a2a38cab9e0d977d7419d5366863b64d36882fbd759775a0d82fbd56921e1` |
| `packages/skills/src/profile/conversation-analysis/SKILL.md` | `03d166cae2ab20e2c47cd496202399640a4d1275e8492729705936b7455e12ea` |
| `packages/skills/src/profile/shadow-profile/SKILL.md` | `d9fe13c9d53f23230ac1063f513d38cab67e7109cd7e042d5e1b44cfb40c3cc4` |
| `packages/skills/src/profile/collection.config.ts` | `bc57a788afa9556424548fabc412ee12ad8323d42005566dbe642507dd3f18ec` |
| `scripts/dev/actions/link-skills/link-skills.sh` | `96d970a4e0a6379a050a06bb44569af3d895a032c00493c5cb193009bbb7abdd` |
| `package.json` | `b0ce7f4b4bf9e107618ce55307fb813f3168fb36dbe295b063cef358fef2baf0` |
| `packages/skills/package.json` | `1690f1a538e0ba546b1513d816d52f5c5416fa8cbe17182c9016868676cf30fa` |
| `packages/skills/utils/scan-skills.ts` | `4549ffbc93f8c4a764f019b6dd509f592e5fba2c8b16944ff6ddd5a1175838fc` |
| `packages/skills/build/plugins/vite-plugin-skill/index.ts` | `9877fc39ff0a2d2a9031413016c7ba376455aa8df71490d3f00a9547afb512b8` |
| `.agents/skills/shadow-profile/SKILL.md` | `3c35847b795e1cc90fe3d503168cbd31849d607fe0a90abf4d2ab963ebc1049e` |

## 缺前置与后续衔接

本仓库 `.codex/hooks.json` 和 `.specify/feature.json` 均不存在。这里只核对仓库级文件；用户级 hook、信任及历史接口可用性尚未实测。后续需明确 Spec 定位，不能默认现有会话已经启用新记录。

T002 负责隔离仓库的两个项目目录、仓库外对照/资料根、已知附件/长输出、受控失败及 Git 基线，并核对实际可用的派发和兼容宿主。T003 负责稳定资料定位及共用交接契约；本报告不代写其技能源文件。

T004/T005 负责真实交互开启时间、首条保存顺序、末轮、恢复前目录、完整工具/附件来源和主会话子代理工具活动的取证。T014、T022、T026 负责最终安装入口的读取及业务复验；T022 的兼容宿主实际消费仍缺环境与真实结果。新记录前置未通过时保留旧入口。

## 本次验证范围

已完成旧正文及目录结构核查、实际主线只读扫描、版本检查和同步脚本 Bash 语法检查。Markdown 已按项目要求执行 ESLint，但 Spec 路径被现有配置忽略，不能计为内容 lint 通过；保存结果另以读回、快照、链接、任务身份和差异检查核验。

没有运行构建、安装或同步命令，没有新开实际 CLI 业务会话，没有执行恢复/故障/提交/派发/兼容消费试验，也没有新增或重跑产品测试。T001 完成仅表示本报告的资料核查验收满足，不能勾选后续能力任务。
