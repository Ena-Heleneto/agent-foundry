import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { assertStageError, binaryAttachment, buildFixture, createBuildFixture, demoSkill, digest, eveSkill, loadBuildStages, mcpSkill, snapshotTree, writeFixtureFile } from './helpers/build-fixture.mjs'

test('三目录、MCP 正文附件及二进制内容由同一次真实构建完整交付', async () => {
  /**
   * 所有输入均为本次独占材料，不将旧 dist 复制为预期产物。
   */
  const item = createBuildFixture()
  try {
    await buildFixture(item)
    assert.deepEqual(fs.readdirSync(item.output).sort(), ['mcp', 'projections', 'release.json', 'script', 'skills'])
    assert.equal(fs.readFileSync(path.join(item.output, 'skills/coding/demo-skill/SKILL.md'), 'utf8'), demoSkill)
    assert.deepEqual(fs.readFileSync(path.join(item.output, 'skills/coding/demo-skill/references/data.bin')), Buffer.from(binaryAttachment))
    assert.equal(fs.readFileSync(path.join(item.output, 'skills/coding/demo-skill/references/资料 空格.txt'), 'utf8'), '完整附件\n')
    assert.equal(fs.existsSync(path.join(item.output, 'mcp/.gitkeep')), false)
    /**
     * MCP 条目期望按契约逐项手工给定，未复用产品扫描器。
     */
    const manifest = JSON.parse(fs.readFileSync(path.join(item.output, 'mcp/manifest.json'), 'utf8'))
    assert.deepEqual(manifest, { version: 1, skills: [{ name: 'mcp-example', description: '线上技能示例', destructive: false, category: 'category', skill: mcpSkill, references: [{ name: '说明.txt', content: '线上附件\n' }] }] })
  }
  finally { item.cleanup() }
})

test('脚本按原始字节复制，不导入运行依赖、不执行写入脚本且排除缓存', async () => {
  /**
   * 两个运行脚本分别检测错误打包和错误执行。
   */
  const item = createBuildFixture()
  try {
    /**
     * 注入开发专用垃圾前保存原始脚本全集，避免只列举少量入口漏检。
     */
    const expected = snapshotTree(path.join(item.packageRoot, 'script'))
    writeFixtureFile(item.packageRoot, 'script/node_modules/local/index.mjs', '本机依赖')
    writeFixtureFile(item.packageRoot, 'script/__pycache__/cached.pyc', '本机缓存')
    writeFixtureFile(item.packageRoot, 'script/test-only.mjs', '测试文件')
    await buildFixture(item)
    assert.deepEqual(snapshotTree(path.join(item.output, 'script')), expected)
    /**
     * 当前运行文件必须逐字节保持，不能只验证其中一个入口。
     */
    for (const file of ['build-poison.mjs', 'build-write.mjs', 'index.mjs', 'mount-entry/mount-entry.sh', 'mount-entry/mount-entry.ps1']) {
      assert.deepEqual(fs.readFileSync(path.join(item.output, 'script', file)), fs.readFileSync(path.join(item.packageRoot, 'script', file)))
    }
    assert.equal(fs.existsSync(path.join(item.packageRoot, 'executed.txt')), false)
    /**
     * 缓存、依赖和测试专用文件不得进入交付目录。
     */
    for (const relative of ['script/node_modules', 'script/__pycache__', 'script/test-only.mjs'])
      assert.equal(fs.existsSync(path.join(item.output, relative)), false, relative)
  }
  finally { item.cleanup() }
})

/**
 * 按完整独立样本核验一种投影的来源集合、真实字节与正文格式。
 * @param {ReturnType<typeof createBuildFixture>} item 当前夹具。
 * @param {object} release 实际产物清单。
 * @param {object} skill 已通过字面量集合核对的技能声明。
 * @param {string} projection 当前格式标识。
 */
