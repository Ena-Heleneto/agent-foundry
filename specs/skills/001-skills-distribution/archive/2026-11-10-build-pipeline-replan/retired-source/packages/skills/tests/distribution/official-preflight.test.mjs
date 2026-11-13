import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test, { after, before } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { createSandbox } from './sandbox.mjs'

/**
 * 真实包根，仅作为构建源码和平台脚本来源。
 */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))
/**
 * 独立编译插件及发布内容的受控源，不接触真实用户项目。
 */
const source = createSandbox()
/**
 * 真实源码提交，不伪造远端可用性。
 */
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: packageRoot, encoding: 'utf8' })
/**
 * 与源和消费目标独立的发布根。
 */
const releaseRoot = path.join(source.root, 'release')
/**
 * 构建生成的正式候选清单，依赖测试只临时更改其声明。
 */
let release

/**
 * 读取整棵用户及项目树，包括空目录、链接和二进制文件。
 * @param {string} directory 自有沙箱根。
 * @returns {object} 可比较的文件事实。
 */
function tree(directory) {
  return Object.fromEntries(fs.readdirSync(directory, { recursive: true }).sort().map((relative) => {
    /**
     * 使用 lstat 保留链接自身事实。
     */
    const absolute = path.join(directory, relative)
    /**
     * 条目类型与文件字节共同构成只读断言。
     */
    const entry = fs.lstatSync(absolute)
    return [relative, entry.isSymbolicLink() ? `link:${fs.readlinkSync(absolute)}` : entry.isDirectory() ? 'directory' : fs.readFileSync(absolute).toString('base64')]
  }))
}

/**
 * 创建声明名称规范的真实技能源，含附件与会被 Eve 转换的额外元数据。
 * @param {string} category 公开分类。
 * @param {string} name 声明名称。
 */
function writeSkill(category, name) {
  /**
   * 来源目录保留真实附件层级。
   */
  const directory = path.join(source.project, 'src/skills', category, name)
  fs.mkdirSync(path.join(directory, 'references'), { recursive: true })
  fs.writeFileSync(path.join(directory, 'SKILL.md'), `---\nname: ${name}\ndescription: 只读契约样本\ncustom: 官方 Eve 应移除的字段\n---\n\n读取[附件](references/content.txt)。\n`)
  fs.writeFileSync(path.join(directory, 'references/content.txt'), '附件原始字节\n')
}

