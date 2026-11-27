import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { createUrgentSandbox, packageRoot, runCommand, snapshotTree } from './helpers/urgent-sandbox.mjs'

test('只安装Increment即可进入官方注册，不要求三个暂停模式来源', () => {
  /**
   * 本次项目没有任何暂停技能，且外部工具明确故障退出。
   */
  const sandbox = createUrgentSandbox()
  try {
    fs.mkdirSync(path.join(sandbox.project, '.specify'), { recursive: true })
    fs.writeFileSync(path.join(sandbox.project, '.specify/init-options.json'), JSON.stringify({ ai: 'codex' }))
    for (const name of ['task-increment', 'artifact-spec-analysis', 'implementation-preparation'])
      fs.cpSync(path.join(packageRoot, 'src/workflow', name), path.join(sandbox.project, '.agents/skills', name), { recursive: true })
    fs.writeFileSync(path.join(sandbox.root, 'bin/failing-specify'), '#!/bin/sh\nprintf "%s\\n" "$*" > "$TMPDIR/command-call"\nexit 17\n', { mode: 0o700 })
    /**
     * 薄正式入口仍由原modes官方扩展生成。
     */
    const result = runCommand(sandbox, 'bash', [path.join(packageRoot, 'script/register-commands/register-commands.sh'), '--project', sandbox.project, '--skills-dir', path.join(sandbox.project, '.agents/skills'), '--cli', path.join(sandbox.root, 'bin/failing-specify')])
    assert.equal(result.status, 17, result.stdout + result.stderr)
    assert.match(fs.readFileSync(path.join(sandbox.root, 'tmp/command-call'), 'utf8'), /extension add --dev .* --force/u)
    assert.equal(fs.existsSync(path.join(sandbox.project, '.agents/skills/task-pair')), false)
  }
  finally { sandbox.cleanup() }
})

/**
 * 真实迁移验证要求调用者指定已准备的1.2.6工具，不下载或替换全局CLI。
 */
const preparedCli = process.env.URGENT_SPECIFY_CLI

/**
 * 为真实官方注册准备独占Codex项目与已装完整依赖。
 * @param {object} sandbox 当前测试独占目录。
 */
function prepareCodexProject(sandbox) {
  fs.mkdirSync(path.join(sandbox.project, '.specify'), { recursive: true })
  fs.writeFileSync(path.join(sandbox.project, '.specify/init-options.json'), JSON.stringify({ ai: 'codex', ai_skills: true }))
  for (const name of ['task-increment', 'artifact-spec-analysis', 'implementation-preparation'])
    fs.cpSync(path.join(packageRoot, 'src/workflow', name), path.join(sandbox.project, '.agents/skills', name), { recursive: true })
}

/**
 * 以真实官方CLI安装合法YAML旧集合，正文来自固定历史夹具。
 * 与当前维护源分离，确保正文更新后仍验证真实旧版到新版的迁移。
 * @param {object} sandbox 当前独占项目。
 * @param {string[]} modes 旧正式入口后缀。
 */
function installLegacyModes(sandbox, modes) {
  assert.ok(preparedCli, '请通过URGENT_SPECIFY_CLI指定已准备的Specify1.2.6，不自动安装前置')
  /**
   * 旧来源和注册探针分开，避免被当作目标附件。
   */
  const input = path.join(sandbox.root, 'legacy-source')
  fs.mkdirSync(path.join(input, 'skills/task-increment'), { recursive: true })
  fs.copyFileSync(path.join(packageRoot, 'tests/fixtures/legacy-increment/SKILL.md'), path.join(input, 'skills/task-increment/SKILL.md'))
  fs.writeFileSync(path.join(input, 'extension.yml'), `schema_version: '1.0'\nextension:\n  id: modes\n  name: Historical Modes\n  version: '1.0.0'\n  description: 合法历史迁移样本\nrequires:\n  speckit_version: '==1.2.6'\nprovides:\n  commands:\n${modes.map(name => `    - name: speckit.modes.${name}\n      file: skills/task-increment/SKILL.md\n      description: 历史入口${name}`).join('\n')}\n`)
  /**
   * 真正的官方工具负责登记和生成入口，测试不手写registry。
   */
  const result = runCommand(sandbox, preparedCli, ['extension', 'add', '--dev', input, '--force'])
  assert.equal(result.status, 0, result.stdout + result.stderr)
}

/**
 * 经实际Bash适配调用新入口，保留官方退出码及全部输出。
 * @param {object} sandbox 当前独占项目。
 * @returns {object} 实际执行结果。
 */
function registerIncrement(sandbox) {
  assert.ok(preparedCli, '真实迁移需要已准备的Specify1.2.6')
  return runCommand(sandbox, 'bash', [path.join(packageRoot, 'script/register-commands/register-commands.sh'), '--project', sandbox.project, '--skills-dir', path.join(sandbox.project, '.agents/skills'), '--cli', preparedCli])
}

/**
 * 历史三、四、五集合分别覆盖旧别名及暂停模式，均由官方生成。
 */
