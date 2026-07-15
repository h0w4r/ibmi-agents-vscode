# Plan De Implementacion Agente IBM i V2

Fecha: 15/07/2026

Estado: implementado y validado localmente el 15/07/2026.

## P0 - Correccion Y Seguridad

- Implementar circuito de autenticacion sin reintentos.
- Clasificar errores ODBC mediante SQLSTATE y diagnosticos estructurados.
- Escapar la cadena ODBC y mejorar redaccion de secretos.
- Aplicar timeout y limite maximo de filas.
- Corregir `SYSTOOLS.SPOOLED_FILE_DATA` y agregar paginacion.
- Validar parametros peligrosos de comandos CL.
- Estandarizar respuestas MCP con `structuredContent` e `isError`.

## P1 - Capacidades MCP

- Agregar deteccion de version y servicios disponibles.
- Extender busqueda de catalogo a columnas.
- Describir columnas, claves e indices de objetos Db2 for i.
- Ampliar planes de compilacion ILE y validar nombres de sistema.
- Mejorar busqueda documental con secciones, ranking y fuentes.

## P2 - Agentes Y Skills

- Convertir `ibmi-senior` en orquestador con subagentes permitidos.
- Crear agentes de analisis, desarrollo, diagnostico, operaciones y QA.
- Reforzar las skills existentes y agregar ILE, rendimiento, seguridad e integracion.
- Agregar prompts de impacto, revision, rendimiento y seguridad.

## P3 - Distribucion Global

- Crear instalador, actualizador, desinstalador y diagnostico PowerShell.
- Instalar customizaciones en el perfil de usuario de VS Code/Copilot.
- Registrar el MCP de usuario sin guardar credenciales.
- Documentar actualizacion, rollback y criterios de exito.

## P4 - Validacion

- Incluir `tests` en typecheck.
- Agregar unit tests de autenticacion, SQL, CL, ODBC, spool y docs.
- Agregar tests de contrato MCP offline.
- Validar JSON, frontmatter de agentes y estructura de skills.
- Ejecutar `npm test`, `npm run typecheck`, `npm run build` y diagnostico local.
