import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createSandbox } from './sandbox.mjs'

/**
 * 测试可以直接使用构建交付物，仍会复制到独立目录执行。
 */
const scriptRoot = process.env.FOUNDRY_ENTRY_SCRIPT_DIR || fileURLToPath(new URL('../../script', import.meta.url))

/**
 * 创建带空格路径的独立工具与消费项目，只从入口读取内部模块。
 * @param {string} source 用于观察调度行为的 Bash 子模块。
 * @returns {ReturnType<typeof createSandbox> & {entry: string, scripts: string}} 独立夹具。
 */
function fixture(source = '#!/usr/bin/env bash\nprintf "%s\\0" "$PWD" "$@"\n') {
  /**
   * 所有调用方目录和工具文件都由本次测试独占。
   */
  const sandbox = createSandbox()
  /**
   * 路径包含空格，验证不进行 shell 字符串拼接。
   */
  const scripts = path.join(sandbox.root, 'tool with spaces', 'script')
  /**
   * 正在测试的唯一对外入口。
   */
  const entry = path.join(scripts, 'index.mjs')
  fs.mkdirSync(path.join(scripts, 'install-skills'), { recursive: true })
  if (fs.existsSync(path.join(scriptRoot, 'index.mjs')))
    fs.copyFileSync(path.join(scriptRoot, 'index.mjs'), entry)
  fs.writeFileSync(path.join(scripts, 'install-skills/install-skills.sh'), source)
  fs.writeFileSync(path.join(scripts, 'install-skills/install-skills.ps1'), 'exit 0\n')
  return { ...sandbox, scripts, entry }
}

/**
 * 真实启动 Node 总入口，不调用其内部函数代替进程行为。
 * @param {object} item 测试夹具。
 * @param {string[]} args 用户原始参数数组。
 * @returns {import('node:child_process').SpawnSyncReturns<string>} 原始进程结果。
 */
function run(item, args = ['--version', '0.1.0']) {
  /**
   * Node 可执行文件为绝对路径，因此能单独检验缺失 Bash 的前置错误。
   */
  const result = spawnSync(process.execPath, [item.entry, ...args], { cwd: item.project, env: item.env, encoding: 'utf8', timeout: 15000 })
  assert.ifError(result.error)
  assert.equal(result.signal, null, result.stderr)
  return result
}

test('唯一入口直接接参数，保留消费 cwd、空格和特殊字符，不提供子命令', () => {
  /**
   * 子模块只观察 Node 的调度边界，不代替真实安装测试。
   */
  const item = fixture()
  try {
    /**
     * 特殊字符必须作为普通参数传入，不能执行为 shell 代码。
     */
    const args = ['--source-dir', '/path with spaces', '--version', '0.1.0', '--agent', 'codex', '--skill', 'literal; touch unexpected', '--no-mount']
    /**
     * 子模块返回的真实参数与工作目录。
     */
    const result = run(item, args)
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(result.stdout.split('\0').slice(0, -1), [item.project, ...args])
    assert.equal(fs.existsSync(path.join(item.project, 'unexpected')), false)
  }
  finally { item.cleanup() }
})

test('子模块非零退出码完整保留，不改写成成功', () => {
  /**
   * 失败子模块保留自身诊断和退出码。
   */
  const item = fixture('#!/usr/bin/env bash\nprintf "child failure" >&2\nexit 17\n')
  try {
    /**
     * 入口不吞掉平台脚本的失败。
     */
    const result = run(item)
    assert.equal(result.status, 17)
    assert.match(result.stderr, /child failure/u)
  }
  finally { item.cleanup() }
})

test('缺少平台 shell 或内部脚本明确失败，不尝试执行其他模块', () => {
  /**
   * 每种故障都在独立工具副本中注入。
   */
  for (const missing of ['shell', 'script']) {
    /**
     * 错误不会破坏开发仓库的真实平台模块。
     */
    const item = fixture()
    try {
      if (missing === 'shell')
        item.env.PATH = ''
      else
        fs.unlinkSync(path.join(item.scripts, 'install-skills/install-skills.sh'))
      /**
       * 前置错误必须被结构化报告。
       */
      const result = run(item)
      assert.equal(result.status, 2)
      assert.equal(JSON.parse(result.stdout).overall, 'failed')
    }
    finally { item.cleanup() }
  }
})

