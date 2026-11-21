import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { createSandbox } from './sandbox.mjs'

/**
 * 固定版官方工具由验证调用方显式提供，不下载依赖或改用裸 PATH 版本。
 */
const tools = {
  specify: process.env.FOUNDRY_ENTRY_SPECIFY_CLI,
  skills: process.env.FOUNDRY_ENTRY_SKILLS_CLI,
}

/**
 * 官方集成缺工具时明确跳过，单元保护场景仍可独立执行。
 */
const integration = { skip: !tools.specify || !tools.skills }

/**
 * 当前包提供真实维护来源，测试只改自己的副本。
 */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))

/**
 * 准备独占项目、测试用户与来源，按需保存原始结果后清理自有临时目录。
 * @param {string} name 场景标识。
 * @param {'project'|'global'} scope 来源安装作用域。
 * @returns {object} 沙箱、候选参数和显式清理入口。
 */
function fixture(name, scope = 'project') {
  /**
   * 沿已有 helper 隔离全部用户安装目录，不修改进程本身的 HOME。
   */
  const sandbox = createSandbox()
  /**
   * 候选的全部官方调用用于核对失败前零调用和真实退出码。
   */
  const calls = []
  /**
   * 实际来源复制到本例，允许附件反例而不污染维护源。
   */
  for (const skill of ['task-increment', 'implementation-preparation', 'business-node-delivery']) {
    fs.cpSync(path.join(packageRoot, 'src', skill === 'business-node-delivery' ? 'coding' : 'workflow', skill), path.join(sandbox.root, 'sources', skill), { recursive: true })
  }
  /**
   * 作用域分别对应所选固定版官方 Codex 根，真实调用必须证明这些预期。
   */
  const skillsRoot = path.join(scope === 'global' ? sandbox.userHome : sandbox.project, '.agents/skills')
  /**
   * 候选参数只服务测试骨架，不是新增分发产品配置。
   */
  const options = {
    project: sandbox.project,
    env: { ...sandbox.env, DO_NOT_TRACK: '1', DISABLE_TELEMETRY: '1', CI: '1' },
    scope,
    skillsRoot,
    incrementRoot: path.join(sandbox.root, 'sources/task-increment'),
    preparationRoot: path.join(sandbox.root, 'sources/implementation-preparation'),
    codingRoot: path.join(sandbox.root, 'sources/business-node-delivery'),
    stageRoot: path.join(sandbox.root, 'extension-input/modes'),
    specify: tools.specify,
    skillsCli: tools.skills,
    calls,
  }
  /**
   * 按需保留完整证据快照，随后只清理本例拥有的项目和测试用户。
   */
  function finish() {
    fs.writeFileSync(path.join(sandbox.root, 'calls.json'), `${JSON.stringify(calls, null, 2)}\n`)
    if (process.env.FOUNDRY_ENTRY_EVIDENCE_ROOT) {
      fs.cpSync(sandbox.root, path.join(process.env.FOUNDRY_ENTRY_EVIDENCE_ROOT, name), {
        recursive: true,
        filter: source => path.basename(source) !== '.git',
      })
    }
    sandbox.cleanup()
  }
  return { ...sandbox, options, finish }
}

/**
 * 正向场景只用固定版官方初始化生成配置，不手写 init-options 或 registry。
 * @param {object} item 当前夹具。
 */
function initialize(item) {
  /**
   * CLI 的原始输出必须留下，不能只记录最终文件存在。
   */
  const result = spawnSync(tools.specify, ['init', '--here', '--integration', 'codex', '--integration-options=--skills', '--script', 'sh', '--ignore-agent-tools', '--non-interactive'], {
    cwd: item.project,
    env: item.options.env,
    encoding: 'utf8',
    timeout: 60000,
  })
  fs.writeFileSync(path.join(item.root, 'init.log'), `${result.stdout || ''}${result.stderr || ''}`)
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(fs.readFileSync(path.join(item.project, '.specify/init-options.json'), 'utf8')).ai_skills, true)
}

/**
 * 缺源和未知目标必须在任何候选官方调用前拒绝，保护原字节。
 */
