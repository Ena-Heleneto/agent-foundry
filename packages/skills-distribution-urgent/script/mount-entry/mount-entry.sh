#!/usr/bin/env bash
# 官方安装后的显式第二步：同版完整性核验通过后按 hooks → Increment 挂载。
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
integrity='not-run'
hook_results='[]'
retired_results='[]'
hook_report='null'
upstream='null'
hooks_reason=''
commands_reason=''
command_result='null'
legacy='not-run'
legacy_reason='requires-migration-evidence'
hooks='not-run'
commands='not-run'
missing='[]'
retry='[]'
catalog_digest=''

fail() {
  reason_code="$2"
  message="$3"
  [[ "$reason_code" != integrity ]] || integrity=failed
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
      --arg hooks "$hooks" --arg commands "$commands" --arg integrity "$integrity" --arg hooksReason "$hooks_reason" --arg commandsReason "$commands_reason" --arg legacy "$legacy" --arg legacyReason "$legacy_reason" --argjson retiredResults "$retired_results" --arg target "$installed_root" --arg project "$project" --argjson commandResult "$command_result" --argjson hookResults "$hook_results" --argjson upstream "$upstream" --argjson missing "$missing" --argjson retry "$retry" --argjson status "$status" '
      {schemaVersion:1,overall:(if $status==0 then "success" elif any($skills[];.status=="verified") then "partial" else "failed" end),
       upstream:$upstream,resolvedRelease:{version:$version,source:$source,catalogDigest:$digest},skills:$skills,
       selection:{names:[$skills[].name]},target:{agent:"codex",scope:"project",path:$target,project:$project},verifiedSkills:[$skills[]|select(.status=="verified")|.name],reasonCode:(if $status==0 then null else $reason end),message:$message,
       stages:{installation:{status:$installation,reasonCode:(if $installation=="failed" then $reason else null end)},integrity:{status:$integrity,reasonCode:(if $integrity=="failed" then $reason else null end)},hooks:{status:$hooks,reasonCode:(if $hooksReason=="" then null else $hooksReason end),results:$hookResults,retired:$retiredResults},commands:{status:$commands,reasonCode:(if $commandsReason=="" then null else $commandsReason end),missingSkills:$missing,result:$commandResult},legacy:{status:$legacy,reasonCode:$legacyReason,results:$retiredResults},loading:{status:"not-run",reasonCode:"requires-host-session"}},
       retry:$retry,coverageLimits:["注册成功不代表宿主实际完整加载；加载证据由独立会话提供"]}'
  else
    printf '{"schemaVersion":1,"overall":"failed","verifiedSkills":[],"reasonCode":"%s","stages":{"installation":{"status":"not-run"},"integrity":{"status":"not-run"},"hooks":{"status":"not-run"},"commands":{"status":"not-run"}}}\n' "$reason_code"
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
      printf '%s\n' '用法：mount-entry.sh (--source <固定提交HTTPS根URL> | --source-dir <绝对目录>) --version <版本> --agent codex --skill <名称> [--skill <名称>] [--project <绝对目录>] [--no-mount]'
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
[[ -z "$installed_root" || "$installed_root" == /* && "$installed_root" != *[$'\t\r\n']* ]] || fail 2 arguments '--installed-root 必须是绝对路径'
[[ "$global" == false ]] || fail 2 unsupported '紧急版只支持 Codex 项目级，不支持全局安装'
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
for tool in node tar curl sha256sum stat find wc cmp cp chmod mktemp dirname sort tail; do
  command -v "$tool" >/dev/null 2>&1 || fail 2 prerequisite "缺少前置工具：$tool"
done
download_timeout="${FOUNDRY_DOWNLOAD_TIMEOUT:-30}"
[[ "$download_timeout" =~ ^[1-9][0-9]*$ ]] || fail 2 arguments 'FOUNDRY_DOWNLOAD_TIMEOUT 必须为正整数秒数'
temporary="$(mktemp -d "${TMPDIR:-/tmp}/foundry-mount-tools-XXXXXXXX")"

# 远端同版材料仅通过 HTTPS 获取；不在目标项目准备依赖。
download() {
  curl --disable --fail --silent --show-error --location --max-redirs 0 --proto '=https' --proto-redir '=https' \
    --connect-timeout "$download_timeout" --max-time "$download_timeout" --output "$2" -- "$1"
}
# 第二步仅使用调用方已准备的工具，不自动下载或安装依赖。
jq_cli="${FOUNDRY_JQ:-$(command -v jq || true)}"
[[ -n "$jq_cli" && -x "$jq_cli" ]] || fail 2 prerequisite '请先准备 jq 1.8.1，或设置 FOUNDRY_JQ 指向已有工具'
[[ "$("$jq_cli" --version)" == jq-1.8.1 ]] || fail 2 prerequisite '紧急版运行时需要 jq 1.8.1'
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

if [[ -n "$release_source" ]]; then
  release_source="$(node --input-type=module - "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../install-skills" && pwd -P)/read-agents.mjs" "$release_source" <<'JS'
import { pathToFileURL } from 'node:url'
/**
 * 同版纯函数负责唯一的固定 GitHub 来源解析。
 */
const { resolveOfficialSource } = await import(pathToFileURL(process.argv[2]).href)
try {
  process.stdout.write(resolveOfficialSource(process.argv[3]).rawRoot)
}
catch (error) {
  process.stderr.write(`固定来源无效：${error.message}\n`)
  process.exitCode = 2
}
JS
)" || fail 2 source '远端来源无法转换为同版固定 GitHub raw 根'
fi
if [[ -n "$source_dir" ]]; then
  valid_chain "$source_dir" || fail 2 arguments '本地来源必须是无链接的有效绝对目录'
  [[ -f "$source_dir/release.json" && ! -L "$source_dir/release.json" ]] || fail 2 manifest '同版 release.json 缺失或为链接'
  cp -- "$source_dir/release.json" "$temporary/release.json" || fail 1 download '无法读取 release.json'
else
  download "$release_source/release.json" "$temporary/release.json" || fail 1 download '无法取得同版 release.json'
fi

# 普通第二步与只读官方预检核验相同的 identity 发布清单。
"$jq_cli" -e --arg version "$version" '
    def safe: type=="string" and length>0 and (test("[\\\\\u0000-\u001f\u007f]")|not) and (startswith("/")|not)
      and (split("/")|all(.!="" and .!="." and .!=".." and (contains(":")|not)));
    def file: (.path|safe) and (.bytes|type=="number" and .>=0 and floor==.) and (.sha256|type=="string" and test("^[a-f0-9]{64}$"));
    def strings: type=="array" and all(.[];type=="string" and test("[^[:space:]]")) and length==(unique|length);
    .schemaVersion==1 and .version==$version and (.sourceRevision|type=="string" and test("^[a-fA-F0-9]{40}$"))
    and (.development==null or .development==false)
    and ([.skills[].name]-["business-node-delivery","document-changed-symbols","nuxt-ui-styling","vue-reactivity","bug-report","artifact-project-description","artifact-spec-analysis","implementation-preparation","task-increment"]|length==0)
    and .tools.skills=="latest" and .tools.specify=="1.2.6" and .tools.node==">=22.20.0" and .tools.bash==">=3.2" and .tools.powershell==">=7.4"
    and (.tools.npm|type=="string" and test("^[0-9]+\\.[0-9]+\\.[0-9]+([-+][0-9A-Za-z.-]+)?$"))
    and (.files|type=="array" and length>0 and all(.[];file)) and ([.files[].path|ascii_downcase]|length==(unique|length))
    and (.skills|type=="array" and length>0) and ([.skills[].name]|length==(unique|length))
    and (. as $r|all(.skills[];. as $s|(.name|type=="string" and test("^[a-z0-9]+(-[a-z0-9]+)*$"))
      and (.category=="coding" or .category=="frontend" or .category=="workflow") and .directory==("skills/"+.category+"/"+.name)
      and (.requiresSkills|strings) and (.projectPrerequisites|strings) and (.mountMappingIds|strings)
      and (.sourceFiles|type=="array" and length>0 and length==(unique|length) and index($s.directory+"/SKILL.md")!=null)
      and all(.sourceFiles[];. as $p|safe and startswith($s.directory+"/") and ([$r.files[]|select(.path==$p)]|length==1))
      and ([ $r.files[]|select(.path|startswith($s.directory+"/")) ]|length)==(.sourceFiles|length)
      and all(.requiresSkills[];. as $d|any($r.skills[];.name==$d))))
    and (.projections|type=="object" and (keys|sort)==["identity"])
    and (. as $r|all(["identity"][];. as $id|
      ($r.projections[$id]|type=="object" and (keys|sort)==([$r.skills[].name]|sort))
      and all($r.skills[];. as $s|($s.sourceFiles|map(.[($s.directory|length)+1:])|sort) as $paths|
        ($s.installedFilesByProjection|type=="object" and (keys|sort)==["identity"])
        and ($s.installedFilesByProjection[$id]|strings and sort==$paths)
        and ($r.projections[$id][$s.name]|type=="array" and length==($paths|length) and ([.[].path]|sort)==$paths
          and all(.[];. as $f|file and (.sourcePath|safe)
            and any($r.files[];.path==$f.sourcePath and .bytes==$f.bytes and .sha256==$f.sha256)
            and ($id!="identity" or .sourcePath==($s.directory+"/"+.path))
            and ((.path|split("/")|last|ascii_downcase)=="skill.md" or any($r.files[];.path==($s.directory+"/"+$f.path) and .bytes==$f.bytes and .sha256==$f.sha256)))))))
    and (. as $r|.adapters|type=="array" and length>0 and any(.[];.path=="script/install-skills/read-agents.mjs")
      and all(.[];. as $a|file and any($r.files[];.path==$a.path and .bytes==$a.bytes and .sha256==$a.sha256)))
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
script_root="$(cd -- "$entry_dir/.." && pwd -P)"
# 全部运行脚本与集中配置都必须来自本次同版清单，而非旧缓存。
while IFS= read -r file; do
  "$jq_cli" -e --arg file "$file" '.files[]|select(.path==$file)' "$temporary/release.json" > "$temporary/material.json" || fail 2 integrity "公共材料未列入本版清单：$file"
  check_file "$script_root/${file#script/}" "$temporary/material.json" || fail 2 integrity "公共材料缺失或摘要不匹配：$file"
done < <("$jq_cli" -r '.files[]|select(.path|startswith("script/"))|.path' "$temporary/release.json")
find "$script_root" ! -type d ! -type f -print -quit > "$temporary/invalid-script"
[[ ! -s "$temporary/invalid-script" ]] || fail 2 integrity '运行脚本目录包含链接或特殊文件'
find "$script_root" -type f -printf 'script/%P\n' | LC_ALL=C sort > "$temporary/actual-script"
"$jq_cli" -r '.files[]|select(.path|startswith("script/"))|.path' "$temporary/release.json" | LC_ALL=C sort > "$temporary/expected-script"
cmp -s "$temporary/actual-script" "$temporary/expected-script" || fail 2 integrity '运行脚本文件全集与本版清单不符'

# 静态选择全部验证后再读安装文件；不枚举历史安装来补选。
selected=()
workflow=false
has_mode=false
for name in "${names[@]}"; do
  [[ " ${selected[*]:-} " != *" $name "* ]] || continue
  "$jq_cli" -e --arg name "$name" '.skills[]|select(.name==$name)' "$temporary/release.json" > "$temporary/skill-$name.json" || fail 2 selection "未知技能：$name"
  selected+=("$name")
  if "$jq_cli" -e '.category=="workflow"' "$temporary/skill-$name.json" >/dev/null; then workflow=true; fi
  case "$name" in task-increment) has_mode=true ;; esac
done
cwd="$(pwd -P)"
[[ -z "$project" || "$project" == "$cwd" ]] || fail 2 arguments '项目级 --project 必须等于当前目录'
project="$cwd"
agent_catalog="$(node "$script_root/install-skills/read-agents.mjs")" || fail 2 upstream '无法读取最新官方 Agent 规则；停止挂载'
upstream="$(printf '%s' "$agent_catalog" | "$jq_cli" -c .upstream)"
expected_root="$(printf '%s' "$agent_catalog" | "$jq_cli" -r '.agents[]|select(.name=="codex")|.project')"
[[ "$expected_root" == "$cwd/"* ]] || fail 2 upstream '官方 Codex 项目根无效'
[[ -n "$installed_root" ]] || installed_root="$expected_root"
[[ "${installed_root%/}" == "$expected_root" ]] || fail 2 path 'installed-root 不符合 Codex 当前项目级实际安装位置'
# 依赖只从本次明确选择取值，不从历史已装内容补选。
selected_json="$(printf '%s\n' "${selected[@]}" | "$jq_cli" -Rsc 'split("\n")[:-1]')"
missing="$("$jq_cli" -c --argjson names "$selected_json" '[.skills[]|select(.name as $name|$names|index($name))|.requiresSkills[]|select(. as $name|$names|index($name)|not)]|unique' "$temporary/release.json")"
[[ "$missing" == '[]' ]] || fail 2 dependency "本次选择缺少显式依赖：$missing"
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
  installation=failed; integrity=failed
  fail 1 integrity '本次选择有未通过实际文件核验的技能；不执行挂载'
fi
installation=success
integrity=success
if [[ "$no_mount" == true || "$workflow" == false ]]; then
  hooks=not-run; commands=not-run
  hooks_reason=not-applicable; commands_reason=not-applicable; legacy_reason=not-applicable
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
  hooks=not-run; commands=not-run
  hooks_reason=non-spec-kit; commands_reason=non-spec-kit; legacy_reason=non-spec-kit
  message='本次文件核验通过；非 Spec Kit 项目，原生挂载不适用'
  exit 0
fi
valid_chain "$project/.specify" || { hooks=failed; hooks_reason=project; fail 2 project 'Spec Kit 目录不存在或包含链接'; }
# 读取注册器真实结果，保留旧清退与已发生的逐项写入；缺报告不能冒充成功。
read_hook_report() {
  hook_report="$(tail -n 1 "$temporary/hooks.log" | "$jq_cli" -ce '
    select(type=="object" and (.status=="success" or .status=="failed")
      and (.results|type=="array") and (.retired|type=="array"))' 2>/dev/null)" || return 1
  hook_results="$(printf '%s' "$hook_report" | "$jq_cli" -c '.results')" || return 1
  retired_results="$(printf '%s' "$hook_report" | "$jq_cli" -c '.retired')" || return 1
  if printf '%s' "$retired_results" | "$jq_cli" -e 'any(.[];.status=="failed")' >/dev/null; then
    legacy=failed; legacy_reason=retired-hook-failed
  elif printf '%s' "$retired_results" | "$jq_cli" -e 'length>0 and all(.[];.status=="success" or (.status=="not-run" and .reasonCode=="not-installed"))' >/dev/null; then
    legacy=success; legacy_reason=retired-hook-state-verified
  else
    legacy=not-run; legacy_reason=blocked-by-hook-preflight
  fi
}
# hooks 与指令分别保留阶段事实；任何 hook 故障都不会进入 Increment。
config_root="$script_root/config"
hook_names=()
for name in "${selected[@]}"; do
  case "$name" in artifact-spec-analysis|implementation-preparation|artifact-project-description) hook_names+=(--skill "$name") ;; esac
