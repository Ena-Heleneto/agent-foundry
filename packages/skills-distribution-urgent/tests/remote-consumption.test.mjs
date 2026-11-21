import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { assertHostChanges, assertIncrementDelegation, assertInstalledReadCoverage, dispatchProjectHooks, executeHostProbe, prepareInstalledReader, projectPath, readHostContext, snapshotHostProject, successfulCommands } from './helpers/host-probe.mjs'
import { createUrgentSandbox, loadProduct, packageRoot, snapshotTree } from './helpers/urgent-sandbox.mjs'

/**
 * 构造明确标记为验证器单元数据的轨迹，不冒充真实宿主运行。
 * @param {object[]} commands 用于验证解析器的命令条目。
 * @returns {string} 独立JSONL单元样本。
 */
function traceFixture(commands) {
  return [...commands.map(item => ({ type: 'item.completed', item })), { type: 'turn.completed' }].map(event => JSON.stringify(event)).join('\n')
}

test('轨迹验证器保留负向探测边界，拒绝错误回合和截断JSONL', () => {
  assert.deepEqual(successfulCommands(traceFixture([{ type: 'command_execution', command: 'test -f missing', status: 'failed', exit_code: 1, aggregated_output: '' }])), [])
  assert.throws(() => successfulCommands('{"type":"turn.failed"}\n'))
  assert.throws(() => successfulCommands('{"type":"turn.completed"'))
})

test('全文验证器真实读取UTF-8分块，拒绝遗漏、伪造命令及错误正文', () => {
  /**
   * 此处只运行确定性的本地读取器，不调用模型或正式安装来源。
   */
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'urgent-host-grader-'))
  try {
    fs.mkdirSync(path.join(root, '.agents/skills/probe'), { recursive: true })
    fs.mkdirSync(path.join(root, 'probe'))
    /**
     * 多字节UTF-8跨块边界，避免只有ASCII的样本遗漏乱码风险。
     */
    const bytes = Buffer.from('只属于验证器的多字节正文。\n'.repeat(230))
    /**
     * 样本身份明确不是正式技能发布或安装结果。
     */
    const relative = '.agents/skills/probe/SKILL.md'
    fs.writeFileSync(path.join(root, relative), bytes)
    /**
     * 真实读取器与独立轨迹判定器共享文件事实，不共享校验实现。
     */
    const expected = new Map([[relative, bytes]])
    /**
     * 生成的每个命令都在自有目录实际执行。
     */
    const reader = prepareInstalledReader(root, expected)
    /**
     * 单元样本只包装实际读取器stdout，不作为Codex会话证据。
     */
    const commands = reader.commands.map((command) => {
      /**
       * 参数只取生成的简单读取器计划，不经shell处理。
       */
      const result = spawnSync('python3', command.split(' ').slice(1), { cwd: root, encoding: 'utf8', timeout: 10000 })
      assert.ifError(result.error)
      assert.equal(result.status, 0, result.stderr)
      return { type: 'command_execution', command: `/bin/bash -lc '${command}'`, status: 'completed', exit_code: 0, aggregated_output: result.stdout }
    })
    assert.ok(commands.length > 1)
    assertInstalledReadCoverage(successfulCommands(traceFixture(commands)), expected, reader.readId)
    assert.throws(() => assertInstalledReadCoverage(commands.slice(1), expected, reader.readId), /缺块|未完整/u)
    assert.throws(() => assertInstalledReadCoverage(commands.map(command => ({ ...command, command: `echo ${command.command}` })), expected, reader.readId), /未完整/u)
    assert.throws(() => assertInstalledReadCoverage(commands.map((command, index) => index ? command : { ...command, aggregated_output: command.aggregated_output.replace('只属于', '假冒的') }), expected, reader.readId))
  }
  finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('文件保护验证器同时捕获业务修改、新增越界文件和删除', () => {
  /**
   * 只有明确的私有分析目录可被当前样本写入。
   */
  const before = new Map([['business.txt', 'original'], ['spec/tasks.md', 'tasks']])
  assert.deepEqual(assertHostChanges(before, new Map([...before, ['spec/analysis/report.md', 'new']]), [], ['spec/analysis/']), ['spec/analysis/report.md'])
  assert.throws(() => assertHostChanges(before, new Map([['business.txt', 'changed'], ['spec/tasks.md', 'tasks']])))
  assert.throws(() => assertHostChanges(before, new Map([['spec/tasks.md', 'tasks']])))
  assert.throws(() => assertHostChanges(before, new Map([...before, ['unexpected.txt', 'new']])))
})

