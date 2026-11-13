# Hoja de decisión — D-01 y aprobación del plan AIDLC-P02

> **Instrumento de trabajo, no aprobado.** Se completa en una sesión con el líder de Sistemas y los revisores. Al firmarse, las decisiones se transcriben al plan [`AIDLC-P02.md`](./AIDLC-P02.md) mediante una tarjeta autorizada; esta hoja no sustituye al plan ni al manual AIDLC-M01 v0.3.
>
> Preparada: 2026-11-11 · Base: plan AIDLC-P02 v0.1 (Borrador) · Manual: AIDLC-M01 v0.3.

## Resumen ejecutivo

**Qué se pide en esta sesión**

| Decisión                     | Resultado que se registra                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| D-01 · Roles                 | Titulares y suplentes designados. Sin ellos no se cierra G1 ni puede aprobarse ningún control.                    |
| Aprobación del plan          | Plan AIDLC-P02 v0.2 (a transcribir) aprobado con el contenido de esta hoja; el commit se registra al transcribir. |
| Riesgo Crítico               | Clasificación confirmada por líder técnico, dueño funcional, Seguridad y Jurídica.                                |
| Riesgos abiertos R-01 a R-05 | Aceptados, condicionados o rechazados, con dueño y fecha.                                                         |
| Decisiones abiertas          | D-02, parte abierta de D-03, D-04 y T-07 resueltas o diferidas con dueño y fecha.                                 |
| Línea base                   | Commit decidido y registrado (referencias: plan `b572f01`; `main` hoy `508501a`).                                 |

**Qué no se pide**

- No libera ni fusiona: cada fusión en `main` exige el control P.
- No autoriza datos reales: la aprobación cubre datos ficticios; D-05 y §9 siguen bloqueando el tratamiento real.
- No cierra G1: la aceptación del alcance requiere firma separada de negocio y Sistemas.
- No sustituye las revisiones del plan ni el registro del Anexo C.

## 0 Instrucciones

- Complete solo lo que se decide. No invente nombres, fechas ni prioridades: los campos sin decisión quedan como **Diferido**, con dueño y fecha.
- Lo marcado **Propuesta del plan** es una sugerencia del borrador; no es una decisión hasta que se registre aquí.
- Nadie revisa su propio cambio. Un asistente de IA no puede revisar ni aprobar.
- En nivel Crítico, la autorización para liberar es expresa del líder de Sistemas y no se delega.
- Al finalizar, entregue esta hoja firmada al responsable de transcripción indicado en la sección 6.

## 1 Contexto y evidencia disponible

| Elemento                               | Estado                                                                                                                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan AIDLC-P02                         | v0.1, **Borrador**, en `main` desde el PR #6.                                                                                                                                    |
| Plantillas AIDLC                       | Tarjeta, liberación y PR en `main` desde el PR #7.                                                                                                                               |
| Evidencia T-04 (2026-11-11, `508501a`) | `verify` PASS (29/29 unitarias), integración PASS 24/24, E2E PASS 12/12 contra servidor standalone. Pendiente registrar en `docs/verification.md` mediante tarjeta autorizada.   |
| Protección de `main`                   | **Sin protección** (API de GitHub, 2026-11-11).                                                                                                                                  |
| Tablero e issues                       | 0 issues; sin etiquetas `aidlc` ni `release`; el token de `gh` no tiene alcance `project`.                                                                                       |
| Hallazgo de entorno                    | `supabase start` con la configuración versionada deja el proveedor de correo deshabilitado y no permite iniciar sesión; la verificación se hizo con la pila liviana documentada. |
| Hallazgo de pruebas                    | La corrida E2E contra `next dev` fue intermitente: 8/12 y, al repetir los cuatro fallidos, 1/4; contra el servidor standalone pasó 12/12.                                        |

## 2 D-01 · Designación de roles (plan §4)

Complete titular y suplente. Deje en blanco lo que no se decida hoy y regístrelo como **Diferido** con dueño y fecha.

