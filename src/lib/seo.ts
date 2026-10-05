import { REDES, UBICACION } from '@/contenido/agencia';
import { RESENAS } from '@/contenido/resenas';
import { proximasSalidas, urlViaje } from './formato';
import type { OfertaVista, Sitio, Viaje } from './sitio/modelo';

const DIAS: Record<string, string> = { lun: 'Monday', mar: 'Tuesday', mie: 'Wednesday', mié: 'Wednesday', jue: 'Thursday', vie: 'Friday', sab: 'Saturday', sáb: 'Saturday', dom: 'Sunday' };
const ORDEN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hora = (h: string) => { const [a, b = '00'] = h.split(':'); return `${a.padStart(2, '0')}:${b.padEnd(2, '0')}`; };

/** Interpreta horarios como "Lun a Vie 9 a 13 y 16 a 20 h · Sáb 9:30 a 13 h". Si no puede, devuelve []. */
export function horariosSchema(texto: string) {
  const res: object[] = [];
  for (const tramo of texto.split(/[·|;]/)) {
    const m = tramo.trim().toLowerCase().match(/^([a-záé]{3})[a-záé]*\.?(?:\s*a\s*([a-záé]{3})[a-záé]*\.?)?\s+(.*)$/);
    if (!m || !DIAS[m[1]]) return [];
    const i = ORDEN.indexOf(DIAS[m[1]]), j = m[2] ? ORDEN.indexOf(DIAS[m[2]] || '') : i;
    if (j < i) return [];
    const dias = ORDEN.slice(i, j + 1);
    const rangos = [...m[3].matchAll(/(\d{1,2}(?::\d{2})?)\s*a\s*(\d{1,2}(?::\d{2})?)/g)];
    if (!rangos.length) return [];
    for (const r of rangos) res.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: dias.length === 1 ? dias[0] : dias, opens: hora(r[1]), closes: hora(r[2]) });
  }
  return res;
}

export function agenciaSchema(sitio: Sitio, base: string) {
  const a = sitio.agencia;
  const direccionCompleta = [a.direccion, UBICACION.ciudad, UBICACION.provincia].filter(Boolean).join(', ');
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`;
  const horarios = horariosSchema(UBICACION.horario);
  return {
    '@type': 'TravelAgency',
    '@id': base + '/#agencia',
    name: a.nombre,
    legalName: a.razonSocial || undefined,
    url: base + '/',
    logo: sitio.logo || undefined,
    image: base + '/media/hero-playa.jpg',
    telephone: a.telefono || undefined,
    email: a.email || undefined,
    taxID: a.cuit || undefined,
    address: { '@type': 'PostalAddress', streetAddress: a.direccion || undefined, addressLocality: UBICACION.ciudad, addressRegion: UBICACION.provincia, postalCode: UBICACION.cp, addressCountry: UBICACION.pais },
    geo: { '@type': 'GeoCoordinates', latitude: UBICACION.lat, longitude: UBICACION.lng },
    hasMap: mapa,
    areaServed: [UBICACION.ciudad, UBICACION.provincia, 'Argentina'],
    openingHoursSpecification: horarios.length ? horarios : undefined,
    sameAs: [REDES.instagram, REDES.facebook, RESENAS.perfil].filter(u => u && !/^https:\/\/www\.(instagram|facebook)\.com\/?$/.test(u)),
    // Solo con reseñas reales: los testimonios de ejemplo nunca generan una calificación agregada.
    aggregateRating: !RESENAS.ejemplo && RESENAS.cantidad > 0 ? { '@type': 'AggregateRating', ratingValue: RESENAS.puntaje, reviewCount: RESENAS.cantidad, bestRating: 5 } : undefined,
    contactPoint: a.telefono ? { '@type': 'ContactPoint', telephone: a.telefono, contactType: 'reservations', areaServed: 'AR', availableLanguage: ['es'] } : undefined,
  };
}

export function sitioSchema(sitio: Sitio, base: string) {
  return { '@type': 'WebSite', '@id': base + '/#sitio', url: base + '/', name: sitio.agencia.nombre, inLanguage: 'es-AR', publisher: { '@id': base + '/#agencia' } };
}

/** Preguntas frecuentes que publica la agencia en Kuro; sin FAQs no hay esquema. */
export function preguntasSchema(sitio: Sitio) {
  if (!sitio.faqs.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: sitio.faqs.map(q => ({ '@type': 'Question', name: q.pregunta, acceptedAnswer: { '@type': 'Answer', text: q.respuesta } })),
  };
}

const urlAbs = (u: string, base: string) => (u.startsWith('http') ? u : base + u);

export function paqueteSchema(v: Viaje, base: string, oferta?: OfertaVista) {
  const url = base + urlViaje(v);
  const salidas = proximasSalidas(v);
  const precio = v.precioDesde;
  return {
    '@type': 'TouristTrip',
    '@id': url + '#viaje',
    name: v.nombre,
    description: v.descripcion || v.resumen || undefined,
    url,
    image: v.fotos.map(f => urlAbs(f.url, base)),
    provider: { '@id': base + '/#agencia' },
    itinerary: v.itinerario.length
      ? { '@type': 'ItemList', itemListElement: v.itinerario.map((d, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: d.titulo, description: d.descripcion } })) }
      : { '@type': 'Place', name: v.destinos.join(', ') || v.destino },
    offers: precio ? {
      '@type': 'Offer', price: precio.amount, priceCurrency: precio.currency, url, availability: 'https://schema.org/InStock',
      validThrough: oferta?.vence ? oferta.vence.toISOString() : undefined,
      availabilityStarts: salidas[0] || undefined,
      seller: { '@id': base + '/#agencia' },
    } : undefined,
  };
}

export function listaPaquetesSchema(viajes: Viaje[], base: string) {
  return { '@type': 'ItemList', name: 'Paquetes de viaje', itemListElement: viajes.map((v, i) => ({ '@type': 'ListItem', position: i + 1, url: base + urlViaje(v), name: v.nombre })) };
}

export function migasSchema(items: [string, string][], base: string) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: base + u })) };
}

export const grafo = (...nodos: (object | null)[]) => ({ '@context': 'https://schema.org', '@graph': nodos.filter(Boolean) });

/** Coordenadas legibles: -31.4241 → 31°25′S */
export function coordenadas(lat: number, lng: number) {
  const f = (v: number, pos: string, neg: string) => { const a = Math.abs(v), g = Math.floor(a), m = Math.round((a - g) * 60); return `${g}°${String(m).padStart(2, '0')}′${v < 0 ? neg : pos}`; };
  return `${f(lat, 'N', 'S')} · ${f(lng, 'E', 'O')}`;
}
