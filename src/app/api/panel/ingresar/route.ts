import { NextResponse, type NextRequest } from 'next/server';
import { crearSesion, ingresar, registrar, usuarioPublico } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { origenValido } from '@/lib/seguridad';

export async function POST(req: NextRequest) {
  try {
    if (!origenValido(req)) return NextResponse.json({ error: 'Pedido rechazado por seguridad. Recargá la página.' }, { status: 403 });
    const b = await req.json().catch(() => ({})) as { email?: unknown; clave?: unknown };
    const email = typeof b.email === 'string' ? b.email.slice(0, 200) : '', clave = typeof b.clave === 'string' ? b.clave.slice(0, 200) : '';
    if (!email || !clave) return NextResponse.json({ error: 'Completá email y contraseña.' }, { status: 400 });
    const r = await ingresar(req, email, clave);
    if (!r.usuario) return NextResponse.json({ error: r.error }, { status: 401 });
    const res = NextResponse.json({ usuario: usuarioPublico(r.usuario) });
    const db = await getDb();
    await crearSesion(db, req, res, r.usuario);
    await registrar(db, r.usuario, 'ingresó al panel');
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'No pudimos conectar con la base de datos. Probá en un momento.' }, { status: 500 });
  }
}
