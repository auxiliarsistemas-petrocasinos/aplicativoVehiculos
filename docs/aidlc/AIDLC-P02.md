# Plan de proyecto AIDLC — aplicativoVehiculos

_AIDLC-P02 · Basado en AIDLC-M01 v0.3 — Flujo Maestro de Desarrollo_

> **Estado: BORRADOR para revisión.** Redactado con asistencia de IA a partir del repositorio y de las decisiones confirmadas por el usuario el 2026-11-10. Lo marcado `{{pendiente: ...}}` no está decidido. Las propuestas se presentan como tales y no son decisiones aprobadas. El manual AIDLC-M01 v0.3 es la norma: si este plan lo contradice, prevalece el manual.
>
> Origen de cada sección: **[M]** lo exige el manual · **[P]** decisión del plan · **[v0.4]** práctica opcional de la propuesta v0.4, aplicable solo si se adopta en la sección 0.

---

## 0 Control documental

| Campo                    | Valor                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Código                   | AIDLC-P02 (confirmado 2026-11-10)                                                               |
| Proyecto                 | aplicativoVehiculos · Repositorio: `auxiliarsistemas-petrocasinos/aplicativoVehiculos` (GitHub) |
| Modalidad                | Adopción (confirmado 2026-11-10)                                                                |
| Base metodológica        | AIDLC-M01 v0.3                                                                                  |
| Prácticas v0.4 adoptadas | Ninguna (confirmado 2026-11-10): solo AIDLC-M01 v0.3                                            |
| Versión y fecha          | 0.1 · 2026-11-10                                                                                |
| Estado                   | Borrador                                                                                        |
| Elaboró                  | Área de Sistemas, con asistencia de IA (Claude Code)                                            |
| Revisó                   | Líder técnico: {{pendiente}} · Representante de negocio: {{pendiente}}                          |
| Aprobó                   | Líder de Sistemas: {{pendiente}} · Fecha: {{pendiente}} · Evidencia: {{pendiente}}              |

---

## 1 Iniciativa · G0 Idea, G1 Alcance [M]

Los hechos de esta sección proceden de `docs/requirements.md` (v0.3, borrador) y `docs/architecture.md` (v0.1). Ese material no tiene aprobación formal registrada; por eso G1 sigue abierto.

| Campo                 | Valor                                                                                                                                                                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Necesidad o problema  | Registrar turnos, inspecciones, incidencias y trazabilidad por vehículo, conductor y campo en unos 25 a 30 campos, para que el coordinador conozca la operación y Gerencia consulte indicadores (`docs/requirements.md` §1).                                                                        |
| Solicitante           | {{pendiente: nombre · área}}                                                                                                                                                                                                                                                                        |
| Dueño funcional       | {{pendiente: nombre · área}}                                                                                                                                                                                                                                                                        |
| Objetivo              | Aplicación web mobile-first de gestión de flota para conductores, administración de flota, Gerencia e IT (`docs/requirements.md` §1–2).                                                                                                                                                             |
| Resultado esperado    | {{pendiente: valor observable acordado con negocio}}. Hoy existe una demostración funcional con datos ficticios, no habilitada para operación real (`README.md`).                                                                                                                                   |
| Alcance               | Cuentas por alias y roles, campos, vehículos, documentos y restricciones, traslados, turnos (apertura, sustitución, cierre, regularización), autoevaluación del conductor, inspecciones con evidencia fotográfica y firma, incidencias, dashboards y exportación CSV (`docs/requirements.md` §2–8). |
| Exclusiones y límites | GPS, operación offline, módulo integral de mantenimiento o finanzas, recuperación autogestionada de contraseñas y formatos oficiales de informes (`docs/requirements.md` §1, §11). Sin datos reales hasta validar PESV, tratamiento de datos y documentación legal.                                 |
| Prioridad             | {{pendiente: Alta / Media / Baja · justificación del dueño funcional}}                                                                                                                                                                                                                              |
| Riesgo inicial        | Crítico (propuesto 2026-11-10; ver sección 3)                                                                                                                                                                                                                                                       |
| Criterios de éxito    | {{pendiente}}. Propuesta: los casos de aceptación CA-01 a CA-19 de `docs/requirements.md` §10, una vez aprobados por negocio.                                                                                                                                                                       |
| Línea base            | LBV-{{pendiente: SIGLA}}-001 · Estado: preliminar · Propuesta: el estado de `main` en `b572f01` más los requisitos v0.3, una vez recertificado (ver 2.3).                                                                                                                                           |

