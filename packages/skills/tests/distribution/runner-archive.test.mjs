import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { createHiddenInstallScript } from '../../build/plugins/vite-plugin-engine/sub-plugins/vite-plugin-hidden-install/index.ts'
import { createSandbox } from './sandbox.mjs'

/**
 * 验收夹具中的输入提交身份，用于核对流水线归档记录。
 */
const sourceRevision = 'a'.repeat(40)

/**
 * 读取 publish 工作流的原始步骤供阶段顺序和实际归档测试复用。
 */
const steps = parse(readFileSync(new URL('../../../../.github/workflows/publish.yml', import.meta.url), 'utf8')).jobs.upload.steps

test('生产工作流在构建完成后独立归档并交给上传', () => {
  /**
   * 归档使用当前提交和本次唯一输出路径。
   */
  const build = steps.findIndex(step => step.run?.includes('pnpm --filter @foundry/skills run build --mode release'))
  /**
   * 独立归档步骤使用刚生成的 dist。
   */
  const archive = steps.findIndex(step => step.id === 'archive')
  /**
   * R2 只接收当次核验的公开产物目录。
   */
  const upload = steps.findIndex(step => step.run?.includes('aws s3 cp'))
  assert.ok(build > 0 && archive > build && upload > archive)
  assert.equal(steps.some(step => step.uses?.startsWith('docker/')), false)
  assert.match(steps[build].run, /pnpm install --no-lockfile --ignore-scripts/u)
  assert.match(steps[build].env.SOURCE_REVISION, /^\$\{\{\s*github\.sha\s*\}\}$/u)
  assert.equal(steps[build].env.AWS_ACCESS_KEY_ID, undefined)
  assert.equal(steps[build].env.RELEASE_DIRECTORY, undefined)
  assert.match(steps[archive].run, /tar --create/u)
  assert.equal(steps[upload].env.RELEASE_DIRECTORY, `${steps[archive].env.RELEASE_DIRECTORY}/publish`)
  assert.match(steps[upload].run, /s3 cp "\$RELEASE_DIRECTORY\/"/u)
})

/**
 * 在独占临时目录写入源文件或上一次构建的产物。
 */
function write(root, path, bytes) {
  /**
   * 当前输入在夹具中的绝对文件路径。
   */
  const target = join(root, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, bytes)
}

/**
 * 在夹具中配置一个技能，同时保留对应的旧构建产物。
 */
function addSkill(packageRoot, category, directory, name, requiresSkills = [], publish = true) {
  write(packageRoot, `src/${category}/collection.config.ts`, `export default ${JSON.stringify({
    packageName: category,
    mcp: false,
    publish: publish ?? undefined,
    skill: { [directory]: { enabled: true, requiresSkills } },
  })}`)
  /**
   * 保留声明名和安装目录名可不同的真实映射。
   */
  const body = ['---', `name: ${name}`, '---', '# 技能正文', ''].join('\n')
  write(packageRoot, ['src', category, directory, 'SKILL.md'].join('/'), body)
  write(packageRoot, ['dist/skill', category, directory, 'SKILL.md'].join('/'), body)
}

/**
 * 准备动态配置以及待本次构建清理的旧 dist。
 */
function fixture(t) {
  /**
   * 项目、文件输出及临时副本均归测试独占。
   */
  const sandbox = createSandbox()
  t.after(sandbox.cleanup)
  /**
   * 模拟 runner 检出的技能包位置。
   */
  const packageRoot = join(sandbox.project, 'packages/skills')
  write(packageRoot, 'package.json', '{"type":"module","version":"0.1.0"}')
  write(packageRoot, 'README.md', '# 技能包\n')
  copyFileSync(new URL('../../../../LICENSE', import.meta.url), join(sandbox.project, 'LICENSE'))
  addSkill(packageRoot, 'coding', 'coding-demo', 'primary', ['foundation'])
  addSkill(packageRoot, 'frontend', 'foundation', 'foundation')
  addSkill(packageRoot, 'workflow', 'workflow-demo', 'workflow-demo')
  addSkill(packageRoot, 'profile', 'internal-notes', 'internal-notes', [], false)
  addSkill(packageRoot, 'eval', 'local-eval', 'local-eval', [], null)
  write(packageRoot, 'dist/VERSION', '0.1.0\n')
  copyFileSync(join(packageRoot, 'README.md'), join(packageRoot, 'dist/README.md'))
  copyFileSync(join(sandbox.project, 'LICENSE'), join(packageRoot, 'dist/LICENSE'))
  write(packageRoot, 'dist/curl/skills.tsv', '# foundry-skills 1\n')
  for (const path of ['dist/curl/install.sh', 'dist/engine/install.sh', 'dist/engine/script/speckit-mount.sh'])
    write(packageRoot, path, '#!/usr/bin/env bash\nexit 0\n')
  write(packageRoot, 'dist/engine/script/hidden-install.sh', createHiddenInstallScript(['coding-demo', 'foundation', 'workflow-demo', 'internal-notes'].map(name => ({ name }))))
  /**
   * 带空格的二进制附件检验归档过程完整保留路径及字节。
   */
  const attachment = Buffer.from([0, 1, 0x80, 0xFF])
  write(packageRoot, 'src/coding/coding-demo/references/full guide.bin', attachment)
  write(packageRoot, 'dist/skill/coding/coding-demo/references/full guide.bin', attachment)
  return { project: sandbox.project, packageRoot, outputDirectory: join(sandbox.root, 'release'), attachment, env: sandbox.env }
}

