import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters } from 'node:util'
import { createUrgentSandbox, loadProduct, packageRoot, runCommand, snapshotTree } from './helpers/urgent-sandbox.mjs'

/**
 * 验证官方安装目录精确等于所选identity正文和附件；不把文件存在当宿主加载。
 * @param {object} consumer 独占Linux/Codex项目。
 * @param {object} release 同版真实清单。
 * @param {string[]} names 显式所选技能。
 */
function assertInstalled(consumer, release, names) {
  /**
   * 项目级实际Codex目标，不检查任何真实用户目录。
   */
  const target = path.join(consumer.project, '.agents/skills')
  assert.deepEqual(fs.readdirSync(target).sort(), [...names].sort())
  for (const name of names) {
    /**
     * 实际完整文件全集必须与identity一一对应。
     */
    const root = path.join(target, name)
    assert.ok(fs.lstatSync(root).isDirectory() && !fs.lstatSync(root).isSymbolicLink())
    for (const relative of Object.keys(snapshotTree(root)))
      assert.equal(fs.lstatSync(path.join(root, relative)).isSymbolicLink(), false, `官方复制目录含链接：${name}/${relative}`)
    assert.deepEqual(Object.keys(snapshotTree(root)).filter(relative => fs.lstatSync(path.join(root, relative)).isFile()).sort(), release.projections.identity[name].map(file => file.path).sort())
    for (const file of release.projections.identity[name]) {
      assert.ok(!fs.lstatSync(path.join(root, file.path)).isSymbolicLink())
      /**
       * 独立原始字节摘要包括普通文本和二进制附件。
       */
      const bytes = fs.readFileSync(path.join(root, file.path))
      assert.equal(bytes.length, file.bytes)
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256)
    }
  }
}

