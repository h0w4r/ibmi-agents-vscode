[CmdletBinding()]
param(
    [string]$SourceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$InstallRoot,
    [string]$CopilotHome,
    [string]$VsCodeUserDataPath,
    [ValidateSet("IBM i Access ODBC Driver", "iSeries Access ODBC Driver", "Client Access ODBC Driver (32-bit)")]
    [string]$OdbcDriver = "IBM i Access ODBC Driver"
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\IbmiAgent.Common.ps1")

$source = [IO.Path]::GetFullPath($SourceRoot)
if ([string]::IsNullOrWhiteSpace($InstallRoot)) {
    $InstallRoot = Join-Path $env:LOCALAPPDATA "ibmi-senior-agent"
}
$resolvedCopilotHome = Resolve-IbmiCopilotHome -RequestedPath $CopilotHome
$resolvedVsCodeUserData = Resolve-IbmiVsCodeUserDataPath -RequestedPath $VsCodeUserDataPath
$layout = Get-IbmiAgentLayout -InstallRoot $InstallRoot -CopilotHome $resolvedCopilotHome -VsCodeUserDataPath $resolvedVsCodeUserData

$agentSource = Join-Path $source ".github\agents"
$promptSource = Join-Path $source ".github\prompts"
$skillSource = Join-Path $source ".github\skills"
$docsSource = Join-Path $source "docs\ibmi"
$serverSource = Join-Path $source "mcp\ibmi-local"
foreach ($path in @($agentSource, $promptSource, $skillSource, $docsSource, $serverSource)) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Paquete IBM i Senior incompleto: falta '$path'." }
}

