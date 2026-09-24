import { eq, sql } from 'drizzle-orm';
import { ErrorHttp, registrar } from '@/lib/auth';
import { paquetes } from '@/lib/db/schema';
import { exigirUuid, ruta } from '@/lib/panel/api';
import { slugLibre } from '@/lib/panel/paquetes';

export const POST = ruta<{ id: string }>('contenido', async ({ u, db, params }) => {
  const [p] = await db.select().from(paquetes).where(eq(paquetes.id, exigirUuid(params.id))).limit(1);
  if (!p) throw new ErrorHttp(404, 'Ese paquete ya no existe.');
  const { id: _id, creado: _c, actualizado: _a, ...resto } = p;
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${paquetes.orden}), 0)::int` }).from(paquetes);
  const nombre = `${p.nombre} (copia)`.slice(0, 80);
  const [c] = await db.insert(paquetes).values({ ...resto, nombre, slug: await slugLibre(db, p.slug + '-copia'), estado: 'borrador', destacado: false, orden: max + 1 }).returning();
  await registrar(db, u, `duplicó ${p.nombre}`);
  return { paquete: c };
});
