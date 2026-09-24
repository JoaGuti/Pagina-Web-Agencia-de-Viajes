import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import type { Db } from './db';
import { limites } from './db/schema';

const scrypt = promisify(scryptCb) as (p: string, s: Buffer, k: number, o: object) => Promise<Buffer>;
const N = 32768, R = 8, P = 1, LARGO = 64;

export async function hashear(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const h = await scrypt(clave.normalize('NFKC'), sal, LARGO, { N, r: R, p: P, maxmem: 128 * N * R * 2 });
  return `scrypt$${N}$${R}$${P}$${sal.toString('base64')}$${h.toString('base64')}`;
}

export async function verificar(clave: string, guardado: string | null | undefined): Promise<boolean> {
  if (!guardado) { await hashear(clave); return false; } // mismo tiempo de respuesta aunque no exista
  const [alg, n, r, p, sal, h] = guardado.split('$');
  if (alg !== 'scrypt') return false;
  const esperado = Buffer.from(h, 'base64');
  const obtenido = await scrypt(clave.normalize('NFKC'), Buffer.from(sal, 'base64'), esperado.length, { N: +n, r: +r, p: +p, maxmem: 128 * +n * +r * 2 });
  return obtenido.length === esperado.length && timingSafeEqual(obtenido, esperado);
}

export const REGLAS_CLAVE = [
  { id: 'len', texto: '8 caracteres o más', ok: (v: string) => v.length >= 8 },
  { id: 'up', texto: 'una mayúscula', ok: (v: string) => /\p{Lu}/u.test(v) },
  { id: 'num', texto: 'un número', ok: (v: string) => /\d/.test(v) },
  { id: 'sym', texto: 'un símbolo', ok: (v: string) => /[^\p{L}\d\s]/u.test(v) },
];
export function problemaClave(v: string): string | null {
  const falta = REGLAS_CLAVE.filter(r => !r.ok(v)).map(r => r.texto);
  return falta.length ? `La contraseña necesita ${falta.join(', ')}.` : v.length > 200 ? 'La contraseña es demasiado larga.' : null;
}

export const token = () => randomBytes(32).toString('base64url');
export const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export function ipDe(req: NextRequest): string {
  const f = req.headers.get('x-forwarded-for');
  return (f ? f.split(',')[0] : req.headers.get('x-real-ip') || 'local').trim();
}

/** Rechaza pedidos que modifican datos si no vienen del mismo sitio (protección CSRF). */
export function origenValido(req: NextRequest): boolean {
  const origen = req.headers.get('origin');
  if (!origen) return req.headers.get('sec-fetch-site') === 'same-origin';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try { return new URL(origen).host === host; } catch { return false; }
}

/** Cuenta usos por clave en una ventana de tiempo. Devuelve true si todavía está dentro del límite. */
export async function dentroDelLimite(db: Db, clave: string, maximo: number, ventanaSeg: number): Promise<boolean> {
  const k = sha256(clave);
  const [fila] = await db.insert(limites).values({ clave: k, cantidad: 1 }).onConflictDoUpdate({
    target: limites.clave,
    set: {
      cantidad: sql`case when ${limites.desde} < now() - make_interval(secs => ${ventanaSeg}) then 1 else ${limites.cantidad} + 1 end`,
      desde: sql`case when ${limites.desde} < now() - make_interval(secs => ${ventanaSeg}) then now() else ${limites.desde} end`,
    },
  }).returning({ cantidad: limites.cantidad });
  return fila.cantidad <= maximo;
}

export const emailValido = (v: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(v);
