# 开发入口仅补齐工作区路径，实际操作使用对应平台的交付脚本。
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../../..')).Path
& (Join-Path $repoRoot 'packages/skills/script/register-hooks/register-hooks.ps1') --project $repoRoot --skills-dir (Join-Path $repoRoot '.agents/skills') @args
exit $LASTEXITCODE
