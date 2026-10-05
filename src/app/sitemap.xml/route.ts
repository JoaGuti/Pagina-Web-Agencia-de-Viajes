import { urlBase } from '@/lib/base';
import { urlViaje } from '@/lib/formato';
import { esc } from '@/lib/html';
import { cargarSitio } from '@/lib/sitio/cargar';

export const dynamic = 'force-dynamic';

/** Solo lo publicado en Kuro: un paquete retirado deja de figurar en el próximo pedido. */
export async function GET(req: Request) {
  const base = urlBase(req);
  let d;
  try { d = await cargarSitio(); } catch (e) {
    console.error('[sitemap] Kuro no disponible');
    return new Response('Servicio no disponible', { status: 503, headers: { 'Retry-After': '30', 'Cache-Control': 'no-store' } });
  }
  const ultimo = d.viajes.reduce((m, v) => (v.publicado > m ? v.publicado : m), new Date(0));
  const urls = [
    `<url><loc>${esc(base + '/')}</loc>${ultimo.getTime() ? `<lastmod>${ultimo.toISOString()}</lastmod>` : ''}<priority>1.0</priority></url>`,
    ...d.viajes.map(v => `<url><loc>${esc(base + urlViaje(v))}</loc><lastmod>${v.publicado.toISOString()}</lastmod><priority>0.8</priority>${v.fotos.slice(0, 5).map(f => `<image:image><image:loc>${esc(f.url)}</image:loc></image:image>`).join('')}</url>`),
    ...['/arrepentimiento', '/privacidad', '/terminos', '/cookies'].map(u => `<url><loc>${esc(base + u)}</loc><priority>0.2</priority></url>`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
}
