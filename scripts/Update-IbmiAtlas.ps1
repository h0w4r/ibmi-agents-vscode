[CmdletBinding()]
param(
    [string]$SourceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$InstallRoot,
    [string]$CopilotHome,
    [string]$VsCodeUserDataPath
)

# Atlas mantiene su propio ciclo de actualizacion y nunca invoca scripts de Senior.
$parameters = @{
    SourceRoot         = $SourceRoot
    CopilotHome        = $CopilotHome
    VsCodeUserDataPath = $VsCodeUserDataPath
}
if (-not [string]::IsNullOrWhiteSpace($InstallRoot)) { $parameters.InstallRoot = $InstallRoot }
& (Join-Path $PSScriptRoot "Install-IbmiAtlas.ps1") @parameters
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
