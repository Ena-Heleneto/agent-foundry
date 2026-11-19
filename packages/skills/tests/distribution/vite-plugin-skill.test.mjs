import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('重名技能使真实 Vite 构建在清理旧产物前失败', (t) => {
  /**
   * 构建进程独占的项目根，产物与实际工作区隔离。
   */
  const root = mkdtempSync(join(tmpdir(), 'foundry-skill-collision-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))

  for (const collection of ['coding', 'frontend']) {
    /**
     * 集合名不同，技能末级目录名相同。
     */
    const directory = join(root, 'src', collection)
    mkdirSync(join(directory, 'same-name'), { recursive: true })
    writeFileSync(join(directory, 'same-name/SKILL.md'), `# ${collection}\n`)
    writeFileSync(join(directory, 'collection.config.ts'), `export default { packageName: '${collection}', skill: { 'same-name': { enabled: true } } }\n`)
  }

  /**
   * 以唯一文件检查旧输出是否被清理或混入本次产物。
   */
  const output = join(root, 'dist')
  mkdirSync(output)
  writeFileSync(join(output, 'previous.txt'), '上一轮产物\n')

  /**
   * 通过包内真实 Vite 配置运行构建并捕获退出状态及诊断。
   */
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL('bin/vite.js', import.meta.resolve('vite/package.json'))),
    'build',
    '--config',
    fileURLToPath(new URL('../../vite.config.ts', import.meta.url)),
  ], { cwd: root, encoding: 'utf8', timeout: 15_000 })

  assert.ifError(result.error)
  assert.ok(result.status > 0, result.stdout)
  assert.match(result.stderr, /\.agents\/skills\/same-name/)
  assert.ok(result.stderr.includes(join(root, 'src/coding/same-name')))
  assert.ok(result.stderr.includes(join(root, 'src/frontend/same-name')))
  assert.deepEqual(readdirSync(output), ['previous.txt'])
  assert.equal(readFileSync(join(output, 'previous.txt'), 'utf8'), '上一轮产物\n')
})