| Rol                    | Titular   | Suplente | Propuesta del plan (referencia, no decisión) | Restricción                                             |
| ---------------------- | --------- | -------- | -------------------------------------------- | ------------------------------------------------------- |
| Solicitante            |           |          | —                                            | Identifica la necesidad de origen.                      |
| Dueño funcional        |           |          | —                                            | Su aceptación no sustituye la revisión técnica.         |
| Líder de Sistemas      |           |          | Coordinador de Sistemas y Desarrollo         | Autoriza la liberación en nivel Crítico; no se delega.  |
| Líder técnico          |           |          | Un Auxiliar de Sistemas                      | Si escribe código, lo revisa otra persona.              |
| Equipo de desarrollo   |           |          | —                                            | Revisor distinto del autor en cada cambio.              |
| Revisor de código      |           |          | El otro Auxiliar o el Coordinador            | Nunca es el autor del cambio.                           |
| Responsable de pruebas |           |          | —                                            | En Alto y Crítico, distinto del autor.                  |
| Operación y soporte    |           |          | —                                            | Conserva autorización independiente.                    |
| Seguridad              |           |          | Área de Sistemas                             | Obligatoria en nivel Crítico.                           |
| Privacidad y Jurídica  |           |          | Área jurídica de Petrocasinos                | Sus decisiones bloquean el tratamiento de datos reales. |
| Responsable PESV       |           |          | —                                            | Valida catálogo, criterios críticos y fatiga.           |
| Finanzas               | No aplica | —        | —                                            | El proyecto no tiene reglas económicas.                 |

En «Solicitante» y «Dueño funcional», registre nombre y área (plan §1).

**Combinaciones prohibidas:** autor y revisor del mismo cambio; autor y validador en tarjetas Alto o Crítico; asistente de IA como revisor o aprobador.

**Delegaciones escritas del líder de Sistemas:** [Completar]

## 3 Datos y confirmaciones para aprobar el plan

### 3.1 Datos mínimos (plan §1, §5, §6, §7, §10 y §13)

| Campo                                             | Valor decidido      | Responsable o evidencia                                                                                                                                                                  |
| ------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resultado esperado (valor observable)             |                     |                                                                                                                                                                                          |
| Prioridad (Alta / Media / Baja y justificación)   |                     |                                                                                                                                                                                          |
| Criterios de éxito del producto (CA-01 a CA-19)   |                     | Referencia: CA-01 a CA-19 de `docs/requirements.md` §10 (propuestos).                                                                                                                    |
| Criterio de éxito del plan (plan §13)             |                     | Propuesta: ningún cambio llega a `main` sin revisión de otra persona y CI aprobado, y la línea base queda recertificada con evidencia enlazada.                                          |
| Fecha objetivo del plan (plan §13)                |                     |                                                                                                                                                                                          |
| Sigla de la línea base                            | LBV-[Completar]-001 |                                                                                                                                                                                          |
| Commit de la línea base                           |                     | Referencia: el plan propone `b572f01`; `main` hoy está en `508501a` (2026-11-11). Decidir y actualizar §1.                                                                               |
| Límite de trabajo activo (incluye validación)     |                     |                                                                                                                                                                                          |
| Capacidad del equipo confirmada (plan §6.1)       |                     | Personas y dedicación; debe ser compatible con un incremento corto.                                                                                                                      |
| Duración del objetivo                             |                     | Valor de partida del manual: 2 semanas.                                                                                                                                                  |
| Coordinación diaria                               |                     | Reunión de 15 min o actualización asíncrona.                                                                                                                                             |
| Día de revisión semanal del tablero e indicadores |                     |                                                                                                                                                                                          |
| Ambiente de pruebas (plan §5)                     |                     | Local, vista previa de Vercel o producción. Pendiente: Supabase local o pila liviana; `supabase start` versionado deja el proveedor de correo deshabilitado y no permite iniciar sesión. |
| Mecanismo de aceptación funcional                 |                     | Demostración o validación delegada.                                                                                                                                                      |
| Responsable de despliegue                         |                     |                                                                                                                                                                                          |
| Ventana de observación tras liberar               |                     |                                                                                                                                                                                          |
| Recuperación antes de liberar (plan §7)           |                     | Nivel Crítico: recuperación prevista y autorización expresa. T-06 pendiente.                                                                                                             |
| Verificaciones de salud (plan §7)                 |                     | Propuesta: `/login` responde 2xx y el flujo de acceso del E2E pasa contra la URL desplegada.                                                                                             |
| Ventana de atribución (plan §7)                   |                     | Definir duración y criterio.                                                                                                                                                             |
| Respaldo previo (plan §7)                         |                     | No aplica mientras producción no tenga backend; confirmar y registrar.                                                                                                                   |
| Umbrales para detener o revertir                  |                     |                                                                                                                                                                                          |
| Aviso a usuarios afectados y canal                |                     |                                                                                                                                                                                          |
| Retención y acceso al historial (plan §10)        |                     | Repositorio público (D-04); definir retención y acceso.                                                                                                                                  |

