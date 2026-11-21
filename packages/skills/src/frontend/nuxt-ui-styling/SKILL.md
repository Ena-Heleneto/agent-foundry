---
name: nuxt-ui-styling
description: 编写或修改本仓库使用 Nuxt UI、Tailwind CSS、UnoCSS 的 Vue/Nuxt 前端代码样式时必须使用。规定 Nuxt UI 组件样式经 `ui` 属性使用 `tw:` 前缀的 Tailwind CSS，其余组件与原生标签一律使用 UnoCSS 属性化取值式写法，且不得臆造 slot、variant、shortcut 或 utility class。编写或修改 NuxtLink 等组件的属性化样式、属性名与组件 prop 或原生 HTML 属性同名（如 `text`）时必须使用：冲突属性加属性化前缀（以项目 `presetAttributify({ prefix })` 配置为准，缺省 `un-`，如 `un-text`）。新增或修改样式后需要确认规则是否真实生效时必须使用：写前查证 utility 存在、写后 grep 产物 CSS 核验生成。
destructive: false
---

# Nuxt UI 样式编码规则

## 适用范围

本规则适用于本仓库中使用 Nuxt UI、Tailwind CSS 和 UnoCSS 的前端 Vue/Nuxt 代码。

## 规则一：Nuxt UI 组件 —— ui 属性 + tw: 前缀

Nuxt UI 组件样式必须优先通过组件的 `ui` 属性配置。

编写前必须参考 Nuxt UI 官方组件文档、组件 props/slots，或生成的 `.nuxt/ui/<component>.ts`，确认可用的 slot 名、variant、prop 与 class 覆写入口。

Nuxt UI 组件中的 Tailwind CSS class 必须使用 `tw:` 前缀语法写入 `ui` 属性。不要把主要样式散落到外层 `class`，除非该组件没有对应 `ui` slot，或该 `class` 仅用于布局容器。

## 规则二：非 Nuxt UI 组件 —— UnoCSS 属性化取值式

非 Nuxt UI 组件（原生标签、业务组件、第三方组件）必须使用 UnoCSS 属性化（attributify）的**取值式写法**：`前缀="值"`，如 `flex="~"`、`items="center"`、`gap="2"`，并遵循项目既有 UnoCSS 约定。

不要在非 Nuxt UI 组件上使用 `class="flex ..."` 长串工具类、纯属性名写法（`flex items-center`）、`tw:` 前缀或 Nuxt UI 的 `ui` 属性。

## 规则三：属性冲突与属性化前缀

属性化写法的属性名与「组件自身 prop」或「原生 HTML 属性」同名时，直接书写会被当作 prop/属性处理、样式不生效。此时 MUST 加属性化前缀（如 `un-text="..."`）；无冲突属性原样书写。

**前缀以项目配置为准**：确认当前项目 `uno.config` 中 `presetAttributify({ prefix })` 的配置，缺省为 `un-`，不得硬编码假设。

**识别方法**：编写组件样式前先查该组件 props（Nuxt UI 文档 / `.nuxt/ui/<component>.ts` / 组件源码）或原生 HTML 属性清单，同名即冲突。冲突并非某个组件独有，任何组件都可能存在同名 prop。

## 规则四：规则查证与生效验证

仅通过语法检查不代表样式真实生效。凡新增或修改样式写法，都必须走完「查证 → 生成 → 核验」闭环：

1. **写前查证**：无论 `tw:` 前缀 Tailwind 还是 UnoCSS 写法，编写前都必须检查项目的 Tailwind CSS、Nuxt UI theme、UnoCSS presets/shortcuts 是否存在对应规则；不确定的 utility、shortcut、variant 先查 `uno.config`、presets/shortcuts 配置或官方文档。不存在对应规则时不要臆造 class，应先补充配置，或改用项目中已存在的语义 class。
2. **写后验证生成**：构建后 grep 产物 CSS，确认对应选择器规则真实生成；找不到即视为未生效，必须排查。
3. **必要时运行时验证**：dev 模式下检查元素计算样式，确认优先级未被覆盖。

## 正误对照示例

**Nuxt UI 组件**（规则一）：

```vue
<!-- ✅ 正确：tw: 前缀 Tailwind 写入 ui 属性 -->
<UButton :ui="{ root: 'tw:flex tw:items-center tw:gap-2' }"> 提交 </UButton>

<!-- ❌ 错误：主要样式散落到外层 class，且未使用 tw: 前缀 -->
<UButton class="flex items-center gap-2">提交</UButton>
```

**非 Nuxt UI 组件**（规则二）：

```vue
<!-- ✅ 正确：取值式属性化写法 -->
<div flex="~" items="center" gap="2" text="sm gray-500">
  <span class="i-carbon:checkmark" text="green-500" />
  完成
</div>

<!-- ❌ 错误：class 长串工具类 -->
<div class="flex items-center gap-2 text-sm text-gray-500">完成</div>

<!-- ❌ 错误：纯属性名写法（容易与原生属性/组件 prop 冲突） -->
<div flex items-center gap-2 text-sm>完成</div>
```

**属性冲突典型实例：NuxtLink**（规则三，按缺省前缀 `un-` 书写）：

```vue
<!-- ✅ 正确：text 冲突属性加前缀，其余属性原样取值式书写 -->
<NuxtLink to="/" flex="~" items="center" gap="2" un-text="sm gray-500">
  返回首页
</NuxtLink>

<!-- ❌ 错误：裸 text 属性与 NuxtLink prop 冲突，样式不生效 -->
<NuxtLink to="/" flex="~" items="center" gap="2" text="sm gray-500">
  返回首页
</NuxtLink>

<!-- ❌ 错误：class 长串工具类 -->
<NuxtLink to="/" class="flex items-center gap-2 text-sm text-gray-500">
  返回首页
</NuxtLink>
```

## 参考文件

- `references/attribute-conflicts.md`：属性冲突通则、前缀配置确认、识别方法与完整示例（规则三详则）
- `references/rule-verification.md`：查证路径、grep 核验命令、常见失效原因与运行时验证（规则四详则）
