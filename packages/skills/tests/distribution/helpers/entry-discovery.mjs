import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { parse } from 'yaml'

/**
 * 来源与目标目录链不能含链接或普通文件，避免根目录看似为空却向外写入。
 * @param {string} directory 需要核对的绝对目录。
 */
function checkDirectoryChain(directory) {
  if (!path.isAbsolute(directory))
    throw new Error(`目录必须是绝对路径：${directory}`)
  /**
   * 从文件系统根逐层核查，未创建的后续目录允许保留为计划。
   */
  let current = path.parse(directory).root
  /**
   * 分隔路径逐段追加，不先解析链接的真实位置掩盖风险。
   */
  for (const component of directory.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, component)
    /**
     * 对悬空链接同样保留保护语义。
     */
    const stat = fs.lstatSync(current, { throwIfNoEntry: false })
    if (stat && (stat.isSymbolicLink() || !stat.isDirectory()))
      throw new Error(`目录链含链接或非目录：${current}`)
  }
}

/**
 * 枚举普通文件并保留完整字节摘要；拒绝来源链接及特殊文件。
 * @param {string} root 待读取的真实目录。
 * @returns {Record<string, string>} 相对路径与 SHA-256。
 */
function filesIn(root) {
  checkDirectoryChain(root)
  /**
   * 字典只服务本次比较，不写入安装状态或收据。
   */
  const files = {}
  /**
   * 来源根本身也不能由链接绕过检查。
   */
  const rootStat = fs.lstatSync(root)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink())
    throw new Error(`来源不是普通目录或包含链接：${root}`)
  /**
   * 原始相对路径按目录实际内容枚举，不限制为 SKILL.md 单文件。
   */
  for (const relative of fs.readdirSync(root, { recursive: true }).sort()) {
    /**
     * 当前对象保留 lstat 语义，不跟随未知附件链接。
     */
    const stat = fs.lstatSync(path.join(root, relative))
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory()))
      throw new Error(`来源包含链接或特殊文件：${relative}`)
    if (stat.isFile())
      files[relative.split(path.sep).join('/')] = createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex')
  }
  return files
}

/**
 * 读取技能元数据和完整来源，并验证正文中的必要 references 引用。
 * @param {string} root 技能来源目录。
 * @param {string} expectedName 本任务允许的精确技能身份。
 * @returns {{name: string, description: string, body: string, files: Record<string, string>}} 已核对的来源。
 */
