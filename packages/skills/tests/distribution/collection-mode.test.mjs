import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { scanCollections, scanSkills } from '../../build/utils/scan-skills.ts'

/**
 * 在独占来源中写入集合配置和一份技能正文。
 *
 * @param {string} root 隔离集合根目录。
 * @param {string} name 集合名和同名示例技能。
 * @param {string} options 追加到夹具配置的声明。
 */
function writeCollection(root, name, options = '') {
  /**
   * 技能夹具保留真实扫描所需的两层目录结构。
   */
  const directory = join(root, name)
  mkdirSync(join(directory, name), { recursive: true })
  writeFileSync(join(directory, name, 'SKILL.md'), '# 示例技能\n')
  writeFileSync(join(directory, 'collection.config.ts'), `
    export default {
      packageName: ${JSON.stringify(name)},
      mcp: false,
      skill: { ${JSON.stringify(name)}: { enabled: true }, '../disabled-skill': { enabled: false } },
      ${options}
    }
  `)
}

/**
 * 验证同一组已导入集合可按当次 mode 重新求值。
 *
 * @param {import('node:test').TestContext} t 当前测试上下文。
 */
async function verifyCollectionModes(t) {
  /**
   * 隔离集合输入，不读取工作区技能内容。
   */
  const root = mkdtempSync(join(tmpdir(), 'foundry-collection-mode-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeCollection(root, 'legacy-local')
  writeCollection(root, 'legacy-published', 'publish: true')
  writeCollection(root, 'explicit-off', 'publish: true, enabled: false, get skill() { throw new Error("关闭的集合不应读取技能") }')
  writeCollection(root, 'explicit-on', 'publish: false, enabled: true')
  writeCollection(root, 'profile-like', 'enabled: mode => mode !== "production"')

  /**
   * 重复 release 用于检测动态配置导入缓存是否导致筛选串值。
   */
  const cases = [
    ['production', ['explicit-on', 'legacy-published']],
    ['development', ['explicit-on', 'legacy-local', 'legacy-published', 'profile-like']],
    ['release', ['explicit-on', 'legacy-published', 'profile-like']],
    ['production', ['explicit-on', 'legacy-published']],
    ['release', ['explicit-on', 'legacy-published', 'profile-like']],
  ]
  for (const [mode, expected] of cases) {
    /**
     * 检查供引擎发现的集合列表及供其他插件使用的技能列表。
     */
    const collections = await scanCollections(mode, root)
    /**
     * 仅包含当前模式及技能级开关都允许的条目。
     */
    const skills = await scanSkills(mode, root)
    assert.deepEqual(collections.map(({ config }) => config.packageName), expected, mode)
    assert.deepEqual(skills.map(({ name }) => name), expected, mode)
  }
  await assert.rejects(scanSkills('staging', join(root, 'missing')), /不支持的技能构建模式.*staging/u)

  writeCollection(root, 'invalid-enabled', 'enabled: () => "true"')
  await assert.rejects(scanCollections('release', root), /invalid-enabled.*enabled.*布尔值/u)
}

test('集合按当次 mode 筛选，显式启用优先于旧 publish 规则', verifyCollectionModes)
