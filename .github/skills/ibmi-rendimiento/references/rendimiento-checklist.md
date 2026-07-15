# Checklist De Rendimiento

| Capa | Evidencia read-only | Pregunta |
| --- | --- | --- |
| SQL | sentencia, filas, indices, claves, plan | Existe scan, mala selectividad o conversion implicita? |
| RPG | bucles, llamadas, I/O por registro | Se repite trabajo evitable? |
| Job | estado, CPU, waits, locks | El tiempo es CPU, espera o contencion? |
| Sistema | CPU, memoria, ASP, actividad | El problema es local o sistemico? |
| Integracion | latencia, timeout, payload | El cuello esta fuera de IBM i? |

Medir antes y despues con el mismo volumen y condiciones. No crear indices, terminar jobs ni cambiar system values desde la skill.
