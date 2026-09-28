# Web para agencias de viajes (conectada al panel Kuro)

Sitio público animado con temática de isla tropical. **No tiene panel ni base propios:** la agencia la administra entera desde el panel Kuro ([panel.kuroautomation.com](https://panel.kuroautomation.com)) y los formularios llegan a su bandeja de Kuro.

- **Sitio**: portada con video, postales de destinos, ofertas con cuenta regresiva (tarjetas de embarque), paquetes con filtros, ficha de cada paquete (`/paquetes/<nombre>`), reseñas, preguntas frecuentes, formulario de presupuesto, mapa, club de ofertas, páginas legales y botón de arrepentimiento.
- `/panel` lleva al panel Kuro.

## Qué se edita en Kuro y dónde se ve

| En el panel Kuro | En la web |
| --- | --- |
| **Paquetes** | Postales, catálogo con filtros, ficha de cada paquete, precio «desde» recalculado en cada visita |
| **Ofertas** | Tarjetas de embarque con cuenta regresiva, lugares, etiqueta y precio de oferta (en la ficha del paquete también) |
| **Configuración → Organización** | Nombre, email, teléfono, WhatsApp, dirección, horario, Instagram y Facebook |
| **Configuración → Mi web** | Logo, portada, por qué elegirnos, cómo trabajamos, cifras, preguntas, contacto, club, mensaje de WhatsApp, datos legales (razón social, CUIT, legajo), Google (título y descripción), ciudad y coordenadas del mapa, dólar de referencia, reseñas y puntaje de Google, Google Analytics y Data Fiscal |
| **Consultas** | Reciben el formulario de presupuesto (con el paquete), el botón de arrepentimiento (con su código de trámite) y el club de ofertas |

Lo que se deja vacío en Mi web usa los textos por defecto de `src/contenido/sitio.ts`, que son los mismos que Kuro muestra de fondo.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `src/app` | Rutas: páginas públicas y los formularios (`/api/consultas`, `/api/arrepentimiento`, `/api/suscripcion`) |
| `src/lib/kuro.ts` | La conexión con Kuro: sitio (`resolve_site`), paquetes (`site_catalog`) y formularios (`submit_inquiry`) |
| `src/plantillas` | HTML de las páginas (se genera en el servidor) |
| `src/contenido/sitio.ts` | Textos por defecto |
| `public/assets` | Estilos y scripts del sitio |
| `public/media` | Video de portada y fotos de ejemplo (créditos en `CREDITOS.md`) |

## Probar en la computadora

```bash
npm install
cp .env.example .env.local   # completar las tres variables KURO_*
npm run dev
```

Para probar sin tocar producción, usá Kuro local (repositorio del panel Kuro, `herramientas/kuro-local`): `KURO_API_URL=http://localhost:54321`, su clave anon y `KURO_SITE_HOST=arrecife-viajes.kuro.site`.

## Publicar en Vercel

1. **Importar el proyecto**: vercel.com → *Add New* → *Project* → este repositorio. Vercel detecta Next.js.
2. **Variables** (*Settings* → *Environment Variables*): `KURO_API_URL`, `KURO_ANON_KEY` y `KURO_SITE_HOST` (ver `.env.example`). Opcional: `SITE_URL`, `TURNSTILE_*`, `RESEND_API_KEY` y `EMAIL_FROM`.
3. **Deploy**.
4. En Kuro, la dirección de la web se carga como dominio principal de la agencia: así «Ver mi web» del panel lleva ahí.
5. **Dominio propio**: *Settings* → *Domains*. Después cargá `SITE_URL` y hacé *Redeploy*.

No hace falta base de datos ni almacenamiento de fotos: todo vive en Kuro. Los cambios que hace la agencia en Kuro se ven en la web en la próxima visita.

Las publicaciones de prueba (*Preview*) no se indexan en Google: `robots.txt` las bloquea.

## Seguridad

- Solo se usa la clave pública de Kuro: la base deja leer lo publicado y registrar consultas, nada más (RLS y funciones controladas).
- Formularios: mismo origen (CSRF), campo trampa, validación en el servidor, Turnstile opcional y el límite de envíos de Kuro.
- Cabeceras: CSP sin scripts en línea (fotos solo del almacenamiento de Kuro), HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Los textos legales son un modelo para Argentina: **tiene que revisarlos un abogado** con los datos reales de cada agencia.

## Comandos

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Desarrollo local |
| `npm run build` / `npm start` | Compilar y correr como en producción |
| `npm run typecheck` | Revisar tipos |
