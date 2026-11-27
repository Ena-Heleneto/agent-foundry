import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createConversationSandbox } from './helpers/sandbox.mjs'

/**
 * 驱动未启用记录入口的合成基线，隔离认证、会话、写入和模型端点。
 */
function observeBaseline() {
  /**
   * 复用已有仓库、附件和 Git 样例，仅操作本次临时根。
   */
  const sandbox = createConversationSandbox()
  try {
    /**
     * 解析本机已有工具的实际路径。
     */
    const binary = name => fs.realpathSync(execFileSync('/bin/sh', ['-c', `command -v ${name}`], { encoding: 'utf8' }).trim())
    /**
     * 隔离后的主目录身份与状态目录，不复制任何宿主配置。
     */
    const state = path.join(sandbox.root, 'codex-state')
    fs.mkdirSync(state)
    /**
     * 既有伪终端和本次驱动以只读文件挂载。
     */
    const mounts = [
      [binary('codex'), 'codex'],
      [fileURLToPath(new URL('./helpers/recording-host.py', import.meta.url)), 'recording_host.py'],
      [fileURLToPath(new URL('./helpers/recording-regression.py', import.meta.url)), 'recording-regression.py'],
    ]
    /**
     * CLI 及其工具只能写入本次样例，并且只能访问回环网络。
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
     * 每个挂载目标独占一个占位文件。
     */
    for (const [source, target] of mounts) {
      fs.writeFileSync(path.join(sandbox.root, target), '')
      args.push('--ro-bind', source, path.join(sandbox.root, target))
    }
    args.push('--chdir', sandbox.root, '--', '/usr/bin/python3', '-B', path.join(sandbox.root, 'recording-regression.py'), path.join(sandbox.root, 'codex'), sandbox.root)
    /**
     * 基线失败由下方的业务断言报告，驱动异常单独保留。
     */
    const result = spawnSync(binary('bwrap'), args, {
      encoding: 'utf8',
      env: { HOME: os.homedir(), LANG: 'C.UTF-8', PATH: '/usr/bin:/bin:/usr/sbin:/sbin', TERM: 'xterm-256color' },
      timeout: 120_000,
      maxBuffer: 8 * 1024 * 1024,
    })
    assert.equal(result.error, undefined, String(result.error))
    assert.equal(result.status, 0, `隔离驱动未完成：${result.stderr}`)
    return JSON.parse(result.stdout)
  }
  finally {
    sandbox.cleanup()
  }
}

/**
 * 读取同一会话在一个观测阶段实际生成的成对文档。
 */
function pair(files, threadId, openingDate) {
  /**
   * 开启日和线程身份取自真实宿主事件，路径沿资料契约。
   */
  const index = `${openingDate}/index/${threadId}.md`
  /**
   * 详情独立读回，不从索引文字推定它已保存。
   */
  const details = `${openingDate}/details/${threadId}.md`
  assert.ok(files[index], `缺少实际索引 ${index}`)
  assert.ok(files[details], `缺少实际详情 ${details}`)
  return { index: files[index].text, details: files[details].text }
}

/**
 * 将真实工具调用按测试场景中的业务动作定位。
 */
function call(turn, label) {
  /**
   * 调用 ID 动态生成，动作标签用于查找同一次实际调用。
   */
  const result = Object.values(turn.calls).find(item => item.label === label)
  assert.ok(result, `缺少实际工具调用 ${label}`)
  return result
}

/**
 * 校验多段不同证据出现在同一份详情中且遵守发生顺序。
 */
function inOrder(text, ...markers) {
  /**
   * 每个标记必须出现在上一个标记之后。
   */
  let start = 0
  for (const marker of markers) {
    /**
     * 使用原始文字定位，不把摘要替代原文。
     */
    const position = text.indexOf(marker, start)
    assert.notEqual(position, -1, `详情缺少按序出现的 ${marker}`)
    start = position + marker.length
  }
}

/**
 * 在同一观测中统计字面材料出现次数，验证不同事件与重复回放的区别。
 */
function occurrences(text, marker) {
  return text.split(marker).length - 1
}

/**
 * 本探针由显式 Node 命令运行，使用该进程的内置测试入口。
 */
const nodeTest = process.getBuiltinModule('node:test')

