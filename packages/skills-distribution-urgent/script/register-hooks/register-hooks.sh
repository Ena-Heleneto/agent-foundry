#!/usr/bin/env bash
# 先核验本次所选定义，再由官方CLI逐项重装hooks。
set -euo pipefail
project_dir='' skills_dir='' config_root='' cli_path=''
selected=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project|--skills-dir|--config-root|--cli|--skill)
      [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || { printf '参数缺值：%s\n' "$1" >&2; exit 2; }
      case "$1" in
        --project) project_dir="$2";; --skills-dir) skills_dir="$2";;
        --config-root) config_root="$2";; --cli) cli_path="$2";; --skill) selected+=("$2");;
      esac
      shift 2;;
    --help|-h) printf '%s\n' '内部用法：--project --skills-dir --config-root --skill [--cli]'; exit 0;;
    *) printf '未知参数：%s\n' "$1" >&2; exit 2;;
  esac
done
[[ -n "$project_dir" && -n "$skills_dir" && -n "$config_root" ]] || { printf '%s\n' '缺少hooks输入' >&2; exit 2; }
project_dir="$(cd -- "$project_dir" && pwd -P)"
skills_dir="$(cd -- "$skills_dir" && pwd -P)"
config_root="$(cd -- "$config_root" && pwd -P)"
[[ -f "$project_dir/.specify/init-options.json" ]] || { printf '%s\n' '目标未初始化Spec Kit' >&2; exit 1; }
specify_version="${FOUNDRY_SPECIFY_VERSION:-1.2.6}"
[[ "$specify_version" == 1.2.6 ]] || { printf '%s\n' '紧急版只验证Specify1.2.6' >&2; exit 2; }
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
temporary="$(mktemp -d "${TMPDIR:-/tmp}/urgent-hooks-XXXXXXXX")"
failed_hook=''
failure_reason=''
selection_ready=false
: > "$temporary/results"
: > "$temporary/retired-results"
retired_ids=(artifact-issue-description artifact-pr-description mvu-gate artifact-business-flow artifact-logic-flow explainer-doc-sync)
printf '%s\n' "${retired_ids[@]}" > "$temporary/retired-selection"
# 挂载失败仍保留先前真实成功项，并明确后续未执行的所选定义。
finish() {
  local status=$?
  trap - EXIT INT TERM
  if [[ "$selection_ready" != true ]]; then
    printf '%s\n' "${selected[@]}" > "$temporary/selection"
  fi
  jq -cn --argjson code "$status" --arg failed "$failed_hook" --arg reason "$failure_reason" \
    --rawfile selection "$temporary/selection" --slurpfile completed "$temporary/results" \
    --rawfile retiredSelection "$temporary/retired-selection" --slurpfile retiredCompleted "$temporary/retired-results" '
    def stages($names; $finished):
      $names|split("\n")|map(select(length>0))|map(. as $name|
        ([$finished[]|select(.name==$name)]|last) //
        {name:$name,status:(if $name==$failed then "failed" else "not-run" end),
         reasonCode:(if $name==$failed then $reason else "blocked-by-earlier-failure" end)});
    {status:(if $code==0 then "success" else "failed" end),
     reasonCode:(if $code==0 then null elif $reason=="" then "hook-registration-failed" else $reason end),
     results:stages($selection; $completed),retired:stages($retiredSelection; $retiredCompleted)}'
  rm -rf -- "$temporary"
  exit "$status"
}
trap finish EXIT
trap 'failure_reason=interrupted; exit 130' INT
trap 'failure_reason=interrupted; exit 143' TERM
if [[ -n "$cli_path" ]]; then cli=("$cli_path"); else cli=(uvx --from "specify-cli==$specify_version" specify); fi
failure_reason=invalid-hook-configuration
node "$script_dir/prepare-hooks.mjs" "$project_dir" "$skills_dir" "$config_root" "$temporary" "$specify_version" "${selected[@]}" > "$temporary/selection"
selection_ready=true
# 六旧登记只按明确受管ID核验；有登记才由官方remove，无归属残留保留并拒绝。
for retired_id in "${retired_ids[@]}"; do
  failed_hook="$retired_id"
  input="$temporary/retired/$retired_id"
  probe="$temporary/probes/retired/$retired_id"
  mkdir -p -- "$input"
  jq -n --arg id "$retired_id" --arg version "$specify_version" '
    {schema_version:"1.0",extension:{id:$id,name:$id,version:"1.0.0",description:"仅用于核验旧受管来源"},
     requires:{speckit_version:("=="+$version)},provides:{}}' > "$input/extension.yml"
  failure_reason=retired-source-conflict
  node "$script_dir/../lib/managed-state.mjs" prepare "$project_dir" "$retired_id" "$input" "$probe" "$cli_path"
  if [[ -f "$probe/required" ]]; then
    failure_reason=official-retired-probe-failed
    (unset SPECIFY_INIT_DIR SPECIFY_PROJECT_ROOT; cd -- "$probe/project"; "${cli[@]}" extension add --dev "$probe/input" --force) >&2
    failure_reason=retired-output-conflict
    node "$script_dir/../lib/managed-state.mjs" compare "$project_dir" "$retired_id" "$input" "$probe" "$cli_path"
  else
    printf '{"name":"%s","status":"not-run","reasonCode":"not-installed"}\n' "$retired_id" >> "$temporary/retired-results"
  fi
