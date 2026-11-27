import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { createReleaseFixture, createUrgentSandbox, describeFixtureFile, git, installFixture, loadProduct, packageRoot, publicationRequest, runCommand, seedConflictingTag, snapshotTree } from './helpers/urgent-sandbox.mjs'

test('Release 保留旧必需字段且仅声明 identity，公开候选独立读盘生成摘要', async () => {
  /**
   * 每条契约拥有独立文件，不共享可变 payload。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 真实样本及真实验证器分别准备。
     */
    const fixture = createReleaseFixture(sandbox)
    /**
     * 旧 schema 入口必须接受限定为 Codex 的兼容模型。
     */
    const validator = await loadProduct(sandbox, 'build/distribution/validate.ts')
    assert.deepEqual(validator.parseRelease(fixture.release), fixture.release)
    /**
     * 产品候选验证不能由测试自建实现替代。
     */
    const verifier = await loadProduct(sandbox, 'build/distribution/verify.ts')
    assert.equal(typeof verifier.verifyCandidate, 'function', '缺少严格候选磁盘验证能力 verifyCandidate')
    /**
     * 摘要预期独立从原始文件计算并包含清单自身。
     */
    const files = [...fixture.release.files, describeFixtureFile(fixture.root, 'release.json')].sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
    /**
     * 稳定索引算法不含路径、时间或环境外部信息。
     */
    const result = verifier.verifyCandidate(fixture.root, { version: '0.1.0', sourceRevision: '1'.repeat(40) })
    assert.deepEqual(result.payloadFiles, files)
    assert.equal(result.candidateDigest, createHash('sha256').update(JSON.stringify(files)).digest('hex'))
    assert.equal(result.catalogDigest, describeFixtureFile(fixture.root, 'release.json').sha256)
    assert.equal(result.version, '0.1.0')
    assert.equal(result.sourceRevision, '1'.repeat(40))
  }
  finally { sandbox.cleanup() }
})

/**
 * 每项破坏只引入一种错误，防止统一参数错误掩盖具体文件风险。
 */
const candidateFailures = [
  ['缺附件', fixture => fs.rmSync(path.join(fixture.root, fixture.release.skills[0].directory, 'references/content.bin'))],
  ['额外文件', fixture => fs.writeFileSync(path.join(fixture.root, 'unexpected.txt'), '不可公开')],
  ['错误版本', (fixture) => {
    fixture.release.version = '0.2.0'
    fixture.save()
  }],
  ['错误源码', (fixture) => {
    fixture.release.sourceRevision = '2'.repeat(40)
    fixture.save()
  }],
  ['development', (fixture) => {
    fixture.release.development = true
    fixture.save()
  }],
  ['identity遗漏附件', (fixture) => {
    fixture.release.projections.identity['document-changed-symbols'].pop()
    fixture.save()
  }],
  ['大小写冲突', fixture => fs.copyFileSync(path.join(fixture.root, 'README.md'), path.join(fixture.root, 'readme.md'))],
  ['链接', (fixture) => {
    fs.rmSync(path.join(fixture.root, 'LICENSE'))
    fs.symlinkSync('README.md', path.join(fixture.root, 'LICENSE'))
  }],
  ['路径越界', (fixture) => {
    fixture.release.files[0].path = '../escape'
    fixture.save()
  }],
]
for (const [label, damage] of candidateFailures) {
  test(`严格候选拒绝${label}并保持磁盘输入不变`, async () => {
    /**
     * 当前错误不能影响其他断言的基线。
     */
    const sandbox = createUrgentSandbox()
    try {
      /**
       * 完整样本只由本分支破坏一次。
       */
      const fixture = createReleaseFixture(sandbox)
      damage(fixture)
      /**
       * 严格候选入口必须已实现，不能将 TypeError 当正确拒绝。
       */
      const verifier = await loadProduct(sandbox, 'build/distribution/verify.ts')
      assert.equal(typeof verifier.verifyCandidate, 'function', '缺少严格候选磁盘验证能力 verifyCandidate')
      /**
       * 失败不修补、删除或格式化不可信输入。
       */
      const before = snapshotTree(fixture.root)
      assert.throws(() => verifier.verifyCandidate(fixture.root, { version: '0.1.0', sourceRevision: '1'.repeat(40) }), Error)
      assert.deepEqual(snapshotTree(fixture.root), before)
    }
    finally { sandbox.cleanup() }
  })
}

