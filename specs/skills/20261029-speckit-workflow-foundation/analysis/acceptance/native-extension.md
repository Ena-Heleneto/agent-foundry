# 原生协作模式扩展安装验收

日期：2026-10-30。对应 T033、FR-039；本轮只完成模式规则、原生安装与接线验证，不代表后续完整教学、结对或博客写入故事验收。

## 实际结果

使用本机 specify-cli 1.2.4.dev0 的 ExtensionManifest 校验 packages/skills/extension.yml。创建前校验因文件缺失失败，创建后校验通过，提供三个命令且没有新增 hook。通用 task-tutor、task-pair、task-review 位于 src/workflow，只定义标准协作规则。

执行 `specify extension add --dev packages/skills`，退出 0，显示 Extension installed successfully。`specify extension list` 确认 modes 1.0.0、Enabled、Commands: 3、Hooks: 0。当前 Codex skills 入口为 `$speckit-modes-tutor T001`、`$speckit-modes-pair T001`、`$speckit-modes-review T001`。

原生注册记录位于 .specify/extensions/.registry；本机实现把三条登记在 registered_commands.codex，registered_skills 为空，但实际 .agents/skills 下三个生成的 SKILL.md 均存在。metadata.source 分别为 modes:commands/tutor.md、pair.md、review.md。不假设其他版本的登记字段形状。

官方安装仅复制 extension.yml、三份 commands 和三份通用模式 skill；未复制 node_modules、测试或其他技能。三个生成入口中技能路径均被官方 CLI 改写为 .specify/extensions/modes/src/workflow/task-*/SKILL.md，引用实际存在且与源字节一致。模式互跳及 Implement 命令标记均已渲染，无未解析 token。

自建 .specify/adapters 三份文件及 AGENTS 指令路由已删除。既有 hooks 直接保留原 prompt 内的输入、操作、目标和治理要求，删除对适配目录的引用。原生安装前后解析比较，所有原 hook 条目语义一致。运行真实默认 register-hooks.sh 返回跳过，extensions.yml 字节不变。安装前后 11 个原生 speckit-* 核心技能哈希一致。

## 检查与限制

- skills lint、check-types、build、test 实际执行；初次 lint 发现 extension.yml 四处样式错误，自动修复后重跑 lint 通过。包测试 5 项通过，包含源清单/MCP 消费及工具中立性。
- `node --import /tmp/phase3-yaml-loader.mjs scripts/dev/actions/register-hooks/test-register-hooks.mjs` 安装前后均为 Bash 35 passed, 0 failed。临时 loader 仅把已有 yaml 2.9.1 的解析入口提供给现有测试，没有安装依赖或模拟解析器。
- PowerShell 运行时缺失，该平台未实际执行；脚本按同一接管规则同步。
- Vite 构建通过，仍有既有 manifest 导入缺少扩展名的提示。
- `specify extension info modes` 首次在沙箱内因 DNS 无法读取远端 catalog，仍读到本地安装信息；随后按权限要求重试成功，确认三入口已安装，扩展为本地来源且不在远端 catalog。
- 未创建 Spec/Task 隔离副本，未伪造用户练习、局部授权或文章 A/B 批准，未写入博客、数据库、发布或部署。Phase 3 等待用户验收，未进入 Phase 4。

此前 collaboration-modes.md、skill-portability.md 中自定义适配路径和请求路由仅为当时实现的历史事实，现行接线以本记录和原生扩展为准。
