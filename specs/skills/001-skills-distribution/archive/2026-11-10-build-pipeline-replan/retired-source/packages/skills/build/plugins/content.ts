import type { Plugin, ResolvedConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 同一次构建复制两个内容源；只处理文件交付，不解释 MCP 内容范围。
 */
export class SkillsContentPlugin implements Plugin {
  /**
   * Vite 插件标识。
   */
  name = 'foundry-skills-content'

  /**
   * 驱动 Vite 构建生命周期的内部入口，不作为交付文件。
   */
  static readonly entry = 'virtual:skills-content'

  /**
   * 当前包的 src 目录。
   */
  private source = ''

  /**
   * 统一构建输出目录。
   */
  private output = ''

  /**
   * 固定本次交付的两类内容源。
   */
  private directories = ['mcp', 'skills']

  /**
   * 根据实际构建根目录定位源码和输出。
   * @param config Vite 解析后的配置。
   */
  configResolved = (config: ResolvedConfig): void => {
    this.source = path.resolve(config.root, 'src')
    this.output = path.resolve(config.root, config.build.outDir)
  }

  /**
   * 在生成产物前检查源目录，避免配置遗漏被当成空内容。
   */
  buildStart = (): void => {
    /**
     * 当前必须存在的内容源目录名称。
     */
    for (const directory of this.directories) {
      if (!fs.statSync(path.join(this.source, directory)).isDirectory())
        throw new Error(`内容源目录不可用：${directory}`)
    }
  }

  /**
   * 解析内部构建入口。
   * @param id 待解析的模块标识。
   * @returns 匹配的虚拟入口，其他模块交给 Vite。
   */
  resolveId = (id: string): string | undefined => id === SkillsContentPlugin.entry ? id : undefined

  /**
   * 提供无业务代码的内部入口。
   * @param id 待加载的模块标识。
   * @returns 虚拟模块正文或 undefined。
   */
  load = (id: string): string | undefined => id === SkillsContentPlugin.entry ? 'export {}' : undefined

  /**
   * 去除内部驱动入口，dist 只交付内容与安装脚本。
   * @param _options 当前输出选项。
   * @param bundle 本次待输出文件集合。
   */
  generateBundle: Plugin['generateBundle'] = (_options, bundle) => {
    delete bundle['index.js']
  }

  /**
   * Git 空目录占位文件不作为内容交付。
   * @param source 当前待复制路径。
   * @returns 是否保留当前文件。
   */
  private include = (source: string): boolean => path.basename(source) !== '.gitkeep'

  /**
   * 按原目录和字节复制所有内容及附件，空 MCP 源仍生成空输出目录。
   */
  writeBundle = (): void => {
    /**
     * 当前源与产物共用的分类名称。
     */
    for (const directory of this.directories) {
      fs.cpSync(path.join(this.source, directory), path.join(this.output, directory), { recursive: true, filter: this.include })
    }
  }
}
