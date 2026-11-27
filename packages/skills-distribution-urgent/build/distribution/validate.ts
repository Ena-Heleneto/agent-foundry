import type { ProjectedFile, ProjectionId, Release, ReleaseFile, ReleaseSkill } from './models.js'
import { assertRelativePath } from './verify.js'

/**
 * 固定首版投影，不接受未支持格式被静默当 identity。
 */
const projectionIds: ProjectionId[] = ['identity']

/**
 * 所有 schema 错误统一保留字段定位，不自动补默认或修改输入。
 * @param condition 当前约束是否满足。
 * @param field 用于定位问题的字段。
 */
function requireValue(condition: unknown, field: string): asserts condition {
  if (!condition)
    throw new Error(`发布清单字段非法或缺失：${field}`)
}

/**
 * 缩窄不可信 JSON 对象，数组、null 和原始值均拒绝。
 * @param value 待校验值。
 * @param field 当前字段路径。
 * @returns 只读使用的字段对象。
 */
function record(value: unknown, field: string): Record<string, unknown> {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), field)
  return value as Record<string, unknown>
}

/**
 * 校验标准三段 SemVer，数字预发布标识不能含多余前导零。
 * @param value 版本字符串。
 * @returns 是否为固定 SemVer。
 */
function semver(value: unknown): value is string {
  if (typeof value !== 'string')
    return false
  /**
   * prerelease 与 build 分开，build 中数字允许前导零。
   */
  const match = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u.exec(value)
  return !!match && (!match[1] || match[1].split('.').every(identifier => !/^\d+$/u.test(identifier) || identifier.length === 1 || !identifier.startsWith('0')))
}

/**
 * 读取去重字符串数组，允许声明为空但禁止空白元素。
 * @param value 待校验数组。
 * @param field 当前字段路径。
 * @param nonempty 是否要求至少一项。
 * @returns 未修改的原字符串数组。
 */
function strings(value: unknown, field: string, nonempty = false): string[] {
  requireValue(Array.isArray(value), field)
  requireValue(!nonempty || value.length > 0, field)
  requireValue(value.every(item => typeof item === 'string' && item.trim().length > 0), field)
  requireValue(new Set(value).size === value.length, `${field}（重复项）`)
  return value as string[]
}

/**
 * 校验单个摘要条目，路径不能逃逸或依赖平台特有绝对路径语义。
 * @param value 条目对象。
 * @param field 当前字段路径。
 * @returns 已验证的文件声明。
 */
function file(value: unknown, field: string): ReleaseFile {
  /**
   * 仅在对象类型确认后读取字段。
   */
  const item = record(value, field)
  requireValue(typeof item.path === 'string', `${field}.path`)
  assertRelativePath(item.path)
  requireValue(typeof item.bytes === 'number' && Number.isSafeInteger(item.bytes) && item.bytes >= 0, `${field}.bytes`)
  requireValue(typeof item.sha256 === 'string' && /^[a-f\d]{64}$/u.test(item.sha256), `${field}.sha256`)
  return value as ReleaseFile
}

/**
 * 公开交付不能夹带内部内容、自身摘要或固定扩展定义。
 * @param name 已验证的相对文件路径。
 */
function assertPublicFile(name: string): void {
  requireValue(name === 'README.md' || name === 'LICENSE' || name.startsWith('skills/') || name.startsWith('script/'), `files:${name}（未知公开根）`)
  requireValue(!name.split('/').some(part => ['eval', 'mcp', '.git', '.specify', '.agents', 'node_modules'].includes(part.toLowerCase())), `files:${name}（内部路径）`)
  requireValue(!['release.json', 'extension.yml', 'extension.yaml', 'mounts.json'].includes(name.toLowerCase()) && !name.toLowerCase().startsWith('extensions/'), `files:${name}（固定声明或自引用）`)
}

/**
 * 建立逐路径索引并拒绝大小写不敏感文件系统上的目录或文件冲突。
 * @param value 完整交付文件表。
 * @returns 按原路径索引的实际声明。
 */
