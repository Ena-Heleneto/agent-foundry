import type { UserConfig } from 'unocss'
import type { UnoConfigFactory } from './payload'
import { defineConfig } from 'unocss'
import { mergeIntoConfig } from '../utils/config-executor'
import { buildDefaults } from './default'
import { UnoConfigPayloadBuilder } from './payload'

export type { UnoConfigExecutor, UnoConfigFactory, UnoConfigPayload } from './payload'

/**
 * `defineUnoConfig` 对象形态的入参类型：`shortcuts` / `presets` / `transformers` 三项可选，
 * 传配置值时与同名默认配置合并（对象递归、数组整体替换），传 `false` 时移除该默认项。
 */
export type UnoConfigOverrides = {
  [K in 'shortcuts' | 'presets' | 'transformers']?: UserConfig[K] | false
}

/**
 * 组装工作区共享 UnoCSS 配置（对象形态）。
 *
 * 传入属性与完整默认配置经「数组替换版 defu」合并（普通对象递归合并、数组整体替换、
 * 同名叶子以传入值覆盖）；传入属性值为 `false` 且该键存在于默认配置时，移除该默认项。
 *
 * @param overrides 应用传入的属性配置，缺省时返回纯默认配置。
 * @returns 组装后的 UnoCSS 配置。
 */
export function defineUnoConfig(overrides?: UnoConfigOverrides): UserConfig

/**
 * 组装工作区共享 UnoCSS 配置（函数形态）。
 *
 * 工厂回调收到 `{ defaults, executor }` 载荷：`defaults` 为完整默认配置
 * （本地字体处理器 cwd 已就地解析），`executor` 提供 merge / remove / append /
 * replacePreset / listNames 五件套就地操作；回调返回的最终配置交 `defineConfig`。
 *
 * @param factory 接收载荷并返回最终配置的工厂回调。
 * @returns 组装后的 UnoCSS 配置。
 */
export function defineUnoConfig(factory: UnoConfigFactory): UserConfig

/**
 * `defineUnoConfig` 双形态分派实现：函数走载荷回调，对象走合并，其余运行期抛错。
 *
 * @param arg 配置对象或工厂回调。
 * @returns 组装后的 UnoCSS 配置。
 * @throws 入参既非对象也非函数时抛出 TypeError（类型层已由重载排除，此为运行期防御）。
 */
export function defineUnoConfig(arg?: UnoConfigOverrides | UnoConfigFactory): UserConfig {
  if (typeof arg === 'function') {
    const payload = new UnoConfigPayloadBuilder().build()
    return defineConfig(arg(payload))
  }

  if (arg !== undefined && (typeof arg !== 'object' || arg === null || Array.isArray(arg)))
    throw new TypeError('[defineUnoConfig] 入参仅支持配置对象或工厂函数')

  const defaults = buildDefaults()
  return defineConfig(mergeIntoConfig(defaults, (arg ?? {}) as Record<string, unknown>))
}
