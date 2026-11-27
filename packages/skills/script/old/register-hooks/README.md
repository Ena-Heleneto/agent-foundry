# Hooks 安装脚本

本目录是内部平台模块；唯一对外入口为 `node script/index.mjs [参数]`，外部安装后的所选 hooks 编排由分发后续任务接通。工作区集成与测试可按下方内部接口调用 Bash / PowerShell，所有来源须已安装到同一技能根。

```bash
bash dist/script/register-hooks/register-hooks.sh --project /path/to/project --skills-dir /path/to/skills
```

Windows 使用同目录 register-hooks.ps1，参数一致：--project、--skills-dir、可选 --cli。平台脚本使用 FOUNDRY_SPECIFY_VERSION 或默认 1.2.6。默认通过 uvx --from specify-cli==<版本> specify 调用，需要已安装 uv；可用 --cli 指向已安装的官方 CLI。

每次先核对七份技能及各自目录下的 speckit-hooks.json，然后逐项复制完整技能及附件、生成临时 hooks-only 扩展，执行官方 extension add --dev --force。speckit-hooks.json 仅维护该技能的 hooks 映射；平台脚本直接读取已安装配置，不生成集中 definitions。七个扩展沿用 artifact-issue-description、artifact-pr-description、mvu-gate、artifact-business-flow、artifact-logic-flow、explainer-doc-sync、artifact-project-description 的标识。

受管 hooks 完整按来源重装，enabled、condition 和未知自定义字段不保留；删除来源中某事件会清理该扩展对应旧事件。无关扩展由官方 CLI 处理，不承诺保留 YAML 注释。不生成额外命令入口。所有输入齐备后才开始安装；中途失败返回原退出码并停止后续项，已成功安装的项不回滚；重跑再次全部安装。临时目录成功或失败均清理。

运行代码无需 Node 转发入口、第三方 Node 库或自有 Python 脚本。官方 CLI 自身的运行依赖仍由其环境满足。构建仅原样复制本目录的两个平台脚本和 README。

测试位于 packages/skills/tests/test-register-hooks.mjs；设置 FOUNDRY_SPECIFY_CLI 可执行真实官方集成测试，未设置时明确跳过。当前验证范围为 Linux；PowerShell/macOS 尚未实际验证。
