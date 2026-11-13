import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { createSandbox } from './sandbox.mjs'

/**
 * 真实配置、构建插件及安装脚本所在包根目录。
 */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))
/**
 * 默认分发构建使用真实 frontmatter 和可转换的 Eve 元数据。
 */
const demoContent = '---\nname: demo\ndescription: 构建示例\ndestructive: false\n---\n\n# 线下技能\n[附件](references/example.txt)\n'

/**
 * 构造两个内容源及真实安装脚本；示例文本只用于验证复制，不定义 MCP 业务范围。
 * @returns {ReturnType<typeof createSandbox>} 临时项目及清理入口。
 */
function createFixture() {
  /**
   * 本次构建独占的临时目录。
   */
  const fixture = createSandbox()
  try {
    fs.mkdirSync(path.join(fixture.project, 'src/skills/coding/demo/references'), { recursive: true })
    fs.mkdirSync(path.join(fixture.project, 'src/mcp'), { recursive: true })
    fs.mkdirSync(path.join(fixture.project, 'src/skills/frontend'), { recursive: true })
    fs.writeFileSync(path.join(fixture.project, 'src/skills/coding/demo/SKILL.md'), demoContent)
    fs.writeFileSync(path.join(fixture.project, 'src/skills/coding/demo/references/example.txt'), '附属资料')
    fs.writeFileSync(path.join(fixture.project, 'src/mcp/example.txt'), '线上内容测试夹具')
    fs.writeFileSync(path.join(fixture.project, 'src/mcp/.gitkeep'), '')
    fs.copyFileSync(path.join(packageRoot, 'vite.config.ts'), path.join(fixture.project, 'vite.config.ts'))
    fs.cpSync(path.join(packageRoot, 'build'), path.join(fixture.project, 'build'), { recursive: true })
    fs.cpSync(path.join(packageRoot, 'script'), path.join(fixture.project, 'script'), { recursive: true })
    fs.cpSync(path.join(packageRoot, 'src/skills/workflow'), path.join(fixture.project, 'src/skills/workflow'), { recursive: true })
    fs.symlinkSync(path.join(packageRoot, 'node_modules'), path.join(fixture.project, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
    fs.writeFileSync(path.join(fixture.project, 'package.json'), '{"type":"module","version":"0.1.0"}')
    /**
     * 临时仓库提供真实的开发源码基点，不伪造远端提交。
     */
    for (const args of [['init', '--quiet'], ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '--allow-empty', '-m', 'fixture']]) {
      /**
       * Git 仅写当前测试沙箱，配置不落到全局。
       */
      const result = spawnSync('git', args, { cwd: fixture.project, env: fixture.env, encoding: 'utf8' })
      assert.equal(result.status, 0, result.stderr)
    }
    return fixture
  }
  catch (error) {
    fixture.cleanup()
    throw error
  }
}

/**
 * 单次使用真实配置构建全部产物，不通过 mode 选择交付范围。
 * @param {string} root 临时包根目录。
 * @returns {ReturnType<typeof build>} 实际构建结果。
 */
function buildFixture(root) {
  return build({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'silent' })
}

test('一次构建同时交付 mcp、skills 与 script，不输出旧 manifest 或空 JS', async () => {
  /**
   * 包含两类源内容的构建夹具。
   */
  const fixture = createFixture()
  try {
    await buildFixture(fixture.project)
    assert.deepEqual(fs.readdirSync(path.join(fixture.project, 'dist')).sort(), ['mcp', 'projections', 'release.json', 'script', 'skills'])
    assert.equal(fs.readFileSync(path.join(fixture.project, 'dist/mcp/example.txt'), 'utf8'), '线上内容测试夹具')
    assert.equal(fs.readFileSync(path.join(fixture.project, 'dist/skills/coding/demo/SKILL.md'), 'utf8'), demoContent)
    assert.equal(fs.readFileSync(path.join(fixture.project, 'dist/skills/coding/demo/references/example.txt'), 'utf8'), '附属资料')
    assert.equal(fs.existsSync(path.join(fixture.project, 'dist/mcp/.gitkeep')), false)
    fs.writeFileSync(path.join(fixture.project, 'dist/manifest.json'), '{}')
    fs.rmSync(path.join(fixture.project, 'src/mcp/example.txt'))
    await buildFixture(fixture.project)
    assert.equal(fs.existsSync(path.join(fixture.project, 'dist/manifest.json')), false)
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(fixture.project, 'dist/mcp/manifest.json'), 'utf8')), { version: 1, skills: [] })
  }
  finally {
    fixture.cleanup()
  }
})

