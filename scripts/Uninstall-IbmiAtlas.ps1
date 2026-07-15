[CmdletBinding()]
param(
    [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA "ibmi-atlas-agent"),
    [switch]$Purge
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\IbmiAgent.Common.ps1")
$manifestPath = Join-Path ([IO.Path]::GetFullPath($InstallRoot)) "install-manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "No se encontro una instalacion administrada de IBM i Atlas en '$manifestPath'."
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($manifest.productId -and $manifest.productId -ne "ibmi-atlas") {
    throw "El manifiesto corresponde a '$($manifest.productId)', no a IBM i Atlas."
}

$layout = Get-IbmiAgentLayout -InstallRoot $manifest.installRoot -CopilotHome $manifest.copilotHome -VsCodeUserDataPath $manifest.vsCodeUserDataPath
$backupRoot = New-IbmiBackupRoot -BackupsRoot $layout.BackupsRoot
$preserveSharedSkills = Remove-IbmiManagedCustomizations -Manifest $manifest -Layout $layout -BackupRoot $backupRoot -OtherMainAgentFile "ibmi-senior.agent.md"
Remove-IbmiCurrentPackage -Layout $layout

if ($Purge) {
    Remove-IbmiInstallRoot -InstallRoot $layout.InstallRoot
    Write-Host "IBM i Atlas desinstalado y datos locales eliminados." -ForegroundColor Green
} else {
    Write-Host "IBM i Atlas desinstalado. Backups conservados en '$($layout.InstallRoot)'." -ForegroundColor Green
}
if ($preserveSharedSkills) { Write-Host "Skills IBM i compartidas conservadas para IBM i Senior." }
