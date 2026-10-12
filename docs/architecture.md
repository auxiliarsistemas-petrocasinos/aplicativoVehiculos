# aplicativoVehiculos — Arquitectura técnica (borrador v0.1)

**Proyecto:** aplicativoVehiculos · Petrocasinos<br>
**Fecha:** 2026-10-11<br>
**Estado:** stack APROBADO; diseño de implementación PROPUESTO para revisión.<br>
**Repositorio:** `auxiliarsistemas-petrocasinos/aplicativoVehiculos`<br>
**Documento funcional relacionado:** `especificacion-funcional-aplicativoVehiculos-v0.3.md` (borrador sujeto a revisión).

> Este documento no implica que los componentes ya estén instalados ni que los controles de seguridad estén implementados. No autoriza desplegar en producción ni utilizar datos reales de empleados.

## 1. Decisiones y alcance

### Tecnologías confirmadas

| Capa | Tecnología aprobada | Responsabilidad |
|---|---|---|
| Aplicación web | Next.js (App Router) + TypeScript | Páginas, renderizado y endpoints/acciones del servidor |
| Diseño | Tailwind CSS + shadcn/ui | Sistema de componentes y responsive mobile-first |
| Gráficos | Recharts | Tableros interactivos y gráficos basados en consultas reales |
| Datos | Supabase PostgreSQL | Persistencia, relaciones, integridad, auditoría y RLS |
| Identidad | Supabase Auth | Cuentas, contraseñas, sesiones y cambio de contraseña |
| Evidencias | Supabase Storage privado | Fotografías, firmas dibujadas y, cuando se apruebe, documentos |
| Despliegue de demostración | Vercel + Supabase administrado | Aplicación y servicios iniciales |
| Despliegue futuro | Servidor empresarial | Posibilidad de ejecución autohospedada, no migración automática |

**PROPUESTO, como herramientas de implementación:** React Hook Form + Zod para formularios; Vitest para lógica; Playwright para pruebas de interfaz; Supabase CLI para migraciones, tipos y pruebas SQL. Fijar versiones compatibles mediante lockfile. Ninguna herramienta de pruebas reemplaza validaciones de PESV.

### Restricciones de producto confirmadas

- Es una **aplicación web**, accesible desde Android, iPhone, tablet y computadora, con prioridad de uso táctil por conductores.
- La primera demostración requiere **conexión a internet**. No prometemos trabajo offline, GPS ni geolocalización física.
- La finalidad es registrar turnos, inspecciones, incidencias y trazabilidad por vehículo, conductor y campo.
- La aplicación se desarrollará desde cero, sin reutilizar la versión anterior.
- Los informes oficiales y las reglas críticas de seguridad operacional requieren validación adicional.

## 2. Estilo arquitectónico y límites

**PROPUESTO:** monolito modular en un repositorio, sin frontend y backend separados. La aplicación tendrá capas internas diferenciadas:

1. **Presentación:** rutas, páginas y componentes accesibles; ninguna decisión de autorización confía únicamente en botones ocultos.
2. **Aplicación / casos de uso:** iniciar turno, confirmar recepción, reportar incidencia, aprobar sustitución, finalizar turno, regularizar y trasladar.
3. **Dominio / reglas:** validaciones de estados, permisos, evidencia y transiciones independientes de los componentes visuales.
4. **Persistencia / integraciones:** clientes Supabase, funciones SQL transaccionales, Storage y proveedores de despliegue.

Camino típico: **UI → acción o API del servidor → comprobación de identidad y permiso → caso de uso → PostgreSQL/RLS + Storage → respuesta confirmada**. Las operaciones de lectura y las cargas controladas de evidencias pueden utilizar el cliente de Supabase bajo las políticas del usuario, siempre que las reglas y permisos sean verificables. Las operaciones administrativas privilegiadas son exclusivamente de servidor.

## 3. Estructura propuesta del repositorio

