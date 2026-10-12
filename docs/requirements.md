# aplicativoVehiculos — Especificación funcional consolidada (borrador v0.3)

**Estado:** BORRADOR PARA REVISIÓN. No es una autorización de implementación ni de puesta en producción.<br>
**Proyecto:** aplicativoVehiculos, Petrocasinos<br>
**Repositorio de referencia:** `auxiliarsistemas-petrocasinos/aplicativoVehiculos`<br>
**Fecha de consolidación:** 2026-10-11
**Objetivo:** reunir las decisiones funcionales de las conversaciones y señalar expresamente los asuntos pendientes, para elaborar posteriormente instrucciones de desarrollo verificables para Codex Cloud.

## Convenciones de decisión

- **CONFIRMADO:** declarado y aprobado por el responsable del proyecto durante la conversación.
- **PROPUESTO:** diseño recomendado, aún sujeto a revisión o aprobación.
- **PENDIENTE:** dato o regla que falta validar, en especial cuando afecta la seguridad operacional o las obligaciones del PESV.
- **FUENTE DOCUMENTAL:** contenido constatado en los formatos facilitados, que no equivale por sí mismo a una política digital aprobada.

## 1. Propósito, usuarios y límites

**CONFIRMADO:** desarrollar desde cero una aplicación web de gestión de flota, de uso principalmente móvil (Android y iPhone), sencilla para conductores de distintos niveles de experiencia digital. Debe servir al conductor en sus turnos y al coordinador para conocer la operación, novedades y trazabilidad; Gerencia debe consultar indicadores y generar informes. La empresa opera alrededor de 25 a 30 campos, cada uno con conductores y vehículos; ambas asignaciones pueden cambiar por decisión administrativa.

**CONFIRMADO:** se pretende presentar una primera versión integral y funcional a responsables de Petrocasinos en un plazo orientativo cercano a cinco días, utilizando inicialmente Vercel y Supabase con conexión a internet. La migración posterior a infraestructura empresarial debe tenerse presente desde el diseño; no se implementará sincronización sin conexión en esta primera presentación.

**CONFIRMADO:** no se reutilizarán código, archivos, bases de datos ni arquitectura de una versión anterior. Se tendrán en cuenta los problemas de su apariencia, navegación, interacción y mantenimiento, pero sin importar sus activos.

**FUERA DEL ALCANCE INICIAL:** GPS, seguimiento físico en tiempo real, funcionamiento offline/sincronización híbrida, módulo integral de mantenimiento o finanzas, y definición exhaustiva de informes no suministrados. El módulo de informes podrá mostrar capacidades iniciales, pero sus formatos oficiales se definirán posteriormente.

## 2. Roles y control de acceso

| Capacidad | Conductor | Administrador de vehículos | Gerencia | Superadministrador IT |
|---|---|---|---|---|
| Ver su dashboard | Personal | Global | Global | Global |
| Consultar vehículos | Solo los autorizados de su campo | Todos | Todos | Todos |
| Gestionar campos y vehículos | No | Crear y editar | Solo lectura | Administración completa |
| Registrar y consultar turnos | Propios | Consulta de todos; regularización excepcional | Consulta autorizada | Administración controlada |
| Registrar incidencias | Propias durante su turno | Gestionar, seguir y resolver | Consultar | Gestionar |
| Autorizar y asignar vehículo sustituto | No | Sí | No | Sí |
| Gestionar traslados de vehículos y conductores | No | Sí | Consulta | Sí |
| Crear cuentas de conductor | No | Sí | No | Sí |
| Crear cuentas de administrador, Gerencia o superadmin | No | No | No | Sí |
| Generar/exportar informes | Sin definir para el rol; no requeridos inicialmente | Sí | Sí | Sí |
| Eliminar registros | No | No | No | Solo con procedimiento controlado y auditoría |

**CONFIRMADO:** el administrador de vehículos gestiona toda la operación, pero no elimina registros ni otorga privilegios administrativos. Solo el superadministrador de IT crea roles de administrador, Gerencia y superadministrador. Gerencia consulta información operativa e informes, sin editar.

