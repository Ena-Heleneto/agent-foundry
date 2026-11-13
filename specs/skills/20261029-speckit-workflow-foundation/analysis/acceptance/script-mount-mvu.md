# T042/T043 实施及 T048 统一验收证据

**现行入口修正**：已取消全部 Node 转发层，直接运行 .sh/.ps1；下方原有 Node 入口记录保留历史事实，当前验证见文末“直接运行平台脚本”或“取消 Node 转发入口”修正。

**2026-11-04 当前结论**：安装器已按用户要求简化为五指令一次官方 --force 重装，实际工作区仅 modes 扩展的五个入口。foundry-explore/foundry-guide 及 .start 重复入口已由官方 remove 清理。下方 11 月 3 日的两扩展方案与自定义保护检查仅保留历史；本轮结果见文末。Phase 5 正式 checkbox 仍待用户阶段验收，真实协作行为未开始。

**2026-11-03 最新结论**：用户确认全量刷新方案后，已修正实现并成功执行真实工作区完整刷新。当前 19 个自定义技能与源逐文件一致，12 个来源 hooks 全部同步，两个新入口正文一致，旧 modes 保留。下方早期“空 hooks 限制”“未在工作区安装”等描述仅记录当时事实；本轮结果见末尾全量刷新验收。正式 Phase 5 checkbox 仍等待用户统一验收，真实模式行为任务未开始。

日期：2026-11-03。用户明确顺序为 T042→T043→T048 统一验收，覆盖此前 T048 前置安排。T042/T043 工程已执行，T048 尚未整体通过；正式任务状态只在 tasks.md 保存。本记录不是用户验收，也不是当前工作区安装完成。

## 交付及实际接口

移除包根 extension.yml 和 .extensionignore；新增 register-commands 的 Bash/PowerShell 入口、共享 Python 标准库核心、Node 沙箱测试和说明；增加 Python 回归测试。更新包 README、AGENTS 和功能规划，未修改旧模式正文或当前受管配置。

独立模式对应 `speckit.foundry-explore.start`、`speckit.foundry-guide.start`；Codex 入口为 `$speckit-foundry-explore-start`、`$speckit-foundry-guide-start`。旧 modes 入口保留，不声称等价迁移。仅当前两模式和 Codex skills，无新依赖、分发全流程或发布。

实际官方 CLI：`<source-home>/.cache/uv/archive-v0/2NU5vKTWq2VdIfuX/bin/specify --version` 输出 `specify 1.2.5`，退出 0。直接使用已安装可执行文件，没有下载或更新工具。验收沙箱 `/tmp/foundry-official-qrsy7pcd`，复制已知初始化配置及两份技能作为输入；目标工程不含真实用户任务，不以测试材料冒充用户行为。

实际命令（Explore；Guide 将最后 mode 参数换为 guide）：

```bash
bash packages/skills/src/workflow/register-commands/register-commands.sh --project /tmp/foundry-official-qrsy7pcd/project --skills-dir /tmp/foundry-official-qrsy7pcd/installed-skills --mode explore --cli <source-home>/.cache/uv/archive-v0/2NU5vKTWq2VdIfuX/bin/specify
```

## 实际结果

