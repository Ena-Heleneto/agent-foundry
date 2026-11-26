import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { createEngineInstallScript } from '../../build/plugins/vite-plugin-engine/install-script.ts'
import { createHiddenInstallScript } from '../../build/plugins/vite-plugin-engine/sub-plugins/vite-plugin-hidden-install/index.ts'
import { minifyShellScript } from '../../build/utils/minify-shell-script.ts'
import { createSandbox } from './sandbox.mjs'

/**
 * 在隔离环境运行实际命令，保留标准输出和退出状态。
 */
function run(sandbox, command, args) {
  /**
   * 所有命令在隔离的项目和用户目录中运行。
   */
  const result = spawnSync(command, args, { cwd: sandbox.project, env: sandbox.env, encoding: 'utf8', timeout: 15_000 })
  assert.ifError(result.error)
  return result
}

/**
 * 在测试拥有的目录写入夹具。
 */
function write(root, relative, content, mode) {
  /**
   * 夹具在独占根目录中的实际路径。
   */
  const file = join(root, relative)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content, { mode })
  return file
}

/**
 * 建立只含本地配置的临时 Git 仓库并预置已有规则。
 */
function repository(t) {
  /**
   * 每次隐匿请求都在独立的项目和用户目录执行。
   */
  const sandbox = createSandbox()
  t.after(sandbox.cleanup)
  assert.equal(run(sandbox, 'git', ['init', '-q']).status, 0)
  return { ...sandbox, exclude: write(sandbox.project, '.git/info/exclude', '# 保留原规则\nexisting.tmp') }
}

/**
 * 写入本次成功名单并执行实际生成的 Bash，读取独立结果。
 */
function runHidden(sandbox, candidates, successful, project = sandbox.project) {
  /**
   * 每次调用使用不同的结果文件，便于检查重复请求。
   */
  const work = join(sandbox.root, 'requests', String(sandbox.requestCount ?? 0))
  sandbox.requestCount = (sandbox.requestCount ?? 0) + 1
  /**
   * 实际模板生成的 Bash 文件。
   */
  const script = write(work, 'hidden-install.sh', createHiddenInstallScript(candidates.map(name => ({ name }))))
  /**
   * 独立传入本次成功名单。
   */
  const input = write(work, 'successful.json', JSON.stringify(successful))
  /**
   * 脚本在该路径写入独立结果。
   */
  const output = join(work, 'result.json')
  /**
   * 子进程结果和脚本写出的 JSON 分别读取。
   */
  const result = run(sandbox, 'bash', [script, '--project', project, '--agent-root', '.agents/skills', '--successful-skills-file', input, '--result-file', output])
  return { ...result, report: existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : null }
}

/**
 * 表示一个技能的已安装或不完整结果。
 */
function selection(project, name, complete = true) {
  return { name, installRelativeDirectory: name, installedPath: join(project, '.agents/skills', name), complete }
}

/**
 * 从 Git 实际结果观察技能正文是否可见。
 */
function ignored(sandbox, name) {
  /**
   * check-ignore 的退出码 0 和 1 对应实际忽略与可见。
   */
  const result = run(sandbox, 'git', ['check-ignore', '-q', '--', `.agents/skills/${name}/SKILL.md`])
  assert.ok([0, 1].includes(result.status), result.stderr)
  return result.status === 0
}

