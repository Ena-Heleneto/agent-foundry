import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

/**
 * 为真实构建准备独占来源和旧产物，结束后清理整个测试项目。
 * @param {import('node:test').TestContext} t 当前用例。
 * @returns {{ root: string, collection: string, source: string, output: string }} 测试目录。
 */
function skillFixture(t) {
  /**
   * 所有异常输入和复制目标都位于该临时项目。
   */
  const root = mkdtempSync(join(tmpdir(), 'foundry-skill-input-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  /**
   * 使用独立配置避免模块缓存影响其他用例。
   */
  const collection = join(root, 'src/workflow')
  /**
   * 默认提供一项可被真实扫描器选中的技能。
   */
  const source = join(collection, 'sample')
  /**
   * 构建失败时必须保留的上一轮输出。
   */
  const output = join(root, 'dist')
  mkdirSync(source, { recursive: true })
  mkdirSync(output)
  writeFileSync(join(source, 'SKILL.md'), '# 示例技能\n')
  writeFileSync(join(output, 'previous.txt'), '上一轮产物\n')
  writeSkillConfig(collection)
  return { root, collection, source, output }
}

/**
 * 将场景数据写为真实集合模块，不执行字符串拼接生成的 Shell。
 * @param {string} collection 集合目录。
 * @param {unknown} packageName 集合目标名称。
 * @param {Record<string, { enabled: boolean }>} skill 启用选择。
 */
function writeSkillConfig(collection, packageName = 'workflow', skill = { sample: { enabled: true } }) {
  writeFileSync(join(collection, 'collection.config.ts'), `export default ${JSON.stringify({ packageName, skill })}\n`)
}

/**
 * 从隔离项目调用当前包的真实 Vite 配置。
 * @param {string} root 测试项目根。
 * @returns {import('node:child_process').SpawnSyncReturns<string>} 实际进程结果。
 */
function buildSkills(root) {
  return spawnSync(process.execPath, [
    fileURLToPath(new URL('bin/vite.js', import.meta.resolve('vite/package.json'))),
    'build',
    '--config',
    fileURLToPath(new URL('../../vite.config.ts', import.meta.url)),
  ], { cwd: root, encoding: 'utf8', timeout: 15_000 })
}

/**
 * 证明异常输入在输出清理及越界复制之前被拒绝。
 * @param {ReturnType<typeof skillFixture>} fixture 测试项目。
 * @param {RegExp | string} diagnostic 需要定位的输入或文件。
 */
function assertRejectedInput(fixture, diagnostic) {
  /**
   * 只对真实进程退出及文件系统效果作断言。
   */
  const result = buildSkills(fixture.root)
  assert.ifError(result.error)
  assert.ok(result.status > 0, result.stdout)
  if (typeof diagnostic === 'string')
    assert.ok(result.stderr.includes(diagnostic), result.stderr)
  else
    assert.match(result.stderr, diagnostic)
  assert.ok(result.stderr.includes(fixture.collection), result.stderr)
  assert.deepEqual(readdirSync(fixture.output), ['previous.txt'])
  assert.equal(readFileSync(join(fixture.output, 'previous.txt'), 'utf8'), '上一轮产物\n')
  assert.equal(existsSync(join(fixture.root, 'outside')), false)
}

/**
 * 各输入都必须在路径拼接或文件复制前失败，包括跨平台路径形式。
 */
for (const packageName of ['../../outside', '../other', 'nested/name', '/absolute', 'nested\\name', 'C:outside', '.', '..', '', null, 'bad\0name']) {
  test(`非法集合目标直接报错并保留旧产物：${JSON.stringify(packageName)}`, (t) => {
    /**
     * 每项独占目录，禁止异常构建写入真实工作区。
     */
    const fixture = skillFixture(t)
    writeSkillConfig(fixture.collection, packageName)
    assertRejectedInput(fixture, /packageName/)
  })
}

test('启用技能名包含父目录时直接报错', (t) => {
  /**
   * 该别名能归一化到现有技能，不能因正文存在而接受它。
   */
  const fixture = skillFixture(t)
  writeSkillConfig(fixture.collection, 'workflow', { '../workflow/sample': { enabled: true } })
  assertRejectedInput(fixture, /技能.*\.\.\/workflow\/sample/)
})

/**
 * 链接目录、正文和嵌套附件都不能作为可交付文件。
 */
for (const linkedPath of ['.', 'SKILL.md', 'references/资料.md', 'references/assets', 'references/missing.md']) {
  test(`技能软链接直接报错并保留旧产物：${linkedPath}`, (t) => {
    /**
     * 链接和其目标均在同一测试项目内，避免访问其他项目资料。
     */
    const fixture = skillFixture(t)
    /**
     * 独立源目录含普通正文，可同时作为目录或文件链接目标。
     */
    const external = join(fixture.root, 'linked-source')
    mkdirSync(external)
    writeFileSync(join(external, 'SKILL.md'), '# 外部正文\n')
    /**
     * 当前场景要放入实际来源的链接位置。
     */
    const link = join(fixture.source, linkedPath)
    if (linkedPath === '.')
      rmSync(fixture.source, { recursive: true })
    else
      mkdirSync(join(fixture.source, 'references'), { recursive: true })
    if (linkedPath === 'SKILL.md')
      rmSync(link)
    symlinkSync(linkedPath.endsWith('missing.md') ? join(external, 'missing.md') : linkedPath.endsWith('.md') ? join(external, 'SKILL.md') : external, link)
    assertRejectedInput(fixture, link)
    assert.equal(readFileSync(join(external, 'SKILL.md'), 'utf8'), '# 外部正文\n')
  })
}

test('普通附件保持字节且禁用技能的链接不阻止构建', (t) => {
  /**
   * 正常产物必须保留中文、空格文件名及二进制内容。
   */
  const fixture = skillFixture(t)
  mkdirSync(join(fixture.source, 'references'))
  writeFileSync(join(fixture.source, 'references/中文 附件.bin'), Buffer.from([0, 255, 128, 10]))
  symlinkSync(fixture.source, join(fixture.collection, 'disabled'))
  writeSkillConfig(fixture.collection, 'workflow', { sample: { enabled: true }, disabled: { enabled: false } })
  /**
   * 构建成功后只交付启用项，不把禁用的链接复制出去。
   */
  const result = buildSkills(fixture.root)
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(readFileSync(join(fixture.output, 'skill/workflow/sample/SKILL.md'), 'utf8'), '# 示例技能\n')
  assert.deepEqual(readFileSync(join(fixture.output, 'skill/workflow/sample/references/中文 附件.bin')), Buffer.from([0, 255, 128, 10]))
  assert.equal(existsSync(join(fixture.output, 'skill/workflow/disabled')), false)
})

test('重名技能使真实 Vite 构建在清理旧产物前失败', (t) => {
  /**
   * 构建进程独占的项目根，产物与实际工作区隔离。
   */
  const root = mkdtempSync(join(tmpdir(), 'foundry-skill-collision-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))

  for (const collection of ['coding', 'frontend']) {
    /**
     * 集合名不同，技能末级目录名相同。
     */
    const directory = join(root, 'src', collection)
    mkdirSync(join(directory, 'same-name'), { recursive: true })
    writeFileSync(join(directory, 'same-name/SKILL.md'), `# ${collection}\n`)
    writeFileSync(join(directory, 'collection.config.ts'), `export default { packageName: '${collection}', skill: { 'same-name': { enabled: true } } }\n`)
  }

  /**
   * 以唯一文件检查旧输出是否被清理或混入本次产物。
   */
  const output = join(root, 'dist')
  mkdirSync(output)
  writeFileSync(join(output, 'previous.txt'), '上一轮产物\n')

  /**
   * 通过包内真实 Vite 配置运行构建并捕获退出状态及诊断。
   */
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL('bin/vite.js', import.meta.resolve('vite/package.json'))),
    'build',
    '--config',
    fileURLToPath(new URL('../../vite.config.ts', import.meta.url)),
  ], { cwd: root, encoding: 'utf8', timeout: 15_000 })

  assert.ifError(result.error)
  assert.ok(result.status > 0, result.stdout)
  assert.match(result.stderr, /\.agents\/skills\/same-name/)
  assert.ok(result.stderr.includes(join(root, 'src/coding/same-name')))
  assert.ok(result.stderr.includes(join(root, 'src/frontend/same-name')))
  assert.deepEqual(readdirSync(output), ['previous.txt'])
  assert.equal(readFileSync(join(output, 'previous.txt'), 'utf8'), '上一轮产物\n')
})
