import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test, { after, before } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createHttpsSource } from './helpers/https-source.mjs'

/**
 * 本 MVU 只接受当前用户确认的 Linux 范围，不在其他平台返回假成功。
 */
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-mvu-b-'))
/**
 * 与源码隔离的完整运行副本。
 */
const exported = path.join(root, 'export', 'script')
/**
 * 测试专用不可变来源提交。
 */
const revision = '0123456789abcdef0123456789abcdef01234567'
/**
 * 工具可由维护者预先下载；安装器仍须验证固定摘要才执行。
 */
const jqPath = process.env.FOUNDRY_JQ || path.join(root, 'jq-linux-amd64')
/**
 * 每组实验的目录编号，避免故障交叉污染。
 */
let sequence = 0
/**
 * 测试源在实际监听成功后赋值。
 * @type {Awaited<ReturnType<typeof createHttpsSource>>}
 */
let source

before(async () => {
  /**
   * 调度器只能将本实验记作本地验证，不能把夹具结果冒充远端来源验收。
   */
  const sourceArgs = process.argv.slice(2)
  assert.ok(sourceArgs.length === 0 || (sourceArgs.length === 2 && sourceArgs[0] === '--source' && sourceArgs[1] === 'local'), 'MVU-B 仅支持受控本地场景（--source local）；不验收真实远端或指定发布根')
  assert.equal(process.platform, 'linux', '本轮只支持 Linux 实验')
  if (!process.env.FOUNDRY_JQ) {
    /**
     * 干净环境先准备独立测试工具，不依赖某次开发遗留的 /tmp 文件。
     */
    const downloaded = spawnSync('curl', ['--disable', '--fail', '--silent', '--show-error', '--location', '--proto', '=https', '--proto-redir', '=https', '--max-time', '60', '--output', jqPath, 'https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64'], { encoding: 'utf8' })
    assert.equal(downloaded.status, 0, `测试工具准备失败：${downloaded.stderr}`)
  }
  assert.equal(digest(fs.readFileSync(jqPath)), '020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d', '测试工具必须是固定版本官方 jq')
  fs.mkdirSync(exported, { recursive: true })
  /**
   * 只复制真实存在的生产文件，首次红灯由真实入口缺失触发。
   */
  for (const name of ['install-skills']) {
    /**
     * 本次交付文件的源码位置。
     */
    const original = process.env.FOUNDRY_MVU_B_SCRIPT_DIR
      ? path.join(process.env.FOUNDRY_MVU_B_SCRIPT_DIR, name)
      : fileURLToPath(new URL(`../../script/${name}`, import.meta.url))
    if (fs.existsSync(original))
      fs.cpSync(original, path.join(exported, name), { recursive: true })
  }
  source = await createHttpsSource(root)
})

after(async () => {
  if (source)
    await source.close()
  fs.rmSync(root, { recursive: true, force: true })
})

/**
 * 独立计算字节摘要，不调用安装器或复用其解析实现。
 * @param {Buffer | string} bytes 原始字节。
 * @returns {string} SHA-256。
 */
function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * 生成最小版本清单和二进制附件，服务端只暴露显式文件。
 * @param {string[]} names 本次源中存在的技能。
 * @returns {object} 临时消费项目与实验材料。
 */
