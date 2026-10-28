# Verificación de la entrega

Fecha: 2026-10-12. Rama de trabajo: `develop`, base `f934db1`. El repositorio remoto fue comprobado; se recuperó `develop` antes de modificar código. La rama inicial `work` pertenecía al entorno: no se desarrolló ni publicó en ella. No se tocó `main`, no se hizo push ni despliegue.

## Commits y estado de Git

Implementación: `e89f47a` — `feat: implement secure fleet management demo` (96 archivos). Un commit documental posterior registra esta referencia y el cierre de verificación. Ambos pertenecen exclusivamente a `develop`. No se publicaron al remoto. Los requisitos aprobados y la arquitectura permanecen idénticos a la base `f934db1`.

## Fuentes efectivamente leídas

Se leyó íntegramente el prompt maestro v0.2 adjunto y `AGENTS.md`, `README.md`, `docs/requirements.md` v0.3 y `docs/architecture.md` v0.1 desde `develop`. Se abrieron los cinco formatos con openpyxl, python-docx y pypdf; además se revisó visualmente la página 2 del PDF. El mockup adjunto orientó paleta azul, tarjetas, navegación, progreso y disposición móvil; no se copiaron sus imágenes ni activos.

| Fuente                                                                | Lectura                     | Resultado                                                                   |
| --------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| GA FO 09 Check List Control de Fatiga PESV.xlsx                       | Hoja Formato, completa      | Seis preguntas Sí/No, versión 00                                            |
| GA FO 13 Control Kilometraje y Combustible PESV.xlsx                  | Hoja1, completa             | Km inicial/final y referencias de combustible, versión 01                   |
| GA FO 17 Inspección periódica de vehículos PESV.xlsx                  | Hoja1, completa             | Catálogo periódico, versión 00 y revisión enero 2009                        |
| GA FO 20 Chequeo Vehicular PESV.docx                                  | Tablas y párrafos completos | 41 controles y metadatos; conflicto versión 03/02                           |
| Checklist_Peritaje_Inicio_Operacion_Livianos_Pesados_Petrocasinos.pdf | Tres páginas                | 20 controles livianos, 15 controles técnicos pesados y resultados separados |

`docs/forms-specification.md` contiene 245 referencias saneadas y correspondencia a seis preguntas y 56 controles consolidados. Los originales/extracciones permanecieron fuera del repositorio. Los datos diligenciados no se copiaron a documentación, pruebas ni seeds. Las versiones y desacuerdos siguen visibles.

## Alcance por módulo

| Módulo                  | Estado de entrega               | Evidencia y límites                                                                                                                                                                        |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Catálogo y validación   | Funcional y probado para demo   | Motor consulta versión persistida, valida totalidad por tipo y Regular/Malo con observación + foto. Catálogo oficial pendiente.                                                            |
| Autenticación y roles   | Funcional y probado localmente  | Login por alias, ojo, cambio obligatorio incluso ante API directa, alta administrativa limitada, reset con bloqueo y auditoría. Protocolo empresarial de identidad/comunicación pendiente. |
| Campos y flota          | Funcional y probado localmente  | Altas, estado, traslados controlados, documentos y restricciones. La política de traslados con turno vigente se conserva pendiente.                                                        |
| Turnos e inspecciones   | Funcional y probado localmente  | Apertura incompleta no activa, firma, recepción/entrega separadas, cierre, sustitución en el mismo turno, idempotencia e índices contra carreras.                                          |
| Incidencias y evidencia | Funcional y probado localmente  | Fotos reales en Storage privado, descripción obligatoria, borrador y seguimiento independiente del cierre.                                                                                 |
| Regularización          | Funcional y probado localmente  | Guarda faltantes y retiene segmento sin entrega. No implementa la liberación pendiente de aprobación.                                                                                      |
| Odómetros               | Parcial                         | Lecturas y alertas; actuaciones de corrección sin sobrescritura. Las correcciones aún no se aplican a los KPI/CSV.                                                                         |
| Dashboards e informes   | Funcional y probado localmente  | Recharts, filtros, gráfico por campo, utilización, tendencia mensual y CSV. Informes oficiales/costos/combustible pendientes.                                                              |
| Administración IT       | Parcial                         | Alta de cuentas privilegiadas, restablecimiento, auditoría. Sin cambio de roles existentes, eliminación reglada ni gestión completa de políticas de retención.                             |
| Limpieza de evidencias  | Parcial                         | Script para huérfanos con metadatos y turno finalizado. Reconciliación de archivos sin metadatos pendiente.                                                                                |
| Despliegue productivo   | No implementado / no autorizado | No hay proyecto remoto, SMTP ni despliegue. Capacidad standalone de Next.js compilada.                                                                                                     |
| PESV y operación real   | Pendiente de validación         | No hay criterios críticos/médicos inventados ni habilitación oficial.                                                                                                                      |

