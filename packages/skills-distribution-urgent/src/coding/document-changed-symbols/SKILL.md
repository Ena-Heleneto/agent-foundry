---
name: document-changed-symbols
description: 每次编码 agent 执行 TypeScript、JavaScript、Vue 或相关前端代码编辑时都必须使用。要求为本次新增或修改的每个函数、方法、变量、常量、ref、computed、类字段、类型别名、接口、枚举、导出符号和配置声明，在声明上方补充多行 JSDoc 注释。当用户要求补充 JSDoc 或改动符号注释时也必须使用。
destructive: false
---

# 改动符号 JSDoc 注释

## 核心规则

每次编辑 TypeScript、JavaScript、Vue 或相关前端代码时，凡是本次新增的声明，或本次修改了行为、签名、类型、初始值、业务含义的声明，都必须在声明正上方添加或保留准确的多行 JSDoc 注释。

需要覆盖的改动符号包括：

- 函数、方法、构造函数、赋值给标识符的回调函数、组合式函数、hook、事件处理函数和计算辅助函数。
- 变量、常量、ref、reactive 状态、类字段，以及新增或语义变化的解构别名。对象字面量属性、interface/type 属性、枚举成员等内部成员不单独挂注释，按下方执行流程第 5 条收拢到外层声明。
- 类型、接口、枚举、类型别名、类、模块、导出对象和 schema 定义。

不要为了满足规则去给无关的旧代码批量补注释，除非它们属于同一个被修改声明块且不补会造成风格或含义不一致。

## 执行流程

1. 编辑前，先识别这次可能会新增或修改的声明。
2. 编辑时，在每个改动声明的正上方放置多行 JSDoc 块，格式必须是：`/**` 开始，中间每行以 `*` 开头，` */` 结束。
3. JSDoc 块至少包含一句职责说明；函数、方法、回调、复杂类型或有约束的声明，应按需添加 `@param`、`@returns`、`@template`、`@property`、`@throws` 等标签。
4. 不要使用单行 `/** ... */`、普通 `//`、普通 `/* ... */`、Python docstring、Go 导出注释等格式替代 JSDoc。
5. **不在声明内部写注释**：对象字面量、interface/type 的属性、枚举成员、泛型参数等声明内部（如属性上方）不放 JSDoc；属性语义收拢到外层声明（接口、类型别名、常量、函数）的 JSDoc 块里统一描述。JSDoc 只挂在外层声明正上方。
6. 注释要简短、事实准确，说明符号的职责、含义或约束，不要写“这是新增/修改的函数”。
7. 完成编辑后检查 diff，确认每个改动声明上方都有准确的多行 JSDoc 注释。
8. 使用中文写注释

## 注释质量

优先描述意图、约束或业务含义。

推荐：

```ts
/**
 * 将承运商对账原始行转换为表格可渲染的数据。
 *
 * @returns 标准化后的对账行集合。
 */
const reconciliationRows = computed(() => normalizeRows(rawRows.value))

/**
 * 提交选中的订单发起仓库取消流程。
 *
 * @param orderIds 需要取消的订单 ID 列表。
 * @returns 取消流程提交完成后的 Promise。
 */
function submitWarehouseCancel(orderIds: string[]) {
  // ...
  return Promise.resolve()
}
```

避免：

```ts
/** submitWarehouseCancel 函数。 */
function submitWarehouseCancel() {}

// 提交选中的订单发起仓库取消流程。
function submitWarehouseCancel() {}

/** 新变量。 */
const value = 1
```

## 边界情况

- 如果匿名内联回调无法自然放置直接注释，且该回调有独立业务含义，优先提取为带多行 JSDoc 注释的命名常量。
- 如果声明已经有准确的多行 JSDoc 注释，只在本次改动导致注释过期时更新它。
- 即使项目平时不给简单局部变量写 JSDoc 注释，只要用户明确要求本次改动的变量要有注释，就按本技能执行。
- 不要用单行 JSDoc 或普通行注释凑数；格式不符合多行 JSDoc 时视为未完成。
- 对生成文件、压缩文件、lockfile、snapshot 或机器维护的产物，不主动添加手写 JSDoc 注释，除非用户明确要求修改这些文件并补注释。

## 验证清单

结束前检查最终 diff，并确认：

- 每个新增声明的正上方都有多行 JSDoc 注释。
- 每个修改了行为、签名、类型、初始值或业务含义的声明，都有或保留了准确的多行 JSDoc 注释。
- 注释简洁、有用，并符合附近代码的语言和风格。
- 改动声明的内部（对象字面量、interface/type 属性、枚举成员、泛型参数上方）没有新增 JSDoc 或行注释，属性语义已收拢到外层声明的 JSDoc 块。
- 没有对无关旧代码做大范围注释补充或格式扰动。

测试词和触发示例见 [test-prompts.md](references/test-prompts.md)。
