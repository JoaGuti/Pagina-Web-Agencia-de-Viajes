import { NextResponse, type NextRequest } from 'next/server';
import { crearSesion, usarEnlaceClave, usuarioPublico } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { origenValido } from '@/lib/seguridad';

/** Define la contraseña con el enlace de invitación o recuperación y deja la sesión iniciada. */
export async function POST(req: NextRequest) {
  try {
    if (!origenValido(req)) return NextResponse.json({ error: 'Pedido rechazado por seguridad. Recargá la página.' }, { status: 403 });
    const b = await req.json().catch(() => ({})) as { token?: unknown; clave?: unknown };
    const r = await usarEnlaceClave(req, String(b.token || ''), String(b.clave || '').slice(0, 200));
    if (!r.usuario) return NextResponse.json({ error: r.error }, { status: 400 });
    const res = NextResponse.json({ usuario: usuarioPublico(r.usuario) });
    await crearSesion(await getDb(), req, res, r.usuario);
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Algo falló. Probá de nuevo en un momento.' }, { status: 500 });
  }
}
