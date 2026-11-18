import type { Plugin } from 'vite'
import { readFile } from 'node:fs/promises'
import { createHiddenInstallScript } from '#build/plugins/vite-plugin-curl/hidden-install.template'
import { scanSkills } from '#utils/scan-skills'

/**
 * 原字节交付 curl 安装入口，并由启用技能派生隐匿脚本。
 *
 * @returns 向统一脚本目录写出两个安装脚本的构建插件。
 */
export default function vitePluginCurl(): Plugin {
  return {
    name: 'vite-plugin-curl',
    apply: 'build',
    async generateBundle() {
      const source = await readFile(new URL(import.meta.resolve('#install.source.sh')))
      this.emitFile({ type: 'asset', fileName: 'script/install.sh', source })

      /**
       * 启用技能只用于派生隐匿候选路径。
       */
      const enabledSkills = await scanSkills()
      this.emitFile({ type: 'asset', fileName: 'script/hidden-install.sh', source: createHiddenInstallScript(enabledSkills) })
    },
  }
}
