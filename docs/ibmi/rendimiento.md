# Rendimiento IBM i

Version base: IBM i 7.5. Verificado: 15/07/2026. Los servicios de rendimiento pueden requerir PTF y autoridades adicionales.

## Metodo

1. Definir linea base, volumen, periodo y criterio de exito.
2. Separar SQL, CPU, I/O, locks, waits, red y trabajo batch.
3. Consultar columnas, indices y claves antes de sugerir cambios SQL.
4. Medir con condiciones comparables y registrar plan de acceso cuando este disponible.
5. Proponer cambios reversibles; no crear indices ni cambiar system values desde el MCP.

## Indicadores De Riesgo

- Predicados no sargables o conversiones implicitas.
- Acceso registro a registro donde procede una operacion de conjunto.
- Cursores o recursos abiertos mas tiempo del necesario.
- Contencion por locks o commitment control.
- Spool, logging o llamadas remotas excesivas dentro de bucles.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=services-db2-i
- https://www.ibm.com/support/pages/ibm-i-performance-faq
