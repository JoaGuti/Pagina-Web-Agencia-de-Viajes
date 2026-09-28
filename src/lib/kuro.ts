import { createHash } from 'node:crypto';
import { textosDe, type MiWeb } from '@/contenido/sitio';
import type { ConfigDatos, ItinerarioDia, Oferta, Paquete, Resena } from './tipos';

/**
 * Conexión con el panel Kuro (plataforma multicliente): la agencia administra
 * esta web entera desde Kuro. Datos de la agencia, textos, reseñas, paquetes y
 * ofertas salen de lo que publica allá, y todos los formularios (consultas,
 * arrepentimiento y club de ofertas) llegan a su bandeja de Kuro. Esta web no
 * tiene base ni panel propios.
 *
 * Variables: KURO_API_URL, KURO_ANON_KEY y KURO_SITE_HOST.
 *
 * Solo se usa la clave pública "anon": la base de Kuro deja leer revisiones
 * publicadas y registrar consultas, nada más (RLS y funciones controladas).
 */
export function kuroActivo() {
  return !!(process.env.KURO_API_URL && process.env.KURO_ANON_KEY && process.env.KURO_SITE_HOST);
}

async function rpc<T>(nombre: string, args: Record<string, unknown>): Promise<T> {
  if (!kuroActivo()) throw new Error('Falta conectar la web con el panel Kuro: cargá KURO_API_URL, KURO_ANON_KEY y KURO_SITE_HOST.');
  const base = process.env.KURO_API_URL!.replace(/\/+$/, '');
  const key = process.env.KURO_ANON_KEY!;
  const res = await fetch(`${base}/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    // Claves nuevas (sb_publishable_…) van solo en «apikey»; las heredadas (JWT) también como Bearer.
    headers: { apikey: key, ...(key.startsWith('eyJ') ? { authorization: `Bearer ${key}` } : {}), 'content-type': 'application/json' },
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

// ---- Ofertas destacadas (Panel Kuro → Ofertas; resolve_site → offers) ----

type OfertaKuro = {
  id: string; title: string; kind: string; destination: string; summary: string; includes: string[]; travelDates: string;
  currency: 'ARS' | 'USD'; price: number | null; previousPrice: number | null; priceNote: string; badge: string; photo: string;
  validFrom: string; validUntil: string; countdown: boolean; seats: number | null; position: number;
  package: { id: string; code: number; title: string } | null;
};

/** Datos propios de una oferta de Kuro que la tarjeta necesita además de los de una oferta local. */
export type ExtraKuro = { enlace: boolean; cuando: string; notaPrecio: string; sinFin: boolean; tipo: string };
export type OfertaConPaquete = Oferta & { paquete: Paquete; kuro?: ExtraKuro };

const TIPO_OFERTA: Record<string, string> = { paquete: 'Paquete', aereo: 'Aéreo', hotel: 'Hotel', crucero: 'Crucero', escapada: 'Escapada', asistencia: 'Asistencia al viajero', otro: 'Oferta' };
const MAX_OFERTAS = 12;
// Las fechas de Kuro son días (AAAA-MM-DD, incluidos) en la hora de Argentina.
const inicioDia = (d: string) => new Date(`${d}T00:00:00-03:00`);
const finDia = (d: string) => new Date(`${d}T23:59:59-03:00`);

/**
 * Una oferta suelta (un aéreo, un crucero) no tiene paquete en el catálogo:
 * se arma uno con lo que trae la oferta para que la tarjeta de embarque tenga
 * destino, foto y precio. No tiene ficha propia.
 */
function paqueteDeOferta(o: OfertaKuro): Paquete {
  const fecha = new Date();
  return {
    id: `kuro-oferta-${o.id}`, slug: '', nombre: o.title, destino: o.destination || o.title, pais: '', iata: '',
    region: regionDe([o.destination], o.kind === 'crucero' ? 'crucero' : ''), tipo: TIPO_OFERTA[o.kind] || '', etiqueta: o.badge, etiquetaColor: 'rojo',
    resumen: o.summary, descripcion: o.summary, estado: 'publicado', destacado: false, orden: 0,
    moneda: o.currency, precio: Math.round(o.previousPrice ?? o.price ?? 0), precioSingle: 0, precioTriple: 0, precioMenor: 0, cuotas: 0, sena: 0,
    noches: 0, cupos: o.seats ?? 0, regimen: '', transporte: o.kind === 'crucero' ? 'Crucero' : 'Aéreo', salidaDesde: 'Córdoba', salidas: [],
    hotel: '', estrellas: 0, itinerario: [], incluye: o.includes, noIncluye: [], fotos: o.photo ? [o.photo] : [], coord: '',
    seoTitulo: '', seoDescripcion: '', creado: fecha, actualizado: fecha,
  };
}

/** Convierte una oferta de Kuro al formato de las ofertas de esta web (tarjeta de embarque con contador). */
export function aOfertaWeb(o: OfertaKuro, paquetes: Paquete[]): OfertaConPaquete {
  const delCatalogo = o.package ? paquetes.find(p => p.id === o.package!.id) : undefined;
  const paquete: Paquete = delCatalogo
    ? {
        ...delCatalogo,
        // La foto de la oferta va primero; el precio anterior de la oferta manda sobre el «desde» del paquete.
        fotos: o.photo ? [o.photo, ...delCatalogo.fotos.filter(f => f !== o.photo)] : delCatalogo.fotos,
        precio: o.previousPrice ? Math.round(o.previousPrice) : delCatalogo.precio,
        moneda: o.previousPrice || o.price ? o.currency : delCatalogo.moneda,
      }
    : paqueteDeOferta(o);
  const precioFinal = o.price ? Math.round(o.price) : 0;
  return {
    id: o.id,
    paqueteId: paquete.id,
    titulo: o.title,
    etiqueta: o.badge || TIPO_OFERTA[o.kind] || 'Oferta',
    descuento: 0,
    // Sin precio de oferta, la tarjeta muestra el del paquete (o «Consultá el precio»).
    precioFinal: precioFinal && precioFinal !== paquete.precio ? precioFinal : 0,
    desde: o.validFrom ? inicioDia(o.validFrom) : new Date(0),
    hasta: o.validUntil ? finDia(o.validUntil) : new Date('2999-12-31T00:00:00Z'),
    activa: true,
    contador: o.countdown && !!o.validUntil,
    cupos: o.seats ?? 0,
    nota: o.summary,
    creado: new Date(),
    paquete,
    kuro: { enlace: !!delCatalogo, cuando: o.travelDates, notaPrecio: o.priceNote, sinFin: !o.validUntil, tipo: TIPO_OFERTA[o.kind] || '' },
  };
}

/**
 * Ofertas vigentes de esta agencia en Kuro, en el orden que eligió. Las que
 * llevan a un paquete lo toman de los paquetes publicados (si se retiró de la
 * web, la oferta sigue sin enlace).
 */
export function ofertasDe(offers: OfertaKuro[] | null | undefined, paquetes: Paquete[], ahora = new Date()): OfertaConPaquete[] {
  return (offers ?? [])
    .map(o => aOfertaWeb(o, paquetes))
    .filter(o => o.desde <= ahora && ahora < o.hasta)
    .slice(0, MAX_OFERTAS);
}

// ---- La agencia: Organización y Mi web de Kuro (resolve_site) ----

type SitioKuro = {
  name: string;
  accent?: string | null;
  contact: { email?: string; phone?: string; whatsapp?: string; address?: string; hours?: string; instagram?: string; facebook?: string } | null;
  web: (MiWeb & {
    logo?: string;
    legal?: { businessName?: string; taxId?: string; license?: string };
    business?: {
      city?: string; province?: string; postalCode?: string; lat?: number | null; lng?: number | null; exchangeRate?: number | null; analyticsId?: string;
      rating?: { score?: number | null; count?: number | null; profile?: string };
      reviews?: { author?: string; text?: string; stars?: number; when?: string }[];
      dataFiscal?: { image?: string; link?: string };
    };
  }) | null;
  offers: OfertaKuro[] | null;
};

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Configuración de la web armada con lo que la agencia cargó en Kuro (Organización y Mi web). */
export function configDe(sitio: SitioKuro): { cfg: ConfigDatos; resenas: Resena[] } {
  const c = sitio.contact ?? {};
  const w = sitio.web ?? {};
  const b = w.business ?? {};
  const agencia: ConfigDatos['agencia'] = {
    nombre: s(sitio.name) || 'Agencia de viajes',
    razonSocial: s(w.legal?.businessName),
    direccion: s(c.address),
    ciudad: s(b.city),
    provincia: s(b.province),
    cp: s(b.postalCode),
    telefono: s(c.phone),
    whatsapp: s(c.whatsapp),
    email: s(c.email),
    horario: s(c.hours),
    legajo: s(w.legal?.license),
    cuit: s(w.legal?.taxId),
    instagram: s(c.instagram),
    facebook: s(c.facebook),
    lat: n(b.lat),
    lng: n(b.lng),
  };
  const cfg: ConfigDatos = {
    agencia,
    logo: s(w.logo),
    color: /^#[0-9a-f]{6}$/i.test(s(sitio.accent)) ? s(sitio.accent).toLowerCase() : '',
    cotizacion: n(b.exchangeRate),
    google: { medicion: /^G-[A-Z0-9]{4,16}$/.test(s(b.analyticsId)) ? s(b.analyticsId) : '' },
    resenas: { puntaje: n(b.rating?.score), cantidad: n(b.rating?.count), perfil: s(b.rating?.profile) },
    dataFiscal: { imagen: s(b.dataFiscal?.image), enlace: s(b.dataFiscal?.link) },
    textos: textosDe(w, agencia),
  };
  const resenas = (b.reviews ?? [])
    .filter(r => s(r.author) && s(r.text))
    .map((r, i): Resena => ({ id: `kuro-resena-${i}`, autor: s(r.author), texto: s(r.text), estrellas: Math.max(1, Math.min(5, Math.round(n(r.stars) || 5))), cuando: s(r.when) }));
  return { cfg, resenas };
}

/** Sitio de la agencia en Kuro: configuración, reseñas y ofertas en una sola consulta. */
export async function sitioKuro() {
  const [sitio] = await rpc<SitioKuro[]>('resolve_site', { p_hostname: process.env.KURO_SITE_HOST });
  if (!sitio) throw new Error(`Kuro no tiene un sitio activo para ${process.env.KURO_SITE_HOST}.`);
  return sitio;
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

/**
 * Otros formularios de la web (arrepentimiento, club de ofertas): llegan a la
 * bandeja de Kuro como consulta, con el pedido escrito en el mensaje. La clave
 * se deriva del contenido: un reenvío no crea dos.
 */
export async function enviarAvisoKuro(d: { nombre: string; email: string; telefono?: string; mensaje: string }, urlOrigen: string) {
  const clave = 'web-' + createHash('sha256').update(JSON.stringify([d, Math.floor(Date.now() / 600_000)])).digest('hex').slice(0, 40);
  return rpc<{ ok: boolean; duplicate: boolean }>('submit_inquiry', {
    p_hostname: process.env.KURO_SITE_HOST,
    p_key: clave,
    p_input: { name: d.nombre, email: d.email, phone: d.telefono ?? '', need: 'otro', message: d.mensaje, itemId: null, sourceUrl: urlOrigen, travel: null },
  });
}

/** Respuesta de un formulario cuando Kuro rechaza los datos o hay demasiados envíos. */
export function errorDeKuro(e: unknown) {
  if (e instanceof ErrorKuro && (e.codigo === 'KU422' || e.codigo === 'KU429')) return { error: e.message, status: e.codigo === 'KU429' ? 429 : 400 };
  return null;
}