before(async () => {
  assert.ifError(revision.error)
  assert.equal(revision.status, 0, revision.stderr)
  /**
   * 各公开分类和MCP空根作为真实构建输入。
   */
  for (const directory of ['src/mcp', 'src/skills/coding', 'src/skills/frontend', 'src/skills/workflow'])
    fs.mkdirSync(path.join(source.project, directory), { recursive: true })
  writeSkill('coding', 'alpha-skill')
  writeSkill('frontend', 'beta-skill')
  /**
   * 逐个复制生产构建器及完整运行脚本，不依赖来源声明目录。
   */
  for (const directory of ['build', 'script'])
    fs.cpSync(path.join(packageRoot, directory), path.join(source.project, directory), { recursive: true })
  fs.copyFileSync(path.join(packageRoot, 'vite.config.ts'), path.join(source.project, 'vite.config.ts'))
  fs.symlinkSync(path.join(packageRoot, 'node_modules'), path.join(source.project, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
  fs.writeFileSync(path.join(source.project, 'package.json'), '{"type":"module","version":"0.1.0"}')
  await build({
    configFile: false,
    logLevel: 'silent',
    build: { ssr: path.join(packageRoot, 'build/plugins/distribution.ts'), outDir: path.join(source.root, 'plugin'), rollupOptions: { output: { entryFileNames: 'index.mjs' } } },
    ssr: { noExternal: true },
  })
  /**
   * 生产插件必须实际编译和加载，测试不复制预检选择逻辑。
   */
  const { SkillsDistributionPlugin } = await import(pathToFileURL(path.join(source.root, 'plugin/index.mjs')).href)
  await build({
    root: source.project,
    configFile: path.join(source.project, 'vite.config.ts'),
    logLevel: 'silent',
    plugins: [new SkillsDistributionPlugin({ categories: ['coding', 'frontend', 'workflow'], version: '0.1.0', sourceRevision: revision.stdout.trim() })],
  })
  release = JSON.parse(fs.readFileSync(path.join(source.project, 'dist/release.json'), 'utf8'))
  /**
   * 仅按正式白名单迁移同版交付文件。
   */
  for (const file of [...release.files.map(entry => entry.path), 'release.json']) {
    fs.mkdirSync(path.dirname(path.join(releaseRoot, file)), { recursive: true })
    fs.copyFileSync(path.join(source.project, 'dist', file), path.join(releaseRoot, file))
  }
})
after(() => source.cleanup())

/**
 * 创建消费环境；显式 PowerShell 验证先准备运行时自身缓存，正式预检仍比较全部树。
 * @returns {ReturnType<typeof createSandbox>} 完成运行时前置准备的隔离消费环境。
 */
function createConsumer() {
  /**
   * 运行时准备和产品操作共同限定在同一个自有沙箱。
   */
  const consumer = createSandbox()
  if (process.env.FOUNDRY_PREFLIGHT_PWSH) {
    /**
     * 官方 .NET 开关关闭 JIT profile 收集；遥测与更新探测不参与只读产品验证。
     */
    const preparation = spawnSync(process.env.FOUNDRY_PREFLIGHT_PWSH, ['-NoProfile', '-NonInteractive', '-Command', '$null'], {
      cwd: consumer.project,
      env: { ...consumer.env, POWERSHELL_TELEMETRY_OPTOUT: '1', POWERSHELL_UPDATECHECK: 'Off', DOTNET_MultiCoreJitNoProfileGather: '1' },
      encoding: 'utf8',
      timeout: 30000,
    })
    assert.ifError(preparation.error)
    assert.equal(preparation.status, 0, preparation.stderr)
  }
  return consumer
}

/**
 * 通过唯一 Node 入口调用真实平台脚本，保留退出码及原始输出。
 * @param {object} consumer 隔离项目与用户。
 * @param {string[]} argumentsList 完整预检参数。
 * @param {object} environment 附加的隔离环境变量。
 * @returns {object} 实际进程结果。
 */
function run(consumer, argumentsList, environment = {}) {
  /**
   * 可显式验证已准备的原生 PowerShell；默认始终经唯一 Node 入口。
   */
  const invocation = process.env.FOUNDRY_PREFLIGHT_PWSH
    ? { command: process.env.FOUNDRY_PREFLIGHT_PWSH, args: ['-NoProfile', '-NonInteractive', '-File', path.join(releaseRoot, 'script/install-skills/install-skills.ps1')] }
    : { command: process.execPath, args: [path.join(releaseRoot, 'script/index.mjs')] }
  /**
   * 数组参数阻止 shell 二次展开，缓存和 HOME 均来自隔离环境。
   */
  const result = spawnSync(invocation.command, [...invocation.args, ...argumentsList], {
    cwd: consumer.project,
    env: { ...consumer.env, GIT_CEILING_DIRECTORIES: consumer.root, POWERSHELL_TELEMETRY_OPTOUT: '1', POWERSHELL_UPDATECHECK: 'Off', DOTNET_MultiCoreJitNoProfileGather: '1', ...environment },
    encoding: 'utf8',
    timeout: 30000,
  })
  assert.ifError(result.error)
  assert.equal(result.signal, null, result.stderr)
  return result
}

/**
 * 标准本地来源、精确版本及单个 agent 的只读请求。
 * @param {string[]} selection 显式选择参数。
 * @returns {string[]} 传给真实入口的参数。
 */
function args(selection) {
  return ['--check', '--official', '--source-dir', releaseRoot, '--version', '0.1.0', '--agent', 'codex', ...selection]
}

/**
 * 每次执行都比对完整消费沙箱，失败时不允许带可执行安装建议。
 * @param {object} consumer 隔离消费目标。
 * @param {string[]} input 请求参数。
 * @param {number} expectedStatus 预期退出码。
 * @param {RegExp} diagnostic 可选错误诊断。
 * @returns {object} 结构化预检报告。
 */
function check(consumer, input, expectedStatus, diagnostic) {
  /**
   * 覆盖项目、用户目录和全部缓存的执行前基线。
   */
  const beforeTree = tree(consumer.root)
  /**
   * 生产入口实际执行结果。
   */
  const result = run(consumer, input)
  assert.deepEqual(tree(consumer.root), beforeTree)
  assert.equal(result.status, expectedStatus, JSON.stringify(input) + result.stderr + result.stdout)
  if (diagnostic)
    assert.match(result.stderr + result.stdout, diagnostic)
  /**
   * 单个 JSON 报告不能混入执行日志或命令副作用。
   */
  const report = JSON.parse(result.stdout)
  if (expectedStatus === 2) {
    assert.equal(report.official, undefined)
    assert.doesNotMatch(result.stdout + result.stderr, /npx skills@/u)
  }
  return report
}

test('四种粒度与重复选择输出本次在线解析的官方版本且整个目标只读', () => {
  /**
   * 每项定义独立选择和期望的来源、技能集合。
   */
  const cases = [
    [['--all'], releaseRoot, ['alpha-skill', 'beta-skill'], ['alpha-skill', 'beta-skill']],
    [['--category', 'frontend'], `${releaseRoot}/skills/frontend`, ['beta-skill'], ['beta-skill']],
    [['--skill', 'alpha-skill', '--skill', 'alpha-skill'], `${releaseRoot}/skills/coding/alpha-skill`, ['alpha-skill'], ['alpha-skill']],
    [['--skill', 'beta-skill', '--skill', 'alpha-skill', '--skill', 'beta-skill'], releaseRoot, ['beta-skill', 'alpha-skill'], ['beta-skill', 'alpha-skill']],
  ]
  /**
   * 每个请求同时声明期望来源、技能顺序和实际选择。
   */
  for (const [selection, sourcePath, names, expected] of cases) {
    /**
     * 每种粒度使用独立用户，避免前一个调用的状态掩盖写入。
     */
    const consumer = createConsumer()
    try {
      fs.writeFileSync(path.join(consumer.project, 'keep.txt'), '保留用户内容')
      /**
       * 报告仅说明检查成功，安装阶段保持未运行。
       */
      const report = check(consumer, args(selection), 0)
      assert.equal(report.operation, 'official-check')
      assert.equal(report.upstream.version, JSON.parse(fs.readFileSync(path.join(process.env.FOUNDRY_SKILLS_PACKAGE, 'package.json'), 'utf8')).version)
      assert.deepEqual(report.selection.names, expected)
      assert.equal(report.target.path, path.join(consumer.project, '.agents/skills'))
      assert.deepEqual(report.official, { command: 'npx', args: [`skills@${JSON.parse(fs.readFileSync(path.join(process.env.FOUNDRY_SKILLS_PACKAGE, 'package.json'), 'utf8')).version}`, 'add', sourcePath, '--skill', ...names, '--agent', 'codex', '--copy'] })
      assert.equal(report.stages.installation.status, 'not-run')
      assert.equal(report.alreadySatisfied, false)
    }
    finally {
      consumer.cleanup()
    }
  }
})

test('在线规则获取失败时目标零写入，不回退旧表或输出安装建议', () => {
  /**
   * 网络故障预加载器位于测试源之外，不属于被检查的消费目录。
   */
  const offline = path.join(source.root, 'offline.mjs')
  fs.writeFileSync(offline, '/**\n * 测试专用 HTTP 故障，产品解析逻辑继续实际执行。\n */\nglobalThis.fetch = async () => { throw new Error("controlled-offline") }\n')
  /**
   * 故障发生前不创建任何安装目录。
   */
  const consumer = createConsumer()
  try {
    consumer.env.NODE_OPTIONS = [consumer.env.NODE_OPTIONS, `--import=${pathToFileURL(offline).href}`].filter(Boolean).join(' ')
    /**
     * 断网失败报告不能携带可执行建议。
     */
    const report = check(consumer, args(['--all']), 2, /在线|最新|offline/u)
    assert.equal(report.reasonCode, 'upstream')
  }
  finally {
    consumer.cleanup()
  }
})

test('所有静态选择、版本和来源错误退出2并保留具体诊断', () => {
  /**
   * 完整覆盖来源前置与选择，不将未知 check 参数统一错误视为通过。
   */
  const cases = [
    [args([]), /选择/u],
    [args(['--all', '--skill', 'alpha-skill']), /混用|只能/u],
    [args(['--category', 'coding', '--all']), /混用|只能/u],
    [args(['--category', 'coding', '--category', 'frontend']), /混用|只能/u],
    [args(['--skill', '']), /空|缺值/u],
    [args(['--skill', 'alpha-skill', '--skill', 'unknown']), /unknown/u],
    [args(['--category', 'eval']), /eval/u],
    [args(['--skill', 'internal-skill']), /internal-skill/u],
    [args(['--category', 'workflow']), /workflow|分类为空/u],
    [args(['--category', 'other']), /other/u],
    [args(['--all']).filter(value => value !== '--version' && value !== '0.1.0'), /version|版本/u],
    [args(['--all']).filter(value => value !== '--source-dir' && value !== releaseRoot), /source/u],
    [[...args(['--all']), '--source', `https://example.test/${'a'.repeat(40)}`], /source/u],
    [args(['--all']).map(value => value === '0.1.0' ? '9.9.9' : value), /版本/u],
    [args(['--all']).filter(value => value !== '--official'), /同时/u],
    [args(['--all']).filter(value => value !== '--check'), /同时/u],
    [[...args(['--all']), '--agent', 'cursor'], /agent/u],
    [args(['--all']).map(value => value === 'codex' ? 'unknown-agent' : value), /unknown-agent/u],
    [['--check', '--official', '--source', 'http://example.test/main', '--version', '0.1.0', '--agent', 'codex', '--all'], /HTTPS/u],
    [['--check', '--official', '--source', 'https://example.test/main', '--version', '0.1.0', '--agent', 'codex', '--all'], /完整提交/u],
  ]
  /**
   * 所有失败共用未变的消费树，确保错误不遗留空目录或暂存。
   */
  const consumer = createConsumer()
  try {
    /**
     * 逐个验证输入与对应的具体诊断。
     */
    for (const [input, diagnostic] of cases)
      check(consumer, input, 2, diagnostic)
  }
  finally {
    consumer.cleanup()
  }
})

test('缺少依赖明确要求补选而不补装，完整显式集合通过', () => {
  /**
   * 与原契约相同，只调整模型允许的元数据，技能原始字节不变。
   */
  const changed = structuredClone(release)
  changed.skills.find(skill => skill.name === 'alpha-skill').requiresSkills = ['beta-skill']
  /**
   * 依赖场景的独立消费环境。
   */
  const consumer = createConsumer()
  try {
    fs.writeFileSync(path.join(releaseRoot, 'release.json'), JSON.stringify(changed))
    check(consumer, args(['--skill', 'alpha-skill']), 2, /补选.*beta-skill/u)
    check(consumer, args(['--skill', 'alpha-skill', '--skill', 'beta-skill']), 0)
  }
  finally {
    fs.writeFileSync(path.join(releaseRoot, 'release.json'), JSON.stringify(release))
    consumer.cleanup()
  }
})

/**
 * 生成影响官方建议的非法正式声明，所有场景复用真实构建产物。
 * @param {string} kind 当前非法跨字段关系。
 * @returns {object} 仅供错误输入验证的清单副本。
 */
function invalidRelease(kind) {
  /**
   * 不修改其他测试共用的合法清单。
   */
  const changed = structuredClone(release)
  if (kind === 'schema')
    changed.schemaVersion = 2
  if (kind === 'tool')
    changed.tools.node = 22
  if (kind === 'source-omission')
    changed.skills[0].sourceFiles.pop()
  if (kind === 'identity-omission')
    changed.projections.identity['alpha-skill'].pop()
  if (kind === 'eve-omission')
    changed.projections['eve-frontmatter-v1']['alpha-skill'].pop()
  if (kind === 'installed-omission')
    changed.skills[0].installedFilesByProjection.identity.pop()
  if (kind === 'projection-digest')
    changed.projections['eve-frontmatter-v1']['alpha-skill'][0].sha256 = '0'.repeat(64)
  if (kind === 'unknown-projection')
    changed.projections.unknown = {}
  return changed
}

test('未知schema、错工具字段及任何投影遗漏不能产生官方建议', () => {
  /**
   * 全部错误均在独立用户和完整实际来源上检验。
   */
  const consumer = createConsumer()
  try {
    /**
     * 各非法清单关系必须分别拒绝。
     */
    for (const kind of ['schema', 'tool', 'source-omission', 'identity-omission', 'eve-omission', 'installed-omission', 'projection-digest', 'unknown-projection']) {
      fs.writeFileSync(path.join(releaseRoot, 'release.json'), JSON.stringify(invalidRelease(kind)))
      check(consumer, args(['--all']), 2, /清单|投影|schema/u)
    }
  }
  finally {
    fs.writeFileSync(path.join(releaseRoot, 'release.json'), JSON.stringify(release))
    consumer.cleanup()
  }
})

test('Eve也必须核验原始sourceFiles，额外来源文件不被静默安装', () => {
  /**
   * 保留来源原文以便每个错误场景独立恢复。
   */
  const document = path.join(releaseRoot, 'skills/coding/alpha-skill/SKILL.md')
  /**
   * 使用真实构建字节作为恢复点。
   */
  const original = fs.readFileSync(document)
  /**
   * 当前错误来源的独立消费方。
   */
  const consumer = createConsumer()
  try {
    fs.appendFileSync(document, '篡改原文但保持Eve blob和清单不变')
    check(consumer, args(['--skill', 'alpha-skill']).map(value => value === 'codex' ? 'eve' : value), 2, /摘要|长度/u)
    fs.writeFileSync(document, original)
    fs.writeFileSync(path.join(path.dirname(document), 'unexpected.txt'), '清单外文件')
    check(consumer, args(['--skill', 'alpha-skill']), 2, /全集|清单/u)
  }
  finally {
    fs.writeFileSync(document, original)
    fs.rmSync(path.join(path.dirname(document), 'unexpected.txt'), { force: true })
    consumer.cleanup()
  }
})

test('完整dist包含内部及未选技能时官方建议仍仅显式选择清单名称', () => {
  /**
   * 模拟完整 dist 中必须保留但不进入公开清单的技能。
   */
  const extra = path.join(releaseRoot, 'skills/eval/internal-eval')
  /**
   * 官方建议与目标均在受控来源、用户下验证。
   */
  const consumer = createConsumer()
  try {
    fs.mkdirSync(extra, { recursive: true })
    fs.writeFileSync(path.join(extra, 'SKILL.md'), '---\nname: internal-eval\ndescription: 内部测试\n---\n正文\n')
    /**
     * 公开整包选择必须列出已核验的精确名称，不能用通配符包含 eval。
     */
    const report = check(consumer, args(['--all']), 0)
    assert.deepEqual(report.official.args.slice(3, 6), ['--skill', 'alpha-skill', 'beta-skill'])
    assert.ok(!report.official.args.includes('*'))
  }
  finally {
    fs.rmSync(path.join(releaseRoot, 'skills/eval'), { recursive: true, force: true })
    consumer.cleanup()
  }
})

/**
 * 按正式投影复制受控已安装文件，测试不自行模拟 Eve 转换。
 * @param {object} consumer 隔离目标。
 * @param {string} agent 官方 agent。
 * @returns {string} 已安装技能绝对目录。
 */
function installFixture(consumer, agent) {
  /**
   * 固定路径数据与发布投影共同决定预检事实。
   */
  const agents = JSON.parse(fs.readFileSync(new URL('./fixtures/agents-1.7.4.json', import.meta.url), 'utf8'))
  /**
   * 本次显式 agent 的项目安装根。
   */
  const record = agents.agents.find(entry => entry.name === agent)
  /**
   * 使用 alpha 保持冲突范围固定。
   */
  const target = path.join(consumer.project, record.skillsDir, 'alpha-skill')
  /**
   * 仅消费构建产物的声明投影，不测试内重写内容。
   */
  const files = release.projections[record.projection]['alpha-skill']
  /**
   * 将投影声明引用的字节放入对应安装路径。
   */
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(target, file.path)), { recursive: true })
    fs.copyFileSync(path.join(releaseRoot, file.sourcePath), path.join(target, file.path))
  }
  return target
}

