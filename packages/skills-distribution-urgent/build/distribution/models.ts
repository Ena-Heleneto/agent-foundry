/**
 * 首版公开分类不包括内部 eval 内容。
 */
export type SkillCategory = 'coding' | 'frontend' | 'workflow'

/**
 * 紧急交付仅声明 Codex 使用的原字节安装格式。
 */
export type ProjectionId = 'identity'

/**
 * 声明文件的产物根相对路径、原始字节数及小写 SHA-256。
 */
export interface ReleaseFile {
  path: string
  bytes: number
  sha256: string
}

/**
 * 实际安装文件的技能内相对路径及其交付来源；sourcePath 引用 files 中的字节。
 */
export interface ProjectedFile extends ReleaseFile {
  sourcePath: string
}

/**
 * 以声明名称识别技能；投影路径引用顶层对应摘要，避免另维护一套摘要。
 * 项目前提只描述消费者应具备的材料，不作为复制工作区治理的授权。
 */
export interface ReleaseSkill {
  name: string
  category: SkillCategory
  directory: string
  sourceFiles: string[]
  installedFilesByProjection: Record<ProjectionId, string[]>
  requiresSkills: string[]
  projectPrerequisites: string[]
  mountMappingIds: string[]
}

/**
 * skills 每次在线解析 latest；其余工具和 npm 保存已测基线及独立消费下限。
 */
export interface ReleaseTools {
  skills: 'latest'
  specify: '1.2.6'
  node: '>=22.20.0'
  npm: string
  bash: '>=3.2'
  powershell: '>=7.4'
}

/**
 * 正式分发模型；清单不包含自身摘要，catalogDigest 从最终清单字节另算。
 * projections 按投影及技能集中保存安装文件摘要与来源，adapters 引用同一交付表。
 * 兼容字段 development 仅允许 false；结构通过不代表发布或宿主验收通过。
 */
export interface Release {
  schemaVersion: 1
  version: string
  sourceRevision: string
  tools: ReleaseTools
  files: ReleaseFile[]
  skills: ReleaseSkill[]
  projections: Record<ProjectionId, Record<string, ProjectedFile[]>>
  adapters: ReleaseFile[]
  development?: false
}

/**
 * 唯一公开选择，不通过目录发现扩大交付范围。
 */
export const publicSkills: Record<SkillCategory, readonly string[]> = {
  coding: ['business-node-delivery', 'document-changed-symbols'],
  frontend: ['nuxt-ui-styling', 'vue-reactivity'],
  workflow: ['bug-report', 'artifact-project-description', 'artifact-spec-analysis', 'implementation-preparation', 'task-increment'],
}
