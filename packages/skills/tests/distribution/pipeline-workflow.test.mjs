import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { parse } from 'yaml'
import { createSandbox } from './sandbox.mjs'

/**
 * 读取 Actions 实际消费的 YAML，避免另建一份流程配置供测试使用。
 */
const workflow = parse(readFileSync(new URL('../../../../.github/workflows/skill-release.yml', import.meta.url), 'utf8'))

/**
 * 两套现有测试使用同一个推送事件及各自的矩阵结果。
 */
const testJob = workflow.jobs.test

/**
 * 推送提交的核验脚本须在准备环境和运行测试之前执行。
 */
const verifyPush = testJob.steps.find(step => step.id === 'verify-push')

/**
 * Git 以全零对象名表示删除后没有新的引用目标。
 */
const deletedRefSha = '0000000000000000000000000000000000000000'

/**
 * 表示 YAML 中的 Actions 表达式，保留外层插值标记。
 * @param {string} source 表达式正文。
 * @returns {string} 工作流使用的表达式。
 */
function actionsExpression(source) {
  return `\${{ ${source} }}`
}

/**
 * 仅在临时仓库执行 Git 并返回真实输出。
 * @param {ReturnType<typeof createSandbox>} sandbox 隔离项目。
 * @param {...string} args Git 参数。
 * @returns {string} Git 输出。
 */
function git(sandbox, ...args) {
  return execFileSync('git', args, {
    cwd: sandbox.project,
    env: sandbox.env,
    encoding: 'utf8',
    timeout: 5000,
  }).trim()
}

/**
 * 执行从工作流读取的 Bash 步骤，保留子进程的真实退出码。
 * @param {ReturnType<typeof createSandbox>} sandbox 隔离项目。
 * @param {{run: string}} step 工作流中的脚本步骤。
 * @param {Record<string, string>} env 当前推送提供的环境变量。
 * @returns {import('node:child_process').SpawnSyncReturns<string>} 步骤结果。
 */
function runStep(sandbox, step, env) {
  /**
   * Bash 的失败处理与 Actions 中显式使用 bash 的步骤一致。
   */
  const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', step.run], {
    cwd: sandbox.project,
    env: { ...sandbox.env, ...env },
    encoding: 'utf8',
    timeout: 5000,
  })
  assert.ifError(result.error)
  return result
}

test('同分支连续推送各自保留 Python 和 Node 测试运行', () => {
  assert.deepEqual(workflow.on, { push: null })
  assert.equal(workflow.concurrency, undefined, '按分支分组会让较早的推送失去运行机会')
  assert.equal(testJob.concurrency, undefined)
  assert.deepEqual(workflow.permissions, { contents: 'read' })
  assert.equal(testJob.permissions, undefined)
  assert.equal(testJob.environment, undefined)
  assert.equal(testJob['continue-on-error'], undefined)
  assert.equal(testJob.strategy['fail-fast'], false)
  assert.deepEqual(testJob.strategy.matrix.suite, ['python', 'node'])

  /**
   * 矩阵各自执行既有入口，非零退出码由 Actions 直接报告。
   */
  const suiteCommands = [
    ['python', 'pnpm --filter @foundry/skills run test'],
    ['node', 'node --test packages/skills/tests/distribution/*.test.mjs'],
  ]
  for (const [suite, command] of suiteCommands) {
    /**
     * 查找实际执行该套用例的步骤，确认它属于对应矩阵成员。
     */
    const step = testJob.steps.find(item => item.run === command)
    assert.ok(step, command)
    assert.equal(step.if, `matrix.suite == '${suite}'`)
    assert.equal(step['continue-on-error'], undefined)
  }
})

test('测试在安装依赖前核对事件提交且检出凭据不保留', () => {
  /**
   * GitHub checkout 须直接使用事件提交，避免分支推进后取到较新的代码。
   */
  const checkoutIndex = testJob.steps.findIndex(step => step.uses?.startsWith('actions/checkout@'))
  assert.ok(checkoutIndex >= 0, '缺少检出步骤')
  assert.equal(testJob.steps[checkoutIndex].with?.ref, actionsExpression('github.event.after'))
  assert.equal(testJob.steps[checkoutIndex].with['persist-credentials'], false)
  assert.ok(verifyPush?.run, '缺少推送提交核验步骤')
  assert.equal(verifyPush.env.PUSH_AFTER, actionsExpression('github.event.after'))
  assert.equal(verifyPush.shell, 'bash')
  assert.equal(testJob.steps[checkoutIndex + 1], verifyPush)
})