function assertProjection(item, release, skill, projection) {
  /**
   * 每种格式都必须交付正文及相同完整附件集合。
   */
  const files = release.projections[projection]['demo-skill']
  assert.equal(files.length, 3)
  assert.deepEqual(files.map(file => file.sourcePath).toSorted(), skill.sourceFiles.toSorted())
  /**
   * 当前投影文件须保留同源关联和真实字节。
   */
  for (const file of files) {
    /**
     * 投影使用顶层同源声明，普通附件不能被文本格式转换破坏。
     */
    const target = path.resolve(item.output, file.path)
    assert.ok(target.startsWith(`${item.output}${path.sep}`), file.path)
    assert.equal(fs.lstatSync(target).isFile(), true)
    /**
     * 路径和普通文件性质确认后才读取投影，避免跟随越界内容。
     */
    const bytes = fs.readFileSync(target)
    assert.equal(file.bytes, bytes.length)
    assert.equal(file.sha256, digest(bytes))
    assert.ok(skill.sourceFiles.includes(file.sourcePath))
    if (file.sourcePath.endsWith('/data.bin'))
      assert.deepEqual(bytes, Buffer.from(binaryAttachment))
    if (file.sourcePath.endsWith('/资料 空格.txt'))
      assert.equal(bytes.toString(), '完整附件\n')
    if (file.sourcePath.endsWith('/SKILL.md')) {
      if (projection === 'identity')
        assert.equal(bytes.toString(), demoSkill)
      else
        assert.equal(bytes.toString(), eveSkill)
    }
  }
}

test('Release 保持原 schema、完整文件摘要及 identity/Eve 两种安装投影', async () => {
  /**
   * 对实际磁盘文件计算独立摘要，防止清单只描述计划而未交付内容。
   */
  const item = createBuildFixture()
  try {
    await buildFixture(item)
    /**
     * 清单通过标准 JSON 消费，不调用产品验证器自证正确。
     */
    const release = JSON.parse(fs.readFileSync(path.join(item.output, 'release.json'), 'utf8'))
    assert.equal(release.schemaVersion, 1)
    assert.equal(release.version, '0.1.0')
    assert.equal(release.sourceRevision, item.sourceRevision)
    assert.deepEqual(Object.keys(release.projections).sort(), ['eve-frontmatter-v1', 'identity'])
    assert.equal(release.files.some(file => file.path === 'release.json'), false)
    /**
     * 每一项公开声明都应有实际磁盘文件。
     */
    for (const file of release.files) {
      /**
       * 字节数和摘要必须与实际输出吻合，路径不能逃出产物根。
       */
      const target = path.resolve(item.output, file.path)
      assert.ok(target.startsWith(`${item.output}${path.sep}`), file.path)
      assert.equal(fs.lstatSync(target).isFile(), true, '公开内容必须是普通文件，不能跟随输出链接')
      /**
       * 直接读取磁盘字节，而非以 release 中另一份摘要为期望。
       */
      const bytes = fs.readFileSync(target)
      assert.equal(file.bytes, bytes.length, file.path)
      assert.equal(file.sha256, digest(bytes), file.path)
    }
    /**
     * 固定样本应覆盖所有已声明正文和附件，不能输出空集合求通过。
     */
    const skill = release.skills.find(entry => entry.name === 'demo-skill')
    assert.ok(skill, '正式结构的开发清单也必须包含本次稳定内容')
    assert.deepEqual(skill.sourceFiles.toSorted(), ['skills/coding/demo-skill/SKILL.md', 'skills/coding/demo-skill/references/data.bin', 'skills/coding/demo-skill/references/资料 空格.txt'].toSorted())
    /**
     * 已声明的来源附件必须同时进入顶层公开文件表，不能只写在技能字段中。
     */
    for (const source of skill.sourceFiles)
      assert.ok(release.files.some(file => file.path === source), source)
    /**
     * 两种格式使用同一完整样本，避免只证明默认格式正确。
     */
    for (const projection of ['identity', 'eve-frontmatter-v1'])
      assertProjection(item, release, skill, projection)
    assert.ok(release.adapters.some(file => file.path === 'script/install-skills/read-agents.mjs'))
    /**
     * 所有实际运行脚本及 README 都须有公开声明，不能只保留一个适配器求通过。
     */
    for (const relative of Object.keys(snapshotTree(path.join(item.packageRoot, 'script'))))
      assert.ok(release.files.some(file => file.path === `script/${relative}`), `清单漏掉运行文件：${relative}`)
    assert.equal(release.files.some(file => file.path.startsWith('mcp/') || file.path.includes('agents.json')), false)
  }
  finally { item.cleanup() }
})

