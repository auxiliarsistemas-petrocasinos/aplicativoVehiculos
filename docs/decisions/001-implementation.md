# Decisiones de implementación de la primera demostración

Fecha: 2026-10-12. Base documental conservada: requisitos v0.3 y arquitectura v0.1. El prompt maestro v0.2 adjunto a esta tarea autorizó implementar el stack y los controles de seguridad allí especificados; no convirtió todos los PROPUESTO/PENDIENTE en política empresarial.

## Confirmado y materializado

Monolito Next.js App Router + TypeScript, Tailwind, componentes shadcn/ui, Recharts, Supabase Auth/PostgreSQL/Storage. Las operaciones ordinarias usan siempre el JWT del usuario. El cliente privilegiado solo se usa para resolver alias, crear/restablecer cuentas y scripts técnicos explícitos. No hay GPS, sincronización offline, mantenimiento integral ni recuperación autogestionada en la interfaz.

Las escrituras pasan por `execute_command`: identidad y cambio de contraseña, rol, bloqueo transaccional del actor, idempotencia, bloqueo del turno/vehículo, validación de documentos/restricciones y persistencia atómica. Dos índices parciales impiden doble turno operativo y doble utilización abierta. Una apertura no reserva un vehículo ni lo muestra como en uso. Los errores por competencia se resuelven actualizando y seleccionando de nuevo.

RLS otorga solo lectura autorizada; no hay grants de escritura directa para `authenticated`. Las funciones privadas de mutación no están expuestas por RPC. Gerencia carece de escritura. Las respuestas de fatiga y borradores sensibles solo los consulta su autor. El rol IT no recibe estas respuestas por RLS. El operador de infraestructura con acceso a la base sigue siendo un rol técnico de alta confianza; se requiere política de custodia y retención antes de datos reales.

Auth conserva las contraseñas. El trigger de cambio del hash en `auth.users` permite finalizar el requisito de cambio también al cambiar realmente la clave por Auth API; ninguna llamada de cliente puede simplemente desmarcar el flag. Durante reset, el bloqueo permanece hasta finalizar el procedimiento administrativo. Se invalidan sesiones/refresh tokens y se marca una época mínima del JWT. Un fallo intermedio deja la cuenta retenida; IT puede reintentar con una nueva clave temporal.

Storage es privado. Las rutas contienen propietario/turno/UUID. La confirmación verifica el objeto, tamaño/MIME, propietario, turno y disponibilidad de la evidencia. Cada evidencia se vincula una sola vez. No se permite sobrescribir ni borrar pruebas desde el cliente. La ruta de carga además comprueba la cabecera binaria de JPG/PNG/WebP. Las URL de consulta vencen en 60 segundos. La firma dibujada no es biometría ni firma digital certificada.

## Propuestas de implementación adoptadas para demo, no política oficial

- Plantillas `demo_only` con versiones inmutables por permisos; la UI consulta los ítems de la versión persistida. El catálogo semilla se genera desde preguntas saneadas. No existe un selector que habilite producción o declare aprobado PESV.
- Una apertura pendiente por conductor. Sin vencimiento/reserva automática. El administrador puede regularizar una apertura abandonada, conservando faltantes.
- Traslados con turno/utilización pendiente se rechazan hasta contar con política de excepciones. Los turnos guardan el campo histórico; los segmentos guardan placa y campo.
- Restricciones manuales; ningún Regular/Malo genera por sí solo criticidad automática. Los documentos que administración registra explícitamente como obligatorios y vencidos/sin fecha impiden una nueva recepción. El catálogo legal general no está definido por esta implementación.
- Fotografías hasta 8 MB, JPG/PNG/WebP. Máximo cinco por respuesta, ocho por incidencia en servidor. Son límites técnicos de demo, no política de retención.
- Borradores en servidor con confirmación explícita; no se guardan respuestas sensibles en localStorage. Se requiere conexión para guardar/reanudar. No hay sincronización offline.
- Lecturas inconsistentes generan auditoría y aviso, sin falsificar el valor. Las correcciones se guardan como actuaciones nuevas; los indicadores de esta entrega siguen usando lecturas originales, con esa limitación visible.
- Las consultas de dashboard paginan para no truncar al límite por defecto de 1.000 registros. Para mayor volumen se requerirán agregados SQL/paginación visible; esta versión está orientada a la demostración.

## Discrepancias documentales registradas

GA FO 20 fue excluido del documento funcional por contener potenciales datos reales; esta tarea autoriza leerlo como fuente y prohíbe copiarlo. Solo se extrajeron etiquetas. Sus páginas declaran versiones 03 y 02. El peritaje propone OK/NOVEDAD/NA y clasificación automática; prevalece B/R/M/NA aprobado, sin criticidades inventadas. GA FO 09 menciona livianos, mientras el flujo aprobado exige autoevaluación de todos los conductores. GA FO 17 es periódico; sus exclusivos no se vuelven diarios. Ver `docs/forms-specification.md`.

## Pendientes antes de operar

Aprobación del catálogo consolidado y periodicidades; criterios críticos PESV; actuación ante fatiga y medicamentos; acceso/retención de información sensible; documentos legales aplicables; verificación de identidad y comunicación de claves; liberación de unidades regularizadas sin entrega; excepciones de traslados; colisiones adicionales de alias y nombres compuestos; propiedad de la flota; formatos oficiales de informes. No se resuelven silenciosamente con esta demo.
