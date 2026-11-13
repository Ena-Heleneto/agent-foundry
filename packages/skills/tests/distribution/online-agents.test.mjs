import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { officialFixture } from './helpers/online-provider.mjs'

/**
 * 平台模块共用的上游数据读取器；不承担安装、目标写入或静态路径维护。
 */
const reader = fileURLToPath(new URL('../../script/install-skills/read-agents.mjs', import.meta.url))

test('Agent 在线来源只由读取器提供，不维护独立distribution声明目录', () => {
  assert.equal(fs.existsSync(new URL('../../distribution', import.meta.url)), false)
  assert.ok(fs.existsSync(reader), '缺少安装时在线读取官方 Agent 数据的实现')
})

test('在线响应决定实际版本和路径，原始官方包支持环境规则且不固定Agent数量', async () => {
  /**
   * 产品只读查询器通过实际 npm 归档执行数据读取。
   */
  const { readOnlineAgents } = await import('../../script/install-skills/read-agents.mjs')
  /**
   * 准备官方原始字节，HTTP 边界只返回数据。
   */
  const fixture = officialFixture()
  /**
   * 实际观察的请求不能包含固定版本的元数据地址。
   */
  const requests = []
  /**
   * 响应使用实际包字节，未替代路径计算。
   * @param {string} url 产品请求的地址。
   * @returns {Promise<Response>} 受控的官方协议响应。
   */
  async function request(url) {
    requests.push(url)
    return url.endsWith('/latest') ? Response.json(fixture.metadata) : new Response(fixture.archive)
  }
  /**
   * 消费环境不沿用真实用户目录。
   */
  const result = await readOnlineAgents({ request, cwd: '/fixture/project', userHome: '/fixture/user', platform: 'linux', env: { CLAUDE_CONFIG_DIR: '/fixture/custom' }, exists: () => false })
  assert.equal(result.upstream.version, fixture.metadata.version)
  assert.equal(result.upstream.channel, 'latest')
  assert.deepEqual(requests, ['https://registry.npmjs.org/skills/latest', fixture.metadata.dist.tarball])
  assert.equal(result.agents.find(agent => agent.name === 'codex').project, '/fixture/project/.agents/skills')
  assert.equal(result.agents.find(agent => agent.name === 'claude-code').global, '/fixture/custom/skills')
  assert.equal(result.agents.find(agent => agent.name === 'eve').global, null)
  assert.equal(result.agents.find(agent => agent.name === 'eve').projection, 'eve-frontmatter-v1')
  /**
   * 无关 Agent 的相对全局覆盖不能阻断 Codex 项目级检查。
   */
  const unrelated = await readOnlineAgents({ request, cwd: '/fixture/project', userHome: '/fixture/user', platform: 'linux', env: { CLAUDE_CONFIG_DIR: '.claude-alt' }, exists: () => false })
  assert.equal(unrelated.agents.find(agent => agent.name === 'codex').project, '/fixture/project/.agents/skills')
})

test('断网或包完整性错误明确失败，不回退固定Agent快照', async () => {
  /**
   * 使用生产读取逻辑验证失败不会继续返回任何路径。
   */
  const { readOnlineAgents } = await import('../../script/install-skills/read-agents.mjs')
  await assert.rejects(readOnlineAgents({
    request: async () => {
      throw new Error('offline')
    },
  }), /offline/u)
  /**
   * 内容被篡改时完整性声明仍来自官方元数据。
   */
  const fixture = officialFixture()
  await assert.rejects(readOnlineAgents({ request: async url => url.endsWith('/latest') ? Response.json(fixture.metadata) : new Response('tampered') }), /integrity/u)
})
