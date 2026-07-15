[CmdletBinding()]
param(
    [string]$SourceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$InstallRoot,
    [string]$CopilotHome,
    [string]$VsCodeUserDataPath
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\IbmiAgent.Common.ps1")
$source = [IO.Path]::GetFullPath($SourceRoot)
if ([string]::IsNullOrWhiteSpace($InstallRoot)) {
    $InstallRoot = Join-Path $env:LOCALAPPDATA "ibmi-atlas-agent"
}
$resolvedCopilotHome = Resolve-IbmiCopilotHome -RequestedPath $CopilotHome
$resolvedVsCodeUserData = Resolve-IbmiVsCodeUserDataPath -RequestedPath $VsCodeUserDataPath
$layout = Get-IbmiAgentLayout -InstallRoot $InstallRoot -CopilotHome $resolvedCopilotHome -VsCodeUserDataPath $resolvedVsCodeUserData

# El repositorio guarda Atlas bajo editions; su ZIP se normaliza a .github para ser independiente.
$atlasGitHubRoot = Join-Path $source ".github\editions\atlas"
if (-not (Test-Path -LiteralPath (Join-Path $atlasGitHubRoot "agents\ibmi-atlas.agent.md"))) {
    $atlasGitHubRoot = Join-Path $source ".github"
}
$agentSource = Join-Path $atlasGitHubRoot "agents"
$promptSource = Join-Path $atlasGitHubRoot "prompts"
$skillSource = Join-Path $source ".github\skills"
foreach ($path in @($agentSource, $promptSource, $skillSource)) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Paquete IBM i Atlas incompleto: falta '$path'." }
}

New-Item -ItemType Directory -Path $layout.InstallRoot, $layout.BackupsRoot, $layout.LogsRoot -Force | Out-Null
$backupRoot = New-IbmiBackupRoot -BackupsRoot $layout.BackupsRoot
$staging = Join-Path $layout.InstallRoot (".staging-" + [guid]::NewGuid().ToString("N"))
Assert-PathUnderRoot -Path $staging -Root $layout.InstallRoot | Out-Null

try {
    Copy-IbmiCustomizationsToStaging -AgentSource $agentSource -PromptSource $promptSource -SkillSource $skillSource -StagingRoot $staging
    if (Test-Path -LiteralPath $layout.CurrentRoot) {
        Move-Item -LiteralPath $layout.CurrentRoot -Destination (Join-Path $backupRoot "package-current")
    }
    Move-Item -LiteralPath $staging -Destination $layout.CurrentRoot
    $installed = Install-IbmiCustomizationsFromCurrent -Layout $layout -BackupRoot $backupRoot

    $manifest = [ordered]@{
        installedAt        = (Get-Date).ToString("o")
        version            = Get-IbmiPackageVersion -SourceRoot $source
        productId          = "ibmi-atlas"
        displayName        = "IBM i Atlas"
        sourceRoot         = $source
        installRoot        = $layout.InstallRoot
        currentRoot        = $layout.CurrentRoot
        copilotHome        = $resolvedCopilotHome
        vsCodeUserDataPath = $layout.VsCodeUserData
        mainAgent          = "ibmi-atlas.agent.md"
        agents             = @($installed.Agents)
        skills             = @($installed.Skills)
        prompts            = @($installed.Prompts)
        backupRoot         = $backupRoot
    }
    Write-IbmiJsonNoBom -Value $manifest -Path $layout.ManifestPath

    Write-Host "IBM i Atlas instalado o actualizado globalmente." -ForegroundColor Green
    Write-Host "VS Code: $($layout.VsCodeUserData)"
    Write-Host "Agentes: $($layout.AgentsRoot)"
    Write-Host "Skills:   $($layout.SkillsRoot)"
    Write-Host "Prompts:  $($layout.PromptsRoot)"
    Write-Host "Diagnostico: .\scripts\Test-IbmiAtlas.ps1"
}
catch {
    if (Test-Path -LiteralPath $staging) {
        Assert-PathUnderRoot -Path $staging -Root $layout.InstallRoot | Out-Null
        Remove-Item -LiteralPath $staging -Recurse -Force
    }
    throw
}
