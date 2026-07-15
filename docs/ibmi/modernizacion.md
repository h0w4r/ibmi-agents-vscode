# Modernizacion IBM i

Version base: IBM i 7.5. Revisado: 15/07/2026. Confirmar restricciones de release, compilador, contratos externos y PTF antes de aplicar cambios.

## Objetivos

- Mejorar legibilidad sin romper compatibilidad vigente.
- Migrar gradualmente a RPGLE free-form cuando aplique.
- Encapsular logica repetida en procedimientos o service programs.
- Usar SQL claro y catalogos Db2 for i cuando sea mas mantenible.
- Agregar pruebas de regresion antes de cambios funcionales.

## Riesgos

- Cambios en formatos externos.
- Diferencias de CCSID.
- Dependencias con copybooks.
- Commitment control.
- Autoridades y listas de bibliotecas.

## Estrategia

Modernizar por cortes pequenos, verificables y reversibles. Si el usuario descarta compatibilidad legacy, retirarla tambien de validadores, documentacion y auxiliares.

## Fuentes

- https://www.ibm.com/docs/en/i/7.5.0?topic=languages-ile-rpg-programmers-guide
- https://www.ibm.com/docs/en/i/7.5.0?topic=services-db2-i
