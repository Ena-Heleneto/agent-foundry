import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * 逐组件拒绝目标内链接，避免只检查叶子却进入外部用户目录。
 * @param {string} target 需读取或写入的本次明确路径。
 */
function assertPlainPath(target) {
  /**
   * 从文件系统根逐级检查已有组件，不自动修复路径。
   */
  let current = path.parse(path.resolve(target)).root
  for (const part of path.resolve(target).slice(current.length).split(path.sep)) {
    current = path.join(current, part)
    /**
     * lstat不跟随现有或悬空链接。
     */
    const stat = fs.lstatSync(current, { throwIfNoEntry: false })
    if (stat)
      assert.ok(!stat.isSymbolicLink(), `拒绝链接路径：${current}`)
  }
}

/**
 * 只读本次明确目录的全部字节与空目录，不维护永久指纹或所有权服务。
 * @param {string} root 普通目录。
 * @returns {object|null} 稳定文件树。
 */
function snapshot(root) {
  assertPlainPath(root)
  if (!fs.existsSync(root))
    return null
  /**
   * 本次临时比较结果不写入目标项目。
   */
  const result = {}
  /**
   * 只检查已定位的受影响目录。
   */
  function visit(current, relative) {
    /**
     * 每个子项必须是普通文件或目录。
     */
    const stat = fs.lstatSync(current)
    assert.ok(!stat.isSymbolicLink(), `受管目录含链接：${relative}`)
    if (stat.isDirectory()) {
      result[relative] = 'directory'
      for (const name of fs.readdirSync(current).sort()) visit(path.join(current, name), relative ? `${relative}/${name}` : name)
    }
    else {
      assert.ok(stat.isFile(), `特殊文件：${relative}`)
      result[relative] = createHash('sha256').update(fs.readFileSync(current)).digest('hex')
    }
  }
  visit(root, '')
  return result
}

/**
 * 使用已准备的官方Specify解析历史YAML，不维护自己的YAML转换器。
 * JSON声明可直接读取；其他格式仅委托同版工具环境，失败发生在目标写入前。
 * @param {string} file 已核对归属的旧声明路径。
 * @param {string|undefined} cliPath 本次明确选择的官方可执行文件。
 * @returns {object} 官方完整声明数据。
 */
function readLegacyManifest(file, cliPath) {
  /**
   * 本次生成及部分历史声明使用合法JSON，保留其原字节。
   */
  const encoded = fs.readFileSync(file, 'utf8')
  try {
    return JSON.parse(encoded)
  }
  catch {
    /**
     * 显式CLI使用其已安装Python环境，默认路径仅使用离线已备工具。
     */
    const shebang = cliPath ? fs.readFileSync(cliPath, 'utf8').split('\n')[0] : ''
    /**
     * 不执行不透明shell文本，不将目标路径插值进Python程序。
     */
    const adjacentPython = cliPath ? path.join(path.dirname(fs.realpathSync(cliPath)), 'python') : undefined
    /**
     * uv的可搬移CLI使用shell启动器，解释器仍位于同一已安装bin目录。
     */
    const interpreter = shebang?.match(/^#!(\/[^\r\n]+\/python[\d.]*)$/u)?.[1] ?? (adjacentPython && fs.existsSync(adjacentPython) ? adjacentPython : undefined)
    /**
     * 官方类负责语法和结构，版本检查防止误用全局其他版本。
     */
    const program = 'import json,sys; from pathlib import Path; from importlib.metadata import version; from specify_cli.extensions import ExtensionManifest; assert version("specify-cli")=="1.2.6", "需要已准备的Specify1.2.6"; print(json.dumps(ExtensionManifest(Path(sys.argv[1])).data))'
    /**
     * 读取只限传入文件，不创建自有Python模块、缓存或目标配置。
     */
    const command = interpreter ?? 'uvx'
    /**
     * 离线方式不访问网络或回退到其他CLI版本。
     */
    const args = interpreter ? ['-B', '-c', program, file] : ['--offline', '--from', 'specify-cli==1.2.6', 'python', '-B', '-c', program, file]
    /**
     * 工具或解析不可用时，不能将旧扩展当成新项目覆盖。
     */
    const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } })
    assert.ifError(result.error)
    assert.equal(result.status, 0, `无法用已准备的官方Specify读取旧声明：${result.stderr}`)
    return JSON.parse(result.stdout)
  }
}

/**
 * 官方registry仅供只读核对，不自行修改或复制其注册身份。
 * @param {string} project 本次项目根。
 * @returns {object} 实际有效注册记录。
 */
function registry(project) {
  /**
   * 拒绝把损坏registry按空项目处理。
   */
  const file = path.join(project, '.specify/extensions/.registry')
  assertPlainPath(file)
  /**
   * 缺文件属于新项目；存在时必须有合法结构。
   */
  const result = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { extensions: {} }
  assert.ok(result.extensions && typeof result.extensions === 'object' && !Array.isArray(result.extensions), '官方registry损坏')
  return result.extensions
}

/**
 * 从官方旧登记提取将被卸载的明确入口，不扫描其他来源目录。
 * @param {object} entry 官方扩展登记。
 * @returns {string[]} 正式入口目录名。
 */
function outputNames(entry) {
  /**
   * 命令和skills可能登记同一路径，去重后只读一次。
   */
  const names = new Set(entry?.registered_skills ?? [])
  for (const commands of Object.values(entry?.registered_commands ?? {})) {
    for (const name of commands) names.add(name.replaceAll('.', '-'))
  }
  for (const name of names) assert.match(name, /^[a-z][a-z0-9-]*$/u, '非法旧登记入口')
  return [...names].sort()
}

