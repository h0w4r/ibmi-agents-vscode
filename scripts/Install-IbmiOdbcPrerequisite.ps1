[CmdletBinding()]
param(
    [ValidateSet("IBM i Access ODBC Driver", "iSeries Access ODBC Driver", "Client Access ODBC Driver (32-bit)")]
    [string]$OdbcDriver,
    [string]$OdbcInstallerPath,
    [switch]$NonInteractive
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\IbmiOdbcPrerequisite.ps1")

$driver = Resolve-IbmiOdbcPrerequisite `
    -PreferredDriver $OdbcDriver `
    -InstallerPath $OdbcInstallerPath `
    -NonInteractive:$NonInteractive

[pscustomobject]@{
    Driver   = $driver.Name
    Platform = $driver.Platform
    Version  = $driver.Version
    Legacy   = $driver.IsLegacy
} | Format-Table -AutoSize
