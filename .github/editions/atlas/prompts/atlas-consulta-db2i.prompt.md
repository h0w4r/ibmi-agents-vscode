---
name: atlas-consulta-db2i
description: Disena y revisa consultas read-only para Db2 for i.
agent: ibmi-atlas-analista
model: "GPT-5.6 Terra (copilot)"
tools: [read, search]
argument-hint: Objetivo de consulta, tablas, librerias, campos y filtros.
---

Prepara o revisa una consulta Db2 for i usando el DDS, DDL, catalogo o codigo disponible.

Reglas:
- Limita la propuesta a `SELECT`, `WITH` o `VALUES`.
- Indica tablas, columnas, filtros, joins y funciones utilizadas.
- Diferencia columnas Db2 de variables host RPGLE.
- Incluye limite de filas y una estrategia para validar el resultado.
- Si falta metadata, enumera exactamente las tablas, columnas o claves que deben confirmarse.

No presentes resultados simulados como datos obtenidos del sistema.