test('固定 GitHub raw 与 tree 解析为同仓库同完整发布 SHA', async () => {
  /**
   * 真实模块导入不得联网或调用安装。
   */
  const module = await import(pathToFileURL(path.join(packageRoot, 'script/install-skills/read-agents.mjs')).href)
  assert.equal(typeof module.resolveOfficialSource, 'function', '缺少固定 GitHub 来源转换能力')
  /**
   * 显式字面值防止以生产函数构建自身期望。
   */
  const expected = { repository: 'owner/repository', publishedRevision: 'a'.repeat(40), officialSkillsRoot: `https://github.com/owner/repository/tree/${'a'.repeat(40)}`, rawRoot: `https://raw.githubusercontent.com/owner/repository/${'a'.repeat(40)}` }
  assert.deepEqual(module.resolveOfficialSource(expected.rawRoot), expected)
  assert.deepEqual(module.resolveOfficialSource(expected.officialSkillsRoot), expected)
  for (const source of ['https://raw.githubusercontent.com/owner/repository/main', `https://raw.githubusercontent.com/owner/repository/${'a'.repeat(39)}`, `https://raw.githubusercontent.com/owner/repository/${'a'.repeat(40)}?revision=${'b'.repeat(40)}`, `https://github.com/owner/repository/tree/${'a'.repeat(40)}/../${'b'.repeat(40)}`, `https://github.com/owner/repository/tree/${'a'.repeat(40)}/%2e%2e`, `https://example.invalid/owner/repository/${'a'.repeat(40)}`])
    assert.throws(() => module.resolveOfficialSource(source), Error, source)
})

test('唯一普通入口复用无自有收据的官方完整目录并保留原字节', () => {
  /**
   * 单独用户避免已有技能或安装历史影响判断。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * coding 普通技能没有本次适用的工作流挂载。
     */
    const fixture = createReleaseFixture(sandbox)
    installFixture(sandbox, fixture)
    /**
     * 安装文件只读比较，不把目标工具缓存算正文修改。
     */
    const before = snapshotTree(path.join(sandbox.project, '.agents'))
    /**
     * 普通调用不加 no-mount 或官方预检绕过真正入口。
     */
    const result = runCommand(sandbox, process.execPath, [path.join(fixture.root, 'script/index.mjs'), '--source-dir', fixture.root, '--version', '0.1.0', '--agent', 'codex', '--skill', 'document-changed-symbols', '--project', sandbox.project])
    assert.equal(result.status, 0, result.stderr + result.stdout)
    /**
     * 结构化事实必须来自真实平台脚本。
     */
    const report = JSON.parse(result.stdout)
    assert.ok(report.stages, `缺少阶段报告：${result.stdout}`)
    assert.equal(report.stages.installation.status, 'success')
    assert.equal(report.stages.integrity.status, 'success')
    assert.deepEqual(snapshotTree(path.join(sandbox.project, '.agents')), before)
    assert.equal(fs.existsSync(path.join(sandbox.project, '.foundry-distribution/receipts')), false)
  }
  finally { sandbox.cleanup() }
})

test('真实入口的外部 hook 故障保留安装事实并阻断 Increment', () => {
  /**
   * 外部 CLI 失败程序只记录产品实际调用，不伪装成功注册。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * Increment 及其必须显式补选的两个依赖均已完整安装。
     */
    const fixture = createReleaseFixture(sandbox, { workflow: true })
    installFixture(sandbox, fixture)
    fs.mkdirSync(path.join(sandbox.project, '.specify'), { recursive: true })
    fs.writeFileSync(path.join(sandbox.project, '.specify/init-options.json'), '{"ai":"codex"}\n')
    fs.writeFileSync(path.join(sandbox.root, 'bin/uvx'), '#!/bin/sh\nprintf "%s\\n" "$*" >> "$TMPDIR/specify-calls"\nexit 17\n', { mode: 0o700 })
    /**
     * 故障注入位于官方 CLI 进程边界，产品选择和顺序继续真实执行。
     */
    const result = runCommand(sandbox, process.execPath, [path.join(fixture.root, 'script/index.mjs'), '--source-dir', fixture.root, '--version', '0.1.0', '--agent', 'codex', '--project', sandbox.project, ...fixture.release.skills.flatMap(skill => ['--skill', skill.name])])
    assert.notEqual(result.status, 0)
    /**
     * 每个阶段独立断言，不能以一个失败位代替顺序保护。
     */
    const report = JSON.parse(result.stdout)
    assert.ok(report.stages, `缺少阶段报告：${result.stdout}`)
    assert.equal(report.stages.installation.status, 'success')
    assert.equal(report.stages.integrity.status, 'success')
    assert.equal(report.stages.hooks.status, 'failed')
    assert.equal(report.stages.commands.status, 'not-run')
    assert.ok(report.stages.hooks.reasonCode || report.reasonCode)
    assert.ok(fs.existsSync(path.join(sandbox.root, 'tmp/specify-calls')), '必须实际进入 hook 外部调用')
    assert.doesNotMatch(fs.readFileSync(path.join(sandbox.root, 'tmp/specify-calls'), 'utf8'), /modes/u)
  }
  finally { sandbox.cleanup() }
})