function files(value: unknown): Map<string, ReleaseFile> {
  requireValue(Array.isArray(value) && value.length > 0, 'files')
  /**
   * 安装路径原样作为索引，不进行大小写折叠后覆盖。
   */
  const result = new Map<string, ReleaseFile>()
  /**
   * 每个路径组件也必须保持唯一大小写，避免仅比较完整文件名漏检。
   */
  const folded = new Map<string, string>()
  /**
   * 已被其他文件作为祖先使用的目录不能再次声明为文件。
   */
  const directories = new Set<string>()
  /**
   * 每个条目独立验证，再将其加入全局索引。
   */
  for (const valueItem of value) {
    /**
     * 原始字节声明已经通过路径、长度与摘要校验。
     */
    const item = file(valueItem, 'files[]')
    assertPublicFile(item.path)
    requireValue(!result.has(item.path), `files:${item.path}（重复）`)
    requireValue(!directories.has(item.path), `files:${item.path}（文件与目录冲突）`)
    /**
     * 将目录前缀也纳入大小写保护。
     */
    const parts = item.path.split('/')
    /**
     * 当前前缀长度覆盖从根目录到文件的每一层。
     */
    for (let count = 1; count <= parts.length; count++) {
      /**
       * 同一个折叠路径只允许一种原始拼写。
       */
      const prefix = parts.slice(0, count).join('/')
      requireValue(!folded.has(prefix.toLowerCase()) || folded.get(prefix.toLowerCase()) === prefix, `files:${prefix}（大小写冲突）`)
      if (count < parts.length) {
        requireValue(!result.has(prefix), `files:${prefix}（目录穿过文件）`)
        directories.add(prefix)
      }
      folded.set(prefix.toLowerCase(), prefix)
    }
    result.set(item.path, item)
  }
  return result
}

/**
 * 校验固定工具及消费前提，npm 单独保存已测版本而非推测最低版本。
 * @param value 工具声明。
 */
function tools(value: unknown): void {
  /**
   * 预期字段与已确认的固定工具语义一致。
   */
  const expected = { skills: 'latest', specify: '1.2.6', node: '>=22.20.0', bash: '>=3.2', powershell: '>=7.4' }
  /**
   * 输入字段必须先缩窄为对象。
   */
  const input = record(value, 'tools')
  /**
   * 每个固定工具和最低前提都按声明字段逐项校验。
   */
  for (const [key, expectedValue] of Object.entries(expected))
    requireValue(input[key] === expectedValue, `tools.${key}`)
  requireValue(semver(input.npm), 'tools.npm')
}

/**
 * 校验一个技能的来源、身份和必要声明，不推断不存在的附件。
 * @param value 技能对象。
 * @param index 全局文件索引。
 * @returns 已验证的技能描述。
 */
function skill(value: unknown, index: Map<string, ReleaseFile>): ReleaseSkill {
  /**
   * 技能声明先通过基础类型检查。
   */
  const input = record(value, 'skills[]')
  requireValue(typeof input.name === 'string' && /^[a-z\d]+(?:-[a-z\d]+)*$/u.test(input.name), 'skills[].name')
  requireValue(typeof input.category === 'string' && ['coding', 'frontend', 'workflow'].includes(input.category), 'skills[].category')
  requireValue(input.directory === `skills/${input.category}/${input.name}`, 'skills[].directory')
  /**
   * 来源文件必须全部属于本技能，入口不可省略。
   */
  const sourceFiles = strings(input.sourceFiles, 'skills[].sourceFiles', true)
  requireValue(sourceFiles.includes(`${input.directory}/SKILL.md`), 'skills[].sourceFiles.SKILL.md')
  /**
   * 当前来源路径必须同时属于技能目录和交付白名单。
   */
  for (const name of sourceFiles)
    requireValue(name.startsWith(`${input.directory}/`) && index.has(name), `skills[].sourceFiles:${name}`)
  requireValue([...index.keys()].filter(name => name.startsWith(`${input.directory}/`)).length === sourceFiles.length, 'skills[].sourceFiles（遗漏文件）')
  strings(input.requiresSkills, 'skills[].requiresSkills')
  strings(input.projectPrerequisites, 'skills[].projectPrerequisites')
  strings(input.mountMappingIds, 'skills[].mountMappingIds')
  /**
   * 仅 identity 安装投影具有明确的相对文件集合。
   */
  const installed = record(input.installedFilesByProjection, 'skills[].installedFilesByProjection')
  requireValue(Object.keys(installed).length === projectionIds.length, 'skills[].installedFilesByProjection（未知格式）')
  /**
   * 每种支持格式都验证完整安装相对路径。
   */
  for (const id of projectionIds) {
    /**
     * 每个安装路径单独拒绝越界和绝对路径。
     */
    for (const name of strings(installed[id], `skills[].installedFilesByProjection.${id}`, true))
      assertRelativePath(name)
  }
  return value as ReleaseSkill
}