```text
app/
  (auth)/login/                # Login por alias y cambio de contraseña
  (driver)/                   # Dashboard, apertura, mi turno e historial
  (fleet-admin)/              # Gestión operativa e incidencias
  (management)/               # Estadísticas e informes de solo lectura
  (it)/                       # Funciones técnicas privilegiadas
  api/                        # Endpoints necesarios, no duplicar Server Actions
components/
  ui/                         # Componentes base de shadcn/ui
  layout/                      # Navegación adaptable según rol
  forms/                       # Controles compartidos, firma, evidencia
  charts/                      # Gráficos reutilizables
features/
  auth/                        # Alias, cuenta, roles y cambio obligatorio
  fields/                      # Campos y asignaciones
  vehicles/                    # Vehículos, documentos, restricciones
  shifts/                      # Apertura, usos, cambios y cierre
  inspections/                 # Checklists versionados
  incidents/                   # Reportes y seguimiento
  analytics/                   # Consultas y definición de indicadores
lib/
  supabase/                    # Clientes SSR, navegador y servidor privilegiado
  authz/                       # Verificación común de permisos
  validation/                  # Esquemas Zod
  utils/
supabase/
  migrations/                  # SQL versionado, políticas y funciones
  seed.sql                     # Solo datos ficticios en desarrollo
  tests/                       # Pruebas SQL y políticas
tests/
  unit/
  e2e/
docs/
  architecture.md              # Esta arquitectura una vez aprobada
  requirements.md              # Requisitos oficiales versionados
  decisions/                    # Decisiones técnicas relevantes (ADR)
```

Esta estructura es orientativa; la inicialización deberá evitar archivos decorativos sin funcionalidad. No crear un paquete por cada tabla ni un microservicio para cada módulo.

## 4. Autenticación y administración de cuentas

### Alias de inicio de sesión

**CONFIRMADO:** identificador visible `nombre.apellido`. Si está ocupado, añadir la inicial del **segundo apellido**, p. ej. `manuel.amado.g`. Los alias deben compararse de manera normalizada sin distinguir mayúsculas y acentos. **PENDIENTE:** qué hacer ante coincidencias adicionales y casos de segundo apellido ausente o compuesto. Hasta aprobar la regla final, exigir validación de alias único sin asignar sufijos arbitrarios automáticamente.

**Diseño técnico propuesto:** Supabase Auth administra la cuenta por su identificador interno y el correo técnico registrado; la tabla de perfiles conserva el alias único. Al iniciar sesión, el servidor recibe alias y contraseña, busca internamente el correo asociado sin revelarlo y ejecuta la autenticación de Supabase. No almacenar ni consultar contraseñas en tablas propias. Evitar endpoints de búsqueda pública de alias, responder errores genéricos y establecer límites de intentos / protección contra enumeración. La estrategia concreta para verificar correos corporativos antes del uso real sigue pendiente.

### Provisionamiento y recuperación

- **CONFIRMADO:** administrador de vehículos crea solo usuarios conductores. Superadministrador crea administradores de vehículos, Gerencia y superadministradores.
- **CONFIRMADO:** el administrador asigna una contraseña inicial y obliga a cambiarla en primer ingreso; la recuperación es por contacto externo con administrador autorizado, no por autoservicio.
- **PROPUESTO:** el servidor crea cuentas mediante Supabase Auth Admin; nunca expone clave privilegiada al navegador; generar contraseña aleatoria segura como opción; el nuevo acceso queda restringido a cambio de contraseña hasta completar la operación.
- El indicador `must_change_password` requiere **control verificable en servidor y base de datos**, no solo una redirección visual. Si el usuario tiene un token válido y consulta Supabase directamente, no debe poder saltar el requisito.
- **PROPUESTO:** administrador de vehículos solo restablece contraseñas de conductores; superadministrador restablece las de cuentas privilegiadas, con verificación de identidad y auditoría.
- El login y cambio de contraseña dispondrán de botón «ojo» para mostrar/ocultar, oculto por defecto. No registrar contraseñas en logs, analytics ni trazas de error.

Para la sesión SSR, configurar el cliente de Supabase que usa cookies en Next.js y validar identidad en servidor antes de operaciones sensibles. No confiar en datos del perfil controlables desde el navegador para asignar roles.

## 5. Modelo de datos lógico — propuesta inicial

