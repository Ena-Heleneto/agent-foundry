import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * 只为本次拥有的临时目录生成正式入口，不移动官方安装源技能。
 */
const [project, skillsRoot, temporaryRoot, version] = process.argv.slice(2)
assert.ok(project && skillsRoot && temporaryRoot && version, '缺少指令内部输入')
/**
 * 正文定位以项目相对路径保存，迁移后不携带原机器绝对路径。
 */
const source = path.relative(project, path.join(skillsRoot, 'task-increment/SKILL.md')).split(path.sep).join('/')
assert.ok(source && !source.startsWith('../') && !path.isAbsolute(source), 'Increment必须安装在本次项目中')
for (const name of ['task-increment', 'artifact-spec-analysis', 'implementation-preparation']) {
  /**
   * 所有依赖均须已由用户显式选择安装，不静默补装。
   */
  const directory = path.join(skillsRoot, name)
  assert.ok(fs.lstatSync(directory).isDirectory() && !fs.lstatSync(directory).isSymbolicLink(), `非法已装技能目录：${name}`)
  assert.ok(fs.lstatSync(path.join(directory, 'SKILL.md')).isFile() && !fs.lstatSync(path.join(directory, 'SKILL.md')).isSymbolicLink(), `缺少依赖正文：${name}`)
}
fs.mkdirSync(path.join(temporaryRoot, 'commands'), { recursive: true, mode: 0o700 })
fs.writeFileSync(path.join(temporaryRoot, 'commands/increment.md'), `---\ndescription: 用户明确通过正式 Increment 入口进行增量规划时使用。\n---\n\n先完整读取项目中的 ${source}，遵照该正式源技能及其所需附件处理用户上下文。\n\n本入口只负责调用同版已安装的 task-increment 一次，不另行复制或执行第二套规划。若当前调用已执行源技能，则直接沿用本次结果；源技能不得再次调用本入口。\n\n用户输入：$ARGUMENTS\n`)
fs.writeFileSync(path.join(temporaryRoot, 'extension.yml'), JSON.stringify({ schema_version: '1.0', extension: { id: 'modes', name: 'Collaboration Modes', version: '1.0.0', description: 'Increment增量规划正式入口' }, requires: { speckit_version: `==${version}` }, provides: { commands: [{ name: 'speckit.modes.increment', file: 'commands/increment.md', description: '增量规划' }] } }))
