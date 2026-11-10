# Borrador de tarjetas — primer incremento (AIDLC-P02)

> **Estado: BORRADOR, no son tarjetas aprobadas.** Redactado con asistencia de IA el 2026-11-10 a partir de la sección 13 del plan `docs/aidlc/AIDLC-P02.md` (integrado en `main` por el PR #6; el plan sigue en estado Borrador hasta su aprobación, §14). Los niveles de riesgo son **propuestas**: los propone el líder técnico y los confirma el dueño funcional (manual §4). El orden lo decide el dueño funcional. Ninguna tarjeta está en Ready: falta asignar los roles (D-01).
>
> Cuando se aprueben, cada tarjeta se crea como issue con la plantilla `.github/ISSUE_TEMPLATE/tarjeta-cambio.md` y este archivo puede retirarse.

| ID   | Título                                                    | Riesgo propuesto | Depende de       |
| ---- | --------------------------------------------------------- | ---------------- | ---------------- |
| T-01 | Proteger la rama `main`                                   | Medio            | D-01             |
| T-02 | Registrar el control P antes de cada fusión en `main`     | Medio            | D-01, T-03       |
| T-03 | Crear el tablero y activar las plantillas AIDLC           | Bajo             | D-01             |
| T-04 | Ejecutar integración y E2E completos sobre `main`         | Medio            | —                |
| T-05 | Revisión independiente de la línea base (recertificación) | Crítico          | D-01, D-05, T-04 |
| T-06 | Documentar reversión en Vercel y respaldo de Supabase     | Alto             | D-01             |
| T-07 | Registrar la autorización de las herramientas de IA       | Bajo             | D-01             |

---

### T-01 · Proteger la rama `main`

- **Fuente:** plan AIDLC-P02 §2.2 (revisión por otro profesional) y R-01. Evidencia: PR #1 a #5 fusionados con 0 revisiones; `main` sin protección (API de GitHub).
- **Riesgo propuesto:** Medio. Factor: permisos del proceso de integración. Es un cambio de configuración del repositorio, reversible, sin datos.
- **Responsable:** {{pendiente}} · **Revisor:** {{pendiente, distinto del autor}}

**Criterios de aceptación**

- [ ] Un PR hacia `main` no puede fusionarse sin al menos una aprobación de una persona distinta del autor.
- [ ] Un PR hacia `main` no puede fusionarse si fallan los trabajos de CI _Calidad, pruebas y compilación_, _Auditoría de producción_ y _Acceso E2E_.
- [ ] No se permiten pushes directos ni force-push a `main`.
- [ ] Escenario negativo comprobado: un intento de fusión sin aprobación queda bloqueado (captura o enlace).
- [ ] La configuración aplicada queda descrita en `docs/development.md`.

**Notas:** la disponibilidad de reglas de protección depende del plan de GitHub (`docs/development.md`). Si no están disponibles, se registra como excepción con mitigación (revisión manual obligatoria) y aprobador.

---

### T-02 · Registrar el control P antes de cada fusión en `main`

- **Fuente:** decisión D-03 del plan (2026-11-10): fusionar en `main` despliega en producción en Vercel.
- **Riesgo propuesto:** Medio. Factor: continuidad y autorización de liberaciones.
- **Responsable:** {{pendiente}} · **Revisor:** {{pendiente}}

**Criterios de aceptación**

- [ ] Cada PR hacia `main` enlaza un issue de liberación creado con `.github/ISSUE_TEMPLATE/liberacion.md`, en estado Autorizada antes de fusionar.
- [ ] La autorización la registra el líder de Sistemas (expresa en nivel Crítico) o su delegado escrito en Bajo y Medio.
- [ ] `docs/deployment.md` y `CONTRIBUTING.md` describen que fusionar equivale a liberar.
- [ ] Queda decidido y documentado si el dominio `aplicativovehiculos.vercel.app` sigue público (resto de D-03).

---

### T-03 · Crear el tablero y activar las plantillas AIDLC

- **Fuente:** plan AIDLC-P02 §5 y §10 (GitHub Projects con issues, confirmado 2026-11-10).
- **Riesgo propuesto:** Bajo. Cambio de proceso local y reversible.
- **Responsable:** {{pendiente}} · **Revisor:** {{pendiente}}

**Criterios de aceptación**

- [ ] Existe un proyecto de GitHub con las columnas Pendiente, Listo, En curso, En validación y Terminado, y un campo o etiqueta para Bloqueado.
- [ ] Existen las etiquetas `aidlc` y `release` que usan las plantillas.
- [ ] Las plantillas de tarjeta, liberación y PR están en `main` y aparecen al crear un issue o PR.
- [ ] Las tarjetas T-01 a T-07 aprobadas están creadas como issues en el tablero.
- [ ] El límite de trabajo activo acordado figura en el plan (§5).

---

### T-04 · Ejecutar integración y E2E completos sobre `main`

- **Fuente:** plan AIDLC-P02 §2.3 y R-02. Último PASS registrado: 2026-10-29, anterior al cambio de catálogo `0bf0548` (`docs/verification.md`).
- **Riesgo propuesto:** Medio. Factor: integraciones (Supabase local). Solo ejecuta pruebas con datos ficticios en localhost.
- **Responsable:** {{pendiente}} · **Revisor:** {{pendiente}}

**Criterios de aceptación**

- [ ] `npm run verify`, `npm run test:integration` y `npm run test:e2e` se ejecutan sobre el commit vigente de `main`, desde una base local nueva con las once migraciones.
- [ ] Cada resultado se registra como PASS, FAIL o NOT RUN con fecha y commit en la sección «Estado vigente» de `docs/verification.md`.
- [ ] Cada fallo genera su propia tarjeta; no se corrige dentro de esta.

**Notas:** puede ejecutarse antes de asignar roles, porque solo produce evidencia. La evaluación de llevar estas suites a CI queda como tarjeta posterior.

---

### T-05 · Revisión independiente de la línea base (recertificación)

- **Fuente:** regla de transición del plan (§2.3, confirmada 2026-11-10): lo integrado se revisa contra Q antes de cualquier nueva liberación.
- **Riesgo propuesto:** Crítico. Factor: datos potencialmente sensibles (respuestas de fatiga). Requiere Seguridad y privacidad (§4).
- **Responsable:** {{pendiente}} · **Revisor:** {{pendiente, distinto de quien escribió el código}}

**Criterios de aceptación**

- [ ] Una persona distinta de los autores revisa el código de `main` por módulo: autenticación y cuentas, turnos e inspecciones, evidencias y Storage, RLS y migraciones, dashboards y exportación.
- [ ] Seguridad revisa RLS, manejo de secretos, Storage y límites de acceso, con hallazgos enlazados.
- [ ] Cada punto del Done (§5) queda como cumple, no cumple o sin evidencia, con enlace.
- [ ] Los bloqueos obligatorios encontrados (§4) se registran en rojo y bloquean la siguiente liberación.
- [ ] El resultado se aprueba o rechaza por una persona; la IA puede asistir en una ejecución separada, registrada con el Anexo C.

**Notas:** el tamaño probablemente excede un incremento corto. Se propone dividirla por módulo al refinarla. Depende de T-04 para tener evidencia de pruebas vigente.

---

### T-06 · Documentar reversión en Vercel y respaldo de Supabase

- **Fuente:** plan AIDLC-P02 §7 y R-03; el nivel Crítico exige recuperación prevista antes de liberar (§4, §5).
- **Riesgo propuesto:** Alto. Factor: dificultad de recuperación.
- **Responsable:** {{pendiente; propuesta: Operación}} · **Revisor:** {{pendiente}}

**Criterios de aceptación**

- [ ] Procedimiento escrito para volver a un despliegue anterior en Vercel, ensayado una vez sobre una vista previa o producción sin backend, con evidencia.
- [ ] Propuesta de respaldo y restauración para el proyecto Supabase de pruebas, marcada como no aplicable mientras producción no tenga backend.
- [ ] Verificaciones de salud definidas (propuesta del plan: `/login` responde 2xx y el E2E de acceso pasa contra la URL desplegada).
- [ ] Todo queda enlazado desde el plan §7 y `docs/deployment.md`.

---

### T-07 · Registrar la autorización de las herramientas de IA

- **Fuente:** plan AIDLC-P02 §8 y R-05; gobierno de IA del manual (§6).
- **Riesgo propuesto:** Bajo.
- **Responsable:** {{pendiente; decide el líder de Sistemas}} · **Revisor:** {{pendiente}}

**Criterios de aceptación**

- [ ] El plan §8 indica qué herramientas están autorizadas (hoy en uso: Codex y Claude Code), su finalidad y los datos permitidos.
- [ ] Se registra la verificación de acceso, retención y condiciones del proveedor, con fecha y enlace.
- [ ] Si una herramienta no se autoriza, el plan indica cómo se sustituye.

---

## Fuera del primer incremento (backlog)

- Llevar integración y E2E completos a CI (R-02), una vez definido el manejo de secretos.
- Decidir el flujo de ramas (D-02) y la visibilidad del repositorio (D-04).
- Pendientes de producto ya documentados: reconciliación de objetos sin metadatos, correcciones de odómetro en indicadores, pruebas en Safari y dispositivos físicos (`docs/verification.md`).