function fixture(names = ['sample-skill']) {
  sequence += 1
  /**
   * 所有实验彼此独立，实际 cwd 不位于仓库内。
   */
  const project = path.join(root, `consumer ${sequence}`)
  fs.mkdirSync(project)
  /**
   * URL 的每次实验前缀仍携带完整提交。
   */
  const prefix = `/${revision}/case-${sequence}`
  /**
   * 对照内容来自测试手写字节，与生产解析无关。
   */
  const files = {}
  /**
   * 发布中的最小技能身份及附件全集。
   */
  const skills = names.map((name) => {
    /**
     * 同一来源内每个技能拥有独立目录。
     */
    const directory = `skills/coding/${name}`
    files[`${directory}/SKILL.md`] = Buffer.from(`---\nname: ${name}\ndescription: 实验技能\n---\n\n完整正文\n`)
    files[`${directory}/references/data.bin`] = Buffer.from([0, 255, 13, 10, 65])
    return { name, category: 'coding', directory, sourceFiles: Object.keys(files).filter(file => file.startsWith(`${directory}/`)), requiresSkills: [] }
  })
  /**
   * 格式与正式模型的公开字段一致；这里只生成最小实验清单。
   */
  const release = {
    schemaVersion: 1,
    version: '0.1.0',
    sourceRevision: revision,
    tools: { skills: '1.7.4', specify: '1.2.6' },
    skills,
    files: Object.entries(files).map(([file, bytes]) => ({ path: file, bytes: bytes.length, sha256: digest(bytes) })),
  }
  /**
   * 保存本次清单到受控源，可在调用前修改清单以注入非法输入。
   */
  function publish() {
    source.files.set(`${prefix}/release.json`, Buffer.from(JSON.stringify(release)))
    /**
     * 单独提供附件，避免压缩包提取规则掩盖路径校验问题。
     */
    for (const [file, bytes] of Object.entries(files))
      source.files.set(`${prefix}/${file}`, bytes)
  }
  publish()
  return { project, prefix, release, files, publish, target: path.join(project, '.agents/skills'), url: `${source.url}${prefix}` }
}

/**
 * 异步运行真实独立脚本，保留同进程 HTTPS 服务的事件循环。
 * @param {object} item 本次夹具。
 * @param {object} options 额外参数、环境与启动回调。
 * @returns {Promise<{code: number | null, signal: string | null, stdout: string, stderr: string}>} 退出和标准流。
 */
function install(item, options = {}) {
  return new Promise((resolve, reject) => {
    /**
     * 默认只请求已实现的 Codex 项目级单技能，来源为真实 HTTPS。
     */
    const args = options.args || ['--source', item.url, '--version', '0.1.0', '--agent', 'codex', ...item.release.skills.flatMap(skill => ['--skill', skill.name])]
    /**
     * 直接从仓库外副本执行 Bash 平台入口。
     */
    const child = spawn('bash', [path.join(exported, 'install-skills/install-skills.sh'), ...args], {
      cwd: item.project,
      env: { ...process.env, GIT_CEILING_DIRECTORIES: root, FOUNDRY_JQ: jqPath, CURL_CA_BUNDLE: source.ca, FOUNDRY_DOWNLOAD_TIMEOUT: '2', ...options.env },
      detached: true,
    })
    /**
     * 真实安装报告。
     */
    let stdout = ''
    /**
     * curl 与安装器的错误诊断。
     */
    let stderr = ''
    child.stdout.on('data', chunk => stdout += chunk)
    child.stderr.on('data', chunk => stderr += chunk)
    child.on('error', reject)
    child.on('close', (code, signal) => resolve({ code, signal, stdout, stderr }))
    options.started?.(child)
  })
}

/**
 * 比较成功安装的每个附件并检查来源未被新增未选技能。
 * @param {object} item 实验夹具。
 * @param {string} name 要核对的单技能。
 */
function assertInstalled(item, name = 'sample-skill') {
  /**
   * 此技能原始目录前缀。
   */
  const prefix = `skills/coding/${name}/`
  /**
   * 完整字节检查同时覆盖正文与二进制附件。
   */
  for (const [file, bytes] of Object.entries(item.files)) {
    if (file.startsWith(prefix))
      assert.deepEqual(fs.readFileSync(path.join(item.target, name, file.slice(prefix.length))), bytes)
  }
}

/**
 * 失败必须有机器可读报告且不能留下可见的残缺技能。
 * @param {object} item 实验夹具。
 * @param {object} result 子进程结果。
 * @param {string} code 预期失败类别。
 */
function assertFailed(item, result, code) {
  assert.notEqual(result.code, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).reasonCode, code, result.stdout + result.stderr)
  assert.equal(fs.existsSync(path.join(item.target, 'sample-skill')), false)
}

