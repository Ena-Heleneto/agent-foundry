#!/usr/bin/env bash
# 将 skill 源目录下的每个子目录复制到目标 skills 目录。
#
# 用法:
#   link-skills.sh [源目录] [目标目录]
#
# 默认:
#   源目录        <repo>/packages/skills/src（自动发现一级集合）
#   目标目录      <repo>/.agents/skills
#
# 行为:
#   - 收集一级或分类目录下含 SKILL.md 的 skill，按名称铺平复制到目标。
#   - 内容相同则跳过，内容变化则替换整个 skill 目录。
#   - 同名软链接会被实体副本替换；同名普通文件报告冲突。
#   - 不处理源目录未声明的条目，保留其他来源的 skill。
#   - 明确退役的名称不再复制。只清理本仓库的旧影子画像生成副本。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"

SOURCE_DIR="${1:-${REPO_ROOT}/packages/skills/src}"
TARGET_DIR="${2:-${REPO_ROOT}/.agents/skills}"

if [[ $# -ge 3 ]]; then
  echo "warn: 第三参数（gitignore 文件）已废弃，传入值将被忽略: ${3}" >&2
fi

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "error: 源目录不存在: ${SOURCE_DIR}" >&2
  exit 1
fi

mkdir -p "${TARGET_DIR}"

# 项目安装根之外的同名技能，以及附带用户资料的旧目录，继续由其原来源管理。
project_target="${REPO_ROOT}/.agents/skills"
retired_shadow="${project_target}/shadow-profile"
if [[ "${TARGET_DIR}" -ef "${project_target}" && ! -L "${REPO_ROOT}/.agents" && ! -L "${project_target}" &&
      -d "${retired_shadow}" && ! -L "${retired_shadow}" ]]; then
  (
    shopt -s dotglob nullglob
    retired_entries=("${retired_shadow}"/*)
    if [[ ${#retired_entries[@]} -eq 1 && -f "${retired_shadow}/SKILL.md" && ! -L "${retired_shadow}/SKILL.md" ]] &&
       grep -Fxq 'name: shadow-profile' "${retired_shadow}/SKILL.md"; then
      rm -- "${retired_shadow}/SKILL.md"
      rmdir -- "${retired_shadow}"
      echo "remove(已退役): shadow-profile"
    fi
  )
fi

created=0
updated=0
skipped=0
conflicts=0

# 收集 skill 目录：一级子目录含 SKILL.md 的兼容旧布局；否则视为分类目录，
# 取其下含 SKILL.md 的二级子目录
skill_dirs=()
for entry in "${SOURCE_DIR}"/*; do
  [[ -d "${entry}" ]] || continue
  if [[ -f "${entry}/SKILL.md" ]]; then
    skill_dirs+=("${entry}")
    continue
  fi
  for sub in "${entry}"/*; do
    if [[ -d "${sub}" && -f "${sub}/SKILL.md" ]]; then
      skill_dirs+=("${sub}")
    fi
  done
done

for src in "${skill_dirs[@]}"; do
  name="$(basename "${src}")"
  # 只阻止已明确清退的精确名称；不删除已有目标，也不按名称前缀扩大范围。
  case "${name}" in
    artifact-issue-description|artifact-pr-description|mvu-gate|artifact-business-flow|artifact-logic-flow|explainer-doc-sync|\
    task-review|task-guide|task-explore|task-pair|task-tutor|task-direct|\
    speckit-modes-review|speckit-modes-guide|speckit-modes-explore|speckit-modes-pair|speckit-modes-tutor|speckit-modes-direct|shadow-profile)
      echo "skip(已退役来源): ${name}"
      skipped=$((skipped + 1))
      continue
      ;;
  esac
  dest="${TARGET_DIR}/${name}"

  # 若目标为软链接，先移除软链接再以实体目录覆盖
  if [[ -L "${dest}" ]]; then
    rm -rf "${dest}"
    cp -R "${src}" "${dest}"
    echo "copy(覆盖软链): ${name}"
    created=$((created + 1))
    continue
  fi

  # 若目标为普通文件或其它非目录实体，视为冲突
  if [[ -e "${dest}" && ! -d "${dest}" ]]; then
    echo "conflict(目标已存在同名非目录实体): ${name}" >&2
    conflicts=$((conflicts + 1))
    continue
  fi

  # 若目标目录已存在，比较内容是否一致
  if [[ -d "${dest}" ]]; then
    if diff -rq "${src}" "${dest}" >/dev/null 2>&1; then
      echo "skip(已是最新): ${name}"
      skipped=$((skipped + 1))
      continue
    else
      rm -rf "${dest}"
      cp -R "${src}" "${dest}"
      echo "update(已更新): ${name}"
      updated=$((updated + 1))
      continue
    fi
  fi

  # 目标不存在，直接复制
  cp -R "${src}" "${dest}"
  echo "copy: ${name}"
  created=$((created + 1))
done

echo "完成: 新建 ${created}，更新 ${updated}，跳过 ${skipped}，冲突 ${conflicts}"

if ((conflicts > 0)); then
  exit 1
fi
