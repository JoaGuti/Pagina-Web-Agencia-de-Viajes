/** URL pública del sitio (para canonical, sitemap y datos estructurados). */
export function urlBase(req?: Request) {
  const env = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  if (env) return env.replace(/\/+$/, '');
  if (req) {
    const h = req.headers;
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}
