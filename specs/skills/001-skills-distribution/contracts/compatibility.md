# 兼容契约

## 2026-11-16 当前主线兼容层

最新入口必须能消费所承诺历史技能记录固定关联的辅助接口；入口版本、技能版本、辅助包版本分别验证，不以版本字符串相同代替实际文件/协议核验。新主线release-manifest.json的schema2与紧急版旧schema1显式隔离，数组索引不能送进旧对象解析器。具体规则见[curl交付契约](curl-delivery.md)。

当前新 Bash 入口有基础项目级复制；hidden 的 TS 模板已有路径、Git 检查及排除基础逻辑，已接入 curl 插件并随脚本包交付，但安装调用、成功集合与结果协议仍未接通。两个插件的本地归档已有局部验证，不等于完整安装/隐匿通过。本轮只以 Linux/Codex/project 作为先行验证组合，不缩减原动态 agent/global/三平台最终目标。未知或尚未实现的请求必须明确拒绝，不能静默套用 .agents/skills。旧 Node 及其他平台代码移到 script/old 属于用户现场，历史证据仅适用于当时范围；紧急版仍只承诺 Linux/Codex 项目级。

**本次重新验收（2026-11-10）**：三目录、MCP清单与发布打包全部重做，既有工具和消费者范围继续适用；旧平台通过不自动传递到新构建。新实现按 [build-pipeline.md](build-pipeline.md) 返回阶段结果并实际验证保留两入口、工作区消费者和原支持矩阵。完整依赖快照、平台收据和迁后真实运行分别留证，不以本地node_modules或合成平台材料替代。

2026-11-09 用户修订：skills 的 Agent 来源在每次安装或官方预检时在线解析 npm latest，不固定版本、提交或 Agent 数量；同次使用解析出的版本并报告 upstream.version/integrity。Specify 仍沿用 1.2.6。下面 1.7.4 的 79 项目/77 全局清单及旧矩阵保留为历史校准样本，不代表当前 latest 的完整通过结论。

## 历史安装 agent 清单（skills 1.7.4）

