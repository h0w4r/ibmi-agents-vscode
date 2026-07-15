# DDS Para PF, LF Y DSPF

Version base: IBM i 7.5. Verificado: 15/07/2026. Validar palabras clave contra el release y nivel de compilador del servidor.

## PF

Revisar:

- Nombre de formato de registro.
- Campos, tipo, longitud, decimales y texto.
- Claves y restricciones.
- Compatibilidad con programas existentes.

## LF

Revisar:

- Archivos base.
- Claves.
- Select/omit.
- Joins o formatos multiples si existen.

## DSPF

Revisar:

- Formatos de pantalla.
- Indicadores.
- Teclas `CAxx` y `CFxx`.
- Subfiles.
- Mensajes, ayudas y validaciones.

## Cabecera

En DDS usar comentarios `A*` para la cabecera obligatoria.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=files-display-device
- https://www.ibm.com/docs/en/i/7.5.0?topic=files-database
