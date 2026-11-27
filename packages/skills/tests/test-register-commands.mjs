import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { bashFixture, bashIntegration } from './distribution/helpers/registration-bash-fixture.mjs'
import { migrationCli, migrationFixture, snapshot } from './distribution/helpers/registration-fixture.mjs'

/**
 * 默认测试真实挂载脚本；仅直接运行本文件时接受产物目录，避免误读测试运行器的文件列表。
 */
const scriptDir = !process.execArgv.includes('--test') && process.argv[2]
  ? path.resolve(process.argv[2])
  : fileURLToPath(new URL('../script/register-commands/', import.meta.url))

/**
 * 验证各平台实际集合、参数转发和失败传播；PowerShell 暂保留其未实施的四项事实。
 * @param {string} runtime shell 名称。
 * @param {string} extension 脚本后缀。
 */
function verifyMount(runtime, extension) {
  /**
   * 本测试唯一临时目录，所有写入仅限此目录。
   */
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'register-commands-test-'))
  try {
    /**
     * 模拟已经初始化的 Codex 项目。
     */
    const project = path.join(root, 'project with spaces')
    /**
     * 已安装的通用技能目录。
     */
    const skills = path.join(root, 'installed skills')
    fs.mkdirSync(path.join(project, '.specify'), { recursive: true })
    fs.writeFileSync(path.join(project, '.specify/init-options.json'), JSON.stringify({ ai: 'codex', ai_skills: true, speckit_version: '1.2.6' }))
    fs.writeFileSync(path.join(project, '.specify/unknown.txt'), '用户配置')
    /**
     * Bash 只给 Increment 来源，证明没有隐含补齐三模式的前置。
     */
    const modes = runtime === 'bash' ? ['increment'] : ['tutor', 'pair', 'direct', 'increment']
    /**
     * 当前写入安装输入的模式标识。
     */
    for (const mode of modes) {
      fs.mkdirSync(path.join(skills, `task-${mode}`), { recursive: true })
      fs.writeFileSync(path.join(skills, `task-${mode}/SKILL.md`), `---\nname: task-${mode}\ndescription: 测试\n---\n\n# 正文\n保持正文\n`)
    }
    /**
     * 模拟 CLI 保存实际接收的参数和临时输入，以非零退出验证错误传播。
     */
    const cli = path.join(root, runtime === 'pwsh' || process.platform === 'win32' ? 'fake-specify.ps1' : 'fake-specify')
    fs.writeFileSync(cli, cli.endsWith('.ps1')
      ? `$arguments = @($args)
$source = $arguments[[Array]::IndexOf($arguments, '--dev') + 1]
$manifest = Get-Content -Raw -LiteralPath (Join-Path $source 'extension.yml') | ConvertFrom-Json
@{ args = $arguments; manifest = $manifest } | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath 'call.json' -Encoding utf8NoBOM
exit 7
`
      : `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const source = args[args.indexOf('--dev') + 1];
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'extension.yml'), 'utf8'));
fs.writeFileSync('call.json', JSON.stringify({ args, manifest }));
process.exit(7);
`)
    fs.chmodSync(cli, 0o755)
    /**
     * 阻断自有脚本对 Python 的调用；外部 CLI 替身使用 Node，不代表 Specify 无 Python 依赖。
     */
    const blocked = path.join(root, 'blocked-interpreters')
    fs.mkdirSync(blocked)
    /**
     * 两种常见 Python 命令都应与自有挂载实现无关。
     */
    for (const executable of ['python', 'python3']) {
      fs.writeFileSync(path.join(blocked, `${executable}${process.platform === 'win32' ? '.cmd' : ''}`), process.platform === 'win32' ? '@exit /b 99\r\n' : '#!/bin/sh\nexit 99\n', { mode: 0o755 })
    }
    /**
     * 执行真实 shell 入口，避免只验证共享核心而漏掉参数转发。
     * @param {string[]} args 本次参数。
     * @param {Record<string, string | undefined>} environment 本次版本环境覆盖。
     * @returns {import('node:child_process').SpawnSyncReturns<string>} 实际进程结果。
     */
    function run(args, environment = {}) {
      return spawnSync(runtime, [...(runtime === 'pwsh' ? ['-NoProfile', '-File'] : []), path.join(scriptDir, `register-commands.${extension}`), ...args], {
        encoding: 'utf8',
        env: { ...process.env, PATH: `${blocked}${path.delimiter}${process.env.PATH}`, FOUNDRY_SPECIFY_VERSION: '1.2.6', ...environment },
      })
    }
    /**
     * 目标与来源都显式传入，路径包含空格以验证转发。
     */
    const args = ['--project', project, '--skills-dir', skills, '--cli', cli]
    assert.equal(run(['--help']).status, 0)
    assert.notEqual(run([...args, '--mode', 'invalid']).status, 0)
    assert.equal(fs.existsSync(path.join(project, 'call.json')), false)
    /**
     * CLI 失败必须向上传播，不得误报安装成功。
     */
    const failed = run(args)
    assert.equal(failed.status, 7)
    assert.match(failed.stderr, /官方.*失败/u)
    /**
     * 每个平台提交其实际当前集合并强制重装，由官方处理安装状态。
     */
    const call = JSON.parse(fs.readFileSync(path.join(project, 'call.json'), 'utf8'))
    assert.deepEqual(call.args.slice(0, 3), ['extension', 'add', '--dev'])
    assert.equal(call.args.at(-1), '--force')
    assert.equal(call.manifest.extension.id, 'modes')
    assert.deepEqual(call.manifest.provides.commands.map(item => item.name), runtime === 'bash'
      ? ['speckit.modes.increment']
      : [
          'speckit.modes.tutor',
          'speckit.modes.pair',
          'speckit.modes.direct',
          'speckit.modes.increment',
        ])
    assert.equal(fs.readFileSync(path.join(project, '.specify/unknown.txt'), 'utf8'), '用户配置')
    assert.equal(fs.existsSync(call.args[3]), false)
    assert.equal(call.manifest.requires.speckit_version, '==1.2.6')
    assert.equal(run(args, { FOUNDRY_SPECIFY_VERSION: '1.2.7' }).status, 7)
    assert.equal(JSON.parse(fs.readFileSync(path.join(project, 'call.json'), 'utf8')).manifest.requires.speckit_version, '==1.2.7')
    assert.notEqual(run(args, { FOUNDRY_SPECIFY_VERSION: '1.2.6"invalid' }).status, 0)
    fs.unlinkSync(path.join(project, 'call.json'))
    fs.unlinkSync(path.join(skills, 'task-increment/SKILL.md'))
    assert.notEqual(run(args).status, 0)
    assert.equal(fs.existsSync(path.join(project, 'call.json')), false)
  }
  finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