/**
 * 仅Bash平台流程调用，在本次私有目录重建比较，不存目标指纹。
 */
const [operation, project, id, input, probe, cliPath] = process.argv.slice(2)
assert.ok(project && id && input && probe && ['prepare', 'compare', 'verify', 'verify-removed'].includes(operation), '缺少受管核验参数')
assert.match(id, /^[a-z][a-z0-9-]*$/u)
assertPlainPath(path.join(project, '.specify/init-options.json'))
/**
 * 紧急版限定本次Codex项目，不接管其他宿主配置。
 */
const options = JSON.parse(fs.readFileSync(path.join(project, '.specify/init-options.json'), 'utf8'))
assert.equal(options.ai, 'codex', '紧急版只支持Codex项目')
/**
 * 真实旧记录和临时新声明分开核对。
 */
const installed = registry(project)[id]
/**
 * 本次新声明是完整验证过的JSON输入。
 */
const manifest = JSON.parse(fs.readFileSync(path.join(input, 'extension.yml'), 'utf8'))
assert.equal(manifest.extension.id, id)
/**
 * 旧源目录只按当前明确ID定位。
 */
const oldRoot = path.join(project, '.specify/extensions', id)
/**
 * 新旧正式输出共同保护，防止官方覆盖未登记的同名用户内容。
 */
const newNames = (manifest.provides?.commands ?? []).map(command => command.name.replaceAll('.', '-'))
if (operation === 'prepare') {
  for (const name of newNames) {
    assert.match(name, /^[a-z][a-z0-9-]*$/u)
    if (!outputNames(installed).includes(name))
      assert.equal(snapshot(path.join(project, '.agents/skills', name)), null, `来源不明的正式入口：${name}`)
  }
  if (!installed) {
    assert.equal(snapshot(oldRoot), null, `来源不明的扩展目录：${id}`)
  }
  else {
    /**
     * 先核对官方记录中的实际manifest原字节摘要。
     */
    const oldFiles = snapshot(oldRoot)
    assert.ok(oldFiles?.['extension.yml'], `缺少已登记扩展源：${id}`)
    assert.equal(installed.manifest_hash, `sha256:${oldFiles['extension.yml']}`, `用户修改了旧扩展声明：${id}`)
    /**
     * 已知旧来源摘要来自真实仓库版本，仅用于识别迁移素材。
     */
    const known = JSON.parse(fs.readFileSync(new URL('../register-commands/legacy-source-hashes.json', import.meta.url), 'utf8')).filesBySha256
    /**
     * 同版本新输入可直接比较，历史原始正文按已知来源核对。
     */
    const currentFiles = snapshot(input)
    for (const [relative, digest] of Object.entries(oldFiles)) {
      if (digest === 'directory' || relative === 'extension.yml')
        continue
      assert.ok(currentFiles?.[relative] === digest || known[digest], `旧扩展含用户修改或未知附件，保留：${id}/${relative}`)
    }
    /**
     * 已知旧声明只允许静态命令和hooks，不在预检执行来源脚本。
     */
    const oldManifest = readLegacyManifest(path.join(oldRoot, 'extension.yml'), cliPath)
    assert.equal(oldManifest.extension.id, id)
    assert.ok(['scripts', 'config', 'templates'].every(key => Object.keys(oldManifest.provides?.[key] ?? {}).length === 0), '未知旧扩展能力，保留并停止')
    fs.mkdirSync(path.join(probe, 'project/.specify'), { recursive: true, mode: 0o700 })
    fs.writeFileSync(path.join(probe, 'project/.specify/init-options.json'), JSON.stringify({ ai: 'codex', ai_skills: true }))
    fs.cpSync(oldRoot, path.join(probe, 'input'), { recursive: true })
    fs.writeFileSync(path.join(probe, 'required'), '')
  }
}
else if (operation === 'compare') {
  if (installed) {
    /**
     * 官方在本次临时项目重建旧输入；只读比较完整正式输出。
     */
    const replay = registry(path.join(probe, 'project'))[id]
    assert.ok(replay, '官方没有重建旧登记')
    assert.deepEqual(outputNames(installed), outputNames(replay), `旧入口登记不完整：${id}`)
    for (const name of outputNames(installed))
      assert.deepEqual(snapshot(path.join(project, '.agents/skills', name)), snapshot(path.join(probe, 'project/.agents/skills', name)), `用户修改或未知附件，保留：${name}`)
  }
}
else if (operation === 'verify-removed') {
  assert.equal(installed, undefined, `官方尚未移除退役登记：${id}`)
  assert.equal(snapshot(oldRoot), null, `官方尚未移除退役来源：${id}`)
  /**
   * 删除范围取本次临时官方重建结果，不在目标保存第二份归属状态。
   */
  const replay = registry(path.join(probe, 'project'))[id]
  assert.ok(replay, '缺少本次已比较的旧登记，不能宣称移除通过')
  for (const name of outputNames(replay))
    assert.equal(snapshot(path.join(project, '.agents/skills', name)), null, `退役正式入口仍存在：${name}`)
}
else {
  assert.ok(installed && installed.enabled === true, `官方未登记有效扩展：${id}`)
  assert.equal(installed.manifest_hash, `sha256:${createHash('sha256').update(fs.readFileSync(path.join(input, 'extension.yml'))).digest('hex')}`, '官方manifest身份不符')
  assert.deepEqual(snapshot(oldRoot), snapshot(input), '官方扩展源文件与本次输入不同')
  for (const name of newNames) assert.ok(snapshot(path.join(project, '.agents/skills', name))?.['SKILL.md'], `官方未生成完整入口：${name}`)
}
