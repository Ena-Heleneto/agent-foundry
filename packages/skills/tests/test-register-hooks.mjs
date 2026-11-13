import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { bashFixture, bashIntegration, legacyHookLayout } from './distribution/helpers/registration-bash-fixture.mjs'
import { migrationCli, migrationFixture, officialCall, retiredHookIds, snapshot } from './distribution/helpers/registration-fixture.mjs'

/**
 * 包根只用于定位被测脚本和输入；所有安装目标均由测试创建。
 */
const packageRoot = fileURLToPath(new URL('../', import.meta.url))
/**
 * 官方验证仅使用调用方提供的固定 CLI，不在测试中下载工具。
 */
const officialCli = process.env.FOUNDRY_SPECIFY_CLI

test('T066 当前三项 hooks 同版刷新且六旧调用实际退役', { skip: !migrationCli }, async () => {
  /**
   * 新候选只在测试目录维护，不依赖旧生产注册器通过。
   */
  const { runMigrationCandidate } = await import('./distribution/helpers/registration-migration.mjs')
  /**
   * 正式来源复制到独占候选安装目录。
   */
  const item = migrationFixture('hooks-current')
  try {
    runMigrationCandidate(item.options)
    /**
     * 官方写出的实际配置用于验收，不能只看输入 manifest。
     */
    const config = parse(fs.readFileSync(path.join(item.project, '.specify/extensions.yml'), 'utf8'))
    /**
     * 独立从真实集合取得期望选项，验证官方实际落盘而非候选输入自比。
     */
    const collection = JSON.parse(fs.readFileSync(item.options.collectionFile, 'utf8'))
    assert.deepEqual(Object.values(config.hooks).flat().map(hook => hook.extension).sort(), ['artifact-project-description', 'artifact-spec-analysis', 'implementation-preparation', 't066-unrelated'])
    assert.equal(config.hooks.before_implement[0].extension, 'implementation-preparation')
    assert.equal(config.hooks.before_implement[0].optional, false)
    assert.equal(config.hooks.before_implement[0].condition, null)
    assert.equal(config.hooks.after_tasks[0].extension, 'artifact-spec-analysis')
    assert.equal(config.hooks.after_increment, undefined)
    /**
     * 六个旧扩展的登记、目录和有效调用都必须实际退去。
     */
    const registry = JSON.parse(fs.readFileSync(path.join(item.project, '.specify/extensions/.registry'), 'utf8'))
    /**
     * 正文与附件的期望取当前来源真实完整字节。
     */
    for (const id of ['implementation-preparation', 'artifact-spec-analysis', 'artifact-project-description']) {
      assert.deepEqual(snapshot(path.join(item.project, '.specify/extensions', id, 'skills', id)), snapshot(path.join(item.options.sourceRoot, id)))
      assert.deepEqual(registry.extensions[id].registered_commands, {})
      /**
       * 每项事件的正文、优先级和开关均应与当前集合一致。
       */
      for (const [event, definition] of Object.entries(collection.skill[id].hook))
        assert.deepEqual(config.hooks[event].find(hook => hook.extension === id), { extension: id, command: id, enabled: true, optional: false, priority: 20, description: '', condition: null, ...definition })
    }
    /**
     * 退役不等于源文档清理，只有有效登记本项应消失。
     */
    for (const id of retiredHookIds) {
      assert.equal(registry.extensions[id], undefined)
      assert.equal(fs.existsSync(path.join(item.project, '.specify/extensions', id)), false)
    }
  }
  finally { item.finish() }
})

