# Web de agencia de viajes sobre Kuro (web piloto)

Frontend de **presentación** de una agencia de viajes cuyo contenido administra **Kuro**.

> **Kuro conoce los datos. La web conoce cómo mostrarlos.**

```
Super admin Kuro → Cliente/usuarios → Panel Kuro → contenido publicado
        → Kuro Content API v1 → esta web → visitante
```

- **La web no tiene CMS, panel, usuarios, base de datos ni subida de archivos.** Hay una sola fuente de verdad: Kuro.
- La web **solo consume contenido publicado** por la Content API v1 (`/api/v1/sites/{siteKey}/…`). Lo que se retira en Kuro deja de verse en el siguiente pedido (el contenido se pide siempre con `no-store` durante el piloto).
- No habla con Supabase, PostgREST ni Storage: las fotos se usan **tal cual** vienen en `photos[].url`.
- Si Kuro falla se muestra una página de error controlada (503) y se registra en el servidor, sin secretos. **Nunca** se cae a otra fuente de datos.

## Configuración

Solo hacen falta dos variables, ambas públicas (ver `.env.example`):

| Variable | Qué es |
| --- | --- |
| `KURO_CONTENT_API_URL` | Origen de la Content API, sin `/api/v1` (p. ej. `https://api.kuroautomation.com`). Debe estar disponible **también durante el build**: de ahí sale el origen permitido para imágenes en la CSP. |
| `KURO_SITE_KEY` | Identificador público (no secreto) del sitio: `site_` + 24 hex. |

La web jamás recibe claves privilegiadas, URL de base de datos ni tokens administrativos.

Opcionales (integraciones propias de la web, sin panel): `SITE_URL`, `GA_MEASUREMENT_ID` (GA4, solo con consentimiento de cookies), `GOOGLE_SITE_VERIFICATION` (Search Console), `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`/`EMAIL_FROM`/`NOTIFY_EMAIL` (constancia del botón de arrepentimiento).

## Qué viene de Kuro y qué queda en código

| Viene de Kuro (Content API) | Queda en código (presentación) |
| --- | --- |
| Site: nombre, zona horaria, idioma, moneda | Diseño, layout, componentes, animaciones, CSS |
| Contacto: email, teléfono, WhatsApp, dirección | Copy decorativo (`src/contenido/sitio.ts`) |
| Mi web: logo, anuncio, SEO, FAQs, legales (razón social, CUIT, habilitación, notas), mensaje de WhatsApp | Textos legales modelo (`src/plantillas/legales.ts`) |
| Paquetes: título, resumen, descripción, destinos, origen, modalidad, duración, fotos, itinerario, salidas, tarifas, hoteles/régimen, cuotas, depósito, condiciones, incluye/no incluye, etiqueta, destacado, contenido (ficha técnica, FAQs, insignias, documentos) | Ubicación, horario, redes y Data Fiscal de la agencia (`src/contenido/agencia.ts`) — **pendiente en Kuro** |
| Ofertas (vinculadas al paquete solo por `publicId`) | Reseñas de ejemplo (`src/contenido/resenas.ts`) — Kuro aún no tiene módulo de testimonios |
| Consultas: terminan en Kuro (`POST /inquiries`, con `Idempotency-Key`) | Región (agrupación para filtros), deducida del destino (`src/lib/sitio/adaptador.ts`) |

### Reglas de lectura del contrato
- **Identidad = `publicId`.** La URL de la ficha es `/paquetes/<slug-bonito>-<publicId>`; si el slug cambia, redirige (308) a la URL vigente. Un paquete retirado devuelve 404.
- **Precio «desde»**: solo salidas consultables (abiertas, no vencidas, dentro de su fecha límite) y tarifas vigentes con importe > 0, en una sola moneda (la del sitio si tiene tarifas) y una sola unidad (base doble primero). Si no corresponde, se muestra «Consultar». El depósito se muestra como porcentaje; no se convierte a importe.
- No se inventan datos: lo que falta no se muestra. No se envía `context` a las consultas porque el formulario no pide pasajeros.
- **Fotos**: solo `photos[].url`. El adaptador descarta cualquier URL que sea ruta de almacenamiento, host de base de datos o URL firmada. La CSP permite imágenes únicamente del origen de `KURO_CONTENT_API_URL`; fotos o logo alojados en un CDN externo del cliente requerirían ampliar `img-src`.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `src/lib/kuro/` | **Capa Kuro reutilizable**: `client.ts` (fetch + timeout + validación), `schemas.ts` (contrato público en Zod), `errors.ts`, `config.ts`, `adapters.ts` (fechas del sitio, salidas, tarifas, precio «desde», fotos seguras) |
| `src/lib/sitio/` | **Presentación de esta web**: modelos de vista, adaptador Kuro → vista, carga de datos |
| `src/plantillas`, `src/app` | HTML (se genera en el servidor), rutas, `/api/consultas` y `/api/arrepentimiento` |
| `src/contenido` | Datos y textos que viven en código |
| `public/assets`, `public/media` | Estilos, scripts y medios decorativos de la web |

## Botón de arrepentimiento (sin base de datos)
La solicitud queda registrada como consulta en la bandeja de Kuro (con código de trámite, DNI y reserva) y, si Resend está configurado, se envía constancia al cliente y aviso a la agencia. Se responde «recibida» solo si al menos uno de los dos registros se hizo; si ninguno, se informa el error. El texto legal es un modelo: **tiene que revisarlo un profesional** con los datos reales de la agencia.

## Reseñas
Testimonios editoriales de ejemplo en código. Mientras sean de ejemplo no se muestra puntaje ni se emite `aggregateRating`. Un módulo editable de testimonios podría sumarse a Kuro si el producto lo necesita.

## Seguridad
CSP (imágenes solo de la Content API; sin Supabase), HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Los pedidos a Kuro son server-side (no hay `connect-src` hacia Kuro). Formularios: Zod, campo trampa, mismo origen, límite por conexión en memoria (ayuda de frontend: la autoridad es el rate limiting de Kuro), Turnstile opcional. Un test estático falla si el runtime contiene rastros de la arquitectura anterior.

## Comandos
`npm ci` · `npm run dev` · `npm run typecheck` · `npm test` · `npm run build` · `npm start`

## Crear otra web con Kuro
1. **Crear el sitio/cliente en Kuro** (rubro correspondiente) y publicar contenido.
2. **Obtener el `siteKey`** (público).
3. **Configurar** `KURO_CONTENT_API_URL` y `KURO_SITE_KEY`.
4. **Consumir el contrato del rubro**: copiar `src/lib/kuro/` (client, schemas, errors, config) y agregar los schemas/adapters del vertical (propiedades, habitaciones, productos…).
5. **Diseñar libremente la presentación**: modelos de vista y plantillas propios, como `src/lib/sitio/` y `src/plantillas/`.
6. **Enviar consultas a Kuro** con `POST /inquiries`, `Idempotency-Key` e ítems por `publicId`.

## Pendientes conocidos
Ubicación/horario/redes/Data Fiscal y testimonios no están en Kuro; región por heurística; sin caché (no-store) hasta diseñar invalidación; fotos externas al origen de la Content API no se muestran por CSP.
