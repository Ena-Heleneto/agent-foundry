import type { Release, ReleaseFile, SkillCategory } from './models.js'
import type { SourceSnapshot } from './source.js'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { publicSkills } from './models.js'
import { analyzeReferences } from './references.js'
import { captureSource, verifySource } from './source.js'
import { parseRelease } from './validate.js'
import { assertOutputPath, digest, readFiles, verifyCandidate } from './verify.js'

/**
 * 正式技能及全部原始附件，用于引用检查和原字节投影。
 */
export interface CatalogSkill {
  name: string
  category: SkillCategory
  directory: string
  files: Record<string, string>
}

/**
 * 完整内容清单保持旧消费者字段，范围仅 identity。
 */
export type ContentManifest = Release

/**
 * 可选断言只能核对实际源码身份，不能覆盖实际 package 或 Git。
 */
export interface ContentExportOptions {
  categories: string[]
  version: string
  sourceRevision: string
}

/**
 * 构建清理前冻结清单与逐文件原始字节。
 */
export interface ContentSnapshot {
  manifest: ContentManifest
  files: Record<string, string>
  source: SourceSnapshot
}

/**
 * 核验 YAML 正式身份、描述和正文，目录名称不得替代 frontmatter。
 * @param encoded SKILL.md 原始字节。
 * @param expected 明确清单中的正式名称。
 */
function checkFrontmatter(encoded: string | undefined, expected: string): void {
  /**
   * 仅最前方完整 frontmatter 才是技能声明。
   */
  const match = Buffer.from(encoded ?? '', 'base64').toString('utf8').match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/u)
  if (!match?.[1] || !match[2]?.trim())
    throw new Error(`技能正文或元数据缺失：${expected}`)
  /**
   * YAML 结果先按 unknown 收窄，禁止转换或默认名称。
   */
  const metadata: unknown = parse(match[1])
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || !('name' in metadata) || metadata.name !== expected || !('description' in metadata) || typeof metadata.description !== 'string' || !metadata.description.trim())
    throw new Error(`技能身份或描述不符：${expected}`)
}

/**
 * 读取明确九项及附件，拒绝额外集合、技能、大小写冲突和链接。
 * @param root 正式 src 根。
 * @param categories 必须与全部公开分类一致。
 * @returns 明确技能的完整字节。
 */
export function readCatalog(root: string, categories: string[] = Object.keys(publicSkills)): CatalogSkill[] {
  if (JSON.stringify([...categories].sort()) !== JSON.stringify(Object.keys(publicSkills).sort()))
    throw new Error('紧急构建必须明确包含全部公开分类')
  /**
   * 完整读取同时检查每层链接、特殊文件和大小写冲突。
   */
  const source = readFiles(root)
  if (JSON.stringify(fs.readdirSync(root).sort()) !== JSON.stringify(Object.keys(publicSkills).sort()))
    throw new Error('未知公开集合目录')
  /**
   * 所有来源文件均须被已批准技能或集中配置拥有。
   */
  for (const file of Object.keys(source)) {
    /**
     * 集合与技能名按照路径原字节匹配。
     */
    const [category, name] = file.split('/')
    if (!category || !Object.hasOwn(publicSkills, category) || !name || (name !== 'collection.config.json' && !publicSkills[category as SkillCategory].includes(name)))
      throw new Error(`未知公开技能源路径：${file}`)
  }
  /**
   * 将来源与正式身份一起返回，不丢弃任何技能内附件。
   */
  const catalog: CatalogSkill[] = []
  /**
   * 遍历显式分类声明而非磁盘发现结果。
   */
  for (const [category, names] of Object.entries(publicSkills)) {
    if (JSON.stringify(fs.readdirSync(path.join(root, category)).sort()) !== JSON.stringify([...names, 'collection.config.json'].sort()))
      throw new Error(`未知公开技能源或集中配置缺失：${category}`)
    /**
     * 每个已获准技能均必须存在正式入口。
     */
    for (const name of names) {
      /**
       * 对应技能内相对路径与原始字节。
       */
      const files = readFiles(path.join(root, category, name))
      checkFrontmatter(files['SKILL.md'], name)
      catalog.push({ name, category: category as SkillCategory, directory: path.join(root, category, name), files })
    }
  }
  return catalog.sort((left, right) => Buffer.compare(Buffer.from(left.name), Buffer.from(right.name)))
}

