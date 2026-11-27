#!/usr/bin/env bash
# foundry-hidden-interface: 1
set -euo pipefail

# 构建时由模板填入启用技能的候选路径。
candidate_paths='[]'

# 读取协议 1 参数，每个选项只接受一次。
read_options() {
  local -A options=()
  while (($#)); do
    case "$1" in
      --project|--agent-root|--successful-skills-file|--result-file)
        [[ -n "${2-}" && -z "${options[$1]+present}" ]] || return 1
        options["$1"]=$2
        ;;
      *)
        return 1
        ;;
    esac
    shift 2
  done

  project=${options[--project]-}
  agent_root=${options[--agent-root]-}
  successful_file=${options[--successful-skills-file]-}
  result_file=${options[--result-file]-}
}

# 在写入 Git 规则前取得结果文件，已有文件和链接由原调用保留。
open_result_file() {
  local previous_umask
  previous_umask=$(umask)
  umask 077
  set -o noclobber
  if [[ -e "$result_file" || -L "$result_file" ]] || ! exec 3>"$result_file"; then
    printf '无法独占创建隐匿结果文件：%s\n' "$result_file" >&2
    return 1
  fi
  set +o noclobber
  umask "$previous_umask"
}

is_plain_directory() {
  [[ -d "$1" && ! -L "$1" ]]
}

git_for_project() {
  GIT_COMMON_DIR="$git_dir" GIT_INDEX_FILE="$git_dir/index" \
    git -C "$project" --git-dir="$git_dir" --work-tree="$project" "$@"
}

