import type { Plugin } from 'vite'
import { lstatSync } from 'node:fs'
import { cp, readFile, stat } from 'node:fs/promises'
import { join, posix } from 'node:path'
import { parse } from 'yaml'
import { scanSkills } from '#build/utils/scan-skills'

/**
 * 映射使用小写字母、数字及内部连字符作为技能名和目录段。
 */
const identifier = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u

/**
 * 同一次扫描选中且通过安装名校验的技能。
 */
type SelectedSkills = Awaited<ReturnType<typeof scanSkills>>

/**
 * 读取技能正文声明及本包附件引用，取得安装选择使用的名称。
 */
async function readSkillName(source: string): Promise<string> {
  if (lstatSync(join(source, '.foundry-source'), { throwIfNoEntry: false }))
    throw new Error(`正式技能预占 .foundry-source：${source}`)
  /**
   * 读取正文开头的 YAML 元数据，文件内容随后原样交付。
   */
  const body = await readFile(join(source, 'SKILL.md'), 'utf8')
  /**
   * 正文声明的名称可与目录名不同。
   */
  const header = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(body)?.[1]
  /**
   * YAML 名称进入公开映射前须符合标识符语法。
   */
  const metadata: { name?: unknown } | null = header ? parse(header) : null
  if (typeof metadata?.name !== 'string' || !identifier.test(metadata.name))
    throw new Error(`SKILL.md 缺少合法的技能名称：${source}`)

  /**
   * 仅核对同一技能附件目录中的 Markdown 链接。
   */
  const references = body.matchAll(/\]\((?:<((?:\.\/)?(?:references|assets|scripts)\/[^>\r\n]+)>|((?:\.\/)?(?:references|assets|scripts)\/[^\s)]+))(?:[ \t]+["'][^)\r\n]*["'])?\)/gu)
  for (const [, quoted, plain] of references) {
    /**
     * 忽略文档锚点，再解析链接使用的路径编码。
     */
    const target = posix.normalize(decodeURIComponent((quoted || plain || '').split(/[?#]/u)[0] || ''))
    if (posix.isAbsolute(target) || target === '..' || target.startsWith('../')
      || !(await stat(join(source, target)).catch(() => undefined))?.isFile()) {
      throw new Error(`正式技能缺少引用附件：${join(source, target)}`)
    }
  }
  return metadata.name
}

/**
 * 生成同一批技能的安装映射，并拒绝重复的名称、未知依赖和环。
 */
async function createSkillMap(skills: SelectedSkills): Promise<string> {
  if (!skills.length)
    throw new Error('正式构建没有启用的技能')
  /**
   * 每行来自扫描结果和对应正文，集合名称取自配置的 packageName。
   */
  const rows = await Promise.all(skills.map(async ({ source, name: directory, collection, config }) => {
    if (!identifier.test(collection) || !identifier.test(directory))
      throw new Error(`正式技能目录名无效：${collection}/${directory}`)
    /**
     * 声明名标识选择项和依赖。
     */
    const name = await readSkillName(source)
    /**
     * 依赖取自本次扫描已读取的技能配置。
     */
    const requiresSkills = config.requiresSkills === undefined ? [] : config.requiresSkills
    if (!Array.isArray(requiresSkills) || requiresSkills.some(dep => typeof dep !== 'string' || !identifier.test(dep)))
      throw new Error(`正式技能依赖须为合法声明名数组：${name}`)
    return { name, collection, directory, requiresSkills: [...new Set<string>(requiresSkills)].sort() }
  }))
  /**
   * 每个公开声明名在所有参与发布的集合中唯一。
   */
  const byName = new Map(rows.map(row => [row.name, row]))
  if (byName.size !== rows.length)
    throw new Error('正式技能声明名存在冲突')
  /**
   * 记录当前依赖分支与已核对的名称，识别有向环。
   */
  const active = new Set<string>()
  /**
   * 免除对已经核对的依赖重复遍历。
   */
  const complete = new Set<string>()

  /**
   * 沿依赖声明查找本次一起发布的技能。
   */
  function visit(name: string): void {
    if (complete.has(name))
      return
    if (active.has(name))
      throw new Error(`正式技能存在循环依赖：${name}`)
    /**
     * 缺少映射条目的依赖无法随本次归档安装。
     */
    const row = byName.get(name)
    if (!row)
      throw new Error(`正式技能引用未知技能依赖：${name}`)
    active.add(name)
    row.requiresSkills.forEach(visit)
    active.delete(name)
    complete.add(name)
  }

  /**
   * 保持映射顺序固定，无依赖以短横线表示。
   */
  const lines = ['# foundry-skills 1']
  for (const { name, collection, directory, requiresSkills } of rows.toSorted((a, b) => a.name.localeCompare(b.name, 'en'))) {
    visit(name)
    lines.push([name, collection, posix.join('skill', collection, directory), directory, requiresSkills.join(',') || '-'].join('\t'))
  }
  return `${lines.join('\n')}\n`
}

/**
 * 在构建开始时按小写比较技能安装目录名，输出阶段复制已校验的技能内容。
 * 发布模式将参与发布的集合与安装材料写入 dist。
 *
 * @returns 技能构建插件。
 */
export default function vitePluginSkill(): Plugin {
  const virtualId = 'virtual:skill'
  const resolvedId = `\0${virtualId}`
  /**
   * 同一次构建扫描并通过校验的技能列表，供输出阶段复制。
   */
  let selectedSkills: SelectedSkills = []

  return {
    name: 'vite-plugin-skill',
    apply: 'build',

    /**
     * 报告缺配置的集合，并在清理输出目录前拒绝安装名的同名和大小写冲突。
     */
    async buildStart() {
      /**
       * 本次启用且具备正文的技能，由复制插件统一报告缺配置的集合。
       */
      const skills = await scanSkills(this.environment.config.mode, undefined, {
        onMissingConfig: configurationPath => this.warn(`缺少集合配置 ${configurationPath}，已跳过该集合`),
      })
      /**
       * 安装器使用技能末级目录名，按其小写形式记录首次出现的来源。
       */
      const sourcesByName = new Map<string, string>()
      for (const { name, source } of skills) {
        /**
         * 仅用于查重的安装名，复制仍使用技能的原始目录名。
         */
        const normalizedName = name.toLowerCase()
        /**
         * 安装名按小写比较时先前对应的技能源路径。
         */
        const previousSource = sourcesByName.get(normalizedName)
        if (previousSource !== undefined)
          this.error(`安装目录 .agents/skills/${name} 存在同名技能（安装名按小写比较）\n${previousSource}\n${source}`)

        sourcesByName.set(normalizedName, source)
      }
      selectedSkills = skills
    },

    resolveId(id) {
      if (id === virtualId)
        return resolvedId
    },

    load(id) {
      if (id === resolvedId)
        return 'export {}'
    },

    /**
     * 移除虚拟入口，发布构建同时写出本次选择的技能映射及说明许可。
     */
    async generateBundle(_options, bundle) {
      Object.entries(bundle).forEach(([fileName, output]) => {
        if (output.type === 'chunk' && output.isEntry && output.facadeModuleId === resolvedId) {
          delete bundle[fileName]

          if (output.sourcemapFileName)
            delete bundle[output.sourcemapFileName]
        }
      })
      if (this.environment.config.mode !== 'release')
        return

      this.emitFile({ type: 'asset', fileName: 'curl/skills.tsv', source: await createSkillMap(selectedSkills) })
      /**
       * 说明和许可取自本次构建使用的技能包和仓库。
       */
      const { root } = this.environment.config
      for (const [fileName, sourcePath] of Object.entries({
        'README.md': join(root, 'README.md'),
        'LICENSE': join(root, '../../LICENSE'),
        'NOTICE': join(root, 'NOTICE'),
      })) {
        /**
         * NOTICE 随仓库已有材料交付，说明和许可必须存在。
         */
        const info = lstatSync(sourcePath, { throwIfNoEntry: false })
        if (!info && fileName === 'NOTICE')
          continue
        if (!info?.isFile() || info.nlink !== 1)
          this.error(`正式材料需要独立的普通文件：${sourcePath}`)
        this.emitFile({ type: 'asset', fileName, source: await readFile(sourcePath) })
      }
    },

    /**
     * 将已选中的技能正文及附件复制到当次构建输出。
     */
    async writeBundle() {
      await Promise.all(selectedSkills.map(({ source, target }) => cp(source, target, { recursive: true })))
    },
    closeBundle() {},
  }
}
