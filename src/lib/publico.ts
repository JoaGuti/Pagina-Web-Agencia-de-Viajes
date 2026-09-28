import { NextResponse, type NextRequest } from 'next/server';
import type { z } from 'zod';
import { ipDe, origenValido } from './seguridad';
import { turnstileValido } from './turnstile';

type Ctx<T> = { datos: T; ip: string; req: NextRequest };

/**
 * Envoltorio para formularios públicos: exige mismo origen, descarta bots
 * (campo trampa "web") y valida con zod y Turnstile. Los envíos van al panel
 * Kuro, que limita los repetidos (KU429).
 */
export function formularioPublico<S extends z.ZodType>(esquema: S, fn: (c: Ctx<z.infer<S>>) => Promise<object | Response>) {
  return async (req: NextRequest) => {
    try {
      if (!origenValido(req)) return NextResponse.json({ error: 'Pedido rechazado. Recargá la página y probá de nuevo.' }, { status: 403 });
      const largo = Number(req.headers.get('content-length') || 0);
      if (largo > 20_000) return NextResponse.json({ error: 'El mensaje es demasiado largo.' }, { status: 413 });
      const cuerpo = await req.json().catch(() => null) as Record<string, unknown> | null;
      if (!cuerpo || typeof cuerpo !== 'object') return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
      if (cuerpo.web) return NextResponse.json({ ok: true, codigo: 'AR-' + Date.now().toString(36).toUpperCase() }); // trampa para bots
      const ip = ipDe(req);
      if (!(await turnstileValido(cuerpo.token, ip))) return NextResponse.json({ error: 'No pudimos verificar que no seas un robot. Probá de nuevo.' }, { status: 400 });
      const r = esquema.safeParse(cuerpo);
      if (!r.success) return NextResponse.json({ error: r.error.issues[0]?.message || 'Revisá los datos del formulario.' }, { status: 400 });
      const salida = await fn({ datos: r.data, ip, req });
      return salida instanceof Response ? salida : NextResponse.json(salida);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'No pudimos enviar el formulario. Probá de nuevo o escribinos por WhatsApp.' }, { status: 500 });
    }
  };
}