**Aceptación del alcance (cierre de G1):** negocio {{pendiente}} · Sistemas {{pendiente}}.

---

## 2 Estado actual del proyecto (Adopción) [P]

Diagnóstico realizado el 2026-11-10 sobre el repositorio, GitHub y los despliegues, y actualizado el 2026-11-11 con la repetición de pruebas (T-04) y el recuento de revisiones de los PR. Cada afirmación cita su evidencia.

### 2.1 Inventario

| Elemento                                    | Situación actual                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repositorio y ramas                         | GitHub, **público** (`gh repo view`). Solo existe `main`; la política documentada exige `develop`, que no existe (`docs/development.md`). `main` **sin protección de rama** (API de GitHub: _Branch not protected_).                                                                                                                                                                                                                         |
| Stack y dependencias principales            | Next.js 16.4.3 App Router + TypeScript, Tailwind + shadcn/ui, Recharts, Supabase Auth/PostgreSQL/Storage, Zod. Node 24.22.1 y npm 11.19.1 fijados (`package.json`, `.nvmrc`).                                                                                                                                                                                                                                                                |
| Ambientes (desarrollo, pruebas, producción) | Desarrollo local con Supabase local o pila liviana en Docker (`README.md`). Vercel: vista previa por PR (requiere login de Vercel) y producción en cada fusión a `main` en `aplicativovehiculos.vercel.app`, **pública y sin backend Supabase** (`docs/deployment.md`, estado del 2026-11-09). No hay ambiente de pruebas con backend remoto.                                                                                                |
| Usuarios y datos en producción              | No. Solo datos ficticios; producción no tiene backend conectado (`README.md`, `docs/deployment.md`).                                                                                                                                                                                                                                                                                                                                         |
| Documentación existente                     | Requisitos v0.3, arquitectura v0.1, ADR 001, modelo de datos, formularios, indicadores, seguridad y gobierno de datos, verificación, despliegue, validación de producto (`docs/`).                                                                                                                                                                                                                                                           |
| Pruebas automatizadas existentes            | 29 unitarias Vitest, 24 de integración y 12 E2E Playwright: PASS el 2026-11-11 sobre `main` (`508501a`), integración contra la pila local liviana y E2E contra el servidor standalone (T-04, `docs/verification.md`). Hallazgos de esa ejecución: `supabase start` con la configuración versionada no permite iniciar sesión, y el E2E contra `next dev` es intermitente (8/12). E2E de acceso sin backend en CI. Sin medición de cobertura. |
| Integración continua (CI)                   | Sí · GitHub Actions (`.github/workflows/ci.yml`): `verify` (formato, lint, tipos, unitarias, build), `audit:prod` y E2E de acceso en cada PR y push a `main`. Integración y E2E completos **no** corren en CI.                                                                                                                                                                                                                               |
| Proceso de despliegue y recuperación        | Despliegue automático de Vercel al fusionar en `main`, sin autorización explícita previa. Sin procedimiento de reversión documentado, sin respaldos ni recuperación ensayada (`docs/data-model.md`, «Conservación y pendientes»).                                                                                                                                                                                                            |
| Deuda técnica y riesgos conocidos           | Reconciliación de objetos de Storage sin metadatos, correcciones de odómetro no aplicadas a indicadores, ESLint 9 en fin de soporte, sin Safari ni dispositivos físicos probados (`docs/verification.md`). Pendientes PESV, jurídicos y de datos personales (`docs/decisions/001-implementation.md`).                                                                                                                                        |

### 2.2 Brecha frente al mínimo común