test('构建原样复制脚本，不解析依赖或执行入口', async () => {
  /**
   * 缺少运行依赖的脚本仍应能够作为普通文件交付。
   */
  const fixture = createFixture()
  try {
    /**
     * 静态依赖故意不存在；构建若尝试打包便会失败。
     */
    const source = 'import \'foundry-missing-runtime-dependency\'; throw new Error(\'构建不得执行脚本\')\n'
    fs.writeFileSync(path.join(fixture.project, 'script/runtime-example.mjs'), source)
    fs.writeFileSync(path.join(fixture.project, 'script/runtime-example.ts'), 'export const value: number = 1\n')
    fs.writeFileSync(path.join(fixture.project, 'script/runtime-example.json'), '{"runtime":true}\n')
    await buildFixture(fixture.project)
    /**
     * 各种运行文件保持原始字节，不依赖脚本后缀白名单或代码转换。
     */
    for (const file of ['runtime-example.mjs', 'runtime-example.ts', 'runtime-example.json']) {
      assert.deepEqual(fs.readFileSync(path.join(fixture.project, 'dist/script', file)), fs.readFileSync(path.join(fixture.project, 'script', file)))
    }
  }
  finally {
    fixture.cleanup()
  }
})

test('交付命令脚本脱离源码可执行，不包含测试或缓存', async () => {
  /**
   * 复制真实脚本供构建和隔离执行的临时目录。
   */
  const fixture = createFixture()
  try {
    fs.mkdirSync(path.join(fixture.project, 'script/register-commands/__pycache__'), { recursive: true })
    fs.writeFileSync(path.join(fixture.project, 'script/register-commands/__pycache__/cache.pyc'), '缓存')
    fs.mkdirSync(path.join(fixture.project, 'script/node_modules/local-only'), { recursive: true })
    fs.writeFileSync(path.join(fixture.project, 'script/node_modules/local-only/index.js'), '本地依赖')
    await buildFixture(fixture.project)
    /**
     * 模拟安装包，完全脱离源码及 node_modules。
     */
    const detached = path.join(fixture.root, 'installed-package')
    fs.cpSync(path.join(fixture.project, 'dist'), detached, { recursive: true })
    assert.deepEqual(fs.readdirSync(path.join(detached, 'script')).sort(), ['index.mjs', 'install-skills', 'mount-entry', 'register-commands', 'register-hooks'])
    assert.deepEqual(fs.readFileSync(path.join(detached, 'script/index.mjs')), fs.readFileSync(path.join(packageRoot, 'script/index.mjs')))
    assert.equal(fs.existsSync(path.join(detached, 'script/node_modules')), false)
    /**
     * 脚本及其运行时附件的交付集合。
     */
    const files = ['README.md', 'register-commands.ps1', 'register-commands.sh']
    assert.deepEqual(fs.readdirSync(path.join(detached, 'script/register-commands')).sort(), files)
    /**
     * 校验每个运行文件都保持源字节内容。
     */
    for (const file of files) {
      assert.deepEqual(fs.readFileSync(path.join(detached, 'script/register-commands', file)), fs.readFileSync(path.join(packageRoot, 'script/register-commands', file)))
    }
    /**
     * 新增公共入口必须和原生脚本一样原样交付，不漏平台或说明。
     */
    const mountFiles = ['README.md', 'mount-entry.ps1', 'mount-entry.sh']
    assert.deepEqual(fs.readdirSync(path.join(detached, 'script/mount-entry')).sort(), mountFiles)
    /**
     * 每份公共运行材料保持源字节；独立执行由 MVU-C 验证。
     */
    for (const file of mountFiles) {
      assert.deepEqual(fs.readFileSync(path.join(detached, 'script/mount-entry', file)), fs.readFileSync(path.join(packageRoot, 'script/mount-entry', file)))
    }
    /**
     * 对隔离后的脚本运行既有边界测试。
     */
    const result = spawnSync(process.execPath, [path.join(packageRoot, 'tests/test-register-commands.mjs'), path.join(detached, 'script/register-commands')], { encoding: 'utf8' })
    assert.ifError(result.error)
    assert.equal(result.status, 0, result.stdout + result.stderr)
    /**
     * hooks 也必须在无 node_modules 的交付目录运行。
     */
    const hooks = spawnSync(process.execPath, [path.join(packageRoot, 'tests/test-register-hooks.mjs'), path.join(detached, 'script/register-hooks'), path.join(detached, 'skills/workflow')], { encoding: 'utf8' })
    assert.ifError(hooks.error)
    assert.equal(hooks.status, 0, hooks.stdout + hooks.stderr)
    assert.equal(fs.existsSync(path.join(detached, 'script/yaml-config.mjs')), false)
    assert.equal(fs.existsSync(path.join(detached, 'script/register-hooks/definitions')), false)
    /**
     * 配置作为技能附件保持字节，不在构建时聚合到脚本目录。
     */
    for (const id of fs.readdirSync(path.join(packageRoot, 'src/skills/workflow'))) {
      /**
       * 只有声明 hooks 的技能携带该配置。
       */
      const source = path.join(packageRoot, 'src/skills/workflow', id, 'speckit-hooks.json')
      if (fs.existsSync(source))
        assert.deepEqual(fs.readFileSync(path.join(detached, 'skills/workflow', id, 'speckit-hooks.json')), fs.readFileSync(source))
    }
  }
  finally {
    fixture.cleanup()
  }
})

