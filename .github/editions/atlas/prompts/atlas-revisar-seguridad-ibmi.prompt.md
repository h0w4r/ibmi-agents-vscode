---
name: atlas-revisar-seguridad-ibmi
description: Revisa seguridad de codigo, objetos, perfiles y operaciones IBM i.
agent: ibmi-atlas-analista
tools: [read, search, web]
argument-hint: Fuente, objeto, proceso o configuracion que debe revisarse.
---

Realiza una revision de seguridad IBM i sobre la evidencia proporcionada.

Prioriza:
- Autoridad adoptada, perfiles especiales, listas de autorizacion y ownership.
- Ejecucion de comandos, SQL dinamico, validacion de entradas y exposicion de secretos.
- Autoridades sobre objetos, IFS, colas, jobs, message files y datos sensibles.
- Auditoria, trazabilidad, errores y superficie de integracion.

Presenta hallazgos por severidad, evidencia, riesgo, validacion read-only y remediacion. Declara como dato faltante cualquier autoridad o configuracion que no pueda comprobarse.
