import type { ReleaseFile } from './models.js'
import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { satisfies, validRange } from 'semver'
import { parse } from 'yaml'
import { assertRelativePath, digest, readFiles } from './verify.js'

/**
 * 只在本地保存的源码和依赖身份，不进入公开 Release。
 */
export interface SourceSnapshot {
  sourcePackagePath: string
  sourceRevision: string
  inputFiles: ReleaseFile[]
  inputDigest: string
  dependencySnapshotDigest: string
  dependencies: ReleaseFile[]
}

/**
 * 包声明只读取版本、名称及实际依赖映射，不执行包代码。
 */
interface PackageMetadata {
  name: string
  version: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  optionalDependencies: Record<string, string>
}

/**
 * 本次源码收集的私有路径与依赖字节容器。
 */
interface SourceContext {
  gitRoot: string
  packageRoot: string
  inputs: Map<string, Buffer>
  dependencies: Map<string, Buffer>
  scopes: Set<string>
}

/**
 * 同步调用真实 Git，所有路径通过参数传递，不经过 shell。
 * @param root 当前来源根。
 * @param args Git参数。
 * @returns 原始输出字节。
 */
function git(root: string, args: string[]): Buffer {
  return execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
}

/**
 * 按真实字节及固定字段顺序描述输入文件。
 * @param files 路径与原始字节映射。
 * @returns UTF-8路径字节序的稳定索引。
 */
function indexFiles(files: Map<string, Buffer>): ReleaseFile[] {
  return [...files].map(([file, bytes]) => ({ path: file, bytes: bytes.length, sha256: digest(bytes) })).sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
}

/**
 * 只接受包含字符串值的依赖声明，避免隐式转换失去实际输入事实。
 * @param value JSON依赖映射。
 * @returns 可直接核对的包名与声明。
 */
function dependencyMap(value: unknown): Record<string, string> {
  if (value === undefined)
    return {}
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.values(value).some(item => typeof item !== 'string'))
    throw new Error('来源 package 依赖声明非法')
  return value as Record<string, string>
}

/**
 * 读取真实包元数据，不从环境变量或调用参数推测版本。
 * @param root 实际包根。
 * @returns 本次安装或源码包元数据。
 */
function readPackage(root: string): PackageMetadata {
  /**
   * JSON始终先缩窄，再访问依赖与身份字段。
   */
  const metadata: unknown = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  if (!metadata || typeof metadata !== 'object' || !('name' in metadata) || typeof metadata.name !== 'string' || !('version' in metadata) || typeof metadata.version !== 'string')
    throw new Error('来源 package 缺少实际名称或版本')
  return {
    name: metadata.name,
    version: metadata.version,
    dependencies: dependencyMap('dependencies' in metadata ? metadata.dependencies : undefined),
    devDependencies: dependencyMap('devDependencies' in metadata ? metadata.devDependencies : undefined),
    optionalDependencies: dependencyMap('optionalDependencies' in metadata ? metadata.optionalDependencies : undefined),
  }
}

/**
 * 在Git根内添加普通源码文件，拒绝路径组件链接与越界。
 * @param context 本次私有收集状态。
 * @param absolute 输入的实际路径。
 */
function addInput(context: SourceContext, absolute: string): void {
  /**
   * Git对象路径始终相对真实仓库根。
   */
  const relative = path.relative(context.gitRoot, absolute).split(path.sep).join('/')
  assertRelativePath(relative)
  /**
   * 源码路径不能通过任一中间链接冒认提交身份。
   */
  let current = context.gitRoot
  for (const component of relative.split('/')) {
    current = path.join(current, component)
    if (fs.lstatSync(current).isSymbolicLink())
      throw new Error(`来源输入不能包含链接：${relative}`)
  }
  if (!fs.lstatSync(absolute).isFile())
    throw new Error(`来源输入必须是普通文件：${relative}`)
  context.scopes.add(relative)
  context.inputs.set(relative, fs.readFileSync(absolute))
}

/**
 * 仅枚举实际消费的来源树，忽略规则不能隐藏新增输入。
 * @param context 本次收集状态。
 * @param directory 已声明的源码目录。
 */
function addSourceTree(context: SourceContext, directory: string): void {
  context.scopes.add(path.relative(context.gitRoot, directory).split(path.sep).join('/'))
  if (!fs.lstatSync(directory, { throwIfNoEntry: false }))
    return
  for (const file of Object.keys(readFiles(directory, { official: false })))
    addInput(context, path.join(directory, file))
}

/**
 * 加入包配置和构建说明，输出、测试与无关工作区文件不进入输入闭包。
 * @param context 本次收集状态。
 * @param root 当前源码包根。
 */