test('Bash 单 Increment 输入、强制重装及失败传播', { skip: process.platform === 'win32' }, () => verifyMount('bash', 'sh'))
test('PowerShell 同一接口', { skip: spawnSync('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion']).error?.code === 'ENOENT' }, () => verifyMount('pwsh', 'ps1'))

/**
 * 正式 Bash 必须执行 T066 骨架对应行为，测试不调用候选迁移函数。
 */
for (const variant of ['three', 'four', 'five']) {
  test(`T067 Bash 正式旧 ${variant} 集合迁移及重复刷新`, bashIntegration, () => {
    /**
     * 原环境与来源均来自独占官方夹具。
     */
    const item = bashFixture(`t067-${variant}`, variant)
    try {
      /**
       * 无关扩展与历史不得因退役过程改变。
       */
      const protectedBefore = snapshot(path.join(item.project, '.specify/extensions/t066-unrelated'))
      /**
       * 同一正式入口重复执行，不用测试基线放行。
       */
      for (let pass = 0; pass < 2; pass++) {
        /**
         * hooks 必须先成功，再调用命令模块。
         */
        const hooks = item.run('hooks')
        assert.equal(hooks.status, 0, hooks.stdout + hooks.stderr)
        /**
         * Increment 来源根只有一份模式，不补齐三暂停技能。
         */
        const commands = item.run('commands')
        assert.equal(commands.status, 0, commands.stdout + commands.stderr)
        assert.deepEqual(fs.readdirSync(path.join(item.project, '.agents/skills')).filter(name => name.startsWith('speckit-modes-')), ['speckit-modes-increment'])
        assert.deepEqual(snapshot(path.join(item.project, '.specify/extensions/t066-unrelated')), protectedBefore)
        assert.equal(fs.readFileSync(path.join(item.project, 'history/old-report.md'), 'utf8'), '历史产物与引用必须保留。\n')
      }
      /**
       * 六退役动作只能实际执行一次，正常重复仍每次刷新当前三项。
       */
      const calls = item.targetCalls()
      assert.equal(calls.filter(call => call.args[1] === 'remove').length, 6)
      assert.equal(calls.filter(call => call.args[1] === 'add').length, 8)
      assert.deepEqual(snapshot(path.join(item.project, '.specify/extensions/modes/skills/task-increment')), snapshot(item.options.incrementRoot))
      /**
       * 当前三个 hook 的实际有效配置和完整来源均需由正式脚本交付。
       */
      const config = parse(fs.readFileSync(path.join(item.project, '.specify/extensions.yml'), 'utf8'))
      assert.deepEqual(Object.values(config.hooks).flat().map(hook => hook.extension).sort(), ['artifact-project-description', 'artifact-spec-analysis', 'implementation-preparation', 't066-unrelated'])
      /**
       * 完整文件集合独立取源字节，漏附件或正文不能靠目录存在过关。
       */
      for (const id of ['implementation-preparation', 'artifact-spec-analysis', 'artifact-project-description'])
        assert.deepEqual(snapshot(path.join(item.project, '.specify/extensions', id, 'skills', id)), snapshot(path.join(item.options.sourceRoot, id)))
    }
    finally { item.finish() }
  })
}