| 检查                                                                             | 实际结果                                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 目标包 lint、check-types、build                                                  | 各退出 0，构建先于 test                                                        |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`      | 退出 0，11 tests 通过，含真实 MCP registry 和 5 项新挂载核心回归               |
| `node packages/skills/src/workflow/register-commands/test-register-commands.mjs` | 退出 0，Bash 1 pass；PowerShell 1 skip                                         |
| `node scripts/dev/actions/link-skills/test-link-skills.mjs`                      | 退出 0，Bash 1 pass；PowerShell 1 skip                                         |
| 首次 Explore 官方安装                                                            | 退出 0；安装副本与源字节一致，实际入口正文一致；临时输入删除后入口仍可读       |
| 单选范围                                                                         | 安装 Explore 后 Guide 入口不存在；再单独安装 Guide 成功                        |
| Guide 官方安装                                                                   | 退出 0；仅允许 extensions.yml 的 installed 列表追加所选名称，已有 Explore 保留 |
| 两模式重复调用                                                                   | 均退出 0；前后整个沙箱文件摘要一致，不再调用 CLI                               |
| 改动来源正文、改动生成入口正文                                                   | 均退出 1；前后目标摘要一致，没有覆盖                                           |
| 生成入口 name 错误                                                               | Python 回归真实构造错误名称，调用前拒绝；未声称是官方生成的错误                |
| 未知文件与 registry 字段                                                         | unknown.txt、既有入口、registry 的 custom 字段均保留                           |
| 自定义/损坏 extensions.yml                                                       | 退出 1，CLI 调用前拒绝，文件字节不变，没有建立扩展目录；不是挂载成功           |
| 模拟 CLI 失败                                                                    | 非零状态、临时输入和错误现场保留；这是模拟失败测试，不是官方 CLI 失败验收      |
| 当前工作区保护                                                                   | 执行前后 158 个 .specify/.agents 文件摘要一致，未在本工作区安装                |
| Markdown 与 diff                                                                 | 修改 Markdown 逐文件 ESLint 自动修复退出 0；git diff --check 退出 0            |

所有 pnpm 命令带 `--config.verifyDepsBeforeRun=false`，只关闭运行前自动依赖检查，不降低实际检查。未运行根 pnpm test、分发测试或部署。

## 审查与修正

按 requesting-code-review 做独立只读审查，发现两个 Important：入口只比较正文未检查 name；配置写后保护无法阻止官方将损坏 YAML 重置。原正文 substring 也被真实反例证明会接受追加指令。均先复现失败，再修复并运行回归。

真实 Guide 首轮安装曾因官方向 extensions.yml 的 installed 列表正常追加名称而被保护检查拦截，退出 1。调查官方源码后，只允许该列表追加本次名称，其余内容仍须一致。重新创建沙箱后 Explore→Guide→重复调用全通过，没有把首次失败改记通过。

配置保护采用保守边界：现阶段只接受缺失 extensions.yml，或官方标准格式、空 hooks 的配置。含注释、自定义 hooks、未知结构或损坏内容时，安装前拒绝。此选择避免不可逆地丢失用户配置，但限制真实已有项目的适用范围；当前工作区含自定义 hooks，未迁移。

## 未执行项、限制与续接

- PowerShell 入口测试：`node packages/skills/src/workflow/register-commands/test-register-commands.mjs` 的 PowerShell 分支 skip，原因是未安装 pwsh；参数转发及运行时兼容仍需对应环境验证。
- 当前工作区挂载/迁移：未执行，因为包含受保护的自定义 hooks；现脚本会拒绝该结构，需后续明确兼容方案，不能用沙箱成功抵扣。
- 实际通过新入口定位真实 Task、缺材料分支，以及真实官方 CLI 失败后的恢复完整流程：未执行；目前只有正文/入口可读核验和模拟失败证据。T048 保持未完成。
- 用户行为仍属于 T044/T045/T046；没有用户反馈或 Guide 两步实践，不编造行为通过。
- 未获得用户统一验收，T042/T043/T048 正式 checkbox 不勾选；不进入后续阶段。
- 按 explainer-doc-sync 收尾核查，本轮没有单独生成或复用知识说明文档，不新建空引用节。

## 官方调用输出摘录

以下保存实际日志，临时沙箱并非永久交付路径。

```text
## custom-config-refusal.log
错误：extensions.yml 含自定义或未知结构；为保护配置，未调用 CLI，需另行确定迁移方案


## explore-repeat.log
已一致，未写入：$speckit-foundry-explore-start


## explore.log

✓ Extension installed successfully!

Foundry explore (v1.0.0)
  所选 task-explore 的临时官方调用输入

Provided commands:
  • speckit-foundry-explore-start - 进入 explore 协作模式

⚠  Configuration may be required
   Check: .specify/extensions/foundry-explore/
挂载并核验完成：$speckit-foundry-explore-start


## guide-repeat.log
已一致，未写入：$speckit-foundry-guide-start


## guide.log

✓ Extension installed successfully!

Foundry guide (v1.0.0)
  所选 task-guide 的临时官方调用输入

Provided commands:
  • speckit-foundry-guide-start - 进入 guide 协作模式

⚠  Configuration may be required
   Check: .specify/extensions/foundry-guide/
挂载并核验完成：$speckit-foundry-guide-start


## output-conflict.log
错误：生成入口缺失或正文不一致；拒绝覆盖


## source-conflict.log
错误：已安装正文与所选技能不同；拒绝覆盖

