---
name: atlas-modernizar-ibmi
description: Propone modernizacion segura de fuentes IBM i.
agent: ibmi-atlas-analista
model: "GPT-5.6 Terra (copilot)"
tools: [read, search, web]
argument-hint: Fuente, objetivo de modernizacion y restricciones.
---

Propone una modernizacion IBM i incremental y trazable.

Incluye:
- Estado actual y contratos que deben conservarse.
- Cambios recomendados por prioridad.
- Riesgos de compatibilidad por version IBM i.
- Estrategia de migracion y reversibilidad.
- Pruebas de regresion.
- Puntos donde conviene conservar temporalmente estilo legacy.

No conserves compatibilidad que el usuario haya descartado expresamente.
