# Agent 安装期在线来源

最新状态：用户后续要求移除包根 packages/skills/distribution，目录和 agents.json 已删除；来源直接由 read-agents.mjs 提供。以下保留在线改造过程及各轮真实结果。

2026-11-09，用户先要求“改为在安装过程中在线获取吧”，随后明确“不要固定版本来源吧”。本轮替代此前 T011 静态快照与 T013 固定工具建议，不改变自有技能发布包的版本或不可变来源要求。

## 当前实现

每次安装或官方预检从官方 npm 的 skills latest 元数据解析实际版本，再读取同一发布包并核验 integrity。包内 agents.json 只声明来源，不保存版本、提交、摘要或 Agent 数组。实际版本用于本次官方命令建议及报告 upstream，后续调用重新解析，不回退旧表。

平台模块调用只读 read-agents.mjs 查询数据；该文件不负责选择、安装、Git 保护或挂载。当前实际发布包没有公开 Agent 查询 API，因此复用同包的 Agent 声明、XDG 实现和路径函数；不运行 CLI 主入口、检测器或安装函数，布局不兼容时明确拒绝。tar 只通过标准输入输出读取文件，元数据与包只在内存中，不创建 npm 缓存或下载暂存。最终绝对路径与链接检查只针对本次所选 Agent/scope。

Release.tools.skills 改为 latest，Eve 格式改名 eve-frontmatter-v1，区别于运行时 CLI 发布版本。旧静态数据仅在测试夹具保存，原构建期静态解析器删除；不把消费机器的目录写进发布物。

## 已发生的验证

- 实际在线调用读取器退出0，本次解析版本1.7.6，取得79条规则并核验官方包sha512；该版本和数量只是本轮观察，没有写死进实现。
- 当前实际1.7.6包的读取器单位测试3/3；Bash选择、静态错误、Eve及代表路径首轮4/4。
- Linux PowerShell7.4.6代表范围4/4：四粒度、断网目标零写入、identity/Eve及代表全局路径。没有据此声明Windows或PowerShell全矩阵通过。
- 独立review_online_agents实际复现无关CLAUDE_CONFIG_DIR相对值误阻断Codex；新增反例先失败，再将绝对校验限定到最终目标，其他数据只校验类型。未重复派审查。

完整US1、最终构建/入口回归及包检查仍在收尾，最终结果在本记录续记，不预记通过。此前首轮US1为69pass/3fail（包括父测试），原因是旧工具漂移反例仍把latest当非法值以及/tmp父Git干扰；对应37项范围复验已全过。首轮消费者还发现其他Spec新增coding技能使旧三项名单过时，已按实际来源枚举；Node测试预加载保留原有NODE_OPTIONS后取消3项复验通过。最近消费者25项为24pass/1fail，失败为jq下载HTTP504，目标尚未写入；不把它当安装成功。

包Python首次24项有3fail：Pair两个既有旧宪章锚点，以及旧构建断言只允许三个根目录。后者已按当前默认正式清单/投影产物更新，Pair源文件与宪章不属于本轮改动，不越界修复。后续重跑结果另记。

临时日志位于/tmp/foundry-online-agents-*.log；未发布、未提交、未对真实用户目录安装或挂载。T012完整同版workflow来源及T013原前置仍未满足，checkbox保持原状态。

## 最终结果

- `FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-online-agents-official/package pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test:distribution -- --story US1`：72 tests、72pass、0fail、0skip，使用实际官方1.7.6包字节作为受控HTTP响应，完整校准项目/全局路径、选择、投影和失败保护；产品没有测试来源开关。
- `FOUNDRY_JQ=/tmp/foundry-online-agents-jq FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-online-agents-official/package node --test --test-isolation=none packages/skills/tests/distribution/content-export.mjs packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/distribution/test-entry.mjs`：25/25。jq SHA256为既有官方020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d，准备到/tmp以避开下载HTTP504；实际安装器仍核验摘要。
- `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1 FOUNDRY_PREFLIGHT_PWSH=/tmp/foundry-t013-pwsh/pwsh FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-online-agents-official/package node --test --test-isolation=none --test-name-pattern='四种粒度|在线规则获取失败|代表agent|identity和Eve' packages/skills/tests/distribution/official-preflight.test.mjs`：4/4，不代表Windows或PS全矩阵。
- `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`、`run check-types`、`run build`：最终均退出0。构建仅复制数据读取器及平台脚本，没有执行网络查询。
- 在空的/tmp/foundry-online-agents-consumer用最终dist/script/index.mjs实际联网执行--check --official、--source-dir指向本次dist、--version 0.1.0、--agent codex、--all：退出0，实际版本1.7.6、installation=not-run、精确选择当前coding/frontend四技能；目标目录仍0条目。原始实际结果见/tmp/foundry-online-agents-live-check.json。新business-node-delivery由并行Spec移入coding，本轮只按实际来源发现，未编辑其正文。
- `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`：最终24项、2fail。均为Pair既有旧宪章锚点，分别test_delivered_modes_link_project_governance/task-pair和test_mode_sources_link_project_governance/task-pair；没有修改源SKILL或宪章来求绿。旧三目录断言已按当前实际六个产物根入口更新并通过。

