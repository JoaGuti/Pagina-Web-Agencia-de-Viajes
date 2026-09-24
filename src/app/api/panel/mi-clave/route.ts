import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { ErrorHttp, registrar } from '@/lib/auth';
import { sesiones, usuarios } from '@/lib/db/schema';
import { leerCuerpo, ruta } from '@/lib/panel/api';
import { dentroDelLimite, hashear, problemaClave, sha256, verificar } from '@/lib/seguridad';

/** Cambio de la propia contraseña (pide la actual). Cierra las demás sesiones abiertas. */
export const POST = ruta(null, async ({ req, u, db }) => {
  const { actual, nueva } = await leerCuerpo(req, z.object({ actual: z.string().max(200), nueva: z.string().max(200) }));
  if (!(await dentroDelLimite(db, 'mi-clave:' + u.id, 10, 900))) throw new ErrorHttp(429, 'Demasiados intentos. Esperá 15 minutos.');
  if (!(await verificar(actual, u.hash))) throw new ErrorHttp(400, 'La contraseña actual no es correcta.');
  const problema = problemaClave(nueva);
  if (problema) throw new ErrorHttp(400, problema);
  if (actual === nueva) throw new ErrorHttp(400, 'La contraseña nueva tiene que ser distinta de la actual.');
  await db.update(usuarios).set({ hash: await hashear(nueva) }).where(eq(usuarios.id, u.id));
  const cookie = req.cookies.get('__Host-sesion')?.value || req.cookies.get('sesion')?.value || '';
  await db.delete(sesiones).where(and(eq(sesiones.usuarioId, u.id), ne(sesiones.id, sha256(cookie))));
  await registrar(db, u, 'cambió su contraseña');
  return { ok: true };
});
