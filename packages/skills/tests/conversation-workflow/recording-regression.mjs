import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'

/**
 * 缺省读取实现前留存的真实观察。复验时可指向本次实际采集的材料。
 */
const evidencePath = process.env.FOUNDRY_RECORDING_EVIDENCE
  ?? new URL('../../../../specs/skills/002-conversation-to-skill/analysis/acceptance/t006-recording-baseline/observations.json', import.meta.url)

/**
 * 从宿主轨迹、资料目录和隔离仓库取得的验收观察。
 */
const { ordinary, resumes, eligibleResume, partial, commit } = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))

/**
 * 两个普通会话分别在同一合成仓库的不同项目目录启动。
 */
const { alpha, beta } = ordinary.sessions

/**
 * 依真实开启日期查找成对文件，并核对索引能定位详情。实际来源另有安全文件名时沿用已核对的映射。
 */
function recordedPair(files, session) {
  /**
   * 当前会话在资料根内的文档基名。
   */
  const key = session.recordKey ?? session.sessionId
  /**
   * 原开启日对应的详情与索引。
   */
  const detail = files[`records/${session.openedDate}/details/${key}.md`]
  /**
   * 与详情同日、同会话的索引。
   */
  const index = files[`records/${session.openedDate}/index/${key}.md`]
  assert.ok(detail, `原开启日缺详情文件，线程 ${session.sessionId}`)
  assert.ok(index, `原开启日缺索引文件，线程 ${session.sessionId}`)
  assert.ok(index.text.includes(`../details/${key}.md`), '索引应能定位到自己的详情')
  return { detail, index, key }
}

test('对照实际跨午夜、两会话和同一句话的不同轮次', () => {
  assert.deepEqual(ordinary.emptyBeforePrompt, {})
  assert.equal(alpha.openedDate, beta.openedDate)
  assert.notEqual(alpha.openedDate, ordinary.firstPromptLocalDate)
  assert.notEqual(alpha.sessionId, beta.sessionId)
  assert.notEqual(alpha.originalCwd, beta.originalCwd)
  assert.equal(alpha.turns[0].prompt, alpha.turns[1].prompt)
  assert.equal(alpha.turns[0].prompt, beta.turns[0].prompt)
  assert.notEqual(alpha.turns[0].turnId, alpha.turns[1].turnId)
})

test('首个业务调用前读回首条原文与原日期索引', () => {
  /**
   * 逐会话核对启动标记对应的实际首轮。
   */
  for (const [scope, session] of Object.entries(ordinary.sessions)) {
    /**
     * 独立业务标记出现时可读取的两份文档。
     */
    const { detail } = recordedPair(ordinary.atFirstBusiness[scope], session)
    assert.ok(detail.text.includes(session.turns[0].prompt))
    assert.ok(Number.isInteger(ordinary.firstPairReadbackLines[scope])
      && ordinary.firstPairReadbackLines[scope] < ordinary.firstBusinessLines[scope], '索引和详情读回应早于本轮首个业务动作')
  }
})

test('以宿主轮次保留相同原文、业务顺序与正常末轮，各线程独立', () => {
  /**
   * 两个会话各自的实际索引和详情。
   */
  const first = recordedPair(ordinary.after, alpha)
  /**
   * 另一会话在同日的独立记录。
   */
  const second = recordedPair(ordinary.after, beta)
  assert.equal(first.detail.text.split(alpha.turns[0].prompt).length - 1, 2)
  assert.equal(second.detail.text.split(beta.turns[0].prompt).length - 1, 1)
  assert.ok(!second.detail.text.includes(alpha.turns.at(-1).prompt))
  /**
   * 已保存的用户轮次应能从各自索引及详情回溯到宿主身份。
   */
  for (const [scope, session, pair] of [['alpha', alpha, first], ['beta', beta, second]]) {
    assert.deepEqual(ordinary.retainedUserTurnIds[scope], session.turns.map(turn => turn.turnId))
    /**
     * 在详情中依次寻找上一事件之后的下一个已发出原文。
     */
    let remaining = pair.detail.text
    /**
     * 使用实际宿主事件的顺序核对已保存的原文。
     */
    for (const turn of session.turns) {
      /**
       * 同一轮先收到用户发言，再发出末轮。
       */
      for (const original of [turn.prompt, turn.finalReply]) {
        /**
         * 实际详情中可继续回查的发言位置。
         */
        const offset = remaining.indexOf(original)
        assert.ok(offset >= 0, `详情应按宿主顺序保留原文，轮次 ${turn.turnId}`)
        remaining = remaining.slice(offset + original.length)
      }
    }
  }
})

