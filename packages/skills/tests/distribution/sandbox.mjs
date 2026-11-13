import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test, { after } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * 创建独立项目和测试用户，所有技能安装及缓存路径限定在同一临时根目录。
 * @returns {{root: string, project: string, userHome: string, env: NodeJS.ProcessEnv, cleanup: () => void}} 沙箱及清理入口。
 */
export function createSandbox() {
  /**
   * 单次测试拥有的临时根目录。
   */
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-distribution-'))
  /**
   * 待安装技能的隔离项目。
   */
  const project = path.join(root, 'project')
  /**
   * 测试专用用户目录，不能指向开发者真实 HOME。
   */
  const userHome = path.join(root, 'user')
  /**
   * 仅传入测试子进程的环境，不修改当前进程或用户配置。
   */
  const env = {
    ...process.env,
    HOME: userHome,
    USERPROFILE: userHome,
    XDG_CONFIG_HOME: path.join(userHome, '.config'),
    XDG_CACHE_HOME: path.join(userHome, '.cache'),
    XDG_DATA_HOME: path.join(userHome, '.local/share'),
    APPDATA: path.join(userHome, 'AppData/Roaming'),
    LOCALAPPDATA: path.join(userHome, 'AppData/Local'),
    npm_config_cache: path.join(userHome, '.npm'),
    GIT_CONFIG_GLOBAL: path.join(userHome, '.gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_COUNT: '0',
  }
  if (process.env.FOUNDRY_SKILLS_PACKAGE)
    env.NODE_OPTIONS = [process.env.NODE_OPTIONS, `--import=${new URL('./helpers/online-provider.mjs', import.meta.url).href}`].filter(Boolean).join(' ')
  /**
   * 清除会绕过测试 HOME 的 agent 路径及全部继承 Git 覆盖项；只保留上方显式隔离的三个 Git 配置项。
   */
  for (const key of Object.keys(env)) {
    if ((key.startsWith('GIT_') && !['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM', 'GIT_CONFIG_COUNT'].includes(key)) || ['CLAUDE_CONFIG_DIR', 'VIBE_HOME', 'HERMES_HOME', 'AUTOHAND_HOME', 'GROK_HOME', 'CODEX_HOME', 'SARVAM_HOME', 'REASONIX_HOME', 'FLATPAK_XDG_CONFIG_HOME'].includes(key))
      delete env[key]
  }
  /**
   * 仓库发现限于自有沙箱，避免临时目录的父仓库干扰，同时保留沙箱内祖先冲突。
   */
  env.GIT_CEILING_DIRECTORIES = root
  try {
    /**
     * 提前创建固定目录，调用方无需接触真实用户目录。
     */
    for (const directory of [project, userHome, env.XDG_CONFIG_HOME, env.XDG_CACHE_HOME, env.XDG_DATA_HOME, env.APPDATA, env.LOCALAPPDATA, env.npm_config_cache])
      fs.mkdirSync(directory, { recursive: true })
  }
  catch (error) {
    fs.rmSync(root, { recursive: true, force: true })
    throw error
  }
  /**
   * 只清理本次创建的临时根目录，允许测试在 finally 中重复调用。
   */
  function cleanup() {
    fs.rmSync(root, { recursive: true, force: true })
  }
  return { root, project, userHome, env, cleanup }
}

/**
 * 只读探测运行时版本；缺失、权限拒绝和超时均保留原因，不计为通过。
 * @param {string} command 工具命令。
 * @returns {{command: string, available: boolean, version: string, reason: string | null}} 实际探测结果。
 */
export function probeRuntime(command) {
  /**
   * 限时版本探测结果，避免不可用工具阻塞整个调度器。
   */
  const result = spawnSync(command, ['--version'], { encoding: 'utf8', timeout: 5000, windowsHide: true })
  return {
    command,
    available: !result.error && result.status === 0,
    version: result.stdout?.trim() || '',
    reason: result.error?.message || (result.status === 0 ? null : `退出码 ${result.status}：${result.stderr?.trim() || result.signal || '无输出'}`),
  }
}

/**
 * 直接执行本文件时验证调度入口；被后续 MVU 导入时只提供沙箱工具。
 */
const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isMain) {
  /**
   * 真实调度入口路径，不依赖调用时的工作目录。
   */
  const dispatcher = fileURLToPath(new URL('./test-distribution.mjs', import.meta.url))

  /**
   * 独立调度夹具不包含真实 MVU，后续新增场景不会改变本文件的缺项验收。
   */
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-dispatch-contract-'))
  /**
   * 夹具内的真实调度入口；初次红灯时保留缺入口行为。
   */
  const fixtureDispatcher = path.join(fixtureRoot, 'test-distribution.mjs')
  if (fs.existsSync(dispatcher))
    fs.copyFileSync(dispatcher, fixtureDispatcher)
  fs.copyFileSync(fileURLToPath(import.meta.url), path.join(fixtureRoot, 'sandbox.mjs'))
  after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }))

  /**
   * 运行真实 CLI 并保留退出码及输出，避免只检查解析函数的内部结构。
   * @param {string[]} args 用户参数。
   * @param {object} options 子进程选项。
   * @returns {import('node:child_process').SpawnSyncReturns<string>} 执行结果。
   */
  function run(args, options = {}) {
    return spawnSync(process.execPath, [fixtureDispatcher, ...args], { encoding: 'utf8', ...options })
  }

  test('参数错误在执行场景前返回 2，覆盖未知、缺值、冲突与无效来源', () => {
    /**
     * 应被明确拒绝的输入，防止拼错参数或选择范围被静默忽略。
     */
    const cases = [
      ['--unknown'],
      ['--mvu'],
      ['--mvu', 'G'],
      ['--story', 'US6'],
      ['--matrix', 'small'],
      ['--source', 'other'],
      ['--source-dir', 'relative'],
      ['--mvu', 'A', '--story', 'US1'],
      ['--mvu', 'A', '--mvu', 'B'],
      ['--source', 'remote'],
      ['--release-source', 'https://example.test/main'],
      ['--source', 'remote', '--release-source', 'http://example.test/main'],
      ['--source', 'remote', '--release-source', 'https://example.test/main'],
      ['--source', 'remote', '--source-dir', os.tmpdir()],
      ['--', '--', '--mvu', 'A'],
    ]
    /**
     * 逐项断言错误退出码和可操作的参数诊断。
     */
    for (const args of cases) {
      /**
       * 当前无效请求的实际进程结果。
       */
      const result = run(args)
      assert.equal(result.status, 2, JSON.stringify({ args, stdout: result.stdout, stderr: result.stderr }))
      assert.match(result.stderr, /参数错误/u)
    }
  })

  test('六个 MVU 和五个故事尚未实现时明确 not-run，不返回成功', () => {
    /**
     * 公开选择参数与对应测试标识。
     */
    const selections = [
      ...['A', 'B', 'C', 'D', 'E', 'F'].map(id => ['--mvu', id]),
      ...['US1', 'US2', 'US3', 'US4', 'US5'].map(id => ['--story', id]),
      ['--matrix', 'full'],
    ]
    /**
     * 每种选择都必须准确落到自己的待实现入口。
     */
    for (const args of selections) {
      /**
       * 入口不存在时的真实调度结果。
       */
      const result = run(args)
      assert.equal(result.status, 1, result.stderr)
      /**
       * 可供后续证据工具消费的场景报告。
       */
      const report = JSON.parse(result.stdout)
      assert.equal(report.status, 'not-run')
      assert.equal(report.results.length, 1)
      assert.equal(report.results[0].status, 'not-run')
      assert.match(report.results[0].reason, /未实现/u)
    }
  })

  test('pnpm 分隔符、本地绝对来源和远端固定提交参数被完整保留', () => {
    /**
     * 本地模式接受的真实目录，不生成或改写来源内容。
     */
    const local = run(['--', '--mvu', 'A', '--source', 'local', '--source-dir', os.tmpdir()])
    assert.equal(local.status, 1, local.stderr)
    assert.equal(JSON.parse(local.stdout).sourceDir, os.tmpdir())
    /**
     * 固定提交地址只做语法验证，不在调度层下载。
     */
    const releaseSource = 'https://example.test/release/0123456789abcdef0123456789abcdef01234567/'
    /**
     * 远端矩阵请求的实际解析结果。
     */
    const remote = run(['--matrix', 'full', '--source', 'remote', '--release-source', releaseSource])
    assert.equal(remote.status, 1, remote.stderr)
    assert.equal(JSON.parse(remote.stdout).releaseSource, releaseSource)
  })

  test('默认运行列出所有未实现范围，缺失运行时报告实际原因', () => {
    /**
     * 空 PATH 模拟 shell、npm 与 Specify 缺失；Node 仍用绝对路径启动。
     */
    const result = run([], { env: { ...process.env, PATH: '' } })
    assert.equal(result.status, 1, result.stderr)
    /**
     * 缺工具时不能变成测试通过的完整报告。
     */
    const report = JSON.parse(result.stdout)
    assert.equal(report.results.length, 12)
    assert.equal(report.status, 'not-run')
    assert.ok(report.runtimes.some(runtime => runtime.command === 'pwsh' && !runtime.available && runtime.reason))
    assert.ok(report.runtimes.some(runtime => runtime.command === 'specify' && !runtime.available && runtime.reason))
  })

  test('沙箱隔离项目与用户目录，退出后清理；缺工具探测不抛异常', async () => {
    /**
     * 动态取得实际辅助函数，保持首次红灯定位在尚未实现的行为。
     */
    const helpers = await import(import.meta.url)
    /**
     * 待验证的临时项目与测试用户。
     */
    const sandbox = helpers.createSandbox()
    try {
      assert.ok(path.isAbsolute(sandbox.root))
      assert.ok(fs.statSync(sandbox.project).isDirectory())
      assert.ok(fs.statSync(sandbox.userHome).isDirectory())
      assert.equal(sandbox.env.HOME, sandbox.userHome)
      assert.equal(sandbox.env.USERPROFILE, sandbox.userHome)
      assert.notEqual(sandbox.userHome, os.homedir())
      assert.ok(sandbox.env.XDG_CONFIG_HOME.startsWith(sandbox.root + path.sep))
      assert.equal(sandbox.env.CLAUDE_CONFIG_DIR, undefined)
      assert.equal(sandbox.env.GIT_DIR, undefined)
      /**
       * 不存在的工具必须给出不可用原因。
       */
      const missing = helpers.probeRuntime('foundry-missing-runtime-t002')
      assert.equal(missing.available, false)
      assert.match(missing.reason, /ENOENT/u)
    }
    finally {
      sandbox.cleanup()
    }
    assert.equal(fs.existsSync(sandbox.root), false)
  })

  test('已注册入口真正执行并透传来源，失败退出码不能变成通过', () => {
    /**
     * 后续 MVU 使用的真实文件约定；夹具只验证调度，不冒充技术验证。
     */
    const suite = path.join(fixtureRoot, 'mvu-a.mjs')
    fs.writeFileSync(suite, `console.log(JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd(), home: process.env.HOME, claude: process.env.CLAUDE_CONFIG_DIR, gitDir: process.env.GIT_DIR }))`)
    try {
      /**
       * 真实子进程输出必须被纳入执行报告。
       */
      const result = run(['--mvu', 'A', '--source-dir', os.tmpdir()], {
        env: { ...process.env, CLAUDE_CONFIG_DIR: '/outside-user', GIT_DIR: '/outside-repository' },
      })
      assert.equal(result.status, 0, result.stderr + result.stdout)
      /**
       * 正常执行的调度结果与子进程实际输出。
       */
      const report = JSON.parse(result.stdout)
      assert.equal(report.status, 'passed')
      assert.equal(report.results[0].status, 'passed')
      /**
       * 子进程取得的参数及隔离路径。
       */
      const child = JSON.parse(report.results[0].stdout)
      assert.deepEqual(child.args, ['--source', 'local', '--source-dir', os.tmpdir()])
      assert.notEqual(child.cwd, process.cwd())
      assert.notEqual(child.home, os.homedir())
      assert.equal(child.claude, undefined)
      assert.equal(child.gitDir, undefined)
      assert.equal(fs.existsSync(child.cwd), false)

      fs.writeFileSync(suite, 'process.exitCode = 7')
      /**
       * 同一入口失败后应保留原退出码并让整个请求失败。
       */
      const failed = run(['--mvu', 'A'])
      assert.equal(failed.status, 1, failed.stderr)
      assert.equal(JSON.parse(failed.stdout).results[0].exitCode, 7)
      assert.equal(JSON.parse(failed.stdout).status, 'failed')
    }
    finally {
      fs.rmSync(suite, { force: true })
    }
  })

  test('Git 索引与对象目录的继承覆盖不能改写沙箱外的临时哨兵', () => {
    /**
     * 沙箱外哨兵仍位于测试自有临时目录，不指向用户真实仓库。
     */
    const external = path.join(fixtureRoot, 'external-git-sentinel')
    fs.mkdirSync(external)
    /**
     * 建立哨兵时剔除继承 Git 覆盖项，避免准备过程触碰其他仓库。
     */
    const gitEnv = { ...process.env, HOME: external, GIT_CONFIG_NOSYSTEM: '1' }
    /**
     * 仅保留测试设置的禁用系统配置项。
     */
    for (const key of Object.keys(gitEnv)) {
      if (key.startsWith('GIT_') && key !== 'GIT_CONFIG_NOSYSTEM')
        delete gitEnv[key]
    }
    assert.equal(spawnSync('git', ['init', external], { env: gitEnv, encoding: 'utf8' }).status, 0)
    fs.writeFileSync(path.join(external, 'sentinel.txt'), '保留外部仓库')
    assert.equal(spawnSync('git', ['-C', external, 'add', 'sentinel.txt'], { env: gitEnv, encoding: 'utf8' }).status, 0)
    /**
     * 有效索引及对象树快照，确保测试检测实际写入而非无效索引错误。
     */
    const index = path.join(external, '.git/index')
    /**
     * 待保护的有效 Git 对象目录。
     */
    const objects = path.join(external, '.git/objects')
    /**
     * 场景执行前的索引字节。
     */
    const indexBefore = fs.readFileSync(index)
    /**
     * 场景执行前的对象文件清单。
     */
    const objectsBefore = fs.readdirSync(objects, { recursive: true }).sort()
    /**
     * 真实 Git 写入夹具使用调度器提供的隔离环境。
     */
    const suite = path.join(fixtureRoot, 'mvu-e.mjs')
    fs.writeFileSync(suite, `
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
assert.equal(spawnSync('git', ['init'], { encoding: 'utf8' }).status, 0)
fs.writeFileSync('fixture.txt', '只允许写入沙箱')
assert.equal(spawnSync('git', ['add', 'fixture.txt'], { encoding: 'utf8' }).status, 0)
`)
    try {
      /**
       * 故意继承外部索引和对象路径，检验 helper 是否阻止路径逃逸。
       */
      const result = run(['--mvu', 'E'], { env: { ...process.env, GIT_INDEX_FILE: index, GIT_OBJECT_DIRECTORY: objects } })
      assert.equal(result.status, 0, result.stderr + result.stdout)
      assert.deepEqual(fs.readFileSync(index), indexBefore)
      assert.deepEqual(fs.readdirSync(objects, { recursive: true }).sort(), objectsBefore)
    }
    finally {
      fs.rmSync(suite, { force: true })
    }
  })
}