test('identity和Eve已安装全集通过并建议跳过，Eve原文不冒认投影', () => {
  /**
   * 两个真实格式分别核验。
   */
  for (const agent of ['codex', 'eve']) {
    /**
     * 每个投影保留独立目标文件全集。
     */
    const consumer = createConsumer()
    try {
      /**
       * 正式构建生成的当前 agent 投影。
       */
      const target = installFixture(consumer, agent)
      /**
       * 当前 agent 的完整只读调用。
       */
      const input = args(['--skill', 'alpha-skill']).map(value => value === 'codex' ? agent : value)
      /**
       * 已满足只说明事实复核，不执行官方安装。
       */
      const report = check(consumer, input, 0)
      assert.equal(report.alreadySatisfied, true)
      assert.equal(report.recommendation, 'skip')
      if (agent === 'eve') {
        fs.copyFileSync(path.join(releaseRoot, 'skills/coding/alpha-skill/SKILL.md'), path.join(target, 'SKILL.md'))
        check(consumer, input, 2, /内容|摘要/u)
      }
    }
    finally {
      consumer.cleanup()
    }
  }
})

test('修改、多文件、链接、已跟踪冲突均拒绝且不输出官方建议', () => {
  /**
   * 每个冲突独立准备完整安装基线。
   */
  for (const kind of ['modified', 'extra', 'symlink', 'tracked']) {
    /**
     * 每种冲突从完全符合的受控安装开始。
     */
    const consumer = createConsumer()
    try {
      /**
       * 真实文件全集基线。
       */
      const target = installFixture(consumer, 'codex')
      if (kind === 'modified')
        fs.appendFileSync(path.join(target, 'SKILL.md'), '用户改动')
      if (kind === 'extra')
        fs.writeFileSync(path.join(target, 'extra.txt'), '用户额外文件')
      if (kind === 'symlink') {
        fs.rmSync(path.join(target, 'references/content.txt'))
        fs.symlinkSync(path.join(releaseRoot, 'skills/coding/alpha-skill/references/content.txt'), path.join(target, 'references/content.txt'))
      }
      if (kind === 'tracked') {
        assert.equal(spawnSync('git', ['init'], { cwd: consumer.project, env: consumer.env }).status, 0)
        assert.equal(spawnSync('git', ['add', '.agents/skills/alpha-skill'], { cwd: consumer.project, env: consumer.env }).status, 0)
      }
      check(consumer, args(['--skill', 'alpha-skill']), 2, /内容|集合|链接|跟踪/u)
    }
    finally {
      consumer.cleanup()
    }
  }
})

