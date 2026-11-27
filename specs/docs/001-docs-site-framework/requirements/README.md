# Agent Foundry 文档站需求依据

## 2026-11-26 需求摘要

现有文档入口需要扩展为五个模块、四套布局的可浏览框架，技能导航先用样例验收。原型已在 Figma Make 中完成，设计协作者需要一次启动转换清单内的页面和状态，得到同一个文件内的可编辑画板。代表性实测是独立需求，通过后再运行全量并沉淀方法。技能包先验收测试环境，再按原发布规格接入生产。 [本轮规格提示词](prompts/speckit-prompt.md) · [本轮原始讨论输入](raw/2026-11-26-original-request.md) · [主线技能构建与发布规格](../../../skills/003-skills-release-pipeline/spec.md)

当前可用于规格的是需求文字、原型提示词、现有站点源码和公开的产品文档。正式章节与目录留待后续交付。真实原型入口或可运行的源码、Figma Design 的可编辑目标、技能包的文档产物均是后续实测的前置。 [站点范围与技术验证](../spec.md#assumptions)

## 原始材料

- 本轮执行输入从 `temp/a/speckit-prompt.md` 移入，保留归档时原文。 [Spec Kit 提示词](prompts/speckit-prompt.md)
- 本轮原始讨论来自 `temp/a/1.md`，涵盖发布顺序、开发协作和设计稿转换需求。 [原始需求](raw/2026-11-26-original-request.md)
- 原型生成输入来自 `temp/a/figma-make-prompt.md`，涵盖桌面和手机的布局、交互与占位示例。 [Figma Make 原型提示词](prompts/figma-make-prompt.md)
- 2026-11-20 的历史输入从提交 `d633850d4a7142d85f4852552cd79423f597c1bb` 的根目录 `a.md` 取回并保留原文。 [历史输入](raw/2026-11-20-a.md)

移入文件中沿用旧位置的引用可通过本页到达对应材料。

## Figma 转换调研依据

- Figma Make 的「复制设计」可把当前预览转换成可编辑图层，可用于代表性页面的对照。 [Figma Make 帮助](https://help.figma.com/hc/en-us/articles/35060759685015-Copy-a-Figma-Make-preview-as-design-layers)
- Figma MCP 的 Code to canvas 可把浏览器中的页面或状态采集为同一个 Design 文件中的可编辑图层。按清单驱动批量采集是待实测的候选，输入可来自可访问原型或运行从 Make 导出的源码。 [Code to canvas 文档](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/) · [Figma Make 源码下载说明](https://help.figma.com/hc/en-us/articles/33649966245783-Edit-the-code-of-a-functional-prototype-or-web-app)
- html.to.design 支持批量导入可直接访问的 URL，需 PRO 或 `<div>RIOTS ONE` 订阅。无法用 URL 单独打开的交互状态仍须验证采集方式。 [批量导入文档](https://html.to.design/docs/bulk-import-url-list/)

上述依据来自公开文档。项目转换实测缺前置，待实际原型输入和目标文件编辑权限就绪后验证。
