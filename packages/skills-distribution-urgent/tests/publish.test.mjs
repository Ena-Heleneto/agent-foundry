import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { createReleaseFixture, createUrgentSandbox, describeFixtureFile, git, loadProduct, packageRoot, publicationRequest, runCommand, snapshotTree } from './helpers/urgent-sandbox.mjs'

/**
 * 每个错误请求只破坏一个授权或候选条件。
 */
const invalidRequests = [
  ['无授权', (request) => { delete request.authorization }],
  ['错授权仓库', (request) => { request.authorization.repository += '-wrong' }],
  ['错授权版本', (request) => { request.authorization.version = '9.9.9' }],
  ['错授权源码', (request) => { request.authorization.sourceRevision = 'f'.repeat(40) }],
  ['错授权摘要', (request) => { request.authorization.candidateDigest = 'f'.repeat(64) }],
  ['缺授权依据', (request) => { request.authorization.reference = '' }],
  ['错请求版本', (request) => {
    request.version = '9.9.9'
    request.authorization.version = '9.9.9'
  }],
  ['错请求源码', (request) => {
    request.sourceRevision = 'f'.repeat(40)
    request.authorization.sourceRevision = 'f'.repeat(40)
  }],
  ['错请求摘要', (request) => {
    request.candidateDigest = 'f'.repeat(64)
    request.authorization.candidateDigest = 'f'.repeat(64)
  }],
  ['授权后改字节', (_request, fixture) => fs.appendFileSync(path.join(fixture.root, 'README.md'), 'changed')],
  ['缺README', (_request, fixture) => fs.rmSync(path.join(fixture.root, 'README.md'))],
  ['缺LICENSE', (_request, fixture) => fs.rmSync(path.join(fixture.root, 'LICENSE'))],
  ['清单外文件', (_request, fixture) => fs.writeFileSync(path.join(fixture.root, 'private.txt'), '不应公开')],
]
for (const [name, damage] of invalidRequests) {
  test(`发布前${name}必须拒绝且零新ref`, async () => {
    /**
     * 当前反例单独拥有真实远端与payload。
     */
    const sandbox = createUrgentSandbox()
    try {
      /**
       * 真实生产模块缺失时必须失败，禁止将导入失败算作正确拒绝。
       */
      const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
      assert.equal(typeof publisher.publishCandidate, 'function')
      /**
       * 仓库初始无任何分支或tag。
       */
      const repository = path.join(sandbox.root, 'remote.git')
      git(sandbox, ['init', '--bare', repository])
      /**
       * 正常样本只在本轮损坏一个约束。
       */
      const fixture = createReleaseFixture(sandbox)
      /**
       * 原始候选的明确授权不能覆盖后续变化。
       */
      const request = publicationRequest(fixture, repository)
      damage(request, fixture)
      /**
       * 失败不得修补或清退候选源文件。
       */
      const before = snapshotTree(fixture.root)
      await assert.rejects(() => publisher.publishCandidate(request), Error)
      assert.equal(git(sandbox, ['for-each-ref'], repository), '')
      assert.deepEqual(snapshotTree(fixture.root), before)
    }
    finally { sandbox.cleanup() }
  })
}

/**
 * 在私有候选中一致地替换单技能身份，保留其他字段并重算真实字节索引。
 * @param {object} fixture 本次拥有的候选。
 * @param {string} category 目标分类。
 * @param {string} name 目标名称。
 */
function replaceFixtureSkill(fixture, category, name) {
  /**
   * 保留其他契约字段，仅替换待验证的分类与技能身份。
   */
  const skill = fixture.release.skills[0]
  /**
   * 旧投影名称在更换身份后必须移除，避免其他错误遮蔽白名单。
   */
  const previousName = skill.name
  /**
   * 目标名称使用同一正常路径规则，避免无关路径错误遮蔽身份校验。
   */
  const directory = `skills/${category}/${name}`
  fs.mkdirSync(path.dirname(path.join(fixture.root, directory)), { recursive: true })
  fs.renameSync(path.join(fixture.root, skill.directory), path.join(fixture.root, directory))
  skill.name = name
  skill.category = category
  skill.directory = directory
  fs.writeFileSync(path.join(fixture.root, directory, 'SKILL.md'), fs.readFileSync(path.join(fixture.root, directory, 'SKILL.md'), 'utf8').replace(`name: ${previousName}`, `name: ${name}`))
  fixture.release.files = Object.keys(snapshotTree(fixture.root)).filter(file => file !== 'release.json' && fs.lstatSync(path.join(fixture.root, file)).isFile()).map(file => describeFixtureFile(fixture.root, file)).sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
  skill.sourceFiles = fixture.release.files.filter(file => file.path.startsWith(`${directory}/`)).map(file => file.path).sort()
  delete fixture.release.projections.identity[previousName]
  fixture.release.projections.identity[skill.name] = fixture.release.files.filter(file => file.path.startsWith(`${directory}/`)).map(file => ({ ...file, path: file.path.slice(directory.length + 1), sourcePath: file.path }))
  fixture.save()
}

