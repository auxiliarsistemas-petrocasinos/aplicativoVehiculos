# Guía de contribución

## Estado y alcance

El aplicativo es un MVP con datos ficticios y no está habilitado para operación real. Antes de modificar reglas de negocio, permisos, formularios, integraciones o políticas de datos, la decisión debe estar aprobada y documentada.

## Ramas

- `main`: versión estable y revisada.
- `develop`: integración del trabajo aprobado.
- Ramas de cambio: crear desde `develop` con un nombre corto y descriptivo, preferiblemente bajo `codex/` para trabajo realizado con Codex.

No realizar pushes directos a `main`. Los cambios deben llegar mediante pull request y superar CI. La promoción de `develop` a `main` se realiza en un pull request independiente después de validar la entrega.

## Preparación

1. Instalar la versión de Node declarada en `.nvmrc` y una versión de npm compatible con `package.json`.
2. Ejecutar `npm ci`.
3. Copiar `.env.example` a `.env.local` solo si el trabajo requiere Supabase local.
4. No versionar credenciales, contraseñas, documentos originales ni datos reales.

## Comprobaciones obligatorias

Antes de abrir o actualizar un pull request:

```bash
npm run verify
npm run audit:prod
npm run test:e2e:access
```

La prueba E2E necesita Chromium. Se instala una vez con:

```bash
npm run test:e2e:install
```

Las pruebas de integración y recorridos persistentes requieren el entorno local documentado, `.env.local` y datos ficticios. Una prueba omitida no debe presentarse como aprobada.

## Pull requests

El pull request debe indicar:

- objetivo y alcance;
- archivos o módulos afectados;
- comprobaciones ejecutadas y resultado;
- comprobaciones no ejecutadas y motivo;
- asuntos pendientes o riesgos conocidos.

Los mensajes de commit se redactan en inglés. La interfaz, documentación y explicaciones del proyecto se mantienen en español.
