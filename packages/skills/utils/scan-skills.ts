import type { CollectionOption } from '#utils/define-collection-handle'
import { globSync, lstatSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/**
 * 限定集合及技能名称为单个目录名，避免配置改变输出位置。
 *
 * @param name 配置声明的名称。
 * @param label 用于定位配置字段的说明。
 * @throws 名称为空、包含路径或驱动器前缀时直接报错。
 */
function assertDirectoryName(name: unknown, label: string): asserts name is string {
  if (typeof name !== 'string' || !name || name === '.' || name === '..' || /[/\\]/.test(name) || name.includes('\0') || /^[a-z]:/i.test(name))
    throw new Error(`${label} 必须是单个目录名：${JSON.stringify(name)}`)
}

/**
 * 递归检查实际交付的技能，不允许正文或附件包含软链接。
 *
 * @param path 技能目录、正文或附件的实际路径。
 * @throws 遇到软链接时携带其路径终止扫描，不跟随链接。
 */
function assertSkillFiles(path: string): void {
  /**
   * lstat 保留链接本身的身份，包括目标已不存在的链接。
   */
  const stats = lstatSync(path)
  if (stats.isSymbolicLink())
    throw new Error(`技能源不能包含软链接：${path}`)
  if (stats.isDirectory()) {
    /**
     * 按名称检查目录内容，稳定定位首个不允许交付的路径。
     */
    const names = readdirSync(path).sort()
    for (const name of names)
      assertSkillFiles(join(path, name))
  }
}

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
 * 扫描启用技能并拒绝异常目录名及软链接，返回可交付清单。
 *
 * @param sourceDir 集合来源目录，默认使用当前包的 src。
 * @returns 包含集合、名称、源目录、目标目录及原技能配置的清单。
 * @throws 启用项的名称非法或实际交付内容含软链接时报错。
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
      .filter(([, { enabled }]) => enabled)
      .flatMap(([name, config]) => {
        assertDirectoryName(name, `${directory}/collection.config.ts 的技能名`)
        /**
         * 名称通过校验后才拼接源目录，不接受跨集合路径别名。
         */
        const source = join(directory, name)
        if (lstatSync(source, { throwIfNoEntry: false })?.isSymbolicLink())
          throw new Error(`技能源不能包含软链接：${source}`)
        if (!availableSkills.has(source))
          return []

        assertDirectoryName(packageName, `${directory}/collection.config.ts 的 packageName`)
        assertSkillFiles(source)
        return [{
          collection: packageName,
          name,
          source,
          target: join('dist', 'skill', packageName, name),
          config,
        }]
      }))
}
