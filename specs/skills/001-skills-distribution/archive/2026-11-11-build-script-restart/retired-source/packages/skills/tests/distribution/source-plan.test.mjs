import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import { assertStageError, binaryAttachment, createBuildFixture, demoSkill, digest, mcpSkill, snapshotTree, writeFixtureFile } from './helpers/build-fixture.mjs'

/**
 * 编译当前真实阶段，独立于尚待 T068 接线的 Vite 配置和 T070 复核模块。
 * @param {ReturnType<typeof createBuildFixture>} item 本次隔离材料。
 */
async function loadSourceStages(item) {
  /**
   * 来源读取和基础计划的实际生产入口。
   */
  const source = path.join(item.packageRoot, 'build/distribution/export.ts')
  assert.equal(fs.existsSync(source), true, 'T067 缺少真实来源与基础计划模块')
  /**
   * 测试编译不写入被测 packageRoot，避免改变来源身份。
   */
  const output = path.join(item.root, 'source-stage')
  await build({ root: item.packageRoot, configFile: false, logLevel: 'silent', cacheDir: path.join(item.root, 'source-cache'), ssr: { noExternal: true }, build: { ssr: source, outDir: output, emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'source.mjs' } } } })
  return import(pathToFileURL(path.join(output, 'source.mjs')).href)
}

/**
 * 对隔离材料运行真实 Git，绝不修改真实仓库配置。
 * @param {ReturnType<typeof createBuildFixture>} item 隔离工程。
 * @param {string[]} args 明确 Git 参数。
 */
function git(item, args) {
  /**
   * 实际进程结果，环境故障不能算产品红灯。
   */
  const result = spawnSync('git', args, { cwd: item.packageRoot, env: item.env, encoding: 'utf8' })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

test('来源摘要对应原始字节，基础计划保留三目录、二进制及完整 MCP 清单且零写入', async () => {
  /**
   * 使用 T065 原始来源、真实脚本及 Git 提交。
   */
  const item = createBuildFixture()
  try {
    /**
     * 真实阶段函数和执行前的所有来源字节。
     */
    const stages = await loadSourceStages(item)
    /**
     * 包含现有输出的保护快照，产品函数不得触碰。
     */
    const before = snapshotTree(item.packageRoot)
    /**
     * development 仍须有真实提交及完整依赖证据。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    assert.equal(source.sourceRevision, item.sourceRevision)
    assert.equal(source.clean, true)
    assert.equal(source.validationScope, 'development')
    assert.equal(source.inputFiles.find(file => file.path === 'src/skills/coding/demo-skill/SKILL.md').sha256, digest(demoSkill))
    assert.equal(source.inputFiles.find(file => file.path.endsWith('data.bin')).sha256, digest(binaryAttachment))
    assert.ok(source.dependencySnapshot.packages.some(entry => entry.name === 'vite'))
    assert.ok(source.dependencySnapshot.packages.some(entry => entry.name === 'yaml'))
    assert.ok(source.dependencySnapshot.packages.some(entry => entry.name === 'rolldown'), '间接依赖不能遗漏')
    assert.match(source.toolchain.node, /^v\d/u)
    assert.match(source.toolchain.pnpm, /^\d/u)
    /**
     * 来源快照是计划的唯一内容输入。
     */
    const plan = stages.createBaseBuildPlan(source, { outputRoot: item.output })
    assert.equal(plan.kind, 'base')
    assert.equal(plan.sourceRevision, item.sourceRevision)
    assert.equal(plan.inputDigest, source.inputDigest)
    assert.equal(plan.files.find(file => file.path === 'skills/coding/demo-skill/SKILL.md').content.toString(), demoSkill)
    assert.deepEqual(plan.files.find(file => file.path.endsWith('data.bin')).content, Buffer.from(binaryAttachment))
    assert.deepEqual(plan.mcpManifest, { version: 1, skills: [{ name: 'mcp-example', description: '线上技能示例', destructive: false, category: 'category', skill: mcpSkill, references: [{ name: '说明.txt', content: '线上附件\n' }] }] })
    assert.equal('release' in plan, false)
    assert.equal('projections' in plan, false)
    assert.deepEqual(snapshotTree(item.packageRoot), before)
    assert.equal(fs.existsSync(path.join(item.packageRoot, 'executed.txt')), false)
  }
  finally { item.cleanup() }
})

test('同一输入摘要稳定，读取快照后改磁盘只影响下一次快照', async () => {
  /**
   * 变化发生在真实来源，而不是伪造返回对象。
   */
  const item = createBuildFixture()
  try {
    /**
     * 实际阶段及两次相同输入结果。
     */
    const stages = await loadSourceStages(item)
    /**
     * 第一份快照固定旧内容。
     */
    const first = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'isolated' })
    /**
     * 第二份快照应有相同身份，不注入时间或临时绝对路径。
     */
    const same = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'isolated' })
    assert.equal(first.inputDigest, same.inputDigest)
    writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/references/资料 空格.txt', '更新\n')
    /**
     * 计划不得重新读取变动后的来源。
     */
    const plan = stages.createBaseBuildPlan(first, { outputRoot: item.output })
    assert.equal(plan.files.find(file => file.path.endsWith('资料 空格.txt')).content.toString(), '完整附件\n')
    /**
     * 新读取必须反映变化并标明工作区不干净。
     */
    const changed = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'isolated' })
    assert.notEqual(changed.inputDigest, first.inputDigest)
    assert.equal(changed.clean, false)
  }
  finally { item.cleanup() }
})

