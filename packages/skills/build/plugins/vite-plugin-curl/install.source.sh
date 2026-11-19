#!/usr/bin/env bash
set -euo pipefail

requested_version='latest'
hidden=false
auto_mount=true

for argument in "$@"; do
  case "$argument" in
    --hidden) hidden=true ;;
    --no-mount) auto_mount=false ;;
    *) requested_version="${argument:-latest}" ;;
  esac
done

release_url='https://downloads.example.com/releases/0.1.0'

for tool in curl node npm tar uv; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf '缺少依赖：%s，请先安装。\n' "$tool" >&2
    exit 2
  fi
done

download_root="$HOME/.cache/agent-foundry/tmp"
mkdir -p -- "$download_root"
download_dir="$(mktemp -d "$download_root/install.$(date +%Y%m%d-%H%M%S).XXXXXX")"

trap 'rm -rf -- "$download_dir"' EXIT

# 依赖和 npm 缓存只放在本次临时目录，退出时一起清理。
npm install --global=false \
  --prefix "$download_dir/deps" \
  --cache "$download_dir/npm-cache" \
  --no-save --no-package-lock --no-audit --no-fund \
  node-jq

jq_cli="$download_dir/deps/node_modules/node-jq/bin/jq"
version="$("$jq_cli" -nr --arg version "$requested_version" '$version')"
printf '请求版本：%s\n' "$version"

curl \
  --fail --silent --show-error --location \
  --proto '=https' --proto-redir '=https' \
  --connect-timeout 10 --max-time 120 \
  --output "$download_dir/release.json" \
  "${release_url%/}/release.json"

# 版本表是数组，最新版本放在第一条。
if ! release_entry="$("$jq_cli" -ce --arg version "$version" '
  if type != "array" then error("版本表必须是数组") else . end
  | (if $version == "latest" then .[:1] else map(select(.version == $version)) end)
  | if length == 1 then .[0] else error("版本不存在或重复") end
  | select((.version | type) == "string" and (.version | length) > 0)
  | select((.url | type) == "string" and (.url | startswith("https://")) and (.url | test("[[:space:][:cntrl:]]") | not))
  | select((.md5 | type) == "string" and (.md5 | test("^[0-9A-Fa-f]{32}$")))
  | { version, url, md5 }
' "$download_dir/release.json")"; then
  printf '版本不存在或版本表无效（需包含有效的 HTTPS url 和 32 位 md5）：%s\n' "$version" >&2
  exit 2
fi

version="$("$jq_cli" -er '.version' <<< "$release_entry")"
download_url="$("$jq_cli" -er '.url' <<< "$release_entry")"
expected_md5="$("$jq_cli" -er '.md5 | ascii_downcase' <<< "$release_entry")"
downloaded_content="$download_dir/content"
curl \
  --fail --silent --show-error --location \
  --proto '=https' --proto-redir '=https' \
  --connect-timeout 10 --max-time 120 \
  --output "$downloaded_content" \
  "$download_url"

actual_md5="$(node --input-type=commonjs -e 'const crypto = require("node:crypto"); const fs = require("node:fs"); process.stdout.write(crypto.createHash("md5").update(fs.readFileSync(process.argv[1])).digest("hex"))' "$downloaded_content")"
if [[ "$actual_md5" != "$expected_md5" ]]; then
  printf '下载内容 MD5 校验失败：期望 %s，实际 %s\n' "$expected_md5" "$actual_md5" >&2
  exit 2
fi

extract_dir="$download_dir/extracted"
mkdir -p -- "$extract_dir"
tar -xzf "$downloaded_content" -C "$extract_dir"

skills_source="$extract_dir/skill"
[[ -d "$skills_source" ]] || { printf '技能包缺少 skill/ 目录\n' >&2; exit 2; }
skill_directories="$download_dir/skill-directories"
find "$skills_source" -mindepth 2 -maxdepth 2 -type d -print0 > "$skill_directories"
[[ -s "$skill_directories" ]] || { printf '技能包中没有技能目录\n' >&2; exit 2; }

working_directory="$PWD"
skills_root="$working_directory/.agents/skills"
mkdir -p -- "$skills_root"

successful_skills=()
install_status=0
while IFS= read -r -d '' skill_directory; do
  skill_name="${skill_directory##*/}"
  installed_path="$skills_root/$skill_name"
  if [[ -e "$installed_path" || -L "$installed_path" ]]; then
    printf '目标技能已存在，拒绝覆盖：%s\n' "$installed_path" >&2
    install_status=2
    break
  fi
  if cp -R -- "$skill_directory" "$installed_path"; then
    successful_skills+=("$installed_path")
  else
    install_status=$?
    break
  fi
done < "$skill_directories"

# 只从本次下载的包运行隐匿脚本，名单和结果随临时目录清理。
hide_successful_skills() {
  local hidden_script="$extract_dir/script/hidden-install.sh"
  local successful_file="$download_dir/successful-skills.json"
  local result_file="$download_dir/hidden-result.json"
  local interface hidden_exit=0

  if [[ ! -f "$hidden_script" || -L "$hidden_script" || -L "$extract_dir/script" ]]; then
    printf '技能包缺少可用的隐匿脚本：script/hidden-install.sh\n' >&2
    return 1
  fi
  if ! { IFS= read -r _ && IFS= read -r interface; } < "$hidden_script" ||
    [[ "$interface" != '# foundry-hidden-interface: 1' ]]; then
    printf '技能包的隐匿脚本协议不受支持。\n' >&2
    return 1
  fi
  if ! "$jq_cli" -n --args '
    $ARGS.positional | map(. as $installedPath | (split("/") | last) as $name
      | {name: $name, installRelativeDirectory: $name, installedPath: $installedPath, complete: true})
  ' -- "${successful_skills[@]}" > "$successful_file"; then
    return 1
  fi
  bash -- "$hidden_script" --project "$working_directory" --agent-root .agents/skills \
    --successful-skills-file "$successful_file" --result-file "$result_file" || hidden_exit=$?

  if ! "$jq_cli" -er --argjson code "$hidden_exit" '
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

hidden_status=0
if [[ "$hidden" == true ]] && (("${#successful_skills[@]}" > 0)); then
  if ! hide_successful_skills; then
    hidden_status=1
    if ((install_status == 0)); then
      printf '技能已安装，隐匿失败。\n' >&2
    else
      printf '技能部分安装成功，隐匿失败。\n' >&2
    fi
  fi
fi

if ((install_status != 0)); then
  if (("${#successful_skills[@]}" > 0)); then
    printf '技能部分安装成功：%s 项。\n' "${#successful_skills[@]}" >&2
  fi
  exit "$install_status"
fi

printf '请求版本：%s\n下载地址：%s\n下载文件：%s\nMD5 校验：通过\n解压目录：%s\n安装目录：%s\n' "$version" "$download_url" "$downloaded_content" "$extract_dir" "$skills_root"

if [[ "$auto_mount" == true ]]; then
  engine_script="$extract_dir/engine/install.sh"
  if [[ ! -f "$engine_script" || -L "$engine_script" || -L "$extract_dir/engine" ]]; then
    printf '技能已安装，技能包缺少可用的引擎入口：engine/install.sh\n' >&2
    exit 2
  fi
  bash -- "$engine_script"
fi

exit "$hidden_status"
