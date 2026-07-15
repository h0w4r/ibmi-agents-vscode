# Arquitectura ILE

Version base: IBM i 7.5. Verificado: 15/07/2026. Confirmar opciones de compilacion y binding en el release objetivo.

## Componentes

| Componente | Funcion | Comando habitual |
| --- | --- | --- |
| Modulo | Unidad compilada no ejecutable | `CRTRPGMOD` o `CRTSQLRPGI OBJTYPE(*MODULE)` |
| Programa ILE | Ejecutable enlazado | `CRTPGM` o `CRTBNDRPG` |
| Service program | Procedimientos reutilizables | `CRTSRVPGM` |
| Binding directory | Lista de referencias de enlace | `CRTBNDDIR`/`ADDBNDDIRE` |
| Binder language | Exportaciones y firmas | Fuente `QSRVSRC` usado por `CRTSRVPGM` |

## Revision

- Comparar prototipos y definiciones de procedimientos.
- Controlar activation groups, estado estatico y recursos abiertos.
- Versionar firmas de service programs para mantener contratos binarios.
- Documentar orden de compilacion, bibliotecas y binding directories.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-integrated-language-environment
- https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75/cl/crtsrvpgm.htm
