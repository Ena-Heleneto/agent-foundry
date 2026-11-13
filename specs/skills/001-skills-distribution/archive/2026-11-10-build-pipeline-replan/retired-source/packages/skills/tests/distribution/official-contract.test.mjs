import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test, { after, before } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { build } from 'vite'
import { createSandbox } from './sandbox.mjs'
import './release-models.test.mjs'
import './official-preflight.test.mjs'
import './online-agents.test.mjs'

/**
 * 当前包的真实构建插件与运行脚本来源，测试不修改源文件。
 */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))
/**
 * 调度器显式传入来源；本项使用受控本地契约样本，不冒报远端通过。
 */
const { values: sourceOptions } = parseArgs({ options: { source: { type: 'string', default: 'local' } } })
/**
 * 官方固定版本的已准备 npm 包，缺失时明确失败。
 */
const officialPackage = process.env.FOUNDRY_SKILLS_PACKAGE
/**
 * 编译构建期插件的独立根，与所有消费目标分开。
 */
const harness = createSandbox()
/**
 * 当前真实源码基点；开发清单不伪造远端提交。
 */
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: packageRoot, encoding: 'utf8' })
/**
 * 待实际编译后加载的 T051 生产插件。
 */
let DistributionPlugin

after(() => harness.cleanup())
before(async () => {
  assert.equal(sourceOptions.source, 'local', '本项为本地契约样本，真实远端由后续发布任务验证')
  assert.ok(officialPackage, '需要 FOUNDRY_SKILLS_PACKAGE 指向 skills@1.7.4 npm 包')
  assert.match(JSON.parse(fs.readFileSync(path.join(officialPackage, 'package.json'))).version, /^\d+\.\d+\.\d+$/u)
  assert.ifError(revision.error)
  assert.equal(revision.status, 0, revision.stderr)
  await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      ssr: path.join(packageRoot, 'build/plugins/distribution.ts'),
      outDir: path.join(harness.root, 'plugin'),
      rollupOptions: { output: { entryFileNames: 'index.mjs' } },
    },
    ssr: { noExternal: true },
  })
  DistributionPlugin = (await import(pathToFileURL(path.join(harness.root, 'plugin/index.mjs')).href)).SkillsDistributionPlugin
})

/**
 * 独立读取目录、链接及文件字节，连空目录新增也计入只读检查。
 * @param {string} directory 沙箱目录。
 * @returns {Record<string, string>} 排序后的相对路径及类型、链接目标或原始字节。
 */
function tree(directory) {
  if (!fs.existsSync(directory))
    return {}
  return Object.fromEntries(fs.readdirSync(directory, { recursive: true }).sort().map((file) => {
    /**
     * lstat 读取条目自身，不能将新建链接误认为目录没有变化。
     */
    const absolute = path.join(directory, file)
    /**
     * 文件类型与字节都进入快照。
     */
    const stat = fs.lstatSync(absolute)
    return [file.split(path.sep).join('/'), stat.isSymbolicLink() ? `link:${fs.readlinkSync(absolute)}` : stat.isDirectory() ? 'directory' : `file:${fs.readFileSync(absolute).toString('base64')}`]
  }))
}

/**
 * 生成带二进制附件的受控技能，声明名称与目录名称可独立指定。
 * @param {string} root 临时包根。
 * @param {string} category 公开分类或内部 eval。
 * @param {string} directory 源目录名。
 * @param {string} name frontmatter 声明身份。
 */
function writeSkill(root, category, directory, name) {
  /**
   * 本技能的临时源目录。
   */
  const source = path.join(root, 'src/skills', category, directory)
  fs.mkdirSync(path.join(source, 'references'), { recursive: true })
  fs.writeFileSync(path.join(source, 'SKILL.md'), `---\nname: ${name}\ndescription: 按需交付契约样本\n---\n\n正文与[附件](references/data.bin)。\n`)
  fs.writeFileSync(path.join(source, 'references/data.bin'), Buffer.from([0, 1, 128, 255]))
}

