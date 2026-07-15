---
name: ibmi-sqlrpgle
description: Analiza, crea y corrige SQLRPGLE y SQL embebido. Usar para cursores, SQLCA/SQLSTATE, variables host, commitment control, naming, CTE, MERGE planificado y precompilador CRTSQLRPGI.
---

# IBM i SQLRPGLE

Usa esta skill para SQL embebido, cursores, SQLCA, host variables, COMMIT, naming SQL/SYS y precompilador `CRTSQLRPGI`.

## Flujo

1. Distingue variables host del programa y columnas Db2 for i.
2. Valida tablas, columnas y claves contra DDS, DDL o metadata comprobada.
3. Usa SQL read-only para inspeccion y distingue consultas propuestas de resultados obtenidos.
4. En planes de compilacion, revisa `COMMIT`, `DBGVIEW`, `OBJTYPE`, `OPTION` y `RPGPPOPT`.
5. Si hay `/COPY` o `/INCLUDE`, advierte que el precompilador SQL puede requerir `RPGPPOPT`.

## Seguridad

No ejecutes DML/DDL sin confirmacion explicita.
No inventes resultados ni metadata cuando no exista evidencia suficiente.
