[CmdletBinding()]
param([string]$InstallRoot = (Join-Path $env:LOCALAPPDATA "ibmi-senior-agent"))

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\IbmiAgent.Common.ps1")
$manifestPath = Join-Path ([IO.Path]::GetFullPath($InstallRoot)) "install-manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath)) { throw "No se encontro IBM i Senior en '$manifestPath'." }
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$layout = Get-IbmiAgentLayout -InstallRoot $manifest.installRoot -CopilotHome $manifest.copilotHome -VsCodeUserDataPath $manifest.vsCodeUserDataPath
$results = New-Object System.Collections.Generic.List[object]

function Add-DiagnosticResult {
    param([string]$Check, [bool]$Ok, [string]$Detail)
    $script:results.Add([pscustomobject]@{ Verificacion = $Check; Resultado = $(if ($Ok) { "OK" } else { "FALLO" }); Detalle = $Detail })
}

Add-DiagnosticResult "Producto" ($manifest.productId -eq "ibmi-senior" -or $manifest.edition -eq "Full") "$($manifest.displayName) $($manifest.version)"
$mainAgentPath = Join-Path $layout.AgentsRoot "ibmi-senior.agent.md"
$mainText = if (Test-Path -LiteralPath $mainAgentPath) { Get-Content -LiteralPath $mainAgentPath -Raw } else { "" }
Add-DiagnosticResult "Agente principal" (Test-Path -LiteralPath $mainAgentPath) $mainAgentPath
Add-DiagnosticResult "Modelo orquestador" ($mainText.Contains('model: "GPT-5.6 Sol (copilot)"')) "GPT-5.6 Sol (copilot)"

$subagentsOk = $true
foreach ($name in @($manifest.agents | Where-Object { $_ -ne "ibmi-senior.agent.md" })) {
    $path = Join-Path $layout.AgentsRoot $name
    $text = if (Test-Path -LiteralPath $path) { Get-Content -LiteralPath $path -Raw } else { "" }
    if (-not $text.Contains('model: "GPT-5.6 Terra (copilot)"') -or -not $text.Contains('user-invocable: false')) { $subagentsOk = $false }
}
Add-DiagnosticResult "Modelos de subagentes" $subagentsOk "GPT-5.6 Terra (copilot)"

$skillsOk = @($manifest.skills | Where-Object { Test-Path -LiteralPath (Join-Path $layout.SkillsRoot "$_\SKILL.md") }).Count -eq @($manifest.skills).Count
$promptsOk = @($manifest.prompts | Where-Object { Test-Path -LiteralPath (Join-Path $layout.PromptsRoot $_) }).Count -eq @($manifest.prompts).Count
Add-DiagnosticResult "Skills globales" $skillsOk "$(@($manifest.skills).Count) skills"
Add-DiagnosticResult "Prompts de usuario" $promptsOk "$(@($manifest.prompts).Count) prompts"
Add-DiagnosticResult "Ruta VS Code" (Test-Path -LiteralPath $layout.VsCodeUserData) $layout.VsCodeUserData

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
Add-DiagnosticResult "Node.js" ($null -ne $nodeCommand) $(if ($nodeCommand) { (& $nodeCommand.Source --version) } else { "No esta en PATH" })
$entry = Join-Path $layout.CurrentRoot "mcp\ibmi-local\dist\index.js"
Add-DiagnosticResult "MCP compilado" (Test-Path -LiteralPath $entry) $entry
if ($nodeCommand -and (Test-Path -LiteralPath $entry)) {
    & $nodeCommand.Source --check $entry 2>$null
    Add-DiagnosticResult "Sintaxis MCP" ($LASTEXITCODE -eq 0) "node --check"
}

$mergeScript = Join-Path $layout.CurrentRoot "scripts\merge-mcp-config.mjs"
if ($nodeCommand -and (Test-Path -LiteralPath $mergeScript) -and (Test-Path -LiteralPath $manifest.mcpConfigPath)) {
    & $nodeCommand.Source $mergeScript --mode check --config $manifest.mcpConfigPath 2>$null | Out-Null
    Add-DiagnosticResult "Configuracion MCP" ($LASTEXITCODE -eq 0) $manifest.mcpConfigPath
} else {
    Add-DiagnosticResult "Configuracion MCP" $false $manifest.mcpConfigPath
}
$drivers = @(Get-OdbcDriver -ErrorAction SilentlyContinue | Where-Object { $_.Name -in @("IBM i Access ODBC Driver", "iSeries Access ODBC Driver", "Client Access ODBC Driver (32-bit)") })
Add-DiagnosticResult "Driver ODBC IBM i" ($drivers.Count -gt 0) $(if ($drivers.Count) { ($drivers.Name -join ", ") } else { "No se encontro un alias soportado" })

$results | Format-Table -AutoSize
if ($results.Resultado -contains "FALLO") { exit 1 }
