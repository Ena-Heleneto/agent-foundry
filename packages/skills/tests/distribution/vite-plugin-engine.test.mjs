import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import * as engine from '../../build/plugins/vite-plugin-engine/index.ts'

/**
 * 创建独立集合来源，测试后清理所有夹具。
 */
function fixture(t) {
  /**
   * 每次测试独占的真实来源目录，避免动态导入缓存串扰。
   */
  const root = mkdtempSync(join(tmpdir(), 'foundry-plugin-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

/**
 * 将配置或插件源码写入隔离来源。
 */
function write(root, relative, source) {
  mkdirSync(dirname(join(root, relative)), { recursive: true })
  writeFileSync(join(root, relative), source)
}

/**
 * 使用真实集合配置辅助函数生成夹具配置。
 */
function configure(root, name, options = {}) {
  write(root, `${name}/collection.config.ts`, `
    import { defineCollectionHandle } from ${JSON.stringify(new URL('../../utils/define-collection-handle.ts', import.meta.url).href)}
    export default defineCollectionHandle(${JSON.stringify({ packageName: name, mcp: false, skill: {}, ...options })})
  `)
}

test('缺省、false 和缺配置的集合不会导入子插件', async (t) => {
  /**
   * 禁用插件一旦被错误导入就抛错，验证开关实际阻断加载。
   */
  const root = fixture(t)
  configure(root, 'default')
  configure(root, 'disabled', { plugin: false })
  configure(root, 'string', { plugin: 'true' })
  configure(root, 'number', { plugin: 1 })
  for (const name of ['default', 'disabled', 'unconfigured', 'string', 'number']) {
    write(root, `${name}/plugin/vite-plugin-broken/index.ts`, 'throw new Error("禁用集合不应加载")')
  }
  assert.deepEqual(await engine.default(root), [])
})

test('true 扫描单数 plugin 目录，独立于 script 和技能开关', async (t) => {
  /**
   * 只允许固定层级的普通入口被加载。
   */
  const root = fixture(t)
  configure(root, 'enabled', { plugin: true, script: false })
  write(root, 'enabled/plugin/vite-plugin-demo/index.ts', 'export default () => ({ name: "demo" })')
  write(root, 'enabled/plugins/vite-plugin-old/index.ts', 'throw new Error("不扫描复数目录")')
  write(root, 'enabled/plugin/attachment/vite-plugin-deep/index.ts', 'throw new Error("不递归附件")')
  write(root, 'outside/index.ts', 'throw new Error("不跟随链接")')
  symlinkSync(join(root, 'outside'), join(root, 'enabled/plugin/vite-plugin-link'), 'dir')
  mkdirSync(join(root, 'enabled/plugin/vite-plugin-linked-entry'))
  symlinkSync(join(root, 'outside/index.ts'), join(root, 'enabled/plugin/vite-plugin-linked-entry/index.ts'))
  configure(root, 'linked-root', { plugin: true })
  write(root, 'outside/vite-plugin-broken/index.ts', 'throw new Error("不跟随插件根链接")')
  symlinkSync(join(root, 'outside'), join(root, 'linked-root/plugin'), 'dir')
  symlinkSync(join(root, 'enabled'), join(root, 'linked-collection'), 'dir')
  assert.deepEqual((await engine.default(root)).map(plugin => plugin.name), ['demo'])
})

test('移除入口后重新加载配置不再发现该插件', async (t) => {
  /**
   * 同一来源重复扫描时只读取仍存在的入口，不缓存插件名单。
   */
  const root = fixture(t)
  configure(root, 'enabled', { plugin: true })
  write(root, 'enabled/plugin/vite-plugin-demo/index.ts', 'export default () => ({ name: "demo" })')
  assert.deepEqual((await engine.default(root)).map(plugin => plugin.name), ['demo'])
  rmSync(join(root, 'enabled/plugin/vite-plugin-demo/index.ts'))
  assert.deepEqual(await engine.default(root), [])
})

test('启用集合缺少插件目录或入口时正常返回空结果', async (t) => {
  /**
   * 启用开关不要求集合必须有子插件。
   */
  const root = fixture(t)
  configure(root, 'empty', { plugin: true })
  configure(root, 'no-entry', { plugin: true })
  mkdirSync(join(root, 'no-entry/plugin/vite-plugin-empty'), { recursive: true })
  assert.deepEqual(await engine.default(root), [])
})

test('按稳定顺序加载异步嵌套插件，并将它们发出的文件写到 engine 下', async (t) => {
  /**
   * 导入顺序与生成资产共同验证发现及 Vite 接线边界。
   */
  const root = fixture(t)
  configure(root, 'b', { plugin: true })
  configure(root, 'a', { plugin: true })
  for (const [collection, name] of [['b', 'z'], ['a', 'z'], ['a', 'a']]) {
    write(root, `${collection}/plugin/vite-plugin-${name}/index.ts`, `
      export default async () => [false, [{
        name: '${collection}-${name}',
        buildStart() {
          if ('${collection}-${name}' === 'a-a') {
            this.emitFile({ type: 'asset', name: 'automatic.txt', source: 'automatic' })
            this.emitFile({ type: 'chunk', id: 'virtual:engine-entry', name: 'engine-entry' })
          }
        },
        generateBundle: {
          order: 'post',
          handler(_, bundle) {
            const id = this.emitFile({ type: 'asset', fileName: 'reports/${collection}-${name}.txt', source: 'loaded' })
            if ('${collection}-${name}' === 'a-a') {
              if (!bundle['direct.txt'])
                throw new Error('子插件生成钩子的 order 未生效')
              this.emitFile({ type: 'asset', fileName: 'reference.txt', source: this.getFileName(id) })
            }
          },
        }
      }]]
    `)
  }
  /**
   * 引擎保留嵌套工厂结果，集合 a 必须先于 b。
   */
  const plugins = await engine.default(root)
  assert.deepEqual(plugins.map(plugin => plugin[1][0].name), ['a-a', 'a-z', 'b-z'])
  /**
   * 内存构建消费引擎结果，避免污染工作区 dist。
   */
  const result = await build({
    configFile: false,
    root,
    publicDir: false,
    logLevel: 'silent',
    plugins: [plugins, {
      name: 'test-entry',
      resolveId(id) {
        if (id === 'virtual:test' || id === 'virtual:engine-entry')
          return `\0${id}`
      },
      load(id) {
        if (id === '\0virtual:test' || id === '\0virtual:engine-entry')
          return 'export const value = 1'
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'direct.txt', source: 'top-level' })
      },
    }],
    build: { write: false, rolldownOptions: { input: 'virtual:test' } },
  })
  /**
   * 显式目录和文件名保留，自动命名文件也位于 engine 内。
   */
  const assets = new Map(result.output.filter(item => item.type === 'asset').map(item => [item.fileName, item.source]))
  assert.deepEqual([...assets.keys()].filter(file => assets.get(file) !== 'automatic').sort(), [
    'direct.txt',
    'engine/reference.txt',
    'engine/reports/a-a.txt',
    'engine/reports/a-z.txt',
    'engine/reports/b-z.txt',
  ])
  assert.equal(assets.get('direct.txt'), 'top-level')
  assert.equal(assets.get('engine/reference.txt'), 'engine/reports/a-a.txt')
  assert.match([...assets.entries()].find(([, source]) => source === 'automatic')?.[0] ?? '', /^engine\/.*automatic.*\.txt$/u)
  assert.match(result.output.find(item => item.type === 'chunk' && item.facadeModuleId === '\0virtual:engine-entry')?.fileName ?? '', /^engine\/.*engine-entry.*\.js$/u)
  assert.equal(existsSync(join(root, 'dist')), false)
})

test('已匹配的坏插件报错并保留实际入口路径', async (t) => {
  for (const source of ['throw new Error("导入失败")', 'export default {}', 'export default () => { throw new Error("工厂失败") }']) {
    /**
     * 各失败类型使用独立目录，避免复用失败模块缓存。
     */
    const root = fixture(t)
    configure(root, 'enabled', { plugin: true })
    /**
     * 错误必须指向命中的插件入口，便于定位集合。
     */
    const entry = 'enabled/plugin/vite-plugin-broken/index.ts'
    write(root, entry, source)
    await assert.rejects(engine.default(root), error => error.message.includes(join(root, entry)))
  }
})
