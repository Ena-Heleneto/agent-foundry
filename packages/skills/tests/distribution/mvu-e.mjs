import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { createSandbox } from './sandbox.mjs'

/**
 * 执行真实 Git；跟踪与状态查询使用字面量 pathspec，check-ignore 原生只接受路径。
 * @param {object} sandbox 测试隔离环境。
 * @param {string[]} args Git 参数。
 * @returns {string} 标准输出。
 */
function git(sandbox, args) {
  /**
   * check-ignore 不支持 literal magic，其余命令避免名称被当作 pathspec 展开。
   */
  const prefix = args[0] === 'check-ignore' ? [] : ['--literal-pathspecs']
  /**
   * 不经 shell 拼接路径，且不读取开发者的 Git 配置。
   */
  const result = spawnSync('git', [...prefix, '-C', sandbox.project, ...args], {
    env: sandbox.env,
    encoding: 'utf8',
    timeout: 10000,
  })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}

/**
 * 创建普通临时仓库，并保留已有 exclude、共享配置和未选技能作为保护哨兵。
 * @param {import('node:test').TestContext} context 自动清理所属测试。
 * @returns {object} 测试仓库、文件路径及隔离环境。
 */
function repository(context) {
  /**
   * 每项测试独占项目与用户目录。
   */
  const sandbox = createSandbox()
  context.after(sandbox.cleanup)
  git(sandbox, ['init', '--quiet'])
  /**
   * Git 自身模板之外的已有规则，验证原始字节前缀不会被重写。
   */
  const exclude = path.join(sandbox.project, '.git/info/exclude')
  fs.writeFileSync(exclude, '# 已有规则\nexisting.tmp\n!.agents/skills/selected/\n')
  /**
   * 本次成功技能；附件必须在排除后仍能读取。
   */
  const selected = writeFile(sandbox.project, '.agents/skills/selected/SKILL.md', '已安装正文\n')
  writeFile(sandbox.project, '.agents/skills/selected/references/说明.md', '附件\n')
  writeFile(sandbox.project, '.agents/skills/unselected/SKILL.md', '其他技能\n')
  writeFile(sandbox.project, '.agents/config.json', '{}\n')
  writeFile(sandbox.project, '.gitignore', '# 项目原规则\n')
  return { ...sandbox, exclude, selected: path.dirname(selected) }
}

/**
 * 仅在测试拥有的目录创建文件。
 * @param {string} root 临时项目根。
 * @param {string} relative 文件相对路径。
 * @param {string} content 文件正文。
 * @returns {string} 文件绝对路径。
 */
function writeFile(root, relative, content) {
  /**
   * 测试输入的最终绝对位置。
   */
  const absolute = path.join(root, relative)
  fs.mkdirSync(path.dirname(absolute), { recursive: true })
  fs.writeFileSync(absolute, content)
  return absolute
}

/**
 * 通过真实 Git 联合观察来源、跟踪和可见性，不用原型自己的计算作为预期值。
 * @param {object} sandbox 测试仓库。
 * @param {string} relative 待核验的项目相对文件。
 */
function assertHidden(sandbox, relative) {
  assert.match(git(sandbox, ['check-ignore', '-v', '--', relative]), /^\.git\/info\/exclude:/u)
  assert.equal(git(sandbox, ['ls-files', '-z', '--', relative]), '')
  assert.equal(git(sandbox, ['status', '--porcelain', '--untracked-files=all', '--', relative]), '')
  assert.ok(fs.readFileSync(path.join(sandbox.project, relative)).length > 0)
}

/**
 * 测试专用最小验证骨架，后续 T033/T034 保留场景并改接平台实现。
 * 不作为安装器运行核心，也不接入公共 --hidden 参数。
 * @param {object} request 显式项目、隔离环境及本次路径事实。
 * @returns {object} 隐匿阶段结果；安装事实由调用方独立保存。
 */
