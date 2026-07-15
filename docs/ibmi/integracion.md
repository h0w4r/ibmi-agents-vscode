# Integracion IBM i

Version base: IBM i 7.5. Verificado: 15/07/2026. Confirmar productos licenciados, protocolos y niveles TLS del ambiente.

## Mecanismos

| Mecanismo | Uso tipico | Validaciones clave |
| --- | --- | --- |
| REST/SOAP | Servicios sincronicos | Contrato, TLS, auth, timeout, versionado |
| Data queues | Mensajeria interna de baja latencia | Formato, ownership, espera y tamanos |
| MQ/message queues | Mensajeria durable | Idempotencia, orden, duplicados y DLQ |
| IFS/SFTP | Integracion batch por archivos | Escritura atomica, CCSID, cifrado y reenvio |
| JDBC/ODBC | Acceso SQL | Autoridad, limites, locks y pooling |

## Contrato

Documentar productor, consumidor, campos, tipos, longitudes, decimales, CCSID, nulos, zona horaria, idempotencia, timeouts, trazabilidad y recuperacion ante fallos parciales.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=programming-http-functions
- https://www.ibm.com/docs/en/i/7.5.0?topic=programming-data-queues
