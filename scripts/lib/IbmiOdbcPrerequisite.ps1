$script:IbmiOdbcDownloadUrl = "https://www.ibm.com/support/pages/ibm-i-access-client-solutions"
$script:IbmiOdbcDriverDefinitions = @(
    [pscustomobject]@{ Name = "IBM i Access ODBC Driver"; Priority = 300; IsLegacy = $false },
    [pscustomobject]@{ Name = "iSeries Access ODBC Driver"; Priority = 200; IsLegacy = $true },
    [pscustomobject]@{ Name = "Client Access ODBC Driver (32-bit)"; Priority = 100; IsLegacy = $true }
)

function Get-IbmiSupportedOdbcDriverNames {
    return @($script:IbmiOdbcDriverDefinitions.Name)
}

function Get-IbmiOdbcDriversFromRegistry64 {
    $baseKey = $null
    $driversKey = $null
    try {
        $baseKey = [Microsoft.Win32.RegistryKey]::OpenBaseKey(
            [Microsoft.Win32.RegistryHive]::LocalMachine,
            [Microsoft.Win32.RegistryView]::Registry64
        )
        $driversKey = $baseKey.OpenSubKey("SOFTWARE\ODBC\ODBCINST.INI\ODBC Drivers")
        if (-not $driversKey) { return @() }

        $drivers = New-Object System.Collections.Generic.List[object]
        foreach ($name in $driversKey.GetValueNames()) {
            if ([string]$driversKey.GetValue($name) -ne "Installed") { continue }
            $detailKey = $null
            try {
                $detailKey = $baseKey.OpenSubKey("SOFTWARE\ODBC\ODBCINST.INI\$name")
                $driverPath = if ($detailKey) { [string]$detailKey.GetValue("Driver") } else { "" }
                $drivers.Add([pscustomobject]@{
                    Name       = $name
                    Platform   = "64-bit"
                    DriverPath = $driverPath
                    Source     = "Registry64"
                })
            }
            finally {
                if ($detailKey) { $detailKey.Dispose() }
            }
        }
        return @($drivers)
    }
    finally {
        if ($driversKey) { $driversKey.Dispose() }
        if ($baseKey) { $baseKey.Dispose() }
    }
}

function ConvertTo-IbmiOdbcDriverRecord {
    param([Parameter(Mandatory = $true)]$DriverEntry)

    $name = [string]$DriverEntry.Name
    $definition = @($script:IbmiOdbcDriverDefinitions | Where-Object { $_.Name -eq $name } | Select-Object -First 1)
    if ($definition.Count -eq 0) { return $null }

    $platform = if ($DriverEntry.PSObject.Properties.Name -contains "Platform") {
        [string]$DriverEntry.Platform
    } else {
        "64-bit"
    }

    $driverPath = ""
    if ($DriverEntry.PSObject.Properties.Name -contains "DriverPath") {
        $driverPath = [string]$DriverEntry.DriverPath
    } elseif ($DriverEntry.PSObject.Properties.Name -contains "Attribute" -and $DriverEntry.Attribute) {
        $driverPath = [string]$DriverEntry.Attribute["Driver"]
    }
    $driverPath = [Environment]::ExpandEnvironmentVariables($driverPath)

    $version = ""
    if ($DriverEntry.PSObject.Properties.Name -contains "Version") {
        $version = [string]$DriverEntry.Version
    }
    if ([string]::IsNullOrWhiteSpace($version) -and -not [string]::IsNullOrWhiteSpace($driverPath) -and (Test-Path -LiteralPath $driverPath -PathType Leaf)) {
        $version = [string](Get-Item -LiteralPath $driverPath).VersionInfo.FileVersion
    }

    $source = if ($DriverEntry.PSObject.Properties.Name -contains "Source") {
        [string]$DriverEntry.Source
    } else {
        "Get-OdbcDriver"
    }

    return [pscustomobject]@{
        Name       = $name
        Platform   = $platform
        Version    = $version
        DriverPath = $driverPath
        Source     = $source
        IsCurrent  = -not [bool]$definition[0].IsLegacy
        IsLegacy   = [bool]$definition[0].IsLegacy
        Priority   = [int]$definition[0].Priority
    }
}