| Entidad / grupo | Responsabilidad | Relaciones principales |
|---|---|---|
| `profiles` | Alias, perfil, rol, estado, campo y control de contraseña inicial | `auth.users`, `fields` |
| `fields` | Campos administrativos | Vehículos y conductores actuales |
| `vehicles` | Identificación por placa, tipo liviano/pesado, estados y ficha técnica | Campo actual, documentos |
| `field_transfers` | Historial de traslados de personas y vehículos | Origen, destino, autor, fecha |
| `shifts` | Turnos, estado y conductor | Perfil y campo histórico |
| `vehicle_usages` | Cada utilización de un vehículo dentro de un turno | Turno, vehículo, recepción/entrega |
| `driver_assessments` | Cuestionario inicial de fatiga del conductor | Turno y versión del formulario |
| `form_templates` y `form_items` | Catálogo versionado para inspecciones livianos/pesados | Versión, categoría e ítem |
| `inspections` y `inspection_answers` | Inspección de recepción/entrega y respuestas | Utilización, plantilla/versiones |
| `evidences` | Metadatos y referencia privada a fotografías/firma | Inspección, respuesta o incidencia |
| `incidents` y `incident_actions` | Novedades, estados y seguimiento | Vehículo, turno, responsable |
| `vehicle_change_authorizations` | Sustituto asignado y autorización | Turno, uso anterior, nuevo vehículo |
| `vehicle_restrictions` | Bloqueo preventivo, motivo, levantamiento | Vehículo y acciones auditadas |
| `vehicle_documents` | Documentación y vigencias aplicables | Vehículo |
| `audit_events` | Registro inmutable lógico de actuaciones sensibles | Autor, entidad, acción, fecha |

**No son tablas ya creadas ni un esquema final.** Definir cardinalidades, índices, claves y políticas antes de ejecutar migraciones. La ficha de propiedad del vehículo sigue pendiente. Las respuestas potencialmente sensibles del conductor requieren controles específicos de acceso y retención.

### Integridad y concurrencia

- Un conductor no podrá tener más de un turno operativo pendiente de cierre / activo a la vez. La apertura iniciada debe considerar su propia política de borrador y bloqueo.
- Un vehículo no podrá tener dos utilizaciones vigentes simultáneas. **No basta con revisar disponibilidad en el navegador**: se necesitan transacciones y restricciones únicas / bloqueos del lado de PostgreSQL.
- Apertura y confirmación, recepción, entrega, cambio y regularización deben validar estados de origen y destino. Aplicar una operación de forma idempotente cuando se reintente tras pérdida de conectividad.
- Mantener instante real de cada actuación en el servidor y su autor. Historiales pasados mantienen el campo y placa/ficha que correspondían a ese momento; los datos actuales pueden cambiar sin reescribirlos.
- Los valores de utilización (`En uso`/`Fuera de uso`) se derivan de los registros de uso; no habilitar un toggle manual de disponibilidad.
- No actualizar respuestas de inspecciones confirmadas sin procedimiento de corrección auditado.
- **Regularización excepcional:** cerrar administrativamente un turno **no** certifica que un vehículo fue entregado; si la entrega física no está comprobada, mantener una retención / pendiente de liberación y requerir acción separada auditada.

### Formularios y reglas

- Autoevaluación del conductor: se responde en la apertura; condiciones de bloqueo o alerta pendientes de aprobación PESV.
- Inspección de vehículo: misma base versionada para recepción y entrega, ajustada a tipo liviano/pesado.
- Ítem **Regular o Malo**: observación **y** al menos una fotografía confirmadas antes de finalizar esa inspección.
- Incidencia durante turno activo: descripción **y** al menos una fotografía confirmadas antes de reportarla formalmente.
- Firma dibujada: constancia de apertura asociada a identidad autenticada y respuestas; **no** identificación biométrica ni firma electrónica certificada.
- Restricción automática crítica: **no activar reglas inventadas**; mantener configuración/catálogo como pendiente y permitir demostración con condiciones sintéticas claramente etiquetadas. Reporte, entrega y cierre siempre documentables.

## 6. Seguridad y RLS (requisito de implementación)

