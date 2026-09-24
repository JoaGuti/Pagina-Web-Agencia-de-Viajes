import { NextResponse, type NextRequest } from 'next/server';
import type { z } from 'zod';
import { ErrorHttp, requerir, respuestaError, type Permiso } from '../auth';
import { getDb, type Db } from '../db';
import type { Usuario } from '../db/schema';

type Ctx<P> = { req: NextRequest; u: Usuario; db: Db; params: P };

/** Envoltorio de las rutas del panel: sesión, permiso, mismo origen y errores prolijos. */
export function ruta<P = Record<string, never>>(permiso: Permiso | null, fn: (c: Ctx<P>) => Promise<unknown>) {
  return async (req: NextRequest, ctx?: { params: Promise<P> }) => {
    try {
      const u = await requerir(req, permiso ?? undefined);
      const db = await getDb();
      const params = (ctx?.params ? await ctx.params : {}) as P;
      const r = await fn({ req, u, db, params });
      if (r instanceof Response) return r;
      return NextResponse.json(r ?? { ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e) { return respuestaError(e); }
  };
}

export async function leerCuerpo<S extends z.ZodType>(req: NextRequest, esquema: S, maxBytes = 200_000): Promise<z.infer<S>> {
  if (Number(req.headers.get('content-length') || 0) > maxBytes) throw new ErrorHttp(413, 'Los datos son demasiado grandes.');
  const json = await req.json().catch(() => { throw new ErrorHttp(400, 'Datos inválidos.'); });
  const r = esquema.safeParse(json);
  if (!r.success) {
    const i = r.error.issues[0];
    throw new ErrorHttp(400, i?.message && !/^(Invalid|Expected)/.test(i.message) ? i.message : `Revisá el campo ${String(i?.path?.join('.') || '')}.`);
  }
  return r.data;
}

export const esUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function exigirUuid(v: string) { if (!esUuid(v)) throw new ErrorHttp(404, 'No existe.'); return v; }
