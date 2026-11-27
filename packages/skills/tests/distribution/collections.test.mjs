import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

/**
 * 实际包仅用于取得唯一配置、插件及已准备依赖，所有构建写入都在临时工程。
 */
const packageRoot = fileURLToPath(new URL('../../', import.meta.url))

/**
 * 在独占工程写测试输入，不触碰作者的真实技能或产物。
 */
function write(root, relative, content) {
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true })
  fs.writeFileSync(path.join(root, relative), content)
}

/**
 * 独立枚举实际文件字节，不复用产品的复制或摘要逻辑。
 */
function snapshot(root) {
  /**
   * 字节表保留二进制和完整相对路径。
   */
  const files = {}
  if (!fs.existsSync(root))
    return files
  /**
   * 测试来源只有自有普通文件，链接反例只在被测阶段出现。
   */
  for (const file of fs.readdirSync(root, { recursive: true }).sort()) {
    if (fs.lstatSync(path.join(root, file)).isFile())
      files[file.split(path.sep).join('/')] = fs.readFileSync(path.join(root, file)).toString('base64')
  }
  return files
}

/**
 * 真实Vite调用与实际配置共同验证，不创建第二个产品构建模式。
 */
function fixture() {
  /**
   * 中文空格路径用于核对普通目录和附件名。
   */
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-集合 '))
  fs.copyFileSync(path.join(packageRoot, 'vite.config.ts'), path.join(root, 'vite.config.ts'))
  if (fs.existsSync(path.join(packageRoot, 'build')))
    fs.cpSync(path.join(packageRoot, 'build'), path.join(root, 'build'), { recursive: true })
  fs.symlinkSync(path.join(packageRoot, 'node_modules'), path.join(root, 'node_modules'), 'dir')
  write(root, 'package.json', '{"type":"module"}\n')
  write(root, 'src/custom-collection/demo/SKILL.md', '---\nname: demo\ndescription: 示例\n---\n正文保持原样\n')
  write(root, 'src/custom-collection/demo/references/资料 空格.bin', Buffer.from([0, 255, 13, 10, 128]))
  write(root, 'src/custom-collection/demo/references/test-prompts.md', '必要附件\n')
  write(root, 'src/custom-collection/collection.config.json', '{\n  "packageName": null,\n  "mcp": true,\n  "skill": {"demo":{"hook":{"before_implement":{"prompt":"保持原配置","optional":false,"priority":20,"future":{"enabled":true}}},"label":"可扩展技能配置"}}\n}\n')
  return {
    root,
    output: path.join(root, 'dist'),
    run: (options = {}) => build({ root, configFile: path.join(root, 'vite.config.ts'), configLoader: 'runner', cacheDir: path.join(root, '.vite-cache'), logLevel: 'silent', ...options }),
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  }
}

test('目录与集合插件共同交付完整附件/配置，MCP为空且不生成占位JS', async () => {
  /**
   * 使用不在任何现有名单内的集合，防止实现固定四目录。
   */
  const item = fixture()
  try {
    /**
     * 完整来源字节是独立预期，不由产品生成期望。
     */
    const before = snapshot(path.join(item.root, 'src'))
    await item.run()
    assert.deepEqual(fs.readdirSync(item.output).sort(), ['custom-collection', 'mcp'])
    assert.deepEqual(snapshot(path.join(item.output, 'custom-collection')), snapshot(path.join(item.root, 'src/custom-collection')))
    assert.deepEqual(fs.readdirSync(path.join(item.output, 'mcp')), [])
    assert.deepEqual(snapshot(path.join(item.root, 'src')), before)
    assert.equal(fs.existsSync(path.join(item.output, 'custom-collection/demo/speckit-hooks.json')), false)
  }
  finally { item.cleanup() }
})