test('Linux 仓库外副本通过 HTTPS 安装正文和附件，重复请求复用且不改写', async () => {
  /**
   * 真实成功场景用于首次红灯，不以模拟函数替代安装。
   */
  const item = fixture()
  /**
   * Bash 直接入口的实际结果。
   */
  const first = await install(item)
  assert.equal(first.code, 0, first.stdout + first.stderr)
  assert.equal(JSON.parse(first.stdout).skills[0].status, 'installed')
  assertInstalled(item)
  /**
   * 技能外侧收据及正文不应被第二次请求改写。
   */
  const receipt = path.join(item.target, '.foundry-distribution/receipts/sample-skill.json')
  /**
   * 用 mtime 和字节同时判断幂等复用。
   */
  const beforeReuse = [fs.readFileSync(receipt), fs.statSync(receipt).mtimeMs, fs.statSync(path.join(item.target, 'sample-skill/SKILL.md')).mtimeMs]
  /**
   * 第二次直接调用同一 Bash 入口，验证独立副本的幂等复用。
   */
  const second = await install(item)
  assert.equal(second.code, 0, second.stdout + second.stderr)
  assert.equal(JSON.parse(second.stdout).skills[0].status, 'reused')
  assert.deepEqual([fs.readFileSync(receipt), fs.statSync(receipt).mtimeMs, fs.statSync(path.join(item.target, 'sample-skill/SKILL.md')).mtimeMs], beforeReuse)
  assertInstalled(item)
  assert.equal(fs.existsSync(path.join(item.project, 'node_modules')), false)
  assert.equal(fs.existsSync(path.join(item.project, 'package.json')), false)
})

test('404、截断、超时、摘要篡改和降级重定向均不提交残缺技能', async (t) => {
  /**
   * 每项都破坏真实下载的不同边界。
   */
  for (const mode of ['404', 'truncated', 'timeout', 'digest', 'redirect']) {
    await t.test(mode, async () => {
      /**
       * 每种故障使用全新的消费目录。
       */
      const item = fixture()
      /**
       * 正文成功后在附件注入失败，以验证暂存没有提前提交。
       */
      const key = `${item.prefix}/skills/coding/sample-skill/references/data.bin`
      source.faults.set(key, (_request, response) => {
        if (mode === '404')
          response.writeHead(404).end('missing')
        if (mode === 'truncated') {
          response.writeHead(200, { 'Content-Length': 999 })
          response.end('short')
        }
        if (mode === 'digest')
          response.end('wrong')
        if (mode === 'redirect')
          response.writeHead(302, { Location: 'http://127.0.0.1:9/unsafe' }).end()
      })
      assertFailed(item, await install(item), mode === 'digest' ? 'integrity' : 'download')
    })
  }
})

test('参数、版本、遍历路径和缺工具在目标写入前失败', async (t) => {
  /**
   * 无效清单不能通过动态字段获得目录写入能力。
   */
  for (const mode of ['version', 'traversal', 'duplicate', 'missing-tool', 'http', 'unknown', 'empty', 'no-source', 'two-sources']) {
    await t.test(mode, async () => {
      /**
       * 此组没有任何预先存在的目标目录。
       */
      const item = fixture()
      /**
       * 注入场景所需的 CLI 或工具环境。
       */
      const options = {}
      switch (mode) {
        case 'version':
          item.release.version = '0.2.0'
          break
        case 'traversal':
          item.release.files[0].path = '../escape'
          break
        case 'duplicate':
          item.release.files.push(item.release.files[0])
          break
        case 'missing-tool':
          options.env = { FOUNDRY_JQ: '/not-a-trusted-jq' }
          break
      }
      if (['http', 'unknown', 'empty', 'no-source', 'two-sources'].includes(mode)) {
        options.args = ['--version', '0.1.0', '--agent', 'codex', '--skill', mode === 'unknown' ? 'not-selected' : 'sample-skill']
        if (mode !== 'no-source')
          options.args.push('--source', mode === 'http' ? item.url.replace('https:', 'http:') : item.url)
        if (mode === 'two-sources')
          options.args.push('--source-dir', root)
        if (mode === 'empty')
          options.args = []
      }
      item.publish()
      /**
       * 目标文件系统必须完全未开始写入。
       */
      const result = await install(item, options)
      assert.notEqual(result.code, 0, result.stdout + result.stderr)
      assert.equal(fs.existsSync(path.join(item.project, '.agents')), false)
    })
  }
})