/**
 * 逐项通过真实发布路径验证构建模型中的获准身份。
 * @param {string} category 构建模型声明的正式分类。
 * @param {string} name 构建模型声明的正式技能名。
 */
async function assertKnownSkillPublication(category, name) {
  /**
   * 每项身份拥有独立bare和候选，不能借前一项的ref冒认成功。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 被测发布器没有导入TS或执行payload；模型仅由测试提前读取。
     */
    const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
    /**
     * 真实远端只位于本次独占目录。
     */
    const repository = path.join(sandbox.root, 'remote.git')
    git(sandbox, ['init', '--bare', repository])
    /**
     * 测试正文不是正式技能交付，验证范围仅为身份准入。
     */
    const fixture = createReleaseFixture(sandbox)
    replaceFixtureSkill(fixture, category, name)
    /**
     * 版本、源码、候选与仓库均由真实请求绑定。
     */
    const result = await publisher.publishCandidate(publicationRequest(fixture, repository))
    assert.equal(result.publish.status, 'success', `${category}/${name}`)
    assert.equal(result.remoteVerify.status, 'success', `${category}/${name}`)
  }
  finally { sandbox.cleanup() }
}

test('完整重算摘要的未获准技能仍必须在发布前拒绝且零新ref', async () => {
  /**
   * 未获准正文只存在于本次拥有的候选和bare Git。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 验证发布器自身白名单，不借构建器预先拒绝未知技能。
     */
    const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
    /**
     * 空远端能观察任何未经允许的新ref。
     */
    const repository = path.join(sandbox.root, 'remote.git')
    git(sandbox, ['init', '--bare', repository])
    /**
     * 当前合法单技能样本的正文和全部路径一致地改为未知名称。
     */
    const fixture = createReleaseFixture(sandbox)
    replaceFixtureSkill(fixture, 'coding', 'unapproved-tool')
    await assert.rejects(() => publisher.publishCandidate(publicationRequest(fixture, repository)), /未获准|白名单|公开技能/u)
    assert.equal(git(sandbox, ['for-each-ref'], repository), '')
  }
  finally { sandbox.cleanup() }
})

test('发布器独立白名单与构建模型的九项正式身份保持一致', async () => {
  /**
   * 仅测试加载构建常量，发布器执行期间不编译或导入TS。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 常量从真实构建模型读取，避免把两份手写列表当自身期望。
     */
    const model = await loadProduct(sandbox, 'build/distribution/models.ts')
    assert.equal(Object.values(model.publicSkills).flat().length, 9)
    /**
     * 每个正式身份分别经过产品真实发布与远端核验。
     */
    for (const [category, names] of Object.entries(model.publicSkills)) {
      /**
       * 同分类中的每个身份都通过独立真实Git项目核对。
       */
      for (const name of names)
        await assertKnownSkillPublication(category, name)
    }
  }
  finally { sandbox.cleanup() }
})

test('实际发布精确payload无父树，同字节第二次复用且不执行载荷', async () => {
  /**
   * 正常发布只使用本测试的bare仓库。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 该接口是内部受审查驱动，不是新的公开安装命令。
     */
    const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
    /**
     * 不触碰任何真实远端或用户Git配置。
     */
    const repository = path.join(sandbox.root, 'remote.git')
    git(sandbox, ['init', '--bare', repository])
    /**
     * 真实脚本文件只是发布字节，不允许执行。
     */
    const fixture = createReleaseFixture(sandbox)
    fs.writeFileSync(path.join(fixture.root, 'script/never-run.sh'), `#!/bin/sh\ntouch '${path.join(sandbox.root, 'executed')}'\n`, { mode: 0o700 })
    fixture.release.files.push(describeFixtureFile(fixture.root, 'script/never-run.sh'))
    fixture.release.files.sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
    fixture.save()
    /**
     * 每次授权绑定已经定稿的精确摘要。
     */
    const request = publicationRequest(fixture, repository)
    /**
     * 发布源必须逐字节保持不变。
     */
    const before = snapshotTree(fixture.root)
    /**
     * 首次返回SHA只从远端读回取得。
     */
    const first = await publisher.publishCandidate(request)
    assert.equal(first.reused, false)
    assert.equal(first.repository, repository)
    assert.equal(first.tag, 'skills-v0.1.0')
    assert.equal(first.sourceRevision, fixture.release.sourceRevision)
    assert.equal(first.prepare.status, 'success')
    assert.equal(first.publish.status, 'success')
    assert.equal(first.remoteVerify.status, 'success')
    assert.equal(first.consumption.status, 'not-run')
    assert.equal(first.publishedRevision, git(sandbox, ['rev-parse', 'refs/tags/skills-v0.1.0'], repository))
    assert.equal(git(sandbox, ['cat-file', '-t', first.publishedRevision], repository), 'commit')
    assert.doesNotMatch(git(sandbox, ['cat-file', '-p', first.publishedRevision], repository), /^parent /mu)
    assert.deepEqual(git(sandbox, ['ls-tree', '-r', '--name-only', first.publishedRevision], repository).split('\n').sort(), [...fixture.release.files.map(file => file.path), 'release.json'].sort())
    for (const file of first.payloadFiles) {
      /**
       * 公开对象字节独立于驱动返回的索引再核对。
       */
      const bytes = runCommand(sandbox, 'git', ['--git-dir', repository, 'show', `${first.publishedRevision}:${file.path}`], { encoding: null }).stdout
      assert.equal(bytes.length, file.bytes)
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256)
    }
    /**
     * 无父同字节tag允许复用原SHA，不能生成新版本对象替换。
     */
    const second = await publisher.publishCandidate(request)
    assert.equal(second.reused, true)
    assert.equal(second.publishedRevision, first.publishedRevision)
    assert.equal(git(sandbox, ['for-each-ref', '--format=%(refname)'], repository), 'refs/tags/skills-v0.1.0')
    assert.equal(fs.existsSync(path.join(sandbox.root, 'executed')), false)
    assert.deepEqual(snapshotTree(fixture.root), before)
  }
  finally { sandbox.cleanup() }
})