test('帮助只展示唯一入口和参数；无参数不运行安装', () => {
  /**
   * 平台子模块一旦被调用会失败，用于保护帮助与参数错误分支。
   */
  const item = fixture('exit 99\n')
  try {
    /**
     * 帮助由总入口解释，使用者不必知道内部脚本名称。
     */
    const help = run(item, ['--help'])
    assert.equal(help.status, 0)
    assert.match(help.stdout, /node script\/index\.mjs \[参数\]/u)
    assert.match(help.stdout, /--category/u)
    assert.match(help.stdout, /--no-mount/u)
    /**
     * 无参数给出使用说明并明确拒绝执行。
     */
    const empty = run(item, [])
    assert.equal(empty.status, 2)
  }
  finally { item.cleanup() }
})

test('平台映射固定为 Bash/PowerShell，未知平台拒绝；映射断言不算平台验收', async () => {
  assert.ok(fs.existsSync(path.join(scriptRoot, 'index.mjs')), '缺少唯一 Node 入口')
  /**
   * 导入入口只获得纯平台选择能力，不启动安装或修改进程状态。
   */
  const entry = await import(pathToFileURL(path.join(scriptRoot, 'index.mjs')).href)
  /**
   * 同一目录下两种平台实现的准确参数。
   */
  const directory = path.resolve('/tmp', 'entry with spaces')
  assert.deepEqual(entry.resolveInvocation('linux', directory), { command: 'bash', args: [path.join(directory, 'install-skills/install-skills.sh')] })
  assert.deepEqual(entry.resolveInvocation('darwin', directory), { command: 'bash', args: [path.join(directory, 'install-skills/install-skills.sh')] })
  assert.deepEqual(entry.resolveInvocation('win32', directory), { command: 'pwsh', args: ['-NoProfile', '-NonInteractive', '-File', path.join(directory, 'install-skills/install-skills.ps1')] })
  assert.throws(() => entry.resolveInvocation('aix', directory), /不支持/u)
})

/**
 * 对每种取消信号都观察平台子进程自己的退出证据。
 * @param {NodeJS.Signals} signal 用户发送给 Node 总入口的信号。
 * @param {number} expectedCode 平台子模块预期退出码。
 */
