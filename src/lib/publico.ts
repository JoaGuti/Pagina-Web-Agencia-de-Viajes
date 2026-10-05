import { NextResponse, type NextRequest } from 'next/server';
import type { z } from 'zod';
import { KuroApiError, resumenParaLog } from './kuro';
import { dentroDelLimite } from './limite';
import { ipDe, origenValido } from './seguridad';
import { turnstileValido } from './turnstile';

type Ctx<T> = { datos: T; ip: string; req: NextRequest; cuerpo: Record<string, unknown> };

/**
 * Envoltorio de los formularios públicos: mismo origen, límite por conexión, campo trampa «web»,
 * Turnstile (si está configurado) y validación con zod. Los errores de Kuro se traducen sin filtrar detalles.
 */
export function formularioPublico<S extends z.ZodType>(nombre: string, esquema: S, limite: { max: number; ventana: number }, fn: (c: Ctx<z.infer<S>>) => Promise<object | Response>) {
  return async (req: NextRequest) => {
    try {
      if (!origenValido(req)) return NextResponse.json({ error: 'Pedido rechazado. Recargá la página y probá de nuevo.' }, { status: 403 });
      const largo = Number(req.headers.get('content-length') || 0);
      if (largo > 20_000) return NextResponse.json({ error: 'El mensaje es demasiado largo.' }, { status: 413 });
      const cuerpo = await req.json().catch(() => null) as Record<string, unknown> | null;
      if (!cuerpo || typeof cuerpo !== 'object') return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
      if (cuerpo.web) return NextResponse.json({ ok: true, codigo: 'AR-' + Date.now().toString(36).toUpperCase() }); // trampa para bots: no llega a Kuro
      const ip = ipDe(req);
      if (!dentroDelLimite(`${nombre}:${ip}`, limite.max, limite.ventana)) {
        return NextResponse.json({ error: 'Recibimos varios envíos desde tu conexión. Esperá unos minutos o escribinos por WhatsApp.' }, { status: 429 });
      }
      if (!(await turnstileValido(cuerpo.token, ip))) return NextResponse.json({ error: 'No pudimos verificar que no seas un robot. Probá de nuevo.' }, { status: 400 });
      const r = esquema.safeParse(cuerpo);
      if (!r.success) return NextResponse.json({ error: r.error.issues[0]?.message || 'Revisá los datos del formulario.' }, { status: 400 });
      const salida = await fn({ datos: r.data, ip, req, cuerpo });
      return salida instanceof Response ? salida : NextResponse.json(salida);
    } catch (e) {
      console.error(`[${nombre}]`, resumenParaLog(e));
      if (e instanceof KuroApiError && e.limiteDeFrecuencia) return NextResponse.json({ error: 'Recibimos varios envíos desde tu conexión. Esperá unos minutos o escribinos por WhatsApp.' }, { status: 429 });
      if (e instanceof KuroApiError && e.datosInvalidos) return NextResponse.json({ error: e.issues[0]?.message || 'Revisá los datos del formulario.' }, { status: 400 });
      return NextResponse.json({ error: 'No pudimos enviar el formulario. Probá de nuevo o escribinos por WhatsApp.' }, { status: 502 });
    }
  };
}
