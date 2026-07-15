# LEEME - IBM i Atlas Para VS Code

IBM i Atlas es un agente senior para analizar, desarrollar, diagnosticar y probar soluciones IBM i desde cualquier workspace de Visual Studio Code. Incluye un orquestador, cinco especialistas, 14 prompts y skills para RPGLE, SQLRPGLE, CLLE, DDS, Db2 for i, ILE, APIs, operaciones, seguridad, rendimiento, integracion, QA y modernizacion.

> Nota de privacidad: todos los perfiles, bibliotecas, objetos, jobs y programas usados en esta guia son ejemplos sinteticos. Sustituye o anonimiza cualquier identificador real antes de compartir prompts, capturas, incidencias o contribuciones.

## Prerrequisitos

| Componente | Requisito | Descarga |
| --- | --- | --- |
| Windows | Windows 10/11 de 64 bits | Incluido con el equipo |
| Visual Studio Code | `1.128.0` o posterior | [Descargar VS Code](https://code.visualstudio.com/download) |
| GitHub Copilot | Extension habilitada y sesion iniciada | [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) |
| GitHub Copilot Chat | Instalar si VS Code la muestra separada | [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) |

No requiere Node.js, drivers IBM i ni abrir la carpeta descargada como workspace despues de instalar.

## Instalacion Global

1. Descarga `ibmi-atlas-vX.Y.Z.zip` desde la [ultima release publica](https://github.com/h0w4r/ibmi-agents-vscode/releases/latest).
2. Extrae el ZIP en cualquier carpeta.
3. Abre PowerShell en la carpeta extraida y ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\Install-IbmiAtlas.ps1
```

El instalador coloca:

| Componente | Destino calculado |
| --- | --- |
| Orquestador y especialistas | `%USERPROFILE%\.copilot\agents` |
| Skills IBM i | `%USERPROFILE%\.copilot\skills` |
| Slash commands Atlas | Carpeta `prompts` de la edicion VS Code detectada |
| Manifiesto y backups | `%LOCALAPPDATA%\ibmi-atlas-agent` |

Las customizaciones tienen nombres propios (`ibmi-atlas*` y `atlas-*`) y pueden convivir con IBM i Senior en el mismo usuario y perfil VS Code.

## Capacidades En Una Mirada

| Area | Capacidades | Artefactos recomendados |
| --- | --- | --- |
| RPGLE | Explicacion, correccion, modernizacion de fijo a free-form, procedimientos y manejo de errores | `.rpgle`, `.rpg`, copybooks y listados de compilacion |
| SQLRPGLE | SQL embebido, cursores, SQLCODE/SQLSTATE, commitment, null indicators y rendimiento | `.sqlrpgle`, DDL, consultas y planes disponibles |
| CLLE | Flujo de comandos, parametros, `MONMSG`, overrides, jobs y dependencias | `.clle`, command definitions y job logs |
| DDS | PF, LF, DSPF, subfiles, indicadores, ventanas, teclas y reglas select/omit | DDS y fuentes consumidores |
| Db2 for i | Revision y generacion de DDL/SQL, joins, agrupaciones, CTE y funciones de ventana | DDL, catalogos exportados, CSV y resultados de consultas |
| Diagnostico | Analisis causal de RNF, CPF, MCH, SQL, job logs y spool | Logs y spools pegados o adjuntos |
| ILE | Modulos, programas, service programs, binder language, activation groups y binding directories | Fuentes, listados, referencias y comandos actuales |
| APIs del sistema | Firmas, formatos, estructuras de error y ejemplos de invocacion | Documentacion o definiciones incluidas en el proyecto |
| Impacto | Mapeo de programas, archivos, llamadas, entradas, salidas y dependencias | Fuentes relacionados y resultados de `DSPPGMREF` exportados |
| QA y seguridad | Casos positivos/negativos, autoridades, validacion de entradas y riesgos operativos | Requerimiento, codigo, logs y criterios de aceptacion |
| Rendimiento | Patrones SQL costosos, loops, lecturas repetidas, bloqueos y oportunidades de indices | Codigo, SQL, tiempos, planes o estadisticas aportadas |
| Documentacion | Explicaciones didacticas, tablas, matrices y diagramas Mermaid | Cualquier conjunto de artefactos del analisis |

Atlas trabaja de forma portable: fundamenta sus conclusiones en el workspace, archivos adjuntos y contexto proporcionado. Si falta una pieza, debe pedir el artefacto concreto y mantener separadas evidencia, inferencia y dato pendiente.

## Artefactos Que Aprovecha Mejor

| Artefacto | Informacion que puede extraer |
| --- | --- |
| RPGLE/SQLRPGLE/CLLE | Flujo, procedimientos, llamadas, archivos, estructuras, indicadores y errores |
| PF/LF/DSPF | Campos, claves, formatos, subfiles, relaciones y restricciones DDS |
| DDL y SQL | Tipos, claves, relaciones, reglas de negocio y riesgos de rendimiento |
| Job log | Secuencia temporal, mensaje causal, programa, modulo, procedimiento y mensajes derivados |
| Spool | Errores de compilacion, totales, cortes, encabezados y datos relevantes por linea |
| Listado de compilacion | RNF, numero de sentencia, fuente expandido, referencias y opciones de compilacion |
| `DSPPGMREF`/`DSPOBJD` exportado | Dependencias, objetos referenciados, bibliotecas y tipos |
| Requerimiento funcional | Reglas, escenarios, casos limite y criterios de aceptacion |
| Capturas 5250 | Distribucion, campos, mensajes, teclas y comportamiento esperado de pantalla |

## Autodeteccion De Rutas

El script no contiene rutas del equipo del autor y no pregunta carpetas durante una instalacion normal.

| Prioridad | Condicion | Destino VS Code |
| --- | --- | --- |
| 1 | Se proporciono `-VsCodeUserDataPath` | Usa exactamente esa carpeta |
| 2 | Existe `VSCODE_PORTABLE` | `%VSCODE_PORTABLE%\user-data\User` |
| 3 | Solo `code-insiders` esta en `PATH` | `%APPDATA%\Code - Insiders\User` |
| 4 | Solo `code` esta en `PATH` | `%APPDATA%\Code\User` |
| 5 | Solo existe una carpeta de usuario | Usa la existente |
| 6 | Ambas existen o ninguna es concluyente | Usa VS Code estable y muestra la eleccion |

Para un perfil personalizado o para forzar Insiders:

```powershell
.\scripts\Install-IbmiAtlas.ps1 `
  -VsCodeUserDataPath "$env:APPDATA\Code - Insiders\User"
```

Tambien se pueden cambiar `-CopilotHome` e `-InstallRoot`; no son necesarios en una instalacion estandar.

## Seleccion De Modelo

Atlas no fija la propiedad `model` en agentes, especialistas ni prompts. El orquestador usa el modelo seleccionado en Copilot Chat y sus cinco subagentes lo heredan. Asi puede trabajar con el catalogo que ofrezcan la licencia, las politicas y la version de VS Code de cada usuario.

1. Abre Copilot Chat y selecciona `ibmi-atlas`.
2. Abre el selector de modelos del cuadro de chat.
3. Elige `Auto` o cualquier modelo disponible para tu cuenta.
4. Usa `Chat: Manage Language Models` para mostrar, ocultar o revisar los modelos accesibles.
5. Configura `Thinking Effort` solo si el modelo elegido expone esa opcion.

El cambio se realiza en VS Code estable o Insiders y no requiere reinstalar Atlas. El instalador no pregunta por modelos ni conserva nombres que puedan dejar de estar disponibles.

## Primera Puesta En Marcha

1. Reinicia VS Code despues de instalar.
2. Ejecuta `Chat: Open Customizations` y confirma que aparezca `ibmi-atlas`.
3. Selecciona `ibmi-atlas` en Copilot Chat.
4. Abre un proyecto IBM i o adjunta los fuentes y artefactos que deban analizarse.

Pruebas iniciales:

```text
Analiza este RPGLE e identifica procedimientos, archivos, estructuras de datos y riesgos de compilacion.
```

```text
Genera, sin ejecutar, un plan ILE para compilar un modulo RPGLE y enlazar un programa.
```

```text
Revisa este job log y separa el mensaje causal de los mensajes derivados.
```

## Casos De Uso Y Ejemplos

| Objetivo | Entrega esperada | Prompt de ejemplo |
| --- | --- | --- |
| Entender un programa legado | Resumen, flujo, archivos, variables, llamadas y riesgos | `Explica PGMORDER.rpgle por procedimientos y cita los nombres reales de archivos y data structures.` |
| Modernizar RPG fijo | Equivalencia funcional, codigo free-form y riesgos de migracion | `Convierte este RPGLE fijo a **FREE preservando indicadores, LR, subrutinas y manejo de errores.` |
| Revisar SQL embebido | Hallazgos por severidad y propuesta concreta | `Revisa cursores, null indicators, SQLSTATE, commitment y consultas potencialmente costosas.` |
| Cruzar RPGLE con DSPF | Matriz formato/campo/indicador/uso | `Mapea PANT0100.dspf con PGM0100.rpgle y detecta campos o indicadores sin correspondencia.` |
| Disenar un subfile | DDS, flujo RPGLE y validaciones | `Disena un mantenimiento con subfile, 2=Modificar, 4=Anular, 5=Consultar y F6=Registrar.` |
| Analizar impacto | Dependencias directas, indirectas y plan de pruebas | `Determina el impacto de cambiar el campo ESTADO de CLIENTEPF usando todos los fuentes adjuntos.` |
| Diagnosticar compilacion | Causa raiz RNF, ubicacion y correccion | `Analiza este listado CRTSQLRPGI y ordena los RNF por causa, no por orden de aparicion.` |
| Diagnosticar ejecucion | Linea de tiempo y mensaje causal | `Analiza este job log, identifica el primer CPF/MCH/SQL causal y separa los mensajes en cascada.` |
| Revisar un spool | Resumen trazable a lineas | `Localiza errores, totales y programas mencionados en este spool; cita los numeros de linea.` |
| Planificar compilacion | Orden, comandos, prerequisitos y validaciones | `Prepara el plan ILE para modulo, service program y programa consumidor; no afirmes que fue ejecutado.` |
| Disenar SQL | Consulta explicada y casos limite | `Genera una consulta mensual con CTE, agrupacion y ranking por comercio a partir del DDL adjunto.` |
| Preparar QA | Matriz ejecutable y evidencias | `Crea casos positivos, negativos y de regresion para este requerimiento y estos fuentes.` |

### RPGLE Y SQLRPGLE

```text
Analiza el programa PGMORDER.rpgle. Entrega: proposito, entradas, salidas, procedimientos, subrutinas, archivos utilizados, data structures, indicadores, llamadas externas, manejo de errores y riesgos. Toda afirmacion debe citar un nombre real del fuente.
```

```text
Moderniza este RPGLE fijo a formato totalmente libre. Preserva el comportamiento, reemplaza indicadores numericos cuando sea seguro, convierte subrutinas adecuadas en procedimientos y presenta una tabla de equivalencias antes/despues.
```

```text
Revisa este SQLRPGLE. Clasifica hallazgos criticos, altos, medios y bajos sobre SQLCODE/SQLSTATE, cursores, null indicators, commitment, bloqueos, SELECT INTO, conversiones y rendimiento. Incluye la correccion propuesta.
```

### DDS Y PANTALLAS 5250

```text
Analiza CLIENTEPF.pf, CLIENTEL1.lf y MNTCLIENTE.dspf junto con el RPGLE consumidor. Construye una matriz con archivo/formato/campo/tipo/clave/uso y detecta inconsistencias entre DDS y programa.
```

```text
Disena un DSPF de mantenimiento con subfile principal, formulario separado y opciones 2=Modificar, 4=Anular, 5=Consultar y F6=Registrar. Incluye indicadores, teclas, mensajes y pseudoflujo RPGLE.
```

### DIAGNOSTICO

```text
Analiza este job log como una linea de tiempo. Identifica el primer mensaje causal, mensajes derivados, programa/modulo/procedimiento involucrado, datos de reemplazo y validaciones para confirmar la causa.
```

```text
Analiza este listado de compilacion SQLRPGLE. Agrupa RNF y SQL por causa comun, ubica cada error por numero de sentencia y propone el cambio minimo necesario.
```

```text
Revisa este spool de 800 lineas. Divide el analisis por paginas o bloques, cita lineas concretas y resume encabezados, totales, advertencias y errores sin perder trazabilidad.
```

### IMPACTO, ILE Y QA

```text
Con los fuentes adjuntos, construye el arbol de impacto de modificar CLIENTEPF. Separa lectores, escritores, programas que llaman a esos consumidores, pantallas, reportes y pruebas necesarias.
```

```text
Prepara un plan de compilacion para MODVENTA, SRVVENTA y PGMVENTA. Incluye orden, comandos propuestos, activation groups, binding directories, binder language, prerequisitos y validaciones posteriores. No ejecutes nada.
```

```text
Convierte este requerimiento y sus fuentes en una matriz QA con ID, objetivo, precondiciones, datos, pasos, resultado esperado, evidencia y prioridad. Incluye casos negativos, limites y regresion.
```

### SQL Y RENDIMIENTO

```text
A partir del DDL adjunto, genera una consulta que calcule ventas mensuales, acumulado anual, promedio movil de tres meses y ranking por comercio. Explica cada CTE y funcion de ventana.
```

```text
Revisa este programa batch y las consultas adjuntas. Identifica lecturas repetidas, N+1, full scans probables, conversiones que invalidan indices, bloqueos y oportunidades de procesamiento por conjuntos.
```

## Uso De Evidencia

Atlas trabaja con fuentes, DDS, DDL, copybooks, job logs, spools, listados y metadata disponibles en el workspace o adjuntos a la conversacion. Cuando falte un dato indispensable, indica el artefacto exacto que debe proporcionarse y separa claramente evidencia, inferencia y dato faltante.

No presenta como ejecutados comandos, consultas o compilaciones que solo haya preparado.

## Diagnostico

```powershell
.\scripts\Test-IbmiAtlas.ps1
```

La comprobacion valida manifiesto, modelos, agentes, prompts, skills, ruta detectada e integridad de la instalacion.

## Actualizacion

Descarga el nuevo `ibmi-atlas-vX.Y.Z.zip`, extraelo en una carpeta nueva y ejecuta:

```powershell
.\scripts\Update-IbmiAtlas.ps1
```

No hace falta desinstalar la version anterior. El actualizador reemplaza los archivos administrados y conserva un backup bajo:

```text
%LOCALAPPDATA%\ibmi-atlas-agent\backups\AAAAMMDD-HHMMSS
```

## Desinstalacion

```powershell
.\scripts\Uninstall-IbmiAtlas.ps1
```

Para retirar tambien backups y datos de instalacion:

```powershell
.\scripts\Uninstall-IbmiAtlas.ps1 -Purge
```

Las skills IBM i se conservan automaticamente cuando IBM i Senior sigue instalado.

## Versiones Y Verificacion

Cada release publica un ZIP Atlas propio y un archivo `SHA256SUMS.txt`. Para verificar la descarga:

```powershell
Get-FileHash .\ibmi-atlas-vX.Y.Z.zip -Algorithm SHA256
```

Compara el valor con la linea correspondiente de `SHA256SUMS.txt`.

## Referencias Oficiales

- [Custom agents en VS Code](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- [Subagentes en VS Code](https://code.visualstudio.com/docs/agents/subagents)
- [Prompt files en VS Code](https://code.visualstudio.com/docs/agent-customization/prompt-files)
- [Modelos y Thinking Effort en VS Code](https://code.visualstudio.com/docs/agent-customization/language-models)
- [Modelos compatibles con GitHub Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
- [Releases publicas del proyecto](https://github.com/h0w4r/ibmi-agents-vscode/releases)
