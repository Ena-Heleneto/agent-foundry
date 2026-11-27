import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { parse } from 'yaml'

/**
 * 公开版本及源码只能使用固定身份，不能把分支或参数注入ref。
 */
const semver = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u

/**
 * 条件不满足即停止，不进行候选修补或降级。
 * @param {unknown} condition 当前必要条件。
 * @param {string} message 可操作的失败原因。
 */
function requireValue(condition, message) {
  if (!condition)
    throw new Error(message)
}

/**
 * 对原始字节求摘要，不作文本转换。
 * @param {Buffer|string} bytes 原始字节。
 * @returns {string} 小写SHA-256。
 */
function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * 控制字符不允许进入路径、仓库标识或无秘密的授权依据。
 * @param {string} value 待检查文本。
 * @returns {boolean} 是否包含ASCII控制字符。
 */
function hasControl(value) {
  return [...value].some(character => character.codePointAt(0) < 32 || character.codePointAt(0) === 127)
}

/**
 * 清单路径必须可移植且保持在候选根内。
 * @param {unknown} relative 未信任的相对路径。
 */
function relativePath(relative) {
  requireValue(typeof relative === 'string' && relative.length > 0 && !/[\\:]/u.test(relative) && !hasControl(relative) && relative.split('/').every(part => part && part !== '.' && part !== '..'), `候选路径非法：${String(relative)}`)
}

/**
 * 独立读取整个候选，拒绝链接、特殊文件、目录大小写冲突。
 * @param {string} root 普通候选目录。
 * @returns {Map<string,Buffer>} 精确文件全集。
 */
function readPayload(root) {
  requireValue(typeof root === 'string' && path.isAbsolute(root), 'candidateRoot必须为绝对目录')
  requireValue(fs.lstatSync(root).isDirectory() && fs.realpathSync(root) === path.resolve(root), '候选根及父路径不能为链接')
  /**
   * 原始字节留在内存，后续Git对象不再执行或改写源文件。
   */
  const files = new Map()
  /**
   * 目录和文件共同检测跨平台大小写碰撞。
   */
  const folded = new Set()
  /**
   * 遍历先lstat再读盘，不跟随任何链接。
   * @param {string} directory 当前候选内普通目录。
   */
  function visit(directory) {
    for (const name of fs.readdirSync(directory).sort()) {
      /**
       * 绝对路径只用于本地读盘，不进入公开声明。
       */
      const absolute = path.join(directory, name)
      /**
       * 公共路径统一采用正斜线。
       */
      const relative = path.relative(root, absolute).split(path.sep).join('/')
      relativePath(relative)
      requireValue(!folded.has(relative.toLowerCase()), `候选路径大小写冲突：${relative}`)
      folded.add(relative.toLowerCase())
      /**
       * 链接即使指向候选内同字节文件也必须拒绝。
       */
      const entry = fs.lstatSync(absolute)
      requireValue(!entry.isSymbolicLink() && (entry.isDirectory() || entry.isFile()), `候选不允许链接或特殊文件：${relative}`)
      if (entry.isDirectory())
        visit(absolute)
      else files.set(relative, fs.readFileSync(absolute))
    }
  }
  visit(root)
  return files
}

/**
 * 精确检查字符串数组并拒绝重复条目。
 * @param {unknown} value 未信任数组。
 * @param {string} label 失败字段。
 * @returns {string[]} 已验证的数组。
 */
function strings(value, label) {
  requireValue(Array.isArray(value) && value.every(item => typeof item === 'string') && new Set(value).size === value.length, `清单数组非法：${label}`)
  return value
}

/**
 * 独立发布校验沿用正式九项身份；测试与构建模型核对，不在发布时编译TS。
 */
const approvedSkills = {
  coding: ['business-node-delivery', 'document-changed-symbols'],
  frontend: ['nuxt-ui-styling', 'vue-reactivity'],
  workflow: ['bug-report', 'artifact-project-description', 'artifact-spec-analysis', 'implementation-preparation', 'task-increment'],
}

/**
 * 检查声明文件的范围、唯一性、实际字节和精确payload全集。
 * @param {Map<string,Buffer>} contents 实际读盘文件。
 * @param {object} release 已解析清单。
 * @returns {Map<string,object>} 逐路径已核验声明。
 */
