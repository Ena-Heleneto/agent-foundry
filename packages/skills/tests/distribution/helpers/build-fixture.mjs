import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { createSandbox } from '../sandbox.mjs'

/**
 * 只用于取得当前有效配置、实际依赖及运行脚本，不读取旧构建存档。
 */
const sourcePackage = fileURLToPath(new URL('../../../', import.meta.url))

/**
 * 手工给定的线下正文，中文与空格附件名用于检验完整复制及引用解析。
 */
export const demoSkill = '---\nname: demo-skill\ndescription: 测试内容分发\ndestructive: false\n---\n\n# 内容核验\n\n[资料](references/资料 空格.txt)\n[二进制](references/data.bin)\n'

/**
 * 手工给定 Eve 的完整期望，移除不支持字段并保留原正文和附件引用。
 */
export const eveSkill = '---\nname: demo-skill\ndescription: 测试内容分发\n---\n# 内容核验\n\n[资料](references/资料 空格.txt)\n[二进制](references/data.bin)\n'

/**
 * MCP 完整原文应进入独立清单，不得由线下公开分类推导。
 */
export const mcpSkill = '---\nname: mcp-example\ndescription: 线上技能示例\ndestructive: false\n---\n\n# MCP 示例\n\n[核验](references/说明.txt)\n'

/**
 * 非文本附件保留零字节、最高字节及换行组合，避免字符串转换损坏内容。
 */
export const binaryAttachment = new Uint8Array([0, 255, 13, 10, 128, 1])

/**
 * 在测试自有根写入来源或故障文件。
 * @param {string} root 本次测试独占目录。
 * @param {string} relative 明确的测试相对路径。
 * @param {string | Uint8Array} bytes 原始内容。
 */
export function writeFixtureFile(root, relative, bytes) {
  /**
   * 仅由测试字面量组成的目标位置。
   */
  const target = path.join(root, relative)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, bytes)
}

/**
 * 从原始字节独立计算摘要，不调用产品校验或投影实现生成期望。
 * @param {string | Uint8Array} bytes 输入内容。
 * @returns {string} 小写 SHA-256。
 */
export function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * 记录目录实际字节与链接事实，不跟随链接读取外部目录。
 * @param {string} root 待观察的测试目录。
 * @returns {Record<string, string>} 相对路径对应的字节或链接记录。
 */
export function snapshotTree(root) {
  /**
   * 普通对象便于断言完整集合，而非只对已知文件逐项核对。
   */
  const files = {}
  if (!fs.existsSync(root))
    return files
  /**
   * 排序遍历使两次独立构建的文件全集可直接比较。
   */
  for (const relative of fs.readdirSync(root, { recursive: true }).sort()) {
    /**
     * lstat 保留链接本身，不用 realpath 隐藏越界输入。
     */
    const target = path.join(root, relative)
    /**
     * 当前条目的真实类型。
     */
    const stat = fs.lstatSync(target)
    if (stat.isSymbolicLink())
      files[relative.split(path.sep).join('/')] = `link:${fs.readlinkSync(target)}`
    else if (stat.isFile())
      files[relative.split(path.sep).join('/')] = fs.readFileSync(target).toString('base64')
  }
  return files
}

/**
 * 真实调用 Git，仅在沙箱中建立来源提交，不写全局配置。
 * @param {object} fixture 当前隔离工程。
 * @param {string[]} args 明确的 Git 参数。
 * @returns {string} Git 实际输出，来源身份取真实提交。
 */
