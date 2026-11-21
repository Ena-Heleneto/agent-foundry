import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

/**
 * 官方Codex当前JSONL输出中实际成功执行的命令，保留完整原始输出。
 * @param {string} encoded 本次真实或明确标记的验证器单元样本轨迹。
 * @returns {object[]} 已完成、退出0且输出字段完整的命令。
 */
export function successfulCommands(encoded) {
  /**
   * 每个非空行都必须是完整JSON，截断不能被当成通过。
   */
  const events = encoded.split('\n').filter(line => line.trim()).map(line => JSON.parse(line))
  assert.equal(events.some(event => event.type === 'error' || event.type === 'turn.failed'), false, 'Codex轨迹含真实错误或失败回合')
  assert.ok(events.some(event => event.type === 'turn.completed'), '缺少真实完成回合')
  return events.filter(event => event.type === 'item.completed' && event.item?.type === 'command_execution' && event.item.status === 'completed' && event.item.exit_code === 0).map((event) => {
    assert.equal(typeof event.item.command, 'string')
    assert.equal(typeof event.item.aggregated_output, 'string', '缺少本次已实测的aggregated_output字段')
    return event.item
  })
}

/**
 * 只接受本次校准观察到的简单shell包装或直接读取器调用。
 * @param {string} command Codex实际执行的命令。
 * @returns {string} 去除固定外层shell后的命令正文。
 */
function commandText(command) {
  /**
   * 不解析任意shell语法，无法可靠核对的形式留作证据不足。
   */
  const shell = command.match(/^\/(?:usr\/)?bin\/(?:ba|z)?sh -lc '([\s\S]*)'$/u)
  return (shell ? shell[1] : command).trim()
}

/**
 * 核对模型实际读取器输出已完整覆盖要求的已安装文件原字节。
 * @param {object[]} commands 真实成功命令轨迹。
 * @param {Map<string,Buffer>} expected 会话前核对的已安装原字节。
 * @param {string} readId 本次冻结读取器的随机逻辑调用标识。
 * @returns {Map<string,number[]>} 每个文件已实际观察的字节起点。
 */
export function assertInstalledReadCoverage(commands, expected, readId) {
  /**
   * 路径对应的已验证字节片段，不信任模型自填已读列表。
   */
  const pieces = new Map()
  /**
   * 逐项检查宿主实际成功命令，不从最终回答推断读取。
   */
  for (const command of commands) {
    /**
     * 命令须真实调用读取器，echo文件名或伪造JSON不构成读取。
     */
    const invocation = commandText(command.command).match(/^(?:python3?|\/\S+\/python3?) (?:-B )?(?:\.\/)?probe\/read-installed\.py ([\w./-]+) (\d+)$/u)
    if (!invocation)
      continue
    /**
     * 单次读取对应一个完整JSON片段，任何截断直接报错。
     */
    const frame = JSON.parse(command.aggregated_output.trim())
    assert.equal(frame.kind, 'installed-read')
    assert.equal(frame.readId, readId)
    assert.equal(frame.path, invocation[1])
    assert.equal(frame.offset, Number(invocation[2]))
    assert.ok(expected.has(frame.path), `读取不属于本次要求的安装文件：${frame.path}`)
    /**
     * 预期来自本次已安装文件，不来自模型最终回答或产品摘要函数。
     */
    const bytes = expected.get(frame.path)
    /**
     * JSON中的text恢复为原始UTF-8字节后独立核对范围和摘要。
     */
    const chunk = Buffer.from(frame.text, 'utf8')
    assert.ok(Number.isSafeInteger(frame.offset) && frame.offset >= 0)
    assert.ok(chunk.length > 0 && chunk.length <= 4096)
    assert.equal(frame.length, chunk.length)
    assert.equal(frame.total, bytes.length)
    assert.equal(frame.sha256, createHash('sha256').update(bytes).digest('hex'))
    assert.deepEqual(chunk, bytes.subarray(frame.offset, frame.offset + chunk.length), `读取内容或偏移不符：${frame.path}`)
    if (!pieces.has(frame.path))
      pieces.set(frame.path, new Map())
    assert.ok(!pieces.get(frame.path).has(frame.offset) || pieces.get(frame.path).get(frame.offset).equals(chunk), '重复读取返回异字节')
    pieces.get(frame.path).set(frame.offset, chunk)
  }
  /**
   * 分别验证每份要求内容，保留文件边界与字节范围。
   */
  for (const [relative, bytes] of expected) {
    /**
     * 所有要求文件均须在真实命令输出中出现，摘要本身不能替代正文。
     */
    const chunks = [...(pieces.get(relative) || [])].sort(([left], [right]) => left - right)
    /**
     * 连续偏移与总长度一起排除缺块、重叠及只读头尾。
     */
    let offset = 0
    /**
     * 按真实偏移验证当前片段连续覆盖的范围。
     */
    for (const [start, chunk] of chunks) {
      assert.equal(start, offset, `全文读取有缺块或重叠：${relative}`)
      offset += chunk.length
    }
    assert.equal(offset, bytes.length, `未完整读取已安装文件：${relative}`)
  }
  return new Map([...pieces].map(([relative, chunks]) => [relative, [...chunks.keys()].sort((left, right) => left - right)]))
}