| Control del manual                                    | Estado actual                                                                                    | Brecha                                                                  | Acción propuesta                                                                                              | Responsable   | Fecha         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------- | ------------- |
| Revisión por otro profesional antes de integrar       | Los PR #1 a #7 se fusionaron con 0 revisiones (`gh pr list`, 2026-11-11); `main` sin protección. | Autoaprobación; incumple §4 y Done (§5).                                | Activar protección de `main` con al menos una aprobación distinta del autor y CI obligatorio.                 | {{pendiente}} | {{pendiente}} |
| Compilación y pruebas automáticas en cada cambio (CI) | CI con calidad, unitarias, build, auditoría y E2E de acceso.                                     | Integración y E2E completos fuera de CI; dependen de ejecución manual.  | Evaluar Supabase local en CI o registrar la evidencia manual en cada tarjeta Medio o superior.                | {{pendiente}} | {{pendiente}} |
| Criterios de aceptación por historia                  | Casos CA-01 a CA-19 a nivel de producto (`docs/requirements.md` §10); sin tarjetas.              | No hay historias ni tarjetas con criterios propios.                     | Crear tarjetas con la plantilla del Anexo A.                                                                  | {{pendiente}} | {{pendiente}} |
| Clasificación de riesgo por tarjeta                   | No existe.                                                                                       | Sin clasificación.                                                      | Clasificar cada tarjeta con la sección 3.                                                                     | {{pendiente}} | {{pendiente}} |
| Trazabilidad necesidad → despliegue                   | Commits y PR sin tarjeta; 0 issues en GitHub; despliegues visibles en la API de GitHub.          | Falta el eslabón tarjeta y el vínculo con requisitos.                   | Tablero e issues; convenciones de la sección 10.                                                              | {{pendiente}} | {{pendiente}} |
| Recuperación prevista antes de liberar                | No documentada; cada fusión despliega en producción.                                             | Sin reversión, respaldo ni autorización P previa.                       | Definir reversión en Vercel y respaldo de Supabase; separar fusión y liberación o exigir P antes de fusionar. | {{pendiente}} | {{pendiente}} |
| Observabilidad y soporte preparados                   | `lib/observability.ts` existe; sin monitoreo ni alertas definidos.                               | Sin verificaciones de salud ni responsable de soporte.                  | Definir verificaciones de salud y responsable de Operación (sección 7).                                       | {{pendiente}} | {{pendiente}} |
| Uso de IA conforme al gobierno de IA                  | Código y documentos generados con Codex y Claude Code (historial de Git y de PR).                | Herramientas sin autorización registrada; sin registros de revisión IA. | Registrar autorización de Sistemas y usar el Anexo C en R, Q y P.                                             | {{pendiente}} | {{pendiente}} |

### 2.3 Regla de transición [P]

- **Fecha de adopción:** 2026-11-10
- **Punto de entrada en G0–G8:** G0–G1, para cerrar el alcance y establecer la línea base.
- **Regla adoptada (confirmada 2026-11-10): recertificar la línea base.** Lo ya construido en `main` se revisa contra el control Q (Done, §5) y los controles del nivel Crítico (§4) antes de cualquier nueva liberación. Los cambios nuevos cumplen el mínimo común desde la fecha de adopción. Las brechas de 2.2 y los hallazgos de la recertificación entran al backlog con dueño y prioridad.
- **Fusión y liberación:** cada fusión en `main` despliega en producción. Decisión del 2026-11-10 (D-03): se mantiene el despliegue automático y **ninguna fusión en `main` ocurre sin el control P registrado**; fusionar equivale a liberar.

---

## 3 Clasificación de riesgo [M]

| Factor                                       | Descripción en este proyecto                                                                                                                                                                                                                      | Nivel propuesto |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Datos (personales, sensibles, biometría)     | Identidad, correo y teléfono de conductores, firmas dibujadas y fotografías. Autoevaluación con preguntas sobre medicamentos y enfermedad, potencialmente datos de salud. Sin biometría: la firma no es biométrica (`docs/requirements.md` §5.1). | Crítico         |
| Dinero (valores económicos, reglas de cobro) | No hay reglas económicas; costos y combustible excluidos.                                                                                                                                                                                         | No aplica       |
| Permisos y autorizaciones                    | Cuatro roles, RLS, alta y restablecimiento de cuentas, autorización de sustituciones y regularizaciones.                                                                                                                                          | Alto            |
| Continuidad del servicio                     | Sin operación real; una caída no afecta la operación actual.                                                                                                                                                                                      | Bajo            |
| Integraciones                                | Supabase (Auth, PostgreSQL, Storage) y Vercel.                                                                                                                                                                                                    | Medio           |
| Dificultad de recuperación                   | Registros inmutables por diseño; sin respaldo ni recuperación ensayada.                                                                                                                                                                           | Medio           |
| **Nivel del proyecto**                       | El mayor de los factores.                                                                                                                                                                                                                         | **Crítico**     |

