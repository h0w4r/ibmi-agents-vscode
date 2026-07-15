---
name: analizar-spool
description: Lista, lee y analiza spool IBM i.
agent: ibmi-diagnostico
tools: ["read", "search", "ibmi-local/*"]
argument-hint: Job, usuario, archivo spool o numero de spool.
---

Analiza spool IBM i.

Entrega:
- Identificacion del spool: job, usuario, numero, archivo y cola.
- Extracto relevante.
- Interpretacion tecnica.
- Mensajes o errores asociados.
- Siguiente validacion recomendada.

Usa `ibmi.spool.list` e `ibmi.spool.get` cuando se requiera informacion remota.
