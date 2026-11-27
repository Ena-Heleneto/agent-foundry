# nuxt-config

工作区共享 Nuxt 配置预设：`defineNuxtConfig` 属性组装式工厂函数，与 `nuxt/config` 的版本同名、键面兼容，drop-in 替换 import 来源即可接入。

## 接入

```ts
// nuxt.config.ts
import { defineNuxtConfig } from '@foundry/preset-config/nuxt-config'

export default defineNuxtConfig({
  modules: ['@unocss/nuxt'],
})
```

## 默认配置与组装语义

- 默认配置为最小骨架：仅 `compatibilityDate` 一项，**不预置任何模块与其他键**，避免侵入应用配置。
- 组装规则（`defu` 合并：对象深合并、数组拼接，传入优先）：
  - 传入属性与默认配置同名：**覆盖**默认
  - 默认配置中存在的键传入 `false`：从结果中**移除**该默认项
  - `false` 对非默认键按普通配置值原样保留（如 `ssr: false`）

覆盖示例（`apps/playground/nuxt.config.ts`：应用以 `'latest'` 覆盖默认的 `compatibilityDate`，并自由注册模块栈）：

```ts
import { defineNuxtConfig } from '@foundry/preset-config/nuxt-config'

export default defineNuxtConfig({
  modules: ['@unocss/nuxt', '@nuxt/ui'],
  compatibilityDate: 'latest',
})
```

移除默认项的示例：

```ts
export default defineNuxtConfig({
  compatibilityDate: false, // 移除默认的 compatibilityDate
})
```

## 适用边界

- `nuxt` 为 peerDependencies（子包另以 devDependencies 声明供自身类型检查），消费方必须自行安装 Nuxt。
- 入参值类型放宽为 `unknown`（Nuxt schema 类型过大，逐键映射会触发 TS2589），键名仍提供完整提示。
- 公共模块沉淀：待多个 Nuxt 应用落地并确认共性后，再演进默认配置，届时同步更新本文档与契约。
