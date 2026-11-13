import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { after } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createSandbox } from '../sandbox.mjs'

/**
 * 固定工具只由调用方提供，缺失时测试明确跳过。
 */
export const migrationCli = process.env.FOUNDRY_SPECIFY_CLI
/**
 * 正式集合和正文只作为隔离候选输入，不修改维护源。
 */
const workflowRoot = fileURLToPath(new URL('../../../src/workflow/', import.meta.url))
/**
 * 各旧集合仅用于登记迁移，三项是人工样本，四/五项沿历史集合。
 */
const legacySets = { three: ['tutor', 'pair', 'increment'], four: ['tutor', 'pair', 'direct', 'increment'], five: ['tutor', 'pair', 'review', 'explore', 'guide'] }
/**
 * 退役期望独立写在夹具中，不能从被测候选导入计算断言。
 */
export const retiredHookIds = ['artifact-issue-description', 'artifact-pr-description', 'mvu-gate', 'artifact-business-flow', 'artifact-logic-flow', 'explainer-doc-sync']
/**
 * 官方建立的模板按旧集合缓存；各反例使用独占副本。
 */
const templates = new Map()

/**
 * 保存普通文件摘要供独立断言；链接仅记录目标，绝不跟随。
 * @param {string} root 比较根目录。
 * @returns {Record<string, string>} 文件或链接的实际摘要。
 */
export function snapshot(root) {
  /**
   * 相对路径和内容对应，排序便于稳定比较。
   */
  const result = {}
  /**
   * 不用递归 readdir 跟随未知链接。
   * @param {string} directory 当前目录。
   */
  function visit(directory) {
    /**
     * 遍历项按名称排序。
     */
    for (const name of fs.readdirSync(directory).sort()) {
      /**
       * lstat 保留实际链接身份。
       */
      const target = path.join(directory, name)
      /**
       * 摘要键统一使用项目相对路径。
       */
      const relative = path.relative(root, target).split(path.sep).join('/')
      /**
       * 文件类型控制遍历，特殊文件单独报告。
       */
      const stat = fs.lstatSync(target)
      if (stat.isSymbolicLink())
        result[relative] = `link:${fs.readlinkSync(target)}`
      else if (stat.isDirectory())
        visit(target)
      else
        result[relative] = createHash('sha256').update(fs.readFileSync(target)).digest('hex')
    }
  }
  if (fs.existsSync(root))
    visit(root)
  return result
}

/**
 * 执行固定工具并保存原始输出；没有模拟官方 YAML 或登记行为。
 * @param {object} item 隔离环境，cli 仅供明确的进程故障样本覆盖工具路径。
 * @param {string[]} args 真实官方参数。
 * @returns {object} 子进程完整结果。
 */
export function officialCall(item, args) {
  /**
   * 每次调用只在自有项目运行且限时，保留真实失败。
   */
  const result = spawnSync(item.cli || migrationCli, args, { cwd: item.project, env: item.env, encoding: 'utf8', timeout: 60000, maxBuffer: 8 * 1024 * 1024 })
  fs.appendFileSync(path.join(item.root, 'official.jsonl'), `${JSON.stringify({ args, status: result.status, signal: result.signal, error: result.error?.message, stdout: result.stdout, stderr: result.stderr })}\n`)
  return result
}

/**
 * 仅准备官方输入；登记和生成全部交给真实 CLI。
 * @param {object} item 隔离项目。
 * @param {string} id 扩展身份。
 * @param {string[]} modes 本样本的旧模式集合。
 * @param {object} hooks 旧或无关 hook 声明。
 */
