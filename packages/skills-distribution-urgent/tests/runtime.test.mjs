import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { resolveInvocation } from '../script/index.mjs'
import { readOnlineAgents, resolveOfficialSource } from '../script/install-skills/read-agents.mjs'
import { createReleaseFixture, createUrgentSandbox, installFixture, packageRoot, runCommand, snapshotTree } from './helpers/urgent-sandbox.mjs'

test('固定来源保留同版子目录，拒绝错身份和URL规范化歧义', () => {
  /**
   * 子目录不得把 raw/tree 根解析成不同仓库或提交。
   */
  const revision = 'c'.repeat(40)
  assert.deepEqual(resolveOfficialSource(`https://github.com/owner/repository/tree/${revision}/release/public`), { repository: 'owner/repository', publishedRevision: revision, officialSkillsRoot: `https://github.com/owner/repository/tree/${revision}/release/public`, rawRoot: `https://raw.githubusercontent.com/owner/repository/${revision}/release/public` })
  /**
   * 每个输入分别触及用户信息、转义、空段和 competing revision。
   */
  const sources = [`https://github.com/user@owner/repository/tree/${revision}`, `https://raw.githubusercontent.com/owner/repository.git/${revision}`, `https://github.com/owner/repository/tree/${revision}/a//b`, `https://github.com/owner/repository/tree/${revision}/%2F`, `https://github.com/owner/repository/tree/${revision}/a#fragment`, `https://github.com/owner/repository/tree/${revision}/${'d'.repeat(40)}`, `https://github.com/owner/repository/tree/${revision}/./a`]
  /**
   * 逐项验证非法来源，避免仅覆盖第一个失败分支。
   */
  for (const source of sources)
    assert.throws(() => resolveOfficialSource(source), Error)
})

test('在线规则网络与完整性失败不回退、不写入消费目录', async () => {
  /**
   * 原始消费目录只有哨兵，任何缓存或状态新增都会被完整快照发现。
   */
  const sandbox = createUrgentSandbox()
  try {
    fs.writeFileSync(path.join(sandbox.project, 'sentinel'), '保留')
    /**
     * 完整隔离根在调用前后的字节和目录事实保持相同。
     */
    const before = snapshotTree(sandbox.root)
    /**
     * HTTP故障只在请求边界注入，不伪造路径或完整性结果。
     */
    async function networkFailure() {
      throw new Error('网络不可达')
    }
    await assert.rejects(() => readOnlineAgents({ request: networkFailure, cwd: sandbox.project, userHome: sandbox.userHome }), /网络不可达/u)
    await assert.rejects(() => readOnlineAgents({ request: async url => url.endsWith('/latest') ? { ok: true, json: async () => ({ name: 'skills', version: '99.0.0', dist: { tarball: 'https://registry.npmjs.org/skills/-/skills-99.0.0.tgz', integrity: `sha512-${createHash('sha512').update('expected').digest('base64')}` } }) } : { ok: true, arrayBuffer: async () => Buffer.from('changed') }, cwd: sandbox.project, userHome: sandbox.userHome }), /integrity/u)
    assert.deepEqual(snapshotTree(sandbox.root), before)
  }
  finally { sandbox.cleanup() }
})

/**
 * 对普通入口制造不同的实际文件故障，所有故障均须保留用户现场。
 */
const corruptions = [
  ['缺附件', (sandbox, fixture) => fs.rmSync(path.join(sandbox.project, '.agents/skills', fixture.release.skills[0].name, 'references/content.bin'))],
  ['用户修改', (sandbox, fixture) => fs.appendFileSync(path.join(sandbox.project, '.agents/skills', fixture.release.skills[0].name, 'SKILL.md'), '\n用户修改\n')],
  ['额外文件', (sandbox, fixture) => fs.writeFileSync(path.join(sandbox.project, '.agents/skills', fixture.release.skills[0].name, 'custom.txt'), '保留')],
  ['脚本错版', (_sandbox, fixture) => fs.appendFileSync(path.join(fixture.root, 'script/index.mjs'), '\n// 不同版本\n')],
  ['正文错版', (sandbox, fixture) => fs.writeFileSync(path.join(sandbox.project, '.agents/skills', fixture.release.skills[0].name, 'SKILL.md'), '---\nname: document-changed-symbols\n---\n另一版本正文\n')],
]
/**
 * 每项破坏都使用独立测试身份与独立修改函数。
 */