/**
 * 按原字节生成固定字段顺序的文件声明。
 * @param file 发布根相对路径。
 * @param encoded 原始 base64 字节。
 * @returns 路径、长度与小写摘要。
 */
function describe(file: string, encoded: string): ReleaseFile {
  /**
   * 不解码为文本，保证二进制附件与换行原样保留。
   */
  const data = Buffer.from(encoded, 'base64')
  return { path: file, bytes: data.length, sha256: digest(data) }
}

/**
 * 从同版集中配置读取当前所选定义，并拒绝扩大公开集合。
 * @param root 独立工程根。
 * @param category 本次明确公开分类。
 * @returns 原始配置字节及带 hook 的技能名称。
 */
function readCollection(root: string, category: SkillCategory): { encoded: string, hooks: Set<string> } {
  /**
   * 文件组件先经过完整 src 读取检查，无外部链接可用。
   */
  const encoded = fs.readFileSync(path.join(root, 'src', category, 'collection.config.json')).toString('base64')
  /**
   * 不可信配置先缩窄再访问 skill 映射。
   */
  const config: unknown = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
  if (!config || typeof config !== 'object' || !('mcp' in config) || config.mcp !== false || !('skill' in config) || !config.skill || typeof config.skill !== 'object' || Array.isArray(config.skill))
    throw new Error(`集中配置非法：${category}`)
  if (JSON.stringify(Object.keys(config.skill).sort()) !== JSON.stringify([...publicSkills[category]].sort()))
    throw new Error(`集中配置与公开清单不符：${category}`)
  /**
   * mountMappingIds 反映同版配置声明，不要求旧技能目录附件。
   */
  const hooks = new Set<string>()
  /**
   * 每项只解析真实 hook 定义，临时官方输入留到运行时生成。
   */
  for (const [name, definition] of Object.entries(config.skill)) {
    if (!definition || typeof definition !== 'object' || Array.isArray(definition))
      throw new Error(`技能集中配置非法：${name}`)
    if ('hook' in definition) {
      if (!definition.hook || typeof definition.hook !== 'object' || Array.isArray(definition.hook) || Object.hasOwn(definition.hook, 'after_increment'))
        throw new Error(`技能 hook 定义非法：${name}`)
      hooks.add(name)
    }
  }
  return { encoded, hooks }
}

/**
 * 复制同版集中定义并返回实际声明hook的技能集合。
 * @param root 当前包根。
 * @param files 本次公开原始字节表。
 * @returns 带hook的正式技能名。
 */
function copyCollections(root: string, files: Record<string, string>): Set<string> {
  /**
   * 各分类 hook 声明保留实际来源。
   */
  const hookNames = new Set<string>()
  /**
   * 全部三个过滤集中配置均作为必要公共脚本材料。
   */
  for (const category of Object.keys(publicSkills) as SkillCategory[]) {
    /**
     * 同版配置原字节与所声明的 hook 名。
     */
    const collection = readCollection(root, category)
    files[`script/config/${category}/collection.config.json`] = collection.encoded
    /**
     * 同版配置声明的每个 hook 名只记录一次。
     */
    for (const name of collection.hooks)
      hookNames.add(name)
  }
  return hookNames
}

/**
 * 将完整技能及附件投影为原字节identity格式。
 * @param catalog 本次明确技能集合。
 * @param files 本次公开字节表。
 * @param hookNames 同版集中定义的hook身份。
 * @returns 技能清单和安装投影。
 */
