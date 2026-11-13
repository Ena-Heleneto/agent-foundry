import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { createUrgentSandbox, packageRoot, runCommand, snapshotTree } from './helpers/urgent-sandbox.mjs'

/**
 * 为注册器准备自身项目、完整技能与集中配置，不依赖用户目录。
 * @param {string[]} names 本次明确安装的工作流技能。
 * @returns {object} 本次测试拥有的目录。
 */
function fixture(names = ['artifact-spec-analysis']) {
  /**
   * 所有外部进程与写入限定在隔离目录。
   */
  const sandbox = createUrgentSandbox()
  fs.mkdirSync(path.join(sandbox.project, '.specify'), { recursive: true })
  fs.writeFileSync(path.join(sandbox.project, '.specify/init-options.json'), JSON.stringify({ ai: 'codex', ai_skills: true }))
  for (const name of names)
    fs.cpSync(path.join(packageRoot, 'src/workflow', name), path.join(sandbox.root, 'skills', name), { recursive: true })
  fs.mkdirSync(path.join(sandbox.root, 'config/workflow'), { recursive: true })
  fs.copyFileSync(path.join(packageRoot, 'src/workflow/collection.config.json'), path.join(sandbox.root, 'config/workflow/collection.config.json'))
  return sandbox
}

/**
 * 调用真实Bash注册器，可在官方进程边界注入明确失败。
 * @param {object} sandbox 当前隔离目录。
 * @param {string[]} extra 额外内部参数。
 * @returns {object} 实际执行结果。
 */
function register(sandbox, extra = []) {
  return runCommand(sandbox, 'bash', [path.join(packageRoot, 'script/register-hooks/register-hooks.sh'), '--project', sandbox.project, '--skills-dir', path.join(sandbox.root, 'skills'), '--config-root', path.join(sandbox.root, 'config'), '--skill', 'artifact-spec-analysis', ...extra])
}

test('集中配置中的所选hook实际调用官方边界，缺旧逐技能配置也不阻断', () => {
  /**
   * 故障工具只记录所收到的真实调用并以明确非零退出。
   */
  const sandbox = fixture()
  try {
    fs.writeFileSync(path.join(sandbox.root, 'bin/failing-specify'), '#!/bin/sh\nprintf "%s\\n" "$*" > "$TMPDIR/hook-call"\nexit 17\n', { mode: 0o700 })
    /**
     * 初次红灯是旧接口未接集中配置，不是环境缺工具。
     */
    const result = register(sandbox, ['--cli', path.join(sandbox.root, 'bin/failing-specify')])
    assert.equal(result.status, 17, result.stdout + result.stderr)
    assert.match(fs.readFileSync(path.join(sandbox.root, 'tmp/hook-call'), 'utf8'), /extension add --dev .* --force/u)
  }
  finally { sandbox.cleanup() }
})

test('非法事件在第一次官方调用前拒绝且不修改已装正文', () => {
  /**
   * 非法类型来自同版本集中配置，不能静默交给官方跳过。
   */
  const sandbox = fixture()
  try {
    fs.writeFileSync(path.join(sandbox.root, 'config/workflow/collection.config.json'), JSON.stringify({ skill: { 'artifact-spec-analysis': { hook: { after_tasks: { optional: 'false' } } } } }))
    /**
     * 即使工具可用，也不能在非法输入后调用。
     */
    const result = register(sandbox)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /optional/u)
    assert.equal(fs.existsSync(path.join(sandbox.project, '.specify/extensions')), false)
  }
  finally { sandbox.cleanup() }
})

test('显式禁用hook没有任何官方调用或项目注册写入', () => {
  /**
   * enabled=false必须在包装器过滤，不能由官方重新注册成true。
   */
  const sandbox = fixture()
  try {
    fs.writeFileSync(path.join(sandbox.root, 'config/workflow/collection.config.json'), JSON.stringify({ skill: { 'artifact-spec-analysis': { hook: { after_tasks: { enabled: false } } } } }))
    /**
     * 未运行官方工具也是可观察的正确分支。
     */
    const result = register(sandbox)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(fs.existsSync(path.join(sandbox.project, '.specify/extensions')), false)
  }
  finally { sandbox.cleanup() }
})