test('T066 第二次移除失败停止，恢复后只补实际剩余阶段', { skip: !migrationCli }, async () => {
  /**
   * 故障仅注入官方进程边界，第一项仍由真实 CLI 移除。
   */
  const { runMigrationCandidate } = await import('./distribution/helpers/registration-migration.mjs')
  /**
   * 每个失败场景都有独立项目和原始日志。
   */
  const item = migrationFixture('failure-remove-retry')
  try {
    /**
     * 保留真实调用器用于解除故障后的重试。
     */
    const invoke = item.options.invoke
    item.options.invoke = args => args[1] === 'remove' && args[2] === 'artifact-pr-description' ? { status: 23 } : invoke(args)
    assert.throws(() => runMigrationCandidate(item.options), error => error.status === 23 && JSON.stringify(error.completed) === JSON.stringify(['remove:artifact-issue-description']))
    assert.equal(item.calls.length, 2)
    assert.equal(fs.existsSync(path.join(item.project, '.specify/extensions/artifact-issue-description')), false)
    assert.equal(fs.existsSync(path.join(item.project, '.specify/extensions/artifact-pr-description')), true)
    assert.equal(fs.existsSync(path.join(item.project, '.agents/skills/speckit-modes-tutor')), true)
    item.options.invoke = invoke
    runMigrationCandidate(item.options)
    assert.equal(item.calls.filter(call => call.args[1] === 'remove' && call.args[2] === 'artifact-issue-description').length, 1)
    assert.deepEqual(fs.readdirSync(path.join(item.project, '.agents/skills')).filter(name => name.startsWith('speckit-modes-')), ['speckit-modes-increment'])
  }
  finally { item.finish() }
})

test('T066 官方实际拒绝新 hook 后不更新 modes，修复输入可恢复', { skip: !migrationCli }, async () => {
  /**
   * 官方版本拒绝与注入退出码分别证明，不能互相替代。
   */
  const { runMigrationCandidate } = await import('./distribution/helpers/registration-migration.mjs')
  /**
   * 本例失败后检查旧 modes 与已经完成的退役事实。
   */
  const item = migrationFixture('failure-official-retry')
  try {
    /**
     * 在边界改写本次临时输入制造真实官方版本失败，不改生产来源。
     */
    const invoke = item.options.invoke
    item.options.invoke = (args) => {
      if (args[1] === 'add') {
        /**
         * 输入路径由实际官方调用参数取得。
         */
        const file = path.join(args[3], 'extension.yml')
        /**
         * 此故障输入明确标记为测试版本拒绝。
         */
        const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
        manifest.requires.speckit_version = '==9999.0.0'
        fs.writeFileSync(file, JSON.stringify(manifest))
      }
      return invoke(args)
    }
    assert.throws(() => runMigrationCandidate(item.options), error => error.status !== 0 && error.completed.length === 6)
    assert.equal(item.calls.length, 7)
    assert.equal(fs.existsSync(path.join(item.project, '.agents/skills/speckit-modes-tutor')), true)
    assert.equal(item.calls.filter(call => call.args[1] === 'add').length, 1)
    item.options.invoke = invoke
    runMigrationCandidate(item.options)
    assert.deepEqual(fs.readdirSync(path.join(item.project, '.agents/skills')).filter(name => name.startsWith('speckit-modes-')), ['speckit-modes-increment'])
  }
  finally { item.finish() }
})

test('T066 子进程无法启动时保留失败调用与实际完成范围', { skip: !migrationCli }, async () => {
  /**
   * 真实 ENOENT 必须进入候选统一错误报告，不被夹具断言提前截断。
   */
  const { runMigrationCandidate } = await import('./distribution/helpers/registration-migration.mjs')
  /**
   * 第一批六项由官方实际移除，然后注入不可执行的工具路径。
   */
  const item = migrationFixture('failure-spawn-retry')
  try {
    /**
     * 保存真实官方边界，恢复后继续读取当前磁盘状态。
     */
    const invoke = item.options.invoke
    item.options.invoke = args => args[1] === 'add' ? officialCall({ ...item, cli: path.join(item.root, 'missing-specify') }, args) : invoke(args)
    assert.throws(() => runMigrationCandidate(item.options), error => error.completed?.length === 6 && error.code === 'ENOENT')
    assert.equal(item.calls.length, 7)
    assert.equal(item.calls.at(-1).status, null)
    assert.equal(item.calls.at(-1).error, 'ENOENT')
    assert.equal(fs.existsSync(path.join(item.project, '.agents/skills/speckit-modes-tutor')), true)
    item.options.invoke = invoke
    runMigrationCandidate(item.options)
    assert.equal(item.calls.filter(call => call.args[1] === 'remove').length, 6)
    assert.deepEqual(fs.readdirSync(path.join(item.project, '.agents/skills')).filter(name => name.startsWith('speckit-modes-')), ['speckit-modes-increment'])
  }
  finally { item.finish() }
})
/**
 * 夹具同时覆盖当前三项与六退役来源，生产选择不从该数组推断。
 */
