import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { createSandbox } from './sandbox.mjs'

/**
 * 仅编译当前包的构建期模型，不生成安装运行核心。
 */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))

/**
 * 为模型边界创建结构完整、字节摘要可追溯的受控声明。
 * @returns {object} 独立的合法版本清单。
 */
function release() {
  /**
   * 摘要只作为 schema 样本；实际文件字节仍由复制后校验验证。
   */
  const files = [
    { path: 'skills/coding/example/SKILL.md', bytes: 12, sha256: 'a'.repeat(64) },
    { path: 'skills/coding/example/references/data.bin', bytes: 4, sha256: 'b'.repeat(64) },
    { path: 'projections/eve-frontmatter-v1/example/skill.blob', bytes: 15, sha256: 'c'.repeat(64) },
    { path: 'script/install-skills/read-agents.mjs', bytes: 20, sha256: 'd'.repeat(64) },
    { path: 'script/mount-entry/mount-entry.sh', bytes: 30, sha256: 'e'.repeat(64) },
  ]
  return {
    schemaVersion: 1,
    version: '0.1.0',
    sourceRevision: '1'.repeat(40),
    tools: { skills: 'latest', specify: '1.2.6', node: '>=22.20.0', npm: '10.9.3', bash: '>=3.2', powershell: '>=7.4' },
    files,
    skills: [{
      name: 'example',
      category: 'coding',
      directory: 'skills/coding/example',
      sourceFiles: files.slice(0, 2).map(file => file.path),
      installedFilesByProjection: { 'identity': ['SKILL.md', 'references/data.bin'], 'eve-frontmatter-v1': ['SKILL.md', 'references/data.bin'] },
      requiresSkills: [],
      projectPrerequisites: [],
      mountMappingIds: [],
    }],
    projections: {
      'identity': { example: [
        { ...files[0], path: 'SKILL.md', sourcePath: files[0].path },
        { ...files[1], path: 'references/data.bin', sourcePath: files[1].path },
      ] },
      'eve-frontmatter-v1': { example: [
        { ...files[2], path: 'SKILL.md', sourcePath: files[2].path },
        { ...files[1], path: 'references/data.bin', sourcePath: files[1].path },
      ] },
    },
    adapters: files.slice(3).map(file => ({ ...file })),
  }
}

