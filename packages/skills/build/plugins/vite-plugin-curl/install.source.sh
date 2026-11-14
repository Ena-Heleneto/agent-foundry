#!/usr/bin/env bash
set -euo pipefail

version="${1:-latest}"
release_url='https://downloads.example.com/releases/0.1.0'

for tool in curl node npm uv; do
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
  node-jq@6.3.1

jq_cli="$download_dir/deps/node_modules/node-jq/bin/jq"

curl \
  --fail --silent --show-error --location \
  --proto '=https' --proto-redir '=https' \
  --connect-timeout 10 --max-time 120 \
  --output "$download_dir/release.json" \
  "${release_url%/}/release.json"

# 版本表是数组，最新版本放在第一条。
if ! download_url="$("$jq_cli" -er --arg version "$version" '
  if type != "array" then error("版本表必须是数组") else . end
  | (if $version == "latest" then .[:1] else map(select(.version == $version)) end)
  | if length == 1 then .[0] else error("版本不存在或重复") end
  | select((.version | type) == "string" and (.version | length) > 0)
  | .url
  | select(type == "string" and startswith("https://") and (test("[[:space:][:cntrl:]]") | not))
' "$download_dir/release.json")"; then
  printf '版本不存在或版本表无效：%s\n' "$version" >&2
  exit 2
fi

printf '请求版本：%s\n下载地址：%s\n' "$version" "$download_url"
printf '版本地址已解析，技能下载、校验和安装逻辑尚未接入。\n'