const hookIds = ['implementation-preparation', 'artifact-spec-analysis', 'artifact-project-description', 'artifact-issue-description', 'artifact-pr-description', 'mvu-gate', 'artifact-business-flow', 'artifact-logic-flow', 'explainer-doc-sync']

/**
 * 独立交付测试从 dist 技能目录取配置，普通测试从源码技能目录取配置。
 */
const skillsSource = !process.execArgv.includes('--test') && process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(packageRoot, 'src/workflow')

/**
 * 创建含空格路径的项目与已安装技能源，配置与技能一起复制。
 * @returns {{ root: string, project: string, skills: string, env: NodeJS.ProcessEnv }} 本测试独占的环境。
 */
function fixture() {
  /**
   * 测试退出时只清理本次拥有的临时根。
   */
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-hooks-'))
  /**
   * 路径带空格，以验证参数不会被 shell 字符串拆分。
   */
  const project = path.join(root, 'project with spaces')
  /**
   * 模拟已经由 skills 安装的来源目录。
   */
  const skills = path.join(root, 'installed skills')
  fs.mkdirSync(path.join(project, '.specify'), { recursive: true })
  fs.writeFileSync(path.join(project, '.specify/init-options.json'), JSON.stringify({ ai: 'codex', ai_skills: true, speckit_version: '1.2.6' }))
  /**
   * 真实集合用于准备输入，不恢复生产逐技能配置。
   */
  const collection = JSON.parse(fs.readFileSync(path.join(skillsSource, 'collection.config.json'), 'utf8'))
  fs.writeFileSync(path.join(root, 'collection.config.json'), JSON.stringify(collection))
  /**
   * 每个来源都含正文及附件，以验证完整复制。
   */
  for (const id of hookIds) {
    fs.mkdirSync(path.join(skills, id, 'references'), { recursive: true })
    fs.writeFileSync(path.join(skills, id, 'SKILL.md'), `---\nname: ${id}\ndescription: 测试\n---\n正文\n[附件](references/note.txt)\n`)
    fs.writeFileSync(path.join(skills, id, 'references/note.txt'), '附件')
  }
  return { root, project, skills, env: { ...process.env, HOME: path.join(root, 'user'), CODEX_HOME: path.join(root, 'user/.codex'), FOUNDRY_SPECIFY_VERSION: '1.2.6' } }
}

/**
 * 检查真实子进程结果，启动错误不能被误记为业务返回码。
 * @param {string} executable 可执行程序。
 * @param {string[]} args 参数数组。
 * @param {ReturnType<typeof fixture>} context 隔离环境。
 * @returns {import('node:child_process').SpawnSyncReturns<string>} 真实执行结果。
 */
function run(executable, args, context) {
  /**
   * 不使用 shell 拼接，子进程只能在临时项目中运行。
   */
  const result = spawnSync(executable, args, { cwd: context.project, env: context.env, encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 })
  assert.ifError(result.error)
  assert.equal(result.signal, null, result.stderr)
  return result
}

