# 官方预检仅使用现成 PowerShell/.NET 能力；安装骨架仍保留原先的平台边界。
if ($args -notcontains '--check' -and $args -notcontains '--official') {
  [Console]::Error.WriteLine('T004 当前仅支持 Linux；PowerShell 安装尚未实现和验证。')
  exit 2
}
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Stop-Preflight([string] $Reason, [string] $Message) {
  throw [System.InvalidOperationException]::new("${Reason}:$Message")
}

# 绝对路径逐层拒绝重解析点，避免通过父目录链接读取其他位置。
function Assert-PreflightDirectory([string] $Directory) {
  if (-not [IO.Path]::IsPathFullyQualified($Directory) -or $Directory -match '[\x00-\x1f\x7f]' -or $Directory -match '(^|[\\/])\.{1,2}([\\/]|$)') {
    Stop-Preflight arguments "必须使用无越界分量的绝对路径：$Directory"
  }
  $root = [IO.Path]::GetPathRoot($Directory)
  $cursor = $root
  foreach ($part in $Directory.Substring($root.Length).Split([char[]]@('/', '\'), [StringSplitOptions]::RemoveEmptyEntries)) {
    $cursor = Join-Path $cursor $part
    $entry = Get-Item -LiteralPath $cursor -Force -ErrorAction SilentlyContinue
    if ($null -ne $entry) {
      if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { Stop-Preflight conflict "目录链包含链接：$cursor" }
      if (-not $entry.PSIsContainer) { Stop-Preflight conflict "目录链包含非目录：$cursor" }
    }
  }
}

function Test-PreflightRelative([object] $Relative) {
  return $Relative -is [string] -and $Relative.Length -gt 0 -and $Relative -notmatch '[\\:\x00-\x1f\x7f]' -and $Relative -notmatch '(^|/)(\.{1,2}|)(/|$)' -and -not $Relative.StartsWith('/')
}

function Assert-PreflightStrings([object] $Values, [string] $Field) {
  if ($Values -isnot [array]) { Stop-Preflight manifest "清单数组字段无效：$Field" }
  $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($value in $Values) {
    if ($value -isnot [string] -or -not $value.Trim() -or -not $seen.Add($value)) { Stop-Preflight manifest "清单数组元素无效：$Field" }
  }
}

# HTTPS 响应只保留内存，手动检查每次重定向的协议及凭据。
function Read-PreflightFile([string] $Relative) {
  if (-not (Test-PreflightRelative $Relative)) { Stop-Preflight manifest "来源相对路径无效：$Relative" }
  if ($source) {
    $encoded = (($Relative.Split('/') | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/')
    $uri = [Uri]::new("$source/$encoded")
    $handler = [Net.Http.HttpClientHandler]::new()
    $handler.AllowAutoRedirect = $false
    $client = [Net.Http.HttpClient]::new($handler)
    $timeout = 30
    if ($env:FOUNDRY_DOWNLOAD_TIMEOUT) {
      if ($env:FOUNDRY_DOWNLOAD_TIMEOUT -notmatch '^[1-9][0-9]*$') { Stop-Preflight arguments 'FOUNDRY_DOWNLOAD_TIMEOUT 必须为正整数' }
      $timeout = [int]$env:FOUNDRY_DOWNLOAD_TIMEOUT
    }
    $client.Timeout = [TimeSpan]::FromSeconds($timeout)
    try {
      for ($redirect = 0; $redirect -le 10; $redirect++) {
        if ($uri.Scheme -ne 'https' -or $uri.UserInfo) { Stop-Preflight source '拒绝非 HTTPS 或携带凭据的来源重定向' }
        $response = $client.GetAsync($uri).GetAwaiter().GetResult()
        try {
          if ([int]$response.StatusCode -ge 300 -and [int]$response.StatusCode -lt 400) {
            if ($null -eq $response.Headers.Location) { Stop-Preflight source '重定向缺少 Location' }
            $uri = [Uri]::new($uri, $response.Headers.Location)
            continue
          }
          $null = $response.EnsureSuccessStatusCode()
          return ,$response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
        } finally { $response.Dispose() }
      }
      Stop-Preflight source '来源重定向次数过多'
    } finally { $client.Dispose(); $handler.Dispose() }
  }
  $file = Join-Path $sourceRoot $Relative
  Assert-PreflightDirectory ([IO.Path]::GetDirectoryName($file))
  $entry = Get-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
  if ($null -eq $entry -or $entry.PSIsContainer -or ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { Stop-Preflight source "来源普通文件缺失：$Relative" }
  return ,[IO.File]::ReadAllBytes($file)
}

function Assert-PreflightBytes([byte[]] $Data, [object] $Entry) {
  $hash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($Data)).ToLowerInvariant()
  if ($Data.LongLength -ne $Entry.bytes -or $hash -cne $Entry.sha256) { Stop-Preflight integrity "来源或目标摘要、长度不一致：$($Entry.path)" }
}

# Git 仅查消费目录，清除可将索引或对象目录重定向到别处的继承变量。
function Invoke-PreflightGit([string] $Directory, [string[]] $GitArgs) {
  $start = [Diagnostics.ProcessStartInfo]::new('git')
  $start.UseShellExecute = $false
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  foreach ($key in @($start.Environment.Keys)) {
    if ($key.StartsWith('GIT_') -and $key -notin @('GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM', 'GIT_CEILING_DIRECTORIES')) { $null = $start.Environment.Remove($key) }
  }
  foreach ($argument in @('--no-optional-locks', '--literal-pathspecs', '-C', $Directory) + $GitArgs) { $start.ArgumentList.Add($argument) }
  $process = [Diagnostics.Process]::Start($start)
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  $result = @{ status = $process.ExitCode; stdout = $stdout; stderr = $stderr }
  $process.Dispose()
  return $result
}

try {
  $source = ''; $localSource = ''; $version = ''; $agent = ''; $category = ''; $mode = ''; $scope = 'project'; $projectArgument = ''
  $check = $false; $official = $false
  $requested = [Collections.Generic.List[string]]::new()
  for ($index = 0; $index -lt $args.Count; $index++) {
    $option = $args[$index]
    switch ($option) {
      '--check' { if ($check) { Stop-Preflight arguments '重复 --check' }; $check = $true; continue }
      '--official' { if ($official) { Stop-Preflight arguments '重复 --official' }; $official = $true; continue }
      '--global' { if ($scope -eq 'global') { Stop-Preflight arguments '重复 --global' }; $scope = 'global'; continue }
      '--all' { if ($mode) { Stop-Preflight selection '选择不能混用，只能使用 all、category、skill 之一' }; $mode = 'all'; continue }
      { $_ -in @('--source', '--source-dir', '--version', '--agent', '--category', '--skill', '--project') } {
        if ($index + 1 -ge $args.Count -or -not $args[$index + 1] -or $args[$index + 1].StartsWith('--')) { Stop-Preflight arguments "参数缺值或名称为空：$option" }
        $index++; $value = $args[$index]
        switch ($option) {
          '--source' { if ($source) { Stop-Preflight arguments '重复 --source' }; $source = $value.TrimEnd('/') }
          '--source-dir' { if ($localSource) { Stop-Preflight arguments '重复 --source-dir' }; $localSource = $value }
          '--version' { if ($version) { Stop-Preflight arguments '重复 --version' }; $version = $value }
          '--agent' { if ($agent) { Stop-Preflight arguments '每次只能选择一个 agent' }; $agent = $value }
          '--project' { if ($projectArgument) { Stop-Preflight arguments '重复 --project' }; $projectArgument = $value }
          '--category' { if ($mode) { Stop-Preflight selection '选择不能混用，只能使用 all、category、skill 之一' }; $mode = 'category'; $category = $value }
          '--skill' { if ($mode -and $mode -ne 'skill') { Stop-Preflight selection '选择不能混用，只能使用 all、category、skill 之一' }; $mode = 'skill'; $requested.Add($value) }
        }
        continue
      }
      default { Stop-Preflight arguments "官方预检不支持参数：$option" }
    }
  }
  if (-not $check -or -not $official) { Stop-Preflight arguments '--check 与 --official 必须同时提供' }
  if (-not $version) { Stop-Preflight arguments '必须提供 --version 精确版本' }
  if ($version -notmatch '^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$') { Stop-Preflight arguments '版本格式无效' }
  if ([bool]$source -eq [bool]$localSource) { Stop-Preflight arguments '--source 与 --source-dir 必须且只能提供一个' }
  if (-not $mode) { Stop-Preflight selection '必须选择 --all、--category 或 --skill' }
  if (-not $agent) { Stop-Preflight arguments '必须提供一个 --agent' }
  if ($category -eq 'eval') { Stop-Preflight selection '内部 eval 分类不可选择' }
  if ($mode -eq 'category' -and $category -notin @('coding', 'frontend', 'workflow')) { Stop-Preflight selection "未知公开分类：$category" }
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Stop-Preflight prerequisite '缺少只读预检工具：git' }
  if ($source) {
    if ($source -notmatch '^https://[^/@?#]+/([^?#]*/)?[0-9a-fA-F]{40}(/[^?#]*)?$' -or $source -match '\s') { Stop-Preflight arguments '来源必须是携带完整提交的 HTTPS 根 URL' }
    $sourceRoot = $source
  } else {
    Assert-PreflightDirectory $localSource
    if (-not (Test-Path -LiteralPath $localSource -PathType Container)) { Stop-Preflight arguments '本地来源目录不存在' }
    $sourceRoot = [IO.Path]::GetFullPath($localSource).TrimEnd([char[]]@('/', '\'))
  }
  $release = [Text.Encoding]::UTF8.GetString((Read-PreflightFile 'release.json')) | ConvertFrom-Json -AsHashtable
  if ($release.schemaVersion -ne 1 -or $release.version -cne $version -or $release.sourceRevision -notmatch '^[a-fA-F0-9]{40}$' -or $release.tools.skills -ne 'latest' -or -not $release.skills.Count -or -not $release.files.Count) { Stop-Preflight manifest '版本不匹配或 release.json 清单结构无效' }
  foreach ($fixed in @{ specify = '1.2.6'; node = '>=22.20.0'; bash = '>=3.2'; powershell = '>=7.4' }.GetEnumerator()) {
    if ($release.tools[$fixed.Key] -cne $fixed.Value) { Stop-Preflight manifest "清单工具版本无效：$($fixed.Key)" }
  }
  if ($release.tools.npm -isnot [string] -or $release.tools.npm -notmatch '^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$' -or ($release.ContainsKey('development') -and $release.development -isnot [bool])) { Stop-Preflight manifest '清单工具或 development 字段无效' }
  $files = @{}
  foreach ($file in $release.files) {
    if (-not (Test-PreflightRelative $file.path) -or $files.ContainsKey($file.path) -or $file.bytes -lt 0 -or [Math]::Floor($file.bytes) -ne $file.bytes -or $file.sha256 -cnotmatch '^[a-f0-9]{64}$') { Stop-Preflight manifest '清单文件路径、长度或摘要无效' }
    $files[$file.path] = $file
  }
  $skills = @{}
  foreach ($skill in $release.skills) {
    foreach ($field in @('sourceFiles', 'requiresSkills', 'projectPrerequisites', 'mountMappingIds')) { Assert-PreflightStrings $skill[$field] "skills.$field" }
    if ($skill.name -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$' -or $skills.ContainsKey($skill.name) -or $skill.category -notin @('coding', 'frontend', 'workflow') -or $skill.directory -cne "skills/$($skill.category)/$($skill.name)" -or -not $skill.sourceFiles.Count -or $skill.sourceFiles -cnotcontains "$($skill.directory)/SKILL.md") { Stop-Preflight manifest '技能身份、目录或文件集合无效' }
    $seen = @{}
    foreach ($file in $skill.sourceFiles) {
      if (-not $files.ContainsKey($file) -or -not $file.StartsWith("$($skill.directory)/", [StringComparison]::Ordinal) -or $seen.ContainsKey($file)) { Stop-Preflight manifest "技能源文件无效：$file" }
      $seen[$file] = $true
    }
    if (@($release.files | Where-Object { $_.path.StartsWith("$($skill.directory)/", [StringComparison]::Ordinal) }).Count -ne $skill.sourceFiles.Count) { Stop-Preflight manifest '技能源清单遗漏文件' }
    $skills[$skill.name] = $skill
  }
  foreach ($skill in $release.skills) {
    foreach ($dependency in $skill.requiresSkills) { if (-not $skills.ContainsKey($dependency)) { Stop-Preflight manifest "依赖不在发布清单内：$dependency" } }
  }
  if ($release.projections -isnot [Collections.IDictionary] -or @($release.projections.Keys).Count -ne 2) { Stop-Preflight manifest '清单投影格式无效' }
  foreach ($projectionId in @('identity', 'eve-frontmatter-v1')) {
    if (-not $release.projections.ContainsKey($projectionId) -or @($release.projections[$projectionId].Keys).Count -ne $skills.Count) { Stop-Preflight manifest '清单投影技能集合无效' }
    foreach ($skill in $release.skills) {
      if ($skill.installedFilesByProjection -isnot [Collections.IDictionary] -or @($skill.installedFilesByProjection.Keys).Count -ne 2) { Stop-Preflight manifest '安装投影格式无效' }
      Assert-PreflightStrings $skill.installedFilesByProjection[$projectionId] 'installedFilesByProjection'
      $sourceNames = @($skill.sourceFiles | ForEach-Object { $_.Substring($skill.directory.Length + 1) } | Sort-Object -CaseSensitive)
      $entries = @($release.projections[$projectionId][$skill.name])
      $entryNames = @($entries | ForEach-Object { $_.path } | Sort-Object -CaseSensitive)
      $installedNames = @($skill.installedFilesByProjection[$projectionId] | Sort-Object -CaseSensitive)
      if (($sourceNames | ConvertTo-Json -Compress) -cne ($entryNames | ConvertTo-Json -Compress) -or ($sourceNames | ConvertTo-Json -Compress) -cne ($installedNames | ConvertTo-Json -Compress)) { Stop-Preflight manifest "投影遗漏或多余附件：$($skill.name)" }
      foreach ($entry in $entries) {
        if (-not (Test-PreflightRelative $entry.path) -or -not (Test-PreflightRelative $entry.sourcePath) -or -not $files.ContainsKey($entry.sourcePath) -or $entry.bytes -ne $files[$entry.sourcePath].bytes -or $entry.sha256 -cne $files[$entry.sourcePath].sha256) { Stop-Preflight manifest '投影来源摘要不一致' }
        if ($projectionId -eq 'identity' -and $entry.sourcePath -cne "$($skill.directory)/$($entry.path)") { Stop-Preflight manifest 'identity 投影来源不同' }
        if ([IO.Path]::GetFileName($entry.path).ToLowerInvariant() -ne 'skill.md') {
          $original = $files["$($skill.directory)/$($entry.path)"]
          if ($null -eq $original -or $original.bytes -ne $entry.bytes -or $original.sha256 -cne $entry.sha256) { Stop-Preflight manifest '投影修改普通附件字节' }
        }
      }
    }
  }
  if ($release.adapters -isnot [array] -or -not $release.adapters.Count -or -not @($release.adapters | Where-Object { $_.path -ceq 'script/install-skills/read-agents.mjs' }).Count) { Stop-Preflight manifest '清单 adapters 缺少运行材料' }
  foreach ($adapter in $release.adapters) {
    if (-not $files.ContainsKey($adapter.path) -or $adapter.bytes -ne $files[$adapter.path].bytes -or $adapter.sha256 -cne $files[$adapter.path].sha256) { Stop-Preflight manifest 'adapter 来源摘要不一致' }
  }
  $selected = [Collections.Generic.List[string]]::new()
  if ($mode -eq 'skill') {
    foreach ($name in $requested) {
      if ($name -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$' -or -not $skills.ContainsKey($name) -or $skills[$name].name -cne $name) { Stop-Preflight selection "未知或内部技能不可选择：$name" }
      if (-not $selected.Contains($name)) { $selected.Add($name) }
    }
  } else {
    foreach ($skill in $release.skills) { if ($mode -eq 'all' -or $skill.category -ceq $category) { $selected.Add($skill.name) } }
  }
  if (-not $selected.Count) { Stop-Preflight selection "公开分类为空：$category" }
  foreach ($name in $selected) {
    foreach ($dependency in $skills[$name].requiresSkills) { if (-not $selected.Contains($dependency)) { Stop-Preflight dependency "选择缺少依赖，请显式补选：$dependency" } }
  }
  if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command tar -ErrorAction SilentlyContinue)) { Stop-Preflight prerequisite '在线 Agent 查询需要 Node 和 tar' }
  $catalogJson = & node (Join-Path $PSScriptRoot 'read-agents.mjs')
  if ($LASTEXITCODE -ne 0) { Stop-Preflight upstream '无法获取官方最新 Agent 规则，目标未写入' }
  $agents = $catalogJson | ConvertFrom-Json -AsHashtable
  $agentRecord = @($agents.agents | Where-Object { $_.name -ceq $agent })
  if ($agentRecord.Count -ne 1) { Stop-Preflight arguments "未知 agent：$agent" }
  $agentRecord = $agentRecord[0]
  $projection = $agentRecord.projection
  if ($projection -notin @('identity', 'eve-frontmatter-v1')) { Stop-Preflight manifest '未知安装投影' }
  $current = (Get-Location).ProviderPath
  if ($projectArgument -and -not [IO.Path]::IsPathFullyQualified($projectArgument)) { Stop-Preflight arguments '--project 必须使用绝对路径' }
  if ($scope -eq 'project') {
    if ($projectArgument -and $projectArgument -cne $current) { Stop-Preflight arguments '项目级目标始终为 cwd，--project 必须等于 cwd' }
    $targetRoot = $agentRecord.project
  } else {
    if ($null -eq $agentRecord.global) { Stop-Preflight arguments "agent 不支持 global scope：$agent" }
    $targetRoot = $agentRecord.global
  }
  Assert-PreflightDirectory $targetRoot
  $states = [Collections.Generic.List[object]]::new()
  $satisfied = $true
  foreach ($name in $selected) {
    $skill = $skills[$name]
    foreach ($sourceFile in $skill.sourceFiles) { Assert-PreflightBytes (Read-PreflightFile $sourceFile) $files[$sourceFile] }
    if (-not $source) {
      $sourceDirectory = Join-Path $sourceRoot $skill.directory
      Assert-PreflightDirectory $sourceDirectory
      $sourceEntries = @(Get-ChildItem -LiteralPath $sourceDirectory -Force -Recurse)
      if (@($sourceEntries | Where-Object { ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 }).Count -or @($sourceEntries | Where-Object { -not $_.PSIsContainer }).Count -ne $skill.sourceFiles.Count) { Stop-Preflight source "来源实际文件全集与清单不一致：$name" }
    }
    if ($projection -eq 'identity') {
      $expected = @($skill.sourceFiles | ForEach-Object { @{ path = $_.Substring($skill.directory.Length + 1); sourcePath = $_; bytes = $files[$_].bytes; sha256 = $files[$_].sha256 } })
    } else { $expected = @($release.projections[$projection][$name]) }
    if (-not $expected.Count) { Stop-Preflight manifest "安装投影无效：$name" }
    $seen = @{}
    foreach ($entry in $expected) {
      if (-not (Test-PreflightRelative $entry.path) -or -not (Test-PreflightRelative $entry.sourcePath) -or $seen.ContainsKey($entry.path) -or -not $files.ContainsKey($entry.sourcePath) -or $entry.bytes -ne $files[$entry.sourcePath].bytes -or $entry.sha256 -cne $files[$entry.sourcePath].sha256) { Stop-Preflight manifest "安装投影来源无效：$name" }
      $seen[$entry.path] = $true
      Assert-PreflightBytes (Read-PreflightFile $entry.sourcePath) $entry
    }
    $target = Join-Path $targetRoot $name
    Assert-PreflightDirectory $target
    $probe = $targetRoot
    while (-not (Test-Path -LiteralPath $probe -PathType Container)) { $probe = [IO.Path]::GetDirectoryName($probe) }
    $repository = Invoke-PreflightGit $probe @('rev-parse', '--is-inside-work-tree')
    if ($repository.status -eq 0) {
      $tracked = Invoke-PreflightGit $probe @('ls-files', '--', $target)
      if ($tracked.status -ne 0 -or $tracked.stdout) { Stop-Preflight conflict "目标含 Git 已跟踪路径或索引不可读：$($tracked.stdout)" }
      $repositoryRoot = (Invoke-PreflightGit $probe @('rev-parse', '--show-toplevel')).stdout.Trim()
      $ancestor = $targetRoot
      while ($ancestor.StartsWith("$repositoryRoot$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::Ordinal)) {
        $ancestorTracked = Invoke-PreflightGit $repositoryRoot @('ls-files', '--', $ancestor)
        $relativeAncestor = [IO.Path]::GetRelativePath($repositoryRoot, $ancestor).Replace('\', '/')
        if ($ancestorTracked.status -ne 0 -or $ancestorTracked.stdout.TrimEnd("`r", "`n") -ceq $relativeAncestor) { Stop-Preflight conflict '目标祖先含 Git 已跟踪路径' }
        $ancestor = [IO.Path]::GetDirectoryName($ancestor)
      }
    } else {
      while ($probe -and $probe -ne [IO.Path]::GetPathRoot($probe)) {
        if ($env:GIT_CEILING_DIRECTORIES -and $probe -in $env:GIT_CEILING_DIRECTORIES.Split([IO.Path]::PathSeparator)) { break }
        if (Test-Path -LiteralPath (Join-Path $probe '.git')) { Stop-Preflight conflict '检测到 Git 项目但无法读取索引' }
        $probe = [IO.Path]::GetDirectoryName($probe)
      }
    }
    if (Test-Path -LiteralPath $target) {
      $actualFiles = @(Get-ChildItem -LiteralPath $target -Force -Recurse)
      foreach ($entry in $actualFiles) {
        if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { Stop-Preflight conflict "目标包含链接：$name" }
        if ($entry.PSIsContainer -and -not @(Get-ChildItem -LiteralPath $entry.FullName -Force).Count) { Stop-Preflight conflict "目标包含清单外空目录：$name" }
      }
      if (@($actualFiles | Where-Object { -not $_.PSIsContainer }).Count -ne $expected.Count) { Stop-Preflight conflict "目标文件集合与版本清单不一致：$name" }
      foreach ($entry in $expected) {
        $file = Join-Path $target $entry.path
        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { Stop-Preflight conflict "目标缺少普通文件：$name/$($entry.path)" }
        try { Assert-PreflightBytes ([IO.File]::ReadAllBytes($file)) $entry } catch { Stop-Preflight conflict "目标内容与版本清单不一致：$name/$($entry.path)" }
      }
      $status = 'satisfied'
    } else { $satisfied = $false; $status = 'absent' }
    $states.Add(@{ name = $name; status = $status; path = $target })
  }
  $officialArgs = [Collections.Generic.List[string]]::new()
  $officialArgs.Add("skills@$($agents.upstream.version)"); $officialArgs.Add('add')
  if ($mode -eq 'category') { $officialArgs.Add("$sourceRoot/skills/$category"); $officialArgs.Add('--skill'); foreach ($name in $selected) { $officialArgs.Add($name) } }
  elseif ($mode -eq 'all') { $officialArgs.Add($sourceRoot); $officialArgs.Add('--skill'); foreach ($name in $selected) { $officialArgs.Add($name) } }
  elseif ($selected.Count -eq 1) { $officialArgs.Add("$sourceRoot/$($skills[$selected[0]].directory)"); $officialArgs.Add('--skill'); $officialArgs.Add($selected[0]) }
  else { $officialArgs.Add($sourceRoot); $officialArgs.Add('--skill'); foreach ($name in $selected) { $officialArgs.Add($name) } }
  $officialArgs.Add('--agent'); $officialArgs.Add($agent); $officialArgs.Add('--copy')
  if ($scope -eq 'global') { $officialArgs.Add('--global') }
  @{ schemaVersion = 1; overall = 'success'; upstream = $agents.upstream; operation = 'official-check'; mode = 'official-preflight'; version = $version; source = $sourceRoot;
    selection = @{ mode = $mode; category = $(if ($category) { $category } else { $null }); names = @($selected.ToArray()) };
    target = @{ agent = $agent; scope = $scope; path = $targetRoot; projection = $projection }; skills = @($states.ToArray()); checkedSkills = @($states.ToArray());
    stages = @{ installation = @{ status = 'not-run' }; preflight = @{ status = 'success' } }; alreadySatisfied = $satisfied;
    recommendation = $(if ($satisfied) { 'skip' } else { 'install' }); official = @{ command = 'npx'; args = @($officialArgs.ToArray()) } } | ConvertTo-Json -Depth 20 -Compress
  exit 0
} catch {
  $diagnostic = $_.Exception.Message
  $reason = 'prerequisite'
  if ($diagnostic -match '^([a-z]+):(.*)$') { $reason = $Matches[1]; $diagnostic = $Matches[2] }
  [Console]::Error.WriteLine($diagnostic)
  @{ schemaVersion = 1; overall = 'failed'; reasonCode = $reason; message = $diagnostic; skills = @() } | ConvertTo-Json -Compress
  exit 2
}
