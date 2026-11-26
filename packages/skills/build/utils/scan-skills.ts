import type { CollectionMode, CollectionOption } from '#utils/define-collection-handle'
import { lstatSync, readdirSync } from 'node:fs'
import { join, posix } from 'node:path'
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
 * 集合扫描使用的配置类型与缺配置回调。
 */
interface CollectionScanOptions {
  skipNonRegularConfig?: boolean
  onMissingConfig?: (configurationPath: string) => void
}

/**
 * 在扫描前拒绝技能包不支持的 Vite mode。
 *
 * @param mode Vite 当前提供的模式。
 */
function assertCollectionMode(mode: string): asserts mode is CollectionMode {
  if (mode !== 'development' && mode !== 'release' && mode !== 'production')
    throw new Error(`不支持的技能构建模式：${JSON.stringify(mode)}；可选 development、release、production`)
}

/**
 * 使用显式集合开关；缺省时兼容旧配置的发布范围。
 *
 * @param config 当前集合配置。
 * @param mode 已验证的构建模式。
 * @param configurationPath 用于定位异常启用配置的文件路径。
 * @returns 当前模式是否纳入该集合。
 */
function isCollectionEnabled(config: CollectionOption, mode: CollectionMode, configurationPath: string): boolean {
  if (config.enabled === undefined)
    return mode === 'development' || config.publish === true

  /**
   * 在每次扫描时求值，不缓存上一次构建的集合开关。
   */
  const enabled = typeof config.enabled === 'function' ? config.enabled(mode) : config.enabled
  if (typeof enabled !== 'boolean')
    throw new TypeError(`${configurationPath} 的集合 enabled 必须返回或声明布尔值`)
  return enabled
}

/**
 * 按目录读取集合配置，并按当次 Vite mode 过滤集合。
 *
 * @param mode Vite 当次实际构建模式。
 * @param sourceDir 集合来源目录。
 * @param options 集合配置读取选项。
 * @param options.skipNonRegularConfig 是否跳过路径存在但类型为目录或软链接等的配置。
 * @param options.onMissingConfig 发现缺失配置时收到对应的文件路径。
 * @returns 各集合的源目录和配置。
 */
export async function scanCollections(
  mode: string,
  sourceDir: string,
  { skipNonRegularConfig = true, onMissingConfig }: CollectionScanOptions = {},
) {
  assertCollectionMode(mode)
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
    /**
     * 检查配置路径是否存在，保留已有配置的文件类型。
     */
    const configuration = lstatSync(configurationPath, { throwIfNoEntry: false })
    if (!configuration) {
      onMissingConfig?.(configurationPath)
      return
    }
    if (skipNonRegularConfig && !configuration.isFile())
      return

    /**
     * 集合模块默认导出的配置。
     */
    const { default: config }: { default: CollectionOption } = await import(pathToFileURL(configurationPath).href)
    if (!isCollectionEnabled(config, mode, configurationPath))
      return
    return { directory, config }
  }))

  return collections.filter(collection => collection !== undefined)
}

/**
 * 扫描启用技能并拒绝异常目录名及软链接，返回可交付清单。
 *
 * @param mode Vite 当次实际构建模式。
 * @param sourceDir 集合来源目录，默认使用当前包的 src。
 * @param options 缺配置回调。
 * @returns 包含集合、名称、源目录、包内相对路径及原技能配置的清单。
 * @throws 配置导入失败、启用项名称非法或实际交付内容含软链接时报错。
 */
export async function scanSkills(
  mode: string,
  sourceDir = join(process.cwd(), 'src'),
  options: Omit<CollectionScanOptions, 'skipNonRegularConfig'> = {},
) {
  /**
   * 根据当前构建范围读取集合配置，再扫描其中启用的技能。
   */
  const collections = await scanCollections(mode, sourceDir, { ...options, skipNonRegularConfig: false })
  return collections.flatMap(({ directory, config: { packageName, skill } }) =>
    Object.entries(skill)
      .filter(([, { enabled }]) => enabled)
      .flatMap(([name, config]) => {
        assertDirectoryName(name, `${directory}/collection.config.ts 的技能名`)
        /**
         * 名称通过校验后才拼接源目录，不接受跨集合路径别名。
         */
        const source = join(directory, name)
        /**
         * 拒绝技能目录软链接，只在普通目录中查找技能正文。
         */
        const sourceInfo = lstatSync(source, { throwIfNoEntry: false })
        if (sourceInfo?.isSymbolicLink())
          throw new Error(`技能源不能包含软链接：${source}`)
        if (!sourceInfo?.isDirectory() || !lstatSync(join(source, 'SKILL.md'), { throwIfNoEntry: false }))
          return []

        assertDirectoryName(packageName, `${directory}/collection.config.ts 的 packageName`)
        assertSkillFiles(source)
        return [{
          collection: packageName,
          name,
          source,
          relativeTarget: posix.join('skill', packageName, name),
          config,
        }]
      }))
}
