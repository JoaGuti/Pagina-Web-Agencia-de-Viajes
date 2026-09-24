import { eq } from 'drizzle-orm';
import { crearEnlaceClave, ErrorHttp, registrar } from '@/lib/auth';
import { usuarios } from '@/lib/db/schema';
import { urlBase } from '@/lib/datos';
import { exigirUuid, ruta } from '@/lib/panel/api';

/** Genera un enlace nuevo para crear o restablecer la contraseña de alguien del equipo. */
export const POST = ruta<{ id: string }>('usuarios', async ({ req, u, db, params }) => {
  const [x] = await db.select().from(usuarios).where(eq(usuarios.id, exigirUuid(params.id))).limit(1);
  if (!x) throw new ErrorHttp(404, 'Esa persona ya no existe.');
  const enlace = await crearEnlaceClave(db, x.id, urlBase(req));
  await registrar(db, u, `generó un enlace de contraseña para ${x.nombre}`);
  return { enlace };
});
