import type { BaseBuildPlan, McpManifest, McpSkill, SourceFile, SourceSnapshot } from './models.js'
import { isUtf8 } from 'node:buffer'
import path from 'node:path'
import { StageError } from './models.js'
import { comparePaths, sha256, sourceFile } from './source-files.js'
import { parseSkill, validateFilePaths, validateOutputRoot, validateReferences } from './validate.js'

/**
 * 唯一来源阶段入口，供后续 Vite 编排与阶段测试共同消费。
 */
export { readSourceSnapshot } from './source.js'

/**
 * 核对技能身份和附件引用，只有 MCP 来源才将 references 编入文本清单。
 */
function createMcpManifest(files: readonly SourceFile[], online = true): McpManifest {
  /**
   * 相对路径集合同时服务附件引用校验。
   */
  const paths = new Set(files.map(file => file.path))
  /**
   * 技能名在各自来源内唯一，MCP 与线下来源互不推导。
   */
  const names = new Set<string>()
  /**
   * 清单内容来自同一份内存快照，不再次读取磁盘。
   */
  const skills: McpSkill[] = []
  /**
   * 按已固定文件顺序检查技能声明。
   */
  for (const file of files) {
    if (path.posix.basename(file.path) !== 'SKILL.md')
      continue
    /**
     * 使用已有 YAML 构建依赖校验元数据类型。
     */
    const metadata = parseSkill(file)
    if (names.has(metadata.name))
      throw new StageError('plan', 'duplicate-skill-name', file.path, `重复技能身份：${metadata.name}`)
    names.add(metadata.name)
    validateReferences(file, paths)
    /**
     * 技能目录中的 references 按完整相对路径稳定排序。
     */
    const referenceRoot = `${path.posix.dirname(file.path)}/references/`
    /**
     * 普通二进制附件保留在文件计划，只有清单 references 必须可编码为 UTF-8 文本。
     */
    const references = online ? files.filter(item => item.path.startsWith(referenceRoot)) : []
    /**
     * 仅清单收录的附件需要转换为文本。
     */
    for (const reference of references) {
      if (!isUtf8(reference.content))
        throw new StageError('plan', 'invalid-utf8-text', reference.path, 'MCP references 必须是 UTF-8 文本')
    }
    skills.push({ name: metadata.name, description: metadata.description, destructive: metadata.destructive, category: path.posix.dirname(path.posix.dirname(file.path)).replace(/^src\/mcp\/?/u, '') || null, skill: file.content.toString('utf8'), references: references.map(item => ({ name: item.path.slice(referenceRoot.length), content: item.content.toString('utf8') })) })
  }
  return { version: 1, skills: skills.sort((left, right) => comparePaths(left.name, right.name)) }
}

/**
 * 只消费固定来源形成基础计划；返回的 base 类型不具有 Release 或候选语义。
 */
export function createBaseBuildPlan(snapshot: SourceSnapshot, options: { outputRoot: string }): BaseBuildPlan {
  /**
   * 输出根归属在任何计划返回前验证，不清理或创建目录。
   */
  const outputRoot = validateOutputRoot(snapshot.packageRoot, options.outputRoot)
  validateFilePaths(snapshot.inputFiles)
  /**
   * 每项来源均须与读取时记录的长度和摘要相符。
   */
  for (const file of snapshot.inputFiles) {
    if (file.bytes !== file.content.length || file.sha256 !== sha256(file.content))
      throw new StageError('plan', 'changed-snapshot-bytes', file.path, '快照字节已被修改，请重新读取来源')
  }
  /**
   * 两类内容源按原职责各自校验，不以公开发布选择过滤原始三目录。
   */
  const offline = snapshot.inputFiles.filter(file => file.path.startsWith('src/skills/'))
  /**
   * MCP 源独立生成清单，禁止手写同名根清单。
   */
  const online = snapshot.inputFiles.filter(file => file.path.startsWith('src/mcp/'))
  if (online.some(file => file.path === 'src/mcp/manifest.json'))
    throw new StageError('plan', 'source-handwritten-manifest', 'src/mcp/manifest.json', 'MCP 清单必须由构建派生')
  createMcpManifest(offline, false)
  /**
   * 完整原文及 references 来自已校验 MCP 来源。
   */
  const mcpManifest = createMcpManifest(online)
  /**
   * 脚本与普通附件仅更换目标路径，字节原样保留。
   */
  const files = snapshot.inputFiles.filter(file => /^(?:src\/(?:skills|mcp)|script)\//u.test(file.path)).map(file => sourceFile(file.path.replace(/^src\//u, ''), file.content))
  files.push(sourceFile('mcp/manifest.json', `${JSON.stringify(mcpManifest, null, 2)}\n`))
  files.sort((left, right) => comparePaths(left.path, right.path))
  validateFilePaths(files)
  return { kind: 'base', sourceRevision: snapshot.sourceRevision, inputDigest: snapshot.inputDigest, outputRoot, files, mcpManifest }
}
