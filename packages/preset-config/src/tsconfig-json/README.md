# tsconfig-json

面向 `packages/*` 库包的 TypeScript 共享预设：严格 ESM 基线 `compilerOptions`。

## 接入

在库包的 `tsconfig.json` 中继承：

```json
{
  "extends": "@foundry/preset-config/tsconfig-json/tsconfig.json",
  "include": ["**/*.ts"]
}
```

## 基线内容

- 模块：`"module": "ESNext"`、`"moduleResolution": "Bundler"`、`"verbatimModuleSyntax": true`
- 严格：`"strict": true`，配套 `noUncheckedIndexedAccess`、`noImplicitOverride`
- 目标：`"target": "ESNext"`、`"lib": ["ESNext"]`、`"types": []`（类型按需由消费方声明，如 `"types": ["node"]`）
- 其他：`skipLibCheck`、`isolatedModules`、`noEmit`、`resolveJsonModule`、`esModuleInterop`、`forceConsistentCasingInFileNames`

真实自举示例见 `packages/preset-config/tsconfig.json`：继承本预设后叠加 `"types": ["node"]` 并覆盖 `include`。

## 扩展（按需叠加）

在继承基础上覆盖 `compilerOptions` 或 `include`，与 `packages/preset-config/tsconfig.json` 自举用法一致：

```json
{
  "extends": "@foundry/preset-config/tsconfig-json/tsconfig.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["*.ts", "src/**/*.ts"]
}
```

## 适用边界

- **仅供 `packages/*` 库包继承**；Nuxt 应用使用 Nuxt 自带的 TS 配置（`.nuxt/tsconfig.*.json` + 根 `tsconfig.json` references），不继承本预设。
- 数据型预设：经构建期复制到 `dist/` 分发，无 JS 产物，消费方无需额外构建配置。
