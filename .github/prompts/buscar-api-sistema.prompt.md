---
name: buscar-api-sistema
description: Busca y explica APIs del sistema IBM i.
agent: ibmi-analista
tools: ["read", "search", "ibmi-local/*", "web"]
argument-hint: API como QCMDEXC, QCAPCMD, QMHRTVM o necesidad tecnica.
---

Investiga la API del sistema IBM i solicitada.

Entrega:
- Proposito.
- Firma conceptual y parametros importantes.
- Uso comun desde RPGLE/SQLRPGLE/CLLE.
- Riesgos y errores frecuentes.
- Ejemplo minimo si hay suficiente contexto.

Usa `ibmi.system_api.lookup` y documentacion local antes de responder.
