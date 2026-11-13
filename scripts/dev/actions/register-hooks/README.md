# 工作区 hooks 安装入口

本目录只补齐工作区 project 与 .agents/skills 路径，Bash / PowerShell 分别委托 packages/skills/script/register-hooks 下对应平台脚本。可传 --project、--skills-dir、--cli 覆盖默认参数；不再支持旧的目标 YAML 位置参数。

七项 hooks 每次使用官方 extension add --dev --force 按来源完整重装；受管字段不作保留式合并，无关扩展由官方 CLI 处理。来源定义、临时输入和失败清理见包内 register-hooks/README.md。须先刷新来源技能；hooks 失败时完整初始化不继续五指令挂载。

```bash
node scripts/dev/actions/register-hooks/test-register-hooks.mjs
```

测试委托包的 tests/test-register-hooks.mjs，仅在临时项目运行；可通过 FOUNDRY_SPECIFY_CLI 指向官方 CLI 做真实集成验证。当前只验证 Linux。