function projectSkills(catalog: CatalogSkill[], files: Record<string, string>, hookNames: Set<string>): Pick<Release, 'skills' | 'projections'> {
  /**
   * 安装投影保持原始正文和全部附件。
   */
  const projections: Release['projections'] = { identity: {} }
  /**
   * 所有技能均出自相同来源树，依赖不会自动补选。
   */
  const skills: Release['skills'] = []
  /**
   * 每个技能同时执行真实附件引用检查。
   */
  for (const skill of catalog) {
    /**
     * 确认的公开路径由分类与正式 name 组成。
     */
    const directory = `skills/${skill.category}/${skill.name}`
    /**
     * 保留每个附件原字节。
     */
    for (const [file, encoded] of Object.entries(skill.files))
      files[`${directory}/${file}`] = encoded
    /**
     * 真实本地引用分类与目标项目已有材料分开记录。
     */
    const references = analyzeReferences(skill, catalog)
    if (skill.name === 'task-increment')
      references.requiresSkills = [...new Set([...references.requiresSkills, 'artifact-spec-analysis', 'implementation-preparation'])].sort()
    projections.identity[skill.name] = Object.keys(skill.files).sort().map(file => ({ ...describe(file, skill.files[file]!), sourcePath: `${directory}/${file}` }))
    skills.push({ name: skill.name, category: skill.category, directory, sourceFiles: Object.keys(skill.files).map(file => `${directory}/${file}`).sort(), installedFilesByProjection: { identity: Object.keys(skill.files).sort() }, ...references, mountMappingIds: skill.name === 'task-increment' ? ['increment'] : hookNames.has(skill.name) ? [skill.name] : [] })
  }
  return { skills, projections }
}

/**
 * 读取并核验完整运行脚本，只复制字节，不执行模块。
 * @param root 当前包根。
 * @param files 本次公开字节表。
 */
function copyScripts(root: string, files: Record<string, string>): void {
  /**
   * 脚本只读字节，排除测试与缓存，不导入或执行模块。
   */
  const scripts = readFiles(path.join(root, 'script'), { official: false, exclude: ['node_modules', '__pycache__'], excludePrefix: 'test-' })
  /**
   * 同名配置不能由 script 源中的过期副本遮盖正式集合来源。
   */
  for (const [file, encoded] of Object.entries(scripts)) {
    if (file.split('/').at(-1)?.toLowerCase() === 'skill.md')
      throw new Error(`脚本目录不能包含额外公开技能：${file}`)
    if (file.startsWith('config/'))
      throw new Error('集中配置只能来自正式 src 集合，不能包含 script/config 副本')
    files[`script/${file}`] = encoded
  }
  /**
   * 紧急运行链所需模块不能缺件。
   */
  for (const file of ['index.mjs', 'install-skills/read-agents.mjs', ...['install-skills', 'mount-entry', 'register-hooks', 'register-commands'].map(name => `${name}/${name}.sh`)]) {
    if (!Object.hasOwn(scripts, file))
      throw new Error(`缺少声明的运行脚本：script/${file}`)
  }
}

/**
 * 核验真实说明和许可，拒绝空白、缺失或链接材料。
 * @param root 当前包根。
 * @param files 本次公开字节表。
 */
function copyMaterials(root: string, files: Record<string, string>): void {
  /**
   * 基础说明与实际许可是完整内容材料的先决条件。
   */
  for (const file of ['README.md', 'LICENSE']) {
    /**
     * 先使用普通文件检查，禁止读取链接目标。
     */
    const absolute = assertOutputPath(root, file)
    if (!fs.lstatSync(absolute, { throwIfNoEntry: false })?.isFile())
      throw new Error(`缺少真实材料：${file}`)
    /**
     * 不生成占位文本或推测许可证。
     */
    const data = fs.readFileSync(absolute)
    if (!data.toString('utf8').trim())
      throw new Error(`公开材料为空：${file}`)
    files[file] = data.toString('base64')
  }
}

/**
 * 逐项绑定公开字节与同次固定的Git源码，不能以新身份承载旧读取结果。
 * @param files 当前公开字节表。
 * @param source 当前固定的真实来源。
 */