test('对照仓库外工具实际返回、原件字节和仓库外资料根', () => {
  assert.equal(ordinary.outsideTool.output, 'T006-OUTSIDE-TOOL\n')
  assert.equal(ordinary.outsideTool.cwd, ordinary.outsideDirectory)
  assert.equal(ordinary.attachmentInput.bytes, 6)
  assert.equal(ordinary.attachmentInput.sha256, 'a0ed0f459b2094e0c609f62dfa4da8d4c80172534670ca2220f4f931a4f2c40d')
  assert.ok(path.relative(ordinary.repository, ordinary.recordsRoot).startsWith(`..${path.sep}`))
})

test('相同工具的业务参数和输出可查，记录维护调用不会产生待保存事件', () => {
  /**
   * 执行仓库外业务工具的会话详情。
   */
  const { detail } = recordedPair(ordinary.after, alpha)
  assert.ok(detail.text.includes(ordinary.outsideTool.tool))
  assert.ok(detail.text.includes(ordinary.outsideTool.command))
  assert.ok(detail.text.includes(ordinary.outsideTool.cwd))
  assert.ok(detail.text.includes(ordinary.outsideTool.output))
  assert.ok(ordinary.internalCalls.some(call => call.tool === ordinary.outsideTool.tool), '需实际观察到与业务使用同一工具的内部维护调用')
  assert.ok(ordinary.retainedCallIds.includes(ordinary.outsideTool.callId))
  assert.ok(ordinary.internalCalls.every(call => !ordinary.retainedCallIds.includes(call.callId)))
  assert.equal(ordinary.unexpectedRecordMaintenanceAfterReadback.length, 0)
})

test('能从原会话详情定位附件且保存字节与原件摘要一致', () => {
  /**
   * 附件应属于调用工具的线程。
   */
  const { detail, key } = recordedPair(ordinary.after, alpha)
  /**
   * 仓库外资料根中的实际附件文件。
   */
  const copy = Object.entries(ordinary.after).find(([name, file]) =>
    name.startsWith(`records/${alpha.openedDate}/details/attachments/${key}/`)
    && file.sha256 === ordinary.attachmentInput.sha256)
  assert.ok(copy, '未发现逐字节匹配原件的会话附件')
  assert.equal(copy[1].bytes, ordinary.attachmentInput.bytes)
  /**
   * 详情内的相对附件定位可使用原名或经过 URL 编码的路径。
   */
  const reference = copy[0].split('/details/')[1]
  assert.ok(detail.text.includes(reference) || detail.text.includes(encodeURI(reference)))
})

test('交互恢复归属无法核实时及 exec resume 均无记录写入或正文补读', () => {
  assert.equal(resumes['outside-resume'].turn.trigger, 'user')
  assert.equal(resumes['exec-resume'].turn.trigger, 'exec')
  assert.notEqual(resumes['outside-resume'].actualLaunchCwd, resumes['outside-resume'].turn.cwd)
  /**
   * 两个恢复入口分别比对同一份原记录。
   */
  for (const item of Object.values(resumes)) {
    assert.equal(item.sessionId, alpha.sessionId)
    assert.ok(item.turn.finalReply.includes('对话记录合成基线'))
    assert.ok(Object.keys(item.before).length >= 2, '需保留可逐份比对的恢复前文件')
    assert.deepEqual(item.after, item.before)
    assert.deepEqual(item.writeEvents, [])
    assert.deepEqual(item.additionalBodyReads, [])
  }
})

test('可核实归属的两次恢复续写原文件并保留缺档', (context) => {
  if (eligibleResume.unavailable)
    return context.skip(eligibleResume.unavailable)
  assert.equal(eligibleResume.launches.length, 2)
  /**
   * 第一次恢复前的已确认内容。
   */
  let previous = recordedPair(eligibleResume.before, eligibleResume.session).detail.text
  /**
   * 两次恢复都需要各自可核验的本次启动来源。
   */
  for (const attempt of eligibleResume.launches) {
    assert.ok(attempt.verifiedLaunchCwd && attempt.proofReference)
    /**
     * 每次恢复仍指向同一会话的原日文件。
     */
    const { detail } = recordedPair(attempt.after, eligibleResume.session)
    assert.ok(detail.text.includes(previous))
    assert.equal(detail.text.split(attempt.newPrompt).length - 1, 1)
    assert.equal(attempt.missingSourceAvailable, false)
    assert.ok(attempt.gapText && detail.text.includes(attempt.gapText))
    assert.deepEqual(attempt.repeatedEventLocations, [])
    previous = detail.text
  }
})