Propuso: clasificación confirmada por el usuario el 2026-11-10; {{pendiente: líder técnico que la asume}} · Confirmó: {{pendiente: dueño funcional}} · Seguridad: {{pendiente}} · Jurídica: {{pendiente: concepto sobre las respuestas de fatiga}}

Si Jurídica concluye que las respuestas de fatiga no son datos sensibles, el nivel debe revisarse; la propuesta alternativa sería Alto. Las tarjetas se clasifican por sí mismas y pueden tener un nivel menor.

**Controles adicionales del nivel Crítico (§4):** revisión de Seguridad y privacidad, decisiones jurídicas aplicables y autorización expresa del líder de Sistemas para liberar.

---

## 4 Roles y responsables [M]

Propuesta habitual del Área de Sistemas, **pendiente de confirmación**. Ningún nombre está asignado.

| Rol                    | Titular                                                        | Suplente      | Restricción                                                                                         |
| ---------------------- | -------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| Dueño funcional        | {{pendiente}}                                                  | {{pendiente}} | Su aceptación funcional no sustituye la revisión técnica, ni al revés.                              |
| Líder de Sistemas      | {{pendiente; propuesta: Coordinador de Sistemas y Desarrollo}} | {{pendiente}} | En nivel Crítico la autorización para liberar es expresa y no se delega.                            |
| Líder técnico          | {{pendiente; propuesta: un Auxiliar de Sistemas}}              | {{pendiente}} | Si escribe código, lo revisa otra persona.                                                          |
| Equipo de desarrollo   | {{pendiente}}                                                  | {{pendiente}} | Un revisor distinto del autor valida cada cambio antes de integrarlo.                               |
| Revisor de código      | {{pendiente; propuesta: el otro Auxiliar o el Coordinador}}    | {{pendiente}} | Nunca es el autor del cambio.                                                                       |
| Responsable de pruebas | {{pendiente}}                                                  | {{pendiente}} | En Alto y Crítico, distinto del autor.                                                              |
| Operación y soporte    | {{pendiente}}                                                  | {{pendiente}} | Conserva la autorización independiente.                                                             |
| Seguridad              | {{pendiente; propuesta: Área de Sistemas}}                     | {{pendiente}} | Obligatoria en nivel Crítico.                                                                       |
| Privacidad y Jurídica  | {{pendiente; propuesta: área jurídica de Petrocasinos}}        | {{pendiente}} | Las decisiones jurídicas pendientes bloquean el tratamiento correspondiente.                        |
| Responsable PESV       | {{pendiente}}                                                  | {{pendiente}} | Especialista de proceso: valida catálogo, criterios críticos y fatiga (`docs/requirements.md` §11). |
| Finanzas               | No aplica: el proyecto no tiene reglas económicas.             | —             | —                                                                                                   |

**Combinaciones no permitidas:** autor y revisor de un mismo cambio; autor y validador en tarjetas Alto o Crítico. Un asistente de IA no puede actuar como revisor ni aprobador.

**Delegaciones escritas del líder de Sistemas:** {{pendiente}}. En el nivel Crítico la autorización de liberación es expresa.

---

## 5 Forma de trabajo [M] [P]

