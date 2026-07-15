# Historial De Cambios - IBM i Senior

## 0.4.0 - 15/07/2026

- Deteccion automatica de drivers ODBC IBM i registrados para 64 bits.
- Asistente interactivo para descarga, seleccion y comprobacion del Windows Application Package.
- Validacion Authenticode del `setup.exe` y ejecucion elevada con `ADDLOCAL=req,odbc`.
- Modo no interactivo que falla antes de modificar VS Code cuando falta el prerequisito.
- Diagnostico y manifiesto ampliados con alias, plataforma y version ODBC efectivos.

## 0.3.1 - 15/07/2026

- Catalogo documentado de las 18 herramientas disponibles, con entradas, resultados y limites.
- Casos de uso conectados para Db2, RPGLE, job logs, spool, compilacion, APIs y QA.
- Ejemplos listos para copiar en Copilot Chat.
- Estado y recomendaciones para trabajar con varios ambientes IBM i sin mezclar credenciales.
- Ejemplos publicos anonimizados, autor de cabecera obligatorio y validacion automatica contra datos internos.

## 0.3.0 - 15/07/2026

- Instalacion global independiente de cualquier workspace.
- Autodeteccion de VS Code estable, VS Code Insiders y modo portable.
- Migracion con backup de agentes manuales antiguos ubicados en la carpeta de prompts.
- Servidor local de consulta con circuito de autenticacion que corta despues del primer login rechazado.
- Soporte para los aliases ODBC actuales y heredados de IBM i Access.
- Scripts exclusivos de instalacion, actualizacion, diagnostico y desinstalacion.
- Paquete ZIP reproducible con checksum SHA-256.
