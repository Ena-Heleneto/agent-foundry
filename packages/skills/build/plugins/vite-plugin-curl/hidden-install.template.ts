/**
 * 生成检查当前 Git 目录并追加技能精确排除规则的隐匿脚本。
 *
 * @param enabledSkills 已启用技能列表，使用名称生成安装根下的相对路径。
 * @returns 保留安装根占位符、运行时映射当前 agent 目录的 Bash 脚本字符串。
 */
export function createHiddenInstallScript(enabledSkills: readonly { name: string }[]): string {
  /**
   * 每项对应一行技能路径，名称以 Bash 单引号字面量保存。
   */
  const skillPaths = enabledSkills
    .map(({ name }) => `  '@@AGENT_SKILLS_ROOT@@/${name.replaceAll('\'', '\'\\\'\'')}'`)

  return [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    'git_dir="$PWD/.git"',
    'if [[ -f "$git_dir" || -L "$git_dir" ]]; then',
    '  echo "跳过隐匿处理：当前仅支持 .git 为普通目录的项目。"',
    '  exit 0',
    'fi',
    'if [[ ! -d "$git_dir" ]]; then',
    '  echo "跳过隐匿处理：当前目录没有 .git，不查找父仓库。"',
    '  exit 0',
    'fi',
    '',
    'skill_paths=(',
    ...(skillPaths.length ? skillPaths : ['']),
    ')',
    '',
    'exclude_file="$git_dir/info/exclude"',
    'if [[ -L "$git_dir/info" || -L "$exclude_file" ]]; then',
    '  echo "隐匿失败：本地排除位置不能是符号链接。" >&2',
    '  exit 1',
    'fi',
    'mkdir -p -- "$git_dir/info"',
    `for skill_path in "\${skill_paths[@]}"; do`,
    `  relative_path="\${skill_path/@@AGENT_SKILLS_ROOT@@/.agents/skills}"`,
    '  [[ -d "$relative_path" && ! -L "$relative_path" ]] || continue',
    '  pattern="$(printf \'%s\' "$relative_path" | sed \'s/[][\\\\*?]/\\\\&/g\')"',
    '  pattern="/$pattern/"',
    '  if [[ ! -f "$exclude_file" ]] || ! grep -Fqx -- "$pattern" "$exclude_file"; then',
    '    printf "\\n%s\\n" "$pattern" >> "$exclude_file"',
    '  fi',
    '  git --git-dir="$git_dir" --work-tree="$PWD" check-ignore --quiet -- "$relative_path/"',
    'done',
    '',
  ].join('\n')
}
