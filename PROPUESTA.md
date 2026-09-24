# Plantilla web para agencias de viajes: propuesta

Estado: **bocetos para aprobar**. Todavía no hay cliente; la agencia de los bocetos es ficticia ("Arrecife Viajes") y se usa la dirección José Hernández 110, Villa Carlos Paz, Córdoba, como ejemplo.

## Qué hay en esta etapa

| Archivo | Qué muestra |
| --- | --- |
| `bocetos/index.html` | Sitio público completo, navegable y animado |
| `bocetos/admin.html` | Panel de administración para que la agencia edite sin programador |

Los dos bocetos comparten los datos del navegador. Si abrís `admin.html` y `index.html` en dos pestañas y cambiás un precio en el panel, la web se actualiza sola. Así se le puede hacer la demo a un cliente.

Para verlos: abrí `bocetos/index.html` en el navegador. Para probar la conexión entre el panel y la web, conviene servirlos desde una carpeta, por ejemplo con `npx serve bocetos`.

### Sitio público (`index.html`)

- **Portada con video real**: una pareja caminando entre palmeras en Punta Cana, filmada con dron en 4K y entregada en 1080p (720p en celulares). El video se repite sin saltos, hace un zoom suave con el scroll y reacciona al mouse.
- **Zambullida con el scroll**: al bajar, una ola revela un video submarino de arrecife de coral, con la línea del agua, rayos de luz y burbujas encima. Es el momento principal de la página.
- **Destinos** con desplazamiento horizontal fijado en pantalla, tarjetas con inclinación 3D y coordenadas reales.
- **Oferta relámpago** con cuenta regresiva, precio tachado y borde animado. Se oculta sola cuando vence.
- **Paquetes** con filtros por región, fechas de salida, régimen, cupos, precio en USD y referencia en pesos. El botón "Consultar" abre WhatsApp con el mensaje ya escrito.
- **Cómo trabajamos**: ruta dibujada con el scroll y un avión que la recorre. Números animados.
- **Testimonios** en carrusel continuo, **preguntas frecuentes**, **formulario de contacto** validado y con protección anti-spam.
- **Mapa ilustrado** de Villa Carlos Paz (lago San Roque, acceso desde Córdoba) con el pin de la agencia, botón "Cómo llegar" y "Copiar dirección".
- **Pie nocturno** con estrellas y olas bioluminiscentes, suscripción al club de ofertas.
- **Legales**: política de privacidad (Ley 25.326), términos, cookies, botón de arrepentimiento (Ley 24.240, Res. 424/2020), legajo EVyT, CUIT y lugar para el QR de Data Fiscal.
- **Aviso de cookies** con opción de rechazar las analíticas.
- **Accesibilidad**: navegación con teclado, "saltar al contenido", textos alternativos y respeto por la opción "reducir movimiento" del sistema.
- Botón flotante de WhatsApp y menú a pantalla completa en celulares.

Las fotos y videos son de Pexels (licencia libre para uso comercial, sin atribución obligatoria); el detalle está en `bocetos/media/CREDITOS.md`. Cada agencia puede reemplazarlas desde el panel. Si falta algún archivo, la página dibuja una ilustración en su lugar.

`herramientas/preparar-medios.mjs` descarga y optimiza los medios a partir de `herramientas/fuentes.json`: video en MP4 y WebM en dos resoluciones con fundido para repetir sin corte, y fotos recortadas en dos tamaños.

### Panel de administración (`admin.html`)

- **Ingreso** con email, contraseña y código de verificación en dos pasos.
- **Resumen**: consultas nuevas, paquetes publicados, ofertas activas, visitas y registro de actividad del equipo.
- **Paquetes**: tabla con búsqueda y filtros. **El precio se cambia directo en la tabla** y se guarda solo. Destacar en portada, duplicar, eliminar.
- **Editor de paquete** en cuatro pestañas: datos generales, precio y fechas de salida, fotos (arrastrar y soltar) y **vista previa de cómo sale en Google**.
- **Actualizar precios en bloque**: subir un porcentaje a todos, a una región o a los seleccionados, con redondeo y vista previa antes de aplicar. Pensado para la inflación y el tipo de cambio.
- **Ofertas**: descuento, fecha de vencimiento y encendido o apagado.
- **Consultas**: bandeja con lo que llega del formulario, estado (nueva, contactada, cerrada) y respuesta por WhatsApp en un clic.
- **Textos de la web** con vista previa en vivo.
- **Configuración**: datos de la agencia, WhatsApp, horarios, legajo, CUIT y dólar de referencia.
- **Usuarios y seguridad**: roles (administración, edición, ventas) y protecciones activas.
- Modo claro y oscuro.

## Arquitectura propuesta para la versión final