test('删除 MCP 来源后重建清除旧条目，空来源生成空清单', async () => {
  /**
   * 同一工程的来源删除不能保留上次生成的技能或清单条目。
   */
  const item = createBuildFixture()
  try {
    await buildFixture(item)
    fs.rmSync(path.join(item.packageRoot, 'src/mcp/category'), { recursive: true })
    await buildFixture(item)
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(item.output, 'mcp/manifest.json'), 'utf8')), { version: 1, skills: [] })
    assert.equal(fs.existsSync(path.join(item.output, 'mcp/category')), false)
    assert.equal(fs.existsSync(path.join(item.output, 'manifest.json')), false)
    assert.equal(fs.existsSync(path.join(item.output, 'index.js')), false)
  }
  finally { item.cleanup() }
})

test('同源干净重建全部产物字节稳定，附件修改实际反映到新产物', async () => {
  /**
   * 相同工程删除输出后重建，避免拿同一份旧输出与自身比较。
   */
  const item = createBuildFixture()
  try {
    await buildFixture(item)
    /**
     * 首次磁盘结果是比较对象，不依赖产品摘要或生成时间字段。
     */
    const first = snapshotTree(item.output)
    fs.rmSync(item.output, { recursive: true })
    await buildFixture(item)
    assert.deepEqual(snapshotTree(item.output), first)
    writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/references/资料 空格.txt', '修改后的完整附件\n')
    await buildFixture(item)
    assert.equal(fs.readFileSync(path.join(item.output, 'skills/coding/demo-skill/references/资料 空格.txt'), 'utf8'), '修改后的完整附件\n')
    assert.notDeepEqual(snapshotTree(item.output), first)
  }
  finally { item.cleanup() }
})

/**
 * 每条反例必须独立命中实际阶段及对应原因，不能共享任意错误即成功的断言。
 */
const invalidInputs = [
  { title: '缺少线下技能源目录', kind: 'missing-skills', stage: /source|snapshot|来源|读取/iu, reason: /missing|directory|not.found|缺|目录/iu },
  { title: '缺少 MCP 源目录', kind: 'missing-mcp', stage: /source|snapshot|来源|读取/iu, reason: /missing|directory|not.found|缺|目录/iu },
  { title: '缺少运行脚本源目录', kind: 'missing-script', stage: /source|snapshot|来源|读取/iu, reason: /missing|directory|not.found|缺|目录/iu },
  { title: '来源包含符号链接附件', kind: 'symlink', stage: /source|snapshot|plan|来源|读取|计划/iu, reason: /link|链接/iu },
  { title: '不同分类声明重复技能身份', kind: 'duplicate-skill', stage: /source|snapshot|plan|来源|读取|计划/iu, reason: /duplicate|conflict|重复|冲突/iu },
  { title: '同目录附件存在大小写路径冲突', kind: 'case-collision', stage: /source|snapshot|plan|来源|读取|计划/iu, reason: /case|collision|conflict|大小写|冲突/iu },
  { title: '技能声明非法名称', kind: 'invalid-name', stage: /source|snapshot|plan|来源|读取|计划/iu, reason: /metadata|frontmatter|identity|name|元数据|身份|名称/iu },
  { title: '正文引用的附件缺失', kind: 'missing-reference', stage: /source|snapshot|plan|来源|读取|计划/iu, reason: /reference|attachment|引用|附件/iu },
  { title: '附件引用试图逃出技能根', kind: 'escaping-reference', stage: /source|snapshot|plan|来源|读取|计划/iu, reason: /path|reference|escape|路径|引用|越界/iu },
  { title: 'MCP 元数据 destructive 类型非法', kind: 'invalid-mcp', stage: /source|snapshot|plan|mcp|来源|读取|计划/iu, reason: /metadata|frontmatter|destructive|元数据/iu },
  { title: 'MCP frontmatter 无法解析', kind: 'malformed-mcp', stage: /source|snapshot|plan|mcp|来源|读取|计划/iu, reason: /yaml|metadata|frontmatter|元数据/iu },
  { title: 'MCP 正文为空', kind: 'empty-mcp', stage: /source|snapshot|plan|mcp|来源|读取|计划/iu, reason: /empty|body|content|空|正文/iu },
  { title: 'MCP 名称重复', kind: 'duplicate-mcp', stage: /source|snapshot|plan|mcp|来源|读取|计划/iu, reason: /duplicate|conflict|重复|冲突/iu },
  { title: 'MCP 源内出现手写清单', kind: 'source-manifest', stage: /source|snapshot|plan|mcp|来源|读取|计划/iu, reason: /manifest|source|hand|清单|来源/iu },
  { title: '包版本不能形成合法 Release', kind: 'invalid-version', stage: /source|snapshot|plan|release|来源|读取|计划/iu, reason: /version|semver|版本/iu },
]