for (const kind of ['missing-increment', 'missing-preparation', 'unknown-source', 'unknown-hidden', 'unknown-generated', 'unknown-extension', 'linked-root']) {
  test(`候选前置拒绝 ${kind}，官方调用为零`, async () => {
    /**
     * 每个反例独占来源与目标。
     */
    const item = fixture(kind)
    try {
      /**
       * 待验证骨架在首次红灯时尚不存在。
       */
      const { runEntryCandidate } = await import('./helpers/entry-discovery.mjs')
      /**
       * 未知目标中的哨兵只能由本场景创建，后续不能被候选覆盖。
       */
      let sentinel
      if (kind.startsWith('missing-')) {
        item.options[kind === 'missing-increment' ? 'incrementRoot' : 'preparationRoot'] = path.join(item.root, 'absent')
      }
      else if (kind === 'linked-root') {
        fs.mkdirSync(path.join(item.root, 'outside'))
        fs.mkdirSync(path.dirname(item.options.skillsRoot), { recursive: true })
        fs.symlinkSync(path.join(item.root, 'outside'), item.options.skillsRoot)
      }
      else {
        sentinel = kind === 'unknown-hidden'
          ? path.join(`${item.options.skillsRoot}-speckit-sources`, 'task-increment/user.txt')
          : kind === 'unknown-generated'
            ? path.join(item.project, '.agents/skills/speckit-modes-increment/user.txt')
            : kind === 'unknown-extension'
              ? path.join(item.project, '.specify/extensions/modes/user.txt')
              : path.join(item.options.skillsRoot, 'task-increment/user.txt')
        fs.mkdirSync(path.dirname(sentinel), { recursive: true })
        fs.writeFileSync(sentinel, '用户文件必须保留\n')
      }
      assert.throws(() => runEntryCandidate(item.options), /缺少|未知|已存在|链接/u)
      assert.equal(item.options.calls.length, 0)
      if (sentinel)
        assert.equal(fs.readFileSync(sentinel, 'utf8'), '用户文件必须保留\n')
    }
    finally { item.finish() }
  })
}

test('附件内容/目录冲突、缺失引用和链接来源均在官方调用前拒绝', async () => {
  /**
   * 四种真正不同的文件系统故障，分别从全新副本开始。
   */
  for (const kind of ['collision', 'file-directory', 'missing-reference', 'symlink']) {
    /**
     * 当前故障现场及全部调用记录。
     */
    const item = fixture(kind)
    try {
      /**
       * 被测候选实际准备逻辑，不能以静态关键词代替。
       */
      const { runEntryCandidate } = await import('./helpers/entry-discovery.mjs')
      fs.appendFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), '\n[必要附件](references/t095-note.md)\n')
      if (kind !== 'missing-reference') {
        fs.mkdirSync(path.join(item.options.incrementRoot, 'references'))
        fs.writeFileSync(path.join(item.options.incrementRoot, 'references/t095-note.md'), '原附件\n')
      }
      if (kind === 'collision') {
        fs.mkdirSync(path.join(item.root, 'extra'))
        fs.writeFileSync(path.join(item.root, 'extra/t095-note.md'), '不同附件\n')
        item.options.referenceRoots = [path.join(item.root, 'extra')]
      }
      if (kind === 'file-directory') {
        fs.mkdirSync(path.join(item.root, 'extra/t095-note.md'), { recursive: true })
        fs.writeFileSync(path.join(item.root, 'extra/t095-note.md/child.md'), '文件与目录冲突\n')
        item.options.referenceRoots = [path.join(item.root, 'extra')]
      }
      if (kind === 'symlink')
        fs.symlinkSync(path.join(item.root, 'extra'), path.join(item.options.incrementRoot, 'references/unknown'))
      assert.throws(() => runEntryCandidate(item.options), /附件冲突|缺少附件|链接/u)
      assert.equal(item.options.calls.length, 0)
    }
    finally { item.finish() }
  }
})

/**
 * 同一正式维护源分别安装到项目与测试用户全局根，公开入口只在明确目标项目生成。
 */
