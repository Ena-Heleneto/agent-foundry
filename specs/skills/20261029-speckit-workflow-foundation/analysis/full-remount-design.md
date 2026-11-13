# 全量重新挂载设计

**历史方案说明**：本文记录 11 月 3 日方案。模式挂载部分已由 11 月 4 日用户明确的五指令统一重装决定替代，当前实现依据为 [tasks.md 的 T042/T043/T048](../tasks.md)；hooks 与来源技能刷新约定仍有效。

日期：2026-11-03。状态：用户已确认方案；实现、工程检查和真实全量刷新已完成，阶段验收待用户确认。

## 用户已确认的行为

每次执行完整挂载流程，所有技能和 hooks 都按当前来源刷新。目标项目有无 hooks、是否已有安装记录，都不能成为跳过整项注册或拒绝运行的理由。

“全量”指现有安装来源及其管理的技能、入口和 hooks 全部参与刷新；来源之外的用户技能和配置继续保留。同内容可以避免重复写盘，但必须执行检查与刷新流程。已有来源内容变化时应更新，不能仍按首次安装的冲突处理。

## 代码调查

- `scripts/dev/nuxt-prepare/nuxt-prepare.sh` 与 `.ps1` 已编排开源技能安装、自定义技能复制、hooks 注册，但未接入 `packages/skills/script/register-commands/`。
- `scripts/dev/actions/link-skills/` 已遍历全部自定义技能，更新变化内容，保留其他来源技能。
- `scripts/dev/actions/register-hooks/` 的两个平台入口检测到 `.specify/extensions/.registry` 就退出，因此真实项目可能不再收到 hooks 源码更新。
- `packages/skills/script/register-commands/register_commands.py` 只接受固定格式的空 hooks 配置；同内容直接返回，不同内容拒绝，缺少重新挂载更新路径。
- 项目安装元数据记录 Spec Kit 1.2.6，模式挂载脚本固定检查 CLI 1.2.5，完整入口使用未锁版的官方 CLI，版本来源不一致。

## 方案选择

建议修正并接通现有完整入口，复用现有复制脚本和官方 CLI。这样现有初始化命令就能刷新全部受管内容，也不会产生第二套需要维护的入口。

仅放宽单模式脚本的 hooks 检查，无法解决完整入口没有调用它、旧 hooks 注册器提前退出的问题。新建另一套全量安装器会与已有入口重复，当前没有必要。用户已确认采用修正现有完整入口的方案。

## 具体行为与落点

1. 保留现有应用 prepare 阶段。技能阶段按顺序执行：开源技能刷新、自定义技能刷新、项目 hooks 刷新、Explore/Guide 入口刷新。修改 `scripts/dev/nuxt-prepare/` 的双平台编排及相应测试、说明。
2. 复用 `scripts/dev/actions/link-skills/` 的全量扫描和来源覆盖行为。所有自定义技能均参与，包括两个新模式；不全局删除来源之外的目录。
3. 修改 `scripts/dev/actions/register-hooks/`：存在 registry 时也执行 hooks 更新，支持当前官方配置格式，保留 installed、settings、无关 hooks 和用户控制字段。受管登记和入口继续由官方 CLI 生成；不直接修改 registry。官方临时输入方案及当前配置兼容须先在隔离目录验证，再接入真实入口。
4. 修改 `packages/skills/script/register-commands/`：由完整入口依次刷新 Explore 和 Guide；已有受管安装可按最新源更新，新安装与重复运行均执行完整核验。有 hooks 的正常配置必须支持。需要官方覆盖参数时仅针对本脚本明确管理的扩展，不清理其他扩展和旧 modes。
5. 统一完整入口与模式脚本的 CLI 选择和兼容检查，先验证项目所用版本。保留版本未知时的明确错误，取消各阶段互相矛盾的固定版本要求。
6. 保留逐阶段错误报告。hooks 或技能前置失败时，不以旧入口存在宣告模式刷新成功；最终报告本轮成功、失败和未执行项。

完整分发、发布与旧模式退役不在本次变更中。当前 spec、plan、contracts 和 T042/T043/T048 中的单模式首次安装限制，应在方案确定后同步修订；历史执行证据保留，不追溯改成全量刷新已通过。

## 验收

使用隔离项目分别覆盖首次安装、已有 hooks 和 registry、源码变化、受管入口缺失、连续两次执行。每次均检查完整阶段被调用，所有受管技能及 hooks 与来源一致，无重复注册，其他来源内容保留。

另验证 hooks 阶段失败时的退出码和后续状态、CLI 版本一致性，以及 Bash/PowerShell 两平台。缺少平台运行时必须记录未验证，不以另一平台结果替代。

运行受影响脚本测试及 skills 包 lint、check-types、build、test；构建后核对交付脚本可独立执行。实际工作区刷新在隔离验证通过后进行，记录命令与结果。

## 本次调查证据

- `node scripts/dev/nuxt-prepare/test-nuxt-prepare.mjs`：25 项检查通过，PowerShell 运行时缺失，跳过 1 组；只证明原编排契约，不证明全量修订已实现。
- `node scripts/dev/actions/register-hooks/test-register-hooks.mjs`：启动失败，根目录解析不到 yaml 包，尚未运行断言。yaml 已在 skills 包声明和安装；实施时需修正测试的依赖归属，不能用临时安装掩盖该问题。
- 前轮临时副本实验：只跳过空 hooks 限制，官方 CLI 1.2.5 可安装两模式，原有 hooks 字节保留；该实验不证明重新安装更新或 CLI 1.2.6 已通过。

## 实施落点与决定

- 继续当前功能分支；已有文档改动是本次设计，不另建工作树或自动提交。实施记录沿用 tasks.md 和本功能验收记录。
- hooks 沿用既有脚本更新配置的职责，改用 skills 包已声明的 yaml 解析器保留其他字段；官方 registry 和模式入口仍只经 CLI 更新。共用 YAML 辅助脚本放在 packages/skills/script，构建时打包依赖，交付后不依赖 node_modules。Python 核心继续使用标准库，通过 Node 辅助脚本读取 YAML。
- 统一使用 FOUNDRY_SPECIFY_VERSION 指定 CLI 版本，默认 1.2.6；模式挂载优先沿用项目已安装版本，无显式 CLI 时用 uvx 调用同版工具。实际支持 1.2.5 和 1.2.6，其他版本报明确信息。
- 新模式仅刷新 foundry-explore / foundry-guide 两个独占扩展；保留旧 modes。单模式入口继续可用，完整入口按序调用两次。
- 完整入口保留前三个动作的既有汇总行为；前三步任一失败则不执行模式刷新，避免使用过期技能或 hooks。

实施顺序为：先补全量编排、真实配置与更新重试的失败测试；再实现 YAML 共用处理和 hooks 更新；再实现两模式刷新及版本一致性；最后运行工程检查、官方沙箱及真实工作区刷新。

## 实施结果

实际命令、官方版本实测、审查修复及平台限制见 [全量验收记录](acceptance/script-mount-mvu.md)。真实工作区完整入口已成功，正式任务状态继续以 tasks.md 为准。
