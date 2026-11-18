import type { Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import { scanSkills } from '#utils/scan-skills'

/**
 * 在构建期扫描启用的 workflow 技能，并通过调试日志展示扫描结果。
 * generateBundle 当前仅准备技能清单，尚不输出挂载脚本资产。
 *
 * @returns 扫描工作流集合技能的 Vite 插件。
 */
export default function vitePluginSpeckitMount(): Plugin {
  return {
    name: 'vite-plugin-speckit-mount',
    apply: 'build',
    async generateBundle() {
      /**
       * 从包内集合根扫描，仅保留启用且具有正文的 workflow 技能。
       */
      const skills = (await scanSkills(fileURLToPath(import.meta.resolve('#src'))))
        .filter(skill => skill.collection === 'workflow')
      this.debug(() => `workflow 启用技能：${skills.map(skill => skill.name).join(', ')}`)
    },
  }
}