done
# 每项探针与扩展输入分开，全部预检完成后才允许真实目标写入。
while IFS= read -r hook_id || [[ -n "$hook_id" ]]; do
  [[ -n "$hook_id" ]] || continue
  failed_hook="$hook_id"
  probe="$temporary/probes/$hook_id"
  failure_reason=managed-source-conflict
  node "$script_dir/../lib/managed-state.mjs" prepare "$project_dir" "$hook_id" "$temporary/$hook_id" "$probe" "$cli_path"
  if [[ -f "$probe/required" ]]; then
    failure_reason=official-probe-failed
    (unset SPECIFY_INIT_DIR SPECIFY_PROJECT_ROOT; cd -- "$probe/project"; "${cli[@]}" extension add --dev "$probe/input" --force) >&2
  fi
  failure_reason=managed-output-conflict
  node "$script_dir/../lib/managed-state.mjs" compare "$project_dir" "$hook_id" "$temporary/$hook_id" "$probe" "$cli_path"
done < "$temporary/selection"
# 所选新定义和六旧来源全部核对后，才允许开始官方破坏性迁移。
for retired_id in "${retired_ids[@]}"; do
  probe="$temporary/probes/retired/$retired_id"
  [[ -f "$probe/required" ]] || continue
  failed_hook="$retired_id"
  failure_reason=official-retirement-failed
  (unset SPECIFY_INIT_DIR SPECIFY_PROJECT_ROOT; cd -- "$project_dir"; "${cli[@]}" extension remove "$retired_id" --force) >&2
  failure_reason=retirement-readback-failed
  if node "$script_dir/../lib/managed-state.mjs" verify-removed "$project_dir" "$retired_id" "$temporary/retired/$retired_id" "$probe" "$cli_path"; then
    printf '{"name":"%s","status":"success","reasonCode":"retired-registration-removed"}\n' "$retired_id" >> "$temporary/retired-results"
  else
    verify_status=$?
    printf '{"name":"%s","status":"failed","reasonCode":"retirement-readback-failed","officialRemoval":"success"}\n' "$retired_id" >> "$temporary/retired-results"
    exit "$verify_status"
  fi
done
while IFS= read -r hook_id || [[ -n "$hook_id" ]]; do
  [[ -n "$hook_id" ]] || continue
  failed_hook="$hook_id"
  failure_reason=official-cli-failed
  if (unset SPECIFY_INIT_DIR SPECIFY_PROJECT_ROOT; cd -- "$project_dir"; "${cli[@]}" extension add --dev "$temporary/$hook_id" --force) >&2; then
    failure_reason=official-readback-failed
    if node "$script_dir/../lib/managed-state.mjs" verify "$project_dir" "$hook_id" "$temporary/$hook_id" "$temporary/probes/$hook_id" "$cli_path"; then
      printf '{"name":"%s","status":"success","reasonCode":"official-registration-verified"}\n' "$hook_id" >> "$temporary/results"
    else
      verify_status=$?
      printf '{"name":"%s","status":"failed","reasonCode":"official-readback-failed","officialWrite":"success"}\n' "$hook_id" >> "$temporary/results"
      exit "$verify_status"
    fi
  else
    cli_status=$?
    exit "$cli_status"
  fi
done < "$temporary/selection"
failed_hook=''
failure_reason=''