function verifyPayloadSource(files: Record<string, string>, source: SourceSnapshot): void {
  /**
   * 来源闭包已有固定摘要，只比较同一声明对应的原字节。
   */
  const inputs = new Map(source.inputFiles.map(file => [file.path, file]))
  for (const [file, encoded] of Object.entries(files)) {
    /**
     * 公开布局与源码布局之间只有已声明的技能和配置映射。
     */
    const relative = file.startsWith('skills/') ? `src/${file.slice('skills/'.length)}` : file.startsWith('script/config/') ? `src/${file.slice('script/config/'.length)}` : file
    /**
     * 根包不加冗余点路径，嵌套包使用真实Git根前缀。
     */
    const sourcePath = source.sourcePackagePath === '.' ? relative : `${source.sourcePackagePath}/${relative}`
    /**
     * 公开文件摘要独立来自本次读出的实际字节。
     */
    const actual = describe(sourcePath, encoded)
    /**
     * 缺少索引或摘要不一致均不能继续输出。
     */
    const expected = inputs.get(sourcePath)
    if (!expected || expected.bytes !== actual.bytes || expected.sha256 !== actual.sha256)
      throw new Error(`公开来源字节与固定输入不一致：${sourcePath}`)
  }
}

/**
 * 清理输出前固定全部合法源字节及真实Git输入身份。
 * @param root 实际包根，可以是Git根内嵌套目录。
 * @param options 同实际身份一致的可选断言。
 * @returns 原始公开字节及只用于本地的来源证据。
 */
export function snapshotContent(root: string, options?: ContentExportOptions): ContentSnapshot {
  /**
   * 正文及附件路径安全先于任何输出副作用。
   */
  const catalog = readCatalog(path.join(root, 'src'), options?.categories)
  /**
   * 基础公开材料检查先保留原缺件错误语义。
   */
  const files: Record<string, string> = Object.create(null)
  copyMaterials(root, files)
  /**
   * 原始来源先固定，再在所有内容读取后重新核对。
   */
  const identity = captureSource(root)
  if (options && (options.version !== identity.version || options.sourceRevision !== identity.source.sourceRevision))
    throw new Error('显式版本或源码提交与实际来源不一致')
  /**
   * 集中配置与投影共用本次固定公开字节表。
   */
  const hookNames = copyCollections(root, files)
  /**
   * 正式技能及附件按同版配置声明记录挂载身份。
   */
  const projected = projectSkills(catalog, files, hookNames)
  copyScripts(root, files)
  verifyPayloadSource(files, identity.source)
  verifySource(root, identity.source)
  /**
   * 发布文件按UTF-8路径字节稳定排序。
   */
  const fileTable = Object.keys(files).sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))).map(file => describe(file, files[file]!))
  /**
   * 私有source不扩充schema，只将真实版本与提交放入公开字段。
   */
  const manifest = parseRelease({ schemaVersion: 1, version: identity.version, sourceRevision: identity.source.sourceRevision, tools: { skills: 'latest', specify: '1.2.6', node: '>=22.20.0', npm: '11.19.1', bash: '>=3.2', powershell: '>=7.4' }, files: fileTable, ...projected, adapters: fileTable.filter(file => file.path.startsWith('script/')) })
  return { manifest, files, source: identity.source }
}

/**
 * 供内部沙箱调用的精确材料化入口，只接收已冻结同次快照。
 * @param output 自有输出根，必须为空。
 * @param snapshot 正式来源快照。
 */
export function exportContent(output: string, snapshot: ContentSnapshot): void {
  if (fs.existsSync(output) && Object.keys(readFiles(output, { official: false })).length)
    throw new Error('材料化要求空输出目录')
  fs.mkdirSync(output, { recursive: true })
  /**
   * 每个输出组件在写入前检查路径边界与链接。
   */
  for (const [file, encoded] of Object.entries(snapshot.files)) {
    /**
     * 本次同源文件的实际目标。
     */
    const destination = assertOutputPath(output, file)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, Buffer.from(encoded, 'base64'))
  }
  fs.writeFileSync(assertOutputPath(output, 'release.json'), `${JSON.stringify(snapshot.manifest, null, 2)}\n`)
  verifyCandidate(output, { version: snapshot.manifest.version, sourceRevision: snapshot.manifest.sourceRevision })
}