/**
 * 正式入口的保护不能依赖 T066 已知基线，目标必须实际零变更。
 */
for (const kind of ['missing-source', 'missing-collection', 'malformed-yaml', 'linked-source', 'extra-extension', 'extra-generated', 'edited-generated', 'empty-extension-directory', 'orphan-generated', 'orphan-hook-alias', 'bad-tool', 'missing-attachment', 'dangling-target-root']) {
  test(`T067 Bash 生产保护 ${kind}`, bashIntegration, () => {
    /**
     * 反例从真实旧四项登记复制，候选 baseline 不传入 Bash。
     */
    const item = bashFixture(`t067-protect-${kind}`)
    try {
      /**
       * 缺少来源和 YAML 类问题检查 hooks，其余检查 modes 更新风险。
       */
      let entry = 'commands'
      /**
       * 明确故障环境仅影响本例。
       */
      const overrides = {}
      switch (kind) {
        case 'missing-source':
          fs.unlinkSync(path.join(item.options.sourceRoot, 'implementation-preparation/SKILL.md'))
          entry = 'hooks'
          break
        case 'missing-collection':
          fs.unlinkSync(item.options.collectionFile)
          entry = 'hooks'
          break
        case 'malformed-yaml':
          fs.writeFileSync(path.join(item.project, '.specify/extensions.yml'), 'hooks: [broken\n')
          entry = 'hooks'
          break
        case 'linked-source':
          fs.symlinkSync(path.join(item.project, 'history'), path.join(item.options.incrementRoot, 'linked-directory'), 'dir')
          break
        case 'extra-extension':
          fs.writeFileSync(path.join(item.project, '.specify/extensions/modes/user-note.txt'), '用户文件')
          break
        case 'extra-generated':
          fs.writeFileSync(path.join(item.project, '.agents/skills/speckit-modes-tutor/user-note.txt'), '用户文件')
          break
        case 'edited-generated':
          fs.appendFileSync(path.join(item.project, '.agents/skills/speckit-modes-tutor/SKILL.md'), '\n用户正文改动\n')
          break
        case 'empty-extension-directory':
          fs.mkdirSync(path.join(item.project, '.specify/extensions/modes/user-empty'))
          break
        case 'orphan-generated':
          fs.mkdirSync(path.join(item.project, '.agents/skills/speckit-modes-guide'))
          fs.writeFileSync(path.join(item.project, '.agents/skills/speckit-modes-guide/SKILL.md'), '无登记目录')
          break
        case 'orphan-hook-alias': {
          /**
           * 官方先移除已登记扩展，随后注入 YAML 别名表示的孤立有效调用。
           */
          const removed = item.options.invoke(['extension', 'remove', 'artifact-issue-description', '--force'])
          assert.equal(removed.status, 0)
          fs.writeFileSync(path.join(item.project, '.specify/extensions.yml'), 'base: &old\n  extension: artifact-issue-description\n  command: artifact-issue-description\n  enabled: true\nhooks:\n  after_specify:\n    - *old\n')
          entry = 'hooks'
          break
        }
        case 'bad-tool':
          overrides.FOUNDRY_YQ = path.join(item.options.incrementRoot, 'SKILL.md')
          break
        case 'missing-attachment':
          fs.appendFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), '\n[缺失](references/missing.md)\n')
          break
        case 'dangling-target-root': {
          /**
           * 首次安装也不能把悬空发现根当成不存在的普通目录。
           */
          const removed = item.options.invoke(['extension', 'remove', 'modes', '--force'])
          assert.equal(removed.status, 0)
          fs.renameSync(path.join(item.project, '.agents/skills'), path.join(item.root, 'saved-normal-root'))
          fs.symlinkSync(path.join(item.root, 'outside-missing'), path.join(item.project, '.agents/skills'), 'dir')
          break
        }
      }
      /**
       * 故障后完整项目，包括未知文件与链接，均不得被生产脚本修改。
       */
      const before = snapshot(item.project)
      /**
       * 实际失败及日志由脚本产生，不能用候选抛错替代。
       */
      const result = item.run(entry, [], overrides)
      assert.notEqual(result.status, 0, result.stdout + result.stderr)
      assert.equal(item.targetCalls().length, 0)
      assert.deepEqual(snapshot(item.project), before)
    }
    finally { item.finish() }
  })
}

