import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createConversationSandbox } from './helpers/sandbox.mjs'

/**
 * 在独占文件系统和网络命名空间中观察固定版本的真实 Codex CLI。
 */
function runRecordingHostProbe() {
  /**
   * 真实临时 Git 仓库、子目录和仓库外资料区。
   */
  const sandbox = createConversationSandbox()
  try {
    /**
     * 探针只将选定的 CLI 二进制和测试驱动挂入临时根。
     */
    const codex = fs.realpathSync(execFileSync('/bin/sh', ['-c', 'command -v codex'], { encoding: 'utf8' }).trim())
    /**
     * 测试驱动用 Python 标准库控制真实伪终端及回环端点。
     */
    const driver = fileURLToPath(new URL('./helpers/recording-host.py', import.meta.url))
    /**
     * 隔离后的 Codex 状态通过私有绑定写进临时目录。
     */
    const state = path.join(sandbox.root, 'codex-state')
    /**
     * 保留当前 HOME 的路径，隔离子进程内将其映射到空的临时目录。
     */
    const home = os.homedir()
    /**
     * 子进程挂载的 CLI 路径。
     */
    const isolatedCodex = path.join(sandbox.root, 'codex')
    /**
     * 子进程挂载的驱动路径。
     */
    const isolatedDriver = path.join(sandbox.root, 'recording-host.py')
    fs.mkdirSync(state)
    fs.writeFileSync(isolatedCodex, '')
    fs.writeFileSync(isolatedDriver, '')
    /**
     * 全部试验文件和网络请求收束到隔离进程，最长运行两分钟。
     */
    const result = spawnSync('/usr/sbin/bwrap', [
      '--die-with-parent',
      '--unshare-user',
      '--unshare-net',
      '--unshare-pid',
      '--ro-bind',
      '/',
      '/',
      '--dev',
      '/dev',
      '--proc',
      '/proc',
      '--tmpfs',
      '/tmp',
      '--bind',
      sandbox.root,
      sandbox.root,
      '--bind',
      state,
      home,
      '--ro-bind',
      codex,
      isolatedCodex,
      '--ro-bind',
      driver,
      isolatedDriver,
      '--chdir',
      sandbox.root,
      '--',
      '/usr/bin/python3',
      isolatedDriver,
      isolatedCodex,
      sandbox.root,
    ], {
      encoding: 'utf8',
      env: { HOME: home, LANG: 'C.UTF-8', PATH: '/usr/bin:/bin:/usr/sbin:/sbin', TERM: 'xterm-256color' },
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    })
    assert.equal(result.error, undefined, String(result.error))
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
    return JSON.parse(result.stdout)
  }
  finally {
    sandbox.cleanup()
  }
}

assert.equal(process.platform, 'linux', '真实 CLI 探针需要 Linux 命名空间')

/**
 * 实测报告保留宿主行为，即使它证伪规格依赖的技术假设。
 */
const evidence = runRecordingHostProbe()
assert.equal(evidence.version, 'codex-cli 0.170.0')
assert.equal(evidence.firstRequestSawSavedPrompt, true)
assert.ok(evidence.requests.some(request => request.hasFirstPrompt))
assert.ok(evidence.events.some(event => event.hook_event_name === 'Stop' && event.last_assistant_message === 'T004_FIXED_FINAL_REPLY'))
assert.ok(evidence.events.some(event => event.hook_event_name === 'SessionEnd'))
assert.notEqual(evidence.openDate, evidence.firstPromptDate)
assert.equal(evidence.followups.length, 8)
assert.ok(evidence.followups.every(scenario => scenario.requests > 0 && scenario.recordsUnchanged))
assert.equal(evidence.receiptUnchanged, true)

/**
 * 通过真实线程标识校验跨界对照恢复了各自预定的合成会话。
 */
const scenariosByName = new Map(evidence.followups.map(scenario => [scenario.case, scenario]))
/**
 * 正常首轮所在的仓库内会话与 hook 工作目录。
 */
const initial = evidence.events.find(event => event.hook_event_name === 'SessionStart')
/**
 * 从同名前缀外部目录开启的合成会话。
 */
const outsideId = scenariosByName.get('outside')?.newSessions[0]
assert.ok(initial?.session_id)
assert.ok(outsideId)
assert.notEqual(outsideId, initial.session_id)
assert.equal(scenariosByName.get('untrusted')?.scopeEvents.length, 0)
assert.equal(scenariosByName.get('outside')?.scopeEvents.length, 0)
assert.ok(scenariosByName.get('interrupt')?.scopeEvents.some(event => event.event === 'Interrupt'))
assert.equal(scenariosByName.get('inside-resume-outside')?.scopeEvents[0]?.sessionId, outsideId)
assert.equal(scenariosByName.get('outside-resume-inside')?.scopeEvents[0]?.sessionId, initial.session_id)
assert.equal(scenariosByName.get('outside-resume-inside')?.scopeEvents[0]?.cwd, initial.cwd)
assert.notEqual(scenariosByName.get('outside-resume-inside')?.startedFrom, initial.cwd)
process.stdout.write(`${JSON.stringify(evidence)}\n`)