test('隐匿只处理本次成功的候选并保留历史、跟踪和未完成内容', (t) => {
  /**
   * 同时测试新增技能和不应被隐藏的候选目录。
   */
  const sandbox = repository(t)
  /**
   * 包含 Git 通配符、单引号、空格和反斜杠的技能应按字面路径处理。
   */
  const current = 'current [x]\'\\?*'
  /**
   * 实际项目目录包括历史、已跟踪和未知候选。
   */
  const names = [current, 'historical', 'tracked', 'incomplete', 'outside', 'uncatalogued']
  for (const name of names)
    write(sandbox.project, `.agents/skills/${name}/SKILL.md`, name)
  assert.equal(run(sandbox, 'git', ['add', '--', '.agents/skills/tracked/SKILL.md']).status, 0)
  /**
   * 只给出本次复制或尝试过的条目，保留一个项目外路径反例。
   */
  const successful = [
    selection(sandbox.project, current),
    selection(sandbox.project, 'tracked'),
    selection(sandbox.project, 'incomplete', false),
    selection(sandbox.root, 'outside'),
    selection(sandbox.project, 'uncatalogued'),
  ]
  /**
   * 用原始字节核对现有规则的保留情况。
   */
  const before = readFileSync(sandbox.exclude, 'utf8')
  /**
   * 只有构建候选能进入本次排除范围。
   */
  const candidates = [current, 'historical', 'tracked', 'incomplete', 'outside']
  /**
   * 对生成产物发起一次真实隐匿请求。
   */
  const result = runHidden(sandbox, candidates, successful)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(ignored(sandbox, 'historical'), false)
  assert.equal(ignored(sandbox, current), true)
  assert.equal(ignored(sandbox, 'tracked'), false)
  assert.equal(ignored(sandbox, 'incomplete'), false)
  assert.equal(ignored(sandbox, 'outside'), false)
  assert.equal(ignored(sandbox, 'uncatalogued'), false)
  assert.equal(run(sandbox, 'git', ['ls-files', '--', '.agents/skills/tracked']).stdout, '.agents/skills/tracked/SKILL.md\n')
  assert.equal(result.report.status, 'success')
  assert.deepEqual(result.report.processed, [`.agents/skills/${current}`])
  assert.equal(result.report.skipped.length, 4)
  /**
   * 重新执行时原规则及本次新增规则都保持原字节。
   */
  const after = readFileSync(sandbox.exclude, 'utf8')
  assert.ok(after.startsWith(`${before}\n`))
  assert.equal(after.slice(before.length).trim().split('\n').length, 1)
  assert.equal(runHidden(sandbox, candidates, successful).status, 0)
  assert.equal(readFileSync(sandbox.exclude, 'utf8'), after)
})

test('生成的隐匿脚本可在 Node 调用失败时写入规则', (t) => {
  /**
   * 将 Node 替身限制在当前隔离项目，任何调用都会留下记录并退出失败。
   */
  const sandbox = repository(t)
  write(sandbox.root, 'bin/node', '#!/usr/bin/env bash\n: > node-ran\nexit 73\n', 0o755)
  sandbox.env.PATH = `${join(sandbox.root, 'bin')}:${process.env.PATH}`
  write(sandbox.project, '.agents/skills/current/SKILL.md', '技能正文\n')
  /**
   * 用 Git 的实际结果核对脚本完成了隐匿。
   */
  const result = runHidden(sandbox, ['current'], [selection(sandbox.project, 'current')])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(ignored(sandbox, 'current'), true)
  assert.equal(existsSync(join(sandbox.project, 'node-ran')), false)
})

test('排除规则去重时区分 CRLF 与未换行的末尾回车', (t) => {
  /**
   * 只有完整行的行尾回车参与 CRLF 归一，原文件字节始终保留。
   */
  for (const [ending, addition] of [['\r\n', ''], ['\r', '\n/.agents/skills/current/\n']]) {
    /**
     * 两种已有规则各使用独立的 Git 仓库。
     */
    const sandbox = repository(t)
    /**
     * 当前技能规则所在行的原始字节。
     */
    const before = `# 已有规则\r\n/.agents/skills/current/${ending}`
    writeFileSync(sandbox.exclude, before)
    write(sandbox.project, '.agents/skills/current/SKILL.md', '技能正文\n')
    /**
     * 核对实际增量，保留尾部任意已有字符。
     */
    const result = runHidden(sandbox, ['current'], [selection(sandbox.project, 'current')])
    assert.equal(result.status, 0, result.stderr)
    assert.equal(readFileSync(sandbox.exclude, 'utf8'), before + addition)
  }
})