# JSON 路径保持编码，逐行交给 Bash 核对目录和 Git 索引。
collect_paths() {
  local records relative record tracked
  local -A seen_paths=()
  records=$("$jq_cli" -rs \
    --arg project "$project_root" --arg agentRoot "$agent_root" \
    --argjson candidates "$candidate_paths" '
      def valid_record:
        type == "object"
        and (.name | type == "string" and length > 0)
        and (.installRelativeDirectory | type == "string")
        and (.installedPath | type == "string")
        and (.complete | type == "boolean");

      def invalid_directory:
        . == "" or . == "." or . == ".."
        or any(explode[]; . < 32 or . == 47 or . == 127);

      ($candidates | map(ltrimstr("@@AGENT_SKILLS_ROOT@@/"))) as $names
      | if length == 1 and (.[0] | type == "array" and all(.[]; valid_record))
        then .[0][]
        else error("技能成功名单格式无效")
        end
      | .installRelativeDirectory as $name
      | ($agentRoot + "/" + $name) as $relative
      | (if .complete == false then "incomplete"
         elif ($name | invalid_directory) or ($names | index($name)) == null then "not-a-candidate"
         elif .installedPath != ($project + "/" + $relative) then "not-a-local-skill-directory"
         else null end) as $reason
      | if $reason == null then $relative + "\t" + (.installedPath | tojson)
        else "skip\t" + ({path: .installedPath, reasonCode: $reason} | tojson)
        end
    ' -- "$successful_file") || return 1

  while IFS=$'\t' read -r relative record; do
    [[ -n "$relative" ]] || continue
    if [[ "$relative" == skip ]]; then
      skipped+=("$record")
    elif ! is_plain_directory "$project_root/.agents" \
        || ! is_plain_directory "$project_root/$agent_root" \
        || ! is_plain_directory "$project_root/$relative"; then
      skipped+=("{\"path\":$record,\"reasonCode\":\"not-a-local-skill-directory\"}")
    elif ! tracked=$(git_for_project --literal-pathspecs ls-files -- "$relative"); then
      return 1
    elif [[ -n "$tracked" ]]; then
      skipped+=("{\"path\":$record,\"reasonCode\":\"tracked\"}")
    elif [[ -z "${seen_paths[$relative]+present}" ]]; then
      seen_paths["$relative"]=1
      paths+=("$relative")
    fi
  done <<< "$records"
}

# 在同一把锁内检查现有规则并追加，保留文件原字节。
append_rules() (
  local info="$git_dir/info" exclude="$git_dir/info/exclude"
  local lock="$git_dir/info/exclude.lock"
  local relative rule existing=''
  local -a additions=()
  local -A existing_rules=()

  if [[ -L "$info" || ( -e "$info" && ! -d "$info" ) ]]; then
    printf '本地排除目录必须是普通目录\n' >&2
    exit 1
  fi
  mkdir -p -- "$info" || exit 1
  mkdir -m 0700 -- "$lock" || exit 1
  trap 'rmdir -- "$lock"' EXIT

  if [[ -L "$exclude" || ( -e "$exclude" && ( ! -f "$exclude" || $(stat -c '%h' -- "$exclude") != 1 ) ) ]]; then
    printf '本地排除文件必须是普通文件\n' >&2
    exit 1
  fi

  if [[ -f "$exclude" ]]; then
    # 只去掉 CRLF 的回车，未换行的末行保留原值。
    while IFS= read -r existing; do
      existing=${existing%$'\r'}
      [[ -z "$existing" ]] || existing_rules["$existing"]=1
    done < "$exclude" || exit 1
    if [[ -n "$existing" ]]; then
      existing_rules["$existing"]=1
    fi
  fi

  for relative in "${paths[@]}"; do
    rule=$(printf '/%s/\n' "$relative" | sed 's/[][\\*?]/\\&/g') || exit 1
    if [[ -z "${existing_rules[$rule]+present}" ]]; then
      additions+=("$rule")
    fi
  done

  (("${#additions[@]}")) || exit 0
  {
    if [[ -s "$exclude" ]] && ! tail -c 1 -- "$exclude" | cmp -s - <(printf '\n'); then
      printf '\n' || exit 1
    fi
    printf '%s\n' "${additions[@]}"
  } >> "$exclude" || exit 1
  exit 0
)

hide_skills() {
  local relative
  IFS= read -r -d '' project < <(realpath -msz -- "$project") || return 1
  project_root=${project%/}
  git_dir="$project_root/.git"
  if ! is_plain_directory "$git_dir" || [[ -e "$git_dir/commondir" || -L "$git_dir/commondir" ]]; then
    reason_code=no-local-git-directory
    return 0
  fi

  collect_paths || return 1
  if (("${#paths[@]}" == 0)); then
    reason_code=no-applicable-skills
    return 0
  fi

  if ! append_rules; then
    reason_code=exclude-write-failed
    for relative in "${paths[@]}"; do
      failed+=("exclude-write-failed"$'\t'"$relative")
    done
    return 1
  fi

  for relative in "${paths[@]}"; do
    if git_for_project check-ignore --quiet -- "$relative/"; then
      processed+=("$relative")
    elif (($? == 1)); then
      failed+=("rule-ineffective"$'\t'"$relative")
    else
      failed+=("git-query-failed"$'\t'"$relative")
    fi
  done

  if (("${#failed[@]}")); then
    reason_code=verification-failed
    return 1
  fi
  status=success
  reason_code=rules-verified
}

write_report() {
  local entry
  {
    for entry in "${processed[@]}"; do
      printf 'processed\t%s\n' "$entry"
    done
    for entry in "${skipped[@]}"; do
      printf 'skipped\t%s\n' "$entry"
    done
    for entry in "${failed[@]}"; do
      printf 'failed\t%s\n' "$entry"
    done
  } | "$jq_cli" -cRn --arg status "$status" --arg reasonCode "$reason_code" '
    reduce inputs as $row (
      {$status, $reasonCode, processed: [], skipped: [], failed: []};
      ($row | split("\t")) as [$key, $value, $path]
      | .[$key] += [if $key == "skipped" then ($value | fromjson)
                    elif $key == "failed" then {path: $path, reasonCode: $value}
                    else $value end]
    )
  ' >&3
}

if ! read_options "$@"; then
  printf '隐匿参数缺失、重复或无效\n' >&2
  exit 1
fi
if [[ "$project" != /* || "$agent_root" != .agents/skills || "$successful_file" != /* || "$result_file" != /* ]]; then
  printf '隐匿需指定绝对路径和 .agents/skills 安装根\n' >&2
  exit 1
fi

jq_cli="${FOUNDRY_HIDDEN_JQ:-jq}"
if ! command -v -- "$jq_cli" >/dev/null 2>&1; then
  printf '缺少隐匿依赖：jq\n' >&2
  exit 1
fi
open_result_file || exit 1

paths=()
processed=()
skipped=()
failed=()
status=skipped
reason_code=hidden-failed

if ! hide_skills; then
  status=failed
fi
write_report
[[ "$status" != failed ]]