test('未知目录、用户编辑、不同版本和无收据残留均保留原文件', async (t) => {
  /**
   * 这些状态都不能由同名或收据单方面宣称所有权。
   */
  for (const mode of ['unknown', 'edited', 'extra', 'other-version', 'no-receipt']) {
    await t.test(mode, async () => {
      /**
       * 每项保护不同的实际用户状态。
       */
      const item = fixture()
      if (mode === 'unknown') {
        fs.mkdirSync(path.join(item.target, 'sample-skill'), { recursive: true })
        fs.writeFileSync(path.join(item.target, 'sample-skill/SKILL.md'), '用户自己的正文')
      }
      else {
        /**
         * 先完成真实安装，再注入用户改动或版本差异。
         */
        const first = await install(item)
        assert.equal(first.code, 0, first.stdout + first.stderr)
        if (mode === 'edited')
          fs.appendFileSync(path.join(item.target, 'sample-skill/SKILL.md'), '用户编辑')
        if (mode === 'extra')
          fs.writeFileSync(path.join(item.target, 'sample-skill/custom.txt'), '用户新增')
        if (mode === 'other-version') {
          item.release.version = '0.2.0'
          item.publish()
        }
        if (mode === 'no-receipt')
          fs.unlinkSync(path.join(item.target, '.foundry-distribution/receipts/sample-skill.json'))
      }
      /**
       * 请求前的用户字节必须原样保留。
       */
      const previous = fs.readFileSync(path.join(item.target, 'sample-skill/SKILL.md'))
      /**
       * 请求版本与清单保持一致，确保检测真实归属或版本冲突。
       */
      const result = await install(item, { args: ['--source', item.url, '--version', item.release.version, '--agent', 'codex', '--skill', 'sample-skill'] })
      assert.notEqual(result.code, 0, result.stdout + result.stderr)
      assert.deepEqual(fs.readFileSync(path.join(item.target, 'sample-skill/SKILL.md')), previous)
      if (mode === 'extra')
        assert.equal(fs.readFileSync(path.join(item.target, 'sample-skill/custom.txt'), 'utf8'), '用户新增')
    })
  }
})

test('Git 跟踪目标与只读目录拒绝写入，目录链接不会逃逸到其他项目', async (t) => {
  /**
   * 每种场景都用真实文件系统权限或 Git 索引。
   */
  for (const mode of ['tracked', 'readonly', 'symlink']) {
    await t.test(mode, async () => {
      /**
       * 用户状态都位于当前测试自有目录。
       */
      const item = fixture()
      fs.mkdirSync(item.target, { recursive: true })
      if (mode === 'tracked') {
        fs.mkdirSync(path.join(item.target, 'sample-skill'))
        fs.writeFileSync(path.join(item.target, 'sample-skill/SKILL.md'), '跟踪的用户内容')
        assert.equal(spawnSync('git', ['init', item.project]).status, 0)
        assert.equal(spawnSync('git', ['-C', item.project, 'add', '.agents']).status, 0)
        fs.rmSync(path.join(item.target, 'sample-skill'), { recursive: true })
      }
      if (mode === 'readonly')
        fs.chmodSync(item.target, 0o500)
      if (mode === 'symlink') {
        fs.rmdirSync(item.target)
        fs.symlinkSync(root, item.target)
      }
      try {
        /**
         * 跟踪但缺失的工作树文件也不能被安装器恢复或接管。
         */
        const result = await install(item)
        assert.notEqual(result.code, 0, result.stdout + result.stderr)
        assert.equal(fs.existsSync(path.join(item.target, 'sample-skill')), false)
      }
      finally {
        if (mode === 'readonly')
          fs.chmodSync(item.target, 0o700)
      }
    })
  }
})

test('两技能逐项提交时后项下载失败报告 partial，前项完整保留', async () => {
  /**
   * 第一项成功、第二项失败的真实请求。
   */
  const item = fixture(['first-skill', 'second-skill'])
  source.files.delete(`${item.prefix}/skills/coding/second-skill/references/data.bin`)
  /**
   * 跨技能不承诺回滚，报告必须准确描述实际结果。
   */
  const result = await install(item)
  assert.notEqual(result.code, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).overall, 'partial')
  assert.equal(JSON.parse(result.stdout).skills[0].status, 'installed')
  assert.equal(JSON.parse(result.stdout).skills[1].status, 'failed')
  assertInstalled(item, 'first-skill')
  assert.equal(fs.existsSync(path.join(item.target, 'second-skill')), false)
})

