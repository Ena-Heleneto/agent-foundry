import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

/**
 * 当前紧急包源码根；测试依赖由工作区提供，消费夹具不读取作者配置。
 */
export const packageRoot = fileURLToPath(new URL('../../', import.meta.url))

/**
 * 在独占Git根中准备带空格的嵌套包与真实工作区依赖样本。
 * 预设源码、导出及生成字节均属于测试数据，不冒充正式工程验收。
 * @param {object} sandbox 当前独占沙箱。
 * @returns {object} Git根、包根、包相对路径和首次真实提交。
 */
export function createWorkspaceSourceFixture(sandbox) {
  /**
   * 空格路径验证Git参数不依赖shell拆词或包根等于仓库根。
   */
  const sourcePackagePath = 'packages/urgent skills'
  /**
   * 本次拥有的正式来源样本根。
   */
  const sourceRoot = path.join(sandbox.project, sourcePackagePath)
  fs.mkdirSync(sourceRoot, { recursive: true })
  /**
   * 构建、正文与运行材料按已核验副本保留原字节。
   */
  for (const directory of ['src', 'script', 'build'])
    fs.cpSync(path.join(packageRoot, directory), path.join(sourceRoot, directory), { recursive: true })
  fs.copyFileSync(path.join(packageRoot, 'vite.config.ts'), path.join(sourceRoot, 'vite.config.ts'))
  fs.writeFileSync(path.join(sourceRoot, 'README.md'), '嵌套工作区来源测试，不是正式发布候选。\n')
  fs.writeFileSync(path.join(sourceRoot, 'LICENSE'), 'TEST FIXTURE ONLY. Not a public license.\n')
  fs.writeFileSync(path.join(sourceRoot, 'package.json'), `${JSON.stringify({ name: '@fixture/urgent-skills', version: '0.1.0', type: 'module', devDependencies: { '@foundry/preset-config': 'workspace:*', 'yaml': 'catalog:shared' } }, null, 2)}\n`)
  fs.writeFileSync(path.join(sourceRoot, 'tsconfig.json'), '{"extends":"@foundry/preset-config/tsconfig-json/tsconfig.json","compilerOptions":{"strict":true}}\n')
  fs.writeFileSync(path.join(sourceRoot, 'eslint.config.mjs'), 'import preset from \'@foundry/preset-config/eslint-config\'\nexport default preset()\n')
  addWorkspaceDependencyFixture(sandbox, sourceRoot)
  git(sandbox, ['init', '-b', 'main'])
  git(sandbox, ['add', '.'])
  git(sandbox, ['commit', '-m', 'test: record workspace source'])
  return { root: sandbox.project, sourceRoot, sourcePackagePath, sourceRevision: git(sandbox, ['rev-parse', 'HEAD']) }
}

/**
 * 明确提供catalog、共享预设源码/生成物、忽略根锁与实际yaml解析位置。
 * @param {object} sandbox 当前拥有的工作区根。
 * @param {string} sourceRoot 当前嵌套包根。
 */
