---
name: atlas-revisar-codigo-ibmi
description: Revisa codigo IBM i priorizando defectos, regresiones y mantenibilidad.
agent: ibmi-atlas-analista
model: "GPT-5.6 Terra (copilot)"
tools: [read, search]
argument-hint: Fuente, cambio o archivos que deben revisarse.
---

Revisa el codigo IBM i indicado.

Presenta primero los hallazgos ordenados por severidad, cada uno con fuente y ubicacion concreta. Busca errores funcionales, SQL incorrecto, indicadores, limites, commitment control, recursos no liberados, dependencias ILE, DDS incompatible, autoridad, rendimiento y pruebas faltantes.

Luego indica preguntas abiertas, resumen del cambio y riesgo residual. Si no encuentras defectos, dilo claramente y enumera las brechas de prueba.
