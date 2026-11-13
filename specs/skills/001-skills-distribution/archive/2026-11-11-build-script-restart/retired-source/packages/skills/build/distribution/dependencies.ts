import type { DependencyPackage, DependencySnapshot, SourceFile } from './models.js'
import fs from 'node:fs'
import path from 'node:path'
import { StageError } from './models.js'
import { comparePaths, readManifest, sha256, sourceFile } from './source-files.js'
import { isRecord } from './validate.js'

/**
 * 从实际声明读取依赖字段，非法声明不能静默变为空依赖。
 */
function declarations(manifest: Record<string, unknown>, field: string): Record<string, string> {
  /**
   * 缺省字段表示确实没有该类声明。
   */
  const value = manifest[field]
  if (value === undefined)
    return {}
  if (!isRecord(value) || Object.values(value).some(item => typeof item !== 'string'))
    throw new StageError('source', 'invalid-dependency-declaration', field, '依赖声明必须是字符串映射')
  return value as Record<string, string>
}

/**
 * 按 Node 的 node_modules 祖先查找规则定位声明，不受包 exports 是否开放 package.json 影响。
 */
function resolveManifest(from: string, name: string): string | null {
  if (!/^(?:@[\w.-]+\/)?[\w.-]+$/u.test(name) || name === '.' || name === '..')
    throw new StageError('source', 'invalid-dependency-name', name, '依赖名不能包含越界路径')
  /**
   * 依赖实例从实际 realpath 开始解析，保留 pnpm 的具体 peer 上下文。
   */
  let current = fs.realpathSync(from)
  while (true) {
    /**
     * 不导入包入口，只读取已经安装的声明文件。
     */
    const candidate = path.join(current, 'node_modules', name, 'package.json')
    if (fs.existsSync(candidate))
      return fs.realpathSync(candidate)
    if (path.dirname(current) === current)
      return null
    current = path.dirname(current)
  }
}

/**
 * 依赖实例身份去掉机器绝对前缀，仍保留 pnpm peer 实例和普通嵌套安装区别。
 */
function packageId(manifestPath: string, name: string, version: string): string {
  /**
   * pnpm 安装实例与迁移后的机器根无关。
   */
  const normalized = manifestPath.split(path.sep).join('/')
  /**
   * 最外层 node_modules 之后的路径包含完整嵌套/peer 安装位置。
   */
  const marker = normalized.indexOf('/node_modules/')
  return marker < 0 ? `workspace:${name}@${version}` : normalized.slice(marker + 1, -'/package.json'.length)
}

/**
 * 读取完整已安装依赖图；可选依赖缺失有记录，必需依赖缺失立即失败。
 * 构建包使用全部直接声明，间接包只遍历运行/可选/peer 依赖，不安装开发依赖。
 */
export function readDependencies(packageRoot: string, manifest: Record<string, unknown>, repositoryRoot: string): DependencySnapshot {
  /**
   * 按真实声明位置去重，避免循环依赖无限递归。
   */
  const visited = new Map<string, DependencyPackage>()
  /**
   * 递归只读解析一个实际安装实例。
   */
  function visit(manifestPath: string): string {
    /**
     * 实际实例路径区分同版本的不同 peer 依赖上下文。
     */
    const previous = visited.get(manifestPath)
    if (previous)
      return previous.id
    /**
     * 读取声明而不加载代码。
     */
    const data = readManifest(manifestPath)
    if (typeof data.name !== 'string' || typeof data.version !== 'string')
      throw new StageError('source', 'invalid-dependency-manifest', manifestPath, '依赖缺少名称或实际版本')
    /**
     * 在递归前加入表以支持真实循环依赖。
     */
    const entry: DependencyPackage = { id: packageId(manifestPath, data.name, data.version), name: data.name, version: data.version, manifestDigest: sha256(fs.readFileSync(manifestPath)), dependencies: {}, missingOptional: [] }
    visited.set(manifestPath, entry)
    entry.dependencies = resolveEdges(path.dirname(manifestPath), data, false, entry.missingOptional)
    return entry.id
  }
  /**
   * 每一条必需边必须可解析，缺失可选边保留而非冒认已安装。
   */
  function resolveEdges(from: string, data: Record<string, unknown>, root: boolean, missingOptional: string[]): Record<string, string> {
    /**
     * optional 覆盖同名 dependencies 的必需性，与包管理器声明语义一致。
     */
    const optional = declarations(data, 'optionalDependencies')
    /**
     * peer 元数据仅控制明确声明为 optional 的 peer。
     */
    const peerMeta = isRecord(data.peerDependenciesMeta) ? data.peerDependenciesMeta : {}
    /**
     * 根包 devDependencies 是构建所需，间接包 devDependencies 不参与。
     */
    const all = { ...declarations(data, 'dependencies'), ...declarations(data, 'peerDependencies'), ...(root ? declarations(data, 'devDependencies') : {}), ...optional }
    /**
     * 排序形成稳定图，实际依赖范围仍保留在原始 manifest 摘要中。
     */
    const edges: Record<string, string> = {}
    /**
     * 按声明名顺序解析每条依赖边。
     */
    for (const name of Object.keys(all).sort(comparePaths)) {
      /**
       * 根据实际声明决定缺失是否允许。
       */
      const meta = peerMeta[name]
      /**
       * 不存在的可选平台包与 optional peer 均须明确记载。
       */
      const isOptional = name in optional || (isRecord(meta) && meta.optional === true)
      /**
       * 查找实际安装实例而非只记录版本字符串。
       */
      const resolved = resolveManifest(from, name)
      if (resolved)
        edges[name] = visit(resolved)
      else if (isOptional)
        missingOptional.push(name)
      else
        throw new StageError('source', 'missing-dependency', name, `无法从 ${from} 解析必需依赖`)
    }
    return edges
  }
  /**
   * 根声明与具体依赖实例的关联。
   */
  const missingOptional: string[] = []
  /**
   * 根依赖缺失的可选项也属于完整解析事实。
   */
  const roots = resolveEdges(packageRoot, manifest, true, missingOptional)
  /**
   * 实际锁文件证据包含解析快照；不修改或要求跟踪本仓库忽略的锁文件。
   */
  const lockfiles: SourceFile[] = []
  /**
   * 依赖链接可能来自夹具外的已准备安装，记录其真实安装锁。
   */
  const installation = fs.existsSync(path.join(packageRoot, 'node_modules')) ? fs.realpathSync(path.join(packageRoot, 'node_modules')) : null
  /**
   * 逐项保留来源锁和实际安装锁的原始字节。
   */
  for (const [label, location] of [['package/pnpm-lock.yaml', path.join(packageRoot, 'pnpm-lock.yaml')], ['workspace/pnpm-lock.yaml', path.join(repositoryRoot, 'pnpm-lock.yaml')], ['installed/pnpm-lock.yaml', installation ? path.join(installation, '.pnpm/lock.yaml') : '']]) {
    if (location && fs.existsSync(location))
      lockfiles.push(sourceFile(label ?? '', fs.readFileSync(location)))
  }
  /**
   * 实例集合排序后求图摘要，绝对执行路径不参与。
   */
  const packages = [...visited.values()].sort((left, right) => comparePaths(left.id, right.id))
  return { roots, missingOptional, packages, lockfiles, digest: sha256(JSON.stringify({ roots, missingOptional, packages, lockfiles: lockfiles.map(file => ({ path: file.path, bytes: file.bytes, sha256: file.sha256 })) })) }
}
