import type { SourceFile, ValidationScope } from './models.js'
import { isUtf8 } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { parseDocument } from 'yaml'
import { StageError } from './models.js'

/**
 * 已解析的技能声明，body 仅用于空正文检查，text 原文不被重新序列化。
 */
export interface SkillMetadata {
  name: string
  description: string
  destructive: boolean
  body: string
}

/**
 * 校验对象边界，避免以类型断言代替实际外部输入校验。
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 限定验证用途，不能自动将未知用途降级为开发模式。
 */
export function validateScope(value: unknown): ValidationScope {
  if (value !== 'development' && value !== 'isolated' && value !== 'full')
    throw new StageError('source', 'invalid-scope', 'validationScope', '必须显式指定 development、isolated 或 full')
  return value
}

/**
 * 验证自有版本为 SemVer，拒绝非法版本与数字前导零。
 */
export function validateVersion(value: unknown): string {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*))*)?(?:\+[a-z\d-]+(?:\.[a-z\d-]+)*)?$/iu.test(value))
    throw new StageError('source', 'invalid-version', 'package.json', 'version 必须是合法 SemVer')
  return value
}

/**
 * 路径统一使用正斜线，拒绝绝对路径、反斜线与父目录穿越。
 */
export function validateRelativePath(value: string): void {
  if (!value || value.includes('\\') || [...value].some(character => character.charCodeAt(0) < 32) || path.posix.isAbsolute(value) || /^[a-z]:/iu.test(value) || value.split('/').some(part => !part || part === '.' || part === '..'))
    throw new StageError('plan', 'invalid-path', value, '必须是无越界片段的相对路径')
}

/**
 * 对文件及每级父路径检查大小写冲突，保持跨平台可交付性。
 */
export function validateFilePaths(files: readonly SourceFile[]): void {
  /**
   * 小写路径映射同时覆盖空目录以外的所有父目录。
   */
  const seen = new Map<string, string>()
  /**
   * 完整文件集合用于发现同一路径同时被文件和父目录占用。
   */
  const filePaths = new Set(files.map(file => file.path))
  if (filePaths.size !== files.length)
    throw new StageError('plan', 'duplicate-file-path', 'files', '计划包含重复完整文件路径')
  /**
   * 每个文件同时检查完整路径和父目录身份。
   */
  for (const file of files) {
    validateRelativePath(file.path)
    /**
     * 路径前缀使 A/x 与 a/y 也能被发现为目录冲突。
     */
    const parts = file.path.split('/')
    /**
     * 从首级目录逐段检查，发现跨文件前缀冲突。
     */
    for (let length = 1; length <= parts.length; length++) {
      /**
       * 当前完整前缀和跨平台冲突键。
       */
      const prefix = parts.slice(0, length).join('/')
      if (length < parts.length && filePaths.has(prefix))
        throw new StageError('plan', 'file-directory-path-conflict', file.path, `${prefix} 不能同时作为文件和父目录`)
      /**
       * 同一前缀可被多个文件共享，但不同大小写不可共享。
       */
      const previous = seen.get(prefix.toLowerCase())
      if (previous !== undefined && previous !== prefix)
        throw new StageError('plan', 'case-collision', file.path, `与 ${previous} 存在大小写路径冲突`)
      seen.set(prefix.toLowerCase(), prefix)
    }
  }
}

/**
 * 使用已有 YAML 依赖解析技能，保持完整原文与严格元数据类型。
 */
export function parseSkill(file: SourceFile): SkillMetadata {
  if (!isUtf8(file.content))
    throw new StageError('plan', 'invalid-utf8-text', file.path, '技能正文必须是 UTF-8 文本')
  /**
   * BOM 与 CRLF 仅用于解析，不改变文件原始字节。
   */
  const text = file.content.toString('utf8').replace(/^\uFEFF/u, '')
  /**
   * 只读取文档开头的 frontmatter，不误把正文分隔线当元数据。
   */
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/u.exec(text)
  if (!match)
    throw new StageError('plan', 'invalid-metadata', file.path, '缺少 YAML frontmatter')
  /**
   * parseDocument 显式暴露重复键及语法错误。
   */
  const document = parseDocument(match[1] ?? '')
  if (document.errors.length)
    throw new StageError('plan', 'invalid-metadata', file.path, 'YAML frontmatter 无法解析')
  /**
   * 外部 YAML 数据必须先验证后使用。
   */
  const metadata: unknown = document.toJS({ maxAliasCount: 100 })
  if (!isRecord(metadata) || typeof metadata.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(metadata.name) || typeof metadata.description !== 'string' || !metadata.description.trim() || (metadata.destructive !== undefined && typeof metadata.destructive !== 'boolean'))
    throw new StageError('plan', 'invalid-metadata', file.path, '技能名称、description 或 destructive 类型非法')
  /**
   * 正文须有实际内容，不能只含空格。
   */
  const body = match[2] ?? ''
  if (!body.trim())
    throw new StageError('plan', 'empty-body', file.path, '技能正文为空')
  return { name: metadata.name, description: metadata.description, destructive: metadata.destructive ?? false, body }
}

/**
 * 解析一个本地引用，外部协议、片段和根站点地址不作为附件。
 */