test('T067 Bash 来源减少附件后继续重复刷新且无关链接保持', bashIntegration, () => {
  /**
   * 合法减少文件不能污染下次刷新；无关发现目录的链接不属于模式删除范围。
   */
  const item = bashFixture('t067-source-reduction')
  try {
    fs.mkdirSync(path.join(item.options.incrementRoot, 'references'))
    fs.writeFileSync(path.join(item.options.incrementRoot, 'references/obsolete.md'), '将在下轮来源移除。\n')
    /**
     * 原正文用于合法回退本测试附加的引用，不猜测业务内容。
     */
    const original = fs.readFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), 'utf8')
    fs.appendFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), '\n[附件](references/obsolete.md)\n')
    /**
     * 初次必须实际通过官方生成带附件的入口。
     */
    const first = item.run('commands')
    assert.equal(first.status, 0, first.stdout + first.stderr)
    fs.unlinkSync(path.join(item.options.incrementRoot, 'references/obsolete.md'))
    fs.writeFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), original)
    /**
     * 第二次完成来源减少，第三次再证明正常重复。
     */
    for (let pass = 0; pass < 2; pass++) {
      /**
       * 每次都运行生产脚本，不能只比复制后的输入。
       */
      const result = item.run('commands')
      assert.equal(result.status, 0, result.stdout + result.stderr)
    }
    fs.symlinkSync(path.join(item.project, 'history'), path.join(item.project, '.agents/skills/user-other'), 'dir')
    /**
     * 这条链接在受影响目录之外，保护即可，不应冻结模式刷新。
     */
    const unrelated = item.run('commands')
    assert.equal(unrelated.status, 0, unrelated.stdout + unrelated.stderr)
    assert.equal(fs.readlinkSync(path.join(item.project, '.agents/skills/user-other')), path.join(item.project, 'history'))
    assert.equal(fs.existsSync(path.join(item.project, '.specify/extensions/modes/references/obsolete.md')), false)
  }
  finally { item.finish() }
})

test('T067 Bash 真实 CLI 启动失败保留退出码，修复后可继续', bashIntegration, () => {
  /**
   * 进程未找到应保留 shell 原始 127，不能被预检笼统改成 1。
   */
  const item = bashFixture('t067-spawn-failure')
  try {
    /**
     * 全项目摘要覆盖源码、用户历史和旧登记。
     */
    const before = snapshot(item.project)
    /**
     * 先验证只写自有临时项目的官方重现失败也准确传递。
     */
    const commands = item.run('commands', ['--cli', path.join(item.root, 'missing-specify')])
    assert.equal(commands.status, 127, commands.stdout + commands.stderr)
    /**
     * 再验证目标退役的真实启动失败，实际项目保持原样。
     */
    const hooks = item.run('hooks', ['--cli', path.join(item.root, 'missing-specify')])
    assert.equal(hooks.status, 127, hooks.stdout + hooks.stderr)
    assert.deepEqual(snapshot(item.project), before)
    /**
     * 解除工具故障后真实调用能够正常执行。
     */
    const recovered = item.run('hooks')
    assert.equal(recovered.status, 0, recovered.stdout + recovered.stderr)
  }
  finally { item.finish() }
})

