---
name: atlas-generar-fuente-ibmi
description: Genera un nuevo fuente IBM i con cabecera obligatoria.
agent: ibmi-atlas-desarrollador
model: "GPT-5.6 Terra (copilot)"
tools: [read, search, edit]
argument-hint: Lenguaje, objetivo, requerimiento, objeto y ruta destino.
---

Genera el fuente IBM i solicitado.

Reglas:
- Responde y entrega en espanol.
- Incluye cabecera con fecha `DD/MM/YYYY`, autor indicado por el usuario, proposito y requerimiento. Si falta el autor, solicitalo.
- Agrega comentarios utiles para legibilidad.
- No inventes archivos ni campos: usa el repositorio o solicita el DDS/DDL correspondiente.
- Escribe exclusivamente en el workspace y conserva el encoding de archivos existentes.
