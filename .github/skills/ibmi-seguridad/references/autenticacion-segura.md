# Autenticacion Segura IBM i

Los perfiles IBM i pueden quedar deshabilitados por politicas como `QMAXSIGN` y `QMAXSGNACN`.

Control determinista:

1. Un rechazo confirmado detiene inmediatamente el flujo de autenticacion.
2. No se prueban variantes de password, usuario, host, perfil, DSN, naming o driver.
3. Se informa el ambiente y el error sin registrar secretos.
4. El usuario corrige la configuracion antes de autorizar un nuevo intento.
5. El mecanismo de conexion impide reintentos automaticos durante la misma ejecucion.

Fuentes IBM verificadas el 15/07/2026:
- https://www.ibm.com/docs/en/i/7.5.0?topic=overview-sign-system-values-incorrect-sign-attempts
- https://www.ibm.com/docs/en/i/7.5?topic=values-action-when-sign-attempts-reached-qmaxsgnacn
