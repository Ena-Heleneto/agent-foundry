import type { SourceFile, SourceSnapshot } from './models.js'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { readDependencies } from './dependencies.js'
import { StageError } from './models.js'
import { comparePaths, readConfiguration, readManifest, readSourceTree, sha256 } from './source-files.js'
import { validateFilePaths, validateScope, validateVersion } from './validate.js'

/**
 * Git 操作仅限只读查询，禁用索引刷新锁并移除继承的仓库定位覆盖项。
 */
function git(packageRoot: string, args: string[]): string {
  /**
   * 不修改 process.env；子进程不能受外部 GIT_DIR 等覆盖项误导。
   */
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')))
  /**
   * Git status 不刷新持久化索引，不写调用者仓库。
   */
  const result = spawnSync('git', args, { cwd: packageRoot, env: { ...env, GIT_OPTIONAL_LOCKS: '0' }, encoding: 'utf8', timeout: 15000, maxBuffer: 32 * 1024 * 1024 })
  if (result.error || result.status !== 0)
    throw new StageError('source', 'git-query-failed', packageRoot, result.error?.message ?? result.stderr.trim())
  return result.stdout
}

/**
 * 只读记录实际 pnpm 版本；不触发安装或依赖解析。
 */
function pnpmVersion(packageRoot: string): string {
  /**
   * pnpm 脚本运行时已有实际 user-agent，直接 Node 调用时探测本机 CLI。
   */
  const userAgent = /\bpnpm\/(\d+\.\d+\.\d\S*)/u.exec(process.env.npm_config_user_agent ?? '')
  if (userAgent?.[1])
    return userAgent[1]
  /**
   * 不调用 shell，避免脚本路径或包名成为命令文本。
   */
  const result = spawnSync('pnpm', ['--version'], { cwd: packageRoot, encoding: 'utf8', timeout: 10000 })
  if (result.error || result.status !== 0 || !/^\d+\.\d+\.\d+/u.test(result.stdout.trim()))
    throw new StageError('source', 'missing-toolchain', 'pnpm', '无法取得实际 pnpm 版本')
  return result.stdout.trim()
}

/**
 * 从 HEAD 一次读取受管文件身份，再对实际读取字节逐项比较；包括 git status 看不到的忽略输入。
 */
function uncommittedFiles(packageRoot: string, repositoryRoot: string, sourceRevision: string, inputFiles: SourceFile[], locations: ReadonlyMap<string, string>): string[] {
  /**
   * Git 的 NUL 分隔保护中文、空格及特殊文件名。
   */
  const tree = git(packageRoot, ['ls-tree', '--full-tree', '-r', '-z', sourceRevision])
  /**
   * 文件路径到 Git blob 摘要的映射。
   */
  const tracked = new Map<string, string>()
  /**
   * 每个 NUL 分隔条目对应一个真实 Git 对象。
   */
  for (const item of tree.split('\0')) {
    /**
     * 只比较普通 blob；链接来源已由扫描阶段拒绝。
     */
    const match = /^\d+ blob ([a-f\d]+)\t([\s\S]+)$/u.exec(item)
    if (match?.[1] && match[2])
      tracked.set(match[2], match[1])
  }
  return inputFiles.filter((file) => {
    /**
     * 物理位置只用于对应 Git 相对路径，不写入稳定摘要。
     */
    const location = locations.get(file.path)
    if (!location)
      return true
    /**
     * 按 Git blob 的原始字节算法比较，不执行可配置的 clean filter。
     */
    const blob = createHash('sha1').update(`blob ${file.bytes}\0`).update(file.content).digest('hex')
    return tracked.get(path.relative(repositoryRoot, location).split(path.sep).join('/')) !== blob
  }).map(file => file.path)
}

/**
 * 当前包和工作区的显式配置集合；共享工作区配置只影响身份，不进入产物。
 */
function configurationFiles(packageRoot: string, repositoryRoot: string): { files: SourceFile[], locations: Map<string, string> } {
  /**
   * 合并配置文件及真实位置，便于后续对照 Git blob。
   */
  const files: SourceFile[] = []
  /**
   * 稳定显示路径与实际位置分别维护，摘要不带绝对路径。
   */
  const locations = new Map<string, string>()
  /**
   * 包配置和后续发布说明共同进入来源身份。
   */
  for (const relative of ['package.json', 'vite.config.ts', 'tsconfig.json', 'eslint.config.ts', '.gitignore', 'README.md', 'LICENSE', 'LICENSE.md', 'LICENSE.txt']) {
    /**
     * 构建入口和包声明必须存在，其余配置按实际来源记录。
     */
    const file = readConfiguration(path.join(packageRoot, relative), relative)
    if (file) {
      files.push(file)
      locations.set(file.path, path.join(packageRoot, relative))
    }
    else if (relative === 'package.json' || relative === 'vite.config.ts') {
      throw new StageError('source', 'missing-configuration', relative, '缺少必需构建输入')
    }
  }
  if (repositoryRoot !== packageRoot) {
    /**
     * 共享配置以工作区相对名称记录，不复制到交付目录。
     */
    for (const relative of ['package.json', 'pnpm-workspace.yaml', 'tsconfig.json', 'eslint.config.ts']) {
      /**
       * 工作区配置不复制到产物，但影响构建身份。
       */
      const file = readConfiguration(path.join(repositoryRoot, relative), `@workspace/${relative}`)
      if (file) {
        files.push(file)
        locations.set(file.path, path.join(repositoryRoot, relative))
      }
    }
  }
  return { files, locations }
}

