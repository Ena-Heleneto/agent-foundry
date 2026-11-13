import type { ProjectedFile, ProjectionId, Release, SkillCategory } from './models.js'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { projectFiles } from './projection.js'
import { analyzeReferences } from './references.js'
import { parseRelease } from './validate.js'
import { assertOutputPath, digest, readFiles, verifyContent } from './verify.js'

/**
 * MVU-A 已验证的技能目录模型，保留来源位置及完整字节供构建复用。
 */
export interface CatalogSkill {
  name: string
  category: string
  directory: string
  files: Record<string, string>
}

/**
 * 内容构建直接复用正式模型，development 标记当前候选尚未通过完整发布验收。
 */
export type ContentManifest = Release

/**
 * 本次开发导出的显式版本、源码提交和内容分类，不隐式扩展选择。
 */
export interface ContentExportOptions {
  categories: string[]
  version: string
  sourceRevision: string
}

/**
 * 构建前固定源字节及其清单，供同次构建复制后复核。
 */
export interface ContentSnapshot {
  manifest: ContentManifest
  files: Record<string, string>
  copiedFiles: Record<string, string>
}

/**
 * 从元数据读取安全技能身份，沿用 MVU-A 的名称和描述约束。
 * @param yaml 正文起始位置的 YAML。
 * @param directory 用于错误定位的技能目录。
 * @returns frontmatter 声明的安全名称。
 */
function readName(yaml: string, directory: string): string {
  /**
   * 先收窄不可信 YAML 类型，避免隐式转换名称。
   */
  const data: unknown = parse(yaml)
  if (!data || typeof data !== 'object' || Array.isArray(data) || !('name' in data) || typeof data.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(data.name) || !('description' in data) || typeof data.description !== 'string' || !data.description.trim())
    throw new Error(`技能名称或描述非法：${directory}`)
  return data.name
}

/**
 * 读取一个公开分类的普通技能目录，保持正文与附件使用相同来源。
 * @param root 技能源根。
 * @param category 明确选择的公开分类。
 * @returns 尚未检查跨分类重名的完整技能。
 */
function readCategory(root: string, category: string): CatalogSkill[] {
  if (!['coding', 'frontend', 'workflow'].includes(category))
    throw new Error(`不支持的公开分类：${category}`)
  /**
   * 分类本身不能通过链接读取工作区外的内容。
   */
  const categoryPath = path.join(root, category)
  if (!fs.lstatSync(categoryPath).isDirectory())
    throw new Error(`分类必须是普通目录：${category}`)
  return fs.readdirSync(categoryPath, { withFileTypes: true }).map((entry) => {
    if (!entry.isDirectory())
      throw new Error(`分类包含非技能目录：${category}/${entry.name}`)
    /**
     * 原始目录名不代替技能声明身份。
     */
    const directory = path.join(categoryPath, entry.name)
    /**
     * 正文与附件共同读取，不静默遗漏文件。
     */
    const files = readFiles(directory)
    /**
     * 仅读取正文开头的 YAML 与其后非空正文。
     */
    const match = Buffer.from(files['SKILL.md'] ?? '', 'base64').toString('utf8').match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/u)
    if (!match?.[2]?.trim())
      throw new Error(`技能正文或元数据缺失：${directory}`)
    return { name: readName(match[1]!, directory), category, directory, files }
  })
}

/**
 * 从 MVU-A 提取已验证的目录发现逻辑，身份使用 frontmatter name。
 * @param root 含公开分类的技能根目录。
 * @param categories 本次明确选择的分类，默认保持原实验的三个公开分类。
 * @returns 按声明名称稳定排序的技能。
 */
export function readCatalog(root: string, categories = ['coding', 'frontend', 'workflow']): CatalogSkill[] {
  if (!fs.lstatSync(root).isDirectory())
    throw new Error(`技能源根必须是普通目录：${root}`)
  /**
   * 先读取各分类，再统一检查跨分类身份，避免顺序影响冲突判断。
   */
  const skills = [...new Set(categories)].sort().flatMap(category => readCategory(root, category))
  if (new Set(skills.map(skill => skill.name)).size !== skills.length)
    throw new Error('技能名称重复')
  return skills.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)
}

