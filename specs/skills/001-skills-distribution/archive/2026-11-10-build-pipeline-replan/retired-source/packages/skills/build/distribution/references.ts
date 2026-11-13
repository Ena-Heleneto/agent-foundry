import type { CatalogSkill } from './export.js'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { assertRelativePath } from './verify.js'

/**
 * 读取 Markdown 引用式导航，覆盖完整、折叠与已有定义的快捷引用。
 * @param prose 已移除代码示例的正文。
 * @returns 实际被使用的引用定义目标，未使用的定义不算必需附件。
 */
function referenceLinks(prose: string): string[] {
  /**
   * CommonMark 标签忽略大小写并折叠中间空白。
   * @param label 原始引用标签。
   * @returns 用于匹配定义的统一标签。
   */
  function normalize(label: string): string {
    return label.trim().replace(/\s+/gu, ' ').toLowerCase()
  }
  /**
   * 同一标签以首次定义为准，目标允许使用尖括号。
   */
  const definitions = new Map<string, string>()
  /**
   * 定义行不再作为快捷引用自身触发导航检查。
   */
  const body = prose.replace(/^ {0,3}\[([^\]\n]+)\]:(.*)$/gmu, (line, label: string, definition: string) => {
    /**
     * 先隔离定义行，再读取第一个目标，标题不参与文件定位。
     */
    const match = definition.trimStart().match(/^(?:<([^>]+)>|(\S+))/u)
    if (!match)
      return line
    if (!definitions.has(normalize(label)))
      definitions.set(normalize(label), match[1] ?? match[2]!)
    return ''
  })
  /**
   * 只保留匹配到有效定义的真实引用。
   */
  const targets: string[] = []
  /**
   * 行内链接由原有解析分支处理，此处排除其括号形式。
   */
  for (const match of body.matchAll(/\[([^\]]+)\](?:\[([^\]]*)\])?(?!\()/gu)) {
    /**
     * 空显式标签和快捷引用都回退到显示文本。
     */
    const target = definitions.get(normalize(match[2] || match[1]!))
    if (target)
      targets.push(target)
  }
  return targets
}

/**
 * 识别引用实际所属的公开技能，并拒绝安装后无法保留或缺失的跨技能附件。
 * @param skill 发出引用的技能。
 * @param catalog 本次公开的完整集合。
 * @param relative 已解码的本地引用。
 * @returns 跨技能依赖名称；技能自身或项目材料留给调用方处理。
 */
function referenceOwner(skill: CatalogSkill, catalog: CatalogSkill[], relative: string): string | undefined {
  /**
   * 来源路径匹配真实目录，不靠名称相似猜依赖。
   */
  const absolute = path.resolve(skill.directory, relative)
  /**
   * 仅本次公开的实际来源能成为依赖。
   */
  const owner = catalog.find(item => absolute.startsWith(`${item.directory}${path.sep}`))
  if (!owner || owner.name === skill.name)
    return undefined
  if (!relative.startsWith(`../${owner.name}/`))
    throw new Error(`跨技能引用路径无法在安装后保持：${relative}`)
  /**
   * 依赖附件在所属技能中也必须存在。
   */
  const attachment = path.relative(owner.directory, absolute).split(path.sep).join('/')
  if (!Object.hasOwn(owner.files, attachment))
    throw new Error(`跨技能引用缺少附件：${owner.name}/${attachment}`)
  return owner.name
}

/**
 * 分类正文真实附件、显式跨技能依赖与消费者项目前提，代码示例不当成附件。
 * @param skill 当前完整技能。
 * @param catalog 本次明确公开的技能集合。
 * @returns 去重后的依赖身份与目标项目材料，不复制治理文件。
 */
export function analyzeReferences(skill: CatalogSkill, catalog: CatalogSkill[]): { requiresSkills: string[], projectPrerequisites: string[] } {
  /**
   * 先移除围栏示例，避免讲解用路径被当作交付引用。
   */
  const text = Buffer.from(skill.files['SKILL.md']!, 'base64').toString('utf8').replace(/^(```|~~~)[\s\S]+?^\1[^\n]*$/gmu, '')
  /**
   * references 反引号路径是现有技能采用的真实附件导航。
   */
  const targets = [...text.matchAll(/`(references\/[^`\s]+)`/gu)].map(match => match[1]!)
  /**
   * 行内代码内的 Markdown 只是示例，不触发本地附件检查。
   */
  const prose = text.replace(/`[^`]*`/gu, '')
  targets.push(...[...prose.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/gu)].map(match => match[1]!))
  targets.push(...referenceLinks(prose))
  /**
   * 依赖只记录声明身份，不隐式补装。
   */
  const requiresSkills = new Set<string>()
  /**
   * 消费者必须提供的项目材料，不从本工作区复制。
   */
  const projectPrerequisites = new Set<string>()
  /**
   * 所有真实导航逐个分类并校验。
   */
  for (const target of targets) {
    if (/^(?:https?:\/\/|mailto:|#)/iu.test(target))
      continue
    /**
     * 锚点不参与文件定位，但保留原引用的项目语义。
     */
    const relative = decodeURIComponent(target.split('#')[0]!).replace(/^\.\//u, '')
    if (path.isAbsolute(relative) || relative.includes('\\') || relative.includes(':'))
      throw new Error(`技能引用包含不可移植的绝对路径：${skill.name}/${relative}`)
    if (relative.startsWith('.specify/') || ['AGENTS.md', 'spec.md', 'plan.md', 'mvu.md', 'tasks.md'].includes(relative)) {
      assertRelativePath(relative)
      projectPrerequisites.add(relative)
      continue
    }
    /**
     * 跨技能引用只能指向本次公开集合中的实际文件。
     */
    const owner = referenceOwner(skill, catalog, relative)
    if (owner) {
      requiresSkills.add(owner)
      continue
    }
    assertRelativePath(relative)
    if (!Object.hasOwn(skill.files, relative) && !Object.keys(skill.files).some(file => file.startsWith(`${relative}/`)))
      throw new Error(`技能引用的必要附件缺失：${skill.name}/${relative}`)
  }
  return { requiresSkills: [...requiresSkills].sort(), projectPrerequisites: [...projectPrerequisites].sort() }
}