function hideOwnedPaths(request) {
  if (request.enabled === false)
    return { status: 'skipped', reason: 'disabled' }
  if (!request.project)
    return { status: 'skipped', reason: 'no-explicit-project' }
  if (!fs.existsSync(path.join(request.project, '.git')) || !fs.lstatSync(path.join(request.project, '.git')).isDirectory())
    return { status: 'skipped', reason: 'no-local-git-directory' }
  /**
   * 项目外、共享或未成功路径逐项报告，不扩大为整目录忽略。
   */
  const skipped = []
  try {
    /**
     * 自有普通仓库的本地排除文件，不允许经链接写入其他位置。
     */
    const exclude = path.join(request.project, '.git/info/exclude')
    assertNoLinkedParents(request.project, '.git/info/exclude')
    if (fs.lstatSync(exclude, { throwIfNoEntry: false })?.isFile() === false)
      throw new Error('unsafe-exclude')
    /**
     * 先核对所有候选，再一次追加；已跟踪目标不产生任何新规则。
     */
    const selected = []
    /**
     * 路径事实必须显式来自本次成功的独占内容。
     */
    for (const item of request.paths) {
      /**
       * 候选检查只读取文件系统及 Git 索引。
       */
      const candidate = hiddenCandidate(request, item)
      if (candidate.reason)
        skipped.push({ path: item.path, reason: candidate.reason })
      else
        selected.push(candidate)
    }
    if (selected.length === 0)
      return { status: 'skipped', reason: 'no-applicable-paths', skipped }
    appendRules(exclude, selected)
    /**
     * 写入不等于有效：读取 Git 实际来源及未跟踪状态，失败独立报告。
     */
    for (const item of selected) {
      assert.match(git(request, ['check-ignore', '-v', '--', item.relative]), /^\.git\/info\/exclude:/u)
      assert.equal(git(request, ['status', '--porcelain', '--untracked-files=all', '--', item.relative]), '')
    }
    return { status: 'success', skipped }
  }
  catch (error) {
    return { status: 'failed', reason: error.message, skipped }
  }
}

/**
 * 精确规则追加去重，保留用户已有字节及末行没有换行的情况。
 * @param {string} exclude 测试仓库本地排除文件。
 * @param {object[]} selected 已核验的精确规则。
 */
function appendRules(exclude, selected) {
  /**
   * 用户原始规则不得被重写或排序。
   */
  const before = fs.existsSync(exclude) ? fs.readFileSync(exclude, 'utf8') : ''
  /**
   * 当前已有规则与本轮重复选择均不重复追加。
   */
  const additions = [...new Set(selected.map(item => item.rule))].filter(rule => !before.split('\n').includes(rule))
  try {
    if (additions.length > 0)
      fs.appendFileSync(exclude, `${before && !before.endsWith('\n') ? '\n' : ''}${additions.join('\n')}\n`)
  }
  catch {
    throw new Error('exclude-write-failed')
  }
}

/**
 * 检查项目内每一级路径，防止候选父目录或 Git 元数据链接越界。
 * @param {string} project 明确项目根。
 * @param {string} relative 项目相对路径。
 */
function assertNoLinkedParents(project, relative) {
  /**
   * 逐级核对而不是跟随链接取得真实路径后继续写入。
   */
  let current = project
  /**
   * 逐段路径含最后一级；本实验对所有链接保守拒绝。
   */
  for (const component of relative.split(path.sep)) {
    current = path.join(current, component)
    if (fs.lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink())
      throw new Error('linked-path')
  }
}

/**
 * 校验本次成功的独占目标，并生成锚定项目根的字面量 ignore 规则。
 * @param {object} request 项目和隔离 Git 环境。
 * @param {object} item 安装/挂载提供的路径事实。
 * @returns {object} 精确规则及路径，或不适用原因。
 */