test('官方 hooks-only 重装覆盖受管字段与旧事件，无额外命令入口', { skip: !officialCli }, () => {
  /**
   * 真实官方 CLI 的独立试验现场。
   */
  const context = fixture()
  try {
    assert.match(run(officialCli, ['--version'], context).stdout, /specify 1\.2\.6\b/u)
    /**
     * 原有手写配置模拟当前迁移现场，不预建该扩展的 registry。
     */
    const configFile = path.join(context.project, '.specify/extensions.yml')
    fs.writeFileSync(configFile, JSON.stringify({
      hooks: {
        before_plan: [{ extension: 'mvu-gate', command: 'mvu-gate', enabled: false, condition: 'manual', custom_field: 'stale' }, { extension: 'other', command: 'keep', enabled: false }],
        after_tasks: [{ extension: 'mvu-gate', command: 'old-command' }],
      },
      settings: { auto_execute_hooks: false },
      custom: 'keep',
    }))
    /**
     * 只含 hooks 的临时输入，用于先验证官方替换行为。
     */
    const input = path.join(context.root, 'input')
    fs.mkdirSync(input)
    /**
     * 两次来源不同，每次重装都必须更新配置。
     */
    for (const prompt of ['first', 'updated']) {
      fs.writeFileSync(path.join(input, 'extension.yml'), JSON.stringify({
        schema_version: '1.0',
        extension: { id: 'mvu-gate', name: 'MVU Gate', version: '1.0.0', description: '门禁测试' },
        requires: { speckit_version: '==1.2.6' },
        provides: {},
        hooks: { before_plan: { command: 'mvu-gate', prompt, optional: false } },
      }))
      /**
       * 真正调用官方 CLI，由其修改临时项目受管配置。
       */
      const result = run(officialCli, ['extension', 'add', '--dev', input, '--force'], context)
      assert.equal(result.status, 0, result.stdout + result.stderr)
      /**
       * YAML 只在测试中解析，不进入运行脚本。
       */
      const config = parse(fs.readFileSync(configFile, 'utf8'))
      assert.deepEqual(config.hooks.before_plan.filter(item => item.extension === 'mvu-gate'), [{ extension: 'mvu-gate', command: 'mvu-gate', enabled: true, optional: false, priority: 10, prompt, description: '', condition: null }])
      assert.equal(config.hooks.after_tasks, undefined)
      assert.equal(config.hooks.before_plan.find(item => item.extension === 'other').enabled, false)
      assert.equal(config.settings.auto_execute_hooks, false)
      assert.equal(config.custom, 'keep')
    }
    assert.equal(fs.existsSync(path.join(context.project, '.agents/skills/speckit-mvu-gate')), false)
  }
  finally {
    fs.rmSync(context.root, { recursive: true, force: true })
  }
})

/**
 * 允许构建测试把被测入口切换到脱离仓库的交付副本。
 */
const scriptRoot = !process.execArgv.includes('--test') && process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(packageRoot, 'script/register-hooks')

