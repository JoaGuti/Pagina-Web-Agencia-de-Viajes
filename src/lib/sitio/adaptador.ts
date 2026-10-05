import {
  KuroContractError, finDelDia, fotosPublicas, hoyEnZona, precioDesde, salidaConsultable, esUrlPublicaSegura,
  type Site, type TravelOffer, type TravelPackage,
} from '@/lib/kuro';
import { slugificar } from '@/lib/formato';
import type { Agencia, Hotel, OfertaVista, SalidaVista, Sitio, Viaje } from './modelo';

/** Presentación de la Content API de viajes en los modelos de esta web. Sin red: solo transformación. */

const vacio = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export function aSitio(site: Site, ahora = new Date()): Sitio {
  if (site.vertical !== 'viajes') throw new KuroContractError('El sitio configurado no es del rubro viajes.');
  const web = site.web;
  const c = site.contact;
  const legal = web?.legal;
  const agencia: Agencia = {
    nombre: site.name,
    razonSocial: vacio(legal?.businessName),
    cuit: vacio(legal?.taxId),
    habilitacionEtiqueta: vacio(legal?.licenseLabel),
    habilitacion: vacio(legal?.license),
    direccion: vacio(c.address),
    email: vacio(c.email),
    telefono: vacio(c.phone),
    whatsapp: vacio(c.whatsapp)?.replace(/\D/g, '') || null,
  };
  const hoy = hoyEnZona(site.timezone, ahora);
  const an = web?.announcement;
  const logo = web?.logo && esUrlPublicaSegura(web.logo) ? web.logo : null;
  return {
    clave: site.siteKey,
    agencia,
    logo,
    moneda: site.currency,
    locale: site.locale,
    zonaHoraria: site.timezone,
    hoy,
    // Un anuncio con fecha límite vencida no se muestra.
    anuncio: an && an.text.trim() && (!an.until || an.until >= hoy) ? { texto: an.text.trim(), enlace: vacio(an.link) } : null,
    seo: { titulo: vacio(web?.seo.title), descripcion: vacio(web?.seo.description) },
    faqs: (web?.faqs ?? []).filter(f => f.question.trim() && f.answer.trim()).map(f => ({ pregunta: f.question, respuesta: f.answer })),
    notasLegales: vacio(legal?.notes),
    mensajeWhatsapp: vacio(web?.whatsappMessage),
  };
}

// ---- Región: Kuro todavía no guarda región; la web agrupa para filtrar y la deduce del destino (solo presentación). ----
const ARGENTINA = /bariloche|iguaz|salta|jujuy|mendoza|calafate|ushuaia|madryn|merlo|c[óo]rdoba|carlos paz|mar del plata|tucum[áa]n|neuqu[ée]n|san mart[íi]n de los andes|cafayate|purmamarca|esteros del iber[áa]/i;
const BRASIL = /r[íi]o de janeiro|florian[óo]polis|b[úu]zios|salvador|bah[íi]a|macei[óo]|natal|recife|noronha|porto seguro|morro de s[ãa]o paulo|cambori[úu]|brasil/i;
const CARIBE = /punta cana|canc[úu]n|tulum|riviera maya|aruba|cura[çc]ao|jamaica|varadero|la habana|cuba|san andr[ée]s|bahamas|playa del carmen|caribe/i;
const EUROPA = /madrid|barcelona|par[íi]s|roma|italia|londres|lisboa|europa|grecia|praga|amsterdam/i;
const ASIA = /maldivas|bali|tailandia|phuket|jap[óo]n|tokio|dub[áa]i|india|vietnam|asia/i;
const OCEANIA = /bora bora|tahit[íi]|polinesia|fiyi|nueva zelanda|australia/i;

export function regionDe(destinos: string[], modalidad: TravelPackage['modality']) {
  const t = destinos.join(' ');
  if (modalidad === 'crucero') return 'cruceros';
  if (ARGENTINA.test(t)) return 'argentina';
  if (BRASIL.test(t)) return 'brasil';
  if (CARIBE.test(t)) return 'caribe';
  if (EUROPA.test(t)) return 'europa';
  if (ASIA.test(t)) return 'asia';
  if (OCEANIA.test(t)) return 'oceania';
  return 'sudamerica';
}

export const MODALIDAD: Record<TravelPackage['modality'], string> = { aereo: 'Aéreo', bus: 'Bus', crucero: 'Crucero', terrestre: 'Terrestre', a_medida: 'A medida' };

/** Segmento de URL propio: slug bonito + publicId. El publicId es lo que identifica; el slug solo decora. */
export const segmentoDe = (p: Pick<TravelPackage, 'publicId' | 'slug' | 'title'>) => `${slugificar(p.slug || p.title) || 'paquete'}-${p.publicId}`;

