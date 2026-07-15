---
name: consulta-db2i
description: Prepara o ejecuta consultas read-only en Db2 for i.
agent: ibmi-analista
tools: ["read", "search", "ibmi-local/*"]
argument-hint: Objetivo de consulta, tablas, librerias y filtros.
---

Trabaja una consulta Db2 for i.

Reglas:
- Solo usar SQL read-only (`SELECT`, `WITH`, `VALUES`) salvo autorizacion explicita.
- Indicar tablas, columnas, filtros y joins usados.
- Si ejecutas con `ibmi.db2.query.readonly`, reporta limite aplicado y filas relevantes.
- Si falta metadata, usa `ibmi.db2.catalog.search` o `ibmi.db2.object.describe`.
