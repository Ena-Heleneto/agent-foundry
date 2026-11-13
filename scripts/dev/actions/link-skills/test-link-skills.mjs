// link-skills 的跨平台沙箱测试；默认路径验证也在临时仓库中执行。
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

/**
 * 待测脚本所在目录。
 */
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))

/**
 * 验证 Codex skill 的默认路径、分类铺平、复制、更新、软链接替换与冲突处理。
 *
 * @param {string} runtime 脚本运行时。
 * @param {string} extension 脚本扩展名。
 */
function testImpl(runtime, extension) {
  /**
   * 临时仓库根，避免测试写入实际项目的 skill 目录。
   */
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'test-link-skills-'))
  try {
    /**
     * 复刻目录结构，使脚本按自身位置解析默认仓库路径。
     */
    const actionDir = path.join(root, 'scripts/dev/actions/link-skills')
    fs.mkdirSync(actionDir, { recursive: true })
    /**
     * 沙箱中的待测脚本。
     */
    const script = path.join(actionDir, `link-skills.${extension}`)
    fs.copyFileSync(path.join(SCRIPT_DIR, `link-skills.${extension}`), script)
    /**
     * 默认集合源目录，集合目录名不需要登记到安装脚本。
     */
    const source = path.join(root, 'packages/skills/src')
    /**
     * Codex 的默认项目 skill 目录。
     */
    const target = path.join(root, '.agents/skills')
    /**
     * 含嵌套引用的分类 skill 源目录。
     */
    const skillSource = path.join(source, 'coding/skill-a')
    /**
     * 分类铺平后的 skill 安装目录。
     */
    const skillTarget = path.join(target, 'skill-a')
    fs.mkdirSync(path.join(skillSource, 'references'), { recursive: true })
    fs.writeFileSync(path.join(skillSource, 'SKILL.md'), '# 初版')
    fs.writeFileSync(path.join(skillSource, 'references/guide.md'), '# 参考')
    fs.writeFileSync(path.join(source, 'ignored.txt'), '忽略普通文件')
    fs.mkdirSync(path.join(target, 'speckit-demo'), { recursive: true })
    fs.writeFileSync(path.join(target, 'speckit-demo/SKILL.md'), '# 开源技能')

    /**
     * 执行沙箱脚本并检查退出码，返回合并日志供断言使用。
     *
     * @param {string[]} args 脚本位置参数。
     * @param {number} expectedStatus 预期退出码。
     * @returns {string} 合并标准输出与错误输出。
     */
    function run(args = [], expectedStatus = 0) {
      /**
       * 当前运行时的命令参数。
       */
      const runtimeArgs = runtime === 'pwsh' ? ['-NoProfile', '-File', script] : [script]
      /**
       * 本次脚本执行结果。
       */
      const result = spawnSync(runtime, [...runtimeArgs, ...args], { encoding: 'utf8' })
      assert.equal(result.status, expectedStatus, result.stdout + result.stderr)
      return result.stdout + result.stderr
    }

    assert.match(run(), /copy: skill-a/)
    assert.equal(fs.lstatSync(skillTarget).isSymbolicLink(), false)
    assert.equal(fs.readFileSync(path.join(skillTarget, 'SKILL.md'), 'utf8'), '# 初版')
    assert.equal(fs.readFileSync(path.join(skillTarget, 'references/guide.md'), 'utf8'), '# 参考')
    assert.equal(fs.existsSync(path.join(target, 'coding')), false)
    assert.equal(fs.existsSync(path.join(target, 'ignored.txt')), false)
    assert.equal(fs.readFileSync(path.join(target, 'speckit-demo/SKILL.md'), 'utf8'), '# 开源技能')
    assert.match(run(), /skip\(已是最新\): skill-a/)

    fs.writeFileSync(path.join(skillSource, 'SKILL.md'), '# 更新版')
    fs.writeFileSync(path.join(skillTarget, 'stale.txt'), '旧文件')
    assert.match(run(), /update\(已更新\): skill-a/)
    assert.equal(fs.readFileSync(path.join(skillTarget, 'SKILL.md'), 'utf8'), '# 更新版')
    assert.equal(fs.existsSync(path.join(skillTarget, 'stale.txt')), false)

    fs.rmSync(skillTarget, { recursive: true })
    fs.symlinkSync(skillSource, skillTarget, 'dir')
    assert.match(run(), /copy\(覆盖软链\): skill-a/)
    assert.equal(fs.lstatSync(skillTarget).isSymbolicLink(), false)
    assert.equal(fs.readFileSync(path.join(skillSource, 'SKILL.md'), 'utf8'), '# 更新版')

    fs.rmSync(skillTarget, { recursive: true })
    fs.symlinkSync(path.join(root, 'missing'), skillTarget, 'dir')
    assert.match(run(), /copy\(覆盖软链\): skill-a/)
    assert.equal(fs.lstatSync(skillTarget).isSymbolicLink(), false)

    fs.rmSync(skillTarget, { recursive: true })
    fs.writeFileSync(skillTarget, '保留冲突文件')
    assert.match(run([], 1), /conflict/)
    assert.equal(fs.readFileSync(skillTarget, 'utf8'), '保留冲突文件')
    fs.rmSync(skillTarget)
    assert.match(run([source, target, path.join(root, '.gitignore')]), /第三参数/)
    assert.equal(fs.existsSync(path.join(root, '.gitignore')), false)
    assert.match(run([path.join(root, 'missing'), target], 1), /源目录不存在/)
  }
  finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

