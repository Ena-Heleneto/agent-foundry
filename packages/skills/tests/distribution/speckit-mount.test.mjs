import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { build } from 'vite'
import { parse } from 'yaml'
import vitePluginSpeckitMount from '../../src/workflow/plugin/vite-plugin-speckit-mount/index.ts'

/**
 * 创建默认生产模式可见的独占来源和 CLI 记录器，不挂载当前仓库。
 */
function fixture(t, skill) {
  /**
   * 同时包含空格的路径用于验证生成脚本正确引用输入。
   */
  const root = mkdtempSync(join(tmpdir(), 'foundry hook '))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'src/workflow'), { recursive: true })
  writeFileSync(join(root, 'src/workflow/collection.config.ts'), `export default ${JSON.stringify({ packageName: 'workflow', mcp: false, publish: true, skill })}`)
  for (const name of Object.keys(skill)) {
    mkdirSync(join(root, 'src/workflow', name))
    writeFileSync(join(root, 'src/workflow', name, 'SKILL.md'), `---\nname: ${name}\ndescription: 测试技能\n---\n正文\n`)
  }
  mkdirSync(join(root, 'project/.specify'), { recursive: true })
  mkdirSync(join(root, 'bin'))
  mkdirSync(join(root, 'temporary'))
  writeFileSync(join(root, 'bin/specify'), `#!/usr/bin/env python3
import json, os, pathlib, sys
assert sys.argv[1:4] == ['extension', 'add', '--dev'], sys.argv
source = pathlib.Path(sys.argv[4])
with pathlib.Path('calls.jsonl').open('a') as output:
    output.write(json.dumps({'source': str(source), 'manifest': json.loads((source / 'extension.yml').read_text()), 'files': {p.relative_to(source).as_posix(): p.read_text() for p in source.rglob('*') if p.is_file()}}) + '\\n')
sys.exit(int(os.environ.get('TEST_CLI_EXIT', '0')))
`, { mode: 0o755 })
  return root
}

/**
 * 让真实 Vite 调用子插件，内存构建不应创建 dist 或执行注册。
 */
async function generate(root) {
  /**
   * 独立虚拟入口只用于驱动真实构建钩子。
   */
  const result = await build({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [
      {
        name: 'test-entry',
        resolveId: id => id === 'virtual:test' ? id : undefined,
        load: id => id === 'virtual:test' ? 'export {}' : undefined,
      },
      vitePluginSpeckitMount(join(root, 'src')),
    ],
    build: { write: false, rolldownOptions: { input: 'virtual:test' } },
  })
  assert.equal(existsSync(join(root, 'dist')), false)
  assert.equal(existsSync(join(root, 'project/calls.jsonl')), false)
  return result.output.filter(item => item.type === 'asset')
}

/**
 * 在临时目标运行真实生成的 Bash，仅替换外部 specify 以捕获提交边界。
 */
function run(root, source, exitCode = 0) {
  writeFileSync(join(root, 'mount.sh'), source)
  /**
   * PATH 只将隔离记录器放在现有工具之前。
   */
  const env = { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, TMPDIR: join(root, 'temporary'), TEST_CLI_EXIT: String(exitCode) }
  return spawnSync('bash', [join(root, 'mount.sh')], { cwd: join(root, 'project'), env, encoding: 'utf8' })
}

