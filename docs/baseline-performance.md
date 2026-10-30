# Línea base de seguridad y rendimiento

**Fecha:** 2026-10-29 · **Rama base:** develop después del PR #2.

## Medición reproducible inicial

| Comprobación                                | Línea base                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| npm run verify                              | PASS: formato, lint, tipos, 23 unitarias y build de 15 rutas                 |
| Dependencias                                | 472 paquetes instalados; 0 vulnerabilidades reportadas por npm ci            |
| Patrón de lectura                           | getSnapshot hacía 8 lecturas completas paginadas de 1000 filas por pantalla  |
| Pantallas dependientes de fotografía global | Diez rutas de aplicación                                                     |
| Exportación                                 | Cargaba la fotografía global completa antes de construir CSV                 |
| Evidencia                                   | Carga directa seguida por recibo; podía quedar objeto sin intención/metadato |
| Login limits                                | Una fila por identificador, sin segunda señal ni limpieza acotada            |

Los tiempos, filas reales, memoria de exportación y tamaño de PostgreSQL/Storage requieren ejecutar
npm run seed:scale y la matriz local. No se inventan cifras cuando Docker o el entorno local no
están disponibles.

## Medición con volumen sintético

La ejecución local posterior creó 30 campos base y, tras las pruebas de integración, midió 32
campos, 102 vehículos, 69 turnos y 15 incidencias. PostgreSQL ocupó 12 MB y el backend local de
Storage 15,6 MB. La reconciliación en simulación informó cero intenciones vencidas, cero objetos
sin asociación y cero metadatos sin objeto.

Con este volumen pequeño PostgreSQL eligió recorridos secuenciales: la consulta de turnos por campo
terminó en 0,182 ms y la de incidencias pendientes del campo en 0,232 ms. Esto no justifica índices
adicionales. Los índices incluidos corresponden a filtros/FK observados y deberán reevaluarse con
un volumen representativo mayor.

## Objetivos técnicos aprobables

- Cero lecturas sin límite desde pantallas o exportación.
- Máximo de 200 registros por lote de interfaz y exportación.
- Exportación CSV transmitida por lotes.
- Intenciones de carga con vencimiento de dos horas y reconciliación idempotente.
- Cero acceso cruzado a evidencias y cero sobrescritura.
- Limpieza acotada de señales de login y mensajes genéricos.

Las metas de latencia, concurrencia y volumen de almacenamiento son **pendientes de aprobación**
después de medir con los 30 campos sintéticos.
