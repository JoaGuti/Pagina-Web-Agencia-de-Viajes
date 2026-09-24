import { createSign } from 'node:crypto';

/**
 * Métricas de Google Analytics 4 y Search Console con una cuenta de servicio
 * (variable GOOGLE_SERVICE_ACCOUNT con el JSON de la clave, tal cual o en base64).
 * La agencia agrega el email de esa cuenta como lector en Analytics y en Search Console.
 */
type Cuenta = { client_email: string; private_key: string };

export function cuentaServicio(): Cuenta | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const txt = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const j = JSON.parse(txt);
    return j.client_email && j.private_key ? { client_email: j.client_email, private_key: String(j.private_key).replace(/\\n/g, '\n') } : null;
  } catch { return null; }
}

let token: { valor: string; vence: number } | null = null;
async function tokenAcceso(c: Cuenta) {
  if (token && token.vence > Date.now() + 60_000) return token.valor;
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const ahora = Math.floor(Date.now() / 1000);
  const cuerpo = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: c.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600 })}`;
  const firma = createSign('RSA-SHA256').update(cuerpo).sign(c.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${cuerpo}.${firma}` }),
    signal: AbortSignal.timeout(10000),
  });
  const j = await r.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!j.access_token) throw new Error(j.error_description || 'Google rechazó la cuenta de servicio.');
  token = { valor: j.access_token, vence: Date.now() + (j.expires_in || 3600) * 1000 };
  return token.valor;
}

async function pedir<T>(url: string, cuerpo: object, c: Cuenta): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${await tokenAcceso(c)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(15000) });
  const j = await r.json() as T & { error?: { message?: string; status?: string } };
  if (!r.ok) {
    const m = j.error?.message || `Error ${r.status}`;
    throw new Error(r.status === 403 ? `Sin permiso: agregá ${c.client_email} como lector en Google.` : m);
  }
  return j;
}

const dia = (offset: number) => { const d = new Date(Date.now() - offset * 864e5); return d.toISOString().slice(0, 10); };

type FilaGA = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
type RespGA = { rows?: FilaGA[] };

async function analytics(propiedad: string, dias: number, c: Cuenta) {
  const base = `https://analyticsdata.googleapis.com/v1beta/properties/${propiedad}:runReport`;
  const actual = { startDate: `${dias}daysAgo`, endDate: 'yesterday' }, previo = { startDate: `${dias * 2}daysAgo`, endDate: `${dias + 1}daysAgo` };
  const [serie, totales, paginas] = await Promise.all([
    pedir<RespGA>(base, { dateRanges: [actual], dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }], orderBys: [{ dimension: { dimensionName: 'date' } }], keepEmptyRows: true }, c),
    pedir<RespGA>(base, { dateRanges: [actual, previo], metrics: [{ name: 'activeUsers' }] }, c),
    pedir<RespGA>(base, { dateRanges: [actual], dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 6 }, c),
  ]);
  const n = (f?: FilaGA, i = 0) => Number(f?.metricValues?.[i]?.value || 0);
  const tot = totales.rows || [];
  // con dos rangos, GA agrega la dimensión dateRange: date_range_0 / date_range_1
  const usuarios = n(tot.find(f => f.dimensionValues?.[0]?.value === 'date_range_0') || tot[0]);
  const usuariosPrev = n(tot.find(f => f.dimensionValues?.[0]?.value === 'date_range_1') || tot[1]);
  return {
    conectado: true,
    serie: (serie.rows || []).map(f => { const d = f.dimensionValues?.[0]?.value || ''; return { d: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, v: n(f) }; }),
    usuarios, usuariosPrev,
    paginas: (paginas.rows || []).map(f => ({ n: f.dimensionValues?.[0]?.value || '', u: f.dimensionValues?.[1]?.value || '', v: n(f) })),
  };
}

type RespSC = { rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };

async function searchConsole(sitio: string, dias: number, c: Cuenta) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(sitio)}/searchAnalytics/query`;
  // Search Console publica los datos con 2 o 3 días de demora
  const fin = 3, rango = { startDate: dia(fin + dias - 1), endDate: dia(fin) }, rangoPrev = { startDate: dia(fin + dias * 2 - 1), endDate: dia(fin + dias) };
  const [tot, prev, serie, consultas] = await Promise.all([
    pedir<RespSC>(url, { ...rango }, c),
    pedir<RespSC>(url, { ...rangoPrev }, c),
    pedir<RespSC>(url, { ...rango, dimensions: ['date'] }, c),
    pedir<RespSC>(url, { ...rango, dimensions: ['query'], rowLimit: 8 }, c),
  ]);
  const a = tot.rows?.[0], b = prev.rows?.[0];
  return {
    conectado: true,
    clics: a?.clicks || 0, clicsPrev: b?.clicks || 0,
    impresiones: a?.impressions || 0, impresionesPrev: b?.impressions || 0,
    posicion: a?.position || 0, posicionPrev: b?.position || 0,
    serie: (serie.rows || []).map(r => ({ d: r.keys?.[0] || '', clics: r.clicks, impresiones: r.impressions, posicion: r.position })),
    consultas: (consultas.rows || []).map(r => ({ q: r.keys?.[0] || '', c: r.clicks, i: r.impressions, p: r.position })),
  };
}

const cache = new Map<string, { t: number; v: unknown }>();

export async function metricas(cfg: { propiedad: string; sitioSearchConsole: string }, dias: number) {
  const c = cuentaServicio();
  const clave = `${cfg.propiedad}|${cfg.sitioSearchConsole}|${dias}`;
  const hit = cache.get(clave);
  if (hit && hit.t > Date.now() - 15 * 6e4) return hit.v;
  const sinConectar = (motivo: string) => ({ conectado: false, motivo });
  const [ga, sc] = await Promise.all([
    !c ? sinConectar('Falta la cuenta de servicio de Google.') : !cfg.propiedad ? sinConectar('Falta el ID de propiedad de Analytics.') : analytics(cfg.propiedad, dias, c).catch(e => ({ conectado: false, motivo: String(e.message || e) })),
    !c ? sinConectar('Falta la cuenta de servicio de Google.') : !cfg.sitioSearchConsole ? sinConectar('Falta la propiedad de Search Console.') : searchConsole(cfg.sitioSearchConsole, dias, c).catch(e => ({ conectado: false, motivo: String(e.message || e) })),
  ]);
  const v = { ga, sc, dias };
  if ((ga as { conectado: boolean }).conectado || (sc as { conectado: boolean }).conectado) cache.set(clave, { t: Date.now(), v });
  return v;
}
