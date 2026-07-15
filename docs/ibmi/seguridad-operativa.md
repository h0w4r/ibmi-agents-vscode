# Seguridad Operativa Del Agente IBM i

Version base: IBM i 7.5. Verificado: 15/07/2026. Revisar `QMAXSIGN`, `QMAXSGNACN` y politica corporativa del ambiente.

## Reglas

- No reintentar automaticamente si falla autenticacion.
- No hardcodear credenciales.
- No ejecutar SQL mutante sin confirmacion explicita.
- No ejecutar comandos CL fuera de allowlist.
- Auditar vistas previas y ejecuciones seguras sin secretos.

## Circuito De Autenticacion

1. El primer `SQLSTATE 28xxx`, `SQL30082` o rechazo equivalente devuelve `IBMI_AUTHENTICATION_FAILED`.
2. El proceso abre un circuito local para `host + profile + user`.
3. Todas las tools posteriores devuelven `IBMI_AUTHENTICATION_LOCKED` antes de cargar ODBC.
4. No se prueban passwords, usuarios, hosts, DSN, naming ni drivers alternativos.
5. El usuario corrige la configuracion y reinicia manualmente el MCP antes de un nuevo intento.

## Allowlist Inicial CL

- `DSPJOBLOG`
- `DSPFD`
- `DSPFFD`
- `DSPPGMREF`
- `DSPOBJD`
- `DSPDBR`
- `DSPMSG`
- `DSPJOB`
- `DSPDTAARA`
- `DSPPFM`

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=overview-sign-system-values-incorrect-sign-attempts
- https://www.ibm.com/docs/en/i/7.5?topic=values-action-when-sign-attempts-reached-qmaxsgnacn
