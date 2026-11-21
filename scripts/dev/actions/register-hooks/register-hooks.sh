#!/usr/bin/env bash
# 开发入口仅补齐工作区路径，实际操作使用对应平台的交付脚本。
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd -- "$script_dir/../../../.." && pwd -P)"
exec bash "$repo_root/packages/skills/script/register-hooks/register-hooks.sh" --project "$repo_root" --skills-dir "$repo_root/.agents/skills" "$@"
