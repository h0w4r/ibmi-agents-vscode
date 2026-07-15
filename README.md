# Agentes IBM i Para VS Code Y GitHub Copilot

Repositorio publico de dos agentes IBM i instalables globalmente y capaces de convivir en el mismo equipo:

> Todos los hosts, perfiles, bibliotecas, objetos, jobs, programas y usuarios mostrados son ejemplos sinteticos. No publiques infraestructura ni identificadores reales en prompts, capturas, issues o pull requests.

| Producto | Uso principal | Paquete |
| --- | --- | --- |
| IBM i Senior | Desarrollo IBM i con consultas operativas y documentales integradas | `ibmi-senior-vX.Y.Z.zip` |
| IBM i Atlas | Analisis portable sobre codigo, logs y artefactos proporcionados | `ibmi-atlas-vX.Y.Z.zip` |

## Que Pueden Hacer

Ambos productos cubren RPGLE, SQLRPGLE, CLLE, DDS, PF/LF/DSPF, Db2 for i, ILE, APIs del sistema, diagnostico, QA, seguridad, rendimiento y modernizacion.

IBM i Senior agrega 18 herramientas para consultar un ambiente IBM i configurado: catalogos y objetos Db2, SQL read-only, job logs, spool, miembros fuente, metadata de objetos, message files, documentacion, planes de compilacion y comandos CL de consulta controlados.

IBM i Atlas ofrece el mismo criterio senior sobre fuentes, DDL, job logs, spool, listados y requerimientos disponibles en el workspace o adjuntos. Esta orientado a analisis portable, revision, generacion, documentacion y preparacion de pruebas.

Ejemplos:

```text
Analiza este RPGLE junto con su DSPF y mapea formatos, campos, indicadores, subfiles y teclas.
```

```text
Investiga este job log, identifica el primer mensaje causal y separa errores derivados.
```

```text
Describe LIBDATA.CLIENTES, sus columnas, claves e indices, y muestra una consulta read-only de ejemplo.
```

```text
Genera un plan ILE para modulo, service program y programa consumidor; no ejecutes compilaciones.
```

## Descarga

Descarga el ZIP del producto elegido desde la [ultima GitHub Release](https://github.com/h0w4r/ibmi-agents-vscode/releases/latest). No descargues el ZIP automatico del codigo fuente de GitHub: los paquetes de la release contienen solo los artefactos de su producto y los scripts correctos.

Las guias completas son [LEEME.md](LEEME.md) para IBM i Senior y [LEEME-ATLAS.md](LEEME-ATLAS.md) para IBM i Atlas.

## Instalacion Rapida

IBM i Senior:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\Install-IbmiSenior.ps1
```

IBM i Atlas:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\Install-IbmiAtlas.ps1
```

Los instaladores autodetectan VS Code estable, VS Code Insiders y modo portable. No dependen de rutas, nombres de usuario ni unidades del equipo donde se desarrollo el proyecto.

## Modelos

Los orquestadores usan `GPT-5.6 Sol (copilot)` y sus subagentes usan `GPT-5.6 Terra (copilot)`. El nivel `Extra High` se selecciona en `Thinking Effort` porque VS Code no permite fijarlo desde el frontmatter.

## Desarrollo

```powershell
cd mcp\ibmi-local
npm ci
npm test
npm run typecheck
npm run build
cd ..\..
.\scripts\Build-ReleasePackages.ps1
```

Los tags `vX.Y.Z` ejecutan `.github/workflows/release.yml`, validan el proyecto y publican ambos ZIP junto con `SHA256SUMS.txt`.

## Licencia

[MIT](LICENSE)
