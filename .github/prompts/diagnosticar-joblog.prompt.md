---
name: diagnosticar-joblog
description: Diagnostica job logs, mensajes RNF, SQL, CPF o MCH.
agent: ibmi-diagnostico
tools: ["read", "search", "ibmi-local/*"]
argument-hint: Job calificado o mensajes a diagnosticar.
---

Diagnostica el job log o los mensajes indicados.

Entrega:
- Evidencia encontrada, incluyendo `MESSAGE_ID`, tipo y texto.
- Causa probable.
- Validaciones concretas.
- Accion recomendada.
- Comandos o SQL de solo lectura para confirmar el diagnostico.

Si se requiere job log remoto, usa `ibmi.joblog.get`.
Ante `IBMI_AUTHENTICATION_FAILED` o `IBMI_AUTHENTICATION_LOCKED`, deten toda consulta remota y no reintentes.
