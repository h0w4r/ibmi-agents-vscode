# Catalogo Db2 For i

Version base: IBM i 7.5. Verificado: 15/07/2026. Algunas columnas y servicios requieren Technology Refresh/PTF.

## Catalogos Frecuentes

| Vista | Uso |
| --- | --- |
| `QSYS2.SYSTABLES` | Tablas, vistas, alias y textos. |
| `QSYS2.SYSCOLUMNS2` | Columnas, tipos, nombres de sistema, longitudes y textos. |
| `QSYS2.SYSKEYS` | Claves. |
| `QSYS2.SYSINDEXES` | Indices. |
| `QSYS2.SYSROUTINES` | Procedimientos y funciones. |

## Politica SQL

El agente solo debe ejecutar SQL read-only en v1:

- Permitido: `SELECT`, `WITH`, `VALUES`.
- Bloqueado: `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `GRANT`, `REVOKE`, `CALL` generico.

Si el usuario pide modificar datos, entregar script y pedir confirmacion explicita antes de ejecutar.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=views-syscolumns2
- https://www.ibm.com/docs/en/i/7.5.0?topic=views-sysindexes
- https://www.ibm.com/docs/en/i/7.5.0?topic=views-syskeys
