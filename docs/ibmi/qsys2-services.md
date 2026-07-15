# Servicios QSYS2

Version base: IBM i 7.5. Verificado: 15/07/2026. Detectar capacidades antes de usar un servicio, porque varios se entregan mediante Technology Refresh/PTF.

Los servicios QSYS2 permiten consultar informacion del sistema mediante SQL.

## Servicios Usados Por El MCP

| Servicio | Uso |
| --- | --- |
| `QSYS2.SYSTABLES` | Buscar tablas, vistas y textos. |
| `QSYS2.SYSCOLUMNS2` | Describir columnas, tipos y nombres de sistema. |
| `QSYS2.JOBLOG_INFO` | Consultar job logs. |
| `QSYS2.OUTPUT_QUEUE_ENTRIES` | Listar entradas spool. |
| `SYSTOOLS.SPOOLED_FILE_DATA` | Leer datos de spool cuando este disponible. |
| `QSYS2.OBJECT_STATISTICS` | Consultar metadata de objetos. |
| `QSYS2.IFS_READ` | Leer contenido desde rutas IFS, incluyendo `/QSYS.LIB`. |

## Precauciones

Los servicios disponibles pueden variar por version IBM i y PTF. Si un servicio no existe, comprobar alternativa en el ambiente antes de insistir.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=services-db2-i
- https://www.ibm.com/docs/en/i/7.4.0?topic=services-spooled-file-data-table-function
- https://www.ibm.com/docs/en/i/latest?topic=services-env-sys-info-view