/**
 * 核对Increment的可观察入口委派顺序，不把重复读片段冒认第二次规划。
 * @param {object[]} commands 真实成功的宿主命令。
 */
export function assertIncrementDelegation(commands) {
  /**
   * 只检查实际读取器命令，避免最终回答中的路径自报。
   */
  const reads = commands.map((command, index) => ({ command: commandText(command.command), index })).filter(item => /probe\/read-installed\.py/u.test(item.command))
  /**
   * 生成入口与源正文是两份不同文件，必须先入口后源。
   */
  const entries = reads.filter(item => item.command.includes('.agents/skills/speckit-modes-increment/SKILL.md '))
  /**
   * 多块源正文合并为一次完整逻辑读取，由全文覆盖另行检查。
   */
  const source = reads.filter(item => item.command.includes('.agents/skills/task-increment/SKILL.md '))
  assert.ok(entries.length > 0 && source.length > 0, '缺少真实入口到源技能的读取委派')
  assert.ok(Math.max(...entries.map(item => item.index)) < Math.min(...source.map(item => item.index)), '源技能开始后再次回调生成入口，无法证明单次委派')
  assert.equal(commands.some(command => /(?:^|[\s;&|])(?:\S*\/)?codex\s/u.test(commandText(command.command))), false, '源技能递归启动Codex')
}

/**
 * 返回项目内已核查的普通路径，逐组件拒绝链接和目录逃逸。
 * @param {string} root 本次自有项目根。
 * @param {string} relative 项目相对路径。
 * @returns {string} 已核对的绝对路径。
 */
export function projectPath(root, relative) {
  /**
   * 不允许绝对路径、控制字符或反斜线语义穿过边界。
   */
  const absolute = path.resolve(root, relative)
  assert.ok(typeof relative === 'string' && !path.isAbsolute(relative) && absolute.startsWith(`${root}${path.sep}`) && !relative.includes('\\'))
  /**
   * 从本次普通根开始逐项核验，不跟随任何已安装符号链接。
   */
  let current = root
  /**
   * 逐路径组件拒绝链接，不能只核验末端文件。
   */
  for (const component of path.relative(root, absolute).split(path.sep)) {
    current = path.join(current, component)
    assert.equal(fs.lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink(), false, `项目路径包含链接或缺失：${relative}`)
  }
  return absolute
}

/**
 * 只读取协调者预先创建的临时正式项目上下文，不自动准备工具或认证。
 * @param {string} contextPath 本次上下文JSON路径。
 * @returns {object} 已核对的项目、特性定位及执行参数。
 */