**PROPUESTO (seguridad):** separar los datos de operación de las respuestas potencialmente sensibles del cuestionario del conductor. El acceso a respuestas sobre salud o medicamentos no debe deducirse automáticamente de la expresión “ver todo”. Ningún rol puede consultar contraseñas en texto claro ni secretos de infraestructura.

**CONFIRMADO:** el administrador crea una cuenta con nombres, apellidos, correo, teléfono, campo, rol conductor y una contraseña temporal que comunica al usuario. En el primer acceso debe cambiarla obligatoriamente.

**PROPUESTO (seguridad):** permitir generar contraseñas iniciales aleatorias, no usar cédulas como contraseñas, almacenar únicamente mediante el proveedor de autenticación y forzar efectivamente el cambio antes de acceder a la operación. Las operaciones privilegiadas de usuarios se ejecutarán en el servidor.

**CONFIRMADO:** el identificador de inicio de sesión será un nombre de usuario con formato `nombre.apellido`, no el correo electrónico. El correo seguirá siendo un dato de la cuenta. El usuario será único dentro del sistema.

**CONFIRMADO:** ante la coincidencia de `nombre.apellido` de dos personas, se añadirá un tercer segmento con una inicial; por ejemplo, `nombre.apellido.g` cuando la inicial del segundo apellido sea `g`.

**CONFIRMADO:** la inicial del tercer segmento corresponde al **segundo apellido**, no al segundo nombre. **PENDIENTE:** definir nuevas colisiones cuando coincida también la inicial, nombres compuestos y ausencia de segundo apellido. **PROPUESTO:** normalizar mayúsculas, acentos y espacios para detectar alias duplicados.

**CONFIRMADO:** no habrá recuperación de contraseña autogestionada para esta versión. El usuario informará de la pérdida de acceso por un canal externo al aplicativo, y un administrador habilitado restablecerá la contraseña; el usuario deberá establecer una nueva en su siguiente acceso. Esto no autoriza al administrador a consultar la contraseña anterior.

**PROPUESTO (seguridad):** el administrador de vehículos restablece contraseñas solo de conductores y el superadministrador gestiona cuentas privilegiadas. Antes de restablecer, se debe verificar la identidad por un procedimiento aprobado; quedan pendientes el método de comunicación de la contraseña temporal y el protocolo exacto de verificación.

**CONFIRMADO (interfaz):** el campo de contraseña del inicio de sesión incluirá un control de ojo para mostrar u ocultar temporalmente el texto digitado; por defecto debe aparecer oculto. Esta función no debe registrar ni exponer el valor en logs. La pantalla de cambio obligatorio de contraseña debe ofrecer el mismo control cuando resulte útil.

## 3. Campos y personas

**CONFIRMADO:** el campo es la unidad básica de organización. El administrador de vehículos administra todos los campos; cada campo puede tener varios conductores y varios vehículos. Los conductores solo pueden seleccionar vehículos de su campo autorizado. El administrador puede trasladar conductores y vehículos entre campos; el conductor no puede hacer ese traslado administrativo.

**PROPUESTO:** cada traslado conserva origen, destino, fecha, responsable y motivo, sin alterar el campo histórico de los turnos pasados. Los cambios de campo de vehículos o conductores con turnos vigentes deben someterse a una validación específica.

**CONFIRMADO:** estados del conductor separados en vinculación **Activo / Inactivo** y situación operativa **En turno / Fuera de turno**. La situación operativa se determina a partir del estado de sus turnos; no debe editarse independientemente.

**PENDIENTE:** política exacta de traslados simultáneos o temporales; permisos adicionales de visualización cuando un conductor cambia de campo.

## 4. Vehículos y disponibilidad

**CONFIRMADO:** la flota incluye vehículos **livianos y pesados**; todos tienen **placa y odómetro (kilometraje)**. La propiedad de las unidades (propias/terceros) sigue **PENDIENTE**.

**PROPUESTO:** ficha por placa única normalizada e identificador interno permanente, con marca, línea/modelo, año, tipo, campo actual, odómetro, documentación, fotografía opcional, historial de turnos, inspecciones, incidencias, restricciones y traslados.