> Los campos que queden abiertos deben pasar a la tabla de riesgos y decisiones del plan (§12) con dueño y fecha. Un campo [M] sin decisión impide cerrar el control correspondiente.

### 3.2 Confirmación del riesgo Crítico (plan §1 y §3)

El plan propone **Crítico** (2026-11-10). La clasificación aún no está confirmada por los roles responsables; sin esas confirmaciones queda como propuesta y debe registrarse como condición en §5.

| Confirmación                                   | Nombre | Fecha | Evidencia |
| ---------------------------------------------- | ------ | ----- | --------- |
| Líder técnico que asume la clasificación       |        |       |           |
| Dueño funcional que la confirma                |        |       |           |
| Seguridad                                      |        |       |           |
| Jurídica (concepto sobre respuestas de fatiga) |        |       |           |

**Nivel confirmado:** [ ] Crítico · [ ] Alto · [ ] Otro: [Completar] · Fecha: [Completar]

### 3.3 Riesgos abiertos que la aprobación asume (plan §12)

El plan §12 los deja abiertos. Aprobar el plan no los resuelve: el líder decide si los acepta, los condiciona o los rechaza. R-01 se actualiza: la verificación del 2026-11-11 encontró **0 revisiones en los PR #1 a #7**, no solo en los #1 a #4.

| ID   | Riesgo o dependencia                                                                 | Impacto                                                  | Disposición | Dueño             | Fecha | Condición o evidencia |
| ---- | ------------------------------------------------------------------------------------ | -------------------------------------------------------- | ----------- | ----------------- | ----- | --------------------- |
| R-01 | PR #1 a #7 fusionados sin revisión independiente y `main` sin protección.            | Incumple Done; lo integrado debe recertificarse.         |             | Líder técnico     |       |                       |
| R-02 | Integración y E2E completos fuera de CI; último PASS anterior al cambio de catálogo. | Regresiones no detectadas automáticamente.               |             | Líder técnico     |       |                       |
| R-03 | Sin respaldo, reversión ni recuperación ensayada.                                    | Incumple el requisito de recuperación del nivel Crítico. |             | Operación         |       |                       |
| R-04 | Validación PESV del catálogo, criterios críticos y fatiga (dependencia).             | Bloquea pruebas con vehículos reales.                    |             | Responsable PESV  |       |                       |
| R-05 | Herramientas de IA usadas sin autorización registrada.                               | Incumple el gobierno de IA.                              |             | Líder de Sistemas |       |                       |

Disposición: Aceptado · Condicionado · Rechazado.

> Al transcribir, actualizar §2.1 y R-01 del plan: los siete PR fusionados tienen 0 revisiones.

### 3.4 Brechas de la línea base no cubiertas por R-01 a R-05 (plan §2.1)

Las brechas de revisión, CI, recuperación y uso de IA se registran como R-01, R-02, R-03 y R-05 en §3.3. Las siguientes no tienen dueño ni fecha en el plan y deben entrar al backlog con dueño, prioridad y fecha (plan §2.3).

| Brecha                               | Acción                                                                  | Dueño       | Prioridad   | Fecha       |
| ------------------------------------ | ----------------------------------------------------------------------- | ----------- | ----------- | ----------- |
| Criterios de aceptación por historia | Crear tarjetas con la plantilla del Anexo A.                            | [Completar] | [Completar] | [Completar] |
| Clasificación de riesgo por tarjeta  | Clasificar cada tarjeta con la sección 3.                               | [Completar] | [Completar] | [Completar] |
| Trazabilidad necesidad → despliegue  | Tablero e issues; convenciones de la sección 10.                        | [Completar] | [Completar] | [Completar] |
| Observabilidad y soporte             | Definir verificaciones de salud y responsable de Operación (sección 7). | [Completar] | [Completar] | [Completar] |

## 4 Decisiones abiertas que condicionan el plan

Marque una opción por decisión. No complete lo que no corresponda decidir en esta sesión.

### D-02 · Flujo de ramas

- [ ] Recrear `develop` y mantener `main` como rama de liberación.
- [ ] Trabajar solo sobre `main` con ramas cortas y PR.
- [ ] Otra: [Completar]

