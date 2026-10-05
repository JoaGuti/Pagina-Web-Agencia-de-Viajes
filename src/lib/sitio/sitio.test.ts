import { afterEach, describe, expect, it, vi } from 'vitest';
import { API, FOTO, SITE_KEY, fetchFalso, item, lista, oferta, paquete, salida, site } from '@/lib/kuro/__fixtures__';
import { cuerpoInicio } from '@/plantillas/inicio';
import { cuerpoPaquete } from '@/plantillas/paquete';
import { aOfertas, aSitio, aViaje, ordenarViajes } from './adaptador';
import { cargarSitio, resolverViaje } from './cargar';
import type { DatosSitio } from './modelo';

const AHORA = new Date('2026-10-05T15:00:00Z');
const sitioBase = () => aSitio(site(), AHORA);
const datos = (over: Partial<DatosSitio> = {}): DatosSitio => ({ sitio: sitioBase(), viajes: [], ofertas: [], ...over });

function conKuro(rutas: Parameters<typeof fetchFalso>[0]) {
  const ff = fetchFalso(rutas);
  vi.stubEnv('KURO_CONTENT_API_URL', API);
  vi.stubEnv('KURO_SITE_KEY', SITE_KEY);
  vi.stubGlobal('fetch', ff.fetch);
  return ff;
}
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('adaptador de presentación', () => {
  it('4. la oferta se vincula al paquete SOLO por publicId (no por título ni por posición)', () => {
    const s = sitioBase();
    const a = aViaje(paquete({ publicId: '1024', title: 'Punta Cana' }), s);
    const b = aViaje(paquete({ publicId: '2048', title: 'Riviera Maya' }), s);
    const [o] = aOfertas([oferta({ title: 'Riviera Maya', package: { publicId: '1024', title: 'Otro título' } })], [a, b], s);
    expect(o.viaje?.id).toBe('1024');
    const [sinPaquete] = aOfertas([oferta({ package: undefined })], [a, b], s);
    expect(sinPaquete.viaje).toBeNull();
    const [retirado] = aOfertas([oferta({ package: { publicId: '9999', title: 'Punta Cana' } })], [a], s);
    expect(retirado.viaje).toBeNull();
  });

  it('descarta ofertas vencidas y calcula el descuento solo con la misma moneda', () => {
    const s = sitioBase();
    const r = aOfertas([oferta({ validUntil: '2026-10-04' }), oferta({ title: 'Vigente' }), oferta({ title: 'Mixta', previousPrice: { currency: 'ARS', amount: 5_000_000 } })], [], s);
    expect(r.map(o => o.titulo)).toEqual(['Vigente', 'Mixta']);
    expect(r[0].descuentoPct).toBe(18);
    expect(r[1].descuentoPct).toBeNull();
  });

  it('5. la foto del paquete llega a la tarjeta con la URL de la API sin transformarla', () => {
    const s = sitioBase();
    const v = aViaje(paquete(), s);
    expect(v.fotos[0].url).toBe(FOTO);
    const html = cuerpoInicio(datos({ viajes: [v] })).valor;
    expect(html).toContain(`src="${FOTO}"`);
    expect(html).not.toMatch(/supabase|storage\/v1|\/uploads\//);
  });

  it('el slug no es identidad: el segmento de URL incluye el publicId', () => {
    const s = sitioBase();
    expect(aViaje(paquete({ publicId: '1024', slug: 'punta-cana-all-inclusive' }), s).segmento).toBe('punta-cana-all-inclusive-1024');
    expect(aViaje(paquete({ publicId: '7', slug: undefined, title: 'Bahía Ñandú' }), s).segmento).toBe('bahia-nandu-7');
  });

  it('prioriza destacados y luego la próxima salida', () => {
    const s = sitioBase();
    const ps = [paquete({ publicId: 'a', featured: false }), paquete({ publicId: 'b', featured: true }), paquete({ publicId: 'c', featured: false, departures: [salida({ startDate: '2026-11-01', endDate: '2026-11-08' })] })];
    expect(ordenarViajes(ps.map(p => aViaje(p, s)), ps).map(v => v.id)).toEqual(['b', 'c', 'a']);
  });

  it('un anuncio con fecha vencida no se muestra y un logo inseguro se descarta', () => {
    const base = site();
    const s = aSitio(site({ web: { ...base.web!, announcement: { text: 'Viejo', link: null, until: '2026-10-01' }, logo: 'https://x.supabase.co/storage/v1/object/public/a.png' } }), AHORA);
    expect(s.anuncio).toBeNull();
    expect(s.logo).toBeNull();
  });
});

describe('páginas con contenido vacío o mínimo', () => {
  it('13. contenido vacío → portada válida, sin «undefined» ni «NaN» y con estados vacíos', () => {
    const vacio = site({ contact: { email: null, phone: null, whatsapp: null, address: null }, web: { logo: null, announcement: null, seo: { title: null, description: null }, faqs: [], legal: { businessName: null, taxId: null, licenseLabel: null, license: null, notes: null }, whatsappMessage: null } });
    const html = cuerpoInicio(datos({ sitio: aSitio(vacio, AHORA) })).valor;
    expect(html).toContain('Todavía no hay paquetes publicados');
    expect(html).toContain('id="contactForm"');
    expect(html).not.toMatch(/undefined|NaN|\[object/);
    expect(html).not.toContain('id="preguntas"');
  });

  it('una ficha mínima (sin salidas, fotos ni trip) se muestra con «Precio a consultar»', () => {
    const s = sitioBase();
    const v = aViaje(paquete({ departures: [], photos: [], trip: undefined, itinerary: [], includes: [], excludes: [], conditions: null, summary: null, description: null, durationNights: null, durationDays: null }), s);
    const html = cuerpoPaquete(v, datos({ viajes: [v] })).valor;
    expect(html).toContain('Precio a consultar');
    expect(html).toContain('Por ahora no hay salidas publicadas');
    expect(html).not.toMatch(/undefined|NaN|\[object/);
  });

  it('la ficha muestra hoteles, cuotas, depósito en % y tarifas con su moneda, sin convertir el depósito a importe', () => {
    const s = sitioBase();
    const v = aViaje(paquete(), s);
    const html = cuerpoPaquete(v, datos({ viajes: [v] })).valor;
    expect(html).toContain('Resort Bávaro');
    expect(html).toContain('En 12 cuotas');
    expect(html).toContain('20% de depósito');
    expect(html).toContain('USD 1.890');
    expect(html).toContain('Impuestos incluidos');
  });
});

describe('carga desde Kuro', () => {
  const rutas = (paq = [paquete()]) => ({
    '/travel/packages/1024': { body: item(paq[0]) },
    '/travel/packages': { body: lista(paq) },
    '/travel/offers': { body: lista([oferta()]) },
    [`/api/v1/sites/${SITE_KEY}`]: { body: item(site()) },
  });

  it('carga sitio, paquetes y ofertas por Content API (solo GET a /api/v1)', async () => {
    const ff = conKuro(rutas());
    const d = await cargarSitio(AHORA);
    expect(d.viajes).toHaveLength(1);
    expect(d.ofertas[0].viaje?.id).toBe('1024');
    expect(ff.llamadas.every(l => l.url.startsWith(`${API}/api/v1/sites/${SITE_KEY}`))).toBe(true);
    expect(ff.llamadas.every(l => (l.init?.method ?? 'GET') === 'GET')).toBe(true);
  });

  it('12. un paquete retirado no tiene ficha (404), y un slug viejo redirige al publicId vigente', async () => {
    conKuro(rutas());
    const resolver = resolverViaje;
    const d = await cargarSitio(AHORA);
    expect(await resolver(d, 'punta-cana-all-inclusive-1024')).toMatchObject({ tipo: 'ok' });
    expect(await resolver(d, 'nombre-viejo-1024')).toEqual({ tipo: 'redirigir', segmento: 'punta-cana-all-inclusive-1024' });
    // No figura en el listado (retirado): 404 sin tocar el detalle.
    expect(await resolver(d, 'retirado-7777')).toEqual({ tipo: 'noEncontrado' });
    // Estaba en el listado pero el detalle ya responde KU404: también 404.
    vi.unstubAllGlobals();
    conKuro({ ...rutas(), '/travel/packages/1024': { status: 404, body: { apiVersion: 'v1', error: { code: 'KU404', message: 'No encontrado.' } } } });
    expect(await resolver(d, 'punta-cana-all-inclusive-1024')).toEqual({ tipo: 'noEncontrado' });
  });

  it('si Kuro falla, el error sube (no hay otra fuente de contenido)', async () => {
    conKuro({ [`/api/v1/sites/${SITE_KEY}`]: { status: 500, body: { apiVersion: 'v1', error: { code: 'KU500', message: 'boom' } } }, '/travel/': { body: lista([]) } });
    await expect(cargarSitio(AHORA)).rejects.toMatchObject({ tipo: 'api' });
  });
});
