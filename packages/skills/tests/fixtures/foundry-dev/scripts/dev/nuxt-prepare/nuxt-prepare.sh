#!/usr/bin/env bash
# nuxt-prepare.sh — scripts/dev 入口（挂载形态：nuxt:prepare 生命周期）
# 契约: specs/agent-config/003-scripted-skill-install/contracts/nuxt-prepare.md
#
# 用法:
#   pnpm nuxt:prepare                              # 从仓库根（= 挂载行本身）
#   bash scripts/dev/nuxt-prepare/nuxt-prepare.sh  # 直跑入口（与挂载行同一脚本）
#
# 挂载方式（根 package.json 唯一挂载行，app 侧零改动）:
#   "nuxt:prepare": "bash scripts/dev/nuxt-prepare/nuxt-prepare.sh"
#
# 行为（两阶段编排，入口定位为「初始化编排器」）:
#   1. 主干: 扫描 apps/*/package.json，发现所有声明了 nuxt:prepare 的 Nuxt 主包，
#      用 pnpm --filter ./apps/<app> run nuxt:prepare 逐个执行其 prepare；
#      任一失败不跳过后续主包，末尾汇总点名并 exit 1，不执行动作清单。
#   2. 动作（ACTIONS）: 主干全部成功后按序执行动作清单（actions/ 行为脚本）；
#      不因前一脚本非零而跳过后续；末尾汇总，任一非零则点名失败脚本并 exit 1。
#   新增动作 = actions/ 新增行为脚本目录 + 在下方 ACTIONS 登记一行；
#   新增挂载形态 = scripts/dev/ 根新增一个平级入口目录。

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# 动作编排清单（相对 scripts/dev 的路径，执行顺序即声明顺序）：
# 开源 skill 安装在前，自定义 skill 复制在后，speckit 钩子注册收尾
ACTIONS=(
  "actions/install-opensource-skills/install-opensource-skills.sh"
  "actions/link-skills/link-skills.sh"
  "actions/register-hooks/register-hooks.sh"
)

# —— 第一阶段：主干（遍历 apps/* 主包逐个执行 nuxt:prepare）——
main_failed=()
for pkg in "${REPO_ROOT}"/apps/*/package.json; do
  [ -f "$pkg" ] || continue
  grep -q '"nuxt:prepare"[[:space:]]*:' "$pkg" || continue
  app="$(basename "$(dirname "$pkg")")"
  echo "==> nuxt-prepare 主干: apps/${app}"
  if ! (cd "$REPO_ROOT" && pnpm --filter "./apps/${app}" run nuxt:prepare); then
    main_failed+=("apps/${app}")
  fi
  echo ""
done

if ((${#main_failed[@]} > 0)); then
  echo "==> nuxt-prepare 汇总: ${#main_failed[@]} 个主包 prepare 失败（不执行动作清单）:" >&2
  for app in "${main_failed[@]}"; do
    echo "  - ${app}" >&2
  done
  exit 1
fi

# —— 第二阶段：动作清单 ——
failed=()
for rel in "${ACTIONS[@]}"; do
  echo "==> nuxt-prepare: ${rel}"
  if ! bash "${SCRIPT_DIR}/../${rel}"; then
    failed+=("${rel}")
  fi
  echo ""
done

if ((${#failed[@]} > 0)); then
  echo "==> nuxt-prepare 汇总: ${#failed[@]} 个动作失败:" >&2
  for rel in "${failed[@]}"; do
    echo "  - ${rel}" >&2
  done
  exit 1
fi

# 前三项全部成功后，一次性重新安装全部五个协作指令。
echo "==> nuxt-prepare: register-commands"
if ! bash "$REPO_ROOT/packages/skills/script/register-commands/register-commands.sh" \
    --project "$REPO_ROOT" --skills-dir "$REPO_ROOT/.agents/skills"; then
  echo "协作指令安装失败" >&2
  exit 1
fi

echo "==> nuxt-prepare 汇总: 全部成功"
