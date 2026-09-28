import { configDe, ofertasDe, paquetesKuro, sitioKuro, type OfertaConPaquete } from './kuro';
import type { ConfigDatos, Paquete, Resena } from './tipos';

/** Oferta con su paquete; las de Kuro traen además `kuro` (ver lib/kuro). */
export type OfertaVigente = OfertaConPaquete;
export type DatosSitio = { cfg: ConfigDatos; paquetes: Paquete[]; ofertas: OfertaVigente[]; resenas: Resena[] };

/** Todo lo que muestra la web, tal como la agencia lo publicó en el panel Kuro. */
export async function datosSitio(): Promise<DatosSitio> {
  const [sitio, paquetes] = await Promise.all([sitioKuro(), paquetesKuro()]);
  const { cfg, resenas } = configDe(sitio);
  return { cfg, paquetes, ofertas: ofertasDe(sitio.offers, paquetes), resenas };
}

export async function paquetePorSlug(slug: string) {
  return (await paquetesKuro()).find(p => p.slug === slug) ?? null;
}

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