function addPackageInputs(context: SourceContext, root: string): void {
  for (const file of ['package.json', 'README.md', 'LICENSE', 'tsconfig.json', 'vite.config.ts', 'vite.config.mjs', 'eslint.config.ts', 'eslint.config.mjs', '.npmrc']) {
    context.scopes.add(path.relative(context.gitRoot, path.join(root, file)).split(path.sep).join('/'))
    if (fs.lstatSync(path.join(root, file), { throwIfNoEntry: false }))
      addInput(context, path.join(root, file))
  }
  for (const directory of ['src', 'script', 'build', 'types'])
    addSourceTree(context, path.join(root, directory))
}

/**
 * 解析实际安装的包目录，保留Node逐层node_modules查找语义。
 * @param from 当前声明依赖的包根。
 * @param name 实际依赖名称。
 * @returns 解析后的真实目录，缺失时不猜测全局安装。
 */
function resolveDependency(from: string, name: string): string | undefined {
  /**
   * 依赖路径不能被包名中的越界片段改变。
   */
  const components = name.split('/')
  if (components.some(part => !part || part === '.' || part === '..') || (name.startsWith('@') ? components.length !== 2 : components.length !== 1))
    throw new Error(`来源依赖名称非法：${name}`)
  /**
   * 安装目录可以是包管理器链接，源码输入自身另行拒绝链接。
   */
  let current = from
  while (true) {
    /**
     * 先使用当前包解析位置，避免误读其他版本。
     */
    const candidate = path.join(current, 'node_modules', name)
    if (fs.existsSync(path.join(candidate, 'package.json')))
      return fs.realpathSync(candidate)
    if (path.dirname(current) === current)
      return undefined
    current = path.dirname(current)
  }
}

/**
 * 保存真实依赖文件，仓库内生成物用相对路径，外部包使用稳定逻辑身份。
 * @param context 本次收集状态。
 * @param absolute 已解析文件。
 * @param logical 位于仓库外时使用的稳定标识。
 */
function addDependencyFile(context: SourceContext, absolute: string, logical: string): void {
  /**
   * 仓库相对路径不会包含作者机器的绝对位置。
   */
  const relative = path.relative(context.gitRoot, absolute).split(path.sep).join('/')
  /**
   * node_modules的物理安装布局不作为外部工具的稳定身份。
   */
  const key = !relative.startsWith('../') && !relative.split('/').includes('node_modules') ? relative : logical
  assertRelativePath(key)
  context.dependencies.set(key, fs.readFileSync(absolute))
}

/**
 * 工作区依赖的正式源码与实际生成字节分别留证。
 * @param context 本次收集状态。
 * @param root 实际解析的工作区依赖根。
 */
function addWorkspacePackage(context: SourceContext, root: string): void {
  /**
   * 必须位于同一真实Git根内，不能默默使用外部工作区源码。
   */
  const relative = path.relative(context.gitRoot, root).split(path.sep).join('/')
  assertRelativePath(relative)
  for (const file of ['package.json', 'tsconfig.json', 'vite.config.ts', 'vite.config.mjs']) {
    context.scopes.add(path.relative(context.gitRoot, path.join(root, file)).split(path.sep).join('/'))
    if (fs.lstatSync(path.join(root, file), { throwIfNoEntry: false }))
      addInput(context, path.join(root, file))
  }
  for (const directory of ['build', 'src/eslint-config', 'src/tsconfig-json'])
    addSourceTree(context, path.join(root, directory))
  for (const directory of ['dist/eslint-config', 'dist/tsconfig-json']) {
    /**
     * 实际消费的预设输出必须存在，不用源码假装已构建。
     */
    const output = path.join(root, directory)
    if (!fs.existsSync(output))
      throw new Error(`缺少实际工作区生成依赖：${relative}/${directory}`)
    for (const file of Object.keys(readFiles(output, { official: false })))
      addDependencyFile(context, path.join(output, file), `${relative}/${directory}/${file}`)
  }
}

/**
 * 校验catalog实际声明，并将根配置纳入真实提交闭包。
 * @param context 本次收集状态。
 * @param declarations 包的直接依赖声明。
 */