function inspectDeclaredFiles(contents, release) {
  requireValue(Array.isArray(release.files) && release.files.length > 0, '候选files缺失')
  /**
   * 每个摘要由原始字节验证，不信任授权参数代替完整性。
   */
  const declared = new Map()
  /**
   * 每份声明只允许认领一份真实候选文件。
   */
  for (const file of release.files) {
    relativePath(file.path)
    requireValue(file.path !== 'release.json' && !declared.has(file.path), '候选files自引用或重复')
    requireValue(['README.md', 'LICENSE'].includes(file.path) || file.path.startsWith('skills/') || file.path.startsWith('script/'), `候选包含不允许的公开路径：${file.path}`)
    requireValue(Number.isSafeInteger(file.bytes) && file.bytes >= 0 && /^[a-f0-9]{64}$/u.test(file.sha256), `候选文件摘要非法：${file.path}`)
    /**
     * 文件缺失和实际字节变化均在任何远端写入前停止。
     */
    const bytes = contents.get(file.path)
    requireValue(bytes && bytes.length === file.bytes && sha256(bytes) === file.sha256, `候选文件缺失或摘要不符：${file.path}`)
    declared.set(file.path, file)
  }
  requireValue(contents.size === declared.size + 1 && [...contents.keys()].every(file => file === 'release.json' || declared.has(file)), '候选payload与files加release.json不完全相等')
  return declared
}

/**
 * 核对单技能真实身份、完整正文/附件及identity逐项来源。
 * @param {object} skill 当前清单技能。
 * @param {object} release 已解析清单。
 * @param {Map<string,Buffer>} contents 实际文件全集。
 * @param {Map<string,object>} declared 已核验文件声明。
 * @param {Set<string>} names 已观察到的唯一技能名称。
 * @param {Set<string>} skillFiles 已被具体技能认领的文件。
 */
function inspectSkill(skill, release, contents, declared, names, skillFiles) {
  requireValue(skill && typeof skill.name === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(skill.name) && !names.has(skill.name), '技能身份重复或非法')
  names.add(skill.name)
  requireValue(['coding', 'frontend', 'workflow'].includes(skill.category) && skill.directory === `skills/${skill.category}/${skill.name}`, `技能目录非法：${skill.name}`)
  requireValue(approvedSkills[skill.category].includes(skill.name), `候选包含未获准公开技能：${skill.name}`)
  /**
   * sourceFiles逐项与实际技能全集对照。
   */
  const actual = [...contents.keys()].filter(file => file.startsWith(`${skill.directory}/`)).sort()
  requireValue(JSON.stringify([...strings(skill.sourceFiles, 'sourceFiles')].sort()) === JSON.stringify(actual) && actual.includes(`${skill.directory}/SKILL.md`), `技能正文附件不完整：${skill.name}`)
  /**
   * 记录每份实际技能文件的归属。
   */
  for (const file of actual)
    skillFiles.add(file)
  /**
   * 发布声明身份必须与真实frontmatter对应。
   */
  const document = contents.get(`${skill.directory}/SKILL.md`).toString('utf8').match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/u)
  requireValue(document && document[2].trim(), `技能正文缺失：${skill.name}`)
  /**
   * 同源元数据不可由目录名称替代。
   */
  const metadata = parse(document[1])
  requireValue(metadata && metadata.name === skill.name && typeof metadata.description === 'string' && metadata.description.trim(), `技能frontmatter不匹配：${skill.name}`)
  strings(skill.requiresSkills, 'requiresSkills')
  strings(skill.projectPrerequisites, 'projectPrerequisites')
  strings(skill.mountMappingIds, 'mountMappingIds')
  requireValue(skill.installedFilesByProjection && Object.keys(skill.installedFilesByProjection).length === 1 && skill.installedFilesByProjection.identity, '仅支持identity安装投影')
  /**
   * 实际安装相对路径由技能目录边界独立求出。
   */
  const relativeFiles = actual.map(file => file.slice(skill.directory.length + 1)).sort()
  requireValue(JSON.stringify([...strings(skill.installedFilesByProjection.identity, 'installedFilesByProjection.identity')].sort()) === JSON.stringify(relativeFiles), `identity安装文件遗漏：${skill.name}`)
  /**
   * 投影来源必须引用同一技能原始字节。
   */
  const projected = release.projections.identity[skill.name]
  requireValue(Array.isArray(projected) && projected.length === actual.length, `identity投影遗漏：${skill.name}`)
  requireValue(new Set(projected.map(file => file.path)).size === projected.length, 'identity路径重复')
  /**
   * 逐投影核对相对路径与其唯一声明源。
   */
  for (const file of projected) {
    relativePath(file.path)
    /**
     * sourcePath必须恰为identity原始路径，不能从其他技能借文件。
     */
    const source = declared.get(`${skill.directory}/${file.path}`)
    requireValue(source && file.sourcePath === source.path && file.bytes === source.bytes && file.sha256 === source.sha256, `identity来源或字节不符：${skill.name}`)
  }
}

