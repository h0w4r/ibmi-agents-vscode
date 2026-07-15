# LEEME - IBM i Senior Para VS Code

Esta guia instala `ibmi-senior`, sus subagentes, prompts, skills, documentacion y el MCP `ibmi-local` en el perfil de usuario. Despues de instalarlo, el agente queda disponible en VS Code desde cualquier proyecto: **no es necesario abrir esta carpeta como workspace**.

> Nota de privacidad: todos los hosts, perfiles, bibliotecas, objetos, jobs y programas usados en esta guia son ejemplos sinteticos. No publiques valores reales de tu organizacion en prompts, capturas, incidencias o contribuciones.

## Que Instala

| Componente | Destino predeterminado | Alcance |
| --- | --- | --- |
| 6 agentes `.agent.md` | `%USERPROFILE%\.copilot\agents` | Todos los workspaces del usuario |
| 14 skills | `%USERPROFILE%\.copilot\skills` | Todos los workspaces del usuario |
| 14 prompts | Carpeta `prompts` de la edicion VS Code detectada | Perfil VS Code seleccionado |
| MCP, docs y runtime | `%LOCALAPPDATA%\ibmi-senior-agent\current` | Ruta estable independiente del repositorio |
| Configuracion MCP | `mcp.json` de la edicion VS Code detectada | MCP global del perfil VS Code |
| Auditoria local | `%LOCALAPPDATA%\ibmi-senior-agent\logs\audit.log` | Sin passwords ni secretos |

El paquete no incluye `.vscode/mcp.json`: abrir el repositorio no constituye la instalacion y no activa un MCP de workspace.

## Capacidades En Una Mirada

| Area | Que puede hacer | Evidencia que utiliza |
| --- | --- | --- |
| RPGLE y SQLRPGLE | Explicar, revisar, corregir, modernizar y generar codigo fijo o free-form | Fuentes del workspace o miembros leidos desde IBM i |
| CLLE y comandos | Analizar programas CL, preparar comandos y ejecutar un conjunto restringido de consultas | Fuentes CLLE, allowlist y auditoria local |
| DDS | Revisar o generar PF, LF y DSPF, incluidos subfiles, indicadores, teclas y reglas select/omit | DDS del workspace, miembros fuente y metadata de objetos |
| Db2 for i | Buscar tablas/columnas, describir objetos y ejecutar SQL de solo lectura | Catalogos `QSYS2`, vistas y consultas `SELECT/WITH/VALUES` |
| Diagnostico | Investigar job logs, mensajes RNF/CPF/MCH/SQL y separar causa de sintomas | `JOBLOG_INFO`, message files y documentacion local |
| Spool | Localizar y leer spool por job, usuario, nombre y numero | `OUTPUT_QUEUE_ENTRIES` y `SPOOLED_FILE_DATA` |
| Objetos y fuentes | Consultar metadata y leer miembros de source physical files | `OBJECT_STATISTICS` e `IFS_READ` sobre `/QSYS.LIB` |
| ILE y compilacion | Preparar planes para programas, modulos, service programs, comandos y DDS | Parametros proporcionados y reglas de compilacion, sin ejecutar |
| APIs IBM i | Localizar y explicar APIs como `QCMDEXC`, `QCAPCMD` o `QMHRTVM` | Documentacion IBM i instalada |
| QA, seguridad y rendimiento | Proponer pruebas, revisar autoridades, SQL, activation groups y riesgos | Codigo, metadata, logs, consultas y artefactos aportados |

El agente combina evidencia del workspace con informacion viva del IBM i configurado. Cuando una respuesta dependa de un dato no disponible, debe identificarlo como faltante en vez de inventarlo.

## Prerrequisitos Y Descargas

