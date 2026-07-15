---
name: atlas-analizar-spool
description: Analiza un spool IBM i proporcionado como archivo o texto.
agent: ibmi-atlas-diagnostico
model: "GPT-5.6 Terra (copilot)"
tools: [read, search]
argument-hint: Archivo, texto o extracto del spool y contexto del job.
---

Analiza el spool IBM i suministrado.

Entrega:
- Identificacion disponible: job, usuario, numero, archivo y cola.
- Extracto relevante con ubicacion concreta.
- Interpretacion tecnica.
- Mensajes o errores asociados.
- Siguiente validacion recomendada.

Si no se proporciono el contenido, solicita un TXT, PDF legible o extracto suficiente antes de concluir.
