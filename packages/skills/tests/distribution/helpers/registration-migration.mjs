import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { readSource } from './entry-discovery.mjs'

/**
 * 本候选只操作已明确退役的六个扩展，不按目录扫描批量清理。
 */
const retired = ['artifact-issue-description', 'artifact-pr-description', 'mvu-gate', 'artifact-business-flow', 'artifact-logic-flow', 'explainer-doc-sync']
/**
 * 当前 hooks 的事件限定，不从残留环境补齐旧集合。
 */
const currentHooks = { 'implementation-preparation': 'before_implement', 'artifact-spec-analysis': 'after_tasks', 'artifact-project-description': 'after_converge' }
/**
 * 已知历史命令名只用于核验旧登记归属，不生成暂停模式。
 */
const knownModes = ['tutor', 'pair', 'direct', 'increment', 'review', 'guide', 'explore']

/**
 * 逐层拒绝链接和非目录祖先，未创建的后续目录允许保留。
 * @param {string} target 绝对路径。
 */
function checkPath(target) {
  if (!path.isAbsolute(target))
    throw new Error(`路径必须绝对：${target}`)
  /**
   * 从文件系统根开始，不能先 realpath 掩盖链接。
   */
  let cursor = path.parse(target).root
  /**
   * 每个已有祖先均需是普通目录，叶节点另外核对类型。
   */
  for (const part of target.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part)
    /**
     * 悬空链接也必须被识别。
     */
    const stat = fs.lstatSync(cursor, { throwIfNoEntry: false })
    if (stat?.isSymbolicLink() || (stat && cursor !== target && !stat.isDirectory()))
      throw new Error(`路径含链接或非目录：${cursor}`)
  }
}

/**
 * 完整目录摘要用于一次性官方基线比较，拒绝链接和特殊文件。
 * @param {string} root 普通目录。
 * @returns {Record<string, string>} 完整文件集合及摘要。
 */
function tree(root) {
  checkPath(root)
  if (!fs.lstatSync(root).isDirectory())
    throw new Error(`目标不是目录：${root}`)
  /**
   * 相对路径稳定排序后比较，不保存指纹状态文件。
   */
  const result = {}
  /**
   * 每个路径先 lstat 再读取，未知链接不跟随。
   */
  for (const relative of fs.readdirSync(root, { recursive: true }).sort()) {
    /**
     * 子路径仍检查目录链，防止内部链接越界。
     */
    const target = path.join(root, relative)
    checkPath(target)
    /**
     * 非普通文件或目录无法证明归属，必须停止。
     */
    const stat = fs.lstatSync(target)
    if (!stat.isDirectory() && !stat.isFile())
      throw new Error(`未知文件类型：${target}`)
    if (stat.isFile())
      result[relative.split(path.sep).join('/')] = createHash('sha256').update(fs.readFileSync(target)).digest('hex')
  }
  return result
}

/**
 * 读取普通配置，禁止通过链接访问不受控位置。
 * @param {string} file 配置文件。
 * @returns {object} 解析后的配置。
 */
function readConfig(file) {
  checkPath(file)
  if (!fs.lstatSync(file).isFile())
    throw new Error(`配置不是普通文件：${file}`)
  return parse(fs.readFileSync(file, 'utf8'))
}

/**
 * 将必要 references 原字节桥接到 modes 顶层，冲突必须在官方调用前拒绝。
 * @param {string[]} roots 附件根目录。
 * @returns {Map<string, Buffer>} 可无损桥接的附件。
 */
function references(roots) {
  /**
   * 键保留实际相对路径，另按小写检查跨平台冲突。
   */
  const files = new Map()
  /**
   * 每个输入根完整验证，不能依赖正文仅引用其中一部分。
   */
  for (const root of roots) {
    /**
     * 摘要枚举同时验证全部路径类型。
     */
    const entries = tree(root)
    /**
     * 相同位置同字节可以复用，大小写或文件目录前缀冲突不可合并。
     */
    for (const relative of Object.keys(entries)) {
      /**
       * 附件原字节，桥接不润色正文。
       */
      const bytes = fs.readFileSync(path.join(root, relative))
      /**
       * 已有桥接项逐一比较，输入规模仅为本次所选附件。
       */
      for (const [previous, content] of files) {
        if ((previous.toLowerCase() === relative.toLowerCase() && (previous !== relative || !content.equals(bytes))) || previous.toLowerCase().startsWith(`${relative.toLowerCase()}/`) || relative.toLowerCase().startsWith(`${previous.toLowerCase()}/`))
          throw new Error(`附件冲突：${root}/${relative}`)
      }
      files.set(relative, bytes)
    }
  }
  return files
}