```

## 2026-11-03 脚本目录与打包交付修订

用户要求脚本放 packages/skills/script，并在构建时复制进 dist 供安装调用。已将 register-commands 四件套和 Python 核心迁到 script/register-commands，新增 Vite scripts 插件，两种构建模式均复制到 dist/script/register-commands。保留历史命令原文，不把上文旧路径当当前执行入口。当前命令为 `bash packages/skills/dist/script/register-commands/register-commands.sh --project <项目> --skills-dir <已安装技能目录> --mode explore`。

实际检查：目标包 lint、check-types、build 均退出 0；包 test 11/11 通过。`node packages/skills/tests/distribution/test-build-config.mjs` 4/4 通过，包含普通及完整模式、复制字节一致、排除测试和缓存、重建移除旧脚本，以及复制到无源码目录后运行真实脚本边界测试。该测试新增时先因 dist/script 不存在失败，再接入复制插件后通过。最初 `node --test` 仅返回通用失败，改用本文件既有直接 node 入口得到明确断言及最终结果，没有把不透明失败记为通过。

`node packages/skills/script/register-commands/test-register-commands.mjs packages/skills/dist/script/register-commands` 退出 0，Bash 通过、PowerShell 缺失 skip。在包目录运行 `npm pack --ignore-scripts --json --pack-destination /tmp --cache /tmp/foundry-pack-cache`，退出 0，生成本地 `/tmp/foundry-skills-0.1.0.tgz`；未发布。实际文件清单包含 dist/script 下双 shell、register_commands.py 和 README，不含测试或缓存。把该 tgz 解包到临时目录后再次运行同一边界测试，Bash 通过，PowerShell skip，验证安装包不依赖 src 或 script 源目录。

包 files 已包含 dist，无须新增发布白名单；无自动 postinstall、无当前工作区挂载，完整分发仍暂缓。此次只变更源码布局与构建交付，前述自定义配置、PowerShell 和 T048 其他验收限制不变。

## 2026-11-03 线上与线下源目录分离

用户明确本轮只命名与迁移目录，不讨论 MCP 内容范围，也不实现流水线。采用 src/mcp（线上内容源）、src/skills（线下技能源），所有原 src 文件迁入 src/skills；保留 coding/frontend/eval/workflow 分类。迁移前后对 23 个文件逐个计算 SHA-256，内容变化为零；src/mcp 仅 .gitkeep，不投放或筛选线上内容。

构建使用单一 defineConfig 对象，一次输出 dist/mcp、dist/skills、dist/script，清理旧产物，不生成 manifest.json、index.js 或 dist/install。删除旧 manifest 和双模式插件；新增 content 插件按目录复制两类内容及完整附件，.gitkeep 不交付。同步 link-skills 两 shell 的默认源为 packages/skills/src/skills，现有受管文件前后摘要保持不变。

实际验证：目标包 lint、check-types、build 均退出 0；包 test 11 项通过。node packages/skills/tests/distribution/test-build-config.mjs 为 3/3 通过，先见旧 manifest 输出导致红灯，改造后通过，覆盖同时输出两个源、清理旧产物、缺目录失败与独立脚本执行。node scripts/dev/actions/link-skills/test-link-skills.mjs 为 Bash pass、PowerShell skip（未安装 pwsh）。文档逐文件 ESLint，最终 git diff --check 通过。首轮 lint 与文档格式化并发，曾读到 README 未格式化状态失败；格式化完成后重跑 lint 退出 0。

未通过项：node scripts/dev/actions/estimate-context/test-estimate-context.mjs 的真实 CLI 场景失败，因为旧 MCP 估算仍读取 dist/manifest.json；前五个纯函数/夹具检查通过。这是已取消旧构建契约的消费者，按用户范围不改 MCP 消费与线上应用，本轮只更新其线下源码回退路径。apps/mcp 也尚未迁移，未执行或声称其通过。此前真实 MCP registry 通过的记录只代表历史，不代表新目录构建后的消费。

## 2026-11-03 全量刷新验收

用户已确认所有技能和 hooks 按来源刷新，并确认 [具体方案](../full-remount-design.md)。本轮复用现有完整入口，没有新建完整分发器。

### 实际改动

- 完整入口在开源技能、自定义技能和 hooks 前置成功后，依次刷新 Explore/Guide。已有 hooks 或 registry 不跳过刷新。
- hooks 双平台入口共用 registry.json 和 Node YAML 语法树处理；更新来源字段，保留 enabled、condition、未知字段和其他配置。yaml 依赖复用 skills 包现有 catalog，构建打包辅助脚本到 dist/script。
- 两模式每次调用官方 CLI，明确归属的已安装扩展通过官方覆盖更新。支持源码变更、入口缺失修复与重复运行；保留旧 modes 和其他扩展。
- 版本选择统一，默认 1.2.6，支持显式选择已验证的 1.2.5；显式 --cli 必须与选择的版本一致。

### 检查与实际结果

| 命令或操作                                                                         | 实际结果                                                                                                                     |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`        | 退出 0；实现中曾发现复杂度和导入顺序问题，修正后通过                                                                         |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types` | 退出 0                                                                                                                       |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`       | 退出 0；YAML 辅助脚本包含运行依赖                                                                                            |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`        | 退出 0，18 tests 通过，其中全量回归 7 项                                                                                     |
| `node scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs`                              | 退出 0，Bash 26 项通过；PowerShell skip                                                                                      |
| `node scripts/dev/atomic/speckit/test-speckit.mjs`                                 | 退出 0，Bash 7 项通过；PowerShell skip                                                                                       |
| `node scripts/dev/actions/link-skills/test-link-skills.mjs`                        | 退出 0，Bash pass；PowerShell skip                                                                                           |
| `node scripts/dev/actions/register-hooks/test-register-hooks.mjs`                  | 沙箱 Node 子进程被 EPERM 拦截；获准沙箱外执行后退出 0，Bash 35 项通过；PowerShell skip                                       |
| `node packages/skills/tests/distribution/test-build-config.mjs`                    | 加入对子进程 error 的显式断言后，沙箱内准确报告 EPERM；获准沙箱外执行后 6/6 通过，包括脱离源码和 node_modules 的实际脚本执行 |
| 官方 CLI 1.2.6 隔离项目                                                            | 两模式首次、重复、源码更新、入口删除后修复，共 8 次退出 0；修复审查边界后再次刷新两模式通过                                  |
| 官方 CLI 1.2.5 兼容复验                                                            | 两模式刷新各退出 0，使用同版目标元数据和显式 CLI                                                                             |
| `pnpm --config.verifyDepsBeforeRun=false run nuxt:prepare`                         | 首次受沙箱只读缓存和 .agents 限制失败；获准沙箱外重跑后退出 0，完整入口报告全部成功                                          |
| 实际工作区只读核验                                                                 | 19 个自定义技能及附件逐文件 hash 与源一致；12 个 hooks 的来源字段一致且无重复；两个新入口与源正文一致，旧 modes 仍登记       |

上述 pnpm 参数只关闭运行前自动依赖检查，不降低 lint、类型检查或测试。没有运行根 pnpm test，没有发布、部署、提交或推送。

真实全量日志为 `/tmp/foundry-full-refresh.log`。上游 Spec Kit、Nuxt UI、UI UX Pro Max 全部安装成功；自定义技能新增 6、更新 7、已一致 6、冲突 0；hooks 为 unchanged，表示全部核对后已是最新；两模式新入口安装并校验成功。官方生成的 extensions.yml 仅新增两个 installed 项，原 hooks 与 settings 字节保留；registry 新增两个扩展，旧 modes 记录保留。Codex manifest 安装时间由官方刷新更新。

官方隔离日志位于 `/tmp/foundry-full-official-9x318o6c`，含 first/repeat/update/repair 与 compat-1.2.5 的各模式日志。临时目录可能被清理，本节命令、输入场景与结果作为持久记录。

### 审查与修复

按 requesting-code-review 派独立审查者只读核对，发现两项 Important：官方覆盖会删除所选扩展名下来源未声明的用户 hooks；会删除扩展根未知附件。先添加三项失败回归（用户 hook、未知文件、YAML schema 歧义），看到红灯后修复，7 项全量回归及 18 项包测试转绿。

修复在调用 CLI 前检查整个受管范围，包括登记命令集合、安装声明和来源文件清单。普通项目已有 hooks 正常刷新；与所选扩展身份冲突的用户 hook、额外入口或未知附件会在覆盖前报告并保留。新增来源清单随临时官方输入交付，用于区分后续源删除和用户额外文件，不作为任务状态系统。

另对照 YAML 1.1/1.2 语义，未加引号的 on 等含义不一致值在调用前拒绝，提示修正，避免官方重写后才发现语义变化。审查者用官方 1.2.6 验证禁用扩展刷新仍保持 enabled=false。

### 决定与验证边界

- hooks 继续承担既有按来源更新配置的职责；原生 registry 和模式入口只经官方 CLI 更新。未知字段和用户控制由语法树保留。
- 同内容仍走完整检查与模式刷新；hooks/技能内容一致时可避免不必要的写盘。“已是最新”不代表按文件存在跳过整项流程。
- PowerShell 实现已同步但本机没有 pwsh，相关分支未执行；双平台一致性仍需有运行时的环境验证。
- 两模式当前没有附件；复制入口已携带源目录，link-skills 和构建测试覆盖附件复制，但模式 CLI 附件完整性尚无独立专项验收，作为审查次要限制记录。
- Explore 用户反馈、Guide 两步用户实践、真实任务定位与跨模式集成不由本轮安装测试代替；T044/T045/T038/T046 尚未实施。
- T042/T043/T048 已具备本轮实现和工程证据；按阶段约定仍待用户统一验收，不自动勾选或进入下一阶段。

## 2026-11-04 五指令统一重装验收

用户明确总共五项指令，全部使用 Spec Kit 官方挂载，每次安装全部重装，不做其他安装状态逻辑。本轮仅修正 T042/T043/T048，未执行 T044/T045 真实协作行为。工作区原有 `.vscode/extensions.json` 用户改动保留。

### 实现与接口

Python 安装核心从 218 行收敛到 65 行：解析项目/技能目录及可选 CLI，复制 task-tutor、task-pair、task-review、task-explore、task-guide 及附件，生成临时 modes 声明，执行一次 `extension add --dev <临时目录> --force`，清理临时输入，传播官方失败。移除 --mode、自定义登记读取、版本探测、指纹、所有权清单、配置比对、禁用恢复及同内容跳过逻辑。Node YAML 辅助脚本仍供既有 hooks 更新使用，五指令安装不再依赖它。

Codex 入口统一为 `$speckit-modes-tutor`、`$speckit-modes-pair`、`$speckit-modes-review`、`$speckit-modes-explore`、`$speckit-modes-guide`。完整入口的双 shell 均在原前置成功后调用安装器一次；没有迁移逻辑或单模式分支。

### 红灯与回归

先更新实际 shell 驱动的输入测试：完整五项、重复重装及错误传播三项因旧脚本仍强制要求 --mode 而失败；完整入口测试观测到两次模式调用而非一次，失败。简化实现后转绿。测试 CLI 初版记录换行的转义错误曾造成 SyntaxError，修复测试夹具后通过，没有将该环境内夹具错误当作产品红灯或成功。另有一处 JS 空行 lint 失败，ESLint 修正后包 lint 通过。

| 命令或操作                                                                         | 实际结果                                                                                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`        | 退出 0                                                                                                                                |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types` | 退出 0                                                                                                                                |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`       | 退出 0，Vite 8.3.5                                                                                                                    |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`        | 退出 0，13 项通过；取消的自定义保护逻辑对应测试已移除，hooks 回归保留                                                                 |
| `node packages/skills/script/register-commands/test-register-commands.mjs`         | Bash 通过，PowerShell 缺 pwsh 跳过                                                                                                    |
| `node scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs`                              | 退出 0，Bash 26 项通过，PowerShell 跳过                                                                                               |
| `node packages/skills/tests/distribution/test-build-config.mjs`                    | 沙箱内 5 通过、1 因 Node 子进程 EPERM 失败；获准沙箱外重跑 6/6 通过，包含脱离源码和 node_modules 的实际脚本执行                       |
| 官方 CLI 1.2.6 隔离验证                                                            | 旧五指令重装、同内容重跑、来源更新、入口修复、附件复制、清理重复扩展与首次安装均通过；每次安装均有五个正文与登记，hooks/settings 一致 |
| 当前工作区官方重装                                                                 | 退出 0，统一五项安装成功；写 .agents 需沙箱外授权，获准后执行                                                                         |
| 当前工作区官方 remove 两个重复扩展                                                 | 各退出 0，官方保留备份；registry 仅 modes，两个 speckit-foundry-*-start 入口消失                                                      |
| 当前工作区只读核对                                                                 | 五份正文及完整附件与源码一致，hooks/settings 不变，原生 Implement 与用户 VS Code 文件摘要不变                                         |

所有 pnpm 参数只关闭运行前自动依赖检查，不降低实际检查。真实全量 nuxt:prepare 未重跑，本轮实际调用的是它使用的五指令安装器；完整编排通过双平台入口源码和 Bash 沙箱验证。没有运行根 pnpm test、发布、部署、提交或推送。

### 官方命令与证据

CLI 为 `<source-home>/.cache/uv/archive-v0/SqGODpu5AOSLHtlR/bin/specify`，`--version` 输出 specify 1.2.6。隔离项目为 `/tmp/foundry-five-official-44outvmd/project`，同目录日志含 existing-five-reinstall、identical-repeat、source-update、missing-entry-repair、remove-foundry-explore、remove-foundry-guide、remove-modes-for-first-install、fresh-five-install。临时目录可能被清理，本节保留命令、输入及实际结果。

当前工作区实际命令：

```bash
bash packages/skills/script/register-commands/register-commands.sh --project <source-workspace> --skills-dir <source-workspace>/.agents/skills --cli <source-home>/.cache/uv/archive-v0/SqGODpu5AOSLHtlR/bin/specify
<source-home>/.cache/uv/archive-v0/SqGODpu5AOSLHtlR/bin/specify extension remove foundry-explore --force
<source-home>/.cache/uv/archive-v0/SqGODpu5AOSLHtlR/bin/specify extension remove foundry-guide --force
```

这两次 remove 仅用于收敛此前错误的重复安装，不写进日常脚本。官方生成的登记和入口没有手工编辑。

### 审查与限制

按 requesting-code-review 进行独立只读审查，无 Critical/Important；新增 JS 循环变量缺多行注释的小项已补齐。审查者独立复跑安装器 4 项、全量刷新 2 项 Python 检查及 Bash 边界测试通过。

- PowerShell 两入口测试因没有 pwsh 跳过，尚有该运行时兼容性未实测的限制。
- 本轮真实官方验证使用 1.2.6；1.2.5 的先前记录属于旧实现，本轮未复验，不声明新路径兼容已通过。
- 官方 force 负责 modes 的覆盖与状态，原先自定义的未知附件/用户 hook/禁用恢复等保护不再由安装器承诺，这是用户本轮明确简化的范围。
- T042/T043/T048 工程修正及实际安装已完成，Phase 5 正式勾选仍待阶段验收；T044/T045/T038/T046/T047 未因本轮工程结果自动完成。

## 2026-11-04 用户入口确认与剩余验收位置

用户明确“最终入口只有五个已确认”。记录为五指令数量及重复入口清理的用户确认，不扩大为全部阶段、全部平台或真实模式行为已验收。

用户同时指出不能在本仓库完成其余需求验收：外部使用者获取、安装、挂载的交付能力由 [001-skills-distribution](../../../001-skills-distribution/spec.md) 承接，在独立消费项目实际验证；Explore/Guide 的实际协作效果仍由本功能 T044/T045 记录，引用同一外部使用过程的相关证据。现有本地及隔离沙箱检查仅证明工程行为，不冒充外部完整交付。

下一步先对齐分发需求与最新五指令重装约定，再推进外部交付所需能力；不要求先在 Foundry 本仓库完成模式行为验收，也不把全部分发任务结案设为模式行为的前置。

2026-11-04 分发文档对齐已完成：官方 skills 选择安装保持不变，部分模式不自动补装；命令阶段须显式选择并核验五份来源，齐备后复用现有脚本每次官方重装。下一项为分发 T003；本次仅文档同步，未新增工程或外部行为验收结果，各任务 checkbox 保持。

## 2026-11-04 删除自有 Python 实现，改由平台脚本执行

用户明确 Node 判断环境后执行对应脚本，并要求删除 Python 运行脚本。已删除 script/register-commands/register_commands.py；新增 register-commands.mjs 负责平台和版本环境选择，Bash/PowerShell 直接实现参数检查、五份技能及附件复制、临时 JSON 声明、一次官方 add --dev --force 与清理。构建仍只复制文件。此前提前加入且没有安装流程消费的 script/package.json 同时撤掉。测试留在 tests，不删除 Python 测试；官方 Specify 自身运行环境仍由其 CLI/uvx 提供。既有 hooks YAML 实现不在本轮改写范围。

统一 Node 入口保留环境变量、项目 init-options、默认 1.2.6 的版本顺序；直接执行 sh/ps1 使用环境变量或默认值。Node 不承担文件安装或声明生成，平台脚本不调用自有 Python/Node 业务核心。

### 失败复现与修正

- 测试在 PATH 前放入返回99的 python/python3 替身，外部 CLI 替身使用 Node。旧 Bash 入口在 --help 阶段返回99，新 Node 入口尚不存在；实现迁移后 Bash 与 Node 均通过五项、缺项、错误传播和清理验证。
- 独立只读审查发现重复 --project 参数导致 Node 取首项、平台脚本取末项。新增用例先实际得到 ==1.2.9 而期望 ==1.2.5；修正为 Node 同样取最后项，最终回归通过。
- Windows 测试替身改用 PowerShell 脚本，Python 阻断器改用 .cmd；当前无 pwsh，只有静态检查，不记 Windows 通过。

### 最终工程验证

| 命令或操作                                                                                                                                                                                            | 实际结果                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`                                                                                                                           | 通过                                                   |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types`                                                                                                                    | 通过                                                   |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build`                                                                                                                          | 通过；交付 Node、sh、ps1 与 README，无自有 Python 核心 |
| `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test`                                                                                                                           | 13 tests 通过                                          |
| `node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/test-register-commands.mjs scripts/dev/actions/link-skills/test-link-skills.mjs`    | 12 项中10通过、2 PowerShell skip                       |
| `/tmp/foundry-t003-node22/node_modules/node/bin/node packages/skills/tests/test-register-commands.mjs`                                                                                                | Node 22.20.0 下2通过、1 PowerShell skip                |
| `bash -n packages/skills/script/register-commands/register-commands.sh`                                                                                                                               | 通过                                                   |
| `uv run --cache-dir /tmp/skills-distribution-uv-cache --offline --isolated --no-project --with pytest python -m pytest -o pythonpath=<source-workspace>/apps/mcp/src apps/mcp/tests/test_registry.py` | 7 passed                                               |