/**
 * 运行实际的 Vite 发布构建，保留退出状态和日志。
 */
function runViteBuild(context) {
  /**
   * 直接调用项目依赖中的 Vite，和流水线的发布模式一致。
   */
  const result = spawnSync('node', [
    fileURLToPath(new URL('bin/vite.js', import.meta.resolve('vite/package.json'))),
    'build',
    '--mode',
    'release',
    '--config',
    fileURLToPath(new URL('../../vite.config.ts', import.meta.url)),
  ], {
    cwd: context.packageRoot,
    encoding: 'utf8',
    env: { ...context.env, RELEASE_DIRECTORY: '', SOURCE_REVISION: '' },
  })
  assert.ifError(result.error)
  return result
}

/**
 * 确认发布构建成功，并返回构建日志中的警告。
 */
function runReleaseBuild(context) {
  /**
   * 与生产工作流一致的 Vite 构建结果。
   */
  const result = runViteBuild(context)
  assert.equal(result.status, 0, result.stderr)
  return result.stderr
}

/**
 * 直接执行工作流中的打包步骤，不执行上传或证据发布。
 */
function runArchiveStep(context) {
  /**
   * 打包脚本从仓库根读取固定的技能构建目录。
   */
  const result = spawnSync('bash', ['-c', steps.find(step => step.id === 'archive').run], {
    cwd: context.project,
    encoding: 'utf8',
    env: { ...context.env, RELEASE_DIRECTORY: context.outputDirectory, SOURCE_REVISION: sourceRevision },
  })
  assert.ifError(result.error)
  return result
}

test('流水线在 Vite 发布构建之后打包当次 dist 并记录摘要', (t) => {
  /**
   * 单独构建发布内容，随后执行实际流水线的打包步骤。
   */
  const context = fixture(t)
  addSkill(context.packageRoot, 'extras', 'opt-in-skill', 'opt-in-skill')
  write(context.packageRoot, 'dist/skill/coding/coding-demo/old.txt', '上一次构建留下的文件')
  runReleaseBuild(context)
  assert.equal(existsSync(context.outputDirectory), false)
  /**
   * 打包步骤处理 Vite 已经写出的构建产物。
   */
  const result = runArchiveStep(context)
  assert.equal(result.status, 0, result.stderr)
  /**
   * 核对选择发生在构建时，旧文件和未选择的集合已从 dist 清除。
   */
  const dist = join(context.packageRoot, 'dist')
  assert.equal(existsSync(join(dist, 'skill/profile')), false)
  assert.equal(existsSync(join(dist, 'skill/eval')), false)
  assert.equal(existsSync(join(dist, 'skill/coding/coding-demo/old.txt')), false)
  /**
   * 只将公开产物目录交给流水线上传。
   */
  const publication = join(context.outputDirectory, 'publish')
  assert.deepEqual(readdirSync(publication).sort(), ['curl', 'skills-0.1.0.tar.gz'])
  /**
   * 使用真实 tar 读回归档的内容和字节。
   */
  const archive = join(publication, 'skills-0.1.0.tar.gz')
  /**
   * 读取包内一个已核验的归档成员。
   */
  const member = path => execFileSync('tar', ['-xOzf', archive, '--', path])
  assert.equal(member('VERSION').toString(), '0.1.0\n')
  assert.deepEqual(member('skill/coding/coding-demo/references/full guide.bin'), context.attachment)
  assert.deepEqual(member('curl/install.sh'), readFileSync(join(publication, 'curl/install.sh')))
  assert.equal(member('curl/skills.tsv').toString(), [
    '# foundry-skills 1',
    'foundation\tfrontend\tskill/frontend/foundation\tfoundation\t-',
    'opt-in-skill\textras\tskill/extras/opt-in-skill\topt-in-skill\t-',
    'primary\tcoding\tskill/coding/coding-demo\tcoding-demo\tfoundation',
    'workflow-demo\tworkflow\tskill/workflow/workflow-demo\tworkflow-demo\t-',
    '',
  ].join('\n'))
  assert.match(member('engine/script/hidden-install.sh').toString(), /coding-demo/u)
  assert.match(member('engine/script/hidden-install.sh').toString(), /opt-in-skill/u)
  assert.doesNotMatch(member('engine/script/hidden-install.sh').toString(), /internal-notes|local-eval/u)
  /**
   * 归档成员与本次 dist 内的全部文件一致。
   */
  const files = readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => relative(dist, join(entry.parentPath, entry.name)))
    .sort()
  assert.deepEqual(execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trimEnd().split('\n').sort(), files)
  /**
   * 归档记录使用实际可读文件的长度和摘要。
   */
  const verification = JSON.parse(readFileSync(join(context.outputDirectory, 'evidence/build-verification.json'), 'utf8'))
  assert.equal(verification.sourceRevision, sourceRevision)
  assert.deepEqual(verification.archive, {
    path: 'skills-0.1.0.tar.gz',
    bytes: readFileSync(archive).length,
    sha256: createHash('sha256').update(readFileSync(archive)).digest('hex'),
  })
})