test('并发请求被根锁拒绝，提交前出现的同名目标不会被覆盖', async (t) => {
  /**
   * 请求正在下载时，分别制造另一安装进程及用户创建目录。
   */
  for (const mode of ['concurrent', 'target-change', 'interrupt']) {
    await t.test(mode, async () => {
      /**
       * 同一个目录用于观察竞争和中断，其他实验不共享它。
       */
      const item = fixture()
      /**
       * 获知实际下载已经开始后再施加干扰。
       */
      let reached
      /**
       * 正文响应只有测试明确释放后才发送。
       */
      let held
      /**
       * 当前安装的独立进程组。
       */
      let child
      /**
       * 防止入口失效时测试永久等待服务器事件。
       */
      const started = new Promise((resolve, reject) => {
        reached = resolve
        setTimeout(() => reject(new Error('安装未进入真实下载')), 5000).unref()
      })
      source.faults.set(`${item.prefix}/skills/coding/sample-skill/SKILL.md`, (_request, response) => {
        held = response
        reached()
      })
      /**
       * 首个安装进程拥有锁并被服务端暂停。
       */
      const first = install(item, { started: value => child = value })
      await started
      if (mode === 'concurrent')
        assertFailed(item, await install(item), 'locked')
      if (mode === 'target-change') {
        fs.mkdirSync(path.join(item.target, 'sample-skill'))
        fs.writeFileSync(path.join(item.target, 'sample-skill/user.txt'), '并发用户文件')
      }
      if (mode === 'interrupt')
        process.kill(-child.pid, 'SIGTERM')
      else
        held.end(item.files['skills/coding/sample-skill/SKILL.md'])
      /**
       * 竞争失败不能被误报为成功或吞掉。
       */
      const result = await first
      if (mode === 'concurrent') {
        assert.equal(result.code, 0, result.stdout + result.stderr)
        assertInstalled(item)
      }
      else {
        assert.notEqual(result.code, 0, result.stdout + result.stderr)
        if (mode === 'target-change') {
          assert.equal(fs.readFileSync(path.join(item.target, 'sample-skill/user.txt'), 'utf8'), '并发用户文件')
          assert.equal(fs.existsSync(path.join(item.target, 'sample-skill/SKILL.md')), false)
        }
        else {
          assert.equal(fs.existsSync(path.join(item.target, 'sample-skill')), false)
          assert.equal(fs.existsSync(path.join(item.target, '.foundry-distribution/lock')), false)
          assert.deepEqual(fs.readdirSync(path.join(item.target, '.foundry-distribution/staging')), [])
          source.faults.delete(`${item.prefix}/skills/coding/sample-skill/SKILL.md`)
          /**
           * 可处理信号清理后，同样请求必须能够实际续接成功。
           */
          const retry = await install(item)
          assert.equal(retry.code, 0, retry.stdout + retry.stderr)
          assertInstalled(item)
        }
      }
    })
  }
})

test('失效锁保留给用户处理，不自动删除或强行接管', async () => {
  /**
   * 并非本进程创建的锁没有删除授权。
   */
  const item = fixture()
  fs.mkdirSync(path.join(item.target, '.foundry-distribution/lock'), { recursive: true })
  assertFailed(item, await install(item), 'locked')
  assert.equal(fs.existsSync(path.join(item.target, '.foundry-distribution/lock')), true)
})

test('Git 父仓库跟踪与损坏索引不能被当作无仓库而绕过保护', async (t) => {
  /**
   * 真实索引分别验证相对目录基准和 Git 执行错误。
   */
  for (const mode of ['parent-repository', 'broken-index']) {
    await t.test(mode, async () => {
      /**
       * 父仓库和消费目录都属于同一测试临时目录。
       */
      const item = fixture()
      /**
       * 父仓库场景中，当前 cwd 是根仓库内的另一个子目录。
       */
      const repository = mode === 'parent-repository' ? item.project : null
      if (repository) {
        item.project = path.join(repository, 'nested')
        item.target = path.join(item.project, '.agents/skills')
        fs.mkdirSync(item.project)
      }
      assert.equal(spawnSync('git', ['init', repository || item.project]).status, 0)
      if (mode === 'parent-repository') {
        fs.mkdirSync(path.join(item.target, 'sample-skill'), { recursive: true })
        fs.writeFileSync(path.join(item.target, 'sample-skill/SKILL.md'), '父仓库跟踪的文件')
        assert.equal(spawnSync('git', ['-C', repository, 'add', 'nested']).status, 0)
        fs.rmSync(path.join(item.project, '.agents'), { recursive: true })
      }
      else {
        fs.writeFileSync(path.join(item.project, '.git/index'), '损坏的索引')
      }
      /**
       * 不能在未可靠检查 Git 的情况下提交文件。
       */
      const result = await install(item)
      assert.notEqual(result.code, 0, result.stdout + result.stderr)
      assert.equal(fs.existsSync(path.join(item.project, '.agents')), false)
    })
  }
})

