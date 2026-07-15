---
name: ibmi-db2
description: Consulta y analiza Db2 for i, catalogos y servicios SQL. Usar para tablas, vistas, columnas, indices, claves, SQL embebido/dinamico, funciones, procedimientos, CTE, ventanas, locks o rendimiento SQL.
---

# IBM i Db2 For i

Usa esta skill para SQL, catalogos, QSYS2 services, procedimientos, funciones y diagnostico de datos.

## Flujo

1. Confirma version y capacidades si la tarea depende de servicios SQL opcionales.
2. Empieza por catalogos: `QSYS2.SYSTABLES`, `QSYS2.SYSCOLUMNS2`, `QSYS2.SYSINDEXES` y `QSYS2.SYSKEYS`.
3. Limita la inspeccion a consultas read-only y diferencia una consulta propuesta de un resultado comprobado.
4. Indica siempre tabla, columna, schema/libreria, filtro y limite usado.
5. No ejecutes DML, DDL ni `CALL` sin autorizacion explicita.
6. Si falta metadata, solicita DDS, DDL o un catalogo exportado y no inventes columnas o claves.
