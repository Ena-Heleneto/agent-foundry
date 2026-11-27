import type { Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import { scanSkills } from '#build/utils/scan-skills'
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
    /**
     * 根据当次构建范围生成工作流挂载脚本。
     */
    async generateBundle() {
      /**
       * 仅为当次模式启用的工作流技能生成挂载。
       */
      const skills = (await scanSkills(this.environment.config.mode, sourceDir))
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
