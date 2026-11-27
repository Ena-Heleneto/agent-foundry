import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * 仅在Bash拥有的临时目录准备官方输入，不写安装正文或registry。
 */
const [project, skillsRoot, configRoot, temporaryRoot, version, ...selection] = process.argv.slice(2)
assert.ok(project && skillsRoot && configRoot && temporaryRoot && version, '缺少hooks内部输入')
/**
 * 所有来源先核验，再生成可调用的官方输入。
 */
const selectedHooks = []
/**
 * 同名技能只允许在一个集中配置出现。
 */
const definitions = new Map()
for (const category of fs.readdirSync(configRoot).sort()) {
  /**
   * 只读取普通分类目录和固定文件，拒绝链接。
   */
  const categoryRoot = path.join(configRoot, category)
  assert.ok(fs.lstatSync(categoryRoot).isDirectory() && !fs.lstatSync(categoryRoot).isSymbolicLink(), `非法配置目录：${category}`)
  /**
   * 集中配置不可跟随外部链接。
   */
  const configFile = path.join(categoryRoot, 'collection.config.json')
  assert.ok(fs.lstatSync(configFile).isFile() && !fs.lstatSync(configFile).isSymbolicLink(), `非法配置文件：${category}`)
  /**
   * 配置只作结构化数据读取。
   */
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  assert.ok(config.skill && typeof config.skill === 'object' && !Array.isArray(config.skill), 'skill必须是对象')
  for (const [name, value] of Object.entries(config.skill)) {
    assert.ok(!definitions.has(name), `重复技能配置：${name}`)
    definitions.set(name, value)
  }
}
for (const name of [...new Set(selection)]) {
  assert.match(name, /^[a-z][a-z0-9-]*$/u, '非法技能名')
  /**
   * 不通过旧逐技能文件或默认清单补齐缺失来源。
   */
  const definition = definitions.get(name)
  assert.ok(definition && typeof definition === 'object' && !Array.isArray(definition), `缺少所选技能配置：${name}`)
  /**
   * 公共入口已验证完整文件，本模块仍独立拒绝缺正文与链接。
   */
  const skillRoot = path.join(skillsRoot, name)
  assert.ok(fs.lstatSync(skillRoot).isDirectory() && !fs.lstatSync(skillRoot).isSymbolicLink(), `非法技能目录：${name}`)
  assert.ok(fs.lstatSync(path.join(skillRoot, 'SKILL.md')).isFile() && !fs.lstatSync(path.join(skillRoot, 'SKILL.md')).isSymbolicLink(), `缺少技能正文：${name}`)
  if (definition.hook === undefined)
    continue
  assert.ok(definition.hook && typeof definition.hook === 'object' && !Array.isArray(definition.hook), 'hook必须是事件对象')
  /**
   * 条件和扩展字段交由官方执行器解释。
   */
  const hooks = {}
  for (const [event, value] of Object.entries(definition.hook)) {
    assert.match(event, /^[a-z][a-z0-9_]*$/u)
    assert.ok(value && typeof value === 'object' && !Array.isArray(value), `非法事件：${event}`)
    for (const key of ['enabled', 'optional']) assert.ok(value[key] === undefined || typeof value[key] === 'boolean', `${event}.${key}必须为布尔值`)
    assert.ok(value.prompt === undefined || typeof value.prompt === 'string', `${event}.prompt必须为字符串`)
    assert.ok(value.priority === undefined || (typeof value.priority === 'number' && Number.isFinite(value.priority)), `${event}.priority必须为有限数字`)
    assert.ok(value.condition === undefined || value.condition === null || typeof value.condition === 'string', `${event}.condition必须为字符串或null`)
    if (value.enabled !== false)
      hooks[event] = { ...value, command: name }
  }
  if (Object.keys(hooks).length)
    selectedHooks.push({ name, hooks })
}
for (const item of selectedHooks) {
  /**
   * JSON是YAML子集，避免自建序列化规则或额外运行依赖。
   */
  const root = path.join(temporaryRoot, item.name)
  fs.mkdirSync(root, { recursive: true, mode: 0o700 })
  fs.writeFileSync(path.join(root, 'extension.yml'), JSON.stringify({ schema_version: '1.0', extension: { id: item.name, name: item.name, version: '1.0.0', description: '所选工作流事件' }, requires: { speckit_version: `==${version}` }, provides: {}, hooks: item.hooks }))
}
process.stdout.write(selectedHooks.map(item => item.name).join('\n'))