/**
 * 只修改本次夹具，制造独立可核验的输入错误。
 * @param {ReturnType<typeof createBuildFixture>} item 当前工程。
 * @param {string} kind 本次反例身份。
 */
function invalidateInput(item, kind) {
  if (kind.startsWith('missing-') && ['missing-skills', 'missing-mcp', 'missing-script'].includes(kind)) {
    fs.rmSync(path.join(item.packageRoot, { 'missing-skills': 'src/skills', 'missing-mcp': 'src/mcp', 'missing-script': 'script' }[kind]), { recursive: true })
    return
  }
  switch (kind) {
    case 'symlink':
      writeFixtureFile(item.root, 'outside-sentinel/keep.txt', '外部哨兵')
      fs.symlinkSync(path.join(item.root, 'outside-sentinel/keep.txt'), path.join(item.packageRoot, 'src/skills/coding/demo-skill/references/linked.txt'))
      break
    case 'duplicate-skill':
      fs.cpSync(path.join(item.packageRoot, 'src/skills/coding/demo-skill'), path.join(item.packageRoot, 'src/skills/frontend/another'), { recursive: true })
      break
    case 'case-collision':
      writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/references/README.txt', '上大小写')
      writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/references/readme.txt', '下大小写')
      break
    case 'invalid-name':
      writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/SKILL.md', demoSkill.replace('name: demo-skill', 'name: Demo_Skill'))
      break
    case 'missing-reference':
      fs.unlinkSync(path.join(item.packageRoot, 'src/skills/coding/demo-skill/references/资料 空格.txt'))
      break
    case 'escaping-reference':
      writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/SKILL.md', `${demoSkill}\n[外部资料](../../../../../outside-sentinel/keep.txt)\n`)
      writeFixtureFile(item.root, 'outside-sentinel/keep.txt', '不得复制或改写')
      break
    case 'invalid-mcp':
      writeFixtureFile(item.packageRoot, 'src/mcp/category/mcp-example/SKILL.md', mcpSkill.replace('destructive: false', 'destructive: "false"'))
      break
    case 'malformed-mcp':
      writeFixtureFile(item.packageRoot, 'src/mcp/category/mcp-example/SKILL.md', '---\nname: [broken\n---\n正文\n')
      break
    case 'empty-mcp':
      writeFixtureFile(item.packageRoot, 'src/mcp/category/mcp-example/SKILL.md', '---\nname: mcp-example\ndescription: 线上技能\n---\n')
      break
    case 'duplicate-mcp':
      fs.cpSync(path.join(item.packageRoot, 'src/mcp/category/mcp-example'), path.join(item.packageRoot, 'src/mcp/other'), { recursive: true })
      break
    case 'source-manifest':
      writeFixtureFile(item.packageRoot, 'src/mcp/manifest.json', '{"version":1,"skills":[]}\n')
      break
    case 'invalid-version': {
      /**
       * 只改版本，不同时删除依赖声明制造另一个拒绝原因。
       */
      const metadata = JSON.parse(fs.readFileSync(path.join(item.packageRoot, 'package.json'), 'utf8'))
      metadata.version = 'invalid'
      writeFixtureFile(item.packageRoot, 'package.json', JSON.stringify(metadata))
      break
    }
    default:
      assert.fail(`未知测试反例：${kind}`)
  }
}

