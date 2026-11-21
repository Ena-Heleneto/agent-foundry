#!/usr/bin/env bash
# 使用原modes扩展仅注册Increment，保留官方已装的完整源技能。
set -euo pipefail
project_dir='' skills_dir='' cli_path=''
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project|--skills-dir|--cli)
      [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || { printf '参数缺值：%s\n' "$1" >&2; exit 2; }
      case "$1" in --project) project_dir="$2";; --skills-dir) skills_dir="$2";; --cli) cli_path="$2";; esac
      shift 2;;
    --help|-h) printf '%s\n' '内部用法：--project --skills-dir [--cli]'; exit 0;;
    *) printf '未知参数：%s\n' "$1" >&2; exit 2;;
  esac
done
[[ -n "$project_dir" && -n "$skills_dir" ]] || { printf '%s\n' '缺少指令输入' >&2; exit 2; }
project_dir="$(cd -- "$project_dir" && pwd -P)"
skills_dir="$(cd -- "$skills_dir" && pwd -P)"
[[ -f "$project_dir/.specify/init-options.json" ]] || { printf '%s\n' '目标未初始化Spec Kit' >&2; exit 1; }
specify_version="${FOUNDRY_SPECIFY_VERSION:-1.2.6}"
[[ "$specify_version" == 1.2.6 ]] || { printf '%s\n' '紧急版只验证Specify1.2.6' >&2; exit 2; }
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
temporary="$(mktemp -d "${TMPDIR:-/tmp}/urgent-modes-XXXXXXXX")"
trap 'rm -rf -- "$temporary"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
node "$script_dir/prepare-command.mjs" "$project_dir" "$skills_dir" "$temporary" "$specify_version"
if [[ -n "$cli_path" ]]; then cli=("$cli_path"); else cli=(uvx --from "specify-cli==$specify_version" specify); fi
# 探针与新输入分开，避免官方复制把本次核验材料纳入扩展。
probe="$temporary/probe"
input="$temporary/input"
mkdir -m 700 -- "$input"
mv -- "$temporary/extension.yml" "$temporary/commands" "$input/"
node "$script_dir/../lib/managed-state.mjs" prepare "$project_dir" modes "$input" "$probe" "$cli_path"
if [[ -f "$probe/required" ]]; then
  (unset SPECIFY_INIT_DIR SPECIFY_PROJECT_ROOT; cd -- "$probe/project"; "${cli[@]}" extension add --dev "$probe/input" --force) >&2
fi
node "$script_dir/../lib/managed-state.mjs" compare "$project_dir" modes "$input" "$probe" "$cli_path"
if (unset SPECIFY_INIT_DIR SPECIFY_PROJECT_ROOT; cd -- "$project_dir"; "${cli[@]}" extension add --dev "$input" --force) >&2; then
  node "$script_dir/../lib/managed-state.mjs" verify "$project_dir" modes "$input" "$probe" "$cli_path"
  printf '{"status":"success","reasonCode":"increment-registration-verified"}\n'
else
  cli_status=$?
  printf '{"status":"failed","reasonCode":"official-cli-failed"}\n'
  exit "$cli_status"
fi