async function verifyCancellation(signal, expectedCode) {
  /**
   * 只有收到实际 TERM 才会落下停止证据，避免只验证 Node 自己退出。
   */
  const item = fixture(`#!/usr/bin/env bash\ntrap 'printf stopped > "$FOUNDRY_ENTRY_STOPPED"; exit ${expectedCode}' ${signal.slice(3)}\nprintf ready\nwhile :; do sleep 0.05; done\n`)
  try {
    await new Promise((resolve, reject) => {
      /**
       * 子进程对取消的实际确认文件。
       */
      const stopped = path.join(item.root, 'stopped')
      /**
       * 独立进程组便于测试超时后清理，不接触其他任务进程。
       */
      const child = spawn(process.execPath, [item.entry, '--version', '0.1.0'], { cwd: item.project, env: { ...item.env, FOUNDRY_ENTRY_STOPPED: stopped }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
      /**
       * 防止错误实现留下无限等待的后台子模块。
       */
      const deadline = setTimeout(() => {
        process.kill(-child.pid, 'SIGKILL')
        reject(new Error('总入口未完成取消传播'))
      }, 5000)
      child.once('error', (error) => {
        clearTimeout(deadline)
        reject(error)
      })
      child.stdout.once('data', () => child.kill(signal))
      child.once('close', (code) => {
        clearTimeout(deadline)
        try {
          assert.equal(code, expectedCode)
          assert.equal(fs.readFileSync(stopped, 'utf8'), 'stopped')
          resolve()
        }
        catch (error) { reject(error) }
      })
    })
  }
  finally { item.cleanup() }
}

test('SIGTERM 转发给当前平台子进程，并等待其停止后返回', () => verifyCancellation('SIGTERM', 143))
test('SIGINT 转发给当前平台子进程，并等待其停止后返回', () => verifyCancellation('SIGINT', 130))

test('取消时连同平台模块的前台后代一起停止，不能在取消后继续写入', async () => {
  /**
   * ready 由后代进程发出，确保取消发生时前台命令已经启动。
   */
  const item = fixture('#!/usr/bin/env bash\ntrap \'exit 143\' TERM\nbash -c \'printf ready; sleep 1; printf mutated > "$FOUNDRY_ENTRY_WRITE"\'\n')
  try {
    await new Promise((resolve, reject) => {
      /**
       * 取消后禁止新增的实际写入，用来证明没有只停止外层 shell。
       */
      const marker = path.join(item.root, 'cancelled-write')
      /**
       * 入口在独立测试进程组运行，实验不发送信号给其他任务。
       */
      const child = spawn(process.execPath, [item.entry, '--version', '0.1.0'], { cwd: item.project, env: { ...item.env, FOUNDRY_ENTRY_WRITE: marker }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
      /**
       * 失败实现也不能无限阻塞工程验证。
       */
      const deadline = setTimeout(() => {
        process.kill(-child.pid, 'SIGKILL')
        reject(new Error('前台后代没有随取消停止'))
      }, 5000)
      child.once('error', (error) => {
        clearTimeout(deadline)
        reject(error)
      })
      child.stdout.once('data', () => child.kill('SIGTERM'))
      child.once('close', (code) => {
        clearTimeout(deadline)
        try {
          assert.equal(code, 143)
          assert.equal(fs.existsSync(marker), false, '取消后前台后代仍写入了文件')
          resolve()
        }
        catch (error) { reject(error) }
      })
    })
  }
  finally { item.cleanup() }
})

test('从独立 Node 入口调用真实 Linux 安装器，完整安装技能和二进制附件', () => {
  /**
   * 这项真实安装使用产品脚本，不使用前面的观察用子模块。
   */
  const item = fixture()
  try {
    fs.cpSync(scriptRoot, item.scripts, { recursive: true })
    /**
     * 自建最小发布根，只证明独立调用与安装，不代表正式发布已实现。
     */
    const release = path.join(item.root, 'release')
    /**
     * 手写二进制附件与正文，预期摘要独立于安装器。
     */
    const files = { 'skills/coding/demo/SKILL.md': '# 安装核验\n', 'skills/coding/demo/references/data.bin': new Uint8Array([0, 255, 13, 10]) }
    /**
     * 固定版本的最小实验清单。
     */
    const manifest = { schemaVersion: 1, version: '0.1.0', sourceRevision: '1'.repeat(40), skills: [{ name: 'demo', category: 'coding', directory: 'skills/coding/demo', sourceFiles: Object.keys(files), requiresSkills: [] }], files: [] }
    /**
     * 逐文件保存实际字节，Node 总入口不参与清单或安装算法。
     */
    for (const [relative, bytes] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(release, relative)), { recursive: true })
      fs.writeFileSync(path.join(release, relative), bytes)
      manifest.files.push({ path: relative, bytes: fs.statSync(path.join(release, relative)).size, sha256: createHash('sha256').update(bytes).digest('hex') })
    }
    fs.writeFileSync(path.join(release, 'release.json'), JSON.stringify(manifest))
    /**
     * 使用者只运行这一个入口，没有 install 子命令。
     */
    const result = run(item, ['--source-dir', release, '--version', '0.1.0', '--agent', 'codex', '--skill', 'demo', '--no-mount'])
    assert.equal(result.status, 0, result.stderr + result.stdout)
    assert.equal(JSON.parse(result.stdout).overall, 'success')
    /**
     * 全部文件都应由真实内部安装脚本提交到消费项目。
     */
    for (const relative of Object.keys(files)) {
      assert.deepEqual(fs.readFileSync(path.join(item.project, '.agents/skills/demo', relative.replace('skills/coding/demo/', ''))), fs.readFileSync(path.join(release, relative)))
    }
    assert.equal(fs.existsSync(path.join(item.project, 'package.json')), false)
    assert.equal(fs.existsSync(path.join(item.project, 'node_modules')), false)
  }
  finally { item.cleanup() }
})