[历史版本 agents.ts](https://github.com/vercel-labs/skills/blob/v1.7.4/src/agents.ts) 与 [installer.ts](https://github.com/vercel-labs/skills/blob/v1.7.4/src/installer.ts) 共同定义路径；不能只复制展示用 globalSkillsDir。

历史 skills 1.7.4 样本含以下 79 个项目级 id；当时除 `eve`、`promptscript` 外均支持全局：

```text
aider-desk, amp, antigravity, antigravity-cli, astrbot, autohand-code,
augment, bob, claude-code, openclaw, cline, codearts-agent, codebuddy,
codemaker, codestudio, codex, command-code, continue, cortex, crush,
cursor, deepagents, devin, dexto, droid, eve, firebender, forgecode, fx,
gemini-cli, github-copilot, goose, grok, hermes-agent, inference-sh,
jazz, junie, iflow-cli, kilo, kimchi, kimi-code-cli, kiro-cli, kode,
lingma, loaf, mcpjam, minimax-code, mistral-vibe, moxby, mux, opencode,
openhands, ona, pi, posit-assistant, qoder, qoder-cn, qwen-code, replit,
reasonix, rovodev, roo, sarvam-code, tabnine-cli, terramind, tinycloud,
trae, trae-cn, warp, windsurf, zed, zcode, zencoder, zenflow, neovate,
pochi, promptscript, adal, universal
```

当前已移除 `packages/skills/distribution` 目录，官方在线来源直接定义在数据读取器中，不维护独立声明或映射文件。平台安装及预检调用 `script/install-skills/read-agents.mjs`，在线读取实际发布包并验证 npm integrity，复用同包的 Agent 声明、XDG 实现和安装路径函数；不执行 CLI 入口或安装代码，不创建 npm 缓存、锁或下载暂存。旧静态解析器已退出产品实现；原数据只保留在 tests 夹具供独立预期使用。

最终仅检查所选 Agent 与 scope 的绝对路径、链接及冲突，无关 Agent 的环境覆盖不得扩大失败范围。项目根仍为调用 cwd，全局目录依官方本次规则求值，不从本机历史安装猜测。网络、完整性或源码布局不兼容时明确失败，不回退旧版本；报告只保存本次实际版本，下次重新查询 latest。

公共核验解析实际路径及链接目标；不盲目跟随目录链接写入。curl 首版采用目录复制；官方文档推荐 `--copy`，官方其他模式仍由上游支持，公共第二步可只读核验其实际链接内容，不能声称未测模式已通过。

## 原生挂载交集及历史对应关系

[Spec Kit 1.2.6 原生集成目录](https://github.com/github/spec-kit/blob/v1.2.6/docs/integrations/index.md) 共 43 项，下表是与历史 skills 1.7.4 的 35 项显式对应关系；实际调用仍须核对本次在线清单，不能把此表当成 latest 的完整交集。2026-11-04 已通过本地安装的 1.2.6 包读取 INTEGRATION_REGISTRY 核对 43 个标识与本表及其余 8 项一致；这是源码清单核对，35 项安装与真实技能派发仍待 MVU-D，不计兼容通过。

| Spec Kit integration | skills agent id |
| -------------------- | --------------- |
| agy                  | antigravity     |
| amp                  | amp             |
| auggie               | augment         |
| bob                  | bob             |
| claude               | claude-code     |
| cline                | cline           |
| codebuddy            | codebuddy       |
| codex                | codex           |
| command-code         | command-code    |
| copilot              | github-copilot  |
| cursor-agent         | cursor          |
| devin                | devin           |
| droid                | droid           |
| firebender           | firebender      |
| forge                | forgecode       |
| gemini               | gemini-cli      |
| goose                | goose           |
| grok                 | grok            |
| hermes               | hermes-agent    |
| junie                | junie           |
| kilocode             | kilo            |
| kimi                 | kimi-code-cli   |
| kiro-cli             | kiro-cli        |
| lingma               | lingma          |
| mcode                | minimax-code    |
| opencode             | opencode        |
| pi                   | pi              |
| qodercli             | qoder           |
| qwen                 | qwen-code       |
| rovodev              | rovodev         |
| tabnine              | tabnine-cli     |
| trae                 | trae            |
| vibe                 | mistral-vibe    |
| zcode                | zcode           |
| zed                  | zed             |

其余 8 项为 `alquimia`、`docker-agent`、`dsh`、`generic`、`muse`、`none`、`omp`、`shai`。不得把 generic 映射 universal 或 omp 映射 pi。交集外 agent 可安装技能，但请求挂载时明确失败为不支持；非 Spec Kit 项目按不适用跳过。

挂载目标须有明确 default integration，传入 agent 与其映射一致，原生 status 与 init-options 一致。多 integration 安装不等于多个 default；不自动切换或安装 integration。hooks 是项目共享配置，部分 agent 共用技能目录，因此报告共享可见性，不保证 agent 私有隔离；只为本次请求的 default 注册原生命令，不主动写其他 agent 专属目录。依据见[原生 integration CLI](https://github.com/github/spec-kit/blob/v1.2.6/docs/integrations/cli.md)。

## 本轮入口与迁移兼容

当前模式只保留 Increment，适用 hooks 为正式同版准备、分析与结案来源；缺三个暂停来源不影响选中 Increment。旧 modes 缩减、旧产物清理和受管目录未知文件保护必须在所选 Specify 1.2.6 实际版本下分别留证；其他 --cli/版本不能套用该结果，未测版本报告限制。具体迁移规则见 [mount.md](mount.md)。

代码读取确认 Codex 生成 speckit-modes-increment 技能入口并可改写 frontmatter；原始/安装投影逐文件核验与原生生成语义核验分别记录。纯安装 agent 路径测试、原生集成产物、宿主实际加载三层证据不混用，不以登记成功保证讨论门禁。没有宿主或必要平台保留未验，不进入业务实现造加载证据。

## 平台与证据

| 平台    | 本包入口最低运行时            | 需独立记录       |
| ------- | ----------------------------- | ---------------- |
| Linux   | Node 22.20.0 + Bash 3.2       | 安装、隐匿、挂载 |
| macOS   | Node 22.20.0 + Bash 3.2       | 安装、隐匿、挂载 |
| Windows | Node 22.20.0 + PowerShell 7.4 | 安装、隐匿、挂载 |

Bash 网络引导需要支持 HTTPS 的 curl；PowerShell 使用原生 HTTPS 能力。唯一 Node 入口统一要求 Node ≥22.20.0，并自动调度平台模块；运行依赖按平台列明并在工具独立目录准备，不修改目标项目依赖，不要求第三方 Node 运行依赖。Agent 在线数据查询另需 Node 与 tar（只经标准输入输出读取包）；官方 skills 入口另外要求 npm/npx 和 Git；隐匿需 Git；挂载需 Python ≥3.11，并可通过 --cli 使用已装 Specify 1.2.6；现有脚本默认通过 uvx 运行时还需 uv。分发适配统一 FOUNDRY_SPECIFY_VERSION=1.2.6，不修改消费者全局环境。Git 首轮验证基线 2.47.3；最低运行时边界也要进入测试，不能只测开发机最新版。原生工具的操作系统限制必须如实报告，不能用路径 fixture 冒充真实安装。

SC-001 当前矩阵按实际解析版本枚举，公式为 `3 × (项目级数量 + 全局支持数量) × 2 × 4`；旧 1.7.4 的 3744 组仅是历史基线；另测该次所有不支持 global 项的拒绝（历史 1.7.4 为两项）、环境变量分支、已有内容及失败恢复。路径映射可不启动真实 agent；技能调用和原生 hooks 的行为必须另外留真实证据。每条记录至少含平台/版本、agent、scope、入口、选择、技能来源 revision、skills 实际版本及完整性、实际路径、文件差异、状态和证据位置。缺平台、网络或 agent 运行环境记未验证，不计通过。

T003/T004 仅按用户确认的 Linux 实际环境验证；T005 在 Linux Bash/PowerShell 验证内部核验，T041 在 Linux Node 24.22.2 验证唯一 .mjs 入口。上表为目标平台下限，不代表 Node 22.20.0、Bash 3.2、Windows 或 macOS 已通过；官方 CLI 的 Python 等运行前提与 Node 调度、平台模块依赖分别记录。

## 独立工程与流水线兼容（增量设计，待实施）

本版本在 Foundry 准备可迁移工程并做隔离演练，迁后在独立公开仓库首次正式发布。GitHub Actions 作为计划执行平台，workflow 放实际仓库根；当前仓库只有迭代 Issue workflow，不能据此宣称技能 CI 已存在。两种明确工程布局是 Foundry 的 `packages/skills` 与独立项目根，内部 CI 驱动显式传入包根，不改变安装脚本的 cwd 及唯一 Node 入口。

独立项目必须自行声明 ESLint、TypeScript、Vite、YAML、Node 类型及实际所需预设依赖版本；不得依赖未交付的 @foundry/preset-config 或未解析 catalog。当前 Foundry 源码继续走共享 exports，用户直接迁移源码后由新仓库维护必要配置和依赖，不生成工程导出或配置投影；严格 TS、实际 ESLint 规则和依赖解析均须独立核对。临时依赖快照随工程证据保存，不改变源仓库 lockfile 跟踪策略，不把根 devDependencies 或 node_modules 直接打包给使用者。

| 测试职责                                                        | 迁移安排                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 包脚本、构建、清单、选择/冲突、平台安装与候选测试               | 改为包根相对定位或自有合成目标夹具，进入独立工程；真实工具/网络/平台缺项仍明确失败或未验    |
| Foundry dev 初始化、link-skills、原生模板覆盖与作者仓库治理回归 | 保留为 Foundry 消费者检查，不复制真实 .specify/画像到新项目，不把移出独立集合算原检查已通过 |
| 原历史固定工具/旧技能实验                                       | 保留原证据及重现条件，不能冒认为最新来源或本轮 Increment/准备 hook 消费通过                 |
| 真实 Actions token、artifact、并发与固定公开来源                | 迁移后另验，当前只能以本地临时 Git/受控来源验证协议和故障，不等价于托管平台实测             |

检查/发布 action 与 Node/pnpm/Python/构建工具版本在实施时按官方版本核验并保存，action 绑定明确提交；两个干净构建使用相同依赖快照。平台 `ubuntu-latest`/其他 hosted runner 标签本身不构成工具版本或最低运行时证据，仍逐项报告实际版本。完整发布候选必须覆盖原声明支持范围，不能只因 CI 上有 Linux 成功就降低三平台和 Agent 矩阵。

发布使用同仓库临时 token，不设计跨仓库 PAT 或独立发布服务；基础授权由默认分支手动触发、维护者权限、配置目标及候选身份共同限定。环境额外审批是否启用由迁后公开仓库可用能力决定，不作为当前 Foundry 验证前置。完整运行规则及当前不可用的新入口见 [pipeline 契约](pipeline.md) 和 [验证指南](../quickstart.md)。
