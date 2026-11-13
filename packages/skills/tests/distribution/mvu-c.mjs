import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test, { after, before } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createSandbox, probeRuntime } from './sandbox.mjs'

/**
 * 仅在准备测试材料时读取包源码；被测脚本从独立副本运行。
 */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))
/**
 * 官方工具必须由调用方准备固定版本，不隐式获取 latest。
 */
const officialPackage = process.env.FOUNDRY_SKILLS_PACKAGE
/**
 * 允许用同一实验验证构建交付的独立副本。
 */
const scriptRoot = process.env.FOUNDRY_MVU_C_SCRIPT_DIR || path.join(packageRoot, 'script')
/**
 * 两个平台入口使用同一文件核验与阶段报告断言。
 */
const shell = process.env.FOUNDRY_MVU_C_SHELL || 'bash'
/**
 * 五项指令的选择必须来自本次请求，不能从历史补齐。
 */
const modes = ['task-tutor', 'task-pair', 'task-review', 'task-explore', 'task-guide']
/**
 * 最小发布夹具使用真实技能正文与附件，覆盖 workflow 和 frontend。
 */
const sources = [...modes.map(name => ['workflow', name]), ['workflow', 'artifact-business-flow'], ['frontend', 'vue-reactivity']]
/**
 * 官方安装只执行于此独立项目，后续用例复制实际安装结果并注入故障。
 */
const baseline = createSandbox()
/**
 * 独立导出根和脚本副本分离，避免从开发仓库取得运行依赖。
 */
const releaseRoot = path.join(baseline.root, 'release')
/**
 * 手动执行第二步时使用的独立公共工具目录。
 */
const toolsRoot = path.join(baseline.root, 'tools')
/**
 * 实际安装与核验动作的摘要，供验收记录引用。
 */
const observations = []

/**
 * 计算原始字节摘要，不复用被测脚本生成期望值。
 * @param {string | Uint8Array} bytes 文件原始内容。
 * @returns {string} SHA-256 十六进制值。
 */
function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * 快照全部普通文件，链接不作为完整附件接受。
 * @param {string} directory 快照目录。
 * @returns {Record<string, string>} 相对路径到内容摘要的映射。
 */
function snapshot(directory) {
  /**
   * 不存在目录等价于没有安装文件。
   */
  const files = {}
  if (!fs.existsSync(directory))
    return files
  /**
   * 递归读取实际文件，避免只检查 SKILL.md。
   */
  for (const relative of fs.readdirSync(directory, { recursive: true }).sort()) {
    /**
     * 当前文件绝对路径。
     */
    const absolute = path.join(directory, relative)
    /**
     * lstat 保留符号链接本身的事实。
     */
    const stat = fs.lstatSync(absolute)
    if (stat.isSymbolicLink())
      files[relative] = `link:${fs.readlinkSync(absolute)}`
    else if (stat.isFile())
      files[relative] = digest(fs.readFileSync(absolute))
  }
  return files
}

/**
 * 执行真实进程；超时、沙箱拒绝和信号必须作为环境失败报告。
 * @param {string} executable 可执行文件。
 * @param {string[]} args 不经 shell 拼接的参数。
 * @param {object} sandbox 独立消费环境。
 * @returns {import('node:child_process').SpawnSyncReturns<string>} 实际结果。
 */