function seedExtension(item, id, modes = [], hooks = {}) {
  /**
   * 每个输入都有独立临时目录。
   */
  const input = path.join(item.root, 'legacy-input', id)
  fs.mkdirSync(input, { recursive: true })
  /**
   * 旧模式文本显式标记为迁移样本，不研发暂停模式。
   */
  for (const mode of modes) {
    fs.mkdirSync(path.join(input, 'skills', `task-${mode}`), { recursive: true })
    fs.writeFileSync(path.join(input, 'skills', `task-${mode}`, 'SKILL.md'), `---\nname: task-${mode}\ndescription: T066 旧登记样本\n---\n\n# 旧 ${mode} 入口\n仅验证迁移，不执行业务。\n`)
  }
  /**
   * 集合只保存逐事件选项，官方必需 command 按扩展身份补齐。
   */
  const officialHooks = Object.fromEntries(Object.entries(hooks).map(([event, config]) => [event, { command: id, ...config }]))
  fs.writeFileSync(path.join(input, 'extension.yml'), JSON.stringify({ schema_version: '1.0', extension: { id, name: id, version: '1.0.0', description: 'T066 旧环境样本' }, requires: { speckit_version: '==1.2.6' }, provides: { commands: modes.map(mode => ({ name: `speckit.modes.${mode}`, file: `skills/task-${mode}/SKILL.md`, description: '旧登记样本' })) }, hooks: officialHooks }))
  /**
   * 初始化失败或安装失败立即让夹具失败，不能冒充候选保护。
   */
  const installed = officialCall(item, ['extension', 'add', '--dev', input, '--force'])
  assert.equal(installed.status, 0, installed.stdout + installed.stderr)
}

/**
 * 保存官方产生的受影响目录快照，供当前测试的一次性来源核验。
 * @param {string} project 项目根。
 * @returns {Record<string, Record<string, string>>} 内存中的官方基线，不写持久安装状态。
 */
export function ownedBaseline(project) {
  /**
   * 仅选择明确受影响的扩展和模式生成目录。
   */
  const result = {}
  /**
   * 此清单不包括无关扩展，其保护由完整项目断言负责。
   */
  for (const id of ['modes', ...retiredHookIds, 'implementation-preparation', 'artifact-spec-analysis', 'artifact-project-description']) {
    /**
     * 不存在的目录不制造空登记。
     */
    const relative = `.specify/extensions/${id}`
    if (fs.existsSync(path.join(project, relative)))
      result[relative] = snapshot(path.join(project, relative))
  }
  /**
   * 生成根只记录官方 modes 入口。
   */
  for (const name of fs.readdirSync(path.join(project, '.agents/skills'))) {
    if (name.startsWith('speckit-modes-'))
      result[`.agents/skills/${name}`] = snapshot(path.join(project, '.agents/skills', name))
  }
  return result
}

/**
 * 创建真实官方旧环境的隔离副本，来源复制和官方安装分别报告。
 * @param {string} name 本次证据名称。
 * @param {'three'|'four'|'five'} variant 旧集合类型。
 * @returns {object} 测试拥有的夹具和候选参数。
 */
