# Despliegue de prueba en Supabase y Vercel

## Estado confirmado

El usuario autorizó el despliegue de prueba el 12 de octubre de 2026. El código se conserva en `develop`; `main` no se modifica. En esta sesión se confirmó acceso a GitHub, pero no hay herramientas, tokens, proyectos vinculados ni identidades disponibles para Supabase/Vercel. La base de `.env.local` corresponde a localhost y no sirve como backend de Vercel. No se ha comprobado una URL publicada ni el estado de una base remota. El usuario identificó Supabase `rxfkllwpyxvvziaezzca` y Vercel `auxiliar-sistemas-projects/aplicativovehiculos`; estos identificadores son públicos y no constituyen credenciales. Las menciones a los plugins no han expuesto herramientas invocables en esta sesión. La API de estados de GitHub también respondió `Forbidden`, mientras Git fetch/push sí están disponibles.

## Preparación realizada

La carga binaria de fotografías y firmas se realiza directamente desde el navegador a Supabase Storage con el JWT del conductor. La aplicación recibe únicamente un recibo JSON pequeño, para evitar el límite de tamaño de peticiones de Vercel Functions. El servidor descarga la carga privada usando la identidad del conductor, valida tamaño, MIME y cabecera binaria y registra la evidencia mediante RPC idempotente. No se expone la clave de servicio ni se confirma una imagen por el solo éxito de su subida.

La novena migración, `202610120001_staged_evidence.sql`, permite leer una carga todavía no asociada únicamente a su propietario durante su turno operativo. Gerencia, administradores, otros conductores y `anon` no obtienen lectura de estos archivos. Las reglas de lectura histórica siguen vigentes. Un error anterior al registro puede dejar un objeto sin metadatos: la reconciliación de estos objetos continúa pendiente y no se declara resuelta.

`.vercelignore` excluye secretos locales, datos de prueba, resultados y formatos originales de una subida con CLI. `.vercel/` está ignorado en Git. Next.js se detecta como framework sin necesitar una configuración especial de rutas ni convertir la aplicación a exportación estática.

## Comprobaciones ejecutadas del ajuste

- PASS: typecheck, lint, build de producción y 18 unitarios.
- PASS: 23 integraciones con Auth/PostgreSQL/Storage reales; se añadió lectura de carga no asociada propia y denegación a otros roles/anon.
- PASS: los tres recorridos de conductor en escritorio/Android/iPhone emulados, incluyendo una carga de más de 5 MB, recibos JSON menores de 4 KB y rechazo de contenido falso sin registrar evidencias.
- La primera ejecución de navegador falló porque el gateway local no tenía CORS para el navegador. Se corrigió exclusivamente para los orígenes localhost del entorno de prueba y se repitió con resultado PASS. El gateway anterior no pudo reiniciarse por permisos del proceso; el ensayo usó el puerto local alternativo 54521. No se modificó ninguna infraestructura remota.
- NOT RUN: migraciones en Supabase administrado, configuración de Auth remoto/variables Vercel, bootstrap remoto, despliegue y recorridos sobre HTTPS público. Faltan herramientas o tokens de los proveedores disponibles para esta sesión.

## Supabase remoto

Usar un proyecto exclusivo para pruebas y verificar antes que no contiene tablas o políticas incompatibles. No ejecutar `db reset` contra un proyecto remoto. Configurar `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` y el identificador de proyecto en el entorno privado para CLI, o habilitar el conector de Supabase correspondiente.

Con Supabase CLI autenticado:

```bash
npx supabase link --project-ref IDENTIFICADOR_DEL_PROYECTO
npx supabase db push --linked
```

Aplicar las nueve migraciones en orden. El bucket privado `evidence`, su límite de 8 MB, los MIME admitidos y las políticas se crean mediante migraciones. Verificar los permisos reales sobre `auth.users`, el trigger de cambio de contraseña, las tablas de sesiones y Storage en el servicio administrado; las pruebas locales no certifican esos permisos remotos.

Deshabilitar registro público y cuentas anónimas; usar contraseña mínima de 12 caracteres. Configurar Site URL y redirect URLs para el dominio exacto de pruebas. Mantener el restablecimiento administrativo y revisar los endpoints alternativos de recuperación del proveedor; no asumir que ocultar una opción en la UI los deshabilita.

El bootstrap inicial necesita correo, alias y clave temporal elegidos por el operador en un archivo privado separado. No subir ese archivo a Git ni a Vercel. `scripts/bootstrap.mjs` crea IT únicamente cuando no hay otra cuenta IT y obliga a cambiar la contraseña. No ejecutar `seed:demo` remoto: ese script está limitado a localhost. La carga de datos ficticios remotos debe prepararse explícitamente para el proyecto de prueba identificado.

## Vercel

Importar `auxiliarsistemas-petrocasinos/aplicativoVehiculos`, seleccionar Next.js y la raíz del repositorio, y desplegar la revisión autorizada de `develop` a un proyecto de pruebas. Usar `npm ci` y `npm run build`. No promover `main` ni reutilizar un backend empresarial con datos reales.

Configurar en Vercel, para el entorno de pruebas elegido:

| Variable                               | Uso                                                             |
| -------------------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL HTTPS del proyecto remoto de prueba.                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable del mismo proyecto; visible para el navegador. |
| `SUPABASE_SECRET_KEY`                  | Clave privilegiada del mismo proyecto, solo servidor.           |
| `AUTH_RATE_LIMIT_SECRET`               | Secreto aleatorio para HMAC, solo servidor.                     |

No publicar tokens de administración de Supabase/Vercel, claves de bootstrap ni contraseñas de pruebas como variables públicas. Configurar los valores `NEXT_PUBLIC_*` antes de compilar; un cambio de backend exige nueva compilación. Mantener inicialmente protección de despliegue de pruebas según acceso del equipo, y comprobar que los participantes pueden abrir el dominio.

## Verificación al disponer de conexiones

Confirmar migraciones y RLS en el proyecto seleccionado; realizar bootstrap seguro; comprobar login/cambio de clave, denegación a `anon`, apertura, foto de más de 4,5 MB, firma, incidencia, cierre y CSV por rol sobre HTTPS. Comprobar que la asociación de una imagen falsa o ajena se rechaza. Registrar URL, proyecto, revisión de Git, resultados y límites sin copiar credenciales. No apuntar los scripts destructivos locales a un backend remoto; preparar casos aislados para el proyecto de pruebas.

La validación oficial PESV y la autorización para operar con datos reales siguen pendientes. Esta autorización permite publicar la demostración para pruebas.