## Entorno y pruebas

Node 24, Next.js 16.4, TypeScript, Vitest y Playwright/Chromium. Integración real mediante PostgreSQL 17 + GoTrue 2.186 + PostgREST 14.3 + Storage 1.35 locales. No se usaron mocks para los recorridos persistentes. El gateway liviano es infraestructura de prueba; no equivale a validar un despliegue administrado completo de Supabase.

La descarga de PostgreSQL de Supabase CLI falló por falta de espacio durante extracción con Docker VFS. Se sustituyó por la pila local liviana documentada en README. Los scripts y ocho migraciones se verifican contra esa base. Los fallos SQL de ambigüedad en restricciones/borradores, el control de origen del upload y la actualización de alias tras un alta consecutiva detectados por pruebas fueron corregidos.

| Comando o comprobación                                  | Resultado | Evidencia y alcance                                                                                                                                                              |
| ------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                     | PASS      | TypeScript sin errores.                                                                                                                                                          |
| `npm run lint`                                          | PASS      | ESLint sin errores.                                                                                                                                                              |
| `npm test`                                              | PASS      | 18 pruebas: alias, obligatoriedad de evidencias, catálogo, indicadores y CSV.                                                                                                    |
| `npm run build`                                         | PASS      | Compilación de producción; rutas privadas dinámicas y salida standalone.                                                                                                         |
| `node scripts/local-services.mjs`                       | PASS      | Servicios reales locales inicializados desde contenedores nuevos.                                                                                                                |
| `node scripts/local-migrate.mjs`                        | PASS      | Ocho migraciones y seed SQL aplicados desde base vacía.                                                                                                                          |
| `npm run seed:demo`                                     | PASS      | Seis cuentas ficticias con cambio obligatorio.                                                                                                                                   |
| `npm run test:integration`                              | PASS      | 23 casos; Auth, PostgreSQL/RLS y Storage reales.                                                                                                                                 |
| `npm run test:e2e`                                      | PASS      | 12 casos: cuatro en escritorio, cuatro en Pixel 7 y cuatro en iPhone 13, todos Chromium; repetidos sobre el servidor standalone compilado, sin omitidos ni fallos intermitentes. |
| `npm audit --omit=dev --json`                           | PASS      | Cero vulnerabilidades reportadas en dependencias de producción a la fecha. No sustituye una auditoría de seguridad.                                                              |
| Supabase CLI: `supabase start`                          | FAIL      | Extracción de la imagen PostgreSQL agotó el disco con Docker VFS. Alternativa liviana ejecutada y verificada.                                                                    |
| `npm run bootstrap`, primera cuenta IT                  | NOT RUN   | Script disponible; el entorno de integración se preparó con cuentas ficticias del seed. La creación inicial independiente debe validarse al preparar un entorno nuevo.           |
| Supabase administrado, SMTP, infraestructura productiva | NOT RUN   | Sin proyecto/credenciales empresariales; despliegue no autorizado.                                                                                                               |
| Safari/WebKit y dispositivos físicos                    | NOT RUN   | Solo Chromium y emulación de tamaños disponibles en esta verificación.                                                                                                           |

También se ejecutó `npm start` con la salida standalone y se reutilizó ese servidor para la suite completa de navegador: 12/12 PASS. El arranque prepara los activos estáticos y permite configurar la interfaz con `APP_HOST`. Esta comprobación fue local y con datos ficticios; no constituye un despliegue empresarial.

Tras corregir la sugerencia de alias se repitieron los tres casos administrativos, con resultado PASS. La repetición de los seis recorridos persistentes tras ajustar la espera de carga comprueba el dashboard completo antes de capturarlo y verifica la consulta de vehículos antes de afirmar ausencia de acciones de edición. Las capturas se conservan en `.local/screenshots/`; los reportes Playwright y `.local/integration-results.json` están ignorados. No se imprimieron credenciales.

Las pruebas de navegador verifican login, visibilidad de contraseña, redirecciones, cambio inicial, alta de conductor, permisos de Gerencia/exportación, recepción con foto, borrador recuperado, firma dibujada, incidencia y cierre. La variante por inicial del segundo apellido se comprueba creando dos conductores consecutivos y entrando con la segunda cuenta; las colisiones adicionales se comprueban en unitarios. Sustitución, regularización, restablecimiento y carreras se verificaron por API/SQL real, sin afirmar cobertura de sus pantallas de extremo a extremo.