/**
 * 从固定规则独立计算全局目标，不调用平台内部路径实现。
 * @param {object} consumer 隔离用户。
 * @param {object} agent 固定 agent 记录。
 * @returns {string} 官方路径约定对应的全局安装根。
 */
function expectedGlobal(consumer, agent) {
  if (agent.skillsDir === '.agents/skills')
    return path.join(consumer.userHome, '.agents/skills')
  /**
   * 专属 agent 的全局根依据数据中的基础目录类型选择。
   */
  const rule = agent.globalSkillsDir
  if (rule.base === 'xdg-config')
    return path.join(consumer.env.XDG_CONFIG_HOME, rule.path)
  if (rule.base === 'environment')
    return path.join(consumer.userHome, rule.fallback, rule.path)
  if (rule.base === 'openclaw')
    return path.join(consumer.userHome, '.openclaw', rule.path)
  return path.join(consumer.userHome, rule.path)
}

test('上游校准夹具的全部项目和支持全局目标均在线解析且只读', () => {
  /**
   * 正式交付路径数据，逐项实际运行唯一入口。
   */
  const agents = JSON.parse(fs.readFileSync(new URL('./fixtures/agents-1.7.4.json', import.meta.url), 'utf8')).agents
  /**
   * 所有路径均限定在隔离项目及用户目录。
   */
  const consumer = createConsumer()
  try {
    /**
     * 显式执行每个固定 agent 的项目和全局请求。
     */
    for (const agent of agents) {
      /**
       * 当前显式 agent 的项目请求。
       */
      const input = args(['--skill', 'alpha-skill']).map(value => value === 'codex' ? agent.name : value)
      /**
       * 每个固定目标均由实际平台逻辑解析。
       */
      const report = check(consumer, input, 0)
      assert.equal(report.target.path, path.join(consumer.project, agent.skillsDir))
      if (agent.globalSkillsDir === null) {
        check(consumer, [...input, '--global'], 2, /global/u)
        continue
      }
      assert.equal(check(consumer, [...input, '--global'], 0).target.path, expectedGlobal(consumer, agent))
    }
  }
  finally {
    consumer.cleanup()
  }
})

