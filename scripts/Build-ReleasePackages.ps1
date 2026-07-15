[CmdletBinding()]
param(
    [string]$SourceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$Version,
    [string]$OutputPath = (Join-Path (Split-Path -Parent $PSScriptRoot) "artifacts")
)

$ErrorActionPreference = "Stop"
$source = [IO.Path]::GetFullPath($SourceRoot)
if ([string]::IsNullOrWhiteSpace($Version)) {
    $Version = (Get-Content -LiteralPath (Join-Path $source "VERSION") -Raw).Trim()
}
if ($Version -notmatch '^\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$') {
    throw "Version no valida: '$Version'. Use SemVer, por ejemplo 0.3.0."
}

$output = [IO.Path]::GetFullPath($OutputPath)
$stagingRoot = Join-Path $output ".staging"
if (Test-Path -LiteralPath $stagingRoot) { Remove-Item -LiteralPath $stagingRoot -Recurse -Force }
New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

# Evita mezclar paquetes de versiones anteriores con la salida publicable actual.
foreach ($pattern in @("ibmi-senior-v*.zip", "ibmi-atlas-v*.zip")) {
    Get-ChildItem -LiteralPath $output -Filter $pattern -File -ErrorAction SilentlyContinue |
        Remove-Item -Force
}
Remove-Item -LiteralPath (Join-Path $output "SHA256SUMS.txt") -Force -ErrorAction SilentlyContinue

# El empaquetado local aplica la misma barrera generica de privacidad que la CI.
& node (Join-Path $source "scripts\validate-public-content.mjs")
if ($LASTEXITCODE -ne 0) { throw "La validacion de privacidad impidio construir los paquetes." }

function Copy-ReleasePath {
    param(
        [Parameter(Mandatory = $true)][string]$SourceRelative,
        [Parameter(Mandatory = $true)][string]$DestinationRoot,
        [string]$DestinationRelative = $SourceRelative
    )

    $from = Join-Path $source $SourceRelative
    if (-not (Test-Path -LiteralPath $from)) { throw "Falta el artefacto requerido '$from'." }
    $to = Join-Path $DestinationRoot $DestinationRelative
    New-Item -ItemType Directory -Path (Split-Path -Parent $to) -Force | Out-Null
    Copy-Item -LiteralPath $from -Destination $to -Recurse -Force
}

function Assert-ArchiveEntries {
    param(
        [Parameter(Mandatory = $true)][string]$ArchivePath,
        [Parameter(Mandatory = $true)][string[]]$ForbiddenPatterns
    )

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($ArchivePath)
    try {
        $entries = @($archive.Entries | ForEach-Object { $_.FullName.Replace('\\', '/') })
        foreach ($pattern in $ForbiddenPatterns) {
            if ($entries -match $pattern) { throw "El paquete '$ArchivePath' contiene una ruta prohibida por '$pattern'." }
        }
    }
    finally {
        $archive.Dispose()
    }
}