test('MCP 空来源和脚本排除规则进入基础计划，不执行运行脚本', async () => {
  /**
   * 基础计划应观察实际输入增删，不继承旧清单。
   */
  const item = createBuildFixture()
  try {
    /**
     * 真实阶段在自有目录编译。
     */
    const stages = await loadSourceStages(item)
    fs.rmSync(path.join(item.packageRoot, 'src/mcp/category'), { recursive: true })
    writeFixtureFile(item.packageRoot, 'script/node_modules/poison/index.mjs', '不得收录')
    writeFixtureFile(item.packageRoot, 'script/__pycache__/cache.pyc', '不得收录')
    writeFixtureFile(item.packageRoot, 'script/test-only.mjs', '不得收录')
    /**
     * 来源允许局部开发修改，计划仍只生成合规内容。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    /**
     * 计划空清单和脚本原样交付。
     */
    const plan = stages.createBaseBuildPlan(source, { outputRoot: item.output })
    assert.deepEqual(plan.mcpManifest, { version: 1, skills: [] })
    assert.equal(plan.files.some(file => /node_modules|__pycache__|test-only|\.gitkeep/u.test(file.path)), false)
    assert.equal(plan.files.find(file => file.path === 'script/build-poison.mjs').content.toString(), 'import "foundry-missing-runtime-dependency"; throw new Error("构建不得导入运行脚本")\n')
    assert.equal(fs.existsSync(item.output), false)
  }
  finally { item.cleanup() }
})

/**
 * 独立列举真实错误输入，校验不可退化为任意拒绝。
 */
const invalidCases = [
  ['缺 skills 目录', 'missing-skills', /missing/iu],
  ['缺 MCP 目录', 'missing-mcp', /missing/iu],
  ['缺脚本目录', 'missing-script', /missing/iu],
  ['符号链接附件', 'symlink', /link/iu],
  ['重复技能身份', 'duplicate', /duplicate/iu],
  ['附件大小写冲突', 'case', /case|collision/iu],
  ['非法技能名', 'name', /metadata|name/iu],
  ['缺失附件', 'reference', /reference/iu],
  ['编码引用越界', 'escape', /reference|path/iu],
  ['MCP destructive 类型错误', 'mcp-type', /metadata/iu],
  ['MCP YAML 非法', 'mcp-yaml', /metadata/iu],
  ['MCP 空正文', 'mcp-body', /body/iu],
  ['MCP 重名', 'mcp-duplicate', /duplicate/iu],
  ['MCP 源内手写清单', 'manifest', /manifest/iu],
  ['非法版本', 'version', /version/iu],
  ['必需依赖缺失', 'dependency', /dependency/iu],
  ['非法用途', 'scope', /scope/iu],
  ['必需目录被普通文件替代', 'directory-file', /directory/u],
  ['来源父目录是链接', 'source-parent-link', /link/u],
  ['MCP 附件不是 UTF-8 文本', 'mcp-binary', /utf|text/u],
  ['自动清单路径被来源目录占用', 'manifest-directory', /path|manifest|conflict/u],
]

