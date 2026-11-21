# 同步规格并续接 Dockerfile

2026-11-20，来源为当前可见会话中的用户请求。

> 同步spec，我们接下来处理@packages/skills/deploy/Dockerfile

本轮先同步已确认的本地构建及缺源报错边界，再核查指定 Dockerfile。镜像具体职责未在这句话中说明，不据文件名或相邻 MCP 工程推定其运行目标。

## 用户明确镜像用途

Agent 询问镜像应负责容器内构建 skills 并输出 dist、打包上传 R2，还是运行 MCP 服务。用户选择：

> 构建
