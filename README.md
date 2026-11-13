# Agent Foundry

技能源码、分发工具、Spec Kit 工作流扩展与MCP服务的独立monorepo。自有材料采用ISC，第三方许可见THIRD-PARTY-NOTICES.txt。

## 目录

- apps/docs：Nuxt 4 + Nuxt Content 3 使用者文档站。
- apps/mcp：Python/FastMCP服务与测试。
- packages/skills：用户手写中的主线来源。
- packages/skills-distribution-urgent：Linux/Codex项目级紧急分发。
- tooling/preset-config：ESLint/TypeScript最小共享预设。
- specs/skills：原规格、任务、方案及历史证据。
- stacks/mcp-inspector：MCP Compose与Inspector配置。

## 本地开发

使用mise准备Node、pnpm12、Python和uv：

```bash
pnpm install
pnpm dev
```

文档站默认 http://localhost:3005 。依赖安装仅构建共享预设并准备Nuxt，不自动安装外部技能、注册hooks或运行发布。

```bash
pnpm build
pnpm lint
pnpm check-types
pnpm skills:link
uv run --project apps/mcp --frozen --group dev pytest apps/mcp/tests
```

pnpm build包含共享预设、当前主线和文档站。紧急版严格候选要求新仓库的相关源码和配置已真实提交，另用pnpm build:candidate；未提交时拒绝构建是来源保护，不能伪造提交或复用旧候选。此迁移不自动创建提交、标签或发布。

## 当前边界

主线功能仍由用户手写，保留迁入时的中间态与既有lint失败。主线eval配置目前启用了部分样本，与正式分发排除规格仍需按原任务对齐。MCP消费旧manifest契约，主线当前构建尚不生成该文件；服务测试通过不代表默认清单已接通。公开安装来源尚未发布，用户文档不会提供虚构下载地址。

迁移处置见migration-manifest.json及specs/skills/001-skills-distribution/implementation中的设计、文件清单与执行记录。历史证据与原checksum保留发生时语境；派生副本不替代原始验收。