## Pruebas de integración incluidas

1. **PASS** — Cambio obligatorio bloquea RPC y lecturas operativas por API directa.
2. **PASS** — RLS: anon no lee y conductor solo consulta su campo.
3. **PASS** — Gerencia no escribe por RPC ni tablas; roles no autoeditables.
4. **PASS** — Administrador crea conductor; prohibido crear rol privilegiado.
5. **PASS** — Reset limitado por rol y sin lectura de clave anterior.
6. **PASS** — Administración persistente de campos y flota.
7. **PASS** — Inicio crea borrador, reintentos idempotentes y único turno por conductor.
8. **PASS** — Storage privado: carga real y asociación; acceso ajeno denegado.
9. **PASS** — Apertura incompleta, firma ausente y campo ajeno rechazados.
10. **PASS** — Regular/Malo exige observación y fotografía simultáneas en SQL.
11. **PASS** — Concurrencia: dos conductores reciben el mismo vehículo, solo uno confirma.
12. **PASS** — Disponibilidad revela ocupación del campo sin exponer turnos ajenos.
13. **PASS** — Fatiga solo accesible por autor; inspecciones confirmadas inmutables.
14. **PASS** — No se trasladan unidades con uso vigente; restricciones auditadas.
15. **PASS** — Incidencia requiere descripción y foto; borrador reanudable no es reporte.
16. **PASS** — Cambio unilateral rechazado; A→B autorizado conserva el turno y dos segmentos.
17. **PASS** — Cierre retomado con incidencia pendiente; suma de kilómetros por segmento.
18. **PASS** — Seguimiento administrativo independiente y Gerencia consulta sin editar.
19. **PASS** — Regularización conserva faltantes y retiene vehículo sin entrega.
20. **PASS** — Documento obligatorio vencido impide nuevas recepciones.
21. **PASS** — Campos, traslado sin uso y correcciones conservan historial.
22. **PASS** — Resolución de alias limita intentos sin publicar directorio.
23. **PASS** — Auditoría técnica existe y no incluye respuestas de fatiga.

## Lo que estas pruebas no certifican

Dispositivos físicos Android/iPhone, Safari/WebKit, cámara nativa, asistencia a firma para necesidades particulares, lectores de pantalla completos, carga/concurrencia a escala, recuperación ante desastre, SMTP/proyecto Supabase administrado, proxy/TLS empresarial, configuración de producción, ni aprobación legal/PESV. Pruebas de tamaño iPhone ejecutadas en Chromium no equivalen a Safari.

## Próxima ejecución

Ratificar catálogo y políticas operativas; configurar un proyecto Supabase de prueba y sus secretos mediante el gestor privado; ejecutar la misma matriz allí; probar Safari/dispositivos físicos; completar reconciliación de cargas huérfanas, correcciones en indicadores y procedimientos empresariales pendientes. Solo después puede evaluarse una autorización separada para uso real/despliegue.

## Inventario de archivos de esta entrega

Se modificó `README.md` y se agregaron los siguientes archivos. `AGENTS.md`, `docs/requirements.md` y `docs/architecture.md` se mantuvieron sin cambios. El historial Git identifica el contenido exacto de cada commit; los resultados de pruebas locales y las capturas se conservan fuera del seguimiento de Git.

