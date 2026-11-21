import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'

/**
 * 引擎源码及全局子插件在隔离包内使用同一目录。
 */
const engineDirectory = 'build/plugins/vite-plugin-engine'

/**
 * 复制引擎及其依赖到隔离包，测试后清理整个夹具。
 */
function fixture(t) {
  /**
   * 每次测试独占包根，避免动态导入缓存串扰。
   */
  const root = mkdtempSync(join(tmpdir(), 'foundry-plugin-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'src'))
  /**
   * 保留正式包的模块位置和导入别名，按测试场景另建子插件。
   */
  const copiedFiles = [
    'package.json',
    'utils/scan-skills.ts',
    ...['index.ts', 'install-script.ts', 'install.source.sh'].map(file => join(engineDirectory, file)),
  ]
  for (const relative of copiedFiles)
    write(root, relative, readFileSync(new URL(`../../${relative}`, import.meta.url)))
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
  write(root, `src/${name}/collection.config.ts`, `
    import { defineCollectionHandle } from ${JSON.stringify(new URL('../../utils/define-collection-handle.ts', import.meta.url).href)}
    export default defineCollectionHandle(${JSON.stringify({ packageName: name, mcp: false, skill: {}, ...options })})
  `)
}

/**
 * 从独占包加载真实引擎，以无参工厂扫描包内目录。
 */
async function loadFixtureEngine(root) {
  /**
   * 模块从隔离包解析内部目录和导入别名。
   */
  const { default: vitePluginEngine } = await import(pathToFileURL(join(root, engineDirectory, 'index.ts')).href)
  return vitePluginEngine()
}

test('加载全局子插件时跳过备份与禁用集合的入口', async (t) => {
  /**
   * 禁用插件一旦被错误导入就抛错，验证开关实际阻断加载。
   */
  const root = fixture(t)
  configure(root, 'default')
  configure(root, 'disabled', { plugin: false })
  configure(root, 'string', { plugin: 'true' })
  configure(root, 'number', { plugin: 1 })
  for (const name of ['default', 'disabled', 'unconfigured', 'string', 'number']) {
    write(root, `src/${name}/plugin/vite-plugin-broken/index.ts`, 'throw new Error("禁用集合不应加载")')
  }
  write(root, `${engineDirectory}/sub-plugins/vite-plugin-global/index.ts`, 'export default () => ({ name: "global" })')
  write(root, `${engineDirectory}/sub-plugins/vite-plugin-global_copy/index.ts`, 'throw new Error("备份目录不应加载")')
  assert.deepEqual((await loadFixtureEngine(root)).map(plugin => plugin.name), ['global', 'vite-plugin-engine-install'])
})

test('true 扫描单数 plugin 目录，独立于 script 和技能开关', async (t) => {
  /**
   * 只允许固定层级的普通入口被加载。
   */
  const root = fixture(t)
  configure(root, 'enabled', { plugin: true, script: false })
  write(root, 'src/enabled/plugin/vite-plugin-demo/index.ts', 'export default () => ({ name: "demo" })')
  write(root, 'src/enabled/plugins/vite-plugin-old/index.ts', 'throw new Error("不扫描复数目录")')
  write(root, 'src/enabled/plugin/attachment/vite-plugin-deep/index.ts', 'throw new Error("不递归附件")')
  write(root, 'outside/index.ts', 'throw new Error("不跟随链接")')
  symlinkSync(join(root, 'outside'), join(root, 'src/enabled/plugin/vite-plugin-link'), 'dir')
  mkdirSync(join(root, 'src/enabled/plugin/vite-plugin-linked-entry'))
  symlinkSync(join(root, 'outside/index.ts'), join(root, 'src/enabled/plugin/vite-plugin-linked-entry/index.ts'))
  configure(root, 'linked-root', { plugin: true })
  write(root, 'outside/vite-plugin-broken/index.ts', 'throw new Error("不跟随插件根链接")')
  symlinkSync(join(root, 'outside'), join(root, 'src/linked-root/plugin'), 'dir')
  symlinkSync(join(root, 'src/enabled'), join(root, 'src/linked-collection'), 'dir')
  assert.deepEqual((await loadFixtureEngine(root)).map(plugin => plugin.name), ['demo', 'vite-plugin-engine-install'])
})

test('移除入口后重新加载配置不再发现该插件', async (t) => {
  /**
   * 同一来源重复扫描时只读取仍存在的入口，不缓存插件名单。
   */
  const root = fixture(t)
  configure(root, 'enabled', { plugin: true })
  write(root, 'src/enabled/plugin/vite-plugin-demo/index.ts', 'export default () => ({ name: "demo" })')
  assert.deepEqual((await loadFixtureEngine(root)).map(plugin => plugin.name), ['demo', 'vite-plugin-engine-install'])
  rmSync(join(root, 'src/enabled/plugin/vite-plugin-demo/index.ts'))
  assert.deepEqual((await loadFixtureEngine(root)).map(plugin => plugin.name), ['vite-plugin-engine-install'])
})

test('启用集合缺少插件目录或入口时正常返回空结果', async (t) => {
  /**
   * 启用开关不要求集合必须有子插件。
   */
  const root = fixture(t)
  configure(root, 'empty', { plugin: true })
  configure(root, 'no-entry', { plugin: true })
  mkdirSync(join(root, 'src/no-entry/plugin/vite-plugin-empty'), { recursive: true })
  assert.deepEqual((await loadFixtureEngine(root)).map(plugin => plugin.name), ['vite-plugin-engine-install'])
})

test('按稳定顺序加载异步嵌套插件，并将它们发出的文件写到 engine 下', async (t) => {
  /**
   * 导入顺序与生成资产共同验证发现及 Vite 接线边界。
   */
  const root = fixture(t)
  configure(root, 'b', { plugin: true })
  configure(root, 'a', { plugin: true })
  /**
   * 打乱全局和集合插件的写入顺序，验证按固定的目录顺序加载。
   */
  for (const [directory, name] of [
    ['src/b/plugin', 'b-z'],
    ['src/a/plugin', 'a-z'],
    [`${engineDirectory}/sub-plugins`, 'global-z'],
    ['src/a/plugin', 'a-a'],
    [`${engineDirectory}/sub-plugins`, 'global-a'],
  ]) {
    write(root, `${directory}/vite-plugin-${name}/index.ts`, `
      export default async () => [false, [{
        name: '${name}',
        buildStart() {
          if ('${name}' === 'a-a') {
            this.emitFile({ type: 'asset', name: 'automatic.txt', source: 'automatic' })
            this.emitFile({ type: 'chunk', id: 'virtual:engine-entry', name: 'engine-entry' })
          }
        },
        generateBundle: {
          order: 'post',
          handler(_, bundle) {
            const id = this.emitFile({ type: 'asset', fileName: 'reports/${name}.txt', source: 'loaded' })
            if ('${name}' === 'a-a') {
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
   * 全局子插件先加载，集合 a 先于 b，统一入口生成插件排在末尾。
   */
  const plugins = await loadFixtureEngine(root)
  assert.deepEqual(plugins.slice(0, -1).map(plugin => plugin[1][0].name), ['global-a', 'global-z', 'a-a', 'a-z', 'b-z'])
  assert.equal(plugins.at(-1).name, 'vite-plugin-engine-install')
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
    'engine/install.sh',
    'engine/reference.txt',
    'engine/reports/a-a.txt',
    'engine/reports/a-z.txt',
    'engine/reports/b-z.txt',
    'engine/reports/global-a.txt',
    'engine/reports/global-z.txt',
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
    const entry = 'src/enabled/plugin/vite-plugin-broken/index.ts'
    write(root, entry, source)
    await assert.rejects(loadFixtureEngine(root), error => error.message.includes(join(root, entry)))
  }
})

test('已匹配的全局子插件失败时保留入口路径和原错', async (t) => {
  /**
   * 全局工厂独立于集合配置执行，原异常用于定位实际失败原因。
   */
  const root = fixture(t)
  /**
   * 放入全局目录的匹配入口，验证错误指向对应来源。
   */
  const entry = `${engineDirectory}/sub-plugins/vite-plugin-broken/index.ts`
  write(root, entry, 'export default () => { throw new Error("工厂失败") }')
  await assert.rejects(loadFixtureEngine(root), error => error.message.includes(join(root, entry)) && error.cause?.message === '工厂失败')
})

/**
 * 使用真实 Vite 内存构建验证统一入口，不运行任何生成脚本。
 */
async function buildEngine(root) {
  return build({
    configFile: false,
    root,
    publicDir: false,
    logLevel: 'silent',
    plugins: [await loadFixtureEngine(root), {
      name: 'engine-test-entry',
      resolveId: id => id === 'virtual:test' ? '\0virtual:test' : undefined,
      load: id => id === '\0virtual:test' ? 'export {}' : undefined,
    }],
    build: { write: false, rolldownOptions: { input: 'virtual:test' } },
  })
}

/**
 * 声明后置生成脚本的真实子插件，避免依赖插件工厂偶然加载顺序。
 */
function scriptPlugin(root, files) {
  configure(root, 'workflow', { plugin: true })
  write(root, 'src/workflow/plugin/vite-plugin-scripts/index.ts', `export default () => ({
    name: 'scripts', enforce: 'post',
    generateBundle: { order: 'post', handler() {
      for (const [fileName, source] of ${JSON.stringify(files)})
        this.emitFile({ type: 'asset', fileName, source })
    }}
  })`)
}

/**
 * 将内存构建资产放到独占包内，从另一个项目目录运行真实统一入口。
 */
function runEngine(root, result, ...args) {
  for (const asset of result.output.filter(item => item.type === 'asset'))
    write(root, `package/${asset.fileName}`, asset.source)
  mkdirSync(join(root, 'project with space'), { recursive: true })
  /**
   * 工作目录独立于包目录，验证入口不会切换业务脚本的项目根。
   */
  const run = spawnSync('bash', [join(root, 'package/engine/install.sh'), ...args], {
    cwd: join(root, 'project with space'),
    encoding: 'utf8',
    timeout: 15_000,
  })
  assert.ifError(run.error)
  return run
}

test('统一入口调用后置子插件的脚本，保留路径字面量、顺序、参数和项目目录', async (t) => {
  /**
   * 文件名包含 Shell 特殊字符，辅助脚本与普通数据提供可观察的副作用。
   */
  const root = fixture(t)
  scriptPlugin(root, [
    ['script/02-second.sh', 'printf "second\\n" >> order\n'],
    ['script/01 \' $(touch injected).sh', 'printf "first\\n" >> order\nprintf "%s\\n" "$PWD" "$@" > arguments\n'],
    ['script/ignored.txt', 'touch ignored\n'],
    ['script/hidden-install.sh', 'touch hidden-ran\n'],
  ])
  /**
   * 真实内存输出必须包含统一入口，且未落盘或执行业务脚本。
   */
  const result = await buildEngine(root)
  assert.ok(result.output.some(item => item.fileName === 'engine/install.sh'))
  assert.ok(result.output.some(item => item.fileName === 'engine/script/hidden-install.sh'))
  assert.equal(existsSync(join(root, 'dist')), false)
  assert.equal(existsSync(join(root, 'order')), false)
  /**
   * 参数也包含 Shell 字面量，只允许业务脚本逐字接收。
   */
  const run = runEngine(root, result, 'value with space', '$(touch injected)')
  assert.equal(run.status, 0, run.stderr)
  assert.equal(readFileSync(join(root, 'project with space/order'), 'utf8'), 'first\nsecond\n')
  assert.equal(readFileSync(join(root, 'project with space/arguments'), 'utf8'), `${join(root, 'project with space')}\nvalue with space\n$(touch injected)\n`)
  assert.equal(existsSync(join(root, 'project with space/injected')), false)
  assert.equal(existsSync(join(root, 'project with space/ignored')), false)
  assert.equal(existsSync(join(root, 'project with space/hidden-ran')), false)
})

test('统一入口保留子脚本失败码并停止后续脚本', async (t) => {
  /**
   * 第二个脚本的标记用于证伪失败后仍继续运行的实现。
   */
  const root = fixture(t)
  scriptPlugin(root, [['a.sh', 'exit 23\n'], ['z.sh', 'touch should-not-run\n']])
  /**
   * 安装后调用失败仍必须返回业务脚本原退出码。
   */
  const run = runEngine(root, await buildEngine(root))
  assert.equal(run.status, 23, run.stderr)
  assert.equal(existsSync(join(root, 'project with space/should-not-run')), false)
})

/**
 * 预检查全部目标，避免前面的业务已执行才发现后续缺件或链接。
 */
for (const invalid of ['missing', 'file-link', 'directory-link']) {
  test(`统一入口拒绝 ${invalid} 且零子脚本执行`, async (t) => {
    /**
     * 先生成完整包，再独立损坏后续目标。
     */
    const root = fixture(t)
    scriptPlugin(root, [['a.sh', 'touch should-not-run\n'], ['nested/z.sh', 'touch should-not-run\n']])
    /**
     * 资产写入临时包，运行时直接读取被修改的同一份材料。
     */
    const result = await buildEngine(root)
    for (const asset of result.output.filter(item => item.type === 'asset'))
      write(root, `package/${asset.fileName}`, asset.source)
    rmSync(join(root, 'package/engine/nested/z.sh'))
    if (invalid === 'file-link') {
      symlinkSync(join(root, 'package/engine/a.sh'), join(root, 'package/engine/nested/z.sh'))
    }
    else if (invalid === 'directory-link') {
      rmSync(join(root, 'package/engine/nested'), { recursive: true })
      write(root, 'external/z.sh', 'touch should-not-run\n')
      symlinkSync(join(root, 'external'), join(root, 'package/engine/nested'), 'dir')
    }
    /**
     * 空资产列表保留刚刚布置的损坏，不重新覆盖文件。
     */
    const run = runEngine(root, { output: [] })
    assert.equal(run.status, 2, run.stderr)
    assert.match(run.stderr, /nested\/z\.sh/u)
    assert.equal(existsSync(join(root, 'project with space/should-not-run')), false)
  })
}

test('无子脚本的入口正常退出，移除插件后不保留旧调用', async (t) => {
  /**
   * 首轮脚本存在，第二轮实际删除插件来源。
   */
  const root = fixture(t)
  scriptPlugin(root, [['removed.sh', 'exit 47\n']])
  assert.equal(runEngine(root, await buildEngine(root)).status, 47)
  rmSync(join(root, 'src/workflow/plugin'), { recursive: true })
  /**
   * 重建包不保留首轮脚本，也不能再调用首轮路径。
   */
  const result = await buildEngine(root)
  rmSync(join(root, 'package'), { recursive: true })
  assert.equal(runEngine(root, result).status, 0)
})

test('子插件占用统一入口路径时构建报错', async (t) => {
  /**
   * 入口由引擎独占，不能被子插件静默替换。
   */
  const root = fixture(t)
  scriptPlugin(root, [['install.sh', 'exit 0\n']])
  await assert.rejects(buildEngine(root), /engine\/install\.sh/u)
})
