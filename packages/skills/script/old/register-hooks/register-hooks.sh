#!/usr/bin/env bash
# Bash 两模块复用同版工具与保护逻辑，不新增 Node/Python 安装核心。
set -euo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../register-commands/register-commands.sh"
fr_register hooks "$@"