for (const [label, corrupt] of corruptions) {
  test(`普通第二步拒绝${label}且目标字节不变`, () => {
    /**
     * 当前场景拥有全部文件，不访问真实用户项目。
     */
    const sandbox = createUrgentSandbox()
    try {
      /**
       * 先安装完整内容，再制造一个与本版摘要不同的现场。
       */
      const fixture = createReleaseFixture(sandbox)
      installFixture(sandbox, fixture)
      corrupt(sandbox, fixture)
      /**
       * 快照保留故障后的用户内容，产品不得回滚或覆盖它。
       */
      const before = snapshotTree(sandbox.project)
      /**
       * 通过真实Node与Bash分派检查错误，不调用内部函数代替入口。
       */
      const result = runCommand(sandbox, process.execPath, [path.join(fixture.root, 'script/index.mjs'), '--source-dir', fixture.root, '--version', '0.1.0', '--agent', 'codex', '--skill', fixture.release.skills[0].name, '--project', sandbox.project])
      assert.notEqual(result.status, 0, result.stderr + result.stdout)
      /**
       * 阶段报告明确把完整性失败与未执行下游分开。
       */
      const report = JSON.parse(result.stdout)
      assert.equal(report.stages.integrity.status, 'failed')
      assert.equal(report.stages.hooks.status, 'not-run')
      assert.equal(report.stages.commands.status, 'not-run')
      assert.deepEqual(snapshotTree(sandbox.project), before)
    }
    finally { sandbox.cleanup() }
  })
}

test('Increment缺本次显式依赖时不补装或执行挂载', () => {
  /**
   * 即使历史文件都存在，未选依赖仍需明确失败。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 历史完整安装不能自动扩充本次用户选择。
     */
    const fixture = createReleaseFixture(sandbox, { workflow: true })
    installFixture(sandbox, fixture)
    /**
     * 项目快照包含已装但未选的依赖。
     */
    const before = snapshotTree(sandbox.project)
    /**
     * 只选Increment，故意缺少两个显式依赖参数。
     */
    const result = runCommand(sandbox, process.execPath, [path.join(fixture.root, 'script/index.mjs'), '--source-dir', fixture.root, '--version', '0.1.0', '--agent', 'codex', '--skill', 'task-increment', '--project', sandbox.project])
    assert.notEqual(result.status, 0)
    assert.equal(JSON.parse(result.stdout).reasonCode, 'dependency')
    assert.deepEqual(snapshotTree(sandbox.project), before)
  }
  finally { sandbox.cleanup() }
})

test('同包摘要正确但Agent声明布局变化时明确失败且不写缓存', async () => {
  /**
   * 伪造发布包只模拟受校验数据布局，绝不执行CLI或替代真实官方集成。
   */
  const sandbox = createUrgentSandbox()
  try {
    fs.mkdirSync(path.join(sandbox.root, 'upstream/package/dist/_chunks/libs'), { recursive: true })
    fs.writeFileSync(path.join(sandbox.root, 'upstream/package/package.json'), '{"name":"skills","version":"99.0.0"}')
    fs.writeFileSync(path.join(sandbox.root, 'upstream/package/dist/_chunks/remove.mjs'), 'const changedLayout = true;\n')
    fs.writeFileSync(path.join(sandbox.root, 'upstream/package/dist/_chunks/libs/xdg-basedir.mjs'), '')
    /**
     * 真实tar数据由隔离目录生成，完整性摘要针对其原始字节。
     */
    const archivePath = path.join(sandbox.root, 'upstream.tgz')
    assert.equal(runCommand(sandbox, 'tar', ['-czf', archivePath, '-C', path.join(sandbox.root, 'upstream'), 'package']).status, 0)
    /**
     * 包内容完整，但缺失官方路径声明边界。
     */
    const archive = fs.readFileSync(archivePath)
    /**
     * 模拟HTTP边界只返回本测试自有的版本与字节。
     */
    const request = async url => url.endsWith('/latest') ? { ok: true, json: async () => ({ name: 'skills', version: '99.0.0', dist: { tarball: 'https://registry.npmjs.org/skills/-/skills-99.0.0.tgz', integrity: `sha512-${createHash('sha512').update(archive).digest('base64')}` } }) } : { ok: true, arrayBuffer: async () => archive }
    /**
     * 失败不产生npm缓存、旧表快照或安装收据。
     */
    const before = snapshotTree(sandbox.root)
    await assert.rejects(() => readOnlineAgents({ request, cwd: sandbox.project, userHome: sandbox.userHome }), /官方 Agent 配置布局已变化/u)
    assert.deepEqual(snapshotTree(sandbox.root), before)
  }
  finally { sandbox.cleanup() }
})

