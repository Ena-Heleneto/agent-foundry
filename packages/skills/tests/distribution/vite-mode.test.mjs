import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'

/**
 * 写入隔离 Vite 配置，在配置回调和插件钩子中记录实际 mode。
 *
 * @param {string} configPath 临时 Vite 配置路径。
 * @param {string} root 隔离构建根目录。
 * @param {string} entryPath 临时构建入口路径。
 * @param {string} observationPath mode 观察结果文件路径。
 */
function writeModeProbeConfig(configPath, root, entryPath, observationPath) {
  /**
   * 运行时 Vite 配置只记录三个阶段的 mode，不写入构建产物。
   */
  const configSource = `
    import { appendFileSync } from 'node:fs'

    /**
     * 将当前 Vite 阶段的 mode 追加到隔离观察文件。
     *
     * @param {string} stage 当前观察阶段。
     * @param {string} mode Vite 实际解析的 mode。
     */
    function recordMode(stage, mode) {
      appendFileSync(${JSON.stringify(observationPath)}, JSON.stringify({ stage, mode }) + '\\n')
    }

    /**
     * 为每次构建注册记录实际 mode 的最小 Vite 插件。
     *
     * @param {{ mode: string }} configEnv Vite 提供的当前配置环境。
     * @returns {import('vite').UserConfig} 隔离构建配置。
     */
    export default function createModeProbeConfig({ mode }) {
      recordMode('config', mode)
      return {
        root: ${JSON.stringify(root)},
        logLevel: 'silent',
        publicDir: false,
        plugins: [{
          name: 'vite-mode-probe',
          /**
           * 记录 Vite 完成配置解析后的 mode。
           *
           * @param {import('vite').ResolvedConfig} config 已解析的 Vite 配置。
           */
          configResolved(config) {
            recordMode('configResolved', config.mode)
          },
          /**
           * 记录构建钩子所属 Vite 环境的 mode。
           */
          buildStart() {
            recordMode('buildStart', this.environment.config.mode)
          },
        }],
        build: {
          outDir: ${JSON.stringify(join(root, 'dist'))},
          write: false,
          emptyOutDir: false,
          rollupOptions: { input: ${JSON.stringify(entryPath)} },
        },
      }
    }
  `
  writeFileSync(configPath, configSource)
}

/**
 * 从观察记录中按阶段提取 mode 顺序。
 *
 * @param {Array<{ stage: string, mode: string }>} observations Vite 阶段观察记录。
 * @param {string} stage 需要提取的阶段名称。
 * @returns {string[]} 按实际发生顺序排列的 mode。
 */
function modesForStage(observations, stage) {
  /**
   * 保存指定阶段观测到的 mode。
   */
  const modes = []
  /**
   * 按原始顺序筛选阶段记录，便于发现同进程串值。
   */
  for (const observation of observations) {
    if (observation.stage === stage)
      modes.push(observation.mode)
  }
  return modes
}

/**
 * 在同一 Node 进程连续构建，验证默认和显式 mode 的配置及插件传递。
 *
 * @param {import('node:test').TestContext} t 当前测试上下文。
 */
async function verifyViteModes(t) {
  /**
   * 所有测试输入、Vite 缓存和输出都限制在本次临时目录。
   */
  const root = mkdtempSync(join(tmpdir(), 'foundry-vite-mode-'))
  /**
   * 在测试结束时删除临时构建目录。
   */
  const cleanup = () => rmSync(root, { recursive: true, force: true })
  t.after(cleanup)
  /**
   * 由实际 Vite build 读取的临时配置文件。
   */
  const configPath = join(root, 'vite.config.mjs')
  /**
   * 用于触发真实构建生命周期的独占入口文件。
   */
  const entryPath = join(root, 'entry.js')
  /**
   * 各配置和插件阶段观察到的 mode 记录文件。
   */
  const observationPath = join(root, 'modes.jsonl')
  /**
   * 同一进程中的输入顺序，首项省略 mode 以验证 Vite 默认值。
   */
  const requestedModes = [undefined, 'development', 'release', 'production']
  /**
   * 每次构建预期观察到的解析结果。
   */
  const expectedModes = ['production', 'development', 'release', 'production']
  writeFileSync(entryPath, 'export default 1\n')
  writeModeProbeConfig(configPath, root, entryPath, observationPath)

  /**
   * 按输入顺序复用 Vite Node API，检查配置状态不会泄漏到后续构建。
   */
  for (const requestedMode of requestedModes) {
    if (requestedMode === undefined) {
      await build({ configFile: configPath })
    }
    else {
      await build({ configFile: configPath, mode: requestedMode })
    }
  }

  /**
   * 从临时 JSONL 读取配置回调和插件钩子的真实观测。
   */
  const observationLines = readFileSync(observationPath, 'utf8')
    .trim()
    .split('\n')
  /**
   * 保存每个阶段写入的结构化 mode 记录。
   */
  const observations = []
  /**
   * 逐行解析测试拥有的 JSONL 观察文件。
   */
  for (const line of observationLines)
    observations.push(JSON.parse(line))
  assert.deepEqual(modesForStage(observations, 'config'), expectedModes)
  assert.deepEqual(modesForStage(observations, 'configResolved'), expectedModes)
  assert.deepEqual(modesForStage(observations, 'buildStart'), expectedModes)
  assert.equal(existsSync(join(root, 'dist')), false)
}

test('Vite 默认及显式 mode 在同进程配置和插件中保持一致', verifyViteModes)