test('Increment委派验证器拒绝源开始后回调入口及嵌套Codex', () => {
  /**
   * 这些仅是判定器单元样本，不作为真实技能执行证据。
   */
  const entry = { command: '/bin/bash -lc \'python3 -B probe/read-installed.py .agents/skills/speckit-modes-increment/SKILL.md 0\'' }
  /**
   * 同一源的多块读取不是多次规划。
   */
  const source = { command: '/bin/bash -lc \'python3 -B probe/read-installed.py .agents/skills/task-increment/SKILL.md 0\'' }
  assertIncrementDelegation([entry, source, source])
  assert.throws(() => assertIncrementDelegation([entry, source, entry]))
  assert.throws(() => assertIncrementDelegation([entry, source, { command: '/bin/bash -lc \'codex exec again\'' }]))
})

/**
 * 独立核对真实官方安装及普通唯一入口的已有证据，先于模型会话。
 * @param {object} context 本次自有项目及T086交接上下文。
 * @param {object} candidate 当前严格候选身份。
 */
function assertInstalledEvidence(context, candidate) {
  /**
   * 证据由真实安装器进程保存，不能由模型会话临时自报。
   */
  const official = JSON.parse(fs.readFileSync(projectPath(context.projectRoot, context.officialInstallEvidence), 'utf8'))
  assert.equal(official.exitCode, 0)
  assert.equal(official.candidateDigest, candidate.candidateDigest)
  assert.ok(official.command === 'npx' || path.basename(official.command) === 'npx')
  assert.ok(official.args.includes(`skills@${official.upstream.version}`))
  assert.ok(official.args.includes('--copy') && official.args.includes('--agent') && official.args.includes('codex'))
  assert.match(official.upstream.integrity, /^sha(?:256|384|512)-/u)
  /**
   * 挂载必须经过正常链成功，loading由本项真实会话补证。
   */
  const mount = JSON.parse(fs.readFileSync(projectPath(context.projectRoot, context.mountEvidence), 'utf8'))
  /**
   * 正常链每个必要阶段分别核对，不以总状态代替。
   */
  for (const name of ['installation', 'integrity', 'hooks', 'commands'])
    assert.equal(mount.stages[name].status, 'success', `缺少T086正常阶段成功：${name}`)
}

/**
 * 从实际候选投影核对正式安装完整文件及字节，返回模型应读取的内容。
 * @param {object} context 本次自有项目。
 * @param {object} release 已严格核验的同版清单。
 * @returns {Map<string,Buffer>} 项目相对已装文件与原字节。
 */
function installedFiles(context, release) {
  /**
   * 全集动态来自最终候选，不硬编码本轮12份文件数。
   */
  const expected = new Map()
  /**
   * 按最终正式清单逐技能核对实际安装全集。
   */
  for (const skill of release.skills) {
    /**
     * Codex项目级实际安装位置，由真实官方规则及T082核对。
     */
    const directory = `.agents/skills/${skill.name}`
    /**
     * 正文和附件均核对精确集合，额外附件同样失败。
     */
    const projections = release.projections.identity[skill.name]
    assert.deepEqual(Object.keys(snapshotTree(projectPath(context.projectRoot, directory))).filter(file => fs.lstatSync(projectPath(context.projectRoot, `${directory}/${file}`)).isFile()).sort(), projections.map(file => file.path).sort())
    /**
     * 正文和每份必要附件分别核对实际原字节。
     */
    for (const file of projections) {
      /**
       * 独立字节和摘要核对，不能只检查安装器退出码。
       */
      const relative = `${directory}/${file.path}`
      /**
       * 读取必须来自实际安装根，不能沿sourcePath直接读取源码包。
       */
      const bytes = fs.readFileSync(projectPath(context.projectRoot, relative))
      assert.equal(bytes.length, file.bytes)
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256)
      expected.set(relative, bytes)
    }
  }
  return expected
}

