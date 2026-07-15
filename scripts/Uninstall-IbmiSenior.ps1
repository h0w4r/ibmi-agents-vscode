[CmdletBinding()]
param(
    [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA "ibmi-senior-agent"),
    [switch]$Purge
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\IbmiAgent.Common.ps1")

$manifestPath = Join-Path ([IO.Path]::GetFullPath($InstallRoot)) "install-manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "No se encontro una instalacion administrada de IBM i Senior en '$manifestPath'."
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($manifest.productId -and $manifest.productId -ne "ibmi-senior") {
    throw "El manifiesto corresponde a '$($manifest.productId)', no a IBM i Senior."
}

$layout = Get-IbmiAgentLayout -InstallRoot $manifest.installRoot -CopilotHome $manifest.copilotHome -VsCodeUserDataPath $manifest.vsCodeUserDataPath
$backupRoot = New-IbmiBackupRoot -BackupsRoot $layout.BackupsRoot
$preserveSharedSkills = Remove-IbmiManagedCustomizations -Manifest $manifest -Layout $layout -BackupRoot $backupRoot -OtherMainAgentFile "ibmi-atlas.agent.md"

if ($manifest.mcpConfigured -and (Test-Path -LiteralPath $layout.CurrentRoot)) {
    $node = Assert-ExternalCommand -Name "node"
    $mergeScript = Join-Path $layout.CurrentRoot "scripts\merge-mcp-config.mjs"
    $mcpConfigPath = if ($manifest.mcpConfigPath) { $manifest.mcpConfigPath } else { Join-Path $layout.VsCodeUserData "mcp.json" }
    & $node $mergeScript --mode remove --config $mcpConfigPath --backup-dir (Join-Path $backupRoot "vscode")
    if ($LASTEXITCODE -ne 0) { throw "No se pudo retirar ibmi-local de mcp.json." }
}

Remove-IbmiCurrentPackage -Layout $layout
if ($Purge) {
    Remove-IbmiInstallRoot -InstallRoot $layout.InstallRoot
    Write-Host "IBM i Senior desinstalado y datos locales eliminados." -ForegroundColor Green
} else {
    Write-Host "IBM i Senior desinstalado. Backups y auditoria se conservaron en '$($layout.InstallRoot)'." -ForegroundColor Green
}
if ($preserveSharedSkills) { Write-Host "Skills IBM i compartidas conservadas para IBM i Atlas." }
