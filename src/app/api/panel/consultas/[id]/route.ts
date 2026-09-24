import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ErrorHttp, registrar } from '@/lib/auth';
import { consultas } from '@/lib/db/schema';
import { exigirUuid, leerCuerpo, ruta } from '@/lib/panel/api';

type P = { id: string };
async function buscar(db: Parameters<Parameters<typeof ruta>[1]>[0]['db'], id: string) {
  const [c] = await db.select().from(consultas).where(eq(consultas.id, exigirUuid(id))).limit(1);
  if (!c) throw new ErrorHttp(404, 'Esa consulta ya no existe.');
  return c;
}

export const PATCH = ruta<P>('consultas', async ({ req, u, db, params }) => {
  const antes = await buscar(db, params.id);
  const { estado } = await leerCuerpo(req, z.object({ estado: z.enum(['nueva', 'contactada', 'cerrada']) }));
  const [c] = await db.update(consultas).set({ estado }).where(eq(consultas.id, antes.id)).returning();
  if (estado !== 'nueva' && antes.estado !== estado) await registrar(db, u, `marcó como ${estado} la consulta de ${c.nombre}`);
  return { consulta: c };
});

/** Borrado definitivo (derecho de supresión de datos personales). */
export const DELETE = ruta<P>('consultas', async ({ u, db, params }) => {
  const c = await buscar(db, params.id);
  await db.delete(consultas).where(eq(consultas.id, c.id));
  await registrar(db, u, `eliminó la consulta de ${c.nombre}`);
  return { ok: true };
});