test('Git 索引跟踪了技能目录名本身时跳过该技能', (t) => {
  /**
   * 索引记录原文件，工作区中同名位置现在是目录。
   */
  const sandbox = repository(t)
  /**
   * 先添加原文件，保留索引条目并用技能目录替换工作树路径。
   */
  const indexed = write(sandbox.project, '.agents/skills/current', '原文件\n')
  assert.equal(run(sandbox, 'git', ['add', '--', '.agents/skills/current']).status, 0)
  unlinkSync(indexed)
  write(sandbox.project, '.agents/skills/current/SKILL.md', '技能正文\n')
  /**
   * 只查询目录子树会漏过这个已跟踪路径。
   */
  const result = runHidden(sandbox, ['current'], [selection(sandbox.project, 'current')])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.report?.status, 'skipped')
  assert.equal(result.report.skipped[0].reasonCode, 'tracked')
  assert.equal(ignored(sandbox, 'current'), false)
  assert.equal(readFileSync(sandbox.exclude, 'utf8'), '# 保留原规则\nexisting.tmp')
})

test('子目录和 .git 文件跳过隐匿且保留父仓库规则', (t) => {
  /**
   * 父仓库内已有本地排除规则。
   */
  const sandbox = repository(t)
  /**
   * 子项目依次代表无 Git 的目录和使用 .git 文件的工作树。
   */
  const child = join(sandbox.project, 'child')
  write(child, '.agents/skills/current/SKILL.md', '子目录技能\n')
  for (const gitFile of [false, true]) {
    if (gitFile)
      write(child, '.git', 'gitdir: ../.git\n')
    /**
     * 指定子目录后，父仓库的 .git 与进程当前目录都不能被选中。
     */
    const result = runHidden(sandbox, ['current'], [selection(child, 'current')], child)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.report?.status, 'skipped')
    assert.equal(readFileSync(sandbox.exclude, 'utf8'), '# 保留原规则\nexisting.tmp')
  }
})

test('技能根是外部链接时不写规则', (t) => {
  /**
   * 候选看起来在技能根下，实际通过链接指向沙箱中的另一目录。
   */
  const sandbox = repository(t)
  write(sandbox.root, 'external/current/SKILL.md', '外部技能\n')
  mkdirSync(join(sandbox.project, '.agents'))
  symlinkSync(join(sandbox.root, 'external'), join(sandbox.project, '.agents/skills'))
  /**
   * 检查只读取项目内普通目录，外部链接仍完整保留。
   */
  const result = runHidden(sandbox, ['current'], [selection(sandbox.project, 'current')])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.report?.status, 'skipped')
  assert.equal(readFileSync(sandbox.exclude, 'utf8'), '# 保留原规则\nexisting.tmp')
})

test('排除文件是外部链接时报告失败且保留外部原文件', (t) => {
  /**
   * 把项目的排除文件替换为指向沙箱内其他位置的链接。
   */
  const sandbox = repository(t)
  /**
   * 记录外部原文件，确认没有越界追加。
   */
  const external = write(sandbox.root, 'external-exclude', '# 外部规则\n')
  unlinkSync(sandbox.exclude)
  symlinkSync(external, sandbox.exclude)
  write(sandbox.project, '.agents/skills/current/SKILL.md', '已安装正文\n')
  /**
   * 排除写入失败应独立报告，不改变文件或安装结果。
   */
  const result = runHidden(sandbox, ['current'], [selection(sandbox.project, 'current')])
  assert.equal(result.status, 1)
  assert.equal(result.report?.reasonCode, 'exclude-write-failed')
  assert.equal(readFileSync(external, 'utf8'), '# 外部规则\n')
  assert.equal(readFileSync(join(sandbox.project, '.agents/skills/current/SKILL.md'), 'utf8'), '已安装正文\n')
})

test('项目反向规则使隐匿失效时返回失败并保留实际技能', (t) => {
  /**
   * .gitignore 的反向规则优先于本地 exclude。
   */
  const sandbox = repository(t)
  /**
   * 在隐匿失败后读回正文验证技能仍在。
   */
  const skill = write(sandbox.project, '.agents/skills/current/SKILL.md', '已安装正文\n')
  write(sandbox.project, '.gitignore', '!/.agents/skills/current/\n')
  /**
   * 写入规则后必须使用 Git 实际检查结果。
   */
  const result = runHidden(sandbox, ['current'], [selection(sandbox.project, 'current')])
  assert.equal(result.status, 1)
  assert.equal(result.report?.status, 'failed')
  assert.equal(result.report.failed[0].path, '.agents/skills/current')
  assert.equal(ignored(sandbox, 'current'), false)
  assert.equal(readFileSync(skill, 'utf8'), '已安装正文\n')
})