/**
 * 复用 MVU-A 沙箱建立三分类及 eval 对照，不读取未交付主线模式。
 * @param {{alias?: boolean, emptyWorkflow?: boolean}} options 当前场景的源变化。
 * @returns {ReturnType<typeof createSandbox>} 可直接按真实配置构建的包夹具。
 */
function fixture(options = {}) {
  /**
   * 当前场景独占的包根及测试用户。
   */
  const sandbox = createSandbox()
  /**
   * 公开分类、内部分类和空 MCP 源分别保留为真实目录。
   */
  for (const directory of ['src/mcp', 'src/skills/coding', 'src/skills/frontend', 'src/skills/workflow', 'src/skills/eval'])
    fs.mkdirSync(path.join(sandbox.project, directory), { recursive: true })
  writeSkill(sandbox.project, 'coding', options.alias ? 'directory-alias' : 'alpha-skill', 'alpha-skill')
  writeSkill(sandbox.project, 'frontend', 'beta-skill', 'beta-skill')
  if (!options.emptyWorkflow)
    writeSkill(sandbox.project, 'workflow', 'gamma-skill', 'gamma-skill')
  writeSkill(sandbox.project, 'eval', 'internal-skill', 'internal-skill')
  fs.cpSync(path.join(packageRoot, 'build'), path.join(sandbox.project, 'build'), { recursive: true })
  fs.cpSync(path.join(packageRoot, 'script'), path.join(sandbox.project, 'script'), { recursive: true })
  fs.copyFileSync(path.join(packageRoot, 'vite.config.ts'), path.join(sandbox.project, 'vite.config.ts'))
  fs.symlinkSync(path.join(packageRoot, 'node_modules'), path.join(sandbox.project, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
  fs.writeFileSync(path.join(sandbox.project, 'package.json'), '{"type":"module","version":"0.1.0"}')
  return sandbox
}

/**
 * 同一真实构建中接入 T051 骨架，不靠测试内的假清单代替导出行为。
 * @param {object} sandbox 源夹具。
 * @returns {Promise<unknown>} Vite 构建结果。
 */
function compile(sandbox) {
  return build({
    root: sandbox.project,
    configFile: path.join(sandbox.project, 'vite.config.ts'),
    logLevel: 'silent',
    plugins: [new DistributionPlugin({ categories: ['coding', 'frontend', 'workflow'], version: '0.1.0', sourceRevision: revision.stdout.trim() })],
  })
}

/**
 * 只迁移白名单及清单，完整 dist 中的 eval 不进入官方公开来源。
 * @param {object} sandbox 已构建的源夹具。
 * @returns {{root: string, manifest: object}} 独立交付根和真实开发清单。
 */
function migrate(sandbox) {
  /**
   * 与源码目录分离的发布样本。
   */
  const root = path.join(sandbox.root, 'release')
  /**
   * 实际生成的清单，不从目录名推导期望选择。
   */
  const manifest = JSON.parse(fs.readFileSync(path.join(sandbox.project, 'dist/release.json')))
  /**
   * 迁移只消费实际清单白名单，不复制其他 dist 内容。
   */
  for (const file of [...manifest.files.map(item => item.path), 'release.json']) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.copyFileSync(path.join(sandbox.project, 'dist', file), path.join(root, file))
  }
  return { root, manifest }
}

/**
 * 启动真实 Node 子进程，输出和退出码分别由契约断言判断。
 * @param {object} sandbox 隔离项目及用户。
 * @param {string[]} args 进程参数，不经过 shell。
 * @returns {import('node:child_process').SpawnSyncReturns<string>} 实际执行结果。
 */
function run(sandbox, args) {
  /**
   * 官方 CLI 与本包入口均不取得真实用户目录或遥测配置。
   */
  const result = spawnSync(process.execPath, args, {
    cwd: sandbox.project,
    env: { ...sandbox.env, CI: '1', DO_NOT_TRACK: '1', DISABLE_TELEMETRY: '1', NO_COLOR: '1' },
    encoding: 'utf8',
    timeout: 30000,
  })
  assert.ifError(result.error)
  assert.equal(result.signal, null, result.stderr)
  return result
}

/**
 * 使用唯一公开入口执行只读官方预检，禁止由测试替身实现选择逻辑。
 * @param {object} consumer 独立消费环境。
 * @param {string} release 白名单交付根。
 * @param {string[]} selection 本次显式选择。
 * @returns {import('node:child_process').SpawnSyncReturns<string>} 预检原始结果。
 */
function preflight(consumer, release, selection) {
  return run(consumer, [path.join(release, 'script/index.mjs'), '--check', '--official', '--source-dir', release, '--version', '0.1.0', '--agent', 'codex', ...selection])
}

test('官方四种粒度与重复选择只安装所选技能，二进制附件和已有其他技能完整', async (t) => {
  /**
   * 真实样本的精确官方来源与选择，不使用官方 --all 扩大 agent 范围。
   */
  const cases = [
    ['整包', '', ['*'], ['alpha-skill', 'beta-skill', 'gamma-skill']],
    ['分类', 'skills/frontend', ['*'], ['beta-skill']],
    ['单技能', 'skills/coding/alpha-skill', ['alpha-skill'], ['alpha-skill']],
    ['多个及重复', '', ['alpha-skill', 'beta-skill', 'alpha-skill'], ['alpha-skill', 'beta-skill']],
  ]
  /**
   * 逐个粒度传入原生来源、选择及独立期望集合。
   */
  for (const [name, subdirectory, selected, expected] of cases) {
    await t.test(name, async () => {
      /**
       * 发布样本和安装目标分开，逐场景验证零未选新增。
       */
      const source = fixture()
      /**
       * 官方安装专用消费环境。
       */
      const consumer = createSandbox()
      try {
        await compile(source)
        /**
         * 迁移后的实际清单及白名单根。
         */
        const release = migrate(source)
        fs.mkdirSync(path.join(consumer.project, '.agents/skills/existing'), { recursive: true })
        fs.writeFileSync(path.join(consumer.project, '.agents/skills/existing/SKILL.md'), '用户已有技能')
        /**
         * 不在本次选择内的用户文件哨兵。
         */
        const existing = tree(path.join(consumer.project, '.agents/skills/existing'))
        /**
         * 官方原生实际执行，不把本包预检错误混作官方错误。
         */
        const result = run(consumer, [path.join(officialPackage, 'bin/cli.mjs'), 'add', path.join(release.root, subdirectory), '--skill', ...selected, '--agent', 'codex', '--copy', '--yes'])
        assert.equal(result.status, 0, result.stdout + result.stderr)
        assert.deepEqual(fs.readdirSync(path.join(consumer.project, '.agents/skills')).sort(), [...expected, 'existing'].sort())
        assert.deepEqual(tree(path.join(consumer.project, '.agents/skills/existing')), existing)
        /**
         * 每个实际安装技能都必须包含原有完整目录和附件字节。
         */
        for (const name of expected) {
          /**
           * 每个技能由真实文件集合逐字节核对，不能只检查入口存在。
           */
          const skill = release.manifest.skills.find(item => item.name === name)
          assert.ok(skill)
          assert.deepEqual(tree(path.join(consumer.project, '.agents/skills', name)), tree(path.join(release.root, skill.directory)))
        }
        assert.equal(fs.existsSync(path.join(release.root, 'skills/eval')), false)
      }
      finally {
        consumer.cleanup()
        source.cleanup()
      }
    })
  }
})

test('官方分类列出不写目标，只展示分类内声明名并排除 eval', async () => {
  /**
   * 列出操作只读取交付副本，不产生安装文件。
   */
  const source = fixture()
  /**
   * 保留已有文件的独立列出目标。
   */
  const consumer = createSandbox()
  try {
    await compile(source)
    /**
     * 已构建的白名单公开样本。
     */
    const release = migrate(source)
    fs.writeFileSync(path.join(consumer.project, 'keep.txt'), '用户内容')
    /**
     * 包含全部现有项目文件的只读基线。
     */
    const before = tree(consumer.root)
    /**
     * 原生 --list 不传本包的 hidden/no-mount 等参数。
     */
    const result = run(consumer, [path.join(officialPackage, 'bin/cli.mjs'), 'add', path.join(release.root, 'skills/frontend'), '--list'])
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.match(result.stdout, /beta-skill/u)
    assert.doesNotMatch(result.stdout, /alpha-skill|gamma-skill|internal-skill/u)
    assert.deepEqual(tree(consumer.root), before)
  }
  finally {
    consumer.cleanup()
    source.cleanup()
  }
})

test('声明名与目录名不同仍生成可用于同一安装契约的规范路径', async () => {
  /**
   * 用真实来源目录别名验证身份，不能只测标准目录的偶然相等。
   */
  const source = fixture({ alias: true })
  try {
    await compile(source)
    /**
     * 正式交付约定按声明名称组织目录，供两入口共用。
     */
    const release = migrate(source)
    assert.equal(release.manifest.skills.find(skill => skill.name === 'alpha-skill')?.directory, 'skills/coding/alpha-skill', '应按声明名规范导出目录，不能把目录别名当安装身份')
    assert.ok(fs.existsSync(path.join(release.root, 'skills/coding/alpha-skill/references/data.bin')))
  }
  finally {
    source.cleanup()
  }
})

test('本包官方预检成功时不安装、不写收据或改动用户内容', async () => {
  /**
   * 本项调用当前生产 Node/平台入口，不使用 MVU-A 的选择 helper 代替实现。
   */
  const source = fixture()
  /**
   * 可对照完整文件集合的预检目标。
   */
  const consumer = createSandbox()
  try {
    await compile(source)
    /**
     * 本次版本与选择的真实发布样本。
     */
    const release = migrate(source)
    fs.writeFileSync(path.join(consumer.project, 'keep.txt'), '用户内容')
    /**
     * 预检前的项目与隔离用户目录快照。
     */
    const before = tree(consumer.root)
    /**
     * 只读预检应成功且不给官方 CLI 加本包参数。
     */
    const result = preflight(consumer, release.root, ['--skill', 'alpha-skill', '--skill', 'alpha-skill'])
    assert.deepEqual(tree(consumer.root), before)
    assert.equal(result.status, 0, `只读预检尚未接通：${result.stderr}${result.stdout}`)
    assert.doesNotMatch(result.stderr, /未知.*--check/u)
  }
  finally {
    consumer.cleanup()
    source.cleanup()
  }
})

test('静态选择错误明确诊断且目标零写入，不退回整包', async (t) => {
  /**
   * 每种错误都检查实际诊断，不能靠统一拒绝 --check 假装规则通过。
   */
  const cases = [
    ['未选择', [], /选择|必须.*(?:all|category|skill)/iu],
    ['混用选择', ['--all', '--skill', 'alpha-skill'], /互斥|只能|混用/u],
    ['空名称', ['--skill', ''], /空|缺值|名称/u],
    ['混合未知名称', ['--skill', 'alpha-skill', '--skill', 'missing-skill'], /missing-skill/u],
    ['内部 eval 分类', ['--category', 'eval'], /eval/u],
    ['内部 eval 名称', ['--skill', 'internal-skill'], /internal-skill/u],
    ['空的公开分类', ['--category', 'workflow'], /workflow|分类.*空/u],
  ]
  /**
   * 每个无效选择分别要求对应诊断，不能混淆为入口尚未实现。
   */
  for (const [name, selection, diagnostic] of cases) {
    await t.test(name, async () => {
      /**
       * 已知 workflow 分类为空，其他选择仍有合法对照技能。
       */
      const source = fixture({ emptyWorkflow: true })
      /**
       * 不得因错误选择写入任何文件的消费目标。
       */
      const consumer = createSandbox()
      try {
        await compile(source)
        /**
         * 与当前错误输入同版的公开样本。
         */
        const release = migrate(source)
        /**
         * 错误前的用户与项目完整文件集合。
         */
        const before = tree(consumer.root)
        /**
         * 静态错误应返回 2 并给具体选择条件。
         */
        const result = preflight(consumer, release.root, selection)
        assert.deepEqual(tree(consumer.root), before)
        assert.equal(result.status, 2, result.stdout + result.stderr)
        assert.match(result.stderr + result.stdout, diagnostic)
        assert.doesNotMatch(result.stderr, /未知.*--check/u, '缺少预检实现不等于正确识别选择错误')
      }
      finally {
        consumer.cleanup()
        source.cleanup()
      }
    })
  }
})

test('选择缺少依赖时列出缺项，不自动补装其他技能', async () => {
  /**
   * 受控依赖场景直接修改声明清单，避免臆造技能 frontmatter 依赖语法。
   */
  const source = fixture()
  /**
   * 依赖错误的独立消费环境。
   */
  const consumer = createSandbox()
  try {
    await compile(source)
    /**
     * 文件内容与摘要不变，仅设置已约定的 requiresSkills 元数据。
     */
    const release = migrate(source)
    release.manifest.skills.find(skill => skill.name === 'alpha-skill').requiresSkills = ['beta-skill']
    fs.writeFileSync(path.join(release.root, 'release.json'), `${JSON.stringify(release.manifest, null, 2)}\n`)
    /**
     * 依赖预检之前的目标基线。
     */
    const before = tree(consumer.root)
    /**
     * 只选 alpha 必须指出 beta，不能静默安装它。
     */
    const result = preflight(consumer, release.root, ['--skill', 'alpha-skill'])
    assert.deepEqual(tree(consumer.root), before)
    assert.equal(result.status, 2, result.stdout + result.stderr)
    assert.match(result.stderr + result.stdout, /beta-skill/u)
    assert.doesNotMatch(result.stderr, /未知.*--check/u)
  }
  finally {
    consumer.cleanup()
    source.cleanup()
  }
})

/**
 * 缺件与冲突使用真实源变化，构建必须在生成成功清单前拒绝。
 */
const sourceFailures = [
  ['必需附件会被官方过滤', (source) => {
    fs.renameSync(path.join(source.project, 'src/skills/coding/alpha-skill/references/data.bin'), path.join(source.project, 'src/skills/coding/alpha-skill/metadata.json'))
    /**
     * 引用必须仍指向实际存在的文件，不能用普通缺件错误冒充过滤检查。
     */
    const document = path.join(source.project, 'src/skills/coding/alpha-skill/SKILL.md')
    fs.writeFileSync(document, fs.readFileSync(document, 'utf8').replace('references/data.bin', 'metadata.json'))
  }, /官方安装会排除技能内容：metadata\.json/u],
  ['附件路径大小写冲突', source => fs.writeFileSync(path.join(source.project, 'src/skills/coding/alpha-skill/references/DATA.bin'), 'conflict'), /大小写|冲突/u],
  ['跨分类声明重名', source => writeSkill(source.project, 'frontend', 'duplicate', 'alpha-skill'), /重复/u],
]
/**
 * 每种源故障都独立构建，保留其具体断言和失败原因。
 */
for (const [name, mutate, diagnostic] of sourceFailures) {
  test(name, async () => {
    /**
     * 当前源故障的独立构建夹具。
     */
    const source = fixture()
    try {
      mutate(source)
      await assert.rejects(compile(source), diagnostic)
      assert.equal(fs.existsSync(path.join(source.project, 'dist/release.json')), false)
    }
    finally {
      source.cleanup()
    }
  })
}
