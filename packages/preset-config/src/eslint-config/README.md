# eslint-config

工作区统一 ESLint 共享预设（flat config），基于 `@antfu/eslint-config`，预置 `unocss`、`formatters`、`pnpm`、`antislop` 等能力。

## 接入

在消费方新建 `eslint.config.ts`：

```ts
import defineEslintHandler from '@foundry/preset-config/eslint-config'

export default defineEslintHandler()
```

并在 `package.json` 声明依赖：

```json
{
  "dependencies": {
    "@foundry/preset-config": "workspace:*"
  },
  "devDependencies": {
    "eslint": "catalog:dev"
  }
}
```

## 扩展

`defineEslintHandler(_next)` 接受一个返回 flat config 的函数，其返回内容经 `.append()` 追加在共享基线**之后**：与基线冲突时以追加内容为准，基线其余规则不受影响。

Nuxt 应用的真实用法（见 `apps/playground/eslint.config.ts`）：配合 `@nuxt/eslint` 模块（`standalone: false`），将其生成的配置整体追加：

```ts
import defineEslintHandler from '@foundry/preset-config/eslint-config'
// @nuxt/eslint（standalone: false）生成的扁平配置，作为 _next 追加在共享基线之后
import nuxt from './.nuxt/eslint.config.mjs'

export default defineEslintHandler(nuxt)
```

追加单条规则覆盖的形态：

```ts
import defineEslintHandler from '@foundry/preset-config/eslint-config'

export default defineEslintHandler(() => ({
  rules: {
    'no-console': 'off',
  },
}))
```

## 适用边界

- 适用于工作区内全部包与应用；纯 Node 包同样可用（基线不含前端强制依赖之外的运行时要求）。
- 预设实现冻结：调整基线规则需演进本预设本身，不建议消费方大面积覆盖。
