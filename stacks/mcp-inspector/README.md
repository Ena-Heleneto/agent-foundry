# stacks/mcp-inspector

`apps/mcp`（foundry-skills-mcp，ENA Foundry 自定义 skill 收束 MCP 服务器）的 Docker 编排。**不提供 Dockerfile**，两个编排文件都直接使用官方镜像 `ghcr.io/astral-sh/uv:python3.12-bookworm-slim`（spec 原文所写 `python3.12-slim` 标签在 ghcr.io 不存在，此处取官方等价的最接近标签），把仓库源码以只读方式挂载进容器（`/repo`），工作目录设为 `/repo/apps/mcp`，经 `uv run python server.py --http --host 0.0.0.0` 启动。

- uv 的依赖缓存（`UV_CACHE_DIR`）与虚拟环境（`UV_PROJECT_ENVIRONMENT`）放入命名卷，避免在宿主机工作区写入 root 属主的 `.venv`；容器内首次 `uv run` 会解析并安装依赖，依赖命名卷缓存加速后续启动。
- 收束清单来自仓库内 `packages/skills/dist/manifest.json`（随源码挂载），缺失时服务器直接报错提示先执行 `pnpm --filter @foundry/skills build`。
- 服务器无鉴权：线上编排只应置于受信网络或反向代理之后，详见 `apps/mcp/README.md` 首屏风险提示。

## 线上编排：`docker-compose.yml`

对外暴露 `8787` 端口，`restart: unless-stopped`，带 `/healthz` 健康检查：

```bash
docker compose -f stacks/mcp-inspector/docker-compose.yml up -d
curl -sf http://127.0.0.1:8787/healthz   # 返回 {"status":"ok"}
```

MCP 端点为 `http://<主机>:8787/mcp`（Streamable HTTP）。

## 线下测试编排：`docker-compose.dev.yml`

端口仅绑定 `127.0.0.1:8787`，另含一次性冒烟服务 `inspector-cli`（node 镜像经 npx 运行 MCP Inspector CLI，连接 `http://mcp-server:8787/mcp` 列出能力清单，退出码即冒烟结果）：

```bash
docker compose -f stacks/mcp-inspector/docker-compose.dev.yml up -d
curl -sf http://127.0.0.1:8787/healthz
docker compose -f stacks/mcp-inspector/docker-compose.dev.yml run inspector-cli
docker compose -f stacks/mcp-inspector/docker-compose.dev.yml down
```

`inspector-cli` 依赖 `mcp-server` 健康检查通过后才运行；`up -d` 时也会自动执行一次冒烟（执行完即退出）。
