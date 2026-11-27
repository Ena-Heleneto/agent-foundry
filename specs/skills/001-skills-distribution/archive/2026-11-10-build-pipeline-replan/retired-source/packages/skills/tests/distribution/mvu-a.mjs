import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import test, { after } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { createSandbox } from './sandbox.mjs'

/**
 * 真实技能源与本项最小实现所在包根。
 */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))
/**
 * 整项实验只使用自有临时目录，退出后清理。
 */
const fixture = createCase()
/**
 * 官方 npm 包和同版本源码须由调用者显式准备，不隐式下载 latest。
 */
const officialPackage = process.env.FOUNDRY_SKILLS_PACKAGE
/**
 * v1.7.4 源码用于独立读取原生 agent 配置，不作为产品运行依赖。
 */
const officialSource = process.env.FOUNDRY_SKILLS_SOURCE
/**
 * 公开技能名单独立列出，检测遗漏、误收 eval 和重复发现。
 */
const publicNames = [
  'artifact-business-flow',
  'artifact-issue-description',
  'artifact-logic-flow',
  'artifact-pr-description',
  'artifact-project-description',
  'bug-report',
  'document-changed-symbols',
  'explainer-doc-sync',
  'mvu-gate',
  'nuxt-ui-styling',
  'task-explore',
  'task-guide',
  'task-pair',
  'task-review',
  'task-tutor',
  'vue-reactivity',
].sort()
/**
 * 脱离源码仓库的公开内容根，保持官方支持的 skills/分类/技能布局。
 */
const releaseRoot = path.join(fixture.root, 'release')
/**
 * 仅用于本实验的目录、投影和选择辅助模块，不作为交付实现。
 */
let implementation
/**
 * 官方 agent 配置探针的编译产物。
 */
let agentProbe
/**
 * 每次真实安装的输入及结果，测试末尾输出为证据。
 */
const observations = []
after(() => {
  process.stdout.write(`${JSON.stringify({ platform: process.platform, node: process.version, tools: { skills: '1.7.4', yaml: '2.8.3' }, observations, unverified: ['其他操作系统的真实安装', ...(process.version === 'v22.20.0' ? [] : ['Node 22.20.0 最低版本']), '真实公开URL'] })}\n`)
  fixture.cleanup()
})

/**
 * 补齐固定上游版本新增的目录变量隔离，所有变量均只传给测试子进程。
 * @returns {ReturnType<typeof createSandbox>} 当前实验独占的沙箱。
 */
function createCase() {
  /**
   * 复用原测试沙箱，并隔离 T003 新核对到的目录分支。
   */
  const sandbox = createSandbox()
  sandbox.env.SARVAM_HOME = path.join(sandbox.userHome, '.sarvam')
  sandbox.env.FLATPAK_XDG_CONFIG_HOME = path.join(sandbox.userHome, '.flatpak-config')
  return sandbox
}

/**
 * 运行真实子进程，保留错误现场，禁止超时或 EPERM 被误记为通过。
 * @param {string} executable 可执行文件。
 * @param {string[]} args 参数数组，不经 shell 拼接。
 * @param {object} sandbox 测试项目与用户环境。
 * @returns {import('node:child_process').SpawnSyncReturns<string>} 原始执行结果。
 */
function run(executable, args, sandbox) {
  /**
   * 禁用遥测、编译缓存和交互提示，额外用户目录变量全部隔离。
   */
  const env = {
    ...sandbox.env,
    CI: '1',
    DISABLE_TELEMETRY: '1',
    DO_NOT_TRACK: '1',
    NODE_DISABLE_COMPILE_CACHE: '1',
    NO_COLOR: '1',
  }
  /**
   * 官方 CLI 直接使用 npm 包的原始入口，实际调用不会修改源码包。
   */
  const result = spawnSync(executable, args, { cwd: sandbox.project, env, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 })
  assert.ifError(result.error)
  assert.equal(result.signal, null, result.stderr)
  return result
}

