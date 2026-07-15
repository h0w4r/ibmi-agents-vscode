# QA IBM i

Version base: IBM i 7.5. Revisado: 15/07/2026. Adaptar cada caso al ambiente, librerias y datos autorizados por el usuario.

## Estructura Recomendada

- Resumen de cambios breve.
- Precondiciones.
- Datos de entrada.
- Pasos ejecutables.
- Resultado esperado.
- Evidencia.
- Validaciones SQL o comandos read-only.
- Rollback o limpieza si aplica.

## Buenas Practicas

- No incluir rutas locales del workspace.
- Reflejar librerias por objeto cuando el usuario las provea.
- No agregar `ADDLIBLE` o `CHGCURLIB` por defecto si la prueba no los requiere.
- Mantener el foco en ejecucion y validacion observable.

## Fuentes

- Convenciones QA del paquete `ibmi-senior`; los objetos y resultados reales del requerimiento son la evidencia autoritativa.
