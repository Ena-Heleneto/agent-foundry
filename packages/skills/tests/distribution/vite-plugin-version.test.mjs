import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import moment from 'moment'
import { build } from 'vite'
import vitePluginVersion from '../../build/plugins/vite-plugin-version/index.ts'

/**
 * 从包清单独立读取用于断言的源码版本。
 */
const packageVersion = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version

/**
 * 创建使用真实版本插件的隔离 Vite 构建配置。
 * @param {import('node:test').TestContext} t 当前测试上下文。
 * @returns {import('vite').InlineConfig} 隔离构建配置。
 */
function createVersionBuild(t) {
  /**
   * 临时目录仅保存当前用例的入口和磁盘产物。
   */
  const root = mkdtempSync(join(tmpdir(), 'foundry-vite-version-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  /**
   * 用真实入口触发完整的构建生命周期。
   */
  const entryPath = join(root, 'entry.js')
  writeFileSync(entryPath, 'export default 1\n')
  return {
    configFile: false,
    root,
    logLevel: 'silent',
    publicDir: false,
    plugins: [vitePluginVersion()],
    build: { write: false, rolldownOptions: { input: entryPath } },
  }
}

/**
 * 读取真实构建中每个输出交付的 VERSION。
 * @param {import('vite').InlineConfig} config 当前构建配置。
 * @returns {Promise<string[]>} 各输出的版本文件原始文本。
 */
async function buildVersions(config) {
  /**
   * Vite 按输出配置返回一个或多个包。
   */
  const result = await build(config)
  return [result].flat().map((bundle) => {
    assert.ok(bundle && 'output' in bundle)
    /**
     * 当前输出中版本插件交付的文件资产。
     */
    const asset = bundle.output.find(output => output.type === 'asset' && output.fileName === 'VERSION')
    assert.ok(asset && typeof asset.source === 'string')
    return asset.source
  })
}

test('固定时钟下 VERSION 字节一致，同进程下一次构建读取当时的时间', async (t) => {
  /**
   * 多次构建复用同一配置与插件实例。
   */
  const config = createVersionBuild(t)
  /**
   * 测试时钟在复建期间保持固定，随后拨到闰日验证再次取时。
   */
  let now = Date.parse('2026-11-25T12:09:05.123Z')
  t.mock.method(moment, 'now', () => now)
  /**
   * 首次产物提供固定时钟下的字节基线。
   */
  const [first] = await buildVersions(config)
  assert.ok(first?.endsWith('\n'))
  assert.deepEqual(JSON.parse(first), { packageVersion, releaseTimestamp: '20261125T120905123Z' })
  assert.deepEqual(await buildVersions(config), [first])

  now = Date.parse('2024-02-29T23:59:59.999Z')
  /**
   * 更改时钟后再次构建得到的版本文本。
   */
  const [next] = await buildVersions(config)
  assert.deepEqual(JSON.parse(next), { packageVersion, releaseTimestamp: '20240229T235959999Z' })
})

test('普通构建从实际 UTC 时钟生成本次时间戳', async (t) => {
  /**
   * 通过真实 Vite 构建读取系统时钟。
   */
  const config = createVersionBuild(t)
  /**
   * 生成时间应在本次构建的实际执行区间内。
   */
  const started = Date.now()
  /**
   * 生成的版本文件文本。
   */
  const [text] = await buildVersions(config)
  /**
   * 从文件读回的源码版本与时间戳。
   */
  const version = JSON.parse(text)
  assert.equal(version.packageVersion, packageVersion)
  assert.match(version.releaseTimestamp, /^\d{8}T\d{9}Z$/u)
  /**
   * 转换为 ISO 时间后核对实际 UTC 毫秒值。
   */
  const milliseconds = Date.parse(version.releaseTimestamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})Z$/u, '$1-$2-$3T$4:$5:$6.$7Z'))
  assert.ok(milliseconds >= started && milliseconds <= Date.now())
})

test('一次构建只取一次时间，各输出使用相同的 VERSION', async (t) => {
  /**
   * 配置两个独立的 Rolldown 输出。
   */
  const config = createVersionBuild(t)
  config.build.rolldownOptions.output = [
    { entryFileNames: 'first.js' },
    { entryFileNames: 'second.js' },
  ]
  /**
   * 记录 Moment.js 在本次构建中读取时钟的次数。
   */
  const clock = t.mock.method(moment, 'now', () => Date.parse('2026-11-25T12:09:05.123Z'))
  /**
   * 两个真实输出各自产生的版本文件。
   */
  const versions = await buildVersions(config)
  assert.equal(clock.mock.callCount(), 1)
  assert.equal(versions.length, 2)
  assert.equal(versions[0], versions[1])
  assert.deepEqual(JSON.parse(versions[0]), { packageVersion, releaseTimestamp: '20261125T120905123Z' })
})
