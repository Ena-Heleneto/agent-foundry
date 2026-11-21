#!/usr/bin/env bash
# foundry-engine-interface: 1
set -euo pipefail

engine_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
scripts=()

# 检查待执行脚本及它在包内的父目录。
check_script() {
  local root="$1" relative_script="$2" script parent
  script="$root/$relative_script"
  if [[ ! -f "$script" || -L "$script" ]]; then
    printf '引擎子脚本缺失或不可用：%s\n' "$relative_script" >&2
    return 2
  fi
  parent="${script%/*}"
  while [[ "$parent" != "$root" ]]; do
    if [[ -L "$parent" ]]; then
      printf '引擎子脚本路径包含软链接：%s\n' "$relative_script" >&2
      return 2
    fi
    parent="${parent%/*}"
  done
}

# 按请求运行同包隐匿脚本，并核对本次结果。
hide_successful_skills() {
  local root="$engine_root" relative_script='script/hidden-install.sh'
  local result_file="$1" hidden_script interface hidden_exit=0
  local jq_cli="${FOUNDRY_ENGINE_JQ:-jq}"
  shift

  if [[ -L "$root/script" ]]; then
    printf '技能包隐匿脚本路径包含软链接：%s\n' "$relative_script" >&2
    return 1
  fi
  if [[ ! -e "$root/$relative_script" && ! -L "$root/$relative_script" ]]; then
    root="${engine_root%/*}"
  fi
  check_script "$root" "$relative_script" || return 1
  hidden_script="$root/$relative_script"
  if ! { IFS= read -r _ && IFS= read -r interface; } < "$hidden_script" ||
    [[ "$interface" != '# foundry-hidden-interface: 1' ]]; then
    printf '技能包的隐匿脚本协议不受支持。\n' >&2
    return 1
  fi
  FOUNDRY_HIDDEN_JQ="$jq_cli" bash -- "$hidden_script" "$@" || hidden_exit=$?

  if [[ ! -f "$result_file" || -L "$result_file" ]] || ! "$jq_cli" -er --argjson code "$hidden_exit" '
    select(type == "object" and (.reasonCode | type == "string")
      and ([.processed, .skipped, .failed] | all(type == "array")))
    | if .status == "success" and $code == 0 and (.processed | length > 0) and (.failed | length == 0)
        then "隐匿成功：\(.processed | length) 项"
      elif .status == "skipped" and $code == 0 and (.processed | length == 0) and (.failed | length == 0)
        then "跳过隐匿：\(.reasonCode)"
      elif .status == "failed" and $code == 1 then "隐匿失败：\(.reasonCode)"
      else empty end
  ' "$result_file"; then
    printf '无法核对隐匿脚本的运行结果。\n' >&2
    return 1
  fi
  return "$hidden_exit"
}

# 依次读取引擎选项，剩余参数继续传给自动挂载的子脚本。
hidden=false
auto_mount=true
hidden_arguments=()
result_file=''
while (($#)); do
  case "$1" in
    --hidden) hidden=true; shift ;;
    --no-mount) auto_mount=false; shift ;;
    --project|--agent-root|--successful-skills-file|--result-file)
      [[ "$hidden" == true ]] || break
      if (($# < 2)); then
        printf '引擎参数缺值：%s\n' "$1" >&2
        exit 2
      fi
      if [[ "$1" == --result-file ]]; then
        result_file="$2"
      fi
      hidden_arguments+=("$1" "$2")
      shift 2
      ;;
    *) break ;;
  esac
done

hidden_status=0
if [[ "$hidden" == true ]] && ! hide_successful_skills "$result_file" "${hidden_arguments[@]}"; then
  printf '隐匿失败。\n' >&2
  hidden_status=1
fi

if [[ "$auto_mount" == true ]]; then
  for relative_script in "${scripts[@]}"; do
    check_script "$engine_root" "$relative_script"
  done
  for relative_script in "${scripts[@]}"; do
    bash -- "$engine_root/$relative_script" "$@"
  done
fi
exit "$hidden_status"
