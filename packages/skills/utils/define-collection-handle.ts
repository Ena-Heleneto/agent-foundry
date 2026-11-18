import { defu } from 'defu'

/**
 * 声明集合内容及交付规则；plugin 缺省关闭，为 true 时扫描集合 plugin 目录。
 * script 缺省关闭，支持全部或相对文件选择。
 */
export interface CollectionOption { packageName: string, mcp: boolean, plugin?: boolean, script?: boolean | string | readonly string[], skill: Record<string, { enabled: boolean }> }

/**
 * 使用 defu 合并传入配置与默认配置，传入值优先，插件扫描与脚本交付默认关闭。
 *
 * @param options 集合内容与交付选项。
 * @returns 带默认插件及脚本开关的集合配置。
 */
export function defineCollectionHandle<const T extends CollectionOption>(options: T) {
  return defu(options, { plugin: false, script: false })
}