Decide (plan §12): Líder técnico — [Completar] · Fecha: [Completar]

### D-03 · Visibilidad del dominio de producción (parte abierta)

- [ ] Mantener público `aplicativovehiculos.vercel.app`.
- [ ] Restringir el acceso al dominio.
- [ ] Diferir, con dueño y fecha: [Completar]

Decide (plan §12): Líder de Sistemas — [Completar] · Fecha: [Completar]

### D-04 · Visibilidad del repositorio

- [ ] Privado (recomendación de `docs/architecture.md` §9).
- [ ] Público, con aceptación expresa del riesgo documentada.
- [ ] Diferir, con dueño y fecha: [Completar]

Decide (plan §12): Líder de Sistemas — [Completar] · Fecha: [Completar]

### D-05 · Concepto jurídico sobre fatiga, fotos y firmas

La decisión corresponde a Jurídica (plan §12). Esta hoja registra la solicitud y su seguimiento:

| Campo                                                           | Valor                                 |
| --------------------------------------------------------------- | ------------------------------------- |
| Responsable de solicitar el concepto                            |                                       |
| Fecha de solicitud                                              |                                       |
| Estado                                                          | No solicitado / Solicitado / Recibido |
| Enlace o radicado                                               |                                       |
| Autorización de titulares y finalidad (mecanismo y responsable) | [Completar]                           |

**Decisiones jurídicas pendientes:** naturaleza de las respuestas de fatiga; acceso y retención de fotos, firmas y fatiga; autorización de titulares (`docs/security-data-governance.md`). Bloquean el tratamiento de datos reales.

Decide (plan §12): Jurídica — [Completar] · Fecha: [Completar]

### T-07 · Autorización de herramientas de IA (plan §8)

- [ ] Autorizar Codex · [ ] Autorizar Claude Code · [ ] Otra: [Completar]
- Plan o licencia: [Completar]
- Finalidad autorizada: [Completar]
- Datos permitidos: sintéticos o contexto minimizado.
- Datos prohibidos: secretos, credenciales, documentos de identidad, imágenes y plantillas biométricas; formatos originales PESV con datos diligenciados fuera del repositorio.
- Verificación de acceso, retención y condiciones del proveedor: [Completar]
- Privilegio de los asistentes: no autorizan ni ejecutan cambios en producción; no fusionan sin instrucción humana.
- Si no se autoriza una herramienta, sustitución prevista: [Completar]

Decide (plan §12): Líder de Sistemas — [Completar] · Fecha: [Completar]

## 5 Aprobación del plan (plan §14)

**Plan que se aprueba:** AIDLC-P02, versión 0.2 (a transcribir), con el contenido y las condiciones de esta hoja. **Commit de la transcripción:** `[Completar]` (se registra al transcribir; sin él la aprobación no es trazable).

**Secuencia de firma:** [ ] Se firma el contenido de esta hoja y el commit de transcripción se registra antes de archivar · [ ] Se transcribe primero a la versión 0.2 y se firma sobre ese commit. La opción elegida se registra en §7.

Si el representante de negocio es el dueño funcional, registre el mismo nombre en la tabla.

| Rol                                 | Nombre | Decisión                                    | Fecha | Evidencia |
| ----------------------------------- | ------ | ------------------------------------------- | ----- | --------- |
| Líder técnico (revisión)            |        | Aprueba / Aprueba con condiciones / Rechaza |       |           |
| Representante de negocio (revisión) |        | Aprueba / Aprueba con condiciones / Rechaza |       |           |
| Líder de Sistemas (aprobación)      |        | Aprueba / Aprueba con condiciones / Rechaza |       |           |

**Condiciones o reservas registradas:**

[Completar]

**Efecto de la aprobación:** el plan pasa de Borrador a Aprobado (versión 0.2) y queda declarada la línea base **preliminar** LBV-[Completar]-001. Su recertificación (T-05) sigue pendiente y debe completarse antes de la siguiente liberación. Se habilitan las tarjetas del primer incremento. No autoriza por sí sola ninguna liberación: cada fusión en `main` sigue exigiendo el control P (D-03).

**Datos:** la aprobación cubre el desarrollo con datos ficticios. No autoriza el tratamiento de datos reales; ese tratamiento sigue bloqueado por D-05 y las decisiones de §9 del plan.

