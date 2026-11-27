import type { CatalogSkill } from './catalog.ts'
import fs from 'node:fs'
import path from 'node:path'
import { readFiles } from './catalog.ts'
import { projectFiles } from './projection.ts'

/**
 * MVU-A 的互斥选择实验；全选、分类或显式名称只允许一种，不隐含安装五模式。
 */
export interface SkillSelector {
  all?: boolean
  category?: string
  names?: string[]
}

/**
 * 路径计算只消费固定上游配置的安装字段，检测 agent 的路径不属于安装规则。
 */
export interface AgentPaths {
  name: string
  skillsDir: string
  globalSkillsDir?: string
}

/**
 * 明确的安装范围；userHome 由调用方传入，测试不得使用开发者真实目录。
 */
export interface InstallScope {
  project: string
  userHome: string
  global: boolean
}

/**
 * 严格解析本次选择，未知名混合输入也整体拒绝，不扩大到历史安装。
 * @param catalog 已核验公开清单。
 * @param selector 用户显式选择。
 * @returns 去重后的所选技能。
 */
export function selectSkills(catalog: CatalogSkill[], selector: SkillSelector): CatalogSkill[] {
  if ([selector.all === true, selector.category !== undefined, selector.names !== undefined].filter(Boolean).length !== 1)
    throw new Error('必须且只能提供一种技能选择')
  if (selector.all === true) {
    if (!catalog.length)
      throw new Error('公开技能集合为空')
    return [...catalog]
  }
  if (selector.category !== undefined) {
    /**
     * 未公开与空分类均拒绝，不回退整包。
     */
    const selected = catalog.filter(skill => skill.category === selector.category)
    if (!selected.length)
      throw new Error(`分类未公开或为空：${selector.category}`)
    return selected
  }
  if (!selector.names?.length)
    throw new Error('技能名称不能为空')
  return [...new Set(selector.names)].map((name) => {
    /**
     * 用声明身份解析，目录名不代替技能名称。
     */
    const skill = catalog.find(item => item.name === name)
    if (!skill)
      throw new Error(`技能未公开或不存在：${name}`)
    return skill
  })
}

/**
 * 重现官方 copy 模式的路径规则，先拒绝不支持的全局范围。
 * @param agent 固定版本的 agent 配置，环境变量需由配置解析阶段展开。
 * @param scope 已明确的项目与隔离用户目录。
 * @returns 该范围的技能根目录。
 */
export function resolveInstallRoot(agent: AgentPaths, scope: InstallScope): string {
  if (scope.global && agent.globalSkillsDir === undefined)
    throw new Error(`${agent.name} 不支持 global 安装`)
  if (!path.isAbsolute(scope.project) || !path.isAbsolute(scope.userHome))
    throw new Error('项目和用户目录必须是绝对路径')
  if (agent.skillsDir === '.agents/skills')
    return path.join(scope.global ? scope.userHome : scope.project, '.agents/skills')
  return scope.global ? agent.globalSkillsDir! : path.join(scope.project, agent.skillsDir)
}

/**
 * 写入前只读核验整批目标，冲突抛出而不清理或覆盖；不建立安装归属。
 * @param selected 已解析的本次选择。
 * @param root 实际目标技能根。
 * @param agent 用于安装字节投影的 agent 标识。
 * @returns 每项缺失或已满足事实，不代表安装发生时间或所有权。
 */
export function checkTargets(selected: CatalogSkill[], root: string, agent: string): { name: string, status: 'missing' | 'satisfied' }[] {
  checkDirectoryChain(root)
  return selected.map((skill) => {
    /**
     * 名称来自经过校验的目录清单，不从用户输入直接拼接。
     */
    const target = path.join(root, skill.name)
    /**
     * lstat 能识别失效链接；权限错误不能伪装成目标缺失。
     */
    const stat = fs.lstatSync(target, { throwIfNoEntry: false })
    if (!stat)
      return { name: skill.name, status: 'missing' }
    if (stat.isSymbolicLink())
      throw new Error(`技能目标是链接，不能覆盖：${skill.name}`)
    /**
     * 实际完整集合须与投影一致，新增文件也构成冲突。
     */
    const actual = readFiles(target)
    /**
     * 每个目标 agent 对应的预期字节。
     */
    const expected = projectFiles(skill.files, agent)
    if (Object.keys(actual).length !== Object.keys(expected).length || Object.entries(expected).some(([file, encoded]) => actual[file] !== encoded))
      throw new Error(`技能目标已有不同内容：${skill.name}`)
    return { name: skill.name, status: 'satisfied' }
  })
}

/**
 * 安装根及其祖先不能以链接或普通文件伪装为可写目录。
 * @param root 明确的绝对安装根。
 */
function checkDirectoryChain(root: string): void {
  if (!path.isAbsolute(root))
    throw new Error('安装根必须是绝对路径')
  /**
   * 逐层检查至文件系统根；不存在的目录只代表可待后续创建。
   */
  let current = path.resolve(root)
  while (true) {
    /**
     * 不跟随当前条目链接，错误原样传播。
     */
    const stat = fs.lstatSync(current, { throwIfNoEntry: false })
    if (stat?.isSymbolicLink())
      throw new Error(`安装路径包含链接：${current}`)
    if (stat && !stat.isDirectory())
      throw new Error(`安装路径不是目录：${current}`)
    /**
     * 文件系统根的 parent 等于自身。
     */
    const parent = path.dirname(current)
    if (parent === current)
      return
    current = parent
  }
}
