# foundry-skills-mcp

ENA Foundry 自定义 skill 收束 MCP 服务器（Python + FastMCP，uv 管理依赖）。把 `packages/skills` 构建产物 `dist/manifest.json` 中通过校验的 skill 收束为 MCP 能力：每个 skill 注册为同名 prompt（返回 SKILL.md 正文）、`skill://<name>/<相对路径>` resource（references 附属文件），并提供 `list_skills` 工具返回收束清单（名称、描述、destructive 标注）。

> ⚠️ **免鉴权风险提示（务必先读）**
>
> 本服务器**没有任何鉴权**。HTTP 模式下任何能访问监听地址的客户端都可调用全部收束能力。默认只收束非破坏性 skill（`destructive: true` 默认拒绝，仅在显式 `--include-destructive` 时放行并以 `⚠️ DESTRUCTIVE` 前置标注），这是唯一的安全前提。HTTP 部署**必须**置于受信网络或反向代理（自带鉴权）之后；`--host` 缺省 `127.0.0.1`，对外暴露须显式 `--host 0.0.0.0` 且由使用者授权该部署动作。切勿直接暴露到公网。

## 前置条件

- 收束清单唯一事实来源是构建产物 `packages/skills/dist/manifest.json`，缺失时服务器直接报错退出，请先在仓库根执行：

  ```bash
  pnpm --filter @foundry/skills build
  ```

- Python ≥ 3.12，依赖经 uv 锁定（`uv.lock`），首次 `uv run` 自动解析安装。

## 本地 stdio 模式（默认）

供本地 agent 经 `.kimi-code/mcp.json` 挂载（已含 `foundry-skills` 条目）：

```bash
# 1. 安装打包产物至 PATH
uv tool install ./apps/mcp

# 2. 本地开发更新后重装
uv tool install --reinstall ./apps/mcp

# 3. 运行服务器
foundry-skills-mcp
```

## 部署（Docker 优先）

线上编排见 `stacks/mcp-inspector/docker-compose.yml`（**不提供 Dockerfile**，官方 uv 镜像挂载仓库源码运行，详见 `stacks/mcp-inspector/README.md`）：

```bash
docker compose -f stacks/mcp-inspector/docker-compose.yml up -d
curl -sf http://127.0.0.1:8787/healthz   # 健康检查返回 {"status":"ok"}
```

MCP 端点为 `http://<主机>:8787/mcp`（Streamable HTTP）。容器以 `--host 0.0.0.0` 监听，务必遵守上文风险提示。

## 部署（裸进程通用说明）

不适用 Docker 时可经 systemd 或 pm2 以裸进程运行（二选一）：

- **systemd** 单元示例要点：`ExecStart=/usr/bin/env foundry-skills-mcp --http --host 0.0.0.0 --port 8787`，`Restart=on-failure`。
- **pm2**：`pm2 start "foundry-skills-mcp --http --host 0.0.0.0 --port 8787" --name foundry-skills-mcp`。

裸进程部署同样无鉴权，监听地址与暴露范围由使用者自行管控。

## CLI 参数

```text
foundry-skills-mcp                                          # stdio 模式（默认，供本地 agent 挂载）
foundry-skills-mcp --http [--port 8787] [--host 127.0.0.1]   # Streamable HTTP 自托管模式
foundry-skills-mcp --include-destructive                     # 放行破坏性 skill（显著标注）
```

## 验证

```bash
cd apps/mcp
uv run pytest                                               # 单测（registry 过滤、prompt/resource 映射、list_skills 形态）
pnpm dlx @modelcontextprotocol/inspector --cli foundry-skills-mcp --method prompts/list   # stdio 冒烟
```
