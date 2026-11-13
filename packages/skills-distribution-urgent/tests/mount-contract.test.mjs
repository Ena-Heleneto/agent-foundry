import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { readOnlineAgents } from '../script/install-skills/read-agents.mjs'
import { createReleaseFixture, createUrgentSandbox, describeFixtureFile, packageRoot, runCommand, snapshotTree } from './helpers/urgent-sandbox.mjs'

/**
 * 正常链显式选择三个当前hook及仅Increment，不补装暂停模式。
 */
const workflowNames = ['artifact-spec-analysis', 'implementation-preparation', 'artifact-project-description', 'task-increment']

/**
 * 使用当前源码脚本建立明确的技术汇合样本，或复制已重建的真实候选。
 * 不修改真实dist或将样本源码身份冒称正式候选。
 * @param {object} sandbox 当前独占目录。
 * @returns {object} 同版材料根、清单及证据范围。
 */
function preparePayload(sandbox) {
  if (process.env.URGENT_CANDIDATE_ROOT) {
    /**
     * 最终复验只接收与本次源码入口原字节相同的已重建材料。
     */
    const source = path.resolve(process.env.URGENT_CANDIDATE_ROOT)
    assert.deepEqual(fs.readFileSync(path.join(source, 'script/mount-entry/mount-entry.sh')), fs.readFileSync(path.join(packageRoot, 'script/mount-entry/mount-entry.sh')), '候选入口与当前源码不同，先重新冻结并构建')
    /**
     * 所有故障只修改副本，真实候选保持原样。
     */
    const root = path.join(sandbox.root, 'payload')
    fs.cpSync(source, root, { recursive: true })
    return { root, release: JSON.parse(fs.readFileSync(path.join(root, 'release.json'), 'utf8')), scope: 'rebuilt-candidate' }
  }
  /**
   * 公共helper只提供样本骨架，正式源码脚本由其原字节复制。
   */
  const fixture = createReleaseFixture(sandbox, { workflow: true })
  fs.rmSync(path.join(fixture.root, 'skills'), { recursive: true })
  for (const name of workflowNames)
    fs.cpSync(path.join(packageRoot, 'src/workflow', name), path.join(fixture.root, 'skills/workflow', name), { recursive: true })
  fs.copyFileSync(path.join(packageRoot, 'src/workflow/collection.config.json'), path.join(fixture.root, 'script/config/workflow/collection.config.json'))
  fs.rmSync(path.join(fixture.root, 'release.json'))
  /**
   * 独立原始文件索引不调用产品构建器生成自身期望。
   */
  const files = Object.keys(snapshotTree(fixture.root)).filter(relative => fs.lstatSync(path.join(fixture.root, relative)).isFile()).map(relative => describeFixtureFile(fixture.root, relative)).sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
  fixture.release.files = files
  fixture.release.adapters = files.filter(file => file.path.startsWith('script/'))
  fixture.release.skills = workflowNames.map((name) => {
    /**
     * 每项正文与附件由当前实际源目录决定，依赖只声明不自动安装。
     */
    const sourceFiles = files.filter(file => file.path.startsWith(`skills/workflow/${name}/`)).map(file => file.path)
    return { name, category: 'workflow', directory: `skills/workflow/${name}`, sourceFiles, installedFilesByProjection: { identity: sourceFiles.map(file => file.slice(`skills/workflow/${name}/`.length)) }, requiresSkills: name === 'task-increment' ? ['artifact-spec-analysis', 'implementation-preparation'] : [], projectPrerequisites: [], mountMappingIds: name === 'task-increment' ? ['increment'] : [name] }
  })
  fixture.release.projections.identity = Object.fromEntries(workflowNames.map(name => [name, files.filter(file => file.path.startsWith(`skills/workflow/${name}/`)).map(file => ({ ...file, path: file.path.slice(`skills/workflow/${name}/`.length), sourcePath: file.path }))]))
  fixture.save()
  return { ...fixture, scope: 'current-source-script-fixture' }
}

/**
 * 只转发到调用方已准备的真实Specify1.2.6，不安装或伪造工具结果。
 * @param {object} sandbox 当前独占项目。
 */
