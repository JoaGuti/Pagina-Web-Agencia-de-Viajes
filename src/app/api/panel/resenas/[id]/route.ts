import { eq } from 'drizzle-orm';
import { ErrorHttp, registrar } from '@/lib/auth';
import { resenas } from '@/lib/db/schema';
import { exigirUuid, leerCuerpo, ruta } from '@/lib/panel/api';
import { Resena } from '@/lib/panel/esquemas';

type P = { id: string };

export const PUT = ruta<P>('contenido', async ({ req, u, db, params }) => {
  const d = await leerCuerpo(req, Resena);
  const [r] = await db.update(resenas).set(d).where(eq(resenas.id, exigirUuid(params.id))).returning();
  if (!r) throw new ErrorHttp(404, 'Esa reseña ya no existe.');
  await registrar(db, u, `editó la reseña de ${r.autor}`);
  return { resena: r };
});

export const DELETE = ruta<P>('contenido', async ({ u, db, params }) => {
  const [r] = await db.delete(resenas).where(eq(resenas.id, exigirUuid(params.id))).returning();
  if (!r) throw new ErrorHttp(404, 'Esa reseña ya no existe.');
  await registrar(db, u, `eliminó la reseña de ${r.autor}`);
  return { ok: true };
});