/**
 * 核对选定事件的开关和命令身份，坏配置不能落入卸载阶段。
 * @param {string} id 当前技能身份。
 * @param {string} event 唯一允许事件。
 * @param {object} hooks 当前集合选项。
 */
function validateHook(id, event, hooks) {
  if (!hooks || Object.keys(hooks).length !== 1 || !hooks[event])
    throw new Error(`当前 hook 配置缺失：${id}`)
  /**
   * 源配置不含 command 时按技能身份形成官方声明；显式其他身份立即拒绝。
   */
  const config = hooks[event]
  if (typeof config.prompt !== 'string' || !config.prompt.trim() || config.optional !== false || (config.condition != null && config.condition !== '') || config.enabled === false || (config.command !== undefined && config.command !== id))
    throw new Error(`当前 hook 配置无效：${id}`)
}

/**
 * 一次性核对当前来源、事件配置及附件，缺项早于官方变更。
 * @param {object} options 候选输入。
 * @returns {object} 完整来源及临时声明所需材料。
 */
function prepareSources(options) {
  /**
   * 所有读取和缺源校验早于临时输入写入与第一次官方变更。
   */
  const init = readConfig(path.join(options.project, '.specify/init-options.json'))
  if (init.ai !== 'codex' || init.ai_skills !== true)
    throw new Error('目标项目尚未按 Codex skills 初始化')
  /**
   * 当前四份来源分别完整核验，不依赖 coding 或三暂停技能。
   */
  const sources = new Map()
  /**
   * 本次需要且仅需要的来源集合。
   */
  for (const id of ['task-increment', ...Object.keys(currentHooks)]) {
    /**
     * Increment 与正常发现根分别定位。
     */
    const root = id === 'task-increment' ? options.incrementRoot : path.join(options.sourceRoot, id)
    sources.set(id, { root, ...readSource(root, id) })
  }
  /**
   * 配置取当前集合，不恢复逐技能 speckit-hooks.json。
   */
  const collection = readConfig(options.collectionFile)
  /**
   * 事件必须齐备且语义有效，缺项不能先卸载旧环境再发现。
   */
  for (const [id, event] of Object.entries(currentHooks)) {
    /**
     * 所选 hook 的真实集合定义。
     */
    const hooks = collection?.skill?.[id]?.hook
    validateHook(id, event, hooks)
  }
  /**
   * Increment 需要的顶层附件桥接来自真实来源及明确测试输入。
   */
  const ownReferences = path.join(options.incrementRoot, 'references')
  /**
   * 必需附件或冲突在任何官方调用前完成验证。
   */
  const attachments = references([...(fs.existsSync(ownReferences) ? [ownReferences] : []), ...(options.referenceRoots || [])])
  checkPath(options.stageRoot)
  if (fs.existsSync(options.stageRoot))
    tree(options.stageRoot)
  return { sources, collection, attachments }
}

/**
 * 核对一个受影响扩展的官方登记、manifest 和完整基线。
 * @param {object} options 候选输入及官方基线。
 * @param {string} id 明确受影响的扩展。
 * @param {object} registry 当前只读登记。
 * @param {Set<string>} generated 收集实际登记的模式入口。
 */
function inspectExtension(options, id, registry, generated) {
  /**
   * 扩展目录及本轮由官方建立的可审阅基线。
   */
  const relative = `.specify/extensions/${id}`
  /**
   * lstat 识别悬空链接，不把它当不存在。
   */
  const target = path.join(options.project, relative)
  checkPath(target)
  if (!registry[id]) {
    if (fs.lstatSync(target, { throwIfNoEntry: false }))
      throw new Error(`无登记孤立目录：${target}`)
    return
  }
  if (!options.baseline[relative] || JSON.stringify(tree(target)) !== JSON.stringify(options.baseline[relative]))
    throw new Error(`扩展目录未知或已修改：${target}`)
  /**
   * manifest 里的旧命令和 registry 必须一致，拒绝额外用户命令。
   */
  const manifest = readConfig(path.join(target, 'extension.yml'))
  /**
   * 旧 hooks-only 没有 commands 时视为空集合。
   */
  const commands = manifest.provides?.commands || []
  /**
   * 本候选只处理 Codex 已登记命令，其他宿主的登记不能擅自卸载。
   */
  const registered = registry[id].registered_commands || {}
  if (manifest.extension?.id !== id || Object.keys(registered).some(agent => agent !== 'codex') || registry[id].registered_skills?.length || JSON.stringify(registered.codex || []) !== JSON.stringify(commands.map(command => command.name)))
    throw new Error(`登记与 manifest 不一致：${target}`)
  /**
   * 所有命令必须属于明确的旧 modes；hook 扩展不得夹带命令。
   */
  for (const command of commands) {
    if (id !== 'modes' || !knownModes.some(mode => command.name === `speckit.modes.${mode}`) || command.aliases?.length)
      throw new Error(`未知受影响命令：${command.name}`)
    generated.add(command.name.replaceAll('.', '-'))
  }
}