### 官方 CLI 独立项目验证

使用已缓存的 `<source-home>/.cache/uv/archive-v0/SqGODpu5AOSLHtlR/bin/specify`，--version 为 specify 1.2.6；没有下载或修改工具。临时项目与用户目录位于 /tmp/foundry-native-shell-*，五份技能源从 src/skills/workflow 复制。通过 `node packages/skills/dist/script/register-commands/register-commands.mjs --project <临时项目> --skills-dir <临时技能源> --cli <上述官方可执行文件>` 连续执行两次，分别验证首次安装与重复重装，均退出0。每次实际生成的入口集合严格等于 speckit-modes-tutor、pair、review、explore、guide 五项。日志保存在 /tmp/foundry-native-shell-official.json，临时项目已清理，本节保留实际结果。未在当前仓库重新安装扩展。

当前限制：PowerShell 命令 `pwsh -NoProfile -File packages/skills/script/register-commands/register-commands.ps1 ...` 因缺运行时未执行，Windows 平台行为尚未实证；macOS 也未实测。本轮不抵扣模式行为验收、其他集成矩阵或 curl 自动入口验证，相关 checkbox 不变。

## 2026-11-04 hooks 原生平台与官方重装

本节替代历史保留式 YAML 更新约定，不把此前保留 enabled/condition/未知字段的测试作为当前验收。用户要求受管内容每次按来源重装，并同步 spec 与实现。

