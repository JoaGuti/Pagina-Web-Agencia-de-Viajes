import type { DatosSitio } from '@/lib/datos';
import { html } from '@/lib/html';
import { documento, respuestaHtml } from './base';

/** Error del servidor: página mínima que no depende de la base de datos. */
export function paginaError(e: unknown) {
  console.error(e);
  const cuerpo = `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Volvemos en un momento</title><link rel="stylesheet" href="/assets/sitio.css"></head><body class="interna"><main class="pagina-error"><div class="wrap"><p class="eyebrow">Error 500</p><h1 class="h2">Estamos acomodando<br><em>las valijas.</em></h1><p class="lede">El sitio tuvo un problema al cargar. Probá de nuevo en unos segundos.</p><p><a class="btn" href="/">Reintentar</a></p></div></main></body></html>`;
  return new Response(cuerpo, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '30' } });
}

export function pagina404(d: DatosSitio, base: string, ruta: string) {
  const cuerpo = html`
<section class="paper sec pagina-error" data-doodles="8">
  <div class="wrap">
    <p class="eyebrow">Error 404</p>
    <h1 class="h2">Este destino<br><em>no figura en el mapa.</em></h1>
    <p class="lede">La página que buscás no existe o el paquete ya no está publicado. Mirá los viajes que tenemos hoy o escribinos y te armamos uno a medida.</p>
    <p class="acciones"><a class="btn" href="/#paquetes">Ver paquetes</a><a class="btn outline" href="/#contacto">Pedir presupuesto</a></p>
  </div>
</section>`;
  return respuestaHtml(documento({
    cfg: d.cfg, paquetes: d.paquetes, base, ruta, noindex: true,
    titulo: `Página no encontrada · ${d.cfg.agencia.nombre}`,
    descripcion: 'La página que buscás no existe.',
    cuerpo,
  }), 404);
}
