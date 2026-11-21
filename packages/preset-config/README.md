# @foundry/preset-config

ENA Foundry 工作区共享预设配置库（ESLint / TSConfig / UnoCSS / Nuxt）。消费方经 package exports 引用，禁止相对路径穿透。

## 预设清单

| 预设          | 引用路径                                             | 形态           | 适用场景                                    |
| ------------- | ---------------------------------------------------- | -------------- | ------------------------------------------- |
| eslint-config | `@foundry/preset-config/eslint-config`               | 代码型（JS）   | 全部包与应用：统一 ESLint flat config 基线  |
| tsconfig-json | `@foundry/preset-config/tsconfig-json/tsconfig.json` | 数据型（JSON） | 仅 `packages/*` 库包：严格 ESM 类型基线     |
| uno-config    | `@foundry/preset-config/uno-config`                  | 代码型（JS）   | 前端应用：UnoCSS 常用全量集（含属性化写法） |
| nuxt-config   | `@foundry/preset-config/nuxt-config`                 | 代码型（JS）   | Nuxt 应用：`defineNuxtConfig` 包装器        |

各预设的接入与扩展示例见其目录内 README；真实消费示例见 `apps/playground` 与子包自举 `tsconfig.json`。

## 依赖三级声明策略

- **dependencies**：构成预设内容的插件（如 ESLint 插件、UnoCSS 预设包），随子包安装。
- **devDependencies**：子包自身构建与检查使用（vite、typescript、eslint 等）；`nuxt` 另以 dev 声明供自身 `check-types` 解析类型。
- **peerDependencies**：由消费方场景决定的重型依赖（`nuxt`），消费方安装阶段即暴露缺失，纯 Node 包不被迫安装。

## 新增预设约定（零配置改动）

- **代码型预设**：在 `src/<预设>/` 新建 `index.ts` 即自动成为构建入口（`build/handle/resolveEntries.handle.ts` 按目录扫描），无需修改 `vite.config.ts`。
- **数据型预设**：在 `src/<预设>/` 放置 `.json` 文件，构建期由 `build/plugin/copyJsonAssets.plugin.ts` 复制到 `dist/<预设>/`，经 exports 通用映射 `"./*.json": "./dist/*.json"` 对外解析，无需新增 exports 条目。
- 新预设需同步：目录内中文 README（用途 / 接入示例 / 扩展示例）、本清单、契约文档。

## 验证

```bash
pnpm --filter @foundry/preset-config run build        # 构建（含 JSON 复制）
pnpm --filter @foundry/preset-config run check-types  # 自举继承 tsconfig-json 预设
pnpm --filter @foundry/preset-config run lint         # 自举使用 eslint-config 预设
```
