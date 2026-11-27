import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createConversationSandbox } from './helpers/sandbox.mjs'

/**
 * 在空的状态目录与独占网络中实测宿主工具，认证和用户配置不进入探针。
 */
function runContentSourceProbe() {
  /**
   * 所有合成文件与故障清理只属于这份样例。
   */
  const sandbox = createConversationSandbox()
  try {
    /**
     * 复用当前安装的真实 CLI 二进制，避免复制其状态或认证文件。
     */
    const codex = fs.realpathSync(execFileSync('/bin/sh', ['-c', 'command -v codex'], { encoding: 'utf8' }).trim())
    /**
     * 动态定位隔离器，兼容本机已有的 /usr/bin 安装位置。
     */
    const bwrap = execFileSync('/bin/sh', ['-c', 'command -v bwrap'], { encoding: 'utf8' }).trim()
    /**
     * 临时主目录承接此次 CLI 的配置、线程和本地 MCP 状态。
     */
    const state = path.join(sandbox.root, 'codex-state')
    fs.mkdirSync(state)
    /**
     * 既有伪终端及本次内容探针只读挂入临时根。
     */
    const mounts = [
      [codex, 'codex'],
      [fileURLToPath(new URL('./helpers/recording-host.py', import.meta.url)), 'recording-host.py'],
      [fileURLToPath(new URL('./helpers/content-source.py', import.meta.url)), 'content-source.py'],
    ]
    /**
     * 产品仓库为只读，工具的完整写入与网络活动收束到独占样例。
     */
    const args = [
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
      os.homedir(),
    ]
    /**
     * 每个挂载声明均创建独立占位，避免写入来源文件。
     */
    for (const [source, target] of mounts) {
      fs.writeFileSync(path.join(sandbox.root, target), '')
      args.push('--ro-bind', source, path.join(sandbox.root, target))
    }
    args.push('--chdir', sandbox.root, '--', '/usr/bin/python3', path.join(sandbox.root, 'content-source.py'), path.join(sandbox.root, 'codex'), sandbox.root)
    /**
     * 受控回包执行真实工具；超时或协议错误不能冒记为来源验证通过。
     */
    const result = spawnSync(bwrap, args, {
      encoding: 'utf8',
      env: { HOME: os.homedir(), LANG: 'C.UTF-8', PATH: '/usr/bin:/bin:/usr/sbin:/sbin', TERM: 'xterm-256color' },
      timeout: 100_000,
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

assert.equal(process.platform, 'linux', '工具来源探针需要 Linux 命名空间')

/**
 * 观测覆盖实际工具原值与可见缺口，不代表真实模型自主记录已经通过。
 */
const evidence = runContentSourceProbe()
/**
 * 按业务场景定位主会话实际取得的工具返回。
 */
const calls = new Map(evidence.calls.map(call => [call.case, call]))
/**
 * 从宿主返回包装中解析短输出的真实 JSON 原值。
 */
const short = JSON.parse(calls.get('short').output.split('Output:\n')[1])
assert.deepEqual(short.args, evidence.expected.shortArguments)
assert.equal(short.text, '短输出 α\r\n末行  ')
assert.match(short.cwd, /repository-outside$/)
assert.equal(evidence.sessionMetadata.find(session => session.id === short.threadId)?.source, 'cli')
assert.match(calls.get('long').output, /Warning: truncated output/)
assert.match(calls.get('long-expanded').output, /Warning: truncated output/)
assert.ok(Buffer.byteLength(calls.get('long').output) < evidence.expected.longUtf8Bytes)
assert.ok(Buffer.byteLength(calls.get('long-expanded').output) < evidence.expected.longUtf8Bytes)
assert.equal(calls.get('stream').output.split('Output:\n')[1], 'STREAM_A\n')
assert.equal(calls.get('stream-poll').output.split('Output:\n')[1], 'STREAM_B\n')
assert.equal(evidence.longFile.bytes, evidence.expected.longUtf8Bytes)
assert.equal(evidence.longFile.sha256, evidence.expected.longSha256)
/**
 * 完整文件的摘要还必须由实际工具返回，不能由验证端侧读替代模型可见来源。
 */
const longFileCheck = JSON.parse(calls.get('long-file-check').output.split('Output:\n')[1])
assert.equal(longFileCheck.bytes, evidence.expected.longUtf8Bytes)
assert.equal(longFileCheck.sha256, evidence.expected.longSha256)
/**
 * 除流式首次返回保持运行外，每项终端工具必须真实执行成功。
 */
for (const call of evidence.calls.filter(call => ['exec_command', 'write_stdin'].includes(call.name))) {
  assert.match(call.output, call.case === 'stream' ? /Process running with session ID \d+/ : /Process exited with code 0/)
}
assert.equal(evidence.savedAttachmentSha256, evidence.expected.binarySha256)
assert.equal(evidence.savedToolImageSha256, evidence.expected.pngSha256)
assert.ok(evidence.imageInputs.some(input => input.matchesOriginal))
/**
 * MCP 返回的图片块与文件来源分别验证，图片可见不能代替原件保存。
 */
const toolImage = calls.get('mcp').output.find(block => block.type === 'input_image')
assert.ok(toolImage.image_url.startsWith('data:image/png;base64,'))
assert.equal(createHash('sha256').update(Buffer.from(toolImage.image_url.split(',')[1], 'base64')).digest('hex'), evidence.expected.pngSha256)
/**
 * 工具附件复制以模型实际取得的元数据为依据，并发生在 MCP 返回之后。
 */
const toolMetadata = JSON.parse(calls.get('mcp').output.find(block => block.type === 'input_text' && block.text.startsWith('{')).text)
assert.equal(toolMetadata.label, '工具附件 α 带空格')
assert.equal(toolMetadata.sha256, evidence.expected.pngSha256)
assert.ok(calls.get('tool-image-copy').arguments.cmd.includes(toolMetadata.path))
assert.ok(evidence.calls.indexOf(calls.get('tool-image-copy')) > evidence.calls.indexOf(calls.get('mcp')))
assert.equal(JSON.parse(calls.get('tool-image-copy').output.split('Output:\n')[1]).sha256, toolMetadata.sha256)
/**
 * 由主会话真实派发得到的子线程身份，与宿主来源关系交叉核对。
 */
const childId = JSON.parse(calls.get('spawn').output).agent_id
assert.equal(evidence.sessionMetadata.find(session => session.id === childId)?.source.subagent.thread_spawn.parent_thread_id, short.threadId)
assert.equal(JSON.parse(calls.get('child-wait').output).status[childId].completed, 'T005_CHILD_RETURN_ALPHA')
assert.ok(JSON.parse(calls.get('child-interaction').output).submission_id)
assert.equal(JSON.parse(calls.get('child-wait-followup').output).status[childId].completed, 'T005_CHILD_RETURN_BETA')
assert.equal(evidence.persistedParentCalls.length, evidence.calls.length)
assert.ok(evidence.persistedParentCalls.every(call => call.matchesSentArguments && call.threadId === short.threadId && call.turnId))
assert.equal(new Set(evidence.persistedParentCalls.map(call => call.turnId)).size, 1)
assert.deepEqual(evidence.persistedParentCalls.map(call => [call.callId, call.name, call.namespace ?? null]), evidence.calls.map(call => [call.callId, call.name, call.namespace ?? null]))
assert.equal(evidence.noHooks, true)
assert.equal(evidence.realModel, false)
process.stdout.write(`${JSON.stringify(evidence)}\n`)