test('Bash：Codex skill 复制安装', {
  skip: spawnSync('bash', ['--version']).status !== 0,
}, () => testImpl('bash', 'sh'))

test('PowerShell：Codex skill 复制安装', {
  skip: spawnSync('pwsh', ['--version']).status !== 0,
}, () => testImpl('pwsh', 'ps1'))

/**
 * 验证退役来源和旧名称不再复制，已有用户目录、普通文件和链接目标原样保留。
 */
function testRetiredSources() {
  /**
   * 同时覆盖集合来源和兼容的一级来源，所有写操作只发生在隔离目录。
   */
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'test-retired-skills-'))
  try {
    /**
     * 带来源与历史目标的验证目录。
     */
    const source = path.join(root, 'source')
    /**
     * 模拟已安装技能，退役同名对象也必须保护。
     */
    const target = path.join(root, 'target')
    /**
     * 用户已明确清退的技能，Explore 兼容不存在源码但有旧输入的情况。
     */
    const retired = ['artifact-issue-description', 'artifact-pr-description', 'mvu-gate', 'artifact-business-flow', 'artifact-logic-flow', 'explainer-doc-sync', 'task-review', 'task-guide', 'task-explore', 'task-pair', 'task-tutor', 'task-direct']
    /**
     * 旧生成名称也不能通过将来源换成旧安装根而重新复制。
     */
    const aliases = ['review', 'guide', 'explore', 'pair', 'tutor', 'direct'].map(mode => `speckit-modes-${mode}`)
    /**
     * 源与目标重合时也不得删除既有副本或误报复制成功。
     */
    const sameRoot = path.join(root, 'same-root')
    fs.mkdirSync(target, { recursive: true })
    fs.mkdirSync(sameRoot, { recursive: true })
    fs.mkdirSync(path.join(target, 'task-pair'), { recursive: true })
    fs.writeFileSync(path.join(target, 'task-pair/user.md'), '用户文件，保留')
    fs.writeFileSync(path.join(target, 'task-guide'), '用户同名普通文件，保留')
    fs.writeFileSync(path.join(root, 'user-target'), '链接目标，保留')
    fs.symlinkSync(path.join(root, 'user-target'), path.join(target, 'task-direct'))
    /**
     * 逐个构造已退役正文与旧入口来源。
     */
    for (const name of [...retired, ...aliases]) {
      /**
       * 一级和集合布局分别覆盖，正文存在才构成可复制来源。
       */
      const folder = path.join(source, name.startsWith('speckit-') ? '' : 'workflow', name)
      fs.mkdirSync(folder, { recursive: true })
      fs.writeFileSync(path.join(folder, 'SKILL.md'), `# 旧技能 ${name}`)
    }
    /**
     * 当前能力与相近名称作为不应误伤的来源。
     */
    for (const name of ['task-increment', 'implementation-preparation', 'artifact-spec-analysis', 'artifact-project-description', 'task-pair-helper']) {
      /**
       * 当前技能及近似名称应继续复制，防止前缀匹配扩散。
       */
      const folder = path.join(source, 'workflow', name)
      fs.mkdirSync(folder, { recursive: true })
      fs.writeFileSync(path.join(folder, 'SKILL.md'), `# 当前技能 ${name}`)
    }
    /**
     * 通过实际 Bash 入口重复刷新，覆盖已有目标及重复稳定。
     */
    const script = path.join(SCRIPT_DIR, 'link-skills.sh')
    /**
     * 首次与重复执行均需保护已有目标。
     */
    for (let attempt = 0; attempt < 2; attempt++) {
      /**
       * 日志与退出码来自真实脚本，不使用模拟复制实现。
       */
      const result = spawnSync('bash', [script, source, target], { encoding: 'utf8' })
      assert.equal(result.status, 0, result.stdout + result.stderr)
      /**
       * 每个退役名称的正文均不得生成。
       */
      for (const name of [...retired, ...aliases]) {
        assert.equal(fs.existsSync(path.join(target, name, 'SKILL.md')), false, `退役来源被复制：${name}`)
      }
      assert.equal(fs.readFileSync(path.join(target, 'task-pair/user.md'), 'utf8'), '用户文件，保留')
      assert.equal(fs.readFileSync(path.join(target, 'task-guide'), 'utf8'), '用户同名普通文件，保留')
      assert.equal(fs.lstatSync(path.join(target, 'task-direct')).isSymbolicLink(), true)
      assert.equal(fs.readFileSync(path.join(root, 'user-target'), 'utf8'), '链接目标，保留')
      /**
       * 当前能力及相近名称的正文应完整复制。
       */
      for (const name of ['task-increment', 'implementation-preparation', 'artifact-spec-analysis', 'artifact-project-description', 'task-pair-helper']) {
        assert.equal(fs.readFileSync(path.join(target, name, 'SKILL.md'), 'utf8'), `# 当前技能 ${name}`)
      }
    }
    fs.mkdirSync(path.join(sameRoot, 'task-review'))
    fs.writeFileSync(path.join(sameRoot, 'task-review/SKILL.md'), '# 历史来源，保留')
    /**
     * 退役来源与目标相同仍只跳过，不做目录删除。
     */
    const same = spawnSync('bash', [script, sameRoot, sameRoot], { encoding: 'utf8' })
    assert.equal(same.status, 0, same.stdout + same.stderr)
    assert.equal(fs.readFileSync(path.join(sameRoot, 'task-review/SKILL.md'), 'utf8'), '# 历史来源，保留')
  }
  finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

