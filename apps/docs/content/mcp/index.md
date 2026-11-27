---
title: MCP 使用
description: 通过 prompts、resources 和工具读取技能内容；先确认实际清单契约。
---

## 当前前置

apps/mcp是Python/FastMCP应用，提供技能prompts、references资源和list_skills工具。默认读取packages/skills/dist/manifest.json，也可通过FOUNDRY_SKILLS_MANIFEST指定路径。

当前主线构建已变更，尚未生成服务期望的旧manifest结构。紧急版release.json也不是这个manifest。仅运行技能构建或拥有九项技能源码，不能据此认定MCP默认启动可用。

## 准备依赖和运行测试

```bash
uv sync --project apps/mcp --frozen --group dev
uv run --project apps/mcp --frozen --group dev pytest apps/mcp/tests
```

测试使用独立清单样本验证解析与注册，不能替代生产构建契约接通。

## 使用已准备的有效清单

在提供符合现有结构的真实清单后，使用环境变量指向该文件，再启动服务：

```bash
export FOUNDRY_SKILLS_MANIFEST=/absolute/path/to/manifest.json
uv run --project apps/mcp --frozen foundry-skills-mcp
```

stdio适合宿主以子进程调用。需要本地HTTP时：

```bash
uv run --project apps/mcp --frozen foundry-skills-mcp --http --host 127.0.0.1 --port 8787
```

健康检查为 http://127.0.0.1:8787/healthz 。服务本身没有鉴权，访问边界由实际部署维护；本次仓库迁移不启动线上服务。

## 自托管配置

stacks/mcp-inspector保留两份Compose配置和Inspector冒烟入口。执行前先核对有效清单与挂载路径；配置文件迁入不等于服务已部署或完成实际消费验收。
