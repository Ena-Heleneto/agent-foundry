import type { NuxtConfig } from 'nuxt/config'
import { defu } from 'defu'

/**
 * 工作区共享 Nuxt 默认配置（最小骨架）。
 *
 * 仅固定 `compatibilityDate`，不预置任何模块与其他键，避免侵入应用配置。
 */
const defaults = {
  compatibilityDate: '2025-07-15',
} satisfies NuxtConfig

/**
 * `defineNuxtConfig` 的入参类型：键与 `NuxtConfig` 一致（提供键名提示），
 * 值类型放宽为 `unknown`（Nuxt schema 类型过大，逐键映射会触发 TS2589），
 * 任何属性允许传 `false`，用于显式移除同名的默认配置项。
 */
export type NuxtConfigOverrides = Partial<Record<keyof NuxtConfig, unknown>>

/**
 * 组装工作区共享 Nuxt 配置。
 *
 * 组装规则：默认配置与传入属性合并（`defu` 语义：对象深合并、数组拼接，传入优先）；
 * 传入属性与默认配置同名时覆盖默认；传入属性值为 `false` 且该键存在于默认配置时，
 * 从结果中移除该默认项（`false` 对非默认键按普通配置值原样保留）。
 *
 * @param config 应用传入的属性配置，缺省时返回纯默认配置。
 * @returns 组装后的 Nuxt 配置。
 */
export function defineNuxtConfig(config: NuxtConfigOverrides = {}): NuxtConfig {
  const removals = new Set(
    Object.entries(config)
      .filter(([key, value]) => value === false && key in defaults)
      .map(([key]) => key),
  )
  const passthrough = Object.fromEntries(
    Object.entries(config).filter(([key]) => !removals.has(key)),
  )
  const assembled = defu(passthrough, defaults as Record<string, unknown>) as NuxtConfig
  for (const key of removals) {
    delete (assembled as Record<string, unknown>)[key]
  }
  return assembled
}
