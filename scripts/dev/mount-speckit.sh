#!/usr/bin/env bash
# 临时手动入口：复制主线工作流技能，再依次注册 hooks 和 Increment。
# 默认作用于当前仓库；不接入 postinstall，不刷新官方 speckit-* 技能。
# 用法：bash scripts/dev/mount-speckit.sh [--project <项目目录>] [--cli <specify路径>]
# 可沿现有注册器设置 FOUNDRY_JQ、FOUNDRY_YQ，离线工具仍按官方摘要核验。
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd -- "$script_dir/../.." && pwd -P)"
project="$repo_root"
cli="${FOUNDRY_SPECIFY_CLI:-specify}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      printf '%s\n' \
        '用法：bash scripts/dev/mount-speckit.sh [--project <项目目录>] [--cli <specify路径>]' \
        '默认项目为本仓库，使用 PATH 中的 specify；仅支持 Linux x86_64 / Codex 项目级。' \
        '复制 implementation-preparation、artifact-spec-analysis、artifact-project-description。' \
        '随后注册 before_implement、after_tasks、after_converge，最后注册 speckit-modes-increment。' \
        '目标同名技能有差异时停止；已注册扩展由现有注册器核验并交给官方 CLI 刷新。'
      exit 0 ;;
    --project|--cli)
      [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || { printf '参数缺值：%s\n' "$1" >&2; exit 2; }
      case "$1" in --project) project="$2" ;; --cli) cli="$2" ;; esac
      shift 2 ;;
    *) printf '未知参数：%s\n' "$1" >&2; exit 2 ;;
  esac
done

[[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || { printf '%s\n' '本临时入口仅支持 Linux x86_64。' >&2; exit 2; }
[[ -d "$project" ]] || { printf '项目目录不存在：%s\n' "$project" >&2; exit 2; }
project="$(cd -- "$project" && pwd -P)"
[[ -f "$project/.specify/init-options.json" ]] || { printf '%s\n' '目标尚未初始化 Spec Kit；本脚本不自动初始化。' >&2; exit 2; }
cli="$(command -v -- "$cli")" || { printf '%s\n' '找不到 specify，请先安装或通过 --cli 指定。' >&2; exit 2; }
# 固定到本次实际 CLI 版本，避免注册器默认版本与已初始化项目使用的工具错配。
cli_version="$("$cli" --version)"
cli_version="${cli_version#specify }"
[[ "$cli_version" =~ ^[0-9][0-9A-Za-z.+-]*$ ]] || { printf '无法识别 Specify 版本：%s\n' "$cli_version" >&2; exit 2; }
[[ -z "${FOUNDRY_SPECIFY_VERSION:-}" || "$FOUNDRY_SPECIFY_VERSION" == "$cli_version" ]] || { printf '%s\n' 'FOUNDRY_SPECIFY_VERSION 与所选 CLI 实际版本不一致。' >&2; exit 2; }
export FOUNDRY_SPECIFY_VERSION="$cli_version"

source_root="$repo_root/packages/skills/src/workflow"
module_root="$repo_root/packages/skills/script"
skills_root="$project/.agents/skills"
skills=(implementation-preparation artifact-spec-analysis artifact-project-description)
# 复用注册器的路径检查；source 本文件只加载函数，不执行注册。
source "$module_root/register-commands/register-commands.sh"
fr_path "$project/.specify"
fr_path "$skills_root"
[[ -f "$source_root/collection.config.ts" && -f "$source_root/task-increment/SKILL.md" ]] || { printf '%s\n' '工作流集合配置或 Increment 来源缺失。' >&2; exit 2; }
# 所有来源和目标先核验，不让复制器覆盖不同内容或用户编辑。
for name in "${skills[@]}"; do
  fr_tree "$source_root/$name"
  [[ -f "$source_root/$name/SKILL.md" ]] || { printf '技能正文缺失：%s\n' "$name" >&2; exit 2; }
  fr_path "$skills_root/$name"
  if [[ -e "$skills_root/$name" ]]; then
    fr_tree "$skills_root/$name"
    diff -qr -- "$source_root/$name" "$skills_root/$name" >/dev/null || { printf '目标技能与来源不同，请先核对，未覆盖：%s\n' "$skills_root/$name" >&2; exit 1; }
  fi
done
[[ ! -e "$skills_root/task-increment" && ! -L "$skills_root/task-increment" ]] || { printf '%s\n' '发现正常技能根中的 task-increment 原始副本，请先按既有迁移流程归位。' >&2; exit 1; }

temporary="$(mktemp -d "${TMPDIR:-/tmp}/foundry-manual-speckit-XXXXXXXX")"
stage='导出集合配置'
trap 'status=$?; rm -rf -- "$temporary"; if [[ "$status" -ne 0 ]]; then printf "挂载停止于：%s；保留已完成步骤，未执行后续阶段。\n" "$stage" >&2; fi; exit "$status"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# 注册器继续消费 JSON，由唯一的 TS 维护源导出到本次临时目录。
node --input-type=module -e 'import { pathToFileURL } from "node:url"; process.stdout.write(JSON.stringify((await import(pathToFileURL(process.argv[1]).href)).default))' \
  "$source_root/collection.config.ts" > "$temporary/collection.config.json"
stage='复制技能'
for name in "${skills[@]}"; do
  cp -R -- "$source_root/$name" "$temporary/$name"
done
printf '项目：%s\nSpecify：%s\n来源：%s\n' "$project" "$cli_version" "$source_root"
bash "$repo_root/scripts/dev/actions/link-skills/link-skills.sh" "$temporary" "$skills_root"

stage='注册 hooks'
# 避免外部环境指针将官方 CLI 重定向到其他项目。
unset SPECIFY_INIT_DIR SPECIFY_PROJECT_ROOT
bash "$module_root/register-hooks/register-hooks.sh" \
  --project "$project" --skills-dir "$skills_root" \
  --collection-config "$temporary/collection.config.json" --cli "$cli"

stage='注册 Increment'
# 原始来源保持在发现根之外，仅由官方 CLI 生成正式 Increment 入口。
bash "$module_root/register-commands/register-commands.sh" \
  --project "$project" --skills-dir "$source_root" --cli "$cli"
printf '%s\n' '工作流技能、hooks 和 Increment 已挂载；宿主实际加载需另行验证。'
