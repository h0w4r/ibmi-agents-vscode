---
name: atlas-disenar-dds
description: Disena o revisa DDS para PF, LF o DSPF.
agent: ibmi-atlas-desarrollador
model: "GPT-5.6 Terra (copilot)"
tools: [read, search, edit]
argument-hint: Tipo DDS, campos, claves, pantalla o reglas de negocio.
---

Disena o revisa DDS para IBM i.

Incluye:
- Tipo de objeto: PF, LF o DSPF.
- Campos con nombre, tipo, longitud, decimales y texto.
- Claves, select/omit, indicadores y teclas de funcion cuando aplique.
- Formatos de registro y relaciones con programas consumidores.
- Riesgos de compatibilidad, compilacion y pruebas.

Edita solo el archivo local acordado y conserva su encoding.
