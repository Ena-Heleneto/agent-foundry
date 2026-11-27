import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { createSandbox } from './sandbox.mjs'

/**
 * 本次实验使用的真实包根，只读取技能、构建配置和运行脚本。
 */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))
/**
 * 独立从已获准分类的源目录枚举期望名单，不冻结其他 Spec 正在增量移交的技能数量。
 */
const expectedNames = ['coding', 'frontend'].flatMap(category => fs.readdirSync(path.join(packageRoot, 'src/skills', category))).sort()

/**
 * 独立读取普通文件的字节，以实际目录集合检查附件和未选内容。
 * @param {string} directory 待比较目录。
 * @returns {Record<string, string>} 排序后的相对路径及 base64 内容。
 */
function bytes(directory) {
  return Object.fromEntries(fs.readdirSync(directory, { recursive: true }).sort()
    .filter(file => fs.lstatSync(path.join(directory, file)).isFile())
    .map(file => [file.split(path.sep).join('/'), fs.readFileSync(path.join(directory, file)).toString('base64')]))
}

/**
 * 执行真实官方 CLI；所有目录、缓存与用户变量均使用测试沙箱。
 * @param {object} sandbox 隔离消费环境。
 * @param {string[]} args 完整进程参数。
 * @returns {string} 标准输出，非零退出保留实际诊断。
 */