/**
 * 校验投影文件来源、摘要及完整性；不能通过省略附件制造安装等价。
 * @param value 当前技能的一种投影文件表。
 * @param current 当前技能。
 * @param id 当前投影标识。
 * @param index 完整交付文件表。
 */
function projection(value: unknown, current: ReleaseSkill, id: ProjectionId, index: Map<string, ReleaseFile>): void {
  requireValue(Array.isArray(value) && value.length > 0, `projections.${id}.${current.name}`)
  /**
   * 同一投影内每个安装路径只能出现一次。
   */
  const names: string[] = []
  /**
   * 各安装文件都必须能定位到相同字节的交付来源。
   */
  for (const entry of value) {
    /**
     * 基础字段与交付来源分别验证。
     */
    const item = file(entry, `projections.${id}.${current.name}`) as ProjectedFile
    requireValue(typeof item.sourcePath === 'string', `projections.${id}.sourcePath`)
    assertRelativePath(item.sourcePath)
    /**
     * 实际字节来源必须在发布白名单中，且对应同一长度和摘要。
     */
    const source = index.get(item.sourcePath)
    requireValue(source && source.bytes === item.bytes && source.sha256 === item.sha256, `projections.${id}.sourcePath:${item.sourcePath}`)
    if (id === 'identity')
      requireValue(item.sourcePath === `${current.directory}/${item.path}`, 'projections.identity.sourcePath')
    if (item.path.split('/').at(-1)?.toLowerCase() !== 'skill.md') {
      /**
       * 官方仅转换各层 SKILL.md；普通附件在所有投影中都保持原始字节。
       */
      const original = index.get(`${current.directory}/${item.path}`)
      requireValue(original && original.bytes === item.bytes && original.sha256 === item.sha256, `projections.${id}（附件字节不同）：${item.path}`)
    }
    names.push(item.path)
  }
  requireValue(new Set(names).size === names.length, `projections.${id}（重复安装路径）`)
  /**
   * 来源全集、安装声明与投影全集三者必须保持相同路径。
   */
  const sourceNames = current.sourceFiles.map(name => name.slice(current.directory.length + 1)).sort()
  requireValue(JSON.stringify([...names].sort()) === JSON.stringify(sourceNames), `projections.${id}（遗漏或多余附件）`)
  requireValue(JSON.stringify([...current.installedFilesByProjection[id]].sort()) === JSON.stringify(sourceNames), `installedFilesByProjection.${id}（路径不匹配）`)
}

/**
 * 将不可信对象解析为完整首版模型；不写文件、不改输入、不补装依赖。
 * @param value 来自 JSON 或调用方的待验证对象。
 * @returns 已经通过字段与跨字段约束的清单。
 */