| Aspecto                                       | Definición del proyecto                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Herramienta de tablero                        | GitHub Projects con issues (confirmado 2026-11-10)                                                            |
| Estados (manual)                              | Pendiente → Listo → En curso → En validación → Terminado                                                      |
| Marca Bloqueado                               | Con causa, dueño y próxima acción. Un bloqueo alto o crítico se escala el mismo día.                          |
| Límite de trabajo activo (incluye validación) | {{pendiente}}                                                                                                 |
| Duración del objetivo                         | {{pendiente; valor de partida del manual: 2 semanas}}                                                         |
| Coordinación diaria                           | {{pendiente: reunión de máx. 15 min o actualización asíncrona}}                                               |
| Revisión del tablero e indicadores            | Semanal · {{pendiente: día}}                                                                                  |
| Demostración y retrospectiva                  | Al cierre de cada objetivo · una mejora con responsable                                                       |
| Repositorio y estrategia de ramas             | Ramas cortas con pull request. {{pendiente: recrear `develop` o trabajar sobre `main` (D-02)}}                |
| Integración continua                          | GitHub Actions · `verify`, `audit:prod` y E2E de acceso en cada PR (`.github/workflows/ci.yml`)               |
| Ambientes                                     | Local · vista previa de Vercel por PR · producción de Vercel. {{pendiente: ambiente de pruebas con Supabase}} |
| Seguimiento de liberaciones                   | Preparada → Autorizada → Desplegada → Estable                                                                 |

---

## 6 Ready y Done del proyecto [M]

### 6.1 Ready: listo para construir (control R)

- [ ] Necesidad y origen identificados; dueño, prioridad y alcance del incremento claros.
- [ ] Criterios de aceptación observables, con reglas y escenarios relevantes de error acordados.
- [ ] Riesgo e impacto en datos, permisos, seguridad y operación evaluados.
- [ ] Dependencias y decisiones que condicionan la solución resueltas; la investigación pendiente delimitada como tarea de exploración.
- [ ] Diseño suficiente, enfoque de pruebas y datos de prueba previstos; estrategia de migración y recuperación si aplica.
- [ ] Tamaño compatible con un incremento corto y capacidad del equipo confirmada.

Ajustes propuestos: toda regla PESV, de fatiga o de tratamiento de datos debe tener la decisión del responsable competente enlazada; si no la tiene, la tarjeta no está lista (`AGENTS.md`, `docs/requirements.md` §11).

### 6.2 Done: terminado (control Q)

- [ ] Código integrado con revisión de otro profesional, sin autoaprobación; compilación y pruebas automatizadas aprobadas sobre la versión resultante.
- [ ] Criterios de aceptación comprobados con resultados enlazados; integración y regresión del flujo afectado según el riesgo.
- [ ] Análisis de seguridad pertinentes ejecutados; hallazgos resueltos o con aceptación válida de riesgo; sin bloqueos obligatorios.
- [ ] Documentación, configuración, auditoría y observabilidad actualizadas; migraciones verificadas cuando existan.
- [ ] Criterios funcionales validados con el mecanismo acordado con negocio; evidencias, revisiones IA aplicables y trazabilidad completas.

Ajustes propuestos: mientras integración y E2E completos no corran en CI, las tarjetas de nivel Medio o superior enlazan la ejecución manual de `npm run test:integration` y `npm run test:e2e` sobre la versión resultante. Una prueba omitida no cuenta como aprobada (`CONTRIBUTING.md`).

**Mecanismo de aceptación funcional acordado:** {{pendiente: demostración / validación delegada}}

---

## 7 Liberación y operación · G7, G8 [M]

| Parámetro                           | Valor en este proyecto                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Ventana de observación tras liberar | {{pendiente: definir; C-05 no adoptada}}                                                             |
| Recuperación antes de liberar       | {{pendiente: definir; el nivel Crítico exige recuperación prevista y autorización expresa (§4, §5)}} |
| Aviso a usuarios afectados          | {{pendiente}}                                                                                        |
| Ventana de atribución               | {{pendiente}}                                                                                        |