test('同版本异字节拒绝覆盖，并保留已经完整发布的旧对象', async () => {
  /**
   * 已发布事实和冲突候选均限本测试。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 两次操作都经真实发布驱动。
     */
    const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
    /**
     * 隔离bare不含外部资源。
     */
    const repository = path.join(sandbox.root, 'remote.git')
    git(sandbox, ['init', '--bare', repository])
    /**
     * 第一个完整发布保持可读。
     */
    const fixture = createReleaseFixture(sandbox)
    /**
     * 旧SHA来自实际发布读回。
     */
    const previous = await publisher.publishCandidate(publicationRequest(fixture, repository))
    fs.appendFileSync(path.join(fixture.root, 'README.md'), 'same version different bytes\n')
    fixture.release.files = fixture.release.files.map(file => file.path === 'README.md' ? describeFixtureFile(fixture.root, file.path) : file)
    fixture.save()
    await assert.rejects(() => publisher.publishCandidate(publicationRequest(fixture, repository)), Error)
    assert.equal(git(sandbox, ['rev-parse', 'refs/tags/skills-v0.1.0'], repository), previous.publishedRevision)
    assert.equal(git(sandbox, ['show', `${previous.publishedRevision}:README.md`], repository), '隔离测试样本，不能用于真实发布。')
  }
  finally { sandbox.cleanup() }
})

test('推送已成功但后续远端断连时，错误报告保留发布成功事实', async () => {
  /**
   * 断连故障只属于本次自有Git进程边界。
   */
  const sandbox = createUrgentSandbox()
  /**
   * 用例结束恢复原有工具查找顺序。
   */
  const previousPath = process.env.PATH
  try {
    /**
     * 所有候选校验与推送仍经真实产品实现。
     */
    const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
    /**
     * Git的实际可执行文件不会递归调用包装器。
     */
    const realGit = runCommand(sandbox, 'which', ['git']).stdout.trim()
    /**
     * 只允许本次bare仓库成为写入目标。
     */
    const repository = path.join(sandbox.root, 'remote.git')
    git(sandbox, ['init', '--bare', repository])
    /**
     * 候选与授权在安装故障边界前固定。
     */
    const fixture = createReleaseFixture(sandbox)
    /**
     * 包装器只在成功push后模拟后续网络读取断连。
     */
    const marker = path.join(sandbox.root, 'push-completed')
    fs.writeFileSync(path.join(sandbox.root, 'bin/git'), `#!/bin/sh\nfor argument in "$@"; do\n  if [ "$argument" = ls-remote ] && [ -f '${marker}' ]; then exit 71; fi\ndone\n'${realGit}' "$@"\nresult=$?\nfor argument in "$@"; do\n  if [ "$argument" = push ] && [ "$result" -eq 0 ]; then touch '${marker}'; fi\ndone\nexit "$result"\n`, { mode: 0o700 })
    process.env.PATH = `${path.join(sandbox.root, 'bin')}${path.delimiter}${previousPath}`
    await assert.rejects(() => publisher.publishCandidate(publicationRequest(fixture, repository)), (error) => {
      assert.equal(error.report.prepare.status, 'success')
      assert.equal(error.report.publish.status, 'success')
      assert.equal(error.report.remoteVerify.status, 'failed')
      assert.equal(error.report.consumption.status, 'not-run')
      return true
    })
    assert.match(git(sandbox, ['rev-parse', 'refs/tags/skills-v0.1.0'], repository), /^[a-f0-9]{40}$/u)
  }
  finally {
    process.env.PATH = previousPath
    sandbox.cleanup()
  }
})