function hiddenCandidate(request, item) {
  if (!item.successful || !item.exclusive)
    return { reason: 'not-successful-exclusive' }
  /**
   * 绝对路径转换只用于边界核查，项目外内容不得写入本地规则。
   */
  const relative = path.relative(request.project, item.path)
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
    return { reason: 'outside-project' }
  if (!relative || /[\r\n\0]/u.test(relative))
    throw new Error('unsafe-path')
  assertNoLinkedParents(request.project, relative)
  if (git(request, ['ls-files', '-z', '--', relative]))
    throw new Error('tracked-path')
  /**
   * Git ignore 的特殊符号逐个转义；目录仅覆盖自身及后代。
   */
  const escaped = relative.split(path.sep).join('/').replace(/[\\*?[\]#! ]/gu, '\\$&')
  return { relative, rule: `/${escaped}${fs.statSync(item.path).isDirectory() ? '/' : ''}` }
}

test('普通仓库只隐藏成功且独占的路径，保留反向规则并且重复执行不追加', (context) => {
  /**
   * 自有临时仓库与原始 exclude 内容。
   */
  const sandbox = repository(context)
  /**
   * 写入前的原始字节，包括已有反向规则。
   */
  const before = fs.readFileSync(sandbox.exclude, 'utf8')
  /**
   * 共享配置及未成功路径不允许进入新增规则。
   */
  const request = { ...sandbox, paths: [
    { path: sandbox.selected, successful: true, exclusive: true },
    { path: path.join(sandbox.project, '.agents/config.json'), successful: true, exclusive: false },
    { path: path.join(sandbox.project, '.agents/skills/unselected'), successful: false, exclusive: true },
  ] }
  assert.equal(hideOwnedPaths(request).status, 'success')
  assertHidden(sandbox, '.agents/skills/selected/SKILL.md')
  assertHidden(sandbox, '.agents/skills/selected/references/说明.md')
  assert.match(git(sandbox, ['status', '--porcelain', '--untracked-files=all']), /unselected\/SKILL\.md/u)
  assert.match(git(sandbox, ['status', '--porcelain', '--untracked-files=all']), /\.agents\/config\.json/u)
  /**
   * 同版重试前的完整规则，与第一次之前的规则分别核对。
   */
  const after = fs.readFileSync(sandbox.exclude, 'utf8')
  assert.ok(after.startsWith(before))
  assert.equal(hideOwnedPaths(request).status, 'success')
  assert.equal(fs.readFileSync(sandbox.exclude, 'utf8'), after)
  assert.equal(fs.readFileSync(path.join(sandbox.project, '.gitignore'), 'utf8'), '# 项目原规则\n')
})

test('默认关闭时 exclude 原始字节不变且文件保持可见', (context) => {
  /**
   * 正常仓库只改变 hidden 开关。
   */
  const sandbox = repository(context)
  /**
   * 关闭开关前的规则。
   */
  const before = fs.readFileSync(sandbox.exclude)
  assert.equal(hideOwnedPaths({ ...sandbox, enabled: false, paths: [{ path: sandbox.selected, successful: true, exclusive: true }] }).status, 'skipped')
  assert.deepEqual(fs.readFileSync(sandbox.exclude), before)
  assert.match(git(sandbox, ['status', '--porcelain', '--untracked-files=all']), /selected\/SKILL\.md/u)
})

test('父仓库中的子目录及无仓库目录跳过，不向上写 exclude 或初始化 Git', (context) => {
  /**
   * 普通父仓库与没有自身 .git 的子项目。
   */
  const sandbox = repository(context)
  /**
   * 父仓库规则应在子目录操作前后保持原样。
   */
  const before = fs.readFileSync(sandbox.exclude)
  /**
   * 已经安装成功的子项目文件。
   */
  const childFile = writeFile(sandbox.project, 'child/.agents/skills/new/SKILL.md', '子项目正文\n')
  assert.equal(hideOwnedPaths({ ...sandbox, project: path.join(sandbox.project, 'child'), paths: [{ path: path.dirname(childFile), successful: true, exclusive: true }] }).reason, 'no-local-git-directory')
  assert.deepEqual(fs.readFileSync(sandbox.exclude), before)
  assert.equal(fs.existsSync(path.join(sandbox.project, 'child/.git')), false)
  assert.equal(hideOwnedPaths({ ...sandbox, project: sandbox.userHome, paths: [] }).status, 'skipped')
  assert.equal(fs.existsSync(path.join(sandbox.userHome, '.git')), false)
})

test('真实 worktree 的 .git 文件按首版约定跳过，公共仓库规则不变', (context) => {
  /**
   * 只在测试自有仓库产生一个空提交，用于创建真实 worktree。
   */
  const sandbox = repository(context)
  git(sandbox, ['-c', 'user.name=测试', '-c', 'user.email=test@example.invalid', 'commit', '--quiet', '--allow-empty', '-m', 'fixture'])
  /**
   * worktree 与主测试仓库处于同一个自有临时根。
   */
  const worktree = path.join(sandbox.root, 'worktree')
  git(sandbox, ['worktree', 'add', '--quiet', '--detach', worktree])
  /**
   * .git 文件不得被当目录拼接，也不得使用 common-dir 修改共享配置。
   */
  const before = fs.readFileSync(sandbox.exclude)
  assert.ok(fs.statSync(path.join(worktree, '.git')).isFile())
  assert.equal(hideOwnedPaths({ ...sandbox, project: worktree, paths: [] }).reason, 'no-local-git-directory')
  assert.deepEqual(fs.readFileSync(sandbox.exclude), before)
})

test('global 无显式项目跳过，有项目时只排除项目内独占文件', (context) => {
  /**
   * 全局技能在隔离用户目录内，项目内入口另列成功事实。
   */
  const sandbox = repository(context)
  /**
   * 模拟真实全局安装结果，不指向开发者目录。
   */
  const globalSkill = writeFile(sandbox.userHome, '.agents/skills/global/SKILL.md', '全局正文\n')
  /**
   * 挂载新建的独占入口可以在明确项目内隐藏。
   */
  const entry = writeFile(sandbox.project, '.codex/prompts/new.md', '入口\n')
  /**
   * 本次全局安装及项目内新增入口的实际路径。
   */
  const paths = [globalSkill, entry].map(absolute => ({ path: absolute, successful: true, exclusive: true }))
  assert.equal(hideOwnedPaths({ ...sandbox, project: undefined, paths }).reason, 'no-explicit-project')
  /**
   * 项目外路径与项目内成功路径需要分别报告。
   */
  const report = hideOwnedPaths({ ...sandbox, paths })
  assert.equal(report.status, 'success')
  assert.ok(report.skipped.some(item => item.path === globalSkill && item.reason === 'outside-project'))
  assertHidden(sandbox, '.codex/prompts/new.md')
  assert.equal(fs.readFileSync(globalSkill, 'utf8'), '全局正文\n')
  assert.equal(fs.existsSync(path.join(sandbox.userHome, '.git')), false)
})

test('空格、通配字符和前导标记按字面量排除，同前缀的未选目录保持可见', (context) => {
  /**
   * 特殊路径始终通过独立手写的相近路径检验没有扩大匹配。
   */
  const sandbox = repository(context)
  /**
   * 每对路径在未转义时可能互相混淆。
   */
  const cases = [
    ['.agents/skills/name with space', '.agents/skills/name with space-other'],
    ['.agents/skills/star*name', '.agents/skills/starZZname'],
    ['.agents/skills/question?name', '.agents/skills/questionXname'],
    ['.agents/skills/bracket[ab]', '.agents/skills/bracketa'],
    ['#hash', '#hash-other'],
    ['!bang', '!bang-other'],
    ['trailing ', 'trailing'],
    ['back\\slash', 'backslash'],
  ]
  /**
   * Linux 允许的字面量名称不代表其他操作系统同样支持。
   */
  for (const [selected, unselected] of cases) {
    writeFile(sandbox.project, `${selected}/SKILL.md`, '所选正文\n')
    writeFile(sandbox.project, `${unselected}/SKILL.md`, '未选正文\n')
    assert.equal(hideOwnedPaths({ ...sandbox, paths: [{ path: path.join(sandbox.project, selected), successful: true, exclusive: true }] }).status, 'success')
    assertHidden(sandbox, `${selected}/SKILL.md`)
    assert.ok(git(sandbox, ['status', '--porcelain', '--untracked-files=all', '--', `${unselected}/SKILL.md`]).length > 0)
  }
})

test('目录内有已跟踪文件时拒绝隐匿，不取消跟踪且保留已安装文件', (context) => {
  /**
   * 被跟踪技能目录必须在写规则之前发现。
   */
  const sandbox = repository(context)
  git(sandbox, ['add', '--', '.agents/skills/selected/SKILL.md'])
  /**
   * 验证失败没有改动 exclude 的基线。
   */
  const before = fs.readFileSync(sandbox.exclude)
  assert.equal(hideOwnedPaths({ ...sandbox, paths: [{ path: sandbox.selected, successful: true, exclusive: true }] }).reason, 'tracked-path')
  assert.deepEqual(fs.readFileSync(sandbox.exclude), before)
  assert.match(git(sandbox, ['ls-files', '--', '.agents/skills/selected']), /SKILL\.md/u)
  assert.equal(fs.readFileSync(path.join(sandbox.selected, 'SKILL.md'), 'utf8'), '已安装正文\n')
})

test('exclude 不可写时报告独立失败，安装结果和已有规则不丢失', (context) => {
  /**
   * 真实权限错误不使用写入 mock，测试环境须为非 root。
   */
  const sandbox = repository(context)
  /**
   * 文件不可写前的规则内容。
   */
  const before = fs.readFileSync(sandbox.exclude)
  fs.chmodSync(sandbox.exclude, 0o444)
  try {
    assert.equal(hideOwnedPaths({ ...sandbox, paths: [{ path: sandbox.selected, successful: true, exclusive: true }] }).reason, 'exclude-write-failed')
  }
  finally {
    fs.chmodSync(sandbox.exclude, 0o644)
  }
  assert.deepEqual(fs.readFileSync(sandbox.exclude), before)
  assert.equal(fs.readFileSync(path.join(sandbox.selected, 'SKILL.md'), 'utf8'), '已安装正文\n')
})

test('链接指向外部的 exclude 与候选父目录均拒绝，不修改外部哨兵', (context) => {
  /**
   * 链接越界必须在写入前拒绝。
   */
  const sandbox = repository(context)
  /**
   * 项目之外、但仍属于本项测试的外部文件。
   */
  const sentinel = writeFile(sandbox.userHome, 'sentinel', '外部原文\n')
  fs.rmSync(sandbox.exclude)
  fs.symlinkSync(sentinel, sandbox.exclude)
  assert.equal(hideOwnedPaths({ ...sandbox, paths: [{ path: sandbox.selected, successful: true, exclusive: true }] }).status, 'failed')
  assert.equal(fs.readFileSync(sentinel, 'utf8'), '外部原文\n')
  fs.rmSync(sandbox.exclude)
  fs.writeFileSync(sandbox.exclude, '# 新规则\n')
  fs.symlinkSync(sandbox.userHome, path.join(sandbox.project, 'linked'))
  assert.equal(hideOwnedPaths({ ...sandbox, paths: [{ path: path.join(sandbox.project, 'linked/sentinel'), successful: true, exclusive: true }] }).status, 'failed')
  assert.equal(fs.readFileSync(sandbox.exclude, 'utf8'), '# 新规则\n')
  assert.equal(fs.readFileSync(sentinel, 'utf8'), '外部原文\n')
})

test('换行路径不能注入第二条规则，项目根不能成为整仓库排除目标', (context) => {
  /**
   * 危险目标仍只在自有临时目录中构造。
   */
  const sandbox = repository(context)
  /**
   * 任意目标失败都必须保持原规则。
   */
  const before = fs.readFileSync(sandbox.exclude)
  /**
   * 控制字符和仓库根均无法形成安全精确规则。
   */
  for (const target of [path.join(sandbox.project, 'bad\n*'), sandbox.project]) {
    assert.equal(hideOwnedPaths({ ...sandbox, paths: [{ path: target, successful: true, exclusive: true }] }).status, 'failed')
    assert.deepEqual(fs.readFileSync(sandbox.exclude), before)
  }
})

test('exclude 的悬空链接也必须在追加前拒绝，不得在项目外创建目标', (context) => {
  /**
   * 不存在的外部目标使 existsSync 为 false，但链接本身仍然存在。
   */
  const sandbox = repository(context)
  /**
   * 原型不能通过悬空链接创建此哨兵。
   */
  const absent = path.join(sandbox.userHome, 'must-not-create')
  fs.rmSync(sandbox.exclude)
  fs.symlinkSync(absent, sandbox.exclude)
  assert.equal(hideOwnedPaths({ ...sandbox, paths: [{ path: sandbox.selected, successful: true, exclusive: true }] }).status, 'failed')
  assert.equal(fs.existsSync(absent), false)
})
