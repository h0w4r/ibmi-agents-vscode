---
name: ibmi-clle
description: Crea, revisa y diagnostica programas CLLE/CLP en IBM i. Usar ante fuentes CL, comandos, parametros PARM, variables DCL, MONMSG, overrides, job attributes o automatizacion operativa.
---

# IBM i CLLE

Usa esta skill para CLLE, CLP, comandos, parametros, errores CPF y automatizacion operativa.

## Flujo

1. Identifica comandos, variables DCL, monitores `MONMSG` y parametros.
2. Separa comandos de consulta de comandos mutantes.
3. Para nuevos fuentes, usa cabecera obligatoria en bloque comentario.
4. Para compilacion, genera plan con `CRTBNDCL`; no ejecutes en v1.
5. Si un comando puede modificar sistema, pide confirmacion explicita.
6. No presentes comandos como ejecutados si solo fueron preparados o revisados.
