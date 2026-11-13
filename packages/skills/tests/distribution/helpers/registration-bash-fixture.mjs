import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { migrationCli, migrationFixture } from './registration-fixture.mjs'

/**
 * 官方工具和固定解析器由调用方提供，缺少时集成测试明确跳过。
 */
export const bashIntegration = { skip: !migrationCli || !process.env.FOUNDRY_YQ || !process.env.FOUNDRY_JQ }
/**
 * 仅定位真实 Bash 生产模块，不把测试候选当被测入口。
 */
const scriptRoot = fileURLToPath(new URL('../../../script/', import.meta.url))

/**
 * 复现旧正式 hooks 脚本复制正文、附件及逐技能配置的真实目录结构。
 * @param {object} item 官方旧环境。
 */
export function legacyHookLayout(item) {
  /**
   * 原 manifest 由真实官方安装取得，不手写目标登记。
   */
  const manifest = JSON.parse(fs.readFileSync(path.join(item.project, '.specify/extensions/artifact-issue-description/extension.yml'), 'utf8'))
  /**
   * 输入仅在本例临时根中构造。
   */
  const input = path.join(item.root, 'legacy-real-hook')
  /**
   * 这份来源模拟旧脚本 cp -RL 的完整对象。
   */
  const source = path.join(input, 'skills/artifact-issue-description')
  fs.mkdirSync(path.join(source, 'references'), { recursive: true })
  fs.writeFileSync(path.join(input, 'extension.yml'), JSON.stringify(manifest))
  fs.writeFileSync(path.join(source, 'SKILL.md'), '---\nname: artifact-issue-description\ndescription: T067 旧正式脚本结构样本\n---\n\n# 旧描述技能\n[参考](references/old.md)\n')
  fs.writeFileSync(path.join(source, 'references/old.md'), '旧有正式附件。\n')
  fs.writeFileSync(path.join(source, 'speckit-hooks.json'), JSON.stringify(manifest.hooks))
  /**
   * 目标登记及文件仍由官方产生，结构变化不是手改正向结果。
   */
  const installed = item.options.invoke(['extension', 'add', '--dev', input, '--force'])
  if (installed.status !== 0)
    throw new Error(installed.stdout + installed.stderr)
}

/**
 * 在官方建立的旧环境中执行真实 Bash，包装器只留原始调用，不模拟安装。
 * @param {string} name 独占证据名称。
 * @param {'three'|'four'|'five'} variant 旧登记集合。
 * @returns {object} 隔离环境及实际运行入口。
 */
export function bashFixture(name, variant = 'four') {
  /**
   * 复用 T066 的官方旧环境，完全不消费其内存基线。
   */
  const item = migrationFixture(name, variant)
  /**
   * 真实官方 CLI 的调用日志独立于 T066 候选调用数组。
   */
  const log = path.join(item.root, 'bash-calls.jsonl')
  /**
   * 包装器只在测试内运行 Node，生产模块仍由 Bash 执行。
   */
  const wrapper = path.join(item.root, 'record-specify')
  fs.writeFileSync(wrapper, `#!${process.execPath}
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
/**
 * 原样记录每次参数与工作目录，区分临时重现和目标变更。
 */
const args = process.argv.slice(2)
fs.appendFileSync(process.env.FOUNDRY_T067_CALL_LOG, JSON.stringify({ cwd: process.cwd(), args }) + '\\n')
if (args[0] === 'extension' && args[1] === 'add' && path.basename(args[3]) === process.env.FOUNDRY_T067_FAIL)
  process.exit(23)
/**
 * 所有正常调用都转到固定版官方工具，安装行为不在包装器中实现。
 */
const result = spawnSync(process.env.FOUNDRY_T067_REAL_CLI, args, { stdio: 'inherit' })
if (result.signal)
  process.kill(process.pid, result.signal)
process.exit(result.status ?? 1)
`, { mode: 0o755 })
  /**
   * 仅测试子进程使用隔离用户，固定工具摘要仍由生产模块验证。
   */
  const env = { ...item.env, FOUNDRY_SPECIFY_VERSION: '1.2.6', FOUNDRY_YQ: process.env.FOUNDRY_YQ, FOUNDRY_JQ: process.env.FOUNDRY_JQ, FOUNDRY_T067_CALL_LOG: log, FOUNDRY_T067_REAL_CLI: migrationCli }
  /**
   * 实际运行并保留 stdout/stderr，不在这里断言成功以免抹去失败范围。
   * @param {'hooks'|'commands'} kind 平台入口。
   * @param {string[]} extra 额外明确参数。
   * @param {object} overrides 单例故障环境。
   * @returns {object} 实际子进程结果。
   */
  function run(kind, extra = [], overrides = {}) {
    /**
     * hooks 和模式来源根按真实分离布局分别传入。
     */
    const args = [path.join(scriptRoot, `register-${kind}/register-${kind}.sh`), '--project', item.project, '--skills-dir', kind === 'hooks' ? item.options.sourceRoot : path.dirname(item.options.incrementRoot), '--cli', wrapper, ...(kind === 'hooks' ? ['--collection-config', item.options.collectionFile] : []), ...extra]
    /**
     * 官方重现可能包含多次调用，单例统一限时且记录进程错误。
     */
    const result = spawnSync('bash', args, { cwd: item.project, env: { ...env, ...overrides }, encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024 })
    fs.appendFileSync(path.join(item.root, 'bash-results.jsonl'), `${JSON.stringify({ kind, extra, status: result.status, error: result.error?.message, signal: result.signal, stdout: result.stdout, stderr: result.stderr })}\n`)
    return result
  }
  /**
   * 只读观察真实目标上的变更调用，临时官方重现另留完整日志。
   * @returns {object[]} 目标 add/remove 的真实参数。
   */
  function targetCalls() {
    if (!fs.existsSync(log))
      return []
    return fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)).filter(call => call.cwd === item.project && call.args[0] === 'extension' && ['add', 'remove'].includes(call.args[1]))
  }
  /**
   * 将生产脚本的实际日志放入同一份隔离证据后清理自有目录。
   */
  function finish() {
    if (process.env.FOUNDRY_T066_RETAIN_DIR) {
      /**
       * 单例目的地沿现有留证规则，不新增工程状态。
       */
      const destination = path.join(process.env.FOUNDRY_T066_RETAIN_DIR, name)
      fs.mkdirSync(destination, { recursive: true })
      /**
       * 未进入官方调用的场景可能没有 calls 文件。
       */
      for (const file of ['bash-calls.jsonl', 'bash-results.jsonl']) {
        if (fs.existsSync(path.join(item.root, file)))
          fs.copyFileSync(path.join(item.root, file), path.join(destination, file))
      }
    }
    item.finish()
  }
  return { ...item, env, run, targetCalls, finish }
}