- 删除 yaml-config.mjs 与开发动作 registry.json，七份 hooks 定义迁至 script/register-hooks/definitions。原有 prompt、事件与 optional 保持，显式设置 mvu-gate 优先级 10、产物与同步 hooks 优先级 20。
- Node 共用 run-platform.mjs 只选择平台和版本；Bash/PowerShell 实际复制、生成临时 hooks-only 输入并逐项官方 --force。开发动作直接委托同平台脚本，构建只复制 script。测试仅在 tests 中使用 YAML 库。
- 实施前先验证 Specify 1.2.6 的 hooks-only 扩展：旧手写同 ID 条目无需自定义迁移即可覆盖，受管 disabled/condition/未知字段被替换，撤下事件清除，无关 hook、顶层值与 settings 保持，无额外命令入口。该最小验证通过后才替换生产实现。
- 实际七项安装连续执行两次，共 12 条 hook，无重复；受管字段恢复来源值，门禁优先级 10、产物/同步 20。接续 modes 安装后恰好五个 speckit-modes-* 入口。所有目标都是独立临时项目，没有改动本工作区真实 .specify 或 .agents。
- 模拟 CLI 边界覆盖 Bash 与 Node 入口、完整附件、源更新、每次七项强制调用、最后一份技能缺失时零安装、第二项失败后停止、原退出码及临时目录清理。构建副本脱离 monorepo/node_modules 后也执行相同检查与官方验证。
- 只读代码审查无阻断问题；发现的优先级契约差异已补齐来源及真实官方断言，并复测通过。

