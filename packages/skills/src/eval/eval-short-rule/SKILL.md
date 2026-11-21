---
name: eval-short-rule
description: 实测样本技能（短文规则型）。用于评估 Agent 在微型规则约束下的触发与遵循效果，约束业务常量命名与注释规范。
destructive: false
---

# 业务常量命名与注释规约（eval-short-rule）

## 适用场景

本技能为实测评估专用样本技能。当编写或重构 TypeScript/JavaScript 代码中的业务常量声明时必须遵循。

## 核心规则

1. **命名规范**：所有顶层导出的业务常量必须采用全大写蛇形命名（`UPPER_SNAKE_CASE`）。例如 `MAX_RETRY_COUNT`、`DEFAULT_TIMEOUT_MS`。
2. **注释规范**：每个业务常量正上方必须有一行单行 JSDoc 注释，简明说明常量的业务含义与度量单位。格式为 `/** <说明> */`。
3. **不可变声明**：必须使用 `const` 关键字声明，禁止使用 `let` 或 `var`。
4. **禁止魔数**：业务逻辑中涉及的超时阈值、配额上限等固定数值，必须提取为顶层常量，不得以内联字面量形式散落在函数体内。

## 示例

```ts
/** 接口请求失败最大重试次数（单位：次） */
export const MAX_RETRY_COUNT = 3

/** 单次会话超时阈值（单位：毫秒） */
export const SESSION_TIMEOUT_MS = 30000
```