function prepareSpecify(sandbox) {
  /**
   * 缺实际工具是前提失败，不能自动安装或skip。
   */
  const cli = process.env.URGENT_SPECIFY_CLI
  assert.ok(cli && fs.existsSync(cli), 'URGENT_SPECIFY_CLI必须指向已准备的Specify1.2.6')
  sandbox.env.URGENT_PREPARED_SPECIFY = cli
  sandbox.env.URGENT_PREPARED_PYTHON = path.join(path.dirname(fs.realpathSync(cli)), 'python')
  sandbox.env.URGENT_TARGET_PROJECT = sandbox.project
  fs.writeFileSync(path.join(sandbox.root, 'bin/uvx'), `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == --offline ]]; then shift; fi
[[ "$1" == --from && "$2" == specify-cli==1.2.6 ]] || exit 71
shift 2
case "$1" in
  python) shift; exec "$URGENT_PREPARED_PYTHON" "$@";;
  specify) shift;;
  *) exit 72;;
esac
printf '%s|%s\n' "$PWD" "$*" >> "$TMPDIR/specify-calls"
if [[ -n "\${URGENT_FAIL_HOOK:-}" && "$PWD" == "$URGENT_TARGET_PROJECT" && "$*" == *"$URGENT_FAIL_HOOK"* ]]; then exit 17; fi
exec "$URGENT_PREPARED_SPECIFY" "$@"
`, { mode: 0o700 })
  fs.mkdirSync(path.join(sandbox.project, '.specify'), { recursive: true })
  fs.writeFileSync(path.join(sandbox.project, '.specify/init-options.json'), JSON.stringify({ ai: 'codex', ai_skills: true }))
}

/**
 * 通过正常唯一Node入口执行第二步，禁止用no-mount或预检代替。
 * @param {object} sandbox 当前独占项目。
 * @param {object} payload 本次同版材料。
 * @param {string[]} names 本次显式所选技能。
 * @returns {object} 实际退出码和阶段报告原文。
 */
function mount(sandbox, payload, names = workflowNames) {
  return runCommand(sandbox, process.execPath, [path.join(payload.root, 'script/index.mjs'), '--source-dir', payload.root, '--version', payload.release.version, '--agent', 'codex', '--project', sandbox.project, ...names.flatMap(name => ['--skill', name])])
}

/**
 * 只统计真实目标调用，排除私有项目内官方重建的核验调用。
 * @param {object} sandbox 本次独占目录。
 * @returns {string[]} 实际目标的官方CLI参数。
 */
function targetCalls(sandbox) {
  /**
   * 无调用时不创造日志或空目录。
   */
  const file = path.join(sandbox.root, 'tmp/specify-calls')
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(line => line.startsWith(`${sandbox.project}|`)) : []
}