无关环境覆盖反例已红转绿，最终US1也包含该断言。只做一次独立审查，没有用重复审查替代测试。测试隔离保留既有NODE_OPTIONS，Git发现限制在自有沙箱；仅定向停止过本次取消测试留下的两个Bash进程，未干扰其他任务。源码与文档差异检查通过；其他平台、未来上游布局、完整workflow来源、真正发布和原生挂载不计本轮通过。

## 移除独立声明目录

用户后续明确“我们不要这个文件行不行 packages/skills/distribution”。按该请求删除包根目录及 agents.json，清理构建复制、Release.adapters、Bash/PowerShell预检和所有生产/测试夹具的声明文件依赖。运行来源统一由现有read-agents.mjs提供，没有建立替代声明文件。历史完成任务中旧落点保留事实，未完成构建任务不再重建该文件。

先修改既有断言确认目录仍存在的红灯，再删除并复验。最终：契约72/72，内容/构建/入口消费25/25，Linux PowerShell选择与断网保护2/2；目标包lint、check-types、build退出0。测试使用已准备的真实官方1.7.6包和已核验jq，保留实际在线读取逻辑，没有修改读取器的latest策略。

默认构建实际根目录为mcp、skills、script、release.json、projections共五项；源distribution不存在，release.files不声明agents.json，adapters声明实际交付的script/install-skills/read-agents.mjs。包Python24项仍有两项既有Pair锚点失败，未声称全包全绿。命令及过程日志为/tmp/foundry-remove-provider-*.log；未提交、发布或修改暂存区，没有真实用户安装或原生挂载。

## PowerShell 完整只读预检续接

2026-11-09，用户在 T007 完成及回顾后明确“继续”。核查实际来源后，artifact-spec-analysis 仍缺、旧 hooks 注册器仍在，主线 T073/T074 未移交；因此本轮补齐 T013 此前暂停后只有代表样本结果的 PowerShell 通用预检，不推进依赖完整来源的下游，不将 T012/T013 提前勾选。

实际执行命令：

```bash
DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1 \
FOUNDRY_PREFLIGHT_PWSH=/tmp/foundry-t013-pwsh/pwsh \
FOUNDRY_SKILLS_PACKAGE=/tmp/foundry-online-agents-official/package \
node --test --test-isolation=none packages/skills/tests/distribution/official-preflight.test.mjs
```

最终退出 0：**13 tests，12 pass、0 fail、1 skip**，完整耗时约 443 秒。唯一跳过项是 jq 前置检查，因 PowerShell 使用原生 JSON/SHA256 而不适用；其余 12 组均实际完成，不是缺环境跳过。环境沿用 Linux、Node 24.22.2、PowerShell 7.4.6 和已准备的真实官方 skills 1.7.6 包；上游 HTTP 边界使用该包字节作受控响应，实际读取、解包及完整性校验仍由产品执行，不将夹具版本表述为当前在线 latest。

- 四种选择与重复选择、在线获取失败、全部静态选择/来源/版本错误通过，完整消费树比较均保持不变。
- 缺依赖不补装、非法清单/投影拒绝、Eve 原始来源和完整 dist 显式选名、identity/Eve 已满足与内容/额外文件/链接/跟踪冲突通过。
- 历史校准表的 79 项目级、77 支持全局目标和两项不支持全局的拒绝均通过同套实际 PowerShell 预检；此结果只覆盖本次样本及版本，不冻结未来 Agent 集合或替代动态全矩阵。
- 代表环境变量路径、OpenClaw 回退、scope 拒绝以及已删除但仍在 Git 索引中的目标祖先冲突均通过。

普通沙箱首轮在 before hook 遇 `spawnSync git EPERM`，按工具批准以同一命令在沙箱外完整执行；不把环境失败当功能通过。测试从当前源码生成隔离交付副本，项目、HOME 和缓存均由 createSandbox 隔离，PowerShell 运行时准备与产品只读行为分开核验。

本轮没有发现需修改产品脚本的失败，未编辑产品代码，也未重复运行无变更影响的包 lint/check-types/build、Python 或 Bash 已通过范围；此前两项 Pair 锚点失败仍保留，不能据此声称全包全绿。Linux 上 PowerShell 通过不代表 Windows/macOS、最低运行时、完整新 workflow 或发布通过。T012/T013 完整来源条件仍未满足，任务进度保持 11/44；未挂载、发布或写真实用户目录。完整原始输出位于 `/tmp/foundry-t013-powershell-full-resume.log`，可能随临时目录清理。