test('本次真实latest规则使用同包SRI并保持完整消费目录零写入', async () => {
  /**
   * 真实网络查询与目标项目隔离，不依赖旧版本响应。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 将缓存、用户目录及临时目录一起纳入零写入比较。
     */
    const before = snapshotTree(sandbox.root)
    /**
     * 完整性检查由产品真实下载同一发布包执行。
     */
    const result = await readOnlineAgents({ cwd: sandbox.project, userHome: sandbox.userHome })
    assert.equal(result.upstream.package, 'skills')
    assert.equal(result.upstream.channel, 'latest')
    assert.match(result.upstream.version, /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/u)
    assert.match(result.upstream.integrity, /^sha512-[\w+/]+=*$/u)
    assert.deepEqual(result.agents.filter(agent => agent.name === 'codex'), [{ name: 'codex', skillsDir: '.agents/skills', project: path.join(sandbox.project, '.agents/skills'), global: path.join(sandbox.userHome, '.agents/skills'), projection: 'identity' }])
    assert.deepEqual(snapshotTree(sandbox.root), before)
  }
  finally { sandbox.cleanup() }
})

/**
 * 仅替换HTTP传输边界；所读清单与正文都是本用例明确的隔离样本。
 * 该材料不能证明真实GitHub公开来源可用。
 * @param {object} sandbox 当前自有沙箱。
 * @param {object} fixture 当前样本发布目录。
 */
function preparePreflightTransport(sandbox, fixture) {
  fs.writeFileSync(path.join(sandbox.root, 'bin/curl'), `#!/usr/bin/env bash
set -euo pipefail
url="\${@: -1}"
relative="\${url#https://raw.githubusercontent.com/owner/repository/cccccccccccccccccccccccccccccccccccccccc/release/payload/}"
[[ "$relative" != "$url" && "$relative" != *..* ]] || exit 61
cat -- "$URGENT_PREFLIGHT_FIXTURE/$relative"
`, { mode: 0o700 })
  fs.writeFileSync(path.join(sandbox.root, 'bin/npx'), '#!/bin/sh\nprintf "unexpected npx" > "$TMPDIR/npx-was-run"\nexit 62\n', { mode: 0o700 })
  sandbox.env.URGENT_PREFLIGHT_FIXTURE = fixture.root
}

/**
 * 整包、分类、单项和多项建议各自在独立目录校验。
 */