/**
 * 为每种独立输入错误注册真实构建用例，便于后续分阶段转绿。
 */
for (const example of invalidInputs) {
  test(`${example.title}：返回具体阶段错误且不清理已有输出`, async () => {
    /**
     * 每个错误独占工程，避免前一个失败污染后续判断。
     */
    const item = createBuildFixture()
    try {
      invalidateInput(item, example.kind)
      writeFixtureFile(item.output, 'user-sentinel.txt', '旧输出必须保留\n')
      /**
       * 快照在故障构造后记录，检测产品是否误改来源和既有输出。
       */
      const before = { source: snapshotTree(path.join(item.packageRoot, 'src')), scripts: snapshotTree(path.join(item.packageRoot, 'script')), outside: snapshotTree(path.join(item.root, 'outside-sentinel')), output: snapshotTree(item.output) }
      try {
        await assert.rejects(buildFixture(item), error => assertStageError(error, example.stage, example.reason))
      }
      finally {
        assert.deepEqual(snapshotTree(path.join(item.packageRoot, 'src')), before.source)
        assert.deepEqual(snapshotTree(path.join(item.packageRoot, 'script')), before.scripts)
        assert.deepEqual(snapshotTree(path.join(item.root, 'outside-sentinel')), before.outside)
        assert.deepEqual(snapshotTree(item.output), before.output)
      }
    }
    finally { item.cleanup() }
  })
}

test('输出根指向技能源时在写盘前拒绝，不能清空来源目录', async () => {
  /**
   * 危险输出也仅指向本次自有来源，绝不指向真实工作区。
   */
  const item = createBuildFixture()
  try {
    /**
     * 以实际来源全集保护，而非只查看单个哨兵。
     */
    const before = snapshotTree(path.join(item.packageRoot, 'src'))
    try {
      await assert.rejects(buildFixture(item, { build: { outDir: path.join(item.packageRoot, 'src/skills'), emptyOutDir: true } }), error => assertStageError(error, /source|plan|generate|来源|计划|生成/iu, /path|output|ownership|unsafe|路径|输出|归属/iu))
    }
    finally { assert.deepEqual(snapshotTree(path.join(item.packageRoot, 'src')), before) }
  }
  finally { item.cleanup() }
})

test('生成后来源变化必须被独立复核发现，不能按旧快照宣告成功', async () => {
  /**
   * 真实阶段之间注入变化，不假定它们位于哪个 Vite 钩子。
   */
  const item = createBuildFixture()
  try {
    /**
     * 加载本次生产源码的阶段导出，缺模块或函数保持明确红灯。
     */
    const stages = await loadBuildStages(item)
    /**
     * 来源身份与计划均由实际生产实现生成，不在测试中伪造计划。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    /**
     * 完整计划必须在写盘前形成。
     */
    const plan = await stages.createBuildPlan(source, { outputRoot: item.output })
    /**
     * 先取得真实生成结果，再改变来源，排除异步钩子竞争。
     */
    const output = await stages.writeBuildOutput(plan)
    writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/references/资料 空格.txt', '生成后被修改\n')
    await assert.rejects(async () => stages.verifyBuildOutput(plan, output), error => assertStageError(error, /verify|verification|复核|核验/iu, /source|changed|input|来源|变化|输入/iu))
  }
  finally { item.cleanup() }
})