/**
 * 核对技能集合、依赖关系及没有归属的额外公开文件。
 * @param {Map<string,Buffer>} contents 真实文件全集。
 * @param {object} release 已解析清单。
 * @param {Map<string,object>} declared 已核验声明。
 */
function inspectSkills(contents, release, declared) {
  requireValue(Array.isArray(release.skills) && release.skills.length > 0 && release.projections && Object.keys(release.projections).length === 1 && release.projections.identity, '候选skills或identity投影缺失')
  /**
   * 唯一名称集合同时限定所有投影和依赖。
   */
  const names = new Set()
  /**
   * 所有skills路径必须被具体公开技能认领。
   */
  const skillFiles = new Set()
  /**
   * 每个技能复用同一实际文件与声明事实进行核验。
   */
  for (const skill of release.skills)
    inspectSkill(skill, release, contents, declared, names, skillFiles)
  requireValue(Object.keys(release.projections.identity).length === names.size && Object.keys(release.projections.identity).every(name => names.has(name)), 'identity存在未声明技能')
  requireValue([...contents.keys()].filter(file => file.startsWith('skills/')).every(file => skillFiles.has(file)), '存在额外公开技能或未归属文件')
  /**
   * 已声明依赖必须同在本次公开集合，不自动补装。
   */
  for (const skill of release.skills)
    requireValue(skill.requiresSkills.every(name => names.has(name)), '技能依赖未公开')
}

/**
 * 适配器声明只能引用本次已核验的交付字节。
 * @param {object} release 已解析清单。
 * @param {Map<string,object>} declared 已核验声明。
 */
function inspectAdapters(release, declared) {
  requireValue(Array.isArray(release.adapters) && release.adapters.some(file => file.path === 'script/install-skills/read-agents.mjs'), 'adapters缺少在线读取器')
  /**
   * 每项适配器必须能追溯到本次同字节文件。
   */
  for (const adapter of release.adapters) {
    /**
     * 适配器不能借用未声明文件或另一版本的摘要。
     */
    const source = declared.get(adapter.path)
    requireValue(source && source.bytes === adapter.bytes && source.sha256 === adapter.sha256, 'adapter未交付或摘要错误')
  }
}

/**
 * 发布时独立复核现成候选；不编译TS、不运行构建或payload脚本。
 * @param {object} request 已冻结的发布请求。
 * @returns {object} 原始文件、清单和稳定摘要。
 */