test('新增无配置集合可被发现，空清单不交付技能且默认配置不回写来源', async () => {
  /**
   * 后续新增集合只创建目录及内容，不需要额外登记。
   */
  const item = fixture()
  try {
    write(item.root, 'src/new-collection/another/SKILL.md', '# 新技能\n')
    fs.mkdirSync(path.join(item.root, 'src/empty-collection'))
    await item.run()
    assert.equal(fs.existsSync(path.join(item.output, 'new-collection/another/SKILL.md')), false)
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(item.output, 'new-collection/collection.config.json'), 'utf8')), { packageName: null, mcp: false, skill: {} })
    assert.ok(fs.statSync(path.join(item.output, 'empty-collection')).isDirectory())
    assert.equal(fs.existsSync(path.join(item.root, 'src/new-collection/collection.config.json')), false)
  }
  finally { item.cleanup() }
})

test('同源重建字节稳定，删除来源后清除旧输出，构建不执行集合内代码', async () => {
  /**
   * 两次真实构建必须反映文件系统，而不是保留旧dist冒充成功。
   */
  const item = fixture()
  try {
    write(item.root, 'src/custom-collection/demo/code.mjs', 'throw new Error("复制阶段不得执行")\n')
    await item.run()
    /**
     * 第一次输出作为独立磁盘比较对象。
     */
    const first = snapshot(item.output)
    await item.run()
    assert.deepEqual(snapshot(item.output), first)
    fs.unlinkSync(path.join(item.root, 'src/custom-collection/demo/code.mjs'))
    await item.run()
    assert.equal(fs.existsSync(path.join(item.output, 'custom-collection/demo/code.mjs')), false)
  }
  finally { item.cleanup() }
})

test('write=false只返回资产，不创建dist或mcp目录', async () => {
  /**
   * 插件不能绕过Vite的只建模调用选项直接写文件。
   */
  const item = fixture()
  try {
    await item.run({ build: { write: false } })
    assert.equal(fs.existsSync(item.output), false)
  }
  finally { item.cleanup() }
})

/**
 * 错误输入要求有具体诊断，并保留已有输出，不接受任意临时拒绝。
 */
const invalidCases = [
  ['非法JSON', 'json', /JSON|配置/u],
  ['MCP字段类型错误', 'mcp', /mcp|配置/u],
  ['hooks指向缺失技能', 'hooks', /hooks|技能/u],
  ['skill清单类型错误', 'skill-type', /skill|清单/u],
  ['hook事件映射类型错误', 'hook-type', /hook|事件/u],
  ['prompt类型错误', 'prompt-type', /prompt|提示词/u],
  ['来源链接', 'link', /链接|symlink/u],
  ['mcp集合名冲突', 'reserved', /mcp|保留/u],
  ['集合大小写冲突', 'case', /大小写|冲突/u],
  ['附件目录大小写冲突', 'nested-case', /大小写|冲突/u],
  ['默认配置与来源大小写冲突', 'config-case', /配置.*大小写|大小写.*配置/u],
]

/**
 * 各输入在自己的临时工程失败，不能相互污染已有产物。
 */
for (const [title, kind, reason] of invalidCases) {
  test(`${title}在清理输出前拒绝`, async () => {
    /**
     * 每个场景使用实际配置和插件字节。
     */
    const item = fixture()
    try {
      if (kind === 'json')
        write(item.root, 'src/custom-collection/collection.config.json', '{')
      if (kind === 'mcp')
        write(item.root, 'src/custom-collection/collection.config.json', '{"mcp":"true"}')
      if (kind === 'hooks')
        write(item.root, 'src/custom-collection/collection.config.json', '{"skill":{"absent":{"hook":{"before_implement":{}}}}}')
      if (kind === 'skill-type')
        write(item.root, 'src/custom-collection/collection.config.json', '{"skill":[]}')
      if (kind === 'hook-type')
        write(item.root, 'src/custom-collection/collection.config.json', '{"skill":{"demo":{"hook":["after_plan"]}}}')
      if (kind === 'prompt-type')
        write(item.root, 'src/custom-collection/collection.config.json', '{"skill":{"demo":{"hook":{"after_plan":{"prompt":42}}}}}')
      if (kind === 'link')
        fs.symlinkSync(path.join(item.root, 'package.json'), path.join(item.root, 'src/custom-collection/demo/linked.json'))
      if (kind === 'reserved')
        write(item.root, 'src/mcp/not-a-collection/SKILL.md', '# 保留目录')
      if (kind === 'case')
        write(item.root, 'src/Custom-Collection/other/SKILL.md', '# 大小写冲突')
      if (kind === 'nested-case') {
        write(item.root, 'src/custom-collection/demo/A/one.txt', '一')
        write(item.root, 'src/custom-collection/demo/a/two.txt', '二')
      }
      if (kind === 'config-case') {
        fs.unlinkSync(path.join(item.root, 'src/custom-collection/collection.config.json'))
        write(item.root, 'src/custom-collection/Collection.Config.Json', '{"mcp":false}')
      }
      write(item.output, 'keep.txt', '已有输出')
      await assert.rejects(item.run(), (error) => {
        assert.doesNotMatch(error.message, /重做中|尚未实现/u, '临时统一拒绝不能充当输入校验通过')
        assert.match(error.message, reason)
        return true
      })
      assert.equal(fs.readFileSync(path.join(item.output, 'keep.txt'), 'utf8'), '已有输出')
    }
    finally { item.cleanup() }
  })
}

