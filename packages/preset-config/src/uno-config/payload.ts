import type { Preset, SourceCodeTransformer, UserConfig } from 'unocss'
import type { UnoConfigOverrides } from './index'
import { appendTo, listNamesOf, mergeIntoConfig, removeNamed, replaceNamed } from '../utils/config-executor'
import { buildDefaults } from './default'

/**
 * 函数形态载荷中的操作柄五件套（契约见 contracts/api.md）：
 * `merge` 并 / `remove` 删 / `append` 增 / `replacePreset` 换 / `listNames` 查，
 * 全部就地作用于当次调用的工作配置（即载荷中的 `defaults`）。
 */
export interface UnoConfigExecutor {
  /** 对当前工作配置做对象形态等价合并（数组替换版 defu + `false` 移除）。 */
  merge: (partial: UnoConfigOverrides) => void
  /** 从 presets 与 transformers 中移除 name 匹配项；均无匹配时抛错（附全部可用 name 清单）。 */
  remove: (name: string) => void
  /** 追加项：含 `transform` 函数的判为 transformer 并归入 transformers，否则判为 preset 归入 presets。 */
  append: (...items: Array<Preset | SourceCodeTransformer>) => void
  /** 以 `factory()` 产物原位替换 name 匹配的默认 preset；无匹配抛错（附可用 preset name 清单）。 */
  replacePreset: (name: string, factory: () => Preset) => void
  /** 返回当前 presets 与 transformers 的 name 清单（调试用）。 */
  listNames: () => { presets: string[], transformers: string[] }
}

/**
 * 函数形态工厂收到的载荷：完整默认配置（`defaults`，本地字体处理器 cwd 已就地解析）
 * 与操作柄五件套（`executor`）；工厂回调就地操作后返回 `defaults` 即完成定制。
 */
export interface UnoConfigPayload {
  defaults: UserConfig
  executor: UnoConfigExecutor
}

/**
 * `defineUnoConfig` 函数形态的入参类型：接收载荷、返回最终配置，
 * 返回值直接交给 UnoCSS `defineConfig`（工厂不额外包裹校验）。
 */
export type UnoConfigFactory = (payload: UnoConfigPayload) => UserConfig

/**
 * uno-config 函数形态的载荷构建器。
 *
 * 默认配置由 `./default` 模块的 `buildDefaults()` 组装（含本地字体处理器 cwd 的
 * 调用栈就地求值）；本 class 负责以 `src/utils/config-executor` 的公共操作装配
 * uno-config 专属 executor 五件套，并组合为载荷。
 * 实例随单次 `defineUnoConfig` 调用创建、函数返回后即弃，无跨调用状态。
 */
export class UnoConfigPayloadBuilder {
  /**
   * 对工作配置做对象形态等价合并（数组替换版 defu + `false` 移除），就地修改。
   *
   * @param working 当次调用的工作配置。
   * @param partial 覆写配置；值可以是同类型配置或 `false`。
   */
  private merge(working: UserConfig, partial: UnoConfigOverrides): void {
    mergeIntoConfig(working, partial as Record<string, unknown>)
  }

  /**
   * 从工作配置的 presets 与 transformers 中移除 name 匹配项，就地修改。
   *
   * @param working 当次调用的工作配置。
   * @param name 目标项的 name。
   * @throws 两处均无匹配时抛错，错误信息附全部可用 name 清单。
   */
  private remove(working: UserConfig, name: string): void {
    // UserConfig.presets 类型允许工厂/Promise/嵌套数组，本预设默认集恒为 Preset 实例，此处收窄
    const presets = (working.presets ?? []) as Preset[]
    if (presets.some(item => item.name === name)) {
      working.presets = removeNamed(presets, name)
      return
    }
    const transformers = working.transformers ?? []
    if (transformers.some(item => item.name === name)) {
      working.transformers = removeNamed(transformers, name)
      return
    }
    throw new Error(`[defineUnoConfig] 未找到 name 为 "${name}" 的 preset 或 transformer。可用 name：${[...listNamesOf(presets), ...listNamesOf(transformers)].join(', ')}`)
  }

  /**
   * 向工作配置追加若干项：含 `transform` 函数的判为 transformer 归入 transformers，
   * 否则判为 preset 归入 presets，就地修改。
   *
   * @param working 当次调用的工作配置。
   * @param items 待追加的 preset 或 transformer 实例。
   */
  private append(working: UserConfig, ...items: Array<Preset | SourceCodeTransformer>): void {
    for (const item of items) {
      if (typeof (item as SourceCodeTransformer).transform === 'function')
        working.transformers = appendTo(working.transformers ?? [], item as SourceCodeTransformer)
      else
        working.presets = appendTo((working.presets ?? []) as Preset[], item as Preset)
    }
  }

  /**
   * 以 `factory()` 产物原位替换工作配置中 name 匹配的默认 preset，就地修改。
   *
   * @param working 当次调用的工作配置。
   * @param name 目标 preset 的 name。
   * @param factory 产出替换项的工厂函数。
   * @throws 无匹配项时抛错，错误信息附可用 preset name 清单。
   */
  private replacePreset(working: UserConfig, name: string, factory: () => Preset): void {
    working.presets = replaceNamed((working.presets ?? []) as Preset[], name, factory())
  }

  /**
   * 返回工作配置当前 presets 与 transformers 的 name 清单（调试用）。
   *
   * @param working 当次调用的工作配置。
   * @returns 两组 name 清单。
   */
  private listNames(working: UserConfig): { presets: string[], transformers: string[] } {
    return {
      presets: listNamesOf((working.presets ?? []) as Preset[]),
      transformers: listNamesOf(working.transformers ?? []),
    }
  }

  /**
   * 基于工作配置组装 executor 五件套：将本 class 的五个操作方法绑定到 `working`，
   * 所有操作就地修改 `working`，使工厂回调 `return defaults` 即可拿到定制结果。
   *
   * @param working 当次调用的工作配置（载荷中的 `defaults`）。
   * @returns 装配好的 executor。
   */
  buildExecutor(working: UserConfig): UnoConfigExecutor {
    return {
      merge: partial => this.merge(working, partial),
      remove: name => this.remove(working, name),
      append: (...items) => this.append(working, ...items),
      replacePreset: (name, factory) => this.replacePreset(working, name, factory),
      listNames: () => this.listNames(working),
    }
  }

  /**
   * 构建函数形态载荷：完整默认配置 + 就地作用于该配置的 executor。
   *
   * @returns `{ defaults, executor }` 载荷。
   */
  build(): UnoConfigPayload {
    const defaults = buildDefaults()
    return { defaults, executor: this.buildExecutor(defaults) }
  }
}