export function readSource(root, expectedName) {
  if (!fs.existsSync(path.join(root, 'SKILL.md')))
    throw new Error(`缺少必要来源：${expectedName}`)
  /**
   * 正文和附件先完整检查，再允许任何官方变更调用。
   */
  const files = filesIn(root)
  /**
   * frontmatter 与正文分别保留，生成入口不能按整文件相等判断。
   */
  const match = fs.readFileSync(path.join(root, 'SKILL.md'), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/u)
  if (!match)
    throw new Error(`技能元数据缺失：${expectedName}`)
  /**
   * 沿已有 yaml 依赖读取实际名称与发现描述，不另维护固定描述。
   */
  const metadata = parse(match[1])
  if (metadata?.name !== expectedName || typeof metadata.description !== 'string' || !metadata.description.trim())
    throw new Error(`技能身份或描述无效：${expectedName}`)
  /**
   * 本候选只处理实际相对附件，目录穿越和缺项不能留到注册后。
   */
  for (const reference of match[2].matchAll(/\]\((references\/[^)#]+)(?:#[^)]*)?\)/gu)) {
    /**
     * URL 编码还原后逐段检查，不能仅靠 normalize 掩盖越界。
     */
    const relative = decodeURIComponent(reference[1])
    if (relative.includes('\\') || relative.split('/').some(part => !part || part === '.' || part === '..') || !Object.hasOwn(files, relative))
      throw new Error(`缺少附件或引用越界：${relative}`)
  }
  return { name: metadata.name, description: metadata.description, body: match[2], files }
}

/**
 * 合并必要附件；同路径不同内容、大小写及文件/目录前缀冲突立即拒绝。
 * @param {string[]} roots 具有同一 references 语义的附件目录。
 * @returns {Map<string, Buffer>} 可原字节桥接的附件。
 */
function referenceFiles(roots) {
  /**
   * 只保留本轮内存计划，不生成集中式生产声明。
   */
  const files = new Map()
  /**
   * 防止在其他文件系统上大小写折叠造成覆盖。
   */
  const folded = new Map()
  /**
   * 未提供附件的正式来源无需人为补附件。
   */
  for (const root of roots.filter(Boolean)) {
    /**
     * 完整枚举同时完成链接与特殊对象检查。
     */
    const entries = filesIn(root)
    /**
     * 同路径仅字节完全一致时可复用。
     */
    for (const relative of Object.keys(entries)) {
      /**
       * 原始附件字节用于实际复制与冲突判断。
       */
      const bytes = fs.readFileSync(path.join(root, relative))
      if ((folded.has(relative.toLowerCase()) && folded.get(relative.toLowerCase()) !== relative) || (files.has(relative) && !files.get(relative).equals(bytes)) || [...files.keys()].some(existing => relative.startsWith(`${existing}/`) || existing.startsWith(`${relative}/`)))
        throw new Error(`附件冲突：${relative}`)
      folded.set(relative.toLowerCase(), relative)
      files.set(relative, bytes)
    }
  }
  return files
}

/**
 * 实际执行官方工具并保留命令、输出和退出码，不把部分成功改写为成功。
 * @param {object} options 当前测试环境及调用记录。
 * @param {string} command 实际可执行文件。
 * @param {string[]} args 原样传递的参数。
 */
function invoke(options, command, args) {
  /**
   * 无 shell 拼接，测试只向当前隔离项目传递路径。
   */
  const result = spawnSync(command, args, { cwd: options.project, env: options.env, encoding: 'utf8', timeout: 60000 })
  options.calls.push({ command, args, status: result.status, stdout: result.stdout || '', stderr: result.stderr || '', error: result.error?.message || null })
  if (result.error || result.status !== 0)
    throw new Error(`官方调用失败：${result.error?.message || `${result.status}\n${result.stdout}\n${result.stderr}`}`)
}

/**
 * 仅用于 TV-08 的隔离候选：官方安装、精确归位来源、准备临时声明并交官方生成。
 * 不修改生产注册器，不手写生成 SKILL、registry 或持久安装状态。
 * @param {object} options 独占项目、官方根、来源、CLI、环境及调用记录。
 * @returns {{incrementRoot: string, generatedPath: string}} 实际来源和生成入口位置。
 */
export function runEntryCandidate(options) {
  /**
   * 当前候选只使用三份明确来源，暂停模式不加入选择。
   */
  const sources = [
    { root: options.incrementRoot, name: 'task-increment' },
    { root: options.preparationRoot, name: 'implementation-preparation' },
    { root: options.codingRoot, name: 'business-node-delivery' },
  ]
  /**
   * 所有来源检查必须早于第一次变更性官方调用。
   */
  const metadata = sources.map(source => readSource(source.root, source.name))
  /**
   * 只对 Increment 维护源采用已选的同级目录，不隐藏其他技能。
   */
  const incrementRoot = path.join(`${options.skillsRoot}-speckit-sources`, 'task-increment')
  /**
   * 全局安装只改变来源作用域，正式入口仍属于明确目标项目。
   */
  const generatedPath = path.join(options.project, '.agents/skills/speckit-modes-increment/SKILL.md')
  /**
   * 不接管任何已有目标，旧登记及受管刷新由后续 TV-11 负责。
   */
  const targets = [...sources.map(source => path.join(options.skillsRoot, source.name)), incrementRoot, path.dirname(generatedPath), path.join(options.project, '.specify/extensions/modes'), options.stageRoot]
  /**
   * 对悬空链接同样按既有内容保护，不能仅依赖 existsSync。
   */
  for (const target of targets) {
    checkDirectoryChain(target)
    if (fs.existsSync(target) || fs.lstatSync(target, { throwIfNoEntry: false }))
      throw new Error(`目标已存在，保护未知内容：${target}`)
  }
  /**
   * 当前正式来源没有附件时空集合有效，反例另提供明确测试副本。
   */
  const ownReferences = path.join(options.incrementRoot, 'references')
  /**
   * 桥接冲突必须在安装或官方更新前发现。
   */
  const references = referenceFiles([...(fs.existsSync(ownReferences) ? [ownReferences] : []), ...(options.referenceRoots || [])])
  /**
   * 官方安装位置由所选 Agent 和项目/全局参数决定。
   */
  for (const source of sources) {
    invoke(options, process.execPath, [options.skillsCli, 'add', source.root, '--skill', source.name, '--agent', 'codex', '--copy', '--yes', ...(options.scope === 'global' ? ['--global'] : [])])
    if (JSON.stringify(filesIn(path.join(options.skillsRoot, source.name))) !== JSON.stringify(readSource(source.root, source.name).files))
      throw new Error(`官方安装完整集合不一致：${source.name}`)
  }
  fs.mkdirSync(path.dirname(incrementRoot), { recursive: true })
  fs.renameSync(path.join(options.skillsRoot, 'task-increment'), incrementRoot)
  fs.mkdirSync(path.join(options.stageRoot, 'skills'), { recursive: true })
  fs.cpSync(incrementRoot, path.join(options.stageRoot, 'skills/task-increment'), { recursive: true })
  if (options.bridgeReferences !== false) {
    /**
     * 顶层引用附件保持原字节，正文路径由官方重写。
     */
    for (const [relative, bytes] of references) {
      fs.mkdirSync(path.dirname(path.join(options.stageRoot, 'references', relative)), { recursive: true })
      fs.writeFileSync(path.join(options.stageRoot, 'references', relative), bytes)
    }
  }
  /**
   * 只有一个正式命令；声明由当前来源的实际描述形成。
   */
  const manifest = {
    schema_version: '1.0',
    extension: { id: 'modes', name: 'TV08 Increment', version: '1.0.0', description: 'T095隔离验证输入，非生产安装器' },
    requires: { speckit_version: '==1.2.6' },
    provides: { commands: [{ name: 'speckit.modes.increment', file: 'skills/task-increment/SKILL.md', description: metadata[0].description }] },
  }
  fs.writeFileSync(path.join(options.stageRoot, 'extension.yml'), `${JSON.stringify(manifest, null, 2)}\n`)
  invoke(options, options.specify, ['extension', 'add', '--dev', options.stageRoot, '--force'])
  if (!fs.existsSync(generatedPath))
    throw new Error('官方未生成 Increment 正式入口')
  return { incrementRoot, generatedPath }
}