test('真实官方latest固定本次版本发现并完整复制九项内容', async (t) => {
  /**
   * 构建、npm工具缓存与消费项目分别为本测试拥有的目录。
   */
  const source = createUrgentSandbox()
  try {
    /**
     * 默认消费当前工作区已构建候选，内部远端复验可显式切换同版材料根。
     */
    const payload = path.resolve(process.env.URGENT_CANDIDATE_ROOT || path.join(packageRoot, 'dist'))
    assert.ok(fs.existsSync(path.join(payload, 'release.json')), `缺少实际候选：${payload}；先完成真实来源冻结及build，不以skip冒认通过`)
    /**
     * 当前产品验证器从真实磁盘核验完整文件全集及同版内容。
     */
    const verifier = await loadProduct(source, 'build/distribution/verify.ts')
    /**
     * 本次候选版本与源码身份只从实际清单读取，外部完整核验沿原任务留证。
     */
    const release = JSON.parse(fs.readFileSync(path.join(payload, 'release.json'), 'utf8'))
    /**
     * 同次完整候选的精确摘要用于关联真实官方安装结果。
     */
    const candidate = verifier.verifyCandidate(payload, { version: release.version, sourceRevision: release.sourceRevision })
    assert.equal(release.skills.length, 9)
    assert.equal(release.skills.some(skill => skill.category === 'eval'), false)
    /**
     * 版本与Codex项目规则来自同次完整官方包与integrity核验。
     */
    const online = await import(pathToFileURL(path.join(payload, 'script/install-skills/read-agents.mjs')).href)
    /**
     * 该真实网络前提失败时明确失败，不固定历史版本或skip。
     */
    const upstream = await online.readOnlineAgents({ cwd: source.project, userHome: source.userHome, env: source.env })
    assert.equal(upstream.agents.find(agent => agent.name === 'codex').skillsDir, '.agents/skills')
    t.diagnostic(`upstream=${upstream.upstream.version}; integrity=${upstream.upstream.integrity}; sourceRevision=${release.sourceRevision}; candidateDigest=${candidate.candidateDigest}`)
    /**
     * 真实npx工具缓存属于本测试，不是产品预检的一部分。
     * @param {object} consumer 独占消费项目。
     * @param {string} location 本地Git/目录来源，仅内部验收使用。
     * @param {string[]} selection 官方CLI参数。
     * --list使用官方可读列表，其他安装保留JSON模式，不能组合互斥参数。
     * @returns {object} 官方实际进程输出。
     */
    function official(consumer, location, selection) {
      return runCommand(consumer, 'npx', ['--yes', `skills@${upstream.upstream.version}`, 'add', location, '--agent', 'codex', '--copy', '--yes', ...(selection.includes('--list') ? [] : ['--json']), ...selection], { env: { ...consumer.env, npm_config_cache: path.join(source.root, 'npm-cache'), DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1', CI: '1' } })
    }
    await t.test('官方实际发现仅九项有效身份且未安装', () => {
      /**
       * 发现与安装使用不同自有消费目录。
       */
      const consumer = createUrgentSandbox()
      try {
        /**
         * --list仍由当前真实官方CLI执行。
         */
        const result = official(consumer, payload, ['--list'])
        assert.equal(result.status, 0, result.stderr + result.stdout)
        /**
         * 官方列表不支持JSON，移除终端控制符后核对实际发现数量和名称行。
         */
        const output = stripVTControlCharacters(result.stdout)
        assert.match(output, /Found 9 skills/u)
        /**
         * 只读取官方独立名称行，不能把描述文字或静态清单当发现结果。
         */
        const discovered = output.split(/\r?\n/u).flatMap((line) => {
          /**
           * 官方名称行在边框后缩进四格，描述行不会被计入。
           */
          const match = /^│ {4}([a-z][\w-]*)$/u.exec(line.trim())
          return match ? [match[1]] : []
        })
        assert.deepEqual(discovered.sort(), release.skills.map(skill => skill.name).sort())
        assert.equal(fs.existsSync(path.join(consumer.project, '.agents')), false)
      }
      finally { consumer.cleanup() }
    })
    /**
     * 不用通配符扩大选择；分类通过同版本地目录实现。
     */
    const selections = [
      ['完整范围', payload, release.skills.map(skill => skill.name)],
      ['frontend分类', path.join(payload, 'skills/frontend'), ['nuxt-ui-styling', 'vue-reactivity']],
      ['单技能', path.join(payload, 'skills/coding/document-changed-symbols'), ['document-changed-symbols']],
      ['多技能', payload, ['document-changed-symbols', 'bug-report']],
    ]
    for (const [label, location, names] of selections) {
      await t.test(`官方${label}复制正文附件100%一致且未选新增为零`, () => {
        /**
         * 每个选择粒度单独安装，不被前一用例补件。
         */
        const consumer = createUrgentSandbox()
        try {
          /**
           * 实际官方CLI必须成功，后续还需逐字节验证。
           */
          const result = official(consumer, location, ['--skill', ...names])
          assert.equal(result.status, 0, result.stderr + result.stdout)
          assertInstalled(consumer, release, names)
          assert.equal(fs.existsSync(path.join(consumer.project, 'node_modules')), false, '不得将作者依赖树交付消费端')
          assert.equal(fs.existsSync(path.join(consumer.project, 'script/index.mjs')), false, '不能假设单技能安装附带根脚本')
        }
        finally { consumer.cleanup() }
      })
    }
    await t.test('同版增量安装保留前次正文并只增加本次选择', () => {
      /**
       * 同一消费目录连续执行两次实际官方安装。
       */
      const consumer = createUrgentSandbox()
      try {
        assert.equal(official(consumer, payload, ['--skill', 'document-changed-symbols']).status, 0)
        /**
         * 原技能正文及附件不能在新增其他技能时漂移。
         */
        const before = snapshotTree(path.join(consumer.project, '.agents/skills/document-changed-symbols'))
        assert.equal(official(consumer, payload, ['--skill', 'bug-report']).status, 0)
        assertInstalled(consumer, release, ['document-changed-symbols', 'bug-report'])
        assert.deepEqual(snapshotTree(path.join(consumer.project, '.agents/skills/document-changed-symbols')), before)
      }
      finally { consumer.cleanup() }
    })
    await t.test('官方无效名称失败且目标无安装写入', () => {
      /**
       * 错误名称不能退化为整包默认安装。
       */
      const consumer = createUrgentSandbox()
      try {
        /**
         * 返回失败还须确认目标未产生任何技能。
         */
        const result = official(consumer, payload, ['--skill', 'not-public'])
        assert.notEqual(result.status, 0, result.stdout)
        assert.equal(fs.existsSync(path.join(consumer.project, '.agents')), false)
      }
      finally { consumer.cleanup() }
    })
    await t.test('显式请求eval评估技能失败且目标零安装写入', () => {
      /**
       * 源码可包含eval不意味着正式候选或官方安装承诺它们。
       */
      const consumer = createUrgentSandbox()
      try {
        /**
         * 由真实官方CLI验证明确名称不可安装，不只查静态清单。
         */
        const result = official(consumer, payload, ['--skill', 'eval-short-rule'])
        assert.notEqual(result.status, 0, result.stdout)
        assert.equal(fs.existsSync(path.join(consumer.project, '.agents')), false)
      }
      finally { consumer.cleanup() }
    })
    await t.test('根脚本独立取得且同版摘要完整，不依赖官方单技能附带', () => {
      /**
       * 同版材料独立取得时仍逐文件核验，不能仅复制目录后宣称完整。
       */
      const consumer = createUrgentSandbox()
      try {
        fs.cpSync(path.join(payload, 'script'), path.join(consumer.root, 'materials/script'), { recursive: true })
        for (const file of release.files.filter(file => file.path.startsWith('script/'))) {
          /**
           * 读取的是实际独立材料副本。
           */
          const bytes = fs.readFileSync(path.join(consumer.root, 'materials', file.path))
          assert.equal(bytes.length, file.bytes)
          assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256)
        }
      }
      finally { consumer.cleanup() }
    })
    await t.test('缺依赖、错版、缺附件、未知同名及用户修改均由正式入口拒绝且保留字节', () => {
      for (const kind of ['dependency', 'version', 'attachment', 'unknown', 'modified']) {
        /**
         * 安全前置的每个反例独占真实官方已安装目录。
         */
        const consumer = createUrgentSandbox()
        try {
          /**
           * Increment缺依赖反例只安装其本体，验证不静默补装。
           */
          const name = kind === 'dependency' ? 'task-increment' : 'document-changed-symbols'
          if (kind !== 'unknown') {
            assert.equal(official(consumer, payload, ['--skill', name]).status, 0)
          }
          else {
            fs.mkdirSync(path.join(consumer.project, '.agents/skills', name), { recursive: true })
            fs.writeFileSync(path.join(consumer.project, '.agents/skills', name, 'SKILL.md'), '用户未知同名文件\n')
          }
          if (kind === 'modified')
            fs.appendFileSync(path.join(consumer.project, '.agents/skills', name, 'SKILL.md'), '用户修改必须保留\n')
          if (kind === 'attachment')
            fs.rmSync(path.join(consumer.project, '.agents/skills', name, 'references/test-prompts.md'))
          /**
           * 只核对内容验收，不把no-mount结果计作挂载成功。
           */
          const before = snapshotTree(consumer.project)
          /**
           * 正式唯一入口负责保护，官方CLI覆盖能力不能替代该前置。
           */
          const result = runCommand(consumer, process.execPath, [path.join(payload, 'script/index.mjs'), '--source-dir', payload, '--version', kind === 'version' ? '9.9.9' : release.version, '--agent', 'codex', '--project', consumer.project, '--skill', name, '--no-mount'])
          assert.notEqual(result.status, 0, result.stdout)
          assert.deepEqual(snapshotTree(consumer.project), before)
        }
        finally { consumer.cleanup() }
      }
    })
  }
  finally { source.cleanup() }
})