function addWorkspaceDependencyFixture(sandbox, sourceRoot) {
  /**
   * 共享预设的源码和输出分别进入输入证据与生成依赖证据。
   */
  const presetRoot = path.join(sandbox.project, 'packages/preset-config')
  /**
   * 源码与生成目录分开，禁止把被忽略产物计为Git源码。
   */
  for (const directory of ['src/tsconfig-json', 'src/eslint-config', 'dist/tsconfig-json', 'dist/eslint-config'])
    fs.mkdirSync(path.join(presetRoot, directory), { recursive: true })
  fs.writeFileSync(path.join(presetRoot, 'package.json'), '{"name":"@foundry/preset-config","version":"1.0.0","type":"module","exports":{"./*.json":"./dist/*.json","./*":{"import":"./dist/*/index.js"}}}\n')
  fs.writeFileSync(path.join(presetRoot, 'src/tsconfig-json/tsconfig.json'), '{"compilerOptions":{"strict":true}}\n')
  fs.writeFileSync(path.join(presetRoot, 'src/eslint-config/index.ts'), 'export default () => []\n')
  fs.writeFileSync(path.join(presetRoot, 'dist/tsconfig-json/tsconfig.json'), '{"compilerOptions":{"strict":true}}\n')
  fs.writeFileSync(path.join(presetRoot, 'dist/eslint-config/index.js'), 'export default () => []\n')
  /**
   * 使用本次已安装的真实yaml包，不在测试中伪造工具版本或复制依赖树。
   */
  const yamlRoot = fs.realpathSync(path.join(packageRoot, 'node_modules/yaml'))
  /**
   * catalog值与实际解析包版本相同，可独立破坏其中之一观察拒绝。
   */
  const yamlVersion = JSON.parse(fs.readFileSync(path.join(yamlRoot, 'package.json'), 'utf8')).version
  fs.writeFileSync(path.join(sandbox.project, 'package.json'), '{"name":"fixture-workspace","private":true,"type":"module"}\n')
  fs.writeFileSync(path.join(sandbox.project, 'pnpm-workspace.yaml'), `packages:\n  - packages/*\ncatalogs:\n  shared:\n    yaml: ${yamlVersion}\n`)
  fs.writeFileSync(path.join(sandbox.project, '.gitignore'), 'node_modules/\npackages/preset-config/dist/\npnpm-lock.yaml\n')
  fs.writeFileSync(path.join(sandbox.project, 'pnpm-lock.yaml'), `lockfileVersion: '9.0'\nimporters:\n  'packages/urgent skills':\n    devDependencies:\n      yaml:\n        specifier: catalog:shared\n        version: ${yamlVersion}\n`)
  fs.mkdirSync(path.join(sourceRoot, 'node_modules/@foundry'), { recursive: true })
  fs.symlinkSync(presetRoot, path.join(sourceRoot, 'node_modules/@foundry/preset-config'), 'dir')
  fs.symlinkSync(yamlRoot, path.join(sourceRoot, 'node_modules/yaml'), 'dir')
}

/**
 * 创建本次独占的项目、用户、缓存与临时文件目录。
 * @returns {object} 自有目录、环境和清理函数。
 */
export function createUrgentSandbox() {
  /**
   * 所有测试写入均限制在该唯一临时根内。
   */
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'urgent-contract-'))
  /**
   * 项目与用户目录分别保留，便于检查越权写入。
   */
  const project = path.join(root, 'project')
  /**
   * Git 与官方工具使用隔离用户上下文。
   */
  const userHome = path.join(root, 'user')
  for (const directory of [project, userHome, path.join(root, 'tmp'), path.join(root, 'bin')])
    fs.mkdirSync(directory, { recursive: true })
  return {
    root,
    project,
    userHome,
    env: { ...process.env, HOME: userHome, XDG_CONFIG_HOME: path.join(userHome, '.config'), XDG_CACHE_HOME: path.join(userHome, '.cache'), npm_config_cache: path.join(root, 'npm-cache'), TMPDIR: path.join(root, 'tmp'), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_NAME: 'Urgent sandbox', GIT_AUTHOR_EMAIL: 'sandbox@example.invalid', GIT_COMMITTER_NAME: 'Urgent sandbox', GIT_COMMITTER_EMAIL: 'sandbox@example.invalid', GIT_CEILING_DIRECTORIES: root, PATH: `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH}` },
    cleanup() { fs.rmSync(root, { recursive: true, force: true }) },
  }
}

/**
 * 实际执行命令并保留失败退出码；启动或信号错误属于环境失败。
 * @param {object} sandbox 当前拥有的消费环境。
 * @param {string} command 可执行文件。
 * @param {string[]} args 参数数组，不经过 shell 展开。
 * @param {object} options 可覆盖 cwd 和环境。
 * @returns {object} 实际进程结果。
 */
export function runCommand(sandbox, command, args, options = {}) {
  /**
   * 故障注入仅改变明确的外部进程，不替代产品逻辑。
   */
  const result = spawnSync(command, args, { cwd: sandbox.project, env: sandbox.env, encoding: 'utf8', timeout: 60000, ...options })
  assert.ifError(result.error)
  assert.equal(result.signal, null, result.stderr)
  return result
}

/**
 * 执行真实 Git；失败须终止当前测试，不能被当成产品红灯。
 * @param {object} sandbox 自有测试环境。
 * @param {string[]} args Git 参数。
 * @param {string} cwd 自有工作树或 bare 仓库。
 * @returns {string} Git 标准输出。
 */