/**
 * 根据原始字节生成交付摘要，顺序由调用方固定。
 * @param file 文件的交付根相对路径。
 * @param encoded 原始 base64 字节。
 * @returns 实际字节长度与摘要。
 */
function describeFile(file: string, encoded: string): { path: string, bytes: number, sha256: string } {
  /**
   * 摘要不经历文本解码或换行转换。
   */
  const data = Buffer.from(encoded, 'base64')
  return { path: file, bytes: data.length, sha256: digest(data) }
}

/**
 * 固定一个技能的两种安装投影，转换后的正文使用非 SKILL.md blob 避免重复发现。
 * @param skill 完整技能源。
 * @param directory 规范化后的公开目录。
 * @param files 可迁移的文件字节表。
 * @returns 两种投影各自的完整安装文件声明。
 */
function describeProjections(skill: CatalogSkill, directory: string, files: Record<string, string>): Record<ProjectionId, ProjectedFile[]> {
  /**
   * 原样投影和固定官方 Eve 转换都复用已经实测的字节算法。
   */
  const projected = { 'identity': skill.files, 'eve-frontmatter-v1': projectFiles(skill.files, 'eve') }
  /**
   * 每种投影分别保存安装相对路径、来源和实际摘要。
   */
  const result = {} as Record<ProjectionId, ProjectedFile[]>
  /**
   * 当前投影标识明确限定为正式模型支持的两种格式。
   */
  for (const id of ['identity', 'eve-frontmatter-v1'] as const) {
    result[id] = Object.keys(projected[id]).sort().map((file) => {
      /**
       * 相同字节直接引用原文件，变换正文另存可核验 blob。
       */
      const encoded = projected[id][file]!
      /**
       * blob 的文件名不满足官方技能发现规则。
       */
      const sourcePath = encoded === skill.files[file] ? `${directory}/${file}` : `projections/${id}/${skill.name}/${file}.blob`
      files[sourcePath] = encoded
      return { ...describeFile(sourcePath, encoded), path: file, sourcePath }
    })
  }
  return result
}

/**
 * 在构建复制前固定选择范围、全部附件、脚本及来源声明。
 * @param root 实际包根目录。
 * @param options 本项明确验证的版本、提交与分类。
 * @returns 稳定清单和原始文件快照，不写源码或产物。
 */