test('本地同版来源可以安装，符号链接来源与未信任的 HTTPS 均拒绝', async (t) => {
  /**
   * 本地复制和 HTTPS 信任使用真实工具，互不借用宽松 TLS。
   */
  for (const mode of ['local', 'source-link', 'untrusted-tls', 'curl-config']) {
    await t.test(mode, async () => {
      /**
       * 清单字节与远端来源相同，只切换读取入口。
       */
      const item = fixture()
      /**
       * 此实验的本地同版发布根。
       */
      const local = path.join(root, `local-${sequence}`)
      fs.mkdirSync(local)
      fs.writeFileSync(path.join(local, 'release.json'), JSON.stringify(item.release))
      /**
       * 实际技能文件及二进制附件。
       */
      for (const [file, bytes] of Object.entries(item.files)) {
        fs.mkdirSync(path.dirname(path.join(local, file)), { recursive: true })
        fs.writeFileSync(path.join(local, file), bytes)
      }
      if (mode === 'source-link') {
        fs.unlinkSync(path.join(local, 'skills/coding/sample-skill/SKILL.md'))
        fs.symlinkSync(path.join(local, 'release.json'), path.join(local, 'skills/coding/sample-skill/SKILL.md'))
      }
      if (mode === 'curl-config')
        fs.writeFileSync(path.join(local, '.curlrc'), 'insecure\n')
      /**
       * 不传测试 CA 时必须由 curl 的真实 TLS 校验拒绝。
       */
      const result = ['untrusted-tls', 'curl-config'].includes(mode)
        ? await install(item, { env: { CURL_CA_BUNDLE: '', CURL_HOME: local } })
        : await install(item, { args: ['--source-dir', local, '--version', '0.1.0', '--agent', 'codex', '--skill', 'sample-skill'] })
      if (mode === 'local') {
        assert.equal(result.code, 0, result.stdout + result.stderr)
        assertInstalled(item)
      }
      else {
        assertFailed(item, result, 'download')
      }
    })
  }
})

test('自动准备 jq 验证真实二进制摘要，失败时不进入技能提交', async (t) => {
  /**
   * 下载仍通过真实 curl 和本地 HTTPS，仅将官方地址路由到可控测试源。
   */
  for (const mode of ['valid', 'bad-digest', 'unavailable']) {
    await t.test(mode, async () => {
      /**
       * 每次都是没有目标技能的独立消费项目。
       */
      const item = fixture()
      /**
       * 唯一被重定向的外部下载资源。
       */
      const toolUrl = `/jq-${sequence}`
      if (mode !== 'unavailable')
        source.files.set(toolUrl, mode === 'valid' ? fs.readFileSync(jqPath) : Buffer.from('不能执行的错误工具'))
      /**
       * 替身只替换网络边界地址，不实现任何安装或校验逻辑。
       */
      const bin = path.join(root, `bin-${sequence}`)
      fs.mkdirSync(bin)
      fs.writeFileSync(path.join(bin, 'curl'), `#!/usr/bin/env bash
args=("$@")
for index in "\${!args[@]}"; do
  if [[ "\${args[$index]}" == https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64 ]]; then
    args[$index]="$FOUNDRY_TEST_JQ_URL"
  fi
done
exec "$FOUNDRY_TEST_CURL" "\${args[@]}"
`, { mode: 0o700 })
      /**
       * 在干净的工具目录内自动下载，未使用预先传入的 jq。
       */
      const result = await install(item, {
        env: {
          FOUNDRY_JQ: '',
          FOUNDRY_TEST_JQ_URL: `${source.url}${toolUrl}`,
          FOUNDRY_TEST_CURL: spawnSync('which', ['curl'], { encoding: 'utf8' }).stdout.trim(),
          PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        },
      })
      if (mode === 'valid') {
        assert.equal(result.code, 0, result.stdout + result.stderr)
        assertInstalled(item)
      }
      else {
        assertFailed(item, result, 'prerequisite')
        assert.equal(fs.existsSync(path.join(item.project, '.agents')), false)
      }
    })
  }
})