/**
 * 仅修改测试自有材料，覆盖来源与计划拒绝分支。
 * @param {ReturnType<typeof createBuildFixture>} item 隔离工程。
 * @param {string} kind 错误类型。
 */
function invalidate(item, kind) {
  if (kind.startsWith('missing-')) {
    fs.rmSync(path.join(item.packageRoot, { 'missing-skills': 'src/skills', 'missing-mcp': 'src/mcp', 'missing-script': 'script' }[kind]), { recursive: true })
    return
  }
  switch (kind) {
    case 'symlink':
      fs.symlinkSync(item.output, path.join(item.packageRoot, 'src/skills/coding/demo-skill/link'))
      break
    case 'duplicate':
      writeFixtureFile(item.packageRoot, 'src/skills/frontend/other/SKILL.md', demoSkill)
      writeFixtureFile(item.packageRoot, 'src/skills/frontend/other/references/资料 空格.txt', '附件')
      writeFixtureFile(item.packageRoot, 'src/skills/frontend/other/references/data.bin', binaryAttachment)
      break
    case 'case':
      writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/references/DATA.bin', binaryAttachment)
      break
    case 'name':
      writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/SKILL.md', demoSkill.replace('name: demo-skill', 'name: Invalid_Name'))
      break
    case 'reference':
      fs.unlinkSync(path.join(item.packageRoot, 'src/skills/coding/demo-skill/references/data.bin'))
      break
    case 'escape':
      writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/SKILL.md', `${demoSkill}\n[越界](%2e%2e/%2e%2e/secret.txt)`)
      break
    case 'mcp-type':
      writeFixtureFile(item.packageRoot, 'src/mcp/category/mcp-example/SKILL.md', mcpSkill.replace('destructive: false', 'destructive: "false"'))
      break
    case 'mcp-yaml':
      writeFixtureFile(item.packageRoot, 'src/mcp/category/mcp-example/SKILL.md', '---\nname: [\n---\n正文')
      break
    case 'mcp-body':
      writeFixtureFile(item.packageRoot, 'src/mcp/category/mcp-example/SKILL.md', '---\nname: mcp-example\ndescription: 示例\n---\n ')
      break
    case 'mcp-duplicate':
      writeFixtureFile(item.packageRoot, 'src/mcp/other/mcp-example/SKILL.md', mcpSkill)
      writeFixtureFile(item.packageRoot, 'src/mcp/other/mcp-example/references/说明.txt', '附件')
      break
    case 'manifest':
      writeFixtureFile(item.packageRoot, 'src/mcp/manifest.json', '{}')
      break
    case 'directory-file':
      fs.rmSync(path.join(item.packageRoot, 'src/mcp'), { recursive: true })
      writeFixtureFile(item.packageRoot, 'src/mcp', '不是目录')
      break
    case 'source-parent-link':
      fs.renameSync(path.join(item.packageRoot, 'src'), path.join(item.root, 'outside-src'))
      fs.symlinkSync(path.join(item.root, 'outside-src'), path.join(item.packageRoot, 'src'), 'dir')
      break
    case 'mcp-binary':
      writeFixtureFile(item.packageRoot, 'src/mcp/category/mcp-example/references/说明.txt', binaryAttachment)
      break
    case 'manifest-directory':
      writeFixtureFile(item.packageRoot, 'src/mcp/manifest.json/README.md', '占用自动清单的目标路径')
      break
    case 'version':
    case 'dependency': {
      /**
       * 仅改对应字段，避免错误夹具碰巧命中其他拒绝条件。
       */
      const manifest = JSON.parse(fs.readFileSync(path.join(item.packageRoot, 'package.json'), 'utf8'))
      if (kind === 'version')
        manifest.version = 'bad'
      else
        manifest.devDependencies['foundry-missing-required'] = '1.0.0'
      writeFixtureFile(item.packageRoot, 'package.json', JSON.stringify(manifest))
    }
  }
}