/**
 * 读取实际来源并形成内部快照，不写产物，不导入运行脚本，不查询 Agent。
 */
export async function readSourceSnapshot(options: { packageRoot: string, validationScope: unknown }): Promise<SourceSnapshot> {
  /**
   * 必须先验证用途，未知值不能悄悄降级。
   */
  const validationScope = validateScope(options.validationScope)
  /**
   * 包根路径须明确且不存在目录链接，来源根身份不可隐藏。
   */
  const packageRoot = path.resolve(options.packageRoot)
  readConfiguration(path.join(packageRoot, 'package.json'), 'package.json')
  /**
   * 仓库根与完整 SHA 均来自本次实际 Git 查询。
   */
  const repositoryRoot = git(packageRoot, ['rev-parse', '--show-toplevel']).trim()
  /**
   * 当前 HEAD 是来源参照，不自动表示实际输入都已经提交。
   */
  const sourceRevision = git(packageRoot, ['rev-parse', 'HEAD']).trim()
  if (!/^[a-f\d]{40}$/u.test(sourceRevision))
    throw new StageError('source', 'invalid-source-revision', packageRoot, '需要完整 40 位源码提交 SHA')
  /**
   * 实际包声明同时提供自有版本及直接依赖声明。
   */
  const manifest = readManifest(path.join(packageRoot, 'package.json'))
  /**
   * 自有版本不是工具版本，不能使用不合法版本生成后续清单。
   */
  const version = validateVersion(manifest.version)
  /**
   * 记录文件的实际位置，以便比较 HEAD；稳定文件表不含本机绝对路径。
   */
  const configuration = configurationFiles(packageRoot, repositoryRoot)
  /**
   * 三个必需来源即使为空也必须实际存在。
   */
  const inputFiles = ['src/skills', 'src/mcp', 'script'].flatMap(relative => readSourceTree(packageRoot, relative, true))
  /**
   * 构建实现和本地类型也属于本次真实源码。
   */
  for (const relative of ['build', 'types'])
    inputFiles.push(...readSourceTree(packageRoot, relative, false))
  /**
   * 来源表保持相对路径，实际路径只用于 Git 身份核对。
   */
  for (const file of inputFiles)
    configuration.locations.set(file.path, path.join(packageRoot, file.path))
  inputFiles.push(...configuration.files)
  inputFiles.sort((left, right) => comparePaths(left.path, right.path))
  validateFilePaths(inputFiles)
  /**
   * 真实内容与提交逐项比较，不能只读取 HEAD 就宣称干净。
   */
  const uncommittedInputs = uncommittedFiles(packageRoot, repositoryRoot, sourceRevision, inputFiles, configuration.locations)
  /**
   * 保留完整工作区状态；正式来源要求整个来源工作区干净。
   */
  const gitStatus = git(packageRoot, ['status', '--porcelain=v1', '--untracked-files=all'])
  /**
   * 即使 ignored 输入不出现在 git status，也不能被 full 当作已提交内容。
   */
  const clean = gitStatus.length === 0 && uncommittedInputs.length === 0
  if (validationScope === 'full' && !clean)
    throw new StageError('source', 'dirty-or-untracked-source-revision', uncommittedInputs.join(', ') || packageRoot, '正式来源要求干净提交严格对应实际输入')
  /**
   * 依赖图记录实际安装实例及锁证据，不执行任何依赖代码。
   */
  const dependencySnapshot = readDependencies(packageRoot, manifest, repositoryRoot)
  /**
   * 实际工具版本属于来源证据，不使用预期版本替代运行事实。
   */
  const toolchain = { node: process.version, pnpm: pnpmVersion(packageRoot) }
  /**
   * 摘要只包含稳定相对路径、字节身份和实际依赖/工具，不带时间和绝对根路径。
   */
  const inputDigest = sha256(JSON.stringify({ files: inputFiles.map(file => ({ path: file.path, bytes: file.bytes, sha256: file.sha256 })), dependencyDigest: dependencySnapshot.digest, toolchain }))
  return { packageRoot, repositoryRoot, sourceRevision, version, inputFiles, inputDigest, dependencySnapshot, toolchain, clean, gitStatus, uncommittedInputs, validationScope }
}
