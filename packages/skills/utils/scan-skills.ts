import type { CollectionOption } from '#utils/define-collection-handle'
import { globSync, lstatSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/**
 * 按目录名顺序读取一级集合的配置。
 *
 * @param sourceDir 集合来源目录。
 * @param options 配置读取选项，默认跳过没有普通配置文件的集合。
 * @param options.requireConfig 是否要求每个集合的配置均可导入。
 * @returns 各集合的源目录和配置。
 */
export async function scanCollections(sourceDir: string, { requireConfig = false } = {}) {
  /**
   * 仅枚举普通集合目录，并按名称排序。
   */
  const names = readdirSync(sourceDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

  /**
   * 并行读取集合配置，保持目录的扫描顺序。
   */
  const collections = await Promise.all(names.map(async (name) => {
    /**
     * 集合的实际源目录，可与配置声明的包名不同。
     */
    const directory = join(sourceDir, name)
    /**
     * 集合顶层的 TypeScript 配置文件。
     */
    const configurationPath = join(directory, 'collection.config.ts')
    if (!requireConfig && !lstatSync(configurationPath, { throwIfNoEntry: false })?.isFile())
      return

    /**
     * 集合模块默认导出的配置。
     */
    const { default: config }: { default: CollectionOption } = await import(pathToFileURL(configurationPath).href)
    return { directory, config }
  }))

  return collections.filter(collection => collection !== undefined)
}

/**
 * 扫描集合配置与技能正文，返回实际可交付的启用技能。
 *
 * @param sourceDir 集合来源目录，默认使用当前包的 src。
 * @returns 包含集合、名称、源目录、目标目录及原技能配置的清单。
 */
export async function scanSkills(sourceDir = join(process.cwd(), 'src')) {
  /**
   * 仅将包含 SKILL.md 的二级目录视为可交付技能。
   */
  const availableSkills = new Set(globSync('*/*/SKILL.md', { cwd: sourceDir })
    .map(file => dirname(join(sourceDir, file))),
  )
  /**
   * 技能交付要求一级集合目录提供配置。
   */
  const collections = await scanCollections(sourceDir, { requireConfig: true })
  return collections.flatMap(({ directory, config: { packageName, skill } }) =>
    Object.entries(skill)
      .filter(([name, { enabled }]) => enabled && availableSkills.has(join(directory, name)))
      .map(([name, config]) => ({
        collection: packageName,
        name,
        source: join(directory, name),
        target: join('dist', 'skill', packageName, name),
        config,
      })))
}