- **Responsable de despliegue:** {{pendiente}}
- **Verificaciones de salud:** {{pendiente; propuesta: `/login` responde 2xx y el flujo de acceso del E2E de acceso pasa contra la URL desplegada}}
- **Umbrales para detener o revertir:** {{pendiente}}
- **Respaldo previo:** {{pendiente; no aplica mientras producción no tenga backend}}
- **Canal de comunicación a usuarios:** {{pendiente}}
- **Cierre de G8:** lo cierra Operación con conformidad funcional; los pendientes pasan al backlog con dueño.
- **Fusión = liberación (D-03, 2026-11-10):** Vercel despliega en producción cada fusión en `main`. Por eso el control P (autorización expresa del líder de Sistemas en nivel Crítico, Anexo B) se registra **antes** de fusionar. Las vistas previas por PR no son liberaciones.

**Cambios urgentes:** se vinculan al incidente y llevan revisión independiente, prueba focalizada, autorización y recuperación antes de desplegar. El análisis de causa y la documentación se completan en 2 días hábiles (referencia del manual). La urgencia no elimina bloqueos de seguridad, privacidad ni integridad.

---

## 8 Uso de IA [M]

| Aspecto                                                   | Definición del proyecto                                                                                                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Herramientas en uso                                       | Codex y Claude Code (historial de Git y de PR). {{pendiente: autorización de Sistemas · plan o licencia}}                                                                          |
| Finalidad autorizada                                      | {{pendiente; uso observado: análisis, generación de código, revisión y documentación}}                                                                                             |
| Datos permitidos                                          | Sintéticos o contexto minimizado. El repositorio solo contiene datos ficticios (`README.md`).                                                                                      |
| Datos prohibidos (manual)                                 | Secretos, credenciales, documentos de identidad, imágenes y plantillas biométricas. Además, los formatos originales PESV con datos diligenciados permanecen fuera del repositorio. |
| Acceso, retención y condiciones del proveedor verificadas | {{pendiente}}                                                                                                                                                                      |
| Privilegio de los asistentes                              | No autorizan ni ejecutan cambios en producción por iniciativa propia. Fusionar en `main` despliega en producción: un asistente no fusiona sin instrucción humana.                  |
| Revisión IA en R, Q y P                                   | En una ejecución separada de la generación; la disposición la decide un revisor humano. Registro según el Anexo C.                                                                 |

---

## 9 Datos y cumplimiento [M] [P]

| Pregunta                               | Respuesta                                                                                                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Trata datos personales?               | Sí: identidad, correo y teléfono de conductores, firmas, fotografías y ubicación textual en incidencias (`docs/product-validation.md`, inventario preliminar). Hoy solo con datos ficticios.   |
| ¿Trata datos sensibles o biométricos?  | Potencialmente sensibles: respuestas sobre medicamentos y enfermedad del cuestionario de fatiga. Sin biometría. → nivel Crítico.                                                               |
| ¿Requiere concepto de Jurídica?        | Sí · {{pendiente: solicitud, estado y enlace}}                                                                                                                                                 |
| Autorización de titulares y finalidad  | {{pendiente: mecanismo y responsable}}                                                                                                                                                         |
| Decisiones jurídicas pendientes        | Naturaleza de las respuestas de fatiga, acceso y retención de fotos, firmas y fatiga, autorización de titulares (`docs/security-data-governance.md`). Bloquean el tratamiento de datos reales. |
| Retención y acceso a datos del sistema | Políticas de retención creadas y desactivadas hasta aprobación (`docs/security-data-governance.md`). Acceso por rol y RLS (`docs/data-model.md`).                                              |

Marco de referencia: Ley 1581 de 2012 y su reglamentación; Jurídica confirma su aplicación.

---

## 10 Trazabilidad y registros [M]

| Registro            | Dónde vive                                                                                            | Plantilla |
| ------------------- | ----------------------------------------------------------------------------------------------------- | --------- |
| 1 Iniciativa        | Este plan, sección 1                                                                                  | —         |
| 2 Tarjeta de cambio | Issues de GitHub en GitHub Projects (confirmado 2026-11-10)                                           | Anexo A   |
| 3 Liberación        | {{pendiente; propuesta: issue de liberación en el tablero, enlazado al PR y al despliegue de Vercel}} | Anexo B   |

