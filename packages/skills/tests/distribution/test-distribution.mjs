import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createSandbox, probeRuntime } from './sandbox.mjs'

/**
 * 场景脚本按本文件位置解析，调用方可处于任意工作目录。
 */
const suiteDirectory = fileURLToPath(new URL('.', import.meta.url))

/**
 * 验证唯一范围、来源和固定提交参数；错误在启动场景或创建沙箱前抛出。
 * @param {string[]} argv 用户参数，允许 pnpm 传入一个前置分隔符。
 * @returns {Map<string, string>} 已验证参数。
 */
function parseArguments(argv) {
  /**
   * pnpm run 可能保留的单个参数分隔符。
   */
  const args = argv[0] === '--' ? argv.slice(1) : argv
  /**
   * 全部允许的参数，范围值显式枚举。
   */
  const allowed = new Map([
    ['--mvu', ['A', 'B', 'C', 'D', 'E', 'F']],
    ['--story', ['US1', 'US2', 'US3', 'US4', 'US5']],
    ['--matrix', ['full']],
    ['--source', ['local', 'remote']],
    ['--source-dir', null],
    ['--release-source', null],
  ])
  /**
   * 重复参数被拒绝，避免静默覆盖选择范围。
   */
  const values = new Map()
  /**
   * 参数均为一键一值，不接受隐式布尔值或额外位置参数。
   */
  for (let index = 0; index < args.length; index += 2) {
    /**
     * 当前参数名、值及其允许集合。
     */
    const key = args[index]
    /**
     * 当前参数值不能由下一个参数名替代。
     */
    const value = args[index + 1]
    /**
     * null 表示由后续路径或来源约束校验。
     */
    const choices = allowed.get(key)
    if (!allowed.has(key) || values.has(key) || !value || value.startsWith('--') || (choices && !choices.includes(value)))
      throw new Error(`未知、重复或无效参数：${key}${value ? ` ${value}` : '（缺值）'}`)
    values.set(key, value)
  }
  if (['--mvu', '--story', '--matrix'].filter(key => values.has(key)).length > 1)
    throw new Error('--mvu、--story、--matrix 只能选择一个')
  values.set('--source', values.get('--source') || 'local')
  validateSource(values)
  return values
}

/**
 * 校验来源模式及其附加参数，不执行下载或写入。
 * @param {Map<string, string>} values 经过枚举及重复检查的参数。
 */
function validateSource(values) {
  if (values.has('--source-dir') && (values.get('--source') !== 'local' || !path.isAbsolute(values.get('--source-dir')) || !fs.statSync(values.get('--source-dir')).isDirectory()))
    throw new Error('--source-dir 必须是 local 模式下存在的绝对目录')
  if (values.get('--source') === 'remote') {
    if (!values.has('--release-source'))
      throw new Error('remote 模式必须提供 --release-source 固定提交 HTTPS 根 URL')
    /**
     * 发布来源必须携带不可变的完整 Git 提交，不接受认证信息、查询或片段。
     */
    const source = new URL(values.get('--release-source'))
    if (source.protocol !== 'https:' || source.username || source.password || source.search || source.hash || !/(?:^|\/)[a-f\d]{40}(?:\/|$)/iu.test(source.pathname))
      throw new Error('--release-source 必须是包含完整提交 SHA 的 HTTPS 根 URL')
  }
  else if (values.has('--release-source')) {
    throw new Error('--release-source 仅供 remote 模式使用')
  }
}

/**
 * 运行选择的场景并汇总真实结果；未实现入口始终 not-run 且请求退出非零。
 * @param {Map<string, string>} options 已验证参数。
 * @returns {object} 包含来源、工具探测和逐场景结果的报告。
 */
function runDistribution(options) {
  /**
   * 固定场景约定；未来任务创建文件后即可执行，不创建空成功入口。
   */
  const entries = [
    ...['A', 'B', 'C', 'D', 'E', 'F'].map(id => ({ selector: '--mvu', id, file: `mvu-${id.toLowerCase()}.mjs` })),
    ...['US1', 'US2', 'US3', 'US4', 'US5'].map((id, index) => ({ selector: '--story', id, file: `${['official', 'install', 'mount', 'hidden', 'release'][index]}-contract.test.mjs` })),
    { selector: '--matrix', id: 'full', file: 'matrix.mjs' },
  ]
  /**
   * 未给范围时运行全体；显式范围不会悄悄退回默认集合。
   */
  const selected = entries.filter(entry => !['--mvu', '--story', '--matrix'].some(key => options.has(key)) || options.get(entry.selector) === entry.id)
  /**
   * 来源参数透传给实际测试脚本，不在调度层下载内容。
   */
  const sourceArgs = ['--source', options.get('--source')]
  /**
   * 只有已给出的来源参数才透传，保留其原始值。
   */
  for (const key of ['--source-dir', '--release-source']) {
    if (options.has(key))
      sourceArgs.push(key, options.get(key))
  }
  /**
   * 工具缺项与场景结果分列；具体 MVU 负责阻塞其必需工具及最低版本。
   */
  const runtimes = ['npm', 'git', 'bash', 'pwsh', 'specify'].map(probeRuntime)
  /**
   * 每个入口都有独立项目和用户目录，结束或失败后均清理。
   */
  const results = selected.map((entry) => {
    /**
     * 本项对应的固定测试入口。
     */
    const script = path.join(suiteDirectory, entry.file)
    if (!fs.existsSync(script))
      return { id: entry.id, status: 'not-run', reason: `未实现场景入口：${entry.file}` }
    /**
     * 仅有真实场景入口时创建隔离测试环境。
     */
    const sandbox = createSandbox()
    try {
      /**
       * 使用当前 Node 的绝对路径，不通过 shell 拼接来源参数。
       */
      const result = spawnSync(process.execPath, [script, ...sourceArgs], {
        cwd: sandbox.project,
        env: sandbox.env,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
      })
      return {
        id: entry.id,
        status: result.status === 0 && !result.error ? 'passed' : 'failed',
        exitCode: result.status,
        reason: result.error?.message || result.signal || null,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
      }
    }
    finally {
      sandbox.cleanup()
    }
  })
  return {
    status: results.every(result => result.status === 'passed') ? 'passed' : results.some(result => result.status === 'failed') ? 'failed' : results.some(result => result.status === 'passed') ? 'partial' : 'not-run',
    source: options.get('--source'),
    sourceDir: options.get('--source-dir') || null,
    releaseSource: options.get('--release-source') || null,
    nodeVersion: process.version,
    runtimes,
    results,
  }
}

/**
 * 仅完成静态校验的请求才进入执行阶段，区分参数错误与执行故障。
 */
let options
try {
  options = parseArguments(process.argv.slice(2))
}
catch (error) {
  console.error(`参数错误：${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
}
if (options) {
  try {
    /**
     * 只有全部真实入口成功才允许退出 0，缺项与部分成功均退出 1。
     */
    const report = runDistribution(options)
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    process.exitCode = report.status === 'passed' ? 0 : 1
  }
  catch (error) {
    console.error(`调度失败：${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