export function parseRelease(value: unknown): Release {
  /**
   * 顶层字段的类型与固定格式须先明确。
   */
  const input = record(value, 'release')
  requireValue(input.schemaVersion === 1, 'schemaVersion')
  requireValue(semver(input.version), 'version')
  requireValue(typeof input.sourceRevision === 'string' && /^[a-f\d]{40}$/iu.test(input.sourceRevision), 'sourceRevision')
  requireValue(input.development === undefined || input.development === false, 'development（不接受旧开发候选）')
  tools(input.tools)
  /**
   * 所有后续引用都使用同一白名单索引。
   */
  const index = files(input.files)
  requireValue(Array.isArray(input.skills) && input.skills.length > 0, 'skills')
  /**
   * 技能身份唯一，依赖只允许引用已公开技能。
   */
  const skills = input.skills.map(value => skill(value, index))
  requireValue(new Set(skills.map(item => item.name)).size === skills.length, 'skills（重复名称）')
  /**
   * 技能目录中的每个公开文件都必须属于已声明身份。
   */
  for (const name of index.keys()) {
    if (name.startsWith('skills/'))
      requireValue(skills.some(item => name.startsWith(`${item.directory}/`)), `files:${name}（未声明技能文件）`)
  }
  /**
   * 各技能只声明公开集合内的必要依赖。
   */
  for (const current of skills) {
    /**
     * 缺少的声明身份直接报错，不隐式扩展公开范围。
     */
    for (const required of current.requiresSkills)
      requireValue(skills.some(item => item.name === required), `requiresSkills:${required}（未公开）`)
  }
  /**
   * 全局投影表仅支持 identity，拒绝缺项和未知格式。
   */
  const projected = record(input.projections, 'projections')
  requireValue(Object.keys(projected).length === projectionIds.length, 'projections（格式数量）')
  /**
   * 每种投影的技能表都需完整且无未知技能。
   */
  for (const id of projectionIds) {
    /**
     * 每种投影恰好包含当前技能集合。
     */
    const bySkill = record(projected[id], `projections.${id}`)
    requireValue(Object.keys(bySkill).length === skills.length, `projections.${id}（技能数量）`)
    /**
     * 当前技能同时检查摘要、来源和完整附件路径。
     */
    for (const current of skills)
      projection(bySkill[current.name], current, id, index)
  }
  requireValue(Array.isArray(input.adapters) && input.adapters.length > 0, 'adapters')
  /**
   * 在线数据读取器及平台脚本只引用同一个文件表，不能携带未交付输入。
   */
  const adapters = input.adapters.map(value => file(value, 'adapters[]'))
  /**
   * 每个适配条目均与顶层文件表核对，不能只信路径存在。
   */
  for (const adapter of adapters) {
    /**
     * adapter 的字节证据必须与交付白名单完全相同。
     */
    const source = index.get(adapter.path)
    requireValue(source && source.bytes === adapter.bytes && source.sha256 === adapter.sha256, `adapters:${adapter.path}`)
  }
  requireValue(adapters.some(item => item.path === 'script/install-skills/read-agents.mjs'), 'adapters（在线读取器缺失）')
  return value as Release
}

/**
 * 解析清单原始 JSON；语法损坏与 schema 错误分别保留实际原因。
 * @param raw 原始清单文本。
 * @returns 已验证的正式模型。
 */
export function parseReleaseJson(raw: string): Release {
  /**
   * JSON 解析结果仍按 unknown 校验，不能由类型断言代替验证。
   */
  let value: unknown
  try {
    value = JSON.parse(raw)
  }
  catch {
    throw new Error('发布清单 JSON 格式无效')
  }
  return parseRelease(value)
}

/**
 * 固定版本不得以内容不同的清单替换，结构相同的重验不改变原版本。
 * @param previous 已存在的版本。
 * @param candidate 待交付候选。
 */
export function assertReleaseUnchanged(previous: unknown, candidate: unknown): void {
  /**
   * 两个输入都必须满足完整模型，不能通过破坏版本字段绕过保护。
   */
  const saved = parseRelease(previous)
  /**
   * 当前候选保持调用方给出的原始值与排序。
   */
  const next = parseRelease(candidate)
  if (saved.version === next.version && JSON.stringify(saved) !== JSON.stringify(next))
    throw new Error(`同版本内容不同，拒绝覆盖：${saved.version}`)
}