test('正式发布模型拒绝缺字段、类型错误、未知格式、越界和引用断链', async (t) => {
  /**
   * 首次红灯必须明确暴露未实现校验器，而不是错误导入。
   */
  const validator = path.join(packageRoot, 'build/distribution/validate.ts')
  assert.ok(fs.existsSync(validator), '缺少正式 Release/Skill 校验器')
  /**
   * 模型编译使用独立目录，与真实 dist 无关。
   */
  const sandbox = createSandbox()
  try {
    await build({ configFile: false, logLevel: 'silent', build: { ssr: validator, outDir: path.join(sandbox.root, 'validator'), rollupOptions: { output: { entryFileNames: 'index.mjs' } } } })
    /**
     * 测试真实的 unknown 输入校验和同版本替换保护。
     */
    const { parseRelease, parseReleaseJson, assertReleaseUnchanged } = await import(pathToFileURL(path.join(sandbox.root, 'validator/index.mjs')).href)
    await t.test('完整模型和标准 SemVer 接受，输入不被改写', () => {
      /**
       * 有效输入与只读快照。
       */
      const input = release()
      /**
       * 所有字段及顺序保持原样，不在解析中悄悄修补数据。
       */
      const before = JSON.stringify(input)
      assert.deepEqual(parseRelease(input), input)
      assert.deepEqual(parseReleaseJson(before), input)
      assert.equal(JSON.stringify(input), before)
      input.version = '1.2.3-rc.1+build.04'
      assert.doesNotThrow(() => parseRelease(input))
      assert.throws(() => parseReleaseJson('{invalid'), /JSON|格式/u)
      /**
       * 官方也转换嵌套 SKILL.md，普通附件保护不能误禁这类合法投影。
       */
      const nested = release()
      nested.files.push({ path: 'skills/coding/example/references/SKILL.md', bytes: 9, sha256: 'f'.repeat(64) })
      nested.files.push({ path: 'projections/eve-frontmatter-v1/example/nested.blob', bytes: 10, sha256: 'a'.repeat(64) })
      nested.skills[0].sourceFiles.push('skills/coding/example/references/SKILL.md')
      nested.skills[0].installedFilesByProjection.identity.push('references/SKILL.md')
      nested.skills[0].installedFilesByProjection['eve-frontmatter-v1'].push('references/SKILL.md')
      nested.projections.identity.example.push({ path: 'references/SKILL.md', sourcePath: 'skills/coding/example/references/SKILL.md', bytes: 9, sha256: 'f'.repeat(64) })
      nested.projections['eve-frontmatter-v1'].example.push({ path: 'references/SKILL.md', sourcePath: 'projections/eve-frontmatter-v1/example/nested.blob', bytes: 10, sha256: 'a'.repeat(64) })
      assert.doesNotThrow(() => parseRelease(nested))
    })
    await t.test('每个必要顶层字段、技能字段和工具字段都不能缺失或给错类型', () => {
      /**
       * 当前模型的必需层级，直接对合法样本逐字段破坏。
       */
      const groups = [
        [input => input, ['schemaVersion', 'version', 'sourceRevision', 'tools', 'files', 'skills', 'projections', 'adapters']],
        [input => input.skills[0], ['name', 'category', 'directory', 'sourceFiles', 'installedFilesByProjection', 'requiresSkills', 'projectPrerequisites', 'mountMappingIds']],
        [input => input.tools, ['skills', 'specify', 'node', 'npm', 'bash', 'powershell']],
        [input => input.files[0], ['path', 'bytes', 'sha256']],
        [input => input.adapters[0], ['path', 'bytes', 'sha256']],
        [input => input.projections.identity.example[0], ['path', 'bytes', 'sha256', 'sourcePath']],
      ]
      /**
       * 每个字段以删除和布尔类型分别验证，不靠 schemaVersion 统一失败。
       */
      for (const [target, fields] of groups) {
        /**
         * 当前字段的缺失和错误类型分别生成独立输入。
         */
        for (const field of fields) {
          /**
           * 每轮只破坏一个字段，其他条件保持合法。
           */
          const missing = release()
          delete target(missing)[field]
          assert.throws(() => parseRelease(missing), Error, `未拒绝缺字段：${field}`)
          /**
           * 必需字段都不接受布尔值冒充合法类型。
           */
          const invalid = release()
          target(invalid)[field] = true
          assert.throws(() => parseRelease(invalid), Error, `未拒绝错类型：${field}`)
        }
      }
    })
    /**
     * 格式及跨字段约束按用户可观察的无效输入分组。
     */
    const invalidCases = [
      ['未知 schema', input => input.schemaVersion = 2],
      ['SemVer 前导零', input => input.version = '01.2.3'],
      ['SemVer 数字预发布前导零', input => input.version = '1.2.3-01'],
      ['SemVer 非ASCII标识', input => input.version = '1.2.3-K'],
      ['版本不是三段', input => input.version = '1.2'],
      ['不是固定源码提交', input => input.sourceRevision = 'main'],
      ['工具漂移', input => input.tools.skills = '1.7.4'],
      ['负长度', input => input.files[0].bytes = -1],
      ['非整数长度', input => input.files[0].bytes = 1.5],
      ['非法摘要', input => input.files[0].sha256 = 'invalid'],
      ['路径逃逸', input => input.files[0].path = '../outside'],
      ['Windows 绝对路径', input => input.files[0].path = 'C:/outside'],
      ['大小写冲突', input => input.files.push({ ...input.files[0], path: input.files[0].path.toUpperCase() })],
      ['文件不能覆盖已用目录', input => input.files.push({ ...input.files[0], path: 'script' })],
      ['目录不能穿过已声明文件', input => input.files.unshift({ ...input.files[0], path: 'script' })],
      ['发布清单自引用', input => input.files.push({ ...input.files[0], path: 'release.json' })],
      ['内部 eval 泄漏', input => input.files.push({ ...input.files[0], path: 'skills/eval/private/SKILL.md' })],
      ['固定扩展声明', input => input.files.push({ ...input.files[0], path: 'extension.yml' })],
      ['技能重名', input => input.skills.push(structuredClone(input.skills[0]))],
      ['目录不按身份', input => input.skills[0].directory = 'skills/coding/alias'],
      ['分类数组不能冒充字符串', input => input.skills[0].category = ['coding']],
      ['技能来源越界', input => input.skills[0].sourceFiles[0] = 'script/install-skills/read-agents.mjs'],
      ['缺正文', input => input.skills[0].sourceFiles.shift()],
      ['缺公开依赖', input => input.skills[0].requiresSkills = ['not-public']],
      ['投影缺格式', input => delete input.projections['eve-frontmatter-v1']],
      ['投影来源未交付', input => input.projections.identity.example[0].sourcePath = 'missing.blob'],
      ['投影摘要错配', input => input.projections.identity.example[0].sha256 = 'f'.repeat(64)],
      ['投影漏附件', input => input.projections['eve-frontmatter-v1'].example.pop()],
      ['Eve不能替换普通附件字节', (input) => {
        input.projections['eve-frontmatter-v1'].example[1] = { ...input.files[3], path: 'references/data.bin', sourcePath: 'script/install-skills/read-agents.mjs' }
      }],
      ['安装路径越界', input => input.skills[0].installedFilesByProjection.identity[0] = '../outside'],
      ['未知安装格式', input => input.skills[0].installedFilesByProjection.unknown = ['SKILL.md']],
      ['路径适配未交付', input => input.adapters[0].path = 'unknown.json'],
    ]
    /**
     * 每个具体无效状态单独执行断言，失败名称可以直接定位约束。
     */
    for (const [name, mutate] of invalidCases) {
      await t.test(name, () => {
        /**
         * 本分支只有一个无效条件。
         */
        const input = release()
        mutate(input)
        assert.throws(() => parseRelease(input), Error, name)
      })
    }
    await t.test('同版本内容不覆盖，新版本可独立交付', () => {
      /**
       * 已保存版本与待交付版本均先进行完整结构核验。
       */
      const previous = release()
      /**
       * 当前候选先与既有字节语义完全一致。
       */
      const candidate = release()
      assert.doesNotThrow(() => assertReleaseUnchanged(previous, candidate))
      candidate.projectNote = '改变同版本内容'
      assert.throws(() => assertReleaseUnchanged(previous, candidate), /同版本|覆盖/u)
      candidate.version = '0.1.1'
      assert.doesNotThrow(() => assertReleaseUnchanged(previous, candidate))
    })
  }
  finally {
    sandbox.cleanup()
  }
})
