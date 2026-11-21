import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { createUrgentSandbox, createWorkspaceSourceFixture, describeFixtureFile, git, loadProduct, runCommand, snapshotTree } from './helpers/urgent-sandbox.mjs'

/**
 * 按独立磁盘字节核对来源接口，不用生产摘要函数构建期望。
 * @param {object} fixture 当前Git与嵌套包事实。
 * @param {object} snapshot 产品返回的冻结内容及内部来源。
 * @returns {object} 已核对的内部source。
 */
function assertWorkspaceSource(fixture, snapshot) {
  /**
   * 内部来源不能被混进公开Release schema。
   */
  const source = snapshot.source
  assert.ok(source, '缺少内部workspace来源证据 snapshot.source')
  assert.equal(source.sourcePackagePath, fixture.sourcePackagePath)
  assert.equal(source.sourceRevision, fixture.sourceRevision)
  assert.equal(snapshot.manifest.sourceRevision, fixture.sourceRevision)
  assert.equal(snapshot.manifest.source, undefined)
  assert.ok(Array.isArray(source.inputFiles))
  /**
   * 固定路径排序及字节信息均由测试独立读取核对。
   */
  const expected = source.inputFiles.map(file => describeFixtureFile(fixture.root, file.path)).sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
  assert.deepEqual(source.inputFiles, expected)
  assert.equal(source.inputDigest, createHash('sha256').update(JSON.stringify(expected)).digest('hex'))
  assert.match(source.dependencySnapshotDigest, /^[a-f0-9]{64}$/u)
  assert.ok(Array.isArray(source.dependencies))
  /**
   * 包源码与实际共享配置须包含在同一真实提交闭包。
   */
  const required = [`${fixture.sourcePackagePath}/package.json`, `${fixture.sourcePackagePath}/vite.config.ts`, `${fixture.sourcePackagePath}/eslint.config.mjs`, `${fixture.sourcePackagePath}/tsconfig.json`, `${fixture.sourcePackagePath}/build/distribution/export.ts`, `${fixture.sourcePackagePath}/src/workflow/task-increment/SKILL.md`, 'pnpm-workspace.yaml', 'packages/preset-config/package.json', 'packages/preset-config/src/tsconfig-json/tsconfig.json', 'packages/preset-config/src/eslint-config/index.ts']
  /**
   * 每项必需来源均须出现，不要求复刻生产额外闭包发现算法。
   */
  for (const file of required)
    assert.ok(source.inputFiles.some(entry => entry.path === file), `输入闭包遗漏 ${file}`)
  assert.equal(source.inputFiles.some(file => file.path === 'pnpm-lock.yaml' || file.path.startsWith('packages/preset-config/dist/')), false)
  /**
   * 公开可追溯索引不能泄露作者机器绝对路径。
   */
  for (const file of source.inputFiles)
    assert.equal(path.isAbsolute(file.path), false)
  return source
}

/**
 * 每项反例先验证完好嵌套输入，避免被旧独立Git根错误统一遮蔽。
 * @param {object} sandbox 当前独占测试根。
 * @returns {Promise<object>} 干净样本、真实导出器及来源证据。
 */
async function prepareWorkspaceTest(sandbox) {
  /**
   * 完整九项正文和全部配置在本次私有Git中真实提交。
   */
  const fixture = createWorkspaceSourceFixture(sandbox)
  /**
   * 产品函数来自当前工作区包，编译输出不进入产品dist。
   */
  const exporter = await loadProduct(sandbox, 'build/distribution/export.ts')
  /**
   * 当前基线必须真实接受嵌套包才能继续破坏单一约束。
   */
  const snapshot = exporter.snapshotContent(fixture.sourceRoot)
  assertWorkspaceSource(fixture, snapshot)
  return { fixture, exporter, snapshot }
}

