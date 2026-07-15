$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\IbmiOdbcPrerequisite.ps1")

function Assert-Condition {
    param(
        [Parameter(Mandatory = $true)][bool]$Condition,
        [Parameter(Mandatory = $true)][string]$Message
    )
    if (-not $Condition) { throw $Message }
}

$currentAndLegacy = @(Get-IbmiOdbcDriverInventory -DriverEntries @(
    [pscustomobject]@{ Name = "iSeries Access ODBC Driver"; Platform = "64-bit"; Version = "13.1"; DriverPath = "" },
    [pscustomobject]@{ Name = "IBM i Access ODBC Driver"; Platform = "64-bit"; Version = "13.2"; DriverPath = "" }
))
$selected = Select-IbmiOdbcDriver -Inventory $currentAndLegacy
Assert-Condition ($selected.Name -eq "IBM i Access ODBC Driver") "No se priorizo el driver ACS actual."

$legacyOnly = @(Get-IbmiOdbcDriverInventory -DriverEntries @(
    [pscustomobject]@{ Name = "iSeries Access ODBC Driver"; Platform = "64-bit"; Version = "13.1"; DriverPath = "" }
))
$selectedLegacy = Select-IbmiOdbcDriver -Inventory $legacyOnly
Assert-Condition ($selectedLegacy.Name -eq "iSeries Access ODBC Driver" -and $selectedLegacy.IsLegacy) "No se selecciono correctamente el alias heredado."

$resolvedLegacy = Resolve-IbmiOdbcPrerequisite -InventoryProvider { $legacyOnly }
Assert-Condition ($resolvedLegacy.Name -eq "iSeries Access ODBC Driver") "El asistente intento reemplazar un driver heredado compatible."

$wrongArchitecture = @(Get-IbmiOdbcDriverInventory -DriverEntries @(
    [pscustomobject]@{ Name = "Client Access ODBC Driver (32-bit)"; Platform = "32-bit"; Version = "13.1"; DriverPath = "" }
))
Assert-Condition ($wrongArchitecture.Count -eq 0) "Se acepto un driver registrado unicamente para 32 bits."

$historicalAlias = @(Get-IbmiOdbcDriverInventory -DriverEntries @(
    [pscustomobject]@{ Name = "Client Access ODBC Driver (32-bit)"; Platform = "64-bit"; Version = "13.1"; DriverPath = "" }
))
Assert-Condition ($historicalAlias.Count -eq 1) "Se rechazo el alias historico aunque estaba registrado para 64 bits."

$missingPreferred = Select-IbmiOdbcDriver -Inventory $legacyOnly -PreferredDriver "IBM i Access ODBC Driver"
Assert-Condition ($null -eq $missingPreferred) "Se sustituyo silenciosamente un driver solicitado que no estaba instalado."

$unsupportedRejected = $false
try {
    Select-IbmiOdbcDriver -Inventory @() -PreferredDriver "Driver no permitido" | Out-Null
}
catch {
    $unsupportedRejected = $_.Exception.Message -like "Driver ODBC no soportado*"
}
Assert-Condition $unsupportedRejected "No se rechazo un nombre de driver fuera de la allowlist."

$missingInstallerRejected = $false
try {
    Test-IbmiOdbcInstaller -Path (Join-Path $env:TEMP "ibmi-setup-inexistente\setup.exe") | Out-Null
}
catch {
    $missingInstallerRejected = $_.Exception.Message -like "No se encontro el instalador ODBC*"
}
Assert-Condition $missingInstallerRejected "No se rechazo un setup.exe inexistente."

$tempRoot = [IO.Path]::GetFullPath($env:TEMP).TrimEnd([IO.Path]::DirectorySeparatorChar)
$unsignedRoot = [IO.Path]::GetFullPath((Join-Path $tempRoot ("ibmi-odbc-test-" + [guid]::NewGuid().ToString("N"))))
if (-not $unsignedRoot.StartsWith($tempRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "La ruta temporal de prueba no esta bajo TEMP."
}
$unsignedSetup = Join-Path $unsignedRoot "setup.exe"
New-Item -ItemType Directory -Path $unsignedRoot | Out-Null
[IO.File]::WriteAllBytes($unsignedSetup, [byte[]](0, 1, 2, 3))
$unsignedRejected = $false
try {
    Test-IbmiOdbcInstaller -Path $unsignedSetup | Out-Null
}
catch {
    $unsignedRejected = $_.Exception.Message -like "La firma Authenticode de setup.exe no es valida*"
}
finally {
    if (Test-Path -LiteralPath $unsignedRoot) { Remove-Item -LiteralPath $unsignedRoot -Recurse -Force }
}
Assert-Condition $unsignedRejected "No se rechazo un setup.exe sin firma valida."

$nonInteractiveRejected = $false
try {
    Resolve-IbmiOdbcPrerequisite -NonInteractive -InventoryProvider { @() } | Out-Null
}
catch {
    $nonInteractiveRejected = $_.Exception.Message -like "No se encontro un driver ODBC IBM i de 64 bits compatible*"
}
Assert-Condition $nonInteractiveRejected "El modo no interactivo no fallo cuando faltaba el driver."

Write-Host "Pruebas unitarias del asistente ODBC: 10 correctas." -ForegroundColor Green