/**
 * 每个反例独立执行，避免失败原因及文件状态相互污染。
 */
for (const [title, kind, reason] of invalidCases) {
  test(`${title}明确拒绝且来源及已有输出不变`, async () => {
    /**
     * 每个反例有独立工程，不能共享失败副作用。
     */
    const item = createBuildFixture()
    try {
      /**
       * 先取得可运行的真实模块，再注入产品输入错误。
       */
      const stages = await loadSourceStages(item)
      invalidate(item, kind)
      writeFixtureFile(item.output, 'keep.txt', '已有输出')
      /**
       * 包根快照覆盖来源、脚本及已有产物。
       */
      const before = snapshotTree(item.packageRoot)
      await assert.rejects(async () => {
        /**
         * 错误可以在读取或计划阶段被拒绝，但不能写出任何文件。
         */
        const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: kind === 'scope' ? 'invalid' : 'development' })
        return stages.createBaseBuildPlan(source, { outputRoot: item.output })
      }, error => assertStageError(error, /source|plan/u, reason))
      assert.deepEqual(snapshotTree(item.packageRoot), before)
    }
    finally { item.cleanup() }
  })
}

test('正式用途拒绝修改、未跟踪与被忽略的输入，干净来源可读取', async () => {
  /**
   * 正式身份必须比较实际输入和提交，而非只看 git status。
   */
  const item = createBuildFixture()
  try {
    /**
     * 复用真实来源入口。
     */
    const stages = await loadSourceStages(item)
    await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'full' })
    writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/references/changed.txt', '未跟踪')
    await assert.rejects(stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'full' }), error => assertStageError(error, /source/u, /dirty|revision/u))
    git(item, ['add', '.'])
    git(item, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'new'])
    writeFixtureFile(item.packageRoot, '.gitignore', 'node_modules\ndist\nignored.txt\n')
    git(item, ['add', '.gitignore'])
    git(item, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'ignore'])
    writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/ignored.txt', '忽略的真实输入')
    assert.equal(git(item, ['status', '--porcelain']), '')
    await assert.rejects(stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'full' }), error => assertStageError(error, /source/u, /revision|untracked/u))
  }
  finally { item.cleanup() }
})

test('输出根覆盖源码或经目录链接指向源码时，计划拒绝且不清理文件', async () => {
  /**
   * 零写入不能依赖调用方选对输出路径。
   */
  const item = createBuildFixture()
  try {
    /**
     * 有效来源与故意危险的输出根。
     */
    const stages = await loadSourceStages(item)
    /**
     * 尚未设置外部目录链接时取得输入快照。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    fs.symlinkSync(path.join(item.packageRoot, 'src'), path.join(item.root, 'output-link'), 'dir')
    fs.symlinkSync(path.join(item.root, 'absent'), path.join(item.root, 'dangling-output'), 'dir')
    /**
     * 路径解析后也须保护真实来源目录。
     */
    for (const outputRoot of [item.packageRoot, path.dirname(item.packageRoot), path.join(item.packageRoot, 'src/skills/output'), path.join(item.root, 'output-link/dist'), path.join(item.root, 'dangling-output/dist')]) {
      assert.throws(() => stages.createBaseBuildPlan(source, { outputRoot }), error => assertStageError(error, /plan/u, /output|path|link/u))
    }
    assert.equal(fs.existsSync(item.output), false)
  }
  finally { item.cleanup() }
})

