# Seguridad y gobierno de datos

## Evidencias

La carga usa intención → URL firmada → carga directa → verificación binaria → finalización. La ruta,
propietario, turno, MIME, tamaño y vencimiento nacen en servidor. No existe sobrescritura. La
reconciliación usa npm run evidence:reconcile en simulación por defecto y requiere --apply para
realizar cambios.

El modo aplicado solo se autoriza en un entorno operativo mediante procedimiento separado. El
script compara el hostname con loopback y bloquea destinos remotos salvo --allow-remote. Pagina el
inventario completo, reclama atómicamente una intención vencida antes de borrar su objeto y vuelve
a comprobar metadatos antes de eliminar un objeto sin asociación. Los metadatos cuyo objeto falta
se conservan y auditan.

## Límites de acceso

Se emplean HMAC separadas para identificador normalizado y, únicamente cuando Vercel aporta su
cabecera confiable, señal de red. Ventana: 15 minutos; umbrales técnicos: 10 por identificador y 50
por señal de red. Sin una señal confiable se conserva el límite por identificador y no se crea un
bucket global. Se eliminan por lotes entradas anteriores a un día. Estos controles complementan,
no sustituyen, Supabase Auth ni controles del proxy.

## Exportaciones

La exportación requiere rol autorizado y RLS, procesa lotes de 200, rechaza conjuntos superiores a
5.000 turnos, impone un presupuesto de 30 segundos y coopera con la cancelación de la solicitud.

## Retención

retention_policies contiene categorías desactivadas. Una política solo puede habilitarse con plazo,
responsable y fecha de aprobación. No hay tarea destructiva de retención mientras la matriz
empresarial siga pendiente.

| Categoría         | Estado                                                               |
| ----------------- | -------------------------------------------------------------------- |
| Fotografías       | Pendiente                                                            |
| Firmas            | Pendiente                                                            |
| Fatiga            | Pendiente                                                            |
| Incidencias       | Pendiente                                                            |
| Auditoría         | Pendiente                                                            |
| Cuentas inactivas | Pendiente                                                            |
| Exportaciones     | Pendiente                                                            |
| Límites de login  | Limpieza técnica corta implementada; aprobación documental pendiente |

## Índices

La migración agrega índices sobre consultas y políticas observadas: evidencia por propietario y
entidad, incidencias por vehículo/conductor/estado, documentos por vencimiento, auditoría por
actor/acción, traslados por entidad y claves foráneas de autorizaciones/restricciones/correcciones.
Antes de añadir otros índices se debe conservar EXPLAIN (ANALYZE, BUFFERS) con el volumen
sintético; no se crean índices por catálogo sin consulta sustentante.
