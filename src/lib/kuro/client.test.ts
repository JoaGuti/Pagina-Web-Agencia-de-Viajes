import { describe, expect, it } from 'vitest';
import { API, FOTO, SITE_KEY, fetchFalso, item, lista, oferta, paquete, salida, site } from './__fixtures__';
import { createKuroClient } from './client';
import { KuroApiError, KuroConfigError, KuroNetworkError } from './errors';

const cliente = (rutas: Parameters<typeof fetchFalso>[0], extra: { timeoutMs?: number } = {}) => {
  const ff = fetchFalso(rutas);
  return { ...ff, kuro: createKuroClient({ apiUrl: API, siteKey: SITE_KEY, fetch: ff.fetch, ...extra }) };
};

describe('cliente Kuro', () => {
  it('1. parsea el Site', async () => {
    const { kuro, llamadas } = cliente({ [`/api/v1/sites/${SITE_KEY}`]: { body: item(site()) } });
    const s = await kuro.site.get();
    expect(s.name).toBe('Arrecife Viajes');
    expect(s.web?.faqs).toHaveLength(1);
    expect(llamadas[0].url).toBe(`${API}/api/v1/sites/${SITE_KEY}`);
    expect(llamadas[0].init?.cache).toBe('no-store');
  });

  it('2. parsea los paquetes (listado y detalle por publicId)', async () => {
    const { kuro, llamadas } = cliente({ '/travel/packages/1024': { body: item(paquete()) }, '/travel/packages': { body: lista([paquete()]) } });
    expect((await kuro.travel.packages.listAll())[0].publicId).toBe('1024');
    expect((await kuro.travel.packages.get('1024')).title).toBe('Punta Cana all inclusive');
    expect(llamadas.map(l => l.url)).toContain(`${API}/api/v1/sites/${SITE_KEY}/travel/packages/1024`);
  });

  it('3. las tarifas usan price.amount / price.currency (no rate.amount)', async () => {
    const { kuro } = cliente({ '/travel/packages': { body: lista([paquete()]) } });
    const [p] = await kuro.travel.packages.listAll();
    const r = p.departures[0].rates[0];
    expect(r.price).toEqual({ currency: 'USD', amount: 1890 });
    expect('amount' in r).toBe(false);
    // Un contrato con la forma vieja (amount/currency sueltos) se rechaza.
    const viejo = paquete({ departures: [salida({ rates: [{ label: 'x', unit: 'persona_base_doble', amount: 100, currency: 'USD', validFrom: '2026-01-01', validUntil: '2027-01-01', taxesIncluded: true, taxesNote: null } as never] })] });
    const { kuro: k2 } = cliente({ '/travel/packages': { body: lista([viejo]) } });
    await expect(k2.travel.packages.listAll()).rejects.toMatchObject({ tipo: 'contrato' });
  });

  it('5. la URL de la foto se usa tal cual la entrega la API', async () => {
    const { kuro } = cliente({ '/travel/packages': { body: lista([paquete()]) } });
    expect((await kuro.travel.packages.listAll())[0].photos[0].url).toBe(FOTO);
  });

  it('7. la consulta lleva Idempotency-Key', async () => {
    const { kuro, llamadas } = cliente({ '/inquiries': { body: item({ received: true }) } });
    await kuro.inquiries.submit({ name: 'Ana', email: 'ana@example.com' }, { idempotencyKey: 'web-clave-1' });
    const h = llamadas[0].init?.headers as Record<string, string>;
    expect(llamadas[0].init?.method).toBe('POST');
    expect(h['Idempotency-Key']).toBe('web-clave-1');
    // Sin clave explícita, el cliente genera una.
    await kuro.inquiries.submit({ name: 'Ana', email: 'ana@example.com' });
    expect((llamadas[1].init?.headers as Record<string, string>)['Idempotency-Key']).toMatch(/^web-/);
  });

  it('8. la consulta referencia el paquete por publicId y no inventa contexto', async () => {
    const { kuro, llamadas } = cliente({ '/inquiries': { body: item({ received: true }) } });
    await kuro.inquiries.submit({ name: 'Ana', phone: '3541123456', item: { kind: 'package', publicId: '1024' } });
    const cuerpo = JSON.parse(String(llamadas[0].init?.body));
    expect(cuerpo.item).toEqual({ kind: 'package', publicId: '1024' });
    expect(cuerpo.context).toBeUndefined();
  });

  it('9. KU404 se transforma en un error controlado', async () => {
    const { kuro } = cliente({ '/travel/packages/999': { status: 404, body: { apiVersion: 'v1', error: { code: 'KU404', message: 'No encontrado.' } } } });
    const e = await kuro.travel.packages.get('999').catch(x => x);
    expect(e).toBeInstanceOf(KuroApiError);
    expect(e.noEncontrado).toBe(true);
    expect(e.codigo).toBe('KU404');
  });

  it('10. KU500 no filtra detalles del servidor', async () => {
    const secreto = 'password authentication failed for user content_api_service at db.internal:6543';
    const { kuro } = cliente({ [`/api/v1/sites/${SITE_KEY}`]: { status: 500, body: { apiVersion: 'v1', error: { code: 'KU500', message: secreto } } } });
    const e = await kuro.site.get().catch(x => x);
    expect(e).toBeInstanceOf(KuroApiError);
    expect(e.message).not.toContain('password');
    expect(e.message).not.toContain('db.internal');
    // Tampoco una respuesta 5xx que no es JSON.
    const { kuro: k2 } = cliente({ [`/api/v1/sites/${SITE_KEY}`]: { status: 502, body: '<html>nginx upstream 10.0.0.4</html>' } });
    const e2 = await k2.site.get().catch(x => x);
    expect(e2.message).not.toContain('10.0.0.4');
  });

  it('11. un timeout es un error de red controlado', async () => {
    const colgado = (async (_u: string, init?: RequestInit) => new Promise((_, rechazar) => init?.signal?.addEventListener('abort', () => rechazar(init.signal?.reason)))) as unknown as typeof fetch;
    const k = createKuroClient({ apiUrl: API, siteKey: SITE_KEY, fetch: colgado, timeoutMs: 20 });
    const e = await k.site.get().catch(x => x);
    expect(e).toBeInstanceOf(KuroNetworkError);
    expect(e.causa).toBe('timeout');
  });

  it('la paginación termina aunque el servidor siempre diga hasMore', async () => {
    let n = 0;
    const f = (async () => new Response(JSON.stringify({ apiVersion: 'v1', data: [oferta()], pagination: { offset: n++, limit: 100, total: 9999, hasMore: true } }))) as unknown as typeof fetch;
    const k = createKuroClient({ apiUrl: API, siteKey: SITE_KEY, fetch: f });
    await expect(k.travel.offers.listAll()).rejects.toThrow(/no termina/);
    expect(n).toBeLessThanOrEqual(20);
  });

  it('valida la configuración sin imprimir valores', () => {
    expect(() => createKuroClient({ apiUrl: 'http://api.kuro.example', siteKey: SITE_KEY })).toThrow(KuroConfigError);
    expect(() => createKuroClient({ apiUrl: API, siteKey: '../x' })).toThrow(KuroConfigError);
    expect(() => createKuroClient({ apiUrl: 'http://localhost:3000', siteKey: SITE_KEY })).not.toThrow();
  });
});