try {
    $seniorStage = Join-Path $stagingRoot "ibmi-senior-v$Version"
    $atlasStage = Join-Path $stagingRoot "ibmi-atlas-v$Version"
    New-Item -ItemType Directory -Path $seniorStage, $atlasStage -Force | Out-Null

    # IBM i Senior: lista positiva con runtime, documentacion y comandos exclusivos.
    foreach ($relative in @(".github\agents", ".github\prompts", ".github\skills", "docs\ibmi")) {
        Copy-ReleasePath -SourceRelative $relative -DestinationRoot $seniorStage
    }
    foreach ($relative in @("package.json", "package-lock.json", "tsconfig.json", "src")) {
        Copy-ReleasePath -SourceRelative (Join-Path "mcp\ibmi-local" $relative) -DestinationRoot $seniorStage
    }
    foreach ($relative in @(
        "scripts\Install-IbmiSenior.ps1",
        "scripts\Update-IbmiSenior.ps1",
        "scripts\Uninstall-IbmiSenior.ps1",
        "scripts\Test-IbmiSenior.ps1",
        "scripts\merge-mcp-config.mjs",
        "scripts\lib\IbmiAgent.Common.ps1"
    )) {
        Copy-ReleasePath -SourceRelative $relative -DestinationRoot $seniorStage
    }
    Copy-ReleasePath -SourceRelative "LEEME.md" -DestinationRoot $seniorStage
    Copy-ReleasePath -SourceRelative "LEEME.md" -DestinationRoot $seniorStage -DestinationRelative "README.md"
    Copy-ReleasePath -SourceRelative "CHANGELOG-SENIOR.md" -DestinationRoot $seniorStage -DestinationRelative "CHANGELOG.md"
    foreach ($relative in @("LICENSE", "VERSION")) { Copy-ReleasePath -SourceRelative $relative -DestinationRoot $seniorStage }

    # IBM i Atlas: solo customizaciones y comandos propios; no arrastra artefactos de Senior.
    Copy-ReleasePath -SourceRelative ".github\editions\atlas\agents" -DestinationRoot $atlasStage -DestinationRelative ".github\agents"
    Copy-ReleasePath -SourceRelative ".github\editions\atlas\prompts" -DestinationRoot $atlasStage -DestinationRelative ".github\prompts"
    Copy-ReleasePath -SourceRelative ".github\skills" -DestinationRoot $atlasStage
    foreach ($relative in @(
        "scripts\Install-IbmiAtlas.ps1",
        "scripts\Update-IbmiAtlas.ps1",
        "scripts\Uninstall-IbmiAtlas.ps1",
        "scripts\Test-IbmiAtlas.ps1",
        "scripts\lib\IbmiAgent.Common.ps1"
    )) {
        Copy-ReleasePath -SourceRelative $relative -DestinationRoot $atlasStage
    }
    Copy-ReleasePath -SourceRelative "LEEME-ATLAS.md" -DestinationRoot $atlasStage -DestinationRelative "LEEME.md"
    Copy-ReleasePath -SourceRelative "LEEME-ATLAS.md" -DestinationRoot $atlasStage -DestinationRelative "README.md"
    Copy-ReleasePath -SourceRelative "CHANGELOG-ATLAS.md" -DestinationRoot $atlasStage -DestinationRelative "CHANGELOG.md"
    foreach ($relative in @("LICENSE", "VERSION")) { Copy-ReleasePath -SourceRelative $relative -DestinationRoot $atlasStage }

    $atlasTextFiles = @(Get-ChildItem -LiteralPath $atlasStage -Recurse -File | Where-Object { $_.Extension -in @(".md", ".ps1", ".json", ".yaml", ".yml", ".mjs", ".ts") })
    $atlasLeaks = @($atlasTextFiles | Select-String -Pattern '(?i)\bMCP\b|ibmi-local|IBMI_[A-Z_]+' -ErrorAction SilentlyContinue)
    if ($atlasLeaks.Count -gt 0) {
        throw "Atlas contiene $($atlasLeaks.Count) referencia(s) de una capacidad no incluida. Primera: $($atlasLeaks[0].Path):$($atlasLeaks[0].LineNumber)."
    }

    $seniorZip = Join-Path $output "ibmi-senior-v$Version.zip"
    $atlasZip = Join-Path $output "ibmi-atlas-v$Version.zip"
    Remove-Item -LiteralPath $seniorZip, $atlasZip -Force -ErrorAction SilentlyContinue
    Compress-Archive -Path (Join-Path $seniorStage "*") -DestinationPath $seniorZip -CompressionLevel Optimal
    Compress-Archive -Path (Join-Path $atlasStage "*") -DestinationPath $atlasZip -CompressionLevel Optimal

    Assert-ArchiveEntries -ArchivePath $seniorZip -ForbiddenPatterns @('/editions/atlas/', 'Install-IbmiAtlas', 'ibmi-atlas\.agent\.md')
    Assert-ArchiveEntries -ArchivePath $atlasZip -ForbiddenPatterns @('^mcp/', '^docs/', 'Install-IbmiSenior', 'merge-mcp-config', 'ibmi-senior\.agent\.md')

    $hashLines = @($seniorZip, $atlasZip) | ForEach-Object {
        $hash = Get-FileHash -LiteralPath $_ -Algorithm SHA256
        "$($hash.Hash.ToLowerInvariant())  $(Split-Path -Leaf $_)"
    }
    [IO.File]::WriteAllLines((Join-Path $output "SHA256SUMS.txt"), $hashLines, (New-Object Text.UTF8Encoding($false)))

    Write-Host "Paquetes de release $Version generados:" -ForegroundColor Green
    Write-Host "- $seniorZip"
    Write-Host "- $atlasZip"
    Write-Host "- $(Join-Path $output 'SHA256SUMS.txt')"
}
finally {
    if (Test-Path -LiteralPath $stagingRoot) { Remove-Item -LiteralPath $stagingRoot -Recurse -Force }
}
