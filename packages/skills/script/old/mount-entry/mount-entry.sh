#!/usr/bin/env bash
# T005 独立第二步：只核验本次选择与实际文件；原生挂载由 T006 接通。
set -euo pipefail
umask 077

release_source=''
source_dir=''
version=''
agent=''
installed_root=''
project=''
global=false
no_mount=false
names=()
temporary=''
jq_cli=''
reason_code='runtime'
message=''
installation='not-run'
hooks='not-run'
commands='not-run'
missing='[]'
retry='[]'
catalog_digest=''

fail() {
  reason_code="$2"
  message="$3"
  printf '%s\n' "$message" >&2
  exit "$1"
}

# 报告保持安装核验与挂载阶段独立；清理仅限本进程的临时工具目录。
finish() {
  local status=$?
  trap - EXIT INT TERM
  if [[ -n "$jq_cli" && -f "$temporary/results" ]]; then
    "$jq_cli" -n --slurpfile skills "$temporary/results" \
      --arg version "$version" --arg digest "$catalog_digest" --arg source "${release_source:-$source_dir}" \
      --arg reason "$reason_code" --arg message "$message" --arg installation "$installation" \
      --arg hooks "$hooks" --arg commands "$commands" --argjson missing "$missing" --argjson retry "$retry" --argjson status "$status" '
      {schemaVersion:1,overall:(if $status==0 then "success" elif any($skills[];.status=="verified") then "partial" else "failed" end),
       resolvedRelease:{version:$version,source:$source,catalogDigest:$digest},skills:$skills,
       verifiedSkills:[$skills[]|select(.status=="verified")|.name],reasonCode:(if $status==0 then null else $reason end),message:$message,
       stages:{installation:{status:$installation},hidden:{status:"skipped"},hooks:{status:$hooks},commands:{status:$commands,missingSkills:$missing}},
       retry:$retry,coverageLimits:["MVU-C 当前只核验 Codex 原始目录投影；原生挂载由 T006 接通"]}'
  else
    printf '{"schemaVersion":1,"overall":"failed","verifiedSkills":[],"reasonCode":"%s","stages":{"installation":{"status":"not-run"},"hooks":{"status":"not-run"},"commands":{"status":"not-run"}}}\n' "$reason_code"
  fi
  if [[ -n "$temporary" ]]; then
    rm -rf -- "$temporary"
  fi
  exit "$status"
}
trap finish EXIT
trap 'reason_code=interrupted; exit 130' INT
trap 'reason_code=interrupted; exit 143' TERM

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      trap - EXIT
      printf '%s\n' '用法：mount-entry.sh (--source <固定提交HTTPS根URL> | --source-dir <绝对目录>) --version <版本> --agent codex --installed-root <绝对目录> --skill <名称> [--skill <名称>] [--global] [--project <绝对目录>] [--no-mount]'
      exit 0 ;;
    --global) [[ "$global" == false ]] || fail 2 arguments '重复 --global'; global=true; shift ;;
    --no-mount) [[ "$no_mount" == false ]] || fail 2 arguments '重复 --no-mount'; no_mount=true; shift ;;
    --source|--source-dir|--version|--agent|--installed-root|--project|--skill)
      [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || fail 2 arguments "参数缺值：$1"
      case "$1" in
        --source) [[ -z "$release_source" ]] || fail 2 arguments '重复 --source'; release_source="${2%/}" ;;
        --source-dir) [[ -z "$source_dir" ]] || fail 2 arguments '重复 --source-dir'; source_dir="$2" ;;
        --version) [[ -z "$version" ]] || fail 2 arguments '重复 --version'; version="$2" ;;
        --agent) [[ -z "$agent" ]] || fail 2 arguments '重复 --agent'; agent="$2" ;;
        --installed-root) [[ -z "$installed_root" ]] || fail 2 arguments '重复 --installed-root'; installed_root="$2" ;;
        --project) [[ -z "$project" ]] || fail 2 arguments '重复 --project'; project="$2" ;;
        --skill) names+=("$2") ;;
      esac
      shift 2 ;;
    *) fail 2 arguments "未知或本 MVU 尚未支持的参数：$1" ;;
  esac