test('生成后产物字节变化必须被磁盘复核发现，不能只相信内存摘要', async () => {
  /**
   * 仅在生成阶段确实返回后改写目标，无需生产测试 hook。
   */
  const item = createBuildFixture()
  try {
    /**
     * 实际产品模块承担计划、生成和校验，测试只改变本次文件。
     */
    const stages = await loadBuildStages(item)
    /**
     * 同一来源供后续真实阶段消费。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    /**
     * 测试输出根始终属于当前沙箱。
     */
    const plan = await stages.createBuildPlan(source, { outputRoot: item.output })
    /**
     * 生成函数完成后才有可供篡改的 BuildOutput。
     */
    const output = await stages.writeBuildOutput(plan)
    /**
     * 普通文件断言确保故障真的发生在实际产物上。
     */
    const target = path.join(item.output, 'skills/coding/demo-skill/references/data.bin')
    assert.equal(fs.lstatSync(target).isFile(), true)
    fs.writeFileSync(target, new Uint8Array([1, 2, 3]))
    await assert.rejects(async () => stages.verifyBuildOutput(plan, output), error => assertStageError(error, /verify|verification|复核|核验/iu, /digest|bytes|content|mismatch|摘要|字节|内容/iu))
  }
  finally { item.cleanup() }
})

/**
 * 运行既有 Bash 消费者前要求调用方准备真实固定摘要工具，禁止测试隐式下载。
 * @param {ReturnType<typeof createBuildFixture>} item 当前隔离工程。
 */
function requireJq(item) {
  assert.ok(process.env.FOUNDRY_JQ, '运行产物消费者需先准备官方 jq，并设置 FOUNDRY_JQ；不能以下载失败抵扣契约')
  assert.equal(digest(fs.readFileSync(process.env.FOUNDRY_JQ)), '020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d')
  item.env.FOUNDRY_JQ = process.env.FOUNDRY_JQ
}

test('新产物经唯一 Node 入口纯安装，关闭挂载仍完整交付附件', { skip: process.platform !== 'linux' }, async () => {
  /**
   * 真实安装只写现有沙箱的消费项目，与构建工程分离。
   */
  const item = createBuildFixture()
  try {
    await buildFixture(item)
    requireJq(item)
    /**
     * 使用新产物，不能从真实仓库的旧 dist 读取安装材料。
     */
    const result = spawnSync(process.execPath, [path.join(item.output, 'script/index.mjs'), '--source-dir', item.output, '--version', '0.1.0', '--agent', 'codex', '--skill', 'demo-skill', '--no-mount'], { cwd: item.project, env: item.env, encoding: 'utf8', timeout: 30000 })
    assert.ifError(result.error)
    assert.equal(result.status, 0, result.stderr + result.stdout)
    assert.equal(JSON.parse(result.stdout).overall, 'success')
    assert.equal(fs.readFileSync(path.join(item.project, '.agents/skills/demo-skill/SKILL.md'), 'utf8'), demoSkill)
    assert.deepEqual(fs.readFileSync(path.join(item.project, '.agents/skills/demo-skill/references/data.bin')), Buffer.from(binaryAttachment))
    assert.equal(fs.existsSync(path.join(item.project, '.specify')), false)
  }
  finally { item.cleanup() }
})