- **Cadena mínima:** necesidad o sección de alcance → tarjeta y criterios → cambio de código → prueba y ejecución → versión → despliegue, recorrible en ambos sentidos.
- **Convenciones de enlace (propuesta):** cada PR enlaza su tarjeta con `#ID`; cada tarjeta cita la sección de `docs/requirements.md` o el caso CA que atiende; cada liberación lista sus tarjetas y el despliegue de Vercel correspondiente.
- **Retención y acceso al historial:** {{pendiente}}. Nota: el repositorio es público (D-04).
- **Excepciones y riesgos aceptados:** se registran en la tarjeta o en la iniciativa con motivo, mitigación, aprobador competente y vencimiento.

---

## 11 Seguimiento [M]

**Vista consolidada (Control Tower):** {{pendiente}} · actualizada {{pendiente}}

| Indicador                 | Fuente                                        | Responsable   | Frecuencia    |
| ------------------------- | --------------------------------------------- | ------------- | ------------- |
| Tiempo de ciclo           | {{pendiente: tablero}}                        | {{pendiente}} | Semanal       |
| Entrega aceptada          | {{pendiente: tablero y línea base}}           | {{pendiente}} | Semanal       |
| Fallos de cambio          | Despliegues de Vercel e incidentes            | {{pendiente}} | Por periodo   |
| Restauración del servicio | Incidentes                                    | {{pendiente}} | Por incidente |
| Control y trazabilidad    | Tarjetas terminadas con controles y evidencia | {{pendiente}} | Semanal       |

---

## 12 Riesgos, dependencias y decisiones abiertas [P]

| ID   | Tipo        | Descripción                                                                                                                       | Impacto                                                      | Responsable       | Fecha límite  | Estado            |
| ---- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------- | ------------- | ----------------- |
| D-01 | Decisión    | Designar solicitante, dueño funcional y titulares de los roles de la sección 4.                                                   | Sin ellos no se cierra G1 ni puede aprobarse ningún control. | Líder de Sistemas | {{pendiente}} | Abierta           |
| D-02 | Decisión    | Recrear `develop` o ajustar el flujo de ramas sobre `main` (`docs/development.md`).                                               | Flujo documentado incumplible.                               | Líder técnico     | {{pendiente}} | Abierta           |
| D-03 | Decisión    | Despliegue automático a producción: se mantiene y se exige P antes de fusionar. Sigue abierta la visibilidad pública del dominio. | Fusionar equivale a liberar.                                 | Líder de Sistemas | 2026-11-10    | Decidida en parte |
| D-04 | Decisión    | Visibilidad del repositorio (hoy público; `docs/architecture.md` §9 recomienda privado).                                          | Exposición de documentación interna.                         | Líder de Sistemas | {{pendiente}} | Abierta           |
| D-05 | Decisión    | Concepto de Jurídica sobre las respuestas de fatiga y el tratamiento de fotos y firmas.                                           | Define el nivel Crítico o Alto; bloquea el tratamiento real. | Jurídica          | {{pendiente}} | Abierta           |
| D-06 | Decisión    | Prácticas v0.4: no se adopta ninguna (C-03, C-05, C-06).                                                                          | Los valores de liberación de la sección 7 se definen aparte. | Usuario           | 2026-11-10    | Decidida          |
| R-01 | Riesgo      | PR #1 a #7 integrados sin revisión de otro profesional y `main` sin protección (verificado 2026-11-11).                           | Incumple Done; lo integrado debe recertificarse (2.3).       | Líder técnico     | {{pendiente}} | Abierto           |
| R-02 | Riesgo      | Integración y E2E completos fuera de CI. Último PASS manual: 2026-11-11 sobre `508501a` (T-04), posterior al cambio de catálogo.  | Regresiones no detectadas automáticamente.                   | Líder técnico     | {{pendiente}} | Abierto           |
| R-03 | Riesgo      | Sin respaldo, reversión ni recuperación ensayada.                                                                                 | Incumple el requisito de recuperación del nivel Crítico.     | Operación         | {{pendiente}} | Abierto           |
| R-04 | Dependencia | Validación PESV del catálogo, criterios críticos y fatiga (`docs/requirements.md` §11).                                           | Bloquea pruebas con vehículos reales.                        | Responsable PESV  | {{pendiente}} | Abierta           |
| R-05 | Riesgo      | Herramientas de IA usadas sin autorización registrada.                                                                            | Incumple el gobierno de IA (§6).                             | Líder de Sistemas | {{pendiente}} | Abierto           |

