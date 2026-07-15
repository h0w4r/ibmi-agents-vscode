---
name: analizar-impacto-ibmi
description: Analiza impacto funcional y tecnico de un cambio IBM i.
agent: ibmi-analista
tools: [read, search, web, ibmi-local/*]
argument-hint: Requerimiento, programa u objeto que cambiara y alcance esperado.
---

Analiza el impacto del cambio solicitado.

Incluye:
- Flujo actual y flujo esperado.
- Programas, procedimientos, copybooks, tablas/archivos, campos, DDS, APIs y jobs afectados.
- Dependencias de compilacion, binding, datos, autoridades e integraciones.
- Riesgos por severidad y evidencia que los sustenta.
- Estrategia incremental, pruebas de regresion y dudas pendientes.

No inventes dependencias. Separa evidencia local, evidencia remota e inferencias.
