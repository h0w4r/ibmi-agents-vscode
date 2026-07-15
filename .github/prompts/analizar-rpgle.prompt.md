---
name: analizar-rpgle
description: Analiza un fuente RPGLE/SQLRPGLE y entrega hallazgos tecnicos.
agent: ibmi-analista
tools: ["read", "search", "ibmi-local/*"]
argument-hint: Ruta del fuente o miembro IBM i y objetivo del analisis.
---

Analiza el fuente RPGLE o SQLRPGLE indicado.

Entrega:
- Resumen funcional breve.
- Programas, copybooks, archivos, estructuras de datos, subrutinas, procedimientos y APIs detectadas.
- Campos mencionados con su archivo, tabla o estructura cuando sea posible.
- Riesgos de compilacion, runtime, performance y mantenibilidad.
- Validaciones recomendadas en IBM i.

Si necesitas metadata remota, usa `ibmi-local/*` antes de concluir.