export function readHostContext(contextPath) {
  assert.ok(contextPath, 'not-run：缺少URGENT_HOST_CONTEXT，正式T086项目就绪后再执行宿主会话')
  /**
   * 上下文来自本次测试，不接受任意真实工作区作为写入目标。
   */
  const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'))
  /**
   * 物理位置须在当前系统临时根内且本身不是链接。
   */
  const root = fs.realpathSync(context.projectRoot)
  assert.equal(root, path.resolve(context.projectRoot))
  assert.ok(root.startsWith(`${fs.realpathSync(os.tmpdir())}${path.sep}`), '宿主项目必须是本次拥有的临时目录')
  /**
   * 显式拥有标记避免误用现有用户项目。
   */
  const owner = JSON.parse(fs.readFileSync(projectPath(root, 'probe/owner.json'), 'utf8'))
  assert.equal(owner.purpose, 'urgent-host-consumption')
  assert.equal(owner.ownerToken, context.ownerToken)
  assert.ok(typeof owner.ownerToken === 'string' && owner.ownerToken.length >= 24)
  /**
   * 特性定位必须对应本次已有材料，不能把作者指针带入自有项目。
   */
  const feature = JSON.parse(fs.readFileSync(projectPath(root, '.specify/feature.json'), 'utf8'))
  assert.equal(feature.feature_directory, context.featureDirectory)
  /**
   * 每份正式材料必须真实存在于本次特性目录。
   */
  for (const file of ['spec.md', 'plan.md', 'mvu.md', 'tasks.md'])
    assert.ok(fs.lstatSync(projectPath(root, `${context.featureDirectory}/${file}`)).isFile())
  assert.ok(fs.lstatSync(projectPath(root, '.specify/memory/constitution.md')).isFile())
  assert.ok(fs.lstatSync(projectPath(root, context.businessSentinel)).isFile())
  assert.ok(typeof context.specifyPython === 'string' && path.isAbsolute(context.specifyPython))
  assert.ok(Number.isInteger(context.caseTimeoutMs) && context.caseTimeoutMs >= 30000 && context.caseTimeoutMs <= 300000)
  return { ...context, projectRoot: root }
}

/**
 * 从真实项目登记经官方HookExecutor取得事件派发，不用手写映射冒充登记。
 * @param {object} context 本次自有项目及已备Specify Python。
 * @returns {object} 四个事件的实际派发数组。
 */
export function dispatchProjectHooks(context) {
  /**
   * 只读官方API，不在此处替宿主执行技能。
   */
  const script = 'import json,sys; from pathlib import Path; from specify_cli.extensions import HookExecutor; e=HookExecutor(Path(sys.argv[1])); print(json.dumps({name:[e.execute_hook(h) for h in e.get_hooks_for_event(name)] for name in ["after_tasks","before_implement","after_converge","after_increment"]}))'
  /**
   * 固定参数数组且禁用pycache，不继承shell展开。
   */
  const result = spawnSync(context.specifyPython, ['-B', '-c', script, context.projectRoot], { encoding: 'utf8', timeout: 30000 })
  assert.ifError(result.error)
  assert.equal(result.status, 0, '官方HookExecutor读取失败，实际宿主阶段not-run')
  return JSON.parse(result.stdout)
}

/**
 * 记录项目原始文件字节，排除Git元数据及本次允许追加的运行日志。
 * @param {string} root 本次自有项目根。
 * @returns {Map<string,string>} 文件相对路径及SHA-256。
 */