test('Bash 当前三项输入、集合更新、失败停止与临时清理', { skip: process.platform === 'win32' }, () => {
  /**
   * 只观察平台脚本交给官方边界的真实声明，不模拟配置合并。
   */
  const context = fixture()
  try {
    /**
     * 模拟程序仅记录参数和输入，主动非零用于验证退出传递。
     */
    const cli = path.join(context.root, 'record-cli')
    /**
     * 原始记录路径明确属于本测试。
     */
    const log = path.join(context.root, 'calls.jsonl')
    context.env.HOOK_TEST_LOG = log
    fs.writeFileSync(cli, `#!${process.execPath}
import fs from 'node:fs'
import path from 'node:path'
/**
 * 保存 Bash 真正提交的输入目录。
 */
const input = process.argv[5]
/**
 * 只读当前声明，提供输出证据。
 */
const manifest = JSON.parse(fs.readFileSync(path.join(input, 'extension.yml'), 'utf8'))
fs.appendFileSync(process.env.HOOK_TEST_LOG, JSON.stringify({ args: process.argv.slice(2), input, manifest, attachment: fs.readFileSync(path.join(input, 'skills', manifest.extension.id, 'references/note.txt'), 'utf8') }) + '\\n')
process.exit(process.env.HOOK_TEST_FAIL === manifest.extension.id ? 7 : 0)
`, { mode: 0o755 })
    /**
     * 集合配置显式输入，不从目标残留推断来源或选择。
     */
    const args = [path.join(scriptRoot, 'register-hooks.sh'), '--project', context.project, '--skills-dir', context.skills, '--collection-config', path.join(context.root, 'collection.config.json'), '--cli', cli]
    /**
     * 手写期望对应本期唯一的三个 hook 身份。
     */
    const selected = ['implementation-preparation', 'artifact-spec-analysis', 'artifact-project-description']
    /**
     * 每轮更新实际集合及附件，证明脚本消费的是本次来源。
     */
    for (const pass of [1, 2]) {
      /**
       * 测试副本中的真实选项，不修改正式集合。
       */
      const collection = JSON.parse(fs.readFileSync(path.join(context.root, 'collection.config.json'), 'utf8'))
      collection.skill['implementation-preparation'].hook.before_implement.prompt = `本次来源${pass}`
      fs.writeFileSync(path.join(context.root, 'collection.config.json'), JSON.stringify(collection))
      fs.writeFileSync(path.join(context.skills, selected[0], 'references/note.txt'), `附件${pass}`)
      assert.equal(run('bash', args, context).status, 0)
    }
    /**
     * 每次都刷新，配置来自集合，正文附件复制完整且不生成模式。
     */
    const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(line => JSON.parse(line))
    assert.deepEqual(calls.map(call => call.manifest.extension.id), [...selected, ...selected])
    assert.equal(calls[0].attachment, '附件1')
    assert.equal(calls[3].attachment, '附件2')
    assert.equal(calls[3].manifest.hooks.before_implement.prompt, '本次来源2')
    /**
     * 暂存输入只用于当次调用，结束后应被清理。
     */
    for (const call of calls) {
      assert.deepEqual(call.manifest.provides, {})
      assert.equal(fs.existsSync(call.input), false)
    }
    fs.writeFileSync(log, '')
    context.env.HOOK_TEST_FAIL = 'artifact-spec-analysis'
    assert.equal(run('bash', args, context).status, 7)
    assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').length, 2)
    delete context.env.HOOK_TEST_FAIL
    fs.writeFileSync(log, '')
    fs.unlinkSync(path.join(context.skills, 'artifact-project-description/SKILL.md'))
    assert.notEqual(run('bash', args, context).status, 0)
    assert.equal(fs.readFileSync(log, 'utf8'), '')
  }
  finally { fs.rmSync(context.root, { recursive: true, force: true }) }
})

test('T067 Bash 部分选择不依赖未选来源，六旧hooks实际退役', bashIntegration, () => {
  /**
   * 使用真实旧登记，缺少分析和结案来源不应阻塞明确选择的准备。
   */
  const item = bashFixture('t067-partial')
  try {
    fs.rmSync(path.join(item.options.sourceRoot, 'artifact-spec-analysis'), { recursive: true })
    fs.rmSync(path.join(item.options.sourceRoot, 'artifact-project-description'), { recursive: true })
    /**
     * 只允许明确选择的本次来源参与安装。
     */
    const result = item.run('hooks', ['--skill', 'implementation-preparation'])
    assert.equal(result.status, 0, result.stdout + result.stderr)
    /**
     * 新配置必须实际可读，并保留无关扩展与未选既有结案能力。
     */
    const config = parse(fs.readFileSync(path.join(item.project, '.specify/extensions.yml'), 'utf8'))
    assert.equal(config.hooks.before_implement[0].extension, 'implementation-preparation')
    assert.equal(config.hooks.before_implement[0].optional, false)
    assert.equal(config.hooks.before_implement[0].condition, null)
    assert.equal(config.hooks.after_tasks, undefined)
    assert.equal(item.targetCalls().filter(call => call.args[1] === 'add').length, 1)
    assert.equal(item.targetCalls().filter(call => call.args[1] === 'remove').length, 6)
  }
  finally { item.finish() }
})