test('继承的 Git 环境及已删除的跟踪祖先不能绕过默认索引保护', async (t) => {
  /**
   * 每项都应读取实际消费仓库的默认索引，不能受外部环境重定向。
   */
  for (const mode of ['GIT_INDEX_FILE', 'GIT_DIR', 'GIT_WORK_TREE', 'ancestor-agents', 'ancestor-skills']) {
    await t.test(mode, async () => {
      /**
       * 当前项目和替代仓库都位于实验拥有的目录内。
       */
      const item = fixture()
      assert.equal(spawnSync('git', ['init', item.project]).status, 0)
      if (mode === 'ancestor-agents') {
        fs.writeFileSync(path.join(item.project, '.agents'), '跟踪的普通文件')
      }
      else if (mode === 'ancestor-skills') {
        fs.mkdirSync(path.join(item.project, '.agents'))
        fs.writeFileSync(item.target, '跟踪的普通文件')
      }
      else {
        fs.mkdirSync(path.join(item.target, 'sample-skill'), { recursive: true })
        fs.writeFileSync(path.join(item.target, 'sample-skill/SKILL.md'), '默认索引跟踪的文件')
      }
      assert.equal(spawnSync('git', ['-C', item.project, 'add', '.agents']).status, 0)
      fs.rmSync(path.join(item.project, '.agents'), { recursive: true, force: true })
      /**
       * 保护检查不得修改默认索引。
       */
      const index = fs.readFileSync(path.join(item.project, '.git/index'))
      /**
       * 替代索引或仓库不能被当作实际用户状态。
       */
      const env = {}
      if (mode === 'GIT_INDEX_FILE')
        env.GIT_INDEX_FILE = path.join(root, `missing-index-${sequence}`)
      if (['GIT_DIR', 'GIT_WORK_TREE'].includes(mode)) {
        /**
         * 初始化一个无跟踪技能的外部仓库，验证实际检查没有被重定向。
         */
        const alternate = path.join(root, `alternate-${sequence}`)
        fs.mkdirSync(alternate)
        assert.equal(spawnSync('git', ['init', alternate]).status, 0)
        env[mode] = mode === 'GIT_DIR' ? path.join(alternate, '.git') : alternate
      }
      /**
       * 跟踪文件即使已从工作树删除，也不能被安装器重建成目录。
       */
      const result = await install(item, { env })
      assert.notEqual(result.code, 0, result.stdout + result.stderr)
      assert.equal(fs.existsSync(path.join(item.project, '.agents')), false)
      assert.deepEqual(fs.readFileSync(path.join(item.project, '.git/index')), index)
    })
  }
})

test('其他已跟踪技能保持原样，不阻止安装不同的未跟踪技能', async () => {
  /**
   * 不将祖先保护扩大成拒绝整个 .agents 目录。
   */
  const item = fixture()
  fs.mkdirSync(path.join(item.target, 'other-skill'), { recursive: true })
  fs.writeFileSync(path.join(item.target, 'other-skill/SKILL.md'), '保留的跟踪技能')
  assert.equal(spawnSync('git', ['init', item.project]).status, 0)
  assert.equal(spawnSync('git', ['-C', item.project, 'add', '.agents']).status, 0)
  /**
   * 实际索引字节和无关技能字节都不应发生变化。
   */
  const index = fs.readFileSync(path.join(item.project, '.git/index'))
  /**
   * 本次选择只含新技能。
   */
  const result = await install(item)
  assert.equal(result.code, 0, result.stdout + result.stderr)
  assertInstalled(item)
  assert.equal(fs.readFileSync(path.join(item.target, 'other-skill/SKILL.md'), 'utf8'), '保留的跟踪技能')
  assert.deepEqual(fs.readFileSync(path.join(item.project, '.git/index')), index)
})
