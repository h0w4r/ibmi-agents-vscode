---
name: atlas-diagnosticar-rendimiento-ibmi
description: Diagnostica rendimiento de SQL, jobs y programas IBM i con evidencia disponible.
agent: ibmi-atlas-diagnostico
model: "GPT-5.6 Terra (copilot)"
tools: [read, search, web]
argument-hint: Consulta, programa, job, metrica, plan o sintoma de rendimiento.
---

Diagnostica el problema de rendimiento sin modificar objetos ni datos.

Entrega:
- Sintoma y linea base disponible.
- Evidencia de SQL, accesos, indices, volumen, locks, CPU, memoria o espera.
- Hipotesis priorizadas y como confirmar cada una.
- Acciones de bajo riesgo, impacto esperado y medicion posterior.
- Datos que faltan para una conclusion firme.

No presentes indices o cambios de parametros como aplicados; entrega primero evidencia y plan de validacion.