/**
 * 真实官方验证只能复用已准备的固定版本CLI，不自动安装依赖。
 */
const preparedCli = process.env.URGENT_SPECIFY_CLI

/**
 * 三项适用hook的输入顺序与业务阶段对应，统一供真实测试使用。
 */
const selectedNames = ['artifact-spec-analysis', 'implementation-preparation', 'artifact-project-description']

/**
 * 真实执行三个当前hook的显式注册选择。
 * @param {object} sandbox 当前独占目录。
 * @param {string} cli 当前已准备的真实CLI或进程故障边界。
 * @returns {object} Bash真实结果。
 */
function registerSelected(sandbox, cli = preparedCli) {
  assert.ok(cli, '请通过URGENT_SPECIFY_CLI指定已准备的Specify1.2.6，不自动安装')
  return register(sandbox, ['--skill', 'implementation-preparation', '--skill', 'artifact-project-description', '--cli', cli])
}

test('真实官方三项hook连续两次注册并保留原正文及正确事件派发信息', () => {
  /**
   * 本次注册、用户和缓存均与真实项目隔离。
   */
  const sandbox = fixture(selectedNames)
  try {
    assert.ok(preparedCli, '真实注册需要已准备的Specify1.2.6')
    /**
     * 结构完整的正式技能原字节不由hooks扩展覆盖。
     */
    const originalSkills = snapshotTree(path.join(sandbox.root, 'skills'))
    for (let attempt = 0; attempt < 2; attempt++) {
      /**
       * 每次都实际调用官方CLI，不用文件相同绕过重装。
       */
      const result = registerSelected(sandbox)
      assert.equal(result.status, 0, result.stdout + result.stderr)
      /**
       * 适用项逐个成功，未生成额外指令。
       */
      const report = JSON.parse(result.stdout)
      assert.equal(report.status, 'success')
      assert.deepEqual(report.results.map(item => [item.name, item.status]), selectedNames.map(name => [name, 'success']))
      /**
       * 官方list的JSON读回与实际扩展输入共同核对。
       */
      const listed = runCommand(sandbox, preparedCli, ['extension', 'list', '--json'])
      assert.equal(listed.status, 0, listed.stderr)
      assert.deepEqual(JSON.parse(listed.stdout).map(item => item.id).sort(), [...selectedNames].sort())
      for (const name of selectedNames) {
        /**
         * hooks-only输入不得提供任何包装指令。
         */
        const manifest = JSON.parse(fs.readFileSync(path.join(sandbox.project, '.specify/extensions', name, 'extension.yml'), 'utf8'))
        assert.deepEqual(manifest.provides, {})
        assert.equal(Object.values(manifest.hooks)[0].command, name)
      }
      assert.deepEqual(snapshotTree(path.join(sandbox.root, 'skills')), originalSkills)
    }
    /**
     * 官方Python仅用于读回实际登记的事件派发，不冒充宿主执行。
     */
    const python = path.join(path.dirname(fs.realpathSync(preparedCli)), 'python')
    /**
     * 真实HookExecutor读取由CLI生成的extensions.yml。
     */
    const dispatched = runCommand(sandbox, python, ['-B', '-c', 'import json,sys; from pathlib import Path; from specify_cli.extensions import HookExecutor; executor=HookExecutor(Path(sys.argv[1])); print(json.dumps({event:[executor.execute_hook(hook) for hook in executor.get_hooks_for_event(event)] for event in ["after_tasks","before_implement","after_converge","after_increment"]}))', sandbox.project])
    assert.equal(dispatched.status, 0, dispatched.stderr)
    /**
     * 三个事件必须各自指向同版正式技能，after_increment保持空。
     */
    const events = JSON.parse(dispatched.stdout)
    assert.deepEqual(Object.fromEntries(Object.entries(events).map(([event, hooks]) => [event, hooks.map(hook => hook.command)])), { after_tasks: ['artifact-spec-analysis'], before_implement: ['implementation-preparation'], after_converge: ['artifact-project-description'], after_increment: [] })
    assert.ok(events.after_tasks[0].prompt.includes('artifact-spec-analysis'))
    assert.equal(events.before_implement[0].optional, false)
    assert.equal(fs.existsSync(path.join(sandbox.project, '.agents/skills/speckit-modes-increment')), false)
  }
  finally { sandbox.cleanup() }
})

