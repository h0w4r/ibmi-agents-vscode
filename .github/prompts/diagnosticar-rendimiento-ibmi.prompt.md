---
name: diagnosticar-rendimiento-ibmi
description: Diagnostica rendimiento de SQL, jobs y programas IBM i con evidencia.
agent: ibmi-diagnostico
tools: [read, search, web, ibmi-local/*]
argument-hint: Consulta, programa, job, metrica o sintoma de rendimiento.
---

Diagnostica el problema de rendimiento sin modificar objetos ni datos.

Entrega:
- Sintoma y linea base disponible.
- Evidencia de SQL, accesos, indices, volumen, locks, CPU, memoria o espera.
- Hipotesis priorizadas y como confirmar cada una.
- Acciones de bajo riesgo, impacto esperado y medicion posterior.
- Datos que faltan para una conclusion firme.

No recomiendes crear indices o cambiar parametros como accion ejecutada; presenta primero evidencia y plan de validacion.
