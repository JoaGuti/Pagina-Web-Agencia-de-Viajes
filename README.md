# Plantilla web para agencias de viajes

Sitio público animado con temática de isla tropical y panel de gestión para que la agencia cargue paquetes, ofertas, precios y reseñas sin depender de un programador.

- **Sitio público**: portada con video, postales de destinos, ofertas con cuenta regresiva, paquetes con filtros, ficha de cada paquete (`/paquetes/<nombre>`), preguntas frecuentes, formulario de presupuesto, mapa, club de ofertas, páginas legales y botón de arrepentimiento.
- **Panel** (`/panel`, no está enlazado desde el sitio): resumen con Google Analytics y Search Console, paquetes (fotos, itinerario, precios por habitación, salidas, SEO), ofertas (varias a la vez, programadas, con o sin contador), reseñas, consultas (con descarga a Excel), configuración de la agencia, usuarios con roles y actividad del equipo.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `src/app` | Rutas: páginas públicas, panel y API (`/api/...`) |
| `src/plantillas` | HTML de las páginas del sitio (se genera en el servidor, sin JavaScript de más) |
| `src/contenido/sitio.ts` | Textos fijos del sitio (portada, preguntas frecuentes, pasos). Se editan acá |
| `src/lib` | Base de datos, seguridad, SEO, emails, Google, subida de fotos |
| `public/assets` | Estilos y scripts del sitio (`sitio.*`) y del panel (`panel.*`) |
| `public/media` | Video de portada y fotos de ejemplo (créditos en `CREDITOS.md`) |
| `drizzle` | Migraciones de la base de datos (se aplican solas al arrancar) |
| `bocetos` | Bocetos aprobados (referencia de diseño, no se publican) |

## Probar en la computadora

```bash
npm install
npm run dev
```

- Sitio: http://localhost:3000
- Panel: http://localhost:3000/panel · email `admin@agencia.local` · contraseña `Arrecife2026!`

Sin `DATABASE_URL` se usa una base Postgres embebida que se guarda en `.data/` (se borra con `rm -rf .data`). Las fotos subidas en local quedan en `.data/uploads`.

## Publicar en Vercel

1. **Importar el proyecto**: vercel.com → *Add New* → *Project* → elegir este repositorio de GitHub. Vercel detecta Next.js solo; no cambies nada todavía.
2. **Base de datos**: en el proyecto → *Storage* → *Create Database* → **Neon (Postgres)** → conectarla al proyecto. Esto crea `DATABASE_URL` sola.
3. **Fotos**: *Storage* → *Create* → **Blob** → conectarlo al proyecto. Crea `BLOB_READ_WRITE_TOKEN`.
4. **Variables** (*Settings* → *Environment Variables*), como mínimo:
   - `ADMIN_EMAIL`: email de quien administra.
   - `ADMIN_PASSWORD`: contraseña inicial (8 caracteres, mayúscula, número y símbolo).
   - `SEED_DEMO`: `true` para arrancar con los paquetes de ejemplo, `false` para arrancar vacío.
   - El resto está explicado en `.env.example` (emails, anti-robots, Google).
5. **Deploy** (o *Redeploy* si ya se había publicado antes de cargar las variables).
6. Entrar a `https://<proyecto>.vercel.app/panel` con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. La primera vez se crea la cuenta; después cambiá la contraseña con **Cambiar mi contraseña** (abajo a la izquierda).
7. **Dominio propio**: *Settings* → *Domains* → agregar `www.tuagencia.com.ar` y seguir las instrucciones de DNS. Después cargá `SITE_URL=https://www.tuagencia.com.ar` y hacé *Redeploy*.

Cada cambio que se sube a GitHub se publica solo. Los cambios que hace la agencia desde el panel se ven en la web en menos de un minuto, sin volver a publicar.

Las publicaciones de prueba (*Preview*) no se indexan en Google: `robots.txt` las bloquea.