1. **Roles:** `driver`, `fleet_admin`, `management`, `it_superadmin` como códigos internos propuestos. Roles asignados únicamente mediante operación privilegiada verificada; no se aceptan valores suministrados libremente por el usuario.
2. **RLS y grants mínimos:** definir políticas explícitas por entidad, revocar permisos sobrantes y comprobar consultas directas. `anon` no consulta datos internos. `authenticated` solo opera sobre filas y acciones expresamente autorizadas.
3. **Conductor:** consultar sus turnos, sus incidencias y los vehículos de su campo autorizado; generar únicamente sus registros operativos válidos; no modificar roles, campos ni estados administrativos.
4. **Administrador de vehículos:** todos los campos y vehículos; gestionar conductores e incidencias; autorizar sustituciones y regularizar turnos; sin eliminación irreversible ni creación de roles privilegiados.
5. **Gerencia:** ver agregados y detalles operativos permitidos y exportar informes; sin escribir sobre datos de operación.
6. **IT:** gestión técnica privilegiada y eliminaciones controladas; evitar consulta innecesaria de salud y otros datos sensibles, incluso con privilegios técnicos.
7. **Storage:** buckets privados, rutas por entidad y operación, límites de tipos/peso, verificación de autorización y acceso a objetos por políticas; enlaces firmados breves cuando estén justificados.
8. **Secretos:** clave administrativa de Supabase solamente en runtime de servidor, nunca `NEXT_PUBLIC_` ni repositorio. El cliente público usa clave publicable y depende de RLS.
9. **Auditoría:** registrar altas de cuentas, cambios de rol, reseteos administrativos, transferencias, autorizaciones, regularizaciones, cambios de aptitud, levantamientos de bloqueo y correcciones de odómetro.
10. **Prevención:** protección de formularios ante CSRF y peticiones no autorizadas, límites de intentos de acceso, validación de archivos, control de sesión, mensajes genéricos y errores sin exponer detalles.

El acceso de Gerencia a «todo lo operativo» no incluye automáticamente respuestas médicas, contraseñas ni secretos. Para vistas agregadas y consultas de informes, aplicar los mismos límites RLS; evitar vistas que omitan políticas por defecto.

## 7. Pantallas y navegación (propuesta)

- **Público:** Inicio de sesión, cambio de contraseña temporal (obligatorio).
- **Conductor:** Inicio contextual, Apertura guiada (vehículo → estado del conductor → inspección → firma), Mi turno, Registrar incidencia, Cambio autorizado, Cierre, Historial, Perfil.
- **Administrador flota:** Dashboard, Campos, Vehículos, Conductores, Turnos, Incidencias, Traslados, Restricciones y reportes/consultas iniciales.
- **Gerencia:** Dashboard y consultas/informes con filtros; lectura de campos, vehículos, turnos e incidencias, sin botones de edición.
- **Superadministrador:** Vista global y funciones de cuentas privilegiadas, configuración y auditoría, con protección adicional en operaciones sensibles.

**Mobile-first:** mostrar progreso de formularios, CTA contextual, botones táctiles grandes, mensajes explícitos de guardado/error, manejo de cámara y galería. Para administrador y Gerencia, dashboards adaptables con tablas filtrables y gráficos que se puedan abrir hasta sus registros subyacentes. No confundir «actualizado desde servidor» con GPS.

## 8. Consultas, estadísticas y reportes

- KPI operativos iniciales propuestos: turnos activos, turnos en cierre, vehículos en uso, vehículos restringidos, incidencias pendientes, cantidad por campo.
- Gráficos: barras por campo y categoría, líneas por período, dona para estados de aptitud, comparaciones mensuales con filtro de fechas y campos.
- Recharts + shadcn/ui crearán visualizaciones consistentes, no datos ficticios permanentes. Cada tarjeta/gráfico debe derivar de consultas reales a los permisos del rol.
- Definir formalmente la fórmula de cada indicador antes de programarlo (por ejemplo, «vehículo en uso» se cuenta por utilización vigente, no por un campo `status` editable).
- Exportar informes a usuarios autorizados; plantillas y métricas oficiales continúan pendientes.

## 9. Entornos, despliegue y migración

**Demostración:** Vercel para Next.js y proyecto Supabase administrado con datos ficticios. No introducir datos sensibles reales sin aprobación, política de tratamiento y pruebas de autorización. El repositorio GitHub está **público** a fecha de revisión; recomendar hacerlo privado antes de guardar material interno detallado.

**Variables de entorno (solo nombres ilustrativos):**

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

