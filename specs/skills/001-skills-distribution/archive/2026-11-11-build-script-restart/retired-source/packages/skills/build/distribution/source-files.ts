import type { SourceFile } from './models.js'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { StageError } from './models.js'
import { isRecord } from './validate.js'

/**
 * 原始字节统一使用 SHA-256，不转成文本后求摘要。
 */
export function sha256(content: Uint8Array | string): string {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * 文件名按 UTF-8 字节排序，避免受系统语言和绝对路径影响。
 */
export function comparePaths(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}

/**
 * 对已拥有的内存字节生成文件记录，复制字节避免计划与快照共享可变缓冲区。
 */
export function sourceFile(filePath: string, content: Uint8Array | string): SourceFile {
  /**
   * Buffer.from 同时保留二进制和 UTF-8 文本的实际字节。
   */
  const bytes = Buffer.from(content)
  return { path: filePath, content: bytes, bytes: bytes.length, sha256: sha256(bytes) }
}

/**
 * 读取 JSON 声明，不导入依赖或执行任何包内代码。
 */
export function readManifest(filePath: string): Record<string, unknown> {
  try {
    /**
     * JSON 数据仍以 unknown 校验，不能相信调用路径来自 package.json 就断言类型。
     */
    const value: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (isRecord(value))
      return value
  }
  catch (error) {
    throw new StageError('source', 'invalid-dependency-manifest', filePath, error instanceof Error ? error.message : '无法读取 JSON 声明')
  }
  throw new StageError('source', 'invalid-dependency-manifest', filePath, '声明必须是 JSON 对象')
}

/**
 * 排除开发缓存、版本库、依赖、测试及占位文件，不排除普通附件或 README。
 */
export function excludedContent(name: string, scripts: boolean): boolean {
  return ['node_modules', '__pycache__', '.git', '.cache', '.vite', '.turbo', '.gitkeep', '.DS_Store'].includes(name)
    || /\.py[co]$/u.test(name)
    || (scripts && (['tests', '__tests__'].includes(name) || /^(?:test-|test_)/u.test(name) || /\.(?:test|spec)\.[cm]?[jt]s$/u.test(name)))
}

/**
 * 检查完整输入路径的现存节点，不让父目录链接绕过最终文件的 lstat。
 */
function assertSourcePath(target: string, relative: string): void {
  /**
   * 配置和来源目录使用同一条链接拒绝规则。
   */
  let current = target
  while (true) {
    /**
     * lstat 也能发现断开的链接。
     */
    const stat = fs.lstatSync(current, { throwIfNoEntry: false })
    if (stat?.isSymbolicLink())
      throw new StageError('source', 'source-symlink', relative, '输入路径包含符号链接')
    if (path.dirname(current) === current)
      break
    current = path.dirname(current)
  }
}

/**
 * 不跟随输入树中的链接；缺必需目录与非普通文件都显式失败。
 */
export function readSourceTree(packageRoot: string, relative: string, required: boolean): SourceFile[] {
  /**
   * 待扫描的实际路径只由明确包根和相对来源组成。
   */
  const target = path.join(packageRoot, relative)
  assertSourcePath(target, relative)
  /**
   * lstat 同时识别断开的链接，不以 existsSync 吞掉链接事实。
   */
  const stat = fs.lstatSync(target, { throwIfNoEntry: false })
  if (!stat) {
    if (required)
      throw new StageError('source', 'missing-directory', relative, '缺少必需来源目录或文件')
    return []
  }
  if (stat.isSymbolicLink())
    throw new StageError('source', 'source-symlink', relative, '来源不允许符号链接')
  if (['src/skills', 'src/mcp', 'script'].includes(relative.split(path.sep).join('/')) && !stat.isDirectory())
    throw new StageError('source', 'invalid-source-directory', relative, '必需来源必须是目录')
  if (stat.isFile())
    return [sourceFile(relative.split(path.sep).join('/'), fs.readFileSync(target))]
  if (!stat.isDirectory())
    throw new StageError('source', 'invalid-file-type', relative, '来源只能是普通文件或目录')
  /**
   * 每一级先 lstat 再进入，避免 recursive readdir 提前跟随链接。
   */
  const files: SourceFile[] = []
  /**
   * 逐项扫描普通内容，目录名排序不依赖机器语言。
   */
  for (const name of fs.readdirSync(target).sort(comparePaths)) {
    if (!excludedContent(name, relative === 'script' || relative.startsWith(`script${path.sep}`)))
      files.push(...readSourceTree(packageRoot, path.join(relative, name), true))
  }
  return files
}

/**
 * 记录工作区配置，先验证路径各级均未通过链接跳转。
 */
export function readConfiguration(filePath: string, displayPath: string): SourceFile | null {
  assertSourcePath(filePath, displayPath)
  return fs.existsSync(filePath) ? sourceFile(displayPath, fs.readFileSync(filePath)) : null
}
