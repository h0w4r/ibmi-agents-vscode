---
name: plan-compilacion-ibmi
description: Genera un plan de compilacion IBM i sin ejecutarlo.
agent: ibmi-desarrollador
tools: ["read", "search", "ibmi-local/*"]
argument-hint: Lenguaje, objeto, libreria, source file y miembro.
---

Genera un plan de compilacion IBM i.

Incluye:
- Comando propuesto (`CRTBNDRPG`, `CRTRPGMOD`, `CRTSQLRPGI`, `CRTPGM`, `CRTSRVPGM`, `CRTBNDCL`, `CRTCMD`, `CRTDSPF`, `CRTPF`, `CRTLF`).
- Parametros relevantes (`DBGVIEW`, `COMMIT`, `TGTRLS`, `OPTION`, `BNDDIR`, `RPGPPOPT`).
- Dependencias previas.
- Validacion posterior.

No ejecutes la compilacion en v1.
