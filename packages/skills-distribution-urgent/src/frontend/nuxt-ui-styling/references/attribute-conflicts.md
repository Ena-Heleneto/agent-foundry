# 属性冲突与属性化前缀

## 冲突通则

UnoCSS 属性化（attributify）写法的属性名一旦与「组件自身 prop」或「原生 HTML 属性」同名，直接书写会被框架当作 prop/属性处理，**样式不会生效**。此时 MUST 改用带属性化前缀的形式（如 `<prefix>text="..."`）；无冲突的属性原样书写，不加前缀。

## 前缀以项目配置为准

属性化前缀是可配置项，**不得硬编码假设为 `un-`**。使用前必须确认当前项目 `uno.config` 中 `presetAttributify()` 的配置：

```ts
// uno.config.ts —— 缺省（未传 prefix）时前缀为 `un-`
presetAttributify();

// 若项目显式配置了其它前缀，则以配置为准
presetAttributify({ prefix: "u-" }); // 此时冲突属性写作 `u-text="..."`
```

本文示例均按缺省前缀 `un-` 书写；项目配置不同前缀时，将所有 `un-` 替换为实际前缀。

## 识别方法

为组件编写样式前，先查该组件的 props（Nuxt UI 官方文档、`.nuxt/ui/<component>.ts`、组件源码）或原生 HTML 属性清单；属性名同名即冲突，一律加前缀。不要假设只有某个组件才有此问题——任何组件都可能存在同名 prop。

## 典型实例：NuxtLink

`NuxtLink` 的 `text` prop 与属性化 `text="sm gray-500"` 冲突，必须使用 `un-text`（缺省前缀下）：

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
