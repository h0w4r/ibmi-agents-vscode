# Diagnostico De Mensajes IBM i

Version base: IBM i 7.5. Verificado: 15/07/2026. El texto autoritativo debe recuperarse del message file del ambiente cuando sea posible.

## Familias

| Familia | Contexto |
| --- | --- |
| `RNF` | Compilacion RPGLE/SQLRPGLE. |
| `SQL` | Db2 for i, SQL embebido o servicios QSYS2. |
| `CPF` | Control language, objetos, autoridad, jobs y sistema. |
| `MCH` | Errores de maquina/runtime. |

## Metodo

1. Obtener mensaje de primer y segundo nivel.
2. Ubicar programa, modulo, sentencia o comando.
3. Revisar job log y listados.
4. Validar objetos, bibliotecas, autoridades y datos.
5. Proponer correccion y prueba.

## Respuesta Esperada

Separar evidencia, causa probable, validaciones y accion recomendada.

## Fuentes

- https://www.ibm.com/docs/ssw_ibm_i_74/rzajq/rzajqviewmessagefiledata.htm
- https://www.ibm.com/docs/en/i/7.5.0?topic=services-joblog-info-table-function
