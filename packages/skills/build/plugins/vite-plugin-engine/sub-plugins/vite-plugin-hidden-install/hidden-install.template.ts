/**
 * 将候选 JSON 转义为 Bash 单引号字面量。
 *
 * @param value 需要保留原值的文本。
 * @returns Bash 单引号字面量。
 */
function quoteShell(value: string): string {
  return `'${value.replaceAll('\'', '\'\\\'\'')}'`
}

/**
 * 为启用技能生成一行 Bash 候选路径赋值。
 *
 * @param enabledSkills 已启用技能列表，使用名称生成安装根下的相对路径。
 * @returns 可直接插入隐匿脚本的赋值命令。
 */
export function createCandidatePathsAssignment(enabledSkills: readonly { name: string }[]): string {
  /**
   * 将启用技能的候选路径序列化为运行时读取的 JSON。
   */
  const candidatePaths = JSON.stringify(enabledSkills.map(({ name }) => `@@AGENT_SKILLS_ROOT@@/${name}`))
  return `candidate_paths=${quoteShell(candidatePaths)}`
}
