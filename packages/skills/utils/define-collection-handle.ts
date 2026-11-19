import { defu } from 'defu'

/**
 * 声明单个工作流事件的提示词及可选执行参数。
 * 同一技能的不同事件各自维护提示词、启用状态、可选性、优先级和条件。
 */
export interface SkillHookOption {
  prompt: string
  enabled?: boolean
  optional?: boolean
  priority?: number
  condition?: string | null
}

/**
 * 声明技能是否交付，以及按事件组织的 hook 和独立命令名称。
 * 未声明 hook 或 command 的技能仅交付内容，挂载材料由集合子插件消费生成。
 */
export interface CollectionSkillOption {
  enabled: boolean
  hook?: Record<string, SkillHookOption>
  command?: string
}

/**
 * 声明集合内容及交付规则；plugin 缺省关闭，为 true 时扫描集合 plugin 目录。
 * script 缺省关闭，支持全部或相对文件选择；skill 保存启用和可选挂载声明。
 */
export interface CollectionOption {
  packageName: string
  mcp: boolean
  plugin?: boolean
  script?: boolean | string | readonly string[]
  skill: Record<string, CollectionSkillOption>
}

/**
 * 使用 defu 合并传入配置与默认配置，传入值优先，插件扫描与脚本交付默认关闭。
 *
 * @param options 集合内容与交付选项。
 * @returns 带默认插件及脚本开关的集合配置。
 */
export function defineCollectionHandle<const T extends CollectionOption>(options: T) {
  return defu(options, { plugin: false, script: false })
}
