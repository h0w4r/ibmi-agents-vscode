---
name: ibmi-apis-sistema
description: Busca, contrasta y explica APIs del sistema IBM i usadas desde RPGLE o CLLE. Usar para nombres Qxxx, estructuras receptoras, formatos, parametros, error code, mensajes o ejecucion controlada de comandos.
---

# IBM i APIs Del Sistema

Usa esta skill para APIs como `QCMDEXC`, `QCAPCMD`, `QCMDCHK`, `QMHRTVM`, APIs de mensajes, pantallas, jobs y objetos.

## Flujo

1. Busca la API en las referencias disponibles y contrasta su documentacion oficial.
2. Explica proposito, parametros, estructuras y errores.
3. Si propones ejemplo RPGLE, usa prototipos claros y comentarios.
4. Distingue APIs que ejecutan comandos de APIs que solo consultan informacion.
5. No inventes la firma: si la referencia disponible no basta, solicita el formato o contrasta documentacion IBM antes de generar el prototipo.