function Get-IbmiOdbcDriverInventory {
    param([AllowEmptyCollection()][object[]]$DriverEntries)

    if ($PSBoundParameters.ContainsKey("DriverEntries")) {
        $rawDrivers = @($DriverEntries)
    } else {
        $getOdbcDriver = Get-Command "Get-OdbcDriver" -ErrorAction SilentlyContinue
        if ($getOdbcDriver) {
            try {
                $rawDrivers = @(& $getOdbcDriver -Platform "64-bit" -ErrorAction Stop)
            }
            catch {
                $rawDrivers = @(Get-IbmiOdbcDriversFromRegistry64)
            }
        } else {
            $rawDrivers = @(Get-IbmiOdbcDriversFromRegistry64)
        }
    }

    $inventory = New-Object System.Collections.Generic.List[object]
    foreach ($entry in $rawDrivers) {
        $record = ConvertTo-IbmiOdbcDriverRecord -DriverEntry $entry
        if ($record -and $record.Platform -eq "64-bit") { $inventory.Add($record) }
    }

    return @($inventory | Sort-Object -Property @{ Expression = "Priority"; Descending = $true }, Name -Unique)
}

function Select-IbmiOdbcDriver {
    param(
        [AllowEmptyCollection()][object[]]$Inventory = @(),
        [string]$PreferredDriver
    )

    $supportedNames = @(Get-IbmiSupportedOdbcDriverNames)
    if (-not [string]::IsNullOrWhiteSpace($PreferredDriver) -and $PreferredDriver -notin $supportedNames) {
        throw "Driver ODBC no soportado: '$PreferredDriver'. Valores permitidos: $($supportedNames -join ', ')."
    }

    if (-not [string]::IsNullOrWhiteSpace($PreferredDriver)) {
        return @($Inventory | Where-Object { $_.Name -eq $PreferredDriver } | Select-Object -First 1)[0]
    }

    return @($Inventory | Sort-Object -Property @{ Expression = "Priority"; Descending = $true }, Name | Select-Object -First 1)[0]
}

function Test-IbmiOdbcInstaller {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "No se encontro el instalador ODBC en '$Path'."
    }

    $resolvedPath = [IO.Path]::GetFullPath($Path)
    if ($resolvedPath.StartsWith("\\", [StringComparison]::OrdinalIgnoreCase)) {
        throw "El instalador debe estar en un disco local; no se ejecutan rutas UNC."
    }
    if ([IO.Path]::GetFileName($resolvedPath) -ne "setup.exe") {
        throw "Seleccione el archivo setup.exe extraido del Windows Application Package oficial."
    }

    $signatureCommand = Get-Command "Get-AuthenticodeSignature" -ErrorAction SilentlyContinue
    if (-not $signatureCommand) {
        throw "Windows no dispone de Get-AuthenticodeSignature para validar el instalador."
    }

    $signature = & $signatureCommand -FilePath $resolvedPath
    if ($signature.Status -ne [System.Management.Automation.SignatureStatus]::Valid -or -not $signature.SignerCertificate) {
        throw "La firma Authenticode de setup.exe no es valida. Ejecute solamente el paquete oficial de IBM."
    }

    $publisher = "$($signature.SignerCertificate.Subject) $($signature.SignerCertificate.Issuer)"
    if ($publisher -notmatch "(?i)(\bIBM\b|International Business Machines)") {
        throw "El editor de setup.exe no corresponde a IBM; el asistente no lo ejecutara."
    }

    return [pscustomobject]@{
        Path      = $resolvedPath
        Publisher = $signature.SignerCertificate.Subject
        Thumbprint = $signature.SignerCertificate.Thumbprint
    }
}

