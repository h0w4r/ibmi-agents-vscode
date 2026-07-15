[CmdletBinding()]
param([string]$InstallRoot = (Join-Path $env:LOCALAPPDATA "ibmi-atlas-agent"))

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\IbmiAgent.Common.ps1")
$manifestPath = Join-Path ([IO.Path]::GetFullPath($InstallRoot)) "install-manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath)) { throw "No se encontro IBM i Atlas en '$manifestPath'." }
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$layout = Get-IbmiAgentLayout -InstallRoot $manifest.installRoot -CopilotHome $manifest.copilotHome -VsCodeUserDataPath $manifest.vsCodeUserDataPath
$results = New-Object System.Collections.Generic.List[object]

function Add-DiagnosticResult {
    param([string]$Check, [bool]$Ok, [string]$Detail)
    $script:results.Add([pscustomobject]@{ Verificacion = $Check; Resultado = $(if ($Ok) { "OK" } else { "FALLO" }); Detalle = $Detail })
}

function Test-SelectableModelMetadata {
    param([string]$Text)
    # Sin model en frontmatter, VS Code usa el modelo elegido en Copilot Chat.
    return -not [regex]::IsMatch($Text, '(?m)^model\s*:')
}

Add-DiagnosticResult "Producto" ($manifest.productId -eq "ibmi-atlas") "$($manifest.displayName) $($manifest.version)"
$mainAgentPath = Join-Path $layout.AgentsRoot "ibmi-atlas.agent.md"
$mainText = if (Test-Path -LiteralPath $mainAgentPath) { Get-Content -LiteralPath $mainAgentPath -Raw } else { "" }
Add-DiagnosticResult "Agente principal" (Test-Path -LiteralPath $mainAgentPath) $mainAgentPath
Add-DiagnosticResult "Modelo seleccionable" (Test-SelectableModelMetadata -Text $mainText) "Usa el selector de Copilot Chat"

$subagentsOk = $true
foreach ($name in @($manifest.agents | Where-Object { $_ -ne "ibmi-atlas.agent.md" })) {
    $path = Join-Path $layout.AgentsRoot $name
    $text = if (Test-Path -LiteralPath $path) { Get-Content -LiteralPath $path -Raw } else { "" }
    if (-not (Test-SelectableModelMetadata -Text $text) -or -not $text.Contains('user-invocable: false')) { $subagentsOk = $false }
}
Add-DiagnosticResult "Subagentes portables" $subagentsOk "Sin model fijo; heredan el principal"

$skillsOk = @($manifest.skills | Where-Object { Test-Path -LiteralPath (Join-Path $layout.SkillsRoot "$_\SKILL.md") }).Count -eq @($manifest.skills).Count
$promptsOk = @($manifest.prompts | Where-Object { Test-Path -LiteralPath (Join-Path $layout.PromptsRoot $_) }).Count -eq @($manifest.prompts).Count
Add-DiagnosticResult "Skills globales" $skillsOk "$(@($manifest.skills).Count) skills"
Add-DiagnosticResult "Prompts de usuario" $promptsOk "$(@($manifest.prompts).Count) prompts"
$promptModelsOk = $true
foreach ($name in @($manifest.prompts)) {
    $path = Join-Path $layout.PromptsRoot $name
    $text = if (Test-Path -LiteralPath $path) { Get-Content -LiteralPath $path -Raw } else { "" }
    if (-not (Test-SelectableModelMetadata -Text $text)) { $promptModelsOk = $false }
}
Add-DiagnosticResult "Prompts portables" $promptModelsOk "Usan el modelo activo de Copilot Chat"
Add-DiagnosticResult "Ruta VS Code" (Test-Path -LiteralPath $layout.VsCodeUserData) $layout.VsCodeUserData

Add-DiagnosticResult "Integridad Atlas" ($manifest.agents.Count -eq 6 -and $manifest.prompts.Count -eq 14) "6 agentes y 14 prompts autocontenidos"

$results | Format-Table -AutoSize
if ($results.Resultado -contains "FALLO") { exit 1 }