test('嵌套工作区包以正确Git前缀及真实提交形成内部source证据', async () => {
  /**
   * 空格路径与作者工作区完全隔离。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 成功基线直接覆盖完整冻结接口。
     */
    const { snapshot } = await prepareWorkspaceTest(sandbox)
    assert.equal(snapshot.manifest.skills.length, 9)
    assert.equal(snapshot.manifest.skills.some(skill => skill.category === 'eval'), false)
  }
  finally { sandbox.cleanup() }
})

test('无关脏文件与主线eval源码存在时仍只交付九项正式技能', async () => {
  /**
   * 非输入文件变化不应扩充来源闭包或安装集合。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 原来源先真实通过，而后才添加无关内容。
     */
    const { fixture, exporter, snapshot } = await prepareWorkspaceTest(sandbox)
    fs.mkdirSync(path.join(fixture.root, 'packages/skills/src/eval/internal'), { recursive: true })
    fs.writeFileSync(path.join(fixture.root, 'packages/skills/src/eval/internal/SKILL.md'), '内部源码，不是正式技能来源。\n')
    fs.writeFileSync(path.join(fixture.root, 'unrelated.md'), '未提交的其他工作。\n')
    /**
     * 无关脏文件不能改变同一来源输入或公开payload。
     */
    const current = exporter.snapshotContent(fixture.sourceRoot)
    assertWorkspaceSource(fixture, current)
    assert.equal(current.source.inputDigest, snapshot.source.inputDigest)
    assert.deepEqual(current.files, snapshot.files)
    assert.equal(current.manifest.skills.length, 9)
  }
  finally { sandbox.cleanup() }
})

/**
 * 每种已存在源码的未提交修改都必须由真实输入校验识别。
 */
const dirtyInputPaths = ['README.md', 'build/distribution/export.ts', 'src/workflow/task-increment/SKILL.md']
for (const relative of dirtyInputPaths) {
  test(`嵌套包拒绝相关输入未提交变化：${relative}`, async () => {
    /**
     * 每次故障只改自己来源树中的一份文件。
     */
    const sandbox = createUrgentSandbox()
    try {
      /**
       * 基线成功后只破坏当前相对路径。
       */
      const { fixture, exporter } = await prepareWorkspaceTest(sandbox)
      fs.appendFileSync(path.join(fixture.sourceRoot, relative), '\n未提交输入\n')
      assert.throws(() => exporter.snapshotContent(fixture.sourceRoot), /输入|来源|提交|字节|脏/u)
    }
    finally { sandbox.cleanup() }
  })
}

test('被Git忽略但参与交付的脚本仍须拒绝且不生成输出', async () => {
  /**
   * 忽略规则不能给实际输入提供伪造提交身份。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 先固定含忽略规则的真实来源提交。
     */
    const fixture = createWorkspaceSourceFixture(sandbox)
    fs.appendFileSync(path.join(fixture.root, '.gitignore'), `${fixture.sourcePackagePath}/script/ignored-input.mjs\n`)
    git(sandbox, ['add', '.gitignore'])
    git(sandbox, ['commit', '-m', 'test: record ignored source rule'])
    fixture.sourceRevision = git(sandbox, ['rev-parse', 'HEAD'])
    /**
     * 缺失忽略输入时，来源本身必须可用。
     */
    const exporter = await loadProduct(sandbox, 'build/distribution/export.ts')
    assertWorkspaceSource(fixture, exporter.snapshotContent(fixture.sourceRoot))
    fs.writeFileSync(path.join(fixture.sourceRoot, 'script/ignored-input.mjs'), 'export default 1\n')
    assert.equal(git(sandbox, ['status', '--porcelain', '--untracked-files=all']), '')
    assert.throws(() => exporter.snapshotContent(fixture.sourceRoot), /输入|来源|提交|字节|跟踪/u)
    assert.equal(fs.existsSync(path.join(fixture.sourceRoot, 'dist')), false)
  }
  finally { sandbox.cleanup() }
})

/**
 * 共享配置与预设源码同样属于真实输入闭包。
 */
