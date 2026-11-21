import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { createUrgentSandbox, git, loadProduct, packageRoot, snapshotTree } from './helpers/urgent-sandbox.mjs'

/**
 * 在自有 Git 中准备完整九项真实正文，许可仅为测试数据。
 * @param {object} sandbox 独占测试根。
 * @returns {string} 自有干净源码提交。
 */
function prepareSource(sandbox) {
  fs.cpSync(path.join(packageRoot, 'src'), path.join(sandbox.project, 'src'), { recursive: true })
  fs.cpSync(path.join(packageRoot, 'script'), path.join(sandbox.project, 'script'), { recursive: true })
  fs.writeFileSync(path.join(sandbox.project, 'README.md'), '独占合成构建测试。\n')
  fs.writeFileSync(path.join(sandbox.project, 'LICENSE'), 'TEST FIXTURE ONLY. Not a public license.\n')
  fs.writeFileSync(path.join(sandbox.project, 'package.json'), JSON.stringify({ name: 'urgent-fixture', version: '0.1.0', type: 'module' }))
  git(sandbox, ['init', '-b', 'main'])
  return saveSource(sandbox)
}

/**
 * 提交自有测试字节，使故障不能被脏工作树检查提前遮蔽。
 * @param {object} sandbox 独占测试根。
 * @returns {string} 真实测试提交。
 */
function saveSource(sandbox) {
  git(sandbox, ['add', '.'])
  git(sandbox, ['commit', '--allow-empty', '-m', 'test: record fixture bytes'])
  return git(sandbox, ['rev-parse', 'HEAD'])
}

test('九项正文、附件、配置与脚本同源双构建一致，运行脚本没有执行', async () => {
  /**
   * 每次测试只写私有临时树。
   */
  const sandbox = createUrgentSandbox()
  try {
    prepareSource(sandbox)
    /**
     * 将可执行副作用写进样本脚本，构建只能复制字节。
     */
    const trap = path.join(sandbox.project, 'script/build-trap.mjs')
    fs.writeFileSync(trap, 'throw new Error(\'构建不得执行运行脚本\')\n')
    /**
     * 源码身份来自真实自有提交。
     */
    const revision = saveSource(sandbox)
    /**
     * 测试直接使用产品插件和磁盘验证能力。
     */
    const plugin = await loadProduct(sandbox, 'build/plugins/content.ts')
    /**
     * 同一次编译出的验证模块独立读回实际 payload。
     */
    const verifier = await loadProduct(sandbox, 'build/distribution/verify.ts')
    /**
     * 两个独立输出根不能互相补件。
     */
    const outputs = [path.join(sandbox.root, 'first'), path.join(sandbox.root, 'second')]
    /**
     * 两次 Vite 构建分别从同一干净来源开始。
     */
    for (const output of outputs) {
      await build({ root: sandbox.project, configFile: false, publicDir: false, logLevel: 'silent', plugins: [new plugin.SkillsContentPlugin()], build: { outDir: output, emptyOutDir: true, rolldownOptions: { input: plugin.SkillsContentPlugin.entry } } })
      /**
       * 清单保持消费者字段，且不含 Eve 或 development。
       */
      const manifest = JSON.parse(fs.readFileSync(path.join(output, 'release.json'), 'utf8'))
      assert.equal(manifest.skills.length, 9)
      assert.deepEqual(Object.keys(manifest.projections), ['identity'])
      assert.equal(manifest.development, undefined)
      assert.equal(manifest.sourceRevision, revision)
      assert.equal(verifier.verifyCandidate(output, { version: '0.1.0', sourceRevision: revision }).payloadFiles.length, manifest.files.length + 1)
      assert.equal(fs.readFileSync(path.join(output, 'script/config/workflow/collection.config.json'), 'utf8'), fs.readFileSync(path.join(sandbox.project, 'src/workflow/collection.config.json'), 'utf8'))
    }
    assert.deepEqual(snapshotTree(outputs[0]), snapshotTree(outputs[1]))
  }
  finally { sandbox.cleanup() }
})

/**
 * 每个已提交故障分别命中真实来源校验。
 */
const sourceFailures = [
  ['缺必要附件', root => fs.rmSync(path.join(root, 'src/coding/document-changed-symbols/references/test-prompts.md'))],
  ['额外公开技能', root => fs.cpSync(path.join(root, 'src/workflow/bug-report'), path.join(root, 'src/workflow/unknown'), { recursive: true })],
  ['未知集中配置', (root) => {
    /**
     * 当前测试只破坏集中 skill 选择。
     */
    const file = path.join(root, 'src/workflow/collection.config.json')
    /**
     * 合法配置其余字段保持不变。
     */
    const config = JSON.parse(fs.readFileSync(file))
    config.skill.unknown = {}
    fs.writeFileSync(file, JSON.stringify(config))
  }],
  ['重复身份', (root) => {
    /**
     * 正式入口使用另一个已公开身份。
     */
    const file = path.join(root, 'src/workflow/bug-report/SKILL.md')
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('name: bug-report', 'name: task-increment'))
  }],
  ['大小写冲突', root => fs.copyFileSync(path.join(root, 'src/coding/document-changed-symbols/SKILL.md'), path.join(root, 'src/coding/document-changed-symbols/skill.md'))],
  ['链接', (root) => {
    /**
     * 已提交链接只能被拒绝，不能跟随读取。
     */
    const file = path.join(root, 'src/coding/document-changed-symbols/references/test-prompts.md')
    fs.rmSync(file)
    fs.symlinkSync('../SKILL.md', file)
  }],
  ['缺真实材料', root => fs.rmSync(path.join(root, 'LICENSE'))],
  ['引用越界', root => fs.appendFileSync(path.join(root, 'src/workflow/bug-report/SKILL.md'), '\n[非法附件](../outside.txt)\n')],
]
/**
 * 每种单一来源损坏对应独立错误原因，避免嵌套条件掩盖断言。
 */
