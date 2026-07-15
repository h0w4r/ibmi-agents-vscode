# Matriz De Integracion IBM i

| Mecanismo | Patron | Ventaja | Riesgo a revisar |
| --- | --- | --- | --- |
| REST/SOAP | Sincrono | Contrato interoperable | Timeout, auth, versionado |
| Data queue | Asincrono | Baja latencia interna | Formato binario, ownership |
| Message queue/MQ | Asincrono durable | Desacoplamiento | Duplicados, DLQ, orden |
| IFS/SFTP | Batch | Simple para archivos | Parciales, CCSID, reenvio |
| ODBC/JDBC | Datos | Acceso SQL directo | Autoridad, locks, acoplamiento |
| SQL services | Servicio/datos | Integracion con Db2 for i | Version/PTF, autoridad |

Para cada opcion documentar contrato, idempotencia, observabilidad, recuperacion, volumen, latencia, cifrado y responsable operativo.
