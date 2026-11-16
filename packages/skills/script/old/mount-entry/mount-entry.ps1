# T005 独立第二步：原生 PowerShell 核验，不转发到 Node/Python。
#requires -Version 7.4
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$exitCode = 0
$reasonCode = 'runtime'
$message = ''
$installation = 'not-run'
$hooks = 'not-run'
$commands = 'not-run'
$verified = [System.Collections.Generic.List[object]]::new()
$missing = @()
$retry = @()
$version = ''
$source = ''
$sourceDirectory = ''
$agent = ''
$installedRoot = ''
$project = ''
$globalScope = $false
$noMount = $false
$helpRequested = $false
$catalogDigest = ''
$names = [System.Collections.Generic.List[string]]::new()

function Stop-Mount([int] $Code, [string] $Reason, [string] $Detail) {
    $script:exitCode = $Code
    $script:reasonCode = $Reason
    $script:message = $Detail
    throw $Detail
}

# 拒绝目录链重解析点，不把链接解析后的位置当成原始安装路径。
function Test-DirectoryChain([string] $Directory) {
    if (![System.IO.Path]::IsPathFullyQualified($Directory) -or $Directory -match '[\x00-\x1f\x7f]' -or $Directory -match '(^|[\\/])\.{1,2}([\\/]|$)') { return $false }
    $current = [System.IO.DirectoryInfo]::new($Directory)
    while ($null -ne $current) {
        if (!$current.Exists -or ($current.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) { return $false }
        $current = $current.Parent
    }
    return $true
}

function Test-SafeRelativePath([object] $Value) {
    return ($Value -is [string] -and $Value.Length -gt 0 -and $Value -notmatch '[\\\x00-\x1f\x7f:]' -and !($Value.StartsWith('/')) -and $Value -notmatch '(^|/)\.{0,2}(/|$)')
}

function Test-FileRecord([string] $File, [object] $Record) {
    if (!(Test-Path -LiteralPath $File -PathType Leaf)) { return $false }
    $item = Get-Item -LiteralPath $File -Force
    if (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -or $item.Length -ne $Record['bytes']) { return $false }
    return (Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $Record['sha256']
}

# HTTP 跳转逐次检查，保持默认 TLS 校验，避免降级到明文来源。
function Read-Release([string] $Url) {
    $handler = [System.Net.Http.HttpClientHandler]::new()
    $handler.AllowAutoRedirect = $false
    $client = [System.Net.Http.HttpClient]::new($handler)
    try {
        $timeoutSeconds = 30
        if ($env:FOUNDRY_DOWNLOAD_TIMEOUT) {
            if ($env:FOUNDRY_DOWNLOAD_TIMEOUT -notmatch '^[1-9][0-9]*$') { Stop-Mount 2 'arguments' 'FOUNDRY_DOWNLOAD_TIMEOUT 必须为正整数秒数' }
            $timeoutSeconds = [int]$env:FOUNDRY_DOWNLOAD_TIMEOUT
        }
        $client.Timeout = [TimeSpan]::FromSeconds($timeoutSeconds)
        $uri = [Uri]::new($Url)
        for ($redirect = 0; $redirect -le 10; $redirect++) {
            if ($uri.Scheme -ne 'https' -or $uri.UserInfo) { Stop-Mount 1 'download' '拒绝非 HTTPS 或带认证信息的来源跳转' }
            $response = $client.GetAsync($uri).GetAwaiter().GetResult()
            try {
                if ([int]$response.StatusCode -in @(301, 302, 303, 307, 308)) {
                    if (!$response.Headers.Location) { Stop-Mount 1 'download' '跳转缺少 Location' }
                    $uri = [Uri]::new($uri, $response.Headers.Location)
                    continue
                }
                [void]$response.EnsureSuccessStatusCode()
                return ,($response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult())
            }
            finally { $response.Dispose() }
        }
        Stop-Mount 1 'download' '来源跳转次数过多'
    }
    finally { $client.Dispose() }
}

function Invoke-Mount([string[]] $Arguments) {
    $seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    for ($index = 0; $index -lt $Arguments.Count; $index++) {
        $key = $Arguments[$index]
        if ($key -in @('--help', '-h')) { $script:helpRequested = $true; return }
        if ($key -ne '--skill' -and !$seen.Add($key)) { Stop-Mount 2 'arguments' "重复参数：$key" }
        if ($key -eq '--global') { $script:globalScope = $true; continue }
        if ($key -eq '--no-mount') { $script:noMount = $true; continue }
        if ($key -notin @('--source', '--source-dir', '--version', '--agent', '--installed-root', '--project', '--skill')) { Stop-Mount 2 'arguments' "未知或本 MVU 尚未支持的参数：$key" }
        if ($index + 1 -ge $Arguments.Count -or !$Arguments[$index + 1] -or $Arguments[$index + 1].StartsWith('--')) { Stop-Mount 2 'arguments' "参数缺值：$key" }
        $index++
        $value = $Arguments[$index]
        switch ($key) {
            '--source' { $script:source = $value.TrimEnd('/') }
            '--source-dir' { $script:sourceDirectory = $value }
            '--version' { $script:version = $value }
            '--agent' { $script:agent = $value }
            '--installed-root' { $script:installedRoot = $value }
            '--project' { $script:project = $value }
            '--skill' { if (!$names.Contains($value)) { $names.Add($value) } }
        }
    }
    if ($version -notmatch '^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$' -or $agent -cne 'codex' -or !$names.Count) { Stop-Mount 2 'arguments' '必须提供明确版本、--agent codex 和显式 --skill；其他 agent/投影留待后续增量' }
    if ([bool]$source -eq [bool]$sourceDirectory) { Stop-Mount 2 'arguments' '--source 与 --source-dir 必须且只能提供一个' }
    foreach ($name in $names) {
        if ($name -cnotmatch '^[a-z0-9]+(-[a-z0-9]+)*$') { Stop-Mount 2 'arguments' "技能名无效：$name" }
    }
    if ($source) {
        if ($source -notmatch '^https://[^/@?#\s]+/([^?#]*/)?[a-fA-F0-9]{40}(/[^?#]*)?$' -or $source -match '\s') { Stop-Mount 2 'arguments' '来源须为包含完整提交的 HTTPS 根 URL' }
        try { $bytes = Read-Release "$source/release.json" }
        catch { if ($script:exitCode -eq 0) { Stop-Mount 1 'download' "无法取得 release.json：$_" }; throw }
    }
    else {
        if (!(Test-DirectoryChain $sourceDirectory)) { Stop-Mount 2 'arguments' '本地来源须为无链接的有效绝对目录' }
        $manifest = Join-Path $sourceDirectory 'release.json'
        if (!(Test-Path -LiteralPath $manifest -PathType Leaf) -or ((Get-Item -LiteralPath $manifest -Force).Attributes -band [System.IO.FileAttributes]::ReparsePoint)) { Stop-Mount 2 'manifest' 'release.json 缺失或为链接' }
        $bytes = [System.IO.File]::ReadAllBytes($manifest)
    }
    try { $release = [Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json -AsHashtable -Depth 100 }
    catch { Stop-Mount 2 'manifest' 'release.json 不是有效 JSON' }
    if ($release['schemaVersion'] -ne 1 -or $release['version'] -cne $version -or $release['sourceRevision'] -notmatch '^[a-fA-F0-9]{40}$' -or $release['files'] -isnot [array] -or !$release['files'].Count -or $release['skills'] -isnot [array] -or !$release['skills'].Count) { Stop-Mount 2 'manifest' '版本或清单结构不合法' }
    $fileMap = [System.Collections.Generic.Dictionary[string, object]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($file in $release['files']) {
        if (!(Test-SafeRelativePath $file['path']) -or $file['bytes'] -isnot [long] -or $file['bytes'] -lt 0 -or $file['sha256'] -cnotmatch '^[a-f0-9]{64}$' -or $fileMap.ContainsKey($file['path'])) { Stop-Mount 2 'manifest' '文件路径、长度、摘要或唯一性不合法' }
        $fileMap.Add($file['path'], $file)
    }
    $skillMap = [System.Collections.Generic.Dictionary[string, object]]::new([StringComparer]::Ordinal)
    foreach ($skill in $release['skills']) {
        $name = $skill['name']
        if ($name -isnot [string] -or $name -cnotmatch '^[a-z0-9]+(-[a-z0-9]+)*$' -or $skillMap.ContainsKey($name) -or $skill['category'] -cnotin @('coding', 'frontend', 'workflow') -or $skill['directory'] -cne "skills/$($skill['category'])/$name" -or $skill['requiresSkills'] -isnot [array] -or $skill['requiresSkills'].Count -or $skill['sourceFiles'] -isnot [array] -or !$skill['sourceFiles'].Count) { Stop-Mount 2 'manifest' '技能声明不合法' }
        $sourceFiles = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
        foreach ($file in $skill['sourceFiles']) {
            if (!(Test-SafeRelativePath $file) -or !$file.StartsWith($skill['directory'] + '/', [StringComparison]::Ordinal) -or !$sourceFiles.Add($file) -or !$fileMap.ContainsKey($file) -or $fileMap[$file]['path'] -cne $file) { Stop-Mount 2 'manifest' '技能附件声明不合法' }
        }
        if (!$sourceFiles.Contains($skill['directory'] + '/SKILL.md')) { Stop-Mount 2 'manifest' '技能缺少 SKILL.md 声明' }
        foreach ($file in $release['files']) {
            if ($file['path'].StartsWith($skill['directory'] + '/', [StringComparison]::Ordinal) -and !$sourceFiles.Contains($file['path'])) { Stop-Mount 2 'manifest' '技能文件全集与清单不一致' }
        }
        $skillMap.Add($name, $skill)
    }
    $script:catalogDigest = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
    if (!(Test-DirectoryChain $PSScriptRoot)) { Stop-Mount 2 'integrity' '公共入口目录含链接' }
    foreach ($file in @('mount-entry.sh', 'mount-entry.ps1')) {
        $key = "script/mount-entry/$file"
        if (!$fileMap.ContainsKey($key) -or !(Test-FileRecord (Join-Path $PSScriptRoot $file) $fileMap[$key])) { Stop-Mount 2 'integrity' "公共材料缺失或摘要不匹配：$file" }
    }
    $workflow = $false
    $hasMode = $false
    $modes = @('task-tutor', 'task-pair', 'task-review', 'task-explore', 'task-guide')
    foreach ($name in $names) {
        if (!$skillMap.ContainsKey($name)) { Stop-Mount 2 'selection' "未知技能：$name" }
        if ($skillMap[$name]['category'] -ceq 'workflow') { $workflow = $true }
        if ($name -cin $modes) { $hasMode = $true }
    }
    $cwd = (Get-Location).ProviderPath
    if ($globalScope) {
        $userDirectory = if ($IsWindows) { $env:USERPROFILE } else { $env:HOME }
        $expectedRoot = Join-Path $userDirectory '.agents/skills'
    }
    else {
        $expectedRoot = Join-Path $cwd '.agents/skills'
        if ($project -and $project -cne $cwd) { Stop-Mount 2 'arguments' '项目级 --project 必须等于当前目录' }
        $script:project = $cwd
    }
    if (![System.IO.Path]::IsPathFullyQualified($installedRoot) -or $installedRoot.TrimEnd([char[]]'\/') -cne $expectedRoot.TrimEnd([char[]]'\/') -or !(Test-DirectoryChain $installedRoot)) { Stop-Mount 2 'path' 'installed-root 不符合当前 agent/scope 的实际安装位置，或目录链含链接' }
    $invalid = $false
    foreach ($name in $names) {
        $skill = $skillMap[$name]
        $directory = Join-Path $installedRoot $name
        # 单项读盘异常属于该技能失败，不能中断其余显式选择的核验和报告。
        $valid = $false
        try {
            $valid = Test-DirectoryChain $directory
            if ($valid) {
                $actual = @(Get-ChildItem -LiteralPath $directory -Force -Recurse)
                if (@($actual | Where-Object { $_.Attributes -band [System.IO.FileAttributes]::ReparsePoint }).Count -or @($actual | Where-Object { !$_.PSIsContainer }).Count -ne $skill['sourceFiles'].Count) { $valid = $false }
            }
            foreach ($file in $skill['sourceFiles']) {
                if (!$valid) { break }
                $relative = $file.Substring($skill['directory'].Length + 1)
                if (!(Test-FileRecord (Join-Path $directory $relative) $fileMap[$file])) { $valid = $false }
            }
        }
        catch {
            $valid = $false
            [Console]::Error.WriteLine("技能文件核验失败：$name；$_")
        }
        if ($valid) { $verified.Add(@{ name = $name; status = 'verified' }) }
        else { $invalid = $true; $verified.Add(@{ name = $name; status = 'failed'; reasonCode = 'integrity' }) }
    }
    if ($invalid) { $script:installation = 'failed'; Stop-Mount 1 'integrity' '本次选择有未通过文件全集和摘要核验的技能；不执行挂载' }
    $script:installation = 'success'
    if ($noMount -or !$workflow) { $script:hooks = 'skipped'; $script:commands = 'skipped'; $script:message = '文件核验通过，挂载已关闭或不适用'; return }
    if (!$project) {
        $script:hooks = 'failed'
        $script:retry = @('使用相同版本、来源、选择和 installed-root 重试，并补传 --project <绝对项目目录>')
        Stop-Mount 2 'project' '全局技能安装核验成功；挂载缺少明确的 --project'
    }
    if (!(Test-DirectoryChain $project)) { $script:hooks = 'failed'; Stop-Mount 2 'project' '挂载项目路径不存在或含链接' }
    if (!(Test-Path -LiteralPath (Join-Path $project '.specify') -PathType Container)) { $script:hooks = 'skipped'; $script:commands = 'skipped'; $script:message = '非 Spec Kit 项目，跳过原生挂载'; return }
    if ($hasMode) {
        $script:missing = @($modes | Where-Object { !$names.Contains($_) })
        if ($missing.Count) {
            $script:commands = 'failed'
            $script:retry = @('显式补齐全部五项选择并安装同版完整文件后重试；本入口不补装技能')
            Stop-Mount 2 'selection' '安装核验成功；五指令挂载缺少本次显式选择，详见 commands.missingSkills'
        }
    }
    $script:retry = @('原生 hooks/commands 调用尚待 T006 接通；当前只完成文件与前置条件核验')
    Stop-Mount 2 'unsupported' '安装核验成功；原生挂载尚未接通，未执行任何注册'
}

try { Invoke-Mount $args }
catch {
    if ($exitCode -eq 0) { $exitCode = 1; $message = "文件或运行前置检查失败：$_" }
    [Console]::Error.WriteLine($message)
}
finally {
    if ($helpRequested) {
        Write-Output '用法：mount-entry.ps1 (--source <固定提交HTTPS根URL> | --source-dir <绝对目录>) --version <版本> --agent codex --installed-root <绝对目录> --skill <名称> [--skill <名称>] [--global] [--project <绝对目录>] [--no-mount]'
    }
    else {
        $successful = @($verified | Where-Object { $_.status -eq 'verified' } | ForEach-Object { $_.name })
        @{
            schemaVersion = 1
            overall = $(if ($exitCode -eq 0) { 'success' } elseif ($successful.Count) { 'partial' } else { 'failed' })
            resolvedRelease = @{ version = $version; source = $(if ($source) { $source } else { $sourceDirectory }); catalogDigest = $catalogDigest }
            skills = @($verified.ToArray())
            verifiedSkills = $successful
            reasonCode = $(if ($exitCode -eq 0) { $null } else { $reasonCode })
            message = $message
            stages = @{ installation = @{ status = $installation }; hidden = @{ status = 'skipped' }; hooks = @{ status = $hooks }; commands = @{ status = $commands; missingSkills = $missing } }
            retry = $retry
            coverageLimits = @('MVU-C 当前只核验 Codex 原始目录投影；原生挂载由 T006 接通')
        } | ConvertTo-Json -Depth 20 -Compress | Write-Output
    }
}
exit $exitCode
