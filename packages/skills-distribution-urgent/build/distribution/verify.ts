import type { ContentManifest } from './export.js'
import type { ReleaseFile } from './models.js'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { publicSkills } from './models.js'
import { parseReleaseJson } from './validate.js'

/**
 * 文件读取范围：official 控制官方技能过滤规则，其余字段与既有脚本复制过滤一致。
 */
interface FileReadOptions {
  official?: boolean
  exclude?: string[]
  excludePrefix?: string
}

/**
 * 校验可移植相对路径，禁止越界、控制字符和 Windows 路径语义。
 * @param file 清单或源文件中的相对路径。
 */
export function assertRelativePath(file: string): void {
  if (!file || /[\\:]/u.test(file) || [...file].some(character => character.codePointAt(0)! < 32 || character.codePointAt(0) === 127) || file.split('/').some(part => !part || part === '.' || part === '..'))
    throw new Error(`文件路径越界或不可移植：${file}`)
}

/**
 * 拒绝特殊文件、链接和已知会被官方安装遗漏的内容。
 * @param stat 当前条目自身的文件类型。
 * @param name 条目名称。
 * @param relative 用于定位问题的相对路径。
 * @param options 当前读取范围。
 */
function assertSourceEntry(stat: fs.Stats, name: string, relative: string, options: FileReadOptions): void {
  if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile()))
    throw new Error(`源目录不支持符号链接或特殊文件：${relative}`)
  if (options.official !== false && (name === 'metadata.json' || (stat.isDirectory() && ['.git', '__pycache__', '__pypackages__'].includes(name))))
    throw new Error(`官方安装会排除技能内容：${relative}`)
}

/**
 * 从 MVU-A 骨架提取完整文件读取；按官方过滤边界保护技能附件。
 * @param directory 普通目录，不能是符号链接。
 * @param options 脚本复制可关闭官方技能过滤，并排除开发专用条目。
 * @returns 稳定排序的相对路径及 base64 字节。
 */
export function readFiles(directory: string, options: FileReadOptions = {}): Record<string, string> {
  /**
   * 无原型映射，防止特殊文件名影响对象原型。
   */
  const result: Record<string, string> = Object.create(null)
  /**
   * 同时记录目录和文件，检测大小写折叠冲突。
   */
  const paths = new Set<string>()
  /**
   * 先核查文件类型再递归，不读取外部链接目标。
   * @param current 当前普通目录。
   */
  function visit(current: string): void {
    /**
     * 每层目录按原始名称排序，保持跨语言环境的稳定顺序。
     */
    for (const name of fs.readdirSync(current).sort()) {
      if (options.exclude?.includes(name) || (options.excludePrefix && name.startsWith(options.excludePrefix)))
        continue
      /**
       * 当前条目的绝对路径。
       */
      const absolute = path.join(current, name)
      /**
       * 逐组件检查链接，不能用跟随链接的 stat 代替。
       */
      const stat = fs.lstatSync(absolute)
      /**
       * 对外声明统一使用正斜线。
       */
      const relative = path.relative(directory, absolute).split(path.sep).join('/')
      assertRelativePath(relative)
      assertSourceEntry(stat, name, relative, options)
      if (paths.has(relative.toLowerCase()))
        throw new Error(`技能路径大小写冲突：${relative}`)
      paths.add(relative.toLowerCase())
      if (stat.isDirectory())
        visit(absolute)
      else
        result[relative] = fs.readFileSync(absolute).toString('base64')
    }
  }
  if (!fs.lstatSync(directory).isDirectory())
    throw new Error(`源根必须是普通目录，不能是符号链接：${directory}`)
  visit(directory)
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0))
}

/**
 * 计算原始文件摘要，不引入生成时间或文本编码转换。
 * @param data 文件原始字节。
 * @returns 小写 SHA-256。
 */