const preflightSelections = [
  ['整包', ['--all'], ['artifact-spec-analysis', 'implementation-preparation', 'task-increment']],
  ['分类', ['--category', 'workflow'], ['artifact-spec-analysis', 'implementation-preparation', 'task-increment']],
  ['单项', ['--skill', 'artifact-spec-analysis'], ['artifact-spec-analysis']],
  ['多项', ['--skill', 'artifact-spec-analysis', '--skill', 'implementation-preparation'], ['artifact-spec-analysis', 'implementation-preparation']],
]
for (const [label, selection, names] of preflightSelections) {
  test(`固定发布根${label}只读建议绑定本次版本、明确选择及复制模式`, () => {
    /**
     * 传输材料及目标、缓存、技能安装根属于本次用例。
     */
    const sandbox = createUrgentSandbox()
    try {
      /**
       * 工作流样本只验证选择与建议，未冒充完整九技能或真实远端。
       */
      const fixture = createReleaseFixture(sandbox, { workflow: true })
      preparePreflightTransport(sandbox, fixture)
      /**
       * 预检禁止运行npx或在任何自有目录产生新状态。
       */
      const before = snapshotTree(sandbox.root)
      /**
       * 唯一Node入口真实保留cwd并调用Bash预检。
       */
      const result = runCommand(sandbox, process.execPath, [path.join(fixture.root, 'script/index.mjs'), '--source', 'https://github.com/owner/repository/tree/cccccccccccccccccccccccccccccccccccccccc/release/payload', '--version', '0.1.0', '--agent', 'codex', '--project', sandbox.project, '--check', '--official', ...selection])
      assert.equal(result.status, 0, result.stderr + result.stdout)
      /**
       * 建议中的CLI版本只能来自本次实际线上响应。
       */
      const report = JSON.parse(result.stdout)
      assert.deepEqual(report.selection.names, names)
      assert.equal(report.target.agent, 'codex')
      assert.equal(report.target.scope, 'project')
      assert.equal(report.target.path, path.join(sandbox.project, '.agents/skills'))
      assert.equal(report.official.command, 'npx')
      assert.equal(report.official.args[0], `skills@${report.upstream.version}`)
      assert.ok(report.official.args[2].startsWith('https://github.com/owner/repository/tree/cccccccccccccccccccccccccccccccccccccccc/release/payload'))
      assert.deepEqual(report.official.args.slice(report.official.args.indexOf('--skill') + 1, report.official.args.indexOf('--agent')), names)
      assert.deepEqual(report.official.args.slice(-3), ['--agent', 'codex', '--copy'])
      assert.equal(report.official.args.includes('--global'), false)
      assert.equal(report.stages.installation.status, 'not-run')
      assert.equal(report.stages.preflight.status, 'success')
      assert.deepEqual(snapshotTree(sandbox.root), before)
    }
    finally { sandbox.cleanup() }
  })
}

test('无收据完整普通技能通过正常入口并连续复用两次且用户字节保持', () => {
  /**
   * 已安装样本只用于第二步校验；真实官方安装器由T082单独验收。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 完整正文附件与本次同版脚本从独立样本复制。
     */
    const fixture = createReleaseFixture(sandbox)
    installFixture(sandbox, fixture)
    fs.writeFileSync(path.join(sandbox.project, 'user-notes.txt'), '无关用户内容必须保留\n')
    /**
     * 未创建收据、临时安装目录或Spec Kit配置。
     */
    const before = snapshotTree(sandbox.project)
    for (let attempt = 0; attempt < 2; attempt++) {
      /**
       * 正常调用不传no-mount，不使用预检替代完整性核验。
       */
      const result = runCommand(sandbox, process.execPath, [path.join(fixture.root, 'script/index.mjs'), '--source-dir', fixture.root, '--version', '0.1.0', '--agent', 'codex', '--skill', 'document-changed-symbols', '--project', sandbox.project])
      assert.equal(result.status, 0, result.stdout + result.stderr)
      /**
       * 普通技能无适用挂载，只保留其已实际完成的安装文件核验。
       */
      const report = JSON.parse(result.stdout)
      assert.equal(report.overall, 'success')
      assert.equal(report.stages.installation.status, 'success')
      assert.equal(report.stages.integrity.status, 'success')
      assert.deepEqual(report.verifiedSkills, ['document-changed-symbols'])
      assert.equal(report.stages.hooks.reasonCode, 'not-applicable')
      assert.equal(report.stages.commands.reasonCode, 'not-applicable')
      assert.equal(report.stages.loading.status, 'not-run')
      assert.deepEqual(snapshotTree(sandbox.project), before)
    }
  }
  finally { sandbox.cleanup() }
})

/**
 * 不支持的目标与错误位置均须在依赖挂载前失败。
 */
