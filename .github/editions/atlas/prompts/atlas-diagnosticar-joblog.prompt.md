---
name: atlas-diagnosticar-joblog
description: Diagnostica job logs y mensajes RNF, SQL, CPF o MCH suministrados.
agent: ibmi-atlas-diagnostico
model: "GPT-5.6 Terra (copilot)"
tools: [read, search]
argument-hint: Archivo, texto o extracto del job log y sintoma observado.
---

Diagnostica el job log o los mensajes proporcionados.

Entrega:
- Evidencia encontrada, incluyendo `MESSAGE_ID`, tipo, severidad y texto cuando existan.
- Secuencia temporal y mensaje causal principal.
- Causa probable y alternativas claramente marcadas.
- Validaciones concretas.
- Accion recomendada y prueba posterior.

Si falta segundo nivel, call stack o contexto del job, solicita ese dato antes de cerrar la causa.