nodeTest.test('记录回归', async (t) => {
  /**
   * T014 可使用相同观测字段载入正式入口的实测结果，默认运行实现前对照。
   */
  const evidence = process.env.FOUNDRY_RECORDING_OBSERVATION
    ? JSON.parse(fs.readFileSync(process.env.FOUNDRY_RECORDING_OBSERVATION, 'utf8'))
    : observeBaseline()
  /**
   * 保留实际回包、宿主时间和文件快照，便于复核失败原因。
   */
  if (process.env.FOUNDRY_RECORDING_SAVE_OBSERVATION)
    fs.writeFileSync(process.env.FOUNDRY_RECORDING_SAVE_OBSERVATION, `${JSON.stringify(evidence, null, 2)}\n`)
  /**
   * 两个宿主身份来自独立合成终端。
   */
  const { alpha, beta } = evidence.threads

  await t.test('合成输入和真实工具都已发生', () => {
    assert.notEqual(alpha.id, beta.id)
    assert.equal(alpha.openingDate, evidence.opened)
    assert.equal(beta.openingDate, evidence.opened)
    assert.notEqual(evidence.opened, evidence.firstDay)
    assert.equal(evidence.firstDay, evidence.resumeDay)
    assert.deepEqual(evidence.idle, {})
    assert.equal(alpha.events.filter(event => event.type === 'user_message' && event.text === 'T006_SAME_USER_TEXT').length, 2)
    assert.equal(beta.events.filter(event => event.type === 'user_message' && event.text === 'T006_SAME_USER_TEXT').length, 1)
    assert.ok(alpha.events.some(event => event.type === 'turn_aborted'))
    assert.ok(alpha.events.some(event => event.text === 'T006_RESUME_ONE_FINAL'))
    assert.ok(alpha.events.some(event => event.text === 'T006_RESUME_TWO_FINAL'))
    assert.equal(evidence.originalUnavailable.visibleBeforeStop, true)
    assert.equal(evidence.originalUnavailable.sourceAfterStopContainsText, false)
    assert.equal(evidence.faultErrno, 'EISDIR')
    assert.ok(evidence.transientWriteControlEvents > 0, '实际写入后删除的对照未被观察到')
    assert.match(call(evidence.firstAlpha, 'business').output, /T006_BUSINESS_TOOL/)
    assert.ok(call(evidence.firstAlpha, 'business').output.includes(evidence.attachmentSha256))
    assert.match(call(evidence.fault, 'fault-business').output, /T006_PARTIAL_CONTINUE/)
    assert.match(call(evidence.simpleCommit, 'commit-single').output, /exited with code 0/)
    assert.match(call(evidence.commit, 'commit-first').output, /exited with code 1/)
    assert.match(call(evidence.commit, 'commit-second').output, /exited with code 0/)
    inOrder(alpha.events.filter(event => event.type === 'assistant_message').map(event => event.text).join('\n'), 'T006_SINGLE_COMMIT_SUCCEEDED', 'T006_FIRST_COMMIT_FAILED', 'T006_SECOND_COMMIT_SUCCEEDED')
    assert.deepEqual(Object.keys(evidence.simpleCommit.windows), ['commit-single'])
    assert.deepEqual(Object.keys(evidence.commit.windows), ['commit-first', 'commit-second'])
    assert.deepEqual(evidence.git, { status: '', worktree: '', index: '', subject: 'T006_COMMIT_SECOND', previousSubject: 'T006_SINGLE_COMMIT', readme: 'T006_FIX_BEFORE\nT006_FIX_BETWEEN\n', changed: 'README.md' })
  })

  await t.test('首条先于业务，开启日、会话和轮次分别定位', () => {
    /**
     * 首个业务调用发出前的实际资料区快照。
     */
    const beforeBusiness = pair(evidence.firstAlpha.checkpoints.business, alpha.id, alpha.openingDate)
    assert.match(beforeBusiness.details, /T006_SAME_USER_TEXT/)
    /**
     * 两个会话结束首轮后的各自详情与索引。
     */
    const firstAlpha = pair(evidence.parallel, alpha.id, alpha.openingDate)
    /**
     * 另一个项目不得消费首个项目的会话资料。
     */
    const firstBeta = pair(evidence.parallel, beta.id, beta.openingDate)
    /**
     * 从索引解析实际详情锚点，拒绝只创建死链接的实现。
     */
    const anchor = firstAlpha.index.match(new RegExp(`\\.\\./details/${alpha.id}\\.md#([^ )\\n]+)`))?.[1]
    assert.ok(anchor, '索引缺少指向详情的锚点')
    assert.ok(firstAlpha.details.includes(`id="${anchor}"`) || firstAlpha.details.split('\n').some(line => line.startsWith('#') && line.toLowerCase().replace(/^#+\s+/u, '').replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-') === decodeURIComponent(anchor)), '索引锚点在详情中不存在')
    inOrder(firstAlpha.details, 'T006_SAME_USER_TEXT', 'T006_BUSINESS_TOOL', 'T006_ALPHA_FINAL')
    inOrder(firstBeta.details, 'T006_SAME_USER_TEXT', 'T006_BETA_TOOL', 'T006_BETA_FINAL')
    assert.doesNotMatch(firstAlpha.details, /T006_BETA_FINAL/)
    assert.doesNotMatch(firstBeta.details, /T006_ALPHA_FINAL/)
    assert.equal(occurrences(pair(evidence.beforeResume, alpha.id, alpha.openingDate).details, 'T006_SAME_USER_TEXT'), 2)
    assert.equal(path.relative(evidence.repository, evidence.recordsRoot).startsWith(`..${path.sep}`), true)
  })

  await t.test('同一工具保留业务原值，附件可回查，内部读回不递归', () => {
    /**
     * 实际业务工具调用在外部目录执行，原值来自模型可见回包。
     */
    const business = call(evidence.firstAlpha, 'business')
    /**
     * 附件链接与字节摘要以已确认详情为准。
     */
    const detail = pair(evidence.parallel, alpha.id, alpha.openingDate).details
    assert.ok(detail.includes(business.name))
    assert.ok(detail.includes(business.arguments.cmd) || detail.includes(JSON.stringify(business.arguments.cmd)))
    assert.ok(detail.includes(business.arguments.workdir))
    /**
     * 输出正文保留终端原始换行与空白，先核对宿主确已返回内容。
     */
    const stdout = business.output.split('Output:\n')[1]
    assert.ok(stdout?.includes('T006_BUSINESS_TOOL') && detail.includes(stdout))
    /**
     * 实测驱动按用途识别首条保存的读回，业务应紧随其后。
     */
    const internal = call(evidence.firstAlpha, 'record-readback')
    assert.equal(internal.name, business.name)
    assert.ok(internal.arguments.cmd && !detail.includes(internal.arguments.cmd), '内部记录调用出现在详情中')
    assert.match(internal.output, /exited with code 0/)
    /**
     * 使用实际调用顺序检验读回没有触发额外的记录循环。
     */
    const activity = Object.values(evidence.firstAlpha.calls)
    assert.equal(activity[activity.indexOf(internal) + 1], business, '记录读回后未直接继续业务')
    /**
     * 原件必须位于当前会话对应的附件目录且被详情实际引用。
     */
    const attachment = Object.entries(evidence.parallel).find(([name]) => name.startsWith(`${alpha.openingDate}/details/attachments/${alpha.id}/`))
    assert.ok(attachment, '未找到记录的附件副本')
    assert.equal(attachment[1].sha256, evidence.attachmentSha256)
    assert.ok(detail.includes(attachment[1].sha256))
    assert.ok(detail.includes(attachment[0].split('/details/')[1]) || detail.includes(encodeURI(attachment[0].split('/details/')[1])))
  })

  await t.test('两次恢复沿用原文件，只保存新事件并保留缺档', () => {
    /**
     * 恢复前与两次恢复后的实际已读回文档。
     */
    const previous = pair(evidence.beforeResume, alpha.id, alpha.openingDate)
    /**
     * 第一次恢复的文件原文。
     */
    const first = pair(evidence.resumes[0], alpha.id, alpha.openingDate)
    /**
     * 第二次恢复的文件原文。
     */
    const second = pair(evidence.resumes[1], alpha.id, alpha.openingDate)
    assert.deepEqual(Object.keys(evidence.resumes[1]).filter(name => name.endsWith(`/${alpha.id}.md`)).sort(), [`${alpha.openingDate}/details/${alpha.id}.md`, `${alpha.openingDate}/index/${alpha.id}.md`])
    assert.equal(occurrences(second.details, 'T006_SAME_USER_TEXT'), occurrences(previous.details, 'T006_SAME_USER_TEXT'))
    inOrder(first.details, 'T006_POST_COMMIT_FINAL', 'T006_RESUME_ONE_INPUT', 'T006_RESUME_ONE_FINAL')
    inOrder(second.details, 'T006_RESUME_ONE_FINAL', 'T006_RESUME_TWO_INPUT', 'T006_RESUME_TWO_FINAL')
    /**
     * 每个已见的恢复事件都只能在详情中出现一次。
     */
    for (const marker of ['T006_RESUME_ONE_INPUT', 'T006_RESUME_ONE_FINAL', 'T006_RESUME_TWO_INPUT', 'T006_RESUME_TWO_FINAL'])
      assert.equal(occurrences(second.details, marker), 1, marker)
    assert.match(second.details, /T006_STOPPED_TURN/)
    assert.match(second.details, /缺档|缺失|不可取得/)
    assert.doesNotMatch(second.details, /T006_UNAVAILABLE_ASSISTANT_ORIGINAL/)
    assert.deepEqual(pair(evidence.resumes[1], beta.id, beta.openingDate), pair(evidence.parallel, beta.id, beta.openingDate))
  })

  await t.test('索引部分写失败时保留已确认详情，修复后重试不重复', () => {
    /**
     * 部分故障发生时索引不可写但详情可独立读回。
     */
    const detail = evidence.faultSnapshot[`${alpha.openingDate}/details/${alpha.id}.md`]?.text
    assert.ok(detail, '索引失败时缺少可回查详情')
    assert.match(detail, /T006_PARTIAL_WRITE_INPUT/)
    assert.equal(evidence.faultSnapshot[`${alpha.openingDate}/index/${alpha.id}.md`], undefined)
    assert.ok(evidence.fault.noticeBeforeBusiness, '业务继续前缺少可核对的索引故障提示')
    /**
     * 解除写阻断后从实际两份文件核对缺口已恢复。
     */
    const recovered = pair(evidence.retrySnapshot, alpha.id, alpha.openingDate)
    assert.equal(occurrences(recovered.details, 'T006_PARTIAL_WRITE_INPUT'), 1)
    assert.match(recovered.index, /T006_PARTIAL_WRITE_INPUT/)
  })

  await t.test('每次提交与结果回复零写入，中间修复及后续普通消息保留', () => {
    /**
     * 首次成功、失败和重试各自有独立观测区间。
     */
    for (const window of [...Object.values(evidence.simpleCommit.windows), ...Object.values(evidence.commit.windows)]) {
      assert.equal(window.writeEvents, 0, '提交期间出现资料写入事件')
      assert.deepEqual(window.before, window.after, '提交期间资料快照发生变化')
    }
    /**
     * 独立的首次提交成功用例也必须在提交前保存请求和修复。
     */
    const simple = pair(evidence.simpleCommit.windows['commit-single'].before, alpha.id, alpha.openingDate)
    inOrder(simple.details, 'T006_SINGLE_REPAIR_AND_COMMIT', 'T006_SINGLE_FIX')
    /**
     * 业务首次修复须在进入提交例外范围前已落盘。
     */
    const first = pair(evidence.commit.windows['commit-first'].before, alpha.id, alpha.openingDate)
    /**
     * 首次失败后重新进入业务范围，中间修复须在重试前落盘。
     */
    const second = pair(evidence.commit.windows['commit-second'].before, alpha.id, alpha.openingDate)
    inOrder(first.details, 'T006_REPAIR_AND_COMMIT', 'T006_FIX_BEFORE')
    inOrder(second.details, 'T006_FIX_BEFORE', 'T006_FIX_BETWEEN')
    /**
     * 恢复后的记录仍不得补录两次提交或提交结果回复。
     */
    const resumed = pair(evidence.resumes[1], alpha.id, alpha.openingDate).details
    inOrder(resumed, 'T006_FIX_BETWEEN', 'T006_POST_COMMIT_INPUT', 'T006_POST_COMMIT_FINAL')
    assert.doesNotMatch(resumed, /T006_COMMIT_(?:FIRST|SECOND)|T006_(?:FIRST_COMMIT_FAILED|SECOND_COMMIT_SUCCEEDED|GIT_TURN_FINAL)/)
    assert.doesNotMatch(resumed, /T006_SINGLE_COMMIT(?:_SUCCEEDED|_TURN_FINAL)?/)
  })
})