test('发布归档沿用本次扫描结果，跳过缺配置的集合', (t) => {
  /**
   * 仅移除集合配置，保留该集合的旧产物和源技能待清理。
   */
  const context = fixture(t)
  rmSync(join(context.packageRoot, 'src/coding/collection.config.ts'))
  assert.match(runReleaseBuild(context), /缺少集合配置.*coding/u)
  assert.equal(existsSync(join(context.packageRoot, 'dist/skill/coding')), false)
  /**
   * 流水线使用扫描后生成的 dist。
   */
  const result = runArchiveStep(context)
  assert.equal(result.status, 0, result.stderr)
  /**
   * 解读公开归档确认被跳过的集合没有入包。
   */
  const archive = join(context.outputDirectory, 'publish/skills-0.1.0.tar.gz')
  assert.doesNotMatch(execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }), /skill\/coding/u)
})

/**
 * 正式构建拒绝缺失的引用附件。
 */
test('正式技能缺少正文引用的附件时停止构建', (t) => {
  /**
   * 附件在技能源中缺失，保留旧 dist 验证不能借用旧文件。
   */
  const context = fixture(t)
  write(context.packageRoot, 'src/coding/coding-demo/SKILL.md', '---\nname: primary\n---\n[附件](references/missing.bin)\n')
  write(context.packageRoot, 'dist/skill/coding/coding-demo/references/missing.bin', '旧附件')
  /**
   * 错误应在发布构建中报告。
   */
  const result = runViteBuild(context)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /缺少引用附件/u)
  assert.equal(existsSync(context.outputDirectory), false)
})

test('正式产物缺少安装入口或包含链接时拒绝交接', async (t) => {
  for (const scenario of ['missing', 'link']) {
    await t.test(scenario, (subtest) => {
      /**
       * 每种异常输入分别使用自己的完整来源和构建产物。
       */
      const context = fixture(subtest)
      /**
       * 在同一构建产物中模拟损坏的安装入口或链接。
       */
      const dist = join(context.packageRoot, 'dist')
      if (scenario === 'missing')
        rmSync(join(dist, 'curl/install.sh'))
      if (scenario === 'link')
        symlinkSync(join(dist, 'README.md'), join(dist, 'linked.md'))
      /**
       * 验证流水线失败后保留构建目录且没有交接目录。
       */
      const result = runArchiveStep(context)
      assert.equal(result.status, 1, result.stderr)
      assert.match(result.stderr, /缺少 curl\/install.sh|普通文件/u)
      assert.equal(existsSync(context.outputDirectory), false)
    })
  }
})

test('技能依赖必须指向参与发布的声明名且无环', (t) => {
  /**
   * 内部技能存在于默认 dist 也无法作为正式依赖。
   */
  const missing = fixture(t)
  addSkill(missing.packageRoot, 'workflow', 'workflow-demo', 'workflow-demo', ['internal-notes'])
  /**
   * 仅能在本次发布的技能中解析依赖。
   */
  const missingDependency = runViteBuild(missing)
  assert.equal(missingDependency.status, 1, missingDependency.stderr)
  assert.match(missingDependency.stderr, /未知技能依赖/u)
  /**
   * 两条依赖均存在且必须通过有向环检查。
   */
  const cycle = fixture(t)
  addSkill(cycle.packageRoot, 'frontend', 'foundation', 'foundation', ['primary'])
  /**
   * 相互依赖的映射须终止构建。
   */
  const cyclicDependency = runViteBuild(cycle)
  assert.equal(cyclicDependency.status, 1, cyclicDependency.stderr)
  assert.match(cyclicDependency.stderr, /循环依赖/u)
})