function addWorkspaceConfiguration(context: SourceContext, declarations: Record<string, string>): Record<string, string> {
  if (!Object.values(declarations).some(value => value.startsWith('workspace:') || value.startsWith('catalog:')))
    return declarations
  addInput(context, path.join(context.gitRoot, 'pnpm-workspace.yaml'))
  addInput(context, path.join(context.gitRoot, 'package.json'))
  /**
   * YAML只读取声明，不执行配置或将其写回。
   */
  const configuration: unknown = parse(fs.readFileSync(path.join(context.gitRoot, 'pnpm-workspace.yaml'), 'utf8'))
  if (!configuration || typeof configuration !== 'object')
    throw new Error('来源工作区catalog配置非法')
  /**
   * 实际声明范围由同版catalog解析，随后与安装版本逐条比对。
   */
  const resolved = { ...declarations }
  for (const [name, declaration] of Object.entries(declarations)) {
    if (!declaration.startsWith('catalog:'))
      continue
    /**
     * 空组名为pnpm默认catalog，其余走命名catalogs。
     */
    const group = declaration.slice('catalog:'.length)
    /**
     * 按当前声明定位，不能回退其他组或历史版本表。
     */
    const catalogs = 'catalogs' in configuration && configuration.catalogs && typeof configuration.catalogs === 'object' ? configuration.catalogs : {}
    /**
     * 组映射经运行时缩窄后再访问包名。
     */
    const catalog: unknown = group ? Reflect.get(catalogs, group) : 'catalog' in configuration ? configuration.catalog : undefined
    if (!catalog || typeof catalog !== 'object' || typeof Reflect.get(catalog, name) !== 'string')
      throw new Error(`来源catalog缺少实际依赖声明：${name}`)
    resolved[name] = Reflect.get(catalog, name) as string
  }
  return resolved
}

/**
 * 核验实际安装身份和范围，支持明确npm别名及工作区协议。
 * @param name 声明的解析名称。
 * @param declaration 已解析catalog后的实际范围。
 * @param metadata 当前安装包元数据。
 */
function verifyDependencyVersion(name: string, declaration: string, metadata: PackageMetadata): void {
  /**
   * npm别名明确指定真实名称，不能把未知名称漂移当别名。
   */
  const alias = declaration.startsWith('npm:') ? declaration.slice('npm:'.length) : undefined
  /**
   * 作用域名称开头的@不是范围分隔符，使用最后一个@。
   */
  const separator = alias?.lastIndexOf('@') ?? -1
  /**
   * 普通名称严格相同，别名按其明确目标核对。
   */
  const expectedName = alias && separator > 0 ? alias.slice(0, separator) : name
  /**
   * workspace:*及裸^/~表示当前工作区版本，其余为明确SemVer范围。
   */
  const requested = alias && separator > 0 ? alias.slice(separator + 1) : declaration.replace(/^workspace:/u, '')
  /**
   * 工作区简写不会绕过名称核验，实际源码仍进入Git闭包。
   */
  const range = declaration.startsWith('workspace:') && ['*', '^', '~'].includes(requested) ? '*' : requested
  if (metadata.name !== expectedName || !validRange(range) || !satisfies(metadata.version, range))
    throw new Error(`实际依赖解析版本与声明不一致：${name} ${declaration}，实际${metadata.name}@${metadata.version}`)
}

/**
 * 记录实际解析的依赖图元数据，不复制或执行依赖树。
 * @param context 本次收集状态。
 * @param from 当前依赖声明根。
 * @param declarations 实际依赖声明。
 * @param seen 已记录真实包根，防止循环。
 * @param optional 可缺失的可选依赖名称。
 */
function collectDependencies(context: SourceContext, from: string, declarations: Record<string, string>, seen: Set<string>, optional: Set<string> = new Set()): void {
  for (const [name, declaration] of Object.entries(declarations)) {
    /**
     * 当前Node查找规则下的实际依赖目录。
     */
    const dependencyRoot = resolveDependency(from, name)
    if (!dependencyRoot) {
      if (optional.has(name))
        continue
      throw new Error(`缺少实际来源依赖：${name}`)
    }
    /**
     * 真实版本及依赖边来自安装文件，不从锁或catalog推测。
     */
    const metadata = readPackage(dependencyRoot)
    verifyDependencyVersion(name, declaration, metadata)
    if (seen.has(dependencyRoot))
      continue
    seen.add(dependencyRoot)
    addDependencyFile(context, path.join(dependencyRoot, 'package.json'), `resolved/${metadata.name}@${metadata.version}/package.json`)
    if (declaration.startsWith('workspace:'))
      addWorkspacePackage(context, dependencyRoot)
    /**
     * 工作区包自身的catalog依赖也解析同版配置，不只核对入口包。
     */
    const nested = addWorkspaceConfiguration(context, { ...metadata.dependencies, ...metadata.optionalDependencies })
    collectDependencies(context, dependencyRoot, nested, seen, new Set(Object.keys(metadata.optionalDependencies)))
  }
}

