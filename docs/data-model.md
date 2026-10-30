# Persistencia y seguridad

## Relaciones

`auth.users` → `profiles` (1:1). Campos → perfiles y vehículos actuales. Cada turno conserva conductor y campo histórico; cada segmento `vehicle_usages` conserva vehículo, placa y campo al recibirlo. Un turno puede contener varios segmentos; como máximo uno abierto. Las inspecciones pertenecen a un segmento y tienen tipo recepción/entrega, plantilla, lectura y firma de apertura opcional en el modelo pero obligatoria al confirmar apertura. La clave única segmento/tipo impide sobrescribir recepción/entrega.

Plantillas → ítems; inspección → respuestas. El catálogo completo aplicable se valida en SQL, no solo en UI. Una inspección y una incidencia reclaman evidencias privadas previamente registradas. Las autorizaciones relacionan turno, segmento original y reemplazo, con consumo de una sola vez. Seguimientos, traslados, restricciones, correcciones y auditoría son actuaciones históricas. `operation_drafts` contiene datos parciales restringidos a su autor; no es un formulario confirmado.

## Índices e integridad

`one_operational_shift` cubre apertura/activo/en cierre por conductor. `one_open_vehicle_usage` cubre segmentos sin entrega, incluso si el turno fue regularizado. `one_open_usage_per_shift` evita dos unidades simultáneas en un mismo turno. `one_pending_substitution` permite una autorización pendiente por turno. Placas y alias son únicos normalizados. FK mantienen identidades, plantillas y actuaciones. Restricciones de odómetro rechazan negativos, NaN e infinitos.

La idempotencia usa actor + UUID en `private.command_receipts`; la misma clave con contenido distinto se rechaza. Un mismo reintento devuelve el resultado confirmado. Recepción, cierre y sustitución son transacciones indivisibles; fallar una foto o pregunta revierte todos sus cambios. Los bloqueos por vehículo y los índices evitan carreras de asignación.

## Permisos

| Grupo                                | Conductor    | Flota            | Gerencia       | IT                  |
| ------------------------------------ | ------------ | ---------------- | -------------- | ------------------- |
| Campos/vehículos                     | Campo actual | Global           | Global lectura | Global              |
| Turnos/usos/inspecciones/incidencias | Propios      | Global           | Global lectura | Global              |
| Fatiga/borradores                    | Solo autor   | Sin lectura      | Sin lectura    | Sin lectura         |
| Perfiles de cuentas                  | Propio       | Administración   | Propio         | Administración      |
| Auditoría técnica                    | Sin lectura  | Sin lectura      | Sin lectura    | Lectura             |
| Alta/restablecimiento                | No           | Solo conductores | No             | Cuentas autorizadas |

`anon` no lee tablas internas. La lectura del perfil propio permite mostrar cambio obligatorio, pero las tablas operativas y RPC siguen bloqueadas hasta completar Auth. Escrituras en tablas revocadas; las funciones privadas tienen `search_path` vacío y permisos mínimos. Todas las modificaciones operativas ocurren con permiso comprobado en SQL. El cliente servicio no se usa para consultas operativas del producto.

`vehicle_availability()` expone únicamente ID, ocupación y elegibilidad de vehículos del campo autorizado (o global para observadores). Consulta los segmentos abiertos sin exponer turnos ni identidades de otros conductores; evita que la RLS de turnos propios haga aparecer disponible una unidad ocupada. La recepción vuelve a validar elegibilidad dentro de la transacción.

## Conservación y pendientes

Las políticas no permiten borrar/sobrescribir evidencias históricas. `scripts/cleanup-evidence.mjs` identifica cargas no asociadas de más de siete días en turnos finalizados; por defecto solo lista candidatos y requiere `--apply` para borrarlos. Los objetos que llegaron a Storage pero fallaron antes de generar metadatos requieren reconciliación técnica adicional; no se borran automáticamente. El plazo de siete días es una salvaguarda de demostración y requiere revisión antes de uso real.

No se ha implementado aún retención empresarial, respaldo/restauración, eliminación reglada, revocación de una autorización de sustitución pendiente, ni publicación administrativa de nuevas plantillas desde la UI. La aprobación oficial del catálogo y de la operación real está pendiente.
