# 在 PowerShell 中准备七项 hooks 输入，由官方 CLI 完成登记与重装。
$ErrorActionPreference = 'Stop'
$projectDirectory = ''
$skillsDirectory = ''
$cliPath = ''
$temporaryDirectory = $null
$exitCode = 1
try {
    for ($index = 0; $index -lt $args.Count; $index++) {
        $option = [string]$args[$index]
        if ($option -in @('--help', '-h')) {
            [Console]::WriteLine('用法：register-hooks.ps1 --project <项目> --skills-dir <技能根> [--cli <specify>]')
            exit 0
        }
        $parts = $option.Split('=', 2)
        if ($parts[0] -notin @('--project', '--skills-dir', '--cli')) {
            [Console]::Error.WriteLine("未知参数：$option")
            exit 2
        }
        if ($parts.Count -eq 2) {
            $value = $parts[1]
        } else {
            $index++
            $value = if ($index -lt $args.Count) { [string]$args[$index] } else { '' }
        }
        if (-not $value -or $value.StartsWith('--')) {
            [Console]::Error.WriteLine("参数缺值：$option")
            exit 2
        }
        switch ($parts[0]) {
            '--project' { $projectDirectory = $value }
            '--skills-dir' { $skillsDirectory = $value }
            '--cli' { $cliPath = $value }
        }
    }
    if (-not $projectDirectory -or -not $skillsDirectory) {
        [Console]::Error.WriteLine('必须提供 --project 和 --skills-dir')
        exit 2
    }
    $projectDirectory = (Resolve-Path -LiteralPath $projectDirectory).ProviderPath
    $skillsDirectory = (Resolve-Path -LiteralPath $skillsDirectory).ProviderPath
    if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory '.specify/init-options.json') -PathType Leaf)) {
        throw '目标项目尚未初始化 Spec Kit'
    }
    $specifyVersion = if ($env:FOUNDRY_SPECIFY_VERSION) { $env:FOUNDRY_SPECIFY_VERSION } else { '1.2.6' }
    if ($specifyVersion -cnotmatch '^[0-9][0-9A-Za-z.+-]*$') {
        [Console]::Error.WriteLine('FOUNDRY_SPECIFY_VERSION 必须是明确版本号')
        exit 2
    }
    $hookIds = @('artifact-issue-description', 'artifact-pr-description', 'mvu-gate', 'artifact-business-flow', 'artifact-logic-flow', 'explainer-doc-sync', 'artifact-project-description')
    foreach ($hookId in $hookIds) {
        foreach ($required in @((Join-Path $skillsDirectory "$hookId/SKILL.md"), (Join-Path $skillsDirectory "$hookId/speckit-hooks.json"))) {
            if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { throw "缺少输入：$required" }
        }
    }
    $temporaryDirectory = Join-Path ([IO.Path]::GetTempPath()) ('foundry-hooks-' + [Guid]::NewGuid().ToString('N'))
    foreach ($hookId in $hookIds) {
        $inputDirectory = Join-Path $temporaryDirectory $hookId
        New-Item -ItemType Directory -Path (Join-Path $inputDirectory 'skills') | Out-Null
        Copy-Item -LiteralPath (Join-Path $skillsDirectory $hookId) -Destination (Join-Path $inputDirectory "skills/$hookId") -Recurse
        $manifest = [ordered]@{
            schema_version = '1.0'
            extension = @{ id = $hookId; name = $hookId; version = '1.0.0'; description = 'Foundry workflow hook' }
            requires = @{ speckit_version = "==$specifyVersion" }
            provides = @{}
            hooks = Get-Content -LiteralPath (Join-Path $skillsDirectory "$hookId/speckit-hooks.json") -Raw | ConvertFrom-Json
        }
        [IO.File]::WriteAllText((Join-Path $inputDirectory 'extension.yml'), ($manifest | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
        $executable = if ($cliPath) { $cliPath } else { 'uvx' }
        $cliArguments = @('extension', 'add', '--dev', $inputDirectory, '--force')
        if (-not $cliPath) { $cliArguments = @('--from', "specify-cli==$specifyVersion", 'specify') + $cliArguments }
        Push-Location -LiteralPath $projectDirectory
        try {
            & $executable @cliArguments
            $exitCode = $LASTEXITCODE
        } finally { Pop-Location }
        if ($exitCode -ne 0) {
            [Console]::Error.WriteLine("官方挂载失败：$hookId，退出码 $exitCode")
            break
        }
        [Console]::WriteLine("已重装 hook：$hookId")
    }
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    $exitCode = 1
} finally {
    if ($temporaryDirectory -and (Test-Path -LiteralPath $temporaryDirectory)) {
        Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
    }
}
exit $exitCode
