import type { Plugin, ResolvedConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 根据src一级集合创建输出目录，文件内容由其他插件交付。
 *
 * @returns 仅在构建时生效的目录插件。
 */
export default function createDirectoriesPlugin(): Plugin {
  /**
   * Vite解析后的包根路径和构建选项。
   */
  let config: ResolvedConfig
  /**
   * 当前构建发现的集合目录名。
   */
  let collections: string[] = []
  /**
   * 不参与集合发现的依赖、版本库和缓存条目。
   */
  const excluded = new Set(['node_modules', '.git', '.gitkeep', '__pycache__', '.cache', '.DS_Store'])

  /**
   * 发现src一级集合并校验来源路径，不读取集合配置或技能附件。
   */
  function scanCollections(): void {
    /**
     * 当前包存放集合源码的根目录。
     */
    const source = path.join(config.root, 'src')
    /**
     * 源码根路径自身的文件状态，用于识别缺失目录和链接。
     */
    const sourceStat = fs.lstatSync(source, { throwIfNoEntry: false })
    if (!sourceStat?.isDirectory() || sourceStat.isSymbolicLink())
      throw new Error(`集合来源目录缺失或为链接：${source}`)
    /**
     * 一级来源名称的小写索引，用于发现跨平台大小写冲突。
     */
    const names = new Set<string>()
    collections = []
    /**
     * 逐项核验一级来源，排除项和普通文件不进入集合名单。
     */
    for (const name of fs.readdirSync(source).sort()) {
      if (excluded.has(name))
        continue
      /**
       * 当前一级来源条目的绝对路径。
       */
      const location = path.join(source, name)
      /**
       * 来源条目自身的文件状态，用于拒绝链接和特殊文件。
       */
      const stat = fs.lstatSync(location)
      if (stat.isSymbolicLink())
        throw new Error(`集合来源不允许链接：${location}`)
      if (/[\\:]/u.test(name) || (!stat.isDirectory() && !stat.isFile()))
        throw new Error(`集合来源路径或类型非法：${location}`)
      if (names.has(name.toLowerCase()))
        throw new Error(`集合来源存在大小写冲突：${location}`)
      names.add(name.toLowerCase())
      if (!stat.isDirectory())
        continue
      if (name.toLowerCase() === 'mcp')
        throw new Error(`集合名称冲突：mcp为保留输出目录：${location}`)
      collections.push(name)
    }
  }

  /**
   * 拒绝输出树内的链接，防止保留旧产物时写入包外路径。
   *
   * @param directory 待检查的输出目录。
   */
  function rejectOutputLinks(directory: string): void {
    if (!fs.existsSync(directory))
      return
    /**
     * 当前目录的直接子项，递归时只进入普通目录。
     */
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink())
        throw new Error(`输出目录包含链接：${path.join(directory, entry.name)}`)
      if (entry.isDirectory())
        rejectOutputLinks(path.join(directory, entry.name))
    }
  }

  /**
   * 将目录写入范围限制在包根dist，提前拒绝链接和普通文件占用。
   *
   * @returns 已验证的dist绝对路径。
   */
  function validateOutput(): string {
    /**
     * 根据最终构建选项解析的输出根目录。
     */
    const output = path.resolve(config.root, config.build.outDir)
    if (output !== path.resolve(config.root, 'dist'))
      throw new Error(`集合输出目录必须为包根dist：${output}`)
    /**
     * 当前待检查的路径，从输出根逐级检查到文件系统根。
     */
    let current = output
    while (true) {
      /**
       * 当前路径自身的文件状态，缺失目录允许随后创建。
       */
      const stat = fs.lstatSync(current, { throwIfNoEntry: false })
      if (stat && (!stat.isDirectory() || stat.isSymbolicLink()))
        throw new Error(`集合输出路径含链接或普通文件：${current}`)
      if (path.dirname(current) === current)
        break
      current = path.dirname(current)
    }
    rejectOutputLinks(output)
    /**
     * 本插件负责的目标目录，须在构建清理前确认没有文件占用。
     */
    for (const name of [...collections, 'mcp']) {
      /**
       * 待创建或复用的集合目录路径。
       */
      const location = path.join(output, name)
      /**
       * 目标路径当前的文件状态，用于拒绝普通文件和链接。
       */
      const stat = fs.lstatSync(location, { throwIfNoEntry: false })
      if (stat && (!stat.isDirectory() || stat.isSymbolicLink()))
        throw new Error(`集合输出目录被文件或链接占用：${location}`)
    }
    return output
  }

  /**
   * 刷新集合名单并完成清理前校验，保留失败时的已有产物。
   */
  function prepareDirectories(): void {
    scanCollections()
    validateOutput()
  }

  /**
   * 接收最终构建配置，在Vite清理旧产物前验证读写路径。
   *
   * @param resolved Vite最终解析的配置。
   */
  function resolveConfig(resolved: ResolvedConfig): void {
    config = resolved
    prepareDirectories()
  }

  /**
   * 在writeBundle阶段补齐空目录，避免被清理且遵守write=false。
   */
  function writeDirectories(): void {
    /**
     * 写入前重新验证的输出根目录。
     */
    const output = validateOutput()
    /**
     * 本轮集合及预留MCP目录，已存在时保留其中的文件。
     */
    for (const name of [...collections, 'mcp'])
      fs.mkdirSync(path.join(output, name), { recursive: true })
  }

  return {
    name: 'foundry:create-directories',
    apply: 'build',
    configResolved: resolveConfig,
    buildStart: prepareDirectories,
    writeBundle: writeDirectories,
  }
}
