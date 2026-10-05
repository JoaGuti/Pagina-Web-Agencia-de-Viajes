import { UBICACION } from '@/contenido/agencia';
import type { Sitio, Viaje } from '@/lib/sitio/modelo';
import { html, jsonSeguro, raw, type Crudo } from '@/lib/html';
import { extras, navegacion, pie } from './partes';
import { SPRITE } from './sprite';

export const VERSION = (process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 8);

export type Pagina = {
  sitio: Sitio;
  viajes: Viaje[];
  base: string;
  ruta: string;
  titulo: string;
  descripcion: string;
  imagen?: string;
  tipoOg?: string;
  jsonld?: object[];
  noindex?: boolean;
  enInicio?: boolean;
  precargar?: Crudo;
  cuerpo: Crudo;
};

/** Datos que el script del sitio lee al arrancar (sin scripts en línea, compatible con la CSP). */
function datosCliente(sitio: Sitio) {
  return {
    direccion: [sitio.agencia.direccion, UBICACION.ciudad, UBICACION.provincia].filter(Boolean).join(', '),
    ga: process.env.GA_MEASUREMENT_ID || '',
    turnstile: process.env.TURNSTILE_SITE_KEY || '',
  };
}

/** Los enlaces del anuncio solo pueden ser http(s) o rutas del propio sitio. */
const enlaceSeguro = (u: string | null) => (u && (/^https?:\/\//i.test(u) || (u.startsWith('/') && !u.startsWith('//'))) ? u : null);

function anuncio(sitio: Sitio) {
  const a = sitio.anuncio;
  if (!a) return '';
  const enlace = enlaceSeguro(a.enlace);
  return html`<div class="anuncio" role="region" aria-label="Anuncio">${enlace ? html`<a href="${enlace}">${a.texto}</a>` : html`<span>${a.texto}</span>`}</div>`;
}

export function documento(p: Pagina): string {
  const { sitio, base } = p;
  const url = base + p.ruta;
  const img = p.imagen ? (p.imagen.startsWith('http') ? p.imagen : base + p.imagen) : base + '/media/hero-playa.jpg';
  const nombre = sitio.agencia.nombre;
  const verificacion = process.env.GOOGLE_SITE_VERIFICATION;
  return '<!doctype html>' + html`
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.titulo}</title>
<meta name="description" content="${p.descripcion}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
${verificacion ? html`<meta name="google-site-verification" content="${verificacion}">` : ''}
<meta name="theme-color" content="#d62839">
<meta name="geo.region" content="AR-X">
<meta name="geo.placename" content="${UBICACION.ciudad}, ${UBICACION.provincia}">
<meta name="geo.position" content="${UBICACION.lat};${UBICACION.lng}">
<meta name="ICBM" content="${UBICACION.lat}, ${UBICACION.lng}">
<meta property="og:type" content="${p.tipoOg || 'website'}">
<meta property="og:locale" content="es_AR">
<meta property="og:site_name" content="${nombre}">
<meta property="og:title" content="${p.titulo}">
<meta property="og:description" content="${p.descripcion}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${sitio.logo || '/favicon.svg'}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1&family=Hanken+Grotesk:wght@300..800&display=swap">
<link rel="stylesheet" href="/assets/sitio.css?v=${VERSION}">
${p.precargar || ''}
${(p.jsonld || []).map(j => html`<script type="application/ld+json">${jsonSeguro(j)}</script>`)}
</head>
<body class="${p.enInicio ? 'inicio' : 'interna'}${sitio.anuncio ? ' con-anuncio' : ''}">
<a class="skip" href="#contenido">Saltar al contenido</a>
${raw(SPRITE)}
${p.enInicio ? html`<div class="loader" id="loader" aria-hidden="true"><div><div class="loader-scene"><span class="loader-trail"></span><svg class="loader-plane" viewBox="0 0 64 64"><use href="#d-plane"/></svg></div><div class="loader-brand">${nombre.split(' ')[0]}</div><div class="loader-count" id="loaderCount">000</div></div></div>` : ''}
${anuncio(sitio)}
${navegacion(sitio, !!p.enInicio, p.viajes.length > 0)}
<main id="contenido">
${p.cuerpo}
</main>
${pie(sitio, p.viajes, !!p.enInicio)}
${extras(sitio)}
<script type="application/json" id="datos">${jsonSeguro(datosCliente(sitio))}</script>
<script src="/vendor/gsap.min.js" defer></script>
<script src="/vendor/ScrollTrigger.min.js" defer></script>
<script src="/vendor/lenis.min.js" defer></script>
<script src="/assets/sitio.js?v=${VERSION}" defer></script>
</body>
</html>`.valor;
}

/**
 * Respuesta HTML sin caché: durante el piloto el contenido de Kuro debe verse (publicación y retiro)
 * en el momento. Más adelante podrá diseñarse caché con invalidación.
 */
export function respuestaHtml(cuerpo: string, estado = 200, extra: Record<string, string> = {}) {
  return new Response(cuerpo, { status: estado, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
}
