# Diseno Agente IBM i V2

Fecha: 15/07/2026

## Objetivo

Evolucionar `ibmi-senior` a una solucion global para VS Code y GitHub Copilot con agentes especializados, skills cargadas bajo demanda, documentacion IBM i trazable y un MCP local seguro de solo lectura.

## Principios

- Responder siempre en espanol y distinguir evidencia, inferencia y dato faltante.
- No inventar metadata, firmas de APIs, campos, objetos ni disponibilidad de servicios QSYS2.
- Mantener toda modificacion remota fuera de alcance hasta una fase autorizada expresamente.
- Aplicar controles deterministas en el MCP; las reglas criticas no deben depender solo del modelo.
- Detectar version y capacidades del servidor antes de depender de un servicio SQL opcional.

## Arquitectura

| Componente | Responsabilidad | Privilegios |
| --- | --- | --- |
| `ibmi-senior` | Orquestar, clasificar y delegar tareas | Lectura, web, preguntas, MCP y subagentes permitidos |
| `ibmi-analista` | Analisis funcional, impacto y dependencias | Solo lectura |
| `ibmi-desarrollador` | Crear y modificar fuentes locales IBM i | Lectura, edicion y terminal local |
| `ibmi-diagnostico` | Job logs, mensajes, spool y errores | MCP remoto de consulta |
| `ibmi-operaciones` | Jobs, objetos, colas y servicios | MCP remoto de consulta y comandos controlados |
| `ibmi-qa` | Casos de prueba, evidencias y regresion | Lectura, edicion local y consultas read-only |
| `ibmi-local` | Operaciones deterministas contra IBM i y docs | Politica read-only, auditoria y errores tipados |

## Circuito De Autenticacion

El circuito se identifica por `host + profile + user` y comienza en estado `closed`.

1. El primer error confirmado de login (`SQLSTATE 28xxx`, `SQL30082` o diagnostico equivalente) se devuelve como `IBMI_AUTHENTICATION_FAILED`.
2. Inmediatamente el circuito pasa a `open` y registra un evento local sin secretos.
3. Cualquier tool posterior devuelve `IBMI_AUTHENTICATION_LOCKED` antes de cargar ODBC o abrir una conexion.
4. El MCP no prueba contrasenas, usuarios, hosts, DSN ni drivers alternativos despues del rechazo.
5. El circuito solo vuelve a `closed` al reiniciar manualmente el proceso MCP despues de que el usuario confirme la correccion.
6. Errores de red, timeout, driver faltante o autoridad sobre objetos no abren el circuito.

## Seguridad De Consultas

- SQL arbitrario: solo una sentencia `SELECT`, `WITH` o `VALUES`, con limite maximo configurable.
- Bloquear DML, DDL, `CALL`, secuencias y funciones conocidas que ejecutan comandos.
- Los comandos CL deben validar verbo y parametros; una allowlist de verbo por si sola no es suficiente.
- Preferir servicios SQL de consulta antes de comandos CL que generen spool o dependan de una pantalla.
- Escapar atributos de la cadena ODBC y redactar secretos en objetos, errores y auditoria.

## Conocimiento IBM i

Las skills mantienen el flujo esencial en `SKILL.md` y cargan referencias detalladas solo cuando corresponda. Cada documento tecnico debe declarar version IBM i, fecha de verificacion, fuentes y limitaciones por PTF.

## Distribucion Global

La via estable es un instalador PowerShell de usuario que copia agentes, prompts, skills, docs y MCP a rutas persistentes. Agent Plugins se mantiene como via opcional mientras continue en Preview. No se requiere abrir este repositorio como workspace para usar el agente instalado.

## Criterios De Aceptacion

- Tras un login invalido, multiples tools producen una sola llamada a `odbc.connect`.
- `tools/list`, `tools/call`, recursos y errores se prueban mediante protocolo MCP.
- El MCP funciona con un conector ODBC simulado sin acceso a servidores reales.
- La instalacion global funciona desde un workspace vacio.
- Las respuestas remotas incluyen objeto, biblioteca/schema, servicio consultado y limite aplicado.
- La ausencia de un servicio QSYS2 produce un error accionable o una alternativa documentada.
