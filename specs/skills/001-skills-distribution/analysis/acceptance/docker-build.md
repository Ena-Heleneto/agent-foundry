# 技能容器构建验收

日期：2026-11-20。用户要求同步 Spec 并处理 `packages/skills/deploy/Dockerfile`，随后明确镜像用途为[构建](../../requirements/raw/2026-11-20-dockerfile.md#用户明确镜像用途)。本次只提供容器内构建及产物导出，不进入服务、打包上传或公开部署；现有原 Task 身份及工程勾选不变。

## 实现范围

Dockerfile 以仓库根为上下文，保留 Node 26.8.1-bookworm-slim，默认安装 pnpm 12.8.1。根 package.json、workspace/catalog 和 pnpm-lock.yaml 及两包 package.json 先复制以复用依赖安装层，使用 frozen-lockfile 安装 skills 及其 workspace 依赖；安装阶段 ignore-scripts 避免根 postinstall 的文档站准备，随后明确构建 preset-config、skills。最终 scratch artifacts 阶段只复制实际 skills/dist，用户可直接导出产物目录。

同目录 Dockerfile.dockerignore 使用白名单，仅传入必要根清单及 preset-config/skills 的源码、构建逻辑和配置，排除主机 node_modules、旧 dist、Git、环境文件及仓库记录。README 保存根上下文及导出命令，并说明本地导出器不自动清空已有目的目录。用户未确认的早期镜像职责已经被本轮明确选择替代，Spec/Plan/MVU、构建契约和指南均沿实际构建用途同步。

## 实际验证

环境为 Linux amd64、Docker Engine 29.9.1、Buildx 0.38.0，构建使用 Node 26.8.1、pnpm 12.8.1 和当前冻结锁文件；核验对象是本次未提交工作区，不是严格提交候选。

| 命令或操作 | 结果 |
| --- | --- |
| 原骨架构建为本地 baseline 镜像后，运行 `test -f /workspace/packages/skills/dist/VERSION` | 退出 1，证明原镜像没有实际技能构建产物 |
| `docker buildx build --check --file packages/skills/deploy/Dockerfile .` | 退出 0，无 Dockerfile 检查警告 |
| `docker buildx build --file packages/skills/deploy/Dockerfile --output type=local,dest=<独占临时目录>/output .` | 退出 0，按当前锁文件在容器中安装 874 包，先构建 preset-config 再构建 skills，最终本地导出成功 |
| 实际上下文传输 | 约 1.31MB，未传入主机依赖及旧产物 |
| 导出内容与此前同源本地 dist 逐项比较路径和 SHA-256 | 21/21 文件一致，零缺件、额外文件或字节差异，无软链接 |
| 根目录及版本核对 | 根仅含 VERSION、curl/、engine/、script/、skill/；VERSION 为 0.1.0 |
| 四份导出脚本分别 `bash -n` | 4/4 退出 0 |
| 范围内只读审查 | 未发现重要构建、上下文或导出错误，审查未修改文件或重复构建 |

容器安装先完成当前供应链策略核验，未修改 trustPolicy、锁文件或构建断言。npm registry 出现一次约 43 秒慢请求，策略核验及依赖安装最终正常完成；没有将该中间警告当失败或跳过。共享预设构建另保留原有 Vite 提示：三个本地配置导入未写扩展名，将来原生配置加载器不支持；当前配置加载及构建实际成功，本次未修改无关预设源码或隐藏该警告。

本轮只改变 Docker 配置和文档，没有改 TypeScript/JavaScript 业务或依赖定义，未重复运行已在本地闭环记录披露旧失败的 Python 套件。未推送镜像、上传文件、启动服务、修改当前项目挂载或验证其他架构。当前开发集合含 eval/profile，导出成功不等于可直接公开发布；完整分发边界继续沿[本地构建闭环证据](local-build-loop.md)及原任务。