function Invoke-IbmiOdbcInstaller {
    param([Parameter(Mandatory = $true)]$ValidatedInstaller)

    Write-Host "Instalador validado: $($ValidatedInstaller.Path)" -ForegroundColor Green
    Write-Host "Editor: $($ValidatedInstaller.Publisher)"
    $confirmation = (Read-Host "Ejecutar setup.exe con elevacion para instalar Required Programs y ODBC? [S/N]").Trim()
    if ($confirmation -notmatch "^(?i:s|si|y|yes)$") {
        return [pscustomobject]@{ Executed = $false; RebootRequired = $false; ExitCode = $null }
    }

    # La interfaz de IBM permanece visible; UAC y la licencia siguen bajo control del usuario.
    $process = Start-Process -FilePath $ValidatedInstaller.Path -ArgumentList "/vADDLOCAL=req,odbc" -Verb RunAs -Wait -PassThru
    $acceptedExitCodes = @(0, 1641, 3010)
    if ($process.ExitCode -notin $acceptedExitCodes) {
        throw "El instalador de IBM termino con codigo $($process.ExitCode). Revise su interfaz o log antes de reintentar."
    }

    return [pscustomobject]@{
        Executed      = $true
        RebootRequired = $process.ExitCode -in @(1641, 3010)
        ExitCode      = $process.ExitCode
    }
}

function Resolve-IbmiOdbcPrerequisite {
    param(
        [string]$PreferredDriver,
        [string]$InstallerPath,
        [switch]$NonInteractive,
        [scriptblock]$InventoryProvider
    )

    if (-not [Environment]::Is64BitOperatingSystem) {
        throw "IBM i Senior requiere Windows de 64 bits y un driver ODBC IBM i de 64 bits."
    }

    $pendingInstaller = $InstallerPath
    while ($true) {
        # El proveedor inyectable permite verificar el flujo sin consultar el registro durante las pruebas.
        $inventory = if ($InventoryProvider) { @(& $InventoryProvider) } else { @(Get-IbmiOdbcDriverInventory) }
        $selected = Select-IbmiOdbcDriver -Inventory $inventory -PreferredDriver $PreferredDriver
        if ($selected) {
            Write-Host "Driver ODBC IBM i detectado: $($selected.Name) [$($selected.Platform)]" -ForegroundColor Green
            if (-not [string]::IsNullOrWhiteSpace($selected.Version)) { Write-Host "Version: $($selected.Version)" }
            if ($selected.IsLegacy) {
                Write-Warning "Se detecto un driver ODBC IBM i heredado compatible. El requisito esta cumplido y la instalacion continuara; actualizar a IBM i Access Client Solutions Windows Application Package es opcional. Descarga: $script:IbmiOdbcDownloadUrl"
            }
            return $selected
        }

        if ($NonInteractive) {
            $expected = if ([string]::IsNullOrWhiteSpace($PreferredDriver)) { (Get-IbmiSupportedOdbcDriverNames) -join ", " } else { $PreferredDriver }
            throw "No se encontro un driver ODBC IBM i de 64 bits compatible ($expected). Instale IBM i Access Client Solutions Windows Application Package y vuelva a ejecutar el instalador. Descarga: $script:IbmiOdbcDownloadUrl"
        }

        if (-not [string]::IsNullOrWhiteSpace($pendingInstaller)) {
            $validated = Test-IbmiOdbcInstaller -Path $pendingInstaller
            $result = Invoke-IbmiOdbcInstaller -ValidatedInstaller $validated
            $pendingInstaller = ""
            if ($result.Executed -and $result.RebootRequired) {
                Write-Warning "Windows Installer solicito reinicio. Si el driver aun no aparece, reinicie Windows y ejecute de nuevo el asistente."
            }
            continue
        }

        Write-Host "No se encontro un driver ODBC IBM i compatible para 64 bits." -ForegroundColor Yellow
        Write-Host "[D] Abrir descarga oficial de IBM"
        Write-Host "[I] Indicar setup.exe ya descargado y extraido"
        Write-Host "[R] Volver a comprobar"
        Write-Host "[C] Cancelar sin modificar VS Code"
        $choice = (Read-Host "Seleccione una opcion").Trim().ToUpperInvariant()

        switch ($choice) {
            "D" {
                # El navegador es visible porque el usuario debe iniciar sesion y aceptar la licencia de IBM.
                Start-Process $script:IbmiOdbcDownloadUrl
                Write-Host "Descargue Windows Application Package de 64 bits, extraigalo y luego seleccione la opcion I."
            }
            "I" { $pendingInstaller = (Read-Host "Ruta local al setup.exe extraido").Trim().Trim('"') }
            "R" { continue }
            "C" { throw "Instalacion cancelada: el MCP no se registro porque falta el driver ODBC IBM i." }
            default { Write-Warning "Opcion no reconocida." }
        }
    }
}