test('对照索引路径实际拒绝写入，原有详情可查且业务继续', () => {
  assert.equal(partial.filesystemRejection.code, 21, 'Linux 中目录占用索引文件位置')
  assert.ok(partial.before[partial.seededDetail].text.includes('T006-已确认的合成详情'))
  assert.ok(partial.after[partial.seededDetail].text.includes('T006-已确认的合成详情'))
  assert.ok(partial.turn.finalReply.includes('对话记录合成基线'))
})

test('部分写入失败先指出索引缺口，再继续业务', () => {
  /**
   * 触发本轮用户任务的实际 README 读取命令。
   */
  const business = partial.turn.calls.find(call => call.input.includes('head -n 1 ../../README.md'))
  assert.ok(business)
  /**
   * 业务调用前用户能够看到的实际缺口提示。
   */
  const notice = partial.turn.commentary?.find(item => /索引/.test(item.text) && /无法|失败|缺失|缺口/.test(item.text))
  assert.ok(notice && notice.line < business.callLine, '业务开始前未观察到索引缺口提示')
})

test('对照同一用户轮真实提交失败、修复和成功重试', () => {
  assert.notEqual(commit.firstCommit.exitCode, 0)
  assert.match(commit.firstCommit.output, /could not read log file/)
  assert.equal(commit.secondCommit.exitCode, 0)
  assert.ok(commit.firstFix.callLine < commit.firstCommit.callLine)
  assert.ok(commit.firstCommit.resultLine < commit.betweenFix.callLine)
  assert.ok(commit.betweenFix.resultLine < commit.secondCommit.callLine)
  assert.equal(commit.committedReadme, 'T006-首次修复\nT006-重试前修复')
  assert.deepEqual(commit.changedPaths, ['README.md'])
  assert.notEqual(commit.beforeGit.head, commit.afterGit.head)
  /**
   * 工作区、索引和状态均按实际 Git 结果比较。
   */
  for (const field of ['status', 'worktree', 'index']) {
    assert.equal(commit.beforeGit[field], '')
    assert.equal(commit.afterGit[field], '')
  }
})

test('提交按实际步骤跳过，两段修复和后续普通回复可回查', () => {
  /**
   * 正常回复完成后的实际提交会话详情。
   */
  const { detail } = recordedPair(commit.recordsAfterFollowup, commit.observed)
  assert.ok(detail.text.includes(commit.observed.turns[0].prompt))
  assert.ok(detail.text.includes(commit.observed.turns[1].finalReply))
  assert.ok(commit.retainedCallIds.includes(commit.firstFix.callId))
  assert.ok(commit.retainedCallIds.includes(commit.betweenFix.callId))
  assert.ok(!commit.retainedCallIds.includes(commit.firstCommit.callId))
  assert.ok(!commit.retainedCallIds.includes(commit.secondCommit.callId))
  assert.deepEqual(commit.writeEventsDuringFirstCommit, [])
  assert.deepEqual(commit.writeEventsDuringSecondCommit, [])
  assert.deepEqual(commit.recordedCommitResultLocations, [])
})

test('提交后的交互恢复归属未知时保持记录，仍完成本次普通业务', () => {
  /**
   * 同一提交线程退出后重新进入的真实行为。
   */
  const recovery = commit.unverifiedResume
  assert.equal(recovery.sessionId, commit.observed.sessionId)
  assert.match(recovery.turn.finalReply, /T006-首次修复[\s\S]*T006-重试前修复/)
  assert.deepEqual(recovery.after, recovery.before)
  assert.deepEqual(recovery.writeEvents, [])
  assert.deepEqual(recovery.additionalBodyReads, [])
})

test('可核实归属的提交后恢复仍保留两段修复并跳过提交事件', (context) => {
  if (eligibleResume.unavailable)
    return context.skip(eligibleResume.unavailable)
  /**
   * 满足归属条件的提交线程在恢复后读回的原文件和事件。
   */
  const recovery = commit.eligibleResume
  assert.ok(recovery.verifiedLaunchCwd && recovery.proofReference)
  /**
   * 索引和详情仍使用该提交线程原开启日期。
   */
  const { detail } = recordedPair(recovery.after, commit.observed)
  assert.ok(detail.text.includes(recovery.turn.finalReply))
  assert.equal(recovery.retainedCallIds.filter(id => id === commit.firstFix.callId).length, 1)
  assert.equal(recovery.retainedCallIds.filter(id => id === commit.betweenFix.callId).length, 1)
  assert.ok(!recovery.retainedCallIds.includes(commit.firstCommit.callId))
  assert.ok(!recovery.retainedCallIds.includes(commit.secondCommit.callId))
  assert.deepEqual(recovery.recordedCommitResultLocations, [])
})