function run(executable, args, sandbox) {
  /**
   * 禁用上游遥测与交互，Git 搜索限定测试自有目录。
   */
  const result = spawnSync(executable, args, {
    cwd: sandbox.project,
    env: { ...sandbox.env, CI: '1', DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1', GIT_CEILING_DIRECTORIES: sandbox.root },
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024,
  })
  assert.ifError(result.error)
  assert.equal(result.signal, null, result.stderr)
  return result
}

/**
 * 使用官方固定版本安装，逐字节核对实际路径和附件。
 * @param {string[]} names 本次官方技能选择。
 * @param {boolean} global 是否安装到测试用户全局根。
 */
function officialInstall(names, global = false) {
  /**
   * CLI 的真实 bin 与 npx 解析结果相同，无自有安装器参与。
   */
  const result = run(process.execPath, [path.join(officialPackage, 'bin/cli.mjs'), 'add', releaseRoot, '--skill', ...names, '--agent', 'codex', '--copy', '--yes', ...(global ? ['--global'] : [])], baseline)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  /**
   * 固定 Codex 实际安装位置由独立断言检查。
   */
  const root = path.join(global ? baseline.userHome : baseline.project, '.agents/skills')
  /**
   * 只比较本次所选真实技能的完整文件全集。
   */
  for (const name of names) {
    /**
     * 夹具公开目录中该技能的分类。
     */
    const category = sources.find(item => item[1] === name)[0]
    assert.deepEqual(snapshot(path.join(root, name)), snapshot(path.join(releaseRoot, 'skills', category, name)))
  }
  observations.push({ action: 'official-install', names, scope: global ? 'global' : 'project', status: result.status })
}

before(() => {
  assert.equal(shell === 'bash' || shell === 'pwsh', true, '仅支持 bash/pwsh 实验')
  assert.ok(officialPackage, '必须设置 FOUNDRY_SKILLS_PACKAGE 为 skills@1.7.4 npm 包目录')
  assert.equal(JSON.parse(fs.readFileSync(path.join(officialPackage, 'package.json'), 'utf8')).version, '1.7.4')
  /**
   * 自建夹具不能被来源参数伪装成真实公开或用户提供的发布材料。
   */
  const sourceArgs = process.argv.slice(2)
  assert.ok(sourceArgs.length === 0 || (sourceArgs.length === 2 && sourceArgs[0] === '--source' && sourceArgs[1] === 'local'), 'MVU-C 只接受自建本地夹具，不验收 remote 或指定发布根')
  fs.mkdirSync(releaseRoot)
  /**
   * 实验清单只声明实际存在的文件，不冒充正式发布构建。
   */
  const release = { schemaVersion: 1, version: '0.1.0', sourceRevision: '1'.repeat(40), files: [], skills: [] }
  /**
   * 每份技能直接复制完整源码；没有改写正文或拼造示例技能。
   */
  for (const [category, name] of sources) {
    /**
     * 最小发布根中对应的相对技能目录。
     */
    const directory = `skills/${category}/${name}`
    fs.cpSync(path.join(packageRoot, 'src/skills', category, name), path.join(releaseRoot, directory), { recursive: true })
    release.skills.push({ name, category, directory, requiresSkills: [], sourceFiles: Object.keys(snapshot(path.join(releaseRoot, directory))).map(file => `${directory}/${file}`) })
  }
  if (fs.existsSync(path.join(scriptRoot, 'mount-entry')))
    fs.cpSync(path.join(scriptRoot, 'mount-entry'), path.join(releaseRoot, 'script/mount-entry'), { recursive: true })
  /**
   * 原始字节长度和摘要独立生成，供运行入口核验。
   */
  for (const relative of fs.readdirSync(releaseRoot, { recursive: true }).sort()) {
    /**
     * 当前待声明文件。
     */
    const absolute = path.join(releaseRoot, relative)
    if (fs.statSync(absolute).isFile()) {
      /**
       * 实际内容保持二进制安全。
       */
      const bytes = fs.readFileSync(absolute)
      release.files.push({ path: relative, bytes: bytes.length, sha256: digest(bytes) })
    }
  }
  fs.writeFileSync(path.join(releaseRoot, 'release.json'), `${JSON.stringify(release)}\n`)
  fs.mkdirSync(toolsRoot)
  if (fs.existsSync(path.join(releaseRoot, 'script')))
    fs.cpSync(path.join(releaseRoot, 'script'), path.join(toolsRoot, 'script'), { recursive: true })
  officialInstall(['task-explore'])
  assert.deepEqual(fs.readdirSync(path.join(baseline.project, '.agents/skills')), ['task-explore'])
  officialInstall(sources.map(item => item[1]).filter(name => name !== 'task-explore'))
  officialInstall(['task-explore'], true)
})

after(() => {
  process.stdout.write(`${JSON.stringify({ platform: process.platform, node: process.version, shell, observations, pwsh: probeRuntime('pwsh'), unverified: ['真实公开来源', '完整 agent/投影矩阵', '原生挂载及模式实际使用'] })}\n`)
  baseline.cleanup()
})

/**
 * 每个故障用例独占实际安装副本，不改变基准或用户真实项目。
 * @param {(sandbox: object) => void} body 用例步骤。
 */
async function scenario(body) {
  /**
   * 完全隔离本次操作、HOME 和所有目标目录。
   */
  const sandbox = createSandbox()
  try {
    fs.cpSync(path.join(baseline.project, '.agents'), path.join(sandbox.project, '.agents'), { recursive: true })
    fs.cpSync(path.join(baseline.userHome, '.agents'), path.join(sandbox.userHome, '.agents'), { recursive: true })
    fs.cpSync(releaseRoot, path.join(sandbox.root, 'release'), { recursive: true })
    fs.cpSync(toolsRoot, path.join(sandbox.root, 'tools'), { recursive: true })
    fs.mkdirSync(path.join(sandbox.project, '.specify'))
    await body(sandbox)
  }
  finally {
    sandbox.cleanup()
  }
}

/**
 * 手动启动独立平台入口，断言消费项目所有原文件未变。
 * @param {object} sandbox 独立项目。
 * @param {string[]} names 本次显式选择。
 * @param {string[]} extra 额外参数。
 * @param {boolean} global 本次 scope。
 * @param {string} installedRoot 显式传入的实际根，用于验证错误位置。
 * @returns {{status: number, report: object}} 退出码与结构化报告。
 */
function verify(sandbox, names = ['task-explore'], extra = [], global = false, installedRoot = path.join(global ? sandbox.userHome : sandbox.project, '.agents/skills')) {
  /**
   * 第二步之前的真实文件摘要。
   */
  const beforeFiles = snapshot(sandbox.project)
  /**
   * 本轮独立公共材料中对应平台的入口。
   */
  const entry = path.join(sandbox.root, 'tools/script/mount-entry', `mount-entry.${shell === 'bash' ? 'sh' : 'ps1'}`)
  /**
   * 项目/global 均使用官方实际路径，不接受调用方任意指向历史目录。
   */
  const args = [entry, '--source-dir', path.join(sandbox.root, 'release'), '--version', '0.1.0', '--agent', 'codex', '--installed-root', installedRoot, ...names.flatMap(name => ['--skill', name]), ...(global ? ['--global'] : []), ...extra]
  /**
   * 真实 shell 直接运行，不经过 Node 转发层。
   */
  const result = run(shell, shell === 'pwsh' ? ['-NoProfile', '-File', ...args] : args, sandbox)
  assert.notEqual(result.status, 127, `尚无可运行公共入口：${result.stderr}`)
  assert.deepEqual(snapshot(sandbox.project), beforeFiles, '前置核验不得修改项目、技能或原生配置')
  /**
   * stdout 必须可供消费方判断每项结果。
   */
  const report = JSON.parse(result.stdout)
  observations.push({ names, global, exitCode: result.status, overall: report.overall, verifiedSkills: report.verifiedSkills, reasonCode: report.reasonCode })
  return { status: result.status, report }
}

test('手动第二步核验完整附件且 no-mount 不要求项目，历史模式不扩选', () => scenario((sandbox) => {
  /**
   * 全局安装保留真实用户路径，但请求关闭挂载。
   */
  const result = verify(sandbox, ['task-explore'], ['--no-mount'], true)
  assert.equal(result.status, 0)
  assert.equal(result.report.stages.installation.status, 'success')
  assert.deepEqual(result.report.verifiedSkills, ['task-explore'])
  assert.equal(result.report.stages.commands.status, 'skipped')
  assert.equal(result.report.resolvedRelease.catalogDigest, digest(fs.readFileSync(path.join(sandbox.root, 'release/release.json'))))
}))

test('单选 Explore 保留安装成功并列出其余四项缺少的显式选择，不补装不注册', () => scenario((sandbox) => {
  /**
   * 历史目录已经含五项，仍不能用于补齐本次选择。
   */
  const result = verify(sandbox)
  assert.equal(result.status, 2)
  assert.equal(result.report.overall, 'partial')
  assert.equal(result.report.stages.installation.status, 'success')
  assert.equal(result.report.stages.commands.status, 'failed')
  assert.deepEqual(result.report.stages.commands.missingSkills.sort(), ['task-guide', 'task-pair', 'task-review', 'task-tutor'])
  assert.deepEqual(result.report.verifiedSkills, ['task-explore'])
}))

test('本次只选 frontend 时跳过挂载，不扫描历史 workflow', () => scenario((sandbox) => {
  /**
   * 前端技能没有映射，不因历史目录里的模式而触发挂载。
   */
  const result = verify(sandbox, ['vue-reactivity'])
  assert.equal(result.status, 0)
  assert.deepEqual(result.report.verifiedSkills, ['vue-reactivity'])
  assert.equal(result.report.stages.hooks.status, 'skipped')
  assert.equal(result.report.stages.commands.status, 'skipped')
}))

test('global workflow 缺项目保留已验证安装并给出补传项目的续接条件', () => scenario((sandbox) => {
  /**
   * 不把当前 cwd 误当成全局安装的挂载授权项目。
   */
  const result = verify(sandbox, ['task-explore'], [], true)
  assert.equal(result.status, 2)
  assert.equal(result.report.overall, 'partial')
  assert.equal(result.report.stages.installation.status, 'success')
  assert.equal(result.report.stages.hooks.status, 'failed')
  assert.equal(result.report.stages.commands.status, 'not-run')
  assert.ok(result.report.retry.some(item => item.includes('--project')))
}))

test('非 Spec Kit 项目明确跳过原生挂载', () => scenario((sandbox) => {
  fs.rmdirSync(path.join(sandbox.project, '.specify'))
  /**
   * 不自动初始化消费者项目。
   */
  const result = verify(sandbox)
  assert.equal(result.status, 0)
  assert.equal(result.report.stages.hooks.status, 'skipped')
  assert.equal(result.report.stages.commands.status, 'skipped')
}))

test('五项齐备也不得把 T006 尚未接通的原生挂载报告为成功', () => scenario((sandbox) => {
  /**
   * 核验全部五项后保留安装成功，原生阶段明确 not-run。
   */
  const result = verify(sandbox, modes)
  assert.equal(result.status, 2)
  assert.equal(result.report.stages.installation.status, 'success')
  assert.equal(result.report.stages.hooks.status, 'not-run')
  assert.equal(result.report.stages.commands.status, 'not-run')
  assert.equal(result.report.reasonCode, 'unsupported')
}))

/**
 * 故障修改独立安装副本；预期不能依赖上游安装退出码。
 */
const corruptions = [
  ['缺少 SKILL.md', sandbox => fs.unlinkSync(path.join(sandbox.project, '.agents/skills/task-explore/SKILL.md'))],
  ['正文被改写', sandbox => fs.appendFileSync(path.join(sandbox.project, '.agents/skills/task-explore/SKILL.md'), '\n用户编辑\n')],
  ['额外附件', sandbox => fs.writeFileSync(path.join(sandbox.project, '.agents/skills/task-explore/unexpected.txt'), '额外内容')],
  ['缺少 hook 配置附件', sandbox => fs.unlinkSync(path.join(sandbox.project, '.agents/skills/artifact-business-flow/speckit-hooks.json'))],
  ['附件被替换为链接', (sandbox) => {
    fs.unlinkSync(path.join(sandbox.project, '.agents/skills/artifact-business-flow/speckit-hooks.json'))
    fs.symlinkSync(path.join(sandbox.root, 'release/skills/workflow/artifact-business-flow/speckit-hooks.json'), path.join(sandbox.project, '.agents/skills/artifact-business-flow/speckit-hooks.json'))
  }],
]

/**
 * 每个故障都验证没有将损坏项升级为核验成功。
 */
for (const [title, corrupt] of corruptions) {
  test(`拒绝${title}，即便前一步安装确实退出 0`, () => scenario((sandbox) => {
    corrupt(sandbox)
    /**
     * 同时请求有效项与故障项，完整项事实仍应保留。
     */
    const names = title.includes('hook') || title.includes('替换') ? ['vue-reactivity', 'artifact-business-flow'] : ['vue-reactivity', 'task-explore']
    /**
     * 核验结果只允许完整技能进入集合。
     */
    const result = verify(sandbox, names, ['--no-mount'])
    assert.notEqual(result.status, 0)
    assert.deepEqual(result.report.verifiedSkills, ['vue-reactivity'])
    assert.equal(result.report.overall, 'partial')
    assert.equal(result.report.stages.installation.status, 'failed')
    assert.equal(result.report.stages.commands.status, 'not-run')
  }))
}

test('公共入口与本次 release 摘要不一致时拒绝继续核验', () => scenario((sandbox) => {
  fs.appendFileSync(path.join(sandbox.root, 'tools/script/mount-entry', `mount-entry.${shell === 'bash' ? 'sh' : 'ps1'}`), '\n# 错版脚本\n')
  /**
   * 公共材料错误不能冒认安装已核验。
   */
  const result = verify(sandbox, ['task-explore'], ['--no-mount'])
  assert.notEqual(result.status, 0)
  assert.deepEqual(result.report.verifiedSkills, [])
  assert.equal(result.report.reasonCode, 'integrity')
}))

test('版本不匹配和未知选择在读取安装内容前失败', () => scenario((sandbox) => {
  /**
   * 独立材料声称另一版本，目标技能不能因此被当成成功。
   */
  const manifest = path.join(sandbox.root, 'release/release.json')
  /**
   * 只改实验清单，不改任何技能。
   */
  const release = JSON.parse(fs.readFileSync(manifest, 'utf8'))
  release.version = '0.2.0'
  fs.writeFileSync(manifest, JSON.stringify(release))
  /**
   * 请求仍固定 0.1.0，必须拒绝版本混用。
   */
  const result = verify(sandbox, ['task-explore'], ['--no-mount'])
  assert.equal(result.status, 2)
  assert.deepEqual(result.report.verifiedSkills, [])
}))

test('未知选择不能因历史存在同名目录而通过', () => scenario((sandbox) => {
  /**
   * 明确错误名称，入口不能回退为全部安装目录。
   */
  const result = verify(sandbox, ['unknown-skill'], ['--no-mount'])
  assert.equal(result.status, 2)
  assert.deepEqual(result.report.verifiedSkills, [])
}))

test('installed-root 错位置即使文件完整也拒绝，不能扫描猜测正确目录', () => scenario((sandbox) => {
  /**
   * 与官方目录字节一致的错误路径不能冒充实际安装根。
   */
  const wrong = path.join(sandbox.root, 'wrong')
  fs.cpSync(path.join(sandbox.project, '.agents/skills'), wrong, { recursive: true })
  /**
   * 错误路径不能通过完整内容来绕过 agent/scope 约定。
   */
  const result = verify(sandbox, ['task-explore'], ['--no-mount'], false, wrong)
  assert.equal(result.status, 2)
  assert.deepEqual(result.report.verifiedSkills, [])
}))

test('安装技能目录链接即使指向完整同版内容也拒绝', () => scenario((sandbox) => {
  /**
   * 保留完整真实目录，但不允许用链接扩大第二步核验边界。
   */
  const installed = path.join(sandbox.project, '.agents/skills/task-explore')
  /**
   * 链接目标仍在实验自有目录内。
   */
  const linked = path.join(sandbox.root, 'linked-skill')
  fs.renameSync(installed, linked)
  fs.symlinkSync(linked, installed, 'dir')
  /**
   * 字节相同不能抵消路径身份错误。
   */
  const result = verify(sandbox, ['task-explore'], ['--no-mount'])
  assert.notEqual(result.status, 0)
  assert.deepEqual(result.report.verifiedSkills, [])
}))

test('缺少同版公共平台材料时不回退执行其他目录脚本', () => scenario((sandbox) => {
  fs.unlinkSync(path.join(sandbox.root, 'tools/script/mount-entry', `mount-entry.${shell === 'bash' ? 'ps1' : 'sh'}`))
  /**
   * 正在运行的平台仍可启动，但公共材料整体不完整。
   */
  const result = verify(sandbox, ['task-explore'], ['--no-mount'])
  assert.equal(result.status, 2)
  assert.equal(result.report.reasonCode, 'integrity')
  assert.deepEqual(result.report.verifiedSkills, [])
}))

test('重复参数、缺值和项目级其他 project 在文件核验前拒绝', () => scenario((sandbox) => {
  /**
   * 本次项目级请求不得用另一个项目或重复参数改变目标。
   */
  for (const extra of [['--version', '0.1.0'], ['--project'], ['--project', sandbox.root]]) {
    /**
     * 每个无效输入均以静态前提错误返回。
     */
    const result = verify(sandbox, ['task-explore'], extra)
    assert.equal(result.status, 2)
    assert.deepEqual(result.report.verifiedSkills, [])
  }
}))

test('global 显式提供项目后进入选择核验，不把 cwd 当作目标', () => scenario((sandbox) => {
  /**
   * 安装仍来自全局根，项目只用于本次挂载目标。
   */
  const result = verify(sandbox, ['task-explore'], ['--project', sandbox.project], true)
  assert.equal(result.status, 2)
  assert.equal(result.report.stages.installation.status, 'success')
  assert.equal(result.report.stages.commands.status, 'failed')
  assert.equal(result.report.reasonCode, 'selection')
}))

test('重复技能选择去重，不重复报告或扩大集合', () => scenario((sandbox) => {
  /**
   * 同名重复选择只核验一次。
   */
  const result = verify(sandbox, ['task-explore', 'task-explore'], ['--no-mount'])
  assert.equal(result.status, 0)
  assert.deepEqual(result.report.verifiedSkills, ['task-explore'])
  assert.equal(result.report.skills.length, 1)
}))

test('Bash 依赖摘要错误时停止，不执行未核验的工具', { skip: shell !== 'bash' }, () => scenario((sandbox) => {
  /**
   * 伪造 jq 若被执行会落下哨兵，预期应在执行前被摘要检查拦截。
   */
  const tool = path.join(sandbox.root, 'fake-jq')
  fs.writeFileSync(tool, '#!/usr/bin/env bash\ntouch "$HOME/incorrect-tool-ran"\n')
  fs.chmodSync(tool, 0o700)
  sandbox.env.FOUNDRY_JQ = tool
  /**
   * 工具错误必须明确报告，不能将技能推定为已核验。
   */
  const result = verify(sandbox, ['task-explore'], ['--no-mount'])
  assert.equal(result.status, 1)
  assert.equal(result.report.reasonCode, 'prerequisite')
  assert.deepEqual(result.report.verifiedSkills, [])
  assert.equal(fs.existsSync(path.join(sandbox.userHome, 'incorrect-tool-ran')), false)
}))

test('无法完整枚举的子目录不能被算作技能文件核验通过', () => scenario((sandbox) => {
  /**
   * 目录内含额外文件，但不允许当前用户枚举；不能仅比较可读子集。
   */
  const hidden = path.join(sandbox.project, '.agents/skills/task-explore/unreadable')
  fs.mkdirSync(hidden)
  fs.writeFileSync(path.join(hidden, 'extra.txt'), '不可遗漏的额外文件')
  fs.chmodSync(hidden, 0o000)
  try {
    /**
     * 此处不使用 verify 的完整快照，快照自身也无法枚举故障目录。
     */
    const entry = path.join(sandbox.root, 'tools/script/mount-entry', `mount-entry.${shell === 'bash' ? 'sh' : 'ps1'}`)
    /**
     * 实际运行第二步，前置安装退出成功不影响此处文件错误判断。
     */
    const args = [entry, '--source-dir', path.join(sandbox.root, 'release'), '--version', '0.1.0', '--agent', 'codex', '--installed-root', path.join(sandbox.project, '.agents/skills'), '--skill', 'task-explore', '--no-mount']
    /**
     * PowerShell 的枚举异常同样必须失败，不能悄悄恢复为成功。
     */
    const result = run(shell, shell === 'pwsh' ? ['-NoProfile', '-File', ...args] : args, sandbox)
    assert.notEqual(result.status, 0, result.stdout + result.stderr)
    /**
     * 无法核验的技能不得进入成功集合。
     */
    const report = JSON.parse(result.stdout)
    assert.deepEqual(report.verifiedSkills, [])
    assert.notEqual(report.stages.installation.status, 'success')
    assert.equal(report.stages.commands.status, 'not-run')
  }
  finally {
    fs.chmodSync(hidden, 0o700)
  }
  assert.equal(fs.readFileSync(path.join(hidden, 'extra.txt'), 'utf8'), '不可遗漏的额外文件')
}))

test('混合选择中的枚举异常记录失败项，继续核验后续项并正确汇总阶段', () => scenario((sandbox) => {
  /**
   * 故障位于完整项之间，保证不会因外层异常直接丢失当前项和后续项。
   */
  const unreadable = path.join(sandbox.project, '.agents/skills/task-explore/unreadable')
  fs.mkdirSync(unreadable)
  fs.writeFileSync(path.join(unreadable, 'extra.txt'), '不可遗漏')
  fs.chmodSync(unreadable, 0o000)
  try {
    /**
     * 请求顺序必须完整体现在最终报告中。
     */
    const names = ['vue-reactivity', 'task-explore', 'task-guide']
    /**
     * 手动执行内部核验模块，入口本身的 Node 调度另有专门测试。
     */
    const entry = path.join(sandbox.root, 'tools/script/mount-entry', `mount-entry.${shell === 'bash' ? 'sh' : 'ps1'}`)
    /**
     * 只核验，不允许故障导致任何原生挂载。
     */
    const args = [entry, '--source-dir', path.join(sandbox.root, 'release'), '--version', '0.1.0', '--agent', 'codex', '--installed-root', path.join(sandbox.project, '.agents/skills'), ...names.flatMap(name => ['--skill', name]), '--no-mount']
    /**
     * 同一场景同时约束 Bash 和 PowerShell 的报告语义。
     */
    const result = run(shell, shell === 'pwsh' ? ['-NoProfile', '-File', ...args] : args, sandbox)
    assert.equal(result.status, 1)
    /**
     * 所有请求项均有明确结果，不以 not-run 掩盖枚举失败。
     */
    const report = JSON.parse(result.stdout)
    assert.deepEqual(report.skills.map(item => [item.name, item.status]), [['vue-reactivity', 'verified'], ['task-explore', 'failed'], ['task-guide', 'verified']])
    assert.deepEqual(report.verifiedSkills, ['vue-reactivity', 'task-guide'])
    assert.equal(report.overall, 'partial')
    assert.equal(report.stages.installation.status, 'failed')
    assert.equal(report.stages.commands.status, 'not-run')
  }
  finally { fs.chmodSync(unreadable, 0o700) }
}))
