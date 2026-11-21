import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import createDirectoriesPlugin from '../../build/plugins/create-directories.ts'

/**
 * 在指定沙箱内创建测试文件及其父目录。
 *
 * @param root 沙箱或输出根目录。
 * @param relative 文件相对路径。
 * @param content 测试文件内容。
 */
function write(root, relative, content) {
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true })
  fs.writeFileSync(path.join(root, relative), content)
}

/**
 * 创建只注册目录插件的隔离工程，验证其独立行为。
 */
function fixture() {
  /**
   * 当前测试沙箱的根路径，包含中文和空格。
   */
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-目录 '))
  fs.mkdirSync(path.join(root, 'src/empty'), { recursive: true })
  write(root, 'entry.mjs', 'export {}\n')
  return {
    root,
    output: path.join(root, 'dist'),
    run: (options = {}) => build({
      root,
      configFile: false,
      plugins: [createDirectoriesPlugin()],
      logLevel: 'silent',
      build: { outDir: 'dist', emptyOutDir: true, rolldownOptions: { input: path.join(root, 'entry.mjs') }, ...options },
    }),
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  }
}

test('目录插件独立创建任意空集合和mcp，不读取配置或技能附件', async () => {
  /**
   * 用于验证目录职责不依赖集合内容的隔离工程。
   */
  const item = fixture()
  try {
    write(item.root, 'src/集合 空格/collection.config.json', '{不是JSON')
    write(item.root, 'src/集合 空格/demo/SKILL.md', '# 不复制')
    fs.symlinkSync(path.join(item.root, 'entry.mjs'), path.join(item.root, 'src/集合 空格/demo/linked.mjs'))
    write(item.root, 'src/root.txt', '普通根文件')
    fs.mkdirSync(path.join(item.root, 'src/node_modules'))
    await item.run()
    assert.deepEqual(fs.readdirSync(path.join(item.output, 'empty')), [])
    assert.deepEqual(fs.readdirSync(path.join(item.output, '集合 空格')), [])
    assert.deepEqual(fs.readdirSync(path.join(item.output, 'mcp')), [])
    assert.equal(fs.existsSync(path.join(item.output, 'root.txt')), false)
    assert.equal(fs.existsSync(path.join(item.output, 'node_modules')), false)
    assert.equal(fs.readFileSync(path.join(item.root, 'src/集合 空格/collection.config.json'), 'utf8'), '{不是JSON')
  }
  finally { item.cleanup() }
})

test('空src仍保留mcp，集合改名和删除反映到下一次真实构建', async () => {
  /**
   * 用于连续构建并观察集合增删结果的隔离工程。
   */
  const item = fixture()
  try {
    await item.run()
    fs.renameSync(path.join(item.root, 'src/empty'), path.join(item.root, 'src/renamed'))
    await item.run()
    assert.ok(fs.statSync(path.join(item.output, 'renamed')).isDirectory())
    assert.equal(fs.existsSync(path.join(item.output, 'empty')), false)
    fs.rmdirSync(path.join(item.root, 'src/renamed'))
    await item.run()
    assert.equal(fs.existsSync(path.join(item.output, 'renamed')), false)
    assert.deepEqual(fs.readdirSync(path.join(item.output, 'mcp')), [])
  }
  finally { item.cleanup() }
})

test('目录插件在write=false时既不创建输出，也不改动已有输出', async () => {
  /**
   * 用于核验关闭写出时磁盘保持不变的隔离工程。
   */
  const item = fixture()
  try {
    await item.run({ write: false })
    assert.equal(fs.existsSync(item.output), false)
    write(item.output, 'keep.txt', '原有输出')
    await item.run({ write: false })
    assert.deepEqual(fs.readdirSync(item.output), ['keep.txt'])
    assert.equal(fs.readFileSync(path.join(item.output, 'keep.txt'), 'utf8'), '原有输出')
  }
  finally { item.cleanup() }
})

/**
 * 非法路径场景及预期诊断；场景可额外返回构建选项。
 */
const invalidCases = [
  ['缺少src', (item) => {
    fs.renameSync(path.join(item.root, 'src'), path.join(item.root, 'source-backup'))
  }, /来源|src/u],
  ['src目录链接', (item) => {
    fs.renameSync(path.join(item.root, 'src'), path.join(item.root, 'source-backup'))
    fs.symlinkSync(path.join(item.root, 'source-backup'), path.join(item.root, 'src'), 'dir')
  }, /来源|链接/u],
  ['集合目录链接', (item) => {
    fs.symlinkSync(path.join(item.root, 'src/empty'), path.join(item.root, 'src/linked'), 'dir')
  }, /来源|链接/u],
  ['集合大小写冲突', (item) => {
    fs.mkdirSync(path.join(item.root, 'src/Empty'))
  }, /大小写|冲突/u],
  ['保留MCP目录', (item) => {
    fs.mkdirSync(path.join(item.root, 'src/MCP'))
  }, /mcp|保留/iu],
  ['非法目录名', (item) => {
    fs.mkdirSync(path.join(item.root, 'src/bad:name'))
  }, /路径|名称|非法/u],
  ['输出根链接', (item) => {
    fs.renameSync(item.output, path.join(item.root, 'outside'))
    fs.symlinkSync(path.join(item.root, 'outside'), item.output, 'dir')
  }, /输出|链接/u],
  ['已有输出内部链接', (item) => {
    fs.mkdirSync(path.join(item.root, 'outside'))
    fs.symlinkSync(path.join(item.root, 'outside'), path.join(item.output, 'linked'), 'dir')
    return { emptyOutDir: false }
  }, /输出|链接/u],
  ['目标目录被普通文件占用', (item) => {
    write(item.output, 'empty', '不得覆盖')
  }, /目录|文件|占用/u],
  ['输出指向src', item => ({ outDir: path.join(item.root, 'src') }), /输出|dist/u],
]

/**
 * 每项场景的名称、输入改动及预期诊断，用于核验清理前失败。
 */
for (const [title, mutate, expected] of invalidCases) {
  test(`目录插件拒绝${title}并保留原有输出`, async () => {
    /**
     * 当前反例独占的测试工程及其输出位置。
     */
    const item = fixture()
    try {
      write(item.output, 'keep.txt', '原有输出')
      /**
       * 当前反例的构建选项，缺省时沿用沙箱默认值。
       */
      const options = mutate(item)
      await assert.rejects(item.run(options), (error) => {
        assert.doesNotMatch(error.message, /尚未实现|重做中/u)
        assert.match(error.message, expected)
        return true
      })
      assert.equal(fs.readFileSync(path.join(item.output, 'keep.txt'), 'utf8'), '原有输出')
      assert.equal(fs.readFileSync(path.join(item.root, 'entry.mjs'), 'utf8'), 'export {}\n')
    }
    finally { item.cleanup() }
  })
}