function official(sandbox, args) {
  /**
   * 官方 CLI 的真实执行结果，遥测只在本次进程关闭。
   */
  const result = spawnSync(process.execPath, args, {
    cwd: sandbox.project,
    env: { ...sandbox.env, CI: '1', DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1', NO_COLOR: '1' },
    encoding: 'utf8',
    timeout: 30000,
  })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  return result.stdout
}

test('内容导出骨架可复现、可独立安装，并拒绝缺件与越界来源', async (t) => {
  /**
   * 先检查实际实现存在；初次失败必须明确指向尚未交付的插件。
   */
  const pluginFile = path.join(packageRoot, 'build/plugins/distribution.ts')
  assert.ok(fs.existsSync(pluginFile), '缺少内容导出构建插件，尚不能生成可独立消费的清单')
  /**
   * 工具版本固定，缺少官方包时失败而不是跳过原生安装。
   */
  const officialPackage = process.env.FOUNDRY_SKILLS_PACKAGE
  assert.ok(officialPackage, '必须提供 FOUNDRY_SKILLS_PACKAGE（已准备的官方 skills npm 包目录）')
  assert.match(JSON.parse(fs.readFileSync(path.join(officialPackage, 'package.json'))).version, /^\d+\.\d+\.\d+$/u)
  /**
   * 编译构建期插件仅供 Node 实验加载，不处理产品运行脚本。
   */
  const harness = createSandbox()
  try {
    await build({
      configFile: false,
      logLevel: 'silent',
      build: { ssr: pluginFile, outDir: path.join(harness.root, 'plugin'), rollupOptions: { output: { entryFileNames: 'index.mjs' } } },
      ssr: { noExternal: true },
    })
    /**
     * 测试实际编译后的插件与只读产物校验入口。
     */
    const { SkillsDistributionPlugin, verifyContent, parseRelease } = await import(pathToFileURL(path.join(harness.root, 'plugin/index.mjs')).href)
    /**
     * 固定源码提交来自当前工作区，不伪造远端发布地址或提交。
     */
    const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: packageRoot, encoding: 'utf8' })
    assert.equal(revision.status, 0, revision.stderr)
    /**
     * 每个分支独占源与产物；完整读取实际 coding/frontend 内容。
     * @returns {ReturnType<typeof createSandbox>} 构建夹具。
     */
    function fixture() {
      /**
       * 含真实配置、两类内容源、脚本及版本的独立包目录。
       */
      const sandbox = createSandbox()
      fs.cpSync(path.join(packageRoot, 'src'), path.join(sandbox.project, 'src'), { recursive: true })
      fs.cpSync(path.join(packageRoot, 'script'), path.join(sandbox.project, 'script'), { recursive: true })
      fs.cpSync(path.join(packageRoot, 'build'), path.join(sandbox.project, 'build'), { recursive: true })
      fs.copyFileSync(path.join(packageRoot, 'vite.config.ts'), path.join(sandbox.project, 'vite.config.ts'))
      fs.symlinkSync(path.join(packageRoot, 'node_modules'), path.join(sandbox.project, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
      fs.writeFileSync(path.join(sandbox.project, 'package.json'), '{"type":"module","version":"0.1.0"}')
      return sandbox
    }
    /**
     * 用同一真实配置构建，并显式接入 T051 的开发验证插件。
     * @param {object} sandbox 当前分支构建沙箱。
     * @param {import('vite').Plugin[]} extraPlugins 在导出前修改生成物的故障夹具。
     * @returns {Promise<unknown>} 完整 Vite 构建结果。
     */
    function compile(sandbox, extraPlugins = []) {
      return build({
        root: sandbox.project,
        configFile: path.join(sandbox.project, 'vite.config.ts'),
        logLevel: 'silent',
        plugins: [...extraPlugins, new SkillsDistributionPlugin({ categories: ['coding', 'frontend'], version: '0.1.0', sourceRevision: revision.stdout.trim() })],
      })
    }

    await t.test('连续构建摘要一致，白名单副本搬离源码后官方安装字节完整', async () => {
      /**
       * 构建者与消费方拥有不同的项目和用户目录。
       */
      const source = fixture()
      /**
       * 实际官方安装的独立消费环境。
       */
      const consumer = createSandbox()
      try {
        fs.appendFileSync(path.join(source.project, 'src/skills/frontend/vue-reactivity/SKILL.md'), '\n示例：`[mvu.md](mvu.md)`。读取目标项目的[宪章](.specify/memory/constitution.md)，配合[样式技能][style]。\n\n[style]: ../nuxt-ui-styling/SKILL.md\n\n```md\n[代码示例](missing-example.md)\n```\n')
        await compile(source)
        /**
         * 第一次构建的全目录快照，用于独立比较连续构建。
         */
        const first = bytes(path.join(source.project, 'dist'))
        await compile(source)
        assert.deepEqual(bytes(path.join(source.project, 'dist')), first)
        /**
         * 清单只声明本项已验证的三技能、两种投影与开发边界。
         */
        const manifest = JSON.parse(fs.readFileSync(path.join(source.project, 'dist/release.json')))
        assert.equal(typeof parseRelease, 'function', '导出需复用正式 Release 模型校验')
        assert.deepEqual(parseRelease(manifest), manifest)
        assert.deepEqual(Object.keys(manifest.projections).sort(), ['eve-frontmatter-v1', 'identity'])
        assert.deepEqual(manifest.skills.find(skill => skill.name === 'vue-reactivity').projectPrerequisites, ['.specify/memory/constitution.md'])
        assert.deepEqual(manifest.skills.find(skill => skill.name === 'vue-reactivity').requiresSkills, ['nuxt-ui-styling'])
        assert.equal(manifest.development, true)
        assert.equal(manifest.sourceRevision, revision.stdout.trim())
        assert.deepEqual(manifest.skills.map(skill => skill.name).sort(), expectedNames)
        assert.ok(!manifest.files.some(file => /(?:^|\/)(?:eval|workflow|mcp|\.specify|\.agents|node_modules)(?:\/|$)/u.test(file.path)))
        assert.ok(manifest.files.some(file => file.path === 'script/index.mjs'))
        assert.ok(!manifest.files.some(file => file.path === 'agents.json'))
        assert.ok(manifest.adapters.some(file => file.path === 'script/install-skills/read-agents.mjs'))
        /**
         * 只迁移声明文件及清单本身，保留与完整 dist 的边界。
         */
        const release = path.join(consumer.root, 'detached release')
        /**
         * 当前白名单路径不能由完整 dist 的其他内容隐式补齐。
         */
        for (const file of [...manifest.files.map(item => item.path), 'release.json']) {
          fs.mkdirSync(path.dirname(path.join(release, file)), { recursive: true })
          fs.copyFileSync(path.join(source.project, 'dist', file), path.join(release, file))
        }
        /**
         * 逐个声明文件独立验证字节数与 SHA-256。
         */
        for (const file of manifest.files) {
          /**
           * 迁移副本的实际字节，由 Node 标准库独立计算预期摘要。
           */
          const data = fs.readFileSync(path.join(release, file.path))
          assert.equal(data.length, file.bytes)
          assert.equal(createHash('sha256').update(data).digest('hex'), file.sha256)
        }
        source.cleanup()
        assert.equal(fs.existsSync(path.join(release, 'node_modules')), false)
        verifyContent(release, manifest)
        official(consumer, [path.join(officialPackage, 'bin/cli.mjs'), 'add', release, '--agent', 'codex', '--skill', ...expectedNames, '--copy', '--yes'])
        assert.deepEqual(fs.readdirSync(path.join(consumer.project, '.agents/skills')).sort(), expectedNames)
        /**
         * 各技能真实安装文件集合必须与迁移副本逐字节一致。
         */
        for (const skill of manifest.skills)
          assert.deepEqual(bytes(path.join(consumer.project, '.agents/skills', skill.name)), bytes(path.join(release, skill.directory)))
        official(consumer, [path.join(release, 'script/index.mjs'), '--help'])
        /**
         * 缺件与字节漂移都必须由独立副本校验明确拒绝。
         */
        const attachment = manifest.files.find(file => file.path.endsWith('test-prompts.md'))
        assert.ok(attachment)
        fs.appendFileSync(path.join(release, attachment.path), 'tampered')
        assert.throws(() => verifyContent(release, manifest), /摘要|长度|完整/u)
        fs.rmSync(path.join(release, attachment.path))
        assert.throws(() => verifyContent(release, manifest), /缺少|不存在|ENOENT/u)
      }
      finally {
        source.cleanup()
        consumer.cleanup()
      }
    })

    await t.test('复制后的父目录链接在任何重建前拒绝，外部文件保持原样', async () => {
      /**
       * 链接目标位于输出根之外，但仍由本测试沙箱独占。
       */
      const sandbox = fixture()
      /**
       * 输出外的副本保留额外哨兵，检出先删除再校验的错误顺序。
       */
      const outside = path.join(sandbox.root, 'outside-coding')
      /**
       * 导出执行前保存实际字节，之后不能只检查错误消息。
       */
      let before
      /**
       * 在复制完成后、正式导出前插入链接，模拟其他插件改变父目录。
       */
      function replaceOutputParent() {
        fs.renameSync(path.join(sandbox.project, 'dist/skills/coding'), outside)
        fs.writeFileSync(path.join(outside, 'document-changed-symbols/keep-outside.txt'), '不得修改输出根外的文件')
        before = bytes(outside)
        fs.symlinkSync(outside, path.join(sandbox.project, 'dist/skills/coding'), process.platform === 'win32' ? 'junction' : 'dir')
      }
      try {
        await assert.rejects(compile(sandbox, [{
          name: 'test-output-parent-link',
          enforce: 'post',
          writeBundle: {
            order: 'post',
            sequential: true,
            handler: replaceOutputParent,
          },
        }]), /符号链接|链接/u)
        assert.ok(before)
        assert.deepEqual(bytes(outside), before)
      }
      finally {
        sandbox.cleanup()
      }
    })

    /**
     * 每种故障修改真实源文件，让完整构建承担拒绝责任。
     */
    const failures = [
      ['缺少必要附件', sandbox => fs.rmSync(path.join(sandbox.project, 'src/skills/coding/document-changed-symbols/references/test-prompts.md')), /附件|引用/u],
      ['缺少声明脚本', sandbox => fs.rmSync(path.join(sandbox.project, 'script/index.mjs')), /脚本|入口|ENOENT/u],
      ['附件链接指向源目录外', sandbox => fs.symlinkSync(path.join(sandbox.project, 'package.json'), path.join(sandbox.project, 'src/skills/coding/document-changed-symbols/references/outside.json')), /符号链接|链接/u],
      ['本地引用越界', sandbox => fs.appendFileSync(path.join(sandbox.project, 'src/skills/frontend/vue-reactivity/SKILL.md'), '\n[越界](../../../../package.json)\n'), /越界|引用/u],
      ['引用式必要附件缺失', sandbox => fs.appendFileSync(path.join(sandbox.project, 'src/skills/frontend/vue-reactivity/SKILL.md'), '\n[必要附件][missing]\n\n[missing]: references/missing.md\n'), /附件|引用/u],
      ['大小写路径冲突', sandbox => fs.writeFileSync(path.join(sandbox.project, 'src/skills/coding/document-changed-symbols/references/TEST-PROMPTS.md'), 'conflict'), /大小写|冲突/u],
    ]
    /**
     * 故障名称、真实源修改和预期诊断随同一个分支执行。
     */
    for (const [name, mutate, expected] of failures) {
      await t.test(name, async () => {
        /**
         * 故障源独立构建，不污染真实技能或其他分支。
         */
        const sandbox = fixture()
        try {
          mutate(sandbox)
          await assert.rejects(compile(sandbox), expected)
          assert.equal(fs.existsSync(path.join(sandbox.project, 'dist/release.json')), false)
        }
        finally {
          sandbox.cleanup()
        }
      })
    }
  }
  finally {
    harness.cleanup()
  }
})