| 命令                                                                                                                                                                                                                                                                                          | 结果                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint                                                                                                                                                                                                                     | 退出 0                                                                                |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run check-types                                                                                                                                                                                                              | 退出 0                                                                                |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run build                                                                                                                                                                                                                    | 退出 0，三个 dist 子目录，脚本原样复制                                                |
| pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run test                                                                                                                                                                                                                     | 13 项通过                                                                             |
| FOUNDRY_SPECIFY_CLI=<本机已安装 Specify 1.2.6> node --test --test-isolation=none packages/skills/tests/distribution/test-build-config.mjs packages/skills/tests/test-register-commands.mjs packages/skills/tests/test-register-hooks.mjs scripts/dev/actions/link-skills/test-link-skills.mjs | 13 pass、2 PowerShell skip；含脱离仓库交付副本验证                                    |
| FOUNDRY_SPECIFY_CLI=<本机已安装 Specify 1.2.6> node --test --test-isolation=none packages/skills/tests/test-register-hooks.mjs                                                                                                                                                                | 优先级修正后 3 pass，无跳过                                                           |
| /tmp/foundry-t003-node22/node_modules/node/bin/node packages/skills/tests/test-register-hooks.mjs                                                                                                                                                                                             | Node 22.20.0 平台边界 1 pass；未设置官方 CLI 的 2 项明确 skip，官方验证由上行单独完成 |
| node scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs                                                                                                                                                                                                                                           | 26 项 Bash 检查通过，PowerShell 1 组 skip                                             |
| uv run --cache-dir /tmp/skills-distribution-uv-cache --offline --isolated --no-project --with pytest python -m pytest -o pythonpath=<source-workspace>/apps/mcp/src apps/mcp/tests/test_registry.py                                                                                           | 7 pass                                                                                |

