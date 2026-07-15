---
name: ibmi-operaciones
description: Consulta jobs, spool, colas, subsistemas y objetos IBM i. Usar para job logs, output queues, message queues, subsistemas, data areas, objetos, miembros o comandos DSP en modo seguro.
---

# IBM i Operaciones

Usa esta skill para job logs, spool, colas de salida, colas de mensajes, subsistemas, objetos y comandos de consulta.

## Flujo

1. Confirma version y servicios disponibles cuando corresponda.
2. Prefiere servicios SQL read-only y comandos DSP de consulta con salida controlada.
3. Para comandos CL, prepara primero una previsualizacion con objetivo, parametros, salida y efectos laterales.
4. No finalices jobs, limpies colas ni cambies subsistemas.
5. Reporta evidencia: job, usuario, numero, mensaje, spool, objeto y biblioteca.
6. No presentes como ejecutada una operacion que solo fue propuesta o documentada.