/**
 * 打包真实隐匿及引擎模板和普通技能，替换远端下载及 npm 下载 jq 的外部步骤。
 *
 * @param t 测试生命周期，负责清理独占项目。
 * @param names 本次安装的技能名。
 * @param options 夹具可替换同包路径及脚本正文，默认使用当前产物布局。
 * @param options.hiddenPath 包内的隐匿脚本路径。
 * @param options.hiddenScript 用于协议或运行异常的脚本正文。
 * @param options.mountPath 包内的挂载脚本路径。
 * @param options.mountSource 用于观察挂载结果的脚本正文。
 * @param options.engineSource 用于观察安装器实际调用的自定义入口。
 */
function installerFixture(t, names, {
  hiddenPath = 'engine/script/hidden-install.sh',
  hiddenScript,
  mountPath = 'engine/script/speckit-mount.sh',
  mountSource = 'printf "mounted\\n" > mount-result\n',
  engineSource,
} = {}) {
  /**
   * 离线测试用系统 jq 提供与 node-jq 相同的 CLI，uv 仅供入口前置探测。
   */
  const jq = spawnSync('sh', ['-c', 'command -v jq && command -v uv >/dev/null'], { encoding: 'utf8' })
  if (jq.status !== 0) {
    t.skip('隔离安装入口需要 jq 和 uv')
    return
  }
  /**
   * 安装项目与下载源均独享同一个临时沙箱。
   */
  const sandbox = repository(t)
  /**
   * 把技能与模板产物放进同版 tar 的根目录。
   */
  const source = join(sandbox.root, 'bundle')
  /**
   * 下载替身交付真实 tar，入口仍执行摘要校验和解包。
   */
  const archive = join(sandbox.root, 'content.tar.gz')
  for (const name of names)
    write(source, `skill/coding/${name}/SKILL.md`, name)
  write(source, hiddenPath, hiddenScript ?? createHiddenInstallScript([...names, 'historical'].map(name => ({ name }))))
  write(source, mountPath, mountSource)
  if (mountPath.startsWith('engine/'))
    write(source, 'engine/install.sh', engineSource ?? createEngineInstallScript([mountPath.slice('engine/'.length)]))
  assert.equal(run(sandbox, 'tar', ['-czf', archive, '-C', source, '.']).status, 0)
  write(sandbox.root, 'release.json', JSON.stringify([
    { version: '0.1.0', url: 'https://fixture.invalid/content.tar.gz', md5: createHash('md5').update(readFileSync(archive)).digest('hex') },
  ]))
  write(sandbox.root, 'bin/curl', `#!/usr/bin/env bash
set -eu
while [[ "$1" != --output ]]; do shift; done
case "$3" in
  */release.json) cp -- "$FOUNDRY_FIXTURE/release.json" "$2" ;;
  https://fixture.invalid/content.tar.gz) cp -- "$FOUNDRY_FIXTURE/content.tar.gz" "$2" ;;
  *) exit 7 ;;
esac
`, 0o755)
  write(sandbox.root, 'bin/npm', `#!/usr/bin/env bash
set -eu
while [[ "$1" != --prefix ]]; do shift; done
mkdir -p -- "$2/node_modules/node-jq/bin"
ln -s -- "$FOUNDRY_FIXTURE_JQ" "$2/node_modules/node-jq/bin/jq"
`, 0o755)
  write(sandbox.root, 'bin/jq', '#!/usr/bin/env bash\nexit 74\n', 0o755)
  Object.assign(sandbox.env, {
    FOUNDRY_FIXTURE: sandbox.root,
    FOUNDRY_FIXTURE_JQ: jq.stdout.trim(),
    PATH: `${join(sandbox.root, 'bin')}:${process.env.PATH}`,
  })
  return sandbox
}

/**
 * 执行压缩后的安装入口并透传本次安装选项。
 */
function install(sandbox, ...options) {
  /**
   * 以真实安装源作为压缩工具的输入。
   */
  const source = readFileSync(new URL('../../build/plugins/vite-plugin-curl/install.source.sh', import.meta.url), 'utf8')
  /**
   * 在隔离目录执行与构建产物同样的 Bash 内容。
   */
  const script = write(sandbox.root, 'install.sh', minifyShellScript(source))
  return run(sandbox, 'bash', [script, ...options])
}