const unsupportedTargets = [
  ['全局', ['--global']],
  ['其他Agent', ['--agent', 'claude-code']],
  ['错误安装根', ['--installed-root', '/tmp/urgent-wrong-install-root']],
]
for (const [label, extra] of unsupportedTargets) {
  test(`普通入口拒绝${label}且不改变已装用户目录`, () => {
    /**
     * 每个不支持组合独占目录，避免共享目标隐藏副作用。
     */
    const sandbox = createUrgentSandbox()
    try {
      /**
       * 原有同版内容保持有效，仅改变目标参数。
       */
      const fixture = createReleaseFixture(sandbox)
      installFixture(sandbox, fixture)
      /**
       * 错误参数后任何目录或字节变更都不允许。
       */
      const before = snapshotTree(sandbox.project)
      /**
       * 通过实际入口取得真实拒绝与阶段结果。
       */
      const result = runCommand(sandbox, process.execPath, [path.join(fixture.root, 'script/index.mjs'), '--source-dir', fixture.root, '--version', '0.1.0', '--agent', 'codex', '--skill', 'document-changed-symbols', '--project', sandbox.project, ...extra])
      assert.notEqual(result.status, 0)
      /**
       * 下游未调用不能由失败后伪造一个成功覆盖。
       */
      const report = JSON.parse(result.stdout)
      assert.equal(report.stages.hooks.status, 'not-run')
      assert.equal(report.stages.commands.status, 'not-run')
      assert.deepEqual(snapshotTree(sandbox.project), before)
    }
    finally { sandbox.cleanup() }
  })
}

test('Node分派只支持Linux且保留随包模块位置', () => {
  assert.deepEqual(resolveInvocation('linux', '/tmp/urgent-delivery/script'), { command: 'bash', args: ['/tmp/urgent-delivery/script/install-skills/install-skills.sh'] })
  assert.throws(() => resolveInvocation('win32', '/tmp/urgent-delivery/script'), /不支持的操作系统/u)
  assert.throws(() => resolveInvocation('darwin', '/tmp/urgent-delivery/script'), /不支持的操作系统/u)
})

/**
 * 固定来源预检的错误参数不应产生可执行建议或任何安装状态。
 */
const rejectedPreflights = [
  ['非完整SHA', '--source', 'https://github.com/owner/repository/tree/ccccccccccccccccccccccccccccccccccccccc', ['--all']],
  ['来源歧义', '--source', 'https://github.com/owner/repository/tree/cccccccccccccccccccccccccccccccccccccccc/a//b', ['--all']],
  ['非GitHub根', '--source', 'https://example.invalid/owner/repository/cccccccccccccccccccccccccccccccccccccccc', ['--all']],
  ['内部分类', '--source', 'https://github.com/owner/repository/tree/cccccccccccccccccccccccccccccccccccccccc/release/payload', ['--category', 'eval']],
  ['内部技能', '--source', 'https://github.com/owner/repository/tree/cccccccccccccccccccccccccccccccccccccccc/release/payload', ['--skill', 'eval-short-rule']],
  ['未知技能', '--source', 'https://github.com/owner/repository/tree/cccccccccccccccccccccccccccccccccccccccc/release/payload', ['--skill', 'unknown-skill']],
  ['非项目级', '--source', 'https://github.com/owner/repository/tree/cccccccccccccccccccccccccccccccccccccccc/release/payload', ['--all', '--global']],
  ['依赖未显式选择', '--source', 'https://github.com/owner/repository/tree/cccccccccccccccccccccccccccccccccccccccc/release/payload', ['--skill', 'task-increment']],
]
for (const [label, sourceFlag, source, selection] of rejectedPreflights) {
  test(`官方预检拒绝${label}且无建议、目标及缓存零写入`, () => {
    /**
     * 每次只引入一种无效请求，其他材料保持合法。
     */
    const sandbox = createUrgentSandbox()
    try {
      /**
       * 边界传输只提供独立样本，并设置npx执行哨兵。
       */
      const fixture = createReleaseFixture(sandbox, { workflow: true })
      preparePreflightTransport(sandbox, fixture)
      /**
       * 整个自有根都纳入比较，包含npm缓存和工具暂存位置。
       */
      const before = snapshotTree(sandbox.root)
      /**
       * 通过正式参数入口执行实际失败分支。
       */
      const result = runCommand(sandbox, process.execPath, [path.join(fixture.root, 'script/index.mjs'), sourceFlag, source, '--version', '0.1.0', '--agent', 'codex', '--check', '--official', ...selection])
      assert.notEqual(result.status, 0)
      /**
       * 失败报告不能携带看似可运行的安装命令。
       */
      const report = JSON.parse(result.stdout)
      assert.equal(report.overall, 'failed')
      assert.equal(report.official, undefined)
      assert.equal(report.stages.preflight.status, 'failed')
      assert.equal(report.stages.installation.status, 'not-run')
      assert.deepEqual(snapshotTree(sandbox.root), before)
    }
    finally { sandbox.cleanup() }
  })
}

