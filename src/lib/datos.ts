import { and, asc, desc, eq, gt, lte } from 'drizzle-orm';
import { getDb } from './db';
import { configuracion, ofertas, paquetes, resenas, type ConfigDatos, type Oferta, type Paquete, type Resena } from './db/schema';
import { CONFIG_INICIAL } from './db/semilla';

export type OfertaVigente = Oferta & { paquete: Paquete };
export type DatosSitio = { cfg: ConfigDatos; paquetes: Paquete[]; ofertas: OfertaVigente[]; resenas: Resena[] };

/** Mezcla la configuración guardada con los valores por defecto (por si se agregan campos nuevos). */
export function completarConfig(d: Partial<ConfigDatos> | null | undefined): ConfigDatos {
  const c = d || {};
  return {
    ...CONFIG_INICIAL, ...c,
    agencia: { ...CONFIG_INICIAL.agencia, ...(c.agencia || {}) },
    google: { ...CONFIG_INICIAL.google, ...(c.google || {}) },
    resenas: { ...CONFIG_INICIAL.resenas, ...(c.resenas || {}) },
    dataFiscal: { ...CONFIG_INICIAL.dataFiscal, ...(c.dataFiscal || {}) },
  };
}

export async function leerConfig(): Promise<ConfigDatos> {
  const db = await getDb();
  const [fila] = await db.select().from(configuracion).where(eq(configuracion.id, 1)).limit(1);
  return completarConfig(fila?.datos);
}

export async function datosSitio(): Promise<DatosSitio> {
  const db = await getDb();
  const ahora = new Date();
  const [cfg, pqs, ofs, rs] = await Promise.all([
    leerConfig(),
    db.select().from(paquetes).where(eq(paquetes.estado, 'publicado')).orderBy(asc(paquetes.orden), desc(paquetes.creado)),
    db.select({ o: ofertas, p: paquetes }).from(ofertas).innerJoin(paquetes, eq(paquetes.id, ofertas.paqueteId))
      .where(and(eq(ofertas.activa, true), lte(ofertas.desde, ahora), gt(ofertas.hasta, ahora), eq(paquetes.estado, 'publicado')))
      .orderBy(asc(ofertas.hasta)),
    db.select().from(resenas).where(eq(resenas.activa, true)).orderBy(asc(resenas.orden), desc(resenas.creado)),
  ]);
  return { cfg, paquetes: pqs, ofertas: ofs.map(({ o, p }) => ({ ...o, paquete: p })), resenas: rs };
}

export async function paquetePorSlug(slug: string) {
  const db = await getDb();
  const [p] = await db.select().from(paquetes).where(and(eq(paquetes.slug, slug), eq(paquetes.estado, 'publicado'))).limit(1);
  return p ?? null;
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