test('安装入口仅在 --hidden 时隐匿本次复制的技能', (t) => {
  /**
   * 核对默认挂载、跳过挂载与显式隐匿的组合。
   */
  for (const options of [[], ['--no-mount'], ['--hidden'], ['--hidden', '--no-mount']]) {
    /**
     * 历史技能是同包模板候选，但不属于本次安装。
     */
    const sandbox = installerFixture(t, ['current'])
    if (!sandbox)
      return
    write(sandbox.project, '.agents/skills/historical/SKILL.md', '历史技能\n')
    /**
     * 每次真实安装都产生正文，仅显式请求时写排除。
     */
    const result = install(sandbox, ...options)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(readFileSync(join(sandbox.project, '.agents/skills/current/SKILL.md'), 'utf8'), 'current')
    assert.equal(ignored(sandbox, 'current'), options.includes('--hidden'))
    assert.equal(ignored(sandbox, 'historical'), false)
    assert.equal(existsSync(join(sandbox.project, 'mount-result')), !options.includes('--no-mount'))
  }
})

test('引擎入口能从包根下的旧脚本路径执行显式隐匿', (t) => {
  /**
   * 引擎支持参数协议，隐匿脚本位于旧布局中的包根 script 目录。
   */
  const sandbox = installerFixture(t, ['current'], { hiddenPath: 'script/hidden-install.sh' })
  if (!sandbox)
    return
  /**
   * 旧脚本位置也须通过真实运行及 Git 排除核验。
   */
  const result = install(sandbox, '--hidden', '--no-mount')
  assert.equal(result.status, 0, result.stderr)
  assert.equal(ignored(sandbox, 'current'), true)
})

test('第二次复制失败时只隐匿先前完整复制的技能', (t) => {
  /**
   * 在保留第一次真实复制的同时，注入有残留目录的第二次复制错误。
   */
  const sandbox = installerFixture(t, ['first', 'second'])
  if (!sandbox)
    return
  write(sandbox.root, 'bin/cp', `#!/usr/bin/env bash
set -eu
if [[ "$1" == -R ]]; then
  if [[ -f "$FOUNDRY_FIXTURE/copy-first" ]]; then
    mkdir -p -- "$4"
    printf 'partial' > "$4/SKILL.md"
    exit 9
  fi
  touch "$FOUNDRY_FIXTURE/copy-first"
fi
exec "$FOUNDRY_FIXTURE_CP" "$@"
`, 0o755)
  sandbox.env.FOUNDRY_FIXTURE_CP = spawnSync('sh', ['-c', 'command -v cp'], { encoding: 'utf8' }).stdout.trim()
  /**
   * 错误码保留，两个条目均以当前目录实况独立观察。
   */
  const result = install(sandbox, '--hidden')
  assert.equal(result.status, 9)
  for (const name of ['first', 'second'])
    assert.equal(ignored(sandbox, name), readFileSync(join(sandbox.project, '.agents/skills', name, 'SKILL.md'), 'utf8') !== 'partial')
  assert.equal(existsSync(join(sandbox.project, 'mount-result')), false)
})

test('同包隐匿协议未知时保留安装并继续默认挂载', (t) => {
  /**
   * 有可观察副作用的未知版本脚本必须保持未执行。
   */
  const sandbox = installerFixture(t, ['current'], {
    hiddenScript: '#!/usr/bin/env bash\n# foundry-hidden-interface: 2\n: > unknown-script-ran\n',
  })
  if (!sandbox)
    return
  /**
   * 入口独立报告后置步骤结果，并保留真实复制和挂载输出。
   */
  const result = install(sandbox, '--hidden')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /隐匿失败/)
  assert.equal(existsSync(join(sandbox.project, 'unknown-script-ran')), false)
  assert.equal(existsSync(join(sandbox.project, 'mount-result')), true)
  assert.equal(readFileSync(join(sandbox.project, '.agents/skills/current/SKILL.md'), 'utf8'), 'current')
  assert.equal(ignored(sandbox, 'current'), false)
})