/**
 * 保留正式Task身份及checkbox，不从模型报告推断任务完成。
 * @param {string} encoded 实际tasks正文。
 * @returns {Map<string,string>} 原Task ID与工程状态。
 */
function taskStates(encoded) {
  /**
   * 自有正式任务沿项目原生轻量checkbox格式，不创建第二套工程状态。
   */
  const entries = [...encoded.matchAll(/^- \[([ xX])\] (T\d+)\b/gmu)].map(match => [match[2], match[1].toLowerCase()])
  assert.ok(entries.length > 0, '自有宿主项目缺少既存正式Task')
  assert.equal(new Set(entries.map(([id]) => id)).size, entries.length, '正式Task重复')
  return new Map(entries)
}

/**
 * 选取当前行为所需正文；第一探针另覆盖全部正式正文与附件。
 * @param {string} caseId 当前探针。
 * @param {Map<string,Buffer>} all 全部实际安装内容。
 * @param {object} context 当前项目事实。
 * @returns {Map<string,Buffer>} 当前会话必须实际读取的内容。
 */
function requiredReads(caseId, all, context) {
  if (caseId === 'after_tasks')
    return all
  /**
   * 单个正式技能只从本次安装集合取正文，不查作者源路径。
   */
  const names = caseId === 'before_implement' ? ['implementation-preparation'] : caseId === 'after_converge' ? ['artifact-project-description'] : ['task-increment', 'artifact-spec-analysis']
  /**
   * 所需技能目录下全部附件均随正文读入。
   */
  const selected = new Map([...all].filter(([relative]) => names.some(name => relative.startsWith(`.agents/skills/${name}/`))))
  if (caseId === 'increment') {
    /**
     * 正式入口由官方扩展生成，先读取入口再加载同版源技能。
     */
    const entry = '.agents/skills/speckit-modes-increment/SKILL.md'
    return new Map([[entry, fs.readFileSync(projectPath(context.projectRoot, entry))], ...selected])
  }
  return selected
}

/**
 * 实际文档及前后树证明行为，不以最终schema中的outcome自称判通过。
 * @param {string} caseId 当前探针。
 * @param {object} context 本次真实项目。
 * @param {Map<string,string>} before 会话前文件事实。
 * @param {Map<string,string>} originalStates 原Task ID和状态。
 * @param {object[]} commands 实际宿主命令。
 */