test('发布接口必须存在并拒绝没有具体候选授权的 bare 写入', async () => {
  /**
   * 本地 bare 不能与真实远端或消费目录混用。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 缺发布模块为明确缺能力红灯，不允许 skip。
     */
    const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
    assert.equal(typeof publisher.publishCandidate, 'function')
    /**
     * 未授权请求必须保持远端零新 ref。
     */
    const repository = path.join(sandbox.root, 'remote.git')
    git(sandbox, ['init', '--bare', repository])
    /**
     * 完整样本不足以替代明确发布授权。
     */
    const fixture = createReleaseFixture(sandbox)
    await assert.rejects(() => publisher.publishCandidate({ candidateRoot: fixture.root, repository, version: '0.1.0', sourceRevision: '1'.repeat(40), candidateDigest: '0'.repeat(64) }), Error)
    assert.equal(git(sandbox, ['for-each-ref'], repository), '')
  }
  finally { sandbox.cleanup() }
})

/**
 * 两种已有 tag 均必须保留其真实对象，禁止覆盖纠正。
 */
for (const kind of ['parent', 'blob']) {
  test(`发布拒绝${kind === 'parent' ? '带父历史' : '非 commit'} tag且零覆盖`, async () => {
    /**
     * 每种反例使用真实独占 bare Git。
     */
    const sandbox = createUrgentSandbox()
    try {
      /**
       * 缺模块必须直接暴露，不把导入错误当正确拒绝。
       */
      const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
      /**
       * 冲突与请求均绑定同一具体候选身份。
       */
      const fixture = createReleaseFixture(sandbox)
      /**
       * 测试远端仅为自有临时目录。
       */
      const repository = path.join(sandbox.root, 'remote.git')
      git(sandbox, ['init', '--bare', repository])
      /**
       * 非法对象事先实际推送，不用假 Git 回应。
       */
      const existing = seedConflictingTag(sandbox, fixture, repository, kind)
      await assert.rejects(() => publisher.publishCandidate(publicationRequest(fixture, repository)), Error)
      assert.equal(git(sandbox, ['rev-parse', 'refs/tags/skills-v0.1.0'], repository), existing)
    }
    finally { sandbox.cleanup() }
  })
}

test('两个并发请求收敛为同字节无父发布SHA且只有一个tag', async () => {
  /**
   * 并发只争用本条用例拥有的 bare 仓库。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 两条请求必须实际执行同一个生产发布器。
     */
    const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
    /**
     * 合法授权基于完整真实文件样本。
     */
    const fixture = createReleaseFixture(sandbox)
    /**
     * 不能连接用户仓库或已有工作树。
     */
    const repository = path.join(sandbox.root, 'remote.git')
    git(sandbox, ['init', '--bare', repository])
    /**
     * 生产异步推送产生真实 ref 创建竞争。
     */
    const results = await Promise.all([publisher.publishCandidate(publicationRequest(fixture, repository)), publisher.publishCandidate(publicationRequest(fixture, repository))])
    assert.equal(results[0].publishedRevision, results[1].publishedRevision)
    assert.match(results[0].publishedRevision, /^[a-f0-9]{40}$/u)
    assert.equal(git(sandbox, ['for-each-ref', '--format=%(refname)'], repository), 'refs/tags/skills-v0.1.0')
    assert.equal(git(sandbox, ['rev-list', '--parents', '-n', '1', 'refs/tags/skills-v0.1.0'], repository).split(' ').length, 1)
  }
  finally { sandbox.cleanup() }
})

test('推送实际完成但响应丢失后回读精确ref并保留发布事实', async () => {
  /**
   * 仅本用例把 git 外部推送返回值改为失败，实际 Git 仍完成写入。
   */
  const sandbox = createUrgentSandbox()
  /**
   * PATH 在 finally 恢复，故障不泄漏给其他用例。
   */
  const previousPath = process.env.PATH
  try {
    /**
     * 调用真实发布器，不将外部替身返回当最终结果。
     */
    const publisher = await import(pathToFileURL(path.join(packageRoot, 'build/publish.mjs')).href)
    /**
     * 固定当前 Git 绝对路径避免包装器递归。
     */
    const realGit = runCommand(sandbox, 'which', ['git']).stdout.trim()
    /**
     * 自有 bare 保留唯一可写远端。
     */
    const repository = path.join(sandbox.root, 'remote.git')
    git(sandbox, ['init', '--bare', repository])
    /**
     * 候选在故障安装前完成准备。
     */
    const fixture = createReleaseFixture(sandbox)
    fs.writeFileSync(path.join(sandbox.root, 'bin/git'), `#!/bin/sh\n'${realGit}' "$@"\nresult=$?\nfor argument in "$@"; do\n  if [ "$argument" = push ] && [ "$result" -eq 0 ]; then exit 73; fi\ndone\nexit "$result"\n`, { mode: 0o700 })
    process.env.PATH = `${path.join(sandbox.root, 'bin')}${path.delimiter}${previousPath}`
    /**
     * 回读远端事实而非推送退出码决定发布结果。
     */
    const result = await publisher.publishCandidate(publicationRequest(fixture, repository))
    assert.equal(result.publishedRevision, git(sandbox, ['rev-parse', 'refs/tags/skills-v0.1.0'], repository))
    assert.equal(result.publish.status, 'success')
    assert.equal(result.remoteVerify.status, 'success')
  }
  finally {
    process.env.PATH = previousPath
    sandbox.cleanup()
  }
})
