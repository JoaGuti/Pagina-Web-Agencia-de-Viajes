import type { Departure, Site, TravelOffer, TravelPackage } from './schemas';

/** Datos de prueba con la forma del contrato público v1 (solo para tests). */
export const API = 'https://api.kuro.example';
export const SITE_KEY = 'site_0123456789abcdef01234567';
export const FOTO = `${API}/api/v1/sites/${SITE_KEY}/media/11111111-1111-4111-8111-111111111111.webp`;

export const site = (over: Partial<Site> = {}): Site => ({
  siteKey: SITE_KEY,
  name: 'Arrecife Viajes',
  vertical: 'viajes',
  timezone: 'America/Argentina/Buenos_Aires',
  locale: 'es-AR',
  currency: 'USD',
  contact: { email: 'hola@arrecife.example', phone: '+54 3541 000000', whatsapp: '+54 9 3541 000000', address: 'José Hernández 110' },
  web: {
    logo: `${API}/api/v1/sites/${SITE_KEY}/media/22222222-2222-4222-8222-222222222222.webp`,
    announcement: { text: 'Preventa de verano', link: '/#paquetes', until: null },
    seo: { title: 'Arrecife Viajes · Córdoba', description: 'Paquetes al Caribe.' },
    faqs: [{ question: '¿Hay cuotas?', answer: 'Sí.' }],
    legal: { businessName: 'Arrecife Viajes S.R.L.', taxId: '30-00000000-0', licenseLabel: 'Legajo EVyT N°', license: '12345', notes: null },
    whatsappMessage: 'Hola Arrecife!',
  },
  ...over,
});

export const salida = (over: Partial<Departure> = {}): Departure => ({
  publicId: '9f1c6c7e-1111-4111-8111-aaaaaaaaaaaa',
  startDate: '2027-02-10',
  endDate: '2027-02-17',
  inquiryDeadline: null,
  availability: 'disponible_informado',
  rates: [{ label: 'Base doble', unit: 'persona_base_doble', price: { currency: 'USD', amount: 1890 }, validFrom: '2026-01-01', validUntil: '2027-12-31', taxesIncluded: true, taxesNote: null }],
  ...over,
});

export const paquete = (over: Partial<TravelPackage> = {}): TravelPackage => ({
  publicId: '1024',
  slug: 'punta-cana-all-inclusive',
  title: 'Punta Cana all inclusive',
  summary: 'Resort frente al mar.',
  description: 'Siete noches en Bávaro.\n\nTodo incluido.',
  destinations: ['Punta Cana'],
  origin: 'Córdoba',
  modality: 'aereo',
  durationDays: 8,
  durationNights: 7,
  photos: [{ url: FOTO, alt: 'Playa de Bávaro' }],
  itinerary: [{ day: 1, title: 'Córdoba - Punta Cana', description: 'Vuelo directo.' }],
  departures: [salida()],
  includes: ['Aéreo'],
  excludes: ['Propinas'],
  conditions: 'Sujeto a disponibilidad.',
  label: 'Más vendido',
  trip: {
    hotels: [{ name: 'Resort Bávaro', city: 'Bávaro', stars: 5, nights: 7, board: 'All inclusive' }],
    optionals: [],
    depositPercent: 20,
    installments: 12,
    paymentInfo: 'Tarjeta o transferencia',
    requirements: 'DNI vigente',
    meetingPoint: null,
    groupSize: null,
    tips: null,
  },
  featured: true,
  publishedAt: '2026-09-01T12:00:00.000Z',
  ...over,
});

export const oferta = (over: Partial<TravelOffer> = {}): TravelOffer => ({
  title: 'Riviera Maya de último minuto',
  kind: 'paquete',
  destination: 'Tulum',
  summary: 'Cupos liberados.',
  includes: [],
  travelDates: null,
  price: { currency: 'USD', amount: 1400 },
  previousPrice: { currency: 'USD', amount: 1700 },
  priceNote: null,
  badge: 'Oferta relámpago',
  photo: null,
  validFrom: '2026-09-01',
  validUntil: '2027-12-31',
  countdown: true,
  seats: 4,
  position: 1,
  package: { publicId: '1024', title: 'Punta Cana all inclusive' },
  ...over,
});

/** `fetch` falso: responde según la ruta y registra los pedidos. */
export function fetchFalso(rutas: Record<string, { status?: number; body: unknown } | (() => never)>) {
  const llamadas: { url: string; init?: RequestInit }[] = [];
  const f = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    llamadas.push({ url: u, init });
    const ruta = new URL(u).pathname;
    const clave = Object.keys(rutas).filter(k => ruta.endsWith(k)).sort((a, b) => b.length - a.length)[0];
    if (!clave) return new Response(JSON.stringify({ apiVersion: 'v1', error: { code: 'KU404', message: 'No existe.' } }), { status: 404 });
    const r = rutas[clave];
    if (typeof r === 'function') r();
    const { status = 200, body } = r as { status?: number; body: unknown };
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  }) as typeof fetch;
  return { fetch: f, llamadas };
}

export const lista = <T>(data: T[]) => ({ apiVersion: 'v1', data, pagination: { offset: 0, limit: 100, total: data.length, hasMore: false } });
export const item = <T>(data: T) => ({ apiVersion: 'v1', data });
