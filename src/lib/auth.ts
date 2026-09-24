import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';
import { getDb, type Db } from './db';
import { actividad, sesiones, usuarios, type Usuario } from './db/schema';
import { dentroDelLimite, hashear, ipDe, origenValido, problemaClave, sha256, token, verificar } from './seguridad';

export type Rol = 'administracion' | 'edicion' | 'ventas';
export const ROLES: Record<Rol, { nombre: string; puede: string }> = {
  administracion: { nombre: 'Administración', puede: 'Todo, incluidos usuarios y configuración' },
  edicion: { nombre: 'Edición', puede: 'Paquetes, ofertas, reseñas y consultas' },
  ventas: { nombre: 'Ventas', puede: 'Solo consultas' },
};
export type Permiso = 'contenido' | 'consultas' | 'metricas' | 'config' | 'usuarios';
const PERMISOS: Record<Rol, Permiso[]> = {
  administracion: ['contenido', 'consultas', 'metricas', 'config', 'usuarios'],
  edicion: ['contenido', 'consultas', 'metricas'],
  ventas: ['consultas'],
};
export const puede = (u: Pick<Usuario, 'rol'>, p: Permiso) => (PERMISOS[u.rol as Rol] || []).includes(p);

const DURACION_MS = 8 * 36e5;
const MAX_INTENTOS = 5, BLOQUEO_MS = 15 * 6e4;

const esHttps = (req: NextRequest) => (req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '')) === 'https';
const nombreCookie = (req: NextRequest) => (esHttps(req) ? '__Host-sesion' : 'sesion');

export async function registrar(db: Db, u: Pick<Usuario, 'id' | 'nombre'> | null, accion: string) {
  await db.insert(actividad).values({ usuarioId: u?.id ?? null, nombre: u ? u.nombre.split(' ')[0] : 'Sistema', accion });
}

export async function crearSesion(db: Db, req: NextRequest, res: NextResponse, usuario: Usuario) {
  const t = token();
  await db.insert(sesiones).values({ id: sha256(t), usuarioId: usuario.id, vence: new Date(Date.now() + DURACION_MS) });
  await db.delete(sesiones).where(lt(sesiones.vence, new Date()));
  res.cookies.set(nombreCookie(req), t, { httpOnly: true, secure: esHttps(req), sameSite: 'strict', path: '/', maxAge: DURACION_MS / 1000 });
}

export async function cerrarSesion(req: NextRequest, res: NextResponse) {
  const t = req.cookies.get(nombreCookie(req))?.value;
  if (t) { const db = await getDb(); await db.delete(sesiones).where(eq(sesiones.id, sha256(t))); }
  res.cookies.set(nombreCookie(req), '', { httpOnly: true, secure: esHttps(req), sameSite: 'strict', path: '/', maxAge: 0 });
}

export async function usuarioActual(req: NextRequest): Promise<Usuario | null> {
  const t = req.cookies.get(nombreCookie(req))?.value;
  if (!t || t.length > 100) return null;
  const db = await getDb();
  const [fila] = await db.select({ u: usuarios }).from(sesiones).innerJoin(usuarios, eq(usuarios.id, sesiones.usuarioId))
    .where(and(eq(sesiones.id, sha256(t)), gt(sesiones.vence, new Date()), eq(usuarios.activo, true))).limit(1);
  return fila?.u ?? null;
}

export class ErrorHttp extends Error { constructor(public estado: number, mensaje: string) { super(mensaje); } }

/** Exige sesión, permiso y (en escrituras) que el pedido venga del propio sitio. */
export async function requerir(req: NextRequest, permiso?: Permiso): Promise<Usuario> {
  if (req.method !== 'GET' && req.method !== 'HEAD' && !origenValido(req)) throw new ErrorHttp(403, 'Pedido rechazado por seguridad. Recargá la página.');
  const u = await usuarioActual(req);
  if (!u) throw new ErrorHttp(401, 'Tu sesión venció. Volvé a ingresar.');
  if (permiso && !puede(u, permiso)) throw new ErrorHttp(403, 'Tu usuario no tiene permiso para esto.');
  return u;
}

export function respuestaError(e: unknown) {
  if (e instanceof ErrorHttp) return NextResponse.json({ error: e.message }, { status: e.estado });
  console.error(e);
  return NextResponse.json({ error: 'Algo falló del lado del servidor. Probá de nuevo en un momento.' }, { status: 500 });
}