done
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$ && "$agent" == codex && ${#names[@]} -gt 0 ]] || fail 2 arguments '必须提供明确版本、--agent codex 与显式 --skill；其他 agent/投影留待后续增量'
[[ "$installed_root" == /* && "$installed_root" != *[$'\t\r\n']* ]] || fail 2 arguments '--installed-root 必须是绝对路径'
if [[ -n "$release_source" && -n "$source_dir" || -z "$release_source" && -z "$source_dir" ]]; then
  fail 2 arguments '--source 与 --source-dir 必须且只能提供一个'
fi
if [[ -n "$release_source" ]]; then
  [[ "$release_source" =~ ^https://[^/@?#]+/([^?#]*/)?[0-9a-fA-F]{40}(/[^?#]*)?$ && "$release_source" != *[$'\t\r\n ']* ]] || fail 2 arguments '来源须为包含完整提交的 HTTPS 根 URL'
fi
for name in "${names[@]}"; do
  [[ "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || fail 2 arguments "技能名无效：$name"
done
[[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || fail 2 platform '本 Bash MVU 当前只验证 Linux x86_64；其他平台尚未验证'
for tool in curl sha256sum stat find wc cmp cp chmod mktemp dirname sort; do
  command -v "$tool" >/dev/null 2>&1 || fail 2 prerequisite "缺少前置工具：$tool"
done
download_timeout="${FOUNDRY_DOWNLOAD_TIMEOUT:-30}"
[[ "$download_timeout" =~ ^[1-9][0-9]*$ ]] || fail 2 arguments 'FOUNDRY_DOWNLOAD_TIMEOUT 必须为正整数秒数'
temporary="$(mktemp -d "${TMPDIR:-/tmp}/foundry-mount-tools-XXXXXXXX")"

# 与 T004 使用同一固定 jq 版本及官方摘要，不在目标项目准备依赖。
download() {
  curl --disable --fail --silent --show-error --location --proto '=https' --proto-redir '=https' \
    --connect-timeout "$download_timeout" --max-time "$download_timeout" --output "$2" -- "$1"
}
if [[ -n "${FOUNDRY_JQ:-}" ]]; then
  [[ -f "$FOUNDRY_JQ" && ! -L "$FOUNDRY_JQ" ]] || fail 2 prerequisite 'FOUNDRY_JQ 必须为普通的 jq 1.8.1 官方二进制'
  cp -- "$FOUNDRY_JQ" "$temporary/jq" || fail 1 prerequisite '无法准备 jq'
else
  download 'https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64' "$temporary/jq" || fail 1 prerequisite 'jq 下载失败，尚未读取安装文件'
fi
[[ "$(sha256sum -- "$temporary/jq")" == '020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d '* ]] || fail 1 prerequisite 'jq 官方摘要不匹配，拒绝执行'
chmod u+x "$temporary/jq"
jq_cli="$temporary/jq"
"$jq_cli" --version >/dev/null || fail 1 prerequisite 'jq 无法执行'
: > "$temporary/results"

# 目录链不得含链接、非目录或越界分量；不通过 realpath 隐藏输入错误。
valid_chain() {
  local current='/' component
  local components=()
  [[ "$1" == /* && "$1" != *[$'\t\r\n']* ]] || return 1
  IFS='/' read -r -a components <<< "$1"
  for component in "${components[@]}"; do
    [[ -n "$component" ]] || continue
    [[ "$component" != . && "$component" != .. ]] || return 1
    current="${current%/}/$component"
    [[ -d "$current" && ! -L "$current" ]] || return 1
  done
}

if [[ -n "$source_dir" ]]; then
  valid_chain "$source_dir" || fail 2 arguments '本地来源必须是无链接的有效绝对目录'
  [[ -f "$source_dir/release.json" && ! -L "$source_dir/release.json" ]] || fail 2 manifest '同版 release.json 缺失或为链接'
  cp -- "$source_dir/release.json" "$temporary/release.json" || fail 1 download '无法读取 release.json'
else
  download "$release_source/release.json" "$temporary/release.json" || fail 1 download '无法取得同版 release.json'
fi

# 最小清单与 T004 相同；正式发布清单和投影全集由后续任务演化。
"$jq_cli" -e --arg version "$version" '
  def safe: type=="string" and length>0 and (test("[\\\\\u0000-\u001f\u007f]")|not) and
    (startswith("/")|not) and (split("/")|all(.!="" and .!="." and .!=".." and (contains(":")|not)));
  .schemaVersion==1 and .version==$version and (.sourceRevision|type=="string" and test("^[a-fA-F0-9]{40}$")) and
  (.files|type=="array" and length>0) and (.skills|type=="array" and length>0) and
  all(.files[];(.path|safe) and (.bytes|type=="number" and .>=0 and floor==.) and (.sha256|type=="string" and test("^[a-f0-9]{64}$"))) and
  ([.files[].path|ascii_downcase]|length==(unique|length)) and ([.skills[].name]|length==(unique|length)) and
  all(.skills[];(.name|type=="string" and test("^[a-z0-9]+(-[a-z0-9]+)*$")) and
    (.category=="coding" or .category=="frontend" or .category=="workflow") and
    (.directory==("skills/"+.category+"/"+.name)) and .requiresSkills==[] and (.sourceFiles|type=="array" and length>0)) and
  (. as $release|all(.skills[];. as $skill|
    (.sourceFiles|length==(unique|length)) and (.sourceFiles|index($skill.directory+"/SKILL.md")!=null) and
    all(.sourceFiles[];. as $file|safe and startswith($skill.directory+"/") and ([$release.files[]|select(.path==$file)]|length==1)) and
    ((.sourceFiles|sort)==([$release.files[].path|select(startswith($skill.directory+"/"))]|sort))))
' "$temporary/release.json" >/dev/null || fail 2 manifest '版本或清单结构、路径不合法'
catalog_digest="$(sha256sum -- "$temporary/release.json")"
catalog_digest="${catalog_digest%% *}"

# 运行中的公共双 shell 材料必须都与本次清单一致，不能回退其他版本。
entry_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
valid_chain "$entry_dir" || fail 2 integrity '公共入口目录含链接'
check_file() {
  local actual="$1" record="$2" hash expected_hash expected_bytes
  [[ -f "$actual" && ! -L "$actual" ]] || return 1
  expected_hash="$("$jq_cli" -r '.sha256' "$record")"
  expected_bytes="$("$jq_cli" -r '.bytes' "$record")"
  [[ "$(wc -c < "$actual")" -eq "$expected_bytes" ]] || return 1
  hash="$(sha256sum -- "$actual")"
  [[ "${hash%% *}" == "$expected_hash" ]]
}
for file in mount-entry.sh mount-entry.ps1; do
  "$jq_cli" -e --arg file "script/mount-entry/$file" '.files[]|select(.path==$file)' "$temporary/release.json" > "$temporary/material.json" || fail 2 integrity "公共材料未列入本版清单：$file"
  check_file "$entry_dir/$file" "$temporary/material.json" || fail 2 integrity "公共材料缺失或摘要不匹配：$file"
done

# 静态选择全部验证后再读安装文件；不枚举历史安装来补选。
selected=()
workflow=false
has_mode=false
for name in "${names[@]}"; do
  [[ " ${selected[*]:-} " != *" $name "* ]] || continue
  "$jq_cli" -e --arg name "$name" '.skills[]|select(.name==$name)' "$temporary/release.json" > "$temporary/skill-$name.json" || fail 2 selection "未知技能：$name"
  selected+=("$name")
  if "$jq_cli" -e '.category=="workflow"' "$temporary/skill-$name.json" >/dev/null; then workflow=true; fi
  case "$name" in task-tutor|task-pair|task-review|task-explore|task-guide) has_mode=true ;; esac
done
cwd="$(pwd -P)"
if [[ "$global" == true ]]; then
  expected_root="${HOME%/}/.agents/skills"
else
  expected_root="$cwd/.agents/skills"
  [[ -z "$project" || "$project" == "$cwd" ]] || fail 2 arguments '项目级 --project 必须等于当前目录'
  project="$cwd"
fi
[[ "${installed_root%/}" == "$expected_root" ]] || fail 2 path 'installed-root 不符合 Codex 当前 agent/scope 的实际安装位置'
valid_chain "$installed_root" || fail 2 path '安装根不存在或目录链含链接'

verify_skill() (
  local name="$1" directory="$installed_root/$1" file relative source_file
  valid_chain "$directory" || return 1
  # 函数用于 if 条件时不能依赖 errexit；枚举不完整必须显式失败。
  find "$directory" ! -type d ! -type f -print -quit > "$temporary/invalid-files" || return 1
  [[ ! -s "$temporary/invalid-files" ]] || return 1
  find "$directory" -type f -printf '%P\n' > "$temporary/actual-unsorted" || return 1
  LC_ALL=C sort "$temporary/actual-unsorted" > "$temporary/actual" || return 1
  "$jq_cli" -r '.directory as $root|.sourceFiles[]|ltrimstr($root+"/")' "$temporary/skill-$name.json" | LC_ALL=C sort > "$temporary/expected" || return 1
  cmp -s "$temporary/actual" "$temporary/expected" || return 1
  while IFS= read -r source_file; do
    relative="${source_file#"$("$jq_cli" -r '.directory' "$temporary/skill-$name.json")"/}"
    file="$directory/$relative"
    "$jq_cli" -e --arg file "$source_file" '.files[]|select(.path==$file)' "$temporary/release.json" > "$temporary/record.json" || return 1
    check_file "$file" "$temporary/record.json" || return 1
  done < <("$jq_cli" -r '.sourceFiles[]' "$temporary/skill-$name.json")
)
invalid=false
for name in "${selected[@]}"; do
  if verify_skill "$name"; then
    "$jq_cli" -cn --arg name "$name" '{name:$name,status:"verified"}' >> "$temporary/results"
  else
    invalid=true
    "$jq_cli" -cn --arg name "$name" '{name:$name,status:"failed",reasonCode:"integrity"}' >> "$temporary/results"
    printf '技能缺文件、额外文件、链接或摘要不匹配：%s\n' "$name" >&2
  fi
done
if [[ "$invalid" == true ]]; then
  installation=failed
  fail 1 integrity '本次选择有未通过实际文件核验的技能；不执行挂载'
fi
installation=success
if [[ "$no_mount" == true || "$workflow" == false ]]; then
  hooks=skipped; commands=skipped
  message='本次文件核验通过，挂载已关闭或不适用'
  exit 0
fi
if [[ -z "$project" ]]; then
  hooks=failed
  retry='["使用相同版本、来源、选择及 installed-root 重试，并补传 --project <绝对项目目录>"]'
  fail 2 project '全局技能安装核验成功；挂载缺少明确的 --project'
fi
valid_chain "$project" || { hooks=failed; fail 2 project '挂载项目路径不存在或含链接'; }
if [[ ! -d "$project/.specify" ]]; then
  hooks=skipped; commands=skipped
  message='本次文件核验通过；非 Spec Kit 项目，跳过原生挂载'
  exit 0
fi
if [[ "$has_mode" == true ]]; then
  missing="$("$jq_cli" -n --slurpfile skills "$temporary/results" '["task-tutor","task-pair","task-review","task-explore","task-guide"]-[$skills[].name]')"
  if [[ "$missing" != '[]' ]]; then
    # jq 默认美化非空数组；空数组输出固定为 []。
    if [[ "$("$jq_cli" 'length' <<< "$missing")" -gt 0 ]]; then
      commands=failed
      retry='["显式补齐全部五项选择并安装同版完整文件后，使用相同公共入口重试；本入口不补装技能"]'
      fail 2 selection '技能安装核验成功；五指令挂载缺少本次显式选择，详见 commands.missingSkills'
    fi
  fi
fi
retry='["原生 hooks/commands 调用尚待 T006 接通；当前只完成文件与前置条件核验"]'
fail 2 unsupported '本次技能文件核验成功；原生挂载尚未接通，未执行任何 hooks 或指令注册'
