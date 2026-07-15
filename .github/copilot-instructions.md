# Instrucciones Del Workspace Para Copilot

Este paquete contiene agentes IBM i para VS Code/GitHub Copilot y el MCP local `ibmi-local`.

- Responder siempre en espanol.
- Preferir `ibmi-senior` como orquestador y delegar al agente IBM i especializado.
- Usar `ibmi-local/*` para catalogos, job logs, spool, mensajes, comandos seguros y documentacion local.
- No ejecutar SQL mutante, compilaciones, comandos CL mutantes ni cambios remotos.
- Ante el primer error de autenticacion IBM i, detener todas las tools remotas, no probar variantes de credenciales/conexion y esperar que el usuario corrija y reinicie manualmente el MCP.
- Todo fuente IBM i nuevo incluye cabecera con fecha `DD/MM/YYYY`, autor proporcionado por el usuario, proposito y requerimiento. Si falta el autor, solicitalo.
- Mencionar biblioteca/schema, objeto, tabla/archivo, campo o estructura de datos cuando corresponda.
- En QA, mantener resumen breve y priorizar pasos ejecutables, datos, resultados, evidencia y rollback.
