import type { Plugin } from 'vite'
// import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
// import { promisify } from 'node:util'
import { scanSkills } from '#build/utils/scan-skills'
import { createHiddenInstallScript } from './hidden-install.template.ts'

/**
 * 交付 curl 入口及按启用技能清单生成的隐匿脚本。
 * 压缩包构建由后续流水线统一处理。
 */
export default function vitePluginCurl(): Plugin {
  // const execFileAsync = promisify(execFile)
  const virtualId = 'virtual:curl'
  const resolvedId = `\0${virtualId}`
  return {
    name: 'vite-plugin-curl',
    apply: 'build',
    resolveId(id) {
      if (id === virtualId)
        return resolvedId
    },
    load(id) {
      if (id === resolvedId)
        return 'export {}'
    },
    async generateBundle(_options, _bundle) {
      const enabledSkills = await scanSkills()
      const source = await readFile(new URL('./install.source.sh', import.meta.url))
      this.emitFile({ type: 'asset', fileName: 'curl/install.sh', source })
      this.emitFile({ type: 'asset', fileName: 'curl/script/hidden-install.sh', source: createHiddenInstallScript(enabledSkills) })
    },
    // 统一归档由后续流水线负责，保留原命令供迁移时参考。
    // async writeBundle() {
    //   await execFileAsync('tar', ['-czf', 'dist/curl/scripts.tar.gz', '-C', 'dist/curl', 'script'])
    // },
  }
}
