# 原始需求：按集合组织技能来源和构建

日期：2026-11-11。来源为当前会话用户表达；仅保留本次可见内容，不推定未发生的决定。

## 用户原始表达

> 我们写的应该是是一个plugin吗，构建出dist下的三个目录，然后将文件复制进去？ 哦哦哦，我有更好的方法， 我们修改一下 vite 插件的逻辑，我们将 @packages/skills/src/mcp 和 packages/skills/src/skills 下的技能汇总目录都移动到 @packages/skills/src 下，移除 skills 和 mcp 目录，然后在汇总目录下新增汇总配置，包括 发布的包名，是否进入mcp ,将原有的 skill目录下的 配置合并到集合配置中，然后我们构建的时候扫描src下的目录，在dist下生成src目录下相同的目录，和一个mcp目录 ，然后将目录下的技能复制到dist目录中。mcp 目录内容逻辑暂时还没想好，暂时就先这样

## 后续澄清与确认

- 针对是否合并frontmatter：用户答“只合并 speckit-hooks.json，保留 SKILL.md frontmatter”。
- 针对发布包名的含义：用户答“这个是流水线的部分，我还没想好”。
- 针对旧MCP测试技能归属及新增集合：“就是一个eval集合，后面如果想新增集合，直接新建一个目录就好了”。
- 针对插件是否派生逐技能hooks配置兼容挂载：“特定的脚本我们额外处理”。

AI对配置文件名、默认值和具体代码组织的选择不属于用户原话，记录在[讨论](../discussions/2026-11-11-collection-build.md)及[T072方案](../../implementation/T072.md)。
