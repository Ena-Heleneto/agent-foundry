#!/usr/bin/env bash
# 临时手动入口，复制主线工作流技能并使用构建生成的官方挂载声明。
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
        '默认项目为本仓库，使用 PATH 中的 specify。支持 Linux x86_64 的 Codex 项目级挂载。' \
        '复制四项主线工作流技能，注册三个 hooks 和 speckit-modes-increment。' \
        '目标同名技能有差异时停止。已登记的扩展经文件核验后由官方 CLI 刷新。'
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
init_options="$project/.specify/init-options.json"
extensions="$project/.specify/extensions"
registry="$extensions/.registry"
skills_root="$project/.agents/skills"
for directory in "$project/.specify" "$extensions" "$project/.agents" "$skills_root"; do
  [[ ! -L "$directory" && ( ! -e "$directory" || -d "$directory" ) ]] || { printf '项目路径不是普通目录：%s\n' "$directory" >&2; exit 2; }
done
for file in "$init_options" "$registry" "$project/.specify/extensions.yml"; do
  [[ ! -L "$file" && ( ! -e "$file" || -f "$file" ) ]] || { printf '项目路径不是普通文件：%s\n' "$file" >&2; exit 2; }
done
jq_cli="$(command -v -- "${FOUNDRY_JQ:-jq}")" || { printf '%s\n' '找不到 jq。' >&2; exit 2; }
[[ "$jq_cli" == /* ]] || jq_cli="$PWD/$jq_cli"
[[ -f "$init_options" ]] && "$jq_cli" -e '.ai == "codex" and .ai_skills == true' "$init_options" >/dev/null || { printf '%s\n' '目标须先初始化为 Codex skills 项目。' >&2; exit 2; }
if [[ -f "$registry" ]]; then
  "$jq_cli" -e '.extensions | type == "object"' "$registry" >/dev/null || { printf '%s\n' 'Spec Kit 扩展登记无效。' >&2; exit 2; }
fi
cli="$(command -v -- "$cli")" || { printf '%s\n' '找不到 specify，请先安装或通过 --cli 指定。' >&2; exit 2; }
[[ "$cli" == /* ]] || cli="$PWD/$cli"
unset SPECIFY_INIT_DIR SPECIFY_PROJECT_ROOT
cli_version="$("$cli" --version)"
cli_version="${cli_version#specify }"
[[ "$cli_version" =~ ^[0-9][0-9A-Za-z.+-]*$ ]] || { printf '无法识别 Specify 版本：%s\n' "$cli_version" >&2; exit 2; }
[[ -z "${FOUNDRY_SPECIFY_VERSION:-}" || "$FOUNDRY_SPECIFY_VERSION" == "$cli_version" ]] || { printf '%s\n' 'FOUNDRY_SPECIFY_VERSION 与所选 CLI 实际版本不一致。' >&2; exit 2; }
export FOUNDRY_SPECIFY_VERSION="$cli_version"

temporary="$(mktemp -d "${TMPDIR:-/tmp}/foundry-manual-speckit-XXXXXXXX")"
copy_stage=''
stage='构建工作流挂载产物'
trap '
  status=$?
  rm -rf -- "$temporary"
  if [[ -n "$copy_stage" ]]; then rm -rf -- "$copy_stage"; fi
  if [[ "$status" -ne 0 ]]; then printf "挂载停止于：%s\n" "$stage" >&2; fi
  exit "$status"
' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
printf '项目：%s\nSpecify：%s\n' "$project" "$cli_version"
mount_script="$temporary/speckit-mount.sh"
(
  cd -- "$repo_root/packages/skills"
  node --input-type=module - "$mount_script" <<'NODE'
import { writeFile } from 'node:fs/promises'
import process from 'node:process'
import { build } from 'vite'

/**
 * 从技能包的 Vite 内存构建提取挂载脚本。
 * @param {string} destination 临时脚本的绝对路径。
 */
async function writeMountScript(destination) {
  /**
   * 技能包当前配置产生的内存构建结果。
   */
  const result = await build({ build: { write: false } })
  /**
   * 各构建环境输出的资产和入口。
   */
  const outputs = [result].flat().flatMap(bundle => bundle.output)
  /**
   * 本次开发挂载所需的引擎脚本。
   */
  const mount = outputs.find(asset => asset?.type === 'asset' && asset.fileName === 'engine/script/speckit-mount.sh')
  if (!mount)
    throw new Error('构建未生成 Spec Kit 挂载脚本')
  await writeFile(destination, mount.source)
}

writeMountScript(process.argv[2]).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
NODE
)

source_root="$repo_root/packages/skills/src/workflow"
skills=(implementation-preparation artifact-spec-analysis artifact-project-description task-increment)
stage='核对工作流技能副本'
for name in "${skills[@]}"; do
  skill_source="$source_root/$name"
  [[ -d "$skill_source" && ! -L "$skill_source" && -f "$skill_source/SKILL.md" ]] || { printf '技能来源不可用：%s\n' "$skill_source" >&2; exit 2; }
  unexpected_entry="$(find "$skill_source" ! -type f ! -type d -print -quit)"
  if [[ -n "$unexpected_entry" ]]; then
    printf '技能来源包含链接或特殊文件：%s\n' "$unexpected_entry" >&2
    exit 2
  fi
  target="$skills_root/$name"
  if [[ -e "$target" || -L "$target" ]]; then
    [[ -d "$target" && ! -L "$target" ]] && diff -qr --no-dereference -- "$source_root/$name" "$target" >/dev/null || { printf '目标技能与来源不同：%s\n' "$target" >&2; exit 1; }
  fi
done

stage='复制工作流技能'
mkdir -p -- "$skills_root"
copy_stage="$(mktemp -d "$project/.agents/.mount-speckit-XXXXXXXX")"
for name in "${skills[@]}"; do
  target="$skills_root/$name"
  if [[ ! -e "$target" && ! -L "$target" ]]; then
    cp -R -- "$source_root/$name" "$copy_stage/$name"
    mv -T -n -- "$copy_stage/$name" "$target"
  fi
  [[ -d "$target" && ! -L "$target" ]] && diff -qr --no-dereference -- "$source_root/$name" "$target" >/dev/null || { printf '复制期间目标技能发生冲突：%s\n' "$target" >&2; exit 1; }
done

stage='注册 hooks 和 Increment'
(
  cd -- "$project"
  inputs=()
  priorities=()
  # 沿构建产物的顺序预检全部扩展，再将登记交给官方 CLI。
  specify() {
    if [[ $# != 4 || "$1 $2 $3" != 'extension add --dev' ]]; then
      printf '%s\n' '构建产物的 Spec Kit 注册参数格式发生变化。' >&2
      return 2
    fi
    local input="$4" id installed commands='{}' priority
    local increment="$skills_root/speckit-modes-increment"
    id="${input##*/}"
    installed="$extensions/$id"
    if [[ "$id" == modes ]]; then
      commands='{"codex":["speckit.modes.increment"]}'
    fi
    if [[ ! -f "$registry" ]] || ! "$jq_cli" -e --arg id "$id" '.extensions | has($id)' "$registry" >/dev/null; then
      if [[ -e "$installed" || -L "$installed" || ( "$id" == modes && ( -e "$increment" || -L "$increment" ) ) ]]; then
        printf '发现无登记的同名扩展或入口：%s\n' "$id" >&2
        return 1
      fi
      inputs+=("$input")
      priorities+=('')
      return
    fi

    priority="$("$jq_cli" -er --arg id "$id" --argjson commands "$commands" '
      .extensions[$id] | select(.source == "local" and (.registered_commands // {}) == $commands and (.registered_skills // []) == []) | .priority
    ' "$registry")" || { printf '无法核实扩展登记归属：%s\n' "$id" >&2; return 1; }
    local backup="$extensions/.backup/$id"
    [[ ! -L "$extensions/.backup" && ! -e "$backup" && ! -L "$backup" ]] || { printf '发现需要保留的扩展备份：%s\n' "$backup" >&2; return 1; }
    [[ -d "$installed" && ! -L "$installed" ]] || { printf '已登记扩展的目录不可用：%s\n' "$installed" >&2; return 1; }
    if ! diff -qr --no-dereference -- "$input" "$installed" >/dev/null; then
      # 用提交中的旧安装快照核验旧布局。用户编辑的工作区文件不能充当基线。
      local reference="$temporary/reference"
      mkdir -p -- "$reference"
      if ! git -C "$repo_root" archive HEAD ".specify/extensions/$id" | tar -x -C "$reference" ||
        ! diff -qr --no-dereference -- "$reference/.specify/extensions/$id" "$installed" >/dev/null; then
        printf '扩展文件与已知安装来源不同：%s\n' "$installed" >&2
        return 1
      fi
    fi
    if [[ "$id" == modes && ( -e "$increment" || -L "$increment" ) ]]; then
      local replay="$temporary/replay"
      mkdir -- "$replay"
      (
        cd -- "$replay"
        "$cli" init --here --integration codex --integration-options=--skills --script sh --ignore-agent-tools --non-interactive &&
        "$cli" extension add --dev "$installed"
      ) > "$temporary/replay.log" 2>&1 || { cat "$temporary/replay.log" >&2; return 1; }
      [[ -d "$increment" && ! -L "$increment" ]] && diff -qr --no-dereference -- "$replay/.agents/skills/speckit-modes-increment" "$increment" >/dev/null || { printf 'Increment 生成入口与原登记不一致：%s\n' "$increment" >&2; return 1; }
    fi
    inputs+=("$input")
    priorities+=("$priority")
  }
  source "$mount_script"
  for index in "${!inputs[@]}"; do
    arguments=(extension add --dev "${inputs[index]}")
    if [[ -n "${priorities[index]}" ]]; then
      arguments+=(--force --priority "${priorities[index]}")
    fi
    "$cli" "${arguments[@]}"
  done
)
printf '%s\n' '工作流技能、hooks 和 Increment 已挂载。'
