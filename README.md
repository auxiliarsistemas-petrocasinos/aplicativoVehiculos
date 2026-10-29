# aplicativoVehiculos

Demostración funcional de gestión de flota de Petrocasinos, desarrollada desde cero. **Stack aprobado:** Next.js App Router + TypeScript, Tailwind CSS + shadcn/ui, Recharts y Supabase Auth/PostgreSQL/Storage. Los requisitos v0.3 y la arquitectura v0.1 se conservan en `docs/`; sus asuntos PROPUESTO/PENDIENTE no se presentan como política aprobada.

**Solo datos ficticios. No habilitado para operación real.** Catálogo, reglas críticas PESV, tratamiento de datos, documentación legal y procedimientos excepcionales requieren validación empresarial. No se ha desplegado.

## Qué incluye

Login por alias, contraseña visible/oculta, cambio inicial obligatorio en Auth/DB, perfiles por rol, creación/restablecimiento administrativo, campos, vehículos, documentos, restricciones, traslados con historial, autoevaluación, inspecciones versionadas, fotos privadas, firma dibujada, apertura/entrega/cierre, incidencias/seguimiento, sustitución autorizada en el mismo turno, regularización con retención, historial, dashboard Recharts y CSV. Formularios conectados a persistencia real; no hay datos estáticos sustituyendo servicios.

Consulta [entorno de desarrollo](docs/development.md), [guía de contribución](CONTRIBUTING.md), [preparación de Supabase/Vercel](docs/deployment.md), [resultados y límites](docs/verification.md), [formularios](docs/forms-specification.md), [decisiones](docs/decisions/001-implementation.md), [modelo y RLS](docs/data-model.md) e [indicadores](docs/analytics.md).

El fundamento de los pasos 2–5 se documenta en [validación del producto](docs/product-validation.md),
[línea base de rendimiento](docs/baseline-performance.md) y
[seguridad y gobierno de datos](docs/security-data-governance.md). Las decisiones empresariales
pendientes no se presentan como implementadas.

## Preparación estándar

Requiere Node.js 24.22.1 y npm 11.19.1, declarados en `.nvmrc` y `package.json`. Docker solo es necesario para las pruebas con Supabase local.

```bash
npm ci
npm run db:start
cp .env.example .env.local
```

Configura en `.env.local` la URL y clave publicable de Supabase local, `SUPABASE_SECRET_KEY` solo para servidor y `AUTH_RATE_LIMIT_SECRET` aleatorio. Obtén los valores desde tu entorno de Supabase y guárdalos en el gestor privado de variables; no pegues claves en Git, prompts ni logs. `.env*` está ignorado salvo `.env.example`.

```bash
npm run db:reset
npm run bootstrap
npm run seed:demo
npm run seed:scale
npm run dev
```

`db:reset` destruye datos **locales**: úsalo solo en un entorno de prueba nuevo. Aplica las diez migraciones y `supabase/seed.sql`. El bucket privado `evidence` y sus políticas se crean en migración. `bootstrap` requiere `BOOTSTRAP_EMAIL`, `BOOTSTRAP_ALIAS` y una `BOOTSTRAP_PASSWORD` temporal segura definida por el operador; solo funciona si no existe IT. Obliga a cambiar la clave. El seed de cuentas requiere `DEMO_PASSWORD` privada, es solo local y crea `demo.conductor`, `demo.conductor.s`, `demo.horizonte`, `demo.administrador`, `demo.gerencia` y `demo.sistemas`, todos con cambio obligatorio. Los dos campos y tres vehículos del seed son ficticios.

Abrir `http://localhost:3000`. El despliegue de prueba en Supabase/Vercel fue autorizado el 12 de octubre de 2026; está pendiente de disponer de las conexiones y proyectos remotos. Ver `docs/deployment.md`.

## Alternativa local para Docker con poco disco

En el entorno de esta tarea Supabase CLI no pudo extraer su imagen de PostgreSQL por falta de espacio con el driver VFS. Se incluye un entorno de integración liviano con **PostgreSQL 17, GoTrue, PostgREST y Supabase Storage reales**, sin Studio/SMTP/Realtime/servicios opcionales:

```bash
# Requiere no tener .env.local previo; nunca sobrescribe configuración existente.
node scripts/local-services.mjs
# En otra terminal, mantener en ejecución:
node scripts/local/gateway.mjs
# Cuando Auth y Storage estén listos:
node scripts/local-migrate.mjs
npm run seed:demo
npm run dev
```