test('T067 Bash 官方中途失败准确停止且重试不复活旧调用', bashIntegration, () => {
  /**
   * 第一项当前 hook 真实成功、第二项返回 23，第三项及模式必须未运行。
   */
  const item = bashFixture('t067-failure')
  try {
    /**
     * 故障位于外部进程边界，前序操作仍交给实际官方工具。
     */
    const failed = item.run('hooks', [], { FOUNDRY_T067_FAIL: 'artifact-spec-analysis' })
    assert.equal(failed.status, 23, failed.stdout + failed.stderr)
    assert.match(failed.stderr, /已完成：[\s\S]*刷新 implementation-preparation/u)
    assert.equal(item.targetCalls().length, 8)
    assert.equal(fs.existsSync(path.join(item.project, '.agents/skills/speckit-modes-tutor')), true)
    /**
     * 解除故障后只从真实登记续做，不依赖测试内存 baseline。
     */
    const retried = item.run('hooks')
    assert.equal(retried.status, 0, retried.stdout + retried.stderr)
    assert.equal(item.targetCalls().filter(call => call.args[1] === 'remove').length, 6)
    /**
     * 有效调用不再含任何退役身份。
     */
    const config = parse(fs.readFileSync(path.join(item.project, '.specify/extensions.yml'), 'utf8'))
    assert.deepEqual(Object.values(config.hooks).flat().map(hook => hook.extension).sort(), ['artifact-project-description', 'artifact-spec-analysis', 'implementation-preparation', 't066-unrelated'])
  }
  finally { item.finish() }
})

test('T067 Bash 退役真实旧hook来源中的逐技能配置与附件', bashIntegration, () => {
  /**
   * 旧生产脚本实际会复制 speckit-hooks.json，不能靠 manifest-only 夹具通过。
   */
  const item = bashFixture('t067-real-legacy-hook')
  try {
    legacyHookLayout(item)
    /**
     * 正常旧配置与旧 manifest 同版时应安全完成官方退役。
     */
    const result = item.run('hooks')
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.equal(fs.existsSync(path.join(item.project, '.specify/extensions/artifact-issue-description')), false)
  }
  finally { item.finish() }
})

test('T067 Bash 旧配置与manifest不一致时保留实际内容', bashIntegration, () => {
  /**
   * 只能认领语义匹配的历史配置，不能按文件名无条件删除用户 JSON。
   */
  const item = bashFixture('t067-invalid-legacy-hook')
  try {
    legacyHookLayout(item)
    fs.writeFileSync(path.join(item.project, '.specify/extensions/artifact-issue-description/skills/artifact-issue-description/speckit-hooks.json'), '{"user":"保留"}')
    /**
     * 故障注入后内容必须完整保持。
     */
    const before = snapshot(item.project)
    assert.notEqual(item.run('hooks').status, 0)
    assert.equal(item.targetCalls().length, 0)
    assert.deepEqual(snapshot(item.project), before)
  }
  finally { item.finish() }
})

test('T067 Bash 未从正文可达的自引用附件不得被刷新删除', bashIntegration, () => {
  /**
   * 文件写出自己的路径不能作为受管依据，测试直接检查用户文件保护。
   */
  const item = bashFixture('t067-unreachable-reference')
  try {
    assert.equal(item.run('hooks', ['--skill', 'implementation-preparation']).status, 0)
    fs.mkdirSync(path.join(item.project, '.specify/extensions/implementation-preparation/skills/implementation-preparation/references'))
    fs.writeFileSync(path.join(item.project, '.specify/extensions/implementation-preparation/skills/implementation-preparation/references/user-note.md'), '# references/user-note.md\n用户内容，不是技能引用。\n')
    /**
     * 先前已完成的安装不应混入本次失败调用计数。
     */
    const count = item.targetCalls().length
    /**
     * 完整摘要覆盖刚加入的用户文件。
     */
    const before = snapshot(item.project)
    assert.notEqual(item.run('hooks', ['--skill', 'implementation-preparation']).status, 0)
    assert.equal(item.targetCalls().length, count)
    assert.deepEqual(snapshot(item.project), before)
  }
  finally { item.finish() }
})