const sourceFailurePatterns = {
  缺必要附件: /附件缺失/u,
  额外公开技能: /未知公开/u,
  未知集中配置: /集中配置/u,
  重复身份: /身份/u,
  大小写冲突: /大小写/u,
  链接: /链接/u,
  缺真实材料: /LICENSE/u,
  引用越界: /越界/u,
}

/**
 * 各来源风险分别拥有独立断言与提交。
 */
for (const [label, damage] of sourceFailures) {
  test(`来源拒绝${label}且不清理旧输出`, async () => {
    /**
     * 每个故障保留同样完整的原始来源。
     */
    const sandbox = createUrgentSandbox()
    try {
      prepareSource(sandbox)
      damage(sandbox.project)
      saveSource(sandbox)
      /**
       * 旧输出用于证明校验失败没有先清理。
       */
      const output = path.join(sandbox.root, 'output')
      fs.mkdirSync(output)
      fs.writeFileSync(path.join(output, 'keep.txt'), '原输出必须保留')
      /**
       * 真插件配置解析前即可拒绝不可信来源。
       */
      const plugin = await loadProduct(sandbox, 'build/plugins/content.ts')
      await assert.rejects(build({ root: sandbox.project, configFile: false, publicDir: false, logLevel: 'silent', plugins: [new plugin.SkillsContentPlugin()], build: { outDir: output, emptyOutDir: true, rolldownOptions: { input: plugin.SkillsContentPlugin.entry } } }), sourceFailurePatterns[label])
      assert.equal(fs.readFileSync(path.join(output, 'keep.txt'), 'utf8'), '原输出必须保留')
    }
    finally { sandbox.cleanup() }
  })
}

test('独立构建拒绝脏源码和冒认提交，write=false 保持无输出', async () => {
  /**
   * 源码提交与输出目录均属于测试。
   */
  const sandbox = createUrgentSandbox()
  try {
    prepareSource(sandbox)
    /**
     * 产品导出不能接受环境变量覆盖实际 HEAD。
     */
    const exporter = await loadProduct(sandbox, 'build/distribution/export.ts')
    assert.throws(() => exporter.snapshotContent(sandbox.project, { categories: ['coding', 'frontend', 'workflow'], version: '0.1.0', sourceRevision: 'f'.repeat(40) }))
    fs.appendFileSync(path.join(sandbox.project, 'README.md'), '未提交变更')
    assert.throws(() => exporter.snapshotContent(sandbox.project))
    saveSource(sandbox)
    /**
     * 不落盘模式使用真实 Vite 生命周期。
     */
    const plugin = await loadProduct(sandbox, 'build/plugins/content.ts')
    /**
     * 禁止生成任何未声明目录。
     */
    const output = path.join(sandbox.root, 'write-false')
    await build({ root: sandbox.project, configFile: false, publicDir: false, logLevel: 'silent', plugins: [new plugin.SkillsContentPlugin()], build: { write: false, outDir: output, rolldownOptions: { input: plugin.SkillsContentPlugin.entry } } })
    assert.equal(fs.existsSync(output), false)
  }
  finally { sandbox.cleanup() }
})

test('来源拒绝已提交构建输入的删除，不以当前剩余文件冒认提交', async () => {
  /**
   * 被删除源码与Git均位于当前独占样本。
   */
  const sandbox = createUrgentSandbox()
  try {
    prepareSource(sandbox)
    fs.mkdirSync(path.join(sandbox.project, 'build'))
    fs.writeFileSync(path.join(sandbox.project, 'build/input.ts'), 'export {}\n')
    saveSource(sandbox)
    /**
     * 完好基线先通过，再仅删除一个已经提交的构建输入。
     */
    const exporter = await loadProduct(sandbox, 'build/distribution/export.ts')
    exporter.snapshotContent(sandbox.project)
    fs.rmSync(path.join(sandbox.project, 'build/input.ts'))
    assert.throws(() => exporter.snapshotContent(sandbox.project), /来源|输入|提交/u)
  }
  finally { sandbox.cleanup() }
})

test('Vite配置快照之后的来源变化在资产生成前被拒绝', async () => {
  /**
   * 配置与后续生命周期之间的故障注入只修改自有README。
   */
  const sandbox = createUrgentSandbox()
  try {
    prepareSource(sandbox)
    /**
     * 真实内容插件固定来源之后，后置插件改变同一实际输入。
     */
    const plugin = await loadProduct(sandbox, 'build/plugins/content.ts')
    /**
     * 单一配置阶段故障，不替代内容插件的实际生命周期。
     */
    const drift = {
      name: 'test-source-drift',
      configResolved() { fs.appendFileSync(path.join(sandbox.project, 'README.md'), '配置后漂移\n') },
    }
    await assert.rejects(build({ root: sandbox.project, configFile: false, publicDir: false, logLevel: 'silent', plugins: [new plugin.SkillsContentPlugin(), drift], build: { outDir: path.join(sandbox.root, 'output'), emptyOutDir: true, rolldownOptions: { input: plugin.SkillsContentPlugin.entry } } }), /来源|输入|提交/u)
  }
  finally { sandbox.cleanup() }
})
