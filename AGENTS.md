# Agent Foundry 工程约定

本仓库采用 pnpm 12、Turborepo、ESM与严格TypeScript。apps维护文档站和Python MCP；packages维护两条技能工作线；tooling只提供必要共享配置。跨包引用通过声明的exports和workspace依赖。

注释和文档使用简体中文。编辑JS/TS/Vue时先加载document-changed-symbols并为新增或语义修改声明添加多行JSDoc；前端样式和响应式分别遵守nuxt-ui-styling与vue-reactivity，默认不新增watcher。这三项技能来源在packages的对应目录，已安装副本通过pnpm skills:link生成，不手改副本。

主线packages/skills保留用户手写分工；未经本轮明确请求不接管其未完成构建插件。紧急版保持自身源码、脚本与输出，Linux/Codex/项目级之外的组合不推定支持。eval源码保留不等于正式发布内容；当前主线配置与规格的差异见迁移记录。

初始化使用pnpm install；开发pnpm dev；一般构建pnpm build；严格候选单独pnpm build:candidate，要求相关输入已真实提交；lint和check-types按目标workspace执行。有原测试时按范围运行，不存在根pnpm test。Python依赖用uv及apps/mcp/uv.lock。

任何Markdown新增或修改后执行pnpm exec eslint --fix；历史规格、归档和第三方夹具保持发生时原文，公开派生以迁移清单说明。验证失败、缺前置和未执行分别记录，不通过改规则或删断言求绿。

不复制其他项目的私人画像、会话、凭据或机器配置。目标项目技能沿目标项目自身治理与记录布局；不在这里建立跨仓库个人画像。不得提交secrets、环境变量值或认证文件。

改动前查看git status，不覆盖用户未提交文件。生成物不手改。推送、发布、部署和外部资源变更须有适用明确授权。

本项目启用影子画像：每轮对话必须完整读取并执行`.agents/skills/shadow-profile/SKILL.md`，包括普通问答、简短确认和无Task讨论；资料根为`.specify/memory/user-shadow/`。技能不可读或保存故障时仍正常答复并说明具体缺档。当前研发仅本人，多使用者后续迭代；摘要、结论和画像可纳入Git是暂行方案，后续可调整，不自动提交或公开。