function assertProbeArtifacts(caseId, context, before, originalStates, commands) {
  /**
   * 写入范围按当前真实行为职责区分。
   */
  const prefix = `${context.featureDirectory}/`
  /**
   * 只允许分析/规划的私有文档，其余源、治理和哨兵均保持。
   */
  const allowed = caseId === 'increment' ? ['plan.md', 'mvu.md', 'tasks.md'].map(file => `${prefix}${file}`) : []
  /**
   * 两个应停止的hook没有文档写入豁免。
   */
  const directories = ['after_tasks', 'increment'].includes(caseId) ? [`${prefix}analysis/`, `${prefix}diagrams/`] : []
  /**
   * 输出日志目录由快照函数固定排除，其他变化必须逐项获准。
   */
  const changed = assertHostChanges(before, snapshotHostProject(context.projectRoot), allowed, directories)
  assert.deepEqual(taskStates(fs.readFileSync(projectPath(context.projectRoot, `${prefix}tasks.md`), 'utf8')), originalStates)
  if (caseId === 'after_converge')
    assert.equal(fs.existsSync(path.join(context.projectRoot, prefix, 'descriptions/project-description.md')), false, '未结案不得生成完成稿')
  if (['after_tasks', 'increment'].includes(caseId)) {
    /**
     * 成果须来自真实落盘文档并可定位原正式Task。
     */
    const analysis = fs.readFileSync(projectPath(context.projectRoot, `${prefix}analysis/spec-analysis/README.md`), 'utf8')
    assert.ok(analysis.trim())
    /**
     * 每个既存正式Task都必须可从分析结果定位。
     */
    for (const id of originalStates.keys())
      assert.ok(analysis.includes(id), `分析未关联既有Task：${id}`)
  }
  if (caseId === 'increment') {
    assert.ok(changed.some(file => allowed.includes(file)), 'Increment没有产生明确测试目标要求的实际规划变化')
    assertIncrementDelegation(commands)
    /**
     * 两个局部结果须实际落入闭环文档，plan保留唯一文件级导航。
     */
    const mvu = fs.readFileSync(projectPath(context.projectRoot, `${prefix}mvu.md`), 'utf8')
    assert.ok([...mvu.matchAll(/闭环结果/gu)].length >= 2, '没有形成两项可观察局部闭环')
    /**
     * 规划文件不新增逐闭环索引或锚点形式的mvu导航。
     */
    const plan = fs.readFileSync(projectPath(context.projectRoot, `${prefix}plan.md`), 'utf8')
    assert.equal([...plan.matchAll(/\]\((?:\.\/)?mvu\.md\)/gu)].length, 1)
    assert.doesNotMatch(plan, /\]\((?:\.\/)?mvu\.md#/u)
  }
}

/**
 * 按真实派发信息生成测试上下文；正文只通过实际读取工具取得。
 * @param {string} caseId 当前探针名。
 * @param {object} context 本次已有正式任务项目。
 * @param {object|null} dispatch 官方HookExecutor实际派发结果。
 * @param {string[]} reads 逐UTF-8块真实读取命令。
 * @returns {string} stdin传入的明确测试目标。
 */
function probePrompt(caseId, context, dispatch, reads) {
  /**
   * 两个保护分支明确给出真实缺条件，不伪造用户认可或结案。
   */
  const target = caseId === 'before_implement'
    ? '本次Task没有经真实讨论认可的实施方案。执行准备并正确说明缺项后停止，不编写实施方案来冒充认可，不实施业务。'
    : caseId === 'after_converge'
      ? '实际Task仍未验收、没有结案依据。执行所派发技能，按真实条件正确停止，不生成完成稿或虚构用户批准。'
      : caseId === 'increment'
        ? '通过官方已生成speckit-modes-increment入口只规划一次：将原离线文档核对与结论整理安排为可独立观察的局部闭环，先核对后整理，保存私有plan/mvu/tasks并显式复用artifact-spec-analysis。原Task ID/checkbox/验收不变，不新增业务源码、不自动实施、不递归调用入口。'
        : '执行官方派发的artifact-spec-analysis，读取同级mvu及当前spec/plan/tasks，创建或刷新同一analysis/spec-analysis/README.md，关联原Task并读回。不改变工程checkbox。'
  return [`这是已明确授权的私有宿主验收，caseId=${caseId}。目标Spec=${context.featureDirectory}。`, '所有已安装正文和附件必须通过下面的真实shell读取器命令完整读取，每行命令独立执行，不拼接、不使用head/tail或摘要替代，不改读取器/manifest/已安装技能/治理/业务哨兵。第一探针读取其他技能仅核对完整交付，不自动执行其业务。', reads.join('\n'), dispatch ? `官方HookExecutor实际派发原信息：${JSON.stringify(dispatch)}` : '当前入口是已由官方生成的speckit-modes-increment，先按读取计划读取入口，再完整消费源task-increment。', target, '先读取.specify/memory/constitution.md及真实目标材料，按其实际约定处理；不得读取作者仓库源码、父目录、auth或用户配置，不使用网络，不生成或模拟用户反馈。', '最终结构化输出只给caseId、实际outcome、reason、artifacts；before_implement和after_converge因实际缺条件停止时outcome使用stopped，reason写明实际缺条件。程序将独立检查命令全文输出、前后字节与真实文档，不能用自称通过代替证据。'].join('\n\n')
}

