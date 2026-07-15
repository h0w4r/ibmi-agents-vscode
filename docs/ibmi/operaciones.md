# Operaciones Basicas IBM i

Version base: IBM i 7.5. Verificado: 15/07/2026. La disponibilidad de servicios SQL depende de release y PTF.

## Jobs

Comandos y servicios utiles:

- `DSPJOB`
- `DSPJOBLOG`
- `QSYS2.JOBLOG_INFO`

## Spool

Herramientas:

- `WRKSPLF`
- `WRKOUTQ`
- `QSYS2.OUTPUT_QUEUE_ENTRIES`
- `SYSTOOLS.SPOOLED_FILE_DATA`

## Objetos

Comandos de consulta:

- `DSPOBJD`
- `DSPFD`
- `DSPFFD`
- `DSPDBR`
- `DSPPGMREF`

## Seguridad

No finalizar jobs, limpiar colas, cambiar subsistemas ni modificar objetos sin confirmacion explicita.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=services-output-queue-entries-view
- https://www.ibm.com/docs/en/i/7.4.0?topic=services-spooled-file-data-table-function
- https://www.ibm.com/docs/en/i/7.5.0?topic=services-object-statistics-table-function