/**
 * 原字节复制当前Node入口，仅将其Bash子进程替换为本次调度边界探针。
 * @param {object} sandbox 当前自有项目及临时根。
 * @param {string} shellBody 探针的Bash正文。
 * @returns {string} 当前入口副本路径。
 */
function prepareDispatchProbe(sandbox, shellBody) {
  /**
   * 调度材料与候选、真实安装目标分开，不能冒充完整挂载。
   */
  const delivery = path.join(sandbox.root, 'dispatch/script')
  fs.mkdirSync(path.join(delivery, 'install-skills'), { recursive: true })
  fs.copyFileSync(path.join(packageRoot, 'script/index.mjs'), path.join(delivery, 'index.mjs'))
  fs.writeFileSync(path.join(delivery, 'install-skills/install-skills.sh'), `#!/usr/bin/env bash\n${shellBody}`)
  return path.join(delivery, 'index.mjs')
}

test('当前Node入口真实保留Bash参数、cwd、输出和非零退出码', () => {
  /**
   * 参数中保留空格与shell字符，不能被二次展开。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 探针只输出接收事实，不模拟安装或官方注册成功。
     */
    const entry = prepareDispatchProbe(sandbox, 'printf "%s\\n" "$PWD"\nprintf "<%s>\\n" "$@"\nprintf "dispatch-stderr" >&2\nexit 23\n')
    /**
     * 唯一入口将数组原样交给Bash。
     */
    const result = runCommand(sandbox, process.execPath, [entry, '--skill', 'value with spaces;*'])
    assert.equal(result.status, 23)
    assert.equal(result.stdout, `${sandbox.project}\n<--skill>\n<value with spaces;*>\n`)
    assert.equal(result.stderr, 'dispatch-stderr')
  }
  finally { sandbox.cleanup() }
})

test('当前Node入口取消时真实通知Bash进程组并返回143', async () => {
  /**
   * 取消只影响本次独占探针进程，不接触其他工作区进程。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * Bash准备后才发信号，避免把启动失败误作取消成功。
     */
    const entry = prepareDispatchProbe(sandbox, 'trap \'printf "dispatch-cancelled" >&2; exit 143\' TERM\nprintf "dispatch-ready"\nsleep 20\n')
    /**
     * Node入口仍执行真实转发与监听器清理逻辑。
     */
    const child = spawn(process.execPath, [entry, '--skill', 'cancel-probe'], { cwd: sandbox.project, env: sandbox.env })
    /**
     * 子进程退出与stderr必须共同证明Bash收到了取消。
     */
    const result = await new Promise((resolve, reject) => {
      /**
       * 缓冲只保留本次探针的诊断输出。
       */
      let stderr = ''
      /**
       * 只在明确就绪后发送一次取消。
       */
      let cancelled = false
      /**
       * 超时只作为失败清理，不制造通过信号。
       */
      const timer = setTimeout(() => {
        child.kill('SIGTERM')
        reject(new Error('Node取消探针未在5秒内完成'))
      }, 5000)
      child.stderr.on('data', chunk => stderr += chunk.toString())
      child.stdout.on('data', (chunk) => {
        if (!cancelled && chunk.toString().includes('dispatch-ready')) {
          cancelled = true
          child.kill('SIGTERM')
        }
      })
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code, signal) => {
        clearTimeout(timer)
        resolve({ code, signal, stderr, cancelled })
      })
    })
    assert.equal(result.cancelled, true)
    assert.equal(result.code, 143)
    assert.equal(result.signal, null)
    assert.match(result.stderr, /dispatch-cancelled/u)
  }
  finally { sandbox.cleanup() }
})