test('第二项官方故障保留第一项真实成功与第三项未执行', () => {
  /**
   * 第一项由真实官方工具落盘，第二项仅在进程边界注入故障。
   */
  const sandbox = fixture(selectedNames)
  try {
    assert.ok(preparedCli, '真实部分成功验证需要已准备的Specify1.2.6')
    sandbox.env.URGENT_REAL_SPECIFY = preparedCli
    fs.writeFileSync(path.join(sandbox.root, 'bin/fail-second'), '#!/usr/bin/env bash\ncase "$*" in *"/implementation-preparation"*) exit 17;; esac\nexec "$URGENT_REAL_SPECIFY" "$@"\n', { mode: 0o700 })
    /**
     * Bash应保留原始失败退出码，不撤销已发生的第一项成功。
     */
    const result = registerSelected(sandbox, path.join(sandbox.root, 'bin/fail-second'))
    assert.equal(result.status, 17, result.stdout + result.stderr)
    /**
     * 三项均保留其真实阶段结果。
     */
    const report = JSON.parse(result.stdout)
    assert.deepEqual(report.results.map(item => [item.name, item.status]), [['artifact-spec-analysis', 'success'], ['implementation-preparation', 'failed'], ['artifact-project-description', 'not-run']])
    assert.equal(fs.existsSync(path.join(sandbox.project, '.specify/extensions/artifact-spec-analysis/extension.yml')), true)
    assert.equal(fs.existsSync(path.join(sandbox.project, '.specify/extensions/implementation-preparation')), false)
    assert.equal(fs.existsSync(path.join(sandbox.project, '.specify/extensions/artifact-project-description')), false)
  }
  finally { sandbox.cleanup() }
})

test('已登记hook源的未知附件在任何目标写入前保留并拒绝整批', () => {
  /**
   * 已登记来源先由真实官方工具产生，不能伪造归属。
   */
  const sandbox = fixture(selectedNames)
  try {
    assert.ok(preparedCli, '真实冲突保护需要已准备的Specify1.2.6')
    assert.equal(registerSelected(sandbox).status, 0)
    fs.writeFileSync(path.join(sandbox.project, '.specify/extensions/artifact-project-description/user-notes.txt'), '未知用户附件保留\n')
    /**
     * 第三项冲突必须阻止前两项的真实目标重装。
     */
    const before = snapshotTree(sandbox.project)
    /**
     * 临时项目重建只属于核验，真实项目完整树必须保持。
     */
    const result = registerSelected(sandbox)
    assert.notEqual(result.status, 0, result.stdout + result.stderr)
    assert.match(result.stderr, /用户修改|未知附件|保留/u)
    /**
     * 无真实注册发生，前两项报告未执行而不是成功。
     */
    const report = JSON.parse(result.stdout)
    assert.deepEqual(report.results.map(item => item.status), ['not-run', 'not-run', 'failed'])
    assert.deepEqual(snapshotTree(sandbox.project), before)
  }
  finally { sandbox.cleanup() }
})