Tres dimensiones independientes:

1. **Administrativa (CONFIRMADO):** Activo / Inactivo.
2. **Utilización (CONFIRMADO):** En uso / Fuera de uso; derivada de recepciones y entregas vigentes.
3. **Aptitud (CONFIRMADO):** Apto / Apto con observaciones / No apto.

**CONFIRMADO:** mantenimiento es un motivo o contexto de indisponibilidad, no un cuarto estado de aptitud. Las incidencias o observaciones no cambian indiscriminadamente la aptitud; el administrador gestiona esa clasificación.

**CONFIRMADO:** habrá **restricción preventiva automática** ante condiciones críticas **definidas previamente y validadas**. Tal restricción no impide reportar incidencias, registrar entregas o cerrar turnos. Mientras no exista una lista aprobada de condiciones críticas, **NO** se deben inventar umbrales ni tratar las respuestas del checklist como una política ya validada.

**PROPUESTO:** separar la restricción preventiva del valor de aptitud, registrar quién la levantó y con qué justificación; impedir nuevas asignaciones cuando exista restricción activa, sin anular una utilización o un turno histórico.

**PENDIENTE / SEGURIDAD:** catálogo oficial de condiciones críticas, tratamiento de documentación obligatoria vencida, procedimiento autorizado de liberación y criterio de disponibilidad cuando faltó una inspección de entrega. Debe validarse con coordinador y responsable del PESV antes de pruebas operativas reales.

## 5. Ciclo de vida de turnos

### 5.1 Apertura normal (CONFIRMADO)

1. El conductor autenticado elige **Iniciar turno**.
2. Selecciona un vehículo disponible **de su campo**.
3. Diligencia la **autoevaluación del conductor**.
4. Diligencia el **checklist de recepción del vehículo**, kilometraje, observaciones y evidencias requeridas.
5. Realiza la **firma dibujada en pantalla** como confirmación de apertura.
6. Una vez guardada y confirmada toda la información, el turno pasa a **Activo**. Antes de este punto está **En apertura**.

La firma es constancia asociada a la cuenta autenticada, no prueba biométrica concluyente ni firma digital certificada.

### 5.2 Durante el turno (CONFIRMADO)

- El conductor puede reportar incidencias del vehículo utilizado.
- Cada incidencia exige **descripción** y **al menos una fotografía** para quedar formalmente registrada.
- El reporte queda asociado a turno, conductor y vehículo; el administrador consulta y da seguimiento.
- La presencia de incidencias pendientes **no impide** completar el cierre del turno.

### 5.3 Cambio autorizado de vehículo (CONFIRMADO)

1. El conductor registra la novedad que motiva la revisión.
2. El administrador evalúa y **selecciona/asigna** el vehículo sustituto.
3. El conductor completa **inspección de entrega** del vehículo anterior.
4. El conductor completa **inspección de recepción** del sustituto.
5. Continúa **el mismo turno**, pero con un nuevo período de uso; se conservan por separado ambas relaciones vehículo-turno.

**PROPUESTO:** no repetir automáticamente el cuestionario de fatiga por cada sustitución, salvo nueva indicación del responsable operativo. Confirmar en el servidor el cambio autorizado y las restricciones del sustituto antes de completar la operación.

### 5.4 Cierre normal (CONFIRMADO)

1. El conductor inicia el proceso de cierre (**En cierre**).
2. Completa la inspección de entrega, kilometraje, observaciones y fotografías obligatorias.
3. Confirma **Finalizar turno**.
4. El sistema conserva los datos originales de recepción y entrega; el turno queda **Cerrado**.

Una incidencia pendiente no bloquea estos pasos. Cerrar la aplicación o cerrar sesión **no equivale** a cerrar el turno.

### 5.5 Turnos olvidados o sin cerrar (CONFIRMADO)

- El conductor puede regresar al aplicativo y **completar su cierre pendiente**.
- El administrador puede ejecutar **regularización administrativa excepcional** cuando el conductor no puede completarlo.
- La regularización debe exigir justificación, fecha/hora real de la actuación, identidad del responsable y auditoría.
- **No se inventan firmas, cuestionarios, inspecciones, kilometrajes ni evidencias faltantes.** Los faltantes deben seguir visibles como faltantes.
- No se permitirá que un conductor opere dos turnos activos simultáneos ni que un mismo vehículo figure recibido simultáneamente por dos conductores.