export function git(sandbox, args, cwd = sandbox.project) {
  /**
   * 本地 Git 结果与测试产品返回分开判断。
   */
  const result = runCommand(sandbox, 'git', args, { cwd })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

/**
 * 读取完整树事实，包括链接自身；不用产品文件索引生成预期。
 * @param {string} root 自有目录。
 * @returns {object} 稳定可比较的完整树。
 */
export function snapshotTree(root) {
  /**
   * 空目录也作为可观察副作用保留。
   */
  const output = {}
  for (const relative of fs.readdirSync(root, { recursive: true }).sort()) {
    /**
     * 使用 lstat 防止跟随链接读取未知目标。
     */
    const absolute = path.join(root, relative)
    /**
     * 链接、目录和普通字节分别表示。
     */
    const entry = fs.lstatSync(absolute)
    output[relative] = entry.isSymbolicLink() ? `link:${fs.readlinkSync(absolute)}` : entry.isDirectory() ? 'directory' : fs.readFileSync(absolute).toString('base64')
  }
  return output
}

/**
 * 计算样本文件的原始字节摘要；不调用产品摘要函数。
 * @param {string} root 自有 payload 根。
 * @param {string} relative payload 内路径。
 * @returns {object} 固定 path/bytes/sha256 字段顺序。
 */
export function describeFixtureFile(root, relative) {
  /**
   * 附件二进制不经过字符串重新编码。
   */
  const bytes = fs.readFileSync(path.join(root, relative))
  return { path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}

/**
 * 创建 schemaVersion=1 的真实文件样本，附带完整脚本供入口测试。
 * LICENSE 明确为测试数据，不作为公开候选的许可来源。
 * @param {object} sandbox 本次拥有的目录。
 * @param {object} options workflow=true 时增加三个工作流技能。
 * @returns {object} payload 根、清单及可重复写回函数。
 */
export function createReleaseFixture(sandbox, options = {}) {
  /**
   * 不与编译输出、消费目标或 bare Git 共用路径。
   */
  const root = path.join(sandbox.root, 'payload')
  fs.mkdirSync(root)
  fs.cpSync(path.join(packageRoot, 'script'), path.join(root, 'script'), { recursive: true })
  fs.writeFileSync(path.join(root, 'README.md'), '隔离测试样本，不能用于真实发布。\n')
  fs.writeFileSync(path.join(root, 'LICENSE'), 'TEST FIXTURE ONLY. Not a public license.\n')
  /**
   * 三项工作流样本只用于调用与依赖验证，不假冒真实正文加载证据。
   */
  const definitions = options.workflow
    ? [['workflow', 'artifact-spec-analysis'], ['workflow', 'implementation-preparation'], ['workflow', 'task-increment']]
    : [['coding', 'document-changed-symbols']]
  for (const [category, name] of definitions) {
    fs.mkdirSync(path.join(root, 'skills', category, name, 'references'), { recursive: true })
    fs.writeFileSync(path.join(root, 'skills', category, name, 'SKILL.md'), `---\nname: ${name}\ndescription: 隔离契约样本\n---\n\n读取[附件](references/content.bin)。\n`)
    fs.writeFileSync(path.join(root, 'skills', category, name, 'references/content.bin'), Buffer.from([0, 255, 10, 13]))
  }
  if (options.workflow) {
    fs.mkdirSync(path.join(root, 'script/config/workflow'), { recursive: true })
    fs.writeFileSync(path.join(root, 'script/config/workflow/collection.config.json'), JSON.stringify({ packageName: null, mcp: false, skill: { 'artifact-spec-analysis': { hook: { after_tasks: { optional: false, priority: 10 } } }, 'implementation-preparation': { hook: { before_implement: { optional: false } } }, 'task-increment': {} } }))
  }
  /**
   * 手工样本按独立文件全集组装，不借用产品构建器。
   */
  const files = Object.keys(snapshotTree(root)).filter(relative => fs.lstatSync(path.join(root, relative)).isFile()).map(relative => describeFixtureFile(root, relative)).sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
  /**
   * 正式字段保持旧消费者所需信息，投影仅为 identity。
   */
  const release = {
    schemaVersion: 1,
    version: '0.1.0',
    sourceRevision: '1'.repeat(40),
    tools: { skills: 'latest', specify: '1.2.6', node: '>=22.20.0', npm: '10.9.3', bash: '>=3.2', powershell: '>=7.4' },
    files,
    skills: definitions.map(([category, name]) => ({ name, category, directory: `skills/${category}/${name}`, sourceFiles: files.filter(file => file.path.startsWith(`skills/${category}/${name}/`)).map(file => file.path), installedFilesByProjection: { identity: ['SKILL.md', 'references/content.bin'] }, requiresSkills: name === 'task-increment' ? ['artifact-spec-analysis', 'implementation-preparation'] : [], projectPrerequisites: [], mountMappingIds: name === 'task-increment' ? ['increment'] : options.workflow ? [name] : [] })),
    projections: { identity: Object.fromEntries(definitions.map(([category, name]) => [name, files.filter(file => file.path.startsWith(`skills/${category}/${name}/`)).map(file => ({ ...file, path: file.path.slice(`skills/${category}/${name}/`.length), sourcePath: file.path }))])) },
    adapters: files.filter(file => file.path.startsWith('script/')),
  }
  /**
   * 测试只在自己的文件中破坏一个约束后写回。
   */
  function save() {
    fs.writeFileSync(path.join(root, 'release.json'), `${JSON.stringify(release)}\n`)
  }
  save()
  return { root, release, save }
}

/**
 * 在本次私有目录编译真实 TypeScript 模块，解析其 .js 导入约定。
 * @param {object} sandbox 本次拥有的临时根。
 * @param {string} relative 产品模块相对路径。
 * @returns {Promise<object>} 真实模块导出。
 */
export async function loadProduct(sandbox, relative) {
  /**
   * 每次编译到独立目录，避免写入真实 dist。
   */
  const destination = path.join(sandbox.root, `compiled-${path.basename(relative, path.extname(relative))}`)
  await build({ configFile: false, logLevel: 'silent', ssr: { noExternal: ['yaml', 'semver'] }, build: { ssr: path.join(packageRoot, relative), outDir: destination, rollupOptions: { output: { entryFileNames: 'index.mjs' } } } })
  return import(pathToFileURL(path.join(destination, 'index.mjs')).href)
}

/**
 * 按 identity 样本复制已由官方安装的文件，不生成自有收据。
 * @param {object} sandbox 隔离消费项目。
 * @param {object} fixture 同版样本。
 */
export function installFixture(sandbox, fixture) {
  for (const skill of fixture.release.skills)
    fs.cpSync(path.join(fixture.root, skill.directory), path.join(sandbox.project, '.agents/skills', skill.name), { recursive: true })
}

/**
 * 从测试原始文件生成明确候选授权，不替代产品再次读盘核验。
 * @param {object} fixture 本次完整样本。
 * @param {string} repository 自有 bare 仓库。
 * @returns {object} 绑定仓库、版本、源码和候选的内部发布请求。
 */
export function publicationRequest(fixture, repository) {
  /**
   * 候选摘要由测试独立组装，不信任被测函数返回值。
   */
  const files = [...fixture.release.files, describeFixtureFile(fixture.root, 'release.json')].sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
  /**
   * 授权仅限本次随机目录，不可用于真实远端。
   */
  const identity = { repository, version: fixture.release.version, sourceRevision: fixture.release.sourceRevision, candidateDigest: createHash('sha256').update(JSON.stringify(files)).digest('hex') }
  return { candidateRoot: fixture.root, ...identity, authorization: { ...identity, reference: 'isolated-bare-test-only' } }
}

/**
 * 创建带父历史或非 commit 的同名 tag，供发布冲突反例使用。
 * @param {object} sandbox 自有测试环境。
 * @param {object} fixture 本次候选。
 * @param {string} repository 自有 bare 仓库。
 * @param {'parent'|'blob'} kind 预存非法发布对象类型。
 * @returns {string} 已实际推送的对象 SHA。
 */
export function seedConflictingTag(sandbox, fixture, repository, kind) {
  /**
   * 冲突工作树与候选、消费者分开。
   */
  const work = path.join(sandbox.root, 'seed')
  fs.mkdirSync(work)
  git(sandbox, ['init'], work)
  if (kind === 'parent')
    git(sandbox, ['commit', '--allow-empty', '-m', 'unrelated parent'], work)
  fs.cpSync(fixture.root, work, { recursive: true })
  git(sandbox, ['add', '.'], work)
  git(sandbox, ['commit', '-m', 'exact payload'], work)
  /**
   * 相同字节也不能掩盖带父历史或非提交对象。
   */
  const object = kind === 'blob' ? git(sandbox, ['hash-object', '-w', 'README.md'], work) : git(sandbox, ['rev-parse', 'HEAD'], work)
  git(sandbox, ['update-ref', 'refs/tags/skills-v0.1.0', object], work)
  git(sandbox, ['push', repository, 'refs/tags/skills-v0.1.0'], work)
  return object
}
