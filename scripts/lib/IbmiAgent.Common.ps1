function Resolve-IbmiVsCodeUserDataPath {
    param([string]$RequestedPath)

    # Una ruta explicita siempre prevalece; permite usar perfiles y ediciones portables.
    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        return [IO.Path]::GetFullPath([Environment]::ExpandEnvironmentVariables($RequestedPath))
    }

    if (-not [string]::IsNullOrWhiteSpace($env:VSCODE_PORTABLE)) {
        return [IO.Path]::GetFullPath((Join-Path $env:VSCODE_PORTABLE "user-data\User"))
    }

    $stablePath = Join-Path $env:APPDATA "Code\User"
    $insidersPath = Join-Path $env:APPDATA "Code - Insiders\User"
    $stableCommand = Get-Command "code" -ErrorAction SilentlyContinue
    $insidersCommand = Get-Command "code-insiders" -ErrorAction SilentlyContinue

    # Cuando solo una edicion esta disponible en PATH, esa es la eleccion menos ambigua.
    if ($insidersCommand -and -not $stableCommand) { return [IO.Path]::GetFullPath($insidersPath) }
    if ($stableCommand -and -not $insidersCommand) { return [IO.Path]::GetFullPath($stablePath) }

    $stableExists = Test-Path -LiteralPath $stablePath
    $insidersExists = Test-Path -LiteralPath $insidersPath
    if ($insidersExists -and -not $stableExists) { return [IO.Path]::GetFullPath($insidersPath) }
    if ($stableExists -and -not $insidersExists) { return [IO.Path]::GetFullPath($stablePath) }

    # Si ambas ediciones existen, se usa estable de forma determinista y se informa la ruta.
    return [IO.Path]::GetFullPath($stablePath)
}

function Resolve-IbmiCopilotHome {
    param([string]$RequestedPath)

    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        return [IO.Path]::GetFullPath([Environment]::ExpandEnvironmentVariables($RequestedPath))
    }
    return [IO.Path]::GetFullPath((Join-Path $HOME ".copilot"))
}

function Get-IbmiAgentLayout {
    param(
        [Parameter(Mandatory = $true)][string]$InstallRoot,
        [Parameter(Mandatory = $true)][string]$CopilotHome,
        [Parameter(Mandatory = $true)][string]$VsCodeUserDataPath
    )

    $resolvedInstallRoot = [IO.Path]::GetFullPath($InstallRoot)
    return [pscustomobject]@{
        InstallRoot    = $resolvedInstallRoot
        CurrentRoot    = Join-Path $resolvedInstallRoot "current"
        BackupsRoot    = Join-Path $resolvedInstallRoot "backups"
        LogsRoot       = Join-Path $resolvedInstallRoot "logs"
        ManifestPath   = Join-Path $resolvedInstallRoot "install-manifest.json"
        AgentsRoot     = Join-Path ([IO.Path]::GetFullPath($CopilotHome)) "agents"
        SkillsRoot     = Join-Path ([IO.Path]::GetFullPath($CopilotHome)) "skills"
        PromptsRoot    = Join-Path ([IO.Path]::GetFullPath($VsCodeUserDataPath)) "prompts"
        VsCodeUserData = [IO.Path]::GetFullPath($VsCodeUserDataPath)
    }
}

function Assert-PathUnderRoot {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Root
    )

    $fullPath = [IO.Path]::GetFullPath($Path)
    $fullRoot = [IO.Path]::GetFullPath($Root).TrimEnd([IO.Path]::DirectorySeparatorChar)
    $prefix = $fullRoot + [IO.Path]::DirectorySeparatorChar
    if (-not $fullPath.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "La ruta '$fullPath' no esta contenida en '$fullRoot'."
    }
    return $fullPath
}

function Assert-ExternalCommand {
    param([Parameter(Mandatory = $true)][string]$Name)

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        throw "No se encontro '$Name' en PATH. Revise los prerrequisitos del LEEME."
    }
    return $command.Source
}