**PROPUESTO:** diferenciar `Cerrado` de `Cerrado administrativamente / Regularizado`; exigir que la liberación de un vehículo sin entrega comprobada sea una decisión separada y auditada, no una consecuencia automática del cierre excepcional. Mantener estado detallado `En apertura`, `Activo`, `En cierre`, `Cerrado`, `Regularizado`. Estos nombres son etiquetas propuestas.

**PENDIENTE:** determinar qué documentación mínima se exige para regularizar y quién puede resolver una entrega física no comprobada; no convertir la regularización administrativa en certificación de aptitud o entrega.

## 6. Formularios consolidados y evidencias

**CONFIRMADO:** el sistema manejará dos formularios principales:

- **Estado del conductor:** se responde al iniciar cada turno, basado en `GA FO 09 Check List Control de Fatiga PESV.xlsx` (seis preguntas Sí/No en el formato facilitado). Sus consecuencias por respuesta siguen pendientes de validación.
- **Inspección del vehículo:** formulario consolidado por categorías, basado en `GA FO 17 Inspección periódica de vehículos PESV.xlsx` y fuentes adicionales de inspección; se reutiliza para **recepción y entrega**, tanto normal como en cambio de vehículo. El Word fuente `GA FO 20 Chequeo Vehicular PESV.docx` no se incluye porque contiene datos reales de un vehículo.

**CONFIRMADO:** en cualquier ítem de inspección marcado **Regular** o **Malo**, son **obligatorias tanto una observación como una fotografía**. La escala propuesta del formulario vehicular es Bueno / Regular / Malo / No aplica. La recepción y la entrega son registros independientes; no se sobrescriben respuestas históricas. Los controles se adaptarán a vehículo liviano/pesado.

**FUENTE DOCUMENTAL:** `GA FO 13 Control Kilometraje y Combustible PESV.xlsx` contiene kilometraje inicial/final e información de tanqueos; se utilizará como referencia para las lecturas y un eventual registro operativo de combustible, sin convertir cada tanqueo en requisito de apertura/cierre hasta definir ese flujo.

**PROPUESTO:** registrar fecha/hora del servidor, cuenta autenticada, tipo y versión del checklist, evidencias privadas almacenadas, referencias al vehículo y turno; validar peso/tipo de las fotografías. Las imágenes deben quedar persistidas antes de confirmar una inspección o incidencia.

**PENDIENTE:** contenido final del checklist consolidado, lista de pruebas obligatorias para vehículos pesados, respuestas críticas y tratamiento de condiciones de riesgo en el cuestionario del conductor; validación de la versión vigente del formato preoperacional y del responsable PESV. El expediente médico o respuestas sensibles no deben exponerse por defecto en paneles generales.

## 7. Incidencias y seguimiento

**CONFIRMADO:** incidentes abiertos durante turno activo requieren descripción y foto; se registran con contexto del vehículo. El administrador los atiende y puede solicitar o autorizar sustitución. El historial del incidente continúa después de cerrar el turno.

**PROPUESTO:** estados Pendiente de revisión / En seguimiento / Resuelta; prioridad separada (por definir), acciones con autor/fecha/observaciones, filtros por campo, vehículo, fecha, categoría y estado. Un cambio de vehículo no resuelve por sí mismo la incidencia.

**PENDIENTE:** categorías y prioridades oficiales, medidas extraordinarias para incidentes graves y modo de contacto cuando fotografiar no sea seguro. El aplicativo no debe incentivar fotografiar mientras se conduce; la comunicación urgente por medios corporativos deberá poder hacerse sin depender de completar primero el reporte digital.

## 8. Dashboard y navegación

**CONFIRMADO:** aplicación responsive, **mobile-first** para conductores, con navegación simple y controles táctiles; dashboard distinto por rol. El coordinador y Gerencia requieren estadísticas variadas e interactivas, no solamente cifras estáticas.