test('技能的测试提示词附件完整保留，脚本测试文件仍排除', async () => {
  /**
   * 真实仓库存在 references/test-prompts.md，不能按脚本测试名规则误删。
   */
  const item = createBuildFixture()
  try {
    /**
     * 使用真实来源和计划函数重现错误排除范围。
     */
    const stages = await loadSourceStages(item)
    writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/SKILL.md', `${demoSkill}\n[提示词](references/test-prompts.md)`)
    writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/references/test-prompts.md', '必要技能附件\n')
    writeFixtureFile(item.packageRoot, 'script/test-only.mjs', '脚本测试')
    /**
     * 必要附件既须可引用，也须进入产物字节计划。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    /**
     * 只检查有使用意义的输出，不断言排除函数内部写法。
     */
    const plan = stages.createBaseBuildPlan(source, { outputRoot: item.output })
    assert.equal(plan.files.find(file => file.path.endsWith('references/test-prompts.md')).content.toString(), '必要技能附件\n')
    assert.equal(plan.files.some(file => file.path === 'script/test-only.mjs'), false)
  }
  finally { item.cleanup() }
})

test('行内与围栏代码里的示例链接不要求打包，真实附件链接仍校验', async () => {
  /**
   * 技能经常演示消费者将来生成的链接，它们不是自身附件。
   */
  const item = createBuildFixture()
  try {
    /**
     * 实际阶段处理带链接样例的正文。
     */
    const stages = await loadSourceStages(item)
    writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/SKILL.md', `${demoSkill}\n示例：\`[mvu.md](mvu.md)\`\n\n\`\`\`md\n[示例](not-an-attachment.md)\n\`\`\`\n`)
    /**
     * 只读来源包含原始示例正文，计划不能误认为缺附件。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    assert.doesNotThrow(() => stages.createBaseBuildPlan(source, { outputRoot: item.output }))
  }
  finally { item.cleanup() }
})

test('Spec Kit 项目根材料是消费者前置，不从技能源补造或复制', async () => {
  /**
   * 既有 Pair/Review 技能明确按目标项目根解析宪章链接。
   */
  const item = createBuildFixture()
  try {
    /**
     * 运行真实计划，项目材料不存在于技能附件目录。
     */
    const stages = await loadSourceStages(item)
    writeFixtureFile(item.packageRoot, 'src/skills/coding/demo-skill/SKILL.md', `${demoSkill}\n[项目宪章](.specify/memory/constitution.md#vii)`)
    /**
     * 来源记录完整正文，但不要求 Foundry 宪章成为技能文件。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    /**
     * 前置材料的声明在 T069 补齐 Release，基础计划不能偷偷复制材料。
     */
    const plan = stages.createBaseBuildPlan(source, { outputRoot: item.output })
    assert.equal(plan.files.some(file => file.path.includes('.specify')), false)
  }
  finally { item.cleanup() }
})

test('依赖图覆盖间接实例及缺失可选边，间接声明变化使摘要变化', async () => {
  /**
   * 在独占安装目录构造真实 package.json 图，不能写入链接的作者 node_modules。
   */
  const item = createBuildFixture()
  try {
    /**
     * 先编译实际阶段，再将测试自有依赖链接替换成独占目录。
     */
    const stages = await loadSourceStages(item)
    fs.unlinkSync(path.join(item.packageRoot, 'node_modules'))
    writeFixtureFile(item.packageRoot, 'package.json', JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies: { 'fixture-a': '1.0.0' }, optionalDependencies: { 'fixture-absent': '1.0.0' } }))
    writeFixtureFile(item.packageRoot, 'node_modules/fixture-a/package.json', JSON.stringify({ name: 'fixture-a', version: '1.0.0', dependencies: { 'fixture-b': '2.0.0' }, optionalDependencies: { 'fixture-platform': '1.0.0' } }))
    writeFixtureFile(item.packageRoot, 'node_modules/fixture-b/package.json', JSON.stringify({ name: 'fixture-b', version: '2.0.0' }))
    /**
     * 实际安装图从根依赖走到间接依赖，并保留未安装可选包。
     */
    const first = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'isolated' })
    assert.deepEqual(first.dependencySnapshot.packages.map(entry => entry.name).sort(), ['fixture-a', 'fixture-b'])
    assert.deepEqual(first.dependencySnapshot.missingOptional, ['fixture-absent'])
    assert.deepEqual(first.dependencySnapshot.packages.find(entry => entry.name === 'fixture-a').missingOptional, ['fixture-platform'])
    writeFixtureFile(item.packageRoot, 'node_modules/fixture-b/package.json', JSON.stringify({ name: 'fixture-b', version: '2.0.1' }))
    /**
     * 直接源码未变，实际间接依赖变化仍必须反映到总体来源身份。
     */
    const changed = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'isolated' })
    assert.notEqual(changed.dependencySnapshot.digest, first.dependencySnapshot.digest)
    assert.notEqual(changed.inputDigest, first.inputDigest)
  }
  finally { item.cleanup() }
})

