# Compilacion IBM i

Version base: IBM i 7.5. Verificado: 15/07/2026. Parametros disponibles pueden variar por release y PTF.

## RPGLE

Comandos habituales:

| Caso | Comando | Notas |
| --- | --- | --- |
| Programa bound simple | `CRTBNDRPG` | Usar `DBGVIEW(*SOURCE)` si se requiere debug fuente. |
| Modulo ILE | `CRTRPGMOD` | Luego enlazar con `CRTPGM` o `CRTSRVPGM`. |
| Programa con SQL embebido | `CRTSQLRPGI` | Revisar `COMMIT`, `DBGVIEW`, `OBJTYPE`, `OPTION` y `RPGPPOPT`. |
| Programa ILE desde modulos | `CRTPGM` | Revisar entry module, activation group y binding directories. |
| Service program | `CRTSRVPGM` | Preferir binder language y firmas para interfaces publicas. |

## CLLE

Usar `CRTBNDCL` para programas CLLE. Revisar parametros, autoridad y comandos llamados por el programa.

## DDS

| Objeto | Comando |
| --- | --- |
| Archivo fisico | `CRTPF` |
| Archivo logico | `CRTLF` |
| Pantalla | `CRTDSPF` |

## Politica Del Agente

La v1 solo genera planes de compilacion. No ejecuta compilaciones sobre IBM i sin una fase posterior autorizada.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75/cl/crtbndrpg.htm
- https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75/cl/crtrpgmod.htm
- https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75/cl/crtpgm.htm
- https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75/cl/crtsrvpgm.htm
