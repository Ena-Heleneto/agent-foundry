/**
 * 独立脚本使用安装器已有的 Node 读写 JSON，并以独立参数调用 Git。
 */
const hiddenInstallProgram = String.raw`import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

/**
 * 缺失路径按不存在处理，符号链接保留自身类型。
 */
function stat(file) {
  return fs.lstatSync(file, { throwIfNoEntry: false })
}

/**
 * 读取协议参数，只接受显式项目、固定安装根和两个绝对文件路径。
 */
function readOptions(args) {
  /**
   * 协议 1 接受的四个参数。
   */
  const allowed = ["--project", "--agent-root", "--successful-skills-file", "--result-file"]
  /**
   * 按参数名保存值，避免重复参数覆盖前值。
   */
  const options = new Map()
  while (args.length) {
    /**
     * 每个参数必须带一个独立值。
     */
    const [key, value] = args.splice(0, 2)
    if (!allowed.includes(key) || options.has(key) || !value)
      throw new Error("隐匿参数缺失、重复或无效")
    options.set(key, value)
  }
  if (options.get("--agent-root") !== ".agents/skills" ||
      allowed.some(key => key !== "--agent-root" && !path.isAbsolute(options.get(key) || "")))
    throw new Error("隐匿需指定绝对路径和 .agents/skills 安装根")
  return options
}

/**
 * 向本地排除文件追加字面规则，串行读取及追加以保留已有内容并去重。
 */
function appendRules(gitDir, paths) {
  /**
   * Git 本地排除目录及其文件。
   */
  const info = path.join(gitDir, "info")
  /**
   * 固定使用项目本地文件。
   */
  const exclude = path.join(info, "exclude")
  if (stat(info)?.isDirectory() === false)
    throw new Error("本地排除目录必须是普通目录")
  fs.mkdirSync(info, { recursive: true })
  /**
   * 只清理由本次调用持有的排除文件锁。
   */
  const lock = fs.openSync(exclude + ".lock", "wx", 0o600)
  try {
    /**
     * 排除文件必须位于当前项目，由该项目独立持有。
     */
    const existing = stat(exclude)
    if (existing && (!existing.isFile() || existing.nlink !== 1))
      throw new Error("本地排除文件必须是普通文件")
    /**
     * 追加时保留已有字节，包括缺少结尾换行的情况。
     */
    const before = existing ? fs.readFileSync(exclude, "utf8") : ""
    /**
     * Git 通配符按技能目录名中的字面字符处理。
     */
    const additions = [...paths]
      .map(relative => "/" + relative.replace(/[[\]\\*?]/g, "\\$&") + "/")
      .filter(rule => !before.split(/\r?\n/).includes(rule))
    if (additions.length)
      fs.appendFileSync(exclude, (before && !before.endsWith("\n") ? "\n" : "") + additions.join("\n") + "\n")
  }
  finally {
    fs.closeSync(lock)
    fs.unlinkSync(exclude + ".lock")
  }
}

/**
 * 取本次成功名单与构建候选的交集，保护跟踪文件并复核 Git 忽略效果。
 */
function hideSkills(options, report) {
  /**
   * 从显式项目确定 Git 目录，常规仓库之外的布局跳过。
   */
  const project = path.resolve(options.get("--project"))
  /**
   * 当前支持的项目级安装根。
   */
  const agentRoot = options.get("--agent-root")
  /**
   * Git 元数据位于当前项目中。
   */
  const gitDir = path.join(project, ".git")
  if (!stat(gitDir)?.isDirectory() || stat(path.join(gitDir, "commondir"))) {
    report.reasonCode = "no-local-git-directory"
    return
  }
  /**
   * 每条成功记录含本次复制结果和实际安装路径。
   */
  const successful = JSON.parse(fs.readFileSync(options.get("--successful-skills-file"), "utf8"))
  if (!Array.isArray(successful) || successful.some(item =>
    !item || typeof item.name !== "string" || !item.name ||
    typeof item.installRelativeDirectory !== "string" || typeof item.installedPath !== "string" ||
    typeof item.complete !== "boolean"))
    throw new Error("技能成功名单格式无效")
  /**
   * 只在构建注入的数据位置映射安装根占位符。
   */
  const candidates = new Set(JSON.parse(process.argv[2]).map(value => value.replace("@@AGENT_SKILLS_ROOT@@", agentRoot)))
  /**
   * 从项目向内逐级确认安装根为真实目录。
   */
  const localRoot = stat(path.join(project, ".agents"))?.isDirectory() &&
    stat(path.join(project, agentRoot))?.isDirectory()
  /**
   * 将 Git 索引和公共目录固定到显式项目。
   */
  const env = { ...process.env, GIT_COMMON_DIR: gitDir, GIT_INDEX_FILE: path.join(gitDir, "index") }

  /**
   * 实际查询 Git，check-ignore 的 1 表示规则未生效。
   */
  function git(command, args) {
    /**
     * ls-files 的目标按字面解析，check-ignore 接受普通项目相对路径。
     */
    const prefix = command === "ls-files" ? ["--literal-pathspecs"] : []
    /**
     * 使用独立参数限定 Git 项目和工作树。
     */
    const result = spawnSync("git", [...prefix, "--git-dir=" + gitDir, "--work-tree=" + project, command, ...args], {
      cwd: project,
      env,
      encoding: "utf8",
    })
    if (result.error || (result.status !== 0 && !(command === "check-ignore" && result.status === 1)))
      throw new Error(result.error?.message || result.stderr.trim() || "Git 查询失败")
    return result
  }

  /**
   * 每个确认可隐匿的安装目录只生成一条规则。
   */
  const paths = new Set()
  for (const item of successful) {
    /**
     * 安装目录只允许安装根下的一层。
     */
    const name = item.installRelativeDirectory
    /**
     * 精确规则使用项目相对路径。
     */
    const relative = agentRoot + "/" + name
    /**
     * 名单中的实际安装位置应匹配项目内目录。
     */
    const expected = path.join(project, relative)
    /**
     * 跳过原因和路径一并保留给入口。
     */
    let reasonCode
    if (!item.complete)
      reasonCode = "incomplete"
    else if (!name || name === "." || name === ".." || /[/\x00-\x1f\x7f]/.test(name) || !candidates.has(relative))
      reasonCode = "not-a-candidate"
    else if (item.installedPath !== expected || !localRoot || !stat(expected)?.isDirectory())
      reasonCode = "not-a-local-skill-directory"
    else if (git("ls-files", ["-z", "--", relative]).stdout)
      reasonCode = "tracked"

    if (reasonCode)
      report.skipped.push({ path: item.installedPath, reasonCode })
    else
      paths.add(relative)
  }
  if (!paths.size)
    return

  try {
    appendRules(gitDir, paths)
  }
  catch (error) {
    report.failed = [...paths].map(relative => ({ path: relative, reasonCode: "exclude-write-failed" }))
    throw error
  }
  for (const relative of paths) {
    try {
      if (git("check-ignore", ["--quiet", "--", relative + "/"]).status === 0)
        report.processed.push(relative)
      else
        report.failed.push({ path: relative, reasonCode: "rule-ineffective" })
    }
    catch (error) {
      report.failed.push({ path: relative, reasonCode: "git-query-failed" })
      console.error(error.message)
    }
  }
  report.status = report.failed.length ? "failed" : "success"
  report.reasonCode = report.failed.length ? "verification-failed" : "rules-verified"
}

try {
  /**
   * 在写入排除规则前检查参数并取得本次结果文件。
   */
  const options = readOptions(process.argv.slice(3))
  /**
   * 结果文件归本次调用，已有文件保留。
   */
  const output = fs.openSync(options.get("--result-file"), "wx", 0o600)
  /**
   * 默认结果为明确不适用，核验实际效果后才报告成功。
   */
  const report = { status: "skipped", reasonCode: "no-applicable-skills", processed: [], skipped: [], failed: [] }
  try {
    hideSkills(options, report)
  }
  catch (error) {
    report.status = "failed"
    report.reasonCode = report.failed[0]?.reasonCode || "hidden-failed"
    console.error(error.message)
  }
  try {
    fs.writeFileSync(output, JSON.stringify(report) + "\n")
  }
  finally {
    fs.closeSync(output)
  }
  process.exitCode = report.status === "failed" ? 1 : 0
}
catch (error) {
  console.error(error.message)
  process.exitCode = 1
}`

/**
 * 生成接受本次成功名单并写入精确本地排除规则的独立脚本。
 *
 * @param enabledSkills 已启用技能列表，使用名称生成安装根下的相对路径。
 * @returns 包含协议标记和候选路径数据的 Bash 脚本。
 */
export function createHiddenInstallScript(enabledSkills: readonly { name: string }[]): string {
  /**
   * 在固定参数位置注入 JSON，单引号转义后技能名称始终按数据传递。
   */
  const candidatePaths = JSON.stringify(enabledSkills.map(({ name }) => `@@AGENT_SKILLS_ROOT@@/${name}`))
    .replaceAll('\'', '\'\\\'\'')

  return [
    '#!/usr/bin/env bash',
    '# foundry-hidden-interface: 1',
    'set -euo pipefail',
    `node --input-type=module - '${candidatePaths}' "$@" <<'FOUNDRY_HIDDEN_NODE'`,
    hiddenInstallProgram,
    'FOUNDRY_HIDDEN_NODE',
    '',
  ].join('\n')
}
