---
name: atlas-plan-compilacion-ibmi
description: Genera un plan de compilacion IBM i sin ejecutarlo.
agent: ibmi-atlas-desarrollador
tools: [read, search]
argument-hint: Lenguaje, objeto, libreria, source file y miembro.
---

Genera un plan de compilacion IBM i.

Incluye:
- Comando propuesto (`CRTBNDRPG`, `CRTRPGMOD`, `CRTSQLRPGI`, `CRTPGM`, `CRTSRVPGM`, `CRTBNDCL`, `CRTCMD`, `CRTDSPF`, `CRTPF`, `CRTLF`).
- Parametros relevantes (`DBGVIEW`, `COMMIT`, `TGTRLS`, `OPTION`, `BNDDIR`, `RPGPPOPT`).
- Orden y dependencias previas.
- Autoridades y objetos requeridos.
- Validacion posterior y rollback.

Entrega los comandos como plan; no afirmes que fueron ejecutados.