$node = Assert-ExternalCommand -Name "node"
$npm = Assert-ExternalCommand -Name "npm.cmd"
$nodeMajor = [int]((& $node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 20) {
    throw "Se requiere Node.js 20 o superior. Version detectada: $(& $node --version)."
}

New-Item -ItemType Directory -Path $layout.InstallRoot, $layout.BackupsRoot, $layout.LogsRoot -Force | Out-Null
$backupRoot = New-IbmiBackupRoot -BackupsRoot $layout.BackupsRoot
$staging = Join-Path $layout.InstallRoot (".staging-" + [guid]::NewGuid().ToString("N"))
Assert-PathUnderRoot -Path $staging -Root $layout.InstallRoot | Out-Null

try {
    Copy-IbmiCustomizationsToStaging -AgentSource $agentSource -PromptSource $promptSource -SkillSource $skillSource -StagingRoot $staging
    New-Item -ItemType Directory -Path (Join-Path $staging "docs") -Force | Out-Null
    Copy-Item -LiteralPath $docsSource -Destination (Join-Path $staging "docs") -Recurse -Force

    $stagingScripts = Join-Path $staging "scripts"
    New-Item -ItemType Directory -Path (Join-Path $stagingScripts "lib") -Force | Out-Null
    foreach ($relative in @(
        "Install-IbmiSenior.ps1",
        "Update-IbmiSenior.ps1",
        "Uninstall-IbmiSenior.ps1",
        "Test-IbmiSenior.ps1",
        "merge-mcp-config.mjs"
    )) {
        Copy-Item -LiteralPath (Join-Path $source "scripts\$relative") -Destination (Join-Path $stagingScripts $relative) -Force
    }
    Copy-Item -LiteralPath (Join-Path $source "scripts\lib\IbmiAgent.Common.ps1") -Destination (Join-Path $stagingScripts "lib\IbmiAgent.Common.ps1") -Force

    $serverDestination = Join-Path $staging "mcp\ibmi-local"
    New-Item -ItemType Directory -Path $serverDestination -Force | Out-Null
    foreach ($relative in @("package.json", "package-lock.json", "tsconfig.json", "src")) {
        Copy-Item -LiteralPath (Join-Path $serverSource $relative) -Destination (Join-Path $serverDestination $relative) -Recurse -Force
    }

    Push-Location $serverDestination
    try {
        & $npm ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw "npm ci fallo con codigo $LASTEXITCODE." }
        & $npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build fallo con codigo $LASTEXITCODE." }
        & $npm prune --omit=dev --no-audit
        if ($LASTEXITCODE -ne 0) { throw "npm prune fallo con codigo $LASTEXITCODE." }
    }
    finally {
        Pop-Location
    }

    if (Test-Path -LiteralPath $layout.CurrentRoot) {
        Move-Item -LiteralPath $layout.CurrentRoot -Destination (Join-Path $backupRoot "package-current")
    }
    Move-Item -LiteralPath $staging -Destination $layout.CurrentRoot

    # Las versiones manuales antiguas se guardaban por error como agentes dentro de prompts.
    New-Item -ItemType Directory -Path $layout.PromptsRoot -Force | Out-Null
    $legacyAgents = @(Get-ChildItem -LiteralPath $layout.PromptsRoot -Filter "ibmi-senior*.agent.md" -File -ErrorAction SilentlyContinue)
    foreach ($legacy in $legacyAgents) {
        Backup-IbmiPath -Path $legacy.FullName -BackupRoot $backupRoot -RelativeBackupPath (Join-Path "legacy-prompts" $legacy.Name)
        Remove-Item -LiteralPath $legacy.FullName -Force
    }

    $installed = Install-IbmiCustomizationsFromCurrent -Layout $layout -BackupRoot $backupRoot
    $mergeScript = Join-Path $layout.CurrentRoot "scripts\merge-mcp-config.mjs"
    $entry = Join-Path $layout.CurrentRoot "mcp\ibmi-local\dist\index.js"
    $docs = Join-Path $layout.CurrentRoot "docs\ibmi"
    $audit = Join-Path $layout.LogsRoot "audit.log"
    $mcpConfigPath = Join-Path $layout.VsCodeUserData "mcp.json"
    & $node $mergeScript --mode install --config $mcpConfigPath --entry $entry --docs $docs --audit $audit --driver $OdbcDriver --backup-dir (Join-Path $backupRoot "vscode")
    if ($LASTEXITCODE -ne 0) { throw "No se pudo registrar ibmi-local en mcp.json." }

    $manifest = [ordered]@{
        installedAt             = (Get-Date).ToString("o")
        version                 = Get-IbmiPackageVersion -SourceRoot $source
        productId               = "ibmi-senior"
        displayName             = "IBM i Senior"
        sourceRoot              = $source
        installRoot             = $layout.InstallRoot
        currentRoot             = $layout.CurrentRoot
        copilotHome             = $resolvedCopilotHome
        vsCodeUserDataPath      = $layout.VsCodeUserData
        mcpConfigPath           = $mcpConfigPath
        mcpConfigured           = $true
        odbcDriver              = $OdbcDriver
        mainAgent               = "ibmi-senior.agent.md"
        agents                  = @($installed.Agents)
        skills                  = @($installed.Skills)
        prompts                 = @($installed.Prompts)
        migratedLegacyArtifacts = @($legacyAgents.Name)
        backupRoot              = $backupRoot
    }
    Write-IbmiJsonNoBom -Value $manifest -Path $layout.ManifestPath

    Write-Host "IBM i Senior instalado o actualizado globalmente." -ForegroundColor Green
    Write-Host "VS Code: $($layout.VsCodeUserData)"
    Write-Host "Agentes: $($layout.AgentsRoot)"
    Write-Host "Skills:   $($layout.SkillsRoot)"
    Write-Host "Prompts:  $($layout.PromptsRoot)"
    Write-Host "MCP:      $mcpConfigPath"
    if ($legacyAgents.Count -gt 0) {
        Write-Host "Migracion: $($legacyAgents.Count) agente(s) manual(es) antiguo(s) respaldado(s) y retirado(s)."
    }
    Write-Host "Diagnostico: .\scripts\Test-IbmiSenior.ps1"
}
catch {
    if (Test-Path -LiteralPath $staging) {
        Assert-PathUnderRoot -Path $staging -Root $layout.InstallRoot | Out-Null
        Remove-Item -LiteralPath $staging -Recurse -Force
    }
    throw
}
