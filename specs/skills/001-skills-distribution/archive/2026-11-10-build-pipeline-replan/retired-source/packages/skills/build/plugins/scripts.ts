import type { Plugin, ResolvedConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 将运行脚本与依赖声明原样复制到 dist/script，不导入、执行或打包脚本。
 */
export class SkillsScriptsPlugin implements Plugin {
  /**
   * Vite 插件标识。
   */
  name = 'foundry-skills-scripts'

  /**
   * 包根下的脚本源目录。
   */
  private source = ''

  /**
   * 本插件独占维护的生成脚本目录。
   */
  private output = ''

  /**
   * 按实际构建根目录定位源码和产物，兼容实际包与临时构建。
   * @param config Vite 解析后的配置。
   */
  configResolved = (config: ResolvedConfig): void => {
    this.source = path.resolve(config.root, 'script')
    this.output = path.resolve(config.root, config.build.outDir, 'script')
  }

  /**
   * 保留全部运行文件，排除测试、缓存和本机安装的依赖。
   * @param source 当前待复制的源路径。
   * @returns 是否交付当前条目。
   */
  private include = (source: string): boolean => {
    /**
     * 当前目录或文件名，用于排除开发专用条目。
     */
    const name = path.basename(source)
    return !['__pycache__', 'node_modules'].includes(name) && !name.startsWith('test-')
  }

  /**
   * 只复制运行目录；缺少脚本源时构建失败，依赖由运行阶段准备。
   */
  writeBundle = (): void => {
    if (!fs.statSync(this.source).isDirectory())
      throw new Error(`脚本源目录不可用：${this.source}`)
    fs.rmSync(this.output, { recursive: true, force: true })
    fs.cpSync(this.source, this.output, { recursive: true, filter: this.include })
  }
}
