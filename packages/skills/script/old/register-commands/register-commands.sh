#!/usr/bin/env bash
# Bash 正式注册共享函数；直接执行只注册 Increment，hooks 模块复用保护逻辑。
fr_fail() {
  local status="$1"
  shift
  printf '注册停止：%s\n已完成：%s；后续依赖阶段未运行。\n' "$*" "${fr_completed[*]:-无}" >&2
  exit "$status"
}

# 检查词法路径，不用 realpath 隐藏祖先链接。
fr_path() {
  local target="$1" cursor='/' component
  local components=()
  [[ "$target" == /* && "$target" != *[$'\t\r\n']* ]] || fr_fail 2 "路径须绝对且不含控制字符：$target"
  IFS='/' read -r -a components <<< "$target"
  for component in "${components[@]}"; do
    [[ -n "$component" ]] || continue
    [[ "$component" != . && "$component" != .. ]] || fr_fail 2 "路径含越界分量：$target"
    [[ "$cursor" == / || ! -e "$cursor" || -d "$cursor" ]] || fr_fail 2 "祖先不是目录：$cursor"
    cursor="${cursor%/}/$component"
    [[ ! -L "$cursor" ]] || fr_fail 2 "路径含链接：$cursor"
  done
}
fr_absolute() {
  local value="$1"
  while [[ "$value" == ./* ]]; do value="${value#./}"; done
  [[ "$value" != . ]] || value="$PWD"
  [[ "$value" == /* ]] || value="$PWD/$value"
  fr_path "$value"
  printf '%s\n' "$value"
}
fr_tree() {
  local root="$1" entry
  fr_path "$root"
  [[ -d "$root" ]] || fr_fail 1 "目录缺失：$root"
  while IFS= read -r -d '' entry; do
    fr_path "$entry"
    [[ -f "$entry" || -d "$entry" ]] || fr_fail 1 "特殊文件无法确认归属：$entry"
  done < <(find "$root" -mindepth 1 -print0)
}
fr_json() {
  fr_path "$1"
  [[ -f "$1" ]] || fr_fail 1 "配置缺失：$1"
  "$fr_yq_bin" -o=json -I=0 '.' "$1" > "$2" || fr_fail 1 "配置解析失败：$1"
  "$fr_jq_bin" -e 'type == "object"' "$2" >/dev/null || fr_fail 1 "配置须为对象：$1"
}

# 固定工具只进入自有临时目录；离线工具也需核对官方摘要。
fr_tool() {
  local name="$1" provided="$2" url="$3" digest="$4"
  if [[ -n "$provided" ]]; then
    provided="$(fr_absolute "$provided")"
    [[ -f "$provided" ]] || fr_fail 2 "工具缺失：$provided"
    cp -- "$provided" "$fr_temporary/$name" || fr_fail 1 "无法复制工具：$name"
  else
    curl --disable --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --connect-timeout 10 --max-time 60 --output "$fr_temporary/$name" -- "$url" || fr_fail 1 "工具准备失败：$name；目标未变更"
  fi
  [[ "$(sha256sum -- "$fr_temporary/$name")" == "$digest "* ]] || fr_fail 1 "官方工具摘要不匹配：$name"
  chmod u+x "$fr_temporary/$name"
}

# 只提取 frontmatter 边界，YAML 语法交由 yq 解析。
fr_source() {
  local source="$1" id="$2" header="$3" reference
  fr_tree "$source"
  [[ -f "$source/SKILL.md" ]] || fr_fail 1 "缺少来源正文：$source/SKILL.md"
  awk 'NR == 1 { sub(/\r$/, ""); if ($0 != "---") exit 1; next } { sub(/\r$/, ""); if ($0 == "---") { closed=1; exit } print } END { if (!closed) exit 1 }' "$source/SKILL.md" > "$header.yml" || fr_fail 1 "技能元数据边界无效：$source"
  fr_json "$header.yml" "$header.json"
  "$fr_jq_bin" -e --arg id "$id" '.name == $id and (.description | type == "string" and length > 0)' "$header.json" >/dev/null || fr_fail 1 "技能名称或描述无效：$source"
  while IFS= read -r reference; do
    reference="${reference%%#*}"
    [[ "$reference" != *'%'* && "$reference" != *'\'* ]] || fr_fail 1 "附件引用编码无法确认：$source/$reference"
    fr_path "$source/$reference"
    [[ -f "$source/$reference" ]] || fr_fail 1 "必要附件缺失：$source/$reference"
  done < <(grep -Eo 'references/[^[:space:]`\)"<>]+' "$source/SKILL.md" || true)
}

# 只从正文的真实 Markdown 引用开始求附件闭包，文件不能用自引用证明归属。
fr_reference_closure() {
  local source="$1" output="$2" index=0 current link reference candidate known seen
  local queue=(SKILL.md)
  while [[ "$index" -lt "${#queue[@]}" ]]; do
    current="${queue[$index]}"
    index=$((index + 1))
    while IFS= read -r link; do
      reference="${link#']('}"
      reference="${reference%')'}"
      reference="${reference%%#*}"
      [[ -n "$reference" ]] || continue
      case "$reference" in *://*|mailto:*|data:*) continue ;; esac
      if [[ "$reference" == references/* ]]; then
        candidate="$reference"
      elif [[ "$current" != SKILL.md ]]; then
        candidate="$(dirname -- "$current")/$reference"
      else
        continue
      fi
      [[ "$candidate" == references/* && "$candidate" != *'%'* && "$candidate" != *'\'* ]] || fr_fail 1 "旧附件引用无法核验：$candidate"
      fr_path "$source/$candidate"
      [[ -f "$source/$candidate" ]] || fr_fail 1 "旧附件引用缺失：$source/$candidate"
      seen=false
      for known in "${queue[@]}"; do [[ "$known" != "$candidate" ]] || seen=true; done
      [[ "$seen" == true ]] || queue+=("$candidate")
    done < <(grep -Eo '\]\([^)]*\)' "$source/$current" || true)
  done
  printf '%s\n' "${queue[@]}" > "$output"
}

# 旧逐技能配置只在与其旧 manifest 语义一致时认领，其他文件必须可达。
fr_old_source() {
  local source="$1" destination="$2" id="$3" manifest="${4:-}" entry relative
  fr_source "$source" "$id" "$fr_temporary/meta-old-$id"
  fr_reference_closure "$source" "$fr_temporary/reachable-$id"
  if [[ -e "$source/speckit-hooks.json" ]]; then
    [[ -n "$manifest" ]] || fr_fail 1 "旧模式含未知 hook 配置：$source/speckit-hooks.json"
    fr_json "$source/speckit-hooks.json" "$fr_temporary/legacy-hooks-$id.json"
    "$fr_jq_bin" -e -n --slurpfile config "$fr_temporary/legacy-hooks-$id.json" --slurpfile manifest "$manifest" '$config[0] == $manifest[0].hooks' >/dev/null || fr_fail 1 "旧逐技能配置与声明不一致：$source/speckit-hooks.json"
  fi
  while IFS= read -r -d '' entry; do
    relative="${entry#"$source/"}"
    if [[ -f "$entry" && "$relative" != SKILL.md ]]; then
      if [[ "$relative" != speckit-hooks.json || -z "$manifest" ]]; then
        grep -Fxq -- "$relative" "$fr_temporary/reachable-$id" || fr_fail 1 "旧来源含不可达用户附件：$entry"
      fi
    elif [[ -d "$entry" ]]; then
      [[ "$relative" == references || "$relative" == references/* ]] || fr_fail 1 "旧来源含未知目录：$entry"
      [[ -n "$(find "$entry" -type f -print -quit)" ]] || fr_fail 1 "旧来源含未声明空目录：$entry"
    fi
  done < <(find "$source" -mindepth 1 -print0)
  mkdir -p "$destination"
  cp -R -- "$source/." "$destination/"
}

fr_bridge() {
  local source="$1" target="$2" entry relative
  [[ -d "$source" ]] || return 0
  fr_tree "$source"
  while IFS= read -r -d '' entry; do
    relative="${entry#"$source/"}"
    fr_path "$target/$relative"
    if [[ -e "$target/$relative" ]]; then
      [[ -f "$target/$relative" ]] && cmp -s -- "$entry" "$target/$relative" || fr_fail 1 "附件桥接冲突：$relative"
    else
      mkdir -p -- "$(dirname -- "$target/$relative")"
      cp -- "$entry" "$target/$relative" || fr_fail 1 "附件桥接失败：$relative"
    fi
  done < <(find "$source" -type f -print0)
}
fr_cli() {
  local directory="$1"
  shift
  (cd -- "$directory" && "${fr_cli_command[@]}" "$@")
}
fr_target() {
  local label="$1" status
  shift
  if fr_cli "$fr_project" "$@"; then
    fr_completed+=("$label")
    printf '已完成：%s\n' "$label"
  else
    status=$?
    fr_fail "$status" "官方操作失败：$label，退出 $status"
  fi
}

# 用旧登记、声明和同版官方重现核对受影响目录，不保存产品指纹。
fr_inspect_extension() {
  local id="$1" target="$fr_project/.specify/extensions/$1" input="$fr_temporary/old-$1"
  local source_file name mode status entry relative old_source
  local names=() old_sources=()
  fr_path "$target"
  if ! "$fr_jq_bin" -e --arg id "$id" '.extensions | has($id)' "$fr_registry" >/dev/null; then
    [[ ! -e "$target" ]] || fr_fail 1 "无登记孤立扩展：$target"
    return 0
  fi
  fr_tree "$target"
  fr_json "$target/extension.yml" "$fr_temporary/manifest-$id.json"
  "$fr_jq_bin" -e --arg id "$id" '.extension.id == $id and ([keys[]] - ["schema_version","extension","requires","provides","hooks"] | length == 0) and ((.provides // {} | keys) - ["commands"] | length == 0) and ((.provides.commands // []) | type == "array") and all(.provides.commands[]?; ((.aliases // []) | length == 0))' "$fr_temporary/manifest-$id.json" >/dev/null || fr_fail 1 "旧扩展声明超出可核验范围：$target"
  "$fr_jq_bin" -e --arg id "$id" --slurpfile manifest "$fr_temporary/manifest-$id.json" '.extensions[$id] as $entry | (($entry.registered_commands // {} | keys) - ["codex"] | length == 0) and (($entry.registered_skills // []) | length == 0) and (($entry.registered_commands.codex // []) == [$manifest[0].provides.commands[]?.name])' "$fr_registry" >/dev/null || fr_fail 1 "旧登记与声明不一致：$id"
  mkdir -p "$input"
  cp -- "$target/extension.yml" "$input/extension.yml"
  while IFS=$'\t' read -r name source_file; do
    [[ -n "$name" ]] || continue
    [[ "$id" == modes && "$name" == speckit.modes.* ]] || fr_fail 1 "hook 扩展夹带未知命令：$name"
    mode="${name#speckit.modes.}"
    case "$mode" in tutor|pair|direct|increment|review|guide|explore) ;; *) fr_fail 1 "未知旧模式：$name" ;; esac
    [[ "$source_file" == "skills/task-$mode/SKILL.md" ]] || fr_fail 1 "旧模式来源路径无法核验：$source_file"
    fr_old_source "$target/skills/task-$mode" "$input/skills/task-$mode" "task-$mode"
    old_sources+=("$target/skills/task-$mode")
    names+=("${name//./-}")
  done < <("$fr_jq_bin" -r '.provides.commands[]? | [.name,.file] | @tsv' "$fr_temporary/manifest-$id.json")
  if [[ "$id" != modes && -e "$target/skills/$id" ]]; then
    fr_old_source "$target/skills/$id" "$input/skills/$id" "$id" "$fr_temporary/manifest-$id.json"
  fi
  # 旧命令曾不做顶层桥接；只核验并重现实际存在的旧桥接，不能补新布局。
  if [[ "$id" == modes && -e "$target/references" ]]; then
    fr_tree "$target/references"
    for old_source in "${old_sources[@]}"; do fr_bridge "$old_source/references" "$fr_temporary/expected-refs-$id"; done
    while IFS= read -r -d '' entry; do
      relative="${entry#"$target/references/"}"
      [[ -f "$fr_temporary/expected-refs-$id/$relative" ]] && cmp -s -- "$entry" "$fr_temporary/expected-refs-$id/$relative" || fr_fail 1 "旧顶层附件归属或字节无法核验：$entry"
      mkdir -p -- "$(dirname -- "$input/references/$relative")"
      cp -- "$entry" "$input/references/$relative"
    done < <(find "$target/references" -type f -print0)
  fi
  diff -qr -- "$input" "$target" > "$fr_temporary/diff-$id.log" || fr_fail 1 "旧扩展含未知文件或附件冲突：$target"
  if [[ "$id" == modes ]]; then
    mkdir -p "$fr_temporary/replay"
    if fr_cli "$fr_temporary/replay" init --here --integration codex --integration-options=--skills --script sh --ignore-agent-tools --non-interactive > "$fr_temporary/replay.log" 2>&1; then :; else
      status=$?
      cat "$fr_temporary/replay.log" >&2
      fr_fail "$status" '同版官方初始化重现失败；目标未变更'
    fi
    if fr_cli "$fr_temporary/replay" extension add --dev "$input" --force >> "$fr_temporary/replay.log" 2>&1; then :; else
      status=$?
      cat "$fr_temporary/replay.log" >&2
      fr_fail "$status" '同版官方重现失败；目标未变更'
    fi
    for name in "${names[@]}"; do
      fr_tree "$fr_project/.agents/skills/$name"
      diff -qr -- "$fr_temporary/replay/.agents/skills/$name" "$fr_project/.agents/skills/$name" > "$fr_temporary/diff-$name.log" || fr_fail 1 "生成入口已修改或含用户附件：$fr_project/.agents/skills/$name"
    done
  fi
}
fr_inspect() {
  local id entry owner name
  fr_registry="$fr_temporary/registry.json"
  if [[ -e "$fr_project/.specify/extensions/.registry" || -L "$fr_project/.specify/extensions/.registry" ]]; then
    fr_json "$fr_project/.specify/extensions/.registry" "$fr_registry"
    "$fr_jq_bin" -e '.extensions | type == "object"' "$fr_registry" >/dev/null || fr_fail 1 '官方登记格式无效'
  else
    printf '{"extensions":{}}\n' > "$fr_registry"
  fi
  for id in "${fr_affected[@]}"; do fr_inspect_extension "$id"; done
  if [[ -e "$fr_project/.specify/extensions.yml" || -L "$fr_project/.specify/extensions.yml" ]]; then
    fr_json "$fr_project/.specify/extensions.yml" "$fr_temporary/effective.json"
    "$fr_jq_bin" -e '(.hooks // {} | type == "object") and all(.hooks[]?; type == "array")' "$fr_temporary/effective.json" >/dev/null || fr_fail 1 '有效 hooks 配置格式无法核验'
    while IFS= read -r owner; do
      for id in "${fr_affected[@]}"; do
        if [[ "$owner" == "$id" ]]; then
          "$fr_jq_bin" -e --arg id "$id" '.extensions | has($id)' "$fr_registry" >/dev/null || fr_fail 1 "无登记孤立有效 hook：$id"
        fi
      done
    done < <("$fr_jq_bin" -r '.hooks[]?[] | .extension' "$fr_temporary/effective.json")
  fi
  if [[ "$fr_kind" == commands ]]; then
    # 悬空链接的 -d 为假，必须先检查路径链，再判断目录是否存在。
    fr_path "$fr_project/.agents/skills"
  fi
  if [[ "$fr_kind" == commands && -d "$fr_project/.agents/skills" ]]; then
    # 只核验受影响的 modes 入口，不因无关技能自身的链接冻结该链。
    fr_path "$fr_project/.agents/skills"
    while IFS= read -r -d '' entry; do
      name="${entry##*/}"
      case "$name" in
        task-tutor|task-pair|task-direct|task-increment|task-review|task-guide|task-explore) fr_fail 1 "正常发现根有待归位原始副本：$entry" ;;
        speckit-modes-*) "$fr_jq_bin" -e --arg name "$name" 'any(.extensions.modes.registered_commands.codex[]?; gsub("\\.";"-") == $name)' "$fr_registry" >/dev/null || fr_fail 1 "无登记孤立生成入口：$entry" ;;
      esac
    done < <(find "$fr_project/.agents/skills" -mindepth 1 -maxdepth 1 -print0)
  fi
}
fr_prepare() {
  local id source input event
  if [[ "$fr_kind" == commands ]]; then
    source="$fr_skills/task-increment"
    fr_source "$source" task-increment "$fr_temporary/meta-current"
    mkdir -p "$fr_temporary/input/modes/skills/task-increment"
    cp -R -- "$source/." "$fr_temporary/input/modes/skills/task-increment/"
    fr_bridge "$source/references" "$fr_temporary/input/modes/references"
    "$fr_jq_bin" -n --arg version "$fr_version" --slurpfile meta "$fr_temporary/meta-current.json" '{schema_version:"1.0",extension:{id:"modes",name:"Increment",version:"1.0.0",description:"Foundry Increment"},requires:{speckit_version:("=="+$version)},provides:{commands:[{name:"speckit.modes.increment",file:"skills/task-increment/SKILL.md",description:$meta[0].description}]}}' > "$fr_temporary/input/modes/extension.yml"
    fr_affected=(modes)
  else
    [[ -n "$fr_collection" ]] || fr_fail 2 'hooks 必须提供 --collection-config'
    fr_collection="$(fr_absolute "$fr_collection")"
    fr_json "$fr_collection" "$fr_temporary/collection.json"
    [[ ${#fr_selected[@]} -gt 0 ]] || fr_selected=(implementation-preparation artifact-spec-analysis artifact-project-description)
    fr_affected=("${fr_retired[@]}" "${fr_selected[@]}")
    for id in "${fr_selected[@]}"; do
      case "$id" in implementation-preparation) event=before_implement ;; artifact-spec-analysis) event=after_tasks ;; artifact-project-description) event=after_converge ;; *) fr_fail 2 "不支持的当前 hook：$id" ;; esac
      source="$fr_skills/$id"
      fr_source "$source" "$id" "$fr_temporary/meta-$id"
      "$fr_jq_bin" -e --arg id "$id" --arg event "$event" '.skill[$id].hook as $hooks | ($hooks | type == "object" and keys == [$event]) and ($hooks[$event] as $h | ($h.prompt | type == "string" and length > 0) and $h.optional == false and $h.enabled != false and ($h.condition == null or $h.condition == "") and ($h.command == null or $h.command == $id))' "$fr_temporary/collection.json" >/dev/null || fr_fail 1 "当前 hook 配置无效：$id"
      input="$fr_temporary/input/$id"
      mkdir -p "$input/skills/$id"
      cp -R -- "$source/." "$input/skills/$id/"
      "$fr_jq_bin" -n --arg id "$id" --arg version "$fr_version" --slurpfile collection "$fr_temporary/collection.json" '{schema_version:"1.0",extension:{id:$id,name:$id,version:"1.0.0",description:"Foundry workflow hook"},requires:{speckit_version:("=="+$version)},provides:{},hooks:($collection[0].skill[$id].hook | with_entries(.value += {command:$id}))}' > "$input/extension.yml"
    done
  fi
  # 仅清理本次自有输入的空目录，合法减少附件后不制造旧目录残留。
  find "$fr_temporary/input" -depth -type d -empty -delete
}
fr_register() {
  set -euo pipefail
  fr_kind="$1"
  shift
  fr_project='' fr_skills='' fr_cli_path='' fr_collection=''
  fr_selected=() fr_affected=() fr_completed=()
  fr_retired=(artifact-issue-description artifact-pr-description mvu-gate artifact-business-flow artifact-logic-flow explainer-doc-sync)
  local option value id
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --help|-h) printf '用法：register-%s.sh --project <项目> --skills-dir <已安装来源根> [--cli <specify>]\n' "$fr_kind"; [[ "$fr_kind" != hooks ]] || printf '%s\n' 'hooks 另需 --collection-config <集合JSON>；可重复 --skill <当前hook>'; return 0 ;;
      --project|--skills-dir|--cli|--collection-config|--skill) option="$1"; [[ $# -gt 1 && -n "$2" && "$2" != --* ]] || fr_fail 2 "参数缺值：$option"; value="$2"; shift 2 ;;
      --project=*|--skills-dir=*|--cli=*|--collection-config=*|--skill=*) option="${1%%=*}"; value="${1#*=}"; shift ;;
      *) fr_fail 2 "未知参数：$1" ;;
    esac
    case "$option" in
      --project) fr_project="$value" ;; --skills-dir) fr_skills="$value" ;; --cli) fr_cli_path="$value" ;;
      --collection-config) [[ "$fr_kind" == hooks ]] || fr_fail 2 '命令模块不接受集合选项'; fr_collection="$value" ;;
      --skill) [[ "$fr_kind" == hooks ]] || fr_fail 2 '命令模块不接受 hook 选择'; [[ " ${fr_selected[*]:-} " != *" $value "* ]] || fr_fail 2 "重复选择：$value"; fr_selected+=("$value") ;;
    esac
  done
  [[ -n "$fr_project" && -n "$fr_skills" ]] || fr_fail 2 '必须提供 --project 和 --skills-dir'
  fr_project="$(fr_absolute "$fr_project")"
  fr_skills="$(fr_absolute "$fr_skills")"
  [[ -d "$fr_project" && -d "$fr_skills" ]] || fr_fail 1 '项目或来源根不存在'
  fr_version="${FOUNDRY_SPECIFY_VERSION:-1.2.6}"
  [[ "$fr_version" =~ ^[0-9][0-9A-Za-z.+-]*$ ]] || fr_fail 2 'FOUNDRY_SPECIFY_VERSION 必须为明确版本'
  [[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || fr_fail 2 '当前 Bash 模块仅验证 Linux x86_64，其他平台尚未接入'
  for option in curl sha256sum cp cmp diff find awk grep mktemp chmod dirname; do command -v "$option" >/dev/null 2>&1 || fr_fail 2 "缺少工具：$option"; done
  fr_temporary="$(mktemp -d "${TMPDIR:-/tmp}/foundry-registration-XXXXXXXX")"
  trap 'rm -rf -- "$fr_temporary"' EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  fr_tool jq "${FOUNDRY_JQ:-}" 'https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64' '020468de7539ce70ef1bceaf7cde2e8c4f2ca6c3afb84642aabc5c97d9fc2a0d'
  fr_tool yq "${FOUNDRY_YQ:-}" 'https://github.com/mikefarah/yq/releases/download/v4.54.3/yq_linux_amd64' '129534601871538efe0ba4c5e62a34fb1d5f469bcb975c4fddeb467d82974973'
  fr_jq_bin="$fr_temporary/jq" fr_yq_bin="$fr_temporary/yq"
  fr_json "$fr_project/.specify/init-options.json" "$fr_temporary/init.json"
  "$fr_jq_bin" -e '.ai == "codex" and .ai_skills == true' "$fr_temporary/init.json" >/dev/null || fr_fail 1 '目标尚未初始化为 Codex skills 项目'
  if [[ -n "$fr_cli_path" ]]; then fr_cli_command=("$fr_cli_path"); else fr_cli_command=(uvx --from "specify-cli==$fr_version" specify); fi
  fr_prepare
  fr_inspect
  if [[ "$fr_kind" == hooks ]]; then
    for id in "${fr_retired[@]}"; do
      if "$fr_jq_bin" -e --arg id "$id" '.extensions | has($id)' "$fr_registry" >/dev/null; then fr_target "退役 $id" extension remove "$id" --force; fi
    done
    for id in "${fr_selected[@]}"; do fr_target "刷新 $id" extension add --dev "$fr_temporary/input/$id" --force; done
  else
    fr_target '刷新 Increment' extension add --dev "$fr_temporary/input/modes" --force
  fi
}
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then fr_register commands "$@"; fi
