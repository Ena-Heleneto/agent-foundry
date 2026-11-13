# T067：Bash 正式注册接入验收

日期：2026-11-12。对应[原 T067](../../tasks.md#t067)、[已认可方案](../../implementation/T067.md)、[注册契约](../../contracts/registration.md)及 T066。用户在方案和新增只读 yq 原因展示后实际回复「同意」。本轮实施 Bash 内部模块并验证隔离消费，没有执行真实工作区或用户全局迁移。

## 正式交付与输入

`register-commands.sh` 现在只复制、声明并官方强制刷新 Increment；`register-hooks.sh` 复用同版 Bash 原子函数，按集合和本次选择退役六旧登记、刷新当前准备/分析/结案 hooks。没有新 Node/Python 运行核心、包根扩展声明、commands 模板、自有 YAML 合并或持久安装状态。T066 的测试内存基线没有进入生产调用。

hooks 使用明确的 `--collection-config`，可重复 `--skill` 选择当前三项的子集，无该选择参数时使用固定三项默认集合；缺未选来源不阻塞。命令模块的 `--skills-dir` 指向 Increment 非发现来源根。所有来源、配置及必要附件核查早于目标首次变更；未知目录、用户附件、正文改写及孤立有效调用按实际路径拒绝，不全目录清理。

当前工具版本固定为 Specify 1.2.6、jq 1.8.1、yq 4.54.3。Specify 仍由 FOUNDRY_SPECIFY_VERSION 或默认值选择，未静默读取 PATH 中其他版本；工具准备允许显式 FOUNDRY_JQ/FOUNDRY_YQ 离线文件，仍校验官方资产摘要。jq SHA-256 为 `020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d`，yq 为 `129534601871538efe0ba4c5e62a34fb1d5f469bcb975c4fddeb467d82974973`，与实际下载、官方 asset digest/checksums 核对一致。工具只复制到本次自有临时目录；只读 YAML 别名及非法输入拒绝已探测，没有下载到目标项目或系统安装目录。

内部调用形状如下，使用者须提供真实、已核验的项目和来源，不将示例占位路径当已执行证据：

```bash
FOUNDRY_YQ=/path/to/yq FOUNDRY_JQ=/path/to/jq \
  bash packages/skills/script/register-hooks/register-hooks.sh \
  --project /path/to/project --skills-dir /path/to/normal/skills \
  --collection-config /path/to/workflow/collection.config.json

FOUNDRY_YQ=/path/to/yq FOUNDRY_JQ=/path/to/jq \
  bash packages/skills/script/register-commands/register-commands.sh \
  --project /path/to/project --skills-dir /path/to/skills-speckit-sources
```

对外入口仍为原 `node script/index.mjs [参数]`，上述是内部模块接口。完整编排及调用方转发由 T070/T097 等原任务承接；旧 README/PowerShell 未在本 Task 提前更新，不能把 Bash 内部通过称为所有入口已可用。

## 实际保护与旧结构兼容

旧来源和 manifest/registry 逐项核对；模式生成正文由同版官方在自有临时项目重现后，与受影响目标完整比较。旧 hooks 的逐技能 speckit-hooks.json 只有与旧 manifest.hooks 语义一致才认领；附件由 SKILL.md 实际引用闭包判定，可处理附件内相对引用，不让文件自引用或不可达环自证归属。旧模式原先没有顶层桥接时保持该实际布局，只核验实际存在且同字节的旧桥接，新输入仍提供必要桥接。

实际覆盖三/四/五旧集合缩减与重复、当前三 hooks/六旧 hooks、明确部分选择、来源/集合/必要附件缺失、非法 YAML、路径链接、额外文件/空目录、正文改写、孤立生成目录、YAML 别名中的孤立有效 hook、错误工具摘要和悬空目标发现根。保护场景直接运行正式 Bash，测试包装器只记录并转发官方命令；临时官方重现调用与真实目标 add/remove 分别留证。

运行中途的官方边界返回 23 后，准确报告已完成阶段、停止未运行项；解除故障后按实际磁盘重试，不重复伪报旧扩展移除。真实 CLI 不存在时保留原退出 127，临时重现失败同样不被改成通用 1。来源合法减少附件后，重复刷新不残留旧桥接/引用，也不因自有暂存空目录误挡；无关技能链接保持。悬空发现根已实测必须先检查路径链，避免官方返回成功但没有生成入口的结果被误报为通过。

## 审查与修复依据

首次独立审查提出三项 Important：真实旧 hooks 布局中的逐技能配置被误拒绝、递归全文 grep 会让用户附件自证归属、旧模式重现无条件补新桥接会拒绝合法旧布局。未将首轮审查称为无问题。

新增四项用例覆盖真实旧 hooks 完整来源、坏旧配置、不可达自引用文件和无桥接旧模式（含传递相对附件），修复后全部通过；坏旧配置修复前即被拒绝，其他红灯分别保留。旧模式首次失败先发生在旧引用检查遗漏相对附件，不伪称桥接缺陷有另一次独立首次错误。原 reviewer 定向只读复审确认三项均可关闭，无新增 Critical/Important/明确 Minor；不代替最后完整回归或后续归档核对。

## 工程检查与交付边界

最终源码完整检查已结束，实际命令和结果如下。原旧 hooks 路径失败已通过当前集合夹具和真实 Bash 消费回归处理，PowerShell 分支保留其未实施的四项事实。

- `node packages/skills/tests/test-register-commands.mjs`：42 项，41 通过、0 失败、1 skip；包含 T066 保留回归和 T067 真实 Bash 场景，skip 是无 pwsh 的原 PowerShell 分支。
- `node packages/skills/tests/test-register-hooks.mjs`：11 项全部通过，0 失败、0 skip；包括 T066 原证据回归、当前 Bash 输入/官方消费和新增旧结构保护。
- `pnpm --filter @foundry/skills run check-types`：退出 0。
- `pnpm --filter @foundry/skills run test`：12 项 Python 测试全部通过，退出 0。
- 三份新增/修改 JS 的针对性 ESLint：退出 0；Markdown 按实际文件即时修复并读回。
- `bash -n packages/skills/script/register-commands/register-commands.sh` 和同目录对应 register-hooks.sh：均退出 0；目标 diff check 通过。
- `pnpm --filter @foundry/skills run lint`：退出 1，仍只有下述两项既有错误。

整包 lint 仍只有 `build/plugins/collections.ts` 第 11 行 entries 未使用的 unused-imports/no-unused-vars 和 sonarjs/no-dead-store 两项原有错误；本 Task 不代修并行分发代码。ESLint 对 `.sh` 没有配置，忽略警告不算 shell lint 通过；Bash 语法由 `bash -n`，行为由实际脚本与官方隔离回归验证。

`pnpm --filter @foundry/skills run build` 及 dist/构建来源消费依用户原指令暂跳过。当前 Bash 仅实现并验证 Linux x86_64；无 pwsh 的 skip 不代表 Windows 通过，macOS/其他平台、真实工作区/用户全局挂载、自然语言宿主行为及进程崩溃恢复都未验。编码引用等不能证明的输入保守停止，未承诺通用 Markdown 渲染或任意附件语法。

[结构化结果](fixtures/t067/results.json)及[原始归档](fixtures/t067/retained.tar.gz)已保存：实际调用、初始/最终项目、可读来源/集合、代码及红绿日志、工具来源/校验和工程检查。归档中 5641 份普通文件摘要逐一匹配，4 个链接仅记录位置/目标、不跟随打包；准确字节数和归档摘要见结果文件。运行结束后的自有临时输入已经清理，不宣称每个短暂文件都留存，实际调用与可读来源可结合脚本快照复核。

主 agent 独立核对 24 份 T067 场景回执、14 类零目标变更、不可达用户文件保护、仅 Increment/六旧退役的各自适用场景，以及无关扩展和历史内容保持；完整归档还含 25 份 T066 回归。未收集真实认证或仓库画像，选定凭据模式零命中不等于完备扫描。本项仅满足原 T067 有限职责，不将其通过视为 T068、T070、T072 或整体阶段批准。
