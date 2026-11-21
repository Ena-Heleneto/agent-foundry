# uno-config

工作区共享 UnoCSS 预设，导出双形态工厂函数 `defineUnoConfig`：对象形态（增量覆写）与函数形态（完全掌控）。返回值始终为 UnoCSS `defineConfig` 组装结果。

## 默认配置

- presets：`presetWind4()`（原子化工具类）、`presetAttributify()`（属性化取值式写法，工作区样式约定：原生标签一律使用）、`presetIcons({ scale: 1.2 })`、`presetTypography()`、`presetWebFonts()`（DM 系列字体 + `createLocalFontProcessor()` 本地字体处理器，字体文件下载到消费方包目录，见下文「本地字体」）
- transformers：`transformerDirectives()`、`transformerVariantGroup()`
- shortcuts：空

## 本地字体

`presetWebFonts` 经 `createLocalFontProcessor()` 将引用到的 Google Fonts 字体文件本地化：

- 字体产物写入**消费方包目录**下的 `public/assets/fonts/`，样式中的字体 URL 重写为 `/assets/fonts/<文件名>`
- 字体 CSS 缓存写入消费方包目录下的 `node_modules/.cache/unocss/fonts/`
- 消费方目录由预设内部按 `defineUnoConfig` 的调用位置自动解析（即消费方 `uno.config.ts` 所在目录），**消费方无需传入任何路径参数**；解析失败时回退 `process.cwd()`
- 注意构建顺序：字体文件在 Vite 打包 CSS 时才下载，而 Nitro 在此之前已扫描 `public/`。干净环境下首次 `nuxi build` 的 `.output` 可能不含字体，二次构建即正常（字体与缓存会留在包目录中，建议提交 `public/assets/fonts/`）

## 接入

Nuxt 应用两步（见 `apps/playground`）：

```ts
// uno.config.ts
import { defineUnoConfig } from '@foundry/preset-config/uno-config'

export default defineUnoConfig()
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@unocss/nuxt'],
})
```

## 扩展：对象形态（增量覆写）

`overrides` 仅接受 `shortcuts` / `presets` / `transformers` 三个属性，经「数组替换版 defu」与默认配置合并：

| 传入情况                      | 结果                                          |
| ----------------------------- | --------------------------------------------- |
| 键未传入                      | 保持默认                                      |
| 普通对象（如 shortcuts）      | 与默认递归合并，同名叶子以传入值覆盖          |
| 数组（如 presets）            | 整体替换默认数组（追加请用函数形态 `append`） |
| `false`（默认配置中存在的键） | 移除该默认项（`false` 对非默认键按未传处理）  |

真实示例（`apps/playground/uno.config.ts`，构建产物中可验证 `.btn` 规则生效）：

```ts
import { defineUnoConfig } from '@foundry/preset-config/uno-config'

export default defineUnoConfig({
  shortcuts: [
    [
      'btn',
      'px-4 py-1 rounded inline-block bg-teal-600 text-white cursor-pointer hover:bg-teal-700 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50',
    ],
    [
      'icon-btn',
      'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600',
    ],
  ],
})
```

移除某项默认能力的示例：

```ts
export default defineUnoConfig({
  transformers: false, // 移除默认的 directives / variant-group transformer
})
```

## 扩展：函数形态（完全掌控）

传入工厂回调，收到 `{ defaults, executor }` 载荷：`defaults` 为完整默认配置（本地字体处理器 cwd 已就地解析），`executor` 提供五件套操作柄，就地修改 `defaults` 后返回即可：

```ts
import { defineUnoConfig } from '@foundry/preset-config/uno-config'
import { presetIcons } from 'unocss'

export default defineUnoConfig(({ defaults, executor }) => {
  executor.remove('@unocss/preset-web-fonts') // 移除 web-fonts
  executor.append(myPreset()) // 追加自定义 preset（含 transform 函数的项自动归入 transformers）
  executor.replacePreset('@unocss/preset-icons', () =>
    presetIcons({ scale: 1.5 }),) // 原位替换 icons 参数
  executor.merge({ shortcuts: { 'btn-x': 'px-2 py-1 bg-red-500' } }) // 等价对象形态合并
  console.log(executor.listNames()) // { presets: [...], transformers: [...] }，调试核对用
  return defaults
})
```

executor 五件套以预设/transformer 实例的 `name` 字段为匹配键（默认集：`@unocss/preset-wind4`、`@unocss/preset-attributify`、`@unocss/preset-icons`、`@unocss/preset-typography`、`@unocss/preset-web-fonts`、`@unocss/transformer-directives`、`@unocss/transformer-variant-group`）。

## 错误契约

| 场景                              | 行为                                                   |
| --------------------------------- | ------------------------------------------------------ |
| 入参非对象非函数                  | 运行期抛 `TypeError`（类型层已由重载签名排除）         |
| `remove` / `replacePreset` 未匹配 | 抛错，错误信息附当前可用 name 清单（尽早暴露拼写错误） |
| 函数形态返回非配置对象            | 透传 UnoCSS `defineConfig` 既有校验，工厂不额外包裹    |

> `append` 的归位判别基于「transformer 必含 `transform` 函数、preset 不含」的类型约定；若第三方 preset 恰好携带同名属性被误判，改用 `merge({ presets: [...] })` 显式指定目标数组兜底。

## 样式约定关系

- 原生标签与非 Nuxt UI 组件：使用本预设提供的属性化写法（如 `flex`、`text-lg`、`font-bold` 属性）。
- Nuxt UI 组件：样式仍经 `ui` 属性使用 `tw:` 前缀的 Tailwind CSS，本预设不介入。
