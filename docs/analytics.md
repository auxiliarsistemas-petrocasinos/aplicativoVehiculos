# Indicadores iniciales y CSV

Todos derivan de filas persistidas y autorizadas por RLS. No hay cifras decorativas del mockup ni costos/consumos inventados.

| Indicador              | Fórmula                                                                | Filtros                             |
| ---------------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| Turnos activos         | Conteo de turnos `active` o `closing`                                  | Campo histórico y fecha de creación |
| Vehículos en uso       | Vehículos distintos con segmento sin entrega, incluso regularizados    | Campo actual; situación presente    |
| Incidencias pendientes | Incidencias `pending` o `following` de turnos filtrados                | Campo/fecha del turno               |
| Vehículos restringidos | Vehículos distintos con restricción sin levantar                       | Campo actual; situación presente    |
| Operación por campo    | Conteo de turnos filtrados y vehículos actuales                        | Campo y período para turnos         |
| Utilización            | Vehículos en uso / vehículos del campo × 100                           | Campo; situación presente           |
| Tendencia mensual      | Conteo de turnos creados por mes, incluidos borradores y regularizados | Campo/período; meses con registros  |
| Kilómetros exportados  | Suma de `end_km - start_km` de segmentos con entrega                   | Campo/fecha del turno               |

No se incluyen segmentos sin lectura final en la suma. Lecturas inconsistentes no se convierten en cero: se muestran y auditan. Las correcciones registradas se muestran junto al original, pero esta versión no recalcula los indicadores con ellas. Las fechas de filtro y agrupación usan `America/Bogota`, con límites de día inclusivos. La tendencia omite meses sin registros; no calcula una disponibilidad histórica. El CSV presenta estados en español, campo, apertura, cierre y kilómetros registrados. Se escapan comillas, separadores y valores que podrían ejecutar fórmulas en una hoja de cálculo.

Gerencia, flota e IT pueden exportar; conductor no. La API de exportación comprueba el rol y consulta con JWT del usuario. Los informes oficiales, consumo/costos, comparaciones históricas de disponibilidad y objetivos de cumplimiento siguen pendientes.
