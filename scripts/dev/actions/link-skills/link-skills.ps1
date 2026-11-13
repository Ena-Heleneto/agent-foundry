# link-skills.ps1 — 将 skill 源目录下的每个子目录复制到目标 skills 目录
# （PowerShell 实现，行为与退出码和 link-skills.sh 一致）
#
# 用法:
#   pwsh scripts/dev/actions/link-skills/link-skills.ps1 [源目录] [目标目录]
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

param([string]$SourceDir, [string]$TargetDir)

$ErrorActionPreference = 'Stop'

# 返回目录树中各条目的相对路径与文件校验和，用于比较复制内容。
function Get-DirectoryEntries([string]$Directory) {
  Get-ChildItem -LiteralPath $Directory -Recurse -Force | ForEach-Object {
    $relative = [System.IO.Path]::GetRelativePath($Directory, $_.FullName)
    if ($_.PSIsContainer) {
      "D:$relative"
    } else {
      "F:${relative}:$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash)"
    }
  } | Sort-Object -CaseSensitive
}

# 对比完整目录树；空目录也参与比较。
function Test-DirectoriesEqual([string]$Source, [string]$Destination) {
  return ((Get-DirectoryEntries $Source) -join "`n") -ceq ((Get-DirectoryEntries $Destination) -join "`n")
}

# 替换目标本身，避免修改旧软链接指向的源目录。
function Copy-DirectoryContent([string]$Source, [string]$Destination) {
  $item = Get-Item -LiteralPath $Destination -Force -ErrorAction SilentlyContinue
  if ($item) {
    if ($item.LinkType -eq 'SymbolicLink') {
      Remove-Item -LiteralPath $Destination -Force
    } else {
      Remove-Item -LiteralPath $Destination -Recurse -Force
    }
  }
  Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
}

if ($args.Count -ge 1) {
  [Console]::Error.WriteLine("warn: 第三参数（gitignore 文件）已废弃，传入值将被忽略: $($args[0])")
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $ScriptDir '../../../..'))

if (-not $SourceDir) { $SourceDir = Join-Path $RepoRoot 'packages/skills/src' }
if (-not $TargetDir) { $TargetDir = Join-Path $RepoRoot '.agents/skills' }

if (-not (Test-Path $SourceDir -PathType Container)) {
  [Console]::Error.WriteLine("error: 源目录不存在: $SourceDir")
  exit 1
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

$created = 0
$updated = 0
$skipped = 0
$conflicts = 0

# 收集 skill 目录：一级子目录含 SKILL.md 的兼容旧布局；否则视为分类目录，
# 取其下含 SKILL.md 的二级子目录（按 skill 目录名在目标目录铺平）
$skillDirs = @()
foreach ($entry in (Get-ChildItem -Path $SourceDir -Directory)) {
  if (Test-Path (Join-Path $entry.FullName 'SKILL.md')) {
    $skillDirs += $entry
    continue
  }
  foreach ($sub in (Get-ChildItem -Path $entry.FullName -Directory)) {
    if (Test-Path (Join-Path $sub.FullName 'SKILL.md')) {
      $skillDirs += $sub
    }
  }
}

foreach ($src in $skillDirs) {
  $name = $src.Name
  $dest = Join-Path $TargetDir $name

  $destItem = Get-Item -Path $dest -Force -ErrorAction SilentlyContinue
  if ($destItem -and $destItem.LinkType -eq 'SymbolicLink') {
    Copy-DirectoryContent $src.FullName $dest
    [Console]::WriteLine("copy(覆盖软链): $name")
    $created += 1
    continue
  }

  if (Test-Path $dest -PathType Leaf) {
    [Console]::Error.WriteLine("conflict(目标已存在同名非目录实体): $name")
    $conflicts += 1
    continue
  }

  if (Test-Path $dest -PathType Container) {
    if (Test-DirectoriesEqual $src.FullName $dest) {
      [Console]::WriteLine("skip(已是最新): $name")
      $skipped += 1
      continue
    } else {
      Copy-DirectoryContent $src.FullName $dest
      [Console]::WriteLine("update(已更新): $name")
      $updated += 1
      continue
    }
  }

  Copy-DirectoryContent $src.FullName $dest
  [Console]::WriteLine("copy: $name")
  $created += 1
}

[Console]::WriteLine("完成: 新建 $created，更新 $updated，跳过 $skipped，冲突 $conflicts")

if ($conflicts -gt 0) {
  exit 1
}