function runGit(fixture, args) {
  /**
   * 子进程错误须与产品契约失败分开，不以 EPERM 等环境错误代替红灯。
   */
  const result = spawnSync('git', args, { cwd: fixture.packageRoot, env: fixture.env, encoding: 'utf8', timeout: 15000 })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

/**
 * 建立最小真实内容工程；依赖链接仅用于本地契约，不证明独立迁移可用。
 * @returns {ReturnType<typeof createSandbox> & {packageRoot: string, output: string, sourceRevision: string}} 夹具及清理入口。
 */
export function createBuildFixture() {
  /**
   * 复用现有隔离 HOME、Git 环境和生命周期清理约定。
   */
  const sandbox = createSandbox()
  /**
   * 构建根与消费项目分离，路径同时含中文和空格。
   */
  const packageRoot = path.join(sandbox.root, '构建 project')
  /**
   * 输出仅属于本次工程，不访问真实仓库 dist。
   */
  const fixture = { ...sandbox, packageRoot, output: path.join(packageRoot, 'dist'), sourceRevision: '' }
  try {
    fs.mkdirSync(packageRoot)
    fs.copyFileSync(path.join(sourcePackage, 'vite.config.ts'), path.join(packageRoot, 'vite.config.ts'))
    if (fs.existsSync(path.join(sourcePackage, 'build')))
      fs.cpSync(path.join(sourcePackage, 'build'), path.join(packageRoot, 'build'), { recursive: true })
    fs.cpSync(path.join(sourcePackage, 'script'), path.join(packageRoot, 'script'), { recursive: true })
    fs.symlinkSync(path.join(sourcePackage, 'node_modules'), path.join(packageRoot, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
    writeFixtureFile(packageRoot, '.gitignore', 'node_modules\ndist\n')
    /**
     * 声明本次真正使用的构建工具版本，不伪造缺依赖的独立工程。
     */
    const viteVersion = JSON.parse(fs.readFileSync(path.join(sourcePackage, 'node_modules/vite/package.json'), 'utf8')).version
    /**
     * YAML 仍使用包内已声明并准备好的直接依赖。
     */
    const yamlVersion = JSON.parse(fs.readFileSync(path.join(sourcePackage, 'node_modules/yaml/package.json'), 'utf8')).version
    writeFixtureFile(packageRoot, 'package.json', JSON.stringify({ name: '@foundry/skills', type: 'module', version: '0.1.0', devDependencies: { vite: viteVersion, yaml: yamlVersion } }))
    writeFixtureFile(packageRoot, 'README.md', '# 隔离内容夹具\n')
    writeFixtureFile(packageRoot, 'src/skills/coding/demo-skill/SKILL.md', demoSkill)
    writeFixtureFile(packageRoot, 'src/skills/coding/demo-skill/references/资料 空格.txt', '完整附件\n')
    writeFixtureFile(packageRoot, 'src/skills/coding/demo-skill/references/data.bin', binaryAttachment)
    fs.mkdirSync(path.join(packageRoot, 'src/skills/frontend'), { recursive: true })
    writeFixtureFile(packageRoot, 'src/mcp/category/mcp-example/SKILL.md', mcpSkill)
    writeFixtureFile(packageRoot, 'src/mcp/category/mcp-example/references/说明.txt', '线上附件\n')
    writeFixtureFile(packageRoot, 'src/mcp/.gitkeep', '')
    writeFixtureFile(packageRoot, 'script/build-poison.mjs', 'import "foundry-missing-runtime-dependency"; throw new Error("构建不得导入运行脚本")\n')
    writeFixtureFile(packageRoot, 'script/build-write.mjs', 'import fs from "node:fs"; fs.writeFileSync(new URL("../executed.txt", import.meta.url), "不得执行")\n')
    runGit(fixture, ['init', '--quiet'])
    runGit(fixture, ['add', '.'])
    runGit(fixture, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'fixture'])
    fixture.sourceRevision = runGit(fixture, ['rev-parse', 'HEAD'])
    return fixture
  }
  catch (error) {
    sandbox.cleanup()
    throw error
  }
}

/**
 * 唯一真实 Vite 配置始终参与构建；测试只注入文件系统故障与输出边界。
 * @param {ReturnType<typeof createBuildFixture>} fixture 当前隔离工程。
 * @param {import('vite').InlineConfig} options 限于本用例的 Vite 覆盖参数。
 * @returns {ReturnType<typeof build>} 真实构建结果。
 */
export function buildFixture(fixture, options = {}) {
  return build({ root: fixture.packageRoot, configFile: path.join(fixture.packageRoot, 'vite.config.ts'), configLoader: 'runner', cacheDir: path.join(fixture.root, 'vite-cache'), logLevel: 'silent', ...options })
}

/**
 * 用真实 Vite 编译阶段导出，在阶段之间注入故障，不依赖 Vite 钩子时序。
 * 编译入口仅属于测试；生产仍使用唯一 vite.config，阶段函数与该配置复用。
 * @param {ReturnType<typeof createBuildFixture>} fixture 当前隔离工程。
 * @returns {Promise<object>} 实际生产阶段导出，缺失时明确保留红灯。
 */
export async function loadBuildStages(fixture) {
  /**
   * 源码读取、计划和生成归属既定 export 模块，复核归属 verify 模块。
   */
  const exportsFile = path.join(fixture.packageRoot, 'build/distribution/export.ts')
  /**
   * 磁盘复核必须由真实产品实现完成，不能在测试中重写。
   */
  const verifyFile = path.join(fixture.packageRoot, 'build/distribution/verify.ts')
  assert.equal(fs.existsSync(exportsFile), true, '缺少 T067/T069 的真实构建阶段模块：build/distribution/export.ts')
  assert.equal(fs.existsSync(verifyFile), true, '缺少 T070 的真实磁盘复核模块：build/distribution/verify.ts')
  /**
   * 测试入口位于包根之外，不成为被测来源快照的一部分。
   */
  const entry = path.join(fixture.root, 'stage-entry.mjs')
  /**
   * 仅编译本次夹具中生产源码的导出，不读已存档实现。
   */
  const output = path.join(fixture.root, 'compiled-stages')
  fs.writeFileSync(entry, `export * from ${JSON.stringify(exportsFile.split(path.sep).join('/'))};\nexport * from ${JSON.stringify(verifyFile.split(path.sep).join('/'))};\n`)
  await build({ root: fixture.packageRoot, configFile: false, cacheDir: path.join(fixture.root, 'stage-cache'), logLevel: 'silent', ssr: { noExternal: true }, build: { ssr: entry, outDir: output, emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'stages.mjs' } } } })
  /**
   * 输出目录每个用例独占，不从前次模块缓存获得旧结果。
   */
  const stages = await import(pathToFileURL(path.join(output, 'stages.mjs')).href)
  /**
   * 这四个函数承接既定数据对象，参数不引入测试专用生产 hook。
   */
  for (const name of ['readSourceSnapshot', 'createBuildPlan', 'writeBuildOutput', 'verifyBuildOutput'])
    assert.equal(typeof stages[name], 'function', `缺少真实阶段导出：${name}`)
  return stages
}

/**
 * 只接受具有实际阶段和原因的拒绝，防止临时统一报错让负例误通过。
 * @param {unknown} error 真实构建抛出的错误。
 * @param {RegExp} stage 允许的阶段语义。
 * @param {RegExp} reason 该故障对应的原因语义。
 * @returns {boolean} 断言成功后供 assert.rejects 使用。
 */
export function assertStageError(error, stage, reason) {
  assert.ok(error instanceof Error, '构建应抛出真实错误')
  /**
   * Vite 可以包装错误，原始 StageError 必须仍作为本体或 cause 可达。
   */
  const actual = typeof error.stage === 'string' ? error : error.cause
  assert.equal(typeof actual?.stage, 'string', `缺少 StageError.stage；实际：${error.message}`)
  assert.equal(typeof actual?.reasonCode, 'string', '缺少 StageError.reasonCode')
  assert.match(actual.stage, stage)
  assert.match(actual.reasonCode, reason)
  return true
}
