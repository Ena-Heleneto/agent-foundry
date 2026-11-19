/**
 * 生成调用本次子插件 Shell 资产的统一入口，保留项目目录及参数。
 *
 * @param scripts 已按稳定顺序排列的 engine 内相对脚本路径。
 * @returns 预检查全部脚本后按序执行的独立 Bash 正文。
 */
export function createEngineInstallScript(scripts: string[]): string {
  return [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    `engine_root="$(cd -- "$(dirname -- "\${BASH_SOURCE[0]}")" && pwd -P)"`,
    'scripts=(',
    ...scripts.map(script => `  '${script.replaceAll('\'', '\'\\\'\'')}'`),
    ')',
    '',
    `for relative_script in "\${scripts[@]}"; do`,
    '  script="$engine_root/$relative_script"',
    '  if [[ ! -f "$script" || -L "$script" ]]; then',
    '    printf \'引擎子脚本缺失或不可用：%s\\n\' "$relative_script" >&2',
    '    exit 2',
    '  fi',
    `  parent="\${script%/*}"`,
    '  while [[ "$parent" != "$engine_root" ]]; do',
    '    if [[ -L "$parent" ]]; then',
    '      printf \'引擎子脚本路径包含软链接：%s\\n\' "$relative_script" >&2',
    '      exit 2',
    '    fi',
    `    parent="\${parent%/*}"`,
    '  done',
    'done',
    '',
    `for relative_script in "\${scripts[@]}"; do`,
    '  bash -- "$engine_root/$relative_script" "$@"',
    'done',
    '',
  ].join('\n')
}
