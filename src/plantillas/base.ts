import type { ConfigDatos, Paquete } from '@/lib/db/schema';
import { direccionCompleta } from '@/lib/formato';
import { html, jsonSeguro, raw, type Crudo } from '@/lib/html';
import { extras, navegacion, pie } from './partes';
import { SPRITE } from './sprite';

export const VERSION = (process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 8);

export type Pagina = {
  cfg: ConfigDatos;
  paquetes: Paquete[];
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
function datosCliente(cfg: ConfigDatos) {
  return {
    direccion: direccionCompleta(cfg),
    ga: cfg.google.medicion || '',
    turnstile: process.env.TURNSTILE_SITE_KEY || '',
  };
}

export function documento(p: Pagina): string {
  const { cfg, base } = p;
  const url = base + p.ruta;
  const img = p.imagen ? (p.imagen.startsWith('http') ? p.imagen : base + p.imagen) : base + '/media/hero-playa.jpg';
  const a = cfg.agencia;
  return '<!doctype html>' + html`
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.titulo}</title>
<meta name="description" content="${p.descripcion}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
<meta name="theme-color" content="#d62839">
<meta name="geo.region" content="AR-X">
<meta name="geo.placename" content="${a.ciudad}, ${a.provincia}">
<meta name="geo.position" content="${a.lat};${a.lng}">
<meta name="ICBM" content="${a.lat}, ${a.lng}">
<meta property="og:type" content="${p.tipoOg || 'website'}">
<meta property="og:locale" content="es_AR">
<meta property="og:site_name" content="${a.nombre}">
<meta property="og:title" content="${p.titulo}">
<meta property="og:description" content="${p.descripcion}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${cfg.logo || '/favicon.svg'}">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1&family=Hanken+Grotesk:wght@300..800&display=swap">
<link rel="stylesheet" href="/assets/sitio.css?v=${VERSION}">
${p.precargar || ''}
${(p.jsonld || []).map(j => html`<script type="application/ld+json">${jsonSeguro(j)}</script>`)}
</head>
<body class="${p.enInicio ? 'inicio' : 'interna'}">
<a class="skip" href="#contenido">Saltar al contenido</a>
${raw(SPRITE)}
${p.enInicio ? html`<div class="loader" id="loader" aria-hidden="true"><div><div class="loader-scene"><span class="loader-trail"></span><svg class="loader-plane" viewBox="0 0 64 64"><use href="#d-plane"/></svg></div><div class="loader-brand">${a.nombre.split(' ')[0]}</div><div class="loader-count" id="loaderCount">000</div></div></div>` : ''}
${navegacion(cfg, !!p.enInicio)}
<main id="contenido">
${p.cuerpo}
</main>
${pie(cfg, p.paquetes, !!p.enInicio)}
${extras(cfg)}
<script type="application/json" id="datos">${jsonSeguro(datosCliente(cfg))}</script>
<script src="/vendor/gsap.min.js" defer></script>
<script src="/vendor/ScrollTrigger.min.js" defer></script>
<script src="/vendor/lenis.min.js" defer></script>
<script src="/assets/sitio.js?v=${VERSION}" defer></script>
</body>
</html>`.valor;
}

/** Respuesta HTML con caché corta en la CDN: los cambios del panel se ven en menos de un minuto. */
export function respuestaHtml(cuerpo: string, estado = 200, cache = true) {
  return new Response(cuerpo, {
    status: estado,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': cache && estado === 200 ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' : 'no-store',
    },
  });
}
