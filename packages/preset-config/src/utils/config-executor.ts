import { defuReplaceArray } from './defu-replace-array'

/**
 * 携带可选 `name` 字段的具名配置项形状。
 *
 * UnoCSS 的 `Preset` / `SourceCodeTransformer` 以及今后 nuxt-config 侧的具名配置项
 * 均天然满足该形状；本模块按此抽象实现具名项增删换查，不耦合任何具体生态类型。
 */
export interface NamedConfigItem {
  name?: string
}

/**
 * 列出具名项的 `name` 清单，供调试核对与错误信息使用。
 *
 * @param items 具名项数组。
 * @returns name 清单；未携带 name 的项以 `(anonymous)` 占位。
 */
export function listNamesOf(items: readonly NamedConfigItem[]): string[] {
  return items.map(item => item.name ?? '(anonymous)')
}

/**
 * 移除 `name` 匹配的具名项。
 *
 * @param items 具名项数组。
 * @param name 目标项的 name。
 * @returns 移除后的新数组。
 * @throws 无匹配项时抛错，错误信息附当前可用 name 清单（尽早暴露拼写错误）。
 */
export function removeNamed<T extends NamedConfigItem>(items: readonly T[], name: string): T[] {
  const index = items.findIndex(item => item.name === name)
  if (index === -1)
    throw new Error(`未找到 name 为 "${name}" 的配置项。可用 name：${listNamesOf(items).join(', ')}`)

  return [...items.slice(0, index), ...items.slice(index + 1)]
}

/**
 * 向具名项数组末尾追加若干项。
 *
 * @param items 原数组。
 * @param additions 待追加的项。
 * @returns 追加后的新数组。
 */
export function appendTo<T>(items: readonly T[], ...additions: T[]): T[] {
  return [...items, ...additions]
}

/**
 * 以 `replacement` 原位替换 `name` 匹配的具名项（保持数组位置不变）。
 *
 * @param items 具名项数组。
 * @param name 目标项的 name。
 * @param replacement 替换后的新项。
 * @returns 替换后的新数组。
 * @throws 无匹配项时抛错，错误信息附当前可用 name 清单。
 */
export function replaceNamed<T extends NamedConfigItem>(items: readonly T[], name: string, replacement: T): T[] {
  const index = items.findIndex(item => item.name === name)
  if (index === -1)
    throw new Error(`未找到 name 为 "${name}" 的配置项。可用 name：${listNamesOf(items).join(', ')}`)

  return items.map((item, i) => i === index ? replacement : item)
}

/**
 * 将覆写配置合并进目标配置（原地修改并返回目标）。
 *
 * 合并语义为「数组替换版 defu」（普通对象递归合并、数组整体替换、同名叶子覆写值优先）；
 * 覆写值为 `false` 且该键存在于目标时，从目标中移除该键（`false` 对目标不存在的键按未传处理）。
 * uno-config 的对象形态与函数形态 executor 的 `merge` 共用本入口。
 *
 * @param target 目标配置（通常是完整默认配置），会被原地修改。
 * @param overrides 覆写配置；值可以是同类型配置或 `false`。
 * @returns 合并后的目标配置。
 */
export function mergeIntoConfig<T extends object>(target: T, overrides: Record<string, unknown>): T {
  const targetRecord = target as Record<string, unknown>
  const removals = new Set(
    Object.entries(overrides)
      .filter(([key, value]) => value === false && key in targetRecord)
      .map(([key]) => key),
  )
  const passthrough = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== false),
  )
  const merged = defuReplaceArray(passthrough, targetRecord) as Record<string, unknown>

  for (const key of removals) {
    delete merged[key]
    delete targetRecord[key]
  }
  Object.assign(targetRecord, merged)

  return target
}