test('当前材料经真实官方安装和正常第二步汇合', async (t) => {
  /**
   * 当次CLI缓存与每个消费项目分离，不触真实用户配置。
   */
  const tools = createUrgentSandbox()
  try {
    /**
     * skills版本与完整性从当次官方完整包解析。
     */
    const upstream = await readOnlineAgents({ cwd: tools.project, userHome: tools.userHome, env: tools.env })
    t.diagnostic(`upstream=${upstream.upstream.version}; scope=${process.env.URGENT_CANDIDATE_ROOT ? 'rebuilt-candidate' : 'current-source-script-fixture'}`)
    /**
     * 第一阶段始终由真实skills CLI复制安装，不直接复制目标目录。
     * @param {object} sandbox 当前独占消费项目。
     * @param {object} payload 当前同版材料。
     * @param {string[]} names 明确所选技能。
     */
    function install(sandbox, payload, names = workflowNames) {
      /**
       * 真实npx缓存只在本次tools目录，安装不带作者node_modules。
       */
      const result = runCommand(sandbox, 'npx', ['--yes', `skills@${upstream.upstream.version}`, 'add', payload.root, '--agent', 'codex', '--copy', '--yes', '--json', '--skill', ...names], { env: { ...sandbox.env, npm_config_cache: path.join(tools.root, 'npm-cache'), DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1', CI: '1' } })
      assert.equal(result.status, 0, result.stdout + result.stderr)
      for (const name of names)
        assert.deepEqual(fs.readFileSync(path.join(sandbox.project, '.agents/skills', name, 'SKILL.md')), fs.readFileSync(path.join(payload.root, payload.release.skills.find(skill => skill.name === name).directory, 'SKILL.md')))
    }
    await t.test('正常三hooks与Increment连续两次且retired和加载未验事实完整保留', () => {
      /**
       * 本项目只有自有正式安装内容，正常执行完整挂载。
       */
      const sandbox = createUrgentSandbox()
      try {
        /**
         * 当前源码fixture与实际重建候选使用同一正常入口断言。
         */
        const payload = preparePayload(sandbox)
        prepareSpecify(sandbox)
        install(sandbox, payload)
        fs.writeFileSync(path.join(sandbox.project, 'user-notes.txt'), '用户内容原字节\n')
        /**
         * 正式技能正文附件在挂载后不可被改写。
         */
        const original = snapshotTree(path.join(sandbox.project, '.agents/skills'))
        for (let retry = 0; retry < 2; retry++) {
          /**
           * 每次都走真实官方注册，不凭同版内容存在跳过。
           */
          const result = mount(sandbox, payload)
          assert.equal(result.status, 0, result.stdout + result.stderr)
          /**
           * 保留具体阶段，注册成功不能冒充实际宿主完整加载。
           */
          const report = JSON.parse(result.stdout)
          assert.equal(report.stages.installation.status, 'success')
          assert.equal(report.stages.integrity.status, 'success')
          assert.equal(report.stages.hooks.status, 'success')
          assert.deepEqual(report.stages.hooks.results.map(item => item.status), ['success', 'success', 'success'])
          assert.ok(Array.isArray(report.stages.hooks.retired), '正常入口丢失hooks.retired实际清退结果')
          assert.ok(Array.isArray(report.stages.hooks.retired), '失败入口丢失hooks.retired实际清退结果')
          assert.equal(report.stages.hooks.retired.length, 6)
          assert.ok(report.stages.hooks.retired.every(item => item.reasonCode === 'not-installed'))
          assert.equal(report.stages.commands.status, 'success')
          assert.equal(report.stages.legacy.status, 'success')
          assert.equal(report.stages.loading.status, 'not-run')
          assert.equal(report.stages.loading.reasonCode, 'requires-host-session')
          assert.equal(fs.readFileSync(path.join(sandbox.project, 'user-notes.txt'), 'utf8'), '用户内容原字节\n')
          for (const name of workflowNames)
            assert.deepEqual(snapshotTree(path.join(sandbox.project, '.agents/skills', name)), Object.fromEntries(Object.entries(original).filter(([file]) => file.startsWith(`${name}/`)).map(([file, value]) => [file.slice(name.length + 1), value])))
          assert.equal(fs.existsSync(path.join(sandbox.project, '.agents/skills/speckit-modes-increment/SKILL.md')), true)
        }
        assert.equal(targetCalls(sandbox).filter(line => line.includes('extension add --dev')).length, 8)
      }
      finally { sandbox.cleanup() }
    })
    await t.test('第二项hook失败保留前项成功、后项未执行且Increment真实调用0', () => {
      /**
       * 失败只在真实官方第二项进程边界注入，其他调用仍是真工具。
       */
      const sandbox = createUrgentSandbox()
      try {
        /**
         * 所有材料均完整，故障不会被完整性错误提前掩盖。
         */
        const payload = preparePayload(sandbox)
        prepareSpecify(sandbox)
        install(sandbox, payload)
        sandbox.env.URGENT_FAIL_HOOK = '/implementation-preparation'
        /**
         * 正常第二步不能在hook失败后继续注册Increment。
         */
        const result = mount(sandbox, payload)
        assert.equal(result.status, 17, result.stdout + result.stderr)
        /**
         * 报告必须保留本次全部阶段，不吞掉retired清点结果。
         */
        const report = JSON.parse(result.stdout)
        assert.equal(report.stages.installation.status, 'success')
        assert.equal(report.stages.hooks.status, 'failed')
        assert.deepEqual(report.stages.hooks.results.map(item => item.status), ['success', 'failed', 'not-run'])
        assert.ok(Array.isArray(report.stages.hooks.retired), '失败入口丢失hooks.retired实际清退结果')
        assert.equal(report.stages.hooks.retired.length, 6)
        assert.equal(report.stages.commands.status, 'not-run')
        assert.equal(report.stages.commands.reasonCode, 'blocked-by-hooks')
        assert.equal(targetCalls(sandbox).filter(line => line.includes('urgent-modes-')).length, 0)
        assert.equal(fs.existsSync(path.join(sandbox.project, '.agents/skills/speckit-modes-increment')), false)
      }
      finally { sandbox.cleanup() }
    })
    await t.test('hook边界退出0但未给有效报告时不能放行Increment', () => {
      /**
       * 仅替换自有副本中的外部注册边界，不能冒充官方成功。
       */
      const sandbox = createUrgentSandbox()
      try {
        /**
         * 其余同版材料合法，避免完整性失败掩盖缺报告分支。
         */
        const payload = preparePayload(sandbox)
        prepareSpecify(sandbox)
        install(sandbox, payload)
        fs.writeFileSync(path.join(payload.root, 'script/register-hooks/register-hooks.sh'), '#!/usr/bin/env bash\nexit 0\n')
        /**
         * 测试副本的脚本与声明同步，故障只在报告语义。
         */
        const changed = describeFixtureFile(payload.root, 'script/register-hooks/register-hooks.sh')
        payload.release.files = payload.release.files.map(file => file.path === changed.path ? changed : file)
        payload.release.adapters = payload.release.adapters.map(file => file.path === changed.path ? changed : file)
        fs.writeFileSync(path.join(payload.root, 'release.json'), JSON.stringify(payload.release))
        /**
         * 已安装技能与用户目录在整个失败过程保持。
         */
        const before = snapshotTree(sandbox.project)
        /**
         * 真实Node入口必须拒绝伪成功，不能调用commands。
         */
        const result = mount(sandbox, payload)
        assert.notEqual(result.status, 0)
        /**
         * 注册器无实证报告，必须标失败并阻止下游。
         */
        const report = JSON.parse(result.stdout)
        assert.equal(report.stages.hooks.status, 'failed')
        assert.equal(report.stages.hooks.reasonCode, 'invalid-hook-report')
        assert.equal(report.stages.commands.status, 'not-run')
        assert.equal(targetCalls(sandbox).length, 0)
        assert.deepEqual(snapshotTree(sandbox.project), before)
      }
      finally { sandbox.cleanup() }
    })
    await t.test('普通技能不触发历史workflow注册', () => {
      /**
       * 普通技能仍在Spec Kit项目，避免非Spec Kit分支掩盖错误触发。
       */
      const sandbox = createUrgentSandbox()
      try {
        /**
         * 普通样本也复制当前原字节脚本，真实CLI负责第一步。
         */
        const payload = process.env.URGENT_CANDIDATE_ROOT ? preparePayload(sandbox) : createReleaseFixture(sandbox)
        prepareSpecify(sandbox)
        install(sandbox, payload, ['document-changed-symbols'])
        /**
         * 正常参数不允许无关历史工作流参与。
         */
        const result = mount(sandbox, payload, ['document-changed-symbols'])
        assert.equal(result.status, 0, result.stdout + result.stderr)
        assert.equal(JSON.parse(result.stdout).stages.hooks.reasonCode, 'not-applicable')
        assert.equal(targetCalls(sandbox).length, 0)
      }
      finally { sandbox.cleanup() }
    })
    await t.test('缺已备jq环境明确失败且目标字节保持', () => {
      /**
       * 工具缺失不能触发安装前置或任何工作流调用。
       */
      const sandbox = createUrgentSandbox()
      try {
        /**
         * 已安装完整内容，只有明确工具路径无效。
         */
        const payload = preparePayload(sandbox)
        prepareSpecify(sandbox)
        install(sandbox, payload)
        sandbox.env.FOUNDRY_JQ = path.join(sandbox.root, 'missing-jq')
        /**
         * 完整项目树包含已安装正文与Spec Kit配置。
         */
        const before = snapshotTree(sandbox.project)
        /**
         * 缺环境必须是明确非零，不能当不适用成功。
         */
        const result = mount(sandbox, payload)
        assert.notEqual(result.status, 0)
        assert.equal(JSON.parse(result.stdout).reasonCode, 'prerequisite')
        assert.deepEqual(snapshotTree(sandbox.project), before)
        assert.equal(targetCalls(sandbox).length, 0)
      }
      finally { sandbox.cleanup() }
    })
    await t.test('当前运行材料错版明确失败且不调用官方注册', () => {
      /**
       * 候选原件不变，只破坏本次私有材料副本。
       */
      const sandbox = createUrgentSandbox()
      try {
        /**
         * 目标正文仍完整，公共脚本摘要发生独立漂移。
         */
        const payload = preparePayload(sandbox)
        prepareSpecify(sandbox)
        install(sandbox, payload)
        fs.appendFileSync(path.join(payload.root, 'script/register-hooks/register-hooks.sh'), '\n# 不同字节\n')
        /**
         * 目标不能被损坏的第二步材料改变。
         */
        const before = snapshotTree(sandbox.project)
        /**
         * 进入同版脚本全集核验后应明确报完整性失败。
         */
        const result = mount(sandbox, payload)
        assert.notEqual(result.status, 0)
        assert.equal(JSON.parse(result.stdout).stages.integrity.status, 'failed')
        assert.deepEqual(snapshotTree(sandbox.project), before)
        assert.equal(targetCalls(sandbox).length, 0)
      }
      finally { sandbox.cleanup() }
    })
  }
  finally { tools.cleanup() }
})