test('代表agent的全局路径、OpenClaw回退和不支持scope均保持只读', () => {
  /**
   * 相同隔离用户下分辨 canonical、专属环境目录与历史目录。
   */
  const consumer = createConsumer()
  /**
   * 代表路径类型包含项目、全局及不支持项。
   */
  const cases = [
    ['codex', false, path.join(consumer.project, '.agents/skills')],
    ['codex', true, path.join(consumer.userHome, '.agents/skills')],
    ['claude-code', true, path.join(consumer.userHome, '.claude/skills')],
    ['eve', false, path.join(consumer.project, 'agent/skills')],
  ]
  try {
    /**
     * 每项都实际执行平台入口并比较返回目标和整棵用户树。
     */
    for (const [agent, global, expected] of cases) {
      /**
       * 保留完整版本、来源及显式选择，只切换目标。
       */
      const input = args(['--skill', 'alpha-skill']).map(value => value === 'codex' ? agent : value)
      assert.equal(check(consumer, global ? [...input, '--global'] : input, 0).target.path, expected)
    }
    check(consumer, args(['--all', '--global']).map(value => value === 'codex' ? 'eve' : value), 2, /global/u)
    fs.mkdirSync(path.join(consumer.userHome, '.clawdbot'))
    assert.equal(check(consumer, args(['--all', '--global']).map(value => value === 'codex' ? 'openclaw' : value), 0).target.path, path.join(consumer.userHome, '.clawdbot/skills'))
  }
  finally {
    consumer.cleanup()
  }
})

