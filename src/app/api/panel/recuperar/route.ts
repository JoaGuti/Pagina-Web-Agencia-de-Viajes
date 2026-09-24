import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { crearEnlaceClave } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { usuarios } from '@/lib/db/schema';
import { leerConfig, urlBase } from '@/lib/datos';
import { enviarEmail } from '@/lib/avisos';
import { dentroDelLimite, emailValido, ipDe, origenValido } from '@/lib/seguridad';
import { esc } from '@/lib/html';

const OK = { ok: true, mensaje: 'Si el email está registrado, te llega un enlace para crear una contraseña nueva. Revisá también el correo no deseado.' };

export async function POST(req: NextRequest) {
  try {
    if (!origenValido(req)) return NextResponse.json({ error: 'Pedido rechazado por seguridad. Recargá la página.' }, { status: 403 });
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json({ error: 'La recuperación por email no está activada. Pedile a una persona con rol Administración que te genere un enlace desde Usuarios.' }, { status: 400 });
    const b = await req.json().catch(() => ({})) as { email?: unknown };
    const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
    if (!emailValido(email)) return NextResponse.json({ error: 'Revisá el email.' }, { status: 400 });
    const db = await getDb();
    if (!(await dentroDelLimite(db, 'recuperar:' + ipDe(req), 5, 3600)) || !(await dentroDelLimite(db, 'recuperar:' + email, 3, 3600))) return NextResponse.json(OK);
    const [u] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
    if (u?.activo) {
      const enlace = await crearEnlaceClave(db, u.id, urlBase(req));
      const cfg = await leerConfig();
      await enviarEmail({ para: u.email, asunto: `Crear una contraseña nueva · Panel de ${cfg.agencia.nombre}`, html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#1c2230"><p>Hola ${esc(u.nombre.split(' ')[0])}:</p><p>Para crear una contraseña nueva del panel de ${esc(cfg.agencia.nombre)}, entrá a este enlace. Vence en 72 horas y sirve una sola vez.</p><p><a href="${esc(enlace)}" style="display:inline-block;background:#d62839;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Crear contraseña</a></p><p style="font-size:13px;color:#5b6272">Si no lo pediste, ignorá este mensaje: tu contraseña actual sigue funcionando.</p></div>` });
    }
    return NextResponse.json(OK);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Algo falló. Probá de nuevo en un momento.' }, { status: 500 });
  }
}
