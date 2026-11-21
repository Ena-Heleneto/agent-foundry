import type { Plugin, ResolvedConfig } from 'vite'
import type { ContentSnapshot } from '../distribution/export.js'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { snapshotContent } from '../distribution/export.js'
import { verifySource } from '../distribution/source.js'

/**
 * 单一内容插件在输出清理前核验完整源，通过 Vite 资产接口原字节交付。
 */
export class SkillsContentPlugin implements Plugin {
  /**
   * 内部驱动入口只触发生命周期，不进入公开文件。
   */
  static readonly entry = 'virtual:skills-content'

  /**
   * 独立紧急工程的唯一内容构建标识。
   */
  name = 'urgent-skills-content'

  /**
   * 配置解析时固定的正式来源快照。
   */
  private snapshot: ContentSnapshot | undefined

  /**
   * 同次配置解析得到的实际包根，只在当前插件实例中使用。
   */
  private sourceRoot = ''

  /**
   * 类型保持实际定义的 Vite hook，不把 undefined 赋给必需类成员。
   */
  generateBundle: NonNullable<Plugin['generateBundle']>

  /**
   * 将类内来源状态和 Vite 提供的 emitFile 上下文分别保留。
   */
  constructor() {
    /**
     * 资产 hook 的 this 属于 Vite，通过闭包读取类状态。
     */
    const readSnapshot = (): ContentSnapshot | undefined => this.snapshot
    /**
     * 保留真实包根，避免在Vite上下文中猜测cwd。
     */
    const readSourceRoot = (): string => this.sourceRoot
    this.generateBundle = function (_options, bundle) {
      /**
       * 当前构建固定的完整内容，禁止依赖 Vite 的 this 保存业务状态。
       */
      const snapshot = readSnapshot()
      if (!snapshot)
        throw new Error('缺少本次已核验的内容快照')
      verifySource(readSourceRoot(), snapshot.source)
      /**
       * 所有内部虚拟入口产物均不得进入公开 payload。
       */
      for (const file of Object.keys(bundle))
        delete bundle[file]
      /**
       * 逐项交付本次固定字节，write=false 仍由 Vite 阻止落盘。
       */
      for (const [fileName, encoded] of Object.entries(snapshot.files))
        this.emitFile({ type: 'asset', fileName, source: Buffer.from(encoded, 'base64') })
      this.emitFile({ type: 'asset', fileName: 'release.json', source: `${JSON.stringify(snapshot.manifest, null, 2)}\n` })
    }
  }

  /**
   * 来源核验发生在任何输出目录清理前，并阻止输出覆盖源码或工程根。
   * @param config Vite 解析后的实际根与输出设置。
   */
  configResolved = (config: ResolvedConfig): void => {
    /**
     * 输出规范化后不能等于根或覆盖正式来源目录。
     */
    const output = path.resolve(config.root, config.build.outDir)
    if (output === config.root || config.root.startsWith(`${output}${path.sep}`) || ['src', 'script', 'build', 'tests', '.git'].some(directory => output === path.join(config.root, directory) || output.startsWith(`${path.join(config.root, directory)}${path.sep}`)))
      throw new Error('构建输出不能覆盖独立工程或正式来源')
    this.sourceRoot = config.root
    this.snapshot = snapshotContent(config.root)
  }

  /**
   * 解析唯一虚拟入口，其他模块交给 Vite。
   * @param id 当前模块标识。
   * @returns 驱动入口或 undefined。
   */
  resolveId = (id: string): string | undefined => id === SkillsContentPlugin.entry ? id : undefined

  /**
   * 虚拟入口不含业务行为或运行脚本。
   * @param id 当前模块标识。
   * @returns 空模块或 undefined。
   */
  load = (id: string): string | undefined => id === SkillsContentPlugin.entry ? 'export {}' : undefined
}