export function snapshotHostProject(root) {
  /**
   * 默认保护全部文件，再由具体探针列出必要的文档写入例外。
   */
  const files = new Map()
  /**
   * 普通目录递归不跟随链接，不将日志追加误作业务文件修改。
   * @param {string} directory 当前本次项目内目录。
   */
  function visit(directory) {
    /**
     * 遍历本次普通目录中的每个实际条目。
     */
    for (const name of fs.readdirSync(directory).sort()) {
      /**
       * 相对路径统一用于允许范围及前后差异核对。
       */
      const relative = path.relative(root, path.join(directory, name)).split(path.sep).join('/')
      if (relative === '.git' || relative.startsWith('.git/') || relative === 'probe/results' || relative.startsWith('probe/results/'))
        continue
      /**
       * 已安装内容和治理均须为本次普通文件，不能借链接读外部位置。
       */
      const absolute = projectPath(root, relative)
      if (fs.lstatSync(absolute).isDirectory())
        visit(absolute)
      else files.set(relative, createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'))
    }
  }
  visit(root)
  return files
}

/**
 * 仅允许当前探针约定的私有文档变化，业务哨兵和已装内容默认保护。
 * @param {Map<string,string>} before 会话前文件事实。
 * @param {Map<string,string>} after 会话后文件事实。
 * @param {string[]} allowedExact 可修改的精确文件路径。
 * @param {string[]} allowedPrefixes 可新增/修改的私有文档目录前缀。
 * @returns {string[]} 真实变化的路径。
 */
export function assertHostChanges(before, after, allowedExact = [], allowedPrefixes = []) {
  /**
   * 删除和新增同样进入差异，不能只扫描仍存在的文件。
   */
  const changed = [...new Set([...before.keys(), ...after.keys()])].filter(file => before.get(file) !== after.get(file)).sort()
  /**
   * 新增、删除和修改均须属于当前许可范围。
   */
  for (const file of changed)
    assert.ok(allowedExact.includes(file) || allowedPrefixes.some(prefix => file.startsWith(prefix)), `宿主修改超出本次范围：${file}`)
  return changed
}

/**
 * 在私有probe目录生成冻结的已安装正文分块读取器及真实执行计划。
 * @param {string} root 本次项目根。
 * @param {Map<string,Buffer>} expected 实际安装内容的原始字节。
 * @param {string} python 已备解释器路径，单元样本可用系统python3。
 * @returns {object} 本次读取标识及逐片段命令。
 */
export function prepareInstalledReader(root, expected, python = 'python3') {
  assert.match(python, /^(?:python3?|\/\S+\/python3?)$/u, '读取解释器须为已备安全路径')
  /**
   * 随机标识不承载身份或凭据，用于关联本次逻辑读取。
   */
  const readId = randomBytes(12).toString('hex')
  /**
   * 读取计划与预期摘要在会话前固定，不把正文传入模型prompt冒充读取。
   */
  const manifest = { readId, files: Object.fromEntries([...expected].map(([relative, bytes]) => [relative, { total: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }])) }
  fs.writeFileSync(path.join(root, 'probe/read-manifest.json'), JSON.stringify(manifest))
  fs.writeFileSync(path.join(root, 'probe/read-installed.py'), `import hashlib,json,sys\nfrom pathlib import Path\nroot=Path(__file__).resolve().parent.parent\nmanifest=json.loads((root/'probe/read-manifest.json').read_text())\nrelative=sys.argv[1]\noffset=int(sys.argv[2])\nassert relative in manifest['files']\nfile=root/relative\nassert file.resolve().is_relative_to(root) and not file.is_symlink()\ndata=file.read_bytes()\nassert hashlib.sha256(data).hexdigest()==manifest['files'][relative]['sha256']\nend=min(offset+2048,len(data))\nwhile end>offset:\n try:\n  text=data[offset:end].decode('utf-8')\n  break\n except UnicodeDecodeError:\n  end-=1\nassert end>offset\nprint(json.dumps({'kind':'installed-read','readId':manifest['readId'],'path':relative,'offset':offset,'length':end-offset,'total':len(data),'sha256':manifest['files'][relative]['sha256'],'text':text},ensure_ascii=False))\n`)
  /**
   * 命令计划以UTF-8边界推进，与读取器返回的实际片段长度一致。
   */
  const commands = []
  /**
   * 分别验证每份要求内容，保留文件边界与字节范围。
   */
  for (const [relative, bytes] of expected) {
    /**
     * 起点按当前完整字符边界推进，避免每块重复字节。
     */
    let offset = 0
    while (offset < bytes.length) {
      /**
       * 只在UTF-8字符开头切块，单次输出远低于通常工具截断上限。
       */
      let end = Math.min(offset + 2048, bytes.length)
      while (end < bytes.length && (bytes[end] & 0xC0) === 0x80)
        end--
      commands.push(`${python} -B probe/read-installed.py ${relative} ${offset}`)
      offset = end
    }
  }
  return { readId, commands }
}

/**
 * 仅在预备上下文已提供后运行一次真实Codex会话，保留全部私有日志。
 * @param {object} context 本次自有项目和时限。
 * @param {string} caseId 当前唯一探针名称。
 * @param {string} prompt 实际派发及明确测试目标，经stdin传入。
 * @returns {object} 实际命令轨迹、最终诊断与日志目录。
 */
export function executeHostProbe(context, caseId, prompt) {
  /**
   * 运行日志只写项目内本次允许的probe/results，正式payload外。
   */
  const resultRoot = path.join(context.projectRoot, 'probe/results', caseId)
  fs.mkdirSync(resultRoot, { recursive: true })
  fs.rmSync(path.join(resultRoot, 'final.json'), { force: true })
  /**
   * 输出schema只描述诊断，不提供可被冒认的通过布尔字段。
   */
  const schema = { type: 'object', properties: { caseId: { type: 'string' }, outcome: { type: 'string' }, reason: { type: 'string' }, artifacts: { type: 'array', items: { type: 'string' } } }, required: ['caseId', 'outcome', 'reason', 'artifacts'], additionalProperties: false }
  fs.writeFileSync(path.join(resultRoot, 'output.schema.json'), JSON.stringify(schema))
  fs.writeFileSync(path.join(resultRoot, 'prompt.txt'), prompt)
  /**
   * 认证与model沿当前进程，绝不复制凭据或从空HOME启动。
   */
  const args = ['-a', 'never', 'exec', '--json', '--ephemeral', '--ignore-user-config', '--sandbox', 'workspace-write', '-C', context.projectRoot, '--output-last-message', path.join(resultRoot, 'final.json'), '--output-schema', path.join(resultRoot, 'output.schema.json'), '-']
  /**
   * 不经shell展开参数；超时和输出过大均真实失败，不重复盲试。
   */
  const result = spawnSync(context.codexCli || 'codex', args, { input: prompt, encoding: 'utf8', timeout: context.caseTimeoutMs, killSignal: 'SIGKILL', maxBuffer: 8 * 1024 * 1024, env: process.env })
  fs.writeFileSync(path.join(resultRoot, 'events.jsonl'), result.stdout || '')
  fs.writeFileSync(path.join(resultRoot, 'stderr.txt'), result.stderr || '')
  fs.writeFileSync(path.join(resultRoot, 'process.json'), JSON.stringify({ status: result.status, signal: result.signal, errorCode: result.error?.code || null }))
  assert.ifError(result.error)
  assert.equal(result.status, 0, `真实Codex会话失败；私有日志：${resultRoot}`)
  assert.equal(result.signal, null)
  /**
   * 负向文件探测可正常返回1，原始失败事实保留而不误报保护行为失败。
   */
  const failedCommands = result.stdout.split('\n').filter(line => line.trim()).map(line => JSON.parse(line)).filter(event => event.type === 'item.completed' && event.item?.type === 'command_execution' && event.item.exit_code !== 0)
  fs.writeFileSync(path.join(resultRoot, 'failed-commands.json'), JSON.stringify(failedCommands))
  return { commands: successfulCommands(result.stdout), final: JSON.parse(fs.readFileSync(path.join(resultRoot, 'final.json'), 'utf8')), resultRoot }
}
