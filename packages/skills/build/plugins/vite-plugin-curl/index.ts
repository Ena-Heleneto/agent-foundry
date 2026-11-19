import type { Plugin } from 'vite'
import { readFile } from 'node:fs/promises'
import { createHiddenInstallScript } from '#build/plugins/vite-plugin-curl/hidden-install.template'
import { scanSkills } from '#utils/scan-skills'

/**
 * 向 curl 目录原字节交付安装入口，并向 script 目录交付派生的隐匿脚本。
 *
 * @returns 分别交付 curl 入口和隐匿脚本的构建插件。
 */
export default function vitePluginCurl(): Plugin {
  return {
    name: 'vite-plugin-curl',
    apply: 'build',
    async generateBundle() {
      /**
       * 安装入口保持源文件字节，使用独立 curl 路径供首次获取。
       */
      const source = await readFile(new URL(import.meta.resolve('#install.source.sh')))
      this.emitFile({ type: 'asset', fileName: 'curl/install.sh', source })

      /**
       * 启用技能只用于派生隐匿候选路径。
       */
      const enabledSkills = await scanSkills()
      this.emitFile({ type: 'asset', fileName: 'script/hidden-install.sh', source: createHiddenInstallScript(enabledSkills) })
    },
  }
}
