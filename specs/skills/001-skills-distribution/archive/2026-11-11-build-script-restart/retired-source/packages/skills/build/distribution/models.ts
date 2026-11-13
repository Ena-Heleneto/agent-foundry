import type { Buffer } from 'node:buffer'

/**
 * 来源验证用途；开发与隔离结果均不具有正式发布资格。
 */
export type ValidationScope = 'development' | 'isolated' | 'full'

/**
 * 已固定的原始文件，path 为稳定相对路径，content 为原始字节。
 */
export interface SourceFile {
  path: string
  content: Buffer
  bytes: number
  sha256: string
}

/**
 * 一项实际解析的依赖；边指向具体安装实例，缺失的可选边单独记录。
 */
export interface DependencyPackage {
  id: string
  name: string
  version: string
  manifestDigest: string
  dependencies: Record<string, string>
  missingOptional: string[]
}

/**
 * 完整已解析依赖图与安装锁证据，不把直接声明当作间接依赖事实。
 */
export interface DependencySnapshot {
  roots: Record<string, string>
  missingOptional: string[]
  packages: DependencyPackage[]
  lockfiles: SourceFile[]
  digest: string
}

/**
 * 固定本次来源和真实工具证据；绝对路径仅用于本地执行和诊断。
 */
export interface SourceSnapshot {
  packageRoot: string
  repositoryRoot: string
  sourceRevision: string
  version: string
  inputFiles: SourceFile[]
  inputDigest: string
  dependencySnapshot: DependencySnapshot
  toolchain: { node: string, pnpm: string }
  clean: boolean
  gitStatus: string
  uncommittedInputs: string[]
  validationScope: ValidationScope
}

/**
 * MCP 自动清单技能，skill 保留完整原文，references 保留相对名称和文本。
 */
export interface McpSkill {
  name: string
  description: string
  destructive: boolean
  category: string | null
  skill: string
  references: { name: string, content: string }[]
}

/**
 * MCP 自动清单的既定线格式，不带生成时间。
 */
export interface McpManifest {
  version: 1
  skills: McpSkill[]
}

/**
 * 仅包含原始三目录及 MCP 的基础计划，kind 防止冒充后续完整 BuildPlan。
 */
export interface BaseBuildPlan {
  kind: 'base'
  sourceRevision: string
  inputDigest: string
  outputRoot: string
  files: SourceFile[]
  mcpManifest: McpManifest
}

/**
 * 来源或计划阶段失败；本阶段只读，written 始终为空，调用方可据恢复条件续接。
 */
export class StageError extends Error {
  /**
   * 失败所在的内部阶段。
   */
  readonly stage: 'source' | 'plan'

  /**
   * 可定位的原因分类，不靠自由文本判断错误类型。
   */
  readonly reasonCode: string

  /**
   * 与失败关联的本地文件或输入字段。
   */
  readonly file: string

  /**
   * 来源与计划阶段没有写入对象，不虚构后续阶段的回滚。
   */
  readonly written: readonly string[] = []

  /**
   * 修复输入后重新读取来源，不能沿用失败快照。
   */
  readonly continueWhen = '修复所列输入后重新读取来源并形成计划'

  /**
   * 将阶段、文件和原因作为结构化诊断保存。
   */
  constructor(stage: 'source' | 'plan', reasonCode: string, file: string, detail: string) {
    super(`${stage}/${reasonCode}：${file}：${detail}`)
    this.name = 'StageError'
    this.stage = stage
    this.reasonCode = reasonCode
    this.file = file
  }
}