test('T067 Bash 接收无顶层桥接的真实旧模式附件布局', bashIntegration, () => {
  /**
   * 旧正式脚本只复制 skills，预检不能擅自为旧输入补新桥接再比对。
   */
  const item = bashFixture('t067-old-unbridged-mode')
  try {
    /**
     * 重现旧脚本的目录结构，暂停模式仅是登记样本。
     */
    const input = path.join(item.root, 'old-unbridged-modes')
    fs.cpSync(path.join(item.project, '.specify/extensions/modes'), input, { recursive: true })
    fs.mkdirSync(path.join(input, 'skills/task-tutor/references'))
    fs.appendFileSync(path.join(input, 'skills/task-tutor/SKILL.md'), '\n[学习参考](references/learning-report.md)\n')
    fs.writeFileSync(path.join(input, 'skills/task-tutor/references/learning-report.md'), '# 旧正式附件\n[补充](more.md)\n')
    fs.writeFileSync(path.join(input, 'skills/task-tutor/references/more.md'), '被真实附件引用的补充资料。\n')
    /**
     * 旧生成结果来自真实官方，不创建顶层 references。
     */
    const installed = item.options.invoke(['extension', 'add', '--dev', input, '--force'])
    assert.equal(installed.status, 0, installed.stdout + installed.stderr)
    /**
     * 迁移到新 Increment 后旧入口必须实际退去。
     */
    const result = item.run('commands')
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.deepEqual(fs.readdirSync(path.join(item.project, '.agents/skills')).filter(name => name.startsWith('speckit-modes-')), ['speckit-modes-increment'])
  }
  finally { item.finish() }
})

/**
 * 三个集合都必须通过真实官方缩减，遗漏旧注销会留下额外入口并使断言失败。
 */
for (const variant of ['three', 'four', 'five']) {
  test(`T066 官方旧 ${variant} 集合缩减与重复刷新`, { skip: !migrationCli }, async () => {
    /**
     * 候选尚不存在时该导入明确失败，随后复用同一个测试。
     */
    const { runMigrationCandidate } = await import('./distribution/helpers/registration-migration.mjs')
    /**
     * 当前例完全独占，不触及工作区真实登记。
     */
    const item = migrationFixture(`commands-${variant}`, variant)
    try {
      /**
       * 无关扩展和历史产物的完整字节在迁移前固定。
       */
      const protectedBefore = snapshot(path.join(item.project, '.specify/extensions/t066-unrelated'))
      runMigrationCandidate(item.options)
      /**
       * 只列 modes 入口，官方原生技能继续保留。
       */
      const generated = fs.readdirSync(path.join(item.project, '.agents/skills')).filter(name => name.startsWith('speckit-modes-'))
      assert.deepEqual(generated, ['speckit-modes-increment'])
      /**
       * 实际登记与文件共同证明旧入口退去。
       */
      const registry = JSON.parse(fs.readFileSync(path.join(item.project, '.specify/extensions/.registry'), 'utf8'))
      assert.deepEqual(registry.extensions.modes.registered_commands.codex, ['speckit.modes.increment'])
      assert.deepEqual(snapshot(path.join(item.project, '.specify/extensions/t066-unrelated')), protectedBefore)
      assert.equal(fs.readFileSync(path.join(item.project, 'history/old-report.md'), 'utf8'), '历史产物与引用必须保留。\n')
      runMigrationCandidate(item.options)
      assert.deepEqual(fs.readdirSync(path.join(item.project, '.agents/skills')).filter(name => name.startsWith('speckit-modes-')), ['speckit-modes-increment'])
      assert.equal(item.calls.filter(call => call.args[1] === 'remove').length, 6)
    }
    finally { item.finish() }
  })
}

/**
 * 任一来源或归属检查被省略都会错误进入官方调用，危及用户内容。
 */
