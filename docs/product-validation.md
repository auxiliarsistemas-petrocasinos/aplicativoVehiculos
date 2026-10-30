# Validación del producto — pasos 2–5

**Estado:** en curso · **Datos usados:** exclusivamente ficticios.

Este documento separa decisiones confirmadas, propuestas técnicas y asuntos que requieren
aprobación empresarial. No registra entrevistas que todavía no se han realizado.

## Matriz de decisiones

| Tema                                        | Estado                  | Evidencia o siguiente responsable |
| ------------------------------------------- | ----------------------- | --------------------------------- |
| Aplicación web conectada, móvil primero     | Confirmado              | Requisitos v0.3                   |
| Roles y límites de alta de cuentas          | Confirmado              | Requisitos y matriz automatizada  |
| Fotografías privadas y sin sobrescritura    | Confirmado              | Arquitectura y RLS                |
| Máximo técnico actual: 8 MiB por imagen     | Confirmado técnicamente | Bucket y validación               |
| 50 evidencias/80 MiB por turno y usuario    | Propuesto técnico       | Validar con conductores y Flota   |
| Catálogo y condiciones críticas PESV        | Pendiente               | Responsable PESV                  |
| Consecuencia de respuestas de fatiga        | Pendiente               | PESV, SST y privacidad            |
| Retención de fotos, firmas y fatiga         | Pendiente               | Privacidad/gestión documental     |
| Informes y fórmulas oficiales               | Pendiente               | Gerencia                          |
| Offline completo y resolución de conflictos | Aplazado                | Requiere flujo aprobado           |
| Mantenimiento integral y costos             | Aplazado                | Alcance aún no aprobado           |

## Sesiones requeridas

Cada sesión debe registrar fecha, participantes, rol, decisiones, desacuerdos y aprobación.

1. **Conductores:** datos mínimos, fricciones, cámara/firma, pérdida de conexión, tiempo aceptable
   y percepción de sensibilidad.
2. **Coordinación de flota:** alertas, turnos sin cerrar, restricciones, incidencias,
   mantenimiento y programación.
3. **Gerencia:** indicadores, periodicidad, filtros, formatos, destinatarios y detalle permitido.
4. **PESV:** catálogo crítico, fatiga y vigencia de formularios.
5. **Privacidad/seguridad documental:** clasificación, retención, eliminación, acceso y evidencia
   para restablecimiento.

## Recorrido por rol

- **Conductor:** acceso → cambio inicial → apertura → autoevaluación → inspección/firma →
  operación/incidencia → entrega/cierre.
- **Flota:** panorama → disponibilidad/restricciones → seguimiento → sustitución o
  regularización excepcional.
- **Gerencia:** filtros → indicador → registros sustentantes → exportación autorizada.
- **PESV/privacidad:** revisión del catálogo y matriz de tratamiento.
- **IT:** cuentas privilegiadas, restablecimiento, auditoría y mantenimiento técnico.

## Fricciones a validar

- Cantidad de controles en recepción y entrega.
- Captura de fotos con baja conectividad.
- Recuperación de borradores y reintentos.
- Firma táctil en equipos pequeños.
- Comprensión de estados borrador, confirmado, retenido y regularizado.
- Búsqueda de turnos, vehículos e incidencias con resultados paginados.

## Inventario preliminar de datos sensibles

| Categoría                        | Clasificación preliminar                  | Decisión pendiente           |
| -------------------------------- | ----------------------------------------- | ---------------------------- |
| Identidad, teléfono, correo      | Personal                                  | Acceso y retención           |
| Respuestas de fatiga             | Sensible operacional/potencialmente salud | Acceso y anonimización       |
| Firmas                           | Personal sensible                         | Validez y retención          |
| Fotografías                      | Personal/operacional según contenido      | Minimización y retención     |
| Ubicación textual en incidencias | Operacional, puede identificar personas   | Minimización                 |
| Auditoría                        | Seguridad                                 | Inmutabilidad y plazo mínimo |

## Historias candidatas

- P0: recuperar una carga interrumpida sin dejar objetos huérfanos.
- P0: impedir acceso, asociación, sustitución o eliminación de evidencia ajena.
- P0: acotar límites técnicos y auditar su limpieza.
- P1: listar turnos, vehículos e incidencias con filtros y paginación estable.
- P1: exportar por lotes sin cargar toda la base en memoria.
- P2: borradores persistentes y reintentos idempotentes en móvil.

La aceptación funcional final se completa únicamente después de las sesiones. No se implementan
retención definitiva, reglas médicas/PESV, informes oficiales ni offline completo a partir de esta
lista preliminar.
