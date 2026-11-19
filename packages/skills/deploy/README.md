# 容器构建技能

在仓库根目录执行，使用 Node 26.8.1 和默认 pnpm 12.8.1，按当前锁文件安装构建依赖，依次构建共享预设和技能包。

```bash
docker buildx build \
  --file packages/skills/deploy/Dockerfile \
  --output type=local,dest=./.output/skills \
  .
```

输出目录直接包含 `VERSION`、`skill/`、`curl/`、`script/` 和 `engine/`，不带 dist 外层。导出时使用新的空目录，Docker 的本地导出器不会替你清理目的目录中的旧文件。

同目录 `Dockerfile.dockerignore` 限制构建上下文；主机 node_modules、旧 dist、仓库记录和环境文件不进入构建。安装依赖时跳过生命周期脚本，避免根 postinstall 的文档站准备；构建所需 preset-config 随后显式构建。

该产物沿当前开发集合配置生成，可能包含 eval/profile，不能直接当正式公开包上传。镜像只提供构建，正式范围过滤、打包和发布沿后续流水线处理。