const sharedInputPaths = ['pnpm-workspace.yaml', 'packages/preset-config/src/tsconfig-json/tsconfig.json', 'packages/preset-config/src/eslint-config/index.ts']
for (const relative of sharedInputPaths) {
  test(`拒绝工作区共享输入变化：${relative}`, async () => {
    /**
     * 共享文件也位于本条用例拥有的Git根。
     */
    const sandbox = createUrgentSandbox()
    try {
      /**
       * 有效来源成功后才改变共享输入。
       */
      const { fixture, exporter } = await prepareWorkspaceTest(sandbox)
      fs.appendFileSync(path.join(fixture.root, relative), '\n')
      assert.throws(() => exporter.snapshotContent(fixture.sourceRoot), /输入|来源|提交|字节|脏/u)
    }
    finally { sandbox.cleanup() }
  })
}

test('实际根锁与共享预设生成字节单列依赖证据，变化后摘要必须改变', async () => {
  /**
   * 未跟踪锁与生成物不能伪装成Git提交中的源码。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 真实文件证据由独立字节摘要检查。
     */
    const { fixture, exporter, snapshot } = await prepareWorkspaceTest(sandbox)
    /**
     * 三份实际文件分别核对，避免只检查总摘要形状。
     */
    for (const relative of ['pnpm-lock.yaml', 'packages/preset-config/dist/tsconfig-json/tsconfig.json', 'packages/preset-config/dist/eslint-config/index.js']) {
      /**
       * 缺任意已消费依赖不能只留下一个无来源摘要。
       */
      const file = snapshot.source.dependencies.find(entry => entry.path === relative)
      assert.deepEqual(file, describeFixtureFile(fixture.root, relative), `依赖证据遗漏或不匹配：${relative}`)
    }
    fs.appendFileSync(path.join(fixture.root, 'pnpm-lock.yaml'), '# 未跟踪锁字节变化\n')
    /**
     * 根锁允许未跟踪，但实际字节必须重新进入证据。
     */
    const lockChanged = exporter.snapshotContent(fixture.sourceRoot)
    assert.notEqual(lockChanged.source.dependencySnapshotDigest, snapshot.source.dependencySnapshotDigest)
    assert.equal(lockChanged.source.inputDigest, snapshot.source.inputDigest)
    fs.appendFileSync(path.join(fixture.root, 'packages/preset-config/dist/eslint-config/index.js'), '\n')
    /**
     * 生成依赖变化也必须使旧依赖证据失效。
     */
    const generatedChanged = exporter.snapshotContent(fixture.sourceRoot)
    assert.notEqual(generatedChanged.source.dependencySnapshotDigest, lockChanged.source.dependencySnapshotDigest)
  }
  finally { sandbox.cleanup() }
})

