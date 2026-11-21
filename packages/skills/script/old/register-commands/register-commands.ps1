# 在 PowerShell 中准备全部四指令输入，由官方 CLI 完成登记与重装。
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
            [Console]::WriteLine('用法：register-commands.ps1 --project <项目> --skills-dir <技能根> [--cli <specify>]')
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
    $modes = @('tutor', 'pair', 'direct', 'increment')
    foreach ($mode in $modes) {
        $skillFile = Join-Path $skillsDirectory "task-$mode/SKILL.md"
        if (-not (Test-Path -LiteralPath $skillFile -PathType Leaf)) { throw "缺少技能：$skillFile" }
    }
    $temporaryDirectory = Join-Path ([IO.Path]::GetTempPath()) ('foundry-modes-' + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path (Join-Path $temporaryDirectory 'skills') | Out-Null
    $commands = foreach ($mode in $modes) {
        Copy-Item -LiteralPath (Join-Path $skillsDirectory "task-$mode") -Destination (Join-Path $temporaryDirectory "skills/task-$mode") -Recurse
        [ordered]@{ name = "speckit.modes.$mode"; file = "skills/task-$mode/SKILL.md"; description = "进入 $mode 协作模式" }
    }
    $manifest = [ordered]@{
        schema_version = '1.0'
        extension = [ordered]@{ id = 'modes'; name = 'Collaboration Modes'; version = '1.0.0'; description = '导师、结对、用户主导和增量规划四个协作指令' }
        requires = @{ speckit_version = "==$specifyVersion" }
        provides = @{ commands = @($commands) }
    }
    [IO.File]::WriteAllText((Join-Path $temporaryDirectory 'extension.yml'), ($manifest | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false))
    $cliArguments = @('extension', 'add', '--dev', $temporaryDirectory, '--force')
    if (-not $cliPath) {
        $cliPath = 'uvx'
        $cliArguments = @('--from', "specify-cli==$specifyVersion", 'specify') + $cliArguments
    }
    Push-Location -LiteralPath $projectDirectory
    try {
        & $cliPath @cliArguments
        $exitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    if ($exitCode -ne 0) {
        [Console]::Error.WriteLine("官方挂载失败：退出码 $exitCode")
    } else {
        [Console]::WriteLine('四个协作指令安装完成：$speckit-modes-tutor、$speckit-modes-pair、$speckit-modes-direct、$speckit-modes-increment')
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
