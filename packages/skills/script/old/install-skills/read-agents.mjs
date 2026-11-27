import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import vm from 'node:vm'

/**
 * 从官方已发布包截取只读声明，布局变化时拒绝，不回退旧规则。
 * @param {string} source 官方 JavaScript。
 * @param {string} start 开始标记。
 * @param {string} end 结束标记。
 * @returns {string} 不含 CLI 主入口的声明。
 */
function section(source, start, end) {
  /**
   * 两个边界必须实际存在，防止负索引掩盖兼容问题。
   */
  const begin = source.indexOf(start)
  /**
   * 结束标记只在开始标记之后查找。
   */
  const finish = source.indexOf(end, begin)
  assert.ok(begin >= 0 && finish > begin, '官方 Agent 配置布局已变化，无法读取最新规则')
  return source.slice(begin, finish)
}

/**
 * 从已验证的包只读输出固定文件，tar 不解包到磁盘。
 * @param {Buffer} archive npm 包原始字节。
 * @param {string} file 固定包内路径。
 * @returns {string} 文件原文。
 */
function unpack(archive, file) {
  return execFileSync('tar', ['-xOzf', '-', `package/${file}`], { input: archive, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 10000 })
}

/**
 * 求值同包的路径声明和路径函数，不运行 CLI、检测器或安装函数。
 * @param {Buffer} archive 通过 integrity 的官方包。
 * @param {object} options 消费目录、平台及只读探针。
 * @returns {object[]} 官方实际目录，不维护另一份 Agent 路径规则。
 */
function evaluate(archive, options) {
  /**
   * 路径规则与官方 CLI 来自相同发布包。
   */
  const bundle = unpack(archive, 'dist/cli.mjs')
  /**
   * 官方 XDG 实现只移除模块边界，保留环境变量和回退计算。
   */
  const xdg = unpack(archive, 'dist/_chunks/libs/xdg-basedir.mjs').replace(/^import .*;\r?$/gmu, '').replace(/^export \{[^}]*\};\r?$/gmu, '')
  /**
   * 使用消费平台的路径语义。
   */
  const paths = options.platform === 'win32' ? path.win32 : path.posix
  /**
   * 仅暴露只读环境与查询函数，不暴露写入或进程启动。
   */
  const context = {
    os: { homedir: () => options.userHome },
    path: paths,
    homedir: () => options.userHome,
    platform: () => options.platform,
    join: paths.join,
    existsSync: options.exists,
    readFileSync,
    readdirSync,
    process: { env: options.env, cwd: () => options.cwd, platform: options.platform },
    project: options.cwd,
  }
  /**
   * 复用官方路径函数，JSON 移除函数与 VM 对象原型。
   */
  const query = `${xdg}\n${bundle.match(/^const (?:AGENTS_DIR(?:\$\d+)?|SKILLS_SUBDIR) = ["'][^"'\r\n]+["'];$/gmu)?.join('\n') ?? ''}
${section(bundle, 'const home = homedir();', 'async function detectInstalledAgents(')}
${section(bundle, 'function isUniversalAgent(', 'function sanitizeName(')}
${section(bundle, 'function getCanonicalSkillsDir(', 'function resolveSymlinkTarget(')}
JSON.stringify(Object.values(agents).map(agent => ({name:agent.name,skillsDir:agent.skillsDir,
project:getAgentBaseDir(agent.name,false,project),global:agent.globalSkillsDir===undefined?null:getAgentBaseDir(agent.name,true,project),
projection:agent.name==='eve'?'eve-frontmatter-v1':'identity'})))`
  /**
   * 数据求值有上限，读取失败不使用随包旧快照。
   */
  const agents = JSON.parse(vm.runInNewContext(query, context, { timeout: 1000 }))
  assert.ok(Array.isArray(agents) && agents.length > 0, '官方 Agent 数据为空')
  /**
   * 不固定数量，但禁止重复身份和非法路径。
   */
  const names = new Set()
  /**
   * 整体合法后才能交给平台模块。
   */
  for (const agent of agents) {
    assert.ok(typeof agent.name === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(agent.name) && !names.has(agent.name), '官方 Agent 身份无效或重复')
    names.add(agent.name)
    assert.ok(typeof agent.project === 'string' && (agent.global === null || typeof agent.global === 'string'), '官方 Agent 路径类型无效')
  }
  return agents
}

/**
 * 每次在线解析 npm latest，版本与包字节只在内存中，不写 npm 缓存或目标。
 * request 是单元测试的 HTTP 边界，产品使用 Node 原生 fetch。
 * @param {object} [options] 可注入请求及只读消费环境。
 * @returns {Promise<object>} 本次实际版本和全部官方 Agent 目录。
 */
export async function readOnlineAgents(options = {}) {
  /**
   * 沿用现有超时设置，在请求前验证。
   */
  const seconds = process.env.FOUNDRY_DOWNLOAD_TIMEOUT ?? '30'
  assert.match(seconds, /^[1-9]\d*$/u, 'FOUNDRY_DOWNLOAD_TIMEOUT 必须为正整数')
  /**
   * 产品没有来源覆盖参数或离线回退。
   */
  const request = options.request ?? fetch
  /**
   * 每次请求有超时，不自动跳转到其他来源。
   * @param {string} url 官方 npm 地址。
   * @returns {Promise<Response>} 成功响应。
   */
  async function get(url) {
    /**
     * 原生 HTTP 不启动 npx，不创建工具缓存。
     */
    const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(Number(seconds) * 1000) })
    assert.ok(response.ok, `无法获取官方 Agent 数据：HTTP ${response.status}`)
    return response
  }
  /**
   * 从本次 latest 响应选择实际版本，不写死版本或提交。
   */
  const metadata = await (await get('https://registry.npmjs.org/skills/latest')).json()
  assert.ok(metadata.name === 'skills' && typeof metadata.version === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(metadata.version), '官方 latest 元数据无效')
  assert.equal(metadata.dist?.tarball, `https://registry.npmjs.org/skills/-/skills-${metadata.version}.tgz`, '官方包地址无效')
  assert.ok(typeof metadata.dist.integrity === 'string' && /^sha512-[A-Za-z0-9+/]+=*$/u.test(metadata.dist.integrity), '官方包缺少 integrity')
  /**
   * 求值前核验同一响应声明的包完整性。
   */
  const archive = Buffer.from(await (await get(metadata.dist.tarball)).arrayBuffer())
  assert.ok(archive.length <= 16 * 1024 * 1024, '官方包超过读取上限')
  assert.equal(`sha512-${createHash('sha512').update(archive).digest('base64')}`, metadata.dist.integrity, '官方包 integrity 不匹配')
  assert.equal(JSON.parse(unpack(archive, 'package.json')).version, metadata.version, '官方包版本不一致')
  return {
    schemaVersion: 1,
    upstream: { package: 'skills', channel: 'latest', version: metadata.version, integrity: metadata.dist.integrity },
    agents: evaluate(archive, { cwd: options.cwd ?? process.cwd(), userHome: options.userHome ?? os.homedir(), platform: options.platform ?? process.platform, env: options.env ?? process.env, exists: options.exists ?? existsSync }),
  }
}

/**
 * 平台模块直接调用才联网；导入不产生请求。
 */
const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isMain) {
  readOnlineAgents().then(result => process.stdout.write(`${JSON.stringify(result)}\n`)).catch((error) => {
    process.stderr.write(`在线 Agent 数据获取失败：${error.message}\n`)
    process.exitCode = 2
  })
}