No guardar los valores reales en Git; proporcionar `.env.example` sin datos reales. Compatibilidad de nombres de variables con el proyecto Supabase creado debe comprobarse al configurar el despliegue.

**Migración futura:** conservar migraciones SQL, seed ficticio separado, cliente de Supabase encapsulado, configuración externa, documentación de despliegue Next.js en servidor Node/Docker con proxy inverso y procedimientos de migración de Auth, PostgreSQL y Storage. Supabase autohospedado se considera una opción técnica, **no una promesa de migración transparente**. Infraestructura de empresa, TLS, copias, monitoreo, respaldos, SMTP y políticas de acceso externo requerirán un proyecto específico.

## 10. Verificación y criterio de terminado

| Área | Prueba mínima obligatoria |
|---|---|
| Login | `nombre.apellido` e inicial del segundo apellido; ocultar/mostrar clave; credenciales erróneas no enumeran cuentas |
| Credenciales | creación por rol, cambio inicial obligatorio y reseteos administrativos dentro del alcance del rol |
| RLS | conductor no lee ni modifica registros ajenos; Gerencia no edita; administrador no crea superadministradores |
| Concurrencia | dos conductores no pueden reservar/recibir el mismo vehículo ni crear duplicados por reintentos |
| Turnos | apertura confirmada solo con cuestionario, recepción, evidencias y firma; cierre normal y tardío |
| Cambio de vehículo | autorización administrativa; entrega A y recepción B en un mismo turno, sin pérdida de historial |
| Regularización | motivo y responsable; los faltantes no se fabrican y no se libera automáticamente un vehículo sin entrega acreditada |
| Incidencias | descripción + foto obligatorias, seguimiento independiente del cierre del turno |
| Inspecciones | toda respuesta Regular/Malo exige observación + foto; evidencias privadas accesibles por permisos |
| Interfaz | revisión Android, iPhone y escritorio; navegación, firma y formularios usables; gráficos con estados vacío/carga/error |
| Calidad | TypeScript, lint, tests de lógica, pruebas de DB/RLS, E2E de recorridos principales y build reproducible |
| Migración | documentar variables, dependencias y migraciones; demostrar que los comandos de arranque no dependen del alojamiento Vercel |

Cada prueba deberá informar **ejecutada y aprobada / ejecutada y fallida / no ejecutada**. No declarar funcionalidades implementadas únicamente por existir rutas o datos simulados.

## 11. Pendientes y puntos de control

### Imprescindibles antes de uso operativo real

1. Validación PESV de criterios de fatiga, criticidad de vehículos y procedimientos de restricción/levantamiento.
2. Responsables y evidencia mínima para regularizaciones y liberaciones sin entrega confirmada.
3. Política de tratamiento y retención para datos personales, fotografías y respuestas sensibles.
4. Verificación documental aplicable a cada vehículo y alcance de la empresa; protocolo de identificación/restablecimiento.
5. Despliegue seguro, identidad de correo, políticas de acceso y permisos y resultados de pruebas de aceptación.

### Definibles durante la preparación de la demostración

6. Regla de colisiones adicionales de alias (misma inicial del segundo apellido), nombres compuestos y datos incompletos.
7. Campos exactos de vehículos y campos y regla de traslados con turnos abiertos.
8. Catálogo definitivo de preguntas por vehículo y versión vigente de formatos PESV.
9. Propiedad de la flota y formatos oficiales de reportes.
10. Confirmar UX de apertura incompleta y vencimiento de reserva temporal de un vehículo en apertura.

## 12. Referencias técnicas oficiales

- Next.js, self-hosting: https://nextjs.org/docs/app/guides/self-hosting
- Supabase, server-side auth: https://supabase.com/docs/guides/auth/server-side
- Supabase, administración de usuarios: https://supabase.com/docs/reference/javascript/auth-admin-createuser
- Supabase, seguridad por filas: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase, almacenamiento privado: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase CLI y migraciones: https://supabase.com/docs/guides/local-development/cli-workflows
- Supabase autohospedado: https://supabase.com/docs/guides/self-hosting/docker
- shadcn/ui, gráficos Recharts: https://ui.shadcn.com/docs/components/radix/chart

---

**Control:** borrador documental para revisión. No se han desplegado servicios.