for (const kind of ['missing-increment', 'missing-preparation', 'missing-config', 'invalid-hook-command', 'missing-attachment', 'attachment-conflict', 'linked-source', 'extra-generated', 'edited-generated', 'extra-extension', 'orphan-generated', 'orphan-extension', 'orphan-hook', 'raw-source', 'registry-mismatch', 'uninitialized']) {
  test(`T066 调用前保护 ${kind}`, { skip: !migrationCli }, async () => {
    /**
     * 每个反例调用真实候选，官方调用必须为零。
     */
    const { runMigrationCandidate } = await import('./distribution/helpers/registration-migration.mjs')
    /**
     * 反例从官方旧四项模板独立复制。
     */
    const item = migrationFixture(`protect-${kind}`)
    try {
      switch (kind) {
        case 'missing-increment':
          fs.unlinkSync(path.join(item.options.incrementRoot, 'SKILL.md'))
          break
        case 'missing-preparation':
          fs.unlinkSync(path.join(item.options.sourceRoot, 'implementation-preparation/SKILL.md'))
          break
        case 'missing-config':
          fs.unlinkSync(item.options.collectionFile)
          break
        case 'invalid-hook-command': {
          /**
           * 人工坏配置不能把固定 hook 身份变成其他命令。
           */
          const collection = JSON.parse(fs.readFileSync(item.options.collectionFile, 'utf8'))
          collection.skill['implementation-preparation'].hook.before_implement.command = 'user-other-command'
          fs.writeFileSync(item.options.collectionFile, JSON.stringify(collection))
          break
        }
        case 'missing-attachment':
          fs.appendFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), '\n[附件](references/missing.md)\n')
          break
        case 'attachment-conflict': {
          /**
           * 同一路径不同字节的桥接输入不能互相覆盖。
           */
          const conflict = path.join(item.root, 'conflict')
          fs.mkdirSync(conflict)
          fs.mkdirSync(path.join(item.options.incrementRoot, 'references'))
          fs.writeFileSync(path.join(conflict, 'note.md'), '不同附件')
          fs.writeFileSync(path.join(item.options.incrementRoot, 'references/note.md'), '原附件')
          item.options.referenceRoots = [conflict]
          break
        }
        case 'linked-source':
          fs.symlinkSync(path.join(item.project, 'history'), path.join(item.options.incrementRoot, 'linked-directory'), 'dir')
          break
        case 'extra-generated':
          fs.writeFileSync(path.join(item.project, '.agents/skills/speckit-modes-tutor/user-note.md'), '用户附件')
          break
        case 'edited-generated':
          fs.appendFileSync(path.join(item.project, '.agents/skills/speckit-modes-tutor/SKILL.md'), '\n用户修改\n')
          break
        case 'extra-extension':
          fs.writeFileSync(path.join(item.project, '.specify/extensions/modes/user-note.md'), '用户扩展附件')
          break
        case 'orphan-generated':
          fs.mkdirSync(path.join(item.project, '.agents/skills/speckit-modes-guide'))
          fs.writeFileSync(path.join(item.project, '.agents/skills/speckit-modes-guide/SKILL.md'), '无登记入口')
          break
        case 'orphan-extension':
          fs.mkdirSync(path.join(item.project, '.specify/extensions/implementation-preparation'))
          fs.writeFileSync(path.join(item.project, '.specify/extensions/implementation-preparation/unknown.txt'), '无登记目录')
          break
        case 'orphan-hook': {
          /**
           * 官方移除后注入无登记的有效旧调用，仅用作反例。
           */
          const removed = item.options.invoke(['extension', 'remove', 'artifact-issue-description', '--force'])
          assert.equal(removed.status, 0)
          /**
           * 此处手写是明确的损坏输入，不是正向迁移实现。
           */
          const file = path.join(item.project, '.specify/extensions.yml')
          /**
           * 配置孤立调用不能被目录或 registry 扫描遗漏。
           */
          const config = parse(fs.readFileSync(file, 'utf8'))
          config.hooks.after_specify = [{ extension: 'artifact-issue-description', command: 'artifact-issue-description', enabled: true }]
          fs.writeFileSync(file, JSON.stringify(config))
          break
        }
        case 'raw-source':
          fs.mkdirSync(path.join(item.project, '.agents/skills/task-pair'))
          fs.writeFileSync(path.join(item.project, '.agents/skills/task-pair/SKILL.md'), '未知原始副本')
          break
        case 'registry-mismatch': {
          /**
           * 人工损坏输入单独标识，不以手写登记完成正向迁移。
           */
          const file = path.join(item.project, '.specify/extensions/.registry')
          /**
           * 额外登记命令不属于已核实旧集合。
           */
          const registry = JSON.parse(fs.readFileSync(file, 'utf8'))
          registry.extensions.modes.registered_commands.codex.push('user.custom')
          fs.writeFileSync(file, JSON.stringify(registry))
          break
        }
        case 'uninitialized':
          fs.unlinkSync(path.join(item.project, '.specify/init-options.json'))
          break
      }
      /**
       * 故障注入后的项目才是需要完整保持的用户现场。
       */
      const before = snapshot(item.project)
      fs.writeFileSync(path.join(item.root, 'before-case.json'), JSON.stringify(before))
      assert.throws(() => runMigrationCandidate(item.options))
      assert.equal(item.calls.length, 0)
      assert.deepEqual(snapshot(item.project), before)
    }
    finally { item.finish() }
  })
}