限制：环境只有 Linux，PowerShell/macOS 未实测；官方测试使用已有 CLI，没有验证 uvx 首次联网下载。官方 YAML 可能重排格式或丢弃注释，不作保留承诺。hooks 全量七项安装已完成；按 skills 选择的公共分发编排与 curl 自动化仍待后续任务，不将本轮记作 T006 或模式真实用户行为验收。

## 2026-11-04 配置随技能交付修正

用户进一步指定在对应 skill 目录维护配置，安装时直接组装临时 extension.yml。七份配置现位于 packages/skills/src/skills/workflow/<技能>/speckit-hooks.json，与 SKILL.md 同目录；script/register-hooks/definitions 已移除。数据内容与既有事件、提示、优先级均不变。

Bash/PowerShell 从 --skills-dir/<技能>/speckit-hooks.json 读取；构建原样复制技能配置与脚本，不聚合中间 definitions。全部七份技能正文和配置齐备才开始官方安装。旧技能副本缺配置时先更新来源再重跑，不回退到旧集中配置。

验证结果：

- pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint、check-types、build 均退出 0；同包 run test 的 13 项通过。
- FOUNDRY_SPECIFY_CLI=<本机 Specify 1.2.6> node --test --test-isolation=none packages/skills/tests/test-register-hooks.mjs packages/skills/tests/distribution/test-build-config.mjs：10 项通过，无跳过。首次沙箱运行因子进程 EPERM 失败，获得执行权限后重跑通过。
- 新断言验证修改已安装 skill 配置会改变官方输入、最后一份配置缺失时零安装、配置逐字节随 dist/skills 交付、dist/script 不含 definitions。脱离源码的交付副本直接使用其 dist/skills 配置完成相同边界及官方安装验证。
- node --test --test-isolation=none scripts/dev/actions/link-skills/test-link-skills.mjs：Bash 1 项通过，PowerShell 1 项因无运行时跳过。
- bash -n packages/skills/script/register-hooks/register-hooks.sh 与 git diff --check 通过。