function inspectCandidate(request) {
  /**
   * 实际文件全集不能从清单声称的路径反推。
   */
  const contents = readPayload(request.candidateRoot)
  requireValue(contents.has('release.json') && contents.has('README.md') && contents.has('LICENSE'), '候选缺少release.json、README或LICENSE')
  requireValue(contents.get('README.md').length > 0 && contents.get('LICENSE').length > 0, 'README和LICENSE不能是空文件')
  /**
   * 直接解析冻结字节，catalogDigest不重新序列化。
   */
  const release = JSON.parse(contents.get('release.json').toString('utf8'))
  requireValue(release && typeof release === 'object' && release.schemaVersion === 1 && release.development === undefined, '候选必须为schemaVersion=1且不含development标记')
  requireValue(semver.test(release.version) && release.version === request.version, '候选version与请求不一致')
  requireValue(/^[a-f0-9]{40}$/u.test(release.sourceRevision) && release.sourceRevision === request.sourceRevision, '候选sourceRevision与请求不一致')
  requireValue(release.tools && release.tools.skills === 'latest' && release.tools.specify === '1.2.6' && release.tools.node === '>=22.20.0' && release.tools.bash === '>=3.2' && release.tools.powershell === '>=7.4' && semver.test(release.tools.npm), '候选tools字段缺失或不兼容')
  /**
   * 分层核对保持原文件、技能和适配器校验顺序。
   */
  const declared = inspectDeclaredFiles(contents, release)
  inspectSkills(contents, release, declared)
  inspectAdapters(release, declared)
  /**
   * 固定键顺序、UTF-8路径字节排序，包含清单自身。
   */
  const payloadFiles = [...contents].map(([file, bytes]) => ({ path: file, bytes: bytes.length, sha256: sha256(bytes) })).sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
  /**
   * 候选授权必须绑定读盘重算的实际摘要。
   */
  const candidateDigest = sha256(JSON.stringify(payloadFiles))
  requireValue(candidateDigest === request.candidateDigest, 'candidateDigest与实际候选不一致')
  return { contents, payloadFiles, catalogDigest: sha256(contents.get('release.json')), candidateDigest }
}

/**
 * 在私有Git目录实际执行命令，禁止shell展开及读取用户写凭据配置。
 * @param {string} cwd 本次拥有的Git工作目录。
 * @param {string[]} args 原始参数数组。
 * @param {Buffer|string} [input] hash-object需要的原始文件字节。
 * @returns {Promise<object>} 实际退出码与原始输出。
 */
function runGit(cwd, args, input) {
  return new Promise((resolve, reject) => {
    /**
     * 作者固定且不含用户身份，Git配置与hooks限定本次私有环境。
     */
    const child = spawn('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgSign=false', '-c', 'tag.gpgSign=false', ...args], { cwd, env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_NAME: 'Skills release', GIT_AUTHOR_EMAIL: 'release@example.invalid', GIT_COMMITTER_NAME: 'Skills release', GIT_COMMITTER_EMAIL: 'release@example.invalid' }, stdio: ['pipe', 'pipe', 'pipe'] })
    /**
     * 原始blob可能包含二进制字节。
     */
    const output = []
    /**
     * 诊断只在失败时进入内部错误，不记录凭据。
     */
    const errors = []
    child.stdout.on('data', chunk => output.push(chunk))
    child.stderr.on('data', chunk => errors.push(chunk))
    child.once('error', reject)
    child.once('close', (status, signal) => resolve({ status, signal, stdout: Buffer.concat(output), stderr: Buffer.concat(errors).toString('utf8') }))
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}

/**
 * 要求Git成功，但不把stderr、凭据或连接串写入公开报告。
 * @param {string} cwd 私有工作目录。
 * @param {string[]} args Git参数。
 * @param {Buffer|string} [input] 标准输入字节。
 * @returns {Promise<Buffer>} 原始标准输出。
 */
async function checkedGit(cwd, args, input) {
  /**
   * 网络与产品冲突保持明确失败，不能回退旧来源。
   */
  const result = await runGit(cwd, args, input)
  requireValue(result.status === 0 && result.signal === null, `Git操作失败：${args[0]}`)
  return result.stdout
}

/**
 * 远端只读取精确ref，不使用本地猜测SHA。
 * @param {string} cwd 私有Git目录。
 * @param {string} repository 明确授权仓库。
 * @param {string} ref 唯一完整tag ref。
 * @returns {Promise<string|null>} 真实远端对象SHA或明确不存在。
 */
async function remoteObject(cwd, repository, ref) {
  /**
   * --exit-code的2只表示精确ref不存在，其余错误必须停止。
   */
  const result = await runGit(cwd, ['ls-remote', '--refs', '--exit-code', '--', repository, ref])
  if (result.status === 2 && !result.signal)
    return null
  requireValue(result.status === 0 && result.signal === null, '无法回读远端精确tag')
  /**
   * 不接受多个匹配或其他对象格式。
   */
  const lines = result.stdout.toString('utf8').trim().split('\n')
  requireValue(lines.length === 1 && lines[0].endsWith(`\t${ref}`) && /^[a-f0-9]{40}\t/u.test(lines[0]), '远端tag响应不唯一或无效')
  return lines[0].split('\t')[0]
}