export function aViaje(p: TravelPackage, sitio: Pick<Sitio, 'hoy' | 'moneda'>): Viaje {
  const hoy = sitio.hoy;
  const salidas: SalidaVista[] = p.departures
    .filter(d => d.endDate >= hoy)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map(d => ({
      id: d.publicId ?? null,
      inicio: d.startDate,
      fin: d.endDate,
      limiteConsulta: d.inquiryDeadline ?? null,
      disponibilidad: d.availability,
      consultable: salidaConsultable(d, hoy),
      tarifas: d.rates.map(r => ({ etiqueta: r.label, unidad: r.unit, precio: r.price, desde: r.validFrom, hasta: r.validUntil, impuestosIncluidos: r.taxesIncluded, notaImpuestos: vacio(r.taxesNote) })),
    }));
  const hoteles: Hotel[] = (p.trip?.hotels ?? []).map(h => ({ nombre: h.name, ciudad: vacio(h.city), estrellas: h.stars && h.stars > 0 ? h.stars : null, noches: h.nights, regimen: vacio(h.board) }));
  const regimenes = [...new Set(hoteles.map(h => h.regimen).filter((r): r is string => !!r))];
  const c = p.content;
  const destinos = p.destinations.filter(Boolean);
  return {
    id: p.publicId,
    segmento: segmentoDe(p),
    nombre: p.title,
    destino: destinos[0] || p.title,
    destinos,
    resumen: p.summary ?? '',
    descripcion: p.description ?? '',
    region: regionDe(destinos, p.modality),
    modalidad: MODALIDAD[p.modality],
    origen: vacio(p.origin),
    noches: p.durationNights,
    dias: p.durationDays,
    fotos: fotosPublicas(p.photos),
    itinerario: p.itinerary.map(d => ({ titulo: d.title, descripcion: d.description })),
    salidas,
    incluye: p.includes,
    noIncluye: p.excludes,
    condiciones: vacio(p.conditions),
    etiqueta: vacio(p.label),
    destacado: p.featured,
    publicado: new Date(p.publishedAt),
    precioDesde: precioDesde(p, hoy, sitio.moneda),
    hoteles,
    regimen: regimenes.length ? regimenes.join(' / ') : null,
    opcionales: p.trip?.optionals.map(o => ({ nombre: o.name, precio: o.price })) ?? [],
    deposito: p.trip?.depositPercent ?? null,
    cuotas: p.trip?.installments && p.trip.installments > 0 ? p.trip.installments : null,
    pago: vacio(p.trip?.paymentInfo),
    requisitos: vacio(p.trip?.requirements),
    puntoEncuentro: vacio(p.trip?.meetingPoint),
    grupo: vacio(p.trip?.groupSize),
    consejos: vacio(p.trip?.tips),
    contenido: c
      ? {
          subtitulo: vacio(c.subtitle),
          destacados: c.highlights,
          fichas: c.specs.map(s => ({ titulo: s.title, filas: s.rows.map(f => ({ etiqueta: f.label, valor: f.value })) })),
          faqs: c.faqs.map(f => ({ pregunta: f.question, respuesta: f.answer })),
          insignias: c.badges,
          video: c.videoUrl,
          recorrido: c.tourUrl,
          documentos: c.documents.map(d => ({ etiqueta: d.label, url: d.url })),
          ctaTexto: vacio(c.cta.label),
          ctaWhatsapp: vacio(c.cta.whatsappMessage),
          seo: { titulo: vacio(c.seo.title), descripcion: vacio(c.seo.description) },
        }
      : null,
  };
}

const TIPO_OFERTA: Record<string, string> = { paquete: 'Paquete', aereo: 'Aéreo', hotel: 'Hotel', crucero: 'Crucero', escapada: 'Escapada', asistencia: 'Asistencia al viajero', otro: 'Oferta' };
const MAX_OFERTAS = 12;

/** Ofertas vigentes (fecha del sitio), en el orden que eligió la agencia; vinculadas a su paquete SOLO por publicId. */
export function aOfertas(ofertas: TravelOffer[], viajes: Viaje[], sitio: Pick<Sitio, 'hoy' | 'zonaHoraria'>): OfertaVista[] {
  const porId = new Map(viajes.map(v => [v.id, v]));
  return ofertas
    .filter(o => (!o.validFrom || o.validFrom <= sitio.hoy) && (!o.validUntil || o.validUntil >= sitio.hoy))
    .sort((a, b) => a.position - b.position)
    .slice(0, MAX_OFERTAS)
    .map(o => {
      const viaje = o.package ? porId.get(o.package.publicId) ?? null : null;
      const mismaMoneda = o.price && o.previousPrice && o.price.currency === o.previousPrice.currency && o.previousPrice.amount > o.price.amount;
      const foto = o.photo && esUrlPublicaSegura(o.photo) ? o.photo : viaje?.fotos[0]?.url ?? null;
      return {
        titulo: o.title,
        tipo: TIPO_OFERTA[o.kind] ?? 'Oferta',
        etiqueta: vacio(o.badge) ?? TIPO_OFERTA[o.kind] ?? 'Oferta',
        destino: vacio(o.destination),
        resumen: vacio(o.summary),
        incluye: o.includes,
        fechasViaje: vacio(o.travelDates),
        precio: o.price && o.price.amount > 0 ? o.price : null,
        precioAnterior: o.previousPrice && o.previousPrice.amount > 0 ? o.previousPrice : null,
        descuentoPct: mismaMoneda ? Math.round((1 - o.price!.amount / o.previousPrice!.amount) * 100) : null,
        nota: vacio(o.priceNote),
        foto,
        vence: o.validUntil ? finDelDia(o.validUntil, sitio.zonaHoraria) : null,
        contador: o.countdown && !!o.validUntil,
        cupos: o.seats && o.seats > 0 ? o.seats : null,
        posicion: o.position,
        viaje,
      };
    });
}

/** Ordena los paquetes: destacados primero y, dentro de cada grupo, por prioridad editorial y próxima salida. */
export function ordenarViajes(vs: Viaje[], paquetes: TravelPackage[]): Viaje[] {
  const prioridad = new Map(paquetes.map(p => [p.publicId, p.content?.priority ?? null]));
  const prox = (v: Viaje) => v.salidas.find(s => s.consultable)?.inicio ?? '9999-99-99';
  return [...vs].sort((a, b) => Number(b.destacado) - Number(a.destacado) || (prioridad.get(b.id) ?? -Infinity) - (prioridad.get(a.id) ?? -Infinity) || prox(a).localeCompare(prox(b)));
}