### Emails (opcional, recomendado)

Con [Resend](https://resend.com) (gratis hasta 3.000 emails por mes): crear cuenta, verificar el dominio de la agencia y cargar `RESEND_API_KEY` y `EMAIL_FROM`. Con eso:

- la agencia recibe un email por cada consulta de la web (respondiendo, le contesta directo al viajero);
- quien pide el botón de arrepentimiento recibe su código por email (Res. 424/2020);
- las invitaciones al panel y la recuperación de contraseña llegan por email.

Sin Resend todo funciona igual: las consultas quedan en el panel y los enlaces de invitación se copian desde **Usuarios**.

### Anti-robots (opcional)

Los formularios ya tienen un campo trampa y límite de envíos por conexión. Para sumar Cloudflare Turnstile (gratis): crear un widget en dash.cloudflare.com → Turnstile con el dominio de la web y cargar `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`.

### Google Analytics y Search Console

1. **Medir visitas**: en el panel → *Configuración* → *Google*, cargar el **ID de medición** de GA4 (`G-XXXXXXX`). La web solo lo activa si el visitante acepta las cookies.
2. **Ver métricas en el resumen del panel**:
   1. En console.cloud.google.com crear un proyecto, habilitar **Google Analytics Data API** y **Google Search Console API**.
   2. *IAM* → *Cuentas de servicio* → crear una → *Claves* → *Agregar clave* → JSON. Copiar el contenido del archivo en la variable `GOOGLE_SERVICE_ACCOUNT` y hacer *Redeploy*.
   3. En el panel → *Configuración* → *Google*, cargar el **ID de propiedad** de GA4 (número) y la **propiedad de Search Console** (`sc-domain:tuagencia.com.ar`). El panel muestra el email de la cuenta de servicio: agregarlo como *Lector* en Analytics y como usuario *Restringido* en Search Console.
3. En Search Console, enviar el sitemap: `https://www.tuagencia.com.ar/sitemap.xml`.

## Adaptar para otra agencia

- Datos, logo, WhatsApp, horario, redes, legajo, CUIT, Data Fiscal, dólar de referencia y puntaje de Google: desde el panel (*Configuración*).
- Paquetes, ofertas y reseñas: desde el panel. Con `SEED_DEMO=false` arranca vacío.
- Textos fijos (título de portada, preguntas frecuentes, pasos, “por qué elegirnos”): `src/contenido/sitio.ts`.
- Video y fotos de portada: `public/media` (el script `herramientas/preparar-medios.mjs` los descarga y optimiza).
- Mapa ilustrado del contacto: está dibujado para Villa Carlos Paz en `public/assets/sitio.js` (`MapView`).
- Los textos legales son un modelo para Argentina: **tiene que revisarlos un abogado** con los datos reales de cada agencia.

## Seguridad

- Contraseñas con scrypt, reglas de 8 caracteres + mayúscula + número + símbolo, bloqueo de 15 minutos tras 5 intentos fallidos, límite de intentos por conexión.
- Sesiones de 8 horas en cookie `HttpOnly`, `Secure`, `SameSite=Strict` (`__Host-`), guardadas como hash en la base.
- Roles: Administración (todo), Edición (contenido y consultas), Ventas (solo consultas). Registro de actividad de cada persona.
- Todas las escrituras verifican que el pedido venga del propio sitio (CSRF) y validan los datos en el servidor.
- Cabeceras: CSP sin scripts en línea, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. El panel y la API no se indexan.
- Las fotos se vuelven a codificar en el servidor (se eliminan metadatos y contenido oculto).
- Formularios públicos: campo trampa, límite por conexión y Turnstile opcional.

## Comandos

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Desarrollo local |
| `npm run build` / `npm start` | Compilar y correr como en producción |
| `npm run typecheck` | Revisar tipos |
| `npm run db:generar` | Generar una migración nueva después de cambiar `src/lib/db/schema.ts` |
