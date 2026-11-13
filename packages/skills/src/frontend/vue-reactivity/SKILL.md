---
name: vue-reactivity
description: 编写或修改本仓库 Vue/Nuxt 响应式代码时必须使用。默认禁止新增 watch、watchEffect、watchPostEffect、watchSyncEffect 等 watcher，优先使用 computed、ref/reactive、模板绑定、props/emits 与 composables 的声明式数据流；例外使用 watcher 时必须说明理由并保持职责窄而局部。
destructive: false
---

# Vue 响应式编码规则

## 适用范围

本规则适用于本仓库中的前端 Vue/Nuxt 代码。

## 核心规则

默认不要新增基于 Vue watcher 的代码。

避免新增：

- `watch`
- `watchEffect`
- `watchPostEffect`
- `watchSyncEffect`

优先使用响应式、声明式的数据流：

- 使用 `computed` 表达派生状态
- 使用 `ref` 或 `reactive` 作为状态来源
- 使用模板绑定表达 UI 行为
- 使用 props 和 emits 进行父子组件通信
- 使用 composables 暴露状态和方法，避免通过 watcher 副作用同步状态
- 将数据转换逻辑放入 computed、事件处理函数或显式的提交/action 函数中

## 允许的例外

只有在用户明确要求，或确实不存在实用的响应式/声明式替代方案时，才可以使用 Vue watcher。

如果在例外情况下新增 watcher，agent 必须：

- 说明为什么 `computed`、props/emits、模板绑定或显式 action 不适用
- 将 watcher 的职责保持窄而局部
- 避免在 watcher 中修改无关状态
- 如果 watcher 注册了外部资源，必须确保清理逻辑完整

## 优先重构方向

修改已有 watcher 前端代码时，优先将 watcher 逻辑替换为：

- 使用 `computed` 表达同步派生值
- 使用显式函数处理用户触发的动作
- 使用 composables 复用响应式状态
- 使用表单/model 绑定传播 UI 状态