| Pieza | Recomendación | Por qué |
| --- | --- | --- |
| Web pública | **Next.js** (páginas estáticas que se regeneran al editar) | Carga muy rápida, excelente para SEO, animaciones sin penalizar la velocidad |
| Panel y contenido | **Payload CMS** dentro del mismo proyecto | Panel de administración propio y personalizable (el del boceto), usuarios, roles, borradores, historial de versiones y subida de imágenes |
| Base de datos | PostgreSQL (Neon o Supabase) | Gratis o muy barata al empezar |
| Imágenes | Almacenamiento tipo S3 (Cloudflare R2) con recorte y WebP/AVIF automáticos | Las agencias suben fotos pesadas del celular; se optimizan solas |
| Hosting | Vercel o un VPS con Docker | Vercel es lo más simple; un VPS abarata si hay muchos clientes |
| Formularios | Validación en servidor, Cloudflare Turnstile, límite de envíos, aviso por email y WhatsApp | Sin spam y sin perder consultas |

Todo lo configurable (nombre, logo, colores, textos, datos legales, redes) vive en el panel. Así la misma plantilla se instala para otra agencia sin tocar código.

**Modelo de negocio posible**: además de vender una instalación por cliente, Payload permite una sola plataforma con varias agencias (multi-tenant) y cobrar un abono mensual. Conviene decidirlo antes de programar (ver preguntas).

## Seguridad

- HTTPS obligatorio con HSTS, cabeceras de seguridad (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- Contraseñas con Argon2, verificación en dos pasos (TOTP) obligatoria para administradores, bloqueo tras intentos fallidos, sesiones que expiran.
- Roles con permisos mínimos: por ejemplo, ventas ve consultas pero no cambia precios.
- Registro de actividad (quién cambió qué y cuándo) y copias de seguridad diarias.
- Validación de todo lo que entra en el servidor, protección anti-spam, límite de envíos por IP.
- Las imágenes subidas se validan y se vuelven a codificar para eliminar metadatos y archivos maliciosos.
- Dependencias con actualizaciones automáticas y análisis de vulnerabilidades.
- Revisión según OWASP Top 10 antes de salir a producción.

## SEO

- HTML generado en el servidor, URLs limpias (`/paquetes/punta-cana-all-inclusive`), `canonical`, `sitemap.xml` y `robots.txt` automáticos.
- Datos estructurados schema.org: `TravelAgency` (con dirección, coordenadas y horarios), `TouristTrip` y `Offer` para cada paquete, `FAQPage`, `BreadcrumbList`. El boceto ya incluye los de la agencia y las preguntas frecuentes.
- Título y descripción editables por paquete, con valores automáticos si la agencia no los completa.
- Imagen para redes sociales generada automáticamente por paquete (Open Graph).
- Core Web Vitals: las animaciones se pausan fuera de pantalla, las imágenes se cargan diferidas y en formatos modernos.
- Páginas por destino pensadas para búsquedas locales: "viajes a Punta Cana desde Córdoba", "agencia de viajes en Carlos Paz".

## GEO

Cubre las dos acepciones:

**Posicionamiento local (geográfico)**
- Metadatos geográficos (`geo.region` AR-X, coordenadas), mapa con la dirección y datos de contacto idénticos en la web, Google Business Profile y directorios.
- Guía para configurar Google Business Profile y pedir reseñas.

**Optimización para motores generativos (ChatGPT, Gemini, Perplexity, Claude)**
- Archivo `llms.txt` con la información clave de la agencia y sus paquetes.
- Preguntas frecuentes con respuestas directas y datos concretos (precios, noches, qué incluye), que son lo que citan estos asistentes.
- Datos estructurados completos y coherentes.
- Decisión sobre permitir o no los rastreadores de IA en `robots.txt` (lo define cada agencia).

## Aspectos legales en Argentina que la plantilla ya contempla

- Ley 25.326 de Protección de Datos Personales: política de privacidad con las leyendas obligatorias y consentimiento en formularios.
- Ley 24.240 y Resolución 424/2020: botón de arrepentimiento visible.
- Ley 18.829: número de legajo de la agencia.
- QR de Data Fiscal (ARCA) y enlace a Defensa del Consumidor.

Los textos legales del boceto son modelos. Un abogado tiene que revisarlos para cada cliente.

## Datos para verificar

- Las coordenadas usadas (-31.4241, -64.4978) son del centro de Villa Carlos Paz. Hay que tomar las exactas de José Hernández 110 en Google Maps.
- Teléfono, WhatsApp, CUIT, legajo, precios, reseñas y cifras son de ejemplo.

## Próximos pasos

1. Aprobación de los bocetos y ajustes de diseño.
2. Respuestas a las preguntas abiertas.
3. Desarrollo de la versión final (Next.js + Payload) con los mismos diseños.
4. Pruebas de seguridad, velocidad y accesibilidad.
5. Guía de instalación para nuevos clientes y manual corto para la agencia.