/**
 * 预检旧环境与所有受影响生成目录，未知或用户内容立即保护。
 * @param {object} options 候选输入。
 * @returns {object} 实际登记及其生成目录名。
 */
function inspectExisting(options) {
  /**
   * 官方登记只读，候选不手写 registry 或 extensions.yml。
   */
  const registry = readConfig(path.join(options.project, '.specify/extensions/.registry')).extensions
  if (!registry || typeof registry !== 'object')
    throw new Error('官方登记不可读')
  /**
   * 后续 remove/force 涉及的精确目录，未知对象必须保持。
   */
  const affected = ['modes', ...retired, ...Object.keys(currentHooks)]
  /**
   * 实际登记与 manifest 共同限定生成目录，不信任名字相似的孤立副本。
   */
  const generated = new Set()
  /**
   * 各扩展逐一核对完整来源归属，尚不执行变更。
   */
  for (const id of affected)
    inspectExtension(options, id, registry, generated)
  /**
   * 有效 hook 也需有登记，不能因目录已移除就报告完整退役。
   */
  const config = readConfig(path.join(options.project, '.specify/extensions.yml'))
  /**
   * 这里只读检查孤立有效调用，不合并或改写用户配置。
   */
  for (const hook of Object.values(config.hooks || {}).flat()) {
    if (affected.includes(hook.extension) && !registry[hook.extension])
      throw new Error(`无登记孤立 hook：${hook.extension}`)
  }
  /**
   * 额外原始副本或 modes 生成目录没有归属证据时停止。
   */
  for (const name of fs.readdirSync(path.join(options.project, '.agents/skills'))) {
    if (knownModes.some(mode => name === `task-${mode}`) || (name.startsWith('speckit-modes-') && !generated.has(name)))
      throw new Error(`未知或孤立入口：${name}`)
  }
  /**
   * 每个已登记生成目录核对完整集合及字节，保护额外附件和用户正文。
   */
  for (const name of generated) {
    /**
     * 目录基线由验证方官方生成保存，候选不自行认领现有内容。
     */
    const relative = `.agents/skills/${name}`
    if (!options.baseline[relative] || JSON.stringify(tree(path.join(options.project, relative))) !== JSON.stringify(options.baseline[relative]))
      throw new Error(`生成目录未知或已修改：${relative}`)
  }
  return { registry, generated }
}

/**
 * 逐项官方移除已登记的六旧 hooks，不承诺跨步骤回滚。
 * @param {object} options 候选输入及当前一次性基线。
 * @param {object} registry 写前实际登记。
 * @param {string[]} completed 实际完成记录。
 * @param {Function} invoke 真实官方调用边界。
 */
function removeRetired(options, registry, completed, invoke) {
  /**
   * 六退役对象仅在实际登记存在时调用官方移除。
   */
  for (const id of retired) {
    if (registry[id]) {
      invoke(['extension', 'remove', id, '--force'])
      if (fs.existsSync(path.join(options.project, '.specify/extensions', id)))
        throw Object.assign(new Error(`官方移除后仍有残留：${id}`), { completed: [...completed] })
      delete options.baseline[`.specify/extensions/${id}`]
      completed.push(`remove:${id}`)
    }
  }
}

/**
 * 将所选集合的事件选项包入官方声明，command 固定为技能身份。
 * @param {string} id 当前扩展。
 * @param {object} source 已核对来源元数据。
 * @param {object} collection 已核对集合。
 * @returns {object} 官方临时扩展声明。
 */
function createManifest(id, source, collection) {
  return { schema_version: '1.0', extension: { id, name: id, version: '1.0.0', description: 'T066 隔离候选' }, requires: { speckit_version: '==1.2.6' }, provides: id === 'modes' ? { commands: [{ name: 'speckit.modes.increment', file: 'skills/task-increment/SKILL.md', description: source.description }] } : {}, ...(id === 'modes' ? {} : { hooks: Object.fromEntries(Object.entries(collection.skill[id].hook).map(([event, config]) => [event, { command: id, ...config }])) }) }
}