for (const scope of ['project', 'global']) {
  test(`官方 ${scope} 来源分离后生成唯一 Increment，准备与 coding 留在正常根`, integration, async () => {
    /**
     * 真实官方命令与全部结果只影响当前测试作用域。
     */
    const item = fixture(scope, scope)
    try {
      /**
       * 官方生成与隔离目录准备使用实际候选。
       */
      const { runEntryCandidate, readSource } = await import('./helpers/entry-discovery.mjs')
      initialize(item)
      /**
       * 源正文和完整文件集在官方安装及生成前独立保存。
       */
      const source = readSource(item.options.incrementRoot, 'task-increment')
      /**
       * 结果必须来自实际 skills / Specify 子进程。
       */
      const result = runEntryCandidate(item.options)
      assert.equal(fs.existsSync(path.join(item.options.skillsRoot, 'task-increment')), false)
      assert.ok(fs.existsSync(path.join(item.options.skillsRoot, 'implementation-preparation/SKILL.md')))
      assert.ok(fs.existsSync(path.join(item.options.skillsRoot, 'business-node-delivery/SKILL.md')))
      assert.deepEqual(readSource(result.incrementRoot, 'task-increment').files, source.files)
      assert.deepEqual(readSource(path.join(item.project, '.specify/extensions/modes/skills/task-increment'), 'task-increment').files, source.files)
      /**
       * 官方重新生成 frontmatter，description 与完整语义正文仍来自正式来源。
       */
      const generated = fs.readFileSync(result.generatedPath, 'utf8')
      assert.equal(parse(generated.split('---')[1]).name, 'speckit-modes-increment')
      assert.equal(parse(generated.split('---')[1]).description, source.description)
      assert.ok(generated.includes(source.body.trim()))
      assert.equal(item.options.calls.filter(call => call.args.includes('extension')).length, 1)
      assert.ok(item.options.calls.every(call => call.status === 0))
      assert.ok(item.options.calls.filter(call => call.args.includes('add') && !call.args.includes('extension')).every(call => call.args.includes('--global') === (scope === 'global')))
    }
    finally { item.finish() }
  })
}

/**
 * 用最小明确标识的附件测试副本观察官方改写；不修改正式来源或暂停模式。
 */
for (const bridgeReferences of [false, true]) {
  test(`官方附件引用${bridgeReferences ? '桥接后实际可读' : '未桥接时留下缺项证据'}`, integration, async () => {
    /**
     * 两种输入使用不同项目，避免安装历史影响结论。
     */
    const item = fixture(bridgeReferences ? 'references-bridged' : 'references-control')
    try {
      /**
       * 沿同一候选调用，仅改变扩展顶层附件是否桥接。
       */
      const { runEntryCandidate } = await import('./helpers/entry-discovery.mjs')
      initialize(item)
      fs.mkdirSync(path.join(item.options.incrementRoot, 'references'))
      fs.writeFileSync(path.join(item.options.incrementRoot, 'references/t095-note.md'), '# T095 附件\n\n只读标记：T095_REFERENCE_20261111。不是业务认可。\n')
      fs.appendFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), '\n## T095 隔离附件验证\n\n[必要附件](references/t095-note.md)\n')
      /**
       * 正式入口只由官方 CLI 写入。
       */
      const result = runEntryCandidate({ ...item.options, bridgeReferences })
      /**
       * 实际生成引用采用项目根或 skill 相对位置解释，不能只检查文件曾被复制。
       */
      const generated = fs.readFileSync(result.generatedPath, 'utf8')
      /**
       * 唯一的附件引用必须能定位真实目标。
       */
      const reference = generated.match(/\[必要附件\]\(([^)]+)\)/u)?.[1]
      assert.ok(reference)
      /**
       * .specify 前缀是官方项目根路径，其余引用按入口所在目录解释。
       */
      const target = path.resolve(reference.startsWith('.specify/') ? item.project : path.dirname(result.generatedPath), reference)
      assert.equal(fs.existsSync(target), bridgeReferences)
      if (bridgeReferences)
        assert.equal(fs.readFileSync(target, 'utf8'), fs.readFileSync(path.join(item.options.incrementRoot, 'references/t095-note.md'), 'utf8'))
      fs.writeFileSync(path.join(item.root, 'reference-result.json'), `${JSON.stringify({ reference, target, readable: fs.existsSync(target) }, null, 2)}\n`)
    }
    finally { item.finish() }
  })
}