done
if [[ ${#hook_names[@]} -gt 0 ]]; then
  if bash "$script_root/register-hooks/register-hooks.sh" --project "$project" --skills-dir "$installed_root" --config-root "$config_root" "${hook_names[@]}" > "$temporary/hooks.log" 2>&1; then
    if ! read_hook_report || ! printf '%s' "$hook_report" | "$jq_cli" -e '.status=="success" and all(.results[];.status=="success")' >/dev/null; then
      hooks=failed; hooks_reason=invalid-hook-report; commands_reason=blocked-by-hooks
      cat "$temporary/hooks.log" >&2
      fail 2 official-hooks 'hooks退出0但缺少有效逐项成功报告；未调用Increment'
    fi
    hooks=success
    cat "$temporary/hooks.log" >&2
  else
    hook_status=$?
    read_hook_report || { legacy=not-run; legacy_reason=hook-report-unavailable; }
    hooks=failed; hooks_reason=official-hooks; commands_reason=blocked-by-hooks
    cat "$temporary/hooks.log" >&2
    fail "$hook_status" official-hooks '所选 hook 官方挂载失败；保留安装/完整性成功，未调用 Increment'
  fi
else
  hooks=not-run; hooks_reason=not-applicable
fi
if [[ "$has_mode" == true ]]; then
  if bash "$script_root/register-commands/register-commands.sh" --project "$project" --skills-dir "$installed_root" > "$temporary/commands.log" 2>&1; then
    command_result="$(tail -n 1 "$temporary/commands.log" | "$jq_cli" -ce 'select(type=="object")' 2>/dev/null)" || command_result='null'
    commands=success
    cat "$temporary/commands.log" >&2
  else
    command_status=$?
    command_result="$(tail -n 1 "$temporary/commands.log" | "$jq_cli" -ce 'select(type=="object")' 2>/dev/null)" || command_result='null'
    commands=failed; commands_reason=official-commands
    cat "$temporary/commands.log" >&2
    fail "$command_status" official-commands 'Increment 官方挂载失败；保留已成功的安装及 hooks 事实'
  fi
else
  commands=not-run; commands_reason=not-applicable
fi
message='同版已装内容与运行材料核验成功，所选 hooks 及 Increment 已按适用范围实际挂载'