test('缺少任何已约定源目录时构建失败，不静默漏交付', async () => {
  /**
   * 三个必需源目录，各自在独立夹具验证缺失行为。
   */
  for (const source of ['src/mcp', 'src/skills', 'script']) {
    /**
     * 当前缺失场景的独立临时目录。
     */
    const fixture = createFixture()
    try {
      fs.rmSync(path.join(fixture.project, source), { recursive: true })
      await assert.rejects(buildFixture(fixture.project), /ENOENT|源目录/u)
    }
    finally {
      fixture.cleanup()
    }
  }
})

/**
 * 写入可验证 YAML 多行描述及递归附属资料的 MCP 技能夹具。
 * @param {string} root 临时项目根目录。
 * @param {string} directory MCP 内的技能相对目录。
 * @param {string} name 技能身份。
 * @returns {string} 技能目录。
 */
function writeMcpSkill(root, directory, name) {
  /**
   * 当前夹具的独立目录。
   */
  const source = path.join(root, 'src/mcp', directory)
  fs.mkdirSync(path.join(source, 'references/nested'), { recursive: true })
  fs.writeFileSync(path.join(source, 'SKILL.md'), `---\nname: ${name}\ndescription: >-\n  测试多行\n  元数据\ndestructive: false\n---\n\n# 测试正文\n`)
  fs.writeFileSync(path.join(source, 'references/nested/note.md'), '附属文本\n')
  return source
}