test('临时hook输入保留合法条件和扩展字段并补正式command', () => {
  /**
   * 此处只验结构化转换，不执行条件或冒充官方宿主。
   */
  const sandbox = fixture()
  try {
    fs.writeFileSync(path.join(sandbox.root, 'config/workflow/collection.config.json'), JSON.stringify({ skill: { 'artifact-spec-analysis': { hook: { after_tasks: { prompt: '原始prompt', condition: 'env:URGENT_HOOK_READY', optional: false, priority: 17, extensionField: { keep: true }, command: '' } } } } }))
    /**
     * 输出只在本次拥有的私有目录。
     */
    const output = path.join(sandbox.root, 'prepared')
    /**
     * 调用实际结构化输入模块，不复制其转换算法。
     */
    const result = runCommand(sandbox, process.execPath, [path.join(packageRoot, 'script/register-hooks/prepare-hooks.mjs'), sandbox.project, path.join(sandbox.root, 'skills'), path.join(sandbox.root, 'config'), output, '1.2.6', 'artifact-spec-analysis'])
    assert.equal(result.status, 0, result.stderr)
    /**
     * command必须取正式技能名，不能沿用配置中空指令。
     */
    const manifest = JSON.parse(fs.readFileSync(path.join(output, 'artifact-spec-analysis/extension.yml'), 'utf8'))
    assert.deepEqual(manifest.hooks.after_tasks, { prompt: '原始prompt', condition: 'env:URGENT_HOOK_READY', optional: false, priority: 17, extensionField: { keep: true }, command: 'artifact-spec-analysis' })
    assert.deepEqual(manifest.provides, {})
  }
  finally { sandbox.cleanup() }
})

/**
 * 明确退役的六个历史hooks-only扩展及其真实旧事件。
 */
const retiredHooks = [
  ['artifact-issue-description', 'after_specify'],
  ['artifact-pr-description', 'after_clarify'],
  ['mvu-gate', 'before_implement'],
  ['artifact-business-flow', 'after_plan'],
  ['artifact-logic-flow', 'after_tasks'],
  ['explainer-doc-sync', 'after_implement'],
]

/**
 * 由真实官方CLI建立普通YAML的历史hooks-only登记，不伪造registry或用户归属。
 * @param {object} sandbox 当前独占项目。
 */
function installRetiredHooks(sandbox) {
  assert.ok(preparedCli, '历史hooks验证需要已准备的Specify1.2.6')
  for (const [id, event] of retiredHooks) {
    /**
     * 此样本没有额外技能正文，只验证原生hooks-only扩展的登记迁移。
     */
    const input = path.join(sandbox.root, 'legacy-hooks', id)
    fs.mkdirSync(input, { recursive: true })
    fs.writeFileSync(path.join(input, 'extension.yml'), `schema_version: '1.0'\nextension:\n  id: ${id}\n  name: ${id}\n  version: '1.0.0'\n  description: 历史hooks-only登记\nrequires:\n  speckit_version: '==1.2.6'\nprovides: {}\nhooks:\n  ${event}:\n    command: ${id}\n    optional: false\n`)
    /**
     * 真实工具负责创建manifest hash和活动hook，测试只断言结果。
     */
    const installed = runCommand(sandbox, preparedCli, ['extension', 'add', '--dev', input, '--force'])
    assert.equal(installed.status, 0, installed.stdout + installed.stderr)
  }
}