**PROPUESTO:**

- **Conductor:** Inicio, Mi turno, Historial, Perfil; acción contextual «Iniciar», «Continuar» o «Cerrar». Indicadores personales limitados.
- **Administrador:** tablero global de turnos activos, vehículos en uso, incidencias pendientes, vehículos restringidos, detalle por campo; acceso a gestión de campos, vehículos, conductores, traslados e incidencias.
- **Gerencia:** mismo panorama y gráficos operativos, exclusivamente lectura y generación/exportación de informes autorizados.
- **IT:** facultades administrativas y configuración técnica, sin acceso innecesario a información sensible.
- **Gráficos:** barras, líneas, dona, comparaciones temporales y tablas filtrables; cada indicador debe poder profundizar hasta registros sustentantes.

**CONFIRMADO (stack):** Next.js + TypeScript, Tailwind CSS, shadcn/ui, Recharts y Supabase Auth/PostgreSQL/Storage; aplicación y operaciones de servidor en **monolito modular Next.js**, despliegue inicial en Vercel + Supabase y previsión de alojamiento propio. La implementación técnica concreta se recoge como propuesta en el borrador `arquitectura-tecnica-aplicativoVehiculos-v0.1.md`.

## 9. Seguridad, trazabilidad y calidad

**REQUISITOS DE DISEÑO PROPUESTOS PARA APROBACIÓN:**

1. Autenticación segura, cambio obligatorio de contraseña inicial, autorización por rol y verificación del acceso por campo **en el servidor y en políticas RLS**, no solo mediante la interfaz.
2. Ninguna llave privilegiada de Supabase ni secreto en frontend o repositorio.
3. Evidencias en almacenamiento privado, con permisos por objeto y acceso temporal cuando sea necesario.
4. Auditoría de cambios de rol, estados, traslados, autorizaciones, regularizaciones, correcciones de kilometraje y levantamientos de restricciones.
5. Integridad transaccional para evitar doble turno activo por conductor y doble asignación simultánea de vehículo.
6. Idempotencia/reconciliación de reintentos para evitar duplicados si falla la red después de guardar una operación.
7. No declarar «guardado» o «finalizado» sin confirmación del servidor; en esta entrega **no** se promete trabajo offline.
8. No editar silenciosamente inspecciones firmadas o ya completadas; las correcciones quedarán justificadas y trazables.
9. Datos ficticios en presentación y pruebas iniciales, hasta contar con autorización y controles para datos reales.
10. Diseñar implementación y configuración reproducibles pensando en migración futura a servidores propios; no dar por garantizada la migración automática desde los servicios gestionados.

## 10. Casos mínimos de aceptación (PROPUESTOS)

| ID | Escenario | Resultado que debe verificarse |
|---|---|---|
| CA-01 | Admin crea conductor con contraseña temporal | El conductor cambia contraseña en primer acceso; no puede otorgarse otro rol. |
| CA-02 | Conductor de campo A consulta vehículos | Solo aparecen y son seleccionables los autorizados del campo A, también en consultas directas. |
| CA-03 | Apertura normal | Solo queda Activo tras autoevaluación, inspección, evidencias y firma válidas. |
| CA-04 | Regular/Malo sin foto u observación | No permite finalizar la inspección; conserva las respuestas pendientes. |
| CA-05 | Incidencia sin foto o sin descripción | No marca el reporte como formalmente enviado. |
| CA-06 | Incidencia pendiente + cierre | Puede documentar la entrega y cerrar el turno; la incidencia conserva su estado. |
| CA-07 | Cambio autorizado A → B | Conserva ambas inspecciones y períodos de uso, con el mismo turno. |
| CA-08 | Cambio no autorizado | El conductor no logra ejecutar la operación desde la UI ni mediante solicitudes directas. |
| CA-09 | Dos conductores intentan recibir un vehículo | Solo puede existir una utilización vigente confirmada. |
| CA-10 | Conductor olvida cerrar turno | Puede reanudar su cierre sin crear otro turno activo. |
| CA-11 | Administrador regulariza excepcionalmente | Exige motivo y deja auditados faltantes; no genera firma ni inspecciones ficticias. |
| CA-12 | Restricción preventiva aprobada | Impide nuevas asignaciones y permite entregas y cierre; requiere reglas críticas validadas previamente. |
| CA-13 | Gerencia intenta modificar | Puede consultar y exportar informes autorizados, pero no alterar datos. |
| CA-14 | Un usuario intenta crear rol privilegiado | Solo el superadministrador puede hacerlo. |
| CA-15 | Fallo de red al registrar | La interfaz informa incertidumbre y recupera/reconcilia sin generar duplicados. |
| CA-16 | Prueba en Android/iPhone y escritorio | Formularios, firma, fotografías, navegación y gráficos son utilizables en tamaños reales de pantalla. |
| CA-17 | Usuario pulsa el ojo en el campo contraseña | Alterna entre texto oculto/visible sin cambiar la contraseña ni enviarla automáticamente. |
| CA-18 | Usuario pierde acceso | No hay recuperación autogestionada; el restablecimiento autorizado obliga a cambiar la contraseña temporal en el siguiente acceso. |
| CA-19 | Dos personas comparten `nombre.apellido` | Si el alias básico está ocupado se utiliza la inicial del **segundo apellido**; los casos de colisión adicional siguen pendientes de definir. |