test('T087真实正式宿主消费：三事件和Increment的实际全文、行为与保护', async () => {
  /**
   * 未提供T086已就绪的自有上下文时真实失败，不自动skip或启动模型。
   */
  const context = readHostContext(process.env.URGENT_HOST_CONTEXT)
  /**
   * 候选根可以在内部迁后复验时切换，正式公开入口不受影响。
   */
  const candidateRoot = path.resolve(process.env.URGENT_CANDIDATE_ROOT || path.join(packageRoot, 'dist'))
  /**
   * 验证模块编译仅在测试准备阶段，Codex不从此处加载技能正文。
   */
  const sandbox = createUrgentSandbox()
  try {
    /**
     * 当前实际候选严格核验后才能接宿主。
     */
    const verifier = await loadProduct(sandbox, 'build/distribution/verify.ts')
    /**
     * 请求身份必须来自协调者T086真实交接，不自动信任当前任意dist。
     */
    const candidate = verifier.verifyCandidate(candidateRoot, { version: context.version, sourceRevision: context.sourceRevision })
    assert.equal(candidate.candidateDigest, context.candidateDigest)
    /**
     * 仅在精确当前候选上枚举正式内容。
     */
    const release = JSON.parse(fs.readFileSync(path.join(candidateRoot, 'release.json'), 'utf8'))
    assertInstalledEvidence(context, candidate)
    /**
     * 全文必须从真实项目安装根读取；该表也作为前后完整性依据。
     */
    const installed = installedFiles(context, release)
    /**
     * 所有实际派发结果先保存，不能由模型会话生成自报派发。
     */
    const dispatched = dispatchProjectHooks(context)
    assert.deepEqual(dispatched.after_increment, [])
    /**
     * 核对三个事件各自的实际正式技能，不混作一个成功位。
     */
    for (const [event, name] of [['after_tasks', 'artifact-spec-analysis'], ['before_implement', 'implementation-preparation'], ['after_converge', 'artifact-project-description']])
      assert.deepEqual(dispatched[event].map(item => item.command), [name])
    fs.mkdirSync(path.join(context.projectRoot, 'probe/results'), { recursive: true })
    fs.writeFileSync(path.join(context.projectRoot, 'probe/results/dispatch.json'), JSON.stringify(dispatched, null, 2))
    /**
     * 正式Task必须仍有未验收项，两个保护分支不能靠虚假完成满足条件。
     */
    const originalStates = taskStates(fs.readFileSync(projectPath(context.projectRoot, `${context.featureDirectory}/tasks.md`), 'utf8'))
    assert.ok([...originalStates.values()].includes(' '))
    /**
     * 四种职责依序使用独立会话和实际证据，任何失败停止后续。
     */
    for (const caseId of ['after_tasks', 'before_implement', 'after_converge', 'increment']) {
      /**
       * 每个实际会话拥有明确输入与独立读取标识。
       */
      const expected = requiredReads(caseId, installed, context)
      /**
       * 冻结读取器后才采集本次受保护文件基线。
       */
      const reader = prepareInstalledReader(context.projectRoot, expected, context.specifyPython)
      /**
       * 业务哨兵、安装内容和治理全部进入该基线。
       */
      const before = snapshotHostProject(context.projectRoot)
      /**
       * 正式实际派发信息和本次私有规划目标一起进入stdin，不带源码正文。
       */
      const result = executeHostProbe(context, caseId, probePrompt(caseId, context, dispatched[caseId]?.[0] || null, reader.commands))
      assertInstalledReadCoverage(result.commands, expected, reader.readId)
      assertProbeArtifacts(caseId, context, before, originalStates, result.commands)
      assert.equal(result.final.caseId, caseId, '最终诊断不属于本次探针')
      if (['before_implement', 'after_converge'].includes(caseId)) {
        assert.equal(result.final.outcome, 'stopped', '缺条件的hook必须明确说明停止')
        assert.ok(result.final.reason.trim(), '正确停止仍须说明实际缺条件')
      }
    }
  }
  finally { sandbox.cleanup() }
})