test('缺引擎入口时保留技能，隐匿和挂载均需经统一入口', (t) => {
  /**
   * 此包只有旧业务脚本，没有本次约定的统一入口。
   */
  const sandbox = installerFixture(t, ['current'], { mountPath: 'script/speckit-mount.sh' })
  if (!sandbox)
    return
  /**
   * 缺入口不能被业务脚本的存在掩盖。
   */
  const result = install(sandbox, '--hidden')
  assert.equal(result.status, 127, result.stderr)
  assert.match(result.stderr, /engine\/install\.sh/u)
  assert.equal(existsSync(join(sandbox.project, 'mount-result')), false)
  assert.equal(readFileSync(join(sandbox.project, '.agents/skills/current/SKILL.md'), 'utf8'), 'current')
  assert.equal(ignored(sandbox, 'current'), false)
})

test('安装器直接透传引擎参数及退出码', (t) => {
  /**
   * 入口正文记录每次调用收到的参数，退出码由入口决定。
   */
  const sandbox = installerFixture(t, ['current'], {
    engineSource: 'printf "%s\\n" "$@" >> engine-arguments\nexit 31\n',
  })
  if (!sandbox)
    return
  /**
   * 显式隐匿和跳过挂载的选项须到达同一次入口调用。
   */
  const result = install(sandbox, '--hidden', '--no-mount')
  assert.equal(result.status, 31, result.stderr)
  /**
   * 路径与选项必须作为独立参数传给入口。
   */
  const args = readFileSync(join(sandbox.project, 'engine-arguments'), 'utf8').trimEnd().split('\n')
  assert.equal(args.length, 10)
  assert.deepEqual(args.slice(0, 6), ['--no-mount', '--hidden', '--project', sandbox.project, '--agent-root', '.agents/skills'])
  assert.equal(args[6], '--successful-skills-file')
  assert.match(args[7], /\/successful-skills\.json$/u)
  assert.equal(args[8], '--result-file')
  assert.match(args[9], /\/hidden-result\.json$/u)
})

test('安装器经真实引擎入口执行其他子插件脚本', (t) => {
  /**
   * 安装器无需知道该子插件的业务名称或目录。
   */
  const sandbox = installerFixture(t, ['current'], { mountPath: 'engine/custom/other-plugin.sh' })
  if (!sandbox)
    return
  /**
   * 通过真实归档、解包、复制及生成入口观察最终业务效果。
   */
  const result = install(sandbox)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(readFileSync(join(sandbox.project, 'mount-result'), 'utf8'), 'mounted\n')
  assert.equal(readFileSync(join(sandbox.project, '.agents/skills/current/SKILL.md'), 'utf8'), 'current')
})

test('安装器保留经引擎执行的子脚本失败码及已安装技能', (t) => {
  /**
   * 子脚本使用独立退出码证明安装器没有误报成功或改写错误。
   */
  const sandbox = installerFixture(t, ['current'], { mountPath: 'engine/custom/failure.sh', mountSource: 'exit 31\n' })
  if (!sandbox)
    return
  /**
   * 安装成功和后置业务失败分别通过文件及退出码观察。
   */
  const result = install(sandbox)
  assert.equal(result.status, 31, result.stderr)
  assert.equal(readFileSync(join(sandbox.project, '.agents/skills/current/SKILL.md'), 'utf8'), 'current')
})

test('隐匿脚本退出 0 且缺少核验明细时保留安装并报告隐匿失败', (t) => {
  /**
   * 脚本标记合法，结果只自报成功，没有已核验路径。
   */
  const sandbox = installerFixture(t, ['current'], {
    hiddenScript: `#!/usr/bin/env bash
# foundry-hidden-interface: 1
while [[ "$1" != --result-file ]]; do shift; done
printf '{"status":"success"}\n' > "$2"
`,
  })
  if (!sandbox)
    return
  /**
   * 验证入口还需要证实本次结果文件的内容。
   */
  const result = install(sandbox, '--hidden', '--no-mount')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /隐匿失败/)
  assert.equal(readFileSync(join(sandbox.project, '.agents/skills/current/SKILL.md'), 'utf8'), 'current')
  assert.equal(ignored(sandbox, 'current'), false)
})
