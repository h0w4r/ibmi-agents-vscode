# APIs Del Sistema IBM i

Version base: IBM i 7.5. Verificado: 15/07/2026. Las firmas y formatos deben confirmarse en IBM Docs para el release/PTF del servidor.

## Comandos Desde Programas

| API | Uso |
| --- | --- |
| `QCMDEXC` | Ejecutar una cadena de comando CL. Debe usarse con control estricto. |
| `QCAPCMD` | Procesar comandos con analizador de comandos. |
| `QCMDCHK` | Validar sintaxis de comandos CL. |

## Mensajes

| API | Uso |
| --- | --- |
| `QMHRTVM` | Recuperar texto de mensajes desde archivos de mensajes. |
| `QMHSNDPM` | Enviar mensajes a pila de llamadas. |
| `QMHRCVPM` | Recibir mensajes desde pila de llamadas. |

## Reglas

- Identificar parametros, longitudes y estructuras antes de generar prototipos RPGLE.
- Distinguir APIs de consulta de APIs que cambian estado.
- Si una API ejecuta comandos o altera sistema, pedir confirmacion antes de proponer ejecucion.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=programming-apis
- https://www.ibm.com/docs/en/i/7.5.0?topic=apis-program-call
