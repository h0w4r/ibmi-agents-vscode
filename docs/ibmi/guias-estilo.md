# Guias De Estilo IBM i

Version base: IBM i 7.5. Revisado: 15/07/2026. Las convenciones del repositorio tienen prioridad sobre estas recomendaciones generales.

## Principios

- Mantener nombres IBM i claros y consistentes con el sistema existente.
- Documentar archivos, campos, estructuras de datos y APIs usadas.
- Comentar bloques complejos, decisiones de negocio y conversiones de datos.
- Evitar cambios masivos de formato si no forman parte del requerimiento.

## Fuentes Nuevos

Todo fuente nuevo RPGLE, SQLRPGLE, CLLE o DDS debe incluir:

- Fecha de creacion en formato `DD/MM/YYYY`.
- Autor: valor proporcionado por el usuario o por la convencion de su organizacion; nunca se publica un identificador personal como valor predeterminado.
- Proposito.
- Requerimiento.

## Respuestas Del Agente

El agente debe responder en espanol, con tablas o checklists cuando ayuden, y con referencias concretas a programas, archivos, campos, estructuras o comandos.

## Fuentes

- Convenciones del paquete `ibmi-senior` y reglas de cabecera acordadas para el proyecto.