/**
 * 仅为第三方源码配置探针编译测试驱动，不处理本包运行脚本。
 * @param {string} entry 上游探针入口。
 * @param {string} name 本次产物名。
 * @param {Record<string, string>} alias 仅供上游源码探针解析既有依赖。
 * @returns {Promise<string>} 编译结果路径。
 */
async function compile(entry, name, alias = {}) {
  await build({
    configFile: false,
    envFile: false,
    logLevel: 'silent',
    resolve: { alias },
    ssr: { noExternal: true },
    build: { ssr: entry, outDir: path.join(fixture.root, name), rollupOptions: { output: { entryFileNames: 'index.mjs' } } },
  })
  return path.join(fixture.root, name, 'index.mjs')
}

/**
 * 保存目录全部文件字节，拒绝链接以免把外部文件算作交付内容。
 * @param {string} directory 待比较目录。
 * @returns {Record<string, string>} 相对路径与 base64 字节。
 */
function bytes(directory) {
  /**
   * 稳定排序的递归文件集合，不使用生产代码计算期望值。
   */
  const result = {}
  if (!fs.existsSync(directory))
    return result
  /**
   * 每个条目单独验证文件类型。
   */
  for (const relative of fs.readdirSync(directory, { recursive: true }).sort()) {
    /**
     * 当前绝对路径与类型。
     */
    const absolute = path.join(directory, relative)
    /**
     * lstat 保证链接本身也会被发现。
     */
    const stat = fs.lstatSync(absolute)
    assert.equal(stat.isSymbolicLink(), false, absolute)
    if (stat.isFile())
      result[relative.split(path.sep).join('/')] = fs.readFileSync(absolute).toString('base64')
  }
  return result
}

/**
 * 读取官方源配置在当前隔离环境下的实际值。
 * @param {object} sandbox 隔离项目。
 * @returns {object[]} agent 配置的公开安装字段。
 */