function New-IbmiBackupRoot {
    param([Parameter(Mandatory = $true)][string]$BackupsRoot)

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $root = Join-Path $BackupsRoot $timestamp
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    return $root
}

function Backup-IbmiPath {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$BackupRoot,
        [Parameter(Mandatory = $true)][string]$RelativeBackupPath
    )

    if (-not (Test-Path -LiteralPath $Path)) { return }
    $destination = Join-Path $BackupRoot $RelativeBackupPath
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    Copy-Item -LiteralPath $Path -Destination $destination -Recurse -Force
}

function Install-IbmiManagedFile {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination,
        [Parameter(Mandatory = $true)][string]$BackupRoot,
        [Parameter(Mandatory = $true)][string]$BackupGroup
    )

    Backup-IbmiPath -Path $Destination -BackupRoot $BackupRoot -RelativeBackupPath (Join-Path $BackupGroup (Split-Path -Leaf $Destination))
    New-Item -ItemType Directory -Path (Split-Path -Parent $Destination) -Force | Out-Null
    Copy-Item -LiteralPath $Source -Destination $Destination -Force
}

function Install-IbmiManagedDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination,
        [Parameter(Mandatory = $true)][string]$DestinationRoot,
        [Parameter(Mandatory = $true)][string]$BackupRoot,
        [Parameter(Mandatory = $true)][string]$BackupGroup
    )

    $safeDestination = Assert-PathUnderRoot -Path $Destination -Root $DestinationRoot
    Backup-IbmiPath -Path $safeDestination -BackupRoot $BackupRoot -RelativeBackupPath (Join-Path $BackupGroup (Split-Path -Leaf $safeDestination))
    if (Test-Path -LiteralPath $safeDestination) {
        Remove-Item -LiteralPath $safeDestination -Recurse -Force
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $safeDestination) -Force | Out-Null
    Copy-Item -LiteralPath $Source -Destination $safeDestination -Recurse -Force
}

function Copy-IbmiCustomizationsToStaging {
    param(
        [Parameter(Mandatory = $true)][string]$AgentSource,
        [Parameter(Mandatory = $true)][string]$PromptSource,
        [Parameter(Mandatory = $true)][string]$SkillSource,
        [Parameter(Mandatory = $true)][string]$StagingRoot
    )

    $stagingAgents = Join-Path $StagingRoot ".github\agents"
    $stagingPrompts = Join-Path $StagingRoot ".github\prompts"
    $stagingSkills = Join-Path $StagingRoot ".github\skills"
    New-Item -ItemType Directory -Path $stagingAgents, $stagingPrompts, $stagingSkills -Force | Out-Null

    Get-ChildItem -LiteralPath $AgentSource -Filter "*.agent.md" -File |
        ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $stagingAgents -Force }
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" -File |
        ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $stagingPrompts -Force }
    Get-ChildItem -LiteralPath $SkillSource -Directory |
        ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $stagingSkills -Recurse -Force }
}

function Install-IbmiCustomizationsFromCurrent {
    param(
        [Parameter(Mandatory = $true)]$Layout,
        [Parameter(Mandatory = $true)][string]$BackupRoot
    )

    New-Item -ItemType Directory -Path $Layout.AgentsRoot, $Layout.SkillsRoot, $Layout.PromptsRoot -Force | Out-Null
    $agentFiles = @(Get-ChildItem -LiteralPath (Join-Path $Layout.CurrentRoot ".github\agents") -Filter "*.agent.md" -File)
    foreach ($file in $agentFiles) {
        Install-IbmiManagedFile -Source $file.FullName -Destination (Join-Path $Layout.AgentsRoot $file.Name) -BackupRoot $BackupRoot -BackupGroup "agents"
    }

    # Las skills son neutrales y pueden ser compartidas por ambos productos.
    $skillDirectories = @(Get-ChildItem -LiteralPath (Join-Path $Layout.CurrentRoot ".github\skills") -Directory)
    foreach ($directory in $skillDirectories) {
        Install-IbmiManagedDirectory -Source $directory.FullName -Destination (Join-Path $Layout.SkillsRoot $directory.Name) -DestinationRoot $Layout.SkillsRoot -BackupRoot $BackupRoot -BackupGroup "skills"
    }

    $promptFiles = @(Get-ChildItem -LiteralPath (Join-Path $Layout.CurrentRoot ".github\prompts") -Filter "*.prompt.md" -File)
    foreach ($file in $promptFiles) {
        Install-IbmiManagedFile -Source $file.FullName -Destination (Join-Path $Layout.PromptsRoot $file.Name) -BackupRoot $BackupRoot -BackupGroup "prompts"
    }

    return [pscustomobject]@{
        Agents  = @($agentFiles.Name)
        Skills  = @($skillDirectories.Name)
        Prompts = @($promptFiles.Name)
    }
}

