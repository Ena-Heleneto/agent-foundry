# 使用者文档站

Nuxt 4 + Nuxt Content 3，Markdown来源位于content，仅渲染使用者指南。UnoCSS提供属性化布局与正文排版。

```bash
pnpm --filter @foundry/docs dev
pnpm --filter @foundry/docs lint
pnpm --filter @foundry/docs check-types
pnpm --filter @foundry/docs build
```

默认端口3005，Node原生SQLite维护内容索引。支持动态文档、集合导航、页内目录、移动端菜单和真实404。规格和历史验收不自动作为页面发布。
