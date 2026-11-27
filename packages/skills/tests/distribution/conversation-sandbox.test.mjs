import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'

/**
 * 先核对尚未实现的样例导出，让缺失能力以断言失败呈现。
 * @returns {Promise<Function>} 对话样例创建入口。
 */
async function loadSandboxFactory() {
  /**
   * 待实现的真实模块，缺文件时不使用测试替身。
   */
  const helpers = await import('../conversation-workflow/helpers/sandbox.mjs').catch((error) => {
    if (error.code !== 'ERR_MODULE_NOT_FOUND')
      throw error
    return {}
  })
  assert.equal(typeof helpers.createConversationSandbox, 'function', 'T002 尚缺 createConversationSandbox 实现')
  return helpers.createConversationSandbox
}

test('两个项目位于目标仓库内，对照及资料目录位于仓库外且 Git 基线干净', async (t) => {
  /**
   * 当前用例读取的真实创建入口。
   */
  const create = await loadSandboxFactory()
  /**
   * 真实文件系统与 Git 样例。
   */
  const fixture = create()
  t.after(fixture.cleanup)
  assert.equal(fixture.projects.length, 2)
  /**
   * 各项目通过真实 Git 发现得到的根目录。
   */
  for (const project of fixture.projects) {
    assert.equal(fs.statSync(project).isDirectory(), true)
    assert.equal(fixture.git(['-C', project, 'rev-parse', '--show-toplevel']), fixture.repository)
  }
  assert.equal(path.dirname(fixture.outside), path.dirname(fixture.repository))
  assert.equal(fixture.outside.startsWith(fixture.repository), true)
  assert.equal(path.relative(fixture.repository, fixture.outside).startsWith(`..${path.sep}`), true)
  assert.equal(path.relative(fixture.repository, fixture.records).startsWith(`..${path.sep}`), true)
  assert.deepEqual(fixture.snapshot(), { head: fixture.initialRevision, status: '', worktree: '', index: '' })
})

