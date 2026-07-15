---
name: ibmi-rendimiento
description: Diagnostica rendimiento de programas, SQL y jobs IBM i. Usar para consultas lentas, table scans, indices, locks, esperas, CPU, memoria, I/O, planes de acceso o degradaciones comparativas.
---

# Rendimiento IBM i

## Metodo

1. Define sintoma, periodo, volumen, linea base y criterio de exito.
2. Reune evidencia read-only de consulta, objeto, indice, job y recursos; no optimices por intuicion.
3. Separa costo de SQL, logica RPG, I/O, locks, red, spool y contencion de sistema.
4. Formula hipotesis priorizadas y una medicion para confirmar o descartar cada una.
5. Propone cambios reversibles y compara antes/despues. No crea indices ni cambia parametros remotos.

Carga [guia de diagnostico](references/rendimiento-checklist.md) cuando haya que preparar una investigacion completa.