test('删除或无新提交的推送只记录跳过原因', (t) => {
  /**
   * 删除事件分支有独立结果，测试矩阵仅处理有 after 的非删除事件。
   */
  const skipJob = workflow.jobs['skip-push']
  assert.ok(skipJob, '缺少无可检出提交的记录任务')
  assert.equal(skipJob.if, actionsExpression(`github.event.deleted || github.event.after == '' || github.event.after == '${deletedRefSha}'`))
  assert.equal(testJob.if, actionsExpression(`!github.event.deleted && github.event.after != '' && github.event.after != '${deletedRefSha}'`))
  assert.equal(skipJob.steps.length, 1)
  assert.equal(skipJob.steps[0].uses, undefined)
  assert.equal(skipJob.steps[0].env.PUSH_DELETED, actionsExpression('github.event.deleted'))
  assert.equal(skipJob.steps[0].shell, 'bash')

  /**
   * 跳过摘要写到 Actions 提供的文件位置，便于在运行页面核对原因。
   */
  const sandbox = createSandbox()
  t.after(sandbox.cleanup)
  /**
   * 临时文件模拟单个步骤的 GitHub 摘要。
   */
  const summary = join(sandbox.root, 'summary.md')
  /**
   * 删除事件可能带有平台回退的工作流 SHA，摘要须指明真实原因。
   */
  const deletion = runStep(sandbox, skipJob.steps[0], { GITHUB_STEP_SUMMARY: summary, PUSH_DELETED: 'true' })
  assert.equal(deletion.status, 0, deletion.stderr)
  assert.match(readFileSync(summary, 'utf8'), /删除.*无可检出/u)
  /**
   * 未带可检出提交的其他事件也保留不同的原因说明。
   */
  const missing = runStep(sandbox, skipJob.steps[0], { GITHUB_STEP_SUMMARY: summary, PUSH_DELETED: 'false' })
  assert.equal(missing.status, 0, missing.stderr)
  assert.match(missing.stdout, /未提供可检出的提交/u)
})

test('提交核验接受各自的推送提交和指向它的标签，拒绝错版 HEAD', (t) => {
  assert.ok(verifyPush?.run, '缺少推送提交核验步骤')
  /**
   * 构造同一分支的两个真实提交，验证较早运行可以在分支推进后继续。
   */
  const sandbox = createSandbox()
  t.after(sandbox.cleanup)
  git(sandbox, 'init', '--quiet')
  git(sandbox, 'config', 'user.name', 'CI fixture')
  git(sandbox, 'config', 'user.email', 'ci-fixture@example.invalid')
  git(sandbox, 'commit', '--quiet', '--allow-empty', '-m', 'first push')
  /**
   * 第一条推送的事件提交。
   */
  const first = git(sandbox, 'rev-parse', 'HEAD')
  git(sandbox, 'commit', '--quiet', '--allow-empty', '-m', 'second push')
  /**
   * 第二条推送使分支顶端改变。
   */
  const second = git(sandbox, 'rev-parse', 'HEAD')
  assert.notEqual(first, second)

  /**
   * 运行第二次推送的提交核验，日志须包含它自己的 SHA。
   */
  const latest = runStep(sandbox, verifyPush, { PUSH_AFTER: second })
  assert.equal(latest.status, 0, latest.stderr)
  assert.ok(latest.stdout.includes(second), latest.stdout)
  /**
   * 用最新 HEAD 核验早期事件必须失败，不能进入依赖安装和测试。
   */
  const mismatch = runStep(sandbox, verifyPush, { PUSH_AFTER: first })
  assert.equal(mismatch.status, 1, mismatch.stderr)
  assert.match(mismatch.stderr, /推送提交与实际 HEAD 不一致/u)
  assert.ok(mismatch.stderr.includes(first) && mismatch.stderr.includes(second), mismatch.stderr)

  git(sandbox, 'checkout', '--quiet', '--detach', first)
  /**
   * 按最初推送检出后，较早的运行仍应成功并记录其 SHA。
   */
  const earlier = runStep(sandbox, verifyPush, { PUSH_AFTER: first })
  assert.equal(earlier.status, 0, earlier.stderr)
  assert.ok(earlier.stdout.includes(first), earlier.stdout)

  git(sandbox, 'tag', '--annotate', 'push-tag', '-m', 'annotated push tag')
  /**
   * 附注标签对象标识与 HEAD 不同，核验时应取它指向的提交。
   */
  const tagSha = git(sandbox, 'rev-parse', 'refs/tags/push-tag')
  assert.notEqual(tagSha, first)
  /**
   * 标签触发的测试日志记录真正检出的提交。
   */
  const tag = runStep(sandbox, verifyPush, { PUSH_AFTER: tagSha })
  assert.equal(tag.status, 0, tag.stderr)
  assert.ok(tag.stdout.includes(first), tag.stdout)
})