- `.env.example`
- `.gitignore`
- `.prettierignore`
- `.prettierrc.json`
- `app/api/evidence/route.ts`
- `app/api/export/route.ts`
- `app/auditoria/page.tsx`
- `app/campos/page.tsx`
- `app/change-password/page.tsx`
- `app/conductores/page.tsx`
- `app/error.tsx`
- `app/globals.css`
- `app/incidencias/page.tsx`
- `app/layout.tsx`
- `app/loading.tsx`
- `app/login/page.tsx`
- `app/page.tsx`
- `app/perfil/page.tsx`
- `app/turno/page.tsx`
- `app/turnos/[id]/page.tsx`
- `app/turnos/page.tsx`
- `app/vehiculos/page.tsx`
- `components.json`
- `components/accounts-panel.tsx`
- `components/admin-panels.tsx`
- `components/auth-form.tsx`
- `components/command-form.tsx`
- `components/dashboard.tsx`
- `components/evidence-gallery.tsx`
- `components/evidence-input.tsx`
- `components/incidents-panel.tsx`
- `components/inspection-form.tsx`
- `components/password-input.tsx`
- `components/shell.tsx`
- `components/shift-workflow.tsx`
- `components/shifts-panel.tsx`
- `components/signature-pad.tsx`
- `components/ui/button.tsx`
- `docs/analytics.md`
- `docs/data-model.md`
- `docs/decisions/001-implementation.md`
- `docs/forms-specification.md`
- `docs/verification.md`
- `eslint.config.mjs`
- `features/analytics/metrics.ts`
- `features/auth/actions.ts`
- `features/auth/alias.ts`
- `features/auth/session.ts`
- `features/fields/validation.ts`
- `features/incidents/validation.ts`
- `features/inspections/catalog.json`
- `features/inspections/validation.ts`
- `features/shifts/actions.ts`
- `features/vehicles/eligibility.ts`
- `lib/page-data.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/browser.ts`
- `lib/supabase/queries.ts`
- `lib/supabase/server.ts`
- `lib/types.ts`
- `lib/utils.ts`
- `next-env.d.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `postcss.config.mjs`
- `proxy.ts`
- `scripts/bootstrap.mjs`
- `scripts/cleanup-evidence.mjs`
- `scripts/generate-catalog.mjs`
- `scripts/integration.mjs`
- `scripts/local-migrate.mjs`
- `scripts/local-services.mjs`
- `scripts/local/gateway.mjs`
- `scripts/local/init.sql`
- `scripts/seed-demo.mjs`
- `scripts/start.mjs`
- `supabase/.gitignore`
- `supabase/config.toml`
- `supabase/migrations/202610110001_core.sql`
- `supabase/migrations/202610110002_workflows.sql`
- `supabase/migrations/202610110003_accounts.sql`
- `supabase/migrations/202610110004_catalog.sql`
- `supabase/migrations/202610110005_drafts.sql`
- `supabase/migrations/202610110006_hardening.sql`
- `supabase/migrations/202610110007_numeric_integrity.sql`
- `supabase/migrations/202610110008_availability.sql`
- `supabase/seed.sql`
- `tests/e2e/access.spec.ts`
- `tests/e2e/admin.spec.ts`
- `tests/e2e/workflow.spec.ts`
- `tests/unit/domain.test.ts`
- `tsconfig.json`
- `vitest.config.mts`

## Ajuste posterior para Vercel

El usuario autorizó el despliegue de prueba y señaló los proyectos en Supabase/Vercel. Se preparó la carga directa al Storage privado, la migración adicional de lectura propia de cargas no asociadas y las exclusiones para CLI. Los resultados nuevos y el bloqueo de acceso a los proveedores se registran en `docs/deployment.md`; el informe anterior corresponde a los commits originales y no acredita un despliegue remoto. La aplicación sigue siendo de demostración.

## Estabilización del MVP — 2026-10-28

La estabilización se realiza en `codex/stabilize-mvp`, basada en `origin/develop`. No modifica migraciones, reglas de negocio, infraestructura remota ni datos. Actualiza dependencias vulnerables, fija el runtime, hace portable Playwright, incorpora CI y documenta el flujo de contribución.

Versiones de seguridad aplicadas: Next.js y `eslint-config-next` 16.4.3, Vitest 4.1.12 y Supabase CLI 2.122.0. `@supabase/ssr` queda fijado en 0.8.0. `package-lock.json` fue regenerado con npm 11.19.1. ESLint 9.39.5 muestra aviso de fin de soporte durante la instalación; no se fuerza ESLint 10 porque plugins transitivos de la configuración actual todavía declaran compatibilidad hasta ESLint 9. Este pendiente debe revisarse en una actualización coordinada del toolchain.

La tabla de resultados de esta estabilización se completa únicamente con comprobaciones ejecutadas en el checkout final:

| Comprobación                 | Resultado inicial de estabilización |
| ---------------------------- | ----------------------------------- |
| `npm ci`                     | PASS · 0 vulnerabilidades           |
| `npm run verify`             | PASS                                |
| `npm run audit:prod`         | PASS · 0 vulnerabilidades           |
| `npm run audit:all`          | PASS · 0 vulnerabilidades           |
| `npm run test:e2e:access`    | PASS · 6/6 en Windows               |
| Integración Supabase local   | NOT RUN · fuera de este paso        |
| Supabase/Vercel administrado | NOT RUN · sin acceso a producción   |

El E2E de acceso se ejecutó dos veces después de corregir la ruta del navegador. La segunda corrección reemplaza el `webServer` interno de Playwright por un lanzador Node que inicia y detiene explícitamente el árbol del servidor; así el comando finaliza en Windows y conserva reutilización de un servidor ya disponible. En CI se instalará Chromium administrado y se ejecutará la misma orden.