/**
 * 核对源码全集与固定提交，缺失的忽略文件同样拒绝。
 * @param context 本次原始输入。
 * @param revision 实际Git提交。
 */
function verifyCommittedInputs(context: SourceContext, revision: string): void {
  /**
   * 当前来源范围中的已提交文件全集，包含被工作树删除的输入。
   */
  const committedPaths = git(context.gitRoot, ['ls-tree', '-r', '-z', '--name-only', revision, '--', ...context.scopes]).toString('utf8').split('\0').filter(Boolean)
  for (const file of committedPaths) {
    if (!context.inputs.has(file))
      throw new Error(`已提交来源输入缺失或被删除：${file}`)
  }
  for (const [file, bytes] of context.inputs) {
    /**
     * Git使用根相对路径，含空格路径也不会被shell拆分。
     */
    let committed: Buffer
    try {
      committed = git(context.gitRoot, ['show', `${revision}:${file}`])
    }
    catch {
      throw new Error(`来源输入不在实际提交中或未跟踪：${file}`)
    }
    if (!committed.equals(bytes))
      throw new Error(`来源输入字节与实际源码提交不同：${file}`)
  }
}

/**
 * 读取一份完整实际来源和依赖事实，调用方随后复核漂移。
 * @param root 当前包根，可以是Git根内嵌套目录。
 * @returns 包版本与仅供本地留证的来源索引。
 */
export function captureSource(root: string): { version: string, source: SourceSnapshot } {
  /**
   * Git根和包根各自规范化，不能把父工程当作独立包。
   */
  const packageRoot = fs.realpathSync(root)
  /**
   * 实际Git根由真实工具解析，不接受参数或环境覆盖。
   */
  const gitRoot = fs.realpathSync(git(packageRoot, ['rev-parse', '--show-toplevel']).toString('utf8').trim())
  /**
   * 本次提交身份在读取固定内容前取得。
   */
  const sourceRevision = git(gitRoot, ['rev-parse', '--verify', 'HEAD^{commit}']).toString('utf8').trim()
  /**
   * 所有输入和生成依赖各自保持原始字节。
   */
  const context: SourceContext = { gitRoot, packageRoot, inputs: new Map(), dependencies: new Map(), scopes: new Set() }
  /**
   * 包版本和声明来自当前来源的实际文件。
   */
  const metadata = readPackage(packageRoot)
  /**
   * 构建工具及配置工具均须记录实际解析版本。
   */
  const declarations = { ...metadata.dependencies, ...metadata.devDependencies }
  addPackageInputs(context, packageRoot)
  /**
   * 声明的catalog范围与实际工具版本必须相符。
   */
  const resolved = addWorkspaceConfiguration(context, declarations)
  collectDependencies(context, packageRoot, resolved, new Set())
  /**
   * 根锁可能不被Git跟踪，但当前字节仍属于依赖证据。
   */
  const lock = path.join(gitRoot, 'pnpm-lock.yaml')
  if (fs.existsSync(lock))
    addDependencyFile(context, lock, 'pnpm-lock.yaml')
  verifyCommittedInputs(context, sourceRevision)
  /**
   * 输入索引与依赖索引分别计算，不能把忽略生成物当Git源码。
   */
  const inputFiles = indexFiles(context.inputs)
  /**
   * 依赖版本、解析元数据和生成字节固定为同次索引。
   */
  const dependencies = indexFiles(context.dependencies)
  return {
    version: metadata.version,
    source: {
      sourcePackagePath: path.relative(gitRoot, packageRoot).split(path.sep).join('/') || '.',
      sourceRevision,
      inputFiles,
      inputDigest: digest(Buffer.from(JSON.stringify(inputFiles))),
      dependencySnapshotDigest: digest(Buffer.from(JSON.stringify(dependencies))),
      dependencies,
    },
  }
}

/**
 * 重新读取实际来源，识别提交、文件集合、字节及生成依赖漂移。
 * @param root 实际包根。
 * @param expected 已固定的原始来源。
 */
export function verifySource(root: string, expected: SourceSnapshot): void {
  /**
   * 重新枚举而非只读旧文件表，新增输入也不能漏过。
   */
  const actual = captureSource(root).source
  if (actual.sourceRevision !== expected.sourceRevision || actual.sourcePackagePath !== expected.sourcePackagePath || actual.inputDigest !== expected.inputDigest || actual.dependencySnapshotDigest !== expected.dependencySnapshotDigest)
    throw new Error('构建读取期间来源输入、提交或实际依赖发生变化')
}
