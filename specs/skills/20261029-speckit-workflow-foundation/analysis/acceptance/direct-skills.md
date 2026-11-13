# 兼容技能直接安装验收

日期：2026-10-30。对应 T034，替代 native-extension.md 中 commands 包装层及禁止工具内容的现行要求。旧记录保留为当时事实。

## 本轮决定与实现

用户撤销“通用 skill 不包含 Spec Kit 内容”的要求，允许在 skill 内兼容。已同步 AGENTS、FR-037/038/039、plan、data-model、workflow、research、quickstart 和包说明。T031/T033 的过往实施记录保留为历史，不能用来要求恢复拆层。

Tutor、Pair、Review 各自的 SKILL.md 直接维护模式行为及环境分支：Spec Kit 项目使用已指定 Spec 或实际 feature.json，核对标准材料及 Task 唯一归属；指针缺失或当前 Spec 无编号时检索已有任务；非 Spec Kit 项目沿用已有任务系统、布局及状态，不强制 .specify。原有任务归属、目录记录、真实授权/证据及 Review A/B 边界保持。

extension.yml 的 provides.commands.file 直接引用 src/workflow/task-tutor/SKILL.md、task-pair/SKILL.md、task-review/SKILL.md。源与已安装扩展的 commands 目录均不存在，没有包装模板、自调用或额外注册器。移除与最新决定冲突的禁止工具关键字测试；其余四项源/构建、废弃项、实际 MCP 消费检查保留。

## 实际验证

- 用本机 specify-cli 1.2.4.dev0 的 ExtensionManifest 解析源，三条直接 SKILL.md 引用均有效。
- 执行 `specify extension add --dev packages/skills --force`，退出 0；官方 CLI 替换此前已安装的 modes 包装入口，未手改受管文件。
- `specify extension list` 确认 modes 1.0.0 Enabled、Commands: 3、Hooks: 0。三个入口仍为 `$speckit-modes-tutor T001`、`$speckit-modes-pair T001`、`$speckit-modes-review T001`。
- 对源和安装 manifest 逐条比较相同；安装内三个 SKILL.md 与源字节一致；生成的 .agents/skills/speckit-modes-*/SKILL.md 各自完整包含对应源正文，无 commands/ 引用或再次加载源技能。
- 与重装前快照比较，11 个原生核心技能哈希一致。旧 register-hooks.sh 对真实配置跳过，配置字节不变。
- `pnpm --config.verifyDepsBeforeRun=false --filter @foundry/skills run lint`、check-types、build、test 实际通过；Python 四项测试通过，真实 MCP registry 能读取最新模式正文。

## 限制与验收边界

skill-creator 的 quick_validate.py 对三个源均报已有自定义 frontmatter 字段 destructive 不在其白名单。该字段是本仓库 skills manifest/MCP 既有契约，本轮未更改其格式；未将该校验宣称通过。官方扩展解析、安装和本仓库构建/消费验证通过。

构建仍有既有 Vite manifest 导入缺少扩展名提示。本轮未改 PowerShell 脚本、未重跑其检查；当前环境没有 pwsh，不能声称该平台执行成功。未进行真实 Tutor 练习、Pair 用户局部授权或 Review A/B/博客写入演练，不以接线和规则检查替代行为验收。未创建 Spec/Task 隔离副本、未提交或发布。

Phase 3 当前修订已保存，等待用户验收，不自动进入 Phase 4。