仅验证 Linux；Windows/macOS 仍未实测。本次没有刷新当前仓库 .agents 或 .specify 安装副本，不改变正式行为验收状态。

## 2026-11-04 修正：取消 Node 转发入口

用户要求直接使用环境对应的脚本，已删除命令、hooks、技能安装的三个 .mjs 转发入口及共用 run-platform.mjs。当前直接运行 register-commands.sh/.ps1、register-hooks.sh/.ps1；初始化既有调用已是平台脚本，无需增加分发层。CLI 版本使用 FOUNDRY_SPECIFY_VERSION 或默认 1.2.6。上方 Node 入口相关记录保留当时事实，不代表当前交付。

包 lint/check-types/build/test 全部退出 0，13 项包测试通过；构建与挂载、link-skills 回归 10 pass、4 skip、0 fail，缺 pwsh 的两项和未配置官方 CLI 的两项仍未验证。构建交付只含平台脚本和 README；安装器的仓库外构建副本由正式 MVU-B 调度运行，52 项通过，详见 [分发 MVU-B 最新修正](../../../001-skills-distribution/analysis/acceptance/mvu-b.md)。没有重新安装当前工作区扩展或进行模式行为验收，本次不自动勾选 T042/T043/T048。

> 迁仓派生说明：本副本已替换原机器路径或移除私有记录链接；命令、摘要和验收事实保留其原发生语境，原件保存在来源仓库。