El script genera credenciales aleatorias en `.env.local` y archivos privados ignorados en `.local/`, sin imprimirlas. Usa puertos de localhost 54321–54333 y contenedores `vehicles-*`. La contraseña fija de PostgreSQL en `scripts/local/init.sql` pertenece exclusivamente a esta infraestructura desechable en localhost; ninguna cuenta del aplicativo lleva contraseña fija. No usar este gateway ni configuración como despliegue productivo. La instancia estándar de Supabase se configura por separado.

Los scripts alternativos están pensados para base nueva. Tras completar las pruebas se pueden detener los cuatro contenedores propios con `docker stop vehicles-db vehicles-auth vehicles-rest vehicles-storage` y cerrar el gateway. No eliminan imágenes ni otros contenedores.

## Pruebas y compilación

```bash
npm run verify
npm run format:check
npm run audit:prod
npm run test:e2e:install
npm run test:e2e:access
npm run test:integration
npm run test:e2e
```

`verify` ejecuta formato, lint, generación y verificación de tipos, pruebas unitarias y build de producción. `audit:prod` rechaza vulnerabilidades altas o críticas en dependencias que llegan a producción. El E2E de acceso no necesita Supabase y también se ejecuta en CI.

Con la pila local activa, `types:generate` regenera `lib/database.types.ts` y
`types:check` comprueba que el archivo versionado coincide. `evidence:reconcile` solo simula la
reconciliación; `-- --apply` realiza cambios y permanece bloqueado para destinos remotos salvo
autorización explícita.

Integración requiere `.env.local` local, migraciones, seed, `DEMO_PASSWORD` y `TEST_PASSWORD` privadas; crea cuentas/vehículos ficticios aislados por ejecución. Comprueba Auth, permisos, SQL/RLS, Storage, evidencia, concurrencia, idempotencia y ciclo de turno. Nunca apuntar estos scripts a producción: rechazan destinos distintos de localhost.

Playwright usa por defecto su Chromium administrado. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permite seleccionar opcionalmente un navegador del sistema sin asumir rutas distintas entre Windows y Linux. Incluye escritorio y tamaños Pixel 7/iPhone 13. Son emulaciones de tamaño/interacción en Chromium; no certifican dispositivos físicos ni Safari. Las pruebas de recorrido se omiten explícitamente si falta la configuración de integración; las pruebas básicas de acceso siguen disponibles.

`npm run build` genera salida standalone para servidor Node. `npm start` prepara los activos estáticos y ejecuta ese servidor; usa `APP_HOST` si necesitas cambiar la interfaz de escucha. No se depende de APIs de Vercel. Para llevar la salida standalone a otro host, copiar también `.next/static` y `public/` si existe, configurar variables y proxy HTTPS. Para probar la compilación local, mantén `npm start` en una terminal y ejecuta `npm run test:e2e` en otra: Playwright reutiliza el servidor disponible en el puerto 3000. No se han validado Docker de producción, copias, SMTP ni infraestructura empresarial.

## Seguridad y operación pendiente

No usar la clave de servicio en el navegador. No habilitar signup público ni recuperación autogestionada por correo al configurar Auth externo. El producto no ofrece recuperación por correo; el proveedor debe configurarse para evitar flujos alternativos de recuperación. La configuración de un proyecto administrado, sus políticas SMTP/CAPTCHA/rate limit y el bloqueo de endpoints de recuperación deben revisarse antes de uso real.

La clave privilegiada solo sirve a cuentas y scripts técnicos. Las acciones de flota, los informes y Storage usan identidad del usuario y RLS. Los registros confirmados no se editan. Regularizar no libera la unidad. La corrección de odómetro es una actuación nueva visible junto al original; su aplicación a indicadores queda pendiente. El borrador requiere guardado explícito en servidor. No hay GPS, sincronización offline ni módulo integral de combustible/mantenimiento.

No se versionan documentos originales, extracciones, credenciales ni datos reales. El catálogo digital tiene 245 referencias saneadas, seis preguntas de fatiga y 56 controles de inspección; requiere ratificación PESV. Los originales solo estuvieron en el directorio de adjuntos, fuera del repositorio.

El trabajo ordinario parte de `develop` y vuelve mediante pull request. `main` recibe únicamente promociones revisadas desde `develop`; no se realizan pushes directos. Mensajes de commit en inglés; interfaz y documentación en español.