## 11. Asuntos pendientes y prioridad

### Imprescindibles antes de una prueba con vehículos reales

1. **PESV:** reglas de riesgo del cuestionario del conductor, lista de elementos críticos, restricciones preventivas, responsabilidades y autorización para volver a operar.
2. **Excepciones:** procedimiento ante turnos regularizados sin entrega verificada y liberación administrativa de vehículos.
3. **Datos personales:** política de acceso, retención y tratamiento de información sensible de los conductores y evidencias fotográficas.
4. **Documentación legal:** reglas de documentos exigibles por tipo de vehículo y verificación de vigencias.

### Pueden resolverse sin bloquear un prototipo demostrativo con datos ficticios

5. Propiedad y vinculación de vehículos (propios, terceros o mixtos).
6. Definición de categorías y prioridades de incidencias y sus tiempos de atención.
7. Informes específicos y formatos oficiales que necesita el coordinador/Gerencia.
8. Resolver nuevas colisiones del alias cuando coincida la inicial del segundo apellido, casos de apellido compuesto o ausente; definir verificación de identidad y canal seguro para entregar o restablecer contraseñas temporales. La inicial del segundo apellido ya está **CONFIRMADA** y la recuperación autogestionada queda fuera del alcance inicial.
9. Detalle de los campos obligatorios de fichas de vehículos/campos y reglas de traslados temporales.
10. Aprobada la elección de **Next.js + TypeScript, Tailwind CSS, shadcn/ui, Recharts y Supabase**, con Vercel en la demostración y servidor propio como objetivo futuro. Quedan pendientes detalles de configuración y plan efectivo de migración.
11. Catálogo completo de preguntas consolidadas para livianos y pesados, con obligatoriedad por ítem.

## 12. Próximos entregables recomendados

1. Validar este borrador y marcar expresamente cada PROPUESTO aprobado o rechazado.
2. Crear una **especificación de formularios** pregunta por pregunta, usando los cinco formatos y anotando origen, tipo, opciones, regla y evidencia.
3. Cerrar matriz de estados y transiciones incluyendo regularización, sustitución y restricciones preventivas.
4. Revisar el borrador de arquitectura técnica `arquitectura-tecnica-aplicativoVehiculos-v0.1.md` y aprobar las decisiones propuestas que aún no sean vinculantes.
5. Preparar el **prompt maestro** de Codex con entregables verificables y tareas de control de calidad, priorizando funcionalidad real sobre pantallas simuladas.

---

**Actualización v0.3:** corregida la inicial del segundo apellido para alias duplicado e incorporado el stack aprobado; los demás requisitos permanecen como en v0.2.

**Control del borrador:** elaborado a partir de las decisiones expresadas y la revisión de los formatos aportados. Su publicación no autoriza despliegues ni el uso de datos reales.
