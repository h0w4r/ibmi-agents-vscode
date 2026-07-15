---
name: generar-fuente-ibmi
description: Genera un nuevo fuente IBM i con cabecera obligatoria.
agent: ibmi-desarrollador
tools: ["read", "search", "edit", "ibmi-local/*"]
argument-hint: Lenguaje, objetivo, requerimiento, objeto y ruta destino.
---

Genera el fuente IBM i solicitado.

Reglas:
- Responde y entrega en espanol.
- Incluye cabecera con fecha `DD/MM/YYYY`, autor indicado por el usuario, proposito y requerimiento. Si falta el autor, solicitalo.
- Agrega comentarios utiles para legibilidad.
- No inventes archivos ni campos: si faltan, consulta el repo o `ibmi-local/*`.
- Si el usuario no autoriza cambios remotos, solo escribe archivos locales del workspace.