export function digest(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * 在读取、删除或写入前检查输出路径的每个已有组件，避免跟随父目录链接。
 * @param root 实际产物根目录，本身也必须是普通目录。
 * @param file 产物根内的可移植相对路径，末端允许尚不存在。
 * @returns 已检查的绝对路径。
 */
export function assertOutputPath(root: string, file: string): string {
  assertRelativePath(file)
  if (!fs.lstatSync(root).isDirectory())
    throw new Error(`产物根必须是普通目录：${root}`)
  /**
   * 从根开始逐组件检查，不因末端缺失跳过已存在的父目录。
   */
  let current = root
  /**
   * 仅普通目录能够作为下一层父路径。
   */
  const components = file.split('/')
  /**
   * 每步只附加一个已经过相对路径语义检查的组件。
   */
  for (const [index, component] of components.entries()) {
    current = path.join(current, component)
    /**
     * lstat 不跟随链接；尚不存在的路径由后续创建负责。
     */
    const stat = fs.lstatSync(current, { throwIfNoEntry: false })
    if (stat?.isSymbolicLink())
      throw new Error(`产物不能包含符号链接：${file}`)
    if (stat && index < components.length - 1 && !stat.isDirectory())
      throw new Error(`产物父路径必须是普通目录：${file}`)
  }
  return current
}

/**
 * 核验构建或迁移副本中的声明文件及技能完整集合，不修改消费者目录。
 * @param root 含 release.json 的产物根目录。
 * @param manifest 已由本次构建生成的内容清单，不作为不可信远端 JSON 解析器。
 */
export function verifyContent(root: string, manifest: ContentManifest): void {
  if (!fs.lstatSync(root).isDirectory())
    throw new Error(`产物根必须是普通目录：${root}`)
  /**
   * 精确按声明检查，允许完整 dist 保留未选内容。
   */
  for (const file of manifest.files) {
    /**
     * 逐组件拒绝链接，避免从产物根之外读取内容。
     */
    const current = assertOutputPath(root, file.path)
    /**
     * 校验实际字节，而不是信任安装退出码或目录存在。
     */
    const data = fs.readFileSync(current)
    if (data.length !== file.bytes || digest(data) !== file.sha256)
      throw new Error(`产物长度或摘要不匹配：${file.path}`)
  }
  /**
   * 每个技能单独核对完整集合，未声明附件不能被忽略。
   */
  for (const skill of manifest.skills) {
    /**
     * 必需文件和额外文件都通过实际目录集合核对。
     */
    const actual = Object.keys(readFiles(assertOutputPath(root, skill.directory))).map(file => `${skill.directory}/${file}`).sort()
    if (JSON.stringify(actual) !== JSON.stringify(skill.sourceFiles))
      throw new Error(`技能完整文件集合不匹配：${skill.name}`)
  }
}

/**
 * 严格候选身份断言，不接受自动推测版本或旧摘要。
 */
export interface CandidateExpectation {
  version: string
  sourceRevision?: string
}

/**
 * 本次磁盘读取后的候选事实；不是发布或宿主验收资格。
 */
export interface CandidateVerification {
  version: string
  sourceRevision: string
  catalogDigest: string
  candidateDigest: string
  payloadFiles: ReleaseFile[]
}

/**
 * 重新读取完整材料，验证文件全集并计算包含清单自身的稳定索引。
 * @param root 含 release.json 的真实候选根。
 * @param expected 本次明确要求的版本及可选源码提交。
 * @returns 实际版本、源码身份、清单摘要、候选摘要和全部文件索引。
 */
export function verifyCandidate(root: string, expected: CandidateExpectation): CandidateVerification {
  /**
   * 根与清单自身也不能通过符号链接读取。
   */
  const catalogPath = assertOutputPath(root, 'release.json')
  /**
   * 清单摘要来自原始字节，不重新格式化 JSON。
   */
  const catalogBytes = fs.readFileSync(catalogPath)
  /**
   * 所有跨字段引用先通过兼容 schema 解析。
   */
  const manifest = parseReleaseJson(catalogBytes.toString('utf8'))
  if (manifest.version !== expected.version || (expected.sourceRevision !== undefined && manifest.sourceRevision !== expected.sourceRevision))
    throw new Error('候选版本或源码提交与本次要求不一致')
  if (!manifest.files.some(file => file.path === 'README.md') || !manifest.files.some(file => file.path === 'LICENSE'))
    throw new Error('候选必须包含实际 README.md 与 LICENSE')
  /**
   * 完整磁盘读取拒绝额外文件、大小写冲突、链接与特殊条目。
   */
  const actual = readFiles(root, { official: false })
  /**
   * 文件全集必须恰为 files 加 release.json，自引用不进入 files。
   */
  const expectedFiles = [...manifest.files.map(file => file.path), 'release.json'].sort()
  if (JSON.stringify(Object.keys(actual).sort()) !== JSON.stringify(expectedFiles))
    throw new Error('候选磁盘文件全集与发布清单不一致')
  verifyContent(root, manifest)
  /**
   * payload 的正式身份与正文声明也必须一致，不仅检查摘要形状。
   */
  for (const skill of manifest.skills) {
    if (!publicSkills[skill.category].includes(skill.name))
      throw new Error(`候选包含未获准公开技能：${skill.name}`)
    /**
     * 正文必须含完整元数据和非空业务内容。
     */
    const match = Buffer.from(actual[`${skill.directory}/SKILL.md`]!, 'base64').toString('utf8').match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/u)
    if (!match?.[1] || !match[2]?.trim())
      throw new Error(`候选技能正文或元数据缺失：${skill.name}`)
    /**
     * YAML 来源先收窄，不按目录猜测正式 name。
     */
    const metadata: unknown = parse(match[1])
    if (!metadata || typeof metadata !== 'object' || !('name' in metadata) || metadata.name !== skill.name || !('description' in metadata) || typeof metadata.description !== 'string' || !metadata.description.trim())
      throw new Error(`候选技能身份或描述不符：${skill.name}`)
  }
  /**
   * 每个材料原始字节独立求摘要，再按 UTF-8 路径字节排序。
   */
  const payloadFiles = Object.entries(actual).map(([file, encoded]) => {
    /**
     * 固定字段顺序 path、bytes、sha256，兼容已约定索引算法。
     */
    const data = Buffer.from(encoded, 'base64')
    return { path: file, bytes: data.length, sha256: digest(data) }
  }).sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
  return { version: manifest.version, sourceRevision: manifest.sourceRevision, catalogDigest: digest(catalogBytes), candidateDigest: digest(Buffer.from(JSON.stringify(payloadFiles))), payloadFiles }
}