test('附件保留二进制原值，长输出工具实际产生完整中文与首尾标记', async (t) => {
  /**
   * 当前用例的样例入口。
   */
  const create = await loadSandboxFactory()
  /**
   * 包含真实附件和工具命令的临时样例。
   */
  const fixture = create()
  t.after(fixture.cleanup)
  /**
   * 从文件重新取得的附件原件。
   */
  const bytes = fs.readFileSync(fixture.attachment.path)
  assert.deepEqual([...bytes], [0, 255, 13, 10, 128, 1])
  assert.equal(createHash('sha256').update(bytes).digest('hex'), fixture.attachment.sha256)
  /**
   * 执行真实工具，允许超过普通终端截断长度的输出。
   */
  const output = execFileSync(fixture.longOutput.command, fixture.longOutput.args, { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  assert.equal(output, `开始\n${'片段 α\n'.repeat(16384)}结束\n`)
  assert.equal(Buffer.byteLength(output), 163854)
  assert.equal(output, fixture.longOutput.expected)
})

test('Git 快照分别反映真实工作区、暂存区和已提交身份', async (t) => {
  /**
   * 当前用例的样例入口。
   */
  const create = await loadSandboxFactory()
  /**
   * 用于产生独立暂存和未暂存内容的真实仓库。
   */
  const fixture = create()
  t.after(fixture.cleanup)
  fs.writeFileSync(path.join(fixture.repository, 'README.md'), '暂存版本\n')
  fixture.git(['add', 'README.md'])
  fs.writeFileSync(path.join(fixture.repository, 'README.md'), '工作区版本\n')
  /**
   * 调用方可以对照提交动作的三个实际结果。
   */
  const current = fixture.snapshot()
  assert.equal(current.head, fixture.initialRevision)
  assert.match(current.status, /^MM README\.md$/m)
  assert.match(current.worktree, /\+工作区版本/)
  assert.match(current.index, /\+暂存版本/)
  assert.equal(current.index.includes('工作区版本'), false)
})

test('Git diff 快照保留最后一行的尾随空白以便准确比较字节变化', async (t) => {
  /**
   * 当前用例的样例入口。
   */
  const create = await loadSandboxFactory()
  /**
   * 用真实 Git 生成以空格结束的 diff 内容。
   */
  const fixture = create()
  t.after(fixture.cleanup)
  fs.writeFileSync(path.join(fixture.repository, 'README.md'), '尾随空白  \n')
  assert.match(fixture.snapshot().worktree, /\+尾随空白 {2}$/m)
  fixture.git(['add', 'README.md'])
  assert.match(fixture.snapshot().index, /\+尾随空白 {2}$/m)
  fs.writeFileSync(path.join(fixture.repository, 'README.md'), '尾随 CR\r\n')
  assert.match(fixture.snapshot().worktree, /\+尾随 CR\r$/m)
  fixture.git(['add', 'README.md'])
  assert.match(fixture.snapshot().index, /\+尾随 CR\r$/m)
})

test('真实写入阻断产生 ENOTDIR，重复阻断及恢复保留已有记录', async (t) => {
  /**
   * 当前用例的样例入口。
   */
  const create = await loadSandboxFactory()
  /**
   * 故障仅作用于这次样例的资料写入目标。
   */
  const fixture = create()
  t.after(fixture.cleanup)
  fs.writeFileSync(path.join(fixture.writable, 'before.md'), '已经保存的记录\n')
  fixture.blockWrites()
  fixture.blockWrites()
  assert.throws(() => fs.writeFileSync(path.join(fixture.writable, 'next.md'), '待补内容'), { code: 'ENOTDIR' })
  fixture.restoreWrites()
  fixture.restoreWrites()
  assert.equal(fs.readFileSync(path.join(fixture.writable, 'before.md'), 'utf8'), '已经保存的记录\n')
  fs.writeFileSync(path.join(fixture.writable, 'next.md'), '实际补写\n')
  assert.equal(fs.readFileSync(path.join(fixture.writable, 'next.md'), 'utf8'), '实际补写\n')
  assert.equal(fixture.snapshot().status, '')
})

test('恢复中途失败后可以重试并保留阻断前的记录', async (t) => {
  /**
   * 当前用例的样例入口。
   */
  const create = await loadSandboxFactory()
  /**
   * 在恢复的第二步制造真实、可恢复的文件系统失败。
   */
  const fixture = create()
  t.after(fixture.cleanup)
  fs.writeFileSync(path.join(fixture.writable, 'before.md'), '恢复前原件\n')
  fixture.blockWrites()
  /**
   * 临时移开保留目录，使占位已删除而 rename 暂时失败。
   */
  const parkedAway = path.join(fixture.root, 'parked-away')
  fs.renameSync(fixture.parked, parkedAway)
  assert.throws(fixture.restoreWrites, { code: 'ENOENT' })
  fs.renameSync(parkedAway, fixture.parked)
  fixture.restoreWrites()
  assert.equal(fs.readFileSync(path.join(fixture.writable, 'before.md'), 'utf8'), '恢复前原件\n')
})

test('清理只删除自己的临时根，重复清理不影响其他并行样例', async (t) => {
  /**
   * 当前用例的样例入口。
   */
  const create = await loadSandboxFactory()
  /**
   * 第一份待清理样例。
   */
  const first = create()
  t.after(first.cleanup)
  /**
   * 必须保持完整的另一份并行样例。
   */
  const second = create()
  t.after(second.cleanup)
  assert.notEqual(first.root, second.root)
  first.blockWrites()
  first.cleanup()
  first.cleanup()
  assert.equal(fs.existsSync(first.root), false)
  assert.equal(fs.statSync(second.repository).isDirectory(), true)
  assert.equal(second.snapshot().status, '')
  assert.deepEqual([...fs.readFileSync(second.attachment.path)], [0, 255, 13, 10, 128, 1])
})

test('继承的 Git 仓库、索引、对象和配置覆盖不能改写另一份真实样例', async (t) => {
  /**
   * 用于建立被保护真实仓库的入口。
   */
  const create = await loadSandboxFactory()
  /**
   * 外部哨兵仍由本用例独占，绝不使用用户的实际仓库。
   */
  const sentinel = create()
  t.after(sentinel.cleanup)
  /**
   * 子进程执行前的真实索引字节。
   */
  const indexBefore = fs.readFileSync(path.join(sentinel.repository, '.git/index'))
  /**
   * 子进程执行前的对象文件清单。
   */
  const objectsBefore = fs.readdirSync(path.join(sentinel.repository, '.git/objects'), { recursive: true }).sort()
  /**
   * 被错误继承时会执行的用户 hook，用于检查隔离结果。
   */
  const hookDirectory = path.join(sentinel.root, 'poison-hooks')
  fs.mkdirSync(hookDirectory)
  fs.writeFileSync(path.join(hookDirectory, 'pre-commit'), '#!/bin/sh\nprintf poisoned > "$PWD/poisoned"\n', { mode: 0o755 })
  /**
   * 子进程只写自身新建样例，结果通过标准输出交回。
   */
  const script = `
import { createConversationSandbox } from ${JSON.stringify(new URL('../conversation-workflow/helpers/sandbox.mjs', import.meta.url).href)}
/**
 * 子进程独占的真实样例。
 */
const fixture = createConversationSandbox()
try { process.stdout.write(JSON.stringify(fixture.snapshot())) } finally { fixture.cleanup() }
`
  /**
   * 真实子进程带有指向哨兵仓库的 Git 覆盖项。
   */
  const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_DIR: path.join(sentinel.repository, '.git'),
      GIT_WORK_TREE: sentinel.repository,
      GIT_INDEX_FILE: path.join(sentinel.repository, '.git/index'),
      GIT_OBJECT_DIRECTORY: path.join(sentinel.repository, '.git/objects'),
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'core.hooksPath',
      GIT_CONFIG_VALUE_0: hookDirectory,
    },
  }))
  assert.equal(result.status, '')
  assert.deepEqual(fs.readFileSync(path.join(sentinel.repository, '.git/index')), indexBefore)
  assert.deepEqual(fs.readdirSync(path.join(sentinel.repository, '.git/objects'), { recursive: true }).sort(), objectsBefore)
  assert.equal(fs.existsSync(path.join(sentinel.repository, 'poisoned')), false)
  assert.equal(sentinel.snapshot().head, sentinel.initialRevision)
  assert.equal(sentinel.snapshot().status, '')
})
