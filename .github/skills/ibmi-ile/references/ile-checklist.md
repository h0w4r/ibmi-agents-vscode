# Checklist ILE

- Identificar `MODULE`, `PGM`, `SRVPGM`, `BNDDIR` y bibliotecas exactas.
- Comparar prototipo y definicion: tipo, longitud, `CONST`, `VALUE`, `OPTIONS`, retorno y CCSID.
- Revisar `ACTGRP`, estado estatico, recursos abiertos y seguridad de hilos.
- Verificar imports/exports, orden de binding y conflictos de simbolos.
- Preferir binder language con firmas versionadas para interfaces publicas.
- Planificar `CRTRPGMOD`/`CRTSQLRPGI OBJTYPE(*MODULE)`, luego `CRTPGM` o `CRTSRVPGM`.

Version base: IBM i 7.5. Verificado: 15/07/2026. Confirmar parametros con `ibmi.compile.plan` y documentacion IBM del release objetivo.
