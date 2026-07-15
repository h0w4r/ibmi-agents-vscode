[CmdletBinding()]
param(
    [string]$SourceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$InstallRoot,
    [string]$CopilotHome,
    [string]$VsCodeUserDataPath,
    [ValidateSet("IBM i Access ODBC Driver", "iSeries Access ODBC Driver", "Client Access ODBC Driver (32-bit)")]
    [string]$OdbcDriver = "IBM i Access ODBC Driver"
)

# La actualizacion es una instalacion idempotente que crea un backup antes de reemplazar archivos.
$parameters = @{
    SourceRoot         = $SourceRoot
    CopilotHome        = $CopilotHome
    VsCodeUserDataPath = $VsCodeUserDataPath
    OdbcDriver         = $OdbcDriver
}
if (-not [string]::IsNullOrWhiteSpace($InstallRoot)) { $parameters.InstallRoot = $InstallRoot }
& (Join-Path $PSScriptRoot "Install-IbmiSenior.ps1") @parameters
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
