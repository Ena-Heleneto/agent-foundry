import type { Plugin } from 'vite'
// import { execFile } from 'node:child_process'
import { cp } from 'node:fs/promises'
// import { rename } from 'node:fs/promises'
// import { promisify } from 'node:util'
import { scanSkills } from '#utils/scan-skills'

/**
 * 在构建开始时检查技能安装目录名，输出阶段复制已校验的技能内容。
 * 压缩包构建由后续流水线统一处理。
 *
 * @returns 技能构建插件。
 */
export default function vitePluginSkill(): Plugin {
  // const execFileAsync = promisify(execFile)
  const virtualId = 'virtual:skill'
  const resolvedId = `\0${virtualId}`
  /**
   * 同一次构建扫描并通过校验的技能列表，供输出阶段复制。
   */
  let selectedSkills: Awaited<ReturnType<typeof scanSkills>> = []

  return {
    name: 'vite-plugin-skill',
    apply: 'build',

    /**
     * 在 Vite 清理输出目录前拒绝会占用同一个安装位置的技能。
     */
    async buildStart() {
      /**
       * 本次启用且具备正文的技能，沿用原复制范围。
       */
      const skills = await scanSkills()
      /**
       * 安装器使用技能末级目录名，记录每个名称首次出现的来源。
       */
      const sourcesByName = new Map<string, string>()
      for (const { name, source } of skills) {
        /**
         * 同一安装目录名先前对应的技能源路径。
         */
        const previousSource = sourcesByName.get(name)
        if (previousSource !== undefined)
          this.error(`安装目录 .agents/skills/${name} 存在同名技能\n${previousSource}\n${source}`)

        sourcesByName.set(name, source)
      }
      selectedSkills = skills
    },

    resolveId(id) {
      if (id === virtualId)
        return resolvedId
    },

    load(id) {
      if (id === resolvedId)
        return 'export {}'
    },

    generateBundle(_options, bundle) {
      Object.entries(bundle).forEach(([fileName, output]) => {
        if (output.type === 'chunk' && output.isEntry && output.facadeModuleId === resolvedId) {
          delete bundle[fileName]

          if (output.sourcemapFileName)
            delete bundle[output.sourcemapFileName]
        }
      })
    },

    /**
     * 复制构建开始时已通过校验的技能正文及附件。
     */
    async writeBundle() {
      await Promise.all(selectedSkills.map(({ source, target }) => cp(source, target, { recursive: true })))
      // 统一归档由后续流水线负责，保留原命令供迁移时参考。
      // await execFileAsync('tar', ['--exclude=skill/skill.tar.gz', '-czf', 'dist/skill.tar.gz', '-C', 'dist', 'skill'])
      // await rename('dist/skill.tar.gz', 'dist/skill/skill.tar.gz')
    },
    closeBundle() {},
  }
}