/** Si todavía no hay usuarios, crea la cuenta de administración con ADMIN_EMAIL y ADMIN_PASSWORD. */
async function crearPrimerAdmin(db: Db, email: string, clave: string): Promise<Usuario | null> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(usuarios);
  if (n > 0) return null;
  const adminEmail = (process.env.ADMIN_EMAIL || (process.env.VERCEL ? '' : 'admin@agencia.local')).trim().toLowerCase();
  const adminClave = process.env.ADMIN_PASSWORD || (process.env.VERCEL ? '' : 'Arrecife2026!');
  if (!adminEmail || !adminClave || email !== adminEmail || clave !== adminClave || problemaClave(clave)) return null;
  const [u] = await db.insert(usuarios).values({ nombre: process.env.ADMIN_NAME || 'Administración', email: adminEmail, hash: await hashear(clave), rol: 'administracion' }).onConflictDoNothing().returning();
  if (u) await registrar(db, u, 'creó la cuenta de administración');
  return u ?? null;
}

export async function ingresar(req: NextRequest, email: string, clave: string): Promise<{ usuario?: Usuario; error?: string }> {
  const db = await getDb();
  email = email.trim().toLowerCase();
  if (!(await dentroDelLimite(db, 'login:' + ipDe(req), 30, 900))) return { error: 'Demasiados intentos desde esta conexión. Esperá 15 minutos.' };
  let [u] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (!u) { const nuevo = await crearPrimerAdmin(db, email, clave); if (nuevo) u = nuevo; }
  if (u?.bloqueadoHasta && u.bloqueadoHasta > new Date()) return { error: 'Cuenta bloqueada por intentos fallidos. Probá de nuevo en 15 minutos.' };
  const ok = u?.activo ? await verificar(clave, u.hash) : await verificar(clave, null);
  if (!u || !ok) {
    if (u) {
      const intentos = u.intentosFallidos + 1;
      await db.update(usuarios).set({ intentosFallidos: intentos >= MAX_INTENTOS ? 0 : intentos, bloqueadoHasta: intentos >= MAX_INTENTOS ? new Date(Date.now() + BLOQUEO_MS) : null }).where(eq(usuarios.id, u.id));
      if (intentos >= MAX_INTENTOS) { await registrar(db, null, `bloqueó 15 minutos la cuenta ${u.email} por intentos fallidos`); return { error: 'Cuenta bloqueada por intentos fallidos. Probá de nuevo en 15 minutos.' }; }
    }
    return { error: 'Email o contraseña incorrectos.' };
  }
  await db.update(usuarios).set({ intentosFallidos: 0, bloqueadoHasta: null, ultimoIngreso: new Date() }).where(eq(usuarios.id, u.id));
  return { usuario: u };
}

export function usuarioPublico(u: Usuario) {
  return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, rolNombre: ROLES[u.rol as Rol]?.nombre, permisos: PERMISOS[u.rol as Rol] || [] };
}

const VENCE_ENLACE_MS = 72 * 36e5;

/** Crea un enlace de un solo uso para definir la contraseña (invitación o recuperación). */
export async function crearEnlaceClave(db: Db, usuarioId: string, base: string) {
  const t = token();
  await db.update(usuarios).set({ invitacionHash: sha256(t), invitacionVence: new Date(Date.now() + VENCE_ENLACE_MS) }).where(eq(usuarios.id, usuarioId));
  return `${base}/panel#clave=${t}`;
}

export async function usarEnlaceClave(req: NextRequest, t: string, clave: string): Promise<{ usuario?: Usuario; error?: string }> {
  const db = await getDb();
  if (!(await dentroDelLimite(db, 'enlace:' + ipDe(req), 20, 900))) return { error: 'Demasiados intentos. Esperá 15 minutos.' };
  if (!t || t.length > 100) return { error: 'El enlace no es válido.' };
  const [u] = await db.select().from(usuarios).where(and(eq(usuarios.invitacionHash, sha256(t)), gt(usuarios.invitacionVence, new Date()))).limit(1);
  if (!u || !u.activo) return { error: 'El enlace venció o ya se usó. Pedí uno nuevo a una persona con rol Administración.' };
  const problema = problemaClave(clave);
  if (problema) return { error: problema };
  const [act] = await db.update(usuarios).set({ hash: await hashear(clave), invitacionHash: null, invitacionVence: null, intentosFallidos: 0, bloqueadoHasta: null, ultimoIngreso: new Date() }).where(eq(usuarios.id, u.id)).returning();
  await db.delete(sesiones).where(eq(sesiones.usuarioId, u.id)); // cierra sesiones anteriores
  await registrar(db, act, u.hash ? 'cambió su contraseña con un enlace' : 'activó su cuenta');
  return { usuario: act };
}
