---
name: ibmi-dds
description: Disena, corrige y revisa DDS para PF, LF y DSPF. Usar para formatos de registro, campos, claves, select/omit, indicadores, teclas, ventanas, subfiles y compatibilidad de layouts 5250.
---

# IBM i DDS

Usa esta skill para archivos fisicos, logicos y pantallas DSPF.

## Flujo

1. Identifica tipo de objeto: PF, LF o DSPF.
2. Para PF/LF, documenta campos, tipos, longitudes, textos, claves y select/omit.
3. Para DSPF, documenta formatos de registro, indicadores, teclas CA/CF, mensajes y subfiles.
4. Usa cabecera DDS con lineas `A*`.
5. Para compilacion, genera `CRTPF`, `CRTLF` o `CRTDSPF`; no ejecutes en v1.
6. Valida coordenadas, solapamientos, orden de escritura y estado vacio de subfiles.
