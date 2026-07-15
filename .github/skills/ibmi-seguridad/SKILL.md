---
name: ibmi-seguridad
description: Revisa seguridad de codigo, perfiles, objetos y operaciones IBM i. Usar para autoridades, adopted authority, special authorities, authorization lists, comandos dinamicos, secretos, IFS, auditoria y riesgo de bloqueo de perfiles.
---

# Seguridad IBM i

## Metodo

1. Identifica identidad efectiva, ownership, autoridad publica/privada, authorization lists y privilegios especiales.
2. Revisa validacion de entrada antes de SQL dinamico, APIs de comandos, QCMDEXC/QCAPCMD o acceso IFS.
3. Comprueba exposicion de secretos, datos sensibles, mensajes, job logs y spool.
4. Presenta hallazgos por severidad con evidencia, impacto, validacion read-only y remediacion.
5. No modifica autoridades, system values, perfiles ni auditoria.

Para procesos que autentiquen contra IBM i, aplica [controles de autenticacion](references/autenticacion-segura.md) y evita reintentos que puedan bloquear el perfil.