test('T066 迁移后的 Increment 正文和必要桥接附件实际可读', { skip: !migrationCli }, async () => {
  /**
   * 官方生成引用错误或丢失附件会使实际文件读取失败。
   */
  const { runMigrationCandidate } = await import('./distribution/helpers/registration-migration.mjs')
  /**
   * 正式正文只在本次副本增加清楚标识的最小附件样本。
   */
  const item = migrationFixture('commands-attachment')
  try {
    fs.mkdirSync(path.join(item.options.incrementRoot, 'references'))
    fs.writeFileSync(path.join(item.options.incrementRoot, 'references/t066-note.md'), 'T066_REFERENCE_ONLY\n')
    fs.appendFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), '\n[迁移附件样本](references/t066-note.md)\n')
    runMigrationCandidate(item.options)
    /**
     * 官方生成入口独立读取，描述和正文不能被包装器替换。
     */
    const generated = fs.readFileSync(path.join(item.project, '.agents/skills/speckit-modes-increment/SKILL.md'), 'utf8')
    assert.match(generated, /\.specify\/extensions\/modes\/references\/t066-note\.md/u)
    assert.equal(fs.readFileSync(path.join(item.project, '.specify/extensions/modes/references/t066-note.md'), 'utf8'), 'T066_REFERENCE_ONLY\n')
    /**
     * 生成后的全部语义正文必须包含来源原文，仅附件链接由官方改写。
     */
    const sourceBody = fs.readFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), 'utf8').replace(/^---\n[\s\S]*?\n---\n/u, '').trim()
    assert.ok(generated.includes(sourceBody.replaceAll('(references/', '(.specify/extensions/modes/references/')))
  }
  finally { item.finish() }
})

test('T066 来源减少附件后重复刷新不保留临时输入旧文件', { skip: !migrationCli }, async () => {
  /**
   * 同一输入目录的覆盖复制会残留旧附件，真实二次刷新必须能发现该缺陷。
   */
  const { runMigrationCandidate } = await import('./distribution/helpers/registration-migration.mjs')
  /**
   * 先建立带附件的实际官方当前入口，再在测试来源中合法移除。
   */
  const item = migrationFixture('commands-source-reduction')
  try {
    fs.mkdirSync(path.join(item.options.incrementRoot, 'references'))
    fs.writeFileSync(path.join(item.options.incrementRoot, 'references/retired-note.md'), '此附件将在下一次来源中移除。\n')
    /**
     * 保存原正文，避免用字符串猜测删除用户内容。
     */
    const source = fs.readFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), 'utf8')
    fs.appendFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), '\n[样本附件](references/retired-note.md)\n')
    runMigrationCandidate(item.options)
    fs.unlinkSync(path.join(item.options.incrementRoot, 'references/retired-note.md'))
    fs.writeFileSync(path.join(item.options.incrementRoot, 'SKILL.md'), source)
    runMigrationCandidate(item.options)
    assert.equal(fs.existsSync(path.join(item.project, '.specify/extensions/modes/skills/task-increment/references/retired-note.md')), false)
    assert.equal(fs.existsSync(path.join(item.project, '.specify/extensions/modes/references/retired-note.md')), false)
    assert.doesNotMatch(fs.readFileSync(path.join(item.project, '.agents/skills/speckit-modes-increment/SKILL.md'), 'utf8'), /retired-note\.md/u)
  }
  finally { item.finish() }
})