test('按配置交付多技能 hook，保留参数和提示词且不执行其中的 Shell', async (t) => {
  /**
   * 提示词含引号、换行、命令替换和旧 heredoc 标记，必须完整按数据传递。
   */
  const prompt = '读取\'技能\' "$ARGUMENTS" $(touch injected) `touch injected2`\nFOUNDRY_EOF\n第二行'
  /**
   * 启用技能、禁用技能、禁用事件和仅命令技能共同验证选择边界。
   */
  const root = fixture(t, {
    first: { enabled: true, hook: { before_implement: { prompt, optional: false, priority: 20, condition: null }, after_tasks: { prompt: '不注册', enabled: false } } },
    second: { enabled: true, hook: { after_tasks: { prompt: '分析', enabled: true } } },
    disabled: { enabled: false, hook: { after_converge: { prompt: '不注册' } } },
    command: { enabled: false, command: 'speckit.modes.increment' },
  })
  /**
   * 唯一资产必须为挂载脚本。
   */
  const assets = await generate(root)
  assert.deepEqual(assets.map(asset => asset.fileName), ['script/speckit-mount.sh'])
  writeFileSync(join(root, 'syntax.sh'), assets[0].source)
  assert.equal(spawnSync('bash', ['-n', join(root, 'syntax.sh')]).status, 0)
  /**
   * 执行后的 manifest 是独立的行为证据，不通过搜索脚本文本判断。
   */
  const result = run(root, assets[0].source)
  assert.equal(result.status, 0, result.stderr)
  /**
   * 外部 CLI 收到两个有效技能，各自包含其启用事件。
   */
  const calls = readFileSync(join(root, 'project/calls.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
  assert.deepEqual(calls.map(call => call.manifest.extension.id), ['first', 'second'])
  assert.deepEqual(calls[0].manifest.hooks, { before_implement: { prompt, optional: false, priority: 20, condition: null, command: 'first' } })
  assert.deepEqual(calls[1].manifest.hooks, { after_tasks: { prompt: '分析', enabled: true, command: 'second' } })
  assert.equal(existsSync(join(root, 'project/injected')), false)
  assert.equal(existsSync(join(root, 'project/injected2')), false)
  assert.deepEqual(readdirSync(join(root, 'temporary')), [])
  assert.ok(calls.every(call => !existsSync(call.source)))
})

test('无有效 hook 或 command 时不交付空挂载脚本', async (t) => {
  /**
   * 命令技能与事件均显式禁用时，没有可注册的内容。
   */
  const root = fixture(t, { command: { enabled: false, command: 'speckit.modes.increment' }, disabled: { enabled: true, hook: { after_tasks: { prompt: '关闭', enabled: false } } } })
  assert.deepEqual(await generate(root), [])
})

test('官方注册失败保留退出码、停止后续项并清理临时输入', async (t) => {
  /**
   * 第二个技能不能在第一次 CLI 失败后继续注册。
   */
  const root = fixture(t, { first: { enabled: true, hook: { after_tasks: { prompt: '分析' } } }, second: { enabled: true, hook: { after_converge: { prompt: '结案' } } } })
  /**
   * 生成真实脚本后由外部 CLI 边界返回可识别的失败码。
   */
  const assets = await generate(root)
  assert.equal(assets.length, 1)
  /**
   * 失败码必须由实际 Bash 的退出状态观察。
   */
  const result = run(root, assets[0].source, 23)
  assert.equal(result.status, 23, result.stderr)
  assert.equal(readFileSync(join(root, 'project/calls.jsonl'), 'utf8').trim().split('\n').length, 1)
  assert.deepEqual(readdirSync(join(root, 'temporary')), [])
})

test('只有 Increment 声明也生成脚本，并保留命令元数据和参数字面量', async (t) => {
  /**
   * 已安装正文与构建源独立，命令只引用目标路径，不复制任一份业务正文。
   */
  const root = fixture(t, { 'task-increment': { enabled: true, command: 'speckit.modes.increment' } })
  writeFileSync(join(root, 'src/workflow/task-increment/SKILL.md'), '---\nname: task-increment\ndescription: 测试技能\n---\n\n构建源业务独有内容\n')
  mkdirSync(join(root, 'project/.agents/skills/task-increment'), { recursive: true })
  writeFileSync(join(root, 'project/.agents/skills/task-increment/SKILL.md'), '已安装的完整源技能')
  /**
   * 新逻辑必须让仅命令来源也交付一个可运行脚本。
   */
  const assets = await generate(root)
  assert.equal(assets.length, 1)
  /**
   * 首次运行提交一个正式 modes 扩展和可读取的命令文件。
   */
  const result = run(root, assets[0].source)
  assert.equal(result.status, 0, result.stderr)
  /**
   * 期望值独立给定，不使用生成器计算命令注册结构。
   */
  const [call] = readFileSync(join(root, 'project/calls.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
  assert.equal(call.manifest.extension.id, 'modes')
  assert.deepEqual(call.manifest.provides.commands, [{ name: 'speckit.modes.increment', file: 'commands/increment.md', description: '测试技能' }])
  /**
   * 原始命令文件必须保留 frontmatter、目标项目路径及未求值的参数。
   */
  const command = call.files['commands/increment.md']
  assert.ok(command)
  assert.deepEqual(parse(command.split('---')[1]), { description: '测试技能' })
  assert.ok(command.includes('.agents/skills/task-increment/SKILL.md'))
  assert.ok(command.includes('$ARGUMENTS'))
  assert.equal(command.includes(join(root, 'src')), false)
  assert.equal(command.includes('构建源业务独有内容'), false)
  assert.equal(readFileSync(join(root, 'project/.agents/skills/task-increment/SKILL.md'), 'utf8'), '已安装的完整源技能')
  assert.deepEqual(readdirSync(join(root, 'temporary')), [])
  /**
   * 命令注册失败与 hook 失败一样保留退出码并清理输入。
   */
  const failed = run(root, assets[0].source, 23)
  assert.equal(failed.status, 23, failed.stderr)
  assert.deepEqual(readdirSync(join(root, 'temporary')), [])
})

test('同一脚本保留 hook 并注册配置声明的 Increment 命令', async (t) => {
  /**
   * 两类声明共享一个资产，各自提交官方扩展，不互相覆盖。
   */
  const root = fixture(t, { 'preparation': { enabled: true, hook: { before_implement: { prompt: '先准备' } } }, 'task-increment': { enabled: true, command: 'speckit.modes.increment' } })
  mkdirSync(join(root, 'project/.agents/skills/task-increment'), { recursive: true })
  writeFileSync(join(root, 'project/.agents/skills/task-increment/SKILL.md'), '已安装技能')
  /**
   * 真实执行生成资产后，CLI 应收到 hook 和 command 两种有效输入。
   */
  const assets = await generate(root)
  assert.equal(assets.length, 1)
  assert.equal(run(root, assets[0].source).status, 0)
  /**
   * 执行边界应同时保留已有 hook 和新增命令。
   */
  const calls = readFileSync(join(root, 'project/calls.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
  assert.deepEqual(calls.map(call => call.manifest.extension.id), ['preparation', 'modes'])
  assert.equal(calls[0].manifest.hooks.before_implement.prompt, '先准备')
  assert.equal(calls[1].manifest.provides.commands[0].name, 'speckit.modes.increment')
})

test('目标技能未安装时在任何注册前失败', async (t) => {
  /**
   * 即使 hook 排在命令前，缺少被引用的技能也不得先写入 hook。
   */
  const root = fixture(t, { 'preparation': { enabled: true, hook: { before_implement: { prompt: '先准备' } } }, 'task-increment': { enabled: true, command: 'speckit.modes.increment' } })
  /**
   * 故意不准备目标项目的 task-increment 正文。
   */
  const [asset] = await generate(root)
  assert.ok(asset)
  assert.equal(run(root, asset.source).status, 1)
  assert.equal(existsSync(join(root, 'project/calls.jsonl')), false)
  assert.deepEqual(readdirSync(join(root, 'temporary')), [])
})

test('非法命令名在生成时失败', async (t) => {
  /**
   * 命令名不能成为临时目录越界或 Shell 插入的来源。
   */
  const invalid = fixture(t, { 'task-increment': { enabled: true, command: 'speckit.modes.increment/../../outside' } })
  await assert.rejects(generate(invalid), /命令名称/u)
})

test('缺失 description 在生成时失败', async (t) => {
  /**
   * 命令描述来自真实元数据，缺失时不能伪造成功占位。
   */
  const missing = fixture(t, { 'task-increment': { enabled: true, command: 'speckit.modes.increment' } })
  writeFileSync(join(missing, 'src/workflow/task-increment/SKILL.md'), '---\nname: task-increment\n---\n')
  await assert.rejects(generate(missing), /description/u)
})
