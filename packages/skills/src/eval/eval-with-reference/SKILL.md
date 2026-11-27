---
name: eval-with-reference
description: 实测样本技能（带附属参考文件型）。用于评估 Agent 在需要索引附属契约文档时的技能调用、跨文件检索与规约实施效果。
destructive: false
---

# 契约驱动 API 实现指南（eval-with-reference）

## 适用场景

本技能为实测评估专用样本技能。当根据统一契约定义实现外部集成接口或数据传输对象时使用。

## 核心规约

1. **查阅契约**：在编写任何 API 客户端或服务端处理函数前，必须首先完整阅读 `references/contracts.md` 中定义的字段定义、HTTP 状态码及错误响应协议。
2. **严守字段映射**：
   - 字段类型必须严格按照契约附录中的数据模型映射到 TypeScript 接口。
   - 契约标记为必填（required）的字段，TypeScript 声明不得带有可选符号 `?`。
   - 契约标记为只读（readonly）的字段，必须添加 `readonly` 修饰符。
3. **统一错误封装**：所有 API 请求异常必须封装为契约中规定的统一结构体，包含 `code`、`message`、`timestamp` 字段。

## 执行步骤

1. 阅读并确认本技能目录下的附属契约文件 `references/contracts.md`。
2. 按照契约声明定义请求体与响应体的 TypeScript 类型。
3. 实现处理逻辑并对输入参数执行契约校验（如长度、格式、数值区间）。
4. 编写对应的单元测试，确保契约规定的所有正常与异常分支均被覆盖。