test('危险输出根指向来源时，构建拒绝且不清理来源', async () => {
  /**
   * Vite outDir可以被调用方覆盖，插件必须在清理之前验证归属。
   */
  const item = fixture()
  try {
    /**
     * 被保护的实际来源完整字节。
     */
    const before = snapshot(path.join(item.root, 'src'))
    await assert.rejects(item.run({ build: { outDir: path.join(item.root, 'src'), emptyOutDir: true } }), /输出|目录|路径/u)
    assert.deepEqual(snapshot(path.join(item.root, 'src')), before)
  }
  finally { item.cleanup() }
})

test('只复制清单列出的技能，未选目录及其中链接不读取或交付', async () => {
  /**
   * 清单管理实际交付范围，未选内容不能被整体目录复制带入产物。
   */
  const item = fixture()
  try {
    write(item.root, 'src/custom-collection/not-selected/SKILL.md', '# 未选择')
    fs.symlinkSync(path.join(item.root, 'package.json'), path.join(item.root, 'src/custom-collection/not-selected/private.json'))
    await item.run()
    assert.ok(fs.existsSync(path.join(item.output, 'custom-collection/demo/SKILL.md')))
    assert.equal(fs.existsSync(path.join(item.output, 'custom-collection/not-selected')), false)
  }
  finally { item.cleanup() }
})

test('各事件独立保存提示词和属性，未知扩展字段原样进入产物', async () => {
  /**
   * 前后事件可有不同可选性和提示词，不强行共享一套配置。
   */
  const item = fixture()
  try {
    /**
     * 期望由测试字面量定义，不从产品解析器生成。
     */
    const config = { packageName: null, mcp: false, skill: { demo: { extraSkill: '保留', hook: { before_implement: { prompt: '前置提示', optional: true, priority: 10, condition: null }, after_implement: { prompt: '后置提示', optional: false, priority: 20, extraEvent: { values: [1, 2] } } } } } }
    write(item.root, 'src/custom-collection/collection.config.json', JSON.stringify(config))
    await item.run()
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(item.output, 'custom-collection/collection.config.json'), 'utf8')), config)
    assert.equal(fs.existsSync(path.join(item.output, 'custom-collection/demo/speckit-hooks.json')), false)
  }
  finally { item.cleanup() }
})

test('保留输出时也拒绝内部目录链接，不向输出外写入', async () => {
  /**
   * emptyOutDir=false不能允许资产路径借旧目录链接逃逸。
   */
  const item = fixture()
  try {
    fs.mkdirSync(item.output)
    fs.mkdirSync(path.join(item.root, 'outside'))
    fs.symlinkSync(path.join(item.root, 'outside'), path.join(item.output, 'custom-collection'), 'dir')
    await assert.rejects(item.run({ build: { emptyOutDir: false } }), /输出.*链接|链接.*输出/u)
    assert.deepEqual(fs.readdirSync(path.join(item.root, 'outside')), [])
  }
  finally { item.cleanup() }
})