**G1:** esta aprobación no cierra la aceptación del alcance (G1); esa aceptación requiere firma separada de negocio y Sistemas (plan §1).

**Cierre de G1 (opcional, acto separado):** [ ] G1 sigue abierta · [ ] Se cierra en esta sesión con firma separada: Negocio [Completar] · Sistemas [Completar] · Fecha [Completar].

## 6 Cierre del acto y siguientes pasos

**Responsable de transcripción:** [Completar].

| Acción                                                                                                                                                                   | Responsable | Fecha límite |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------ |
| Transcribir las decisiones al plan (§1, §2.1, §3, §4, §5, §7, §8, §10, §12, §13 y §14) y cambiar el estado a Aprobado                                                    |             |              |
| Crear el tablero, las etiquetas `aidlc`/`release` y las tarjetas aprobadas (T-03; el token actual no tiene alcance `project`: usar la interfaz web o ampliar el alcance) |             |              |
| Activar la protección de `main` con revisión y CI obligatorios (T-01)                                                                                                    |             |              |
| Registrar la autorización de IA (T-07)                                                                                                                                   |             |              |
| Registrar la evidencia T-04 en `docs/verification.md` mediante tarjeta autorizada                                                                                        |             |              |
| Abrir las tarjetas de los hallazgos: login con `supabase start` (T-08 propuesta) e intermitencia E2E en `next dev` (T-09 propuesta); prioridad [Completar]               |             |              |
| Abrir las tarjetas de las brechas de §3.4 (criterios por historia, clasificación por tarjeta, trazabilidad, observabilidad)                                              |             |              |

## 7 Constancia

| Campo                               | Valor                               |
| ----------------------------------- | ----------------------------------- |
| Versión y commit del plan aprobado  |                                     |
| Secuencia de firma aplicada         |                                     |
| Estado de G1 al cerrar el acto      | Abierta / Cerrada en acto separado  |
| Fecha y lugar del acto              |                                     |
| Participantes                       |                                     |
| Medio de convocatoria o acta        |                                     |
| Responsable de archivar esta hoja   |                                     |
| Enlace al acta o correo de respaldo |                                     |
| Anexos                              | Evidencia T-04, acta y hoja firmada |

## 8 Pendientes diferidos

Esta sección es un índice de lo que queda abierto; no sustituye las condiciones de §5. Si un pendiente impide la aprobación, se registra como condición en §5.

| Pendiente                                                                                                                   | Dueño       | Prioridad   | Fecha       | Dónde se registra      |
| --------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------- | ----------- | ---------------------- |
| Plan o licencia de las herramientas de IA                                                                                   | [Completar] | [Completar] | [Completar] | T-07 / §4              |
| Autorización de titulares y finalidad                                                                                       | [Completar] | [Completar] | [Completar] | D-05 / §9 del plan     |
| Retención y acceso al historial                                                                                             | [Completar] | [Completar] | [Completar] | §3.1 / §10 del plan    |
| Capacidad del equipo confirmada                                                                                             | [Completar] | [Completar] | [Completar] | §3.1 / §6.1 del plan   |
| Área de solicitante y dueño funcional                                                                                       | [Completar] | [Completar] | [Completar] | §2                     |
| Responsable de transcripción                                                                                                | [Completar] | [Completar] | [Completar] | §6                     |
| Registrar la evidencia T-04 en `docs/verification.md` y enlazarla                                                           | [Completar] | [Completar] | [Completar] | §1 / §6                |
| Tarjetas de los hallazgos (T-08 y T-09 propuestas)                                                                          | [Completar] | [Completar] | [Completar] | §6                     |
| Brechas de §2.1 no cubiertas por R-01 a R-05                                                                                | [Completar] | [Completar] | [Completar] | §3.4                   |
| G1: aceptación del alcance (negocio y Sistemas)                                                                             | [Completar] | [Completar] | [Completar] | §5                     |
| Indicadores de §11 (Tiempo de ciclo, Entrega aceptada, Fallos de cambio, Restauración del servicio, Control y trazabilidad) | [Completar] | [Completar] | [Completar] | Tablero / §11 del plan |
| Vista consolidada (Control Tower) y fecha de actualización                                                                  | [Completar] | [Completar] | [Completar] | §11 del plan           |
| Otro: [Completar]                                                                                                           | [Completar] | [Completar] | [Completar] | [Completar]            |

> Los indicadores de §11 se definen con el tablero (T-03) y no bloquean esta aprobación.