const legacyGroups = [['tutor', 'pair', 'review'], ['tutor', 'pair', 'direct', 'increment'], ['tutor', 'pair', 'review', 'guide', 'explore']]
for (const modes of legacyGroups) {
  test(`真实官方迁移旧${modes.length}入口后仅保留Increment，同版两次无重复`, () => {
    /**
     * 每个历史集合均有自己的源、项目和官方登记。
     */
    const sandbox = createUrgentSandbox()
    try {
      prepareCodexProject(sandbox)
      installLegacyModes(sandbox, modes)
      /**
       * 正式安装的源技能不应被注册器改写。
       */
      const original = fs.readFileSync(path.join(sandbox.project, '.agents/skills/task-increment/SKILL.md'))
      for (let retry = 0; retry < 2; retry++) {
        /**
         * 正常重装必须每次进入真实官方CLI并读回有效登记。
         */
        const result = registerIncrement(sandbox)
        assert.equal(result.status, 0, result.stdout + result.stderr)
        assert.deepEqual(fs.readdirSync(path.join(sandbox.project, '.agents/skills')).filter(name => name.startsWith('speckit-modes-')), ['speckit-modes-increment'])
        assert.deepEqual(fs.readFileSync(path.join(sandbox.project, '.agents/skills/task-increment/SKILL.md')), original)
        assert.equal(fs.existsSync(path.join(sandbox.project, '.specify/managed-state.json')), false)
      }
    }
    finally { sandbox.cleanup() }
  })
}

/**
 * 用户入口修改与未知源附件分别验证，失败保留全部已有字节。
 */
const protectedChanges = ['entry', 'attachment']
for (const change of protectedChanges) {
  test(`真实旧集合${change}冲突在破坏性调用前拒绝，原目标完整保留`, () => {
    /**
     * 故障发生于真实官方安装之后，不造假registry或归属。
     */
    const sandbox = createUrgentSandbox()
    try {
      prepareCodexProject(sandbox)
      installLegacyModes(sandbox, ['tutor', 'pair', 'review'])
      /**
       * 单次只引入一种用户修改。
       */
      const file = change === 'entry' ? '.agents/skills/speckit-modes-pair/SKILL.md' : '.specify/extensions/modes/user.txt'
      fs.appendFileSync(path.join(sandbox.project, file), '\n用户保留的实际内容\n')
      /**
       * 官方目录和技能输出共同作为保留验收对象。
       */
      const before = snapshotTree(sandbox.project)
      /**
       * 预检失败不能通过重装掩盖修改。
       */
      const result = registerIncrement(sandbox)
      assert.notEqual(result.status, 0, result.stdout + result.stderr)
      assert.match(result.stderr, /用户修改|未知附件|保留/u)
      assert.deepEqual(snapshotTree(sandbox.project), before)
    }
    finally { sandbox.cleanup() }
  })
}

test('同名未知正式入口在首次官方调用前保留，不冒认受管来源', () => {
  /**
   * 没有官方登记的同名目录属于用户内容。
   */
  const sandbox = createUrgentSandbox()
  try {
    prepareCodexProject(sandbox)
    fs.mkdirSync(path.join(sandbox.project, '.agents/skills/speckit-modes-increment'))
    fs.writeFileSync(path.join(sandbox.project, '.agents/skills/speckit-modes-increment/SKILL.md'), '用户的同名入口\n')
    /**
     * 目标完整快照证明失败没有清退或补造归属。
     */
    const before = snapshotTree(sandbox.project)
    /**
     * 已备工具仍不能越过来源保护。
     */
    const result = registerIncrement(sandbox)
    assert.notEqual(result.status, 0, result.stdout + result.stderr)
    assert.match(result.stderr, /来源不明/u)
    assert.deepEqual(snapshotTree(sandbox.project), before)
  }
  finally { sandbox.cleanup() }
})

test('真实官方迁移保留无关扩展及其入口字节', () => {
  /**
   * 无关内容也由真实官方注册，测试不手改登记。
   */
  const sandbox = createUrgentSandbox()
  try {
    prepareCodexProject(sandbox)
    installLegacyModes(sandbox, ['tutor', 'pair', 'review'])
    /**
     * 外部扩展拥有与modes无关的明确ID和入口。
     */
    const input = path.join(sandbox.root, 'unrelated-source')
    fs.mkdirSync(path.join(input, 'commands'), { recursive: true })
    fs.writeFileSync(path.join(input, 'commands/keep.md'), '---\ndescription: 用户独立扩展\n---\n\n保留这份内容。\n')
    fs.writeFileSync(path.join(input, 'extension.yml'), JSON.stringify({ schema_version: '1.0', extension: { id: 'unrelated', name: 'Unrelated', version: '1.0.0', description: '应保留的用户扩展' }, requires: { speckit_version: '==1.2.6' }, provides: { commands: [{ name: 'unrelated.keep', file: 'commands/keep.md', description: '保留无关入口' }] } }))
    /**
     * 真正的CLI生成无关来源和入口后再验证迁移保留。
     */
    const added = runCommand(sandbox, preparedCli, ['extension', 'add', '--dev', input, '--force'])
    assert.equal(added.status, 0, added.stdout + added.stderr)
    /**
     * 无关源及输出必须在modes迁移后保持原字节。
     */
    const sourceBefore = snapshotTree(path.join(sandbox.project, '.specify/extensions/unrelated'))
    /**
     * 正式入口包含官方生成头和正文，整体比较而非仅检查存在。
     */
    const outputBefore = snapshotTree(path.join(sandbox.project, '.agents/skills/speckit-unrelated-keep'))
    /**
     * 仅modes被当前所选入口重装。
     */
    const result = registerIncrement(sandbox)
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.deepEqual(snapshotTree(path.join(sandbox.project, '.specify/extensions/unrelated')), sourceBefore)
    assert.deepEqual(snapshotTree(path.join(sandbox.project, '.agents/skills/speckit-unrelated-keep')), outputBefore)
  }
  finally { sandbox.cleanup() }
})