test('monorepo 子目录包的干净输入与仓库根提交正确对应', async () => {
  /**
   * 原夹具包就是 Git 根，这个场景补足真实 Foundry 的嵌套包结构。
   */
  const item = createBuildFixture()
  try {
    /**
     * 所有移动都在测试自有根，保留真实 Git 历史并重新提交嵌套布局。
     */
    const repositoryRoot = path.join(item.root, 'repository')
    fs.mkdirSync(path.join(repositoryRoot, 'packages'), { recursive: true })
    fs.renameSync(path.join(item.packageRoot, '.git'), path.join(repositoryRoot, '.git'))
    /**
     * 包从 Git 根移动到 monorepo 子目录。
     */
    const nested = path.join(repositoryRoot, 'packages/skills')
    fs.renameSync(item.packageRoot, nested)
    item.packageRoot = nested
    item.output = path.join(nested, 'dist')
    git(item, ['add', '--all'])
    git(item, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'nested package'])
    /**
     * 正式来源只读校验应可接受真实干净子目录包。
     */
    const stages = await loadSourceStages(item)
    /**
     * 包内路径和仓库根路径使用统一 Git 索引基准。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: nested, validationScope: 'full' })
    assert.equal(source.clean, true)
    assert.deepEqual(source.uncommittedInputs, [])
    assert.equal(source.repositoryRoot, repositoryRoot)
  }
  finally { item.cleanup() }
})

test('MCP references 之外的普通二进制附件原样进入三目录计划', async () => {
  /**
   * MCP 清单仅要求正文及 references 文本化，assets 普通附件仍保留原字节。
   */
  const item = createBuildFixture()
  try {
    /**
     * 实际来源包含非 UTF-8 图片附件。
     */
    const stages = await loadSourceStages(item)
    writeFixtureFile(item.packageRoot, 'src/mcp/category/mcp-example/assets/logo.png', binaryAttachment)
    /**
     * 清单与原始文件交付保持不同职责。
     */
    const source = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    /**
     * 计划只将 references 收录为清单文本，普通二进制不做解码。
     */
    const plan = stages.createBaseBuildPlan(source, { outputRoot: item.output })
    assert.deepEqual(plan.files.find(file => file.path.endsWith('assets/logo.png')).content, Buffer.from(binaryAttachment))
    assert.equal(plan.mcpManifest.skills[0].references.some(file => file.name.includes('logo')), false)
  }
  finally { item.cleanup() }
})

test('包说明原文属于来源身份，修改后快照变化但基础计划不提前生成发布文件', async () => {
  /**
   * 后续 Release 会使用 README，来源快照不能遗漏它的实际字节。
   */
  const item = createBuildFixture()
  try {
    /**
     * 两次读取之间只改变包说明。
     */
    const stages = await loadSourceStages(item)
    /**
     * 初始来源应记录原始包说明摘要。
     */
    const first = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    assert.equal(first.inputFiles.find(file => file.path === 'README.md')?.sha256, digest('# 隔离内容夹具\n'))
    writeFixtureFile(item.packageRoot, 'README.md', '# 更新说明\n')
    /**
     * 身份必须变化，而非只记录 package.json 版本。
     */
    const changed = await stages.readSourceSnapshot({ packageRoot: item.packageRoot, validationScope: 'development' })
    assert.notEqual(first.inputDigest, changed.inputDigest)
    assert.equal(stages.createBaseBuildPlan(changed, { outputRoot: item.output }).files.some(file => file.path === 'README.md'), false)
  }
  finally { item.cleanup() }
})
