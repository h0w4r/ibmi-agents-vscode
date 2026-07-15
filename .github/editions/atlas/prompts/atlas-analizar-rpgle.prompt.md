---
name: atlas-analizar-rpgle
description: Analiza un fuente RPGLE/SQLRPGLE y entrega hallazgos tecnicos.
agent: ibmi-atlas-analista
tools: [read, search]
argument-hint: Ruta del fuente o artefacto IBM i y objetivo del analisis.
---

Analiza el fuente RPGLE o SQLRPGLE indicado.

Entrega:
- Resumen funcional breve.
- Programas, copybooks, archivos, estructuras de datos, subrutinas, procedimientos y APIs detectadas.
- Campos mencionados con su archivo, tabla o estructura cuando sea posible.
- Riesgos de compilacion, runtime, rendimiento y mantenibilidad.
- Validaciones recomendadas en IBM i.

Si falta metadata, identifica el DDS, catalogo o fuente adicional que debe proporcionar el usuario.
