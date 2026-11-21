import type { Plugin, ResolvedConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { parseDocument } from 'yaml'

/**
 * MCP 清单条目：保存元数据、原始正文及 references 下的相对路径和完整文本。
 */
interface McpSkill {
  name: string
  description: string
  destructive: boolean
  category: string | null
  skill: string
  references: { name: string, content: string }[]
}

/**
 * 确认 YAML 解析值是字段对象，避免非法 frontmatter 被静默忽略。
 * @param value YAML 解析结果。
 * @returns 是否为非数组对象。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 遍历技能或附件目录；找到技能根后不再把其附件中的 SKILL.md 当成新技能。
 * @param directory 扫描目录。
 * @param skillsOnly 是否只查找技能入口。
 * @returns 稳定排序的源文件路径。
 */
function collectFiles(directory: string, skillsOnly: boolean): string[] {
  if (skillsOnly && fs.existsSync(path.join(directory, 'SKILL.md')))
    return [path.join(directory, 'SKILL.md')]
  /**
   * 当前目录下实际收集到的文件。
   */
  const files: string[] = []
  /**
   * 遍历条目；不跟随符号链接读取源目录之外的内容。
   */
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    /**
     * 当前源条目的绝对路径。
     */
    const source = path.join(directory, entry.name)
    if (entry.isSymbolicLink())
      throw new Error(`MCP 源目录不支持符号链接：${source}`)
    if (entry.isDirectory())
      files.push(...collectFiles(source, skillsOnly))
    else if (!skillsOnly && entry.name !== '.gitkeep')
      files.push(source)
  }
  return files.sort()
}

/**
 * 读取一个完整技能，严格校验元数据并保存其正文与附属资料。
 * @param file SKILL.md 的绝对路径。
 * @param root MCP 源目录。
 * @returns 可直接序列化的清单条目。
 */
function readSkill(file: string, root: string): McpSkill {
  /**
   * 清单保存的原始正文，包含 frontmatter。
   */
  const skill = fs.readFileSync(file, 'utf8')
  /**
   * 只解析文件起始位置的 YAML frontmatter。
   */
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(skill)
  if (!match || !match[1] || !skill.slice(match[0].length).trim())
    throw new Error(`MCP 技能缺少 frontmatter 或正文：${file}`)
  /**
   * 已有 yaml 依赖支持多行描述和引号等标准语法。
   */
  const document = parseDocument(match[1])
  if (document.errors.length > 0)
    throw new Error(`MCP frontmatter 解析失败：${file}：${document.errors[0]?.message}`)
  /**
   * 未校验的 YAML 值必须先收窄类型，不能绕过字段校验。
   */
  const metadata: unknown = document.toJS()
  if (!isRecord(metadata) || typeof metadata.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(metadata.name)
    || typeof metadata.description !== 'string' || !metadata.description.trim()
    || (metadata.destructive !== undefined && typeof metadata.destructive !== 'boolean')) {
    throw new Error(`MCP 元数据 name、description 或 destructive 非法：${file}`)
  }
  /**
   * references 附件根目录，缺失时按无附件处理。
   */
  const referencesRoot = path.join(path.dirname(file), 'references')
  /**
   * 完整文本附件及跨平台统一的相对文件名。
   */
  const references: McpSkill['references'] = []
  if (fs.existsSync(referencesRoot)) {
    /**
     * 当前需要收录的附属文本文件。
     */
    for (const reference of collectFiles(referencesRoot, false)) {
      references.push({ name: path.relative(referencesRoot, reference).split(path.sep).join('/'), content: fs.readFileSync(reference, 'utf8') })
    }
  }
  /**
   * 技能所在分类；MCP 根目录直属技能没有分类。
   */
  const category = path.relative(root, path.dirname(path.dirname(file))).split(path.sep).join('/')
  return {
    name: metadata.name,
    description: metadata.description,
    destructive: metadata.destructive ?? false,
    category: category || null,
    skill,
    references,
  }
}

/**
 * 从 src/mcp 自动生成 MCP 专属清单，不读取线下技能或手写条目列表。
 */
export class McpManifestPlugin implements Plugin {
  /**
   * Vite 插件标识。
   */
  name = 'foundry-mcp-manifest'

  /**
   * 本次构建唯一的 MCP 内容源。
   */
  private source = ''

  /**
   * 构建产物中的派生清单路径。
   */
  private output = ''

  /**
   * 本轮构建已验证的技能快照。
   */
  private skills: McpSkill[] = []

  /**
   * 定位 MCP 源目录，不使用工作区外的默认路径。
   * @param config Vite 解析后的配置。
   */
  configResolved = (config: ResolvedConfig): void => {
    this.source = path.resolve(config.root, 'src/mcp')
    this.output = path.resolve(config.root, config.build.outDir, 'mcp/manifest.json')
  }

  /**
   * 构建前重新扫描并校验输入，拒绝手写清单与重复身份。
   */
  buildStart = (): void => {
    if (fs.existsSync(path.join(this.source, 'manifest.json')))
      throw new Error('MCP manifest.json 必须由构建生成，不能在 src/mcp 中维护')
    this.skills = collectFiles(this.source, true).map(file => readSkill(file, this.source))
    this.skills.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)
    /**
     * 本轮已发现的身份，用于检测不同目录下的重复 name。
     */
    const names = new Set<string>()
    /**
     * 当前待核对唯一身份的技能。
     */
    for (const skill of this.skills) {
      if (names.has(skill.name))
        throw new Error(`MCP 技能 name 重复：${skill.name}`)
      names.add(skill.name)
    }
  }

  /**
   * 在 Vite 输出阶段写入稳定 JSON，不注入时间戳或开发机路径。
   */
  writeBundle = (): void => {
    fs.mkdirSync(path.dirname(this.output), { recursive: true })
    fs.writeFileSync(this.output, `${JSON.stringify({ version: 1, skills: this.skills }, null, 2)}\n`)
  }
}
