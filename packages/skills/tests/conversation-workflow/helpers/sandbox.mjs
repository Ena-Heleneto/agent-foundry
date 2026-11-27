import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

/**
 * 创建对话记录验收使用的真实临时仓库、原件和可恢复故障目标。
 * 不改写 HOME/CODEX_HOME，不导入任何用户资料或安装器状态。
 * @returns {object} 独占路径、Git 基线、工具描述、故障切换与清理入口。
 */
export function createConversationSandbox() {
  /**
   * 所有本次样例资源只属于这个真实临时根目录。
   */
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-conversation-')))
  /**
   * 两个项目在仓库内；同名前缀对照、记录及原件均在仓库外。
   * writable 是可以阻断并恢复的资料写入目标。
   */
  const paths = {
    repository: path.join(root, 'repository'),
    projects: [path.join(root, 'repository/projects/alpha'), path.join(root, 'repository/projects/beta')],
    outside: path.join(root, 'repository-outside'),
    records: path.join(root, 'records'),
    writable: path.join(root, 'records/writable'),
    parked: path.join(root, 'records/parked'),
    input: path.join(root, 'input'),
    emptyHooks: path.join(root, 'empty-hooks'),
    gitConfig: path.join(root, 'empty.gitconfig'),
  }
  /**
   * 去除全部继承 Git 覆盖项，只对子进程关闭系统和全局配置读取。
   */
  const gitEnv = {
    ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_'))),
    GIT_CONFIG_GLOBAL: paths.gitConfig,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_COUNT: '0',
    GIT_CEILING_DIRECTORIES: root,
    GIT_TERMINAL_PROMPT: '0',
  }
  /**
   * 阻断状态仅属于本次故障目标，不是业务记录状态或持久化服务。
   */
  let blocked = false

  /**
   * 真实执行样例 Git，禁用用户 hook、签名及外部 diff。
   * @param {string[]} args Git 参数，仅供持有本次样例的测试使用。
   * @returns {string} 仅去除末尾一个 LF，保留状态列及 diff 原文空白和 CR 的实际输出。
   */
  function git(args) {
    return execFileSync('git', [
      '-c',
      `core.hooksPath=${paths.emptyHooks}`,
      '-c',
      'commit.gpgsign=false',
      '-c',
      'tag.gpgsign=false',
      '-c',
      'core.autocrlf=false',
      '-c',
      'core.quotePath=false',
      '-c',
      'user.name=Conversation Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      ...args,
    ], { cwd: paths.repository, env: gitEnv, encoding: 'utf8', timeout: 15000 }).replace(/\n$/, '')
  }

  /**
   * 分别取得提交身份、工作区及暂存区，供提交前后按真实结果比对。
   * @returns {{head: string, status: string, worktree: string, index: string}} Git 实际快照。
   */
  function snapshot() {
    return {
      head: git(['rev-parse', 'HEAD']),
      status: git(['status', '--porcelain=v1']),
      worktree: git(['diff', '--binary', '--no-ext-diff', '--no-textconv']),
      index: git(['diff', '--cached', '--binary', '--no-ext-diff', '--no-textconv']),
    }
  }

  /**
   * 把资料目录暂存后用普通文件占位，让后续子路径写入真实失败。
   * 重复调用保持已有故障，不移动或删除已经保存的原记录。
   */
  function blockWrites() {
    if (blocked)
      return
    fs.renameSync(paths.writable, paths.parked)
    try {
      fs.writeFileSync(paths.writable, '受控写入阻断\n', { flag: 'wx' })
      blocked = true
    }
    catch (error) {
      fs.renameSync(paths.parked, paths.writable)
      throw error
    }
  }

  /**
   * 移除本次故障占位并恢复原目录，恢复中途失败时仍允许重试。
   */
  function restoreWrites() {
    if (!blocked)
      return
    fs.rmSync(paths.writable, { force: true })
    fs.renameSync(paths.parked, paths.writable)
    blocked = false
  }

  /**
   * 仅删除本次 mkdtemp 创建的根目录，支持失败后的重复清理。
   */
  function cleanup() {
    fs.rmSync(root, { recursive: true, force: true })
  }

  try {
    /**
     * parked 不预建，避免故障切换覆盖其他资料目录。
     */
    for (const directory of [paths.repository, ...paths.projects, paths.outside, paths.writable, paths.input, paths.emptyHooks])
      fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(paths.gitConfig, '')
    fs.writeFileSync(path.join(paths.repository, 'README.md'), '对话记录合成基线\n')
    git(['init', '--quiet', '--initial-branch=main'])
    git(['add', 'README.md'])
    git(['commit', '--quiet', '-m', '建立对话验收合成基线'])
    /**
     * 后续提交验收可以独立比对这份真实初始提交身份。
     */
    const initialRevision = git(['rev-parse', 'HEAD'])
    /**
     * 附件包含不可安全转换为普通字符串的字节。
     */
    const bytes = Buffer.from([0, 255, 13, 10, 128, 1])
    /**
     * 原件路径与摘要一起交给后续采集验收，原件位于业务仓库外。
     */
    const attachment = {
      path: path.join(paths.input, '附件 原件.bin'),
      sha256: createHash('sha256').update(bytes).digest('hex'),
    }
    fs.writeFileSync(attachment.path, bytes)
    /**
     * 命令通过三个实际写入产生长文本，首尾及中文内容均可逐字节核对。
     */
    const longOutput = {
      command: process.execPath,
      args: ['-e', 'process.stdout.write("开始\\n"); setTimeout(() => process.stdout.write("片段 α\\n".repeat(8192)), 5); setTimeout(() => process.stdout.write("片段 α\\n".repeat(8192) + "结束\\n"), 10)'],
      expected: `开始\n${'片段 α\n'.repeat(16384)}结束\n`,
    }
    return { root, ...paths, initialRevision, attachment, longOutput, git, snapshot, blockWrites, restoreWrites, cleanup }
  }
  catch (error) {
    cleanup()
    throw error
  }
}
