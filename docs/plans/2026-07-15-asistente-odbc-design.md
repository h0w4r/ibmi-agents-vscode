# Diseno - Asistente ODBC Para IBM i Senior

## Objetivo

Garantizar que IBM i Senior solo registre y active `ibmi-local` cuando Windows disponga de un driver ODBC IBM i compatible con el proceso Node.js de 64 bits.

## Flujo Aprobado

1. Validar Windows y Node.js de 64 bits.
2. Inventariar exclusivamente drivers ODBC registrados para 64 bits.
3. Priorizar `IBM i Access ODBC Driver` y aceptar aliases heredados soportados con advertencia; la actualizacion queda a eleccion del usuario.
4. Si el driver existe, continuar sin preguntas y registrar el alias realmente detectado.
5. Si falta, detener la instalacion antes de modificar VS Code o el paquete global.
6. En modo interactivo, ofrecer abrir la descarga oficial, seleccionar un `setup.exe`, volver a comprobar o cancelar.
7. Antes de elevar el instalador, validar que sea un archivo local `setup.exe` con firma Authenticode valida de IBM.
8. Ejecutar el instalador con `ADDLOCAL=req,odbc`, esperar su salida y volver a inventariar.
9. Mantener el asistente hasta detectar el requisito o recibir una cancelacion explicita.
10. En modo no interactivo, fallar con instrucciones accionables sin abrir navegador, UAC ni procesos externos.

## Componentes

| Componente | Responsabilidad |
| --- | --- |
| `scripts/lib/IbmiOdbcPrerequisite.ps1` | Inventario, seleccion, validacion de firma y orquestacion interactiva |
| `scripts/Install-IbmiOdbcPrerequisite.ps1` | Entrada independiente para reparar o comprobar el prerrequisito |
| `scripts/Install-IbmiSenior.ps1` | Ejecutar el prerrequisito antes de staging, backups o cambios en VS Code |
| `scripts/Update-IbmiSenior.ps1` | Propagar opciones del asistente y conservar compatibilidad |
| `scripts/Test-IbmiSenior.ps1` | Confirmar que el alias del manifiesto sigue registrado para 64 bits |
| `scripts/Test-IbmiOdbcPrerequisite.Unit.ps1` | Probar seleccion y errores con inventarios simulados |

## Contratos

- `-OdbcDriver` es opcional. Si se omite, se selecciona el mejor alias detectado.
- `-OdbcInstallerPath` permite proporcionar un `setup.exe` ya descargado y extraido.
- `-NonInteractive` impide prompts, navegador, UAC y ejecucion de instaladores.
- La descarga no se automatiza porque IBM puede exigir autenticacion y aceptacion de licencia.
- El asistente nunca prueba hosts, usuarios, passwords ni conexiones IBM i.
- Un alias cuyo nombre contiene `32-bit` solo es aceptable cuando aparece en el inventario de plataforma ODBC de 64 bits.

## Seguridad

- No se ejecutan URLs ni rutas remotas como instaladores.
- No se ejecuta un archivo sin firma Authenticode valida de IBM.
- La elevacion ocurre unicamente despues de mostrar la ruta validada y obtener confirmacion.
- Se aceptan los codigos de salida de Windows Installer para exito y reinicio requerido; cualquier otro codigo detiene el flujo.
- El MCP no se registra si la comprobacion final no encuentra un driver compatible.

## Criterios De Aceptacion

- Un equipo con driver actual continua sin preguntas.
- Un equipo con alias heredado continua y muestra advertencia.
- La presencia de un alias heredado compatible nunca fuerza la instalacion del driver actual.
- Un equipo sin driver recibe un flujo guiado y no queda con una instalacion parcial.
- El modo no interactivo falla antes de modificar el sistema.
- Un instalador inexistente, remoto, no firmado o firmado por otro editor se bloquea.
- Tras una instalacion valida se vuelve a comprobar el registro ODBC de 64 bits.
- Atlas permanece completamente independiente de este asistente.