---

## 13 Primer incremento [P]

Propuesta, pendiente de ordenar por el dueño funcional:

- **Objetivo del primer incremento:** establecer la línea base LBV-{{SIGLA}}-001 y los controles mínimos para que los siguientes cambios cumplan AIDLC.
- **Historias candidatas:**
  1. Proteger `main`: revisión obligatoria de otra persona y CI obligatorio (R-01).
  2. Aplicar D-03: registrar el control P antes de cada fusión y decidir si el dominio de producción sigue público.
  3. Crear el tablero y las plantillas de tarjeta, PR y liberación (sección 10).
  4. Recertificar la línea base contra Q: revisión independiente del código integrado y ejecución de integración y E2E sobre `main` (2.3, R-02).
  5. Documentar reversión y respaldo (R-03).
- **Fecha objetivo:** {{pendiente}}
- **Criterio de éxito del plan:** {{pendiente; propuesta: ningún cambio llega a `main` sin revisión de otra persona y CI aprobado, y la línea base queda recertificada con evidencia enlazada}}

---

## 14 Aprobación del plan [M]

| Rol                                 | Nombre | Decisión | Fecha | Evidencia |
| ----------------------------------- | ------ | -------- | ----- | --------- |
| Líder técnico (revisión)            |        |          |       |           |
| Representante de negocio (revisión) |        |          |       |           |
| Líder de Sistemas (aprobación)      |        |          |       |           |

---

## Anexo A · Plantilla de tarjeta de cambio [M]

```markdown
### {{ID}} · {{Título}}

- Fuente: {{necesidad / sección de alcance / incidente}}
- Responsable: {{nombre}} · Revisor: {{nombre distinto del autor}}
- Riesgo: {{Bajo/Medio/Alto/Crítico}} · Propuso: {{líder técnico}} · Confirmó: {{dueño funcional}}
- Estado: {{Pendiente/Listo/En curso/En validación/Terminado}} · Bloqueado: {{No / causa · dueño · próxima acción}}

**Criterios de aceptación**

- [ ] {{criterio observable}}

**Ready (R)**: {{checklist 6.1 o enlace}} · Fecha: {{...}}
**Done (Q)**: {{checklist 6.2 o enlace}} · Fecha: {{...}}

**Enlaces**: diseño o nota de impacto {{...}} · código/PR {{...}} · pruebas {{...}} · aceptación {{...}}
**Decisiones y excepciones**: {{...}}
**Revisiones IA**: {{Anexo C}}
```

## Anexo B · Plantilla de liberación [M]

```markdown
### Liberación {{versión}} · {{AAAA-MM-DD}}

- Tarjetas incluidas: {{IDs}}
- Nivel de riesgo (el mayor de las tarjetas): {{...}}
- Autorizó (P): {{nombre}} · Responsable de despliegue: {{nombre}}
- Respaldo: {{verificado / no aplica}} · Recuperación: {{ensayada / documentada}}
- Aviso a usuarios: {{fecha · canal}}
- Verificaciones de salud: {{resultado}}
- Ventana de observación: {{inicio → fin}} · Umbrales de reversión: {{...}}
- Estado: Preparada → Autorizada → Desplegada → Estable
- Cierre G8: {{Operación · fecha · conformidad funcional}}
- Incidentes y aprendizajes: {{enlaces}}
```

## Anexo C · Registro de revisión asistida por IA [M]

```markdown
- Punto de control: {{R / Q / P}}
- Herramienta y modelo: {{...}}
- Versión de instrucciones: {{...}}
- Material revisado: {{commit / versión / enlace}} (ejecución separada de la generación)
- Fecha: {{AAAA-MM-DD}}
- Hallazgos (cada uno con su criterio, archivo o evidencia): {{...}}
- Disposición humana: {{aceptado / descartado / pendiente de verificar}} · Responsable: {{...}}
- Revisión manual equivalente (si no se usó IA): {{quién · motivo}}
```
