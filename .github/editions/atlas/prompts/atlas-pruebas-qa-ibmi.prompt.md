---
name: atlas-pruebas-qa-ibmi
description: Crea un documento de pruebas QA IBM i centrado en ejecucion.
agent: ibmi-atlas-qa
model: "GPT-5.6 Terra (copilot)"
tools: [read, search, edit]
argument-hint: Requerimiento, objetos, librerias y escenarios.
---

Genera pruebas QA IBM i.

Formato esperado:
- Resumen de cambios breve.
- Precondiciones y objetos por biblioteca.
- Datos de entrada.
- Pasos ejecutables.
- Resultado esperado por paso.
- Evidencia a capturar.
- Validaciones SQL o comandos read-only.
- Rollback o limpieza si aplica.

No incluyas rutas locales del workspace como parte del documento final.
