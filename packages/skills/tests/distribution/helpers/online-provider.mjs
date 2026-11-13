import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * 测试使用实际官方包字节作为受控 HTTP 响应，不给产品增加测试来源开关。
 * @returns {{metadata: object, archive: Buffer}} 官方包夹具及本次完整性声明。
 */
export function officialFixture() {
  assert.ok(process.env.FOUNDRY_SKILLS_PACKAGE, '需要 FOUNDRY_SKILLS_PACKAGE 指向已准备的官方包')
  /**
   * 版本读取夹具包自身，测试不把它当产品的版本选择。
   */
  const metadata = JSON.parse(fs.readFileSync(path.join(process.env.FOUNDRY_SKILLS_PACKAGE, 'package.json'), 'utf8'))
  /**
   * GNU tar 仅输出内存包，夹具及源目录不变。
   */
  const result = spawnSync('tar', ['-czf', '-', '--transform=s,^\\./,package/,', '-C', process.env.FOUNDRY_SKILLS_PACKAGE, '.'], { maxBuffer: 16 * 1024 * 1024 })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr.toString())
  /**
   * 原始归档字节同时用于完整性和真实解析。
   */
  const archive = result.stdout
  return { archive, metadata: { name: 'skills', version: metadata.version, dist: { tarball: `https://registry.npmjs.org/skills/-/skills-${metadata.version}.tgz`, integrity: `sha512-${createHash('sha512').update(archive).digest('base64')}` } } }
}

/**
 * 仅在测试子进程内替换 HTTP 边界；生产模块仍走真实 fetch 和实际解析。
 */
if (process.env.FOUNDRY_SKILLS_PACKAGE) {
  /**
   * 同一进程只在真正请求官方 latest 时准备响应。
   */
  let fixture
  /**
   * 保留其他 URL 的真实请求，避免影响官方本地安装回归。
   */
  const original = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith('https://registry.npmjs.org/skills/')) {
      fixture ??= officialFixture()
      if (String(url).endsWith('/latest'))
        return Response.json(fixture.metadata)
      assert.equal(String(url), fixture.metadata.dist.tarball)
      return new Response(fixture.archive)
    }
    return original(url, options)
  }
}