function localReference(raw: string, file: string): string | null {
  /**
   * Markdown 可用尖括号包裹带空格路径。
   */
  const value = raw.trim().replace(/^<|>$/gu, '').replace(/\s+["'][\s\S]*$/u, '')
  if (!value || value.startsWith('#') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(value))
    return null
  try {
    return decodeURIComponent(value.split(/[?#]/u)[0] ?? '')
  }
  catch {
    throw new StageError('plan', 'invalid-reference', file, '附件引用的 URI 编码非法')
  }
}

/**
 * 附件校验只读取 Markdown 正文链接，跳过代码围栏与行内代码中的示例。
 */
function markdownProse(text: string): string {
  /**
   * 当前围栏的字符和长度，关闭围栏不能短于起始围栏。
   */
  let fence = ''
  /**
   * 逐行处理围栏避免跨整篇文档的复杂正则回溯。
   */
  const lines: string[] = []
  /**
   * 逐行追踪围栏状态，正文示例不成为附件引用。
   */
  for (const line of text.split(/\r?\n/u)) {
    /**
     * Markdown 允许三个以内空格和反引号或波浪线围栏。
     */
    const marker = /^ {0,3}(`{3,}|~{3,})/u.exec(line)
    if (fence) {
      if (marker?.[1] && marker[1][0] === fence[0] && marker[1].length >= fence.length && !line.slice(marker[0].length).trim())
        fence = ''
      continue
    }
    if (marker?.[1]) {
      fence = marker[1]
      continue
    }
    lines.push(line.replace(/`+[^`]*`+/gu, ''))
  }
  return lines.join('\n')
}

/**
 * 校验 Markdown 直接链接、图片及引用式链接，不跟随磁盘路径。
 */
export function validateReferences(file: SourceFile, files: ReadonlySet<string>): void {
  /**
   * 单个技能的根目录，附件只能留在本技能内。
   */
  const root = path.posix.dirname(file.path)
  /**
   * 正文保留中文、空格路径，并支持独立引用定义。
   */
  const text = markdownProse(file.content.toString('utf8'))
  /**
   * 两类引用共享相同的路径边界校验。
   */
  const references = [...text.matchAll(/!?\[[^\]\r\n]*\]\(([^)\r\n]+)\)/gu), ...text.matchAll(/^\s*\[[^\]\r\n]+\]:([^\r\n]+)$/gmu)]
  /**
   * 每条真实正文链接使用相同的解码和归属检查。
   */
  for (const match of references) {
    /**
     * 外部链接返回 null，其余路径先解码再检查越界。
     */
    const reference = localReference(match[1] ?? '', file.path)
    if (reference === null)
      continue
    if (reference.startsWith('.specify/') && !reference.split('/').includes('..'))
      continue
    /**
     * 使用 POSIX 规则得到与输入文件表相同的键。
     */
    const target = path.posix.normalize(path.posix.join(root, reference))
    if (reference.startsWith('/') || reference.includes('\\') || !target.startsWith(`${root}/`))
      throw new StageError('plan', 'escaping-reference-path', file.path, `附件引用越界：${reference}`)
    if (!files.has(target))
      throw new StageError('plan', 'missing-reference', file.path, `缺少附件：${reference}`)
  }
}

/**
 * 两路径是否相同或后一条位于前一条之下。
 */
function containsPath(parent: string, child: string): boolean {
  /**
   * path.relative 处理平台盘符与目录分隔符，避免字符串前缀误判。
   */
  const relative = path.relative(parent, child)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

/**
 * 输出只能位于独立目录，拒绝覆盖来源、构建代码、配置或祖先；检查所有现存父级链接。
 */
export function validateOutputRoot(packageRoot: string, outputRoot: string): string {
  if (!path.isAbsolute(outputRoot))
    throw new StageError('plan', 'invalid-output-path', outputRoot, '输出根必须是绝对路径')
  /**
   * 规范化后仍需检测源目录和输出目录的双向包含关系。
   */
  const output = path.resolve(outputRoot)
  if (containsPath(output, packageRoot))
    throw new StageError('plan', 'unsafe-output-path', output, '输出根覆盖包根或其祖先')
  /**
   * 保护每类来源和工程输入目录，不假设输出一定叫 dist。
   */
  for (const relative of ['src', 'script', 'build', 'tests', 'types', 'node_modules', '.git']) {
    /**
     * 来源目录与输出不得互为祖先，也不能覆盖构建输入。
     */
    const protectedRoot = path.join(packageRoot, relative)
    if (containsPath(protectedRoot, output) || containsPath(output, protectedRoot))
      throw new StageError('plan', 'unsafe-output-path', output, `输出根与 ${relative} 重叠`)
  }
  /**
   * 即使目标尚不存在，也检查最近存在的祖先，拒绝目录链接跳转。
   */
  let current = output
  while (true) {
    /**
     * 断开的目录链接也必须拒绝，不能用 existsSync 判断是否需要检查。
     */
    const stat = fs.lstatSync(current, { throwIfNoEntry: false })
    if (stat && (stat.isSymbolicLink() || !stat.isDirectory()))
      throw new StageError('plan', 'unsafe-output-link', current, '输出路径包含链接或普通文件')
    if (path.dirname(current) === current)
      break
    current = path.dirname(current)
  }
  return output
}
