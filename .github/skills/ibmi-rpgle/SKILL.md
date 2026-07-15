---
name: ibmi-rpgle
description: Analiza, crea, corrige y moderniza RPG III/IV, RPGLE fijo o free-form. Usar para H/F/D/P specs, procedimientos, subrutinas, indicadores, DS, copybooks, archivos, APIs, modulos y errores RNF.
---

# IBM i RPGLE

Usa esta skill para programas RPGLE, RPG IV fijo/free, modulos ILE, service programs, copybooks y diagnostico RNF.

## Flujo

1. Revisa fuente, copybooks y archivos referenciados.
2. Identifica F-specs, D-specs, procedimientos, prototipos, estructuras de datos, indicadores y APIs.
3. Si faltan campos o archivos, solicita el DDS, DDL, copybook o miembro fuente correspondiente.
4. Para fuentes nuevos, agrega cabecera obligatoria y comentarios utiles.
5. Para compilacion, genera plan con `CRTBNDRPG` o `CRTRPGMOD`; no ejecutes en v1.
6. Para modulos y service programs, carga tambien la skill `ibmi-ile`.

## Respuesta

Incluye nombres de programas, archivos, campos y estructuras de datos cuando correspondan.