export function migrationFixture(name, variant = 'four') {
  if (!templates.has(variant)) {
    /**
     * 模板由官方离线 init 和 extension add 建立，不手写登记。
     */
    const template = createSandbox()
    /**
     * 初始化的原始结果独立于被测候选。
     */
    const initialized = officialCall(template, ['init', '--here', '--integration', 'codex', '--integration-options=--skills', '--script', 'sh', '--ignore-agent-tools', '--non-interactive'])
    assert.equal(initialized.status, 0, initialized.stdout + initialized.stderr)
    /**
     * 从清退前留存的测试输入构造旧环境，避免当前集合被迫保留退役项。
     */
    const legacy = JSON.parse(fs.readFileSync(new URL('../fixtures/legacy-registration-hooks.json', import.meta.url), 'utf8'))
    seedExtension(template, 'modes', legacySets[variant])
    /**
     * 六旧 hook 和既有结案扩展全部经官方安装。
     */
    for (const id of [...retiredHookIds, 'artifact-project-description'])
      seedExtension(template, id, [], legacy.hooks[id])
    seedExtension(template, 't066-unrelated', [], { after_plan: { command: 'keep-user-hook', optional: true, prompt: '用户扩展保持' } })
    fs.mkdirSync(path.join(template.project, 'history'), { recursive: true })
    fs.writeFileSync(path.join(template.project, 'history/old-report.md'), '历史产物与引用必须保留。\n')
    templates.set(variant, template)
  }
  /**
   * 每个场景复制自同一已由官方建立的模板。
   */
  const item = createSandbox()
  fs.cpSync(templates.get(variant).project, item.project, { recursive: true })
  fs.copyFileSync(path.join(templates.get(variant).root, 'official.jsonl'), path.join(item.root, 'bootstrap.jsonl'))
  /**
   * 当前来源按正式维护源完整复制，来源安装器不在本 Task 中重测。
   */
  for (const id of ['implementation-preparation', 'artifact-spec-analysis', 'artifact-project-description', 'task-increment']) {
    /**
     * Increment 沿已验证的非发现根布局，准备仍在正常根。
     */
    const target = path.join(item.project, id === 'task-increment' ? '.agents/skills-speckit-sources' : '.agents/skills', id)
    fs.cpSync(path.join(workflowRoot, id), target, { recursive: true })
  }
  fs.copyFileSync(path.join(workflowRoot, 'collection.config.json'), path.join(item.root, 'collection.config.json'))
  /**
   * 官方基线在任何故障注入之前取得，不由候选自行认可修改。
   */
  const baseline = ownedBaseline(item.project)
  fs.writeFileSync(path.join(item.root, 'initial-baseline.json'), JSON.stringify(baseline, null, 2))
  if (process.env.FOUNDRY_T066_RETAIN_DIR)
    fs.cpSync(item.project, path.join(item.root, 'initial-project'), { recursive: true, dereference: false })
  /**
   * 记录候选调用以核对零调用和停止边界。
   */
  const calls = []
  /**
   * 将过程和结果留在本次根中，清理只作用于测试拥有的副本。
   */
  function finish() {
    if (process.env.FOUNDRY_T066_RETAIN_DIR) {
      /**
       * 只保留项目、来源、官方日志及本例结果，不收集真实用户目录。
       */
      const destination = path.join(process.env.FOUNDRY_T066_RETAIN_DIR, name)
      fs.mkdirSync(destination, { recursive: true })
      fs.cpSync(item.project, path.join(destination, 'project'), { recursive: true, dereference: false })
      fs.cpSync(path.join(item.root, 'initial-project'), path.join(destination, 'initial-project'), { recursive: true, dereference: false })
      if (fs.existsSync(path.join(item.root, 'current-input')))
        fs.cpSync(path.join(item.root, 'current-input'), path.join(destination, 'current-input'), { recursive: true, dereference: false })
      /**
       * 每个已存在的证据文件按原字节保存。
       */
      for (const file of ['bootstrap.jsonl', 'official.jsonl', 'collection.config.json', 'before-case.json', 'initial-baseline.json']) {
        if (fs.existsSync(path.join(item.root, file)))
          fs.copyFileSync(path.join(item.root, file), path.join(destination, file))
      }
      fs.writeFileSync(path.join(destination, 'calls.json'), JSON.stringify(calls, null, 2))
      fs.writeFileSync(path.join(destination, 'baseline.json'), JSON.stringify(baseline, null, 2))
    }
    item.cleanup()
  }
  return { ...item, finish, calls, options: { project: item.project, sourceRoot: path.join(item.project, '.agents/skills'), incrementRoot: path.join(item.project, '.agents/skills-speckit-sources/task-increment'), collectionFile: path.join(item.root, 'collection.config.json'), stageRoot: path.join(item.root, 'current-input'), baseline, calls, invoke: args => officialCall(item, args) } }
}

after(() => {
  /**
   * 所有样本结束后仅清理本模块自己的官方模板。
   */
  for (const template of templates.values())
    template.cleanup()
})