test('原生占位明确未实现，保留安装核验事实且零注册调用/目标写入', { skip: process.platform !== 'linux' }, async () => {
  /**
   * 只用本次真实构建的公共脚本，单技能输入不补齐历史五项。
   */
  const item = createBuildFixture()
  try {
    await buildFixture(item)
    requireJq(item)
    /**
     * 构造“已安装单 Increment”的受控输入，隔离于构建清单及候选身份。
     */
    const releaseRoot = path.join(item.root, 'mount-material')
    /**
     * 手工正文只作为挂载输入，不冒认主线正式来源或宿主加载证据。
     */
    const content = '---\nname: task-increment\ndescription: 隔离输入\n---\n\n# 隔离挂载输入\n'
    /**
     * 挂载器只核验已安装事实，文件清单由独立原始字节定义。
     */
    const files = []
    /**
     * 两个平台的公共材料都必须声明，不能混用未核验脚本。
     */
    for (const relative of ['script/mount-entry/mount-entry.sh', 'script/mount-entry/mount-entry.ps1']) {
      /**
       * 公共脚本必须与本次源的字节完全一致。
       */
      const bytes = fs.readFileSync(path.join(item.output, relative))
      writeFixtureFile(releaseRoot, relative, bytes)
      files.push({ path: relative, bytes: bytes.length, sha256: digest(bytes) })
    }
    /**
     * 在禁止调用的注册器边界设置直接哨兵，防止提前失败后被占位吞掉。
     */
    for (const name of ['register-hooks', 'register-commands']) {
      /**
       * 观察子模块调用但不执行原生安装；被测公共挂载入口保持真实字节。
       */
      const body = '#!/usr/bin/env bash\nprintf called >> "$FOUNDRY_TEST_REGISTRAR_CALLED"\nexit 97\n'
      /**
       * 独立输入中的探针也如实进入材料清单，不修改原构建产物身份。
       */
      const relative = `script/${name}/${name}.sh`
      writeFixtureFile(releaseRoot, relative, body)
      fs.chmodSync(path.join(releaseRoot, relative), 0o755)
      files.push({ path: relative, bytes: Buffer.byteLength(body), sha256: digest(body) })
    }
    writeFixtureFile(releaseRoot, 'skills/workflow/task-increment/SKILL.md', content)
    files.push({ path: 'skills/workflow/task-increment/SKILL.md', bytes: Buffer.byteLength(content), sha256: digest(content) })
    writeFixtureFile(releaseRoot, 'release.json', JSON.stringify({ schemaVersion: 1, version: '0.1.0', sourceRevision: '1'.repeat(40), files, skills: [{ name: 'task-increment', category: 'workflow', directory: 'skills/workflow/task-increment', sourceFiles: ['skills/workflow/task-increment/SKILL.md'], requiresSkills: [] }] }))
    writeFixtureFile(item.project, '.agents/skills/task-increment/SKILL.md', content)
    writeFixtureFile(item.project, '.specify/user-sentinel.txt', '原生配置不许改写\n')
    /**
     * 所有常见官方 CLI 调用入口都留调用哨兵，不能以没有目标写入代替零调用。
     */
    for (const command of ['specify', 'uv', 'uvx']) {
      writeFixtureFile(item.root, `bin/${command}`, '#!/usr/bin/env bash\nprintf called > "$FOUNDRY_TEST_CALLED"\nexit 97\n')
      fs.chmodSync(path.join(item.root, `bin/${command}`), 0o755)
    }
    item.env.PATH = `${path.join(item.root, 'bin')}${path.delimiter}${item.env.PATH}`
    item.env.FOUNDRY_TEST_CALLED = path.join(item.root, 'native-called.txt')
    item.env.FOUNDRY_TEST_REGISTRAR_CALLED = path.join(item.root, 'registrar-called.txt')
    /**
     * 包含真实已安装内容和用户配置，任何额外写入也会使比较失败。
     */
    const before = snapshotTree(item.project)
    /**
     * 直接执行实际分发的同版公共入口，不使用空脚本模拟占位。
     */
    const result = spawnSync('bash', [path.join(releaseRoot, 'script/mount-entry/mount-entry.sh'), '--source-dir', releaseRoot, '--version', '0.1.0', '--agent', 'codex', '--installed-root', path.join(item.project, '.agents/skills'), '--skill', 'task-increment'], { cwd: item.project, env: item.env, encoding: 'utf8', timeout: 30000 })
    assert.ifError(result.error)
    assert.notEqual(result.status, 0, result.stderr + result.stdout)
    /**
     * 依赖/清单失败不能冒充未实现，已发生的安装核验事实必须保留。
     */
    const report = JSON.parse(result.stdout)
    assert.match(report.reasonCode, /unsupported|not.implemented|placeholder/iu)
    assert.equal(report.stages.installation.status, 'success')
    assert.equal(report.stages.hooks.status, 'not-run')
    assert.equal(report.stages.commands.status, 'not-run')
    assert.deepEqual(snapshotTree(item.project), before)
    assert.equal(fs.existsSync(item.env.FOUNDRY_TEST_CALLED), false)
    assert.equal(fs.existsSync(item.env.FOUNDRY_TEST_REGISTRAR_CALLED), false)
  }
  finally { item.cleanup() }
})
