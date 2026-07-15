---
name: pruebas-qa-ibmi
description: Crea un documento de pruebas QA IBM i centrado en ejecucion.
agent: ibmi-qa
tools: ["read", "search", "edit", "ibmi-local/*"]
argument-hint: Requerimiento, objetos, librerias y escenarios.
---

Genera pruebas QA IBM i.

Formato esperado:
- Resumen de cambios breve.
- Precondiciones.
- Datos de entrada.
- Pasos ejecutables.
- Resultado esperado.
- Evidencia a capturar.
- Validaciones SQL o comandos read-only.
- Rollback o limpieza si aplica.

No incluyas rutas locales del workspace como parte del documento final.