test('真实六旧hooks登记经官方remove清退且重试不复活、不损无关扩展', () => {
  /**
   * 历史六项和当前三项拥有同一个自有目标，完整验证迁移顺序。
   */
  const sandbox = fixture(selectedNames)
  try {
    assert.ok(preparedCli, '真实六旧迁移需要已准备的Specify1.2.6')
    installRetiredHooks(sandbox)
    /**
     * 无关官方扩展不属于本次允许清退的六ID。
     */
    const unrelated = path.join(sandbox.root, 'unrelated-hook')
    fs.mkdirSync(unrelated)
    fs.writeFileSync(path.join(unrelated, 'extension.yml'), JSON.stringify({ schema_version: '1.0', extension: { id: 'unrelated-hook', name: 'Unrelated Hook', version: '1.0.0', description: '无关用户扩展' }, requires: { speckit_version: '==1.2.6' }, provides: {}, hooks: { after_plan: { command: 'unrelated-hook' } } }))
    assert.equal(runCommand(sandbox, preparedCli, ['extension', 'add', '--dev', unrelated, '--force']).status, 0)
    /**
     * 保留无关源字节及完整已安装正式正文。
     */
    const original = snapshotTree(path.join(sandbox.project, '.specify/extensions/unrelated-hook'))
    for (let retry = 0; retry < 2; retry++) {
      /**
       * 首次实际移除，第二次只核对无旧登记并正常重装所选hook。
       */
      const result = registerSelected(sandbox)
      assert.equal(result.status, 0, result.stdout + result.stderr)
      /**
       * 每项移除或不适用均有明确结果，不以清理整目录代替官方操作。
       */
      const report = JSON.parse(result.stdout)
      assert.deepEqual(report.retired.map(item => item.status), Array.from({ length: 6 }).fill(retry === 0 ? 'success' : 'not-run'))
      for (const [id] of retiredHooks)
        assert.equal(fs.existsSync(path.join(sandbox.project, '.specify/extensions', id)), false)
      /**
       * 官方JSON列出结果只剩本次三项和原无关扩展。
       */
      const listed = runCommand(sandbox, preparedCli, ['extension', 'list', '--json'])
      assert.equal(listed.status, 0, listed.stderr)
      assert.deepEqual(JSON.parse(listed.stdout).map(item => item.id).sort(), [...selectedNames, 'unrelated-hook'].sort())
      assert.deepEqual(snapshotTree(path.join(sandbox.project, '.specify/extensions/unrelated-hook')), original)
    }
  }
  finally { sandbox.cleanup() }
})

test('真实六旧hook未知附件在任何清退或新注册前保留整批现场', () => {
  /**
   * 故障发生在真实官方旧登记之后，不能抹去其归属和历史。
   */
  const sandbox = fixture(selectedNames)
  try {
    assert.ok(preparedCli, '真实退役保护需要已准备的Specify1.2.6')
    installRetiredHooks(sandbox)
    fs.writeFileSync(path.join(sandbox.project, '.specify/extensions/explainer-doc-sync/user-extra.txt'), '用户附件原字节\n')
    /**
     * 第六项冲突应阻止此前五项实际移除。
     */
    const before = snapshotTree(sandbox.project)
    /**
     * 前置私有重建可运行，真实目标必须完整保留。
     */
    const result = registerSelected(sandbox)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /未知附件|用户修改|保留/u)
    assert.deepEqual(snapshotTree(sandbox.project), before)
    assert.deepEqual(JSON.parse(result.stdout).results.map(item => item.status), ['not-run', 'not-run', 'not-run'])
  }
  finally { sandbox.cleanup() }
})

test('无登记同名旧扩展目录不冒认归属或自动清理', () => {
  /**
   * 仅有同名目录不等于官方受管历史。
   */
  const sandbox = fixture(selectedNames)
  try {
    fs.mkdirSync(path.join(sandbox.project, '.specify/extensions/artifact-issue-description'), { recursive: true })
    fs.writeFileSync(path.join(sandbox.project, '.specify/extensions/artifact-issue-description/user.txt'), '无归属内容必须保留\n')
    /**
     * 不支持破坏性操作的故障CLI能检测任何越权写入尝试。
     */
    const before = snapshotTree(sandbox.project)
    /**
     * 第一项旧来源预检就应拒绝，不能调用官方remove。
     */
    const result = registerSelected(sandbox, '/bin/false')
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /来源不明/u)
    assert.deepEqual(snapshotTree(sandbox.project), before)
  }
  finally { sandbox.cleanup() }
})
