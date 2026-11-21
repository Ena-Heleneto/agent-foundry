#!/usr/bin/env bash
# Linux 最小下载安装骨架：直接调用本平台脚本完成实际安装。
set -euo pipefail
umask 077

# 官方预检独立于原安装骨架，整个分支不创建目录、工具副本或暂存文件。
official_preflight() (
  set -euo pipefail
  local source='' local_source='' requested_version='' requested_agent='' category='' mode='' scope=project project_arg=''
  local check=false official=false jq='' manifest='' agents='' agent_record='' target_root='' projection='' source_root='' selected_json='[]'
  local requested=() selected=() official_args=() value name item row path relative expected_hash expected_bytes actual_hash count expected_count component current probe tracked
  preflight_fail() {
    printf '%s\n' "$2" >&2
    if [[ -n "$jq" && -x "$jq" ]]; then
      "$jq" -cn --arg reason "$1" --arg message "$2" '{schemaVersion:1,overall:"failed",reasonCode:$reason,message:$message,skills:[]}'
    else
      printf '{"schemaVersion":1,"overall":"failed","reasonCode":"prerequisite","skills":[]}\n'
    fi
    exit 2
  }
  jq="${FOUNDRY_JQ:-$(command -v jq || true)}"
  [[ -n "$jq" && -x "$jq" ]] || preflight_fail prerequisite '只读预检需要已准备的 jq；请安装 jq 或用 FOUNDRY_JQ 指定已有可执行文件'
  "$jq" --version >/dev/null 2>&1 || preflight_fail prerequisite '已有 jq 无法执行'
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --check) [[ "$check" == false ]] || preflight_fail arguments '重复 --check'; check=true; shift ;;
      --official) [[ "$official" == false ]] || preflight_fail arguments '重复 --official'; official=true; shift ;;
      --global) [[ "$scope" == project ]] || preflight_fail arguments '重复 --global'; scope=global; shift ;;
      --all) [[ -z "$mode" ]] || preflight_fail selection '选择不能混用，只能使用 all、category、skill 之一'; mode=all; shift ;;
      --source|--source-dir|--version|--agent|--category|--skill|--project)
        [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || preflight_fail arguments "参数缺值或名称为空：$1"
        value="$2"
        case "$1" in
          --source) [[ -z "$source" ]] || preflight_fail arguments '重复 --source'; source="${value%/}" ;;
          --source-dir) [[ -z "$local_source" ]] || preflight_fail arguments '重复 --source-dir'; local_source="$value" ;;
          --version) [[ -z "$requested_version" ]] || preflight_fail arguments '重复 --version'; requested_version="$value" ;;
          --agent) [[ -z "$requested_agent" ]] || preflight_fail arguments '每次只能选择一个 agent'; requested_agent="$value" ;;
          --project) [[ -z "$project_arg" ]] || preflight_fail arguments '重复 --project'; project_arg="$value" ;;
          --category) [[ -z "$mode" ]] || preflight_fail selection '选择不能混用，只能使用 all、category、skill 之一'; mode=category; category="$value" ;;
          --skill) [[ -z "$mode" || "$mode" == skill ]] || preflight_fail selection '选择不能混用，只能使用 all、category、skill 之一'; mode=skill; requested+=("$value") ;;
        esac
        shift 2 ;;
      *) preflight_fail arguments "官方预检不支持参数：$1" ;;
    esac
  done
  [[ "$check" == true && "$official" == true ]] || preflight_fail arguments '--check 与 --official 必须同时提供'
  [[ -n "$requested_version" ]] || preflight_fail arguments '必须提供 --version 精确版本'
  [[ "$requested_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]] || preflight_fail arguments '版本格式无效'
  [[ -n "$source" && -z "$local_source" || -z "$source" && -n "$local_source" ]] || preflight_fail arguments '--source 与 --source-dir 必须且只能提供一个'
  [[ -n "$mode" ]] || preflight_fail selection '必须选择 --all、--category 或 --skill'
  [[ -n "$requested_agent" ]] || preflight_fail arguments '必须提供一个 --agent'
  [[ "$category" != eval ]] || preflight_fail selection '内部 eval 分类不可选择'
  if [[ "$mode" == category ]]; then
    [[ "$category" == coding || "$category" == frontend || "$category" == workflow ]] || preflight_fail selection "未知公开分类：$category"
  fi
  for name in "${requested[@]}"; do
    [[ "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || preflight_fail selection "技能名称无效：$name"
  done
  for item in sha256sum wc find git; do
    command -v "$item" >/dev/null 2>&1 || preflight_fail prerequisite "缺少只读预检工具：$item"
  done
  # 对每一层做 lstat 等价检查，链接即使最终指向普通目录也拒绝。
  preflight_chain() {
    local current='/' component components=()
    [[ "$1" == /* && "$1" != *[$'\t\r\n']* ]] || preflight_fail arguments "必须使用无控制字符的绝对路径：$1"
    IFS='/' read -r -a components <<< "$1"
    for component in "${components[@]}"; do
      [[ -n "$component" ]] || continue
      [[ "$component" != . && "$component" != .. ]] || preflight_fail arguments "路径包含越界分量：$1"
      current="${current%/}/$component"
      [[ ! -L "$current" ]] || preflight_fail conflict "目录链包含链接：$current"
      [[ ! -e "$current" || -d "$current" ]] || preflight_fail conflict "目录链包含非目录：$current"
    done
  }
  if [[ -n "$source" ]]; then
    [[ "$source" =~ ^https://[^/@?#]+/([^?#]*/)?[0-9a-fA-F]{40}(/[^?#]*)?$ && "$source" != *[$'\t\r\n ']* ]] || preflight_fail arguments '来源必须是携带完整提交的 HTTPS 根 URL'
    command -v curl >/dev/null 2>&1 || preflight_fail prerequisite '远端只读预检需要已准备的 curl'
    [[ "${FOUNDRY_DOWNLOAD_TIMEOUT:-30}" =~ ^[1-9][0-9]*$ ]] || preflight_fail arguments 'FOUNDRY_DOWNLOAD_TIMEOUT 必须为正整数'
    source_root="$source"
  else
    preflight_chain "$local_source"
    [[ -d "$local_source" ]] || preflight_fail arguments '本地来源目录不存在'
    source_root="$(cd -- "$local_source" && pwd -P)"
  fi
  # 远端内容直接流入校验或内存，不落盘；路径已经由清单安全约束验证。
  preflight_read() {
    if [[ -n "$source" ]]; then
      local encoded
      encoded="$("$jq" -nr --arg value "$1" '$value|split("/")|map(@uri)|join("/")')"
      curl --disable --fail --silent --show-error --location --proto '=https' --proto-redir '=https' \
        --connect-timeout "${FOUNDRY_DOWNLOAD_TIMEOUT:-30}" --max-time "${FOUNDRY_DOWNLOAD_TIMEOUT:-30}" -- "$source/$encoded"
    else
      local parent="${1%/*}"
      [[ "$parent" == "$1" ]] || preflight_chain "$source_root/$parent"
      [[ -f "$source_root/$1" && ! -L "$source_root/$1" ]] || return 1
      cat -- "$source_root/$1"
    fi
  }
  manifest="$(preflight_read release.json)" || preflight_fail source '无法读取来源 release.json'
  printf '%s' "$manifest" | "$jq" -e --arg version "$requested_version" '
    def safe: type=="string" and length>0 and (test("[\\\\\u0000-\u001f\u007f]")|not) and (startswith("/")|not)
      and (split("/")|all(.!="" and .!="." and .!=".." and (contains(":")|not)));
    def file: (.path|safe) and (.bytes|type=="number" and .>=0 and floor==.) and (.sha256|type=="string" and test("^[a-f0-9]{64}$"));
    def strings: type=="array" and all(.[];type=="string" and test("[^[:space:]]")) and length==(unique|length);
    .schemaVersion==1 and .version==$version and (.sourceRevision|type=="string" and test("^[a-fA-F0-9]{40}$"))
    and (.development==null or (.development|type=="boolean"))
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
    and (.projections|type=="object" and (keys|sort)==["eve-frontmatter-v1","identity"])
    and (. as $r|all(["identity","eve-frontmatter-v1"][];. as $id|
      ($r.projections[$id]|type=="object" and (keys|sort)==([$r.skills[].name]|sort))
      and all($r.skills[];. as $s|($s.sourceFiles|map(.[($s.directory|length)+1:])|sort) as $paths|
        ($s.installedFilesByProjection|type=="object" and (keys|sort)==["eve-frontmatter-v1","identity"])
        and ($s.installedFilesByProjection[$id]|strings and sort==$paths)
        and ($r.projections[$id][$s.name]|type=="array" and length==($paths|length) and ([.[].path]|sort)==$paths
          and all(.[];. as $f|file and (.sourcePath|safe)
            and any($r.files[];.path==$f.sourcePath and .bytes==$f.bytes and .sha256==$f.sha256)
            and ($id!="identity" or .sourcePath==($s.directory+"/"+.path))
            and ((.path|split("/")|last|ascii_downcase)=="skill.md" or any($r.files[];.path==($s.directory+"/"+$f.path) and .bytes==$f.bytes and .sha256==$f.sha256)))))))
    and (. as $r|.adapters|type=="array" and length>0 and any(.[];.path=="script/install-skills/read-agents.mjs")
      and all(.[];. as $a|file and any($r.files[];.path==$a.path and .bytes==$a.bytes and .sha256==$a.sha256)))
  ' >/dev/null || preflight_fail manifest '版本不匹配或 release.json 清单结构、路径无效'
  preflight_verify_source() {
    local file="$1" hash="$2" bytes="$3" actual actual_bytes
    actual="$(preflight_read "$file" | sha256sum)" || preflight_fail source "来源文件无法读取：$file"
    actual_bytes="$(preflight_read "$file" | wc -c)" || preflight_fail source "来源文件无法读取：$file"
    [[ "$actual" == "$hash "* && "$actual_bytes" -eq "$bytes" ]] || preflight_fail integrity "来源文件摘要或长度不匹配：$file"
  }
  if [[ "$mode" == skill ]]; then
    for name in "${requested[@]}"; do
      printf '%s' "$manifest" | "$jq" -e --arg name "$name" 'any(.skills[];.name==$name)' >/dev/null || preflight_fail selection "未知或内部技能不可选择：$name"
      [[ " ${selected[*]:-} " != *" $name "* ]] || continue
      selected+=("$name")
    done
  else
    while IFS= read -r name; do selected+=("$name"); done < <(printf '%s' "$manifest" | "$jq" -r --arg mode "$mode" --arg category "$category" '.skills[]|select($mode=="all" or .category==$category)|.name')
  fi
  [[ ${#selected[@]} -gt 0 ]] || preflight_fail selection "公开分类为空：$category"
  selected_json="$(printf '%s\n' "${selected[@]}" | "$jq" -Rsc 'split("\n")[:-1]')"
  row="$(printf '%s' "$manifest" | "$jq" -r --argjson names "$selected_json" '.skills[]|select(.name as $n|$names|index($n))|.requiresSkills[]|select(. as $n|$names|index($n)|not)')"
  [[ -z "$row" ]] || preflight_fail dependency "选择缺少依赖，请显式补选：$row"
  command -v node >/dev/null 2>&1 || preflight_fail prerequisite '在线 Agent 查询需要 Node'
  command -v tar >/dev/null 2>&1 || preflight_fail prerequisite '在线 Agent 查询需要 tar'
  local reader_directory resolved_version
  reader_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
  agents="$(node "$reader_directory/read-agents.mjs")" || preflight_fail upstream '无法获取官方最新 Agent 规则，目标未写入'
  agent_record="$(printf '%s' "$agents" | "$jq" -c --arg name "$requested_agent" '.agents[]|select(.name==$name)')"
  [[ -n "$agent_record" ]] || preflight_fail arguments "未知 agent：$requested_agent"
  resolved_version="$(printf '%s' "$agents" | "$jq" -r .upstream.version)"
  projection="$(printf '%s' "$agent_record" | "$jq" -r .projection)"
  [[ "$projection" == identity || "$projection" == eve-frontmatter-v1 ]] || preflight_fail manifest '未知安装投影'
  current="$(pwd -P)"
  [[ -z "$project_arg" || "$project_arg" == /* ]] || preflight_fail arguments '--project 必须使用绝对路径'
  if [[ "$scope" == project ]]; then
    [[ -z "$project_arg" || "$project_arg" == "$current" ]] || preflight_fail arguments '项目级目标始终为 cwd，--project 必须等于 cwd'
    target_root="$(printf '%s' "$agent_record" | "$jq" -r .project)"
  else
    printf '%s' "$agent_record" | "$jq" -e '.global!=null' >/dev/null || preflight_fail arguments "agent 不支持 global scope：$requested_agent"
    target_root="$(printf '%s' "$agent_record" | "$jq" -r .global)"
  fi
  preflight_chain "$target_root"
  # 清除 Git 的路径重定向环境；只读索引，禁止生成可选锁。
  preflight_git() (
    unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_COMMON_DIR GIT_NAMESPACE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_SHALLOW_FILE GIT_CONFIG_COUNT GIT_CONFIG_PARAMETERS
    git --no-optional-locks --literal-pathspecs -C "$1" "${@:2}"
  )
  local satisfied=true states='[]' target files repository ancestor
  for name in "${selected[@]}"; do
    target="$target_root/$name"
    while IFS=$'\t' read -r path expected_hash expected_bytes; do
      preflight_verify_source "$path" "$expected_hash" "$expected_bytes"
    done < <(printf '%s' "$manifest" | "$jq" -r --arg name "$name" '. as $r|.skills[]|select(.name==$name)|.sourceFiles[] as $p|$r.files[]|select(.path==$p)|[.path,.sha256,.bytes]|@tsv')
    if [[ -z "$source" ]]; then
      value="$(printf '%s' "$manifest" | "$jq" -r --arg name "$name" '.skills[]|select(.name==$name)|.directory')"
      preflight_chain "$source_root/$value"
      [[ -d "$source_root/$value" && -z "$(find "$source_root/$value" -mindepth 1 ! -type d ! -type f -print)" ]] || preflight_fail source "来源技能缺失或包含链接：$name"
      count="$(find "$source_root/$value" -type f -print | wc -l)"
      expected_count="$(printf '%s' "$manifest" | "$jq" --arg name "$name" '.skills[]|select(.name==$name)|.sourceFiles|length')"
      [[ "$count" -eq "$expected_count" ]] || preflight_fail source "来源实际文件全集与清单不一致：$name"
    fi
    files="$(printf '%s' "$manifest" | "$jq" -c --arg name "$name" --arg projection "$projection" '
      . as $r|.skills[]|select(.name==$name)|. as $s|
      if $projection=="identity" then [.sourceFiles[] as $p|$r.files[]|select(.path==$p)|{path:.path[($s.directory|length)+1:],sourcePath:.path,bytes,sha256}]
      else $r.projections[$projection][$name] end')"
    printf '%s' "$files" | "$jq" -e '
      def safe: type=="string" and length>0 and (test("[\\\\\u0000-\u001f\u007f]")|not) and (startswith("/")|not) and (split("/")|all(.!="" and .!="." and .!=".." and (contains(":")|not)));
      type=="array" and length>0 and ([.[].path|ascii_downcase]|length==(unique|length)) and all(.[];(.path|safe) and (.sourcePath|safe) and (.bytes|type=="number" and .>=0 and floor==.) and (.sha256|test("^[a-f0-9]{64}$")))
    ' >/dev/null || preflight_fail manifest "安装投影无效：$name"
    while IFS=$'\t' read -r path expected_hash expected_bytes; do
      printf '%s' "$manifest" | "$jq" -e --arg path "$path" --arg hash "$expected_hash" --argjson bytes "$expected_bytes" 'any(.files[];.path==$path and .sha256==$hash and .bytes==$bytes)' >/dev/null || preflight_fail manifest "投影来源与主清单不一致：$path"
      [[ "$projection" == identity ]] || preflight_verify_source "$path" "$expected_hash" "$expected_bytes"
    done < <(printf '%s' "$files" | "$jq" -r '.[]|[.sourcePath,.sha256,.bytes]|@tsv')
    preflight_chain "$target"
    probe="$target_root"
    while [[ ! -d "$probe" ]]; do probe="${probe%/*}"; [[ -n "$probe" ]] || probe=/; done
    if preflight_git "$probe" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      tracked="$(preflight_git "$probe" ls-files -- "$target")" || preflight_fail conflict '无法检查 Git 索引'
      [[ -z "$tracked" ]] || preflight_fail conflict "目标含 Git 已跟踪路径：$tracked"
      repository="$(preflight_git "$probe" rev-parse --show-toplevel)" || preflight_fail conflict '无法确定 Git 工作树'
      ancestor="$target_root"
      while [[ "$ancestor" == "$repository/"* ]]; do
        tracked="$(preflight_git "$repository" ls-files -- "$ancestor")" || preflight_fail conflict '无法检查祖先 Git 索引'
        [[ "$tracked" != "${ancestor#"$repository"/}" ]] || preflight_fail conflict "目标祖先含 Git 已跟踪路径：$tracked"
        ancestor="${ancestor%/*}"
      done
    else
      while [[ "$probe" != / ]]; do
        [[ ":${GIT_CEILING_DIRECTORIES:-}:" != *":$probe:"* ]] || break
        [[ ! -e "$probe/.git" && ! -L "$probe/.git" ]] || preflight_fail conflict "检测到 Git 项目但无法读取索引：$probe"
        probe="${probe%/*}"; [[ -n "$probe" ]] || probe=/
      done
    fi
    if [[ -e "$target" ]]; then
      [[ -z "$(find "$target" -mindepth 1 ! -type d ! -type f -print)" ]] || preflight_fail conflict "目标包含链接或特殊文件：$name"
      [[ -z "$(find "$target" -type d -empty -print)" ]] || preflight_fail conflict "目标包含清单外空目录：$name"
      count="$(find "$target" -type f -print | wc -l)"
      expected_count="$(printf '%s' "$files" | "$jq" length)"
      [[ "$count" -eq "$expected_count" ]] || preflight_fail conflict "目标文件集合与版本清单不一致：$name"
      while IFS=$'\t' read -r relative expected_hash expected_bytes; do
        [[ -f "$target/$relative" && ! -L "$target/$relative" ]] || preflight_fail conflict "目标缺少普通文件：$name/$relative"
        actual_hash="$(sha256sum -- "$target/$relative")"
        [[ "$actual_hash" == "$expected_hash "* && "$(wc -c < "$target/$relative")" -eq "$expected_bytes" ]] || preflight_fail conflict "目标内容与版本清单不一致：$name/$relative"
      done < <(printf '%s' "$files" | "$jq" -r '.[]|[.path,.sha256,.bytes]|@tsv')
      value=satisfied
    else
      satisfied=false; value=absent
    fi
    states="$("$jq" -cn --argjson states "$states" --arg name "$name" --arg status "$value" --arg path "$target" '$states+[{name:$name,status:$status,path:$path}]')"
  done
  official_args=("skills@$resolved_version" add)
  if [[ "$mode" == category ]]; then
    official_args+=("$source_root/skills/$category" --skill "${selected[@]}")
  elif [[ "$mode" == all ]]; then
    official_args+=("$source_root" --skill "${selected[@]}")
  elif [[ ${#selected[@]} -eq 1 ]]; then
    value="$(printf '%s' "$manifest" | "$jq" -r --arg name "${selected[0]}" '.skills[]|select(.name==$name)|.directory')"
    official_args+=("$source_root/$value" --skill "${selected[0]}")
  else
    official_args+=("$source_root" --skill "${selected[@]}")
  fi
  official_args+=(--agent "$requested_agent" --copy)
  [[ "$scope" != global ]] || official_args+=(--global)
  value="$(printf '%s\n' "${official_args[@]}" | "$jq" -Rsc 'split("\n")[:-1]')"
  "$jq" -cn --argjson upstream "$(printf '%s' "$agents" | "$jq" -c .upstream)" --arg version "$requested_version" --arg source "$source_root" --arg mode "$mode" --arg category "$category" --argjson names "$selected_json" \
    --arg agent "$requested_agent" --arg scope "$scope" --arg path "$target_root" --arg projection "$projection" --argjson args "$value" --argjson satisfied "$satisfied" --argjson skills "$states" '
    {schemaVersion:1,upstream:$upstream,overall:"success",operation:"official-check",mode:"official-preflight",version:$version,source:$source,
      selection:{mode:$mode,category:(if $category=="" then null else $category end),names:$names},target:{agent:$agent,scope:$scope,path:$path,projection:$projection},skills:$skills,
      checkedSkills:$skills,stages:{installation:{status:"not-run"},preflight:{status:"success"}},
      alreadySatisfied:$satisfied,recommendation:(if $satisfied then "skip" else "install" end),official:{command:"npx",args:$args}}'
)

for preflight_argument in "$@"; do
  if [[ "$preflight_argument" == --check || "$preflight_argument" == --official ]]; then
    official_preflight "$@"
    exit "$?"
  fi
done

release_source=''
source_dir=''
version=''
agent=''
no_mount=false
names=()
temporary=''
stage=''
stage_identity=''
lock_owned=false
lock_identity=''
root_identity=''
jq_cli=''
reason_code='runtime'
current_skill=''
report_ready=false

fail() {
  reason_code="$2"
  printf '%s\n' "$3" >&2
  exit "$1"
}

# EXIT 始终保留真实退出码；清理只限本进程可证明拥有的暂存和锁。
finish() {
  local status=$?
  trap - EXIT INT TERM
  if [[ "$report_ready" == true ]]; then
    if [[ $status -ne 0 && -n "$current_skill" ]]; then
      "$jq_cli" -cn --arg name "$current_skill" '{name:$name,status:"failed"}' >> "$temporary/results"
    fi
    "$jq_cli" -sn --argjson agentCatalog "${agent_catalog:-null}" --slurpfile skills "$temporary/results" --arg reason "$reason_code" --argjson status "$status" '
      {schemaVersion:1,upstream:$agentCatalog.upstream,overall:(if $status==0 then "success" elif any($skills[];.status=="installed" or .status=="reused") then "partial" else "failed" end),
      skills:$skills,reasonCode:(if $status==0 then null else $reason end),
      stages:{installation:{status:(if $status==0 then "success" else "failed" end)}}}'
  elif [[ $status -ne 0 ]]; then
    printf '{"schemaVersion":1,"overall":"failed","skills":[],"reasonCode":"%s"}\n' "$reason_code"
  fi
  if [[ -n "$root_identity" && ! -L "$install_root" && "$(stat -c '%d:%i' -- "$install_root" 2>/dev/null || true)" == "$root_identity" ]]; then
    if [[ -n "$stage" && ! -L "$stage" && "$(stat -c '%d:%i' -- "$stage" 2>/dev/null || true)" == "$stage_identity" ]]; then
      rm -rf -- "$stage"
    fi
    if [[ "$lock_owned" == true && ! -L "$state/lock" && "$(stat -c '%d:%i' -- "$state/lock" 2>/dev/null || true)" == "$lock_identity" ]]; then
      rmdir -- "$state/lock" || true
    fi
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
      printf '%s\n' '用法：install-skills.sh (--source <固定提交HTTPS根URL> | --source-dir <目录>) --version <版本> --agent codex --skill <名称> [--skill <名称>] [--no-mount]' >&2
      exit 0 ;;
    --no-mount) no_mount=true; shift ;;
    --source|--source-dir|--version|--agent|--skill)
      [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || fail 2 arguments "参数缺值：$1"
      case "$1" in
        --source) [[ -z "$release_source" ]] || fail 2 arguments '重复 --source'; release_source="${2%/}" ;;
        --source-dir) [[ -z "$source_dir" ]] || fail 2 arguments '重复 --source-dir'; source_dir="$2" ;;
        --version) [[ -z "$version" ]] || fail 2 arguments '重复 --version'; version="$2" ;;
        --agent) [[ -z "$agent" ]] || fail 2 arguments '重复 --agent'; agent="$2" ;;
        --skill) names+=("$2") ;;
      esac
      shift 2 ;;
    *) fail 2 arguments "未知或本 MVU 尚未支持的参数：$1" ;;
  esac
done
[[ -n "$version" && "$agent" == codex && ${#names[@]} -gt 0 ]] || fail 2 arguments '必须提供版本、--agent codex 和显式 --skill'
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$ ]] || fail 2 arguments '版本格式无效'
if [[ -n "$release_source" && -n "$source_dir" || -z "$release_source" && -z "$source_dir" ]]; then
  fail 2 arguments '--source 与 --source-dir 必须且只能提供一个'
fi
if [[ -n "$release_source" ]]; then
  [[ "$release_source" =~ ^https://[^/@?#]+/([^?#]*/)?[0-9a-fA-F]{40}(/[^?#]*)?$ && "$release_source" != *[$'\t\r\n ']* ]] || fail 2 arguments '来源必须是携带完整提交的 HTTPS 根 URL'
fi
for name in "${names[@]}"; do
  [[ "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || fail 2 arguments "技能名无效：$name"
done
[[ "$(uname -s)" == Linux ]] || fail 2 platform '本 MVU 当前仅实现 Linux'

# 不在目标项目安装依赖；缺少基础工具时在任何目标写入之前失败。
for tool in node tar curl sha256sum git stat find sort cmp wc mktemp mkdir mv ln cp rm rmdir chmod uname dirname; do
  command -v "$tool" >/dev/null 2>&1 || fail 2 prerequisite "缺少前置工具：$tool"
done
download_timeout="${FOUNDRY_DOWNLOAD_TIMEOUT:-30}"
[[ "$download_timeout" =~ ^[1-9][0-9]*$ ]] || fail 2 arguments 'FOUNDRY_DOWNLOAD_TIMEOUT 必须为正整数秒数'
temporary="$(mktemp -d "${TMPDIR:-/tmp}/foundry-install-tools-XXXXXXXX")"
case "$(uname -m)" in
  x86_64) jq_asset=jq-linux-amd64; jq_digest=020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d ;;
  *) fail 2 platform '本 MVU 当前仅验证 Linux x86_64' ;;
esac

download() {
  curl --disable --fail --silent --show-error --location --proto '=https' --proto-redir '=https' \
    --connect-timeout "$download_timeout" --max-time "$download_timeout" --output "$2" -- "$1"
}

# 可显式使用事先准备的同版官方二进制，但始终先校验可信摘要。
if [[ -n "${FOUNDRY_JQ:-}" ]]; then
  [[ -f "$FOUNDRY_JQ" && ! -L "$FOUNDRY_JQ" ]] || fail 2 prerequisite 'FOUNDRY_JQ 必须指向普通的 jq 1.8.1 官方二进制'
  cp -- "$FOUNDRY_JQ" "$temporary/jq" || fail 1 prerequisite '无法准备 jq'
else
  download "https://github.com/jqlang/jq/releases/download/jq-1.8.1/$jq_asset" "$temporary/jq" || fail 1 prerequisite 'jq 准备失败，尚未写入目标项目'
fi
[[ "$(sha256sum -- "$temporary/jq")" == "$jq_digest "* ]] || fail 1 prerequisite 'jq 官方摘要不匹配，拒绝执行'
chmod u+x "$temporary/jq"
jq_cli="$temporary/jq"
"$jq_cli" --version >/dev/null || fail 1 prerequisite 'jq 无法执行'
: > "$temporary/results"
report_ready=true

# 不接受路径链上的符号链接，避免读取/写入逃逸到其他目录。
check_chain() {
  local current='/' component
  local components=()
  IFS='/' read -r -a components <<< "$1"
  for component in "${components[@]}"; do
    [[ -n "$component" ]] || continue
    current="${current%/}/$component"
    [[ ! -L "$current" ]] || fail 1 conflict "目录链包含符号链接：$current"
    [[ ! -e "$current" || -d "$current" ]] || fail 1 conflict "目录链包含非目录：$current"
  done
}

if [[ -n "$source_dir" ]]; then
  [[ "$source_dir" == /* && "$source_dir" != *[$'\t\r\n']* ]] || fail 2 arguments '本地来源须为绝对目录'
  check_chain "$source_dir"
  [[ -d "$source_dir" ]] || fail 2 arguments '本地来源目录不存在'
  source_dir="$(cd -- "$source_dir" && pwd -P)"
fi

get_file() {
  if [[ -n "$release_source" ]]; then
    local encoded
    encoded="$("$jq_cli" -nr --arg value "$1" '$value|split("/")|map(@uri)|join("/")')"
    download "$release_source/$encoded" "$2" || fail 1 download "下载失败：$1"
  else
    local parent="${1%/*}"
    if [[ "$parent" != "$1" ]]; then
      check_chain "$source_dir/$parent"
    fi
    [[ -f "$source_dir/$1" && ! -L "$source_dir/$1" ]] || fail 1 download "本地文件缺失或是链接：$1"
    cp -- "$source_dir/$1" "$2" || fail 1 download "无法读取：$1"
  fi
}
get_file release.json "$temporary/release.json"

# 先验证清单结构和路径；不将远端字符串作为 shell 代码执行。
"$jq_cli" -e --arg version "$version" '
  def safe: type=="string" and length>0 and (test("[\\\\\u0000-\u001f\u007f]")|not) and
    (startswith("/")|not) and (split("/")|all(.!="" and .!="." and .!=".." and (contains(":")|not)));
  .schemaVersion==1 and .version==$version and (.sourceRevision|type=="string" and test("^[a-fA-F0-9]{40}$")) and
  (.files|type=="array" and length>0) and (.skills|type=="array" and length>0) and
  all(.files[];(.path|safe) and (.bytes|type=="number" and .>=0 and floor==.) and (.sha256|type=="string" and test("^[a-f0-9]{64}$"))) and
  ([.files[].path|ascii_downcase]|length==(unique|length)) and
  ([.skills[].name]|length==(unique|length)) and
  all(.skills[];(.name|type=="string" and test("^[a-z0-9]+(-[a-z0-9]+)*$")) and
    (.category=="coding" or .category=="frontend" or .category=="workflow") and
    (.directory==("skills/"+.category+"/"+.name)) and (.requiresSkills==[]) and
    (.sourceFiles|type=="array" and length>0)) and
  (. as $release|all(.skills[];. as $skill|
    (.sourceFiles|length==(unique|length)) and
    (.sourceFiles|index($skill.directory+"/SKILL.md")!=null) and
    all(.sourceFiles[];. as $file|safe and startswith($skill.directory+"/") and
      ([$release.files[]|select(.path==$file)]|length==1))))
' "$temporary/release.json" >/dev/null || fail 2 manifest '版本或清单结构、路径不合法，目标未写入'
catalog_digest="$(sha256sum -- "$temporary/release.json")"
catalog_digest="${catalog_digest%% *}"
request_source="${release_source:-$source_dir}"
project="$(pwd -P)"
[[ "$project" != *[$'\t\r\n']* ]] || fail 2 arguments '项目路径含不支持的控制字符'
# 正式安装与只读预检共用在线数据读取器；规则失败时不创建目标根。
agent_catalog="$(node "$(dirname -- "${BASH_SOURCE[0]}")/read-agents.mjs")" || fail 2 upstream '无法获取官方最新 Agent 规则，目标未写入'
install_root="$(printf '%s' "$agent_catalog" | "$jq_cli" -r --arg agent "$agent" '.agents[]|select(.name==$agent)|.project')"
[[ -n "$install_root" && "$install_root" == "$project/"* ]] || fail 2 upstream '官方项目安装路径无效'
state="$install_root/.foundry-distribution"

# 去重后仍按用户顺序执行；未知选择在创建目标根之前整体拒绝。
selected=()
for name in "${names[@]}"; do
  if [[ " ${selected[*]:-} " == *" $name "* ]]; then
    continue
  fi
  "$jq_cli" -e --arg name "$name" '.skills[]|select(.name==$name)' "$temporary/release.json" > "$temporary/skill-$name.json" || fail 2 selection "未知技能：$name"
  if [[ "$no_mount" == false ]] && "$jq_cli" -e '.category=="workflow"' "$temporary/skill-$name.json" >/dev/null; then
    fail 2 unsupported '本 MVU 未接通 workflow 挂载，请显式 --no-mount；公共挂载由 T005/T006 实施'
  fi
  selected+=("$name")
done

# 保护检查只读取消费项目自身的仓库与默认索引，不能被继承环境改指到别处。
git_read() (
  unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_COMMON_DIR GIT_NAMESPACE
  unset GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_SHALLOW_FILE
  unset GIT_CONFIG_COUNT GIT_CONFIG_PARAMETERS
  git --no-optional-locks -C "$project" "$@"
)

check_git() {
  local tracked repository probe target_relative
  if repository="$(git_read rev-parse --is-inside-work-tree 2>/dev/null)"; then
    [[ "$repository" == true ]] || fail 1 git '当前目录不在 Git 工作树中，无法可靠检查跟踪冲突'
    # 同时检查祖先的普通跟踪文件，不将其他已跟踪技能扩大为冲突。
    target_relative="${install_root#"$project"/}/$1"
    git_read ls-files -z -- > "$temporary/git-tracked" || fail 1 git 'Git 索引检查失败，拒绝写入'
    while IFS= read -r -d '' tracked; do
      if [[ "$tracked" == "$target_relative" || "$tracked" == "$target_relative/"* || "$target_relative" == "$tracked/"* ]]; then
        fail 1 tracked "目标或祖先含 Git 已跟踪路径：$tracked"
      fi
    done < "$temporary/git-tracked"
  else
    probe="$project"
    while [[ "$probe" != / ]]; do
      # 与 Git 自身的发现边界一致，不跨越调用者显式设置的仓库搜索上界。
      [[ ":${GIT_CEILING_DIRECTORIES:-}:" != *":$probe:"* ]] || break
      [[ ! -e "$probe/.git" && ! -L "$probe/.git" ]] || fail 1 git '检测到 Git 项目但无法读取仓库，拒绝写入'
      probe="${probe%/*}"
      [[ -n "$probe" ]] || probe=/
    done
  fi
}

check_chain "$install_root"
check_chain "$state/receipts"
check_chain "$state/staging"
check_chain "$state/lock"
check_git .foundry-distribution
for name in "${selected[@]}"; do
  check_git "$name"
done
mkdir -p -- "$state/receipts" "$state/staging" || fail 1 permission '目标目录不可写'
root_identity="$(stat -c '%d:%i' -- "$install_root")"
mkdir -- "$state/lock" 2>/dev/null || fail 1 locked '安装锁已存在；请核对在运行的进程或人工处理失效锁'
lock_owned=true
lock_identity="$(stat -c '%d:%i' -- "$state/lock")"
stage="$(mktemp -d "$state/staging/run-XXXXXXXX")"
stage_identity="$(stat -c '%d:%i' -- "$stage")"

verify_tree() {
  local target="$1" relative expected_hash expected_bytes actual_hash count
  check_chain "$target"
  [[ -d "$target" ]] || fail 1 conflict '目标技能不是普通目录'
  [[ -z "$(find "$target" -mindepth 1 ! -type d ! -type f -print)" ]] || fail 1 conflict '目标包含链接或特殊文件'
  [[ -z "$(find "$target" -type d -empty -print)" ]] || fail 1 conflict '目标包含清单外的空目录'
  count="$(find "$target" -type f -printf '.\n' | wc -l)"
  [[ "$count" -eq "$(wc -l < "$stage/files.tsv")" ]] || fail 1 conflict '目标文件集合与版本清单不一致'
  while IFS=$'\t' read -r relative expected_hash expected_bytes; do
    [[ -f "$target/$relative" && ! -L "$target/$relative" ]] || fail 1 conflict "目标缺少普通文件：$relative"
    actual_hash="$(sha256sum -- "$target/$relative")"
    [[ "$actual_hash" == "$expected_hash "* && "$(wc -c < "$target/$relative")" -eq "$expected_bytes" ]] || fail 1 conflict "目标内容与版本清单不一致：$relative"
  done < "$stage/files.tsv"
}

for name in "${selected[@]}"; do
  current_skill="$name"
  target="$install_root/$name"
  receipt="$state/receipts/$name.json"
  "$jq_cli" -r --arg name "$name" '
    . as $release|.skills[]|select(.name==$name)|. as $skill|.sourceFiles[]|. as $file|
    $release.files[]|select(.path==$file)|[.path[($skill.directory|length)+1:],.sha256,.bytes]|@tsv
  ' "$temporary/release.json" > "$stage/files.tsv"
  "$jq_cli" -cn --arg source "$request_source" --arg version "$version" --arg catalogDigest "$catalog_digest" --arg target "$target" \
    --rawfile files "$stage/files.tsv" '{source:$source,version:$version,catalogDigest:$catalogDigest,agent:"codex",scope:"project",path:$target,files:$files}' > "$stage/receipt.json"
  check_chain "$install_root"
  [[ "$(stat -c '%d:%i' -- "$install_root")" == "$root_identity" ]] || fail 1 conflict '目标根目录已变化'
  check_git "$name"
  if [[ -e "$target" || -L "$target" ]]; then
    [[ -f "$receipt" && ! -L "$receipt" ]] || fail 1 conflict "同名目标无本包归属收据：$name"
    cmp -s -- "$stage/receipt.json" "$receipt" || fail 1 conflict "版本或归属收据不一致：$name"
    verify_tree "$target"
    "$jq_cli" -cn --arg name "$name" '{name:$name,status:"reused"}' >> "$temporary/results"
    current_skill=''
    continue
  fi
  [[ ! -e "$receipt" && ! -L "$receipt" ]] || fail 1 conflict "目标缺失但有残留收据：$name"
  mkdir -- "$stage/$name"
  while IFS=$'\t' read -r relative expected_hash expected_bytes; do
    mkdir -p -- "$stage/$name/$(dirname -- "$relative")"
    get_file "skills/$("$jq_cli" -r .category "$temporary/skill-$name.json")/$name/$relative" "$stage/$name/$relative"
    actual_hash="$(sha256sum -- "$stage/$name/$relative")"
    [[ "$actual_hash" == "$expected_hash "* && "$(wc -c < "$stage/$name/$relative")" -eq "$expected_bytes" ]] || fail 1 integrity "下载文件摘要或长度不符：$relative"
  done < "$stage/files.tsv"
  verify_tree "$stage/$name"
  check_chain "$install_root"
  check_chain "$state/receipts"
  [[ "$(stat -c '%d:%i' -- "$install_root")" == "$root_identity" ]] || fail 1 conflict '提交前目标根目录已变化'
  check_git "$name"
  [[ ! -e "$target" && ! -L "$target" && ! -e "$receipt" && ! -L "$receipt" ]] || fail 1 conflict '提交前目标或收据已变化'
  # 同文件系统的无覆盖重命名；即使目标在上一个检查之后出现也不能覆盖。
  mv -nT -- "$stage/$name" "$target" || fail 1 commit "无法提交技能：$name"
  [[ ! -e "$stage/$name" ]] || fail 1 conflict '原子提交时目标已出现，未覆盖'
  ln -- "$stage/receipt.json" "$receipt" || fail 1 receipt "技能已完整提交但收据失败；保留现场，不自动接管：$name"
  rm -- "$stage/receipt.json"
  "$jq_cli" -cn --arg name "$name" '{name:$name,status:"installed"}' >> "$temporary/results"
  current_skill=''
done
reason_code=''