test('Bash：退役来源不复活且用户副本保持', testRetiredSources)

/**
 * 正式来源与集合均清退旧能力，同时继续交付 Increment 与三个当前 hooks。
 */
function testCurrentWorkflowSources() {
  /**
   * 从测试位置定位真实来源，避免依赖进程工作目录。
   */
  const source = path.resolve(SCRIPT_DIR, '../../../../packages/skills-distribution-urgent/src/workflow')
  /**
   * 读取实际集合选择，检查其已选择的技能均有实际正文。
   */
  const config = JSON.parse(fs.readFileSync(path.join(source, 'collection.config.json'), 'utf8'))
  assert.deepEqual(Object.keys(config.skill).sort(), ['artifact-project-description', 'artifact-spec-analysis', 'bug-report', 'implementation-preparation', 'task-increment'])
  /**
   * 每项当前集合选择必须有可读取的实际正文。
   */
  for (const name of Object.keys(config.skill)) {
    assert.equal(fs.existsSync(path.join(source, name, 'SKILL.md')), true, `所选来源缺失：${name}`)
  }
  /**
   * 所有明确清退的源码目录都应不存在。
   */
  for (const name of ['task-pair', 'task-tutor', 'task-direct', 'task-review', 'task-guide', 'task-explore', 'mvu-gate', 'explainer-doc-sync', 'artifact-business-flow', 'artifact-logic-flow', 'artifact-issue-description', 'artifact-pr-description']) {
    assert.equal(fs.existsSync(path.join(source, name)), false, `旧源码未清退：${name}`)
  }
}

test('正式workflow只保留当前来源与集合选择', testCurrentWorkflowSources)
