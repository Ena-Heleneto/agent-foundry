import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * 唯一公开调用形式；子模块能力按当前已完成任务增量开放。
 */
const usage = `用法：node script/index.mjs [参数]

必填：--source <固定提交HTTPS根URL> 或 --source-dir <绝对目录>
      --version <版本> --agent <名称>
选择：--skill <名称>（可重复）、--category <分类>、--all 三选一
可选：--project <绝对目录> --no-mount

需要 Node >=22.20.0；自动按系统调度内部脚本，无子命令。
第一步 --check --official 只读核验固定 GitHub 来源并打印官方命令。
官方安装后，以相同来源、版本与显式 --skill 正常调用，核验并挂载。
紧急版仅支持 Linux x86_64/Codex 项目级；其他请求明确失败。
`

/**
 * 将运行平台映射到内部安装模块；不提供使用者可切换的平台或模块参数。
 * @param {string} platform Node 提供的操作系统标识。
 * @param {string} directory 随当前入口交付的 script 绝对目录。
 * @returns {{command: string, args: string[]}} 原生 shell 与完整模块路径。
 * @throws {Error} 未支持的运行平台。
 */
export function resolveInvocation(platform, directory) {
  if (platform === 'linux') {
    return { command: 'bash', args: [path.join(directory, 'install-skills/install-skills.sh')] }
  }
  throw new Error(`不支持的操作系统：${platform}`)
}

/**
 * 总入口自身未能启动模块时输出结构化失败；已启动模块的结果由其直接输出。
 * @param {string} reasonCode 机器可读的失败类别。
 * @param {string} message 可操作的中文诊断。
 * @returns {number} 静态前提失败的退出码。
 */
function fail(reasonCode, message) {
  process.stderr.write(`${message}\n`)
  process.stdout.write(`${JSON.stringify({ schemaVersion: 1, overall: 'failed', reasonCode, message, skills: [], stages: { installation: { status: 'not-run' }, integrity: { status: 'not-run' }, hooks: { status: 'not-run' }, commands: { status: 'not-run' } } })}\n`)
  return 2
}

/**
 * 运行唯一入口：选择平台、保留调用 cwd/参数/输出，并等待子模块完成。
 * @param {string[]} argv 使用者的原始参数；不接受 install/mount 等子命令。
 * @returns {Promise<number>} 原始子模块退出码或明确的前置错误码。
 */
export async function run(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(usage)
    return 0
  }
  if (argv.length === 0) {
    process.stderr.write(usage)
    return fail('arguments', '必须提供来源、版本、目标 agent 与技能选择')
  }
  /**
   * 与已选定官方 skills 的运行前提一致，不在消费项目安装 Node。
   */
  const [major, minor] = process.versions.node.split('.').map(Number)
  if (major < 22 || (major === 22 && minor < 20))
    return fail('prerequisite', '需要 Node >=22.20.0，请先准备运行环境')
  /**
   * 内部模块位置相对交付入口解析，消费方 cwd 始终不变。
   */
  const directory = fileURLToPath(new URL('.', import.meta.url))
  /**
   * 唯一平台路由，不扫描用户目录或根据历史安装猜测操作。
   */
  let invocation
  try {
    invocation = resolveInvocation(process.platform, directory)
  }
  catch (error) {
    return fail('platform', error.message)
  }
  /**
   * 平台脚本是模块，不是另一个用户可选操作。
   */
  const script = invocation.args.at(-1)
  if (!fs.existsSync(script) || !fs.statSync(script).isFile())
    return fail('material', `内部平台脚本缺失：${script}`)
  return new Promise((resolve) => {
    /**
     * 参数数组避免 shell 二次解析，stdio 保留现有安装阶段报告。
     */
    const child = spawn(invocation.command, [...invocation.args, ...argv], { stdio: 'inherit', shell: false, detached: process.platform !== 'win32' })
    /**
     * 子进程 error 和 close 可能依次出现，清理及结果只处理一次。
     */
    let settled = false
    /**
     * 记录调用者取消，避免子模块把取消改写成成功。
     */
    let cancellation
    /**
     * POSIX 通知独立子进程组，停止前台后代并让平台脚本运行原有清理逻辑。
     * Windows 使用原生子进程终止，完整进程树语义留待 Windows 实测。
     * @param {NodeJS.Signals} signal 收到的实际取消信号。
     */
    function forward(signal) {
      cancellation = signal
      if (process.platform === 'win32') {
        child.kill(signal)
        return
      }
      if (!child.pid)
        return
      try {
        process.kill(-child.pid, signal)
      }
      catch (error) {
        if (error.code !== 'ESRCH')
          throw error
      }
    }
    /**
     * 保留具名监听器以便子模块结束后移除。
     */
    const onInterrupt = () => forward('SIGINT')
    /**
     * 终止与交互中断采用相同的窄调度边界。
     */
    const onTerminate = () => forward('SIGTERM')
    /**
     * 等待子模块终止后释放监听器，保持原始退出码。
     * @param {number} code 已确定的退出码。
     */
    function finish(code) {
      if (settled)
        return
      settled = true
      process.removeListener('SIGINT', onInterrupt)
      process.removeListener('SIGTERM', onTerminate)
      resolve(code)
    }
    process.on('SIGINT', onInterrupt)
    process.on('SIGTERM', onTerminate)
    child.once('error', error => finish(fail('prerequisite', `无法启动内部 ${invocation.command}：${error.message}`)))
    child.once('close', (code, signal) => {
      /**
       * shell 被信号终止或使用者取消时返回常规信号退出码。
       */
      const received = cancellation || signal
      finish(received ? 128 + (os.constants.signals[received] || 1) : (code ?? 1))
    })
  })
}

/**
 * 只在直接执行时调度；导入平台选择函数不会触发安装。
 */
const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isMain) {
  run(process.argv.slice(2))
    .then((code) => { process.exitCode = code })
    .catch((error) => { process.exitCode = fail('runtime', `入口执行失败：${error.message}`) })
}
