import type { Departure, Money, Photo, Rate, TravelPackage } from './schemas';

/**
 * Reglas de lectura del contrato de viajes que cualquier web del rubro necesita (fechas del sitio,
 * salidas consultables, tarifas vigentes, precio «desde», fotos seguras). No contienen diseño.
 */

/** Fecha de hoy (AAAA-MM-DD) en la zona horaria del sitio. */
export function hoyEnZona(timezone: string, ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
}

function desfaseMs(t: number, timezone: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: timezone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(t)).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(t / 1000) * 1000;
}

/** Último instante (23:59:59) de un día AAAA-MM-DD en la zona horaria del sitio. */
export function finDelDia(fecha: string, timezone: string): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  const supuesto = Date.UTC(y, m - 1, d, 23, 59, 59);
  return new Date(supuesto - desfaseMs(supuesto, timezone));
}

/**
 * Una foto es utilizable solo si es una URL http(s) pública de la Content API (o del CDN del cliente):
 * jamás una ruta de almacenamiento, un host de base de datos ni una URL firmada.
 */
export function esUrlPublicaSegura(url: string): boolean {
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  if (u.username || u.password) return false;
  if (/\/storage\/v\d+\//i.test(u.pathname) || /supabase\./i.test(u.hostname)) return false;
  for (const k of u.searchParams.keys()) if (/^(token|signature|sig|x-amz-.*|x-goog-.*)$/i.test(k)) return false;
  return true;
}

/** Fotos tal como las publica la Content API, descartando las que no cumplen el contrato público. */
export function fotosPublicas(fotos: Photo[]): Photo[] {
  return fotos.filter(f => esUrlPublicaSegura(f.url));
}

const ABIERTA = new Set<Departure['availability']>(['a_confirmar', 'disponible_informado']);

/** Salida a la que todavía se puede consultar: no pasada, no cerrada/agotada y dentro de su fecha límite. */
export function salidaConsultable(d: Departure, hoy: string): boolean {
  return ABIERTA.has(d.availability) && d.startDate >= hoy && (!d.inquiryDeadline || d.inquiryDeadline >= hoy);
}

export const tarifaVigente = (r: Rate, hoy: string) => r.validFrom <= hoy && hoy <= r.validUntil && r.price.amount > 0;

export type UnidadTarifa = Rate['unit'];
const ORDEN_UNIDADES: UnidadTarifa[] = ['persona_base_doble', 'persona_base_triple', 'persona_single', 'habitacion', 'grupo'];
export const ETIQUETA_UNIDAD: Record<UnidadTarifa, string> = {
  persona_base_doble: 'por persona en base doble',
  persona_base_triple: 'por persona en base triple',
  persona_single: 'por persona en base single',
  menor: 'por menor',
  grupo: 'por grupo',
  habitacion: 'por habitación',
};

export type PrecioDesde = Money & { unit: UnidadTarifa };

/**
 * Precio «desde»: solo tarifas vigentes (importe > 0) de salidas consultables, en una única moneda
 * (la preferida si tiene tarifas; si no, la que más tarifas tiene) y en la unidad más representativa
 * (base doble primero). Nunca mezcla monedas ni unidades. `null` ⇒ la web muestra «Consultar».
 */
export function precioDesde(p: Pick<TravelPackage, 'departures'>, hoy: string, monedaPreferida?: string): PrecioDesde | null {
  const tarifas = p.departures.filter(d => salidaConsultable(d, hoy)).flatMap(d => d.rates).filter(r => tarifaVigente(r, hoy) && ORDEN_UNIDADES.includes(r.unit));
  if (!tarifas.length) return null;
  const cuenta = new Map<string, number>();
  for (const r of tarifas) cuenta.set(r.price.currency, (cuenta.get(r.price.currency) ?? 0) + 1);
  const moneda = monedaPreferida && cuenta.has(monedaPreferida)
    ? monedaPreferida
    : [...cuenta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  const enMoneda = tarifas.filter(r => r.price.currency === moneda);
  const unit = ORDEN_UNIDADES.find(u => enMoneda.some(r => r.unit === u))!;
  const amount = Math.min(...enMoneda.filter(r => r.unit === unit).map(r => r.price.amount));
  return { currency: moneda, amount, unit };
}
