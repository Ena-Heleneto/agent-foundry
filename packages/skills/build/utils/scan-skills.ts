import type { CollectionOption } from '#utils/define-collection-handle'
import { globSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/**
 * 读取集合配置，保留启用技能及集合对应的输出目录。
 */
async function parseCollectionOption(dir: string) {
  /**
   * 将集合配置路径转换为动态导入使用的文件 URL。
   */
  const configurationUrl = pathToFileURL(join(dir, 'collection.config.ts')).href
  /**
   * 集合配置模块提供包名与技能启用状态。
   */
  const collectionModule: { default: CollectionOption } = await import(configurationUrl)
  /**
   * 集合名和技能配置共同决定本次候选内容。
   */
  const { packageName, skill } = collectionModule.default
  /**
   * 启用技能保留名称及其源目录路径。
   */
  const enabledSkills = Object.entries(skill)
    .filter(([, option]) => option.enabled)
    .map(([name]) => ({ name, url: join(dir, name) }))
  return { collection: packageName, enabledSkills, url: join('dist', 'skill', packageName) }
}

/**
 * 扫描集合配置与技能正文，返回实际可交付的启用技能。
 *
 * @param sourceDir 集合来源目录，默认使用当前包的 src。
 * @returns 包含集合、名称、源目录及目标目录的技能清单。
 */
export async function scanSkills(sourceDir = join(process.cwd(), 'src')) {
  /**
   * 一级集合目录排除符号链接，并按名称保持原有扫描顺序。
   */
  const entity = readdirSync(sourceDir, { withFileTypes: true })
    .filter(entry => !entry.isSymbolicLink())
    .filter(entry => entry.isDirectory())
    .map(entry => ({ name: entry.name, path: join(sourceDir, entry.name) }))
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)

  /**
   * 仅将包含 SKILL.md 的二级目录视为可交付技能。
   */
  const availableSkills = new Set(globSync('*/*/SKILL.md', { cwd: sourceDir })
    .map(file => dirname(join(sourceDir, file))),
  )
  /**
   * 并行读取集合配置，结果顺序仍对应排序后的集合目录。
   */
  const collections = await Promise.all(entity.map(({ path }) => parseCollectionOption(path)))
  return collections.flatMap(({ collection, enabledSkills, url }) =>
    enabledSkills
      .filter(skill => availableSkills.has(skill.url))
      .map(skill => ({ collection, name: skill.name, source: skill.url, target: join(url, skill.name) })))
}
