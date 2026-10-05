import { describe, expect, it } from 'vitest';
import { FOTO, paquete, salida } from './__fixtures__';
import { esUrlPublicaSegura, finDelDia, fotosPublicas, hoyEnZona, precioDesde, salidaConsultable } from './adapters';
import type { Rate } from './schemas';

const tarifa = (over: Partial<Rate> & { currency?: string; amount?: number } = {}): Rate => ({
  label: 'Base doble', unit: 'persona_base_doble', price: { currency: over.currency ?? 'USD', amount: over.amount ?? 1000 },
  validFrom: '2026-01-01', validUntil: '2027-12-31', taxesIncluded: true, taxesNote: null, ...over,
}) as Rate;
const HOY = '2026-10-05';

describe('precio «desde»', () => {
  it('14. no mezcla monedas: usa la preferida del sitio o la más representada', () => {
    const p = paquete({ departures: [salida({ rates: [tarifa({ currency: 'ARS', amount: 900_000 }), tarifa({ currency: 'USD', amount: 1890 }), tarifa({ currency: 'USD', amount: 2100 })] })] });
    expect(precioDesde(p, HOY, 'USD')).toEqual({ currency: 'USD', amount: 1890, unit: 'persona_base_doble' });
    expect(precioDesde(p, HOY, 'ARS')).toEqual({ currency: 'ARS', amount: 900_000, unit: 'persona_base_doble' });
    // Sin preferida que aplique: gana la moneda con más tarifas, nunca el mínimo numérico entre monedas.
    expect(precioDesde(p, HOY, 'EUR')?.currency).toBe('USD');
  });

  it('15. una salida cerrada, agotada, vencida o con consulta vencida no entra en «desde»', () => {
    const barata = (over: Parameters<typeof salida>[0]) => salida({ ...over, rates: [tarifa({ amount: 100 })] });
    const p = paquete({
      departures: [
        barata({ availability: 'cerrado' }),
        barata({ availability: 'agotado' }),
        barata({ startDate: '2026-09-01', endDate: '2026-09-08' }),
        barata({ inquiryDeadline: '2026-10-01' }),
        salida({ rates: [tarifa({ amount: 1500 })] }),
      ],
    });
    expect(precioDesde(p, HOY)?.amount).toBe(1500);
    expect(salidaConsultable(salida({ availability: 'cerrado' }), HOY)).toBe(false);
    expect(salidaConsultable(salida({ inquiryDeadline: '2026-10-05' }), HOY)).toBe(true);
  });

  it('ignora tarifas fuera de vigencia, en cero y de menores; sin tarifas válidas devuelve null («Consultar»)', () => {
    const p = paquete({ departures: [salida({ rates: [tarifa({ validUntil: '2026-10-04' }), tarifa({ amount: 0 }), tarifa({ unit: 'menor', amount: 10 })] })] });
    expect(precioDesde(p, HOY)).toBeNull();
    expect(precioDesde(paquete({ departures: [] }), HOY)).toBeNull();
  });

  it('prefiere base doble y no compara unidades distintas', () => {
    const p = paquete({ departures: [salida({ rates: [tarifa({ unit: 'persona_single', amount: 800 }), tarifa({ amount: 1890 })] })] });
    expect(precioDesde(p, HOY)).toEqual({ currency: 'USD', amount: 1890, unit: 'persona_base_doble' });
  });
});

describe('fotos', () => {
  it('6. rechaza rutas de almacenamiento, hosts de base de datos y URLs firmadas', () => {
    expect(esUrlPublicaSegura(FOTO)).toBe(true);
    expect(esUrlPublicaSegura('https://xyz.supabase.co/storage/v1/object/authenticated/media-private/org/2026/a.webp')).toBe(false);
    expect(esUrlPublicaSegura('https://cdn.example.com/storage/v1/object/sign/x.webp?token=abc')).toBe(false);
    expect(esUrlPublicaSegura('https://api.kuro.example/media/a.webp?X-Amz-Signature=abc')).toBe(false);
    expect(esUrlPublicaSegura('data:image/png;base64,AAAA')).toBe(false);
    expect(esUrlPublicaSegura('/uploads/x.jpg')).toBe(false);
    expect(fotosPublicas([{ url: FOTO, alt: '' }, { url: 'https://xyz.supabase.co/storage/v1/object/public/media/a.webp', alt: '' }])).toEqual([{ url: FOTO, alt: '' }]);
  });
});

describe('fechas del sitio', () => {
  it('hoy y fin de día en la zona horaria del sitio', () => {
    // 02:30 UTC del 6 = 23:30 del 5 en Buenos Aires.
    expect(hoyEnZona('America/Argentina/Buenos_Aires', new Date('2026-10-06T02:30:00Z'))).toBe('2026-10-05');
    expect(finDelDia('2026-10-05', 'America/Argentina/Buenos_Aires').toISOString()).toBe('2026-10-06T02:59:59.000Z');
  });
});
