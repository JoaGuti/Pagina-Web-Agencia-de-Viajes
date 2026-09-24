import { urlBase } from '@/lib/datos';

export function GET(req: Request) {
  const base = urlBase(req);
  const produccion = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production';
  const txt = produccion
    ? `User-agent: *\nAllow: /\nDisallow: /panel\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' } });
}
