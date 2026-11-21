import type { Plugin, ResolvedConfig } from 'vite'
import type { ContentExportOptions, ContentSnapshot } from '../distribution/export.js'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { exportContent, snapshotContent } from '../distribution/export.js'

/**
 * 导出前与独立消费者均使用正式模型校验。
 */
export { parseRelease } from '../distribution/validate.js'
/**
 * 让独立构建消费者复核同一清单对应的实际文件，不另维护校验逻辑。
 */
export { verifyContent } from '../distribution/verify.js'

/**
 * 默认构建生成稳定技能的正式格式开发候选；完整工作流来源仍按原移交核验。
 */
export class SkillsDistributionPlugin implements Plugin {
  /**
   * Vite 插件标识。
   */
  name = 'foundry-skills-distribution'

  /**
   * 等原有内容和脚本复制完成后再核验输出。
   */
  enforce = 'post' as const

  /**
   * 当前真实构建包根。
   */
  private root = ''

  /**
   * 与原有内容插件共用的输出目录。
   */
  private output = ''

  /**
   * 构建前固定的来源快照，避免复制途中内容漂移。
   */
  private snapshot?: ContentSnapshot

  /**
   * 本次显式选择的开发验证范围。
   */
  private readonly selection?: ContentExportOptions
  /**
   * 程序调用显式追加同名插件时覆盖默认选择，不重复生成两份清单。
   */
  private active = true

  /**
   * 不隐式读取旧五模式或补选工作流来源。
   * @param options 已确认的分类、版本与源码提交。
   */
  constructor(options?: ContentExportOptions) {
    this.selection = options
  }

  /**
   * 使用 Vite 解析后的根和输出路径，兼容真实包与隔离构建。
   * @param config 当前构建配置。
   */
  configResolved = (config: ResolvedConfig): void => {
    this.root = config.root
    this.output = path.resolve(config.root, config.build.outDir)
    this.active = config.plugins.filter(plugin => plugin.name === this.name).at(-1) === this
  }

  /**
   * 在写入产物前检查全部声明源，缺件或越界立即失败。
   */
  buildStart = (): void => {
    if (!this.active)
      return
    /**
     * 显式参数供受控验证，默认版本与源码提交由实际构建来源确定。
     */
    const options = this.selection ?? {
      categories: ['coding', 'frontend'],
      version: (JSON.parse(fs.readFileSync(path.join(this.root, 'package.json'), 'utf8')) as { version: string }).version,
      sourceRevision: process.env.FOUNDRY_SOURCE_REVISION || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: this.root, encoding: 'utf8' }).trim(),
    }
    this.snapshot = snapshotContent(this.root, options)
  }

  /**
   * 完成原样复制后校验文件并写开发清单，不调用任何运行脚本。
   */
  writeBundle: Plugin['writeBundle'] = {
    sequential: true,
    order: 'post',
    handler: (): void => {
      if (!this.active)
        return
      if (!this.snapshot)
        throw new Error('内容导出缺少已验证来源快照')
      exportContent(this.output, this.snapshot)
    },
  }
}