function Remove-IbmiManagedCustomizations {
    param(
        [Parameter(Mandatory = $true)]$Manifest,
        [Parameter(Mandatory = $true)]$Layout,
        [Parameter(Mandatory = $true)][string]$BackupRoot,
        [Parameter(Mandatory = $true)][string]$OtherMainAgentFile
    )

    foreach ($name in @($Manifest.agents)) {
        $path = Assert-PathUnderRoot -Path (Join-Path $Layout.AgentsRoot $name) -Root $Layout.AgentsRoot
        Backup-IbmiPath -Path $path -BackupRoot $BackupRoot -RelativeBackupPath (Join-Path "agents" $name)
        if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
    }
    foreach ($name in @($Manifest.prompts)) {
        $path = Assert-PathUnderRoot -Path (Join-Path $Layout.PromptsRoot $name) -Root $Layout.PromptsRoot
        Backup-IbmiPath -Path $path -BackupRoot $BackupRoot -RelativeBackupPath (Join-Path "prompts" $name)
        if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
    }

    $preserveSharedSkills = Test-Path -LiteralPath (Join-Path $Layout.AgentsRoot $OtherMainAgentFile)
    if (-not $preserveSharedSkills) {
        foreach ($name in @($Manifest.skills)) {
            $path = Assert-PathUnderRoot -Path (Join-Path $Layout.SkillsRoot $name) -Root $Layout.SkillsRoot
            Backup-IbmiPath -Path $path -BackupRoot $BackupRoot -RelativeBackupPath (Join-Path "skills" $name)
            if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Recurse -Force }
        }
    }
    return $preserveSharedSkills
}

function Remove-IbmiCurrentPackage {
    param([Parameter(Mandatory = $true)]$Layout)

    if (Test-Path -LiteralPath $Layout.CurrentRoot) {
        $safeCurrent = Assert-PathUnderRoot -Path $Layout.CurrentRoot -Root $Layout.InstallRoot
        Remove-Item -LiteralPath $safeCurrent -Recurse -Force
    }
}

function Remove-IbmiInstallRoot {
    param([Parameter(Mandatory = $true)][string]$InstallRoot)

    $safeInstallRoot = [IO.Path]::GetFullPath($InstallRoot)
    $expectedParent = [IO.Path]::GetFullPath((Split-Path -Parent $safeInstallRoot))
    Assert-PathUnderRoot -Path $safeInstallRoot -Root $expectedParent | Out-Null
    Remove-Item -LiteralPath $safeInstallRoot -Recurse -Force
}

function Write-IbmiJsonNoBom {
    param(
        [Parameter(Mandatory = $true)]$Value,
        [Parameter(Mandatory = $true)][string]$Path
    )

    $json = $Value | ConvertTo-Json -Depth 20
    $utf8NoBom = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, $utf8NoBom)
}

function Get-IbmiPackageVersion {
    param([Parameter(Mandatory = $true)][string]$SourceRoot)

    $versionPath = Join-Path $SourceRoot "VERSION"
    if (-not (Test-Path -LiteralPath $versionPath)) { return "desarrollo" }
    return (Get-Content -LiteralPath $versionPath -Raw).Trim()
}
