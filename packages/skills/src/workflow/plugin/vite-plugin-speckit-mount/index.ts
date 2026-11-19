import type { Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import { scanSkills } from '#utils/scan-skills'
import { createSpeckitMountScript } from './mount-script.ts'

/**
 * 按启用 workflow 技能的 hook 和 command 配置生成自包含脚本，构建时不执行注册。
 *
 * @param sourceDir 集合来源根目录，缺省锚定包内 src，可用于隔离构建。
 * @returns 输出单个工作流挂载脚本资产的 Vite 插件。
 */
export default function vitePluginSpeckitMount(sourceDir = fileURLToPath(import.meta.resolve('#src'))): Plugin {
  return {
    name: 'vite-plugin-speckit-mount',
    apply: 'build',
    async generateBundle() {
      /**
       * 从包内集合根扫描，仅保留启用且具有正文的 workflow 技能。
       */
      const skills = (await scanSkills(sourceDir))
        .filter(skill => skill.collection === 'workflow')
      /**
       * 挂载生成同时消费 hook 和 command，空声明不创建脚本资产。
       */
      const source = await createSpeckitMountScript(skills)
      if (source)
        this.emitFile({ type: 'asset', fileName: 'script/speckit-mount.sh', source })
    },
  }
}
