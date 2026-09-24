import { and, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { ErrorHttp, registrar, ROLES, type Rol } from '@/lib/auth';
import type { Db } from '@/lib/db';
import { sesiones, usuarios } from '@/lib/db/schema';
import { exigirUuid, leerCuerpo, ruta } from '@/lib/panel/api';

type P = { id: string };

async function otrosAdmins(db: Db, id: string) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(usuarios).where(and(eq(usuarios.rol, 'administracion'), eq(usuarios.activo, true), ne(usuarios.id, id)));
  return n;
}

export const PATCH = ruta<P>('usuarios', async ({ req, u, db, params }) => {
  const id = exigirUuid(params.id);
  if (id === u.id) throw new ErrorHttp(400, 'No podés cambiar tu propio rol. Pedíselo a otra persona con rol Administración.');
  const { rol } = await leerCuerpo(req, z.object({ rol: z.enum(['administracion', 'edicion', 'ventas']) }));
  const [antes] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (!antes) throw new ErrorHttp(404, 'Esa persona ya no existe.');
  if (antes.rol === 'administracion' && rol !== 'administracion' && (await otrosAdmins(db, id)) === 0) throw new ErrorHttp(400, 'Tiene que quedar al menos una persona con rol Administración.');
  const [x] = await db.update(usuarios).set({ rol }).where(eq(usuarios.id, id)).returning();
  await registrar(db, u, `cambió el rol de ${x.nombre} a ${ROLES[rol as Rol].nombre}`);
  return { ok: true };
});

export const DELETE = ruta<P>('usuarios', async ({ u, db, params }) => {
  const id = exigirUuid(params.id);
  if (id === u.id) throw new ErrorHttp(400, 'No podés quitarte el acceso a vos misma/o.');
  const [x] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (!x) throw new ErrorHttp(404, 'Esa persona ya no existe.');
  if (x.rol === 'administracion' && (await otrosAdmins(db, id)) === 0) throw new ErrorHttp(400, 'Tiene que quedar al menos una persona con rol Administración.');
  await db.delete(sesiones).where(eq(sesiones.usuarioId, id));
  await db.delete(usuarios).where(eq(usuarios.id, id));
  await registrar(db, u, `quitó el acceso de ${x.nombre}`);
  return { ok: true };
});