test('已删除但仍在Git索引中的目标祖先文件也必须拒绝', () => {
  /**
   * 缺失祖先不会被普通文件系统存在性检查发现。
   */
  const consumer = createConsumer()
  try {
    assert.equal(spawnSync('git', ['init'], { cwd: consumer.project, env: consumer.env }).status, 0)
    fs.writeFileSync(path.join(consumer.project, '.agents'), '索引中的祖先文件')
    assert.equal(spawnSync('git', ['add', '.agents'], { cwd: consumer.project, env: consumer.env }).status, 0)
    fs.rmSync(path.join(consumer.project, '.agents'))
    check(consumer, args(['--skill', 'alpha-skill']), 2, /祖先.*跟踪/u)
  }
  finally {
    consumer.cleanup()
  }
})

test('缺jq仅报告前置，FOUNDRY_JQ允许指定已准备路径', { skip: process.env.FOUNDRY_PREFLIGHT_PWSH ? 'PowerShell 使用原生 JSON 与 SHA256，无 jq 前置' : false }, () => {
  /**
   * 工具缺失测试仍只使用自有消费环境。
   */
  const consumer = createConsumer()
  try {
    /**
     * 使用不存在的显式路径，禁止任何自动下载兜底。
     */
    const beforeTree = tree(consumer.root)
    /**
     * 实际平台分支应停止在只读工具检查。
     */
    const missing = run(consumer, args(['--all']), { FOUNDRY_JQ: path.join(consumer.root, 'absent-jq') })
    assert.equal(missing.status, 2)
    assert.match(missing.stderr, /jq/u)
    assert.deepEqual(tree(consumer.root), beforeTree)
    /**
     * 仅在本机存在的 jq 路径上验证显式指定能力。
     */
    const available = spawnSync('bash', ['-c', 'command -v jq'], { encoding: 'utf8' })
    assert.equal(available.status, 0)
    assert.equal(run(consumer, args(['--all']), { FOUNDRY_JQ: available.stdout.trim() }).status, 0)
  }
  finally {
    consumer.cleanup()
  }
})