function readAgents(sandbox) {
  /**
   * 官方配置每次在新进程解析，避免 homedir 与环境变量缓存串用。
   */
  const result = run(process.execPath, [agentProbe], sandbox)
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

/**
 * 调用官方安装，并以原始文件或已校准 Eve 投影验证完整目录。
 * @param {object} sandbox 本次独立消费项目。
 * @param {object} agent 官方配置。
 * @param {boolean} global 是否全局。
 * @param {string} source 官方来源目录。
 * @param {string[]} names 官方 --skill 选择。
 * @param {string[]} expected 独立指定的预期安装集合。
 * @param {string} branch 环境变量或目录分支标识，用于保存可追溯证据。
 * @returns {void} 断言实际结果并记录证据。
 */
function install(sandbox, agent, global, source, names, expected, branch = 'default') {
  /**
   * 通过公共选择检查得到本次集合，不能从历史安装扫描扩充。
   */
  const catalog = implementation.readCatalog(path.join(releaseRoot, 'skills'))
  /**
   * 本项直接使用 npm 包 bin，与 npx 解析后执行的入口相同。
   */
  const args = [path.join(officialPackage, 'bin/cli.mjs'), 'add', source, '--skill', ...names, '--agent', agent.name, '--copy', '--yes', ...(global ? ['--global'] : [])]
  /**
   * 原生执行结果，成功还必须核对实际文件。
   */
  const result = run(process.execPath, args, sandbox)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  /**
   * 最小路径骨架的结果以真实 CLI 创建位置验证。
   */
  const target = implementation.resolveInstallRoot(agent, { project: sandbox.project, userHome: sandbox.userHome, global })
  assert.deepEqual(fs.readdirSync(target).sort(), [...expected].sort(), `${agent.name}/${global}: ${result.stdout}`)
  /**
   * 每个技能逐路径、逐字节比较，未选技能由上方完整目录集合断言排除。
   */
  for (const name of expected) {
    /**
     * 对应发布目录中的完整技能。
     */
    const skill = catalog.find(item => item.name === name)
    assert.ok(skill, name)
    /**
     * identity 直接与源字节比较；Eve 另外经过字面量样本及实际安装校准。
     */
    const wanted = agent.name === 'eve' ? implementation.projectFiles(skill.files, 'eve') : bytes(skill.directory)
    assert.deepEqual(bytes(path.join(target, name)), wanted, `${agent.name}/${name}`)
  }
  observations.push({ agent: agent.name, scope: global ? 'global' : 'project', names: expected, source, branch, target, exitCode: result.status })
}

test('固定官方工具与最小实现齐备后才能运行，缺项不能记为通过', async () => {
  assert.ok(officialPackage, '必须提供 FOUNDRY_SKILLS_PACKAGE（skills 1.7.4 npm 包绝对路径）')
  assert.ok(officialSource, '必须提供 FOUNDRY_SKILLS_SOURCE（v1.7.4 官方源码绝对路径）')
  assert.equal(JSON.parse(fs.readFileSync(path.join(officialPackage, 'package.json'))).version, '1.7.4')
  assert.equal(JSON.parse(fs.readFileSync(path.join(officialSource, 'package.json'))).version, '1.7.4')
  /**
   * 实际官方运行依赖也必须固定，避免输出版本仅来自报告常量。
   */
  const officialRequire = createRequire(path.join(officialPackage, 'package.json'))
  assert.equal(officialRequire('yaml/package.json').version, '2.8.3')
  /**
   * 实验辅助模块只从 tests 目录加载，不依赖业务目录或构建产物。
   */
  const entry = path.join(packageRoot, 'tests/distribution/helpers/catalog.ts')
  assert.ok(fs.existsSync(entry), '缺少 T003 的真实目录/选择/投影骨架')
  /**
   * 使用包内显式开发依赖运行实验；不据此证明产品依赖准备已经实现。
   */
  const helpers = path.dirname(entry)
  implementation = {
    ...await import(pathToFileURL(entry).href),
    ...await import(pathToFileURL(path.join(helpers, 'projection.ts')).href),
    ...await import(pathToFileURL(path.join(helpers, 'selection.ts')).href),
  }
  /**
   * 源码配置探针只读取 name 与安装路径，不调用 agent 检测或修改任何路径。
   */
  const probe = path.join(fixture.root, 'agent-probe.mjs')
  fs.writeFileSync(probe, `import { agents } from ${JSON.stringify(pathToFileURL(path.join(officialSource, 'src/agents.ts')).href)}; process.stdout.write(JSON.stringify(Object.values(agents).map(({ name, skillsDir, globalSkillsDir }) => ({ name, skillsDir, globalSkillsDir }))));`)
  agentProbe = await compile(probe, 'official-agents', { 'xdg-basedir': path.join(officialPackage, 'dist/_chunks/libs/xdg-basedir.mjs') })
  /**
   * 从真实源复制公开分类，不使用 dist 或工作区安装副本。
   */
  for (const category of ['coding', 'frontend', 'workflow'])
    fs.cpSync(path.join(packageRoot, 'src/skills', category), path.join(releaseRoot, 'skills', category), { recursive: true })
})

test('官方从发布根、分类和单技能发现；四种选择与完整附件一致', () => {
  assert.ok(implementation, '前置骨架未就绪')
  assert.deepEqual(implementation.readCatalog(path.join(releaseRoot, 'skills')).map(item => item.name).sort(), publicNames)
  /**
   * 每个目录的期望发现集合来自公开契约，不从被测扫描器推导。
   */
  const cases = [
    [releaseRoot, ['*'], publicNames],
    [path.join(releaseRoot, 'skills/frontend'), ['*'], ['nuxt-ui-styling', 'vue-reactivity']],
    [path.join(releaseRoot, 'skills/workflow/task-explore'), ['task-explore'], ['task-explore']],
    [releaseRoot, ['vue-reactivity', 'task-pair'], ['vue-reactivity', 'task-pair']],
  ]
  /**
   * 四种范围分别使用独立消费项目，确保无历史文件掩盖遗漏。
   */
  for (const [source, names, expected] of cases) {
    /**
     * 单项安装的自有隔离目录。
     */
    const sandbox = createCase()
    try {
      /**
       * --list 必须不创建安装内容。
       */
      const listing = run(process.execPath, [path.join(officialPackage, 'bin/cli.mjs'), 'add', source, '--list'], sandbox)
      assert.equal(listing.status, 0, listing.stderr)
      assert.deepEqual(bytes(sandbox.project), {})
      /**
       * 源目录内全部可选名称；多选请求的来源仍为整包。
       */
      const listed = source === releaseRoot ? publicNames : expected
      /**
       * 独立列出的每个公开名称必须可被官方发现。
       */
      for (const name of listed)
        assert.ok(listing.stdout.includes(name), `${name}: ${listing.stdout}`)
      assert.equal(listing.stdout.includes('eval-short-rule'), false)
      install(sandbox, readAgents(sandbox).find(agent => agent.name === 'codex'), false, source, names, expected)
    }
    finally {
      sandbox.cleanup()
    }
  }
})

test('选择预检拒绝混合未知名与已有修改，失败不写入且不扩大范围', () => {
  assert.ok(implementation, '前置骨架未就绪')
  /**
   * 完整源清单只读加载。
   */
  const catalog = implementation.readCatalog(path.join(releaseRoot, 'skills'))
  assert.deepEqual(implementation.selectSkills(catalog, { names: ['task-explore', 'task-explore'] }).map(item => item.name), ['task-explore'])
  assert.throws(() => implementation.selectSkills(catalog, { names: ['task-explore', 'missing'] }), /missing/u)
  assert.throws(() => implementation.selectSkills(catalog, {}))
  assert.throws(() => implementation.selectSkills(catalog, { all: true, names: ['task-explore'] }))
  assert.throws(() => implementation.selectSkills(catalog, { category: 'eval' }))
  /**
   * 用户已有内容作为哨兵，冲突检测不能修改其字节。
   */
  const target = path.join(fixture.root, 'preflight')
  fs.mkdirSync(path.join(target, 'task-explore'), { recursive: true })
  fs.writeFileSync(path.join(target, 'task-explore/SKILL.md'), '用户修改')
  /**
   * 调用前快照。
   */
  const before = bytes(target)
  assert.throws(() => implementation.checkTargets(implementation.selectSkills(catalog, { names: ['task-explore'] }), target, 'codex'), /task-explore/u)
  assert.deepEqual(bytes(target), before)
  assert.deepEqual(implementation.checkTargets(implementation.selectSkills(catalog, { names: ['task-guide'] }), target, 'codex').map(item => item.status), ['missing'])
  assert.deepEqual(bytes(target), before)
})

test('79个agent与77个全局位置由真实安装核对，两项不支持global明确拒绝', () => {
  assert.ok(implementation, '前置骨架未就绪')
  /**
   * 固定工具的 agent 集合用真实安装而非仅静态映射验证。
   */
  const agents = readAgents(fixture)
  assert.equal(agents.length, 79)
  assert.equal(agents.filter(agent => agent.globalSkillsDir !== undefined).length, 77)
  /**
   * 逐 agent 创建独立环境，即便共享安装位置也分别验证。
   */
  for (const entry of agents) {
    /**
     * 项目与全局两个范围分别执行。
     */
    for (const global of [false, true]) {
      /**
       * 全局实验仅写测试用户，不触碰开发者用户目录。
       */
      const sandbox = createCase()
      try {
        /**
         * 配置中的全局路径必须针对本次隔离用户重新解析。
         */
        const agent = readAgents(sandbox).find(item => item.name === entry.name)
        if (global && agent.globalSkillsDir === undefined) {
          assert.throws(() => implementation.resolveInstallRoot(agent, { project: sandbox.project, userHome: sandbox.userHome, global }), /global/u)
          /**
           * 上游拒绝路径也实际调用；以没有安装文件判断，退出码另记事实。
           */
          const rejected = run(process.execPath, [path.join(officialPackage, 'bin/cli.mjs'), 'add', releaseRoot, '--skill', 'document-changed-symbols', '--agent', agent.name, '--copy', '--yes', '--global'], sandbox)
          assert.deepEqual(bytes(sandbox.project), {})
          assert.equal(fs.existsSync(path.join(sandbox.userHome, '.agents/skills/document-changed-symbols')), false)
          assert.match(rejected.stdout + rejected.stderr, /global/iu)
          observations.push({ agent: agent.name, scope: 'global', rejected: true, exitCode: rejected.status })
        }
        else {
          install(sandbox, agent, global, releaseRoot, ['document-changed-symbols'], ['document-changed-symbols'])
        }
      }
      finally {
        sandbox.cleanup()
      }
    }
  }
})

test('声明名与目录名分离，重复名、链接和上游排除内容在交付前失败', () => {
  assert.ok(implementation, '前置骨架未就绪')
  /**
   * 与真实样本分开的非法来源，不污染其他实验。
   */
  const source = path.join(fixture.root, 'invalid-source')
  fs.cpSync(path.join(releaseRoot, 'skills'), source, { recursive: true })
  fs.renameSync(path.join(source, 'workflow/task-explore'), path.join(source, 'workflow/directory-alias'))
  assert.ok(implementation.readCatalog(source).some(skill => skill.name === 'task-explore' && skill.directory.endsWith('directory-alias')))
  fs.cpSync(path.join(source, 'workflow/directory-alias'), path.join(source, 'workflow/duplicate'), { recursive: true })
  assert.throws(() => implementation.readCatalog(source), /重复/u)
  fs.rmSync(path.join(source, 'workflow/duplicate'), { recursive: true })
  fs.writeFileSync(path.join(source, 'workflow/directory-alias/metadata.json'), '{}')
  assert.throws(() => implementation.readCatalog(source), /排除/u)
  fs.rmSync(path.join(source, 'workflow/directory-alias/metadata.json'))
  fs.symlinkSync(path.join(source, 'frontend'), path.join(source, 'workflow/directory-alias/outside'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => implementation.readCatalog(source), /不支持/u)
})

test('Eve转换保留嵌套元数据与附件，identity字节不变，已满足预检不写入', () => {
  assert.ok(implementation, '前置骨架未就绪')
  /**
   * 手写期望样本检测字段过滤、顺序、YAML结构及正文空行处理。
   */
  const raw = '---\nname: sample\ndescription: demo\ndestructive: false\nlicense: MIT\ncompatibility: Node\nversion: 2\nmetadata:\n  tag: sample\n---\n\n正文\n'
  /**
   * 期望值不调用转换器生成。
   */
  const expected = '---\nname: sample\ndescription: demo\nlicense: MIT\ncompatibility: Node\nversion: 2\nmetadata:\n  tag: sample\n---\n正文\n'
  /**
   * 附件也参与完整投影，不因转换 SKILL.md 丢失。
   */
  const files = { 'SKILL.md': Buffer.from(raw).toString('base64'), 'references/bytes.bin': Buffer.from([0, 1, 255]).toString('base64') }
  assert.deepEqual(implementation.projectFiles(files, 'codex'), files)
  assert.deepEqual(implementation.projectFiles(files, 'eve'), { ...files, 'SKILL.md': Buffer.from(expected).toString('base64') })
  /**
   * 同内容目标必须通过完整集合核验，但不会被重新写入。
   */
  const target = path.join(fixture.root, 'satisfied')
  /**
   * 只核验本次指定的一项。
   */
  const selected = implementation.selectSkills(implementation.readCatalog(path.join(releaseRoot, 'skills')), { names: ['task-guide'] })
  fs.cpSync(selected[0].directory, path.join(target, 'task-guide'), { recursive: true })
  assert.deepEqual(implementation.checkTargets(selected, target, 'codex').map(item => item.status), ['satisfied'])
  assert.deepEqual(bytes(path.join(target, 'task-guide')), bytes(selected[0].directory))
})

test('官方混合未知名与覆盖行为被真实记录，本包预检先拒绝冲突', () => {
  assert.ok(implementation, '前置骨架未就绪')
  /**
   * 只在专用沙箱观察官方覆盖行为，绝不使用真实用户文件。
   */
  const sandbox = createCase()
  try {
    /**
     * 官方当前允许有效名称与未知名称混选，需要本包预检收紧。
     */
    const mixed = run(process.execPath, [path.join(officialPackage, 'bin/cli.mjs'), 'add', releaseRoot, '--skill', 'task-explore', 'missing', '--agent', 'codex', '--copy', '--yes'], sandbox)
    assert.equal(mixed.status, 0, mixed.stdout + mixed.stderr)
    assert.deepEqual(fs.readdirSync(path.join(sandbox.project, '.agents/skills')), ['task-explore'])
    fs.writeFileSync(path.join(sandbox.project, '.agents/skills/task-explore/SKILL.md'), '用户修改')
    /**
     * 上游裸命令会覆盖；这不是本包冲突保护已生效的证据。
     */
    const overwrite = run(process.execPath, [path.join(officialPackage, 'bin/cli.mjs'), 'add', releaseRoot, '--skill', 'task-explore', '--agent', 'codex', '--copy', '--yes'], sandbox)
    assert.equal(overwrite.status, 0, overwrite.stdout + overwrite.stderr)
    assert.deepEqual(bytes(path.join(sandbox.project, '.agents/skills/task-explore')), bytes(path.join(releaseRoot, 'skills/workflow/task-explore')))
  }
  finally {
    sandbox.cleanup()
  }
})

test('环境变量和OpenClaw旧目录分支以真实全局安装核验', () => {
  assert.ok(implementation, '前置骨架未就绪')
  /**
   * 必须验证实际安装行为的变量分支，包含仅影响检测的 CODEX_HOME。
   */
  const branches = [
    ['claude-code', 'CLAUDE_CONFIG_DIR'],
    ['mistral-vibe', 'VIBE_HOME'],
    ['hermes-agent', 'HERMES_HOME'],
    ['autohand-code', 'AUTOHAND_HOME'],
    ['grok', 'GROK_HOME'],
    ['sarvam-code', 'SARVAM_HOME'],
    ['codex', 'CODEX_HOME'],
    ['opencode', 'XDG_CONFIG_HOME'],
    ['amp', 'XDG_CONFIG_HOME'],
    ['openclaw', '.openclaw'],
    ['openclaw', '.clawdbot'],
    ['openclaw', '.moltbot'],
  ]
  /**
   * 各分支隔离，避免前一目录改变后一分支优先级。
   */
  for (const [id, branch] of branches) {
    /**
     * 本次环境覆盖仍在测试用户内部。
     */
    const sandbox = createCase()
    try {
      if (branch.startsWith('.'))
        fs.mkdirSync(path.join(sandbox.userHome, branch))
      else
        sandbox.env[branch] = path.join(sandbox.userHome, 'override')
      /**
       * 以官方配置探针提供本次变量的实际解析值。
       */
      const agent = readAgents(sandbox).find(item => item.name === id)
      install(sandbox, agent, true, releaseRoot, ['document-changed-symbols'], ['document-changed-symbols'], branch)
    }
    finally {
      sandbox.cleanup()
    }
  }
})

test('预检拒绝失效链接和安装根祖先链接，外部哨兵保持不变', () => {
  assert.ok(implementation, '前置骨架未就绪')
  /**
   * 真实选择与外部哨兵都只位于本次测试临时目录。
   */
  const selected = implementation.selectSkills(implementation.readCatalog(path.join(releaseRoot, 'skills')), { names: ['task-explore'] })
  /**
   * 安装目标根。
   */
  const target = path.join(fixture.root, 'symlink-target')
  /**
   * 本次安装根以外的自有哨兵。
   */
  const outside = path.join(fixture.root, 'outside-sentinel')
  fs.mkdirSync(target)
  fs.mkdirSync(outside)
  fs.writeFileSync(path.join(outside, 'keep.txt'), '不可改动')
  fs.symlinkSync(path.join(outside, 'missing'), path.join(target, 'task-explore'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => implementation.checkTargets(selected, target, 'codex'), /链接/u)
  fs.symlinkSync(outside, path.join(fixture.root, 'linked-parent'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => implementation.checkTargets(selected, path.join(fixture.root, 'linked-parent/skills'), 'codex'), /链接/u)
  assert.deepEqual(bytes(outside), { 'keep.txt': Buffer.from('不可改动').toString('base64') })
})