| Prerrequisito | Minimo/recomendado | Descarga oficial |
| --- | --- | --- |
| Windows | Windows 10/11 de 64 bits | Incluido con el equipo |
| Visual Studio Code | `1.128.0` o posterior para GPT-5.6 | [Descargar VS Code](https://code.visualstudio.com/download) |
| GitHub Copilot | Extension habilitada y sesion iniciada | [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) |
| GitHub Copilot Chat | Instalar si VS Code la muestra separada | [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) |
| Node.js | LTS 20 o posterior, 64 bits | [Descargar Node.js](https://nodejs.org/en/download) |
| IBM i ACS Windows Application Package | `1.1.0.29` o posterior, 64 bits | [IBM i Access Client Solutions](https://www.ibm.com/support/pages/ibm-i-access-client-solutions) |
| Git para Windows | Opcional para clonar/actualizar el paquete | [Descargar Git](https://git-scm.com/download/win) |

La version del Windows Application Package verificada el 15/07/2026 es `1.1.0.29`. Si IBM publica una posterior, usa la version vigente de 64 bits. La descarga puede requerir IBM ID.

### ACS Java No Es El Driver ODBC

IBM i Access Client Solutions `1.1.9.x` es principalmente la aplicacion Java con emulador 5250, Run SQL Scripts y transferencia de datos. El driver nativo que Node.js necesita se distribuye en el **IBM i ACS Windows Application Package**.

| Pieza | Funcion | Verificacion |
| --- | --- | --- |
| Paquete npm `odbc` | Enlace Node.js hacia ODBC | El instalador lo coloca bajo `%LOCALAPPDATA%\ibmi-senior-agent\current\mcp\ibmi-local\node_modules` |
| Driver IBM i para Windows | Conexion ODBC real contra Db2 for i | `Get-OdbcDriver -Platform "64-bit"` |

Comprueba drivers registrados:

```powershell
node -p "process.arch"
Get-OdbcDriver -Platform "64-bit" |
  Where-Object { $_.Name -like "*IBM*" -or $_.Name -like "*iSeries*" -or $_.Name -like "*Client Access*" } |
  Select-Object Name, Platform, Version
```

El MCP admite estos nombres exactos:

| Driver | Uso |
| --- | --- |
| `IBM i Access ODBC Driver` | Recomendado para ACS Windows Application Package actual |
| `iSeries Access ODBC Driver` | Compatibilidad con IBM i Access for Windows 7.1 existente |
| `Client Access ODBC Driver (32-bit)` | Alias historico; usar solo si es el nombre disponible |

IBM i Access for Windows 7.1 esta fuera de soporte y no es la recomendacion para una instalacion nueva en Windows 11. El agente mantiene su alias para equipos existentes, pero la version indicada a nuevos usuarios es **ACS Windows Application Package 1.1.0.29 o posterior, 64 bits**.

## Asistente ODBC Integrado

`Install-IbmiSenior.ps1` comprueba el prerequisito antes de crear staging, backups o configuracion de VS Code.

| Situacion | Comportamiento |
| --- | --- |
| Driver actual registrado para 64 bits | Lo selecciona automaticamente y continua sin preguntas |
| Solo existe un alias heredado para 64 bits | Lo selecciona, informa que la actualizacion es opcional y continua sin forzarla |
| No existe un driver compatible | Abre el asistente y no modifica VS Code hasta resolverlo |
| Modo `-NonInteractive` sin driver | Falla de inmediato con la descarga oficial y no abre navegador ni UAC |
| Alias con texto `32-bit` | Solo se acepta si Windows lo devuelve desde el inventario de plataforma `64-bit` |

Cuando falta el driver, el asistente permite:

1. Abrir la descarga oficial de IBM en el navegador.
2. Indicar la ruta local al `setup.exe` ya descargado y extraido.
3. Volver a comprobar despues de una instalacion manual.
4. Cancelar sin dejar una instalacion parcial.

Antes de ejecutar `setup.exe`, comprueba que sea un archivo local, que tenga firma Authenticode valida y que el editor sea IBM. Luego solicita confirmacion, muestra UAC y ejecuta la interfaz oficial con `ADDLOCAL=req,odbc`. La descarga, el IBM ID y la aceptacion de licencia permanecen bajo control del usuario.

Tambien puedes ejecutar solamente el asistente:

```powershell
.\scripts\Install-IbmiOdbcPrerequisite.ps1
```

Si existe un driver heredado, este comando lo acepta y termina correctamente. Para optar voluntariamente por el driver actual, exige ese alias de forma explicita:

```powershell
.\scripts\Install-IbmiOdbcPrerequisite.ps1 `
  -OdbcDriver "IBM i Access ODBC Driver"
```

Si ya descargaste y extrajiste el Windows Application Package:

```powershell
.\scripts\Install-IbmiSenior.ps1 `
  -OdbcInstallerPath "D:\Descargas\IBMiACS\setup.exe"
```

Para automatizaciones que deben fallar en vez de preguntar:

```powershell
.\scripts\Install-IbmiSenior.ps1 -NonInteractive
```

El asistente nunca intenta conectarse a un host IBM i ni valida usuarios o passwords.

## Instalacion Global Automatica

1. Descarga `ibmi-senior-vX.Y.Z.zip` desde la [ultima release publica](https://github.com/h0w4r/ibmi-agents-vscode/releases/latest).
2. Extrae el ZIP en cualquier carpeta; la ubicacion de descarga no sera el destino definitivo.
3. Abre PowerShell en la carpeta extraida y ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\Install-IbmiSenior.ps1
```

No necesitas conocer el nombre del driver instalado. El instalador prioriza el driver ACS actual y selecciona automaticamente un alias heredado compatible cuando sea la unica opcion. `-OdbcDriver` queda disponible para exigir un alias concreto.

El instalador realiza estas operaciones:

1. Valida Node.js 20+ de arquitectura x64 y la estructura del paquete.
2. Detecta y selecciona un driver ODBC IBM i registrado para 64 bits.
3. Si falta, ejecuta el asistente antes de modificar el equipo.
4. Crea un staging bajo `%LOCALAPPDATA%\ibmi-senior-agent`.
5. Ejecuta `npm ci`, compila TypeScript y deja solo dependencias de runtime.
6. Detecta VS Code estable, VS Code Insiders o modo portable sin preguntar rutas.
7. Copia agentes, skills y prompts a ubicaciones globales/de usuario.
8. Migra con backup agentes Senior manuales antiguos encontrados en la carpeta `prompts`.
9. Mezcla `ibmi-local` en el `mcp.json` de usuario mediante parser JSONC.
10. Conserva comentarios, servidores MCP ajenos y crea backup antes de modificar.
11. Genera `install-manifest.json` con alias, plataforma y version ODBC detectados.

No copia passwords ni intenta conectarse a IBM i durante la instalacion.

## Convivencia Con IBM i Atlas

`IBM i Atlas` es el perfil portable de analisis, desarrollo, diagnostico y QA. Usa identidades, prompts, manifiesto y scripts independientes, por lo que puede instalarse en el mismo usuario y perfil VS Code. Descarga su ZIP propio y ejecuta:

```powershell
.\scripts\Install-IbmiAtlas.ps1
```

La instalacion conserva `ibmi-senior` y agrega `ibmi-atlas`; ninguno reemplaza agentes ni prompts del otro. Las skills IBM i son una base comun y el desinstalador las conserva mientras cualquiera de las dos ediciones siga instalada.

La guia dedicada para usuarios de Atlas es [LEEME-ATLAS.md](LEEME-ATLAS.md).

## Modelos GPT-5.6

| Rol | Modelo fijado en `.agent.md` | Thinking Effort recomendado |
| --- | --- | --- |
| Orquestador `ibmi-senior` | `GPT-5.6 Sol (copilot)` | `Extra High` |
| Cinco subagentes | `GPT-5.6 Terra (copilot)` | `Extra High` para tareas complejas |

VS Code permite fijar el modelo mediante `model`, pero el esfuerzo se configura desde el submenu **Thinking Effort** del selector de modelos. No existe un campo soportado en el frontmatter para imponer `Extra High`. VS Code recuerda el nivel por sesion y las conversaciones nuevas parten del ultimo nivel elegido para ese modelo.

Para configurarlo:

1. Abre el selector de modelos de Copilot Chat.
2. Selecciona `GPT-5.6 Sol`.
3. Abre `Thinking Effort` y elige `Extra High`.
4. Repite con `GPT-5.6 Terra` si quieres que las delegaciones usen ese nivel.

Si la organizacion no habilito alguno de los modelos, revisa `Chat: Manage Language Models` o la politica de modelos de GitHub Copilot. No agregues un fallback mas caro a los subagentes: eso anularia el control de costo buscado.

## Autodeteccion De Rutas

El instalador no contiene rutas de este equipo y no abre preguntas interactivas para elegir carpetas. Resuelve los destinos en tiempo de ejecucion:

| Prioridad | Condicion | Destino |
| --- | --- | --- |
| 1 | Se proporciono `-VsCodeUserDataPath` | Usa exactamente esa carpeta |
| 2 | Existe `VSCODE_PORTABLE` | `%VSCODE_PORTABLE%\user-data\User` |
| 3 | Solo `code-insiders` esta en `PATH` | `%APPDATA%\Code - Insiders\User` |
| 4 | Solo `code` esta en `PATH` | `%APPDATA%\Code\User` |
| 5 | Solo existe una de las carpetas anteriores | Usa la existente |
| 6 | Ambas existen o ninguna es concluyente | Usa VS Code estable y muestra la ruta elegida |

Los agentes y skills se instalan en `%USERPROFILE%\.copilot` y los archivos administrados en `%LOCALAPPDATA%\ibmi-senior-agent`. Ambos valores se calculan mediante variables estandar de Windows, no mediante nombres de usuario hardcodeados.

## Perfiles Personalizados De VS Code

Los prompts y `mcp.json` pertenecen al perfil VS Code seleccionado. Para un perfil personalizado:

Para el perfil predeterminado no necesitas parametros adicionales. Si usas un perfil VS Code distinto:

1. En ese perfil ejecuta `MCP: Open User Configuration`.
2. Copia la ruta del `mcp.json` abierto.
3. Usa la carpeta padre como `-VsCodeUserDataPath`.

Ejemplo:

```powershell
.\scripts\Install-IbmiSenior.ps1 `
  -VsCodeUserDataPath "$env:APPDATA\Code\User\profiles\<id-del-perfil>" `
  -OdbcDriver "iSeries Access ODBC Driver"
```

Para forzar VS Code Insiders, usa `-VsCodeUserDataPath "$env:APPDATA\Code - Insiders\User"`.

## Variables De Conexion IBM i

El instalador registra inputs seguros. VS Code resuelve estos valores al iniciar `ibmi-local` y los entrega al proceso como variables de entorno.

### Variables Principales

| Variable | Obligatoria | Ejemplo | Significado real |
| --- | --- | --- | --- |
| `IBMI_PROFILE` | No | `DESARROLLO`, `PRUEBAS`, `PRODUCCION-LECTURA` | Etiqueta local para identificar ambiente/conexion en respuestas y auditoria. No es un objeto IBM i ni sustituye a `IBMI_USER`. Tambien participa en la identidad del circuito de autenticacion. |
| `IBMI_HOST` | Si | `ibmi.example.com` | DNS o IP del IBM i que recibe la conexion DSN-less. Debe ser alcanzable desde Windows y corresponder al ambiente correcto. El MCP nunca cambia este host automaticamente. |
| `IBMI_USER` | Si | `USRAPP` | Perfil IBM i usado por ODBC. Sus autoridades determinan tablas, servicios y objetos consultables. No se prueban usuarios alternativos. |
| `IBMI_PASSWORD` | Si | No documentar | Password del perfil IBM i. Se solicita como `promptString` con `password: true`, no aparece en `mcp.json`, logs ni auditoria del agente. |
| `IBMI_NAMING` | No | `system` | Convencion de nombres de la conexion ODBC. `system` usa semantica tradicional IBM i; `sql` usa semantica SQL. No cambia la politica read-only. |

### `IBMI_PROFILE`

`IBMI_PROFILE` es una etiqueta del lado del agente. Usa un nombre inequivoco para evitar confundir ambientes:

```text
DESARROLLO
PRUEBAS
PRODUCCION-LECTURA
```

No coloques el password ni datos sensibles en esta etiqueta. Una combinacion conceptual de `IBMI_HOST + IBMI_PROFILE + IBMI_USER` identifica la conexion protegida por el circuito de autenticacion.

### `IBMI_HOST`

- Usa el hostname corporativo cuando DNS sea estable; usa IP solo si esa es la configuracion aprobada.
- No incluyas `http://`, `https://`, biblioteca, schema ni usuario.
- Si el servidor exige cifrado ODBC, selecciona `IBMI_SSL=true` y valida la configuracion TLS del driver/servidor.
- Un timeout o servidor no alcanzable se clasifica como conexion; no se confunde con password invalido.

### `IBMI_USER`

- Es el perfil real de inicio de sesion IBM i.
- Conviene usar un perfil nominal y de minimo privilegio para consulta.
- La autoridad insuficiente sobre una vista/objeto produce `IBMI_AUTHORITY_DENIED`; no abre el circuito de credenciales.
- Un rechazo real de login produce `IBMI_AUTHENTICATION_FAILED` y abre el circuito local.

### `IBMI_PASSWORD`

- VS Code lo solicita ocultando el texto.
- VS Code indica oficialmente que un input MCP se pide al primer arranque y se almacena de forma segura para usos posteriores.
- No se guarda en el repositorio, `mcp.json`, manifiesto ni auditoria.
- Si cambia el password, deten primero el MCP y restablece el input almacenado desde la gestion MCP del mismo perfil antes de permitir otro intento.
- No reinicies repetidamente con el password antiguo: las politicas IBM i pueden deshabilitar el perfil.

### `IBMI_NAMING`

| Valor | Separador/contexto | Ejemplo conceptual | Recomendacion |
| --- | --- | --- | --- |
| `system` | Biblioteca/archivo y lista de bibliotecas | `APPLIB/CUSTOMERF` | RPGLE, CLLE, DDS y operacion tradicional |
| `sql` | Schema.tabla y reglas SQL | `APPLIB.CUSTOMERF` | Aplicaciones SQL modernas centradas en schemas |

El MCP usa SQL calificado en sus propias consultas, por lo que ambos modos son compatibles. Elige el valor que coincida con las aplicaciones y procedimientos del ambiente.

### Variables Adicionales

| Variable | Predeterminado | Rango | Uso |
| --- | --- | --- | --- |
| `IBMI_ODBC_DRIVER` | Elegido al instalar | Tres aliases soportados | Nombre exacto registrado en Windows |
| `IBMI_SSL` | `false` | `true`/`false` | Agrega `SSL=1` a la conexion ODBC |
| `IBMI_QUERY_TIMEOUT` | `30` | 1-600 segundos | Timeout por consulta |
| `IBMI_CONNECTION_TIMEOUT` | `15` | 1-120 segundos | Timeout al abrir conexion |
| `IBMI_LOGIN_TIMEOUT` | `15` | 1-120 segundos | Timeout de autenticacion del driver |
| `IBMI_MAX_ROWS` | `200` | 1-1000 | Limite maximo para SQL read-only |
| `IBMI_DOCS_ROOT` | Ruta global instalada | Ruta local | Documentacion consultada por `ibmi.docs.search` |
| `IBMI_AUDIT_LOG` | Carpeta global `logs` | Ruta local | Auditoria redactada de operaciones permitidas/bloqueadas |

Los timeouts y `IBMI_MAX_ROWS` quedan escritos como valores no sensibles en `mcp.json`. Puedes ajustarlos con `MCP: Open User Configuration`.

## Cuando VS Code Pregunta Los Datos

VS Code no deberia pedirlos en cada tool ni en cada prompt del agente.

| Situacion | Comportamiento esperado |
| --- | --- |
| Primer arranque de `ibmi-local` en un perfil VS Code | Solicita cada input y almacena el valor de forma segura |
| Nueva tool dentro del mismo proceso MCP | Reutiliza la conexion configurada; no vuelve a preguntar |
| Reinicio normal de VS Code/MCP | Reutiliza inputs almacenados |
| Otro perfil VS Code | Tiene almacenamiento/configuracion propios y puede preguntar otra vez |
| Se borra el almacenamiento seguro, cambia el ID de input o se reinstala el perfil | Puede volver a preguntar |
| Password cambiado en IBM i | Debe resetearse/actualizarse el input antes de reiniciar el MCP |

Esta persistencia pertenece a VS Code, no al agente. `MCP: Reset Cached Tools` borra el catalogo de tools, no debe interpretarse como cambio de password.

## Multiples Ambientes Y Perfiles IBM i

### Estado Actual

La version `0.3.x` administra **una conexion IBM i activa por servidor `ibmi-local`**. Los valores `IBMI_HOST`, `IBMI_USER`, `IBMI_PASSWORD`, `IBMI_NAMING` y `IBMI_PROFILE` se cargan al iniciar un unico proceso.

`IBMI_PROFILE` no es un almacen de conexiones ni permite cambiar de ambiente durante una tool call. Es una etiqueta descriptiva para la conexion cargada, por ejemplo `DESARROLLO` o `PRUEBAS`.

| Escenario | Soporte actual | Observacion |
| --- | --- | --- |
| Un ambiente en el perfil VS Code activo | Si | Es el flujo instalado y probado |
| Cambiar el ambiente deteniendo y reconfigurando `ibmi-local` | Si, manual | Corrige todos los inputs antes de volver a iniciar |
| Un ambiente distinto por perfil de VS Code | Posible en VS Code | Cada perfil puede tener su propio `mcp.json`; el instalador actual no administra varios manifiestos a la vez |
| Varios aliases `ibmi-local-*` simultaneos en un mismo `mcp.json` | VS Code lo permite, paquete no | Requiere IDs de inputs, auditorias, circuitos y permisos de tools independientes |
| Elegir `DESARROLLO/PRUEBAS/PRODUCCION` como parametro de cada tool | No | Las tools no reciben un selector de conexion |

### Recomendacion Segura

Mientras no exista soporte multiperfil administrado, usa una sola conexion activa y sigue este cambio controlado:

1. Deten `ibmi-local` desde `MCP: List Servers`.
2. Identifica el ambiente destino antes de modificar inputs.
3. Actualiza juntos `IBMI_PROFILE`, `IBMI_HOST`, `IBMI_USER`, `IBMI_PASSWORD`, `IBMI_NAMING` e `IBMI_SSL`.
4. Verifica host y usuario fuera del flujo de autenticacion.
5. Inicia el servidor una sola vez.
6. Ejecuta `ibmi.profile.check` una sola vez y confirma `CURRENT SERVER`, `CURRENT USER`, host y etiqueta.
7. Si el login es rechazado, detente: no reinicies ni pruebes variantes hasta corregir la credencial.

Para soportar varios ambientes simultaneos de forma completa, una version futura debe crear instancias con nombres e inputs unicos, por ejemplo `ibmi-local-dev` e `ibmi-local-test`, y mantener un circuito de autenticacion separado por proceso. Duplicar manualmente solo el bloque del servidor sin adaptar el agente y el instalador no constituye una configuracion soportada.

## Primera Puesta En Marcha

1. Cierra y vuelve a abrir VS Code despues de instalar.
2. Ejecuta `Chat: Open Customizations` y confirma que aparezcan los agentes `ibmi-*`.
3. Ejecuta `MCP: List Servers`.
4. Selecciona `ibmi-local` y pulsa iniciar.
5. Revisa la configuracion y confirma confianza solo si la ruta apunta a `%LOCALAPPDATA%\ibmi-senior-agent\current`.
6. Informa los inputs de conexion.
7. Selecciona `ibmi-senior` en Copilot Chat.

Pruebas iniciales:

```text
Usa ibmi.system.capabilities y resume la version y servicios disponibles.
```

```text
Genera, sin ejecutar, un plan ILE para compilar un modulo RPGLE y enlazar un programa.
```

```text
Busca QCMDEXC en la documentacion local y explica sus riesgos desde RPGLE.
```

## Catalogo De Herramientas `ibmi-local`

Todas las tools devuelven una estructura con `data` cuando tienen exito o `error` con codigo, categoria, mensaje redactado y atributo `retryable`. Las tools que usan IBM i respetan el circuito contra reintentos de autenticacion.

| Tool | Conexion | Para que sirve | Entradas principales | Resultado y limites |
| --- | --- | --- | --- | --- |
| `ibmi.profile.check` | IBM i | Confirma ambiente, usuario, naming, driver, SSL y estado del circuito | Ninguna | Ejecuta una unica prueba `CURRENT SERVER/CURRENT USER`; no usar repetidamente ante errores |
| `ibmi.system.capabilities` | IBM i | Detecta version, CPU, memoria y servicios SQL disponibles | Ninguna | Informa disponibilidad de `JOBLOG_INFO`, `IFS_READ`, `OBJECT_STATISTICS`, spool y message files |
| `ibmi.db2.query.readonly` | IBM i | Ejecuta SQL parametrizado de solo lectura | `sql`, `params` opcional | Solo `SELECT`, `WITH` o `VALUES`; aplica `IBMI_MAX_ROWS`, 200 por defecto |
| `ibmi.db2.catalog.search` | IBM i | Busca objetos y columnas por nombre o texto | `term`, `schema` opcional | Devuelve coincidencias de `SYSTABLES` y `SYSCOLUMNS2` |
| `ibmi.db2.object.describe` | IBM i | Describe una tabla o vista | `schema`, `object` | Columnas, tipos, CCSID, nullability, defaults, indices y keys |
| `ibmi.joblog.get` | IBM i | Recupera el job log ordenado | `qualifiedJobName` | Requiere nombre calificado, por ejemplo `123456/USER/JOB`; devuelve mensajes y segundo nivel |
| `ibmi.spool.list` | IBM i | Lista spool reciente | `jobName` o `userName`, ambos opcionales | Devuelve identidad del job, spool, output queue y timestamp |
| `ibmi.spool.get` | IBM i | Lee lineas de un spool | `jobName`, `spooledFileName`, numero opcional, `startLine`, `maxLines` | Pagina entre 1 y 1000 lineas mediante `SPOOLED_FILE_DATA` |
| `ibmi.object.info` | IBM i | Consulta metadata de un objeto | `library`, `object`, `objectType` | Usa `OBJECT_STATISTICS`; `objectType` usa `*ALL` por defecto |
| `ibmi.source.member.read` | IBM i | Lee un miembro fuente | `library`, `file`, `member` | Lee `/QSYS.LIB/...MBR` mediante `IFS_READ`; no modifica el miembro |
| `ibmi.compile.plan` | Local | Genera un comando de compilacion sin ejecutarlo | Lenguaje, biblioteca, objeto, fuente y opciones ILE | Soporta RPGLE, RPGMOD, SQLRPGLE, SQLRPGMOD, CLLE, DSPF, PF, LF, CMD, PGM y SRVPGM |
| `ibmi.message.explain` | Local | Busca orientacion sobre un ID de mensaje | `messageId` | Consulta documentacion instalada; util para RNF, CPF, MCH y SQL |
| `ibmi.message.retrieve` | IBM i | Recupera la definicion real de un mensaje | `messageId`, message file y biblioteca opcionales | Por defecto consulta `QSYS/QCPFMSG`; devuelve texto, segundo nivel, severidad y datos |
| `ibmi.system_api.lookup` | Local | Busca documentacion de APIs del sistema | `apiName` | Devuelve secciones y fuentes locales relacionadas |
| `ibmi.docs.search` | Local | Busca cualquier tema IBM i en la base documental | `query`, `limit` entre 1 y 20 | Devuelve hasta 8 resultados por defecto con archivo y seccion de origen |
| `ibmi.command.preview` | Local | Valida y normaliza un comando de consulta | `command` | No ejecuta; informa verbo, comando normalizado y posibles efectos como spool |
| `ibmi.command.run_safe` | IBM i | Ejecuta un comando CL permitido y lo audita | `command` previamente revisado | Solo allowlist; bloquea encadenamiento, outfile, reemplazo y parametros mutantes |
| `ibmi.header.create` | Local | Genera la cabecera obligatoria de un fuente | `language`, `author`, `purpose`, `requirement` | Soporta RPGLE, SQLRPGLE, CLLE y DDS con fecha actual y autor proporcionado por el usuario |

### Allowlist De Comandos

`ibmi.command.run_safe` acepta exclusivamente:

```text
DSPJOBLOG  DSPFD  DSPFFD  DSPPGMREF  DSPOBJD
DSPDBR     DSPMSG DSPJOB  DSPDTAARA  DSPPFM
```

Se bloquean separadores, saltos de linea, `OUTFILE`, `OUTMBR`, `MBROPT`, `REPLACE(*YES)` y `RMV(*YES)`. Un comando con `OUTPUT(*PRINT)` puede crear spool en el job servidor; por eso debe pasar primero por `ibmi.command.preview`.

## Casos De Uso Conectados

| Objetivo | Flujo recomendado | Prompt de ejemplo |
| --- | --- | --- |
| Descubrir una tabla desconocida | `catalog.search` -> `object.describe` -> `query.readonly` | `Busca objetos relacionados con PEDIDO en APPLIB, describe el candidato mas probable y muestra 20 filas representativas.` |
| Analizar un programa remoto | `object.info` -> `source.member.read` -> analista/desarrollador | `Lee APPLIB/QRPGLESRC/PGMORDER y explica procedimientos, archivos, estructuras de datos y riesgos.` |
| Diagnosticar un job | `joblog.get` -> `message.retrieve` -> `spool.list/get` | `Analiza el job 123456/USRAPP/PROCESO, identifica el primer mensaje causal y separa errores derivados.` |
| Revisar un spool extenso | `spool.list` -> `spool.get` paginado | `Localiza QPRINT del job indicado, lee las primeras 200 lineas y resume errores con numero de linea.` |
| Preparar una compilacion ILE | `compile.plan` -> revision de prerequisitos | `Genera el plan para CRTRPGMOD de MODVENTA y CRTPGM de PGMVENTA con sus modulos; no ejecutes nada.` |
| Investigar una API | `system_api.lookup` -> `docs.search` | `Explica QMHRTVM, sus formatos, parametros, estructura de error y un ejemplo RPGLE free-form.` |
| Consultar metadata operativa | `command.preview` -> confirmacion -> `command.run_safe` | `Previsualiza DSPPGMREF PGM(APPLIB/PGMORDER) OUTPUT(*PRINT); no lo ejecutes todavia.` |
| Generar un fuente | `header.create` -> skill de lenguaje -> QA | `Genera un CLLE para invocar PGMORDER con manejo de MONMSG, cabecera con el autor que te indique y casos de prueba.` |

## Prompts Listos Para Usar

### Db2 for i

```text
En el ambiente configurado, busca tablas cuyo nombre o texto contenga CLIENTE dentro del schema LIBDATA. Describe columnas, claves e indices de la mejor coincidencia. No ejecutes SQL mutante.
```

```text
Ejecuta una consulta read-only que agrupe ventas por mes y comercio, calcule total, promedio y ranking con una funcion de ventana. Limita la salida a 100 filas y explica el plan logico.
```

### RPGLE, SQLRPGLE Y DDS

```text
Lee LIBAPP/QRPGLESRC/PGMVENTA. Explica el flujo principal, procedimientos, subrutinas, archivos, data structures, indicadores y puntos de error. Cita nombres concretos del fuente.
```

```text
Revisa este SQLRPGLE para detectar cursores sin cerrar, SQLCODE ignorado, commitment incorrecto, conversiones de fecha y SELECT sin indice probable. Propone cambios sin aplicarlos remotamente.
```

```text
Analiza el DSPF PANTVENTA junto con su RPGLE. Mapea formatos, subfiles, teclas, indicadores y campos, e identifica cualquier desalineacion entre DDS y codigo.
```

### Operaciones Y Diagnostico

```text
Obtiene el job log de 123456/USRAPP/PGMNOCT. Construye una linea de tiempo, identifica el primer CPF/MCH/SQL causal, recupera su segundo nivel y propone validaciones concretas.
```

```text
Lista los spools recientes del usuario USRAPP, localiza el QPRINT del job mas reciente y lee las lineas 1 a 200. Resume errores, totales y referencias a programas.
```

### Compilacion, APIs Y QA

```text
Genera, sin ejecutar, un plan para compilar un SQLRPGMOD y enlazarlo en un SRVPGM con activation group *CALLER. Incluye prerequisitos, orden y validaciones posteriores.
```

```text
Busca la API QCAPCMD y comparala con QCMDEXC: parametros, control de comandos, captura de mensajes, autoridad, riesgos y cuando elegir cada una desde RPGLE.
```

```text
Con el codigo y metadata disponibles, prepara una matriz QA con caso, datos, pasos, resultado esperado, evidencias y pruebas negativas. No afirmes que una prueba fue ejecutada si solo fue disenada.
```

## Diagnostico Local

```powershell
.\scripts\Test-IbmiSenior.ps1
```

Valida Node.js, MCP compilado, agentes, skills, prompts, sintaxis, registro MCP y el alias exacto ODBC configurado para 64 bits. No abre una conexion IBM i.

## Circuito Contra Bloqueo De Perfil

Esta regla es determinista y no depende de que el modelo la recuerde:

1. El primer `SQLSTATE 28xxx`, `SQL30082` o rechazo equivalente devuelve `IBMI_AUTHENTICATION_FAILED`.
2. El MCP abre un circuito en memoria para la conexion configurada.
3. Toda tool posterior devuelve `IBMI_AUTHENTICATION_LOCKED` antes de cargar ODBC o llamar `odbc.connect`.
4. No prueba otro password, usuario, host, perfil, DSN, naming ni driver.
5. El circuito solo se cierra al reiniciar manualmente el proceso MCP despues de corregir los datos.

Errores de red, timeout, driver faltante, servicio ausente o autoridad sobre objetos no abren este circuito.

## Actualizacion Y Rollback

Descarga el nuevo `ibmi-senior-vX.Y.Z.zip`, extraelo en una carpeta nueva y ejecuta:

```powershell
.\scripts\Update-IbmiSenior.ps1
```

La actualizacion vuelve a comprobar ODBC y conserva el comportamiento asistido. Usa `-NonInteractive` en despliegues automatizados o `-OdbcInstallerPath` si ya dispones del instalador oficial extraido.

Cada instalacion/actualizacion guarda lo anterior bajo:

```text
%LOCALAPPDATA%\ibmi-senior-agent\backups\AAAAMMDD-HHMMSS
```

El backup incluye customizaciones reemplazadas, paquete anterior y `mcp.json` cuando corresponda. El merge conserva servidores e inputs ajenos a `ibmi-local`.

No es necesario desinstalar primero una version administrada por estos scripts. La actualizacion es idempotente y reemplaza solo los archivos del producto.

### Instalaciones Manuales Antiguas

El instalador detecta archivos `ibmi-senior*.agent.md` ubicados antiguamente dentro de la carpeta `prompts`, los copia a `backups\...\legacy-prompts` y luego los retira para evitar agentes duplicados. En este equipo eso cubre `ibmi-senior-v1.agent.md` de VS Code Insiders.

Si el agente antiguo fue copiado dentro de `.github\agents` de un proyecto concreto, ese archivo pertenece al workspace y no se elimina globalmente. Retiralo manualmente solo de los proyectos donde aparezca duplicado.

## Desinstalacion

```powershell
.\scripts\Uninstall-IbmiSenior.ps1
```

Retira agentes, skills, prompts y la entrada `ibmi-local`, pero conserva backups y auditoria. Para eliminar tambien esos datos:

```powershell
.\scripts\Uninstall-IbmiSenior.ps1 -Purge
```

## Problemas Frecuentes

| Sintoma | Causa probable | Accion |
| --- | --- | --- |
| `node`/`npm.cmd` no encontrado | Node.js ausente o PATH antiguo | Instala Node LTS 64 bits y abre otra terminal |
| `Node.js de 64 bits` requerido | Node x86 o arquitectura no compatible | Instala Node LTS x64 y abre otra terminal |
| El asistente no encuentra ODBC | Windows no registra un alias soportado para 64 bits | Abre la descarga desde el asistente o ejecuta `Install-IbmiOdbcPrerequisite.ps1` |
| `setup.exe` no tiene firma valida de IBM | Archivo incorrecto, alterado o no oficial | Descarta el archivo y descarga Windows Application Package desde IBM |
| Instalador devuelve `3010` o `1641` | Windows Installer requiere reinicio | Reinicia Windows y vuelve a ejecutar el asistente |
| `No se pudo cargar el paquete npm 'odbc'` | Instalacion global incompleta o ABI Node incompatible | Ejecuta actualizador y luego diagnostico; verifica Node LTS |
| `IBMI_ODBC_DRIVER_NOT_FOUND` | Alias no registrado para 64 bits | Usa el nombre exacto de `Get-OdbcDriver -Platform "64-bit"` |
| Solo existe `iSeries Access ODBC Driver` | Cliente IBM i Access for Windows 7.1 legado | Instala con ese alias; planifica migracion a ACS Windows Application Package |
| Agente no aparece | VS Code no recargo customizaciones | Reinicia VS Code y revisa `Chat: Open Customizations`/Diagnostics |
| Prompts no aparecen | Se instalo en otro perfil VS Code | Reinstala pasando `-VsCodeUserDataPath` del perfil correcto |
| `ibmi-local/*` no aparece | MCP detenido, sin confianza o cache antiguo | Inicia el server; luego usa `MCP: Reset Cached Tools` si las tools cambiaron |
| `IBMI_AUTHORITY_DENIED` | Perfil sin autoridad al objeto/servicio | Solicita autoridad adecuada o usa una alternativa autorizada; no cambies credenciales a ciegas |
| `IBMI_OBJECT_OR_SERVICE_NOT_FOUND` | Servicio no disponible por version/PTF | Usa `ibmi.system.capabilities` y consulta alternativa documentada |
| `IBMI_AUTHENTICATION_FAILED` | Login rechazado | Detente, corrige el input y no reinicies hasta estar seguro |
| `IBMI_AUTHENTICATION_LOCKED` | Circuito local abierto tras el primer fallo | Corrige inputs y reinicia manualmente una sola vez |

## Referencias Oficiales

- [Custom agents en VS Code](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- [Agent Skills en VS Code](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [Prompt files en VS Code](https://code.visualstudio.com/docs/agent-customization/prompt-files)
- [Modelos y Thinking Effort en VS Code](https://code.visualstudio.com/docs/agent-customization/language-models)
- [Modelos compatibles con GitHub Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
- [MCP servers en VS Code](https://code.visualstudio.com/docs/agent-customization/mcp-servers)
- [Referencia de configuracion MCP](https://code.visualstudio.com/docs/agents/reference/mcp-configuration)
- [IBM i Access Client Solutions](https://www.ibm.com/support/pages/ibm-i-access-client-solutions)
- [Fin de soporte IBM i Access for Windows](https://www.ibm.com/support/pages/ibm-i-access-windows)
- [Driver ODBC vigente para IBM i ACS](https://www.ibm.com/support/pages/odbc-driver-ibm-i-access-client-solutions)
- [Parametros de instalacion de Windows Application Package](https://www.ibm.com/docs/en/i/7.4.0?topic=windows-using-command-line-parameters-change-installation-behavior)
- [Releases publicas del proyecto](https://github.com/h0w4r/ibmi-agents-vscode/releases)
