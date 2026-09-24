import { datosSitio, urlBase } from '@/lib/datos';
import { esc } from '@/lib/html';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const d = await datosSitio();
  const base = urlBase(req);
  const ultimo = d.paquetes.reduce((m, p) => (p.actualizado > m ? p.actualizado : m), new Date(0));
  const urls: [string, Date | null, string][] = [
    ['/', ultimo.getTime() ? ultimo : null, '1.0'],
    ...d.paquetes.map(p => [`/paquetes/${p.slug}`, p.actualizado, '0.8'] as [string, Date, string]),
    ['/arrepentimiento', null, '0.2'], ['/privacidad', null, '0.2'], ['/terminos', null, '0.2'], ['/cookies', null, '0.1'],
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(([u, f, pr]) => {
    const p = d.paquetes.find(x => `/paquetes/${x.slug}` === u);
    const imgs = (p?.fotos || []).slice(0, 5).map(i => `<image:image><image:loc>${esc(i.startsWith('http') ? i : base + i)}</image:loc></image:image>`).join('');
    return `<url><loc>${esc(base + u)}</loc>${f ? `<lastmod>${f.toISOString()}</lastmod>` : ''}<priority>${pr}</priority>${imgs}</url>`;
  }).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=600' } });
}
