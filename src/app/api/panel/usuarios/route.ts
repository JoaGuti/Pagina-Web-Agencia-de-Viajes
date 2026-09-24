import { eq } from 'drizzle-orm';
import { crearEnlaceClave, ErrorHttp, registrar, ROLES, type Rol } from '@/lib/auth';
import { usuarios } from '@/lib/db/schema';
import { leerConfig, urlBase } from '@/lib/datos';
import { enviarEmail } from '@/lib/avisos';
import { esc } from '@/lib/html';
import { leerCuerpo, ruta } from '@/lib/panel/api';
import { Invitacion } from '@/lib/panel/esquemas';

/** Invita a una persona: crea el usuario sin contraseña y devuelve (y envía) el enlace para crearla. */
export const POST = ruta('usuarios', async ({ req, u, db }) => {
  const d = await leerCuerpo(req, Invitacion);
  const [existe] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, d.email)).limit(1);
  if (existe) throw new ErrorHttp(400, 'Ya hay una persona con ese email.');
  const [nuevo] = await db.insert(usuarios).values({ nombre: d.nombre, email: d.email, rol: d.rol }).returning();
  const enlace = await crearEnlaceClave(db, nuevo.id, urlBase(req));
  const cfg = await leerConfig();
  const enviado = await enviarEmail({
    para: nuevo.email, responderA: u.email,
    asunto: `${u.nombre.split(' ')[0]} te invitó al panel de ${cfg.agencia.nombre}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#1c2230"><p>Hola ${esc(nuevo.nombre.split(' ')[0])}:</p><p>${esc(u.nombre)} te dio acceso al panel de la web de ${esc(cfg.agencia.nombre)} con el rol <b>${esc(ROLES[d.rol as Rol].nombre)}</b>.</p><p>Creá tu contraseña desde este enlace (vence en 72 horas):</p><p><a href="${esc(enlace)}" style="display:inline-block;background:#d62839;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Crear mi contraseña</a></p></div>`,
  });
  await registrar(db, u, `invitó a ${nuevo.nombre} como ${ROLES[d.rol as Rol].nombre}`);
  return { usuario: { id: nuevo.id, nombre: nuevo.nombre, email: nuevo.email, rol: nuevo.rol, activo: true, ultimoIngreso: null, pendiente: true, creado: nuevo.creado }, enlace, enviado };
});