test('已提交catalog与实际解析工具版本不一致时拒绝来源', async () => {
  /**
   * 声明和实际安装分别核对，不能仅检查共享文件是否干净。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 先证明初始声明与已安装版本一致且来源有效。
     */
    const { fixture, exporter } = await prepareWorkspaceTest(sandbox)
    fs.writeFileSync(path.join(fixture.root, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\ncatalogs:\n  shared:\n    yaml: 999.0.0\n')
    git(sandbox, ['add', 'pnpm-workspace.yaml'])
    git(sandbox, ['commit', '-m', 'test: record dependency mismatch'])
    assert.equal(git(sandbox, ['status', '--porcelain', '--untracked-files=all']), '')
    assert.throws(() => exporter.snapshotContent(fixture.sourceRoot), /版本|依赖|catalog|解析/u)
  }
  finally { sandbox.cleanup() }
})

/**
 * 在私有PATH包装真实Git，固定读取返回后只破坏本次拥有的来源。
 * @param {object} sandbox 当前独占沙箱。
 * @param {object} fixture 当前来源事实。
 * @param {'input'|'revision'|'dependency'} kind 构建过程中的漂移类型。
 * @returns {string} 包装器完成实际故障注入的标记路径。
 */
function installReadDrift(sandbox, fixture, kind) {
  /**
   * 固定真实Git绝对路径，避免包装器递归或替代真实内容。
   */
  const realGit = runCommand(sandbox, 'which', ['git']).stdout.trim()
  /**
   * 单次标记避免干扰后续用于检查的真实Git命令。
   */
  const marker = path.join(sandbox.root, 'read-drift-applied')
  fs.writeFileSync(path.join(sandbox.root, 'bin/git'), `#!${process.execPath}
const fs = require('node:fs')
const { spawnSync } = require('node:child_process')
const args = process.argv.slice(2)
const result = spawnSync(${JSON.stringify(realGit)}, args, { encoding: null })
if (result.stdout) process.stdout.write(result.stdout)
if (result.stderr) process.stderr.write(result.stderr)
if (result.status === 0 && args.includes('show') && !fs.existsSync(${JSON.stringify(marker)})) {
  fs.writeFileSync(${JSON.stringify(marker)}, ${JSON.stringify(kind)})
  if (${JSON.stringify(kind)} === 'revision') {
    const commit = spawnSync(${JSON.stringify(realGit)}, ['-C', ${JSON.stringify(fixture.root)}, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'test: source drift'], { encoding: 'utf8' })
    if (commit.status !== 0) { process.stderr.write(commit.stderr); process.exit(91) }
  } else {
    fs.appendFileSync(${JSON.stringify(kind === 'dependency' ? path.join(fixture.root, 'pnpm-lock.yaml') : path.join(fixture.sourceRoot, 'README.md'))}, ${JSON.stringify(String.fromCharCode(10) + (kind === 'dependency' ? '# read drift' : 'read drift') + String.fromCharCode(10))})
  }
}
process.exit(result.status ?? 92)
`, { mode: 0o700 })
  return marker
}

/**
 * 三类漂移分别验证固定提交、源码字节和已消费依赖的复核。
 */
for (const kind of ['input', 'revision', 'dependency']) {
  test(`构建读取期间${kind}漂移必须被复核拒绝`, async () => {
    /**
     * 仅本条测试拥有包装器和所有待改字节。
     */
    const sandbox = createUrgentSandbox()
    /**
     * PATH只在同步产品调用期间改变，finally恢复。
     */
    const previousPath = process.env.PATH
    try {
      /**
       * 干净输入先验证成功，避免故障注入前已有错误遮蔽断言。
       */
      const { fixture, exporter } = await prepareWorkspaceTest(sandbox)
      /**
       * 标记证明实际走到真实Git读取之后。
       */
      const marker = installReadDrift(sandbox, fixture, kind)
      process.env.PATH = `${path.join(sandbox.root, 'bin')}${path.delimiter}${previousPath}`
      assert.throws(() => exporter.snapshotContent(fixture.sourceRoot), /输入|来源|提交|字节|变化|漂移|依赖/u)
      assert.equal(fs.readFileSync(marker, 'utf8'), kind)
    }
    finally {
      process.env.PATH = previousPath
      sandbox.cleanup()
    }
  })
}

test('正式来源核验不修改技能源码字节或生成输出', async () => {
  /**
   * 只读来源核验不能把实际副作用藏在成功返回里。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 排除Git内部文件和node_modules，只对本次工程普通文件检查。
     */
    const { fixture, exporter } = await prepareWorkspaceTest(sandbox)
    /**
     * 来源根内没有链接依赖的完整树，复制前先保留其字节事实。
     */
    const before = snapshotTree(path.join(fixture.sourceRoot, 'src'))
    exporter.snapshotContent(fixture.sourceRoot)
    assert.deepEqual(snapshotTree(path.join(fixture.sourceRoot, 'src')), before)
    assert.equal(fs.existsSync(path.join(fixture.sourceRoot, 'dist')), false)
  }
  finally { sandbox.cleanup() }
})