/**
 * 先刷新三项 hooks 再刷新 Increment，完整来源由官方复制。
 * @param {object} options 候选输入及官方基线。
 * @param {object} prepared 已预检的来源、集合与附件。
 * @param {Set<string>} generated 迁移前已登记入口。
 * @param {string[]} completed 实际完成记录。
 * @param {Function} invoke 真实官方调用边界。
 */
function installCurrent(options, prepared, generated, completed, invoke) {
  /**
   * 仅传递准备阶段已经完整核验的三类材料。
   */
  const { sources, collection, attachments } = prepared
  /**
   * 当前 hook 逐项安装，最后才进入 modes；没有自有配置合并。
   */
  for (const id of [...Object.keys(currentHooks), 'modes']) {
    fs.mkdirSync(options.stageRoot, { recursive: true })
    /**
     * 每次刷新使用全新临时输入，合法减少附件时不残留旧文件。
     */
    const input = fs.mkdtempSync(path.join(options.stageRoot, `${id}-`))
    fs.mkdirSync(path.join(input, 'skills'), { recursive: true })
    /**
     * modes 使用 Increment 来源，其他扩展采用自身技能。
     */
    const source = sources.get(id === 'modes' ? 'task-increment' : id)
    fs.cpSync(source.root, path.join(input, 'skills', source.name), { recursive: true })
    if (id === 'modes') {
      /**
       * 顶层桥接让官方改写后的附件引用可达。
       */
      for (const [relative, bytes] of attachments) {
        fs.mkdirSync(path.dirname(path.join(input, 'references', relative)), { recursive: true })
        fs.writeFileSync(path.join(input, 'references', relative), bytes)
      }
    }
    /**
     * hook 配置取集合原值；命令声明只含 Increment。
     */
    const manifest = createManifest(id, source, collection)
    fs.writeFileSync(path.join(input, 'extension.yml'), JSON.stringify(manifest))
    invoke(['extension', 'add', '--dev', input, '--force'])
    /**
     * 官方复制后的完整来源必须一致，再更新本测试的一次性内存基线。
     */
    const installed = path.join(options.project, '.specify/extensions', id)
    if (JSON.stringify(tree(path.join(installed, 'skills', source.name))) !== JSON.stringify(source.files))
      throw Object.assign(new Error(`官方来源不同版：${id}`), { completed: [...completed] })
    options.baseline[`.specify/extensions/${id}`] = tree(installed)
    if (id === 'modes') {
      /**
       * 后续重复/失败恢复只复用本次真实官方产生的目录快照。
       */
      for (const name of generated)
        delete options.baseline[`.agents/skills/${name}`]
      options.baseline['.agents/skills/speckit-modes-increment'] = tree(path.join(options.project, '.agents/skills/speckit-modes-increment'))
    }
    completed.push(`add:${id}`)
  }
}

/**
 * 完整预检后调用官方迁移旧集合；只服务 T066，不是生产安装器。
 * @param {object} options 项目、来源、配置、官方调用器与一次性官方基线。
 * @returns {{completed: string[]}} 实际完成阶段，失败异常携带已完成范围。
 */
export function runMigrationCandidate(options) {
  /**
   * 来源和所有旧对象检查先于第一次官方变更。
   */
  const prepared = prepareSources(options)
  /**
   * 只读取得实际登记，不把目录存在当归属证明。
   */
  const { registry, generated } = inspectExisting(options)
  /**
   * 只记录本次实际完成，发生失败时不捏造回滚或后续成功。
   */
  const completed = []
  /**
   * 保留官方调用和退出，异常携带已完成范围以供恢复。
   * @param {string[]} args 官方参数。
   */
  function invoke(args) {
    /**
     * 测试日志不包含凭据，原始输出由调用方保留。
     */
    let result
    try {
      result = options.invoke(args)
    }
    catch (error) {
      options.calls.push({ args, status: null, error: error.code || error.message })
      throw Object.assign(error, { completed: [...completed] })
    }
    options.calls.push({ args, status: result.status, error: result.error?.code, signal: result.signal })
    if (result.error || result.signal || result.status !== 0)
      throw Object.assign(new Error(`官方迁移失败：${args.join(' ')}，退出 ${result.status}`), { completed: [...completed], status: result.status, code: result.error?.code, signal: result.signal })
  }
  removeRetired(options, registry, completed, invoke)
  installCurrent(options, prepared, generated, completed, invoke)
  return { completed }
}
