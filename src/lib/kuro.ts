import { createHash } from 'node:crypto';
import { ErrorHttp } from './auth';
import type { ItinerarioDia, Paquete } from './db/schema';

/**
 * Conexión con el panel Kuro (plataforma multicliente).
 *
 * Si están KURO_API_URL, KURO_ANON_KEY y KURO_SITE_HOST, los paquetes de la
 * web salen de lo que la agencia publica en el panel Kuro, y las consultas
 * llegan a su bandeja de Kuro. Sin esas variables, la web sigue usando su
 * propia base como siempre.
 *
 * Solo se usa la clave pública "anon": la base de Kuro deja leer revisiones
 * publicadas y registrar consultas, nada más (RLS y funciones controladas).
 */
export function kuroActivo() {
  return !!(process.env.KURO_API_URL && process.env.KURO_ANON_KEY && process.env.KURO_SITE_HOST);
}

/** Con Kuro conectado, los paquetes se editan allá: el panel propio no los modifica para no confundir. */
export function exigirPaquetesLocales() {
  if (kuroActivo()) throw new ErrorHttp(409, 'Esta web está conectada al panel Kuro: los paquetes se cargan y publican desde Kuro.');
}

async function rpc<T>(nombre: string, args: Record<string, unknown>): Promise<T> {
  const base = process.env.KURO_API_URL!.replace(/\/+$/, '');
  const key = process.env.KURO_ANON_KEY!;
  const res = await fetch(`${base}/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  const cuerpo = await res.json().catch(() => null);
  if (!res.ok) throw new ErrorKuro(res.status, cuerpo?.code, cuerpo?.message || 'Error del panel Kuro', cuerpo?.details);
  return cuerpo as T;
}

export class ErrorKuro extends Error {
  constructor(public status: number, public codigo: string | undefined, mensaje: string, public detalle?: string) {
    super(mensaje);
  }
}

// ---- Forma pública de un paquete en Kuro (PublicPackage de @kuro/core) ----

type Tarifa = { id: string; label: string; unit: string; currency: 'ARS' | 'USD'; amount: number; validFrom: string; validUntil: string };
type Salida = { id: string; startDate: string; endDate: string; inquiryDeadline: string; availability: string; rates: Tarifa[] };
export type PaqueteKuro = {
  title: string; destinations: string[]; origin: string; modality: string; durationDays: number | null; durationNights: number | null;
  summary: string; description: string; itinerary: { day: number; title: string; description: string }[];
  includes: string[]; excludes: string[]; conditions: string; label: string; photos: { src: string; alt?: string }[];
  departures: Salida[]; featured: boolean; publishedAt: string;
};
type Entrada = { kind: 'package' | 'property'; id: string; code: number; revision_id: string; version: number; snapshot: PaqueteKuro; published_at: string };

const hoy = () => new Date().toISOString().slice(0, 10);
const tarifaVigente = (r: Tarifa, dia: string) => r.validFrom <= dia && dia <= r.validUntil && r.amount > 0;
const salidaAbierta = (d: Salida, dia: string) => d.startDate >= dia && d.inquiryDeadline >= dia && (d.availability === 'a_confirmar' || d.availability === 'disponible_informado');

/**
 * Precio «desde» por unidad, con las mismas reglas que @kuro/core (fromPrice):
 * solo tarifas vigentes de salidas abiertas y sin mezclar monedas. Si no hay
 * tarifa vigente, 0 (la web muestra «a consultar»).
 */
export function preciosDesde(p: Pick<PaqueteKuro, 'departures'>, dia = hoy()) {
  const tarifas = p.departures.filter(d => salidaAbierta(d, dia)).flatMap(d => d.rates.filter(r => tarifaVigente(r, dia)));
  const base = tarifas.filter(r => r.unit === 'persona_base_doble');
  const referencia = base.length ? base : tarifas.filter(r => r.unit !== 'menor');
  if (!referencia.length) return { moneda: 'USD', precio: 0, single: 0, triple: 0, menor: 0 };
  const porMoneda = new Map<string, number>();
  for (const r of referencia) porMoneda.set(r.currency, (porMoneda.get(r.currency) ?? 0) + 1);
  const moneda = [...porMoneda.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const minimo = (unidad: string) => {
    const xs = tarifas.filter(r => r.unit === unidad && r.currency === moneda).map(r => r.amount);
    return xs.length ? Math.round(Math.min(...xs)) : 0;
  };
  return {
    moneda,
    precio: Math.round(Math.min(...referencia.filter(r => r.currency === moneda).map(r => r.amount))),
    single: minimo('persona_single'),
    triple: minimo('persona_base_triple'),
    menor: minimo('menor'),
  };
}

const ARGENTINA = /bariloche|iguaz|salta|jujuy|mendoza|calafate|ushuaia|madryn|merlo|c[óo]rdoba|carlos paz|mar del plata|tucum[áa]n|neuqu[ée]n|san mart[íi]n de los andes|cafayate|purmamarca|esteros del iber[áa]/i;
const BRASIL = /r[íi]o de janeiro|florian[óo]polis|b[úu]zios|salvador|bah[íi]a|macei[óo]|natal|recife|noronha|porto seguro|morro de s[ãa]o paulo|camboriú|brasil/i;
const CARIBE = /punta cana|canc[úu]n|tulum|riviera maya|aruba|cura[çc]ao|jamaica|varadero|la habana|cuba|san andr[ée]s|bahamas|playa del carmen|caribe/i;
const EUROPA = /madrid|barcelona|par[íi]s|roma|italia|londres|lisboa|europa|grecia|praga|amsterdam/i;

/** La web agrupa por región; Kuro todavía no guarda la región, así que se deduce del destino. */
export function regionDe(destinos: string[], modalidad: string) {
  const t = destinos.join(' ');
  if (modalidad === 'crucero') return 'cruceros';
  if (ARGENTINA.test(t)) return 'argentina';
  if (BRASIL.test(t)) return 'brasil';
  if (CARIBE.test(t)) return 'caribe';
  if (EUROPA.test(t)) return 'europa';
  return 'sudamerica';
}

const TRANSPORTE: Record<string, string> = { aereo: 'Aéreo', bus: 'Bus', crucero: 'Crucero', terrestre: 'Terrestre', a_medida: 'A medida' };

export function slugKuro(titulo: string, codigo: number) {
  const base = titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
  return `${base || 'paquete'}-${codigo}`;
}

/** Convierte un paquete publicado en Kuro al formato que usan las plantillas de esta web. */
export function aPaqueteWeb(e: Pick<Entrada, 'id' | 'code' | 'snapshot' | 'published_at'>, dia = hoy()): Paquete {
  const s = e.snapshot;
  const precios = preciosDesde(s, dia);
  const fecha = new Date(e.published_at);
  return {
    id: e.id,
    slug: slugKuro(s.title, e.code),
    nombre: s.title,
    destino: s.destinations[0] || s.title,
    pais: '',
    iata: '',
    region: regionDe(s.destinations, s.modality),
    tipo: '',
    etiqueta: s.label || '',
    etiquetaColor: 'rojo',
    resumen: s.summary || '',
    descripcion: s.description || '',
    estado: 'publicado',
    destacado: !!s.featured,
    orden: 0,
    moneda: precios.moneda,
    precio: precios.precio,
    precioSingle: precios.single,
    precioTriple: precios.triple,
    precioMenor: precios.menor,
    cuotas: 0,
    sena: 0,
    noches: s.durationNights ?? Math.max(0, (s.durationDays ?? 1) - 1),
    cupos: 0,
    regimen: '',
    transporte: TRANSPORTE[s.modality] || 'Aéreo',
    salidaDesde: s.origin || 'Córdoba',
    // Solo salidas que todavía se pueden consultar.
    salidas: s.departures.filter(d => salidaAbierta(d, dia)).map(d => d.startDate).sort(),
    hotel: '',
    estrellas: 0,
    itinerario: s.itinerary.map((d): ItinerarioDia => ({ t: d.title, d: d.description })),
    incluye: s.includes,
    noIncluye: s.excludes,
    fotos: s.photos.map(f => f.src).filter(Boolean),
    coord: '',
    seoTitulo: '',
    seoDescripcion: '',
    creado: fecha,
    actualizado: fecha,
  };
}

/** Paquetes publicados de esta agencia en Kuro, listos para las plantillas. */
export async function paquetesKuro(): Promise<Paquete[]> {
  const filas = await rpc<Entrada[]>('site_catalog', { p_hostname: process.env.KURO_SITE_HOST });
  return filas
    .filter(f => f.kind === 'package')
    .map(f => aPaqueteWeb(f))
    .sort((a, b) => Number(b.destacado) - Number(a.destacado) || (a.salidas[0] ?? '9999').localeCompare(b.salidas[0] ?? '9999'));
}

type ConsultaWeb = { nombre: string; telefono: string; email: string; destino: string; fechaViaje: string; mensaje: string };

/**
 * Envía la consulta a la bandeja de Kuro. La clave idempotente se deriva del
 * contenido y de una ventana de 10 minutos: un reenvío por doble clic o por
 * reintento no crea dos consultas.
 */
export async function enviarConsultaKuro(c: ConsultaWeb, paquetes: Paquete[], urlOrigen: string) {
  const paquete = c.destino ? paquetes.find(p => p.destino === c.destino || p.nombre === c.destino) : undefined;
  const ventana = Math.floor(Date.now() / 600_000);
  const clave = 'web-' + createHash('sha256').update(JSON.stringify([c, ventana])).digest('hex').slice(0, 40);
  const mensaje = [c.mensaje, c.destino && !paquete ? `Destino de interés: ${c.destino}` : '', c.fechaViaje ? `Fecha de viaje: ${c.fechaViaje}` : ''].filter(Boolean).join('\n');
  return rpc<{ ok: boolean; duplicate: boolean }>('submit_inquiry', {
    p_hostname: process.env.KURO_SITE_HOST,
    p_key: clave,
    p_input: {
      name: c.nombre,
      email: c.email,
      phone: c.telefono,
      need: 'otro',
      message: mensaje,
      itemId: paquete?.id ?? null,
      sourceUrl: urlOrigen,
      // El formulario de esta web no pregunta pasajeros: no se inventan.
      travel: null,
    },
  });
}
