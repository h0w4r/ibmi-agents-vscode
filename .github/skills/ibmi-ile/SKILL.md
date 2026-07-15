---
name: ibmi-ile
description: Disena, revisa y diagnostica arquitectura ILE en IBM i. Usar para modulos, programas, service programs, binder language, firmas, prototipos, activation groups, binding directories y errores de enlace.
---

# IBM i ILE

## Flujo

1. Inventaria modulos, programas, service programs, procedimientos exportados/importados y copybooks de prototipos.
2. Verifica que firma, parametros, `OPTIONS`, retorno y convencion de llamada coincidan entre caller y callee.
3. Explica activation group, ciclo de vida, estado estatico y thread safety.
4. Genera planes separados para `CRTRPGMOD`, `CRTPGM` y `CRTSRVPGM`; nunca los ejecutes.
5. Para interfaces publicas, recomienda binder language y control de firma en vez de `EXPORT(*ALL)`.

Carga [checklist ILE](references/ile-checklist.md) para revisiones de binding o despliegue.