export function snapshotContent(root: string, options: ContentExportOptions): ContentSnapshot {
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/u.test(options.version) || !/^[a-f\d]{40}$/iu.test(options.sourceRevision) || !options.categories.length)
    throw new Error('内容导出需要明确版本、完整源码提交与非空分类选择')
  /**
   * 复用 MVU-A 的已验证目录和完整字节读取逻辑。
   */
  const catalog = readCatalog(path.join(root, 'src/skills'), options.categories)
  /**
   * 对外清单采用正斜线，生成顺序不依赖系统语言环境。
   */
  const files: Record<string, string> = Object.create(null)
  /**
   * 原复制插件应交付的源布局字节，在规范目录写入前先独立核对。
   */
  const copiedFiles: Record<string, string> = Object.create(null)
  /**
   * 实际安装摘要集中在正式投影表。
   */
  const projections: Release['projections'] = { 'identity': {}, 'eve-frontmatter-v1': {} }
  /**
   * 本次开发导出的逐技能范围。
   */
  const skills: ContentManifest['skills'] = []
  /**
   * 为每个已选技能固定正文及完整附件的声明。
   */
  for (const skill of catalog) {
    /**
     * 实际附件、公开依赖和目标项目前提分别记录。
     */
    const references = analyzeReferences(skill, catalog)
    /**
     * 身份来自 frontmatter，目录别名不能影响发布后的安装身份。
     */
    const directory = `skills/${skill.category}/${skill.name}`
    /**
     * 将技能内路径和原始字节映射到产物根的相对路径。
     */
    for (const [file, data] of Object.entries(skill.files)) {
      files[`${directory}/${file}`] = data
      copiedFiles[`skills/${skill.category}/${path.basename(skill.directory)}/${file}`] = data
    }
    /**
     * 当前技能的投影来源全部进入相同交付白名单。
     */
    const installed = describeProjections(skill, directory, files)
    projections.identity[skill.name] = installed.identity
    projections['eve-frontmatter-v1'][skill.name] = installed['eve-frontmatter-v1']
    skills.push({ name: skill.name, category: skill.category as SkillCategory, directory, sourceFiles: Object.keys(skill.files).map(file => `${directory}/${file}`).sort(), installedFilesByProjection: { 'identity': installed.identity.map(file => file.path), 'eve-frontmatter-v1': installed['eve-frontmatter-v1'].map(file => file.path) }, ...references, mountMappingIds: Object.hasOwn(skill.files, 'speckit-hooks.json') ? [skill.name] : [] })
  }
  if (!skills.length)
    throw new Error('内容导出所选分类没有可交付技能')
  /**
   * 脚本遵循既有原样复制过滤，不导入或执行运行模块。
   */
  const scripts = readFiles(path.join(root, 'script'), { official: false, exclude: ['node_modules', '__pycache__'], excludePrefix: 'test-' })
  /**
   * 每个声明的入口、平台模块和说明都必须实际存在。
   */
  for (const file of ['index.mjs', 'install-skills/read-agents.mjs', ...['install-skills', 'mount-entry', 'register-hooks', 'register-commands'].flatMap(name => [`${name}/${name}.sh`, `${name}/${name}.ps1`, `${name}/README.md`])]) {
    if (!Object.hasOwn(scripts, file))
      throw new Error(`缺少声明的运行脚本或说明：script/${file}`)
  }
  /**
   * 运行脚本使用与既有复制插件一致的路径和字节。
   */
  for (const [file, data] of Object.entries(scripts)) {
    files[`script/${file}`] = data
    copiedFiles[`script/${file}`] = data
  }
  /**
   * 清单不含自身摘要，实际安装使用其原始字节计算 catalogDigest。
   */
  const fileTable = Object.keys(files).sort().map(file => describeFile(file, files[file]!))
  /**
   * 正式模型保证摘要、投影、依赖和工具字段在输出前一致。
   * npm 记录本轮已验证的固定基线，不宣称任意版本已经兼容。
   */
  const manifest = parseRelease({
    schemaVersion: 1,
    development: true,
    version: options.version,
    sourceRevision: options.sourceRevision,
    tools: { skills: 'latest', specify: '1.2.6', node: '>=22.20.0', npm: '11.19.1', bash: '>=3.2', powershell: '>=7.4' },
    files: fileTable,
    skills,
    projections,
    adapters: fileTable.filter(file => file.path.startsWith('script/')),
  })
  return { manifest, files, copiedFiles }
}

/**
 * 在原有复制插件之后生成开发清单，并复核复制产物实际字节。
 * @param output 本次 Vite 输出根目录。
 * @param snapshot 构建前已核验的相同来源快照。
 */
export function exportContent(output: string, snapshot: ContentSnapshot): void {
  /**
   * 先核查既有复制流程，不通过覆盖输出掩盖漏复制或字节漂移。
   */
  for (const [file, encoded] of Object.entries(snapshot.copiedFiles)) {
    /**
     * 当前输出必须是普通文件且字节来自同一次构建前快照。
     */
    const target = assertOutputPath(output, file)
    if (!fs.lstatSync(target).isFile() || fs.readFileSync(target).toString('base64') !== encoded)
      throw new Error(`原样复制产物缺失或字节不同：${file}`)
  }
  /**
   * 公开目录按身份重建，只有生成目录会被处理，源码保持不变。
   */
  for (const skill of snapshot.manifest.skills)
    fs.rmSync(assertOutputPath(output, skill.directory), { recursive: true, force: true })
  /**
   * 技能、agent 表和投影 blob 全部由同一快照生成；脚本继续使用原复制产物。
   */
  for (const [file, encoded] of Object.entries(snapshot.files)) {
    if (file.startsWith('script/'))
      continue
    /**
     * 写入前再次检查生成路径，覆盖新增的投影与清单数据目录。
     */
    const target = assertOutputPath(output, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, Buffer.from(encoded, 'base64'))
  }
  verifyContent(output, snapshot.manifest)
  fs.writeFileSync(assertOutputPath(output, 'release.json'), `${JSON.stringify(snapshot.manifest, null, 2)}\n`)
}