test('MCP 清单递归收录正文和附件，稳定重建并自动反映源增删改', async () => {
  /**
   * 包含线上与线下输入的独立构建环境。
   */
  const fixture = createFixture()
  try {
    writeMcpSkill(fixture.project, 'zeta', 'zeta')
    /**
     * 深层分类样例，用于验证递归收录而非固定目录名单。
     */
    const alpha = writeMcpSkill(fixture.project, 'group/deep/alpha', 'alpha')
    await buildFixture(fixture.project)
    /**
     * 唯一的派生清单输出路径。
     */
    const output = path.join(fixture.project, 'dist/mcp/manifest.json')
    /**
     * 首次构建原始字节，用于同源可复现性比较。
     */
    const first = fs.readFileSync(output, 'utf8')
    /**
     * 实际构建的清单对象。
     */
    const manifest = JSON.parse(first)
    assert.deepEqual(Object.keys(manifest), ['version', 'skills'])
    assert.equal(manifest.version, 1)
    assert.deepEqual(manifest.skills.map(skill => skill.name), ['alpha', 'zeta'])
    assert.equal(manifest.skills[0].category, 'group/deep')
    assert.equal(manifest.skills[0].description, '测试多行 元数据')
    assert.equal(manifest.skills[0].destructive, false)
    assert.equal(manifest.skills[0].skill, fs.readFileSync(path.join(alpha, 'SKILL.md'), 'utf8'))
    assert.deepEqual(manifest.skills[0].references, [{ name: 'nested/note.md', content: '附属文本\n' }])
    assert.equal(manifest.skills[1].category, null)
    await buildFixture(fixture.project)
    assert.equal(fs.readFileSync(output, 'utf8'), first)
    fs.writeFileSync(path.join(alpha, 'references/nested/note.md'), '更新后的附件')
    fs.rmSync(path.join(fixture.project, 'src/mcp/zeta'), { recursive: true })
    await buildFixture(fixture.project)
    /**
     * 删除与编辑源文件后重新生成的实际清单。
     */
    const rebuilt = JSON.parse(fs.readFileSync(output, 'utf8'))
    assert.deepEqual(rebuilt.skills.map(skill => skill.name), ['alpha'])
    assert.equal(rebuilt.skills[0].references[0].content, '更新后的附件')
    assert.equal(fs.existsSync(path.join(fixture.project, 'src/mcp/manifest.json')), false)
  }
  finally {
    fixture.cleanup()
  }
})

/**
 * 明确列出非法元数据样本，避免条件拼接掩盖测试输入。
 */
const invalidSkills = {
  name: '---\nname: INVALID NAME\ndescription: 测试\n---\n正文',
  description: '---\nname: demo\ndescription: []\n---\n正文',
  destructive: '---\nname: demo\ndescription: 测试\ndestructive: "false"\n---\n正文',
  yaml: '---\nname: demo\ndescription: [\n---\n正文',
  body: '---\nname: demo\ndescription: 测试\n---\n',
}

test('手写清单、重复身份及非法元数据必须阻止构建', async () => {
  /**
   * 每类无效输入都在独立项目运行，不借用前次产物。
   */
  for (const scenario of ['manual', 'duplicate', 'name', 'description', 'destructive', 'yaml', 'body']) {
    /**
     * 当前错误场景的临时项目。
     */
    const fixture = createFixture()
    try {
      /**
       * 在合法输入上只改变一项，使失败原因可定位。
       */
      const source = writeMcpSkill(fixture.project, 'demo', 'demo')
      if (scenario === 'manual')
        fs.writeFileSync(path.join(fixture.project, 'src/mcp/manifest.json'), '{}')
      else if (scenario === 'duplicate')
        writeMcpSkill(fixture.project, 'other', 'demo')
      else
        fs.writeFileSync(path.join(source, 'SKILL.md'), invalidSkills[scenario])
      await assert.rejects(buildFixture(fixture.project), /MCP/u)
    }
    finally {
      fixture.cleanup()
    }
  }
})

test('真实 MCP 测试技能及附属说明存在，源码没有维护 manifest', () => {
  assert.match(fs.readFileSync(path.join(packageRoot, 'src/mcp/mcp-build-smoke/SKILL.md'), 'utf8'), /name: mcp-build-smoke/u)
  assert.match(fs.readFileSync(path.join(packageRoot, 'src/mcp/mcp-build-smoke/references/verification.md'), 'utf8'), /mcp-build-smoke/u)
  assert.equal(fs.existsSync(path.join(packageRoot, 'src/mcp/manifest.json')), false)
})