/**
 * 从实际ref取回对象，核验无父commit及精确payload字节全集。
 * @param {string} cwd 私有Git目录。
 * @param {string} repository 明确授权仓库。
 * @param {string} ref 精确tag ref。
 * @param {string} object 本轮从远端读到的SHA。
 * @param {Map<string,Buffer>} contents 已独立核验的精确payload。
 */
async function verifyRemote(cwd, repository, ref, object, contents) {
  await checkedGit(cwd, ['fetch', '--no-tags', '--', repository, ref])
  requireValue((await checkedGit(cwd, ['cat-file', '-t', object])).toString('utf8').trim() === 'commit', '已有tag不是commit对象')
  /**
   * 读取原始commit头，不能被浅克隆的遍历边界隐藏父提交。
   */
  const commit = (await checkedGit(cwd, ['cat-file', '-p', object])).toString('utf8').split('\n\n')[0]
  requireValue(!/^parent /mu.test(commit), '已有tag带父历史，拒绝复用')
  /**
   * -z阻止特殊路径被Git转义或混淆。
   */
  const entries = (await checkedGit(cwd, ['ls-tree', '-rz', '--full-tree', object])).toString('utf8').split('\0').filter(Boolean)
  requireValue(entries.length === contents.size, '远端文件全集与候选不一致')
  /**
   * 每个普通blob都与内存中的原始候选字节核对。
   */
  const seen = new Set()
  for (const entry of entries) {
    /**
     * mode/type/object和路径必须按Git真实记录拆分。
     */
    const match = entry.match(/^(?:100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/u)
    requireValue(match && !seen.has(match[2]) && contents.has(match[2]), '远端包含额外路径、链接或非普通文件')
    seen.add(match[2])
    requireValue((await checkedGit(cwd, ['cat-file', 'blob', match[1]])).equals(contents.get(match[2])), `远端文件字节不符：${match[2]}`)
  }
  requireValue(await remoteObject(cwd, repository, ref) === object, '核验期间远端tag发生变化')
}

/**
 * 失败时只标记当前未完成阶段，保留实际成功的发布事实。
 * @param {object} report 当前阶段事实。
 * @param {Error} error 当前实际错误。
 */
function recordPublicationFailure(report, error) {
  if (report.prepare.status !== 'success')
    report.prepare = { status: 'failed', reasonCode: 'candidate-or-authorization-rejected' }
  else if (report.publish.status !== 'success')
    report.publish = { status: 'failed', reasonCode: 'publication-or-existing-tag-conflict' }
  else report.remoteVerify = { status: 'failed', reasonCode: 'remote-verification-failed' }
  error.report = report
}

/**
 * 将已审查候选发布为单个新无父tag；真实远端须显式绑定具体授权。
 * 不安装、不构建、不执行payload，也不修改候选或覆盖已有tag。
 * @param {object} request candidateRoot、repository、version、sourceRevision、candidateDigest和authorization。
 * @returns {Promise<object>} 分阶段事实与实际远端发布身份。
 * @throws {Error} 验证或发布失败；error.report保存已实际发生的阶段事实。
 */
export async function publishCandidate(request) {
  /**
   * 凭据不得混入仓库字符串或授权依据。
   */
  const report = { prepare: { status: 'not-run', reasonCode: 'not-started' }, publish: { status: 'not-run', reasonCode: 'prepare-required' }, remoteVerify: { status: 'not-run', reasonCode: 'publication-required' }, consumption: { status: 'not-run', reasonCode: 'separate-consumption-required' } }
  /**
   * 临时目录只在本函数创建后才归本函数清理。
   */
  let temporary
  try {
    requireValue(request && typeof request === 'object' && typeof request.repository === 'string' && request.repository.trim() && !request.repository.startsWith('-') && !hasControl(request.repository), '必须指定明确发布仓库')
    requireValue(path.isAbsolute(request.repository) || /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/u.test(request.repository) || /^git@github\.com:[\w.-]+\/[\w.-]+$/u.test(request.repository), '发布仓库须为明确GitHub仓库或内部绝对bare路径')
    requireValue(typeof request.version === 'string' && semver.test(request.version) && /^[a-f0-9]{40}$/u.test(request.sourceRevision) && /^[a-f0-9]{64}$/u.test(request.candidateDigest), '发布身份缺失或非法')
    /**
     * 请求和授权四个身份字段须逐项相等，不能只认可一个布尔确认。
     */
    const authorization = request.authorization
    requireValue(authorization && ['repository', 'version', 'sourceRevision', 'candidateDigest'].every(key => authorization[key] === request[key]) && typeof authorization.reference === 'string' && authorization.reference.trim() && !hasControl(authorization.reference), '缺少绑定具体仓库、版本、源码和候选的明确授权')
    /**
     * 任何远端读写前先核验完整现成候选。
     */
    const candidate = inspectCandidate(request)
    Object.assign(report, { repository: request.repository, tag: `skills-v${request.version}`, version: request.version, sourceRevision: request.sourceRevision, catalogDigest: candidate.catalogDigest, candidateDigest: candidate.candidateDigest, payloadFiles: candidate.payloadFiles, authorizationRef: authorization.reference, authorizedTarget: { repository: request.repository, version: request.version, sourceRevision: request.sourceRevision, candidateDigest: request.candidateDigest } })
    report.prepare = { status: 'success', reasonCode: 'exact-candidate-verified' }
    temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'urgent-publish-'))
    fs.chmodSync(temporary, 0o700)
    await checkedGit(temporary, ['init', '--quiet'])
    /**
     * 只操作一个明确完整ref，不推送任何源码分支或其他标签。
     */
    const ref = `refs/tags/${report.tag}`
    /**
     * 已有ref先核验，无父同字节才可复用。
     */
    const existing = await remoteObject(temporary, request.repository, ref)
    if (existing) {
      await verifyRemote(temporary, request.repository, ref, existing, candidate.contents)
      Object.assign(report, { publishedRevision: existing, reused: true, publish: { status: 'success', reasonCode: 'existing-identical-parentless-tag' }, remoteVerify: { status: 'success', reasonCode: 'exact-remote-payload-verified' } })
      return report
    }
    for (const [relative, bytes] of candidate.contents) {
      /**
       * hash-object接原始标准输入，不创建或执行payload工作树。
       */
      const blob = (await checkedGit(temporary, ['hash-object', '-w', '--stdin'], bytes)).toString('utf8').trim()
      await checkedGit(temporary, ['update-index', '--add', '--cacheinfo', '100644', blob, relative])
    }
    /**
     * write-tree只从显式索引产生树，没有父源码历史。
     */
    const tree = (await checkedGit(temporary, ['write-tree'])).toString('utf8').trim()
    /**
     * 不传任何-p，因此公开提交为无父根提交。
     */
    const commit = (await checkedGit(temporary, ['commit-tree', tree], `Skills ${request.version}\n`)).toString('utf8').trim()
    await checkedGit(temporary, ['update-ref', ref, commit])
    /**
     * 无force、无删除、无额外ref；并发裁决由真实远端创建完成。
     */
    const pushed = await runGit(temporary, ['push', '--porcelain', '--', request.repository, `${ref}:${ref}`])
    if (pushed.status === 0 && !pushed.signal)
      report.publish = { status: 'success', reasonCode: 'push-acknowledged-awaiting-readback' }
    /**
     * 无论push是否响应成功，都先读回真实ref确认副作用。
     */
    const actual = await remoteObject(temporary, request.repository, ref)
    requireValue(actual, '推送后远端精确tag不存在')
    report.publishedRevision = actual
    report.reused = actual !== commit
    if (actual === commit)
      report.publish = { status: 'success', reasonCode: pushed.status === 0 ? 'new-tag-created' : 'confirmed-after-push-error' }
    await verifyRemote(temporary, request.repository, ref, actual, candidate.contents)
    report.publish = { status: 'success', reasonCode: pushed.status === 0 ? 'new-tag-created' : actual === commit ? 'confirmed-after-push-error' : 'concurrent-identical-tag-reused' }
    report.remoteVerify = { status: 'success', reasonCode: 'exact-remote-payload-verified' }
    return report
  }
  catch (error) {
    recordPublicationFailure(report, error)
    throw error
  }
  finally {
    if (temporary)
      fs.rmSync(temporary, { recursive: true, force: true })
  }
}
