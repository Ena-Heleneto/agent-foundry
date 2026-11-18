import type { Plugin } from 'vite'
// import { execFile } from 'node:child_process'
import { cp } from 'node:fs/promises'
// import { rename } from 'node:fs/promises'
// import { promisify } from 'node:util'
import { scanSkills } from '#utils/scan-skills'

/**
 * 在 writeBundle 中等待技能复制完成，向统一发布目录交付技能内容。
 * 压缩包构建由后续流水线统一处理。
 *
 * @returns 技能构建插件。
 */
export default function vitePluginSkill(): Plugin {
  // const execFileAsync = promisify(execFile)
  const virtualId = 'virtual:skill'
  const resolvedId = `\0${virtualId}`

  return {
    name: 'vite-plugin-skill',
    apply: 'build',

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

    async writeBundle() {
      const selectedSkills = await scanSkills()
      await Promise.all(selectedSkills.map(({ source, target }) => cp(source, target, { recursive: true })))
      // 统一归档由后续流水线负责，保留原命令供迁移时参考。
      // await execFileAsync('tar', ['--exclude=skill/skill.tar.gz', '-czf', 'dist/skill.tar.gz', '-C', 'dist', 'skill'])
      // await rename('dist/skill.tar.gz', 'dist/skill/skill.tar.gz')
    },
    closeBundle() {},
  }
}
