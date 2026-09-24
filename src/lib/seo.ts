import { PREGUNTAS, respuesta } from '@/contenido/sitio';
import type { ConfigDatos, Paquete } from './db/schema';
import { direccionCompleta, precioConOferta, proximasSalidas } from './formato';
import type { OfertaVigente } from './datos';

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

export function agenciaSchema(cfg: ConfigDatos, base: string) {
  const a = cfg.agencia;
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta(cfg))}`;
  const horarios = horariosSchema(a.horario);
  return {
    '@type': 'TravelAgency',
    '@id': base + '/#agencia',
    name: a.nombre,
    legalName: a.razonSocial || undefined,
    url: base + '/',
    logo: cfg.logo ? (cfg.logo.startsWith('http') ? cfg.logo : base + cfg.logo) : undefined,
    image: base + '/media/hero-playa.jpg',
    telephone: a.telefono,
    email: a.email,
    priceRange: '$$',
    taxID: a.cuit || undefined,
    address: { '@type': 'PostalAddress', streetAddress: a.direccion, addressLocality: a.ciudad, addressRegion: a.provincia, postalCode: a.cp, addressCountry: 'AR' },
    geo: { '@type': 'GeoCoordinates', latitude: a.lat, longitude: a.lng },
    hasMap: mapa,
    areaServed: [a.ciudad, a.provincia, 'Argentina'],
    openingHoursSpecification: horarios.length ? horarios : undefined,
    sameAs: [a.instagram, a.facebook, cfg.resenas.perfil].filter(u => u && !/^https:\/\/www\.(instagram|facebook)\.com\/?$/.test(u)),
    aggregateRating: cfg.resenas.cantidad > 0 ? { '@type': 'AggregateRating', ratingValue: cfg.resenas.puntaje, reviewCount: cfg.resenas.cantidad, bestRating: 5 } : undefined,
    contactPoint: { '@type': 'ContactPoint', telephone: a.telefono, contactType: 'reservations', areaServed: 'AR', availableLanguage: ['es'] },
  };
}

export function sitioSchema(cfg: ConfigDatos, base: string) {
  return { '@type': 'WebSite', '@id': base + '/#sitio', url: base + '/', name: cfg.agencia.nombre, inLanguage: 'es-AR', publisher: { '@id': base + '/#agencia' } };
}

export function preguntasSchema(cfg: ConfigDatos) {
  const dir = direccionCompleta(cfg);
  return {
    '@type': 'FAQPage',
    mainEntity: PREGUNTAS.map(q => ({ '@type': 'Question', name: q.p, acceptedAnswer: { '@type': 'Answer', text: respuesta(q, dir, cfg.agencia.horario) } })),
  };
}

const urlAbs = (u: string, base: string) => (u.startsWith('http') ? u : base + u);

export function paqueteSchema(p: Paquete, cfg: ConfigDatos, base: string, oferta?: OfertaVigente) {
  const url = `${base}/paquetes/${p.slug}`;
  const salidas = proximasSalidas(p);
  const precio = oferta ? precioConOferta(p.precio, oferta) : p.precio;
  return {
    '@type': 'TouristTrip',
    '@id': url + '#viaje',
    name: p.nombre,
    description: p.descripcion || p.resumen,
    url,
    image: p.fotos.map(f => urlAbs(f, base)),
    touristType: p.tipo || undefined,
    provider: { '@id': base + '/#agencia' },
    itinerary: p.itinerario.length ? { '@type': 'ItemList', itemListElement: p.itinerario.map((d, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: d.t, description: d.d } })) } : { '@type': 'Place', name: `${p.destino}, ${p.pais}` },
    offers: precio > 0 ? {
      '@type': 'Offer', price: precio, priceCurrency: p.moneda, url, availability: p.cupos > 0 || !p.cupos ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      validThrough: oferta ? oferta.hasta.toISOString() : undefined,
      availabilityStarts: salidas[0] || undefined,
      seller: { '@id': base + '/#agencia' },
    } : undefined,
  };
}

export function listaPaquetesSchema(pqs: Paquete[], base: string) {
  return { '@type': 'ItemList', name: 'Paquetes de viaje', itemListElement: pqs.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}/paquetes/${p.slug}`, name: p.nombre })) };
}

export function migasSchema(items: [string, string][], base: string) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: base + u })) };
}

export const grafo = (...nodos: object[]) => ({ '@context': 'https://schema.org', '@graph': nodos });

/** Coordenadas legibles: -31.4241 → 31°25′S */
export function coordenadas(lat: number, lng: number) {
  const f = (v: number, pos: string, neg: string) => { const a = Math.abs(v), g = Math.floor(a), m = Math.round((a - g) * 60); return `${g}°${String(m).padStart(2, '0')}′${v < 0 ? neg : pos}`; };
  return `${f(lat, 'N', 'S')} · ${f(lng, 'E', 'O')}`;
}
