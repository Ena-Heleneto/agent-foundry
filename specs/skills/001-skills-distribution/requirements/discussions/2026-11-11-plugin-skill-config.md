# 插件工厂与技能清单配置

> 后续调整：本文关于工厂函数、所有声明内置及模块顶层限制的写法约定，已由用户[最新要求](2026-11-11-independent-plugins.md#取消组合式函数写法)撤销。skill/hook配置结构和选择规则继续有效；下文相关写法保留讨论历史。

依据[用户表达及澄清](../raw/2026-11-11-plugin-skill-config.md)，本轮采用以下结构；沿用现有JSON文件名是工程选择，用户要求的是配置结构调整。

```json
{
  "packageName": null,
  "mcp": false,
  "skill": {
    "artifact-business-flow": {
      "hook": {
        "after_plan": {
          "prompt": "这里是提示词",
          "optional": false,
          "priority": 20
        }
      }
    },
    "bug-report": {}
  }
}
```

skill键为技能目录名，决定复制范围；无hook也能通过空对象选入。无配置或无skill映射等同空清单，仅输出集合配置，不自动交付未选技能。集合目录仍自动发现，无需修改插件；原四集合显式列出当前23项技能，避免迁移遗漏。

每技能hook是事件名到配置对象的映射，各事件独立保存prompt、optional、priority及其他属性。不限定事件名或未知扩展属性；已知字段检查类型，原配置字节直接交付。旧配置13份事件仅移除command/description，其余属性逐项等值。SKILL.md frontmatter保持原样，未来生成器再读取所需信息，本轮没有实现读取或生成。

插件采用导出工厂，模块顶层只留静态import和工厂自身；类型、辅助函数、常量及状态全部放在工厂内。当前仍只有集合内容插件，不据先前按职责拆分的讨论擅自增加生成器或并行调度。

脚本动态生成已确定方向，具体模板、路径、挂载及生成顺序留后续讨论；本轮不创建占位script目录或派生speckit-hooks.json。MCP仍只创建空目录。T072保留旧完成事实，新范围由[T073](../../implementation/T073.md)承接，工程结果见[验收](../../analysis/acceptance/plugin-skill-config.md)。
