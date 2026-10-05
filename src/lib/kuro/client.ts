import { KuroApiError, KuroConfigError, KuroContractError, KuroNetworkError } from './errors';
import {
  errorEnvelopeSchema, inquiryInputSchema, inquiryResultSchema, itemEnvelope, listEnvelope, siteSchema, travelOfferSchema, travelPackageSchema,
  type InquiryInput, type InquiryResult, type Pagination, type Site, type TravelOffer, type TravelPackage,
} from './schemas';
import type { ZodType } from 'zod';

/**
 * Cliente de la Kuro Content API v1. Solo `fetch` estándar: cada operación es un GET/POST a
 * `/api/v1/sites/{siteKey}/…`. Toda respuesta se valida contra el contrato público antes de devolverse.
 * Reutilizable tal cual por otra web: no sabe nada de diseño ni de este sitio.
 */
export type KuroClientOptions = {
  /** Origen de la Content API, sin `/api/v1`. */
  apiUrl: string;
  /** Identificador público (no secreto) del sitio. */
  siteKey: string;
  fetch?: typeof fetch;
  /** Tope por solicitud. Por defecto 8 s. */
  timeoutMs?: number;
};
export type List<T> = { data: T[]; pagination: Pagination };

const POR_PAGINA = 100;
const MAX_PAGINAS = 20; // tope duro: sin bucles infinitos ante una paginación defectuosa

export function createKuroClient(options: KuroClientOptions) {
  const siteKey = options.siteKey;
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(siteKey)) throw new KuroConfigError('KURO_SITE_KEY tiene un formato inválido.');
  let origen: URL;
  try { origen = new URL(options.apiUrl); } catch { throw new KuroConfigError('KURO_CONTENT_API_URL no es una URL válida.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origen.hostname);
  if (origen.protocol !== 'https:' && !(local && origen.protocol === 'http:')) throw new KuroConfigError('KURO_CONTENT_API_URL debe usar https.');
  const base = `${origen.origin}/api/v1/sites/${encodeURIComponent(siteKey)}`;
  const doFetch: typeof fetch = options.fetch ?? ((...a) => globalThis.fetch(...a));
  const timeoutMs = options.timeoutMs ?? 8000;

  async function pedir(path: string, query: Record<string, string | number | undefined>, init: RequestInit = {}): Promise<unknown> {
    const qs = Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
    let res: Response;
    try {
      res = await doFetch(`${base}${path}${qs ? `?${qs}` : ''}`, {
        ...init,
        cache: 'no-store', // piloto: ver publicación y retiro de inmediato
        redirect: 'error',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: 'application/json', ...init.headers },
      });
    } catch (e) {
      const nombre = e instanceof Error ? e.name : '';
      throw new KuroNetworkError(nombre === 'TimeoutError' || nombre === 'AbortError' ? 'timeout' : 'red');
    }
    let cuerpo: unknown;
    try { cuerpo = await res.json(); } catch {
      if (res.status >= 500) throw new KuroApiError(res.status, 'KU500', '');
      throw new KuroContractError(`La API respondió ${res.status} sin un JSON válido.`);
    }
    if (!res.ok) {
      const err = errorEnvelopeSchema.safeParse(cuerpo);
      if (err.success) throw new KuroApiError(res.status, err.data.error.code, err.data.error.message, err.data.error.issues);
      if (res.status >= 500) throw new KuroApiError(res.status, 'KU500', '');
      throw new KuroContractError(`La API respondió ${res.status} con un error que no cumple el contrato.`);
    }
    return cuerpo;
  }

  async function uno<T>(schema: ZodType<T>, path: string): Promise<T> {
    const r = itemEnvelope(schema).safeParse(await pedir(path, {}));
    if (!r.success) throw new KuroContractError('La respuesta no cumple el contrato v1.', r.error.issues);
    return r.data.data as T;
  }
  async function varios<T>(schema: ZodType<T>, path: string, query: { limit?: number; offset?: number } = {}): Promise<List<T>> {
    const r = listEnvelope(schema).safeParse(await pedir(path, query));
    if (!r.success) throw new KuroContractError('La respuesta no cumple el contrato v1.', r.error.issues);
    return { data: r.data.data as T[], pagination: r.data.pagination };
  }
  async function todos<T>(schema: ZodType<T>, path: string): Promise<T[]> {
    const acumulado: T[] = [];
    for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
      const { data, pagination } = await varios(schema, path, { limit: POR_PAGINA, offset: pagina * POR_PAGINA });
      acumulado.push(...data);
      if (!pagination.hasMore || data.length === 0) return acumulado;
    }
    throw new KuroContractError('La paginación del listado no termina.');
  }

  return {
    site: { get: (): Promise<Site> => uno(siteSchema, '') },
    travel: {
      packages: {
        list: (p: { limit?: number; offset?: number } = {}) => varios<TravelPackage>(travelPackageSchema, '/travel/packages', p),
        listAll: () => todos<TravelPackage>(travelPackageSchema, '/travel/packages'),
        /** Detalle por `publicId` (nunca por slug). */
        get: (publicId: string) => uno<TravelPackage>(travelPackageSchema, `/travel/packages/${encodeURIComponent(publicId)}`),
      },
      offers: {
        list: (p: { limit?: number; offset?: number } = {}) => varios<TravelOffer>(travelOfferSchema, '/travel/offers', p),
        listAll: () => todos<TravelOffer>(travelOfferSchema, '/travel/offers'),
      },
    },
    inquiries: {
      /** Envía una consulta. `Idempotency-Key` evita duplicados en reintentos. */
      async submit(input: InquiryInput, opts: { idempotencyKey?: string } = {}): Promise<InquiryResult> {
        const valida = inquiryInputSchema.safeParse(input);
        if (!valida.success) throw new KuroContractError('La consulta no es válida.', valida.error.issues);
        const clave = opts.idempotencyKey ?? `web-${globalThis.crypto.randomUUID()}`;
        const cuerpo = await pedir('/inquiries', {}, { method: 'POST', body: JSON.stringify(valida.data), headers: { 'Content-Type': 'application/json', 'Idempotency-Key': clave } });
        const r = itemEnvelope(inquiryResultSchema).safeParse(cuerpo);
        if (!r.success) throw new KuroContractError('La respuesta no cumple el contrato v1.', r.error.issues);
        return r.data.data;
      },
    },
  };
}
export type KuroClient = ReturnType<typeof createKuroClient>;
