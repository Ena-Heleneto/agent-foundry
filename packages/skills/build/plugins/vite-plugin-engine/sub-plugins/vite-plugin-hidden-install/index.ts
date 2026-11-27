import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { minifyShellScript } from '#build/utils/minify-shell-script'
import { scanSkills } from '#build/utils/scan-skills'
import { createCandidatePathsAssignment } from './hidden-install.template.ts'

/**
 * 压缩固定源脚本，再填入构建期的候选路径。
 *
 * @param enabledSkills 已启用技能列表。
 * @returns 包含协议 1 标记和候选路径的 Bash 脚本。
 * @throws 源脚本读取、解析或定位空候选列表失败时抛错。
 */
export function createHiddenInstallScript(enabledSkills: readonly { name: string }[]): string {
  /**
   * 同目录维护的固定 Bash 脚本。
   */
  const source = readFileSync(new URL('./hidden-install.source.sh', import.meta.url), 'utf8')
  /**
   * 压缩时保留 shebang 和安装器读取的协议标记。
   */
  const compactSource = minifyShellScript(source, { preserveHeaderLines: 2 })
  /**
   * 空候选列表是一条有效命令，压缩后仍可定位其所在行。
   */
  const sections = compactSource.split(/^candidate_paths='\[\]'$/mu)
  if (sections.length !== 2)
    throw new Error('hidden-install.source.sh 必须恰好包含一行 candidate_paths=\'[]\'')

  return sections.join(createCandidatePathsAssignment(enabledSkills))
}

/**
 * 在清理输出前按当次构建范围生成引擎隐匿脚本。
 *
 * @returns 在引擎 script 目录交付隐匿脚本的构建插件。
 */
export default function vitePluginHiddenInstall(): Plugin {
  return {
    name: 'vite-plugin-hidden-install',
    apply: 'build',
    /**
     * 构建开始时交付与本次技能范围一致的隐匿脚本。
     */
    async buildStart() {
      /**
       * 仅将当次模式启用的集合及技能加入隐匿候选。
       */
      const enabledSkills = await scanSkills(this.environment.config.mode)
      this.emitFile({ type: 'asset', fileName: 'script/hidden-install.sh', source: createHiddenInstallScript(enabledSkills) })
    },
  }
}
