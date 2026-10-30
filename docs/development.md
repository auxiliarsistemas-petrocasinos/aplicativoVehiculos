# Entorno de desarrollo

## Runtime reproducible

El proyecto fija Node.js en `.nvmrc` y restringe Node/npm mediante `package.json`. GitHub Actions utiliza el mismo archivo. Si se actualiza el runtime, deben cambiarse ambos archivos y repetirse toda la matriz de verificación.

```bash
node --version
npm --version
npm ci
```

`npm ci` es el mecanismo estándar. No editar manualmente `package-lock.json` ni usar `npm audit fix --force`.

## Verificación sin Supabase

```bash
npm run verify
npm run audit:prod
npm run test:e2e:install
npm run test:e2e:access
```

`verify` ejecuta lint, TypeScript, unitarios y build. `test:e2e:access` verifica login público, protección de rutas y diseño en escritorio, Pixel 7 e iPhone 13 emulados con Chromium.

Playwright usa el Chromium administrado por el paquete. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` es una sobrescritura opcional para entornos que administran su propio navegador; nunca se presupone una ruta de Linux en Windows.

## Verificación con Supabase local

La preparación estándar y la alternativa liviana están descritas en el `README.md`. Las pruebas persistentes requieren `.env.local`, migraciones, seed y contraseñas ficticias privadas:

```bash
npm run test:integration
npm run test:e2e
```

Los scripts de integración rechazan destinos que no sean localhost. No apuntarlos a Supabase administrado ni producción.

## Integración continua

El workflow `.github/workflows/ci.yml` se ejecuta para pull requests y pushes a `develop` o `main`. Contiene tres controles independientes:

1. calidad, unitarios y build;
2. auditoría de dependencias de producción;
3. E2E básico sin secretos.

Las pruebas integrales de Supabase no se ejecutan todavía en CI porque requieren un servicio aislado y una estrategia de secretos específica. Su ausencia debe permanecer explícita hasta implementar ese entorno.

## Flujo de ramas

El trabajo ordinario parte de `develop` y vuelve mediante pull request. `main` recibe únicamente promociones revisadas desde `develop`. La disponibilidad de reglas automáticas de protección depende del plan de GitHub; si no están habilitadas, este flujo sigue siendo la política del proyecto.
